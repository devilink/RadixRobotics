import "server-only";
import { db } from "./context";
import { addDays, todayIn } from "./format";
import type { Category, InstitutionType } from "./types";

export type DashboardData = {
  institutions: { total: number; school: number; learning_center: number };
  people: { students: number; teachers: number; staff: number };
  student_today: { marked: number; present: number; absent: number; late: number; excused: number; half_day: number };
  staff_today: { marked: number; present: number; absent: number; late: number; half_day: number; on_leave: number };
  registers: { expected: number; submitted: number; draft: number; not_started: number };
  missing: {
    group_id: string; group_name: string; institution_id: string; institution_name: string;
    institution_type: InstitutionType; date: string; status: "draft" | "not_started";
  }[];
  pending: { corrections: number; leave: number };
  trend: { date: string; attended: number; expected: number; rate: number | null }[];
};

export async function getDashboard(category: Category): Promise<DashboardData> {
  const supabase = await db();
  const { data, error } = await supabase.rpc("erp_dashboard", { p_category: category });
  if (error) throw new Error(`Dashboard query failed: ${error.message}`);
  return data as DashboardData;
}

/** Attendance rate as defined in the database: (present + late + ½ half-day) / (marked − excused − on leave). */
export function rateOf(t: { marked: number; present: number; late: number; half_day: number; excused?: number; on_leave?: number }) {
  const expected = t.marked - (t.excused ?? 0) - (t.on_leave ?? 0);
  if (expected <= 0) return null;
  return Math.round((1000 * (t.present + t.late + 0.5 * t.half_day)) / expected) / 10;
}

/** Fill the 14-day window so days without registers render as gaps rather than disappearing. */
export function fillTrend(trend: DashboardData["trend"], days = 14) {
  const today = todayIn();
  const byDate = new Map(trend.map((t) => [t.date, t]));
  return Array.from({ length: days }, (_, i) => {
    const date = addDays(today, i - days + 1);
    const t = byDate.get(date);
    return { date, rate: t?.rate === undefined || t?.rate === null ? null : Number(t.rate), attended: Number(t?.attended ?? 0), expected: Number(t?.expected ?? 0) };
  });
}

export type InstitutionOption = { id: string; name: string; code: string; institution_type: InstitutionType; timezone: string };

/** Active institutions visible to the user (RLS-filtered), narrowed by category. */
export async function institutionOptions(category: Category = "all", includeHeadOffice = true): Promise<InstitutionOption[]> {
  const supabase = await db();
  let q = supabase.from("institutions").select("id, name, code, institution_type, timezone").eq("status", "active").order("name");
  if (category !== "all") q = q.eq("institution_type", category);
  else if (!includeHeadOffice) q = q.neq("institution_type", "head_office");
  const { data } = await q;
  return (data ?? []) as InstitutionOption[];
}

export type CalendarDay = {
  day: string; marked: number; present: number; absent: number; late: number;
  excused: number; half_day: number; on_leave: number; attended: number; expected: number;
};

/**
 * Daily attendance totals for the year heatmap (~53 weeks), RLS-filtered.
 * Returns null when the analytics migration has not been applied yet.
 */
export async function getAttendanceCalendar(category: Category, kind: "student" | "staff" = "student"): Promise<CalendarDay[] | null> {
  const supabase = await db();
  const { data, error } = await supabase.rpc("erp_attendance_calendar", { p_category: category, p_kind: kind, p_days: 371 });
  if (error) return null;
  return ((data ?? []) as Record<string, string | number>[]).map((r) => ({
    day: String(r.day), marked: Number(r.marked), present: Number(r.present), absent: Number(r.absent), late: Number(r.late),
    excused: Number(r.excused), half_day: Number(r.half_day), on_leave: Number(r.on_leave),
    attended: Number(r.attended), expected: Number(r.expected),
  }));
}

export type InventoryDay = { day: string; movements: number; units_in: number; units_out: number; issued: number; received: number };

/** Daily stock movement totals for the inventory heatmap. Null when the analytics migration is missing. */
export async function getInventoryCalendar(): Promise<InventoryDay[] | null> {
  const supabase = await db();
  const { data, error } = await supabase.rpc("erp_inventory_calendar", { p_days: 371 });
  if (error) return null;
  return ((data ?? []) as Record<string, string | number>[]).map((r) => ({
    day: String(r.day), movements: Number(r.movements), units_in: Number(r.units_in), units_out: Number(r.units_out),
    issued: Number(r.issued), received: Number(r.received),
  }));
}
