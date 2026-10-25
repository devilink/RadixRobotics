// Pure permission checks over the caller's resolved role assignments.
// These drive the UI and early rejection in server actions; the database
// re-checks every permission (RLS + definer functions), so these are never
// the only line of defence.

export type PermissionSet = {
  /** Permissions from platform-wide role assignments (apply to every institution). */
  platform: ReadonlySet<string>;
  /** Permissions per institution id from institution-scoped assignments. */
  byInstitution: ReadonlyMap<string, ReadonlySet<string>>;
};

export function buildPermissionSet(
  assignments: { institution_id: string | null; permissions: readonly string[] }[]
): PermissionSet {
  const platform = new Set<string>();
  const byInstitution = new Map<string, Set<string>>();
  for (const a of assignments) {
    if (a.institution_id === null) {
      a.permissions.forEach((p) => platform.add(p));
    } else {
      const set = byInstitution.get(a.institution_id) ?? new Set<string>();
      a.permissions.forEach((p) => set.add(p));
      byInstitution.set(a.institution_id, set);
    }
  }
  return { platform, byInstitution };
}

/**
 * True if the user holds `perm` at `institutionId`, or — when no institution
 * is given — anywhere (platform-wide or at any institution).
 */
export function can(ps: PermissionSet, perm: string, institutionId?: string | null): boolean {
  if (ps.platform.has(perm)) return true;
  if (institutionId) return ps.byInstitution.get(institutionId)?.has(perm) ?? false;
  for (const set of ps.byInstitution.values()) if (set.has(perm)) return true;
  return false;
}

export function canAny(ps: PermissionSet, perms: readonly string[], institutionId?: string | null): boolean {
  return perms.some((p) => can(ps, p, institutionId));
}

/** Institution ids where the user holds `perm`, or "all" for platform-wide holders. */
export function institutionsWith(ps: PermissionSet, perm: string): "all" | string[] {
  if (ps.platform.has(perm)) return "all";
  return [...ps.byInstitution.entries()].filter(([, set]) => set.has(perm)).map(([id]) => id);
}

export const MARK_PERMS = ["attendance.mark", "attendance.mark_assigned", "staff_attendance.mark"] as const;
export const VIEW_ATTENDANCE_PERMS = ["attendance.view", "attendance.view_assigned", "staff_attendance.view"] as const;
