import { beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { asUser, createDb, createUser, grantRole, sqlState } from "./harness";
import { seedWorld, type World } from "./world";

let db: PGlite;
let w: World;
let invManager: string;
let resistor: string;
let motor: string;
let kit: string;

const one = async <T>(user: string, sql: string, params: unknown[] = []) =>
  asUser(db, user, async () => (await db.query<T>(sql, params)).rows[0]);
const onHand = async (id: string) =>
  (await db.query<{ q: number }>("select quantity_on_hand as q from public.inventory_items where id = $1", [id])).rows[0].q;

beforeAll(async () => {
  db = await createDb();
  w = await seedWorld(db);
  invManager = await createUser(db, "inventory@example.test");
  await grantRole(db, invManager, "inventory_manager", null);

  const item = (sku: string, name: string, kind: string) =>
    one<{ id: string }>(w.u.super, "insert into public.inventory_items (sku, name, kind, reorder_level, unit_cost) values ($1, $2, $3, 10, 2.50) returning id", [sku, name, kind]);
  resistor = (await item("RES-220", "220Ω resistor", "component")).id;
  motor = (await item("MOT-DC", "DC motor", "component")).id;
  kit = (await item("KIT-BOT", "Starter robot kit", "kit")).id;
  await asUser(db, w.u.super, () => db.query(
    "insert into public.inventory_kit_components (kit_id, component_id, quantity) values ($1, $2, 10), ($1, $3, 2)", [kit, resistor, motor]));
});

describe("inventory access", () => {
  it("is invisible to everyone except Super Admins", async () => {
    for (const user of [w.u.adminA, w.u.centreMgr, w.u.hr, w.u.teacherA, invManager, w.u.nobody]) {
      const rows = await asUser(db, user, async () => (await db.query("select id from public.inventory_items")).rows);
      expect(rows).toEqual([]);
    }
    const rows = await asUser(db, w.u.super, async () => (await db.query("select id from public.inventory_items")).rows);
    expect(rows).toHaveLength(3);
  });

  it("no other role holds inventory.manage, even the Inventory Manager role", async () => {
    const { rows } = await db.query<{ role_key: string }>("select role_key from public.role_permissions where permission_key = 'inventory.manage'");
    expect(rows.map((r) => r.role_key)).toEqual(["super_admin"]);
  });

  it("rejects writes and stock functions from non Super Admins", async () => {
    expect(await sqlState(asUser(db, invManager, () => db.query(
      "insert into public.inventory_items (sku, name) values ('HACK-1', 'Injected')")))).toBe("42501");
    expect(await sqlState(w.rpc(invManager, "erp_inventory_move", { p_item: resistor, p_type: "receive", p_quantity: 5 }))).toBe("42501");
    expect(await sqlState(w.rpc(w.u.adminA, "erp_inventory_build_kits", { p_kit: kit, p_count: 1 }))).toBe("42501");
  });

  it("does not let anyone set stock directly or write the ledger", async () => {
    expect(await sqlState(asUser(db, w.u.super, () => db.query(
      "update public.inventory_items set quantity_on_hand = 999 where id = $1", [resistor])))).toBe("42501");
    expect(await sqlState(asUser(db, w.u.super, () => db.query(
      "insert into public.inventory_movements (item_id, movement_type, quantity_change, balance_after) values ($1, 'receive', 5, 5)", [resistor])))).toBe("42501");
  });
});

describe("stock movements", () => {
  it("receives, issues to a school and returns, keeping a running balance", async () => {
    await w.rpc(w.u.super, "erp_inventory_move", { p_item: resistor, p_type: "receive", p_quantity: 100, p_reference: "PO-1" });
    await w.rpc(w.u.super, "erp_inventory_move", { p_item: motor, p_type: "receive", p_quantity: 10 });
    await w.rpc(w.u.super, "erp_inventory_move", { p_item: resistor, p_type: "issue", p_quantity: 30, p_institution: w.schoolA });
    await w.rpc(w.u.super, "erp_inventory_move", { p_item: resistor, p_type: "return", p_quantity: 10, p_institution: w.schoolA });
    expect(await onHand(resistor)).toBe(80);
    const out = await asUser(db, w.u.super, async () =>
      (await db.query<{ outstanding: number }>("select outstanding from public.erp_inventory_outstanding() where item_id = $1", [resistor])).rows);
    expect(out).toEqual([{ outstanding: 20 }]);
    const last = await one<{ balance_after: number }>(w.u.super,
      "select balance_after from public.inventory_movements where item_id = $1 order by id desc limit 1", [resistor]);
    expect(last.balance_after).toBe(80);
  });

  it("refuses to go below zero or return more than was issued", async () => {
    expect(await sqlState(w.rpc(w.u.super, "erp_inventory_move", { p_item: motor, p_type: "issue", p_quantity: 11, p_institution: w.schoolA }))).toBe("23514");
    expect(await sqlState(w.rpc(w.u.super, "erp_inventory_move", { p_item: resistor, p_type: "return", p_quantity: 21, p_institution: w.schoolA }))).toBe("23514");
    expect(await sqlState(w.rpc(w.u.super, "erp_inventory_move", { p_item: resistor, p_type: "issue", p_quantity: 1 }))).toBe("22023");
    expect(await sqlState(w.rpc(w.u.super, "erp_inventory_move", { p_item: resistor, p_type: "write_off", p_quantity: 1 }))).toBe("22023");
  });

  it("adjusts to a counted quantity", async () => {
    await w.rpc(w.u.super, "erp_inventory_move", { p_item: resistor, p_type: "adjust", p_quantity: 75, p_note: "Stock count" });
    expect(await onHand(resistor)).toBe(75);
  });
});

describe("kits", () => {
  it("builds kits from components in one transaction", async () => {
    await w.rpc(w.u.super, "erp_inventory_build_kits", { p_kit: kit, p_count: 3 });
    expect(await onHand(kit)).toBe(3);
    expect(await onHand(resistor)).toBe(45);
    expect(await onHand(motor)).toBe(4);
  });

  it("fails as a whole when any component is short", async () => {
    expect(await sqlState(w.rpc(w.u.super, "erp_inventory_build_kits", { p_kit: kit, p_count: 3 }))).toBe("23514");
    expect(await onHand(resistor)).toBe(45);
    expect(await onHand(kit)).toBe(3);
  });

  it("disassembles kits back into components", async () => {
    await w.rpc(w.u.super, "erp_inventory_build_kits", { p_kit: kit, p_count: 1, p_disassemble: true });
    expect(await onHand(kit)).toBe(2);
    expect(await onHand(resistor)).toBe(55);
    expect(await onHand(motor)).toBe(6);
  });

  it("rejects kits inside kits and items with history from being deleted", async () => {
    expect(await sqlState(asUser(db, w.u.super, () => db.query(
      "insert into public.inventory_kit_components (kit_id, component_id, quantity) values ($1, $1, 1)", [kit])))).toBe("23514");
    expect(await sqlState(asUser(db, w.u.super, () => db.query("delete from public.inventory_items where id = $1", [motor])))).toBe("23503");
  });

  it("summarises stock for the dashboard", async () => {
    const s = await one<{ v: Record<string, number> }>(w.u.super, "select public.erp_inventory_summary() as v");
    expect(s.v).toMatchObject({ items: 2, kits: 1, issued_out: 20 });
    const denied = await one<{ v: Record<string, number> }>(w.u.adminA, "select public.erp_inventory_summary() as v");
    expect(denied.v).toMatchObject({ items: 0, kits: 0, units: 0 });
  });
});
