import { requirePagePermission } from "@/lib/erp/context";
import { str } from "@/lib/erp/format";
import { STUDENT_TEMPLATE } from "@/lib/erp/imports";
import { Card, EmptyState, Field, PageHeader, inputClass } from "../../_components/ui";
import { SpreadsheetImport } from "../../_components/SpreadsheetImport";
import { memberInstitutionChoices } from "../choices";
import { importStudents } from "./actions";

export const metadata = { title: "Import students" };

const FORCE_HELP = [
  "Force upload saves EVERY row of the sheet, including rows marked with problems:",
  "",
  "• A row with no name is saved as “Unnamed student (row N)”.",
  "• A repeated Roll No, or one already used by another student, gets a new Student ID.",
  "• Values that cannot go in their field (bad email, phone or date) and columns the ERP does not use are saved in each student's notes.",
  "",
  "If this sheet was uploaded before, its students will be added again as duplicates. Continue?",
].join("\n");

const GUIDE: [string, string][] = [
  ["Student Name", "Required. Or use separate “First Name” and “Last Name” columns. The only column a row cannot do without."],
  ["Roll No / Student ID", "Optional. Left blank (or no such column), a Student ID is generated automatically: STU-0001, STU-0002, … for this institution."],
  ["Class / Batch", "Optional. Should match a class or batch name in the ERP, e.g. “Grade 6 - A”, to enrol the student. If none matches, the student is still added, without a class."],
  ["Admission No, Admission Date", "Optional. Dates as DD/MM/YYYY or real Excel dates."],
  ["Email, Phone", "Optional."],
  ["Guardian Name, Relationship, Guardian Phone, Guardian Email", "Optional. Relationship is Mother, Father, Guardian or Other."],
];

export default async function ImportStudentsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const ctx = await requirePagePermission(["students.manage"]);
  const sp = await searchParams;
  const choices = (await memberInstitutionChoices(ctx)).filter((i) => i.canStudents);
  const preset = str(sp.institution);

  return (
    <>
      <PageHeader
        title="Import students"
        description="Add many students at once from an Excel file, a CSV or a Google Sheet. Step 1 checks the sheet; nothing is saved until step 2, Upload."
        crumbs={[{ href: "/erp/people?type=students", label: "Students" }, { label: "Import" }]}
      />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <Card>
          {choices.length === 0 ? (
            <EmptyState title="No institutions available">You need permission to manage students at a school or learning centre.</EmptyState>
          ) : (
            <SpreadsheetImport action={importStudents} noun="students"
              template={{ ...STUDENT_TEMPLATE, filename: "radix-students-template.csv" }}
              forceHelp={FORCE_HELP}>
              <Field label="Add students to" htmlFor="imp-inst" required>
                <select id="imp-inst" name="institution_id" defaultValue={choices.some((c) => c.id === preset) ? preset : choices[0].id} className={inputClass}>
                  {choices.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </Field>
            </SpreadsheetImport>
          )}
        </Card>
        <Card title="Sheet columns">
          <p className="mb-3 text-xs text-zinc-400">Put column names in the first row. Names are matched loosely (“Roll Number”, “Mobile”, “Parent Name” also work); other columns are ignored.</p>
          <dl className="space-y-3 text-sm">
            {GUIDE.map(([k, v]) => (
              <div key={k}><dt className="font-medium text-zinc-100">{k}</dt><dd className="text-xs text-zinc-400">{v}</dd></div>
            ))}
          </dl>
          <p className="mt-4 text-xs text-zinc-500"><strong className="text-zinc-300">Force upload</strong> saves every row, even ones with problems, and keeps anything that does not fit in the student&apos;s notes.</p>
          <p className="mt-2 text-xs text-zinc-500">Empty cells are fine. A cell that cannot be read (for example a wrong email or date) is left blank and noted on its row. Rows without a name are skipped.</p>
        </Card>
      </div>
    </>
  );
}
