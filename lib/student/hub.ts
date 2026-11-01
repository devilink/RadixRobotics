import "server-only";
import { createClient } from "@supabase/supabase-js";
import { STUDENT_LOGIN_DOMAIN } from "@/lib/auth/student-login";
import { parseClassNumber } from "./projects";
import type { ProgressRow } from "./badges";

// Everything the student profile shows, for the signed-in student only. Uses the
// service role because the student's own session can't read most ERP tables;
// every query is keyed to the caller's user id, which the page takes from the session.

export type HubData = {
  name: string;
  username: string | null;
  contactEmail: string | null;
  schoolName: string | null;
  institutionName: string | null;
  className: string | null;
  classNumber: number | null;
  studentCode: string | null;
  attendance: {
    rate: number | null;
    present: number;
    absent: number;
    late: number;
    total: number;
    /** Most recent first, up to 20. */
    recent: { date: string; status: string }[];
  } | null;
  progress: ProgressRow[];
  /** False when the student_progress table is missing (migration not applied). */
  progressReady: boolean;
};

function service() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

const iso = (d: Date) => d.toISOString().slice(0, 10);

export async function loadStudentHub(userId: string, schoolId: string | null): Promise<HubData> {
  const s = service();
  const [{ data: authUser }, school, profile, progress] = await Promise.all([
    s.auth.admin.getUserById(userId),
    schoolId ? s.from("schools").select("school_name").eq("custom_id", schoolId).maybeSingle() : Promise.resolve({ data: null }),
    s.from("profiles").select("person_id").eq("id", userId).maybeSingle(),
    s.from("student_progress").select("topic_id, progress_percentage, is_completed, last_watched_at").eq("student_auth_id", userId).limit(2000),
  ]);

  const u = authUser?.user;
  const meta = (u?.user_metadata ?? {}) as Record<string, unknown>;
  const email = u?.email ?? "";
  const isUsername = email.endsWith(`@${STUDENT_LOGIN_DOMAIN}`);
  const data: HubData = {
    name: (typeof meta.full_name === "string" && meta.full_name) || (isUsername ? email.split("@")[0] : email) || "Student",
    username: isUsername ? email.slice(0, -(STUDENT_LOGIN_DOMAIN.length + 1)) : null,
    contactEmail: typeof meta.contact_email === "string" ? meta.contact_email : isUsername ? null : email || null,
    schoolName: (school.data as { school_name: string } | null)?.school_name ?? null,
    institutionName: null,
    className: null,
    classNumber: null,
    studentCode: null,
    attendance: null,
    progress: progress.error ? [] : ((progress.data ?? []) as ProgressRow[]),
    progressReady: !progress.error,
  };
  if (progress.error) console.error("[profile] student_progress unavailable:", progress.error.message);

  // ERP record: student ID, class and attendance. Optional — many schools don't use the ERP.
  const personId = (profile.data as { person_id: string | null } | null)?.person_id;
  if (!personId) return data;

  const { data: memberships } = await s
    .from("institution_memberships")
    .select("id, member_code, status, institutions(name, timezone)")
    .eq("person_id", personId)
    .eq("member_type", "student")
    .limit(10);
  type M = { id: string; member_code: string; status: string; institutions: { name: string; timezone: string } | null };
  const list = (memberships ?? []) as unknown as M[];
  const m = list.find((x) => x.status === "active") ?? list[0];
  if (!m) return data;
  data.studentCode = m.member_code;
  data.institutionName = m.institutions?.name ?? null;

  const today = iso(new Date());
  const from = iso(new Date(Date.now() - 89 * 86_400_000));
  const [{ data: enrol }, { data: recs }] = await Promise.all([
    s.from("enrollments").select("start_date, end_date, learning_groups(name, grade)").eq("membership_id", m.id).order("start_date", { ascending: false }).limit(20),
    s.from("attendance_records").select("status, attendance_sessions!inner(session_date)").eq("membership_id", m.id).gte("attendance_sessions.session_date", from).limit(1000),
  ]);

  type E = { end_date: string | null; learning_groups: { name: string; grade: string | null } | null };
  const current = ((enrol ?? []) as unknown as E[]).filter((e) => e.learning_groups && (!e.end_date || e.end_date > today));
  if (current.length) {
    data.className = current.map((e) => e.learning_groups!.name).join(", ");
    for (const e of current) {
      data.classNumber = parseClassNumber(e.learning_groups!.grade, e.learning_groups!.name);
      if (data.classNumber) break;
    }
  }

  type R = { status: string; attendance_sessions: { session_date: string } };
  const rows = ((recs ?? []) as unknown as R[]).sort((a, b) => b.attendance_sessions.session_date.localeCompare(a.attendance_sessions.session_date));
  if (rows.length) {
    const n = (st: string) => rows.filter((r) => r.status === st).length;
    const excused = n("excused") + n("on_leave");
    const expected = rows.length - excused;
    const rate = expected > 0 ? Math.round((1000 * (n("present") + n("late") + 0.5 * n("half_day"))) / expected) / 10 : null;
    data.attendance = {
      rate,
      present: n("present"),
      absent: n("absent"),
      late: n("late"),
      total: rows.length,
      recent: rows.slice(0, 20).map((r) => ({ date: r.attendance_sessions.session_date, status: r.status })),
    };
  }
  return data;
}
