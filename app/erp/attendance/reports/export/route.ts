import { NextResponse, type NextRequest } from "next/server";
import { can, db, getErpContext } from "@/lib/erp/context";
import { reportQuerySchema } from "@/lib/erp/validation";
import { sharedRateLimit } from "@/lib/erp/rate-limit";
import { toCsv } from "@/lib/erp/format";

// CSV export of attendance reports. Requires reports.export at the institution
// (checked here and again in the database), is rate limited, and every export
// is written to the audit log.
export async function GET(req: NextRequest) {
  const ctx = await getErpContext();
  if (!ctx) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const sp = req.nextUrl.searchParams;
  const parsed = reportQuerySchema.safeParse({
    institution_id: sp.get("institution_id"),
    kind: sp.get("kind") ?? undefined,
    from: sp.get("from"),
    to: sp.get("to"),
    group_id: sp.get("group_id") ?? undefined,
  });
  const report = sp.get("report") === "daily" ? "daily" : "summary";
  if (!parsed.success) return NextResponse.json({ error: "Invalid report parameters" }, { status: 400 });
  const q = parsed.data;

  if (!can(ctx.perms, "reports.export", q.institution_id)) {
    return NextResponse.json({ error: "You are not allowed to export this report" }, { status: 403 });
  }
  const supabase = await db();
  if (!(await sharedRateLimit(supabase, ctx.userId, "attendance-export", 20, 60_000))) {
    return NextResponse.json({ error: "Too many exports. Try again in a minute." }, { status: 429 });
  }
  const logged = await supabase.rpc("erp_log_export", {
    p_institution: q.institution_id,
    p_report: `attendance_${report}`,
    p_params: { kind: q.kind, from: q.from, to: q.to, group_id: q.group_id ?? null },
  });
  if (logged.error) return NextResponse.json({ error: "You are not allowed to export this report" }, { status: 403 });

  let csv: string;
  if (report === "summary") {
    const { data, error } = await supabase.rpc("erp_attendance_summary", {
      p_institution: q.institution_id, p_kind: q.kind, p_from: q.from, p_to: q.to, p_group: q.group_id ?? null,
    });
    if (error) return NextResponse.json({ error: "Report failed" }, { status: 500 });
    csv = toCsv(
      ["ID", "Name", "Type", "Present", "Absent", "Late", "Excused", "Half day", "On leave", "Marked", "Expected", "Attended", "Rate %"],
      (data ?? []).map((r: Record<string, unknown>) => [
        r.member_code, r.full_name, r.member_type, r.present, r.absent, r.late, r.excused, r.half_day, r.on_leave, r.marked, r.expected, r.attended, r.rate,
      ])
    );
  } else {
    const { data, error } = await supabase.rpc("erp_attendance_daily", {
      p_institution: q.institution_id, p_kind: q.kind, p_from: q.from, p_to: q.to,
    });
    if (error) return NextResponse.json({ error: "Report failed" }, { status: 500 });
    csv = toCsv(
      ["Date", "Registers", "Submitted", "Marked", "Present", "Absent", "Late", "Excused", "Half day", "On leave", "Rate %"],
      (data ?? []).map((r: Record<string, unknown>) => [
        r.day, r.registers, r.submitted, r.marked, r.present, r.absent, r.late, r.excused, r.half_day, r.on_leave, r.rate,
      ])
    );
  }

  const filename = `attendance-${report}-${q.kind}-${q.from}-to-${q.to}.csv`;
  return new NextResponse("﻿" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
