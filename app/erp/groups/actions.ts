"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db, requireActionPermission, ForbiddenError } from "@/lib/erp/context";
import { check, failure, parse } from "@/lib/erp/action-utils";
import { formToObject, groupSchema } from "@/lib/erp/validation";
import { todayIn } from "@/lib/erp/format";
import type { ActionResult } from "@/lib/erp/types";

export async function createGroup(_prev: unknown, fd: FormData): Promise<ActionResult> {
  let id: string;
  try {
    const p = parse(groupSchema, formToObject(fd, ["meeting_days"]));
    if (!p.ok) return p.result;
    await requireActionPermission(["groups.manage"], p.data.institution_id);
    const supabase = await db();
    const { data: inst } = await supabase.from("institutions").select("institution_type").eq("id", p.data.institution_id).maybeSingle();
    if (!inst || inst.institution_type === "head_office") throw new ForbiddenError("Institution not found.");
    const { meeting_days, ...rest } = p.data;
    const row = check(
      await supabase
        .from("learning_groups")
        .insert({
          ...rest,
          group_type: inst.institution_type === "school" ? "class_section" : "batch",
          // Schools follow the institution's working days unless a batch-style schedule is given.
          meeting_days: meeting_days && meeting_days.length ? meeting_days : null,
        })
        .select("id")
        .single()
    );
    id = row!.id;
  } catch (err) {
    return failure(err);
  }
  revalidatePath("/erp/groups");
  redirect(`/erp/groups/${id}`);
}

const groupMembersSchema = z.object({
  group_id: z.string().uuid(),
  institution_id: z.string().uuid(),
  membership_ids: z.array(z.string().uuid()).min(1, "Select at least one person").max(500),
});

export async function enrollStudents(_prev: unknown, fd: FormData): Promise<ActionResult> {
  try {
    const p = parse(groupMembersSchema, formToObject(fd, ["membership_ids"]));
    if (!p.ok) return p.result;
    await requireActionPermission(["groups.manage", "students.manage"], p.data.institution_id);
    const supabase = await db();
    // Composite foreign keys reject students or groups from another institution.
    check(
      await supabase.from("enrollments").upsert(
        p.data.membership_ids.map((m) => ({ institution_id: p.data.institution_id, group_id: p.data.group_id, membership_id: m })),
        { onConflict: "group_id,membership_id", ignoreDuplicates: true }
      )
    );
    // Someone removed earlier keeps their old enrolment row (with an end date):
    // adding them again reopens it instead of silently doing nothing.
    check(
      await supabase.from("enrollments").update({ end_date: null })
        .eq("group_id", p.data.group_id).in("membership_id", p.data.membership_ids).not("end_date", "is", null)
    );
    revalidatePath(`/erp/groups/${p.data.group_id}`);
    revalidatePath("/erp/people/[id]", "page");
    return { ok: true, message: `${p.data.membership_ids.length} student(s) enrolled.` };
  } catch (err) {
    return failure(err);
  }
}

const endSchema = z.object({ enrollment_id: z.string().uuid(), group_id: z.string().uuid(), institution_id: z.string().uuid() });

/** Ends an enrolment today instead of deleting it, so past registers keep their roster. */
export async function endEnrollment(_prev: unknown, fd: FormData): Promise<ActionResult> {
  try {
    const p = parse(endSchema, formToObject(fd));
    if (!p.ok) return p.result;
    await requireActionPermission(["groups.manage", "students.manage"], p.data.institution_id);
    const supabase = await db();
    const { data: inst } = await supabase.from("institutions").select("timezone").eq("id", p.data.institution_id).maybeSingle();
    const today = todayIn(inst?.timezone ?? "Asia/Kolkata");
    const rows = check(
      await supabase.from("enrollments").update({ end_date: today })
        .eq("id", p.data.enrollment_id).eq("group_id", p.data.group_id).select("id")
    );
    if (!rows?.length) throw new ForbiddenError("Enrolment not found.");
    revalidatePath(`/erp/groups/${p.data.group_id}`);
    revalidatePath("/erp/people/[id]", "page");
    return { ok: true, message: "Student removed from this group from today." };
  } catch (err) {
    return failure(err);
  }
}

export async function assignStaff(_prev: unknown, fd: FormData): Promise<ActionResult> {
  try {
    const p = parse(groupMembersSchema.extend({ assignment_role: z.enum(["lead", "assistant"]).default("lead") }), formToObject(fd, ["membership_ids"]));
    if (!p.ok) return p.result;
    await requireActionPermission(["groups.manage"], p.data.institution_id);
    const supabase = await db();
    check(
      await supabase.from("group_assignments").upsert(
        p.data.membership_ids.map((m) => ({
          institution_id: p.data.institution_id, group_id: p.data.group_id, membership_id: m, assignment_role: p.data.assignment_role,
        })),
        { onConflict: "group_id,membership_id", ignoreDuplicates: true }
      )
    );
    revalidatePath(`/erp/groups/${p.data.group_id}`);
    return { ok: true, message: "Assignment saved." };
  } catch (err) {
    return failure(err);
  }
}

const removeSchema = z.object({ assignment_id: z.string().uuid(), group_id: z.string().uuid(), institution_id: z.string().uuid() });

export async function removeAssignment(_prev: unknown, fd: FormData): Promise<ActionResult> {
  try {
    const p = parse(removeSchema, formToObject(fd));
    if (!p.ok) return p.result;
    await requireActionPermission(["groups.manage"], p.data.institution_id);
    const supabase = await db();
    const rows = check(await supabase.from("group_assignments").delete().eq("id", p.data.assignment_id).eq("group_id", p.data.group_id).select("id"));
    if (!rows?.length) throw new ForbiddenError("Assignment not found.");
    revalidatePath(`/erp/groups/${p.data.group_id}`);
    return { ok: true, message: "Assignment removed." };
  } catch (err) {
    return failure(err);
  }
}
