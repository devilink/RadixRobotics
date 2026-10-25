"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db, requireActionPermission, ForbiddenError } from "@/lib/erp/context";
import { check, failure, parse } from "@/lib/erp/action-utils";
import { campusSchema, formToObject, institutionSchema, shiftSchema } from "@/lib/erp/validation";
import type { ActionResult } from "@/lib/erp/types";

export async function createInstitution(_prev: unknown, fd: FormData): Promise<ActionResult> {
  let id: string;
  try {
    const ctx = await requireActionPermission(["institutions.manage"]);
    if (!ctx.perms.platform.has("institutions.manage")) throw new ForbiddenError("Only platform administrators can create institutions.");
    const p = parse(institutionSchema, formToObject(fd, ["working_days"]));
    if (!p.ok) return p.result;
    const supabase = await db();
    const row = check(
      await supabase.from("institutions").insert({ ...p.data, working_days: p.data.working_days, created_by: ctx.userId }).select("id").single()
    );
    id = row!.id;
    check(await supabase.from("campuses").insert({ institution_id: id, name: "Main Campus", is_primary: true, city: p.data.city ?? null }));
  } catch (err) {
    return failure(err);
  }
  revalidatePath("/erp/institutions");
  redirect(`/erp/institutions/${id}`);
}

export async function updateInstitution(id: string, _prev: unknown, fd: FormData): Promise<ActionResult> {
  try {
    await requireActionPermission(["institutions.manage"], id);
    const p = parse(institutionSchema, formToObject(fd, ["working_days"]));
    if (!p.ok) return p.result;
    // Institution type is fixed after creation: classes/batches and roles depend on it.
    const changes: Partial<typeof p.data> = { ...p.data };
    delete changes.institution_type;
    const supabase = await db();
    const rows = check(await supabase.from("institutions").update(changes).eq("id", id).select("id"));
    if (!rows?.length) throw new ForbiddenError("Institution not found.");
  } catch (err) {
    return failure(err);
  }
  revalidatePath(`/erp/institutions/${id}`);
  redirect(`/erp/institutions/${id}`);
}

export async function addCampus(_prev: unknown, fd: FormData): Promise<ActionResult> {
  try {
    const p = parse(campusSchema, formToObject(fd));
    if (!p.ok) return p.result;
    await requireActionPermission(["institutions.manage"], p.data.institution_id);
    const supabase = await db();
    check(await supabase.from("campuses").insert(p.data));
    revalidatePath(`/erp/institutions/${p.data.institution_id}`);
    return { ok: true, message: "Campus added." };
  } catch (err) {
    return failure(err);
  }
}

export async function addShift(_prev: unknown, fd: FormData): Promise<ActionResult> {
  try {
    const p = parse(shiftSchema, formToObject(fd, ["days_of_week"]));
    if (!p.ok) return p.result;
    await requireActionPermission(["staff.manage"], p.data.institution_id);
    const supabase = await db();
    check(await supabase.from("work_shifts").insert(p.data));
    revalidatePath(`/erp/institutions/${p.data.institution_id}`);
    return { ok: true, message: "Shift added." };
  } catch (err) {
    return failure(err);
  }
}

export async function deleteShift(_prev: unknown, fd: FormData): Promise<ActionResult> {
  try {
    const id = String(fd.get("id") ?? "");
    const institutionId = String(fd.get("institution_id") ?? "");
    await requireActionPermission(["staff.manage"], institutionId);
    const supabase = await db();
    const rows = check(await supabase.from("work_shifts").delete().eq("id", id).eq("institution_id", institutionId).select("id"));
    if (!rows?.length) throw new ForbiddenError("Shift not found.");
    revalidatePath(`/erp/institutions/${institutionId}`);
    return { ok: true, message: "Shift removed." };
  } catch (err) {
    return failure(err);
  }
}
