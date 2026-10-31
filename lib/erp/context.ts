import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/server";
import { getSessionUser } from "@/lib/auth/session";
import { buildPermissionSet, can, canAny, type PermissionSet } from "./permissions";
import { CATEGORIES, type Category, type InstitutionType } from "./types";

export type RoleAssignment = {
  id: string;
  role_key: string;
  role_name: string;
  institution_id: string | null;
  institution_name: string | null;
  institution_type: InstitutionType | null;
};

export type ErpContext = {
  userId: string;
  email: string;
  displayName: string;
  personId: string | null;
  assignments: RoleAssignment[];
  perms: PermissionSet;
  isPlatformUser: boolean;
  /** False when the ERP tables are missing (migrations not applied to this database). */
  databaseReady: boolean;
};

/** Supabase client bound to the signed-in user's session: every query is subject to RLS. */
export const db = cache(async () => createClient());

/**
 * Service-role client. Bypasses RLS — use only for Supabase Auth admin calls
 * (creating login accounts) after an explicit permission check.
 */
export function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase service credentials are not configured");
  return createServiceClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

export const getErpContext = cache(async (): Promise<ErpContext | null> => {
  const user = await getSessionUser();
  if (!user) return null;
  const supabase = await db();

  // Two queries in parallel: the profile, and role assignments with each role's
  // permissions embedded, so the whole context costs one database round trip.
  const [{ data: profile }, { data: rows, error: rowsError }] = await Promise.all([
    supabase.from("profiles").select("full_name, person_id, is_active").eq("id", user.id).maybeSingle(),
    supabase
      .from("user_role_assignments")
      .select("id, role_key, institution_id, roles(name, role_permissions(permission_key)), institutions(name, institution_type)")
      .eq("user_id", user.id),
  ]);
  if (profile && !profile.is_active) return null;

  type Row = {
    id: string;
    role_key: string;
    institution_id: string | null;
    roles: { name: string; role_permissions: { permission_key: string }[] | null } | null;
    institutions: { name: string; institution_type: InstitutionType } | null;
  };
  const assignmentRows = (rows ?? []) as unknown as Row[];
  const permsByRole = new Map<string, string[]>();
  for (const r of assignmentRows) {
    permsByRole.set(r.role_key, (r.roles?.role_permissions ?? []).map((p) => p.permission_key));
  }

  const assignments: RoleAssignment[] = assignmentRows.map((r) => ({
    id: r.id,
    role_key: r.role_key,
    role_name: r.roles?.name ?? r.role_key,
    institution_id: r.institution_id,
    institution_name: r.institutions?.name ?? null,
    institution_type: r.institutions?.institution_type ?? null,
  }));

  return {
    userId: user.id,
    email: user.email,
    displayName: profile?.full_name || user.email || "User",
    personId: profile?.person_id ?? null,
    assignments,
    perms: buildPermissionSet(
      assignmentRows.map((r) => ({ institution_id: r.institution_id, permissions: permsByRole.get(r.role_key) ?? [] }))
    ),
    isPlatformUser: assignments.some((a) => a.institution_id === null),
    // PGRST205 / 42P01: the table does not exist.
    databaseReady: !(rowsError && (rowsError.code === "PGRST205" || rowsError.code === "42P01")),
  };
});

/** For pages: signed-in ERP user or redirect. */
export async function requireErpContext(): Promise<ErpContext> {
  const ctx = await getErpContext();
  if (!ctx) redirect("/login?next=/erp");
  return ctx;
}

/** For pages: require any of the permissions (optionally at an institution), else 404. */
export async function requirePagePermission(anyOf: readonly string[], institutionId?: string | null) {
  const ctx = await requireErpContext();
  if (!canAny(ctx.perms, anyOf, institutionId)) notFound();
  return ctx;
}

export class ForbiddenError extends Error {
  constructor(message = "You do not have permission to do that.") {
    super(message);
  }
}

/** For server actions: require an authenticated user holding one of the permissions. */
export async function requireActionPermission(anyOf: readonly string[], institutionId?: string | null) {
  const ctx = await getErpContext();
  if (!ctx) throw new ForbiddenError("Your session has expired. Please sign in again.");
  if (!canAny(ctx.perms, anyOf, institutionId)) throw new ForbiddenError();
  return ctx;
}

export const CATEGORY_COOKIE = "erp_category";

export async function getCategory(): Promise<Category> {
  const value = (await cookies()).get(CATEGORY_COOKIE)?.value;
  return (CATEGORIES as readonly string[]).includes(value ?? "") ? (value as Category) : "all";
}

export { can, canAny };
