import { z } from "zod";
import { cellText, cleanNumber, mapTable, normalizeDate, MAX_IMPORT_ROWS, type Cell, type ColumnSpec } from "./spreadsheet";

// Column definitions and row preparation for spreadsheet imports. Rows are
// checked here for friendly cell-level messages, then sent to the database,
// which re-checks everything in a dry run before anything is saved.

/** errors stop a row from being imported; notes are things left blank in a row that is still imported. */
export type PreviewRow = { row: number; cells: string[]; errors: string[]; notes?: string[] };

export type ImportPreview = {
  columns: string[];
  rows: PreviewRow[];
  total: number;
  invalid: number;
  ignoredColumns: string[];
  /** Set after a real import. */
  saved?: boolean;
  summary?: string;
};

type Prepared<P> = { preview: Omit<ImportPreview, "invalid" | "summary" | "saved">; payload: (P & { row: number })[]; fatal?: string };

const phone = /^[0-9+()\-\s]{6,20}$/;
const email = z.string().email();

/** "Columns found: A, B, C." for error messages, so people can see what was read. */
function foundColumns(found: string[]) {
  if (found.length === 0) return "The first rows of the sheet are empty.";
  if (found.length === 1 && /[,;\t]/.test(found[0])) {
    return `Only one column was found (“${found[0].slice(0, 80)}”). Save the file as CSV (comma delimited) or .xlsx.`;
  }
  return `Columns found: ${found.slice(0, 15).join(", ")}${found.length > 15 ? ", …" : ""}.`;
}

function tooMany(n: number) {
  return n > MAX_IMPORT_ROWS ? `The sheet has ${n} rows. Import at most ${MAX_IMPORT_ROWS} at a time.` : undefined;
}

// ---------------------------------------------------------------------------
// Students
// ---------------------------------------------------------------------------
type StudentKey =
  | "first_name" | "last_name" | "full_name" | "member_code" | "registration_number" | "email" | "phone"
  | "admission_date" | "start_date" | "group" | "guardian_name" | "guardian_relationship" | "guardian_phone" | "guardian_email";

export const STUDENT_COLUMNS: ColumnSpec<StudentKey>[] = [
  { key: "full_name", label: "Student Name", aliases: ["name", "full name", "student", "student full name"] },
  { key: "first_name", label: "First Name", aliases: ["firstname", "given name"] },
  { key: "last_name", label: "Last Name", aliases: ["lastname", "surname", "family name"] },
  { key: "member_code", label: "Roll No", aliases: ["roll number", "rollno", "roll", "student id", "student code", "member code", "id"] },
  { key: "registration_number", label: "Admission No", aliases: ["admission number", "registration number", "registration no", "reg no", "enrollment no", "enrolment no", "gr no"] },
  { key: "group", label: "Class / Batch", aliases: ["class", "batch", "class batch", "class section", "group", "class name", "batch name"] },
  { key: "email", label: "Email", aliases: ["email address", "student email", "e mail"] },
  { key: "phone", label: "Phone", aliases: ["mobile", "phone number", "mobile number", "contact", "contact number", "student phone"] },
  { key: "admission_date", label: "Admission Date", aliases: ["date of admission"] },
  { key: "start_date", label: "Start Date", aliases: ["joining date", "date of joining", "joined on"] },
  { key: "guardian_name", label: "Guardian Name", aliases: ["parent name", "parent", "guardian", "father name", "fathers name", "mother name", "mothers name"] },
  { key: "guardian_relationship", label: "Relationship", aliases: ["guardian relationship", "relation", "relationship to student"] },
  { key: "guardian_phone", label: "Guardian Phone", aliases: ["parent phone", "parent mobile", "guardian mobile", "parent contact", "guardian contact", "father phone", "mother phone", "father mobile", "mother mobile"] },
  { key: "guardian_email", label: "Guardian Email", aliases: ["parent email", "father email", "mother email"] },
];

