import { beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { asUser, createDb, sqlState } from "./harness";
import { seedWorld, type World } from "./world";

let db: PGlite;
let w: World;

const ids = async (user: string, sql: string, params: unknown[] = []) =>
  asUser(db, user, async () => (await db.query<{ id: string }>(sql, params)).rows.map((r) => r.id).sort());

beforeAll(async () => {
  db = await createDb();
  w = await seedWorld(db);
});

describe("cross-institution isolation", () => {
  it("school admins only see their own institution", async () => {
    expect(await ids(w.u.adminA, "select id from public.institutions")).toEqual([w.schoolA]);
    expect(await ids(w.u.adminB, "select id from public.institutions")).toEqual([w.schoolB]);
    expect(await ids(w.u.centreMgr, "select id from public.institutions")).toEqual([w.centre]);
  });

  it("school admins cannot read another school's people, groups or enrolments", async () => {
    const members = await ids(w.u.adminA, "select id from public.institution_memberships");
    expect(members).toContain(w.s1);
    expect(members).not.toContain(w.sB);
    expect(members).not.toContain(w.sC);
    expect(members).not.toContain(w.emp);
    expect(await ids(w.u.adminA, "select id from public.learning_groups where institution_id <> $1", [w.schoolA])).toEqual([]);
    const people = await asUser(db, w.u.adminA, async () =>
      (await db.query<{ first_name: string }>("select first_name from public.people order by 1")).rows.map((r) => r.first_name));
    expect(people).toEqual(["Asha", "Bilal", "Chen", "Sam", "Tara"]);
  });

  it("rejects writes aimed at another institution even with a valid id (IDOR)", async () => {
    expect(await sqlState(w.rpc(w.u.adminA, "erp_create_member", {
      p_institution: w.schoolB, p_member_type: "student", p_first_name: "X", p_last_name: "", p_member_code: "X-1",
    }))).toBe("42501");
    expect(await sqlState(w.rpc(w.u.adminA, "erp_open_attendance_session", {
      p_institution: w.schoolB, p_kind: "student", p_date: new Date().toISOString().slice(0, 10), p_group: w.gB,
    }))).toBe("42501");
    expect(await sqlState(w.rpc(w.u.adminA, "erp_update_member", {
      p_membership: w.sB, p_first_name: "Hacked", p_last_name: "", p_member_code: "B-001", p_status: "active",
    }))).toBe("P0002");
    // Direct table write into another school's group is blocked by RLS.
    expect(await sqlState(asUser(db, w.u.adminA, () => db.query(
      "insert into public.learning_groups (institution_id, group_type, name) values ($1, 'class_section', 'Injected')", [w.schoolB])))).toBe("42501");
  });

  it("composite keys stop cross-institution links even for privileged writers", async () => {
    // Enrol a School B student into a School A class: FK violation regardless of role.
    expect(await sqlState(db.query(
      "insert into public.enrollments (institution_id, group_id, membership_id) values ($1, $2, $3)",
      [w.schoolA, w.g6a, w.sB]))).toBe("23503");
  });

  it("learning-centre managers cannot see schools", async () => {
    expect(await ids(w.u.centreMgr, "select id from public.institution_memberships")).toEqual([w.sC]);
  });

  it("users with no role see nothing; anonymous callers cannot call ERP functions", async () => {
    expect(await ids(w.u.nobody, "select id from public.institutions")).toEqual([]);
    expect(await ids(w.u.nobody, "select id from public.institution_memberships")).toEqual([]);
    expect(await sqlState(asUser(db, null, () => db.query("select public.erp_dashboard('all')")))).toBe("42501");
    expect(await sqlState(asUser(db, null, () => db.query("select * from public.people")))).toBe("42501");
  });
});

describe("teacher scope", () => {
  it("teachers see only students in their assigned classes", async () => {
    expect(await ids(w.u.teacherA, "select id from public.institution_memberships where member_type = 'student'")).toEqual([w.s1, w.s2].sort());
  });

  it("teachers cannot see guardian contact details", async () => {
    await w.rpc(w.u.adminA, "erp_add_guardian", {
      p_student: w.s1, p_full_name: "Guardian One", p_relationship: "mother", p_phone: "+91 90000 00000",
    });
    expect(await ids(w.u.adminA, "select guardian_id as id from public.guardian_student_relationships")).toHaveLength(1);
    expect(await ids(w.u.teacherA, "select guardian_id as id from public.guardian_student_relationships")).toEqual([]);
    expect(await ids(w.u.teacherA, "select id from public.guardians")).toEqual([]);
  });

  it("teachers can open registers only for assigned classes", async () => {
    const today = new Date().toISOString().slice(0, 10);
    expect(await w.rpc(w.u.teacherA, "erp_open_attendance_session", {
      p_institution: w.schoolA, p_kind: "student", p_date: today, p_group: w.g6a,
    })).toBeTruthy();
    expect(await sqlState(w.rpc(w.u.teacherA, "erp_open_attendance_session", {
      p_institution: w.schoolA, p_kind: "student", p_date: today, p_group: w.g7a,
    }))).toBe("42501");
    expect(await sqlState(w.rpc(w.u.teacherA, "erp_open_attendance_session", {
      p_institution: w.schoolA, p_kind: "staff", p_date: today,
    }))).toBe("42501");
  });
});

describe("HR and sensitive data", () => {
  it("HQ employees and HR details are invisible to school and centre accounts", async () => {
    expect(await ids(w.u.adminA, "select membership_id as id from public.employee_profiles where institution_id = $1", [w.hq])).toEqual([]);
    expect(await ids(w.u.centreMgr, "select id from public.institution_memberships where id = $1", [w.emp])).toEqual([]);
    expect(await ids(w.u.hr, "select membership_id as id from public.employee_profiles where membership_id = $1", [w.emp])).toEqual([w.emp]);
  });

  it("HR managers cannot read student records", async () => {
    expect(await ids(w.u.hr, "select id from public.institution_memberships where member_type = 'student'")).toEqual([]);
  });

  it("clients cannot write attendance or audit tables directly", async () => {
    expect(await sqlState(asUser(db, w.u.super, () => db.query("delete from public.audit_logs")))).toBe("42501");
    expect(await sqlState(asUser(db, w.u.super, () => db.query("update public.attendance_records set status = 'present'")))).toBe("42501");
  });
});

describe("role management", () => {
  it("institution admins may grant limited roles at their own institution only", async () => {
    expect(await w.rpc(w.u.adminA, "erp_assign_role", { p_user: w.u.nobody, p_role: "teacher", p_institution: w.schoolA })).toBeTruthy();
    expect(await sqlState(w.rpc(w.u.adminA, "erp_assign_role", { p_user: w.u.nobody, p_role: "school_admin", p_institution: w.schoolA }))).toBe("42501");
    expect(await sqlState(w.rpc(w.u.adminA, "erp_assign_role", { p_user: w.u.nobody, p_role: "teacher", p_institution: w.schoolB }))).toBe("42501");
    expect(await sqlState(w.rpc(w.u.adminA, "erp_assign_role", { p_user: w.u.adminA, p_role: "super_admin", p_institution: null }))).toBe("42501");
  });

  it("enforces role scope and institution type", async () => {
    expect(await sqlState(w.rpc(w.u.super, "erp_assign_role", { p_user: w.u.nobody, p_role: "teacher", p_institution: w.centre }))).toBe("23514");
    expect(await sqlState(w.rpc(w.u.super, "erp_assign_role", { p_user: w.u.nobody, p_role: "director", p_institution: w.schoolA }))).toBe("23514");
  });

  it("institution admins cannot link their own account to someone else's person record", async () => {
    expect(await sqlState(w.rpc(w.u.adminA, "erp_link_user_person", { p_user: w.u.adminA, p_membership: w.s2 }))).toBe("42501");
  });

  it("the last super admin cannot be removed", async () => {
    const a = await ids(w.u.super, "select id from public.user_role_assignments where role_key = 'super_admin'");
    expect(await sqlState(w.rpc(w.u.super, "erp_revoke_role", { p_assignment: a[0] }))).toBe("55000");
  });

  it("role changes are audited", async () => {
    const { rows } = await db.query<{ n: number }>(
      "select count(*)::int n from public.audit_logs where entity_type = 'user_role_assignments' and action = 'insert' and actor_id = $1", [w.u.adminA]);
    expect(rows[0].n).toBe(1);
  });
});

describe("category filtering", () => {
  it("dashboard counts respect the selected category", async () => {
    const dash = async (cat: string) => asUser(db, w.u.super, async () =>
      (await db.query<{ d: { institutions: { total: number }; people: { students: number } } }>(
        "select public.erp_dashboard($1) d", [cat])).rows[0].d);
    const all = await dash("all");
    const school = await dash("school");
    const centre = await dash("learning_center");
    expect(school.institutions.total).toBe(2);
    expect(centre.institutions.total).toBe(1);
    expect(all.institutions.total).toBe(3);
    expect(school.people.students).toBe(4);
    expect(centre.people.students).toBe(1);
    expect(all.people.students).toBe(5);
    expect(await sqlState(asUser(db, w.u.super, () => db.query("select public.erp_dashboard('bogus')")))).toBe("22023");
  });

  it("member search filters by category and never leaks other tenants", async () => {
    const search = async (user: string, cat: string) => asUser(db, user, async () =>
      (await db.query<{ member_code: string }>("select member_code from public.erp_search_members(p_category => $1, p_types => '{student}')", [cat])).rows.map((r) => r.member_code));
    expect(await search(w.u.super, "learning_center")).toEqual(["C-001"]);
    expect(await search(w.u.adminA, "all")).toEqual(["A-001", "A-002", "A-003"]);
    expect(await search(w.u.adminA, "learning_center")).toEqual([]);
  });
});

describe("shared rate limit", () => {
  const hit = (user: string | null, bucket = "test-bucket") =>
    asUser(db, user, async () =>
      (await db.query<{ ok: boolean }>("select public.erp_rate_limit($1, 2, 60) as ok", [bucket])).rows[0].ok);

  it("counts per user and bucket, and blocks past the limit", async () => {
    expect([await hit(w.u.adminA), await hit(w.u.adminA), await hit(w.u.adminA)]).toEqual([true, true, false]);
    expect(await hit(w.u.adminB)).toBe(true); // another user's counter is separate
    expect(await hit(w.u.adminA, "other-bucket")).toBe(true);
  });

  it("is not callable anonymously and its table is private", async () => {
    expect(await sqlState(hit(null))).toBe("42501");
    expect(await sqlState(asUser(db, w.u.adminA, () => db.query("select * from erp_private.rate_limits")))).toBe("42501");
  });
});
