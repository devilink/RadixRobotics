import { requireInventoryPage } from "@/lib/erp/inventory";
import { INVENTORY_TEMPLATE } from "@/lib/erp/imports";
import { Card, PageHeader } from "../../_components/ui";
import { SpreadsheetImport } from "../../_components/SpreadsheetImport";
import { importInventory } from "./actions";

export const metadata = { title: "Import inventory" };

const GUIDE: [string, string][] = [
  ["SKU", "Your stock code (also read from “Item Code”, “Part No”…). If the sheet has none, one is made from the name, e.g. “Arduino Uno R3” → ARDUINO-UNO-R3. A SKU that already exists updates that item; blank cells keep its current values."],
  ["Name", "Required for new items."],
  ["Type", "Component or Kit. Defaults to Component (or Kit when Kit Components is filled)."],
  ["Quantity", "Units received now, added to stock (opening stock for new items). Leave blank to change details only."],
  ["Category", "Created automatically if it does not exist."],
  ["Unit, Unit Cost, Reorder Level, Location, Brand, Description", "Optional."],
  ["Kit Components", "For kits: e.g. “MCU-UNO x1; SEN-HCSR04 x2”. Replaces the kit's contents. Components can be in the same sheet."],
];

export default async function ImportInventoryPage() {
  await requireInventoryPage();
  return (
    <>
      <PageHeader
        title="Import inventory"
        description="Add or update kits and components from an Excel file, a CSV or a Google Sheet. The sheet is checked first; nothing is saved until you click Import."
        crumbs={[{ href: "/erp/inventory", label: "Inventory" }, { href: "/erp/inventory/items", label: "Kits & Components" }, { label: "Import" }]}
      />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <Card>
          <SpreadsheetImport action={importInventory} noun="items"
            template={{ ...INVENTORY_TEMPLATE, filename: "radix-inventory-template.csv" }} />
        </Card>
        <Card title="Sheet columns">
          <p className="mb-3 text-xs text-zinc-400">Put column names in the first row. Names are matched loosely (“Item Code”, “Qty”, “Price” also work); other columns are ignored.</p>
          <dl className="space-y-3 text-sm">
            {GUIDE.map(([k, v]) => (
              <div key={k}><dt className="font-medium text-zinc-100">{k}</dt><dd className="text-xs text-zinc-400">{v}</dd></div>
            ))}
          </dl>
          <p className="mt-4 text-xs text-zinc-500">
            Stock received through an import appears in Stock Movements as “Spreadsheet import”. To lower stock, use a stock count on the item page.
          </p>
        </Card>
      </div>
    </>
  );
}
