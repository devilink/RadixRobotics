"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { can, db, requireActionPermission, serviceClient, ForbiddenError } from "@/lib/erp/context";
import { check, failure, parse } from "@/lib/erp/action-utils";
import { assignRoleSchema, createUserSchema, formToObject } from "@/lib/erp/validation";
import { sharedRateLimit } from "@/lib/erp/rate-limit";
import type { ActionResult } from "@/lib/erp/types";
import { STUDENT_LOGIN_DOMAIN, studentLoginEmail } from "@/lib/auth/student-login";

/**
 * Creates a Supabase Auth login and grants its first role.
 * The service-role key is used only for the Auth admin call; the role grant and
 * person link run as the signed-in admin so the database enforces who may grant what.
 */
export async function createUserAccount(_prev: unknown, fd: FormData): Promise<ActionResult> {
  try {
    const p = parse(createUserSchema, formToObject(fd));
    if (!p.ok) return p.result;
    const d = p.data;
    const ctx = await requireActionPermission(["users.manage"], d.institution_id ?? null);
    if (!d.institution_id && !ctx.perms.platform.has("users.manage")) throw new ForbiddenError("Only platform administrators can grant platform roles.");
    const supabase = await db();
    if (!(await sharedRateLimit(supabase, ctx.userId, "create-user", 10, 60_000))) throw new ForbiddenError("Too many accounts created in a short time. Please wait a minute.");

    const { data: role } = await supabase.from("roles").select("scope").eq("key", d.role_key).maybeSingle();
    if (!role) return { ok: false, error: "Unknown role.", fieldErrors: { role_key: "Choose a role" } };
    if (role.scope === "institution" && !d.institution_id) return { ok: false, error: "Choose an institution for this role.", fieldErrors: { institution_id: "Required for this role" } };
    if (role.scope === "platform" && d.institution_id) return { ok: false, error: "Platform roles apply to every institution; leave the institution empty.", fieldErrors: { institution_id: "Leave empty for platform roles" } };

    // Students sign in with a username we create; their email is contact details only.
    const isStudent = d.role_key === "student";
    if (isStudent && !d.username) return { ok: false, error: "Choose a username for the student.", fieldErrors: { username: "Required" } };
    if (!isStudent && !d.email) return { ok: false, error: "Enter the email they will sign in with.", fieldErrors: { email: "Required" } };
    const loginEmail = isStudent ? studentLoginEmail(d.username!) : d.email!;

    const admin = serviceClient();
    const { data: created, error: authErr } = await admin.auth.admin.createUser({
      email: loginEmail,
      password: d.password,
      email_confirm: true,
      user_metadata: isStudent
        ? { full_name: d.full_name, username: d.username, ...(d.email ? { contact_email: d.email } : {}) }
        : { full_name: d.full_name },
    });
    if (authErr || !created.user) {
      if (!/already|registered|exists/i.test(authErr?.message ?? "")) return { ok: false, error: "The account could not be created." };
      return isStudent
        ? { ok: false, error: "That username is taken.", fieldErrors: { username: "Already taken. Try another." } }
        : { ok: false, error: "An account with this email already exists." };
    }
    const newId = created.user.id;

    const granted = await supabase.rpc("erp_assign_role", { p_user: newId, p_role: d.role_key, p_institution: d.institution_id ?? null });
    if (granted.error) {
      await admin.auth.admin.deleteUser(newId); // roll back: never leave a login without its intended role
      throw granted.error;
    }
    await admin.from("profiles").update({ full_name: d.full_name }).eq("id", newId);

    // Students also need the curriculum-portal role for the institution's school or center.
    if (isStudent && d.institution_id) {
      const { data: inst } = await supabase.from("institutions").select("legacy_school_id").eq("id", d.institution_id).maybeSingle();
      if (inst?.legacy_school_id) {
        const { error } = await admin
          .from("user_roles")
          .insert({ id: newId, role: "student", school_id: inst.legacy_school_id, is_approved: true });
        if (error) {
          console.error("[erp] student portal role failed", error);
          await admin.auth.admin.deleteUser(newId);
          return { ok: false, error: "The login could not be set up. Please try again." };
        }
      }
    }

    let note = "";
    if (d.membership_id) {
      const linked = await supabase.rpc("erp_link_user_person", { p_user: newId, p_membership: d.membership_id });
      if (linked.error) note = " The account was created but could not be linked to the person record.";
    }
    revalidatePath("/erp/admin/users");
    return {
      ok: true,
      message: isStudent
        ? `Student login created. Username: ${d.username}. They sign in on the Student tab; share the password securely.${note}`
        : `Account created for ${d.email}. Share the temporary password securely and ask them to change it.${note}`,
    };
  } catch (err) {
    return failure(err);
  }
}

