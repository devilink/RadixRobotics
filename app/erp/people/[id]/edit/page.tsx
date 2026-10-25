import { notFound } from "next/navigation";
import { can, db, requirePagePermission } from "@/lib/erp/context";
import { Card, PageHeader } from "../../../_components/ui";
import { MemberForm, type MemberValues } from "../../MemberForm";
import { memberInstitutionChoices } from "../../choices";
import { updateMember } from "../../actions";

export const metadata = { title: "Edit person" };

export default async function EditMemberPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const ctx = await requirePagePermission(["students.manage", "staff.manage"]);
  const supabase = await db();
  const { data: m } = await supabase
    .from("institution_memberships")
    .select("*, people(*), student_profiles(*), employee_profiles(*)")
    .eq("id", id)
    .maybeSingle();
  if (!m || !can(ctx.perms, m.member_type === "student" ? "students.manage" : "staff.manage", m.institution_id)) notFound();
  const p = m.people as { first_name: string; last_name: string; email: string | null; phone: string | null };
  const s = (Array.isArray(m.student_profiles) ? m.student_profiles[0] : m.student_profiles) as Record<string, string | null> | null;
  const e = (Array.isArray(m.employee_profiles) ? m.employee_profiles[0] : m.employee_profiles) as Record<string, string | null> | null;
  const initial: MemberValues = {
    membership_id: m.id, member_type: m.member_type, institution_id: m.institution_id,
    first_name: p.first_name, last_name: p.last_name, member_code: m.member_code, email: p.email, phone: p.phone,
    campus_id: m.campus_id, status: m.status, end_date: m.end_date,
    registration_number: s?.registration_number ?? null, admission_date: s?.admission_date ?? null,
    department: e?.department ?? null, position: e?.position ?? null, employment_type: e?.employment_type ?? null, shift_id: e?.shift_id ?? null,
  };
  const choices = await memberInstitutionChoices(ctx, m.institution_id);
  const name = `${p.first_name} ${p.last_name}`.trim();
  return (
    <>
      <PageHeader title={`Edit ${name}`} crumbs={[{ href: `/erp/people/${id}`, label: name }, { label: "Edit" }]}
        description="Name and contact changes apply to this person everywhere they are registered." />
      <Card className="max-w-3xl">
        <MemberForm action={updateMember.bind(null, m.member_type, m.institution_id)} institutions={choices} mode="edit" initial={initial}
          showHr={can(ctx.perms, "hr.view", m.institution_id)} />
      </Card>
    </>
  );
}
