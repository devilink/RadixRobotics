"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { can, db, ForbiddenError, requireActionPermission, serviceClient } from "@/lib/erp/context";
import { check, failure, parse } from "@/lib/erp/action-utils";
import { formToObject, guardianSchema, memberCreateSchema, memberUpdateSchema, studentLoginSchema } from "@/lib/erp/validation";
import { sharedRateLimit } from "@/lib/erp/rate-limit";
import { studentLoginEmail } from "@/lib/auth/student-login";
import type { ActionResult } from "@/lib/erp/types";

const permFor = (memberType: string) => (memberType === "student" ? "students.manage" : "staff.manage");

/** Credentials shown once to the admin after a student is created with a login. */
export type StudentLoginResult = {
  membershipId: string;
  name: string;
  username: string;
  password: string;
  institutionName: string;
  /** False when the institution has no curriculum-portal school, so the login only opens the ERP. */
  curriculum: boolean;
};

export async function createMember(_prev: unknown, fd: FormData): Promise<ActionResult<StudentLoginResult>> {
  let id: string;
  try {
    const raw = formToObject(fd);
    const p = parse(memberCreateSchema, raw);
    const wantsLogin = raw.member_type === "student" && raw.create_login === "on";
    const login = wantsLogin ? parse(studentLoginSchema, raw) : null;
    if (!p.ok || (login && !login.ok)) {
      // Report the record's and the login's field errors together.
      const errorsOf = (r: typeof p | typeof login) => (r && !r.ok && !r.result.ok ? r.result.fieldErrors : undefined);
      return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: { ...errorsOf(p), ...errorsOf(login) } };
    }
    const d = p.data;
    const ctx = await requireActionPermission([permFor(d.member_type)], d.institution_id);
    if (login?.ok) return await createStudentWithLogin(ctx, d, login.data);
    const supabase = await db();
    id = check(await supabase.rpc("erp_create_member", memberRpcArgs(d))) as string;
  } catch (err) {
    return failure(err);
  }
  revalidatePath("/erp/people");
  redirect(`/erp/people/${id}?created=1`);
}

type MemberCreate = z.infer<typeof memberCreateSchema>;

function memberRpcArgs(d: MemberCreate) {
  return {
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
  };
}

/**
 * Student record + username login in one step: the Auth account (service role), then the
 * record, the ERP Student role and the person link (as the signed-in admin, so the database
 * checks who may do what), then the curriculum-portal role for the institution's school or
 * center. Any failure removes the login again, so no half-made account is left behind.
 */
async function createStudentWithLogin(
  ctx: Awaited<ReturnType<typeof requireActionPermission>>,
  d: MemberCreate,
  l: z.infer<typeof studentLoginSchema>
): Promise<ActionResult<StudentLoginResult>> {
  if (!can(ctx.perms, "users.manage", d.institution_id)) throw new ForbiddenError("You can add the student, but not create logins at this institution.");
  const supabase = await db();
  if (!(await sharedRateLimit(supabase, ctx.userId, "create-user", 30, 60_000))) throw new ForbiddenError("Too many accounts created in a short time. Please wait a minute.");
  const { data: inst } = await supabase.from("institutions").select("name, legacy_school_id").eq("id", d.institution_id).maybeSingle();
  if (!inst) throw new ForbiddenError("Institution not found.");

  const name = `${d.first_name} ${d.last_name}`.trim();
  const admin = serviceClient();
  const { data: created, error: authErr } = await admin.auth.admin.createUser({
    email: studentLoginEmail(l.login_username),
    password: l.login_password,
    email_confirm: true,
    user_metadata: { full_name: name, username: l.login_username },
  });
  if (authErr || !created.user) {
    return /already|registered|exists/i.test(authErr?.message ?? "")
      ? { ok: false, error: "That username is taken.", fieldErrors: { login_username: "Already taken. Try another." } }
      : { ok: false, error: "The login could not be created." };
  }
  const userId = created.user.id;

  let membershipId: string;
  try {
    membershipId = check(await supabase.rpc("erp_create_member", memberRpcArgs(d))) as string;
  } catch (err) {
    await admin.auth.admin.deleteUser(userId);
    return failure(err);
  }

  try {
    check(await supabase.rpc("erp_assign_role", { p_user: userId, p_role: "student", p_institution: d.institution_id }));
    check(await supabase.rpc("erp_link_user_person", { p_user: userId, p_membership: membershipId }));
    if (inst.legacy_school_id) {
      const { error } = await admin
        .from("user_roles")
        .insert({ id: userId, role: "student", school_id: inst.legacy_school_id, is_approved: true });
      if (error) throw error;
    }
  } catch (err) {
    console.error("[erp] student login setup failed", err);
    await admin.auth.admin.deleteUser(userId);
    revalidatePath("/erp/people");
    return {
      ok: false,
      error: "The student record was created, but the login could not be set up. Open the student's page to create a login.",
    };
  }

  revalidatePath("/erp/people");
  return {
    ok: true,
    data: {
      membershipId,
      name,
      username: l.login_username,
      password: l.login_password,
      institutionName: inst.name,
      curriculum: !!inst.legacy_school_id,
    },
  };
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
          // Students only: the database applies notes when the key is present.
          ...(memberType === "student" ? { notes: d.notes ?? "" } : {}),
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

const deleteSchema = z.object({
  membership_ids: z.array(z.string().uuid()).min(1, "Select at least one student").max(500),
  return_to_list: z.string().optional(),
});

type DeleteResult = { deleted: number; blocked: { id: string; name: string | null; reason: string }[] };

/**
 * Permanently deletes students. The database refuses students with attendance
 * history (mark them Left instead) or a portal login, and reports them back.
 */
export async function deleteStudents(_prev: unknown, fd: FormData): Promise<ActionResult> {
  let deleted = 0;
  try {
    const p = parse(deleteSchema, formToObject(fd, ["membership_ids"]));
    if (!p.ok) return p.result;
    const supabase = await db();
    // Permission is checked per student inside the function (students.manage at their institution).
    const r = check(await supabase.rpc("erp_delete_students", { p_memberships: p.data.membership_ids })) as DeleteResult;
    deleted = r.deleted;
    revalidatePath("/erp/people");
    const blocked = r.blocked ?? [];
    if (blocked.length) {
      const list = blocked.slice(0, 5).map((b) => `${b.name ?? "A student"}: ${b.reason}`).join("; ");
      const more = blocked.length > 5 ? ` (and ${blocked.length - 5} more)` : "";
      const msg = `${deleted ? `Deleted ${deleted} student${deleted === 1 ? "" : "s"}. ` : ""}${blocked.length} could not be deleted. ${list}${more}.`;
      return deleted ? { ok: true, message: msg } : { ok: false, error: msg };
    }
    if (!p.data.return_to_list) return { ok: true, message: `Deleted ${deleted} student${deleted === 1 ? "" : "s"}.` };
  } catch (err) {
    return failure(err);
  }
  redirect(`/erp/people?type=students&deleted=${deleted}`);
}
