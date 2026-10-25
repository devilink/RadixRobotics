import { describe, expect, it } from "vitest";
import { buildPermissionSet, can, canAny, institutionsWith } from "@/lib/erp/permissions";
import { NAV, navFor } from "@/lib/erp/nav";
import {
  attendanceEntrySchema, createUserSchema, formToObject, institutionSchema, leaveRequestSchema,
  memberCreateSchema, openSessionSchema, reportQuerySchema, saveAttendanceSchema,
} from "@/lib/erp/validation";
import { friendlyDbError } from "@/lib/erp/errors";
import { addDays, csvCell, toCsv, todayIn } from "@/lib/erp/format";
import { rateLimit } from "@/lib/erp/rate-limit";
import { inventoryItemSchema, inventoryMoveSchema } from "@/lib/erp/validation";
import { buildableKits, stockState } from "@/lib/erp/inventory-types";

const A = "11111111-1111-4111-8111-111111111111";
const B = "22222222-2222-4222-8222-222222222222";

describe("permissions", () => {
  const teacherAtA = buildPermissionSet([{ institution_id: A, permissions: ["attendance.mark_assigned", "groups.view"] }]);
  const hr = buildPermissionSet([{ institution_id: null, permissions: ["staff.view", "leave.approve"] }]);

  it("scopes institution roles to their institution", () => {
    expect(can(teacherAtA, "attendance.mark_assigned", A)).toBe(true);
    expect(can(teacherAtA, "attendance.mark_assigned", B)).toBe(false);
    expect(can(teacherAtA, "attendance.mark_assigned")).toBe(true); // anywhere
    expect(can(teacherAtA, "attendance.mark", A)).toBe(false);
  });

  it("applies platform roles to every institution", () => {
    expect(can(hr, "staff.view", B)).toBe(true);
    expect(institutionsWith(hr, "staff.view")).toBe("all");
    expect(institutionsWith(teacherAtA, "groups.view")).toEqual([A]);
    expect(canAny(hr, ["students.view", "leave.approve"], A)).toBe(true);
  });
});

describe("navigation", () => {
  it("shows only implemented modules the role can use", () => {
    const teacher = buildPermissionSet([{ institution_id: A, permissions: ["dashboard.view", "institutions.view", "students.view_assigned", "groups.view", "attendance.view_assigned", "attendance.mark_assigned", "self.view"] }]);
    const labels = navFor(teacher).flatMap((s) => s.items.map((i) => i.label));
    expect(labels).toContain("Daily Register");
    expect(labels).toContain("Students");
    expect(labels).not.toContain("Teachers & Staff");
    expect(labels).not.toContain("Users & Roles");
    expect(labels).not.toContain("Audit Log");
  });

  it("gives self-service users only their own pages", () => {
    const student = buildPermissionSet([{ institution_id: A, permissions: ["self.view"] }]);
    expect(navFor(student).flatMap((s) => s.items.map((i) => i.href))).toEqual(["/erp/attendance/leave", "/erp/me"]);
  });

  it("does not list unbuilt modules", () => {
    const hrefs = NAV.flatMap((s) => s.items.map((i) => i.href)).join(" ");
    for (const unbuilt of ["finance", "procurement", "crm"]) expect(hrefs).not.toContain(unbuilt);
  });

  it("shows inventory only to holders of inventory.manage", () => {
    const superAdmin = buildPermissionSet([{ institution_id: null, permissions: ["dashboard.view", "inventory.manage"] }]);
    const director = buildPermissionSet([{ institution_id: null, permissions: ["dashboard.view", "audit.view", "finance.view"] }]);
    const has = (ps: ReturnType<typeof buildPermissionSet>) => navFor(ps).some((s) => s.label === "Inventory");
    expect(has(superAdmin)).toBe(true);
    expect(has(director)).toBe(false);
  });
});

