import Link from "next/link";
import { db } from "@/lib/erp/context";
import { requireInventoryPage } from "@/lib/erp/inventory";
import { Card, EmptyState, PageHeader, Table, cx, focusRing, td, th } from "../../_components/ui";
import { CategoryForm, DeleteCategoryButton } from "../Forms";

export const metadata = { title: "Inventory Categories" };

export default async function CategoriesPage() {
  await requireInventoryPage();
  const supabase = await db();
  const [{ data: cats }, { data: items }] = await Promise.all([
    supabase.from("inventory_categories").select("id, name, description").order("name"),
    supabase.from("inventory_items").select("category_id").eq("is_active", true).not("category_id", "is", null),
  ]);
  const counts = new Map<string, number>();
  for (const i of items ?? []) counts.set(i.category_id, (counts.get(i.category_id) ?? 0) + 1);

  return (
    <>
      <PageHeader
        title="Categories"
        description="Group items for filtering, e.g. Microcontrollers, Sensors, Motors & Drivers, Power, Kits."
        crumbs={[{ href: "/erp/inventory", label: "Inventory" }, { label: "Categories" }]}
      />
      <Card className="max-w-4xl">
        <CategoryForm />
        <div className="mt-6">
          {(cats ?? []).length === 0 ? (
            <EmptyState title="No categories yet" />
          ) : (
            <Table caption="Categories">
              <thead><tr><th className={th}>Name</th><th className={th}>Description</th><th className={cx(th, "text-right")}>Active items</th><th className={th}><span className="sr-only">Actions</span></th></tr></thead>
              <tbody>
                {(cats ?? []).map((c) => (
                  <tr key={c.id}>
                    <td className={td}>
                      <Link href={`/erp/inventory/items?category=${c.id}`} className={cx("font-medium hover:underline", focusRing)}>{c.name}</Link>
                    </td>
                    <td className={cx(td, "text-xs text-zinc-400")}>{c.description ?? "—"}</td>
                    <td className={cx(td, "text-right tabular-nums")}>{counts.get(c.id) ?? 0}</td>
                    <td className={cx(td, "text-right")}><DeleteCategoryButton id={c.id} name={c.name} /></td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </div>
      </Card>
    </>
  );
}
