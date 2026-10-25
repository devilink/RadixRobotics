import Link from "next/link";
import { can, db, getCategory, requirePagePermission } from "@/lib/erp/context";
import { formatDate, formatDateTime } from "@/lib/erp/format";
import type { AttendanceStatus, InstitutionType } from "@/lib/erp/types";
import { AttendanceBadge, Card, EmptyState, PageHeader, StatusBadge, Table, cx, focusRing, td, th } from "../../_components/ui";
import { reviewCorrection } from "../actions";
import { ReviewForm } from "./ReviewForm";

export const metadata = { title: "Attendance corrections" };

type Req = {
  id: string; institution_id: string; requested_status: AttendanceStatus; reason: string; status: string;
  requested_by: string; requested_at: string; reviewed_at: string | null; review_note: string | null;
  institutions: { name: string; institution_type: InstitutionType; timezone: string } | null;
  attendance_records: {
    status: AttendanceStatus; kind: "student" | "staff";
    institution_memberships: { id: string; member_code: string; people: { first_name: string; last_name: string } | null } | null;
    attendance_sessions: { id: string; session_date: string; period_label: string; learning_groups: { name: string } | null } | null;
  } | null;
};

export default async function CorrectionsPage() {
  const ctx = await requirePagePermission(["attendance.approve", "staff_attendance.approve", "attendance.mark", "attendance.mark_assigned", "staff_attendance.mark"]);
  const category = await getCategory();
  const supabase = await db();
  const sel = `id, institution_id, requested_status, reason, status, requested_by, requested_at, reviewed_at, review_note,
    institutions!inner(name, institution_type, timezone),
    attendance_records(status, kind, institution_memberships(id, member_code, people(first_name, last_name)),
      attendance_sessions(id, session_date, period_label, learning_groups(name)))`;
  let pq = supabase.from("attendance_correction_requests").select(sel).eq("status", "pending").order("requested_at").limit(200);
  let rq = supabase.from("attendance_correction_requests").select(sel).neq("status", "pending").order("reviewed_at", { ascending: false }).limit(25);
  if (category !== "all") {
    pq = pq.eq("institutions.institution_type", category);
    rq = rq.eq("institutions.institution_type", category);
  }
  const [{ data: pending }, { data: recent }] = await Promise.all([pq, rq]);

  const nameOf = (r: Req) => {
    const p = r.attendance_records?.institution_memberships?.people;
    return p ? `${p.first_name} ${p.last_name}`.trim() : "—";
  };
  const register = (r: Req) => {
    const s = r.attendance_records?.attendance_sessions;
    if (!s) return "—";
    return (
      <Link href={`/erp/attendance/register/${s.id}`} className={cx("hover:underline", focusRing)}>
        {formatDate(s.session_date)} · {s.learning_groups?.name ?? "Staff register"}
      </Link>
    );
  };
  const canReview = (r: Req) =>
    r.requested_by !== ctx.userId &&
    can(ctx.perms, r.attendance_records?.kind === "staff" ? "staff_attendance.approve" : "attendance.approve", r.institution_id);

  return (
    <>
      <PageHeader
        title="Attendance Corrections"
        description="Changes to finalised registers. Approving applies the change and records the reason in the audit log. You cannot review your own requests."
        crumbs={[{ href: "/erp/attendance", label: "Attendance" }, { label: "Corrections" }]}
      />
      <Card title={`Pending (${(pending ?? []).length})`}>
        {(pending ?? []).length === 0 ? (
          <EmptyState title="No pending correction requests" />
        ) : (
          <Table caption="Pending corrections">
            <thead>
              <tr>
                <th className={th}>Person</th>
                <th className={th}>Register</th>
                <th className={th}>Change</th>
                <th className={th}>Reason</th>
                <th className={th}>Requested</th>
                <th className={th}><span className="sr-only">Review</span></th>
              </tr>
            </thead>
            <tbody>
              {((pending ?? []) as unknown as Req[]).map((r) => (
                <tr key={r.id} className="align-top">
                  <td className={td}>
                    <p className="font-medium">{nameOf(r)}</p>
                    <p className="text-xs text-zinc-500">{r.institutions?.name}</p>
                  </td>
                  <td className={td}>{register(r)}</td>
                  <td className={td}>
                    <span className="flex items-center gap-1"><AttendanceBadge status={r.attendance_records?.status ?? null} /> → <AttendanceBadge status={r.requested_status} /></span>
                  </td>
                  <td className={cx(td, "max-w-xs")}>{r.reason}</td>
                  <td className={cx(td, "text-xs text-zinc-400")}>{formatDateTime(r.requested_at, r.institutions?.timezone)}{r.requested_by === ctx.userId && <p>(you)</p>}</td>
                  <td className={cx(td, "w-56")}>
                    {canReview(r) ? <ReviewForm id={r.id} action={reviewCorrection} /> : <span className="text-xs text-zinc-500">Awaiting an approver</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      <Card className="mt-6" title="Recently reviewed">
        {(recent ?? []).length === 0 ? (
          <EmptyState title="No reviewed requests yet" />
        ) : (
          <Table caption="Reviewed corrections">
            <thead>
              <tr>
                <th className={th}>Person</th>
                <th className={th}>Register</th>
                <th className={th}>Requested</th>
                <th className={th}>Decision</th>
                <th className={th}>Note</th>
              </tr>
            </thead>
            <tbody>
              {((recent ?? []) as unknown as Req[]).map((r) => (
                <tr key={r.id}>
                  <td className={td}>{nameOf(r)}</td>
                  <td className={td}>{register(r)}</td>
                  <td className={td}><AttendanceBadge status={r.requested_status} /></td>
                  <td className={td}><StatusBadge status={r.status} /> <span className="text-xs text-zinc-500">{formatDateTime(r.reviewed_at, r.institutions?.timezone)}</span></td>
                  <td className={cx(td, "text-zinc-400")}>{r.review_note ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </>
  );
}
