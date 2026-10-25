import Link from "next/link";
import { canAny, db, getCategory, requirePagePermission } from "@/lib/erp/context";
import { fillTrend, getAttendanceCalendar, getDashboard, rateOf } from "@/lib/erp/queries";
import { formatPct, todayIn } from "@/lib/erp/format";
import { attendanceHeat, STATUS_COLORS } from "@/lib/erp/charts";
import { MARK_PERMS, VIEW_ATTENDANCE_PERMS } from "@/lib/erp/permissions";
import { CATEGORY_LABELS, type InstitutionType } from "@/lib/erp/types";
import { Badge, Card, EmptyState, LinkButton, StatCard, Table, TypeBadge, cx, focusRing, td, th } from "../_components/ui";
import { CalendarArt, HeroBanner } from "../_components/playful";
import { CalendarOff, CheckCircle2, Clock, FilePen, GraduationCap, ListChecks, Percent, ShieldQuestion, UserCheck, XCircle } from "lucide-react";
import { TrendChart } from "../_components/TrendChart";
import { BarList, Donut, Sparkline, YearHeatmap } from "../_components/charts";

export const metadata = { title: "Attendance" };

type InstRow = {
  institution_id: string; name: string; institution_type: InstitutionType; today: string;
  expected_registers: number; submitted_registers: number; draft_registers: number;
  student_marked: number; student_present: number; student_absent: number; student_late: number; student_rate: string | null;
  staff_marked: number; staff_present: number; staff_on_leave: number;
};

