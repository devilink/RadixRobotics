import Link from "next/link";
import { requirePagePermission, getCategory, can } from "@/lib/erp/context";
import { fillTrend, getAttendanceCalendar, getDashboard, rateOf, type DashboardData } from "@/lib/erp/queries";
import { attendanceHeat, STATUS_COLORS } from "@/lib/erp/charts";
import { CATEGORY_LABELS, type Category } from "@/lib/erp/types";
import { setCategory } from "./actions";
import { formatPct, todayIn } from "@/lib/erp/format";
import { Badge, Card, EmptyState, LinkButton, StatCard, StatusBadge, TypeBadge, focusRing, cx } from "./_components/ui";
import { TrendChart } from "./_components/TrendChart";
import { Donut, Sparkline, YearHeatmap } from "./_components/charts";
import { ActionTiles, HeroBanner, RobotArt, greeting } from "./_components/playful";
import { actionsFor } from "@/lib/erp/nav";
import { Building2, CalendarOff, ClipboardCheck, Clock, GraduationCap, ListChecks, UserCheck, Users } from "lucide-react";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const ctx = await requirePagePermission(["dashboard.view", "self.view"]);
  const category = await getCategory();

  if (!can(ctx.perms, "dashboard.view")) {
    // Self-service users (students, employees) land on their own attendance.
    return (
      <>
        <HeroBanner eyebrow="Radix ERP" title={`${greeting()},`} highlight={ctx.displayName.split(" ")[0]} accent="teal" accent2="sky"
          summary="Your attendance, streaks and leave requests are all in one place." art={<RobotArt />}>
          <LinkButton href="/erp/me">Open My Attendance</LinkButton>
        </HeroBanner>
      </>
    );
  }

  const showInstitutions = category === "all";
  // In "All" view, also load each category separately for the side-by-side comparison.
  const [d, schools, centers, calendar] = await Promise.all([
    getDashboard(category),
    showInstitutions ? getDashboard("school") : null,
    showInstitutions ? getDashboard("learning_center") : null,
    getAttendanceCalendar(category),
  ]);
  const trend = fillTrend(d.trend);
  const heat = calendar ? attendanceHeat(calendar) : null;
  const st = d.student_today;
  const studentRate = rateOf(d.student_today);
  const staffRate = rateOf(d.staff_today);
  const pendingTotal = d.pending.corrections + d.pending.leave;
  const openRegisters = d.registers.expected - d.registers.submitted;
  const today = new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "numeric", month: "long", timeZone: "Asia/Kolkata" }).format(new Date());

  return (
    <>
      <HeroBanner
        eyebrow={`${today} · ${CATEGORY_LABELS[category]}`}
        title={`${greeting()},`}
        highlight={ctx.displayName.split(" ")[0]}
        art={<RobotArt />}
        summary={d.registers.expected ? (
          <>
            <strong>{d.registers.submitted} of {d.registers.expected}</strong> registers are in today
            {studentRate !== null && <>, with <strong>{formatPct(studentRate)}</strong> of students present</>}.{" "}
            {openRegisters > 0 ? <>{openRegisters} still need marking. </> : <>Every register is done. </>}
            {pendingTotal > 0 ? <><strong>{pendingTotal}</strong> approval{pendingTotal === 1 ? "" : "s"} waiting for you.</> : "No approvals waiting."}
          </>
        ) : (
          <>No classes are scheduled today. {pendingTotal > 0 ? <><strong>{pendingTotal}</strong> approval{pendingTotal === 1 ? "" : "s"} waiting for you.</> : "Nothing is waiting for you."}</>
        )}
      />
      <ActionTiles tiles={actionsFor(ctx.perms)} />

      {schools && centers && (
        <section aria-label="Schools and Radix Learning Centers" className="mb-6 grid gap-4 lg:grid-cols-2">
          <CategoryPanel category="school" data={schools} />
          <CategoryPanel category="learning_center" data={centers} />
        </section>
      )}

      <section aria-label="Key figures" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={category === "school" ? "Active schools" : category === "learning_center" ? "Active centres" : "Active institutions"}
          value={d.institutions.total}
          hint={showInstitutions ? `${d.institutions.school} schools · ${d.institutions.learning_center} Radix learning centers` : undefined}
          href="/erp/institutions"
          icon={<Building2 />} accent="#a78bfa"
        />
        <StatCard label="Enrolled students" value={d.people.students.toLocaleString("en-IN")} hint={`${d.people.teachers} teachers & instructors`} href="/erp/people?type=students" icon={<GraduationCap />} accent="#38bdf8" />
        <StatCard
          label="Student attendance today"
          value={formatPct(studentRate)}
          tone={studentRate === null ? "default" : studentRate >= 85 ? "good" : studentRate >= 70 ? "warn" : "bad"}
          hint={d.student_today.marked ? `${d.student_today.present + d.student_today.late} present · ${d.student_today.absent} absent · ${d.student_today.late} late` : "No student registers marked yet"}
          href="/erp/attendance"
          icon={<ClipboardCheck />} accent="#34d399"
          chart={<Sparkline values={trend.map((p) => p.rate)} label="Student attendance rate, last 14 days" />}
        />
        <StatCard
          label="Teacher & staff attendance"
          value={formatPct(staffRate)}
          tone={staffRate === null ? "default" : staffRate >= 90 ? "good" : "warn"}
          hint={d.staff_today.marked ? `${d.staff_today.present + d.staff_today.late} in · ${d.staff_today.on_leave} on leave · ${d.staff_today.absent} absent` : "No staff registers marked yet"}
          icon={<UserCheck />} accent="#2dd4bf"
        />
        <StatCard
          label="Registers submitted today"
          value={`${d.registers.submitted} / ${d.registers.expected}`}
          tone={d.registers.expected === 0 ? "default" : d.registers.submitted === d.registers.expected ? "good" : "warn"}
          hint={d.registers.expected ? `${d.registers.not_started} not started · ${d.registers.draft} in draft` : "No classes or batches scheduled today"}
          href="/erp/attendance/register"
          icon={<ListChecks />} accent="#ff7a38"
        />
        <StatCard label="Pending approvals" value={pendingTotal} tone={pendingTotal ? "warn" : "default"}
          hint={`${d.pending.corrections} corrections · ${d.pending.leave} leave requests`} href="/erp/attendance/corrections" icon={<CalendarOff />} accent="#fbbf24" />
        <StatCard label="Staff & employees" value={d.people.staff} hint="Active non-teaching staff" href={can(ctx.perms, "staff.view") ? "/erp/people?type=staff" : undefined} icon={<Users />} accent="#f472b6" />
        <StatCard label="Late arrivals today" value={d.student_today.late + d.staff_today.late} hint={`${d.student_today.excused} students excused`} icon={<Clock />} accent="#fbbf24" />
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-5">
        <Card title="Today’s students" className="xl:col-span-2">
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
          <RegisterProgress submitted={d.registers.submitted} draft={d.registers.draft} expected={d.registers.expected} />
        </Card>
        <Card title="Student attendance rate · last 14 days" className="xl:col-span-3">
          {d.trend.length ? (
            <TrendChart points={trend} />
          ) : (
            <EmptyState title="No attendance recorded in the last 14 days" />
          )}
          <p className="mt-3 text-xs text-zinc-500">
            Rate = (present + late + ½ half-day) ÷ (people marked − excused − on leave). Only people on a register are counted.
          </p>
        </Card>
      </div>

      <Card className="mt-6" title="Student attendance · last 12 months">
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

        <Card
          title="Registers needing attention today"
          className="xl:col-span-2"
          actions={d.missing.length ? <Badge tone="amber">{d.registers.expected - d.registers.submitted} open</Badge> : undefined}
        >
          {d.missing.length === 0 ? (
            <EmptyState title={d.registers.expected ? "All of today’s registers are submitted" : "Nothing scheduled today"} />
          ) : (
            <ul className="divide-y divide-zinc-800/60">
              {d.missing.map((m) => (
                <li key={m.group_id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <Link href={`/erp/groups/${m.group_id}`} className={cx("block truncate text-sm font-medium text-zinc-100 hover:underline", focusRing)}>
                      {m.group_name}
                    </Link>
                    <p className="flex items-center gap-2 truncate text-xs text-zinc-500">
                      {m.institution_name} {category === "all" && <TypeBadge type={m.institution_type} />}
                    </p>
                  </div>
                  <StatusBadge status={m.status === "draft" ? "draft" : "not started"} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <p className="mt-6 text-xs text-zinc-500">
        Projects, inventory, finance and support KPIs will appear here as those modules are delivered.
      </p>
    </>
  );
}

/** Stacked progress bar of today's registers: submitted, in draft, not started. */
function RegisterProgress({ submitted, draft, expected }: { submitted: number; draft: number; expected: number }) {
  if (!expected) return <p className="mt-5 text-xs text-zinc-500">No classes or batches scheduled today.</p>;
  const notStarted = Math.max(expected - submitted - draft, 0);
  const parts = [
    { label: "Submitted", value: submitted, cls: "bg-emerald-500" },
    { label: "Draft", value: draft, cls: "bg-amber-500" },
    { label: "Not started", value: notStarted, cls: "bg-zinc-700" },
  ];
  return (
    <div className="mt-5">
      <div className="mb-1.5 flex items-baseline justify-between text-xs">
        <span className="font-medium text-zinc-300">Registers today</span>
        <span className="tabular-nums text-zinc-400">{submitted} of {expected} submitted</span>
      </div>
      <div className="flex h-2.5 gap-0.5 overflow-hidden rounded-full" role="img" aria-label={parts.map((p) => `${p.label} ${p.value}`).join(", ")}>
        {parts.map((p) => p.value > 0 && (
          <span key={p.label} className={cx("h-full first:rounded-l-full last:rounded-r-full", p.cls)} style={{ width: `${(p.value / expected) * 100}%` }} title={`${p.label}: ${p.value}`} />
        ))}
      </div>
      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-400">
        {parts.map((p) => (
          <li key={p.label} className="flex items-center gap-1.5"><span aria-hidden className={cx("h-2 w-2 rounded-sm", p.cls)} />{p.label} <span className="tabular-nums text-zinc-200">{p.value}</span></li>
        ))}
      </ul>
    </div>
  );
}

const PANEL_ACCENT = {
  school: { bar: "bg-sky-500", text: "text-sky-300", border: "border-sky-500/20" },
  learning_center: { bar: "bg-violet-500", text: "text-violet-300", border: "border-violet-500/20" },
} as const;

/** One category's headline figures, for the side-by-side comparison in "All" view. */
function CategoryPanel({ category, data: d }: { category: Exclude<Category, "all">; data: DashboardData }) {
  const accent = PANEL_ACCENT[category];
  const studentRate = rateOf(d.student_today);
  const staffRate = rateOf(d.staff_today);
  const open = d.registers.expected - d.registers.submitted;
  const figures = [
    { label: category === "school" ? "Schools" : "Centers", value: d.institutions.total.toLocaleString("en-IN") },
    { label: "Students", value: d.people.students.toLocaleString("en-IN") },
    { label: "Student attendance", value: formatPct(studentRate) },
    { label: "Staff attendance", value: formatPct(staffRate) },
    { label: "Registers today", value: `${d.registers.submitted} / ${d.registers.expected}` },
    { label: "Pending approvals", value: d.pending.corrections + d.pending.leave },
  ];
  return (
    <div className={cx("relative overflow-hidden rounded-2xl border bg-zinc-900/50 p-5", accent.border)}>
      <span aria-hidden className={cx("absolute inset-x-0 top-0 h-1", accent.bar)} />
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className={cx("text-lg font-bold", accent.text)}>{CATEGORY_LABELS[category]}</h2>
        <form action={setCategory.bind(null, category)}>
          <button type="submit" className={cx("rounded-lg px-2.5 py-1 text-xs font-medium text-zinc-400 hover:bg-zinc-800 hover:text-white", focusRing)}>
            Open {category === "school" ? "Schools" : "Centers"} view →
          </button>
        </form>
      </div>
      <dl className="grid max-sm:grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
        {figures.map((f) => (
          <div key={f.label}>
            <dt className="text-xs text-zinc-500">{f.label}</dt>
            <dd className="mt-0.5 font-[family-name:var(--font-space-grotesk)] text-xl font-semibold tabular-nums text-white">{f.value}</dd>
          </div>
        ))}
      </dl>
      {open > 0 && <p className="mt-4 text-xs text-amber-400">{open} register{open === 1 ? "" : "s"} still open today</p>}
    </div>
  );
}
