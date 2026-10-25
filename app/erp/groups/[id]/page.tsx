import Link from "next/link";
import { notFound } from "next/navigation";
import { can, canAny, db, requirePagePermission } from "@/lib/erp/context";
import { formatDate, todayIn, WEEKDAYS } from "@/lib/erp/format";
import type { InstitutionType } from "@/lib/erp/types";
import { Card, DescriptionList, EmptyState, LinkButton, PageHeader, StatusBadge, TypeBadge, cx, focusRing } from "../../_components/ui";
import { AssignPanel, EnrollPanel, UnassignButton, UnenrollButton } from "./Panels";

export const metadata = { title: "Class or batch" };

type Member = { id: string; person_id: string; member_code: string; member_type: string; people: { first_name: string; last_name: string } | null };
const nameOf = (m: Member | null) => (m?.people ? `${m.people.first_name} ${m.people.last_name}`.trim() : "Unknown");

export default async function GroupPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const ctx = await requirePagePermission(["groups.view"]);
  const supabase = await db();
  const { data: g } = await supabase
    .from("learning_groups")
    .select("*, institutions(name, institution_type, timezone, working_days)")
    .eq("id", id)
    .maybeSingle();
  if (!g) notFound();
  const inst = g.institutions as { name: string; institution_type: InstitutionType; timezone: string; working_days: number[] };
  const today = todayIn(inst.timezone);
  const canManage = can(ctx.perms, "groups.manage", g.institution_id);
  const canEnrol = canManage || can(ctx.perms, "students.manage", g.institution_id);

  const memberSel = "id, person_id, member_code, member_type, people(first_name, last_name)";
  const [enrolled, assigned, sessions] = await Promise.all([
    supabase.from("enrollments").select(`id, start_date, end_date, institution_memberships(${memberSel})`).eq("group_id", id)
      .or(`end_date.is.null,end_date.gte.${today}`),
    supabase.from("group_assignments").select(`id, assignment_role, institution_memberships(${memberSel})`).eq("group_id", id),
    supabase.from("attendance_sessions").select("id, session_date, period_label, status").eq("group_id", id)
      .order("session_date", { ascending: false }).limit(10),
  ]);
  type E = { id: string; start_date: string; institution_memberships: Member | null };
  type A = { id: string; assignment_role: string; institution_memberships: Member | null };
  const students = ((enrolled.data ?? []) as unknown as E[]).sort((a, b) => nameOf(a.institution_memberships).localeCompare(nameOf(b.institution_memberships)));
  const staff = (assigned.data ?? []) as unknown as A[];

  // Candidates for enrolment / assignment (only loaded for managers).
  let studentCandidates: { id: string; name: string; code: string }[] = [];
  let staffCandidates: { id: string; name: string; code: string }[] = [];
  if (canEnrol || canManage) {
    const { data: pool } = await supabase.from("institution_memberships").select(memberSel)
      .eq("institution_id", g.institution_id).eq("status", "active").limit(2000);
    const enrolledIds = new Set(students.map((s) => s.institution_memberships?.id));
    const assignedIds = new Set(staff.map((s) => s.institution_memberships?.id));
    const all = (pool ?? []) as unknown as Member[];
    const toOpt = (m: Member) => ({ id: m.id, name: nameOf(m), code: m.member_code });
    studentCandidates = all.filter((m) => m.member_type === "student" && !enrolledIds.has(m.id)).map(toOpt).sort((a, b) => a.name.localeCompare(b.name));
    staffCandidates = all.filter((m) => m.member_type !== "student" && !assignedIds.has(m.id)).map(toOpt).sort((a, b) => a.name.localeCompare(b.name));
  }

  const days = (g.meeting_days as number[] | null) ?? inst.working_days;
  const canMark = canAny(ctx.perms, ["attendance.mark"], g.institution_id) ||
    (can(ctx.perms, "attendance.mark_assigned", g.institution_id) &&
      staff.some((s) => ctx.personId !== null && s.institution_memberships?.person_id === ctx.personId));

  return (
    <>
      <PageHeader
        title={g.name}
        description={<span className="flex flex-wrap items-center gap-2"><TypeBadge type={inst.institution_type} />{inst.name}</span>}
        crumbs={[{ href: "/erp/groups", label: "Classes & Batches" }, { href: `/erp/institutions/${g.institution_id}`, label: inst.name }, { label: g.name }]}
        actions={canMark ? <LinkButton href={`/erp/attendance/register?institution=${g.institution_id}&group=${id}&date=${today}`}>Take today’s register</LinkButton> : undefined}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card title="Details" className="lg:col-span-1">
          <DescriptionList items={[
            { label: "Type", value: g.group_type === "batch" ? "Batch" : "Class section" },
            { label: "Academic year", value: g.academic_year },
            { label: "Grade / section", value: [g.grade, g.section].filter(Boolean).join(" / ") || null },
            { label: "Capacity", value: g.capacity ? `${students.length} / ${g.capacity}` : `${students.length} enrolled` },
            { label: "Meets", value: WEEKDAYS.filter((d) => days.includes(d.n)).map((d) => d.short).join(", ") },
            { label: "Time", value: g.start_time ? `${g.start_time.slice(0, 5)}–${(g.end_time ?? "").slice(0, 5)}` : null },
          ]} />
        </Card>

        <Card title={`Students (${students.length})`} className="lg:col-span-2">
          {students.length === 0 ? (
            <EmptyState title="No students enrolled" />
          ) : (
            <ul className="divide-y divide-zinc-800/60">
              {students.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                  <Link href={`/erp/people/${s.institution_memberships?.id}`} className={cx("hover:underline", focusRing)}>
                    {nameOf(s.institution_memberships)} <span className="font-mono text-xs text-zinc-500">{s.institution_memberships?.member_code}</span>
                  </Link>
                  {canEnrol && <UnenrollButton enrollmentId={s.id} groupId={id} institutionId={g.institution_id} name={nameOf(s.institution_memberships)} />}
                </li>
              ))}
            </ul>
          )}
          {canEnrol && <EnrollPanel groupId={id} institutionId={g.institution_id} candidates={studentCandidates} />}
        </Card>

        <Card title="Teachers & instructors" className="lg:col-span-1">
          {staff.length === 0 ? (
            <EmptyState title="Nobody assigned">Assigned teachers can take this group’s register.</EmptyState>
          ) : (
            <ul className="divide-y divide-zinc-800/60">
              {staff.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                  <span>{nameOf(s.institution_memberships)} <span className="text-xs text-zinc-500">· {s.assignment_role}</span></span>
                  {canManage && <UnassignButton assignmentId={s.id} groupId={id} institutionId={g.institution_id} name={nameOf(s.institution_memberships)} />}
                </li>
              ))}
            </ul>
          )}
          {canManage && <AssignPanel groupId={id} institutionId={g.institution_id} candidates={staffCandidates} />}
        </Card>

        <Card title="Recent registers" className="lg:col-span-2">
          {(sessions.data ?? []).length === 0 ? (
            <EmptyState title="No registers yet" />
          ) : (
            <ul className="divide-y divide-zinc-800/60">
              {(sessions.data ?? []).map((s) => (
                <li key={s.id} className="flex items-center justify-between py-2 text-sm">
                  <Link href={`/erp/attendance/register/${s.id}`} className={cx("hover:underline", focusRing)}>
                    {formatDate(s.session_date)}{s.period_label ? ` · ${s.period_label}` : ""}
                  </Link>
                  <StatusBadge status={s.status} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
