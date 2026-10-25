"use server";

import { revalidatePath } from "next/cache";
import { db, getErpContext } from "@/lib/erp/context";
import { isSuperAdmin } from "@/lib/erp/inventory";
import { runImport, type ImportState } from "@/lib/erp/import-runner";
import { prepareInventory } from "@/lib/erp/imports";

export async function importInventory(_prev: ImportState | null, fd: FormData): Promise<ImportState> {
  const ctx = await getErpContext();
  if (!ctx) return { ok: false, error: "Your session has expired. Please sign in again." };
  if (!isSuperAdmin(ctx)) return { ok: false, error: "Inventory is restricted to Super Admins." };

  const supabase = await db();
  const state = await runImport<ReturnType<typeof prepareInventory>["payload"][number], {
    created: number; updated: number; units_received: number; errors: { row: number; message: string }[]; saved: boolean;
  }>({
    fd,
    userId: ctx.userId,
    prepare: prepareInventory,
    save: async (rows, dryRun, skipInvalid) =>
      supabase.rpc("erp_inventory_import", { p_rows: rows, p_dry_run: dryRun, p_skip_invalid: skipInvalid }),
    summarize: (r) =>
      `Added ${r.created} new item${r.created === 1 ? "" : "s"}, updated ${r.updated}` +
      (r.units_received ? `, and received ${r.units_received} units into stock` : "") + ".",
  });
  if (state.preview?.saved) {
    for (const p of ["/erp/inventory", "/erp/inventory/items", "/erp/inventory/movements", "/erp/inventory/categories"]) revalidatePath(p);
  }
  return state;
}
