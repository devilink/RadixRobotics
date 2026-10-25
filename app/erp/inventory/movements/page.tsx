import Link from "next/link";
import { db } from "@/lib/erp/context";
import { requireInventoryPage } from "@/lib/erp/inventory";
import { institutionOptions } from "@/lib/erp/queries";
import { MOVEMENT_LABELS, MOVEMENT_TYPES, type MovementType } from "@/lib/erp/inventory-types";
import { formatDateTime, str } from "@/lib/erp/format";
import { Card, EmptyState, PageHeader, Pagination, Table, buttonClass, cx, focusRing, inputClass, td, th } from "../../_components/ui";
import { MovementBadge, Qty } from "../bits";

export const metadata = { title: "Stock Movements" };

const PAGE_SIZE = 50;
const UUID = /^[0-9a-f-]{36}$/i;

type Movement = {
  id: number; movement_type: MovementType; quantity_change: number; balance_after: number; occurred_at: string;
  issued_to: string | null; reference: string | null; note: string | null; created_by: string | null;
  inventory_items: { id: string; name: string; sku: string; unit: string } | null; institutions: { name: string } | null;
};

export default async function MovementsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireInventoryPage();
  const sp = await searchParams;
  const item = UUID.test(str(sp.item) ?? "") ? str(sp.item)! : "";
  const institution = UUID.test(str(sp.institution) ?? "") ? str(sp.institution)! : "";
  const type = (MOVEMENT_TYPES as readonly string[]).includes(str(sp.type) ?? "") ? str(sp.type)! : "";
  const page = Math.max(1, Math.min(1000, Number(str(sp.page)) || 1));

  const supabase = await db();
  let q = supabase.from("inventory_movements")
    .select("id, movement_type, quantity_change, balance_after, occurred_at, issued_to, reference, note, created_by, inventory_items(id, name, sku, unit), institutions(name)", { count: "exact" })
    .order("occurred_at", { ascending: false }).order("id", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (item) q = q.eq("item_id", item);
  if (institution) q = q.eq("institution_id", institution);
  if (type) q = q.eq("movement_type", type);

  const [{ data, count }, { data: items }, insts, { data: actors }] = await Promise.all([
    q,
    supabase.from("inventory_items").select("id, name, sku").order("name"),
    institutionOptions("all", false),
    supabase.from("profiles").select("id, email, full_name"),
  ]);
  const rows = (data ?? []) as unknown as Movement[];
  const actorName = new Map((actors ?? []).map((a) => [a.id, a.full_name || a.email]));
  const filters = { ...(item && { item }), ...(institution && { institution }), ...(type && { type }) };
  const hrefFor = (p: number) => `/erp/inventory/movements?${new URLSearchParams({ ...filters, page: String(p) })}`;

  return (
    <>
      <PageHeader
        title="Stock Movements"
        description="The full ledger of deliveries, issues, returns, stock counts, write-offs and kit builds. Entries cannot be edited or deleted."
        crumbs={[{ href: "/erp/inventory", label: "Inventory" }, { label: "Stock Movements" }]}
        actions={<a href={`/erp/inventory/movements/export?${new URLSearchParams(filters)}`} className={buttonClass("secondary")}>Export CSV</a>}
      />
      <Card>
        <form className="mb-4 flex flex-col gap-2 sm:flex-row">
          <label htmlFor="item" className="sr-only">Item</label>
          <select id="item" name="item" defaultValue={item} className={cx(inputClass, "sm:w-64")}>
            <option value="">All items</option>
            {(items ?? []).map((i) => <option key={i.id} value={i.id}>{i.name} ({i.sku})</option>)}
          </select>
          <label htmlFor="type" className="sr-only">Movement type</label>
          <select id="type" name="type" defaultValue={type} className={cx(inputClass, "sm:w-44")}>
            <option value="">All movements</option>
            {MOVEMENT_TYPES.map((t) => <option key={t} value={t}>{MOVEMENT_LABELS[t]}</option>)}
          </select>
          <label htmlFor="institution" className="sr-only">School or centre</label>
          <select id="institution" name="institution" defaultValue={institution} className={cx(inputClass, "sm:w-64")}>
            <option value="">All schools & centres</option>
            {insts.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
          </select>
          <button className={buttonClass("secondary")}>Filter</button>
        </form>
        {rows.length === 0 ? (
          <EmptyState title="No movements match these filters" />
        ) : (
          <>
            <Table caption="Stock movements">
              <thead>
                <tr>
                  <th className={th}>When</th><th className={th}>Item</th><th className={th}>Movement</th>
                  <th className={cx(th, "text-right")}>Change</th><th className={cx(th, "text-right")}>Balance</th>
                  <th className={th}>To / from</th><th className={th}>Details</th><th className={th}>By</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((m) => (
                  <tr key={m.id} className="align-top">
                    <td className={cx(td, "whitespace-nowrap text-xs")}>{formatDateTime(m.occurred_at)}</td>
                    <td className={td}>
                      <Link href={`/erp/inventory/items/${m.inventory_items?.id}`} className={cx("font-medium hover:underline", focusRing)}>{m.inventory_items?.name}</Link>
                      <p className="font-mono text-xs text-zinc-500">{m.inventory_items?.sku}</p>
                    </td>
                    <td className={td}><MovementBadge type={m.movement_type} /></td>
                    <td className={cx(td, "text-right tabular-nums")}><Qty n={m.quantity_change} /></td>
                    <td className={cx(td, "text-right tabular-nums")}>{m.balance_after}</td>
                    <td className={cx(td, "text-xs")}>{[m.institutions?.name, m.issued_to].filter(Boolean).join(" · ") || "—"}</td>
                    <td className={cx(td, "text-xs")}>
                      {m.reference && <p className="font-mono">{m.reference}</p>}
                      {m.note && <p className="text-zinc-400">{m.note}</p>}
                      {!m.reference && !m.note && "—"}
                    </td>
                    <td className={cx(td, "text-xs")}>{m.created_by ? actorName.get(m.created_by) ?? "—" : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
            <Pagination page={page} pageSize={PAGE_SIZE} total={count ?? 0} hrefFor={hrefFor} />
          </>
        )}
      </Card>
    </>
  );
}
