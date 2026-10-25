import Link from "next/link";
import { db } from "@/lib/erp/context";
import { requireInventoryPage } from "@/lib/erp/inventory";
import { ITEM_KIND_LABELS, type ItemKind } from "@/lib/erp/inventory-types";
import { formatDate } from "@/lib/erp/format";
import type { InstitutionType } from "@/lib/erp/types";
import { Badge, Card, EmptyState, PageHeader, Table, TypeBadge, cx, focusRing, td, th } from "../../_components/ui";

export const metadata = { title: "Issued to Sites" };

type Row = {
  institution_id: string; institution_name: string; institution_type: InstitutionType;
  item_id: string; sku: string; item_name: string; kind: ItemKind; unit: string; outstanding: number; last_movement: string;
};

export default async function IssuedPage() {
  await requireInventoryPage();
  const supabase = await db();
  const { data, error } = await supabase.rpc("erp_inventory_outstanding");
  const rows = (data ?? []) as Row[];
  const bySite = new Map<string, Row[]>();
  for (const r of rows) bySite.set(r.institution_id, [...(bySite.get(r.institution_id) ?? []), r]);

  return (
    <>
      <PageHeader
        title="Issued to Sites"
        description="Kits and components currently out with each school and learning centre (issued minus returned). Record issues and returns on an item's page."
        crumbs={[{ href: "/erp/inventory", label: "Inventory" }, { label: "Issued to Sites" }]}
      />
      {error ? (
        <Card><EmptyState title="Could not load issued stock">Please refresh the page.</EmptyState></Card>
      ) : bySite.size === 0 ? (
        <Card><EmptyState title="Nothing is out at any school or centre" /></Card>
      ) : (
        <div className="space-y-6">
          {[...bySite.values()].map((site) => (
            <Card
              key={site[0].institution_id}
              title={<span className="flex items-center gap-2">{site[0].institution_name} <TypeBadge type={site[0].institution_type} /></span>}
              actions={<Link href={`/erp/inventory/movements?institution=${site[0].institution_id}`} className={cx("text-xs text-brand-400 hover:underline", focusRing)}>History</Link>}
            >
              <Table caption={`Stock at ${site[0].institution_name}`}>
                <thead>
                  <tr><th className={th}>Item</th><th className={th}>Type</th><th className={cx(th, "text-right")}>Out</th><th className={th}>Last movement</th></tr>
                </thead>
                <tbody>
                  {site.map((r) => (
                    <tr key={r.item_id}>
                      <td className={td}>
                        <Link href={`/erp/inventory/items/${r.item_id}`} className={cx("font-medium hover:underline", focusRing)}>{r.item_name}</Link>
                        <p className="font-mono text-xs text-zinc-500">{r.sku}</p>
                      </td>
                      <td className={td}><Badge tone={r.kind === "kit" ? "violet" : "neutral"}>{ITEM_KIND_LABELS[r.kind]}</Badge></td>
                      <td className={cx(td, "text-right tabular-nums")}>{r.outstanding} <span className="text-xs text-zinc-500">{r.unit}</span></td>
                      <td className={cx(td, "text-xs")}>{formatDate(r.last_movement)}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
