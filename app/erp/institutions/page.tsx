import Link from "next/link";
import { db, getCategory, requirePagePermission } from "@/lib/erp/context";
import { CATEGORY_LABELS, type InstitutionType } from "@/lib/erp/types";
import { str } from "@/lib/erp/format";
import { Card, EmptyState, LinkButton, PageHeader, StatusBadge, Table, TypeBadge, buttonClass, cx, focusRing, inputClass, td, th } from "../_components/ui";

export const metadata = { title: "Institutions" };

type Row = {
  id: string; code: string; name: string; institution_type: InstitutionType; status: string;
  city: string | null; state: string | null; students: number; staff: number; groups: number;
};

export default async function InstitutionsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const ctx = await requirePagePermission(["institutions.view"]);
  const category = await getCategory();
  const sp = await searchParams;
  const q = str(sp.q)?.slice(0, 100) ?? "";
  const status = ["active", "inactive", "archived"].includes(str(sp.status) ?? "") ? str(sp.status)! : "active";

  const supabase = await db();
  const { data, error } = await supabase.rpc("erp_institution_list", { p_category: category, p_query: q || null, p_status: status });
  const rows = (data ?? []) as Row[];
  const canCreate = ctx.perms.platform.has("institutions.manage");

  return (
    <>
      <PageHeader
        title={category === "school" ? "Schools" : category === "learning_center" ? "Radix Learning Centers" : "All Institutions"}
        description={`Showing ${CATEGORY_LABELS[category]}. Switch category in the top bar.`}
        crumbs={[{ href: "/erp", label: "Dashboard" }, { label: "Institutions" }]}
        actions={canCreate ? <LinkButton href="/erp/institutions/new">New institution</LinkButton> : undefined}
      />
      <Card>
        <form className="mb-4 flex flex-col gap-2 sm:flex-row" role="search">
          <label htmlFor="q" className="sr-only">Search institutions</label>
          <input id="q" name="q" defaultValue={q} placeholder="Search name, code or city" className={cx(inputClass, "sm:max-w-xs")} />
          <label htmlFor="status" className="sr-only">Status</label>
          <select id="status" name="status" defaultValue={status} className={cx(inputClass, "sm:w-40")}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="archived">Archived</option>
          </select>
          <button className={buttonClass("secondary")}>Filter</button>
        </form>
        {error ? (
          <EmptyState title="Institutions could not be loaded">Please refresh the page.</EmptyState>
        ) : rows.length === 0 ? (
          <EmptyState title="No institutions match these filters">
            {canCreate ? "Create one to get started." : "Ask an administrator to assign you to an institution."}
          </EmptyState>
        ) : (
          <Table caption="Institutions">
            <thead>
              <tr>
                <th className={th}>Institution</th>
                <th className={th}>Type</th>
                <th className={th}>Location</th>
                <th className={cx(th, "text-right")}>Students</th>
                <th className={cx(th, "text-right")}>Staff</th>
                <th className={cx(th, "text-right")}>Classes / batches</th>
                <th className={th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-zinc-800/40">
                  <td className={td}>
                    <Link href={`/erp/institutions/${r.id}`} className={cx("font-medium text-zinc-100 hover:underline", focusRing)}>{r.name}</Link>
                    <p className="font-mono text-xs text-zinc-500">{r.code}</p>
                  </td>
                  <td className={td}><TypeBadge type={r.institution_type} /></td>
                  <td className={td}>{[r.city, r.state].filter(Boolean).join(", ") || "—"}</td>
                  <td className={cx(td, "text-right tabular-nums")}>{r.students}</td>
                  <td className={cx(td, "text-right tabular-nums")}>{r.staff}</td>
                  <td className={cx(td, "text-right tabular-nums")}>{r.groups}</td>
                  <td className={td}><StatusBadge status={r.status} /></td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </>
  );
}
