"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db, requireActionPermission, serviceClient, ForbiddenError } from "@/lib/erp/context";
import { check, failure, parse } from "@/lib/erp/action-utils";
import { assignRoleSchema, createUserSchema, formToObject } from "@/lib/erp/validation";
import { sharedRateLimit } from "@/lib/erp/rate-limit";
import type { ActionResult } from "@/lib/erp/types";

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

    const admin = serviceClient();
    const { data: created, error: authErr } = await admin.auth.admin.createUser({
      email: d.email, password: d.password, email_confirm: true, user_metadata: { full_name: d.full_name },
    });
    if (authErr || !created.user) {
      return { ok: false, error: /already|registered|exists/i.test(authErr?.message ?? "") ? "An account with this email already exists." : "The account could not be created." };
    }
    const newId = created.user.id;

    const granted = await supabase.rpc("erp_assign_role", { p_user: newId, p_role: d.role_key, p_institution: d.institution_id ?? null });
    if (granted.error) {
      await admin.auth.admin.deleteUser(newId); // roll back: never leave a login without its intended role
      throw granted.error;
    }
    await admin.from("profiles").update({ full_name: d.full_name }).eq("id", newId);

    let note = "";
    if (d.membership_id) {
      const linked = await supabase.rpc("erp_link_user_person", { p_user: newId, p_membership: d.membership_id });
      if (linked.error) note = " The account was created but could not be linked to the person record.";
    }
    revalidatePath("/erp/admin/users");
    return { ok: true, message: `Account created for ${d.email}. Share the temporary password securely and ask them to change it.${note}` };
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
