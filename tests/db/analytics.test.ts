import { beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { asUser, createDb } from "./harness";
import { seedWorld, type World } from "./world";

let db: PGlite;
let w: World;

const today = () => new Date(Date.now() + 5.5 * 3600_000).toISOString().slice(0, 10);

type Day = { day: string; marked: number; present: number; absent: number; attended: string | number; expected: number };
const calendar = (user: string, category = "all", kind = "student") =>
  asUser(db, user, async () =>
    (await db.query<Day>("select * from public.erp_attendance_calendar($1, $2)", [category, kind])).rows);

beforeAll(async () => {
  db = await createDb();
  w = await seedWorld(db);
  const session = (await w.rpc(w.u.teacherA, "erp_open_attendance_session", {
    p_institution: w.schoolA, p_kind: "student", p_date: today(), p_group: w.g6a,
  })) as string;
  await w.rpc(w.u.teacherA, "erp_save_attendance", {
    p_session: session,
    p_entries: JSON.stringify([{ membership_id: w.s1, status: "present" }, { membership_id: w.s2, status: "absent" }]),
    p_submit: true,
  });
});

describe("attendance calendar", () => {
  it("totals each day with the dashboard's rate inputs", async () => {
    const rows = await calendar(w.u.adminA);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ marked: 2, present: 1, absent: 1, expected: 2 });
    expect(Number(rows[0].attended)).toBe(1);
  });

  it("only counts rows the caller can see", async () => {
    expect(await calendar(w.u.adminB)).toEqual([]);
    expect(await calendar(w.u.nobody)).toEqual([]);
  });

  it("filters by category and kind", async () => {
    expect(await calendar(w.u.adminA, "learning_center")).toEqual([]);
    expect(await calendar(w.u.adminA, "all", "staff")).toEqual([]);
  });
});

describe("inventory calendar", () => {
  it("is empty for anyone but Super Admins and totals movements for them", async () => {
    const item = await asUser(db, w.u.super, async () => (await db.query<{ id: string }>(
      "insert into public.inventory_items (sku, name) values ('CAL-1', 'Calendar test part') returning id")).rows[0].id);
    await w.rpc(w.u.super, "erp_inventory_move", { p_item: item, p_type: "receive", p_quantity: 12 });
    await w.rpc(w.u.super, "erp_inventory_move", { p_item: item, p_type: "issue", p_quantity: 5, p_institution: w.schoolA });

    const q = (user: string) => asUser(db, user, async () =>
      (await db.query<Record<string, unknown>>("select * from public.erp_inventory_calendar()")).rows);
    expect(await q(w.u.adminA)).toEqual([]);
    const rows = await q(w.u.super);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ movements: 2, units_in: 12, units_out: 5, issued: 5, received: 12 });
  });
});
