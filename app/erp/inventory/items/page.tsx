import Link from "next/link";
import { db } from "@/lib/erp/context";
import { requireInventoryPage } from "@/lib/erp/inventory";
import { ITEM_KIND_LABELS, formatMoney, stockState, type InventoryItem } from "@/lib/erp/inventory-types";
import { str } from "@/lib/erp/format";
import { Badge, Card, EmptyState, LinkButton, PageHeader, Table, buttonClass, cx, focusRing, inputClass, td, th } from "../../_components/ui";
import { StockBadge } from "../bits";

export const metadata = { title: "Kits & Components" };

type Row = InventoryItem & { inventory_categories: { name: string } | null };

export default async function ItemsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireInventoryPage();
  const sp = await searchParams;
  const q = (str(sp.q) ?? "").trim().slice(0, 100);
  const kind = ["component", "kit"].includes(str(sp.kind) ?? "") ? str(sp.kind)! : "";
  const stock = ["low", "out"].includes(str(sp.stock) ?? "") ? str(sp.stock)! : "";
  const category = /^[0-9a-f-]{36}$/i.test(str(sp.category) ?? "") ? str(sp.category)! : "";
  const showInactive = str(sp.inactive) === "1";

  const supabase = await db();
  let query = supabase.from("inventory_items").select("*, inventory_categories(name)").order("name").limit(2000);
  if (!showInactive) query = query.eq("is_active", true);
  if (kind) query = query.eq("kind", kind);
  if (category) query = query.eq("category_id", category);
  // Strip PostgREST filter syntax before building the or() filter.
  const term = q.replace(/[,()*%\\."]/g, " ").trim();
  if (term) query = query.or(["name", "sku", "manufacturer", "storage_location"].map((c) => `${c}.ilike.*${term}*`).join(","));
  const [{ data, error }, { data: cats }] = await Promise.all([
    query,
    supabase.from("inventory_categories").select("id, name").order("name"),
  ]);
  let rows = (data ?? []) as Row[];
  // Stock level is compared against each item's own reorder level, so filter here.
  if (stock === "low") rows = rows.filter((r) => stockState(r) !== "ok");
  if (stock === "out") rows = rows.filter((r) => stockState(r) === "out");

  return (
    <>
      <PageHeader
        title="Kits & Components"
        description="Every stocked item. Open an item to receive stock, issue it to a school or centre, or build kits."
        crumbs={[{ href: "/erp/inventory", label: "Inventory" }, { label: "Kits & Components" }]}
        actions={
          <>
            <LinkButton variant="secondary" href="/erp/inventory/import">Import from Excel / Sheets</LinkButton>
            <LinkButton href="/erp/inventory/items/new">New item</LinkButton>
          </>
        }
      />
      <Card>
        <form className="mb-4 flex flex-col flex-wrap gap-2 sm:flex-row" role="search">
          <label htmlFor="q" className="sr-only">Search</label>
          <input id="q" name="q" defaultValue={q} placeholder="Search name, SKU, brand or location" className={cx(inputClass, "sm:max-w-xs")} />
          <label htmlFor="kind" className="sr-only">Type</label>
          <select id="kind" name="kind" defaultValue={kind} className={cx(inputClass, "sm:w-40")}>
            <option value="">All types</option>
            <option value="component">Components</option>
            <option value="kit">Kits</option>
          </select>
          <label htmlFor="category" className="sr-only">Category</label>
          <select id="category" name="category" defaultValue={category} className={cx(inputClass, "sm:w-44")}>
            <option value="">All categories</option>
            {(cats ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <label htmlFor="stock" className="sr-only">Stock</label>
          <select id="stock" name="stock" defaultValue={stock} className={cx(inputClass, "sm:w-40")}>
            <option value="">Any stock level</option>
            <option value="low">Low or out</option>
            <option value="out">Out of stock</option>
          </select>
          <label className="flex items-center gap-2 px-1 text-sm text-zinc-300">
            <input type="checkbox" name="inactive" value="1" defaultChecked={showInactive} className="h-4 w-4 accent-brand-500" />
            Include inactive
          </label>
          <button className={buttonClass("secondary")}>Filter</button>
        </form>
        {error ? (
          <EmptyState title="Items could not be loaded">Please refresh the page.</EmptyState>
        ) : rows.length === 0 ? (
          <EmptyState title="No items match these filters" action={<LinkButton href="/erp/inventory/items/new">New item</LinkButton>} />
        ) : (
          <Table caption="Inventory items">
            <thead>
              <tr>
                <th className={th}>Item</th>
                <th className={th}>Type</th>
                <th className={th}>Category</th>
                <th className={th}>Location</th>
                <th className={cx(th, "text-right")}>On hand</th>
                <th className={cx(th, "text-right")}>Value</th>
                <th className={th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className={cx("hover:bg-zinc-800/40", !r.is_active && "opacity-60")}>
                  <td className={td}>
                    <Link href={`/erp/inventory/items/${r.id}`} className={cx("font-medium text-zinc-100 hover:underline", focusRing)}>{r.name}</Link>
                    <p className="font-mono text-xs text-zinc-500">{r.sku}</p>
                  </td>
                  <td className={td}><Badge tone={r.kind === "kit" ? "violet" : "neutral"}>{ITEM_KIND_LABELS[r.kind]}</Badge></td>
                  <td className={cx(td, "text-xs")}>{r.inventory_categories?.name ?? "—"}</td>
                  <td className={cx(td, "text-xs")}>{r.storage_location ?? "—"}</td>
                  <td className={cx(td, "text-right tabular-nums")}>{r.quantity_on_hand} <span className="text-xs text-zinc-500">{r.unit}</span></td>
                  <td className={cx(td, "text-right text-xs tabular-nums")}>{r.unit_cost === null ? "—" : formatMoney(Number(r.unit_cost) * r.quantity_on_hand)}</td>
                  <td className={td}>{r.is_active ? <StockBadge item={r} /> : <Badge>Inactive</Badge>}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </>
  );
}
