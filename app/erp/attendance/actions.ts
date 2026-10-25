"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db, getErpContext, requireActionPermission, ForbiddenError } from "@/lib/erp/context";
import { check, failure, parse } from "@/lib/erp/action-utils";
import { MARK_PERMS } from "@/lib/erp/permissions";
import { correctionSchema, formToObject, leaveRequestSchema, openSessionSchema, reviewSchema, saveAttendanceSchema } from "@/lib/erp/validation";
import { sharedRateLimit } from "@/lib/erp/rate-limit";
import type { ActionResult } from "@/lib/erp/types";

const uuid = z.string().uuid();

export async function openRegister(_prev: unknown, fd: FormData): Promise<ActionResult> {
  let sessionId: string;
  try {
    const p = parse(openSessionSchema, formToObject(fd));
    if (!p.ok) return p.result;
    const d = p.data;
    await requireActionPermission(
      d.kind === "student" ? ["attendance.mark", "attendance.mark_assigned"] : ["staff_attendance.mark"],
      d.institution_id
    );
    const supabase = await db();
    sessionId = check(
      await supabase.rpc("erp_open_attendance_session", {
        p_institution: d.institution_id,
        p_kind: d.kind,
        p_date: d.date,
        p_group: d.group_id ?? null,
        p_period: d.period ?? "",
      })
    ) as string;
  } catch (err) {
    return failure(err);
  }
  redirect(`/erp/attendance/register/${sessionId}`);
}

/** Bulk save from the register editor. Only changed rows are sent; the database validates the roster. */
export async function saveRegister(input: unknown): Promise<ActionResult<{ changed: number; status: string }>> {
  try {
    const p = parse(saveAttendanceSchema, input);
    if (!p.ok) return p.result;
    const ctx = await requireActionPermission(MARK_PERMS);
    const supabase = await db();
    if (!(await sharedRateLimit(supabase, ctx.userId, "attendance-save", 60, 60_000))) throw new ForbiddenError("Too many saves in a short time. Please wait a moment.");
    const res = check(
      await supabase.rpc("erp_save_attendance", {
        p_session: p.data.session_id,
        p_entries: p.data.entries.map((e) => ({
          membership_id: e.membership_id,
          status: e.status,
          check_in: e.check_in ?? null,
          check_out: e.check_out ?? null,
          remarks: e.remarks ?? null,
        })),
        p_submit: p.data.submit,
      })
    ) as { changed: number; status: string };
    revalidatePath(`/erp/attendance/register/${p.data.session_id}`);
    return {
      ok: true,
      data: res,
      message: p.data.submit ? "Register submitted." : res.changed ? `Saved ${res.changed} change${res.changed === 1 ? "" : "s"}.` : "No changes to save.",
    };
  } catch (err) {
    return failure(err);
  }
}

export async function finalizeRegister(sessionId: string): Promise<ActionResult> {
  try {
    if (!uuid.safeParse(sessionId).success) throw new ForbiddenError("Register not found.");
    await requireActionPermission(["attendance.finalize", "staff_attendance.approve"]);
    const supabase = await db();
    check(await supabase.rpc("erp_finalize_attendance_session", { p_session: sessionId }));
    revalidatePath(`/erp/attendance/register/${sessionId}`);
    return { ok: true, message: "Register finalised. Further changes need a correction." };
  } catch (err) {
    return failure(err);
  }
}

export async function correctRecord(_prev: unknown, fd: FormData): Promise<ActionResult> {
  try {
    const p = parse(correctionSchema, formToObject(fd));
    if (!p.ok) return p.result;
    const d = p.data;
    const ctx = await getErpContext();
    if (!ctx) throw new ForbiddenError("Your session has expired. Please sign in again.");
    const supabase = await db();
    const args = { p_record: d.record_id, p_status: d.status, p_reason: d.reason, p_check_in: d.check_in ?? null, p_check_out: d.check_out ?? null };
    if (d.mode === "direct") {
      check(await supabase.rpc("erp_correct_attendance", args));
    } else {
      check(await supabase.rpc("erp_request_attendance_correction", args));
    }
    const sessionId = String(fd.get("session_id") ?? "");
    if (uuid.safeParse(sessionId).success) revalidatePath(`/erp/attendance/register/${sessionId}`);
    revalidatePath("/erp/attendance/corrections");
    return { ok: true, message: d.mode === "direct" ? "Correction saved and logged." : "Correction request sent for approval." };
  } catch (err) {
    return failure(err);
  }
}

export async function reviewCorrection(_prev: unknown, fd: FormData): Promise<ActionResult> {
  try {
    const p = parse(reviewSchema, formToObject(fd));
    if (!p.ok) return p.result;
    await requireActionPermission(["attendance.approve", "staff_attendance.approve"]);
    const supabase = await db();
    check(await supabase.rpc("erp_review_attendance_correction", { p_request: p.data.id, p_approve: p.data.approve, p_note: p.data.note ?? null }));
    revalidatePath("/erp/attendance/corrections");
    return { ok: true, message: p.data.approve ? "Correction approved and applied." : "Correction rejected." };
  } catch (err) {
    return failure(err);
  }
}

export async function requestLeave(_prev: unknown, fd: FormData): Promise<ActionResult> {
  try {
    const p = parse(leaveRequestSchema, formToObject(fd));
    if (!p.ok) return p.result;
    const ctx = await getErpContext();
    if (!ctx) throw new ForbiddenError("Your session has expired. Please sign in again.");
    const supabase = await db();
    check(
      await supabase.rpc("erp_request_leave", {
        p_membership: p.data.membership_id,
        p_leave_type: p.data.leave_type,
        p_start: p.data.start_date,
        p_end: p.data.end_date,
        p_reason: p.data.reason,
        p_half_day: p.data.half_day,
      })
    );
    revalidatePath("/erp/attendance/leave");
    return { ok: true, message: "Leave request submitted." };
  } catch (err) {
    return failure(err);
  }
}

export async function reviewLeave(_prev: unknown, fd: FormData): Promise<ActionResult> {
  try {
    const p = parse(reviewSchema, formToObject(fd));
    if (!p.ok) return p.result;
    await requireActionPermission(["leave.approve"]);
    const supabase = await db();
    check(await supabase.rpc("erp_review_leave", { p_request: p.data.id, p_approve: p.data.approve, p_note: p.data.note ?? null }));
    revalidatePath("/erp/attendance/leave");
    return { ok: true, message: p.data.approve ? "Leave approved." : "Leave rejected." };
  } catch (err) {
    return failure(err);
  }
}

export async function cancelLeave(_prev: unknown, fd: FormData): Promise<ActionResult> {
  try {
    const id = uuid.parse(fd.get("id"));
    const supabase = await db();
    check(await supabase.rpc("erp_cancel_leave", { p_request: id }));
    revalidatePath("/erp/attendance/leave");
    return { ok: true, message: "Leave request cancelled." };
  } catch (err) {
    return failure(err);
  }
}
