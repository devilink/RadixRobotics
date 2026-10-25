export const CATEGORIES = ["all", "school", "learning_center"] as const;
export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_LABELS: Record<Category, string> = {
  all: "All Operations",
  school: "Schools",
  learning_center: "Radix Learning Centers",
};

export type InstitutionType = "school" | "learning_center" | "head_office";

export const INSTITUTION_TYPE_LABELS: Record<InstitutionType, string> = {
  school: "School",
  learning_center: "Radix Learning Center",
  head_office: "Head Office",
};

export const MEMBER_TYPES = ["student", "teacher", "instructor", "staff", "employee"] as const;
export type MemberType = (typeof MEMBER_TYPES)[number];

export const MEMBER_TYPE_LABELS: Record<MemberType, string> = {
  student: "Student",
  teacher: "Teacher",
  instructor: "Instructor",
  staff: "Staff",
  employee: "Employee",
};

/** Member types allowed at each institution type (mirrors erp_create_member). */
export const MEMBER_TYPES_BY_INSTITUTION: Record<InstitutionType, MemberType[]> = {
  school: ["student", "teacher", "instructor", "staff"],
  learning_center: ["student", "instructor", "staff"],
  head_office: ["employee", "staff", "instructor"],
};

export const MEMBERSHIP_STATUSES = ["active", "inactive", "graduated", "left"] as const;
export type MembershipStatus = (typeof MEMBERSHIP_STATUSES)[number];

export const ATTENDANCE_STATUSES = ["present", "absent", "late", "excused", "half_day", "on_leave"] as const;
export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];

export const ATTENDANCE_STATUS_LABELS: Record<AttendanceStatus, string> = {
  present: "Present",
  absent: "Absent",
  late: "Late",
  excused: "Excused",
  half_day: "Half Day",
  on_leave: "On Leave",
};

/** Statuses offered on each register kind (on_leave is staff-only). */
export const STATUSES_BY_KIND: Record<AttendanceKind, AttendanceStatus[]> = {
  student: ["present", "absent", "late", "excused", "half_day"],
  staff: ["present", "absent", "late", "half_day", "on_leave", "excused"],
};

export type AttendanceKind = "student" | "staff";
export type SessionStatus = "draft" | "submitted" | "finalized";
export type RequestStatus = "pending" | "approved" | "rejected" | "cancelled";

export const LEAVE_TYPES = ["casual", "sick", "earned", "unpaid", "other"] as const;
export type LeaveType = (typeof LEAVE_TYPES)[number];

export type ActionResult<T = undefined> =
  | { ok: true; message?: string; data?: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };
