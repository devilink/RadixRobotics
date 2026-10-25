import { Badge, type BadgeTone } from "../_components/ui";
import { MOVEMENT_LABELS, stockState, type MovementType } from "@/lib/erp/inventory-types";

export function StockBadge({ item }: { item: { quantity_on_hand: number; reorder_level: number } }) {
  const s = stockState(item);
  if (s === "out") return <Badge tone="red">Out of stock</Badge>;
  if (s === "low") return <Badge tone="amber">Low stock</Badge>;
  return <Badge tone="green">In stock</Badge>;
}

const MOVEMENT_TONES: Record<MovementType, BadgeTone> = {
  receive: "green", issue: "sky", return: "violet", adjust: "neutral", write_off: "red", assemble: "amber", disassemble: "amber",
};

export function MovementBadge({ type }: { type: MovementType }) {
  return <Badge tone={MOVEMENT_TONES[type]}>{MOVEMENT_LABELS[type]}</Badge>;
}

export function Qty({ n }: { n: number }) {
  return <span className={n > 0 ? "text-emerald-400" : "text-rose-400"}>{n > 0 ? `+${n}` : n}</span>;
}