export const STUDENT_TEMPLATE = {
  headers: ["Student Name", "Roll No", "Class / Batch", "Admission No", "Admission Date", "Email", "Phone", "Guardian Name", "Relationship", "Guardian Phone", "Guardian Email"],
  example: [
    ["Aarav Sharma", "6A-01", "Grade 6 - A", "ADM-2026-001", "01/04/2026", "", "", "Neha Sharma", "Mother", "9876543210", "neha@example.com"],
    ["Diya Patel", "", "Grade 6 - A", "ADM-2026-002", "01/04/2026", "", "", "Raj Patel", "Father", "9876500000", ""],
  ],
};

export type StudentPayload = {
  first_name: string; last_name: string; member_code: string; registration_number: string; email: string; phone: string;
  admission_date: string; start_date: string; group: string;
  guardian_name: string; guardian_relationship: string; guardian_phone: string; guardian_email: string;
};

const RELATIONSHIPS: Record<string, string> = {
  mother: "mother", mom: "mother", mum: "mother", father: "father", dad: "father",
  guardian: "guardian", parent: "guardian", other: "other", grandparent: "other", grandmother: "other", grandfather: "other",
  uncle: "other", aunt: "other", sibling: "other", brother: "other", sister: "other",
};

/** Sheet Roll No → a usable ID ("6 A 01" → "6-A-01"), or "" when it cannot be used. */
export function cleanStudentCode(raw: string): string {
  const code = raw.trim().toUpperCase().replace(/\s+/g, "-").replace(/[^A-Z0-9/_-]/g, "").replace(/^[^A-Z0-9]+/, "").slice(0, 40);
  return /^[A-Z0-9][A-Z0-9/_-]{0,39}$/.test(code) ? code : "";
}

/** Shown in the preview until the database check returns the real generated ID. */
export const AUTO_ID_PLACEHOLDER = "Auto (STU-…)";

/**
 * Only a missing name (or a Roll No repeated in the sheet) stops a row. Any other
 * cell that cannot be used is left blank and listed as a note on the row, and
 * rows without a usable Roll No get a Student ID from the database (STU-0001…).
 */