describe("validation", () => {
  it("normalises institution input and rejects bad codes", () => {
    const ok = institutionSchema.safeParse({ code: "sch-01", name: "Alpha", institution_type: "school", working_days: ["1", "2"], email: "" });
    expect(ok.success && ok.data.code).toBe("SCH-01");
    expect(ok.success && ok.data.email).toBeUndefined();
    expect(institutionSchema.safeParse({ code: "bad code!", name: "A", institution_type: "school", working_days: [1] }).success).toBe(false);
    expect(institutionSchema.safeParse({ code: "OK-1", name: "Alpha", institution_type: "head_office", working_days: [1] }).success).toBe(false);
  });

  it("validates attendance entries", () => {
    expect(attendanceEntrySchema.safeParse({ membership_id: A, status: "present", check_in: "09:05" }).success).toBe(true);
    expect(attendanceEntrySchema.safeParse({ membership_id: A, status: "present", check_in: "9:05am" }).success).toBe(false);
    expect(attendanceEntrySchema.safeParse({ membership_id: A, status: "sleeping" }).success).toBe(false);
    expect(attendanceEntrySchema.safeParse({ membership_id: "not-a-uuid", status: "absent" }).success).toBe(false);
    const big = Array.from({ length: 2001 }, () => ({ membership_id: A, status: "present" }));
    expect(saveAttendanceSchema.safeParse({ session_id: A, entries: big }).success).toBe(false);
  });

  it("requires a group for student registers only", () => {
    expect(openSessionSchema.safeParse({ institution_id: A, kind: "student", date: "2026-10-01" }).success).toBe(false);
    expect(openSessionSchema.safeParse({ institution_id: A, kind: "staff", date: "2026-10-01" }).success).toBe(true);
    expect(openSessionSchema.safeParse({ institution_id: A, kind: "staff", date: "2026-10-01", group_id: B }).success).toBe(false);
  });

  it("validates leave, reports, members and new accounts", () => {
    expect(leaveRequestSchema.safeParse({ membership_id: A, leave_type: "sick", start_date: "2026-10-05", end_date: "2026-10-04", reason: "Flu" }).success).toBe(false);
    expect(leaveRequestSchema.safeParse({ membership_id: A, leave_type: "sick", start_date: "2026-10-05", end_date: "2026-10-06", half_day: "on", reason: "Flu" }).success).toBe(false);
    expect(reportQuerySchema.safeParse({ institution_id: A, from: "2025-01-01", to: "2026-06-01" }).success).toBe(false);
    expect(memberCreateSchema.safeParse({ institution_id: A, member_type: "student", first_name: " ", member_code: "S1" }).success).toBe(false);
    expect(createUserSchema.safeParse({ email: "x@example.test", full_name: "X", password: "short1", role_key: "teacher" }).success).toBe(false);
    expect(createUserSchema.safeParse({ email: "x@example.test", full_name: "X", password: "longenough1", role_key: "teacher" }).success).toBe(true);
  });

  it("reads checkbox groups from FormData", () => {
    const fd = new FormData();
    fd.append("working_days", "1");
    fd.append("working_days", "3");
    fd.append("name", "Alpha");
    fd.append("$ACTION_ID_abc", "");
    expect(formToObject(fd, ["working_days", "meeting_days"])).toEqual({ working_days: ["1", "3"], name: "Alpha", meeting_days: [] });
  });
});

describe("error mapping", () => {
  it("passes through deliberate database messages but hides internals", () => {
    expect(friendlyDbError({ code: "55000", message: "This register is finalised. Submit a correction instead." })).toBe("This register is finalised. Submit a correction instead.");
    expect(friendlyDbError({ code: "23505", message: 'duplicate key value violates unique constraint "institutions_code_key"' })).toBe("That institution code is already in use.");
    expect(friendlyDbError({ code: "42501", message: 'new row violates row-level security policy for table "learning_groups"' })).toBe("You do not have permission to do that.");
    expect(friendlyDbError({ code: "XX000", message: "internal: relation secret_table" })).toBe("Something went wrong. Please try again.");
  });
});

describe("formatting", () => {
  it("neutralises spreadsheet formula injection in CSV", () => {
    expect(csvCell("=HYPERLINK(\"http://x\")")).toBe(`"'=HYPERLINK(""http://x"")"`);
    expect(csvCell("+91 900")).toBe("'+91 900");
    expect(csvCell("a,b")).toBe('"a,b"');
    expect(toCsv(["h"], [[null], [3]])).toBe("h\r\n\r\n3\r\n");
  });

  it("computes dates in the institution time zone", () => {
    // 20:00 UTC on 1 Oct is already 2 Oct in India.
    expect(todayIn("Asia/Kolkata", new Date("2026-10-01T20:00:00Z"))).toBe("2026-10-02");
    expect(todayIn("UTC", new Date("2026-10-01T20:00:00Z"))).toBe("2026-10-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });
});

describe("rate limiting", () => {
  it("blocks after the limit within a window and resets afterwards", () => {
    const t = 1_000_000;
    expect([1, 2, 3].map(() => rateLimit("k", 2, 1000, t))).toEqual([true, true, false]);
    expect(rateLimit("k", 2, 1000, t + 1001)).toBe(true);
  });
});

describe("inventory", () => {
  it("computes stock state and buildable kits", () => {
    expect(stockState({ quantity_on_hand: 0, reorder_level: 5 })).toBe("out");
    expect(stockState({ quantity_on_hand: 5, reorder_level: 5 })).toBe("low");
    expect(stockState({ quantity_on_hand: 6, reorder_level: 5 })).toBe("ok");
    expect(stockState({ quantity_on_hand: 1, reorder_level: 0 })).toBe("ok");
    expect(buildableKits([{ quantity: 10, on_hand: 45 }, { quantity: 2, on_hand: 6 }])).toBe(3);
    expect(buildableKits([])).toBe(0);
  });

  it("validates items and movements", () => {
    const ok = inventoryItemSchema.safeParse({ sku: "mcu-uno", name: "Arduino Uno", kind: "component", unit: "", reorder_level: "", unit_cost: "" });
    expect(ok.success && ok.data).toMatchObject({ sku: "MCU-UNO", unit: "pcs", reorder_level: 0, unit_cost: undefined });
    expect(inventoryItemSchema.safeParse({ sku: "bad sku", name: "X1", kind: "component" }).success).toBe(false);
    expect(inventoryMoveSchema.safeParse({ item_id: A, type: "issue", quantity: "3" }).success).toBe(false);
    expect(inventoryMoveSchema.safeParse({ item_id: A, type: "issue", quantity: "3", institution_id: B }).success).toBe(true);
    expect(inventoryMoveSchema.safeParse({ item_id: A, type: "adjust", quantity: "0" }).success).toBe(false);
    expect(inventoryMoveSchema.safeParse({ item_id: A, type: "adjust", quantity: "0", note: "Count" }).success).toBe(true);
    expect(inventoryMoveSchema.safeParse({ item_id: A, type: "receive", quantity: "0" }).success).toBe(false);
  });
});
