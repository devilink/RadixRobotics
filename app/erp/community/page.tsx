import Link from "next/link";
import { db } from "@/lib/erp/context";
import { requireCommunityPage } from "@/lib/erp/community";
import { formatDateTime, str } from "@/lib/erp/format";
import { COMMUNITY_STATUSES, COMMUNITY_STATUS_LABELS, type CommunityStatus } from "@/lib/community";
import { Card, EmptyState, Notice, PageHeader, StatCard, Table, buttonClass, cx, focusRing, inputClass, td, th } from "../_components/ui";
import { CommunityStatusBadge } from "./bits";

export const metadata = { title: "Community applications" };

type Row = {
  id: string; full_name: string; email: string; phone: string; status: CommunityStatus;
  work_paths: string[]; submitted_at: string | null;
};

export default async function CommunityApplicationsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireCommunityPage();
  const sp = await searchParams;
  const q = (str(sp.q) ?? "").trim().slice(0, 100);
  const status = (COMMUNITY_STATUSES as readonly string[]).includes(str(sp.status) ?? "") ? (str(sp.status) as CommunityStatus) : "";

  const supabase = await db();
  let query = supabase.from("community_applications")
    .select("id, full_name, email, phone, status, work_paths, submitted_at")
    .order("submitted_at", { ascending: false }).limit(500);
  if (status) query = query.eq("status", status);
  const term = q.replace(/[,()*%\\."]/g, " ").trim();
  if (term) query = query.or(["full_name", "email", "phone"].map((c) => `${c}.ilike.*${term}*`).join(","));

  const [{ data, error }, counts] = await Promise.all([
    query,
    supabase.from("community_applications").select("status").limit(5000),
  ]);
  const rows = (data ?? []) as Row[];
  const tally: Record<string, number> = {};
  for (const r of (counts.data ?? []) as { status: string }[]) tally[r.status] = (tally[r.status] ?? 0) + 1;
  const total = Object.values(tally).reduce((a, b) => a + b, 0);
  const missingTable = error?.code === "42P01" || error?.code === "PGRST205";

  return (
    <>
      <PageHeader
        title="Community applications"
        description="People who applied to join the Radix Community from the website. Open one to see their resume and work."
        crumbs={[{ href: "/erp", label: "Dashboard" }, { label: "Community" }]}
      />

      {missingTable ? (
        <Notice tone="warn">
          The community tables aren&apos;t in this database yet. Apply the migration
          <code className="mx-1">20261031090000_community_applications.sql</code> to start receiving applications.
        </Notice>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatCard label="Total" value={total} />
            <StatCard label="New" value={tally.new ?? 0} href="/erp/community?status=new" />
            <StatCard label="Shortlisted" value={tally.shortlisted ?? 0} href="/erp/community?status=shortlisted" />
            <StatCard label="Accepted" value={tally.accepted ?? 0} href="/erp/community?status=accepted" />
          </div>

          <Card>
            <form className="mb-4 flex flex-col flex-wrap gap-2 sm:flex-row" role="search">
              <label htmlFor="q" className="sr-only">Search</label>
              <input id="q" name="q" defaultValue={q} placeholder="Search name, email or phone" className={cx(inputClass, "sm:max-w-xs")} />
              <label htmlFor="status" className="sr-only">Status</label>
              <select id="status" name="status" defaultValue={status} className={cx(inputClass, "sm:w-44")}>
                <option value="">All statuses</option>
                {COMMUNITY_STATUSES.map((s) => <option key={s} value={s}>{COMMUNITY_STATUS_LABELS[s]}</option>)}
              </select>
              <button className={buttonClass("secondary")}>Filter</button>
            </form>

            {error ? (
              <EmptyState title="Applications could not be loaded">Please refresh the page.</EmptyState>
            ) : rows.length === 0 ? (
              <EmptyState title={q || status ? "No applications match these filters" : "No applications yet"}>
                {!q && !status && "Applications sent from the Community page on the website will appear here."}
              </EmptyState>
            ) : (
              <Table caption="Community applications">
                <thead>
                  <tr>
                    <th className={th}>Applicant</th>
                    <th className={th}>Phone</th>
                    <th className={cx(th, "text-right")}>Images</th>
                    <th className={th}>Received</th>
                    <th className={th}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="hover:bg-zinc-800/40">
                      <td className={td}>
                        <Link href={`/erp/community/${r.id}`} className={cx("font-medium text-zinc-100 hover:underline", focusRing)}>{r.full_name}</Link>
                        <p className="text-xs text-zinc-500">{r.email}</p>
                      </td>
                      <td className={cx(td, "text-xs tabular-nums")}>{r.phone}</td>
                      <td className={cx(td, "text-right tabular-nums")}>{r.work_paths.length}</td>
                      <td className={cx(td, "text-xs")}>{formatDateTime(r.submitted_at)}</td>
                      <td className={td}><CommunityStatusBadge status={r.status} /></td>
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
