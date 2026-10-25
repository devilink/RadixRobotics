// Plain data helpers for the ERP dashboard charts. Kept out of the "use client"
// chart module so server pages can import the constants and builders.
import { addDays, formatPct } from "./format";
import type { CalendarDay, InventoryDay } from "./queries";

export type HeatCell = {
  date: string; // YYYY-MM-DD
  values?: Record<string, number | null>;
  category?: string;
  details?: { label: string; value: string }[];
};
export type HeatMetric = {
  key: string;
  label: string;
  /** Lower bounds for levels 2, 3 and 4; any recorded value is at least level 1. */
  thresholds: [number, number, number];
  lowLabel: string;
  highLabel: string;
};
export type HeatCategory = { key: string; label: string; color: string };

/** One-hue sequential ramps (dim → bright on the dark surface), levels 1–4. */
export const RAMPS = {
  green: ["#0e4429", "#006d32", "#26a641", "#39d353"],
  brand: ["#4a1d06", "#8a3207", "#d9480a", "#ff7a38"],
} as const;

/** Attendance status colours, matching the status badges elsewhere in the ERP. */
export const STATUS_COLORS = {
  present: "#10b981",
  late: "#f59e0b",
  half_day: "#8b5cf6",
  excused: "#0ea5e9",
  on_leave: "#71717a",
  absent: "#f43f5e",
} as const;

/** Quartile cut points of the non-zero values, for count-based heatmap levels. */
export function quartiles(values: number[]): [number, number, number] {
  const v = values.filter((x) => x > 0).sort((a, b) => a - b);
  if (v.length === 0) return [2, 3, 4];
  const q = (p: number) => v[Math.min(v.length - 1, Math.floor(p * v.length))];
  const a = Math.max(q(0.25), 1), b = Math.max(q(0.5), a + 1), c = Math.max(q(0.75), b + 1);
  return [a, b, c];
}

const n = (v: number) => v.toLocaleString("en-IN");
const rateOfDay = (d: CalendarDay) => (d.expected > 0 ? Math.round((1000 * d.attended) / d.expected) / 10 : null);

export function attendanceHeat(days: CalendarDay[]): { cells: HeatCell[]; metrics: HeatMetric[] } {
  const cells = days.map((d) => ({
    date: d.day,
    values: { rate: rateOfDay(d), marked: d.marked, absent: d.absent },
    details: [
      { label: "Rate", value: formatPct(rateOfDay(d)) },
      { label: "Present", value: n(d.present + d.late) },
      { label: "Absent", value: n(d.absent) },
      { label: "Late", value: n(d.late) },
    ],
  }));
  return {
    cells,
    metrics: [
      { key: "rate", label: "Attendance rate", thresholds: [70, 85, 95], lowLabel: "<70%", highLabel: "95%+" },
      { key: "marked", label: "People marked", thresholds: quartiles(days.map((d) => d.marked)), lowLabel: "Fewer", highLabel: "More" },
      { key: "absent", label: "Absences", thresholds: quartiles(days.map((d) => d.absent)), lowLabel: "Fewer", highLabel: "More" },
    ],
  };
}

export function inventoryHeat(days: InventoryDay[]): { cells: HeatCell[]; metrics: HeatMetric[] } {
  const cells = days.map((d) => ({
    date: d.day,
    values: { movements: d.movements, issued: d.issued || null, received: d.received || null },
    details: [
      { label: "Movements", value: n(d.movements) },
      { label: "Units in", value: n(d.units_in) },
      { label: "Units out", value: n(d.units_out) },
      { label: "Issued to sites", value: n(d.issued) },
    ],
  }));
  return {
    cells,
    metrics: [
      { key: "movements", label: "All activity", thresholds: quartiles(days.map((d) => d.movements)), lowLabel: "Less", highLabel: "More" },
      { key: "issued", label: "Issued to sites", thresholds: quartiles(days.map((d) => d.issued)), lowLabel: "Fewer", highLabel: "More" },
      { key: "received", label: "Received", thresholds: quartiles(days.map((d) => d.received)), lowLabel: "Fewer", highLabel: "More" },
    ],
  };
}

/** Monday-start weekly totals of units in/out for the last `weeks` weeks. */
export function weeklyFlow(days: InventoryDay[], today: string, weeks = 26) {
  const dow = (new Date(`${today}T00:00:00Z`).getUTCDay() + 6) % 7;
  const first = addDays(today, -dow - (weeks - 1) * 7);
  const points = Array.from({ length: weeks }, (_, i) => {
    const start = addDays(first, i * 7);
    return { start, label: `${start.slice(8)}/${start.slice(5, 7)}`, inbound: 0, outbound: 0 };
  });
  for (const d of days) {
    if (d.day < first) continue;
    const i = Math.floor((Date.parse(`${d.day}T00:00:00Z`) - Date.parse(`${first}T00:00:00Z`)) / (7 * 86400000));
    if (points[i]) { points[i].inbound += d.units_in; points[i].outbound += d.units_out; }
  }
  return points;
}

/** Consecutive days (ending at the most recent) satisfying `ok`, and the longest such run. */
export function streaks(days: { date: string; ok: boolean }[]) {
  const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date));
  let best = 0, run = 0;
  for (const d of sorted) { run = d.ok ? run + 1 : 0; best = Math.max(best, run); }
  return { current: run, best };
}
