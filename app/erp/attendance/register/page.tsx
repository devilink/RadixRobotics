import Link from "next/link";
import { can, db, getCategory, requirePagePermission } from "@/lib/erp/context";
import { institutionOptions } from "@/lib/erp/queries";
import { formatDate, str, todayIn } from "@/lib/erp/format";
import { MARK_PERMS } from "@/lib/erp/permissions";
import type { InstitutionType } from "@/lib/erp/types";
import { Card, EmptyState, PageHeader, StatusBadge, Table, TypeBadge, buttonClass, cx, focusRing, inputClass, td, th } from "../../_components/ui";
import { RegisterPicker, type PickerInstitution } from "./RegisterPicker";

export const metadata = { title: "Daily Register" };

export default async function RegisterIndexPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const ctx = await requirePagePermission(MARK_PERMS);
  const category = await getCategory();
  const sp = await searchParams;
  const supabase = await db();
  const options = await institutionOptions(category);

  // Groups the user may take attendance for: all groups with attendance.mark, else only assigned ones.
  const { data: groups } = await supabase.from("learning_groups").select("id, name, institution_id").eq("status", "active").order("name");
  let myGroups = new Set<string>();
  if (ctx.personId) {
    const { data } = await supabase.from("group_assignments").select("group_id, institution_memberships!inner(person_id)")
      .eq("institution_memberships.person_id", ctx.personId);
    myGroups = new Set((data ?? []).map((r) => r.group_id as string));
  }

  const institutions: PickerInstitution[] = options
    .map((o) => {
      const canAll = can(ctx.perms, "attendance.mark", o.id);
      const canAssigned = can(ctx.perms, "attendance.mark_assigned", o.id);
      const gs = (groups ?? []).filter((g) => g.institution_id === o.id && (canAll || (canAssigned && myGroups.has(g.id))));
      return {
        id: o.id, name: o.name, type: o.institution_type, today: todayIn(o.timezone),
        canStudent: (canAll || canAssigned) && o.institution_type !== "head_office",
        canStaff: can(ctx.perms, "staff_attendance.mark", o.id),
        groups: gs.map((g) => ({ id: g.id, name: g.name })),
      };
    })
    .filter((i) => i.canStudent || i.canStaff);

  const date = /^\d{4}-\d{2}-\d{2}$/.test(str(sp.date) ?? "") ? str(sp.date)! : todayIn();
  let sq = supabase
    .from("attendance_sessions")
    .select("id, kind, period_label, status, session_date, institution_id, institutions!inner(name, institution_type), learning_groups(name), attendance_records(count)")
    .eq("session_date", date)
    .order("created_at", { ascending: false })
    .limit(200);
  if (category !== "all") sq = sq.eq("institutions.institution_type", category);
  const { data: sessions } = await sq;
  type S = { id: string; kind: string; period_label: string; status: string; institutions: { name: string; institution_type: InstitutionType };
    learning_groups: { name: string } | null; attendance_records: { count: number }[] };

  return (
    <>
      <PageHeader
        title="Daily Register"
        description="Open a register for a class, batch or staff roster. Opening the same register twice returns the existing one."
        crumbs={[{ href: "/erp/attendance", label: "Attendance" }, { label: "Daily Register" }]}
      />
      <Card title="Open a register">
        {institutions.length === 0 ? (
          <EmptyState title="Nothing to mark here">
            No institutions in this category where you can take attendance. Teachers need to be assigned to a class or batch first.
          </EmptyState>
        ) : (
          <RegisterPicker institutions={institutions} defaults={{ institution: str(sp.institution), group: str(sp.group), date: str(sp.date), kind: str(sp.kind) }} />
        )}
      </Card>

      <Card className="mt-6" title={`Registers on ${formatDate(date)}`}
        actions={
          <form className="flex items-center gap-2">
            <label htmlFor="list-date" className="sr-only">Date</label>
            <input id="list-date" type="date" name="date" defaultValue={date} className={cx(inputClass, "w-auto py-1.5")} />
            <button className={buttonClass("secondary", "sm")}>Show</button>
          </form>
        }>
        {(sessions ?? []).length === 0 ? (
          <EmptyState title="No registers opened for this date" />
        ) : (
          <Table caption="Registers">
            <thead>
              <tr>
                <th className={th}>Register</th>
                <th className={th}>Institution</th>
                <th className={cx(th, "text-right")}>Marked</th>
                <th className={th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {((sessions ?? []) as unknown as S[]).map((s) => (
                <tr key={s.id} className="hover:bg-zinc-800/40">
                  <td className={td}>
                    <Link href={`/erp/attendance/register/${s.id}`} className={cx("font-medium hover:underline", focusRing)}>
                      {s.kind === "staff" ? "Teachers & staff" : s.learning_groups?.name}
                      {s.period_label ? ` · ${s.period_label}` : ""}
                    </Link>
                  </td>
                  <td className={td}><span className="mr-2">{s.institutions.name}</span>{category === "all" && <TypeBadge type={s.institutions.institution_type} />}</td>
                  <td className={cx(td, "text-right tabular-nums")}>{s.attendance_records?.[0]?.count ?? 0}</td>
                  <td className={td}><StatusBadge status={s.status} /></td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </>
  );
}
