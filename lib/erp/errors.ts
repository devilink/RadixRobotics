// Map Postgres / PostgREST errors to messages that are safe to show users.
// Messages raised deliberately by our SQL functions are written for end users,
// so they are passed through for the codes those functions use.

type PgError = { code?: string; message?: string; details?: string | null } | null | undefined;

const PASS_THROUGH = new Set(["42501", "P0002", "22023", "55000", "23514", "23505"]);

const CONSTRAINT_MESSAGES: [RegExp, string][] = [
  [/institutions_code_key/, "That institution code is already in use."],
  [/institution_memberships_institution_id_member_type_m/, // name is truncated to 63 chars by Postgres
    "That ID is already used by another member of this type at this institution."],
  [/institution_memberships_institution_id_person_id_member_type_key/, "This person already has that membership at this institution."],
  [/learning_groups_name_uq/, "A class or batch with that name already exists for this year."],
  [/campuses_institution_id_name_key/, "A campus with that name already exists."],
  [/campuses_one_primary/, "Only one campus can be primary."],
  [/work_shifts_institution_id_name_key/, "A shift with that name already exists."],
  [/enrollments_group_id_membership_id_key/, "This student is already enrolled."],
  [/group_assignments_group_id_membership_id_key/, "This person is already assigned."],
  [/attendance_records_session_id_membership_id_key/, "This person already has an entry on this register."],
  [/is_valid_timezone/, "Unknown time zone."],
  [/inventory_items_sku_key/, "That SKU is already used by another item."],
  [/inventory_categories_name_key/, "A category with that name already exists."],
  [/inventory_kit_components_kit_id_component_id_key/, "That component is already in this kit. Change its quantity instead."],
  [/inventory_movements_item_id_fkey/, "This item has stock history, so it cannot be deleted. Mark it inactive instead."],
  [/inventory_kit_components_component_id_fkey/, "This item is used in a kit. Remove it from the kit first."],
];

export function friendlyDbError(err: PgError, fallback = "Something went wrong. Please try again."): string {
  if (!err) return fallback;
  const msg = err.message ?? "";
  for (const [re, text] of CONSTRAINT_MESSAGES) if (re.test(msg) || re.test(err.details ?? "")) return text;
  if (err.code === "42501" && /row-level security|permission denied/i.test(msg)) {
    return "You do not have permission to do that.";
  }
  if (err.code && PASS_THROUGH.has(err.code) && msg && !/violates|duplicate key/i.test(msg)) return msg;
  if (err.code === "23505") return "That record already exists.";
  if (err.code === "23503") return "A linked record was not found or belongs to another institution.";
  if (err.code === "23514") return "Some values are not allowed. Check the form and try again.";
  if (err.code === "22P02") return "Some values are in the wrong format.";
  return fallback;
}
