"use client";

import Link from 'next/link';
import {
  ArrowRight,
  Award,
  BarChart3,
  BookOpen,
  ClipboardCheck,
  FlaskConical,
  GraduationCap,
  School,
  ShieldCheck,
  Users,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import { motion } from 'framer-motion';

type Feature = { icon: LucideIcon; title: string; desc: string };

type Portal = {
  tag: string;
  name: string;
  fullName: string;
  summary: string;
  icon: LucideIcon;
  panelClass: string;
  mutedClass: string;
  ruleClass: string;
  iconClass: string;
  features: Feature[];
};

// Only list what the portals really do today. Inventory is deliberately absent:
// it is restricted to Radix Super Admins and is not offered to schools.
const portals: Portal[] = [
  {
    tag: "// For teaching & learning",
    name: "LMS",
    fullName: "Learning Management System",
    summary: "Everything students and teachers need to follow the curriculum and keep building beyond the lab.",
    icon: GraduationCap,
    panelClass: "bg-white text-[#111] shadow-[8px_8px_0_#ff5400]",
    mutedClass: "text-[#5c6370]",
    ruleClass: "border-[#111]/15",
    iconClass: "bg-[#111] text-white",
    features: [
      { icon: BookOpen, title: "Curriculum Library", desc: "Structured robotics and STEM lessons for your teaching staff." },
      { icon: Award, title: "Progress & Badges", desc: "Every student gets a profile with their progress and earned badges." },
      { icon: Wrench, title: "Projects & Blueprints", desc: "Step-by-step project guides students can open at any time." },
      { icon: FlaskConical, title: "Virtual Lab", desc: "Practice concepts online, even when away from the hardware." },
    ],
  },
  {
    tag: "// For school administration",
    name: "ERP",
    fullName: "School Management Portal",
    summary: "One place for your school office to manage students, staff and daily attendance.",
    icon: School,
    panelClass: "bg-[#ff5400] text-[#111] shadow-[8px_8px_0_#ffffff]",
    mutedClass: "text-[#111]/80",
    ruleClass: "border-[#111]/25",
    iconClass: "bg-[#111] text-[#ff5400]",
    features: [
      { icon: ClipboardCheck, title: "Attendance", desc: "Daily registers, leave requests, corrections and reports." },
      { icon: Users, title: "Student & Staff Records", desc: "Class-wise records, with bulk import from Excel, CSV or Google Sheets." },
      { icon: BarChart3, title: "Live Dashboards", desc: "See attendance trends across your school at a glance." },
      { icon: ShieldCheck, title: "Role-Based Access", desc: "Each person sees only what their role allows, with an audit log." },
    ],
  },
];

export default function SchoolPortals() {
  return (
    <section id="school-portals" className="relative z-10 w-full bg-[#111] border-y-2 border-white/10 overflow-hidden py-[clamp(4rem,9vw,8rem)]">
      {/* Layout sizes use clamp() or variant-only classes on purpose: plain Tailwind
          utilities currently override their responsive variants (see theme.css). */}
      <div className="w-full mx-auto px-[clamp(1rem,4.5vw,6rem)] pr-font-sans relative z-10">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="max-w-4xl mb-[clamp(2.5rem,6vw,5rem)]"
        >
          <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#ff5400] block mb-4">
            [ Beyond The Lab ]
          </span>
          <h2 className="text-[clamp(2.25rem,6.5vw,4.5rem)] font-black tracking-tighter text-white uppercase leading-[0.95] mb-6">
            LMS &amp; ERP Portals<br />
            <span className="text-[#ff5400]">For Your School</span>
          </h2>
          <p className="text-[#a0aab8] text-[clamp(0.9375rem,1.4vw,1.125rem)] font-medium leading-relaxed max-w-2xl">
            Along with robotics labs, Radix also provides schools with a complete digital campus: an LMS for learning and an ERP portal for running day-to-day administration.
          </p>
        </motion.div>

        {/* Portal panels */}
        <div className="grid gap-[clamp(1.75rem,3vw,2.5rem)] lg:grid-cols-2">
          {portals.map((portal, i) => {
            const PortalIcon = portal.icon;
            return (
              <motion.article
                key={portal.name}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.6, delay: i * 0.12, ease: "easeOut" }}
                className={`min-w-0 border-2 border-[#111] mr-2 p-[clamp(1.5rem,3.5vw,3rem)] ${portal.panelClass}`}
              >
                <div className={`flex items-start justify-between gap-4 pb-6 mb-6 border-b-2 ${portal.ruleClass}`}>
                  <div className="min-w-0">
                    <span className={`font-mono text-[11px] font-bold uppercase tracking-widest ${portal.mutedClass}`}>
                      {portal.tag}
                    </span>
                    <h3 className="text-[clamp(3rem,6vw,4.5rem)] font-black tracking-tighter leading-none mt-2">
                      {portal.name}
                    </h3>
                    <p className="font-bold uppercase tracking-tight text-sm mt-1">{portal.fullName}</p>
                  </div>
                  <div className={`shrink-0 p-3 ${portal.iconClass}`}>
                    <PortalIcon size={28} strokeWidth={1.75} aria-hidden="true" />
                  </div>
                </div>

                <p className={`text-[15px] font-semibold leading-relaxed mb-8 ${portal.mutedClass}`}>
                  {portal.summary}
                </p>

                <ul className="grid gap-x-6 gap-y-6 sm:grid-cols-2">
                  {portal.features.map((feature) => {
                    const FeatureIcon = feature.icon;
                    return (
                      <li key={feature.title} className="flex items-start gap-3 min-w-0">
                        <FeatureIcon size={20} strokeWidth={2} className="shrink-0 mt-0.5" aria-hidden="true" />
                        <div className="min-w-0">
                          <h4 className="font-black uppercase tracking-tight text-[15px] leading-tight mb-1">{feature.title}</h4>
                          <p className={`text-sm font-medium leading-snug ${portal.mutedClass}`}>{feature.desc}</p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </motion.article>
            );
          })}
        </div>

        {/* CTA */}
        <div className="mt-[clamp(2.5rem,5vw,4rem)] flex flex-wrap items-center gap-x-6 gap-y-3">
          <Link
            href="/contact"
            className="group inline-flex items-center gap-3 bg-[#ff5400] text-[#111] px-8 py-4 font-bold uppercase tracking-widest text-sm transition-colors hover:bg-white"
          >
            Get It For Your School
            <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </Link>
          <p className="text-[#a0aab8] text-sm font-medium m-0">
            Tell us about your school and we&apos;ll walk you through both portals.
          </p>
        </div>

      </div>
    </section>
  );
}
