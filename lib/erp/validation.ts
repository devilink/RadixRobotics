import { z } from "zod";
import { ATTENDANCE_STATUSES, LEAVE_TYPES, MEMBER_TYPES, MEMBERSHIP_STATUSES } from "./types";
import { ITEM_KINDS, MANUAL_MOVEMENT_TYPES } from "./inventory-types";

// Server-side input validation. The database enforces the same rules with
// CHECK constraints; these give friendly, field-level messages first.

const blankToUndefined = (v: unknown) => (typeof v === "string" && v.trim() === "" ? undefined : v);
const optionalText = (max: number) =>
  z.preprocess(blankToUndefined, z.string().trim().max(max, `Must be ${max} characters or fewer`).optional());
const uuid = z.string().uuid("Invalid identifier");
const optionalUuid = z.preprocess(blankToUndefined, uuid.optional());
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a valid date").refine((s) => !Number.isNaN(Date.parse(s)), "Use a valid date");
const optionalDate = z.preprocess(blankToUndefined, isoDate.optional());
const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:MM (24-hour)");
const optionalTime = z.preprocess(blankToUndefined, hhmm.optional());
const email = z.preprocess(blankToUndefined, z.string().trim().toLowerCase().email("Enter a valid email").max(200).optional());
const phone = z.preprocess(blankToUndefined, z.string().trim().regex(/^[0-9+()\-\s]{6,20}$/, "Enter a valid phone number").optional());
const weekdays = z.array(z.coerce.number().int().min(1).max(7)).max(7);

export const institutionSchema = z.object({
  code: z.string().trim().toUpperCase().regex(/^[A-Z0-9][A-Z0-9-]{1,31}$/, "2–32 characters: letters, numbers and dashes"),
  name: z.string().trim().min(2, "Name is required").max(200),
  institution_type: z.enum(["school", "learning_center"]),
  status: z.enum(["active", "inactive", "archived"]).default("active"),
  timezone: z.string().trim().min(1).max(64).default("Asia/Kolkata"),
  email,
  phone,
  address_line: optionalText(300),
  city: optionalText(100),
  state: optionalText(100),
  postal_code: optionalText(20),
  working_days: weekdays.min(1, "Choose at least one working day"),
  attendance_backdate_days: z.coerce.number().int().min(0).max(365).default(7),
  require_correction_approval: z.coerce.boolean().default(false),
});

export const campusSchema = z.object({
  institution_id: uuid,
  name: z.string().trim().min(1, "Name is required").max(150),
  address_line: optionalText(300),
  city: optionalText(100),
  is_primary: z.coerce.boolean().default(false),
});

export const shiftSchema = z
  .object({
    institution_id: uuid,
    name: z.string().trim().min(1, "Name is required").max(80),
    start_time: hhmm,
    end_time: hhmm,
    grace_minutes: z.coerce.number().int().min(0).max(240).default(10),
    days_of_week: weekdays.min(1, "Choose at least one day"),
  })
  .refine((s) => s.end_time > s.start_time, { path: ["end_time"], message: "End must be after start" });

const memberCode = z
  .string()
  .trim()
  .regex(/^[A-Za-z0-9][A-Za-z0-9/_-]{0,39}$/, "Letters, numbers, / _ - only (max 40)");

export const memberCreateSchema = z.object({
  institution_id: uuid,
  member_type: z.enum(MEMBER_TYPES),
  first_name: z.string().trim().min(1, "First name is required").max(100),
  last_name: z.preprocess((v) => v ?? "", z.string().trim().max(100)),
  member_code: memberCode,
  email,
  phone,
  campus_id: optionalUuid,
  start_date: optionalDate,
  registration_number: optionalText(40),
  admission_date: optionalDate,
  department: optionalText(100),
  position: optionalText(100),
  employment_type: z.preprocess(blankToUndefined, z.enum(["full_time", "part_time", "contract", "intern", "volunteer"]).optional()),
  shift_id: optionalUuid,
});

export const memberUpdateSchema = memberCreateSchema
  .omit({ institution_id: true, member_type: true, start_date: true })
  .extend({
    membership_id: uuid,
    status: z.enum(MEMBERSHIP_STATUSES),
    end_date: optionalDate,
  });

export const guardianSchema = z.object({
  student_membership_id: uuid,
  full_name: z.string().trim().min(1, "Name is required").max(150),
  relationship: z.enum(["mother", "father", "guardian", "other"]),
  phone,
  email,
  is_primary: z.coerce.boolean().default(false),
});

export const groupSchema = z
  .object({
    institution_id: uuid,
    name: z.string().trim().min(1, "Name is required").max(120),
    grade: optionalText(30),
    section: optionalText(30),
    academic_year: z.preprocess(blankToUndefined, z.string().regex(/^\d{4}(-\d{2,4})?$/, "e.g. 2026-27").optional()),
    capacity: z.preprocess(blankToUndefined, z.coerce.number().int().min(1).max(1000).optional()),
    meeting_days: weekdays.optional(),
    start_time: optionalTime,
    end_time: optionalTime,
    campus_id: optionalUuid,
  })
  .refine((g) => !g.start_time || !g.end_time || g.end_time > g.start_time, {
    path: ["end_time"],
    message: "End must be after start",
  });

export const attendanceEntrySchema = z.object({
  membership_id: uuid,
  status: z.enum(ATTENDANCE_STATUSES),
  check_in: optionalTime,
  check_out: optionalTime,
  remarks: optionalText(500),
});

export const saveAttendanceSchema = z.object({
  session_id: uuid,
  entries: z.array(attendanceEntrySchema).max(2000, "Too many entries in one save"),
  submit: z.boolean().default(false),
});

