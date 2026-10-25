"use server";

import { revalidatePath } from "next/cache";
import { db, getErpContext, can } from "@/lib/erp/context";
import { runImport, type ImportState } from "@/lib/erp/import-runner";
import { prepareStudents } from "@/lib/erp/imports";

export async function importStudents(_prev: ImportState | null, fd: FormData): Promise<ImportState> {
  const ctx = await getErpContext();
  if (!ctx) return { ok: false, error: "Your session has expired. Please sign in again." };
  const institutionId = String(fd.get("institution_id") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(institutionId)) return { ok: false, error: "Choose the school or learning centre." };
  if (!can(ctx.perms, "students.manage", institutionId)) return { ok: false, error: "You are not allowed to add students there." };

  const supabase = await db();
  const state = await runImport<ReturnType<typeof prepareStudents>["payload"][number], {
    ok: number; enrolled: number; guardians: number; errors: { row: number; message: string }[]; saved: boolean;
  }>({
    fd,
    userId: ctx.userId,
    prepare: prepareStudents,
    save: async (rows, dryRun, skipInvalid) =>
      supabase.rpc("erp_import_students", { p_institution: institutionId, p_rows: rows, p_dry_run: dryRun, p_skip_invalid: skipInvalid }),
    summarize: (r) =>
      `Imported ${r.ok} student${r.ok === 1 ? "" : "s"}` +
      (r.enrolled ? `, ${r.enrolled} enrolled in a class or batch` : "") +
      (r.guardians ? `, ${r.guardians} guardian contact${r.guardians === 1 ? "" : "s"} added` : "") + ".",
  });
  if (state.preview?.saved) revalidatePath("/erp/people");
  return state;
}
