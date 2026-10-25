"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db, requireActionPermission } from "@/lib/erp/context";
import { check, failure, parse } from "@/lib/erp/action-utils";
import { formToObject, guardianSchema, memberCreateSchema, memberUpdateSchema } from "@/lib/erp/validation";
import type { ActionResult } from "@/lib/erp/types";

const permFor = (memberType: string) => (memberType === "student" ? "students.manage" : "staff.manage");

export async function createMember(_prev: unknown, fd: FormData): Promise<ActionResult> {
  let id: string;
  try {
    const p = parse(memberCreateSchema, formToObject(fd));
    if (!p.ok) return p.result;
    const d = p.data;
    await requireActionPermission([permFor(d.member_type)], d.institution_id);
    const supabase = await db();
    id = check(
      await supabase.rpc("erp_create_member", {
        p_institution: d.institution_id,
        p_member_type: d.member_type,
        p_first_name: d.first_name,
        p_last_name: d.last_name,
        p_member_code: d.member_code,
        p_email: d.email ?? null,
        p_phone: d.phone ?? null,
        p_campus: d.campus_id ?? null,
        p_start_date: d.start_date ?? null,
        p_details: {
          registration_number: d.registration_number ?? "",
          admission_date: d.admission_date ?? "",
          department: d.department ?? "",
          position: d.position ?? "",
          employment_type: d.employment_type ?? "",
          shift_id: d.shift_id ?? "",
        },
      })
    ) as string;
  } catch (err) {
    return failure(err);
  }
  revalidatePath("/erp/people");
  redirect(`/erp/people/${id}?created=1`);
}

export async function updateMember(memberType: string, institutionId: string, _prev: unknown, fd: FormData): Promise<ActionResult> {
  let id: string;
  try {
    const p = parse(memberUpdateSchema, formToObject(fd));
    if (!p.ok) return p.result;
    const d = p.data;
    id = d.membership_id;
    // UI-level check; the database re-derives type and institution from the membership row.
    await requireActionPermission([permFor(memberType)], institutionId);
    const supabase = await db();
    check(
      await supabase.rpc("erp_update_member", {
        p_membership: d.membership_id,
        p_first_name: d.first_name,
        p_last_name: d.last_name,
        p_member_code: d.member_code,
        p_status: d.status,
        p_email: d.email ?? null,
        p_phone: d.phone ?? null,
        p_campus: d.campus_id ?? null,
        p_end_date: d.end_date ?? null,
        p_details: {
          registration_number: d.registration_number ?? "",
          admission_date: d.admission_date ?? "",
          department: d.department ?? "",
          position: d.position ?? "",
          employment_type: d.employment_type ?? "",
          shift_id: d.shift_id ?? "",
        },
      })
    );
  } catch (err) {
    return failure(err);
  }
  revalidatePath(`/erp/people/${id}`);
  redirect(`/erp/people/${id}`);
}

export async function addGuardian(institutionId: string, _prev: unknown, fd: FormData): Promise<ActionResult> {
  try {
    const p = parse(guardianSchema, formToObject(fd));
    if (!p.ok) return p.result;
    await requireActionPermission(["students.manage"], institutionId);
    const supabase = await db();
    check(
      await supabase.rpc("erp_add_guardian", {
        p_student: p.data.student_membership_id,
        p_full_name: p.data.full_name,
        p_relationship: p.data.relationship,
        p_phone: p.data.phone ?? null,
        p_email: p.data.email ?? null,
        p_primary: p.data.is_primary,
      })
    );
    revalidatePath(`/erp/people/${p.data.student_membership_id}`);
    return { ok: true, message: "Guardian added." };
  } catch (err) {
    return failure(err);
  }
}

const removeGuardianSchema = z.object({ guardian_id: z.string().uuid(), student_membership_id: z.string().uuid() });

export async function removeGuardian(institutionId: string, _prev: unknown, fd: FormData): Promise<ActionResult> {
  try {
    const p = parse(removeGuardianSchema, formToObject(fd));
    if (!p.ok) return p.result;
    await requireActionPermission(["students.manage"], institutionId);
    const supabase = await db();
    check(await supabase.rpc("erp_remove_guardian", { p_guardian: p.data.guardian_id, p_student: p.data.student_membership_id }));
    revalidatePath(`/erp/people/${p.data.student_membership_id}`);
    return { ok: true, message: "Guardian removed." };
  } catch (err) {
    return failure(err);
  }
}
