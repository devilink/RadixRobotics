import { can, db, getCategory, requirePagePermission } from "@/lib/erp/context";
import { institutionOptions } from "@/lib/erp/queries";
import { addDays, formatDate, formatPct, str, todayIn } from "@/lib/erp/format";
import { VIEW_ATTENDANCE_PERMS } from "@/lib/erp/permissions";
import { reportQuerySchema, fieldErrors } from "@/lib/erp/validation";
import { MEMBER_TYPE_LABELS, type MemberType } from "@/lib/erp/types";
import { Card, EmptyState, Notice, PageHeader, Table, buttonClass, cx, inputClass, td, th } from "../../_components/ui";
import { PrintButton } from "./PrintButton";

export const metadata = { title: "Attendance reports" };

type Summary = {
  membership_id: string; member_code: string; full_name: string; member_type: MemberType;
  present: number; absent: number; late: number; excused: number; half_day: number; on_leave: number;
  marked: number; expected: number; attended: string; rate: string | null;
};
type Daily = { day: string; registers: number; submitted: number; marked: number; present: number; absent: number; late: number; excused: number; half_day: number; on_leave: number; rate: string | null };

export default async function ReportsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const ctx = await requirePagePermission(VIEW_ATTENDANCE_PERMS);
  const category = await getCategory();
  const sp = await searchParams;
  const options = await institutionOptions(category);
  const institutionId = options.some((o) => o.id === str(sp.institution)) ? str(sp.institution)! : options[0]?.id;
  const inst = options.find((o) => o.id === institutionId);
  const today = todayIn(inst?.timezone);
  const canStaff = !!inst && can(ctx.perms, "staff_attendance.view", inst.id);
  const canStudents = !!inst && inst.institution_type !== "head_office" &&
    (can(ctx.perms, "attendance.view", inst.id) || can(ctx.perms, "attendance.view_assigned", inst.id));
  const kind = str(sp.kind) === "staff" && canStaff ? "staff" : canStudents ? "student" : "staff";
  const raw = { institution_id: institutionId, kind, from: str(sp.from) ?? addDays(today, -29), to: str(sp.to) ?? today, group_id: str(sp.group) || undefined };
  const parsed = inst ? reportQuerySchema.safeParse(raw) : null;
  const errors = parsed && !parsed.success ? fieldErrors(parsed.error) : {};

  const supabase = await db();
  const { data: groups } = inst
    ? await supabase.from("learning_groups").select("id, name").eq("institution_id", inst.id).eq("status", "active").order("name")
    : { data: [] };

  let summary: Summary[] = [];
  let daily: Daily[] = [];
  if (parsed?.success) {
    const q = parsed.data;
    const [s, d] = await Promise.all([
      supabase.rpc("erp_attendance_summary", { p_institution: q.institution_id, p_kind: q.kind, p_from: q.from, p_to: q.to, p_group: q.group_id ?? null }),
      q.group_id ? Promise.resolve({ data: [] }) : supabase.rpc("erp_attendance_daily", { p_institution: q.institution_id, p_kind: q.kind, p_from: q.from, p_to: q.to }),
    ]);
    summary = (s.data ?? []) as Summary[];
    daily = (d.data ?? []) as Daily[];
  }
  const totals = summary.reduce(
    (t, r) => ({ marked: t.marked + r.marked, expected: t.expected + r.expected, attended: t.attended + Number(r.attended), absent: t.absent + r.absent, late: t.late + r.late }),
    { marked: 0, expected: 0, attended: 0, absent: 0, late: 0 }
  );
  const overall = totals.expected ? Math.round((1000 * totals.attended) / totals.expected) / 10 : null;
  const canExport = !!inst && can(ctx.perms, "reports.export", inst.id) && parsed?.success;
  const exportQs = parsed?.success
    ? new URLSearchParams({ institution_id: parsed.data.institution_id, kind: parsed.data.kind, from: parsed.data.from, to: parsed.data.to, ...(parsed.data.group_id && { group_id: parsed.data.group_id }) })
    : null;
  const low = summary.filter((r) => r.rate !== null && Number(r.rate) < 75).length;

  return (
    <>
      <PageHeader
        title="Attendance Reports"
        description="Per-person totals and daily breakdowns for any date range up to one year."
        crumbs={[{ href: "/erp/attendance", label: "Attendance" }, { label: "Reports" }]}
        actions={
          <>
            <PrintButton />
            {canExport && exportQs && (
              <>
                <a className={buttonClass("secondary")} href={`/erp/attendance/reports/export?${exportQs}&report=summary`} download>Export summary (CSV)</a>
                {!parsed?.data?.group_id && <a className={buttonClass("secondary")} href={`/erp/attendance/reports/export?${exportQs}&report=daily`} download>Export daily (CSV)</a>}
              </>
            )}
          </>
        }
      />

      {!inst ? (
        <Card><EmptyState title="No institutions available in this category" /></Card>
      ) : (
        <>
          <Card className="print:hidden">
            <form className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6 lg:items-end">
              <div className="lg:col-span-2">
                <label htmlFor="institution" className="mb-1 block text-sm font-medium">Institution</label>
                <select id="institution" name="institution" defaultValue={inst.id} className={inputClass}>
                  {options.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="kind" className="mb-1 block text-sm font-medium">Register</label>
                <select id="kind" name="kind" defaultValue={kind} className={inputClass}>
                  {canStudents && <option value="student">Students</option>}
                  {canStaff && <option value="staff">Teachers & staff</option>}
                </select>
              </div>
              <div>
                <label htmlFor="from" className="mb-1 block text-sm font-medium">From</label>
                <input id="from" name="from" type="date" defaultValue={raw.from} className={inputClass} aria-invalid={!!errors.from} />
              </div>
              <div>
                <label htmlFor="to" className="mb-1 block text-sm font-medium">To</label>
                <input id="to" name="to" type="date" defaultValue={raw.to} className={inputClass} aria-invalid={!!errors.to} />
              </div>
              <div>
                <label htmlFor="group" className="mb-1 block text-sm font-medium">{inst.institution_type === "school" ? "Class" : "Batch"}</label>
                <select id="group" name="group" defaultValue={raw.group_id ?? ""} className={inputClass} disabled={kind === "staff"}>
                  <option value="">All</option>
                  {(groups ?? []).map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2 lg:col-span-6 flex justify-end">
                <button className={buttonClass("primary")}>Run report</button>
              </div>
            </form>
            {Object.keys(errors).length > 0 && <div className="mt-3"><Notice tone="error">{Object.values(errors)[0]}</Notice></div>}
          </Card>

          {parsed?.success && (
            <>
              <h2 className="mt-6 hidden text-lg font-semibold print:block">
                {inst.name} · {kind === "student" ? "Student" : "Staff"} attendance · {formatDate(parsed.data.from)} – {formatDate(parsed.data.to)}
              </h2>
              <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
                <div className="rounded-2xl border border-zinc-800/50 bg-zinc-900/50 p-4"><p className="text-xs text-zinc-500">Overall rate</p><p className="text-2xl font-semibold tabular-nums">{formatPct(overall)}</p></div>
                <div className="rounded-2xl border border-zinc-800/50 bg-zinc-900/50 p-4"><p className="text-xs text-zinc-500">People</p><p className="text-2xl font-semibold tabular-nums">{summary.length}</p></div>
                <div className="rounded-2xl border border-zinc-800/50 bg-zinc-900/50 p-4"><p className="text-xs text-zinc-500">Absences / late</p><p className="text-2xl font-semibold tabular-nums">{totals.absent} / {totals.late}</p></div>
                <div className="rounded-2xl border border-zinc-800/50 bg-zinc-900/50 p-4"><p className="text-xs text-zinc-500">Below 75%</p><p className="text-2xl font-semibold tabular-nums">{low}</p></div>
              </div>

              <Card className="mt-6" title="By person">
                {summary.length === 0 ? (
                  <EmptyState title="No attendance recorded for this selection" />
                ) : (
                  <Table caption="Attendance by person">
                    <thead>
                      <tr>
                        <th className={th}>Name</th>
                        <th className={th}>ID</th>
                        {kind === "staff" && <th className={th}>Type</th>}
                        <th className={cx(th, "text-right")}>Present</th>
                        <th className={cx(th, "text-right")}>Absent</th>
                        <th className={cx(th, "text-right")}>Late</th>
                        <th className={cx(th, "text-right")}>Excused</th>
                        <th className={cx(th, "text-right")}>½ day</th>
                        {kind === "staff" && <th className={cx(th, "text-right")}>Leave</th>}
                        <th className={cx(th, "text-right")}>Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary.map((r) => (
                        <tr key={r.membership_id}>
                          <td className={td}>{r.full_name}</td>
                          <td className={cx(td, "font-mono text-xs")}>{r.member_code}</td>
                          {kind === "staff" && <td className={td}>{MEMBER_TYPE_LABELS[r.member_type]}</td>}
                          <td className={cx(td, "text-right tabular-nums")}>{r.present}</td>
                          <td className={cx(td, "text-right tabular-nums")}>{r.absent}</td>
                          <td className={cx(td, "text-right tabular-nums")}>{r.late}</td>
                          <td className={cx(td, "text-right tabular-nums")}>{r.excused}</td>
                          <td className={cx(td, "text-right tabular-nums")}>{r.half_day}</td>
                          {kind === "staff" && <td className={cx(td, "text-right tabular-nums")}>{r.on_leave}</td>}
                          <td className={cx(td, "text-right font-medium tabular-nums", r.rate !== null && Number(r.rate) < 75 && "text-rose-400")}>{formatPct(r.rate)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                )}
              </Card>

              {daily.length > 0 && (
                <Card className="mt-6" title="By day">
                  <Table caption="Attendance by day">
                    <thead>
                      <tr>
                        <th className={th}>Date</th>
                        <th className={cx(th, "text-right")}>Registers</th>
                        <th className={cx(th, "text-right")}>Submitted</th>
                        <th className={cx(th, "text-right")}>Present</th>
                        <th className={cx(th, "text-right")}>Absent</th>
                        <th className={cx(th, "text-right")}>Late</th>
                        <th className={cx(th, "text-right")}>Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {daily.map((d) => (
                        <tr key={d.day}>
                          <td className={td}>{formatDate(d.day)}</td>
                          <td className={cx(td, "text-right tabular-nums")}>{d.registers}</td>
                          <td className={cx(td, "text-right tabular-nums")}>{d.submitted}</td>
                          <td className={cx(td, "text-right tabular-nums")}>{d.present}</td>
                          <td className={cx(td, "text-right tabular-nums")}>{d.absent}</td>
                          <td className={cx(td, "text-right tabular-nums")}>{d.late}</td>
                          <td className={cx(td, "text-right tabular-nums")}>{formatPct(d.rate)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Card>
              )}
              <p className="mt-4 text-xs text-zinc-500">
                Rate = (present + late + ½ half-day) ÷ (entries − excused − on leave). Only people who were on a register are counted.
                Draft registers are included as marked so far.
              </p>
            </>
          )}
        </>
      )}
    </>
  );
}
