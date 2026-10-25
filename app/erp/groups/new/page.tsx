import { can, getCategory, requirePagePermission } from "@/lib/erp/context";
import { institutionOptions } from "@/lib/erp/queries";
import { str } from "@/lib/erp/format";
import { Card, EmptyState, PageHeader } from "../../_components/ui";
import { GroupForm } from "./GroupForm";

export const metadata = { title: "New class or batch" };

export default async function NewGroupPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const ctx = await requirePagePermission(["groups.manage"]);
  const sp = await searchParams;
  const options = (await institutionOptions(await getCategory(), false)).filter((o) => can(ctx.perms, "groups.manage", o.id));
  return (
    <>
      <PageHeader title="New class or batch" crumbs={[{ href: "/erp/groups", label: "Classes & Batches" }, { label: "New" }]} />
      <Card className="max-w-3xl">
        {options.length === 0 ? (
          <EmptyState title="No institutions available">Switch the category filter or ask for access to an institution.</EmptyState>
        ) : (
          <GroupForm institutions={options} defaultInstitution={str(sp.institution)} />
        )}
      </Card>
    </>
  );
}