export function prepareStudents(table: Cell[][]): Prepared<StudentPayload> {
  const t = mapTable(table, STUDENT_COLUMNS);
  const hasName = t.matched.includes("full_name") || t.matched.includes("first_name");
  const columns = ["Name", "Student ID", "Class / Batch", "Admission No", "Guardian"];
  const base = { columns, ignoredColumns: t.ignored, total: t.records.length };
  if (!hasName) return { preview: { ...base, rows: [] }, payload: [], fatal: `No name column found. Add a “Student Name” column (or “First Name” and “Last Name”). ${foundColumns(t.found)}` };
  const limit = tooMany(t.records.length);
  if (limit) return { preview: { ...base, rows: [] }, payload: [], fatal: limit };

  const rows: PreviewRow[] = [];
  const payload: (StudentPayload & { row: number })[] = [];
  const seenCodes = new Map<string, number>();
  for (const { row, cells: c, headers } of t.records) {
    const errors: string[] = [];
    const notes: string[] = [];
    /** Keep a value only if it passes; otherwise leave it blank and say so. */
    const keep = (value: string, ok: boolean, label: string) => {
      if (!value || ok) return value;
      notes.push(`${label} “${value.slice(0, 60)}” could not be used, so it was left blank`);
      return "";
    };

    let first = cellText(c.first_name);
    let last = cellText(c.last_name);
    if (!first && c.full_name !== undefined) {
      const parts = cellText(c.full_name).split(/\s+/).filter(Boolean);
      first = parts.shift() ?? "";
      last = last || parts.join(" ");
    }
    if (!first) errors.push("Name is missing");
    if (first.length > 100 || last.length > 100) errors.push("Name is too long");

    const rawCode = cellText(c.member_code);
    const code = cleanStudentCode(rawCode);
    if (rawCode && !code) notes.push(`Roll No “${rawCode.slice(0, 40)}” could not be used, so a Student ID will be generated`);
    if (code && seenCodes.has(code)) errors.push(`Roll No ${code} is repeated (also on row ${seenCodes.get(code)})`);
    else if (code) seenCodes.set(code, row);

    const mail = keep(cellText(c.email).toLowerCase(), email.safeParse(cellText(c.email).toLowerCase()).success, "Email");
    const tel = keep(cellText(c.phone), phone.test(cellText(c.phone)), "Phone");

    const date = (v: Cell, label: string) => {
      const d = normalizeDate(v);
      if (d === null) { notes.push(`${label} “${cellText(v).slice(0, 30)}” is not a date (use DD/MM/YYYY), so it was left blank`); return ""; }
      return d;
    };
    const admission = date(c.admission_date, "Admission Date");
    const start = date(c.start_date, "Start Date");

    let gName = cellText(c.guardian_name);
    const relText = cellText(c.guardian_relationship).toLowerCase();
    let rel = RELATIONSHIPS[relText] ?? "";
    if (relText && !rel && gName) notes.push(`Relationship “${cellText(c.guardian_relationship)}” is not Mother, Father, Guardian or Other, so Guardian was used`);
    if (!rel && gName) rel = /father/.test(headers.guardian_name ?? "") ? "father" : /mother/.test(headers.guardian_name ?? "") ? "mother" : "guardian";
    let gPhone = keep(cellText(c.guardian_phone), phone.test(cellText(c.guardian_phone)), "Guardian Phone");
    let gMail = keep(cellText(c.guardian_email).toLowerCase(), email.safeParse(cellText(c.guardian_email).toLowerCase()).success, "Guardian Email");
    if (!gName && (gPhone || gMail)) {
      notes.push("Guardian phone / email was left out because there is no Guardian Name");
      gPhone = ""; gMail = "";
    }
    if (gName.length > 200) { notes.push("Guardian Name is too long, so the guardian was left out"); gName = ""; gPhone = ""; gMail = ""; }

    const group = cellText(c.group);
    rows.push({
      row,
      cells: [[first, last].filter(Boolean).join(" "), code || AUTO_ID_PLACEHOLDER, group || "—", cellText(c.registration_number) || "—",
        gName ? `${gName}${rel ? ` (${rel})` : ""}` : "—"],
      errors,
      notes,
    });
    payload.push({
      row, first_name: first, last_name: last, member_code: code, registration_number: cellText(c.registration_number).slice(0, 40),
      email: mail, phone: tel, admission_date: admission, start_date: start, group,
      guardian_name: gName, guardian_relationship: gName ? rel : "", guardian_phone: gPhone, guardian_email: gMail,
    });
  }
  return { preview: { ...base, rows }, payload };
}

// ---------------------------------------------------------------------------
// Inventory
// ---------------------------------------------------------------------------
type InventoryKey =
  | "sku" | "name" | "kind" | "category" | "unit" | "unit_cost" | "reorder_level" | "storage_location"
  | "manufacturer" | "description" | "quantity" | "components";

export const INVENTORY_COLUMNS: ColumnSpec<InventoryKey>[] = [
  { key: "sku", label: "SKU", aliases: [
    "sku code", "sku no", "sku number", "sku id", "item code", "item id", "item no", "item number", "code", "product code",
    "product id", "product sku", "part number", "part no", "part code", "part id", "component code", "component id",
    "stock code", "model", "model no", "model number", "article no", "article number",
  ] },
  { key: "name", label: "Name", aliases: [
    "item name", "item", "items", "product", "product name", "component", "component name", "components name",
    "part name", "kit name", "material", "material name", "title", "particulars",
  ] },
  { key: "kind", label: "Type", aliases: ["kind", "item type"] },
  { key: "category", label: "Category", aliases: ["group", "item category"] },
  { key: "quantity", label: "Quantity", aliases: ["qty", "quantity to add", "qty to add", "opening stock", "received", "add stock"] },
  { key: "unit", label: "Unit", aliases: ["uom", "units", "unit of measure"] },
  { key: "unit_cost", label: "Unit Cost", aliases: ["cost", "price", "unit price", "rate", "cost per unit"] },
  { key: "reorder_level", label: "Reorder Level", aliases: ["reorder", "reorder point", "min stock", "minimum stock", "min qty"] },
  { key: "storage_location", label: "Location", aliases: ["storage location", "shelf", "bin", "rack", "storage"] },
  { key: "manufacturer", label: "Brand", aliases: ["manufacturer", "make"] },
  { key: "description", label: "Description", aliases: ["specs", "specification", "specifications", "details"] },
  { key: "components", label: "Kit Components", aliases: ["components", "contents", "kit contents", "bom", "bill of materials"] },
];

