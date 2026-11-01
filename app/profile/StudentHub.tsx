"use client";

import { useMemo, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft, ArrowUpRight, Award, Box, CalendarCheck, Check, Clock, Copy, FlaskConical, Hammer, IdCard,
  LayoutDashboard, Lock, LogOut, Mail, School, Sparkles, Users,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import BlueprintDiagram from "@/app/projects/[slug]/BlueprintDiagram";
import type { HubData } from "@/lib/student/hub";
import { badges, summarise } from "@/lib/student/badges";
import { CHALLENGES, labTopicId } from "@/lib/student/lab";
import { LEVEL_INFO, PROJECTS, levelForClass, projectTopicId, type ProjectLevel, type StudentProject } from "@/lib/student/projects";
import { saveProjectSteps } from "@/app/actions/studentHubActions";
import VirtualLab from "./VirtualLab";

type Tab = "overview" | "projects" | "lab";

// The 3D starter-kit labs at /kits (its own Back button returns students here).
const KITS = [
  { label: "Arduino", href: "/kits/arduino" },
  { label: "ESP", href: "/kits/esp" },
  { label: "Raspberry Pi", href: "/kits/pi" },
] as const;
type Row = HubData["progress"][number];

const STATUS_COLOUR: Record<string, string> = {
  present: "bg-emerald-400",
  late: "bg-amber-400",
  half_day: "bg-amber-300",
  absent: "bg-rose-500",
  excused: "bg-sky-400",
  on_leave: "bg-sky-400",
};

export default function StudentHub({ data }: { data: HubData }) {
  const [tab, setTab] = useState<Tab>("overview");
  const [rows, setRows] = useState<Row[]>(data.progress);
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const recommended = levelForClass(data.classNumber);

  const byTopic = useMemo(() => new Map(rows.map((r) => [r.topic_id, r])), [rows]);
  const summary = useMemo(() => summarise(rows), [rows]);
  const earned = useMemo(() => badges(summary, data.attendance?.rate ?? null), [summary, data.attendance]);
  const solved = useMemo(() => new Set(CHALLENGES.filter((c) => byTopic.get(labTopicId(c.id))?.is_completed).map((c) => c.id)), [byTopic]);

  /** Keep the page in step after a save without waiting for a reload. */
  const upsertLocal = (topic_id: string, pct: number, done: boolean) =>
    setRows((prev) => [
      ...prev.filter((r) => r.topic_id !== topic_id),
      { topic_id, progress_percentage: pct, is_completed: done, last_watched_at: new Date().toISOString() },
    ]);

  const goTo = (key: Tab) => {
    setTab(key);
    if (key !== "projects") setOpenSlug(null);
    window.scrollTo({ top: 0 });
  };

  const openProject = (slug: string) => {
    setOpenSlug(slug);
    setTab("projects");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const logout = async () => {
    await createClient().auth.signOut();
    window.location.href = "/login";
  };

  const tabs: { key: Tab; label: string; short: string; icon: typeof LayoutDashboard }[] = [
    { key: "overview", label: "My Profile", short: "Profile", icon: LayoutDashboard },
    { key: "projects", label: "Projects & Blueprints", short: "Projects", icon: Hammer },
    { key: "lab", label: "Virtual Lab", short: "Lab", icon: FlaskConical },
  ];

  return (
    <div className="min-h-screen bg-[#07080c] font-[family-name:var(--font-jakarta)] text-zinc-100">
      {/* Ambient glow */}
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[32rem] w-[32rem] rounded-full bg-orange-500/10 blur-3xl" />
        <div className="absolute -right-40 top-1/3 h-[28rem] w-[28rem] rounded-full bg-sky-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-[24rem] w-[24rem] rounded-full bg-violet-500/10 blur-3xl" />
      </div>

      {/* Top bar. Phones: logo, current section and log out (sections move to the bottom bar).
          Tablets: pill nav with short labels. Desktop: full labels. */}
      <header className="sticky top-0 z-30 border-b border-white/5 bg-[#07080c]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 max-md:py-2.5 md:py-3">
          <Link href="/" className="flex shrink-0 items-center gap-2">
            <Image src="/favicon-48.png" alt="Radix Robotics" width={34} height={34} className="rounded-lg" />
            <span className="font-bold tracking-tight max-lg:hidden">Radix Student</span>
          </Link>
          <p className="min-w-0 flex-1 truncate font-bold md:hidden" aria-live="polite">{tabs.find((t) => t.key === tab)?.label}</p>
          {/* Display only in variant pairs: a plain `flex` would beat `max-md:hidden` (see app/styles/theme.css). */}
          <nav aria-label="Profile sections" className="flex-1 justify-center gap-1 max-md:hidden md:flex">
            {tabs.map(({ key, label, short, icon: Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => goTo(key)}
                aria-current={tab === key ? "page" : undefined}
                className={`flex items-center gap-2 whitespace-nowrap rounded-full py-2 text-sm font-semibold transition max-lg:px-3 lg:px-4 ${
                  tab === key ? "bg-white text-zinc-950" : "text-zinc-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon aria-hidden className="h-4 w-4" />
                <span className="max-lg:hidden">{label}</span>
                <span className="lg:hidden">{short}</span>
              </button>
            ))}
            <Link href="/kits" className="flex items-center gap-2 whitespace-nowrap rounded-full py-2 text-sm font-semibold text-zinc-400 transition hover:bg-white/5 hover:text-white max-lg:px-3 lg:px-4">
              <Box aria-hidden className="h-4 w-4" />
              <span className="max-lg:hidden">3D Kits</span>
              <span className="lg:hidden">Kits</span>
            </Link>
          </nav>
          <button type="button" onClick={logout} aria-label="Log out"
            className="flex shrink-0 items-center gap-2 rounded-full border border-white/10 text-sm text-zinc-300 hover:bg-white/5 max-lg:p-2.5 lg:px-3 lg:py-2">
            <LogOut aria-hidden className="h-4 w-4" />
            <span className="max-lg:hidden">Log out</span>
          </button>
        </div>
      </header>

      {/* Phones: app-style bottom tab bar, clear of the home indicator. */}
      <nav aria-label="Profile sections" className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-[#07080c]/90 backdrop-blur-xl pb-[env(safe-area-inset-bottom)] md:hidden">
        <div className="grid grid-cols-4">
          {tabs.map(({ key, short, icon: Icon }) => (
            <button key={key} type="button" onClick={() => goTo(key)} aria-current={tab === key ? "page" : undefined}
              className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold transition ${tab === key ? "text-white" : "text-zinc-500"}`}>
              <span className={`grid h-8 w-12 place-items-center rounded-full transition ${tab === key ? "bg-white text-zinc-950" : ""}`}>
                <Icon aria-hidden className="h-[18px] w-[18px]" />
              </span>
              {short}
            </button>
          ))}
          <Link href="/kits" className="flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold text-zinc-500">
            <span className="grid h-8 w-12 place-items-center rounded-full"><Box aria-hidden className="h-[18px] w-[18px]" /></span>
            3D Kits
          </Link>
        </div>
      </nav>

      <main className="relative mx-auto max-w-7xl px-4 max-md:pb-28 max-md:pt-6 md:py-8">
        {!data.progressReady && (
          <p role="status" className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            Progress saving isn&apos;t switched on for your school yet, so ticks and badges won&apos;t be kept after you leave. Everything else works.
          </p>
        )}

        {tab === "overview" && (
          <Overview data={data} rows={rows} summary={summary} earned={earned} solvedCount={solved.size}
            recommended={recommended} byTopic={byTopic} onOpenProject={openProject} onOpenLab={() => goTo("lab")} />
        )}
        {tab === "projects" && (
          openSlug ? (
            <ProjectDetail
              key={openSlug}
              project={PROJECTS.find((p) => p.slug === openSlug)!}
              done={stepsDoneFor(byTopic.get(projectTopicId(openSlug)), PROJECTS.find((p) => p.slug === openSlug)!)}
              onBack={() => setOpenSlug(null)}
              onSaved={upsertLocal}
            />
          ) : (
            <ProjectGallery recommended={recommended} byTopic={byTopic} onOpen={openProject} />
          )
        )}
        {tab === "lab" && (
          <VirtualLab solved={solved} onSolved={(id) => upsertLocal(labTopicId(id), 100, true)} />
        )}
      </main>
    </div>
  );
}

function stepsDoneFor(row: Row | undefined, p: StudentProject) {
  if (!row) return 0;
  return row.is_completed ? p.steps.length : Math.round((row.progress_percentage / 100) * p.steps.length);
}

/* ------------------------------------------------------------------ overview */

function Overview({ data, rows, summary, earned, solvedCount, recommended, byTopic, onOpenProject, onOpenLab }: {
  data: HubData;
  rows: Row[];
  summary: ReturnType<typeof summarise>;
  earned: ReturnType<typeof badges>;
  solvedCount: number;
  recommended: ProjectLevel | null;
  byTopic: Map<string, Row>;
  onOpenProject: (slug: string) => void;
  onOpenLab: () => void;
}) {
  const initials = data.name.split(/\s+/).map((w) => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
  const level = recommended ? LEVEL_INFO[recommended] : null;
  const inProgress = PROJECTS.filter((p) => {
    const r = byTopic.get(projectTopicId(p.slug));
    return r && r.progress_percentage > 0 && !r.is_completed;
  });
  const suggestions = PROJECTS.filter((p) => (!recommended || p.level === recommended) && !byTopic.get(projectTopicId(p.slug))).slice(0, 3);
  const earnedCount = earned.filter((b) => b.earned).length;

  return (
    <div className="space-y-6">
      {/* Identity */}
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900 to-zinc-950 p-6">
        <div aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_85%_20%,rgba(251,146,60,0.18),transparent_45%)]" />
        <div className="relative flex gap-6 max-md:flex-col md:items-center">
          <div className="grid h-24 w-24 shrink-0 place-items-center rounded-3xl bg-gradient-to-br from-orange-400 via-rose-500 to-violet-600 text-3xl font-black text-white shadow-[0_0_40px_rgba(251,146,60,0.35)]">
            {initials || "?"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-orange-300">Welcome back 👋</p>
            <h1 className="mt-1 text-3xl font-black tracking-tight">{data.name}</h1>
            {data.username && <p className="mt-1 font-mono text-sm text-zinc-400">@{data.username}</p>}
            <div className="mt-4 flex flex-wrap gap-2 text-sm">
              {(data.institutionName || data.schoolName) && <Chip icon={School}>{data.institutionName ?? data.schoolName}</Chip>}
              {data.className && <Chip icon={Users}>{data.className}</Chip>}
              {data.studentCode && <Chip icon={IdCard}><span className="font-mono">{data.studentCode}</span></Chip>}
              {data.contactEmail && <Chip icon={Mail}>{data.contactEmail}</Chip>}
            </div>
          </div>
          {level && (
            <div className="rounded-2xl border px-5 py-4 text-center" style={{ borderColor: `${level.accent}55`, background: `${level.accent}12` }}>
              <p className="text-xs uppercase tracking-widest text-zinc-400">Your level</p>
              <p className="mt-1 text-2xl font-black" style={{ color: level.accent }}>{level.label}</p>
              <p className="text-xs text-zinc-400">{level.classes}</p>
            </div>
          )}
        </div>
      </section>

      {/* Stats */}
      <section aria-label="Your numbers" className="grid gap-4 max-md:grid-cols-2 md:grid-cols-4">
        <Stat label="Projects finished" value={summary.projectsDone} sub={`${summary.projectsStarted} started`} accent="#fb923c" />
        <Stat label="Lab challenges" value={`${solvedCount}/${CHALLENGES.length}`} sub="solved" accent="#38bdf8" />
        <Stat label="Active days" value={summary.activeDays} sub="in the last 7 days" accent="#a78bfa" />
        <Stat label="Attendance" value={data.attendance?.rate != null ? `${data.attendance.rate}%` : "—"} sub={data.attendance ? "last 90 days" : "not recorded"} accent="#34d399" />
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Badges */}
        <section className="rounded-3xl border border-white/10 bg-zinc-900/60 p-6 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-bold"><Award aria-hidden className="h-5 w-5 text-amber-300" /> Badges</h2>
            <span className="text-sm text-zinc-400">{earnedCount} of {earned.length} earned</span>
          </div>
          <ul className="grid gap-3 max-sm:grid-cols-2 sm:grid-cols-4">
            {earned.map((b) => (
              <li key={b.id} title={b.description}
                className={`relative rounded-2xl border p-4 text-center transition ${b.earned ? "border-amber-300/40 bg-amber-300/10" : "border-white/5 bg-white/[0.02] opacity-60"}`}>
                <div className={`text-3xl ${b.earned ? "" : "grayscale"}`} aria-hidden>{b.icon}</div>
                <p className="mt-2 text-sm font-bold">{b.name}</p>
                <p className="mt-0.5 text-xs text-zinc-400">{b.description}</p>
                {!b.earned && b.progress && <p className="mt-1 font-mono text-xs text-zinc-500">{b.progress}</p>}
                {!b.earned && <Lock aria-label="Not earned yet" className="absolute right-2 top-2 h-3.5 w-3.5 text-zinc-600" />}
              </li>
            ))}
          </ul>
        </section>

        {/* Attendance */}
        <section className="rounded-3xl border border-white/10 bg-zinc-900/60 p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold"><CalendarCheck aria-hidden className="h-5 w-5 text-emerald-300" /> Attendance</h2>
          {data.attendance ? (
            <>
              <div className="flex items-center gap-5">
                <Ring pct={data.attendance.rate ?? 0} />
                <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  <dt className="text-zinc-400">Present</dt><dd className="font-semibold">{data.attendance.present}</dd>
                  <dt className="text-zinc-400">Late</dt><dd className="font-semibold">{data.attendance.late}</dd>
                  <dt className="text-zinc-400">Absent</dt><dd className="font-semibold">{data.attendance.absent}</dd>
                  <dt className="text-zinc-400">Classes</dt><dd className="font-semibold">{data.attendance.total}</dd>
                </dl>
              </div>
              <p className="mb-2 mt-5 text-xs uppercase tracking-wider text-zinc-500">Recent classes</p>
              <ul className="flex flex-wrap gap-1.5">
                {[...data.attendance.recent].reverse().map((d, i) => (
                  <li key={i} title={`${d.date}: ${d.status.replace("_", " ")}`} className={`h-4 w-4 rounded ${STATUS_COLOUR[d.status] ?? "bg-zinc-600"}`}>
                    <span className="sr-only">{d.date}: {d.status.replace("_", " ")}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="text-sm text-zinc-400">Your school hasn&apos;t recorded attendance for you here yet.</p>
          )}
        </section>
      </div>

      {/* My projects */}
      <section className="rounded-3xl border border-white/10 bg-zinc-900/60 p-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold"><Hammer aria-hidden className="h-5 w-5 text-orange-300" /> My projects</h2>
        {inProgress.length > 0 && (
          <>
            <p className="mb-2 text-xs uppercase tracking-wider text-zinc-500">Keep going</p>
            <div className="mb-6 grid gap-3 md:grid-cols-2">
              {inProgress.map((p) => <ProjectCard key={p.slug} project={p} row={byTopic.get(projectTopicId(p.slug))} onOpen={onOpenProject} compact />)}
            </div>
          </>
        )}
        {PROJECTS.some((p) => byTopic.get(projectTopicId(p.slug))?.is_completed) && (
          <>
            <p className="mb-2 text-xs uppercase tracking-wider text-zinc-500">Finished 🎉</p>
            <div className="mb-6 flex flex-wrap gap-2">
              {PROJECTS.filter((p) => byTopic.get(projectTopicId(p.slug))?.is_completed).map((p) => (
                <button key={p.slug} type="button" onClick={() => onOpenProject(p.slug)} className="flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5 text-sm text-emerald-200 hover:bg-emerald-400/20">
                  <Check aria-hidden className="h-3.5 w-3.5" /> {p.title}
                </button>
              ))}
            </div>
          </>
        )}
        {suggestions.length > 0 && (
          <>
            <p className="mb-2 text-xs uppercase tracking-wider text-zinc-500">{rows.length ? "Try next" : "Start your first project"}</p>
            <div className="grid gap-3 md:grid-cols-3">
              {suggestions.map((p) => <ProjectCard key={p.slug} project={p} row={undefined} onOpen={onOpenProject} />)}
            </div>
          </>
        )}
      </section>

      {/* 3D starter kits */}
      <section className="overflow-hidden rounded-3xl border border-amber-300/20 bg-gradient-to-br from-amber-400/10 via-zinc-900/60 to-zinc-950">
        <div className="flex max-md:flex-col">
          <Link href="/kits" className="relative block shrink-0 overflow-hidden max-md:h-56 md:w-72">
            <Image src="/kits sec.png" alt="Radix STEAM kits: bins of gears, structures, sensors and built robot cars" fill sizes="(min-width: 768px) 18rem, 100vw"
              className="object-cover transition duration-500 hover:scale-105" />
          </Link>
          <div className="flex flex-1 flex-col justify-center gap-4 p-6">
            <div>
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-300"><Box aria-hidden className="h-4 w-4" /> Interactive 3D</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight">Radix Starter Kits in 3D</h2>
              <p className="mt-1 text-sm text-zinc-400">Spin, zoom and explore every part of your starter kit, then follow the guided builds for each board.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/kits" className="flex items-center gap-2 rounded-full bg-amber-300 px-5 py-2.5 text-sm font-bold text-zinc-950 hover:bg-amber-200">
                Open the 3D Starter Kit <ArrowUpRight aria-hidden className="h-4 w-4" />
              </Link>
              {KITS.map((k) => (
                <Link key={k.href} href={k.href} className="rounded-full border border-white/15 px-4 py-2.5 text-sm font-semibold text-zinc-200 hover:bg-white/5">
                  {k.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Lab teaser */}
      <button type="button" onClick={onOpenLab}
        className="group flex w-full items-center gap-5 overflow-hidden rounded-3xl border border-sky-400/20 bg-gradient-to-r from-sky-500/15 via-indigo-500/10 to-transparent p-6 text-left transition hover:border-sky-400/50">
        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-sky-400/20"><FlaskConical aria-hidden className="h-7 w-7 text-sky-300" /></div>
        <div className="flex-1">
          <p className="text-lg font-bold">Enter the Virtual Lab</p>
          <p className="text-sm text-zinc-400">Program LEDs, a buzzer and sensors on a virtual robot board — no kit needed. {CHALLENGES.length - solvedCount} challenges waiting.</p>
        </div>
        <ArrowUpRight aria-hidden className="h-6 w-6 text-sky-300 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
      </button>
    </div>
  );
}

function Chip({ icon: Icon, children }: { icon: typeof School; children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-zinc-300">
      <Icon aria-hidden className="h-3.5 w-3.5 text-zinc-500" /> {children}
    </span>
  );
}

function Stat({ label, value, sub, accent }: { label: string; value: React.ReactNode; sub: string; accent: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-5">
      <p className="text-xs uppercase tracking-wider text-zinc-500">{label}</p>
      <p className="mt-2 text-3xl font-black tabular-nums" style={{ color: accent }}>{value}</p>
      <p className="text-xs text-zinc-500">{sub}</p>
    </div>
  );
}

function Ring({ pct }: { pct: number }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  const colour = pct >= 90 ? "#34d399" : pct >= 75 ? "#fbbf24" : "#fb7185";
  return (
    <svg viewBox="0 0 80 80" className="h-24 w-24 shrink-0" role="img" aria-label={`Attendance ${pct}%`}>
      <circle cx="40" cy="40" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
      <circle cx="40" cy="40" r={r} fill="none" stroke={colour} strokeWidth="8" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c * (1 - Math.min(pct, 100) / 100)} transform="rotate(-90 40 40)" />
      <text x="40" y="45" textAnchor="middle" fontSize="14" fontWeight="800" fill="#fff">{pct}%</text>
    </svg>
  );
}

/* ------------------------------------------------------------------ projects */

function ProjectCard({ project: p, row, onOpen, compact }: { project: StudentProject; row: Row | undefined; onOpen: (slug: string) => void; compact?: boolean }) {
  const lv = LEVEL_INFO[p.level];
  const pct = row?.progress_percentage ?? 0;
  return (
    <button type="button" onClick={() => onOpen(p.slug)}
      className="group flex h-full flex-col rounded-2xl border border-white/10 bg-zinc-950/60 p-5 text-left transition hover:-translate-y-0.5 hover:border-white/25">
      <div className="flex items-center justify-between gap-2">
        <span className="rounded-full px-2.5 py-0.5 text-xs font-bold" style={{ color: lv.accent, background: `${lv.accent}1f` }}>{lv.label} · Class {p.grades[0]}–{p.grades[1]}</span>
        {row?.is_completed && <span className="flex items-center gap-1 text-xs font-semibold text-emerald-300"><Check aria-hidden className="h-3.5 w-3.5" /> Done</span>}
      </div>
      <h3 className="mt-3 text-lg font-bold leading-snug group-hover:text-white">{p.title}</h3>
      <p className="mt-1 text-sm italic text-zinc-400">{p.mission}</p>
      {!compact && <p className="mt-3 line-clamp-3 text-sm text-zinc-400">{p.summary}</p>}
      <div className="mt-auto pt-4">
        <div className="flex items-center justify-between text-xs text-zinc-500">
          <span className="flex items-center gap-1"><Clock aria-hidden className="h-3.5 w-3.5" /> {p.duration}</span>
          <span>{pct}%</span>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/5">
          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: lv.accent }} />
        </div>
      </div>
    </button>
  );
}

function ProjectGallery({ recommended, byTopic, onOpen }: { recommended: ProjectLevel | null; byTopic: Map<string, Row>; onOpen: (slug: string) => void }) {
  const [level, setLevel] = useState<ProjectLevel | "all">(recommended ?? "all");
  const shown = PROJECTS.filter((p) => level === "all" || p.level === level);
  const filters: (ProjectLevel | "all")[] = ["all", "primary", "intermediate", "advanced"];
  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Projects &amp; Blueprints</h1>
          <p className="mt-1 text-zinc-400">Real builds with a blueprint, parts list, wiring map and step-by-step guide. Tick steps as you go.</p>
        </div>
        <div role="group" aria-label="Filter by level" className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <button key={f} type="button" onClick={() => setLevel(f)} aria-pressed={level === f}
              className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition ${level === f ? "border-white bg-white text-zinc-950" : "border-white/10 text-zinc-300 hover:bg-white/5"}`}>
              {f === "all" ? "All" : `${LEVEL_INFO[f].label} · ${LEVEL_INFO[f].classes}`}
              {f === recommended && <Sparkles aria-label="recommended for you" className="ml-1 inline h-3.5 w-3.5 text-amber-400" />}
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-4 max-md:grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
        {shown.map((p) => <ProjectCard key={p.slug} project={p} row={byTopic.get(projectTopicId(p.slug))} onOpen={onOpen} />)}
      </div>
    </div>
  );
}

function ProjectDetail({ project: p, done: initialDone, onBack, onSaved }: {
  project: StudentProject;
  done: number;
  onBack: () => void;
  onSaved: (topic: string, pct: number, done: boolean) => void;
}) {
  const [done, setDone] = useState(initialDone);
  const [view, setView] = useState<"blueprint" | "parts" | "wiring">("blueprint");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const lv = LEVEL_INFO[p.level];
  const total = p.steps.length;

  const setSteps = (n: number) => {
    const before = done;
    setDone(n);
    setError(null);
    start(async () => {
      const r = await saveProjectSteps(p.slug, n);
      if (r.ok) onSaved(projectTopicId(p.slug), Math.round((100 * n) / total), n === total);
      else { setDone(before); setError(r.error); }
    });
  };

  return (
    <article>
      <button type="button" onClick={onBack} className="mb-6 flex items-center gap-2 text-sm text-zinc-400 hover:text-white">
        <ArrowLeft aria-hidden className="h-4 w-4" /> All projects
      </button>

      <header className="mb-6">
        <span className="rounded-full px-2.5 py-0.5 text-xs font-bold" style={{ color: lv.accent, background: `${lv.accent}1f` }}>{lv.label} · Class {p.grades[0]}–{p.grades[1]} · {p.duration}</span>
        <h1 className="mt-3 text-4xl font-black tracking-tight">{p.title}</h1>
        <p className="mt-2 text-lg italic text-zinc-300">{p.mission}</p>
        <p className="mt-3 max-w-3xl text-zinc-400">{p.summary}</p>
        <ul className="mt-4 flex flex-wrap gap-2">
          {p.skills.map((s) => <li key={s} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-300">{s}</li>)}
        </ul>
      </header>

      {/* Blueprint sheet */}
      <section className="mb-8 overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/60">
        <div role="tablist" aria-label="Blueprint views" className="flex gap-1 border-b border-white/10 p-2">
          {(["blueprint", "parts", "wiring"] as const).map((v) => (
            <button key={v} role="tab" type="button" aria-selected={view === v} onClick={() => setView(v)}
              className={`rounded-xl px-4 py-2 text-sm font-semibold capitalize ${view === v ? "bg-white/10 text-white" : "text-zinc-400 hover:text-white"}`}>
              {v === "blueprint" ? "System blueprint" : v === "parts" ? `Parts (${p.blueprint.bom.length})` : "Wiring map"}
            </button>
          ))}
          <span className="ml-auto self-center pr-2 font-mono text-xs text-zinc-500 max-sm:hidden">DWG {p.blueprint.drawingNo}</span>
        </div>
        <div className="p-4">
          {view === "blueprint" && <div className="overflow-x-auto"><div className="min-w-[640px]"><BlueprintDiagram build={p} /></div></div>}
          {view === "parts" && (
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs uppercase tracking-wider text-zinc-500"><th className="py-2 pr-4">Part</th><th className="py-2 pr-4">Qty</th><th className="py-2">Spec</th></tr></thead>
              <tbody className="divide-y divide-white/5">
                {p.blueprint.bom.map((b) => <tr key={b.part}><td className="py-2.5 pr-4 font-semibold">{b.part}</td><td className="py-2.5 pr-4 tabular-nums">{b.qty}</td><td className="py-2.5 text-zinc-400">{b.spec}</td></tr>)}
              </tbody>
            </table>
          )}
          {view === "wiring" && (
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs uppercase tracking-wider text-zinc-500"><th className="py-2 pr-4">From</th><th className="py-2 pr-4">To</th><th className="py-2">Signal</th></tr></thead>
              <tbody className="divide-y divide-white/5">
                {p.blueprint.wiring.map((w, i) => <tr key={i}><td className="py-2.5 pr-4 font-mono text-xs">{w.from}</td><td className="py-2.5 pr-4 font-mono text-xs text-sky-300">{w.to}</td><td className="py-2.5 text-zinc-400">{w.signal}</td></tr>)}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* Steps */}
      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-black">Build it, step by step</h2>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-zinc-400">{done}/{total} steps</span>
            <div className="h-2 w-40 overflow-hidden rounded-full bg-white/5"><div className="h-full rounded-full transition-all" style={{ width: `${(100 * done) / total}%`, background: lv.accent }} /></div>
          </div>
        </div>
        {error && <p role="alert" className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</p>}
        {done === total && <p role="status" className="mb-4 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">🎉 Project complete! Show your build to your teacher.</p>}
        <ol className="space-y-3">
          {p.steps.map((s, i) => {
            const isDone = i < done;
            const isNext = i === done;
            return (
              <li key={i} className={`rounded-2xl border p-5 transition ${isDone ? "border-emerald-400/20 bg-emerald-400/[0.04]" : isNext ? "border-white/20 bg-zinc-900/80" : "border-white/5 bg-zinc-900/40"}`}>
                <div className="flex gap-4">
                  <button type="button" disabled={pending || (!isDone && !isNext)}
                    onClick={() => setSteps(isDone ? i : i + 1)}
                    aria-label={isDone ? `Mark step ${i + 1} as not done` : `Mark step ${i + 1} as done`}
                    className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 text-sm font-bold transition disabled:cursor-not-allowed ${
                      isDone ? "border-emerald-400 bg-emerald-400 text-zinc-950" : isNext ? "border-white/60 hover:border-white hover:bg-white/10" : "border-white/15 text-zinc-600"
                    }`}>
                    {isDone ? <Check aria-hidden className="h-4 w-4" /> : i + 1}
                  </button>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold">{s.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-zinc-400">{s.body}</p>
                    {s.code && <CodeBlock code={s.code} />}
                    {s.check && <p className="mt-3 text-xs text-emerald-300/80">✔ Check: {s.check}</p>}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
        {p.fullGuideHref && (
          <Link href={p.fullGuideHref} className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-zinc-950 hover:bg-zinc-200">
            Open the full engineering guide <ArrowUpRight aria-hidden className="h-4 w-4" />
          </Link>
        )}
      </section>
    </article>
  );
}

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="relative mt-3">
      <button type="button" onClick={async () => { try { await navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* clipboard blocked */ } }}
        className="absolute right-2 top-2 flex items-center gap-1 rounded-lg border border-white/10 bg-zinc-900 px-2 py-1 text-xs text-zinc-300 hover:bg-zinc-800">
        {copied ? <Check aria-hidden className="h-3.5 w-3.5" /> : <Copy aria-hidden className="h-3.5 w-3.5" />} {copied ? "Copied" : "Copy"}
      </button>
      <pre className="max-h-96 overflow-auto rounded-xl border border-white/10 bg-black/60 p-4 pr-20 font-mono text-xs leading-relaxed text-zinc-200"><code>{code}</code></pre>
    </div>
  );
}
