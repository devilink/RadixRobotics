import "server-only";
import { can, db, type ErpContext } from "@/lib/erp/context";
import type { InstitutionChoice } from "./MemberForm";

/** Institutions where the user may create/edit members, with their campuses and shifts. */
export async function memberInstitutionChoices(ctx: ErpContext, onlyId?: string): Promise<InstitutionChoice[]> {
  const supabase = await db();
  let q = supabase
    .from("institutions")
    .select("id, name, institution_type, legacy_school_id, campuses(id, name), shifts:work_shifts(id, name)")
    .order("name");
  // Editing works on any institution the member belongs to; creating only on active ones.
  q = onlyId ? q.eq("id", onlyId) : q.eq("status", "active");
  const { data } = await q;
  return ((data ?? []) as unknown as Omit<InstitutionChoice, "canStudents" | "canStaff" | "canLogins">[])
    .map((i) => ({
      ...i,
      canStudents: can(ctx.perms, "students.manage", i.id) && i.institution_type !== "head_office",
      canStaff: can(ctx.perms, "staff.manage", i.id),
      // Creating a login also grants a role and links it, which needs users.manage.
      canLogins: can(ctx.perms, "users.manage", i.id),
    }))
    .filter((i) => i.canStudents || i.canStaff);
}
