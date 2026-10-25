"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Clock, Printer, Search } from "lucide-react";
import { ATTENDANCE_STATUS_LABELS, STATUSES_BY_KIND, type AttendanceKind, type AttendanceStatus } from "@/lib/erp/types";
import { ActionForm, SubmitButton } from "../../../_components/forms";
import { AttendanceBadge, Badge, Field, Notice, buttonClass, cx, focusRing, inputClass } from "../../../_components/ui";
import { correctRecord, finalizeRegister, saveRegister } from "../../actions";

export type RosterRow = {
  membership_id: string; member_code: string; full_name: string; member_type: string;
  record_id: string | null; status: AttendanceStatus | null; check_in: string | null; check_out: string | null;
  remarks: string | null; version: number | null; corrected: boolean; on_approved_leave: boolean;
  shift_start: string | null; grace_minutes: number | null; on_roster: boolean; pending_correction: boolean;
};

type Entry = { status: AttendanceStatus | null; check_in: string; check_out: string; remarks: string };

export type EditorFlags = {
  editable: boolean;          // may mark/edit (not finalised, within window, has permission)
  canSubmit: boolean;
  canFinalize: boolean;
  correctionMode: "direct" | "request" | null;
  showTimesDefault: boolean;
  readOnlyReason?: string;
};

const STATUS_STYLES: Record<AttendanceStatus, string> = {
  present: "peer-checked:bg-emerald-700 peer-checked:text-white peer-checked:border-emerald-700",
  absent: "peer-checked:bg-rose-700 peer-checked:text-white peer-checked:border-rose-700",
  late: "peer-checked:bg-amber-500 peer-checked:text-zinc-950 peer-checked:border-amber-500",
  excused: "peer-checked:bg-sky-700 peer-checked:text-white peer-checked:border-sky-700",
  half_day: "peer-checked:bg-violet-700 peer-checked:text-white peer-checked:border-violet-700",
  on_leave: "peer-checked:bg-zinc-600 peer-checked:text-white peer-checked:border-zinc-600",
};
const SHORT: Record<AttendanceStatus, string> = { present: "P", absent: "A", late: "L", excused: "E", half_day: "½", on_leave: "OL" };
const PAGE = 150;

