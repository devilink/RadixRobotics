"use client";

import { useActionState, useMemo, useState, useTransition, type FormEvent, type ReactNode } from "react";
import { CheckCircle2, Download, FileSpreadsheet, Link2, Loader2, Upload, Zap } from "lucide-react";
import type { ImportPreview } from "@/lib/erp/imports";
import { templateCsv } from "@/lib/erp/spreadsheet";
import { Badge, Notice, buttonClass, cx, inputClass, td, th } from "./ui";

type ImportState = { ok: boolean; error?: string; preview?: ImportPreview };

const SHOW_LIMIT = 500;

/**
 * Two steps: 1. Check (reads the sheet and runs a full dry run against the
 * database; nothing is saved) -> 2. Upload (saves). The form is submitted
 * manually so the chosen file stays selected between the two steps.
 */
export function SpreadsheetImport({ action, children, template, noun, forceHelp }: {
  action: (prev: ImportState | null, fd: FormData) => Promise<ImportState>;
  /** Extra fields sent with the sheet (e.g. institution). */
  children?: ReactNode;
  template: { headers: string[]; example: string[][]; filename: string };
  noun: string;
  /** Enables "Force upload" (upload every row; what does not fit is kept). Text for its confirmation. */
  forceHelp?: string;
}) {
  const [state, formAction] = useActionState(action, null);
  const [pending, startTransition] = useTransition();
  const [source, setSource] = useState<"file" | "link">("file");
  const [onlyProblems, setOnlyProblems] = useState(false);
  // Rows with problems are skipped by default so the good rows can still be uploaded.
  const [skip, setSkip] = useState(true);
  const [lastMode, setLastMode] = useState<"check" | "import" | "force">("check");
  const templateHref = useMemo(
    () => `data:text/csv;charset=utf-8,${encodeURIComponent("﻿" + templateCsv(template.headers, template.example))}`,
    [template],
  );

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const fd = new FormData(e.currentTarget, submitter);
    if (source === "file") fd.delete("sheet_url");
    else fd.delete("file");
    const mode = fd.get("mode");
    if (mode === "force" && forceHelp && !window.confirm(forceHelp)) return;
    setLastMode(mode === "import" ? "import" : mode === "force" ? "force" : "check");
    startTransition(() => formAction(fd));
  }

  const p = state?.ok ? state.preview : undefined;
  const valid = p ? p.total - p.invalid : 0;
  const withNotes = p ? p.rows.filter((r) => !r.errors.length && r.notes?.length).length : 0;
  const checked = Boolean(p && !p.saved);
  const step = p?.saved ? 3 : checked ? 2 : 1;
  const rows = p ? (onlyProblems ? p.rows.filter((r) => r.errors.length) : p.rows) : [];

  return (
    <div className="space-y-5">
      <ol className="flex flex-wrap items-center gap-2 text-sm" aria-label="Import steps">
        {[["1", "Check the sheet"], ["2", `Upload ${noun}`]].map(([n, label], i) => {
          const done = step > i + 1;
          const current = step === i + 1;
          return (
            <li key={n} className="flex items-center gap-2" aria-current={current ? "step" : undefined}>
              {i > 0 && <span aria-hidden className="h-px w-6 bg-zinc-700" />}
              <span className={cx("flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold",
                done ? "bg-emerald-500/20 text-emerald-300" : current ? "bg-brand-500 text-white" : "bg-zinc-800 text-zinc-400")}>
                {done ? <CheckCircle2 aria-hidden className="h-4 w-4" /> : n}
              </span>
              <span className={current ? "font-medium text-zinc-100" : "text-zinc-400"}>{label}</span>
            </li>
          );
        })}
      </ol>

      <form onSubmit={submit} className="space-y-4" noValidate>
        {children}

        <div>
          <p className="mb-1 text-sm font-medium text-zinc-200" id="src-label">Spreadsheet</p>
          <div role="radiogroup" aria-labelledby="src-label" className="mb-3 inline-flex rounded-xl border border-zinc-800 bg-zinc-950/50 p-1 text-sm">
            {([["file", "Upload Excel / CSV", FileSpreadsheet], ["link", "Google Sheet link", Link2]] as const).map(([v, label, Icon]) => (
              <button key={v} type="button" role="radio" aria-checked={source === v} onClick={() => setSource(v)}
                className={cx("inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5", source === v ? "bg-brand-500/15 text-brand-300" : "text-zinc-400 hover:text-zinc-200")}>
                <Icon aria-hidden className="h-4 w-4" /> {label}
              </button>
            ))}
          </div>
          {source === "file" ? (
            <>
              <label htmlFor="imp-file" className="sr-only">Excel or CSV file</label>
              <input id="imp-file" name="file" type="file" accept=".xlsx,.csv,.tsv,.txt,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
                className={cx(inputClass, "file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-800 file:px-3 file:py-1 file:text-zinc-200")} />
              <p className="mt-1 text-xs text-zinc-500">Excel (.xlsx) or CSV, up to 5 MB and 2000 rows. The first sheet is read.</p>
            </>
          ) : (
            <>
              <label htmlFor="imp-link" className="sr-only">Google Sheets link</label>
              <input id="imp-link" name="sheet_url" type="url" placeholder="https://docs.google.com/spreadsheets/d/…" className={inputClass} />
              <p className="mt-1 text-xs text-zinc-500">
                In Google Sheets click <strong>Share</strong> → General access → <strong>Anyone with the link</strong> (Viewer), then copy the link.
                The tab open in the link is read.
              </p>
            </>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button type="submit" name="mode" value="check" disabled={pending} className={buttonClass(checked ? "secondary" : "primary")}>
            {pending && lastMode === "check" && <Loader2 aria-hidden className="h-4 w-4 animate-spin" />}
            {pending && lastMode === "check" ? "Checking…" : checked ? "Check again" : "1. Check sheet"}
          </button>
          {p && checked && valid > 0 && (
            <button type="submit" name="mode" value="import" disabled={pending || (p.invalid > 0 && !skip)} className={buttonClass("primary")}>
              {pending && lastMode === "import" ? <Loader2 aria-hidden className="h-4 w-4 animate-spin" /> : <Upload aria-hidden className="h-4 w-4" />}
              {pending && lastMode === "import" ? "Uploading…" : `2. Upload ${valid} ${noun}`}
            </button>
          )}
          {/* Shown whenever something would be skipped or left out, even if no row is valid. */}
          {p && checked && forceHelp && (p.invalid > 0 || withNotes > 0 || p.ignoredColumns.length > 0) && (
            <button type="submit" name="mode" value="force" disabled={pending} className={buttonClass("danger")}
              title="Upload every row of the sheet. Nothing is skipped; values that do not fit are kept in each record's notes.">
              {pending && lastMode === "force" ? <Loader2 aria-hidden className="h-4 w-4 animate-spin" /> : <Zap aria-hidden className="h-4 w-4" />}
              {pending && lastMode === "force" ? "Uploading everything…" : `Force upload all ${p.total} rows`}
            </button>
          )}
          {p && checked && valid > 0 && (
            <>
              {p.invalid > 0 && (
                <label className="flex items-center gap-2 text-sm text-zinc-300">
                  <input type="checkbox" name="skip_invalid" className="h-4 w-4 accent-brand-500" onChange={(e) => setSkip(e.target.checked)} checked={skip} />
                  Skip {p.invalid} row{p.invalid === 1 ? "" : "s"} with problems
                </label>
              )}
            </>
          )}
          <a href={templateHref} download={template.filename} className={cx(buttonClass("ghost", "sm"), "ml-auto")}>
            <Download aria-hidden className="h-4 w-4" /> Download template
          </a>
        </div>
      </form>

      {state && !state.ok && <Notice tone="error">{state.error}</Notice>}
      {p?.summary && (
        <Notice tone={p.saved ? "success" : "warn"}>
          {p.saved && <CheckCircle2 aria-hidden className="mr-1 inline h-4 w-4" />}{p.summary}
          {p.saved && p.rows.some((r) => r.href) && " Click a name below to edit that record."}
        </Notice>
      )}
      {p && !p.saved && !p.summary && (
        <Notice tone={p.invalid ? "warn" : "success"}>
          Checked {p.total} row{p.total === 1 ? "" : "s"}: {valid} ready to upload
          {withNotes ? ` (${withNotes} with some cells left blank, see the notes)` : ""}
          {p.invalid ? `, ${p.invalid} with problems that will ${skip ? "be skipped" : "stop the upload"}.` : "."}
          {" "}Nothing has been saved yet. Click <strong>Upload</strong> to save.
        </Notice>
      )}
      {p && p.ignoredColumns.length > 0 && (
        <p className="text-xs text-zinc-500">
          Columns not used: {p.ignoredColumns.join(", ")}.{forceHelp ? " Force upload keeps them in each student's notes." : ""}
        </p>
      )}

      {p && p.rows.length > 0 && (
        <div>
          {p.invalid > 0 && (
            <label className="mb-2 flex items-center gap-2 text-sm text-zinc-300">
              <input type="checkbox" checked={onlyProblems} onChange={(e) => setOnlyProblems(e.target.checked)} className="h-4 w-4 accent-brand-500" />
              Show only rows with problems
            </label>
          )}
          <div className="-mx-4 max-h-[32rem] overflow-auto sm:mx-0">
            <table className="w-full min-w-[720px] border-collapse text-left text-sm">
              <caption className="sr-only">Import preview</caption>
              <thead className="sticky top-0 bg-zinc-900">
                <tr>
                  <th className={th}>Row</th>
                  {p.columns.map((c) => <th key={c} className={th}>{c}</th>)}
                  <th className={th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, SHOW_LIMIT).map((r) => (
                  <tr key={r.row} className={cx("align-top", r.errors.length > 0 && "bg-rose-500/5")}>
                    <td className={cx(td, "tabular-nums text-zinc-500")}>{r.row}</td>
                    {r.cells.map((c, i) => (
                      <td key={i} className={cx(td, "text-xs")}>
                        {i === 0 && r.href ? <a href={r.href} className="font-medium text-brand-300 hover:underline">{c}</a> : c}
                      </td>
                    ))}
                    <td className={cx(td, "text-xs")}>
                      {r.errors.length === 0 ? (
                        <>
                          <Badge tone="green">{p.saved ? "Uploaded" : "Ready"}</Badge>
                          {r.notes && r.notes.length > 0 && (
                            <ul className="mt-1 space-y-0.5 text-amber-300">{r.notes.map((n, i) => <li key={i}>{n}</li>)}</ul>
                          )}
                        </>
                      ) : (
                        <ul className="space-y-0.5 text-rose-300">{r.errors.map((e, i) => <li key={i}>{e}</li>)}</ul>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {rows.length > SHOW_LIMIT && <p className="mt-2 text-xs text-zinc-500">Showing the first {SHOW_LIMIT} of {rows.length} rows.</p>}
        </div>
      )}
    </div>
  );
}
