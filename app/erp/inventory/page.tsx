import Link from "next/link";
import { db } from "@/lib/erp/context";
import { requireInventoryPage } from "@/lib/erp/inventory";
import { formatMoney, stockState, type InventoryItem, type MovementType } from "@/lib/erp/inventory-types";
import { getInventoryCalendar } from "@/lib/erp/queries";
import { inventoryHeat, RAMPS, weeklyFlow } from "@/lib/erp/charts";
import { formatDateTime, todayIn } from "@/lib/erp/format";
import type { InstitutionType } from "@/lib/erp/types";
import { Card, EmptyState, LinkButton, StatCard, Table, cx, focusRing, td, th } from "../_components/ui";
import { ActionTiles, HeroBanner, ShelfArt } from "../_components/playful";
import { AlertTriangle, Boxes, Cpu, Truck } from "lucide-react";
import { BarList, Donut, FlowChart, Sparkline, YearHeatmap } from "../_components/charts";
import { MovementBadge, Qty, StockBadge } from "./bits";

export const metadata = { title: "Inventory" };

type Summary = { items: number; kits: number; units: number; low_stock: number; out_of_stock: number; stock_value: number; issued_out: number };
type Item = Pick<InventoryItem, "id" | "sku" | "name" | "kind" | "unit" | "quantity_on_hand" | "reorder_level" | "unit_cost"> & {
  inventory_categories: { name: string } | null;
};
type Movement = {
  id: number; movement_type: MovementType; quantity_change: number; occurred_at: string; issued_to: string | null;
  inventory_items: { id: string; name: string; sku: string } | null; institutions: { name: string } | null;
};
type Outstanding = { institution_id: string; institution_name: string; institution_type: InstitutionType; item_id: string; item_name: string; unit: string; outstanding: number };

const HEALTH = { ok: "#10b981", low: "#f59e0b", out: "#f43f5e" } as const;

