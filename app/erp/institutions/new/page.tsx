import { notFound } from "next/navigation";
import { requirePagePermission } from "@/lib/erp/context";
import { Card, PageHeader } from "../../_components/ui";
import { InstitutionForm } from "../InstitutionForm";
import { createInstitution } from "../actions";

export const metadata = { title: "New institution" };

export default async function NewInstitutionPage() {
  const ctx = await requirePagePermission(["institutions.manage"]);
  if (!ctx.perms.platform.has("institutions.manage")) notFound();
  return (
    <>
      <PageHeader
        title="New institution"
        description="A primary campus is created automatically. Add classes or batches, people and staff afterwards."
        crumbs={[{ href: "/erp/institutions", label: "Institutions" }, { label: "New" }]}
      />
      <Card className="max-w-3xl">
        <InstitutionForm action={createInstitution} />
      </Card>
    </>
  );
}
