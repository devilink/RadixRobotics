import { canAny, type PermissionSet } from "./permissions";

/** Accent per module, used for the sidebar section, icon tiles and the command palette. */
export type NavTone = "brand" | "violet" | "sky" | "pink" | "emerald" | "amber" | "teal" | "zinc";

export const TONE_HEX: Record<NavTone, string> = {
  brand: "#ff7a38", violet: "#a78bfa", sky: "#38bdf8", pink: "#f472b6",
  emerald: "#34d399", amber: "#fbbf24", teal: "#2dd4bf", zinc: "#a1a1aa",
};

export type NavItem ={ href: string; label: string; icon: string; hint: string; anyOf: readonly string[] };
export type NavSection = { label: string; tone: NavTone; items: NavItem[] };
export type QuickAction = { href: string; label: string; icon: string; hint: string; tone: NavTone; anyOf: readonly string[] };

// Only modules that are actually implemented appear here. Upcoming modules
// (CRM, procurement, finance, projects, support) are intentionally absent until
// they have working pages. Inventory is Super Admin only: inventory.manage is
// held by no other role, and its pages also check the role itself.
export const NAV: NavSection[] = [
  {
    label: "Overview",
    tone: "brand",
    items: [{ href: "/erp", label: "Dashboard", icon: "LayoutDashboard", hint: "Today at a glance", anyOf: ["dashboard.view"] }],
  },
  {
    label: "Institutions",
    tone: "violet",
    items: [{ href: "/erp/institutions", label: "Institutions", icon: "Building2", hint: "Schools and learning centres", anyOf: ["institutions.view"] }],
  },
  {
    label: "People",
    tone: "sky",
    items: [
      { href: "/erp/people?type=students", label: "Students", icon: "GraduationCap", hint: "Enrolled learners", anyOf: ["students.view", "students.view_assigned"] },
      { href: "/erp/people?type=staff", label: "Teachers & Staff", icon: "Users", hint: "Instructors and employees", anyOf: ["staff.view"] },
    ],
  },
  {
    label: "Learning",
    tone: "pink",
    items: [{ href: "/erp/groups", label: "Classes & Batches", icon: "BookOpen", hint: "Sections, batches and enrolments", anyOf: ["groups.view"] }],
  },
  {
    label: "Attendance",
    tone: "emerald",
    items: [
      { href: "/erp/attendance", label: "Attendance Overview", icon: "ClipboardCheck", hint: "Today’s rates and trends", anyOf: ["attendance.view", "attendance.view_assigned", "staff_attendance.view"] },
      { href: "/erp/attendance/register", label: "Daily Register", icon: "ListChecks", hint: "Mark present, absent, late", anyOf: ["attendance.mark", "attendance.mark_assigned", "staff_attendance.mark"] },
      { href: "/erp/attendance/corrections", label: "Corrections", icon: "FilePen", hint: "Fix submitted registers", anyOf: ["attendance.approve", "staff_attendance.approve", "attendance.mark", "attendance.mark_assigned", "staff_attendance.mark"] },
      { href: "/erp/attendance/leave", label: "Leave", icon: "CalendarOff", hint: "Requests and approvals", anyOf: ["leave.view", "leave.approve", "self.view"] },
      { href: "/erp/attendance/reports", label: "Reports", icon: "BarChart3", hint: "Summaries and exports", anyOf: ["attendance.view", "attendance.view_assigned", "staff_attendance.view"] },
    ],
  },
  {
    label: "Inventory",
    tone: "amber",
    items: [
      { href: "/erp/inventory", label: "Inventory Overview", icon: "Boxes", hint: "Stock health and activity", anyOf: ["inventory.manage"] },
      { href: "/erp/inventory/items", label: "Kits & Components", icon: "Cpu", hint: "Everything on the shelves", anyOf: ["inventory.manage"] },
      { href: "/erp/inventory/movements", label: "Stock Movements", icon: "ArrowLeftRight", hint: "Every in and out", anyOf: ["inventory.manage"] },
      { href: "/erp/inventory/issued", label: "Issued to Sites", icon: "Truck", hint: "What schools are holding", anyOf: ["inventory.manage"] },
      { href: "/erp/inventory/categories", label: "Categories", icon: "Tags", hint: "Group your items", anyOf: ["inventory.manage"] },
      { href: "/erp/inventory/import", label: "Import", icon: "Upload", hint: "From Excel or Google Sheets", anyOf: ["inventory.manage"] },
    ],
  },
  {
    label: "Community",
    tone: "pink",
    items: [
      { href: "/erp/community", label: "Join Applications", icon: "HeartHandshake", hint: "People who want to join Radix", anyOf: ["community.manage"] },
    ],
  },
  {
    label: "My Account",
    tone: "teal",
    items: [{ href: "/erp/me", label: "My Attendance", icon: "UserCheck", hint: "Your own record", anyOf: ["self.view"] }],
  },
  {
    label: "Administration",
    tone: "zinc",
    items: [
      { href: "/erp/admin/users", label: "Users & Roles", icon: "ShieldCheck", hint: "Who can do what", anyOf: ["users.manage"] },
      { href: "/erp/admin/roles", label: "Permission Matrix", icon: "KeyRound", hint: "Roles at a glance", anyOf: ["users.manage"] },
      { href: "/erp/admin/audit", label: "Audit Log", icon: "ScrollText", hint: "Every change, recorded", anyOf: ["audit.view"] },
    ],
  },
];

/** Shortcuts shown in the command palette and as action tiles on the dashboard. */
export const QUICK_ACTIONS: QuickAction[] = [
  { href: "/erp/attendance/register", label: "Take attendance", icon: "ListChecks", hint: "Open today’s register", tone: "emerald", anyOf: ["attendance.mark", "attendance.mark_assigned", "staff_attendance.mark"] },
  { href: "/erp/people/new?type=student", label: "Add a student", icon: "GraduationCap", hint: "Enrol someone new", tone: "sky", anyOf: ["students.manage"] },
  { href: "/erp/groups/new", label: "New class or batch", icon: "BookOpen", hint: "Create a learning group", tone: "pink", anyOf: ["groups.manage"] },
  { href: "/erp/institutions/new", label: "New institution", icon: "Building2", hint: "Add a school or centre", tone: "violet", anyOf: ["institutions.manage"] },
  { href: "/erp/inventory/items/new", label: "New stock item", icon: "Cpu", hint: "Add a kit or component", tone: "amber", anyOf: ["inventory.manage"] },
  { href: "/erp/attendance/reports", label: "Attendance report", icon: "BarChart3", hint: "Summaries and CSV export", tone: "emerald", anyOf: ["attendance.view", "attendance.view_assigned", "staff_attendance.view"] },
];

export function navFor(ps: PermissionSet): NavSection[] {
  return NAV.map((s) => ({ ...s, items: s.items.filter((i) => canAny(ps, i.anyOf)) })).filter((s) => s.items.length > 0);
}

export function actionsFor(ps: PermissionSet): QuickAction[] {
  return QUICK_ACTIONS.filter((a) => canAny(ps, a.anyOf));
}