export default async function InventoryOverview() {
  await requireInventoryPage();
  const supabase = await db();
  const [summary, all, recent, outstanding, calendar] = await Promise.all([
    supabase.rpc("erp_inventory_summary"),
    supabase.from("inventory_items").select("id, sku, name, kind, unit, quantity_on_hand, reorder_level, unit_cost, inventory_categories(name)")
      .eq("is_active", true).order("quantity_on_hand").limit(2000),
    supabase.from("inventory_movements")
      .select("id, movement_type, quantity_change, occurred_at, issued_to, inventory_items(id, name, sku), institutions(name)")
      .order("occurred_at", { ascending: false }).limit(10),
    supabase.rpc("erp_inventory_outstanding"),
    getInventoryCalendar(),
  ]);
  const s = (summary.data ?? {}) as Partial<Summary>;
  const items = (all.data ?? []) as unknown as Item[];
  const lowItems = items.filter((i) => stockState(i) !== "ok").slice(0, 15);
  const movements = (recent.data ?? []) as unknown as Movement[];
  const out = (outstanding.data ?? []) as Outstanding[];

  const health = { ok: 0, low: 0, out: 0 };
  for (const i of items) health[stockState(i)]++;

  // Units and value on hand per category.
  const byCategory = new Map<string, { units: number; value: number; items: number }>();
  for (const i of items) {
    const key = i.inventory_categories?.name ?? "Uncategorised";
    const c = byCategory.get(key) ?? { units: 0, value: 0, items: 0 };
    c.units += i.quantity_on_hand;
    c.value += i.quantity_on_hand * Number(i.unit_cost ?? 0);
    c.items++;
    byCategory.set(key, c);
  }

  // What is out at sites, by site and by item.
  const bySite = new Map<string, { name: string; units: number; lines: number }>();
  const byItem = new Map<string, { name: string; unit: string; units: number; sites: number }>();
  for (const r of out) {
    const site = bySite.get(r.institution_id) ?? { name: r.institution_name, units: 0, lines: 0 };
    site.units += r.outstanding; site.lines++;
    bySite.set(r.institution_id, site);
    const it = byItem.get(r.item_id) ?? { name: r.item_name, unit: r.unit, units: 0, sites: 0 };
    it.units += r.outstanding; it.sites++;
    byItem.set(r.item_id, it);
  }

  const today = todayIn();
  const heat = calendar ? inventoryHeat(calendar) : null;
  const flow = calendar ? weeklyFlow(calendar, today) : null;

  return (
    <>
      <HeroBanner
        eyebrow="Inventory · Super Admins only"
        title="The Radix"
        highlight="stockroom"
        accent="amber"
        accent2="brand"
        art={<ShelfArt />}
        summary={items.length ? (
          <>
            <strong>{(s.units ?? 0).toLocaleString("en-IN")} units</strong> across {items.length} active items, worth <strong>{formatMoney(s.stock_value ?? 0)}</strong>.{" "}
            {(s.issued_out ?? 0) > 0 && <><strong>{(s.issued_out ?? 0).toLocaleString("en-IN")}</strong> are out with schools and centres. </>}
            {health.low + health.out > 0 ? <><strong>{health.low + health.out}</strong> need restocking.</> : "Nothing needs restocking."}
          </>
        ) : "No stock yet. Add your first kit or component, or import a spreadsheet."}
      >
        <LinkButton href="/erp/inventory/items/new">New item</LinkButton>
        <LinkButton variant="secondary" href="/erp/inventory/import">Import from Excel / Sheets</LinkButton>
      </HeroBanner>
      <ActionTiles label="Inventory shortcuts" tiles={[
        { href: "/erp/inventory/items", label: "Browse stock", hint: "Kits and components", icon: "Cpu", tone: "amber" },
        { href: "/erp/inventory/items?stock=low", label: "Restock list", hint: "Low and out of stock", icon: "Boxes", tone: "brand" },
        { href: "/erp/inventory/issued", label: "Issued to sites", hint: "What schools hold", icon: "Truck", tone: "sky" },
        { href: "/erp/inventory/movements", label: "Movement log", hint: "Every in and out", icon: "ArrowLeftRight", tone: "violet" },
      ]} />
      <section aria-label="Summary" className="grid max-lg:grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Components" value={s.items ?? 0} hint={`${(s.units ?? 0).toLocaleString("en-IN")} units on hand in total`} href="/erp/inventory/items?kind=component" icon={<Cpu />} accent="#fbbf24" />
        <StatCard label="Kits" value={s.kits ?? 0} hint="Ready-to-teach bundles" href="/erp/inventory/items?kind=kit" icon={<Boxes />} accent="#a78bfa" />
        <StatCard label="Low / out of stock" value={`${s.low_stock ?? 0} / ${s.out_of_stock ?? 0}`} tone={(s.low_stock ?? 0) + (s.out_of_stock ?? 0) > 0 ? "warn" : "good"} href="/erp/inventory/items?stock=low" icon={<AlertTriangle />} accent="#f43f5e" />
        <StatCard label="Units out at sites" value={(s.issued_out ?? 0).toLocaleString("en-IN")} hint={`Stock value ${formatMoney(s.stock_value ?? 0)}`} href="/erp/inventory/issued" icon={<Truck />} accent="#38bdf8"
          chart={flow ? <Sparkline values={flow.slice(-12).map((p) => p.outbound)} color="#d95926" label="Units out per week, last 12 weeks" /> : undefined} />
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-5">
        <Card title="Stock health" className="xl:col-span-2">
          <Donut
            label="Active items by stock level"
            centerValue={items.length.toLocaleString("en-IN")}
            centerLabel="active items"
            segments={[
              { key: "ok", label: "In stock", value: health.ok, color: HEALTH.ok },
              { key: "low", label: "Low stock", value: health.low, color: HEALTH.low },
              { key: "out", label: "Out of stock", value: health.out, color: HEALTH.out },
            ]}
          />
        </Card>
        <Card title="Units in vs out · last 26 weeks" className="xl:col-span-3">
          {flow ? <FlowChart points={flow} /> : <MigrationHint />}
        </Card>
      </div>

      <Card className="mt-6" title="Stock activity · last 12 months">
        {heat ? (
          <YearHeatmap
            label="Stock movements for each day of the last 12 months"
            cells={heat.cells}
            metrics={heat.metrics}
            ramp={RAMPS.brand}
            endDate={today}
            dayHref="/erp/inventory/movements"
            dayHrefLabel="Open movement history"
            emptyLabel="No stock movements"
          />
        ) : <MigrationHint />}
      </Card>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card title="Out at sites · by school / centre">
          <BarList
            label="Units out at each site"
            rows={[...bySite.entries()].map(([id, v]) => ({
              key: id, label: v.name, value: v.units, display: v.units.toLocaleString("en-IN"),
              sub: `${v.lines} item${v.lines === 1 ? "" : "s"}`, href: `/erp/inventory/movements?institution=${id}`,
            }))}
            color="#3987e5"
            emptyText="Nothing is out at any school or centre"
          />
        </Card>
        <Card title="Out at sites · by item">
          <BarList
            label="Units out per item"
            rows={[...byItem.entries()].map(([id, v]) => ({
              key: id, label: v.name, value: v.units, display: `${v.units.toLocaleString("en-IN")} ${v.unit}`,
              sub: `${v.sites} site${v.sites === 1 ? "" : "s"}`, href: `/erp/inventory/items/${id}`,
            }))}
            color="#3987e5"
            emptyText="Nothing is out at any school or centre"
          />
        </Card>
        <Card title="On hand · by category">
          <BarList
            label="Units on hand per category"
            rows={[...byCategory.entries()].map(([name, v]) => ({
              key: name, label: name, value: v.units, display: v.units.toLocaleString("en-IN"),
              sub: v.value ? formatMoney(v.value) : `${v.items} item${v.items === 1 ? "" : "s"}`,
            }))}
            color="#3987e5"
            emptyText="No active items yet"
          />
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card title="Needs restocking" actions={<Link href="/erp/inventory/items?stock=low" className={cx("text-xs text-brand-400 hover:underline", focusRing)}>View all</Link>}>
          {lowItems.length === 0 ? (
            <EmptyState title="Nothing is low on stock">Set a reorder level on items to be warned here.</EmptyState>
          ) : (
            <Table caption="Low stock items">
              <thead><tr><th className={th}>Item</th><th className={th}>On hand vs reorder level</th><th className={th}>Status</th></tr></thead>
              <tbody>
                {lowItems.map((i) => (
                  <tr key={i.id}>
                    <td className={td}>
                      <Link href={`/erp/inventory/items/${i.id}`} className={cx("font-medium hover:underline", focusRing)}>{i.name}</Link>
                      <p className="font-mono text-xs text-zinc-500">{i.sku}</p>
                    </td>
                    <td className={td}><StockMeter onHand={i.quantity_on_hand} reorder={i.reorder_level} unit={i.unit} /></td>
                    <td className={td}><StockBadge item={i} /></td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>

        <Card title="Recent movements" actions={<Link href="/erp/inventory/movements" className={cx("text-xs text-brand-400 hover:underline", focusRing)}>View all</Link>}>
          {movements.length === 0 ? (
            <EmptyState title="No stock movements yet">Create an item with opening stock or record a delivery to get started.</EmptyState>
          ) : (
            <ul className="divide-y divide-zinc-800/60">
              {movements.map((m) => (
                <li key={m.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <div className="min-w-0">
                    <Link href={`/erp/inventory/items/${m.inventory_items?.id}`} className={cx("font-medium text-zinc-100 hover:underline", focusRing)}>
                      {m.inventory_items?.name}
                    </Link>
                    <p className="truncate text-xs text-zinc-500">
                      {formatDateTime(m.occurred_at)}
                      {(m.institutions?.name || m.issued_to) && ` · ${[m.institutions?.name, m.issued_to].filter(Boolean).join(" · ")}`}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <MovementBadge type={m.movement_type} />
                    <span className="w-14 text-right tabular-nums"><Qty n={m.quantity_change} /></span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}

/** On-hand quantity against the reorder level; the tick marks the reorder point. */
function StockMeter({ onHand, reorder, unit }: { onHand: number; reorder: number; unit: string }) {
  const scale = Math.max(reorder * 2, onHand, 1);
  const color = onHand === 0 ? HEALTH.out : reorder > 0 && onHand <= reorder ? HEALTH.low : HEALTH.ok;
  return (
    <div className="min-w-[140px]">
      <p className="mb-1 text-xs tabular-nums text-zinc-300">
        {onHand} {unit} <span className="text-zinc-500">· reorder at {reorder}</span>
      </p>
      <div className="relative h-1.5 rounded-full bg-zinc-800" role="img" aria-label={`${onHand} on hand, reorder at ${reorder}`}>
        <div className="h-1.5 rounded-full" style={{ width: `${(onHand / scale) * 100}%`, background: color }} />
        {reorder > 0 && <span aria-hidden className="absolute -top-1 h-3.5 w-px bg-zinc-300" style={{ left: `${(reorder / scale) * 100}%` }} />}
      </div>
    </div>
  );
}

function MigrationHint() {
  return (
    <EmptyState title="Activity charts need one more database update">
      Apply <code>supabase/migrations/20261025090000_erp_dashboard_analytics.sql</code> to see stock activity over time.
    </EmptyState>
  );
}
