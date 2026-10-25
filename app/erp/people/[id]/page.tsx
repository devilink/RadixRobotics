import Link from "next/link";
import { notFound } from "next/navigation";
import { can, db, requirePagePermission } from "@/lib/erp/context";
import { addDays, formatDate, formatPct, str, todayIn } from "@/lib/erp/format";
import { ATTENDANCE_STATUSES, ATTENDANCE_STATUS_LABELS, MEMBER_TYPE_LABELS, type AttendanceStatus, type InstitutionType, type MemberType } from "@/lib/erp/types";
import { AttendanceBadge, Card, DescriptionList, EmptyState, LinkButton, Notice, PageHeader, StatusBadge, Table, TypeBadge, cx, focusRing, td, th } from "../../_components/ui";
import { Guardians, type GuardianRow } from "./Guardians";

export const metadata = { title: "Person" };

export default async function PersonPage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const ctx = await requirePagePermission(["students.view", "students.view_assigned", "staff.view", "self.view"]);
  const supabase = await db();

  const { data: m } = await supabase
    .from("institution_memberships")
    .select("*, people(*), institutions(id, name, institution_type, timezone), campuses(name), student_profiles(*), employee_profiles(*, work_shifts(name))")
    .eq("id", id)
    .maybeSingle();
  if (!m) notFound();

  const person = m.people as { id: string; first_name: string; last_name: string; email: string | null; phone: string | null };
  const inst = m.institutions as { id: string; name: string; institution_type: InstitutionType; timezone: string };
  const type = m.member_type as MemberType;
  const isStudent = type === "student";
  const sp_ = (Array.isArray(m.student_profiles) ? m.student_profiles[0] : m.student_profiles) as { registration_number: string | null; admission_date: string | null } | null;
  const ep = (Array.isArray(m.employee_profiles) ? m.employee_profiles[0] : m.employee_profiles) as
    { department: string | null; position: string | null; employment_type: string | null; qualifications: string | null; work_shifts: { name: string } | null } | null;
  const today = todayIn(inst.timezone);
  const from = addDays(today, -89);
  const name = `${person.first_name} ${person.last_name}`.trim();

  const [others, groups, records, guardians, leave] = await Promise.all([
    supabase.from("institution_memberships").select("id, member_type, member_code, status, institutions(name, institution_type)")
      .eq("person_id", person.id).neq("id", id),
    isStudent
      ? supabase.from("enrollments").select("id, start_date, end_date, learning_groups(id, name)").eq("membership_id", id).order("start_date", { ascending: false })
      : supabase.from("group_assignments").select("id, assignment_role, learning_groups(id, name)").eq("membership_id", id),
    supabase.from("attendance_records")
      .select("id, status, remarks, corrected_at, attendance_sessions!inner(id, session_date, period_label, learning_groups(name))")
      .eq("membership_id", id).gte("attendance_sessions.session_date", from)
      .limit(500),
    isStudent
      ? supabase.from("guardian_student_relationships").select("relationship, is_primary_contact, guardians(id, full_name, phone, email)").eq("student_membership_id", id)
      : Promise.resolve({ data: null }),
    !isStudent
      ? supabase.from("leave_requests").select("id, leave_type, start_date, end_date, status").eq("membership_id", id).order("start_date", { ascending: false }).limit(10)
      : Promise.resolve({ data: null }),
  ]);

  type Rec = { id: string; status: AttendanceStatus; remarks: string | null; corrected_at: string | null;
    attendance_sessions: { id: string; session_date: string; period_label: string; learning_groups: { name: string } | null } };
  const recs = ((records.data ?? []) as unknown as Rec[]).sort((a, b) => b.attendance_sessions.session_date.localeCompare(a.attendance_sessions.session_date));
  const counts = Object.fromEntries(ATTENDANCE_STATUSES.map((s) => [s, recs.filter((r) => r.status === s).length])) as Record<AttendanceStatus, number>;
  const expected = recs.length - counts.excused - counts.on_leave;
  const rate = expected > 0 ? Math.round((1000 * (counts.present + counts.late + 0.5 * counts.half_day)) / expected) / 10 : null;
  const guardianRows: GuardianRow[] = ((guardians.data ?? []) as unknown as { relationship: string; is_primary_contact: boolean; guardians: Omit<GuardianRow, "relationship" | "is_primary_contact"> }[])
    .map((g) => ({ ...g.guardians, relationship: g.relationship, is_primary_contact: g.is_primary_contact }));
  const canEdit = can(ctx.perms, isStudent ? "students.manage" : "staff.manage", inst.id);
  const canSeeGuardians = isStudent && can(ctx.perms, "students.view", inst.id);
  const listHref = isStudent ? "/erp/people?type=students" : "/erp/people?type=staff";

  return (
    <>
      <PageHeader
        title={name}
        description={<span className="flex flex-wrap items-center gap-2">{MEMBER_TYPE_LABELS[type]} · <span className="font-mono">{m.member_code}</span> · {inst.name} <TypeBadge type={inst.institution_type} /> <StatusBadge status={m.status} /></span>}
        crumbs={[{ href: listHref, label: isStudent ? "Students" : "Teachers & Staff" }, { label: name }]}
        actions={
          <>
            {can(ctx.perms, "users.manage", inst.id) && (
              <LinkButton variant="secondary" href={`/erp/admin/users?link=${id}`}>Create login</LinkButton>
            )}
            {canEdit && <LinkButton variant="secondary" href={`/erp/people/${id}/edit`}>Edit</LinkButton>}
          </>
        }
      />
      {str(sp.created) && <div className="mb-4"><Notice tone="success">Record created.{isStudent ? " Enrol the student in a class or batch so they appear on registers." : ""}</Notice></div>}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card title="Profile" className="lg:col-span-2">
          <DescriptionList items={[
            { label: "Email", value: person.email },
            { label: "Phone", value: person.phone },
            { label: "Institution", value: <Link className={cx("hover:underline", focusRing)} href={`/erp/institutions/${inst.id}`}>{inst.name}</Link> },
            { label: "Campus", value: (m.campuses as { name: string } | null)?.name ?? null },
            { label: "Start date", value: formatDate(m.start_date) },
            { label: "End date", value: m.end_date ? formatDate(m.end_date) : null },
            ...(isStudent ? [
              { label: "Registration no.", value: sp_?.registration_number ?? null },
              { label: "Admission date", value: sp_?.admission_date ? formatDate(sp_.admission_date) : null },
            ] : ep ? [
              { label: "Department", value: ep.department },
              { label: "Position", value: ep.position },
              { label: "Employment", value: ep.employment_type?.replace("_", "-") ?? null },
              { label: "Shift", value: ep.work_shifts?.name ?? null },
            ] : []),
          ]} />
          {!isStudent && !ep && <p className="mt-3 text-xs text-zinc-500">HR details are only visible to HR-authorised users.</p>}
        </Card>

        <Card title={isStudent ? "Classes & batches" : "Assigned classes & batches"}>
          {(groups.data ?? []).length === 0 ? (
            <p className="text-sm text-zinc-500">None.</p>
          ) : (
            <ul className="divide-y divide-zinc-800/60 text-sm">
              {((groups.data ?? []) as unknown as { id: string; end_date?: string | null; assignment_role?: string; learning_groups: { id: string; name: string } | null }[]).map((g) => (
                <li key={g.id} className="flex items-center justify-between py-2">
                  <Link href={`/erp/groups/${g.learning_groups?.id}`} className={cx("hover:underline", focusRing)}>{g.learning_groups?.name}</Link>
                  <span className="text-xs text-zinc-500">{g.assignment_role ?? (g.end_date && g.end_date < today ? `ended ${formatDate(g.end_date)}` : "current")}</span>
                </li>
              ))}
            </ul>
          )}
          {(others.data ?? []).length > 0 && (
            <div className="mt-4 border-t border-zinc-800/60 pt-3">
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-zinc-500">Other roles for this person</p>
              <ul className="space-y-1 text-sm">
                {((others.data ?? []) as unknown as { id: string; member_type: MemberType; member_code: string; institutions: { name: string } | null }[]).map((o) => (
                  <li key={o.id}>
                    <Link href={`/erp/people/${o.id}`} className={cx("hover:underline", focusRing)}>{MEMBER_TYPE_LABELS[o.member_type]} at {o.institutions?.name}</Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>

        <Card title="Attendance · last 90 days" className="lg:col-span-2">
          <div className="mb-4 grid grid-cols-3 gap-3 sm:grid-cols-6">
            <div className="col-span-3 rounded-xl border border-zinc-800/50 bg-zinc-950/40 p-3 sm:col-span-2">
              <p className="text-xs text-zinc-500">Attendance rate</p>
              <p className="text-2xl font-semibold tabular-nums">{formatPct(rate)}</p>
              <p className="text-xs text-zinc-500">{recs.length} register entries</p>
            </div>
            {(isStudent ? ["present", "absent", "late", "excused"] as const : ["present", "absent", "late", "on_leave"] as const).map((s) => (
              <div key={s} className="rounded-xl border border-zinc-800/50 bg-zinc-950/40 p-3">
                <p className="text-xs text-zinc-500">{ATTENDANCE_STATUS_LABELS[s]}</p>
                <p className="text-lg font-semibold tabular-nums">{counts[s]}</p>
              </div>
            ))}
          </div>
          {recs.length === 0 ? (
            <EmptyState title="No attendance recorded in this period" />
          ) : (
            <Table caption="Recent attendance">
              <thead><tr><th className={th}>Date</th><th className={th}>Register</th><th className={th}>Status</th><th className={th}>Remarks</th></tr></thead>
              <tbody>
                {recs.slice(0, 30).map((r) => (
                  <tr key={r.id}>
                    <td className={td}>
                      <Link href={`/erp/attendance/register/${r.attendance_sessions.id}`} className={cx("hover:underline", focusRing)}>{formatDate(r.attendance_sessions.session_date)}</Link>
                    </td>
                    <td className={td}>{r.attendance_sessions.learning_groups?.name ?? "Staff register"}{r.attendance_sessions.period_label ? ` · ${r.attendance_sessions.period_label}` : ""}</td>
                    <td className={td}><AttendanceBadge status={r.status} />{r.corrected_at && <span className="ml-1 text-xs text-zinc-500">(corrected)</span>}</td>
                    <td className={cx(td, "text-zinc-400")}>{r.remarks ?? ""}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>

        {canSeeGuardians && (
          <Card title="Guardians">
            <Guardians studentId={id} institutionId={inst.id} guardians={guardianRows} canManage={can(ctx.perms, "students.manage", inst.id)} />
          </Card>
        )}

        {!isStudent && leave.data && (
          <Card title="Leave" actions={<LinkButton size="sm" variant="secondary" href="/erp/attendance/leave">Leave requests</LinkButton>}>
            {(leave.data as { id: string; leave_type: string; start_date: string; end_date: string; status: string }[]).length === 0 ? (
              <p className="text-sm text-zinc-500">No leave requests.</p>
            ) : (
              <ul className="divide-y divide-zinc-800/60 text-sm">
                {(leave.data as { id: string; leave_type: string; start_date: string; end_date: string; status: string }[]).map((l) => (
                  <li key={l.id} className="flex items-center justify-between py-2">
                    <span className="capitalize">{l.leave_type} · {formatDate(l.start_date)}{l.end_date !== l.start_date ? ` – ${formatDate(l.end_date)}` : ""}</span>
                    <StatusBadge status={l.status} />
                  </li>
                ))}
              </ul>
            )}
          </Card>
        )}
      </div>
    </>
  );
}
