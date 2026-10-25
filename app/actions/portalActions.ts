"use server";

import { getLegacyRole } from "@/lib/auth/legacy";
import { hasErpAccess } from "@/app/erp/actions";

/** Where the signed-in user's "portal" link should go, based on their stored roles only. */
export async function getPortalPath(): Promise<string> {
  const me = await getLegacyRole();
  if (!me) return "/login";
  if (me.role === "super_admin") return "/super-admin";
  if ((me.role === "school_admin" || me.role === "student") && me.schoolId) return `/curriculum/${me.schoolId}`;
  if (await hasErpAccess()) return "/erp";
  return "/login";
}
