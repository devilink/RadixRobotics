import "server-only";
import { notFound } from "next/navigation";
import { ForbiddenError, getErpContext, requireErpContext, type ErpContext } from "./context";
import { isSuperAdmin } from "./inventory";

// Community applications hold applicants' personal details and files, so they
// are Super Admin only. The database enforces the same rule through RLS and
// Storage policies (erp_private.is_super_admin).

export async function requireCommunityPage(): Promise<ErpContext> {
  const ctx = await requireErpContext();
  if (!isSuperAdmin(ctx)) notFound();
  return ctx;
}

export async function requireCommunityAction(): Promise<ErpContext> {
  const ctx = await getErpContext();
  if (!ctx) throw new ForbiddenError("Your session has expired. Please sign in again.");
  if (!isSuperAdmin(ctx)) throw new ForbiddenError("Community applications are restricted to Super Admins.");
  return ctx;
}