function nowIn(tz: string) {
  return new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date());
}
function addMinutes(hhmm: string, mins: number) {
  const [h, m] = hhmm.split(":").map(Number);
  const t = h * 60 + m + mins;
  return `${String(Math.floor(t / 60) % 24).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
}

export function RegisterEditor({ sessionId, kind, timezone, sessionStatus, rows, flags }: {
  sessionId: string; kind: AttendanceKind; timezone: string; sessionStatus: string; rows: RosterRow[]; flags: EditorFlags;
}) {
  const statuses = STATUSES_BY_KIND[kind];
  const initial = useMemo(
    () => Object.fromEntries(rows.map((r) => [r.membership_id, { status: r.status, check_in: r.check_in ?? "", check_out: r.check_out ?? "", remarks: r.remarks ?? "" }])) as Record<string, Entry>,
    [rows]
  );
  const [draft, setDraft] = useState<Record<string, Entry>>(initial);
  // After a save the server re-renders with fresh rows: adopt them as the new
  // baseline without remounting (which would also wipe the status message).
  const [baseline, setBaseline] = useState(initial);
  if (baseline !== initial) {
    setBaseline(initial);
    setDraft(initial);
  }
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "unmarked" | AttendanceStatus>("all");
  const [showTimes, setShowTimes] = useState(flags.showTimesDefault);
  const [limit, setLimit] = useState(PAGE);
  const [bulkStatus, setBulkStatus] = useState<AttendanceStatus>("present");
  const [message, setMessage] = useState<{ tone: "success" | "error" | "warn"; text: string } | null>(null);
  const [pending, start] = useTransition();
  const [correcting, setCorrecting] = useState<RosterRow | null>(null);

  const dirtyIds = useMemo(
    () => rows.filter((r) => {
      const a = draft[r.membership_id], b = initial[r.membership_id];
      return a.status !== b.status || a.check_in !== b.check_in || a.check_out !== b.check_out || a.remarks !== b.remarks;
    }).map((r) => r.membership_id),
    [draft, initial, rows]
  );
  const dirty = dirtyIds.length > 0;

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { unmarked: 0 };
    for (const r of rows) {
      const s = draft[r.membership_id].status;
      c[s ?? "unmarked"] = (c[s ?? "unmarked"] ?? 0) + 1;
    }
    return c;
  }, [draft, rows]);

  const visible = useMemo(() => {
    const s = q.trim().toLowerCase();
    return rows.filter((r) => {
      const st = draft[r.membership_id].status;
      if (filter === "unmarked" ? st !== null : filter !== "all" && st !== filter) return false;
      return !s || r.full_name.toLowerCase().includes(s) || r.member_code.toLowerCase().includes(s);
    });
  }, [rows, draft, q, filter]);

  const setEntry = (id: string, patch: Partial<Entry>) => setDraft((d) => ({ ...d, [id]: { ...d[id], ...patch } }));

  /** Present with a check-in after shift start + grace is suggested as Late. */
  const withLateRule = (r: RosterRow, e: Entry): Entry => {
    if (e.status === "present" && r.shift_start && e.check_in && e.check_in > addMinutes(r.shift_start.slice(0, 5), r.grace_minutes ?? 0)) {
      return { ...e, status: "late" };
    }
    return e;
  };

  const markUnmarked = () =>
    setDraft((d) => {
      const next = { ...d };
      for (const r of rows) if (next[r.membership_id].status === null) {
        next[r.membership_id] = { ...next[r.membership_id], status: kind === "staff" && r.on_approved_leave ? "on_leave" : "present" };
      }
      return next;
    });

  const applyToVisible = () =>
    setDraft((d) => {
      const next = { ...d };
      for (const r of visible) next[r.membership_id] = { ...next[r.membership_id], status: bulkStatus };
      return next;
    });

  const save = (submit: boolean) => {
    setMessage(null);
    if (submit && counts.unmarked) {
      setMessage({ tone: "warn", text: `${counts.unmarked} ${counts.unmarked === 1 ? "person is" : "people are"} still unmarked. Mark everyone before submitting.` });
      return;
    }
    const entries = dirtyIds
      .map((id) => ({ membership_id: id, ...draft[id] }))
      .filter((e) => e.status !== null)
      .map((e) => ({
        membership_id: e.membership_id, status: e.status!,
        check_in: e.check_in || undefined, check_out: e.check_out || undefined, remarks: e.remarks || undefined,
      }));
    start(async () => {
      const res = await saveRegister({ session_id: sessionId, entries, submit });
      setMessage(res.ok ? { tone: "success", text: res.message ?? "Saved." } : { tone: "error", text: res.error });
    });
  };

  const finalize = () => {
    if (dirty) {
      setMessage({ tone: "warn", text: "Save your changes before finalising." });
      return;
    }
    if (!window.confirm("Finalise this register? After finalising, changes need a logged correction.")) return;
    start(async () => {
      const res = await finalizeRegister(sessionId);
      setMessage(res.ok ? { tone: "success", text: res.message ?? "Finalised." } : { tone: "error", text: res.error });
    });
  };

  return (
    <div>
      {/* Summary + toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-2 text-xs" aria-label="Register summary">
        <Badge tone="dark">{rows.length} on register</Badge>
        {statuses.map((s) => counts[s] ? <span key={s}><AttendanceBadge status={s} /> <span className="tabular-nums">{counts[s]}</span></span> : null)}
        {counts.unmarked > 0 && <Badge tone="amber">{counts.unmarked} unmarked</Badge>}
        {dirty && <Badge tone="violet">{dirtyIds.length} unsaved</Badge>}
      </div>

      <div className="mb-4 flex flex-col gap-2 lg:flex-row lg:items-center print:hidden">
        <div className="relative lg:w-72">
          <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />
          <label htmlFor="roster-search" className="sr-only">Search by name or ID</label>
          <input id="roster-search" value={q} onChange={(e) => { setQ(e.target.value); setLimit(PAGE); }} placeholder="Search name or ID" className={cx(inputClass, "pl-9")} />
        </div>
        <label htmlFor="roster-filter" className="sr-only">Filter by status</label>
        <select id="roster-filter" value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)} className={cx(inputClass, "lg:w-44")}>
          <option value="all">All statuses</option>
          <option value="unmarked">Unmarked</option>
          {statuses.map((s) => <option key={s} value={s}>{ATTENDANCE_STATUS_LABELS[s]}</option>)}
        </select>
        <label className="flex items-center gap-2 text-sm text-zinc-300">
          <input type="checkbox" checked={showTimes} onChange={(e) => setShowTimes(e.target.checked)} className="h-4 w-4 rounded border-zinc-700" />
          Check-in / out times
        </label>
        <div className="flex flex-wrap items-center gap-2 lg:ml-auto">
          {flags.editable && (
            <>
              <button type="button" onClick={markUnmarked} disabled={!counts.unmarked} className={buttonClass("secondary", "sm")}>
                Mark unmarked present
              </button>
              <label htmlFor="bulk-status" className="sr-only">Status for all shown</label>
              <select id="bulk-status" value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value as AttendanceStatus)} className={cx(inputClass, "w-auto py-1.5 text-xs")}>
                {statuses.map((s) => <option key={s} value={s}>{ATTENDANCE_STATUS_LABELS[s]}</option>)}
              </select>
              <button type="button" onClick={applyToVisible} disabled={!visible.length} className={buttonClass("secondary", "sm")}>
                Apply to {visible.length} shown
              </button>
            </>
          )}
          <button type="button" onClick={() => window.print()} className={buttonClass("ghost", "sm")}>
            <Printer aria-hidden className="h-4 w-4" /> Print
          </button>
        </div>
      </div>

      {!flags.editable && flags.readOnlyReason && <div className="mb-4 print:hidden"><Notice tone="info">{flags.readOnlyReason}</Notice></div>}
      <div aria-live="polite" className="mb-4 empty:hidden print:hidden">{message && <Notice tone={message.tone}>{message.text}</Notice>}</div>

      {/* Roster */}
      {visible.length === 0 ? (
        <p className="rounded-lg border border-dashed border-zinc-700 p-8 text-center text-sm text-zinc-400">
          {rows.length === 0 ? "Nobody is on this register. Enrol students in the class or batch first." : "No one matches these filters."}
        </p>
      ) : (
        <ul className="divide-y divide-zinc-800/60 rounded-lg border border-zinc-800">
          {visible.slice(0, limit).map((r) => {
            const e = draft[r.membership_id];
            const changed = dirtyIds.includes(r.membership_id);
            return (
              <li key={r.membership_id} className={cx("flex flex-col gap-2 px-3 py-3 md:flex-row md:items-center", changed && "bg-violet-500/5")}>
                <div className="min-w-0 md:w-64">
                  <p className="truncate text-sm font-medium text-zinc-100">{r.full_name}</p>
                  <p className="flex flex-wrap items-center gap-1.5 text-xs text-zinc-500">
                    <span className="font-mono">{r.member_code}</span>
                    {r.on_approved_leave && <Badge tone="neutral">Approved leave</Badge>}
                    {!r.on_roster && <Badge tone="amber">No longer enrolled</Badge>}
                    {r.corrected && <Badge tone="sky">Corrected</Badge>}
                    {r.pending_correction && <Badge tone="amber">Correction pending</Badge>}
                    {r.shift_start && <span>Shift {r.shift_start.slice(0, 5)} (+{r.grace_minutes}m)</span>}
                  </p>
                </div>

                {flags.editable ? (
                  <fieldset className="flex flex-wrap gap-1">
                    <legend className="sr-only">Status for {r.full_name}</legend>
                    {statuses.map((s) => (
                      <label key={s} className="relative">
                        <input type="radio" name={`status-${r.membership_id}`} value={s} checked={e.status === s}
                          onChange={() => setEntry(r.membership_id, withLateRule(r, { ...e, status: s }))} className="peer sr-only" />
                        <span title={ATTENDANCE_STATUS_LABELS[s]}
                          className={cx("inline-flex min-w-9 cursor-pointer items-center justify-center rounded-md border border-zinc-700 px-2 py-1.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 peer-focus-visible:ring-2 peer-focus-visible:ring-brand-500 peer-focus-visible:ring-offset-1", STATUS_STYLES[s])}>
                          <span className="sm:hidden" aria-hidden>{SHORT[s]}</span>
                          <span className="hidden sm:inline">{ATTENDANCE_STATUS_LABELS[s]}</span>
                          <span className="sr-only sm:hidden">{ATTENDANCE_STATUS_LABELS[s]}</span>
                        </span>
                      </label>
                    ))}
                  </fieldset>
                ) : (
                  <div className="flex items-center gap-2"><AttendanceBadge status={e.status} /></div>
                )}

                {showTimes && (
                  <div className="flex items-center gap-2">
                    {(["check_in", "check_out"] as const).map((f) => (
                      <div key={f} className="flex items-center gap-1">
                        <label htmlFor={`${f}-${r.membership_id}`} className="text-xs text-zinc-500">{f === "check_in" ? "In" : "Out"}</label>
                        <input id={`${f}-${r.membership_id}`} type="time" value={e[f]} disabled={!flags.editable}
                          onChange={(ev) => setEntry(r.membership_id, withLateRule(r, { ...e, [f]: ev.target.value }))}
                          className={cx(inputClass, "w-[6.5rem] px-2 py-1 text-xs")} />
                        {flags.editable && (
                          <button type="button" title={`Set ${f === "check_in" ? "check-in" : "check-out"} to now`}
                            aria-label={`Set ${f === "check_in" ? "check-in" : "check-out"} to now for ${r.full_name}`}
                            onClick={() => {
                              const now = nowIn(timezone);
                              const status = e.status ?? (f === "check_in" ? "present" : e.status);
                              setEntry(r.membership_id, withLateRule(r, { ...e, status, [f]: now }));
                            }}
                            className={cx("rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-100", focusRing)}>
                            <Clock aria-hidden className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex flex-1 items-center gap-2 md:justify-end">
                  {flags.editable ? (
                    <>
                      <label htmlFor={`remarks-${r.membership_id}`} className="sr-only">Remarks for {r.full_name}</label>
                      <input id={`remarks-${r.membership_id}`} value={e.remarks} maxLength={500} placeholder="Remarks"
                        onChange={(ev) => setEntry(r.membership_id, { remarks: ev.target.value })}
                        className={cx(inputClass, "py-1 text-xs md:max-w-48")} />
                    </>
                  ) : (
                    e.remarks && <span className="text-xs text-zinc-400">{e.remarks}</span>
                  )}
                  {!flags.editable && flags.correctionMode && r.record_id && !r.pending_correction && (
                    <button type="button" onClick={() => setCorrecting(r)} className={cx(buttonClass("secondary", "sm"), "print:hidden")}>
                      {flags.correctionMode === "direct" ? "Correct" : "Request correction"}
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {visible.length > limit && (
        <div className="mt-3 flex justify-center print:hidden">
          <button type="button" onClick={() => setLimit((l) => l + PAGE)} className={buttonClass("secondary", "sm")}>
            Show {Math.min(PAGE, visible.length - limit)} more of {visible.length - limit}
          </button>
        </div>
      )}

      {/* Actions */}
      {(flags.editable || flags.canFinalize) && (
        <div className="sticky bottom-0 -mx-4 mt-6 flex flex-wrap items-center justify-end gap-2 border-t border-zinc-800 bg-zinc-950/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-lg sm:border print:hidden">
          {dirty && <span className="mr-auto text-xs text-zinc-400">{dirtyIds.length} unsaved change{dirtyIds.length === 1 ? "" : "s"}</span>}
          {flags.editable && (
            <button type="button" onClick={() => setDraft(initial)} disabled={!dirty || pending} className={buttonClass("ghost")}>
              Discard
            </button>
          )}
          {flags.editable && (
            <button type="button" onClick={() => save(false)} disabled={pending || !dirty} className={buttonClass("secondary")}>
              {pending ? "Saving…" : "Save draft"}
            </button>
          )}
          {flags.editable && flags.canSubmit && sessionStatus === "draft" && (
            <button type="button" onClick={() => save(true)} disabled={pending} className={buttonClass("primary")}>
              Save & submit
            </button>
          )}
          {flags.editable && sessionStatus === "submitted" && (
            <button type="button" onClick={() => save(false)} disabled={pending || !dirty} className={buttonClass("primary")}>
              Save changes
            </button>
          )}
          {flags.canFinalize && sessionStatus === "submitted" && (
            <button type="button" onClick={finalize} disabled={pending} className={buttonClass("primary")}>
              Finalise register
            </button>
          )}
        </div>
      )}

      {correcting && flags.correctionMode && (
        <CorrectionDialog row={correcting} sessionId={sessionId} kind={kind} mode={flags.correctionMode} onClose={() => setCorrecting(null)} />
      )}
    </div>
  );
}

function CorrectionDialog({ row, sessionId, kind, mode, onClose }: {
  row: RosterRow; sessionId: string; kind: AttendanceKind; mode: "direct" | "request"; onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { ref.current?.showModal(); }, []);
  return (
    <dialog ref={ref} onClose={onClose} aria-labelledby="corr-title"
      className="m-auto w-[min(32rem,calc(100vw-2rem))] rounded-2xl border border-zinc-800 bg-zinc-900 p-0 text-zinc-100 shadow-2xl backdrop:bg-black/70 backdrop:backdrop-blur-sm">
      <div className="p-5">
        <h2 id="corr-title" className="text-base font-semibold text-zinc-100">
          {mode === "direct" ? "Correct attendance" : "Request a correction"} · {row.full_name}
        </h2>
        <p className="mt-1 text-sm text-zinc-400">
          Currently <AttendanceBadge status={row.status} />.{" "}
          {mode === "direct" ? "The change and your reason are written to the audit log." : "An approver will review this request."}
        </p>
        <ActionForm action={correctRecord} className="mt-4" onSuccess={() => setTimeout(() => ref.current?.close(), 900)}>
          {({ errors }) => (
            <>
              <input type="hidden" name="record_id" value={row.record_id!} />
              <input type="hidden" name="session_id" value={sessionId} />
              <input type="hidden" name="mode" value={mode} />
              <Field label="New status" htmlFor="corr-status" error={errors.status} required>
                <select id="corr-status" name="status" defaultValue={row.status ?? "present"} className={inputClass}>
                  {STATUSES_BY_KIND[kind].map((s) => <option key={s} value={s}>{ATTENDANCE_STATUS_LABELS[s]}</option>)}
                </select>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Check-in" htmlFor="corr-in" error={errors.check_in}>
                  <input id="corr-in" name="check_in" type="time" defaultValue={row.check_in ?? ""} className={inputClass} />
                </Field>
                <Field label="Check-out" htmlFor="corr-out" error={errors.check_out}>
                  <input id="corr-out" name="check_out" type="time" defaultValue={row.check_out ?? ""} className={inputClass} />
                </Field>
              </div>
              <Field label="Reason" htmlFor="corr-reason" error={errors.reason} required hint="At least 5 characters. Visible in the audit log.">
                <textarea id="corr-reason" name="reason" rows={3} maxLength={500} required className={inputClass} />
              </Field>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => ref.current?.close()} className={buttonClass("secondary")}>Cancel</button>
                <SubmitButton>{mode === "direct" ? "Save correction" : "Send request"}</SubmitButton>
              </div>
            </>
          )}
        </ActionForm>
      </div>
    </dialog>
  );
}
