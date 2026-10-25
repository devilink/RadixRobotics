import Link from "next/link";
import { notFound } from "next/navigation";
import { can, canAny, db, requirePagePermission } from "@/lib/erp/context";
import { addDays, formatPct, formatDate, todayIn, WEEKDAYS } from "@/lib/erp/format";
import type { InstitutionType } from "@/lib/erp/types";
import {
  Card, DescriptionList, EmptyState, LinkButton, PageHeader, StatCard, StatusBadge, Table, TypeBadge, cx, focusRing, td, th,
} from "../../_components/ui";
import { CampusForm, DeleteShiftButton, ShiftForm } from "./Subforms";

export const metadata = { title: "Institution" };

export default async function InstitutionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const ctx = await requirePagePermission(["institutions.view", "self.view"]);
  const supabase = await db();

  const { data: inst } = await supabase.from("institutions").select("*").eq("id", id).maybeSingle();
  if (!inst) notFound();
  const type = inst.institution_type as InstitutionType;
  const isSchool = type === "school";
  const today = todayIn(inst.timezone);
  const showStudents = canAny(ctx.perms, ["students.view", "students.view_assigned"], id);
  const showStaff = can(ctx.perms, "staff.view", id);
  const showAttendance = canAny(ctx.perms, ["attendance.view", "attendance.view_assigned"], id);

  const [campuses, groups, shifts, counts, daily] = await Promise.all([
    supabase.from("campuses").select("id, name, city, is_primary, status").eq("institution_id", id).order("is_primary", { ascending: false }).order("name"),
    supabase.from("learning_groups").select("id, name, group_type, academic_year, status, meeting_days").eq("institution_id", id).eq("status", "active").order("name"),
    showStaff ? supabase.from("work_shifts").select("id, name, start_time, end_time, grace_minutes, days_of_week").eq("institution_id", id).order("start_time") : Promise.resolve({ data: [] }),
    supabase.rpc("erp_institution_list", { p_category: "all", p_query: inst.code, p_status: null }),
    showAttendance && type !== "head_office"
      ? supabase.rpc("erp_attendance_daily", { p_institution: id, p_kind: "student", p_from: addDays(today, -29), p_to: today })
      : Promise.resolve({ data: [] }),
  ]);
  const c = ((counts.data ?? []) as { id: string; students: number; staff: number; groups: number }[]).find((r) => r.id === id);
  const dailyRows = (daily.data ?? []) as { day: string; registers: number; submitted: number; marked: number; present: number; absent: number; late: number; rate: string | null }[];
  const groupLabel = isSchool ? "Classes & sections" : "Batches";

  return (
    <>
      <PageHeader
        title={inst.name}
        description={<span className="flex flex-wrap items-center gap-2"><TypeBadge type={type} /><StatusBadge status={inst.status} /><span className="font-mono text-xs">{inst.code}</span></span>}
        crumbs={[{ href: "/erp/institutions", label: "Institutions" }, { label: inst.name }]}
        actions={
          <>
            {canAny(ctx.perms, ["attendance.mark", "attendance.mark_assigned", "staff_attendance.mark"], id) && (
              <LinkButton href={`/erp/attendance/register?institution=${id}`}>Take attendance</LinkButton>
            )}
            {can(ctx.perms, "institutions.manage", id) && <LinkButton variant="secondary" href={`/erp/institutions/${id}/edit`}>Edit</LinkButton>}
          </>
        }
      />

      <section aria-label="Summary" className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {showStudents && <StatCard label="Active students" value={c?.students ?? 0} href={`/erp/people?type=students&institution=${id}`} />}
        {showStaff && <StatCard label="Teachers & staff" value={c?.staff ?? 0} href={`/erp/people?type=staff&institution=${id}`} />}
        {type !== "head_office" && <StatCard label={groupLabel} value={c?.groups ?? 0} href={`/erp/groups?institution=${id}`} />}
      </section>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Details">
          <DescriptionList items={[
            { label: "Email", value: inst.email },
            { label: "Phone", value: inst.phone },
            { label: "Address", value: [inst.address_line, inst.city, inst.state, inst.postal_code].filter(Boolean).join(", ") || null },
            { label: "Time zone", value: inst.timezone },
            { label: "Working days", value: WEEKDAYS.filter((d) => inst.working_days.includes(d.n)).map((d) => d.short).join(", ") },
            { label: "Back-date window", value: `${inst.attendance_backdate_days} days` },
            { label: "Corrections", value: inst.require_correction_approval ? "Always require approval" : "Authorised staff may correct directly" },
          ]} />
        </Card>

        <Card title="Campuses & locations">
          {(campuses.data ?? []).length === 0 ? (
            <EmptyState title="No campuses yet" />
          ) : (
            <ul className="divide-y divide-zinc-800/60">
              {(campuses.data ?? []).map((cp) => (
                <li key={cp.id} className="flex items-center justify-between py-2 text-sm">
                  <span>{cp.name}{cp.city ? <span className="text-zinc-500"> · {cp.city}</span> : null}</span>
                  {cp.is_primary && <StatusBadge status="primary" />}
                </li>
              ))}
            </ul>
          )}
          {can(ctx.perms, "institutions.manage", id) && <CampusForm institutionId={id} />}
        </Card>

        {type !== "head_office" && (
          <Card title={groupLabel} actions={can(ctx.perms, "groups.manage", id) ? <LinkButton size="sm" href={`/erp/groups/new?institution=${id}`}>New {isSchool ? "class" : "batch"}</LinkButton> : undefined}>
            {(groups.data ?? []).length === 0 ? (
              <EmptyState title={`No ${groupLabel.toLowerCase()} yet`} />
            ) : (
              <ul className="divide-y divide-zinc-800/60">
                {(groups.data ?? []).map((g) => (
                  <li key={g.id} className="flex items-center justify-between py-2 text-sm">
                    <Link href={`/erp/groups/${g.id}`} className={cx("font-medium hover:underline", focusRing)}>{g.name}</Link>
                    <span className="text-xs text-zinc-500">{g.academic_year ?? ""}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        )}

        {showStaff && (
          <Card title="Work shifts">
            {(shifts.data ?? []).length === 0 ? (
              <EmptyState title="No shifts defined">Shifts let the staff register flag late arrivals automatically.</EmptyState>
            ) : (
              <ul className="divide-y divide-zinc-800/60">
                {(shifts.data as { id: string; name: string; start_time: string; end_time: string; grace_minutes: number; days_of_week: number[] }[]).map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                    <span>
                      <span className="font-medium">{s.name}</span>{" "}
                      <span className="text-zinc-500">{s.start_time.slice(0, 5)}–{s.end_time.slice(0, 5)} · {s.grace_minutes} min grace · {WEEKDAYS.filter((d) => s.days_of_week.includes(d.n)).map((d) => d.short).join(" ")}</span>
                    </span>
                    {can(ctx.perms, "staff.manage", id) && <DeleteShiftButton id={s.id} institutionId={id} name={s.name} />}
                  </li>
                ))}
              </ul>
            )}
            {can(ctx.perms, "staff.manage", id) && <ShiftForm institutionId={id} />}
          </Card>
        )}
      </div>

      {showAttendance && type !== "head_office" && (
        <Card className="mt-6" title="Student attendance · last 30 days"
          actions={<LinkButton size="sm" variant="secondary" href={`/erp/attendance/reports?institution=${id}`}>Full report</LinkButton>}>
          {dailyRows.length === 0 ? (
            <EmptyState title="No registers in the last 30 days" />
          ) : (
            <Table caption="Daily attendance">
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
                {[...dailyRows].reverse().map((d) => (
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
          )}
        </Card>
      )}
    </>
  );
}
