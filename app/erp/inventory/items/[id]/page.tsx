import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/erp/context";
import { requireInventoryPage } from "@/lib/erp/inventory";
import { institutionOptions } from "@/lib/erp/queries";
import { ITEM_KIND_LABELS, buildableKits, formatMoney, type InventoryItem, type MovementType } from "@/lib/erp/inventory-types";
import { formatDateTime } from "@/lib/erp/format";
import {
  Badge, Card, DescriptionList, EmptyState, LinkButton, PageHeader, StatCard, Table, TypeBadge, cx, focusRing, td, th,
} from "../../../_components/ui";
import type { InstitutionType } from "@/lib/erp/types";
import { KitBuildForm, KitComponentForm, MovementForm, RemoveComponentButton } from "../../Forms";
import { MovementBadge, Qty, StockBadge } from "../../bits";

export const metadata = { title: "Inventory item" };

type Component = { id: string; quantity: number; inventory_items: { id: string; sku: string; name: string; unit: string; quantity_on_hand: number } };
type UsedIn = { quantity: number; inventory_items: { id: string; sku: string; name: string } };
type Movement = {
  id: number; movement_type: MovementType; quantity_change: number; balance_after: number; occurred_at: string;
  issued_to: string | null; reference: string | null; note: string | null; created_by: string | null; institutions: { name: string } | null;
};
type Outstanding = { institution_id: string; institution_name: string; institution_type: InstitutionType; outstanding: number; last_movement: string };

