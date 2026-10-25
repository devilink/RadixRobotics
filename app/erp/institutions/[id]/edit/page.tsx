import { notFound } from "next/navigation";
import { db, requirePagePermission } from "@/lib/erp/context";
import { Card, PageHeader } from "../../../_components/ui";
import { InstitutionForm } from "../../InstitutionForm";
import { updateInstitution } from "../../actions";

export const metadata = { title: "Edit institution" };

export default async function EditInstitutionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  await requirePagePermission(["institutions.manage"], id);
  const supabase = await db();
  const { data: inst } = await supabase.from("institutions").select("*").eq("id", id).maybeSingle();
  if (!inst || inst.institution_type === "head_office") notFound();
  return (
    <>
      <PageHeader title={`Edit ${inst.name}`} crumbs={[{ href: "/erp/institutions", label: "Institutions" }, { href: `/erp/institutions/${id}`, label: inst.name }, { label: "Edit" }]} />
      <Card className="max-w-3xl">
        <InstitutionForm action={updateInstitution.bind(null, id)} initial={inst} isEdit />
      </Card>
    </>
  );
}
