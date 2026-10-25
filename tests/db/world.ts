import type { PGlite } from "@electric-sql/pglite";
import { asUser, createInstitution, createUser, grantRole } from "./harness";

/** A small fictional dataset: two schools, one learning centre, head office. No real personal data. */
export async function seedWorld(db: PGlite) {
  const u = {
    super: await createUser(db, "super@example.test"),
    adminA: await createUser(db, "admin-a@example.test"),
    adminB: await createUser(db, "admin-b@example.test"),
    teacherA: await createUser(db, "teacher-a@example.test"),
    centreMgr: await createUser(db, "centre@example.test"),
    hr: await createUser(db, "hr@example.test"),
    studentA: await createUser(db, "student-a@example.test"),
    nobody: await createUser(db, "nobody@example.test"),
  };

  const schoolA = await createInstitution(db, "SCH-A", "Alpha School", "school");
  const schoolB = await createInstitution(db, "SCH-B", "Beta School", "school");
  const centre = await createInstitution(db, "LC-1", "Downtown Robotics Centre", "learning_center");
  const hq = (await db.query<{ id: string }>("select id from public.institutions where code = 'RADIX-HQ'")).rows[0].id;

  await grantRole(db, u.super, "super_admin", null);
  await grantRole(db, u.adminA, "school_admin", schoolA);
  await grantRole(db, u.adminB, "school_admin", schoolB);
  await grantRole(db, u.teacherA, "teacher", schoolA);
  await grantRole(db, u.centreMgr, "centre_manager", centre);
  await grantRole(db, u.hr, "hr_manager", null);
  await grantRole(db, u.studentA, "student", schoolA);

  const rpc = async (user: string, fn: string, args: Record<string, unknown>) =>
    asUser(db, user, async () => {
      const keys = Object.keys(args);
      const sql = `select public.${fn}(${keys.map((k, i) => `${k} => $${i + 1}`).join(", ")}) as v`;
      const { rows } = await db.query<{ v: unknown }>(sql, keys.map((k) => args[k]));
      return rows[0].v;
    });

  const member = (user: string, inst: string, type: string, first: string, code: string, extra: Record<string, unknown> = {}) =>
    rpc(user, "erp_create_member", {
      p_institution: inst, p_member_type: type, p_first_name: first, p_last_name: "Test", p_member_code: code, ...extra,
    }) as Promise<string>;

  // School A: two classes, three students, one teacher (assigned to 6-A only).
  const s1 = await member(u.adminA, schoolA, "student", "Asha", "A-001");
  const s2 = await member(u.adminA, schoolA, "student", "Bilal", "A-002");
  const s3 = await member(u.adminA, schoolA, "student", "Chen", "A-003");
  const tA = await member(u.adminA, schoolA, "teacher", "Tara", "T-001");
  const staffA = await member(u.adminA, schoolA, "staff", "Sam", "S-001");

  const group = async (inst: string, type: string, name: string) =>
    (await db.query<{ id: string }>(
      "insert into public.learning_groups (institution_id, group_type, name) values ($1, $2, $3) returning id",
      [inst, type, name])).rows[0].id;
  const g6a = await group(schoolA, "class_section", "Grade 6 - A");
  const g7a = await group(schoolA, "class_section", "Grade 7 - A");
  const enrol = (inst: string, g: string, m: string) =>
    db.query("insert into public.enrollments (institution_id, group_id, membership_id, start_date) values ($1, $2, $3, current_date - 30)", [inst, g, m]);
  await enrol(schoolA, g6a, s1);
  await enrol(schoolA, g6a, s2);
  await enrol(schoolA, g7a, s3);
  await db.query("insert into public.group_assignments (institution_id, group_id, membership_id) values ($1, $2, $3)", [schoolA, g6a, tA]);
  // Backdate memberships so roster windows include recent dates.
  await db.query("update public.institution_memberships set start_date = current_date - 30");

  // Link logins to people.
  const personOf = async (m: string) =>
    (await db.query<{ person_id: string }>("select person_id from public.institution_memberships where id = $1", [m])).rows[0].person_id;
  await db.query("update public.profiles set person_id = $1 where id = $2", [await personOf(tA), u.teacherA]);
  await db.query("update public.profiles set person_id = $1 where id = $2", [await personOf(s1), u.studentA]);

  // School B + learning centre + head office.
  const sB = await member(u.adminB, schoolB, "student", "Dev", "B-001");
  const gB = await group(schoolB, "class_section", "Grade 6 - B");
  await enrol(schoolB, gB, sB);
  const sC = await member(u.centreMgr, centre, "student", "Esha", "C-001");
  const batch = await group(centre, "batch", "Saturday Drones");
  await enrol(centre, batch, sC);
  const emp = await member(u.hr, hq, "employee", "Farah", "E-001", { p_details: { department: "Engineering", position: "Lab Engineer" } });
  await db.query("update public.institution_memberships set start_date = current_date - 30");

  return { u, schoolA, schoolB, centre, hq, s1, s2, s3, tA, staffA, sB, sC, emp, g6a, g7a, gB, batch, rpc };
}

export type World = Awaited<ReturnType<typeof seedWorld>>;