const resetPasswordSchema = z.object({
  user_id: z.string().uuid(),
  new_password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72)
    .regex(/[A-Za-z]/, "Include a letter")
    .regex(/[0-9]/, "Include a number"),
});

/**
 * Sets a new password on a student username login (they cannot reset by email).
 * Only for @student.radix.school accounts, and only by a platform admin or an admin
 * with users.manage at an institution where that student holds a role.
 */
export async function resetStudentPassword(_prev: unknown, fd: FormData): Promise<ActionResult> {
  try {
    const p = parse(resetPasswordSchema, formToObject(fd));
    if (!p.ok) return p.result;
    const ctx = await requireActionPermission(["users.manage"]);
    const supabase = await db();
    if (!(await sharedRateLimit(supabase, ctx.userId, "reset-password", 20, 60_000))) throw new ForbiddenError("Too many resets in a short time. Please wait a minute.");

    const admin = serviceClient();
    const { data: target } = await admin.auth.admin.getUserById(p.data.user_id);
    const email = target?.user?.email ?? "";
    if (!email.endsWith(`@${STUDENT_LOGIN_DOMAIN}`)) throw new ForbiddenError("Only student username logins can be reset here.");

    if (!ctx.perms.platform.has("users.manage")) {
      const { data: roles } = await admin.from("user_role_assignments").select("institution_id").eq("user_id", p.data.user_id);
      const allowed = (roles ?? []).some((r) => r.institution_id && can(ctx.perms, "users.manage", r.institution_id));
      if (!allowed) throw new ForbiddenError("This student is not at an institution you manage.");
    }

    const { error } = await admin.auth.admin.updateUserById(p.data.user_id, { password: p.data.new_password });
    if (error) return { ok: false, error: "The password could not be changed." };
    const username = email.slice(0, -(STUDENT_LOGIN_DOMAIN.length + 1));
    return { ok: true, message: `New password set. Username: ${username} · Password: ${p.data.new_password}` };
  } catch (err) {
    return failure(err);
  }
}

export async function assignRole(_prev: unknown, fd: FormData): Promise<ActionResult> {
  try {
    const p = parse(assignRoleSchema, formToObject(fd));
    if (!p.ok) return p.result;
    await requireActionPermission(["users.manage"], p.data.institution_id ?? null);
    const supabase = await db();
    check(await supabase.rpc("erp_assign_role", { p_user: p.data.user_id, p_role: p.data.role_key, p_institution: p.data.institution_id ?? null }));
    revalidatePath("/erp/admin/users");
    return { ok: true, message: "Role granted." };
  } catch (err) {
    return failure(err);
  }
}

export async function revokeRole(_prev: unknown, fd: FormData): Promise<ActionResult> {
  try {
    const id = z.string().uuid().parse(fd.get("assignment_id"));
    await requireActionPermission(["users.manage"]);
    const supabase = await db();
    check(await supabase.rpc("erp_revoke_role", { p_assignment: id }));
    revalidatePath("/erp/admin/users");
    return { ok: true, message: "Role removed." };
  } catch (err) {
    return failure(err);
  }
}

export async function linkPerson(_prev: unknown, fd: FormData): Promise<ActionResult> {
  try {
    const p = parse(z.object({ user_id: z.string().uuid(), membership_id: z.string().uuid() }), formToObject(fd));
    if (!p.ok) return p.result;
    await requireActionPermission(["users.manage"]);
    const supabase = await db();
    check(await supabase.rpc("erp_link_user_person", { p_user: p.data.user_id, p_membership: p.data.membership_id }));
    revalidatePath("/erp/admin/users");
    return { ok: true, message: "Account linked to the person record." };
  } catch (err) {
    return failure(err);
  }
}