export default async function ItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  await requireInventoryPage();
  const supabase = await db();

  const { data } = await supabase.from("inventory_items").select("*, inventory_categories(name)").eq("id", id).maybeSingle();
  if (!data) notFound();
  const item = data as InventoryItem & { inventory_categories: { name: string } | null };
  const isKit = item.kind === "kit";

  const [components, usedIn, movements, outstanding, institutions, componentOptions, actors] = await Promise.all([
    isKit
      ? supabase.from("inventory_kit_components")
          .select("id, quantity, inventory_items!inventory_kit_components_component_id_fkey(id, sku, name, unit, quantity_on_hand)")
          .eq("kit_id", id)
      : Promise.resolve({ data: [] }),
    !isKit
      ? supabase.from("inventory_kit_components")
          .select("quantity, inventory_items!inventory_kit_components_kit_id_fkey(id, sku, name)")
          .eq("component_id", id)
      : Promise.resolve({ data: [] }),
    supabase.from("inventory_movements")
      .select("id, movement_type, quantity_change, balance_after, occurred_at, issued_to, reference, note, created_by, institutions(name)")
      .eq("item_id", id).order("occurred_at", { ascending: false }).order("id", { ascending: false }).limit(50),
    supabase.rpc("erp_inventory_outstanding").eq("item_id", id),
    institutionOptions("all", false),
    isKit
      ? supabase.from("inventory_items").select("id, sku, name").eq("kind", "component").eq("is_active", true).order("name")
      : Promise.resolve({ data: [] }),
    supabase.from("profiles").select("id, email, full_name"),
  ]);
  const parts = ((components.data ?? []) as unknown as Component[]).sort((a, b) => a.inventory_items.name.localeCompare(b.inventory_items.name));
  const kits = (usedIn.data ?? []) as unknown as UsedIn[];
  const history = (movements.data ?? []) as unknown as Movement[];
  const out = (outstanding.data ?? []) as Outstanding[];
  const totalOut = out.reduce((n, o) => n + o.outstanding, 0);
  const inKit = new Set(parts.map((p) => p.inventory_items.id));
  const addable = ((componentOptions.data ?? []) as { id: string; sku: string; name: string }[]).filter((c) => !inKit.has(c.id));
  const canBuild = buildableKits(parts.map((p) => ({ quantity: p.quantity, on_hand: p.inventory_items.quantity_on_hand })));
  const actorName = new Map((actors.data ?? []).map((a) => [a.id, a.full_name || a.email]));

  return (
    <>
      <PageHeader
        title={item.name}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <Badge tone={isKit ? "violet" : "neutral"}>{ITEM_KIND_LABELS[item.kind]}</Badge>
            {item.is_active ? <StockBadge item={item} /> : <Badge>Inactive</Badge>}
            <span className="font-mono text-xs">{item.sku}</span>
          </span>
        }
        crumbs={[{ href: "/erp/inventory", label: "Inventory" }, { href: "/erp/inventory/items", label: "Kits & Components" }, { label: item.name }]}
        actions={<LinkButton variant="secondary" href={`/erp/inventory/items/${id}/edit`}>Edit</LinkButton>}
      />

      <section aria-label="Stock" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="On hand" value={`${item.quantity_on_hand} ${item.unit}`}
          tone={item.quantity_on_hand === 0 ? "bad" : item.reorder_level > 0 && item.quantity_on_hand <= item.reorder_level ? "warn" : "good"} />
        <StatCard label="Out at sites" value={totalOut} hint={out.length ? `${out.length} school${out.length === 1 ? "" : "s"} / centre${out.length === 1 ? "" : "s"}` : undefined} />
        <StatCard label="Reorder level" value={item.reorder_level || "Off"} />
        <StatCard label="Stock value" value={item.unit_cost === null ? "—" : formatMoney(Number(item.unit_cost) * item.quantity_on_hand)}
          hint={item.unit_cost === null ? "Set a unit cost to track value" : `${formatMoney(item.unit_cost)} per ${item.unit}`} />
      </section>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card title="Record stock movement">
          <MovementForm itemId={id} unit={item.unit} institutions={institutions.map((i) => ({ id: i.id, name: i.name }))} />
        </Card>

        <Card title="Details">
          <DescriptionList items={[
            { label: "Category", value: item.inventory_categories?.name },
            { label: "Storage location", value: item.storage_location },
            { label: "Manufacturer / brand", value: item.manufacturer },
            { label: "Unit", value: item.unit },
            { label: "Description", value: item.description ? <span className="whitespace-pre-line">{item.description}</span> : null },
          ]} />
        </Card>

        {isKit && (
          <Card title="Kit contents" actions={<span className="text-xs text-zinc-500">Per kit</span>}>
            {parts.length === 0 ? (
              <EmptyState title="No components yet">Add the components that make up one kit, then you can build kits from stock.</EmptyState>
            ) : (
              <Table caption="Components in this kit">
                <thead><tr><th className={th}>Component</th><th className={cx(th, "text-right")}>Per kit</th><th className={cx(th, "text-right")}>On hand</th><th className={th}><span className="sr-only">Actions</span></th></tr></thead>
                <tbody>
                  {parts.map((p) => {
                    const short = p.inventory_items.quantity_on_hand < p.quantity;
                    return (
                      <tr key={p.id}>
                        <td className={td}>
                          <Link href={`/erp/inventory/items/${p.inventory_items.id}`} className={cx("font-medium hover:underline", focusRing)}>{p.inventory_items.name}</Link>
                          <p className="font-mono text-xs text-zinc-500">{p.inventory_items.sku}</p>
                        </td>
                        <td className={cx(td, "text-right tabular-nums")}>{p.quantity}</td>
                        <td className={cx(td, "text-right tabular-nums", short && "text-rose-400")}>{p.inventory_items.quantity_on_hand} {p.inventory_items.unit}</td>
                        <td className={cx(td, "text-right")}><RemoveComponentButton id={p.id} kitId={id} name={p.inventory_items.name} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            )}
            <KitComponentForm kitId={id} components={addable} />
          </Card>
        )}

        {isKit && parts.length > 0 && (
          <Card title="Build or break up kits">
            <p className="mb-4 text-sm text-zinc-400">
              Building deducts each component from stock and adds finished kits. Breaking up does the reverse. Stock on hand can build{" "}
              <strong className="text-zinc-100">{canBuild}</strong> more kit{canBuild === 1 ? "" : "s"}.
            </p>
            <KitBuildForm kitId={id} canBuild={canBuild} />
          </Card>
        )}

        {!isKit && kits.length > 0 && (
          <Card title="Used in kits">
            <ul className="divide-y divide-zinc-800/60">
              {kits.map((k) => (
                <li key={k.inventory_items.id} className="flex items-center justify-between py-2 text-sm">
                  <Link href={`/erp/inventory/items/${k.inventory_items.id}`} className={cx("hover:underline", focusRing)}>{k.inventory_items.name}</Link>
                  <span className="tabular-nums text-zinc-400">{k.quantity} per kit</span>
                </li>
              ))}
            </ul>
          </Card>
        )}

        <Card title="Out with schools & centres">
          {out.length === 0 ? (
            <EmptyState title="None of this item is out at a school or centre" />
          ) : (
            <ul className="divide-y divide-zinc-800/60">
              {out.map((o) => (
                <li key={o.institution_id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="truncate">{o.institution_name}</span>
                    <TypeBadge type={o.institution_type} />
                  </span>
                  <span className="shrink-0 tabular-nums">{o.outstanding} {item.unit}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card title="Movement history" className="mt-6" actions={<Link href={`/erp/inventory/movements?item=${id}`} className={cx("text-xs text-brand-400 hover:underline", focusRing)}>Full history</Link>}>
        {history.length === 0 ? (
          <EmptyState title="No movements yet" />
        ) : (
          <Table caption="Stock movements">
            <thead>
              <tr>
                <th className={th}>When</th><th className={th}>Movement</th><th className={cx(th, "text-right")}>Change</th>
                <th className={cx(th, "text-right")}>Balance</th><th className={th}>To / from</th><th className={th}>Details</th><th className={th}>By</th>
              </tr>
            </thead>
            <tbody>
              {history.map((m) => (
                <tr key={m.id} className="align-top">
                  <td className={cx(td, "whitespace-nowrap text-xs")}>{formatDateTime(m.occurred_at)}</td>
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
        )}
      </Card>
    </>
  );
}
