import { requirePagePermission } from "@/lib/erp/context";
import { str } from "@/lib/erp/format";
import { Card, EmptyState, PageHeader } from "../../_components/ui";
import { MemberForm } from "../MemberForm";
import { memberInstitutionChoices } from "../choices";
import { createMember } from "../actions";

export const metadata = { title: "Add person" };

export default async function NewMemberPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const kind = str(sp.type) === "student" ? "student" : "staff";
  const ctx = await requirePagePermission(kind === "student" ? ["students.manage"] : ["staff.manage"]);
  const choices = (await memberInstitutionChoices(ctx)).filter((i) => (kind === "student" ? i.canStudents : i.canStaff));
  const listHref = `/erp/people?type=${kind === "student" ? "students" : "staff"}`;
  return (
    <>
      <PageHeader
        title={kind === "student" ? "Add student" : "Add teacher, instructor or staff"}
        description="Collect only what is needed to run classes and attendance. Guardian contacts are added on the student’s page."
        crumbs={[{ href: listHref, label: kind === "student" ? "Students" : "Teachers & Staff" }, { label: "Add" }]}
      />
      <Card className="max-w-3xl">
        {choices.length === 0 ? (
          <EmptyState title="No institutions available" />
        ) : (
          <MemberForm action={createMember} institutions={choices} mode="create" defaultInstitution={str(sp.institution)} defaultKind={kind} />
        )}
      </Card>
    </>
  );
}
