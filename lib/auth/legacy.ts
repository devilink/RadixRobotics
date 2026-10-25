import "server-only";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/server";

// Guards for the original curriculum portal's server actions. Server actions are
// public POST endpoints, so each one must authenticate the caller itself.

export type LegacyRole = { userId: string; email: string; role: string | null; schoolId: string | null };

function serviceClient() {
  return createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/** The signed-in user and their legacy `user_roles` row, or null when signed out. */
export async function getLegacyRole(): Promise<LegacyRole | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  // Roles come only from user_roles. Nothing is inferred from the email address.
  const { data } = await serviceClient()
    .from("user_roles")
    .select("role, school_id")
    .eq("id", user.id)
    .maybeSingle();
  return { userId: user.id, email: user.email ?? "", role: data?.role ?? null, schoolId: data?.school_id ?? null };
}

/** The owner account that is bootstrapped as super admin (SUPER_ADMIN_EMAIL), or null when unset. */
export function superAdminEmail(): string | null {
  const email = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase();
  return email ? email : null;
}

export class LegacyAuthError extends Error {}

export async function requireLegacySuperAdmin(): Promise<LegacyRole> {
  const me = await getLegacyRole();
  if (!me || me.role !== "super_admin") throw new LegacyAuthError("Not authorised");
  return me;
}

/** Super admins, or the school admin of `schoolId`. */
export async function requireLegacySchoolAccess(schoolId: string): Promise<LegacyRole> {
  const me = await getLegacyRole();
  if (!me) throw new LegacyAuthError("Not authorised");
  if (me.role === "super_admin") return me;
  if (me.role === "school_admin" && me.schoolId === schoolId) return me;
  throw new LegacyAuthError("Not authorised");
}
