import { db, requirePagePermission } from "@/lib/erp/context";
import { formatDateTime, str } from "@/lib/erp/format";
import { Badge, Card, EmptyState, PageHeader, Pagination, Table, buttonClass, cx, inputClass, td, th } from "../../_components/ui";

export const metadata = { title: "Audit Log" };

const ENTITY_TYPES = [
  "attendance_records", "attendance_sessions", "attendance_correction_requests", "leave_requests",
  "institution_memberships", "employee_profiles", "enrollments", "institutions", "user_role_assignments",
  "guardians", "profiles", "report_export",
];
const PAGE_SIZE = 50;

type Log = {
  id: number; occurred_at: string; actor_id: string | null; institution_id: string | null; entity_type: string;
  entity_id: string; action: string; reason: string | null; old_data: Record<string, unknown> | null; new_data: Record<string, unknown> | null;
};

function changedFields(l: Log): string[] {
  if (!l.old_data || !l.new_data) return [];
  return Object.keys(l.new_data).filter((k) => !["updated_at", "version"].includes(k) && JSON.stringify(l.old_data![k]) !== JSON.stringify(l.new_data![k]));
}

export default async function AuditPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requirePagePermission(["audit.view"]);
  const sp = await searchParams;
  const entity = ENTITY_TYPES.includes(str(sp.entity) ?? "") ? str(sp.entity)! : "";
  const institution = /^[0-9a-f-]{36}$/i.test(str(sp.institution) ?? "") ? str(sp.institution)! : "";
  const page = Math.max(1, Math.min(500, Number(str(sp.page)) || 1));
  const supabase = await db();

  let q = supabase.from("audit_logs").select("*", { count: "exact" }).order("occurred_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (entity) q = q.eq("entity_type", entity);
  if (institution) q = q.eq("institution_id", institution);
  const [{ data, count }, { data: insts }, { data: actors }] = await Promise.all([
    q,
    supabase.from("institutions").select("id, name").order("name"),
    supabase.from("profiles").select("id, email, full_name"),
  ]);
  const logs = (data ?? []) as Log[];
  const instName = new Map((insts ?? []).map((i) => [i.id, i.name]));
  const actorName = new Map((actors ?? []).map((a) => [a.id, a.full_name || a.email]));
  const hrefFor = (p: number) => `/erp/admin/audit?${new URLSearchParams({ ...(entity && { entity }), ...(institution && { institution }), page: String(p) })}`;

  return (
    <>
      <PageHeader
        title="Audit Log"
        description="Append-only record of changes to attendance, people, roles and exports. Entries cannot be edited or deleted from the application."
        crumbs={[{ href: "/erp", label: "Dashboard" }, { label: "Audit Log" }]}
      />
      <Card>
        <form className="mb-4 flex flex-col gap-2 sm:flex-row">
          <label htmlFor="entity" className="sr-only">Record type</label>
          <select id="entity" name="entity" defaultValue={entity} className={cx(inputClass, "sm:w-64")}>
            <option value="">All record types</option>
            {ENTITY_TYPES.map((e) => <option key={e} value={e}>{e.replace(/_/g, " ")}</option>)}
          </select>
          <label htmlFor="institution" className="sr-only">Institution</label>
          <select id="institution" name="institution" defaultValue={institution} className={cx(inputClass, "sm:w-64")}>
            <option value="">All institutions</option>
            {(insts ?? []).map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
          </select>
          <button className={buttonClass("secondary")}>Filter</button>
        </form>
        {logs.length === 0 ? (
          <EmptyState title="No audit entries match these filters" />
        ) : (
          <>
            <Table caption="Audit entries">
              <thead>
                <tr><th className={th}>When</th><th className={th}>Who</th><th className={th}>What</th><th className={th}>Change</th></tr>
              </thead>
              <tbody>
                {logs.map((l) => {
                  const fields = changedFields(l);
                  return (
                    <tr key={l.id} className="align-top">
                      <td className={cx(td, "whitespace-nowrap text-xs")}>{formatDateTime(l.occurred_at)}</td>
                      <td className={cx(td, "text-xs")}>{l.actor_id ? actorName.get(l.actor_id) ?? `${l.actor_id.slice(0, 8)}…` : "System"}</td>
                      <td className={td}>
                        <Badge tone={l.action === "delete" ? "red" : l.action === "insert" ? "green" : l.action === "export" ? "violet" : "neutral"}>{l.action}</Badge>{" "}
                        <span className="text-xs">{l.entity_type.replace(/_/g, " ")}</span>
                        {l.institution_id && <p className="text-xs text-zinc-500">{instName.get(l.institution_id) ?? ""}</p>}
                      </td>
                      <td className={cx(td, "text-xs")}>
                        {l.entity_type === "attendance_records" && l.old_data && l.new_data && l.old_data.status !== l.new_data.status && (
                          <p>Status: <strong>{String(l.old_data.status)}</strong> → <strong>{String(l.new_data.status)}</strong></p>
                        )}
                        {fields.length > 0 && <p className="text-zinc-400">Changed: {fields.join(", ")}</p>}
                        {l.reason && <p className="text-zinc-200">Reason: {l.reason}</p>}
                        <details className="mt-1">
                          <summary className="cursor-pointer text-zinc-500">Details</summary>
                          <pre className="mt-1 max-h-48 max-w-md overflow-auto rounded-lg border border-zinc-800 bg-zinc-950/60 p-2 text-zinc-300 text-[11px]">{JSON.stringify({ before: l.old_data, after: l.new_data }, null, 2)}</pre>
                        </details>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
            <Pagination page={page} pageSize={PAGE_SIZE} total={count ?? 0} hrefFor={hrefFor} />
          </>
        )}
      </Card>
    </>
  );
}
