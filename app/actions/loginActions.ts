"use server";

import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/server";
import { getSessionUser } from "@/lib/auth/session";
import { superAdminEmail } from "@/lib/auth/legacy";

export type LoginDestination = { ok: true; path: string } | { ok: false; error: string; signedOut?: boolean };

// Only same-site ERP paths are accepted as post-login destinations (no open redirects).
const ERP_NEXT = /^\/erp(\/[A-Za-z0-9/_-]*)?$/;

function admin() {
  return createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * Everything the login page needs after sign-in, in one server round trip:
 * bootstraps the owner account if needed, then works out where the user goes.
 * Previously this was up to six sequential server actions.
 */
export async function resolveLoginDestination(next?: string | null): Promise<LoginDestination> {
  const me = await getSessionUser();
  if (!me) return { ok: false, error: "Your session could not be verified. Please sign in again." };

  const supabase = await createClient();
  const service = admin();

  // Owner bootstrap (SUPER_ADMIN_EMAIL). Only the owner pays for the extra
  // Auth call, which is needed to confirm their email address is verified.
  const owner = superAdminEmail();
  if (owner && me.email.toLowerCase() === owner) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.email?.toLowerCase() === owner && user.email_confirmed_at) {
      await service.from("user_roles").upsert({ id: user.id, role: "super_admin", school_id: null });
      const { count } = await service.from("user_role_assignments")
        .select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("role_key", "super_admin");
      if (count === 0) await service.from("user_role_assignments").insert({ user_id: user.id, role_key: "super_admin" });
    }
  }

  const [{ data: role }, { count: erpRoles }] = await Promise.all([
    service.from("user_roles").select("role, school_id, is_approved").eq("id", me.id).maybeSingle(),
    supabase.from("user_role_assignments").select("id", { count: "exact", head: true }).eq("user_id", me.id),
  ]);
  const hasErp = (erpRoles ?? 0) > 0;

  if (next && ERP_NEXT.test(next) && hasErp) return { ok: true, path: next };

  if (!role) {
    if (hasErp) return { ok: true, path: "/erp" };
    return { ok: false, error: "No role has been assigned to your account. Contact your administrator." };
  }

  if (role.is_approved === false) {
    await supabase.auth.signOut();
    return { ok: false, error: "Your account is currently Pending Approval by your school administrator.", signedOut: true };
  }

  if (role.role === "super_admin") return { ok: true, path: "/super-admin" };
  // Students land on their profile (projects, virtual lab, progress); the curriculum is for school admins.
  if (role.role === "student") return { ok: true, path: "/profile" };
  if (role.role === "school_admin" && role.school_id) {
    return { ok: true, path: `/curriculum/${role.school_id}` };
  }
  return { ok: true, path: "/" };
}