export const INVENTORY_TEMPLATE = {
  headers: ["SKU", "Name", "Type", "Category", "Quantity", "Unit", "Unit Cost", "Reorder Level", "Location", "Brand", "Description", "Kit Components"],
  example: [
    ["MCU-UNO", "Arduino Uno R3", "Component", "Microcontrollers", "40", "pcs", "450", "10", "Shelf A1", "Arduino", "ATmega328P board", ""],
    ["SEN-HCSR04", "Ultrasonic sensor HC-SR04", "Component", "Sensors", "60", "pcs", "65", "15", "Shelf B2", "", "", ""],
    ["KIT-STARTER", "Starter Robotics Kit", "Kit", "Kits", "", "set", "", "5", "Rack K", "", "", "MCU-UNO x1; SEN-HCSR04 x2"],
  ],
};

export type InventoryPayload = {
  sku: string; name: string; kind: string; category: string; unit: string; unit_cost: string; reorder_level: string;
  storage_location: string; manufacturer: string; description: string; quantity: string;
  components: { sku: string; quantity: number }[];
};

const KINDS: Record<string, "component" | "kit"> = {
  component: "component", components: "component", part: "component", parts: "component", item: "component",
  kit: "kit", kits: "kit", set: "kit", bundle: "kit",
};

/** "MCU-UNO x1; SEN-HCSR04 x2" → [{ sku, quantity }]. Also accepts "2 x SKU", "SKU*2", "SKU:2" or a bare SKU. */
export function parseComponents(text: string): { items: { sku: string; quantity: number }[]; error?: string } {
  const items: { sku: string; quantity: number }[] = [];
  for (const raw of text.split(/[;\n,]+/).map((s) => s.trim()).filter(Boolean)) {
    let m = /^(.+?)\s*[x×*:]\s*(\d+)$/i.exec(raw);
    let sku: string, qty: number;
    if (m) [sku, qty] = [m[1], Number(m[2])];
    else if ((m = /^(\d+)\s*[x×*]\s*(.+)$/i.exec(raw))) [sku, qty] = [m[2], Number(m[1])];
    else [sku, qty] = [raw, 1];
    sku = sku.trim().toUpperCase();
    if (!/^[A-Z0-9][A-Z0-9._-]{1,39}$/.test(sku) || qty < 1 || qty > 100_000) return { items, error: `Kit component “${raw}” is not in the form SKU x quantity` };
    items.push({ sku, quantity: qty });
  }
  return { items };
}

/**
 * SKU made from an item name when the sheet has none ("Arduino Uno R3" → "ARDUINO-UNO-R3").
 * The same name always gives the same SKU, so re-importing updates the item.
 */
export function skuFromName(name: string): string {
  const base = name.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40).replace(/-+$/, "");
  return base.length >= 2 ? base : "";
}

