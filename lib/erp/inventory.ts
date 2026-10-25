import "server-only";
import { notFound } from "next/navigation";
import { ForbiddenError, getErpContext, requireErpContext, type ErpContext } from "./context";

// Inventory is restricted to platform-wide Super Admins. The database enforces
// the same rule by role (erp_private.is_super_admin), not by permission.

export function isSuperAdmin(ctx: ErpContext): boolean {
  return ctx.assignments.some((a) => a.role_key === "super_admin" && a.institution_id === null);
}

/** For pages: Super Admin or 404. */
export async function requireInventoryPage(): Promise<ErpContext> {
  const ctx = await requireErpContext();
  if (!isSuperAdmin(ctx)) notFound();
  return ctx;
}

/** For server actions: Super Admin or ForbiddenError. */
export async function requireInventoryAction(): Promise<ErpContext> {
  const ctx = await getErpContext();
  if (!ctx) throw new ForbiddenError("Your session has expired. Please sign in again.");
  if (!isSuperAdmin(ctx)) throw new ForbiddenError("Inventory is restricted to Super Admins.");
  return ctx;
}
