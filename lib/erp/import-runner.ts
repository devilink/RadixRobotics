import "server-only";
import { db } from "./context";
import { friendlyDbError } from "./errors";
import { withDbErrors, type ImportPreview } from "./imports";
import { sharedRateLimit } from "./rate-limit";
import { ImportSourceError, readImportSource } from "./spreadsheet-source";
import type { Cell } from "./spreadsheet";

export type ImportState = { ok: boolean; error?: string; preview?: ImportPreview };

type DbResult = { errors: { row: number; message: string }[]; notes?: { row: number; message: string }[]; saved: boolean };

/**
 * Shared flow for spreadsheet imports. mode=check reads and validates the sheet
 * and runs a database dry run; mode=import does the same and then saves. The
 * sheet is re-read on import, so the database always checks what is saved.
 */
export async function runImport<P extends { row: number }, R extends DbResult>(opts: {
  fd: FormData;
  userId: string;
  prepare: (table: Cell[][]) => {
    preview: Omit<ImportPreview, "invalid" | "summary" | "saved">;
    payload: P[];
    fatal?: string;
  };
  save: (rows: P[], dryRun: boolean, skipInvalid: boolean) => Promise<{ data: unknown; error: { code?: string; message: string } | null }>;
  summarize: (r: R) => string;
  /** Adjust the preview with what the database returned (e.g. generated IDs). */
  decorate?: (preview: ImportPreview, r: R) => ImportPreview;
}): Promise<ImportState> {
  const commit = opts.fd.get("mode") === "import";
  const skipInvalid = opts.fd.get("skip_invalid") === "on";
  const supabase = await db();
  if (!(await sharedRateLimit(supabase, opts.userId, "spreadsheet-import", 30, 60_000))) {
    return { ok: false, error: "Too many imports in a short time. Please wait a minute." };
  }

  let table: Cell[][];
  try {
    table = await readImportSource(opts.fd);
  } catch (err) {
    if (err instanceof ImportSourceError) return { ok: false, error: err.message };
    console.error("[erp] import source failed", err);
    return { ok: false, error: "The sheet could not be read." };
  }

  const prep = opts.prepare(table);
  if (prep.fatal) return { ok: false, error: prep.fatal };
  if (prep.preview.total === 0) return { ok: false, error: "The sheet has a header row but no data rows." };

  const badRows = new Set(prep.preview.rows.filter((r) => r.errors.length).map((r) => r.row));
  const valid = prep.payload.filter((p) => !badRows.has(p.row));
  const checked = withDbErrors(prep.preview, []);

  if (commit && badRows.size > 0 && !skipInvalid) {
    return { ok: true, preview: { ...checked, saved: false, summary: "Nothing was uploaded. Fix the rows marked below, or tick “Skip rows with problems”." } };
  }
  if (valid.length === 0) return { ok: true, preview: { ...checked, saved: false } };

  const { data, error } = await opts.save(valid, !commit, skipInvalid);
  if (error) return { ok: false, error: friendlyDbError(error, "The import could not be completed.") };
  const result = data as R;
  const merged = withDbErrors(prep.preview, result.errors ?? [], result.notes ?? []);
  const preview = opts.decorate ? opts.decorate(merged, result) : merged;
  if (!commit) return { ok: true, preview };
  if (!result.saved) {
    return { ok: true, preview: { ...preview, saved: false, summary: "Nothing was uploaded. Fix the rows marked below, or tick “Skip rows with problems”." } };
  }
  const skipped = preview.invalid;
  return {
    ok: true,
    preview: { ...preview, saved: true, summary: `${opts.summarize(result)}${skipped ? ` ${skipped} row${skipped === 1 ? " was" : "s were"} skipped.` : ""}` },
  };
}
