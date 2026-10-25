export const ITEM_KINDS = ["component", "kit"] as const;
export type ItemKind = (typeof ITEM_KINDS)[number];

export const ITEM_KIND_LABELS: Record<ItemKind, string> = { component: "Component", kit: "Kit" };

export const MOVEMENT_TYPES = ["receive", "issue", "return", "adjust", "write_off", "assemble", "disassemble"] as const;
export type MovementType = (typeof MOVEMENT_TYPES)[number];

/** Movements entered by hand on an item page (kit builds have their own form). */
export const MANUAL_MOVEMENT_TYPES = ["receive", "issue", "return", "adjust", "write_off"] as const;
export type ManualMovementType = (typeof MANUAL_MOVEMENT_TYPES)[number];

export const MOVEMENT_LABELS: Record<MovementType, string> = {
  receive: "Received",
  issue: "Issued",
  return: "Returned",
  adjust: "Stock count",
  write_off: "Written off",
  assemble: "Kit build",
  disassemble: "Kit break-up",
};

export type InventoryItem = {
  id: string;
  sku: string;
  name: string;
  kind: ItemKind;
  category_id: string | null;
  unit: string;
  description: string | null;
  manufacturer: string | null;
  storage_location: string | null;
  unit_cost: number | string | null;
  reorder_level: number;
  quantity_on_hand: number;
  is_active: boolean;
};

export function stockState(i: Pick<InventoryItem, "quantity_on_hand" | "reorder_level">): "out" | "low" | "ok" {
  if (i.quantity_on_hand === 0) return "out";
  if (i.reorder_level > 0 && i.quantity_on_hand <= i.reorder_level) return "low";
  return "ok";
}

/** How many complete kits the components on hand could make. */
export function buildableKits(components: { quantity: number; on_hand: number }[]): number {
  if (components.length === 0) return 0;
  return Math.min(...components.map((c) => Math.floor(c.on_hand / c.quantity)));
}

export function formatMoney(v: number | string | null | undefined): string {
  if (v === null || v === undefined || v === "") return "—";
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(Number(v));
}
