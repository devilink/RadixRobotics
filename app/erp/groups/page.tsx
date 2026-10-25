import Link from "next/link";
import { can, db, getCategory, requirePagePermission } from "@/lib/erp/context";
import { institutionOptions } from "@/lib/erp/queries";
import { str } from "@/lib/erp/format";
import type { InstitutionType } from "@/lib/erp/types";
import { Card, EmptyState, LinkButton, PageHeader, Table, TypeBadge, buttonClass, cx, focusRing, inputClass, td, th } from "../_components/ui";

export const metadata = { title: "Classes & Batches" };

type Row = {
  id: string; name: string; group_type: string; academic_year: string | null; grade: string | null; section: string | null;
  institution_id: string; institutions: { name: string; institution_type: InstitutionType } | null;
  enrollments: { count: number }[]; group_assignments: { count: number }[];
};

export default async function GroupsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const ctx = await requirePagePermission(["groups.view"]);
  const category = await getCategory();
  const sp = await searchParams;
  const institution = str(sp.institution);
  const options = await institutionOptions(category, false);

  const supabase = await db();
  let q = supabase
    .from("learning_groups")
    .select("id, name, group_type, academic_year, grade, section, institution_id, institutions!inner(name, institution_type), enrollments(count), group_assignments(count)")
    .eq("status", "active")
    .is("enrollments.end_date", null)
    .order("name")
    .limit(500);
  if (category !== "all") q = q.eq("institutions.institution_type", category);
  if (institution && /^[0-9a-f-]{36}$/i.test(institution)) q = q.eq("institution_id", institution);
  const { data, error } = await q;
  const rows = (data ?? []) as unknown as Row[];
  const manageable = options.filter((o) => can(ctx.perms, "groups.manage", o.id));
  const title = category === "school" ? "Classes & Sections" : category === "learning_center" ? "Batches & Sessions" : "Classes & Batches";

  return (
    <>
      <PageHeader
        title={title}
        description="Schools organise students into class sections; learning centres into batches. Both share enrolment and attendance."
        crumbs={[{ href: "/erp", label: "Dashboard" }, { label: title }]}
        actions={manageable.length ? <LinkButton href={`/erp/groups/new${institution ? `?institution=${institution}` : ""}`}>New class or batch</LinkButton> : undefined}
      />
      <Card>
        <form className="mb-4 flex flex-col gap-2 sm:flex-row">
          <label htmlFor="institution" className="sr-only">Institution</label>
          <select id="institution" name="institution" defaultValue={institution ?? ""} className={cx(inputClass, "sm:max-w-sm")}>
            <option value="">All institutions</option>
            {options.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
          <button className={buttonClass("secondary")}>Filter</button>
        </form>
        {error ? (
          <EmptyState title="Classes could not be loaded">Please refresh the page.</EmptyState>
        ) : rows.length === 0 ? (
          <EmptyState title="No classes or batches yet" />
        ) : (
          <Table caption="Classes and batches">
            <thead>
              <tr>
                <th className={th}>Name</th>
                <th className={th}>Institution</th>
                <th className={th}>Year</th>
                <th className={cx(th, "text-right")}>Students</th>
                <th className={cx(th, "text-right")}>Teachers</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-zinc-800/40">
                  <td className={td}>
                    <Link href={`/erp/groups/${r.id}`} className={cx("font-medium hover:underline", focusRing)}>{r.name}</Link>
                    <p className="text-xs text-zinc-500">{r.group_type === "batch" ? "Batch" : "Class section"}</p>
                  </td>
                  <td className={td}>
                    <span className="mr-2">{r.institutions?.name}</span>
                    {category === "all" && r.institutions && <TypeBadge type={r.institutions.institution_type} />}
                  </td>
                  <td className={td}>{r.academic_year ?? "—"}</td>
                  <td className={cx(td, "text-right tabular-nums")}>{r.enrollments?.[0]?.count ?? 0}</td>
                  <td className={cx(td, "text-right tabular-nums")}>{r.group_assignments?.[0]?.count ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </>
  );
}
