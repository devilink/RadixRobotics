import { can, db, getCategory, requirePagePermission } from "@/lib/erp/context";
import { formatDate, todayIn } from "@/lib/erp/format";
import { MEMBER_TYPE_LABELS, type MemberType } from "@/lib/erp/types";
import { Card, EmptyState, PageHeader, StatusBadge, Table, cx, td, th } from "../../_components/ui";
import { reviewLeave } from "../actions";
import { ReviewForm } from "../corrections/ReviewForm";
import { CancelLeaveButton, LeaveRequestForm } from "./LeaveForms";

export const metadata = { title: "Leave" };

type Leave = {
  id: string; institution_id: string; membership_id: string; leave_type: string; start_date: string; end_date: string;
  half_day: boolean; reason: string; status: string; requested_at: string; review_note: string | null;
  institutions: { name: string; institution_type: string } | null;
  institution_memberships: { member_code: string; member_type: MemberType; people: { first_name: string; last_name: string } | null } | null;
};

const SEL = "id, institution_id, membership_id, leave_type, start_date, end_date, half_day, reason, status, requested_at, review_note, institutions!inner(name, institution_type), institution_memberships(member_code, member_type, people(first_name, last_name))";

export default async function LeavePage() {
  const ctx = await requirePagePermission(["leave.view", "leave.approve", "self.view"]);
  const category = await getCategory();
  const supabase = await db();

  const mine = ctx.personId
    ? (await supabase.from("institution_memberships").select("id, member_type, institutions(name)")
        .eq("person_id", ctx.personId).neq("member_type", "student").eq("status", "active")).data ?? []
    : [];
  const myIds = mine.map((m) => m.id as string);
  const canView = can(ctx.perms, "leave.view");

  const myReq = myIds.length
    ? (await supabase.from("leave_requests").select(SEL).in("membership_id", myIds).order("start_date", { ascending: false }).limit(20)).data ?? []
    : [];
  let pq = supabase.from("leave_requests").select(SEL).eq("status", "pending").order("start_date").limit(200);
  let rq = supabase.from("leave_requests").select(SEL).neq("status", "pending").order("requested_at", { ascending: false }).limit(25);
  if (category !== "all") {
    pq = pq.eq("institutions.institution_type", category);
    rq = rq.eq("institutions.institution_type", category);
  }
  const [{ data: pending }, { data: recent }] = canView ? await Promise.all([pq, rq]) : [{ data: [] }, { data: [] }];

  const who = (l: Leave) => {
    const p = l.institution_memberships?.people;
    return p ? `${p.first_name} ${p.last_name}`.trim() : "—";
  };
  const dates = (l: Leave) =>
    `${formatDate(l.start_date)}${l.end_date !== l.start_date ? ` – ${formatDate(l.end_date)}` : ""}${l.half_day ? " (half day)" : ""}`;
  const today = todayIn();

  return (
    <>
      <PageHeader
        title="Leave"
        description="Approved leave shows on staff registers so the person can be marked On Leave."
        crumbs={[{ href: "/erp/attendance", label: "Attendance" }, { label: "Leave" }]}
      />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {mine.length > 0 && (
          <Card title="Request leave" className="lg:col-span-2">
            <LeaveRequestForm memberships={mine.map((m) => ({
              id: m.id as string,
              label: `${MEMBER_TYPE_LABELS[m.member_type as MemberType]} · ${(m.institutions as unknown as { name: string } | null)?.name ?? ""}`,
            }))} />
          </Card>
        )}
        {mine.length > 0 && (
          <Card title="My requests" className="lg:col-span-3">
            {myReq.length === 0 ? (
              <EmptyState title="You have no leave requests" />
            ) : (
              <ul className="divide-y divide-zinc-800/60 text-sm">
                {(myReq as unknown as Leave[]).map((l) => (
                  <li key={l.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                    <span><span className="capitalize">{l.leave_type}</span> · {dates(l)}</span>
                    <span className="flex items-center gap-2">
                      <StatusBadge status={l.status} />
                      {(l.status === "pending" || (l.status === "approved" && l.start_date > today)) && <CancelLeaveButton id={l.id} />}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        )}
        {mine.length === 0 && !canView && (
          <Card className="lg:col-span-5"><EmptyState title="No staff record is linked to your account">Ask an administrator to link your login to your staff record.</EmptyState></Card>
        )}
      </div>

      {canView && (
        <>
          <Card className="mt-6" title={`Pending approval (${(pending ?? []).length})`}>
            {(pending ?? []).length === 0 ? (
              <EmptyState title="No pending leave requests" />
            ) : (
              <Table caption="Pending leave">
                <thead>
                  <tr><th className={th}>Person</th><th className={th}>Dates</th><th className={th}>Type</th><th className={th}>Reason</th><th className={th}><span className="sr-only">Review</span></th></tr>
                </thead>
                <tbody>
                  {((pending ?? []) as unknown as Leave[]).map((l) => (
                    <tr key={l.id} className="align-top">
                      <td className={td}><p className="font-medium">{who(l)}</p><p className="text-xs text-zinc-500">{l.institutions?.name}</p></td>
                      <td className={td}>{dates(l)}</td>
                      <td className={cx(td, "capitalize")}>{l.leave_type}</td>
                      <td className={cx(td, "max-w-xs")}>{l.reason}</td>
                      <td className={cx(td, "w-56")}>
                        {can(ctx.perms, "leave.approve", l.institution_id) && !myIds.includes(l.membership_id)
                          ? <ReviewForm id={l.id} action={reviewLeave} />
                          : <span className="text-xs text-zinc-500">Awaiting an approver</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card>
          <Card className="mt-6" title="Recent decisions">
            {(recent ?? []).length === 0 ? (
              <EmptyState title="No decisions yet" />
            ) : (
              <Table caption="Recent leave decisions">
                <thead><tr><th className={th}>Person</th><th className={th}>Dates</th><th className={th}>Type</th><th className={th}>Status</th><th className={th}>Note</th></tr></thead>
                <tbody>
                  {((recent ?? []) as unknown as Leave[]).map((l) => (
                    <tr key={l.id}>
                      <td className={td}>{who(l)}</td>
                      <td className={td}>{dates(l)}</td>
                      <td className={cx(td, "capitalize")}>{l.leave_type}</td>
                      <td className={td}><StatusBadge status={l.status} /></td>
                      <td className={cx(td, "text-zinc-400")}>{l.review_note ?? ""}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card>
        </>
      )}
    </>
  );
}
