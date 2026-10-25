"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { addDays, formatDate } from "@/lib/erp/format";
import { RAMPS, type HeatCategory, type HeatCell, type HeatMetric } from "@/lib/erp/charts";
import { cx, focusRing } from "./ui";

// Shared dashboard charts for the ERP. All share one dark-surface vocabulary:
// hairline zinc grid, thin marks, 2px surface gaps, a hover/focus tooltip on
// every mark, and a legend or table so identity is never colour alone.

const EMPTY = "#27272a"; // zinc-800: a day with no records
const TEXT_MUTED = "#71717a";

// ---------------------------------------------------------------------------
// Year heatmap (GitHub-style contribution calendar)
// ---------------------------------------------------------------------------

const CELL = 12, GAP = 3, STEP = CELL + GAP, LEFT = 30, TOP = 18, WEEKS = 53;
const W = LEFT + WEEKS * STEP, H = TOP + 7 * STEP;
const DOW = ["Mon", "", "Wed", "", "Fri", "", ""];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const isoDow = (date: string) => (new Date(`${date}T00:00:00Z`).getUTCDay() + 6) % 7; // 0 = Monday

export function YearHeatmap({
  label, cells, endDate, metrics, categories, ramp = RAMPS.green, dayHref, dayHrefLabel = "Open this day", emptyLabel = "No records",
}: {
  label: string;
  cells: HeatCell[];
  endDate: string;
  metrics?: HeatMetric[];
  categories?: HeatCategory[];
  ramp?: readonly string[];
  /** Link for the selected day; `{date}` is replaced with the ISO date. */
  dayHref?: string;
  dayHrefLabel?: string;
  emptyLabel?: string;
}) {
  const [metricKey, setMetricKey] = useState(metrics?.[0]?.key);
  const metric = metrics?.find((m) => m.key === metricKey) ?? metrics?.[0];
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const byDate = useMemo(() => new Map(cells.map((c) => [c.date, c])), [cells]);

  // Columns are Monday-start weeks; the last column holds endDate.
  const start = addDays(endDate, -isoDow(endDate) - (WEEKS - 1) * 7);
  const days = useMemo(() => {
    const out: { date: string; w: number; d: number }[] = [];
    for (let i = 0; i < WEEKS * 7; i++) {
      const date = addDays(start, i);
      if (date > endDate) break;
      out.push({ date, w: Math.floor(i / 7), d: i % 7 });
    }
    return out;
  }, [start, endDate]);

  const months = useMemo(() => {
    // Label a column when it holds the 1st of a month (and the first column).
    const labels: { w: number; text: string }[] = [];
    for (const day of days) {
      const first = day.date.slice(8) === "01";
      if (!(first || (day.w === 0 && day.d === 0))) continue;
      if (labels.length && day.w - labels[labels.length - 1].w < 3) labels.pop();
      labels.push({ w: day.w, text: MONTHS[Number(day.date.slice(5, 7)) - 1] });
    }
    return labels;
  }, [days]);

  const levelOf = (c: HeatCell | undefined) => {
    if (!c || !metric) return 0;
    const v = c.values?.[metric.key];
    if (v === null || v === undefined) return 0;
    const [t2, t3, t4] = metric.thresholds;
    return v >= t4 ? 4 : v >= t3 ? 3 : v >= t2 ? 2 : 1;
  };
  const colorOf = (c: HeatCell | undefined) => {
    if (categories) {
      const cat = c?.category ? categories.find((k) => k.key === c.category) : undefined;
      return cat ? cat.color : EMPTY;
    }
    const l = levelOf(c);
    return l === 0 ? EMPTY : ramp[l - 1];
  };
  const dimmed = (c: HeatCell | undefined) => !!(categories && c?.category && hidden.has(c.category));

  const lastWithData = useMemo(() => {
    for (let i = days.length - 1; i >= 0; i--) if (byDate.has(days[i].date)) return i;
    return days.length - 1;
  }, [days, byDate]);
  const [focusIdx, setFocusIdx] = useState(lastWithData);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [selected, setSelected] = useState(lastWithData);
  useEffect(() => { setSelected(lastWithData); setFocusIdx(lastWithData); }, [lastWithData]);

  const scroller = useRef<HTMLDivElement>(null);
  useEffect(() => { scroller.current?.scrollTo({ left: scroller.current.scrollWidth }); }, []);
  const rects = useRef<(SVGRectElement | null)[]>([]);

  const onKey = (e: KeyboardEvent<SVGRectElement>, i: number) => {
    const move = { ArrowLeft: -7, ArrowRight: 7, ArrowUp: -1, ArrowDown: 1, Home: -i, End: days.length - 1 - i }[e.key];
    if (move !== undefined) {
      e.preventDefault();
      const next = Math.min(days.length - 1, Math.max(0, i + move));
      setFocusIdx(next);
      rects.current[next]?.focus();
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setSelected(i);
    }
  };

  const tipIdx = hoverIdx ?? null;
  const tip = tipIdx !== null ? days[tipIdx] : null;
  const sel = days[selected];
  const selCell = sel ? byDate.get(sel.date) : undefined;
  const recorded = cells.filter((c) => c.date >= start && c.date <= endDate).length;

  return (
    <div>
      {(metrics && metrics.length > 1) && (
        <div role="radiogroup" aria-label="Colour the calendar by" className="mb-3 inline-flex flex-wrap rounded-xl border border-zinc-800 bg-zinc-950/40 p-1 text-xs">
          {metrics.map((m) => (
            <button key={m.key} type="button" role="radio" aria-checked={m.key === metric?.key} onClick={() => setMetricKey(m.key)}
              className={cx("rounded-lg px-3 py-1.5 font-medium transition-colors", m.key === metric?.key ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-zinc-100", focusRing)}>
              {m.label}
            </button>
          ))}
        </div>
      )}

      <div ref={scroller} className="-mx-1 overflow-x-auto px-1 pb-1">
        <div className="relative min-w-[760px]">
          <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="grid" aria-label={`${label}. Use arrow keys to move between days and Enter to see a day's details.`}>
            {months.map((m) => (
              <text key={`${m.w}-${m.text}`} x={LEFT + m.w * STEP} y={11} fontSize={10} fill={TEXT_MUTED}>{m.text}</text>
            ))}
            {DOW.map((d, i) => d && (
              <text key={d} x={LEFT - 6} y={TOP + i * STEP + CELL - 2} fontSize={9} fill={TEXT_MUTED} textAnchor="end">{d}</text>
            ))}
            {days.map((day, i) => {
              const c = byDate.get(day.date);
              const x = LEFT + day.w * STEP, y = TOP + day.d * STEP;
              const isSel = i === selected;
              return (
                <rect
                  key={day.date}
                  ref={(el) => { rects.current[i] = el; }}
                  x={x} y={y} width={CELL} height={CELL} rx={2.5}
                  fill={colorOf(c)}
                  opacity={dimmed(c) ? 0.15 : 1}
                  stroke={isSel ? "#fafafa" : hoverIdx === i ? "#a1a1aa" : "none"}
                  strokeWidth={isSel ? 1.5 : 1}
                  tabIndex={i === focusIdx ? 0 : -1}
                  role="gridcell"
                  aria-selected={isSel}
                  aria-label={`${formatDate(day.date)}: ${c ? (c.details ?? []).map((d) => `${d.label} ${d.value}`).join(", ") || "recorded" : emptyLabel}`}
                  className="cursor-pointer outline-none transition-opacity focus-visible:stroke-brand-400"
                  onMouseEnter={() => setHoverIdx(i)}
                  onMouseLeave={() => setHoverIdx(null)}
                  onFocus={() => { setFocusIdx(i); setHoverIdx(i); }}
                  onBlur={() => setHoverIdx(null)}
                  onClick={() => setSelected(i)}
                  onKeyDown={(e) => onKey(e, i)}
                />
              );
            })}
          </svg>

          {tip && (
            <HeatTooltip
              leftPct={((LEFT + tip.w * STEP + CELL / 2) / W) * 100}
              topPct={((TOP + tip.d * STEP) / H) * 100}
              date={tip.date}
              cell={byDate.get(tip.date)}
              emptyLabel={emptyLabel}
            />
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-500">
        <span>{recorded} day{recorded === 1 ? "" : "s"} with records in the last 12 months</span>
        {categories ? (
          <ul className="flex flex-wrap items-center gap-1.5" aria-label="Legend. Select a status to hide or show it.">
            {categories.map((k) => {
              const off = hidden.has(k.key);
              return (
                <li key={k.key}>
                  <button type="button" aria-pressed={!off}
                    onClick={() => setHidden((h) => { const n = new Set(h); if (n.has(k.key)) n.delete(k.key); else n.add(k.key); return n; })}
                    className={cx("flex items-center gap-1.5 rounded-md px-2 py-1 transition-colors hover:bg-zinc-800", off && "opacity-40 line-through", focusRing)}>
                    <span aria-hidden className="h-2.5 w-2.5 rounded-sm" style={{ background: k.color }} />
                    <span className="text-zinc-300">{k.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : metric ? (
          <div className="flex items-center gap-1.5" aria-label={`Scale from ${metric.lowLabel} to ${metric.highLabel}`}>
            <span>{metric.lowLabel}</span>
            <span aria-hidden className="h-2.5 w-2.5 rounded-sm" style={{ background: EMPTY }} title={emptyLabel} />
            {ramp.map((c) => <span key={c} aria-hidden className="h-2.5 w-2.5 rounded-sm" style={{ background: c }} />)}
            <span>{metric.highLabel}</span>
          </div>
        ) : null}
      </div>

      {sel && (
        <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950/40 p-4" aria-live="polite">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-sm font-semibold text-zinc-100">
              {new Intl.DateTimeFormat("en-IN", { weekday: "long", timeZone: "UTC" }).format(new Date(`${sel.date}T00:00:00Z`))}, {formatDate(sel.date)}
            </p>
            {dayHref && selCell && (
              <Link href={dayHref.replaceAll("{date}", sel.date)} className={cx("text-xs font-medium text-brand-400 hover:underline", focusRing)}>
                {dayHrefLabel} →
              </Link>
            )}
          </div>
          {selCell?.details?.length ? (
            <dl className="mt-3 grid max-sm:grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4">
              {selCell.details.map((d) => (
                <div key={d.label}>
                  <dt className="text-xs text-zinc-500">{d.label}</dt>
                  <dd className="font-[family-name:var(--font-space-grotesk)] text-lg font-semibold tabular-nums text-zinc-100">{d.value}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="mt-1 text-sm text-zinc-500">{emptyLabel}. Select a coloured square to see that day.</p>
          )}
        </div>
      )}
    </div>
  );
}

function HeatTooltip({ leftPct, topPct, date, cell, emptyLabel }: {
  leftPct: number; topPct: number; date: string; cell?: HeatCell; emptyLabel: string;
}) {
  const flip = leftPct > 70;
  return (
    <div role="status" className="pointer-events-none absolute z-10 w-max max-w-[240px] rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs shadow-xl"
      style={{ left: `${leftPct}%`, top: `${topPct}%`, transform: `translate(${flip ? "-100%" : "0"}, calc(-100% - 6px))` }}>
      <p className="font-medium text-zinc-100">{formatDate(date)}</p>
      {cell?.details?.length ? (
        cell.details.slice(0, 4).map((d) => (
          <p key={d.label} className="text-zinc-400">{d.label}: <span className="tabular-nums text-zinc-200">{d.value}</span></p>
        ))
      ) : (
        <p className="text-zinc-500">{emptyLabel}</p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Donut — part-to-whole at a glance (≤ 6 segments), legend with counts
// ---------------------------------------------------------------------------

export type DonutSegment = { key: string; label: string; value: number; color: string };

export function Donut({ label, segments, centerValue, centerLabel }: {
  label: string;
  segments: DonutSegment[];
  centerValue: string;
  centerLabel: string;
}) {
  const [active, setActive] = useState<string | null>(null);
  const total = segments.reduce((t, s) => t + s.value, 0);
  const R = 52, SW = 14, C = 2 * Math.PI * R, GAPLEN = segments.filter((s) => s.value > 0).length > 1 ? 2 : 0;
  let offset = 0;
  const a = segments.find((s) => s.key === active);
  const pctOf = (v: number) => (total ? `${Math.round((1000 * v) / total) / 10}%` : "—");

  return (
    <div className="grid gap-5 max-sm:justify-items-center sm:grid-cols-[9rem_minmax(0,1fr)] sm:items-center">
      <div className="relative h-36 w-36 shrink-0">
        <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90" role="img" aria-label={`${label}: ${segments.map((s) => `${s.label} ${s.value}`).join(", ")}`}>
          <circle cx={70} cy={70} r={R} fill="none" stroke={EMPTY} strokeWidth={SW} />
          {total > 0 && segments.map((s) => {
            if (s.value <= 0) return null;
            const len = (s.value / total) * C;
            const dash = Math.max(len - GAPLEN, 0.5);
            const el = (
              <circle key={s.key} cx={70} cy={70} r={R} fill="none" stroke={s.color} strokeWidth={active === s.key ? SW + 4 : SW}
                strokeDasharray={`${dash} ${C - dash}`} strokeDashoffset={-offset}
                opacity={active && active !== s.key ? 0.3 : 1}
                className="cursor-pointer transition-all duration-200"
                onMouseEnter={() => setActive(s.key)} onMouseLeave={() => setActive(null)} />
            );
            offset += len;
            return el;
          })}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="font-[family-name:var(--font-space-grotesk)] text-2xl font-bold tabular-nums text-white">
            {a ? a.value.toLocaleString("en-IN") : centerValue}
          </span>
          <span className="max-w-[90px] text-[11px] leading-tight text-zinc-400">{a ? `${a.label} · ${pctOf(a.value)}` : centerLabel}</span>
        </div>
      </div>
      <ul className="w-full min-w-0 space-y-1 text-sm">
        {segments.map((s) => (
          <li key={s.key}>
            <button type="button" onMouseEnter={() => setActive(s.key)} onMouseLeave={() => setActive(null)}
              onFocus={() => setActive(s.key)} onBlur={() => setActive(null)}
              className={cx("flex w-full items-center gap-2 rounded-lg px-2 py-1 text-left transition-colors hover:bg-zinc-800/60", active === s.key && "bg-zinc-800/60", focusRing)}>
              <span aria-hidden className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: s.color }} />
              <span className="flex-1 truncate text-zinc-300">{s.label}</span>
              <span className="tabular-nums text-zinc-100">{s.value.toLocaleString("en-IN")}</span>
              <span className="w-12 text-right text-xs tabular-nums text-zinc-500">{pctOf(s.value)}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------------------
// BarList — ranked horizontal bars, one series, sortable, optional target line
// ---------------------------------------------------------------------------

export type BarRow = { key: string; label: string; value: number | null; display: string; sub?: string; href?: string };

export function BarList({ label, rows, max, color = "#3987e5", target, emptyText = "Nothing to show", initialLimit = 8 }: {
  label: string;
  rows: BarRow[];
  max?: number;
  color?: string;
  target?: { value: number; label: string };
  emptyText?: string;
  initialLimit?: number;
}) {
  const [sort, setSort] = useState<"high" | "low" | "name">("high");
  const [expanded, setExpanded] = useState(false);
  const top = max ?? Math.max(1, ...rows.map((r) => r.value ?? 0));
  const sorted = [...rows].sort((a, b) => {
    if (sort === "name") return a.label.localeCompare(b.label);
    const av = a.value ?? -Infinity, bv = b.value ?? -Infinity;
    return sort === "high" ? bv - av : av - bv;
  });
  const shown = expanded ? sorted : sorted.slice(0, initialLimit);

  if (rows.length === 0) return <p className="py-6 text-center text-sm text-zinc-500">{emptyText}</p>;

  return (
    <div>
      <div role="radiogroup" aria-label={`Sort ${label}`} className="mb-3 inline-flex rounded-lg border border-zinc-800 bg-zinc-950/40 p-0.5 text-[11px]">
        {([["high", "Highest"], ["low", "Lowest"], ["name", "A–Z"]] as const).map(([k, t]) => (
          <button key={k} type="button" role="radio" aria-checked={sort === k} onClick={() => setSort(k)}
            className={cx("rounded-md px-2.5 py-1 font-medium transition-colors", sort === k ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-200", focusRing)}>
            {t}
          </button>
        ))}
      </div>
      <ul className="space-y-2.5" aria-label={label}>
        {shown.map((r) => {
          const w = r.value === null ? 0 : Math.max(1.5, Math.min(100, (r.value / top) * 100));
          const name = r.href ? (
            <Link href={r.href} className={cx("truncate font-medium text-zinc-100 hover:underline", focusRing)}>{r.label}</Link>
          ) : <span className="truncate font-medium text-zinc-100">{r.label}</span>;
          return (
            <li key={r.key} className="group">
              <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
                <span className="flex min-w-0 items-baseline gap-2">{name}{r.sub && <span className="truncate text-xs text-zinc-500">{r.sub}</span>}</span>
                <span className="shrink-0 tabular-nums text-zinc-200">{r.display}</span>
              </div>
              <div className="relative h-2 rounded-full bg-zinc-800/80">
                <div className="h-2 rounded-full transition-[width,opacity] duration-500 group-hover:opacity-100" style={{ width: `${w}%`, background: color, opacity: 0.85 }} />
                {target && (
                  <span aria-hidden className="absolute -top-1 h-4 w-px bg-zinc-300" style={{ left: `${(target.value / top) * 100}%` }} />
                )}
              </div>
            </li>
          );
        })}
      </ul>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-500">
        {target ? <span className="flex items-center gap-1.5"><span aria-hidden className="inline-block h-3 w-px bg-zinc-300" /> {target.label}</span> : <span />}
        {rows.length > initialLimit && (
          <button type="button" onClick={() => setExpanded((e) => !e)} className={cx("font-medium text-brand-400 hover:underline", focusRing)}>
            {expanded ? "Show fewer" : `Show all ${rows.length}`}
          </button>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// FlowChart — weekly units in (above the axis) vs out (below), one axis
// ---------------------------------------------------------------------------

export type FlowPoint = { label: string; start: string; inbound: number; outbound: number };
const IN_COLOR = "#3987e5", OUT_COLOR = "#d95926";

export function FlowChart({ points }: { points: FlowPoint[] }) {
  const [active, setActive] = useState<number | null>(null);
  const FW = 960, FH = 240, L = 40, R = 8, T = 10, B = 24;
  const plotH = FH - T - B, mid = T + plotH / 2;
  const peak = Math.max(1, ...points.map((p) => Math.max(p.inbound, p.outbound)));
  const band = (FW - L - R) / Math.max(points.length, 1);
  const barW = Math.min(18, band - 4);
  const h = (v: number) => (v / peak) * (plotH / 2 - 2);
  const a = active !== null ? points[active] : null;
  const fmt = (v: number) => v.toLocaleString("en-IN");

  const bar = (x: number, len: number, up: boolean, color: string, dim: boolean) => {
    if (len <= 0) return null;
    const r = Math.min(3, len), x0 = x - barW / 2, x1 = x + barW / 2;
    const y0 = up ? mid - 1 : mid + 1, yEnd = up ? y0 - len : y0 + len;
    const d = up
      ? `M${x0},${y0} V${yEnd + r} Q${x0},${yEnd} ${x0 + r},${yEnd} H${x1 - r} Q${x1},${yEnd} ${x1},${yEnd + r} V${y0} Z`
      : `M${x0},${y0} V${yEnd - r} Q${x0},${yEnd} ${x0 + r},${yEnd} H${x1 - r} Q${x1},${yEnd} ${x1},${yEnd - r} V${y0} Z`;
    return <path d={d} fill={color} opacity={dim ? 0.35 : 1} />;
  };

  return (
    <div>
      <div className="mb-2 flex items-center gap-4 text-xs text-zinc-400">
        <span className="flex items-center gap-1.5"><span aria-hidden className="h-2.5 w-2.5 rounded-sm" style={{ background: IN_COLOR }} />Units in (received, returned, built)</span>
        <span className="flex items-center gap-1.5"><span aria-hidden className="h-2.5 w-2.5 rounded-sm" style={{ background: OUT_COLOR }} />Units out (issued, written off, used)</span>
      </div>
      <div className="relative">
        <svg viewBox={`0 0 ${FW} ${FH}`} className="h-auto w-full" role="img" aria-label="Weekly stock units in and out. Table view below.">
          {[1, 0.5].map((f) => (
            <g key={f}>
              <line x1={L} x2={FW - R} y1={mid - h(peak * f)} y2={mid - h(peak * f)} stroke="#27272a" />
              <line x1={L} x2={FW - R} y1={mid + h(peak * f)} y2={mid + h(peak * f)} stroke="#27272a" />
              <text x={L - 6} y={mid - h(peak * f) + 3} textAnchor="end" fontSize={10} fill={TEXT_MUTED}>{fmt(Math.round(peak * f))}</text>
              <text x={L - 6} y={mid + h(peak * f) + 3} textAnchor="end" fontSize={10} fill={TEXT_MUTED}>{fmt(Math.round(peak * f))}</text>
            </g>
          ))}
          <line x1={L} x2={FW - R} y1={mid} y2={mid} stroke="#52525b" />
          {points.map((p, i) => {
            const x = L + band * i + band / 2;
            const dim = active !== null && active !== i;
            return (
              <g key={p.start}>
                {bar(x, h(p.inbound), true, IN_COLOR, dim)}
                {bar(x, h(p.outbound), false, OUT_COLOR, dim)}
                {(i % 4 === 0 || (i === points.length - 1 && i % 4 >= 2)) && (
                  <text x={x} y={FH - 6} textAnchor="middle" fontSize={10} fill={TEXT_MUTED}>{p.label}</text>
                )}
                <rect x={L + band * i} y={T} width={band} height={plotH} fill="transparent" tabIndex={0} className="outline-none"
                  aria-label={`Week of ${formatDate(p.start)}: ${p.inbound} in, ${p.outbound} out`}
                  onMouseEnter={() => setActive(i)} onMouseLeave={() => setActive(null)} onFocus={() => setActive(i)} onBlur={() => setActive(null)} />
              </g>
            );
          })}
        </svg>
        {a && active !== null && (
          <div role="status" className="pointer-events-none absolute top-0 rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs shadow-lg"
            style={{ left: `${Math.min(75, Math.max(0, ((L + band * active + band / 2) / FW) * 100 - 10))}%` }}>
            <p className="font-medium text-zinc-100">Week of {formatDate(a.start)}</p>
            <p className="text-zinc-400">In <span className="tabular-nums text-zinc-100">{fmt(a.inbound)}</span> · Out <span className="tabular-nums text-zinc-100">{fmt(a.outbound)}</span></p>
            <p className="text-zinc-400">Net <span className="tabular-nums text-zinc-100">{a.inbound - a.outbound > 0 ? "+" : ""}{fmt(a.inbound - a.outbound)}</span></p>
          </div>
        )}
      </div>
      <details className="mt-2 text-sm">
        <summary className="cursor-pointer text-xs text-zinc-500 hover:text-zinc-200">View as table</summary>
        <table className="mt-2 w-full text-left text-xs">
          <thead><tr className="text-zinc-500"><th className="py-1">Week of</th><th>In</th><th>Out</th><th>Net</th></tr></thead>
          <tbody>
            {points.map((p) => (
              <tr key={p.start} className="border-t border-zinc-800/60">
                <td className="py-1">{formatDate(p.start)}</td><td>{p.inbound}</td><td>{p.outbound}</td><td>{p.inbound - p.outbound}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sparkline — a tiny trend for stat tiles (no axes; the tile carries the number)
// ---------------------------------------------------------------------------

export function Sparkline({ values, color = "#ff7a38", label }: { values: (number | null)[]; color?: string; label: string }) {
  const pts = values.map((v, i) => ({ v, i })).filter((p): p is { v: number; i: number } => p.v !== null);
  if (pts.length < 2) return null;
  const SW = 120, SH = 32;
  const min = Math.min(...pts.map((p) => p.v)), max = Math.max(...pts.map((p) => p.v));
  const x = (i: number) => (i / Math.max(values.length - 1, 1)) * (SW - 4) + 2;
  const y = (v: number) => SH - 3 - ((v - min) / Math.max(max - min, 1)) * (SH - 6);
  const d = pts.map((p, k) => `${k ? "L" : "M"}${x(p.i).toFixed(1)},${y(p.v).toFixed(1)}`).join(" ");
  const last = pts[pts.length - 1];
  return (
    <svg viewBox={`0 0 ${SW} ${SH}`} className="mt-2 h-8 w-full" role="img" aria-label={label} preserveAspectRatio="none">
      <path d={`${d} L${x(last.i)},${SH} L${x(pts[0].i)},${SH} Z`} fill={color} opacity={0.12} />
      <path d={d} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
