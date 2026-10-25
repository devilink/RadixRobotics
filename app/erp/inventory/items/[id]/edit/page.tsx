import { notFound } from "next/navigation";
import { db } from "@/lib/erp/context";
import { requireInventoryPage } from "@/lib/erp/inventory";
import type { InventoryItem } from "@/lib/erp/inventory-types";
import { Card, PageHeader } from "../../../../_components/ui";
import { DeleteItemButton, ItemForm } from "../../../Forms";
import { updateItem } from "../../../actions";

export const metadata = { title: "Edit inventory item" };

export default async function EditItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  await requireInventoryPage();
  const supabase = await db();
  const [{ data: item }, { data: cats }] = await Promise.all([
    supabase.from("inventory_items").select("*").eq("id", id).maybeSingle(),
    supabase.from("inventory_categories").select("id, name").order("name"),
  ]);
  if (!item) notFound();
  const i = item as InventoryItem;
  return (
    <>
      <PageHeader
        title={`Edit ${i.name}`}
        description="Stock quantity is not edited here. Record a stock count on the item page so the change is logged."
        crumbs={[{ href: "/erp/inventory/items", label: "Kits & Components" }, { href: `/erp/inventory/items/${id}`, label: i.name }, { label: "Edit" }]}
        actions={<DeleteItemButton id={i.id} name={i.name} />}
      />
      <Card className="max-w-3xl">
        <ItemForm action={updateItem.bind(null, id)} initial={i} categories={cats ?? []} isEdit />
      </Card>
    </>
  );
}
