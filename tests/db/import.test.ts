import { beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { createDb, sqlState } from "./harness";
import { seedWorld, type World } from "./world";

let db: PGlite;
let w: World;

type StudentResult = {
  ok: number; enrolled: number; guardians: number; errors: { row: number; message: string }[]; saved: boolean;
  notes: { row: number; message: string }[]; codes: { row: number; code: string }[];
};
type InventoryResult = { created: number; updated: number; units_received: number; errors: { row: number; message: string }[]; saved: boolean };

const importStudents = (user: string, inst: string, rows: unknown[], dry: boolean, skip = false) =>
  w.rpc(user, "erp_import_students", { p_institution: inst, p_rows: JSON.stringify(rows), p_dry_run: dry, p_skip_invalid: skip }) as Promise<StudentResult>;
const importInventory = (user: string, rows: unknown[], dry: boolean, skip = false) =>
  w.rpc(user, "erp_inventory_import", { p_rows: JSON.stringify(rows), p_dry_run: dry, p_skip_invalid: skip }) as Promise<InventoryResult>;
const countMembers = async (inst: string) =>
  (await db.query<{ n: number }>("select count(*)::int as n from public.institution_memberships where institution_id = $1 and member_type = 'student'", [inst])).rows[0].n;

beforeAll(async () => {
  db = await createDb();
  w = await seedWorld(db);
});

describe("student import", () => {
  const rows = [
    { row: 2, first_name: "Ira", last_name: "Rao", member_code: "A-100", group: "grade 6 - a", guardian_name: "Mina Rao", guardian_relationship: "mother", guardian_phone: "9876543210" },
    { row: 3, first_name: "Kai", last_name: "Sen", member_code: "A-101" },
  ];

  it("dry run checks rows and saves nothing", async () => {
    const before = await countMembers(w.schoolA);
    const r = await importStudents(w.u.adminA, w.schoolA, rows, true);
    expect(r).toMatchObject({ ok: 2, enrolled: 1, guardians: 1, errors: [], saved: false });
    expect(await countMembers(w.schoolA)).toBe(before);
  });

  it("imports, enrols and adds guardians", async () => {
    const before = await countMembers(w.schoolA);
    const r = await importStudents(w.u.adminA, w.schoolA, rows, false);
    expect(r).toMatchObject({ ok: 2, saved: true });
    expect(await countMembers(w.schoolA)).toBe(before + 2);
    const enrolled = await db.query("select 1 from public.enrollments e join public.institution_memberships m on m.id = e.membership_id where m.member_code = 'A-100' and e.group_id = $1", [w.g6a]);
    expect(enrolled.rows).toHaveLength(1);
  });

  it("reports bad rows and imports nothing unless told to skip them", async () => {
    const bad = [
      { row: 2, first_name: "New", last_name: "One", member_code: "A-200" },
      { row: 3, first_name: "Dup", last_name: "Code", member_code: "A-100" },
      { row: 4, first_name: "Lost", last_name: "Class", member_code: "A-201", group: "Grade 12 - Z" },
    ];
    const before = await countMembers(w.schoolA);
    const r = await importStudents(w.u.adminA, w.schoolA, bad, false);
    expect(r.saved).toBe(false);
    expect(r.errors.map((e) => e.row)).toEqual([3]);
    expect(r.errors[0].message).toMatch(/already used/);
    expect(await countMembers(w.schoolA)).toBe(before);

    const skipped = await importStudents(w.u.adminA, w.schoolA, bad, false, true);
    expect(skipped).toMatchObject({ ok: 2, enrolled: 0, saved: true });
    expect(await countMembers(w.schoolA)).toBe(before + 2);
  });

  it("imports a student whose class is not found, without enrolling them, and says so", async () => {
    const r = await importStudents(w.u.adminA, w.schoolA, [{ row: 2, first_name: "Nia", member_code: "A-300", group: "Grade 99" }], false);
    expect(r).toMatchObject({ ok: 1, enrolled: 0, errors: [], saved: true });
    expect(r.notes).toEqual([{ row: 2, message: expect.stringMatching(/Grade 99.*not found/) }]);
  });

  it("generates sequential Student IDs, and the check shows the IDs the upload will use", async () => {
    const blank = [
      { row: 2, first_name: "Auto", last_name: "One", member_code: "" },
      { row: 3, first_name: "Auto", last_name: "Two" },
      { row: 4, first_name: "Own", last_name: "Code", member_code: "A-400" },
    ];
    const dry = await importStudents(w.u.adminA, w.schoolA, blank, true);
    expect(dry.codes).toEqual([{ row: 2, code: "STU-0001" }, { row: 3, code: "STU-0002" }]);

    const real = await importStudents(w.u.adminA, w.schoolA, blank, false);
    expect(real).toMatchObject({ ok: 3, saved: true });
    expect(real.codes).toEqual(dry.codes);

    // The next upload continues the sequence instead of reusing numbers.
    const next = await importStudents(w.u.adminA, w.schoolA, [{ row: 2, first_name: "Auto", last_name: "Three" }], false);
    expect(next.codes).toEqual([{ row: 2, code: "STU-0003" }]);

    // Numbering is per institution.
    const other = await importStudents(w.u.adminB, w.schoolB, [{ row: 2, first_name: "Bea" }], true);
    expect(other.codes).toEqual([{ row: 2, code: "STU-0001" }]);
  });

  it("refuses institutions the user does not manage", async () => {
    expect(await sqlState(importStudents(w.u.adminA, w.schoolB, rows, true))).toBe("42501");
    expect(await sqlState(importStudents(w.u.teacherA, w.schoolA, rows, true))).toBe("42501");
  });
});

describe("inventory import", () => {
  const rows = [
    { row: 2, sku: "RES-220", name: "220Ω resistor", kind: "component", category: "Passives", quantity: "100", reorder_level: "20" },
    { row: 3, sku: "KIT-1", name: "Starter kit", kind: "kit", category: "Kits", components: [{ sku: "RES-220", quantity: 10 }, { sku: "MOT-1", quantity: 2 }] },
    { row: 4, sku: "MOT-1", name: "DC motor", quantity: "8", unit_cost: "45.5" },
  ];

  it("is Super Admin only", async () => {
    expect(await sqlState(importInventory(w.u.adminA, rows, true))).toBe("42501");
  });

  it("creates items, categories, stock and kit contents in one go", async () => {
    const dry = await importInventory(w.u.super, rows, true);
    expect(dry).toMatchObject({ created: 3, units_received: 108, errors: [], saved: false });
    expect((await db.query("select 1 from public.inventory_items")).rows).toHaveLength(0);

    const r = await importInventory(w.u.super, rows, false);
    expect(r).toMatchObject({ created: 3, saved: true });
    const kit = await db.query<{ n: number }>(
      "select count(*)::int as n from public.inventory_kit_components c join public.inventory_items k on k.id = c.kit_id where k.sku = 'KIT-1'");
    expect(kit.rows[0].n).toBe(2);
    const cats = await db.query<{ name: string }>("select name from public.inventory_categories order by name");
    expect(cats.rows.map((c) => c.name)).toEqual(["Kits", "Passives"]);
  });

  it("updates existing SKUs and receives more stock, leaving blank cells unchanged", async () => {
    const r = await importInventory(w.u.super, [{ row: 2, sku: "res-220", quantity: "50" }], false);
    expect(r).toMatchObject({ created: 0, updated: 1, saved: true });
    const item = await db.query<{ name: string; quantity_on_hand: number; reorder_level: number }>(
      "select name, quantity_on_hand, reorder_level from public.inventory_items where sku = 'RES-220'");
    expect(item.rows[0]).toEqual({ name: "220Ω resistor", quantity_on_hand: 150, reorder_level: 20 });
  });

  it("reports unknown kit components without saving", async () => {
    const r = await importInventory(w.u.super, [{ row: 2, sku: "KIT-2", name: "Kit two", kind: "kit", components: [{ sku: "NOPE", quantity: 1 }] }], false);
    expect(r.saved).toBe(false);
    expect(r.errors).toEqual([{ row: 2, message: "Kit component NOPE was not found" }]);
    expect((await db.query("select 1 from public.inventory_items where sku = 'KIT-2'")).rows).toHaveLength(0);
  });
});
