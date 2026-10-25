import { beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { asUser, createDb, sqlState } from "./harness";
import { seedWorld, type World } from "./world";

let db: PGlite;
let w: World;

const dayOffset = (n: number) => {
  const d = new Date(Date.now() + 5.5 * 3600_000); // institutions default to Asia/Kolkata
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
const today = () => dayOffset(0);

beforeAll(async () => {
  db = await createDb();
  w = await seedWorld(db);
});

const open = (user: string, group: string, date = today(), inst?: string) =>
  w.rpc(user, "erp_open_attendance_session", {
    p_institution: inst ?? w.schoolA, p_kind: "student", p_date: date, p_group: group,
  }) as Promise<string>;

const save = (user: string, session: string, entries: unknown[], submit = false) =>
  w.rpc(user, "erp_save_attendance", { p_session: session, p_entries: JSON.stringify(entries), p_submit: submit }) as Promise<{ changed: number; status: string }>;

describe("registers", () => {
  it("opening a register twice returns the same session (no duplicates)", async () => {
    const a = await open(w.u.teacherA, w.g6a);
    const b = await open(w.u.adminA, w.g6a);
    expect(a).toBe(b);
  });

  it("rejects future dates and enforces the back-date window", async () => {
    expect(await sqlState(open(w.u.teacherA, w.g6a, dayOffset(2)))).toBe("22023");
    expect(await sqlState(open(w.u.teacherA, w.g6a, dayOffset(-20)))).toBe("42501");
    // School admin has attendance.correct, so may open older registers.
    expect(await open(w.u.adminA, w.g6a, dayOffset(-20))).toBeTruthy();
  });

  it("returns the roster for the class with unmarked rows", async () => {
    const session = await open(w.u.teacherA, w.g6a);
    const rows = await asUser(db, w.u.teacherA, async () =>
      (await db.query<{ member_code: string; status: string | null }>(
        "select member_code, status from public.erp_register_roster($1)", [session])).rows);
    expect(rows).toEqual([
      { member_code: "A-001", status: null },
      { member_code: "A-002", status: null },
    ]);
  });
});

describe("bulk marking", () => {
  it("saves, updates in place and never duplicates", async () => {
    const session = await open(w.u.teacherA, w.g6a);
    const first = await save(w.u.teacherA, session, [
      { membership_id: w.s1, status: "present", check_in: "09:02" },
      { membership_id: w.s2, status: "absent" },
    ]);
    expect(first.changed).toBe(2);
    const second = await save(w.u.teacherA, session, [
      { membership_id: w.s1, status: "present", check_in: "09:02" }, // unchanged → not rewritten
      { membership_id: w.s2, status: "late", check_in: "09:40" },
    ]);
    expect(second.changed).toBe(1);
    const { rows } = await db.query<{ n: number; v: number }>(
      "select count(*)::int n, max(version)::int v from public.attendance_records where session_id = $1", [session]);
    expect(rows[0]).toEqual({ n: 2, v: 2 });
  });

  it("the database rejects a duplicate record for the same person and session", async () => {
    const session = await open(w.u.teacherA, w.g6a);
    expect(await sqlState(db.query(
      `insert into public.attendance_records (institution_id, session_id, kind, membership_id, status)
       values ($1, $2, 'student', $3, 'present')`, [w.schoolA, session, w.s1]))).toBe("23505");
  });

  it("rejects the same person twice in one save, and people not on the register", async () => {
    const session = await open(w.u.teacherA, w.g6a);
    expect(await sqlState(save(w.u.teacherA, session, [
      { membership_id: w.s1, status: "present" }, { membership_id: w.s1, status: "absent" },
    ]))).toBe("22023");
    expect(await sqlState(save(w.u.teacherA, session, [{ membership_id: w.s3, status: "present" }]))).toBe("23514");
    expect(await sqlState(save(w.u.teacherA, session, [{ membership_id: w.s1, status: "on_leave" }]))).toBe("23514");
    expect(await sqlState(save(w.u.teacherA, session, [{ membership_id: w.s1, status: "present", check_in: "9am" }]))).toBe("22023");
  });

  it("a failed save writes nothing (atomic)", async () => {
    const session = await open(w.u.adminA, w.g7a);
    expect(await sqlState(save(w.u.adminA, session, [
      { membership_id: w.s3, status: "present" },
      { membership_id: w.s3, status: "present", check_in: "25:00" },
    ]))).toBe("22023");
    const { rows } = await db.query<{ n: number }>("select count(*)::int n from public.attendance_records where session_id = $1", [session]);
    expect(rows[0].n).toBe(0);
  });

  it("submitting requires every rostered person to be marked", async () => {
    const session = await open(w.u.adminA, w.g6a, dayOffset(-1));
    await save(w.u.adminA, session, [{ membership_id: w.s1, status: "present" }]);
    expect(await sqlState(save(w.u.adminA, session, [], true))).toBe("55000");
    const res = await save(w.u.adminA, session, [{ membership_id: w.s2, status: "excused" }], true);
    expect(res.status).toBe("submitted");
  });
});

describe("finalisation and corrections", () => {
  let session: string;
  let recordS2: string;

  beforeAll(async () => {
    session = await open(w.u.teacherA, w.g6a, dayOffset(-2));
    await save(w.u.teacherA, session, [
      { membership_id: w.s1, status: "present" },
      { membership_id: w.s2, status: "absent" },
    ], true);
    recordS2 = (await db.query<{ id: string }>(
      "select id from public.attendance_records where session_id = $1 and membership_id = $2", [session, w.s2])).rows[0].id;
  });

  it("only authorised roles can finalise", async () => {
    expect(await sqlState(w.rpc(w.u.teacherA, "erp_finalize_attendance_session", { p_session: session }))).toBe("42501");
    await w.rpc(w.u.adminA, "erp_finalize_attendance_session", { p_session: session });
    expect(await sqlState(save(w.u.teacherA, session, [{ membership_id: w.s2, status: "present" }]))).toBe("55000");
  });

  it("teachers cannot correct directly but can request a correction", async () => {
    expect(await sqlState(w.rpc(w.u.teacherA, "erp_correct_attendance", {
      p_record: recordS2, p_status: "present", p_reason: "Arrived after roll call",
    }))).toBe("42501");
    expect(await sqlState(w.rpc(w.u.teacherA, "erp_request_attendance_correction", {
      p_record: recordS2, p_status: "present", p_reason: "no",
    }))).toBe("22023");
    const req = await w.rpc(w.u.teacherA, "erp_request_attendance_correction", {
      p_record: recordS2, p_status: "late", p_reason: "Arrived after roll call", p_check_in: "09:35",
    });
    expect(req).toBeTruthy();
    expect(await sqlState(w.rpc(w.u.teacherA, "erp_request_attendance_correction", {
      p_record: recordS2, p_status: "late", p_reason: "Duplicate request",
    }))).toBe("23505");
  });

  it("requesters cannot approve their own correction; approvers apply it with an audit trail", async () => {
    const reqId = (await db.query<{ id: string }>(
      "select id from public.attendance_correction_requests where record_id = $1 and status = 'pending'", [recordS2])).rows[0].id;
    expect(await sqlState(w.rpc(w.u.teacherA, "erp_review_attendance_correction", { p_request: reqId, p_approve: true }))).toBe("42501");
    expect(await sqlState(w.rpc(w.u.adminB, "erp_review_attendance_correction", { p_request: reqId, p_approve: true }))).toBe("42501");
    await w.rpc(w.u.adminA, "erp_review_attendance_correction", { p_request: reqId, p_approve: true, p_note: "Verified" });

    const rec = (await db.query<{ status: string; version: number; corrected_by: string; correction_reason: string }>(
      "select status, version, corrected_by, correction_reason from public.attendance_records where id = $1", [recordS2])).rows[0];
    expect(rec.status).toBe("late");
    expect(rec.corrected_by).toBe(w.u.adminA);
    expect(rec.correction_reason).toContain("Arrived after roll call");

    const audit = (await db.query<{ old_status: string; new_status: string; reason: string; actor_id: string }>(
      `select old_data->>'status' old_status, new_data->>'status' new_status, reason, actor_id
       from public.audit_logs where entity_type = 'attendance_records' and entity_id = $1 and action = 'update'
       order by id desc limit 1`, [recordS2])).rows[0];
    expect(audit).toEqual({ old_status: "absent", new_status: "late", reason: "Approved request: Arrived after roll call", actor_id: w.u.adminA });
  });

  it("an approver cannot approve a request they raised themselves", async () => {
    const reqId = await w.rpc(w.u.adminA, "erp_request_attendance_correction", {
      p_record: recordS2, p_status: "excused", p_reason: "Self-raised request",
    }) as string;
    expect(await sqlState(w.rpc(w.u.adminA, "erp_review_attendance_correction", { p_request: reqId, p_approve: true }))).toBe("42501");
    await w.rpc(w.u.super, "erp_review_attendance_correction", { p_request: reqId, p_approve: false, p_note: "Not needed" });
  });

  it("direct corrections require a reason and are audited", async () => {
    expect(await sqlState(w.rpc(w.u.adminA, "erp_correct_attendance", { p_record: recordS2, p_status: "present", p_reason: "" }))).toBe("22023");
    await w.rpc(w.u.adminA, "erp_correct_attendance", { p_record: recordS2, p_status: "present", p_reason: "Register entry error" });
    const { rows } = await db.query<{ n: number }>(
      "select count(*)::int n from public.audit_logs where entity_id = $1 and reason = 'Register entry error'", [recordS2]);
    expect(rows[0].n).toBe(1);
  });

  it("institutions can require approval for every correction", async () => {
    await db.query("update public.institutions set require_correction_approval = true where id = $1", [w.schoolA]);
    // Super admin has approve permission, so may still correct directly; an ops manager would not.
    await db.query("insert into auth.users values ('00000000-0000-0000-0000-00000000ab01', 'ops@example.test')");
    await db.query("insert into public.user_role_assignments (user_id, role_key) values ('00000000-0000-0000-0000-00000000ab01', 'operations_manager')");
    expect(await sqlState(w.rpc("00000000-0000-0000-0000-00000000ab01", "erp_correct_attendance", {
      p_record: recordS2, p_status: "absent", p_reason: "Should need approval",
    }))).toBe("55000");
    await db.query("update public.institutions set require_correction_approval = false where id = $1", [w.schoolA]);
  });
});

describe("staff attendance and leave", () => {
  it("records staff attendance with check-in/out in the institution time zone", async () => {
    const session = await w.rpc(w.u.adminA, "erp_open_attendance_session", {
      p_institution: w.schoolA, p_kind: "staff", p_date: today(),
    }) as string;
    await save(w.u.adminA, session, [
      { membership_id: w.tA, status: "present", check_in: "08:55", check_out: "16:05" },
      { membership_id: w.staffA, status: "on_leave" },
    ]);
    const rows = await asUser(db, w.u.adminA, async () => (await db.query<{ member_code: string; check_in: string; check_out: string }>(
      "select member_code, check_in, check_out from public.erp_register_roster($1) where status = 'present'", [session])).rows);
    expect(rows).toEqual([{ member_code: "T-001", check_in: "08:55", check_out: "16:05" }]);
    expect(await sqlState(save(w.u.adminA, session, [{ membership_id: w.s1, status: "present" }]))).toBe("23514");
    expect(await sqlState(save(w.u.adminA, session, [{ membership_id: w.tA, status: "present", check_in: "17:00", check_out: "08:00" }]))).toBe("23514");
  });

  it("staff can request leave for themselves; overlaps and self-approval are blocked", async () => {
    const req = await w.rpc(w.u.teacherA, "erp_request_leave", {
      p_membership: w.tA, p_leave_type: "sick", p_start: dayOffset(1), p_end: dayOffset(2), p_reason: "Medical appointment",
    }) as string;
    expect(await sqlState(w.rpc(w.u.teacherA, "erp_request_leave", {
      p_membership: w.tA, p_leave_type: "casual", p_start: dayOffset(2), p_end: dayOffset(3), p_reason: "Overlap",
    }))).toBe("23505");
    expect(await sqlState(w.rpc(w.u.teacherA, "erp_request_leave", {
      p_membership: w.s2, p_leave_type: "casual", p_start: dayOffset(5), p_end: dayOffset(5), p_reason: "Not mine",
    }))).toBe("P0002");
    expect(await sqlState(w.rpc(w.u.teacherA, "erp_review_leave", { p_request: req, p_approve: true }))).toBe("P0002");
    await w.rpc(w.u.adminA, "erp_review_leave", { p_request: req, p_approve: true });
    const { rows } = await db.query<{ status: string }>("select status from public.leave_requests where id = $1", [req]);
    expect(rows[0].status).toBe("approved");
  });
});

describe("reports", () => {
  it("computes attendance rates with a clear denominator", async () => {
    // Fresh class with a known pattern: present, late, half day, absent, excused.
    const g = (await db.query<{ id: string }>(
      "insert into public.learning_groups (institution_id, group_type, name) values ($1, 'class_section', 'Report Class') returning id", [w.schoolA])).rows[0].id;
    await db.query("insert into public.enrollments (institution_id, group_id, membership_id, start_date) values ($1, $2, $3, current_date - 30)", [w.schoolA, g, w.s3]);
    const statuses = ["present", "late", "half_day", "absent", "excused"];
    for (let i = 0; i < statuses.length; i++) {
      const s = await open(w.u.adminA, g, dayOffset(-(i + 1)));
      await save(w.u.adminA, s, [{ membership_id: w.s3, status: statuses[i] }]);
    }
    const row = await asUser(db, w.u.adminA, async () => (await db.query<{ marked: number; expected: number; attended: string; rate: string }>(
      "select marked, expected, attended, rate from public.erp_attendance_summary($1, 'student', $2, $3, $4)",
      [w.schoolA, dayOffset(-10), today(), g])).rows[0]);
    // attended = 1 + 1 + 0.5 = 2.5; expected = 5 − 1 excused = 4 → 62.5%
    expect(row).toEqual({ marked: 5, expected: 4, attended: "2.5", rate: "62.5" });
  });

  it("teachers' reports only include their students", async () => {
    const rows = await asUser(db, w.u.teacherA, async () => (await db.query<{ member_code: string }>(
      "select member_code from public.erp_attendance_summary($1, 'student', $2, $3)", [w.schoolA, dayOffset(-30), today()])).rows);
    expect(rows.map((r) => r.member_code).sort()).toEqual(["A-001", "A-002"]);
  });

  it("students see only their own attendance", async () => {
    const rows = await asUser(db, w.u.studentA, async () => (await db.query<{ membership_id: string }>(
      "select distinct membership_id from public.attendance_records")).rows);
    expect(rows.map((r) => r.membership_id)).toEqual([w.s1]);
  });

  it("dashboard flags missing registers", async () => {
    const d = await asUser(db, w.u.adminB, async () => (await db.query<{ d: { registers: { expected: number }; missing: { group_name: string }[] } }>(
      "select public.erp_dashboard('school') d")).rows[0].d);
    const isWorkingDay = new Date(Date.now() + 5.5 * 3600_000).getUTCDay() !== 0;
    expect(d.registers.expected).toBe(isWorkingDay ? 1 : 0);
    expect(d.missing.map((m) => m.group_name)).toEqual(isWorkingDay ? ["Grade 6 - B"] : []);
  });
});

describe("institution overview and exports", () => {
  it("summarises each institution's registers for its local today", async () => {
    const rows = await asUser(db, w.u.super, async () => (await db.query<{ name: string; expected_registers: number; submitted_registers: number }>(
      "select name, expected_registers, submitted_registers from public.erp_institution_attendance_today('school') order by name")).rows);
    expect(rows.map((r) => r.name)).toEqual(["Alpha School", "Beta School"]);
    const centreOnly = await asUser(db, w.u.centreMgr, async () => (await db.query<{ name: string }>(
      "select name from public.erp_institution_attendance_today('all')")).rows);
    expect(centreOnly.map((r) => r.name)).toEqual(["Downtown Robotics Centre"]);
  });

  it("export logging requires reports.export and writes an audit entry", async () => {
    expect(await sqlState(w.rpc(w.u.teacherA, "erp_log_export", { p_institution: w.schoolA, p_report: "attendance_summary" }))).toBe("42501");
    expect(await sqlState(w.rpc(w.u.adminA, "erp_log_export", { p_institution: w.schoolB, p_report: "attendance_summary" }))).toBe("42501");
    await w.rpc(w.u.adminA, "erp_log_export", { p_institution: w.schoolA, p_report: "attendance_summary", p_params: JSON.stringify({ from: "2026-01-01" }) });
    const { rows } = await db.query<{ n: number }>("select count(*)::int n from public.audit_logs where entity_type = 'report_export' and actor_id = $1", [w.u.adminA]);
    expect(rows[0].n).toBe(1);
  });
});
