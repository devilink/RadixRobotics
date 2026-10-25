import { describe, it, expect } from "vitest";
import { createDb } from "./harness";

describe("migrations", () => {
  it("apply cleanly on a Supabase-like database and bridge legacy data", async () => {
    const db = await createDb(async (db) => {
      await db.exec(`
        insert into auth.users values ('00000000-0000-0000-0000-0000000000a1', 'owner@example.com'),
                                      ('00000000-0000-0000-0000-0000000000a2', 'radix-ab12cd@radix.school'),
                                      ('00000000-0000-0000-0000-0000000000a3', 'radix-zz99xx@radix.school'),
                                      ('00000000-0000-0000-0000-0000000000a4', 'radix-nope00@radix.school');
        insert into public.schools (custom_id, school_name) values ('RADIX-AB12CD', 'Legacy Public School'),
                                                                   ('RADIX-ZZ99XX', 'Email-Only School');
        insert into public.user_roles (id, role, school_id) values
          ('00000000-0000-0000-0000-0000000000a1', 'super_admin', null),
          ('00000000-0000-0000-0000-0000000000a2', 'school_admin', 'RADIX-AB12CD');
      `);
    });
    const inst = await db.query<{ code: string; institution_type: string }>(
      "select code, institution_type from public.institutions order by code");
    expect(inst.rows).toEqual([
      { code: "RADIX-AB12CD", institution_type: "school" },
      { code: "RADIX-HQ", institution_type: "head_office" },
      { code: "RADIX-ZZ99XX", institution_type: "school" },
    ]);
    const roles = await db.query<{ role_key: string; has_inst: boolean }>(
      "select role_key, institution_id is not null as has_inst from public.user_role_assignments order by role_key");
    expect(roles.rows).toEqual([
      { role_key: "school_admin", has_inst: true },
      { role_key: "school_admin", has_inst: true },
      { role_key: "super_admin", has_inst: false },
    ]);
    // School logins that only had an implied (email-based) role get an explicit row;
    // an @radix.school account without a matching school gets nothing.
    const legacy = await db.query<{ id: string; role: string; school_id: string }>(
      "select id, role, school_id from public.user_roles where id::text like '%a3' or id::text like '%a4'");
    expect(legacy.rows).toEqual([
      { id: "00000000-0000-0000-0000-0000000000a3", role: "school_admin", school_id: "RADIX-ZZ99XX" },
    ]);
    const rls = await db.query<{ n: number }>(
      `select count(*)::int n from pg_tables where schemaname = 'public' and not rowsecurity
         and tablename not in ('schools', 'user_roles')`);
    expect(rls.rows[0].n).toBe(0);
  });
});

describe("portal → ERP sync", () => {
  it("mirrors new schools and centers, their admins, renames and deletes", async () => {
    const db = await createDb();
    await db.exec(`
      insert into auth.users values ('00000000-0000-0000-0000-0000000000c1', 'radix-cen001@radix.school'),
                                    ('00000000-0000-0000-0000-0000000000c2', 'radix-sch001@radix.school');
      insert into public.schools (custom_id, school_name, category) values
        ('RADIX-CEN001', 'Guwahati Center', 'learning_center'),
        ('RADIX-SCH001', 'New Public School', 'school');
      insert into public.user_roles (id, role, school_id) values
        ('00000000-0000-0000-0000-0000000000c1', 'school_admin', 'RADIX-CEN001'),
        ('00000000-0000-0000-0000-0000000000c2', 'school_admin', 'RADIX-SCH001');
    `);
    const inst = await db.query<{ code: string; institution_type: string; campuses: number }>(`
      select i.code, i.institution_type, (select count(*)::int from public.campuses c where c.institution_id = i.id) campuses
      from public.institutions i where i.legacy_school_id is not null order by i.code`);
    expect(inst.rows).toEqual([
      { code: "RADIX-CEN001", institution_type: "learning_center", campuses: 1 },
      { code: "RADIX-SCH001", institution_type: "school", campuses: 1 },
    ]);
    const roles = await db.query<{ user_id: string; role_key: string }>(
      "select user_id, role_key from public.user_role_assignments order by user_id");
    expect(roles.rows).toEqual([
      { user_id: "00000000-0000-0000-0000-0000000000c1", role_key: "centre_manager" },
      { user_id: "00000000-0000-0000-0000-0000000000c2", role_key: "school_admin" },
    ]);

    await db.exec(`update public.schools set school_name = 'Guwahati Learning Center' where custom_id = 'RADIX-CEN001';
                   delete from public.schools where custom_id = 'RADIX-SCH001';`);
    const after = await db.query<{ code: string; name: string; status: string }>(
      "select code, name, status from public.institutions where code in ('RADIX-CEN001', 'RADIX-SCH001') order by code");
    expect(after.rows).toEqual([
      { code: "RADIX-CEN001", name: "Guwahati Learning Center", status: "active" },
      { code: "RADIX-SCH001", name: "New Public School", status: "archived" },
    ]);
  });
});