export default async function AttendanceOverviewPage() {
  const ctx = await requirePagePermission(VIEW_ATTENDANCE_PERMS);
  const category = await getCategory();
  const supabase = await db();
  const [d, { data: inst }, calendar, staffCalendar] = await Promise.all([
    getDashboard(category),
    supabase.rpc("erp_institution_attendance_today", { p_category: category }),
    getAttendanceCalendar(category, "student"),
    getAttendanceCalendar(category, "staff"),
  ]);
  const trend = fillTrend(d.trend);
  const heat = calendar ? attendanceHeat(calendar) : null;
  const staffHeat = staffCalendar?.length ? attendanceHeat(staffCalendar) : null;
  const rows = (inst ?? []) as InstRow[];
  const st = d.student_today;
  const studentRate = rateOf(st);
  const staffRate = rateOf(d.staff_today);

  return (
    <>
      <HeroBanner
        eyebrow={`Attendance · ${CATEGORY_LABELS[category]}`}
        title="Who’s"
        highlight="here today?"
        accent="emerald"
        accent2="sky"
        art={<CalendarArt />}
        summary={st.marked ? (
          <>
            <strong>{(st.present + st.late).toLocaleString("en-IN")}</strong> of {st.marked.toLocaleString("en-IN")} students marked so far are in
            {studentRate !== null && <> (<strong>{formatPct(studentRate)}</strong>)</>}. {st.absent > 0 && <>{st.absent} absent, </>}{st.late} late.
            Times follow each institution’s own time zone.
          </>
        ) : <>No student registers have been marked yet today. Open the daily register to start.</>}
      >
        {canAny(ctx.perms, MARK_PERMS) && <LinkButton href="/erp/attendance/register">Take attendance</LinkButton>}
        <LinkButton variant="secondary" href="/erp/attendance/reports">Reports</LinkButton>
      </HeroBanner>

      <section aria-label="Today" className="grid max-md:grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Registered students" value={d.people.students} icon={<GraduationCap />} accent="#38bdf8" />
        <StatCard label="Present today" value={st.present} tone="good" icon={<CheckCircle2 />} accent="#10b981" />
        <StatCard label="Absent today" value={st.absent} tone={st.absent ? "bad" : "default"} icon={<XCircle />} accent="#f43f5e" />
        <StatCard label="Late arrivals" value={st.late} tone={st.late ? "warn" : "default"} icon={<Clock />} accent="#f59e0b" />
        <StatCard label="Excused" value={st.excused} icon={<ShieldQuestion />} accent="#0ea5e9" />
        <StatCard label="Attendance rate" value={formatPct(studentRate)} hint={`${st.marked} marked`} icon={<Percent />} accent="#34d399"
          chart={<Sparkline values={trend.map((p) => p.rate)} label="Student attendance rate, last 14 days" />} />
        <StatCard label="Staff attendance" value={formatPct(staffRate)} hint={`${d.staff_today.marked} staff marked · ${d.staff_today.on_leave} on leave`} icon={<UserCheck />} accent="#2dd4bf" />
        <StatCard label="Registers submitted" value={`${d.registers.submitted}/${d.registers.expected}`}
          tone={d.registers.expected && d.registers.submitted < d.registers.expected ? "warn" : "default"} icon={<ListChecks />} accent="#ff7a38" />
        <StatCard label="Corrections to review" value={d.pending.corrections} href="/erp/attendance/corrections" tone={d.pending.corrections ? "warn" : "default"} icon={<FilePen />} accent="#fbbf24" />
        <StatCard label="Leave requests" value={d.pending.leave} href="/erp/attendance/leave" tone={d.pending.leave ? "warn" : "default"} icon={<CalendarOff />} accent="#a78bfa" />
      </section>

      <Card className="mt-6" title="Attendance calendar · last 12 months">
        {heat ? (
          <YearHeatmap
            label="Student attendance for each day of the last 12 months"
            cells={heat.cells}
            metrics={heat.metrics}
            endDate={todayIn()}
            dayHref="/erp/attendance/reports?from={date}&to={date}"
            dayHrefLabel="Open report for this day"
            emptyLabel="No registers marked"
          />
        ) : (
          <EmptyState title="The yearly calendar needs one more database update">
            Apply <code>supabase/migrations/20261025090000_erp_dashboard_analytics.sql</code> to see a year of attendance at a glance.
          </EmptyState>
        )}
      </Card>

      <div className="mt-6 grid gap-6 xl:grid-cols-5">
        <Card title="Today by status" className="xl:col-span-2">
          <Donut
            label="Student attendance today by status"
            centerValue={formatPct(studentRate)}
            centerLabel={st.marked ? `rate · ${st.marked.toLocaleString("en-IN")} marked` : "nothing marked yet"}
            segments={[
              { key: "present", label: "Present", value: st.present, color: STATUS_COLORS.present },
              { key: "late", label: "Late", value: st.late, color: STATUS_COLORS.late },
              { key: "half_day", label: "Half day", value: st.half_day, color: STATUS_COLORS.half_day },
              { key: "excused", label: "Excused", value: st.excused, color: STATUS_COLORS.excused },
              { key: "absent", label: "Absent", value: st.absent, color: STATUS_COLORS.absent },
            ]}
          />
        </Card>
        <Card title="Student attendance rate · last 14 days" className="xl:col-span-3">
          {d.trend.length ? <TrendChart points={trend} /> : <EmptyState title="No attendance recorded in the last 14 days" />}
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-5">
        <Card title="Institutions ranked by today’s attendance" className="xl:col-span-3">
          <BarList
            label="Institutions by student attendance rate today"
            rows={rows.filter((r) => r.institution_type !== "head_office").map((r) => ({
              key: r.institution_id,
              label: r.name,
              value: r.student_rate === null ? null : Number(r.student_rate),
              display: r.student_rate === null ? "Not marked" : formatPct(r.student_rate),
              sub: r.student_marked ? `${r.student_present + r.student_late}/${r.student_marked} in` : undefined,
              href: `/erp/institutions/${r.institution_id}`,
            }))}
            max={100}
            color="#26a641"
            target={{ value: 85, label: "85% target" }}
            emptyText="No institutions in this category"
          />
        </Card>
        <Card title="Exceptions requiring review" className="xl:col-span-2">
          <ul className="space-y-2 text-sm">
            <li className="flex justify-between"><span>Registers not started today</span><Badge tone={d.registers.not_started ? "amber" : "neutral"}>{d.registers.not_started}</Badge></li>
            <li className="flex justify-between"><span>Registers still in draft</span><Badge tone={d.registers.draft ? "amber" : "neutral"}>{d.registers.draft}</Badge></li>
            <li className="flex justify-between"><span>Pending correction requests</span><Badge tone={d.pending.corrections ? "amber" : "neutral"}>{d.pending.corrections}</Badge></li>
            <li className="flex justify-between"><span>Pending leave requests</span><Badge tone={d.pending.leave ? "amber" : "neutral"}>{d.pending.leave}</Badge></li>
          </ul>
        </Card>
      </div>

      {staffHeat && (
        <Card className="mt-6" title="Teacher & staff attendance · last 12 months">
          <YearHeatmap
            label="Teacher and staff attendance for each day of the last 12 months"
            cells={staffHeat.cells}
            metrics={staffHeat.metrics}
            endDate={todayIn()}
            dayHref="/erp/attendance/reports?kind=staff&from={date}&to={date}"
            dayHrefLabel="Open staff report for this day"
            emptyLabel="No staff register"
          />
        </Card>
      )}

      <Card className="mt-6" title="By institution · today">
        {rows.length === 0 ? (
          <EmptyState title="No institutions in this category" />
        ) : (
          <Table caption="Attendance by institution">
            <thead>
              <tr>
                <th className={th}>Institution</th>
                <th className={th}>Registers</th>
                <th className={cx(th, "text-right")}>Present</th>
                <th className={cx(th, "text-right")}>Absent</th>
                <th className={cx(th, "text-right")}>Late</th>
                <th className={cx(th, "text-right")}>Rate</th>
                <th className={cx(th, "text-right")}>Staff in</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const complete = r.expected_registers > 0 && r.submitted_registers >= r.expected_registers;
                return (
                  <tr key={r.institution_id}>
                    <td className={td}>
                      <Link href={`/erp/institutions/${r.institution_id}`} className={cx("font-medium hover:underline", focusRing)}>{r.name}</Link>
                      {category === "all" && <span className="ml-2"><TypeBadge type={r.institution_type} /></span>}
                    </td>
                    <td className={td}>
                      {r.expected_registers === 0 ? (
                        <span className="text-zinc-500">None scheduled</span>
                      ) : (
                        <Badge tone={complete ? "green" : r.submitted_registers ? "amber" : "red"}>
                          {r.submitted_registers}/{r.expected_registers} submitted{r.draft_registers ? ` · ${r.draft_registers} draft` : ""}
                        </Badge>
                      )}
                    </td>
                    <td className={cx(td, "text-right tabular-nums")}>{r.student_present}</td>
                    <td className={cx(td, "text-right tabular-nums")}>{r.student_absent}</td>
                    <td className={cx(td, "text-right tabular-nums")}>{r.student_late}</td>
                    <td className={cx(td, "text-right tabular-nums")}>{formatPct(r.student_rate)}</td>
                    <td className={cx(td, "text-right tabular-nums")}>{r.staff_marked ? `${r.staff_present}/${r.staff_marked}` : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
        <p className="mt-3 text-xs text-zinc-500">
          Rate = (present + late + ½ half-day) ÷ (marked − excused − on leave). Registers are expected for active classes on the
          institution’s working days and for batches on their meeting days.
        </p>
      </Card>
    </>
  );
}
