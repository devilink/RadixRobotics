import { notFound } from "next/navigation";
import { can, db, requirePagePermission } from "@/lib/erp/context";
import { addDays, formatDate, formatDateTime, todayIn } from "@/lib/erp/format";
import { VIEW_ATTENDANCE_PERMS, MARK_PERMS } from "@/lib/erp/permissions";
import type { AttendanceKind, InstitutionType } from "@/lib/erp/types";
import { Card, PageHeader, StatusBadge, TypeBadge } from "../../../_components/ui";
import { RegisterEditor, type EditorFlags, type RosterRow } from "./RegisterEditor";

export const metadata = { title: "Register" };

export default async function RegisterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const ctx = await requirePagePermission([...VIEW_ATTENDANCE_PERMS, ...MARK_PERMS]);
  const supabase = await db();

  const { data: s } = await supabase
    .from("attendance_sessions")
    .select("*, institutions(id, name, institution_type, timezone, attendance_backdate_days, require_correction_approval), learning_groups(id, name)")
    .eq("id", id)
    .maybeSingle();
  if (!s) notFound();
  const inst = s.institutions as { id: string; name: string; institution_type: InstitutionType; timezone: string; attendance_backdate_days: number; require_correction_approval: boolean };
  const group = s.learning_groups as { id: string; name: string } | null;
  const kind = s.kind as AttendanceKind;

  const [{ data: roster, error }, { data: pending }, { data: people }] = await Promise.all([
    supabase.rpc("erp_register_roster", { p_session: id }),
    supabase.from("attendance_correction_requests").select("record_id, attendance_records!inner(session_id)").eq("status", "pending").eq("attendance_records.session_id", id),
    supabase.from("profiles").select("id, full_name, email").in("id", [s.created_by, s.submitted_by, s.finalized_by].filter(Boolean)),
  ]);
  if (error) throw new Error("Could not load the register roster");
  const pendingIds = new Set((pending ?? []).map((p) => p.record_id as string));
  const rows: RosterRow[] = ((roster ?? []) as Omit<RosterRow, "pending_correction">[]).map((r) => ({
    ...r, pending_correction: !!r.record_id && pendingIds.has(r.record_id),
  }));
  const who = (uid: string | null) => {
    const p = (people ?? []).find((x) => x.id === uid);
    return p ? p.full_name || p.email : null;
  };

  // UI flags. The database re-checks all of these on every write.
  const today = todayIn(inst.timezone);
  const markPerm = kind === "student" ? can(ctx.perms, "attendance.mark", inst.id) || can(ctx.perms, "attendance.mark_assigned", inst.id) : can(ctx.perms, "staff_attendance.mark", inst.id);
  const correctPerm = can(ctx.perms, kind === "student" ? "attendance.correct" : "staff_attendance.correct", inst.id);
  const approvePerm = can(ctx.perms, kind === "student" ? "attendance.approve" : "staff_attendance.approve", inst.id);
  const withinWindow = s.session_date >= addDays(today, -inst.attendance_backdate_days) || correctPerm;
  const finalized = s.status === "finalized";
  const editable = markPerm && !finalized && withinWindow;
  const flags: EditorFlags = {
    editable,
    canSubmit: markPerm,
    canFinalize: can(ctx.perms, kind === "student" ? "attendance.finalize" : "staff_attendance.approve", inst.id) && s.status === "submitted",
    correctionMode: !editable
      ? correctPerm && (!inst.require_correction_approval || approvePerm) ? "direct" : markPerm || correctPerm ? "request" : null
      : null,
    showTimesDefault: kind === "staff" || inst.institution_type === "learning_center",
    readOnlyReason: finalized
      ? "This register is finalised. Use a correction to change an entry; every correction is logged with a reason."
      : !withinWindow ? `This register is older than ${inst.attendance_backdate_days} days. Ask an authorised user to correct it.`
      : !markPerm ? "You can view this register but not mark it." : undefined,
  };
  const title = kind === "staff" ? "Teachers & staff register" : group?.name ?? "Register";

  return (
    <>
      <PageHeader
        title={`${title}${s.period_label ? ` · ${s.period_label}` : ""}`}
        description={<span className="flex flex-wrap items-center gap-2">{formatDate(s.session_date)} · {inst.name} <TypeBadge type={inst.institution_type} /> <StatusBadge status={s.status} /></span>}
        crumbs={[{ href: "/erp/attendance/register", label: "Daily Register" }, { href: `/erp/institutions/${inst.id}`, label: inst.name }, { label: title }]}
      />
      <Card>
        <RegisterEditor
          sessionId={id} kind={kind} timezone={inst.timezone} sessionStatus={s.status} rows={rows} flags={flags}
        />
      </Card>
      <p className="mt-4 text-xs text-zinc-500">
        Opened {formatDateTime(s.created_at, inst.timezone)}{who(s.created_by) ? ` by ${who(s.created_by)}` : ""}
        {s.submitted_at && ` · Submitted ${formatDateTime(s.submitted_at, inst.timezone)}${who(s.submitted_by) ? ` by ${who(s.submitted_by)}` : ""}`}
        {s.finalized_at && ` · Finalised ${formatDateTime(s.finalized_at, inst.timezone)}${who(s.finalized_by) ? ` by ${who(s.finalized_by)}` : ""}`}
        {" "}· Times shown in {inst.timezone}.
      </p>
    </>
  );
}
