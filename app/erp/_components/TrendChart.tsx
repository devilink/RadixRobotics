"use client";

import { useState } from "react";
import { formatDate, formatPct } from "@/lib/erp/format";

export type TrendPoint = { date: string; rate: number | null; attended: number; expected: number };

// Single-series column chart of the daily student attendance rate (0–100%).
// One hue, no legend (the card title names the series), hover/focus tooltip,
// and a table view for screen readers and exact values.
export function TrendChart({ points }: { points: TrendPoint[] }) {
  const [active, setActive] = useState<number | null>(null);
  const W = 640, H = 200, L = 36, R = 8, T = 12, B = 28;
  const plotW = W - L - R, plotH = H - T - B;
  const n = Math.max(points.length, 1);
  const band = plotW / n;
  const barW = Math.min(24, band - 2);
  const y = (v: number) => T + plotH - (v / 100) * plotH;
  const ticks = [0, 25, 50, 75, 100];
  const a = active !== null ? points[active] : null;

  return (
    <div>
      <div className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img"
          aria-label="Daily student attendance rate for the last 14 days. Table view below.">
          {ticks.map((t) => (
            <g key={t}>
              <line x1={L} x2={W - R} y1={y(t)} y2={y(t)} stroke="#27272a" strokeWidth={1} />
              <text x={L - 6} y={y(t) + 3} textAnchor="end" fontSize={10} fill="#71717a">{t}%</text>
            </g>
          ))}
          {points.map((p, i) => {
            const cx = L + band * i + band / 2;
            const h = p.rate === null ? 0 : (p.rate / 100) * plotH;
            const r = Math.min(4, h);
            const x0 = cx - barW / 2, x1 = cx + barW / 2, yb = T + plotH, yt = yb - h;
            // Rounded data-end (top), square at the baseline.
            const d = h > 0
              ? `M${x0},${yb} V${yt + r} Q${x0},${yt} ${x0 + r},${yt} H${x1 - r} Q${x1},${yt} ${x1},${yt + r} V${yb} Z`
              : "";
            const showLabel = i === 0 || i === points.length - 1 || i % 3 === 0;
            return (
              <g key={p.date}>
                {d && <path d={d} fill="var(--color-brand-500)" opacity={active === null || active === i ? 1 : 0.45} />}
                {showLabel && (
                  <text x={cx} y={H - 8} textAnchor="middle" fontSize={10} fill="#71717a">
                    {p.date.slice(8)}/{p.date.slice(5, 7)}
                  </text>
                )}
                {/* Hit target: the whole band, larger than the bar. */}
                <rect x={L + band * i} y={T} width={band} height={plotH} fill="transparent" tabIndex={0}
                  aria-label={`${formatDate(p.date)}: ${formatPct(p.rate)}`}
                  onMouseEnter={() => setActive(i)} onMouseLeave={() => setActive(null)}
                  onFocus={() => setActive(i)} onBlur={() => setActive(null)} className="outline-none" />
              </g>
            );
          })}
          <line x1={L} x2={W - R} y1={T + plotH} y2={T + plotH} stroke="#3f3f46" strokeWidth={1} />
        </svg>
        {a && active !== null && (
          <div role="status" className="pointer-events-none absolute top-0 rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs shadow-lg"
            style={{ left: `${Math.min(80, Math.max(0, ((L + band * active + band / 2) / W) * 100 - 10))}%` }}>
            <p className="font-medium text-zinc-100">{formatDate(a.date)}</p>
            <p className="text-zinc-400">Rate {formatPct(a.rate)} · {a.attended} of {a.expected} expected</p>
          </div>
        )}
      </div>
      <details className="mt-2 text-sm">
        <summary className="cursor-pointer text-xs text-zinc-500 hover:text-zinc-200">View as table</summary>
        <table className="mt-2 w-full text-left text-xs">
          <thead><tr className="text-zinc-500"><th className="py-1">Date</th><th>Attended</th><th>Expected</th><th>Rate</th></tr></thead>
          <tbody>
            {points.map((p) => (
              <tr key={p.date} className="border-t border-zinc-800/60">
                <td className="py-1">{formatDate(p.date)}</td><td>{p.attended}</td><td>{p.expected}</td><td>{formatPct(p.rate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