export function prepareInventory(table: Cell[][]): Prepared<InventoryPayload> {
  const t = mapTable(table, INVENTORY_COLUMNS);
  const columns = ["SKU", "Name", "Type", "Category", "Qty to add", "Kit contents"];
  const base = { columns, ignoredColumns: t.ignored, total: t.records.length };
  if (!t.matched.includes("sku") && !t.matched.includes("name")) {
    return { preview: { ...base, rows: [] }, payload: [], fatal: `No “SKU” or “Name” column found. ${foundColumns(t.found)}` };
  }
  const limit = tooMany(t.records.length);
  if (limit) return { preview: { ...base, rows: [] }, payload: [], fatal: limit };

  const rows: PreviewRow[] = [];
  const payload: (InventoryPayload & { row: number })[] = [];
  const seen = new Map<string, number>();
  for (const { row, cells: c } of t.records) {
    const errors: string[] = [];
    let sku = cellText(c.sku).toUpperCase();
    const autoSku = !sku && Boolean(cellText(c.name));
    if (autoSku) sku = skuFromName(cellText(c.name));
    if (!sku) errors.push(t.matched.includes("sku") ? "SKU is missing" : "Name is missing");
    else if (!/^[A-Z0-9][A-Z0-9._-]{1,39}$/.test(sku)) errors.push("SKU must be 2–40 letters, numbers, . _ -");
    else if (seen.has(sku)) errors.push(`SKU ${sku} is repeated (also on row ${seen.get(sku)})`);
    else seen.set(sku, row);

    const name = cellText(c.name);
    if (name && (name.length < 2 || name.length > 200)) errors.push("Name must be 2–200 characters");
    const kindText = cellText(c.kind).toLowerCase();
    const kind = kindText ? KINDS[kindText] : "";
    if (kindText && !kind) errors.push("Type must be Component or Kit");

    const num = (v: Cell, label: string, opts: { int?: boolean; max: number }) => {
      const s = cleanNumber(v);
      if (!s) return "";
      const n = Number(s);
      if (!Number.isFinite(n) || n < 0 || n > opts.max || (opts.int && !Number.isInteger(n))) {
        errors.push(`${label} must be ${opts.int ? "a whole number" : "a number"} from 0 to ${opts.max.toLocaleString("en-IN")}`);
        return "";
      }
      return String(n);
    };
    const quantity = num(c.quantity, "Quantity", { int: true, max: 1_000_000 });
    const unitCost = num(c.unit_cost, "Unit Cost", { max: 10_000_000 });
    const reorder = num(c.reorder_level, "Reorder Level", { int: true, max: 1_000_000 });

    const comps = parseComponents(cellText(c.components));
    if (comps.error) errors.push(comps.error);
    if (comps.items.length && kind === "component") errors.push("Only kits can have Kit Components");
    if (comps.items.some((i) => i.sku === sku)) errors.push("A kit cannot contain itself");

    const text = (v: Cell, max: number, label: string) => {
      const s = cellText(v);
      if (s.length > max) errors.push(`${label} is longer than ${max} characters`);
      return s;
    };
    const p: InventoryPayload = {
      sku, name, kind: kind || (comps.items.length ? "kit" : ""), category: text(c.category, 80, "Category"), unit: text(c.unit, 20, "Unit"),
      unit_cost: unitCost, reorder_level: reorder, storage_location: text(c.storage_location, 120, "Location"),
      manufacturer: text(c.manufacturer, 120, "Brand"), description: text(c.description, 2000, "Description"),
      quantity, components: comps.items,
    };
    rows.push({
      row,
      cells: [sku ? (autoSku ? `${sku} (auto)` : sku) : "—", name || "(keep existing)", p.kind ? (p.kind === "kit" ? "Kit" : "Component") : "—", p.category || "—", quantity || "—",
        comps.items.map((i) => `${i.sku} ×${i.quantity}`).join(", ") || "—"],
      errors,
    });
    payload.push({ row, ...p });
  }
  return { preview: { ...base, rows }, payload };
}

type RowMessage = { row: number; message: string };

function byRow(list: RowMessage[]) {
  const m = new Map<number, string[]>();
  for (const e of list) m.set(e.row, [...(m.get(e.row) ?? []), e.message]);
  return m;
}

/** Merge database errors and notes (by spreadsheet row) into the preview. */
export function withDbErrors(preview: Omit<ImportPreview, "invalid">, dbErrors: RowMessage[], dbNotes: RowMessage[] = []): ImportPreview {
  const errs = byRow(dbErrors);
  const notes = byRow(dbNotes);
  const rows = preview.rows.map((r) => ({
    ...r,
    errors: [...r.errors, ...(errs.get(r.row) ?? [])],
    notes: [...(r.notes ?? []), ...(notes.get(r.row) ?? [])],
  }));
  return { ...preview, rows, invalid: rows.filter((r) => r.errors.length).length };
}
