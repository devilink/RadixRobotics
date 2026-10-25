import { db, requirePagePermission } from "@/lib/erp/context";
import { addDays, formatDate, formatPct, todayIn } from "@/lib/erp/format";
import { ATTENDANCE_STATUS_LABELS, MEMBER_TYPE_LABELS, type AttendanceStatus, type MemberType } from "@/lib/erp/types";
import { STATUS_COLORS, streaks, type HeatCell } from "@/lib/erp/charts";
import { AttendanceBadge, Card, EmptyState, LinkButton, PageHeader, StatCard, Table, td, th } from "../_components/ui";
import { Donut, YearHeatmap } from "../_components/charts";

// When a day has several registers, the calendar shows the most serious status.
const SEVERITY: AttendanceStatus[] = ["absent", "late", "half_day", "excused", "on_leave", "present"];
const STATUS_ORDER = ["present", "late", "half_day", "excused", "on_leave", "absent"] as const;

export const metadata = { title: "My Attendance" };

export default async function MePage() {
  const ctx = await requirePagePermission(["self.view"]);
  const supabase = await db();
  if (!ctx.personId) {
    return (
      <>
        <PageHeader title="My Attendance" />
        <EmptyState title="Your login is not linked to a person record">Ask your administrator to link your account so your attendance appears here.</EmptyState>
      </>
    );
  }
  const today = todayIn();
  const { data: memberships } = await supabase
    .from("institution_memberships")
    .select("id, member_type, member_code, status, institutions(name)")
    .eq("person_id", ctx.personId);
  const ids = (memberships ?? []).map((m) => m.id as string);
  const { data: records } = ids.length
    ? await supabase.from("attendance_records")
        .select("id, status, remarks, membership_id, attendance_sessions!inner(session_date, period_label, learning_groups(name))")
        .in("membership_id", ids).gte("attendance_sessions.session_date", addDays(today, -370)).limit(3000)
    : { data: [] };
  type R = { id: string; status: AttendanceStatus; remarks: string | null; attendance_sessions: { session_date: string; period_label: string; learning_groups: { name: string } | null } };
  const recs = ((records ?? []) as unknown as R[]).sort((a, b) => b.attendance_sessions.session_date.localeCompare(a.attendance_sessions.session_date));
  const count = (s: AttendanceStatus) => recs.filter((r) => r.status === s).length;
  const expected = recs.length - count("excused") - count("on_leave");
  const rate = expected ? Math.round((1000 * (count("present") + count("late") + 0.5 * count("half_day"))) / expected) / 10 : null;
  const isStaff = (memberships ?? []).some((m) => m.member_type !== "student");

  // One calendar cell per day.
  const byDay = new Map<string, R[]>();
  for (const r of recs) byDay.set(r.attendance_sessions.session_date, [...(byDay.get(r.attendance_sessions.session_date) ?? []), r]);
  const cells: HeatCell[] = [...byDay.entries()].map(([date, rs]) => ({
    date,
    category: SEVERITY.find((s) => rs.some((r) => r.status === s)),
    details: rs.slice(0, 4).map((r) => ({
      label: r.attendance_sessions.learning_groups?.name ?? (r.attendance_sessions.period_label || "Staff register"),
      value: ATTENDANCE_STATUS_LABELS[r.status],
    })),
  }));
  // Excused and leave days neither extend nor break a streak.
  const streak = streaks(cells.filter((c) => c.category !== "excused" && c.category !== "on_leave")
    .map((c) => ({ date: c.date, ok: c.category === "present" || c.category === "late" })));
  const recent = recs.filter((r) => r.attendance_sessions.session_date >= addDays(today, -59));

  return (
    <>
      <PageHeader title="My Attendance" description="Your own attendance across every institution you belong to, over the last 12 months."
        actions={isStaff ? <LinkButton variant="secondary" href="/erp/attendance/leave">Request leave</LinkButton> : undefined} />
      <div className="grid max-md:grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Attendance rate" value={formatPct(rate)} tone={rate === null ? "default" : rate >= 85 ? "good" : rate >= 75 ? "warn" : "bad"}
          hint={`${byDay.size} day${byDay.size === 1 ? "" : "s"} recorded`} />
        <StatCard label="Current streak" value={`${streak.current} day${streak.current === 1 ? "" : "s"}`} tone={streak.current ? "good" : "default"} hint="Days in a row present or late" />
        <StatCard label="Best streak" value={`${streak.best} day${streak.best === 1 ? "" : "s"}`} hint="Longest run this year" />
        <StatCard label="Days absent" value={count("absent")} tone={count("absent") ? "bad" : "good"} hint={`${count("late")} late · ${count("excused")} excused`} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card title="My year" className="xl:col-span-2">
          <YearHeatmap
            label="Your attendance for each day of the last 12 months"
            cells={cells}
            endDate={today}
            categories={STATUS_ORDER.map((s) => ({ key: s, label: ATTENDANCE_STATUS_LABELS[s], color: STATUS_COLORS[s] }))}
            emptyLabel="No register"
          />
        </Card>
        <Card title="Breakdown">
          <Donut
            label="Your attendance entries by status"
            centerValue={formatPct(rate)}
            centerLabel="attendance rate"
            segments={STATUS_ORDER.map((s) => ({ key: s, label: ATTENDANCE_STATUS_LABELS[s], value: count(s), color: STATUS_COLORS[s] }))}
          />
        </Card>
      </div>
      <Card className="mt-6" title="Memberships">
        <ul className="text-sm">
          {(memberships ?? []).map((m) => (
            <li key={m.id} className="py-1">
              {MEMBER_TYPE_LABELS[m.member_type as MemberType]} at {(m.institutions as unknown as { name: string } | null)?.name} · <span className="font-mono text-xs">{m.member_code}</span>
            </li>
          ))}
        </ul>
      </Card>
      <Card className="mt-6" title="Recent entries · last 60 days">
        {recent.length === 0 ? (
          <EmptyState title="No attendance recorded in the last 60 days" />
        ) : (
          <Table caption="My attendance">
            <thead><tr><th className={th}>Date</th><th className={th}>Register</th><th className={th}>Status</th><th className={th}>Remarks</th></tr></thead>
            <tbody>
              {recent.map((r) => (
                <tr key={r.id}>
                  <td className={td}>{formatDate(r.attendance_sessions.session_date)}</td>
                  <td className={td}>{r.attendance_sessions.learning_groups?.name ?? "Staff register"}{r.attendance_sessions.period_label ? ` · ${r.attendance_sessions.period_label}` : ""}</td>
                  <td className={td}><AttendanceBadge status={r.status} /></td>
                  <td className={td}>{r.remarks ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </>
  );
}
