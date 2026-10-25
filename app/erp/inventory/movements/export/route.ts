import { NextResponse, type NextRequest } from "next/server";
import { db, getErpContext } from "@/lib/erp/context";
import { isSuperAdmin } from "@/lib/erp/inventory";
import { MOVEMENT_LABELS, MOVEMENT_TYPES, type MovementType } from "@/lib/erp/inventory-types";
import { sharedRateLimit } from "@/lib/erp/rate-limit";
import { toCsv } from "@/lib/erp/format";

// CSV export of the stock ledger. Super Admin only (RLS enforces the same) and rate limited.
const UUID = /^[0-9a-f-]{36}$/i;

export async function GET(req: NextRequest) {
  const ctx = await getErpContext();
  if (!ctx) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  if (!isSuperAdmin(ctx)) return NextResponse.json({ error: "Inventory is restricted to Super Admins" }, { status: 403 });

  const supabase = await db();
  if (!(await sharedRateLimit(supabase, ctx.userId, "inventory-export", 20, 60_000))) {
    return NextResponse.json({ error: "Too many exports. Try again in a minute." }, { status: 429 });
  }

  const sp = req.nextUrl.searchParams;
  let q = supabase.from("inventory_movements")
    .select("occurred_at, movement_type, quantity_change, balance_after, issued_to, reference, note, inventory_items(sku, name, unit), institutions(name)")
    .order("occurred_at", { ascending: false }).order("id", { ascending: false }).limit(20_000);
  const item = sp.get("item") ?? "";
  const institution = sp.get("institution") ?? "";
  const type = sp.get("type") ?? "";
  if (UUID.test(item)) q = q.eq("item_id", item);
  if (UUID.test(institution)) q = q.eq("institution_id", institution);
  if ((MOVEMENT_TYPES as readonly string[]).includes(type)) q = q.eq("movement_type", type);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: "Export failed" }, { status: 500 });
  type Row = {
    occurred_at: string; movement_type: MovementType; quantity_change: number; balance_after: number; issued_to: string | null;
    reference: string | null; note: string | null; inventory_items: { sku: string; name: string; unit: string } | null; institutions: { name: string } | null;
  };
  const csv = toCsv(
    ["Date/time (UTC)", "SKU", "Item", "Movement", "Change", "Balance after", "Unit", "School / centre", "Person / team", "Reference", "Note"],
    ((data ?? []) as unknown as Row[]).map((r) => [
      r.occurred_at, r.inventory_items?.sku, r.inventory_items?.name, MOVEMENT_LABELS[r.movement_type], r.quantity_change,
      r.balance_after, r.inventory_items?.unit, r.institutions?.name, r.issued_to, r.reference, r.note,
    ]),
  );
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="inventory-movements-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
