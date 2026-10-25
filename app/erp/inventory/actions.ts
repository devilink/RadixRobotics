"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db, ForbiddenError } from "@/lib/erp/context";
import { requireInventoryAction } from "@/lib/erp/inventory";
import { check, failure, parse } from "@/lib/erp/action-utils";
import {
  formToObject, inventoryCategorySchema, inventoryItemSchema, inventoryMoveSchema, kitBuildSchema, kitComponentSchema,
} from "@/lib/erp/validation";
import type { ActionResult } from "@/lib/erp/types";

// Every action re-checks the Super Admin role here; the database checks it again
// through RLS and the erp_inventory_* functions.

const UUID = /^[0-9a-f-]{36}$/i;

function revalidateInventory(itemId?: string) {
  revalidatePath("/erp/inventory");
  revalidatePath("/erp/inventory/items");
  revalidatePath("/erp/inventory/movements");
  revalidatePath("/erp/inventory/issued");
  if (itemId) revalidatePath(`/erp/inventory/items/${itemId}`);
}

export async function createItem(_prev: unknown, fd: FormData): Promise<ActionResult> {
  let id: string;
  try {
    await requireInventoryAction();
    const p = parse(inventoryItemSchema, formToObject(fd));
    if (!p.ok) return p.result;
    const { opening_stock, ...item } = p.data;
    const supabase = await db();
    id = check(await supabase.from("inventory_items").insert(item).select("id").single())!.id;
    if (opening_stock) {
      check(await supabase.rpc("erp_inventory_move", {
        p_item: id, p_type: "receive", p_quantity: opening_stock, p_note: "Opening stock",
      }));
    }
  } catch (err) {
    return failure(err);
  }
  revalidateInventory();
  redirect(`/erp/inventory/items/${id}`);
}

export async function updateItem(id: string, _prev: unknown, fd: FormData): Promise<ActionResult> {
  try {
    await requireInventoryAction();
    if (!UUID.test(id)) throw new ForbiddenError("Item not found.");
    const p = parse(inventoryItemSchema, formToObject(fd));
    if (!p.ok) return p.result;
    // Opening stock only applies on creation; later changes go through movements.
    const changes: Partial<typeof p.data> = { ...p.data };
    delete changes.opening_stock;
    const supabase = await db();
    const rows = check(await supabase.from("inventory_items").update(changes).eq("id", id).select("id"));
    if (!rows?.length) throw new ForbiddenError("Item not found.");
  } catch (err) {
    return failure(err);
  }
  revalidateInventory(id);
  redirect(`/erp/inventory/items/${id}`);
}

export async function deleteItem(_prev: unknown, fd: FormData): Promise<ActionResult> {
  try {
    await requireInventoryAction();
    const id = String(fd.get("id") ?? "");
    if (!UUID.test(id)) throw new ForbiddenError("Item not found.");
    const supabase = await db();
    const rows = check(await supabase.from("inventory_items").delete().eq("id", id).select("id"));
    if (!rows?.length) throw new ForbiddenError("Item not found.");
  } catch (err) {
    return failure(err);
  }
  revalidateInventory();
  redirect("/erp/inventory/items");
}

export async function recordMovement(_prev: unknown, fd: FormData): Promise<ActionResult> {
  try {
    await requireInventoryAction();
    const p = parse(inventoryMoveSchema, formToObject(fd));
    if (!p.ok) return p.result;
    const m = p.data;
    const toSite = m.type === "issue" || m.type === "return";
    const supabase = await db();
    check(await supabase.rpc("erp_inventory_move", {
      p_item: m.item_id,
      p_type: m.type,
      p_quantity: m.quantity,
      p_institution: toSite ? m.institution_id ?? null : null,
      p_issued_to: toSite ? m.issued_to ?? null : null,
      p_reference: m.reference ?? null,
      p_note: m.note ?? null,
    }));
    revalidateInventory(m.item_id);
    return { ok: true, message: "Stock updated." };
  } catch (err) {
    return failure(err);
  }
}

export async function buildKits(_prev: unknown, fd: FormData): Promise<ActionResult> {
  try {
    await requireInventoryAction();
    const p = parse(kitBuildSchema, formToObject(fd));
    if (!p.ok) return p.result;
    const supabase = await db();
    check(await supabase.rpc("erp_inventory_build_kits", {
      p_kit: p.data.kit_id, p_count: p.data.count, p_disassemble: p.data.mode === "disassemble", p_note: p.data.note ?? null,
    }));
    revalidateInventory(p.data.kit_id);
    return {
      ok: true,
      message: p.data.mode === "assemble"
        ? `Built ${p.data.count} kit${p.data.count === 1 ? "" : "s"}. Components were deducted from stock.`
        : `Broke up ${p.data.count} kit${p.data.count === 1 ? "" : "s"}. Components were returned to stock.`,
    };
  } catch (err) {
    return failure(err);
  }
}

export async function addKitComponent(_prev: unknown, fd: FormData): Promise<ActionResult> {
  try {
    await requireInventoryAction();
    const p = parse(kitComponentSchema, formToObject(fd));
    if (!p.ok) return p.result;
    const supabase = await db();
    check(await supabase.from("inventory_kit_components").insert(p.data));
    revalidatePath(`/erp/inventory/items/${p.data.kit_id}`);
    return { ok: true, message: "Component added to kit." };
  } catch (err) {
    return failure(err);
  }
}

export async function removeKitComponent(_prev: unknown, fd: FormData): Promise<ActionResult> {
  try {
    await requireInventoryAction();
    const id = String(fd.get("id") ?? "");
    const kitId = String(fd.get("kit_id") ?? "");
    if (!UUID.test(id) || !UUID.test(kitId)) throw new ForbiddenError("Component not found.");
    const supabase = await db();
    const rows = check(await supabase.from("inventory_kit_components").delete().eq("id", id).eq("kit_id", kitId).select("id"));
    if (!rows?.length) throw new ForbiddenError("Component not found.");
    revalidatePath(`/erp/inventory/items/${kitId}`);
    return { ok: true, message: "Component removed from kit." };
  } catch (err) {
    return failure(err);
  }
}

export async function createCategory(_prev: unknown, fd: FormData): Promise<ActionResult> {
  try {
    await requireInventoryAction();
    const p = parse(inventoryCategorySchema, formToObject(fd));
    if (!p.ok) return p.result;
    const supabase = await db();
    check(await supabase.from("inventory_categories").insert(p.data));
    revalidatePath("/erp/inventory/categories");
    return { ok: true, message: "Category added." };
  } catch (err) {
    return failure(err);
  }
}

export async function deleteCategory(_prev: unknown, fd: FormData): Promise<ActionResult> {
  try {
    await requireInventoryAction();
    const id = String(fd.get("id") ?? "");
    if (!UUID.test(id)) throw new ForbiddenError("Category not found.");
    const supabase = await db();
    const rows = check(await supabase.from("inventory_categories").delete().eq("id", id).select("id"));
    if (!rows?.length) throw new ForbiddenError("Category not found.");
    revalidatePath("/erp/inventory/categories");
    revalidatePath("/erp/inventory/items");
    return { ok: true, message: "Category removed. Its items are now uncategorised." };
  } catch (err) {
    return failure(err);
  }
}
