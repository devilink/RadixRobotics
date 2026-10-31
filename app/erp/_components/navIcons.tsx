import {
  ArrowLeftRight, BarChart3, BookOpen, Boxes, Building2, CalendarOff, ClipboardCheck, Cpu, FilePen, GraduationCap, HeartHandshake, KeyRound,
  LayoutDashboard, ListChecks, ScrollText, ShieldCheck, Tags, Truck, Upload, UserCheck, Users,
} from "lucide-react";

/** Icons referenced by name in lib/erp/nav.ts. */
export const NAV_ICONS = {
  ArrowLeftRight, BarChart3, BookOpen, Boxes, Building2, CalendarOff, ClipboardCheck, Cpu, FilePen, GraduationCap, HeartHandshake, KeyRound,
  LayoutDashboard, ListChecks, ScrollText, ShieldCheck, Tags, Truck, Upload, UserCheck, Users,
} as const;

export function NavIcon({ name, className }: { name: string; className?: string }) {
  const C = NAV_ICONS[name as keyof typeof NAV_ICONS] ?? LayoutDashboard;
  return <C aria-hidden className={className} />;
}
