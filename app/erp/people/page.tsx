import Link from "next/link";
import { BULK_FORM_ID, BulkDeleteStudents, SelectAllStudents } from "./DeleteStudents";
import { can, canAny, db, getCategory, requirePagePermission } from "@/lib/erp/context";
import { institutionOptions } from "@/lib/erp/queries";
import { str } from "@/lib/erp/format";
import { CATEGORY_LABELS, MEMBER_TYPE_LABELS, type InstitutionType, type MemberType } from "@/lib/erp/types";
import { Card, EmptyState, LinkButton, Notice, PageHeader, Pagination, StatusBadge, Table, TypeBadge, buttonClass, cx, focusRing, inputClass, td, th } from "../_components/ui";

export const metadata = { title: "People" };

type Row = {
  membership_id: string; institution_id: string; institution_name: string; institution_type: InstitutionType;
  member_type: MemberType; member_code: string; full_name: string; email: string | null; phone: string | null;
  status: string; groups: string | null; total_count: number;
};

const PAGE_SIZE = 50;

export default async function PeoplePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const kind = str(sp.type) === "staff" ? "staff" : "students";
  const ctx = await requirePagePermission(kind === "students" ? ["students.view", "students.view_assigned"] : ["staff.view"]);
  const category = await getCategory();
  const q = (str(sp.q) ?? "").slice(0, 100);
  const status = ["active", "inactive", "graduated", "left"].includes(str(sp.status) ?? "") ? str(sp.status)! : "active";
  const institution = /^[0-9a-f-]{36}$/i.test(str(sp.institution) ?? "") ? str(sp.institution)! : null;
  const page = Math.max(1, Math.min(1000, Number(str(sp.page)) || 1));
  const staffType = MEMBER_TYPES_STAFF.includes(str(sp.member) as MemberType) ? (str(sp.member) as MemberType) : null;

  const supabase = await db();
  const [{ data, error }, options] = await Promise.all([
    supabase.rpc("erp_search_members", {
      p_category: category,
      p_institution: institution,
      p_types: kind === "students" ? ["student"] : staffType ? [staffType] : MEMBER_TYPES_STAFF,
      p_status: status,
      p_query: q || null,
      p_limit: PAGE_SIZE,
      p_offset: (page - 1) * PAGE_SIZE,
    }),
    institutionOptions(category, kind === "staff"),
  ]);
  const rows = (data ?? []) as Row[];
  const total = rows[0]?.total_count ?? 0;
  const managePerm = kind === "students" ? "students.manage" : "staff.manage";
  const canAdd = options.some((o) => can(ctx.perms, managePerm, o.id));
  const title = kind === "students" ? "Students" : "Teachers, Instructors & Staff";
  // Students can be deleted (in bulk) where the user manages them.
  const canDelete = kind === "students" && canAdd;
  const deletedCount = Number(str(sp.deleted)) || 0;

  const qs = (over: Record<string, string | number | null>) => {
    const p = new URLSearchParams({ type: kind, ...(q && { q }), status, ...(institution && { institution }), ...(staffType && { member: staffType }) });
    for (const [k, v] of Object.entries(over)) {
      if (v === null) p.delete(k);
      else p.set(k, String(v));
    }
    return `/erp/people?${p}`;
  };

  return (
    <>
      <PageHeader
        title={title}
        description={`${CATEGORY_LABELS[category]} · ${total} ${status} record${total === 1 ? "" : "s"}`}
        crumbs={[{ href: "/erp", label: "Dashboard" }, { label: title }]}
        actions={canAdd ? (
          <>
            {kind === "students" && (
              <LinkButton variant="secondary" href={`/erp/people/import${institution ? `?institution=${institution}` : ""}`}>
                Import from Excel / Sheets
              </LinkButton>
            )}
            <LinkButton href={`/erp/people/new?type=${kind === "students" ? "student" : "staff"}${institution ? `&institution=${institution}` : ""}`}>
              Add {kind === "students" ? "student" : "staff member"}
            </LinkButton>
          </>
        ) : undefined}
      />
      {deletedCount > 0 && (
        <div className="mb-4"><Notice tone="success">Deleted {deletedCount} student{deletedCount === 1 ? "" : "s"}.</Notice></div>
      )}
      <Card>
        <form className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5" role="search">
          <input type="hidden" name="type" value={kind} />
          <div className="lg:col-span-2">
            <label htmlFor="q" className="sr-only">Search</label>
            <input id="q" name="q" defaultValue={q} placeholder="Search name, ID or email" className={inputClass} />
          </div>
          <div>
            <label htmlFor="institution" className="sr-only">Institution</label>
            <select id="institution" name="institution" defaultValue={institution ?? ""} className={inputClass}>
              <option value="">All institutions</option>
              {options.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          </div>
          {kind === "staff" ? (
            <div>
              <label htmlFor="member" className="sr-only">Person type</label>
              <select id="member" name="member" defaultValue={staffType ?? ""} className={inputClass}>
                <option value="">All staff types</option>
                {MEMBER_TYPES_STAFF.map((t) => <option key={t} value={t}>{MEMBER_TYPE_LABELS[t]}</option>)}
              </select>
            </div>
          ) : null}
          <div className="flex gap-2">
            <label htmlFor="status" className="sr-only">Status</label>
            <select id="status" name="status" defaultValue={status} className={inputClass}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="graduated">Graduated</option>
              <option value="left">Left</option>
            </select>
            <button className={buttonClass("secondary")}>Filter</button>
          </div>
        </form>

        {error ? (
          <EmptyState title="People could not be loaded">Please refresh the page.</EmptyState>
        ) : rows.length === 0 ? (
          <EmptyState title="No people match these filters">
            {canAny(ctx.perms, ["students.view_assigned"]) && !can(ctx.perms, "students.view")
              ? "You can see students in the classes and batches assigned to you."
              : undefined}
          </EmptyState>
        ) : (
          <>
            {canDelete && <BulkDeleteStudents />}
            <Table caption={title}>
              <thead>
                <tr>
                  {canDelete && <th className={cx(th, "w-8")}><SelectAllStudents /></th>}
                  <th className={th}>Name</th>
                  <th className={th}>ID</th>
                  {kind === "staff" && <th className={th}>Type</th>}
                  <th className={th}>Institution</th>
                  <th className={th}>{kind === "students" ? "Class / batch" : "Assigned to"}</th>
                  <th className={th}>Status</th>
                  <th className={th}><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.membership_id} className="hover:bg-zinc-800/40">
                    {canDelete && (
                      <td className={cx(td, "w-8")}>
                        {can(ctx.perms, managePerm, r.institution_id) && (
                          <input type="checkbox" name="membership_ids" value={r.membership_id} form={BULK_FORM_ID}
                            aria-label={`Select ${r.full_name}`} className="h-4 w-4 accent-brand-500" />
                        )}
                      </td>
                    )}
                    <td className={td}>
                      <Link href={`/erp/people/${r.membership_id}`} className={cx("font-medium hover:underline", focusRing)}>{r.full_name}</Link>
                      {r.email && <p className="text-xs text-zinc-500">{r.email}</p>}
                    </td>
                    <td className={cx(td, "font-mono text-xs")}>{r.member_code}</td>
                    {kind === "staff" && <td className={td}>{MEMBER_TYPE_LABELS[r.member_type]}</td>}
                    <td className={td}>
                      <span className="mr-2">{r.institution_name}</span>
                      {category === "all" && <TypeBadge type={r.institution_type} />}
                    </td>
                    <td className={cx(td, "max-w-[16rem] truncate")}>{r.groups ?? "—"}</td>
                    <td className={td}><StatusBadge status={r.status} /></td>
                    <td className={cx(td, "text-right")}>
                      {can(ctx.perms, managePerm, r.institution_id) && (
                        <Link href={`/erp/people/${r.membership_id}/edit`} aria-label={`Edit ${r.full_name}`}
                          className={cx("rounded-lg px-2 py-1 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-white", focusRing)}>
                          Edit
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
            <Pagination page={page} pageSize={PAGE_SIZE} total={total} hrefFor={(p) => qs({ page: p })} />
          </>
        )}
      </Card>
    </>
  );
}

const MEMBER_TYPES_STAFF: MemberType[] = ["teacher", "instructor", "staff", "employee"];
