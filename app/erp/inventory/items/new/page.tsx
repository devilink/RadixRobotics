import { db } from "@/lib/erp/context";
import { requireInventoryPage } from "@/lib/erp/inventory";
import { Card, PageHeader } from "../../../_components/ui";
import { ItemForm } from "../../Forms";
import { createItem } from "../../actions";

export const metadata = { title: "New inventory item" };

export default async function NewItemPage() {
  await requireInventoryPage();
  const supabase = await db();
  const { data: cats } = await supabase.from("inventory_categories").select("id, name").order("name");
  return (
    <>
      <PageHeader
        title="New item"
        description="Add a component (sensor, board, motor…) or a kit that is built from components."
        crumbs={[{ href: "/erp/inventory", label: "Inventory" }, { href: "/erp/inventory/items", label: "Kits & Components" }, { label: "New" }]}
      />
      <Card className="max-w-3xl">
        <ItemForm action={createItem} categories={cats ?? []} />
      </Card>
    </>
  );
}