export const openSessionSchema = z
  .object({
    institution_id: uuid,
    kind: z.enum(["student", "staff"]),
    group_id: optionalUuid,
    date: isoDate,
    period: optionalText(60),
  })
  .refine((s) => (s.kind === "student") === Boolean(s.group_id), {
    path: ["group_id"],
    message: "Choose a class or batch for a student register",
  });

const reason = z.string().trim().min(5, "Give a reason of at least 5 characters").max(500);

export const correctionSchema = z.object({
  record_id: uuid,
  status: z.enum(ATTENDANCE_STATUSES),
  check_in: optionalTime,
  check_out: optionalTime,
  reason,
  mode: z.enum(["direct", "request"]),
});

export const reviewSchema = z.object({
  id: uuid,
  approve: z.enum(["true", "false"]).transform((v) => v === "true"),
  note: optionalText(500),
});

export const leaveRequestSchema = z
  .object({
    membership_id: uuid,
    leave_type: z.enum(LEAVE_TYPES),
    start_date: isoDate,
    end_date: isoDate,
    half_day: z.coerce.boolean().default(false),
    reason: z.string().trim().min(3, "Give a short reason").max(500),
  })
  .refine((l) => l.end_date >= l.start_date, { path: ["end_date"], message: "End date must be on or after the start date" })
  .refine((l) => !l.half_day || l.start_date === l.end_date, { path: ["half_day"], message: "Half-day leave must be a single day" });

export const createUserSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Enter a valid email")
    .max(200)
    // Reserved for school logins created by the curriculum portal.
    .refine((e) => !e.endsWith("@radix.school"), "This email domain is reserved for school logins"),
  full_name: z.string().trim().min(1, "Name is required").max(150),
  password: z
    .string()
    .min(10, "Temporary password must be at least 10 characters")
    .max(72)
    .regex(/[A-Za-z]/, "Include a letter")
    .regex(/[0-9]/, "Include a number"),
  role_key: z.string().regex(/^[a-z_]+$/),
  institution_id: optionalUuid,
  membership_id: optionalUuid,
});

export const assignRoleSchema = z.object({
  user_id: uuid,
  role_key: z.string().regex(/^[a-z_]+$/),
  institution_id: optionalUuid,
});

export const reportQuerySchema = z
  .object({
    institution_id: uuid,
    kind: z.enum(["student", "staff"]).default("student"),
    from: isoDate,
    to: isoDate,
    group_id: optionalUuid,
  })
  .refine((q) => q.to >= q.from, { path: ["to"], message: "End date must be on or after the start date" })
  .refine((q) => (Date.parse(q.to) - Date.parse(q.from)) / 86_400_000 <= 366, {
    path: ["to"],
    message: "Reports are limited to one year",
  });

export const inventoryItemSchema = z.object({
  sku: z.string().trim().toUpperCase().regex(/^[A-Z0-9][A-Z0-9._-]{1,39}$/, "2–40 characters: letters, numbers, . _ -"),
  name: z.string().trim().min(2, "Name is required").max(200),
  kind: z.enum(ITEM_KINDS),
  category_id: optionalUuid,
  unit: z.preprocess((v) => blankToUndefined(v) ?? "pcs", z.string().trim().min(1).max(20)),
  description: optionalText(2000),
  manufacturer: optionalText(120),
  storage_location: optionalText(120),
  unit_cost: z.preprocess(blankToUndefined, z.coerce.number({ invalid_type_error: "Enter a number" }).min(0, "Cannot be negative").max(10_000_000).optional()),
  reorder_level: z.preprocess((v) => blankToUndefined(v) ?? 0, z.coerce.number().int("Whole numbers only").min(0).max(1_000_000)),
  is_active: z.coerce.boolean().default(false),
  opening_stock: z.preprocess(blankToUndefined, z.coerce.number().int("Whole numbers only").min(0).max(1_000_000).optional()),
});

const qty = z.coerce.number({ invalid_type_error: "Enter a number" }).int("Whole numbers only").max(1_000_000);

export const inventoryMoveSchema = z
  .object({
    item_id: uuid,
    type: z.enum(MANUAL_MOVEMENT_TYPES),
    quantity: qty.min(0, "Cannot be negative"),
    institution_id: optionalUuid,
    issued_to: optionalText(150),
    reference: optionalText(120),
    note: optionalText(500),
  })
  .refine((m) => m.type === "adjust" || m.quantity > 0, { path: ["quantity"], message: "Enter a quantity greater than zero" })
  .refine((m) => !["issue", "return"].includes(m.type) || m.institution_id || m.issued_to, {
    path: ["institution_id"],
    message: "Choose a school or centre, or say who it is for",
  })
  .refine((m) => !["adjust", "write_off"].includes(m.type) || m.note, { path: ["note"], message: "Give a reason" });

export const kitBuildSchema = z.object({
  kit_id: uuid,
  count: qty.min(1, "Build at least one kit").max(10_000),
  mode: z.enum(["assemble", "disassemble"]),
  note: optionalText(500),
});

export const kitComponentSchema = z.object({
  kit_id: uuid,
  component_id: uuid,
  quantity: qty.min(1, "At least 1").max(100_000),
});

export const inventoryCategorySchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  description: optionalText(300),
});

/** FormData → plain object; repeated keys (checkbox groups) become arrays. */
export function formToObject(fd: FormData, arrayKeys: readonly string[] = []): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of new Set(fd.keys())) {
    if (key.startsWith("$ACTION")) continue;
    const values = fd.getAll(key).filter((v): v is string => typeof v === "string");
    out[key] = arrayKeys.includes(key) ? values : values[0];
  }
  for (const key of arrayKeys) if (!(key in out)) out[key] = [];
  return out;
}

export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
