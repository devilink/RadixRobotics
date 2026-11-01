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
    ok: number; enrolled: number; guardians: number; saved: boolean;
    errors: { row: number; message: string }[]; notes?: { row: number; message: string }[]; codes?: { row: number; code: string }[];
    members?: { row: number; id: string }[];
  }>({
    fd,
    userId: ctx.userId,
    prepare: prepareStudents,
    // p_force is only sent for a force upload, so normal imports also work on a database
    // that does not have migration 13 yet.
    save: async (rows, dryRun, skipInvalid, force) =>
      supabase.rpc("erp_import_students", {
        p_institution: institutionId, p_rows: rows, p_dry_run: dryRun, p_skip_invalid: skipInvalid,
        ...(force ? { p_force: true } : {}),
      }),
    summarize: (r) =>
      `Imported ${r.ok} student${r.ok === 1 ? "" : "s"}` +
      (r.enrolled ? `, ${r.enrolled} enrolled in a class or batch` : "") +
      (r.guardians ? `, ${r.guardians} guardian contact${r.guardians === 1 ? "" : "s"} added` : "") +
      (r.codes?.length ? `, ${r.codes.length} Student ID${r.codes.length === 1 ? "" : "s"} generated` : "") + ".",
    // Show the Student IDs the database generated (the same ones the upload will use).
    // and, once saved, link each row to the student's record so it can be edited.
    decorate: (preview, r) => {
      const codes = new Map((r.codes ?? []).map((c) => [c.row, c.code]));
      const ids = new Map((r.members ?? []).map((m) => [m.row, m.id]));
      return {
        ...preview,
        rows: preview.rows.map((row) => ({
          ...row,
          cells: codes.has(row.row) ? row.cells.map((cell, i) => (i === 1 ? `${codes.get(row.row)} (auto)` : cell)) : row.cells,
          ...(ids.has(row.row) ? { href: `/erp/people/${ids.get(row.row)}/edit` } : {}),
        })),
      };
    },
  });
  if (state.preview?.saved) revalidatePath("/erp/people");
  return state;
}
