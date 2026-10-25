import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { TONE_HEX, type NavTone } from "@/lib/erp/nav";
import { NavIcon } from "./navIcons";
import p from "./playful.module.css";

// Friendly, illustrated pieces for the ERP landing pages: a hero banner with a
// plain-language summary, colourful quick-action tiles, and small SVG scenes.

export function HeroBanner({ eyebrow, title, highlight, summary, art, accent = "brand", accent2 = "pink", children }: {
  eyebrow: string;
  title: string;
  /** Part of the title shown in the accent gradient. */
  highlight?: string;
  summary?: ReactNode;
  art?: ReactNode;
  accent?: NavTone;
  accent2?: NavTone;
  children?: ReactNode;
}) {
  return (
    <section className={p.hero} style={{ "--accent": TONE_HEX[accent], "--accent-2": TONE_HEX[accent2] } as CSSProperties}>
      <div className={p.heroText}>
        <span className={p.eyebrow}><i aria-hidden />{eyebrow}</span>
        <h1 className={p.title}>{title}{highlight && <> <span>{highlight}</span></>}</h1>
        {summary && <p className={p.summary}>{summary}</p>}
        {children && <div className={p.heroActions}>{children}</div>}
      </div>
      {art && <div className={p.art} aria-hidden>{art}</div>}
    </section>
  );
}

export type Tile = { href: string; label: string; hint: string; icon: string; tone: NavTone };

export function ActionTiles({ tiles, label = "Quick actions" }: { tiles: Tile[]; label?: string }) {
  if (tiles.length === 0) return null;
  return (
    <nav aria-label={label} className={p.tiles}>
      {tiles.map((t) => (
        <Link key={t.href} href={t.href} className={p.tileLink} style={{ "--tone": TONE_HEX[t.tone] } as CSSProperties}>
          <span className={p.tileIcon}><NavIcon name={t.icon} /></span>
          <span className={p.tileText}><strong>{t.label}</strong><small>{t.hint}</small></span>
        </Link>
      ))}
    </nav>
  );
}

/** "Good morning" / "Good afternoon" / "Good evening" in India time. */
export function greeting(now = new Date()) {
  const h = Number(new Intl.DateTimeFormat("en-IN", { hour: "numeric", hour12: false, timeZone: "Asia/Kolkata" }).format(now));
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

/* ---------- illustrations ---------- */

/** A cheerful robot holding a clipboard, for the dashboard. */
export function RobotArt() {
  return (
    <svg viewBox="0 0 260 200" width="100%">
      <ellipse cx="130" cy="186" rx="78" ry="8" fill="#000" opacity=".35" />
      <g className={p.spin}><circle cx="208" cy="40" r="22" fill="none" stroke="#ff7a38" strokeOpacity=".35" strokeDasharray="3 7" strokeWidth="2" /></g>
      <circle cx="208" cy="40" r="5" fill="#fbbf24" className={p.pulse} />
      <g className={p.float}>
        <line x1="130" y1="26" x2="130" y2="44" stroke="#a1a1aa" strokeWidth="3" strokeLinecap="round" />
        <circle cx="130" cy="22" r="7" fill="#ff5400" className={p.pulse} />
        <rect x="86" y="44" width="88" height="66" rx="22" fill="#27272a" stroke="#3f3f46" strokeWidth="2" />
        <rect x="98" y="56" width="64" height="40" rx="14" fill="#0b0b0d" />
        <g className={p.blinkEye}><circle cx="116" cy="76" r="7" fill="#34d399" /><circle cx="144" cy="76" r="7" fill="#34d399" /></g>
        <path d="M120 88 q10 7 20 0" fill="none" stroke="#34d399" strokeWidth="3" strokeLinecap="round" />
        <rect x="78" y="70" width="8" height="20" rx="4" fill="#3f3f46" /><rect x="174" y="70" width="8" height="20" rx="4" fill="#3f3f46" />
        <rect x="96" y="114" width="68" height="56" rx="16" fill="#27272a" stroke="#3f3f46" strokeWidth="2" />
        <circle cx="130" cy="134" r="8" fill="#ff7a38" opacity=".9" />
        <rect x="110" y="152" width="40" height="5" rx="2.5" fill="#3f3f46" />
        <g className={p.wave}><path d="M164 124 q22 -6 30 -26" fill="none" stroke="#52525b" strokeWidth="9" strokeLinecap="round" /><circle cx="196" cy="94" r="8" fill="#a1a1aa" /></g>
        <path d="M96 128 q-18 10 -16 30" fill="none" stroke="#52525b" strokeWidth="9" strokeLinecap="round" />
        <g transform="translate(52 138) rotate(-8)">
          <rect width="40" height="50" rx="6" fill="#f4f4f5" /><rect x="12" y="-4" width="16" height="8" rx="3" fill="#a1a1aa" />
          <path d="M8 16l4 4 7-8M8 30l4 4 7-8" fill="none" stroke="#10b981" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="22" y="15" width="12" height="3" rx="1.5" fill="#d4d4d8" /><rect x="22" y="29" width="12" height="3" rx="1.5" fill="#d4d4d8" />
          <rect x="8" y="41" width="26" height="3" rx="1.5" fill="#d4d4d8" />
        </g>
      </g>
      <g className={`${p.float} ${p.float2}`}><rect x="22" y="40" width="34" height="24" rx="6" fill="#38bdf8" opacity=".2" /><path d="M30 56l6-6 5 4 8-9" fill="none" stroke="#38bdf8" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></g>
      <g className={`${p.float} ${p.float3}`}><circle cx="226" cy="132" r="14" fill="#a78bfa" opacity=".2" /><path d="M220 132l4 4 8-8" fill="none" stroke="#a78bfa" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></g>
    </svg>
  );
}

/** Shelves of kits and parts, for inventory. */
export function ShelfArt() {
  const box = (x: number, y: number, w: number, h: number, c: string, lid: string) => (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="4" fill={c} />
      <rect x={x} y={y} width={w} height={h * 0.28} rx="4" fill={lid} />
      <rect x={x + w / 2 - 7} y={y + h * 0.45} width="14" height="6" rx="2" fill="#0b0b0d" opacity=".35" />
    </g>
  );
  return (
    <svg viewBox="0 0 260 200" width="100%">
      <ellipse cx="130" cy="188" rx="96" ry="7" fill="#000" opacity=".35" />
      <rect x="34" y="20" width="8" height="166" rx="3" fill="#3f3f46" /><rect x="218" y="20" width="8" height="166" rx="3" fill="#3f3f46" />
      {[74, 128, 182].map((y) => <rect key={y} x="30" y={y} width="200" height="7" rx="3" fill="#52525b" />)}
      {box(48, 38, 44, 36, "#d97706", "#fbbf24")}{box(98, 46, 36, 28, "#0284c7", "#38bdf8")}
      {box(140, 34, 50, 40, "#7c3aed", "#a78bfa")}{box(194, 50, 22, 24, "#059669", "#34d399")}
      {box(52, 98, 30, 30, "#db2777", "#f472b6")}{box(88, 90, 52, 38, "#ea580c", "#ff7a38")}{box(146, 102, 34, 26, "#0d9488", "#2dd4bf")}
      {box(48, 150, 58, 32, "#334155", "#64748b")}{box(112, 156, 30, 26, "#d97706", "#fbbf24")}
      <g className={p.float}>
        <rect x="150" y="140" width="56" height="40" rx="6" fill="#065f46" stroke="#10b981" strokeWidth="1.5" />
        {[0, 1, 2, 3, 4, 5].map((i) => <rect key={i} x={156 + i * 8} y="134" width="3" height="6" fill="#d4d4d8" />)}
        <rect x="166" y="150" width="24" height="18" rx="3" fill="#0b0b0d" />
        <circle cx="198" cy="148" r="3" fill="#fbbf24" className={p.pulse} />
      </g>
      <g className={`${p.float} ${p.float2}`}>
        <path d="M200 22 v-6 a8 8 0 0 1 16 0 v6z" fill="#ff5400" /><rect x="198" y="21" width="20" height="4" rx="1.5" fill="#c2410c" />
        <path d="M204 25v12M212 25v8" stroke="#a1a1aa" strokeWidth="2" strokeLinecap="round" />
        <circle cx="208" cy="14" r="14" fill="#ff7a38" opacity=".18" className={p.pulse} />
      </g>
      <g className={`${p.float} ${p.float3}`}>
        <path d="M10 112h30" stroke="#a1a1aa" strokeWidth="2" strokeLinecap="round" />
        <rect x="16" y="106" width="18" height="12" rx="6" fill="#dcc6a0" /><rect x="20" y="106" width="3" height="12" fill="#7a4a2a" /><rect x="26" y="106" width="3" height="12" fill="#d63a2f" />
      </g>
    </svg>
  );
}

/** A calendar with ticks, for attendance. */
export function CalendarArt() {
  const marks = ["#10b981", "#10b981", "#f59e0b", "#10b981", "#10b981", "#10b981", "#f43f5e", "#10b981", "#10b981", "#10b981", "#0ea5e9", "#10b981", "#10b981", "#10b981", "#10b981"];
  return (
    <svg viewBox="0 0 260 200" width="100%">
      <ellipse cx="130" cy="188" rx="86" ry="7" fill="#000" opacity=".35" />
      <g className={p.float}>
        <rect x="46" y="30" width="168" height="148" rx="16" fill="#18181b" stroke="#3f3f46" strokeWidth="2" />
        <rect x="46" y="30" width="168" height="34" rx="16" fill="#10b981" /><rect x="46" y="50" width="168" height="14" fill="#10b981" />
        <rect x="78" y="20" width="8" height="22" rx="4" fill="#d4d4d8" /><rect x="174" y="20" width="8" height="22" rx="4" fill="#d4d4d8" />
        {marks.map((c, i) => {
          const x = 62 + (i % 5) * 29, y = 78 + Math.floor(i / 5) * 32;
          return <rect key={i} x={x} y={y} width="22" height="22" rx="6" fill={c} opacity={i === 12 ? 1 : 0.85} className={i === 12 ? p.pulse : undefined} />;
        })}
      </g>
      <g className={`${p.float} ${p.float2}`}>
        <circle cx="212" cy="150" r="24" fill="#f4f4f5" />
        <path d="M201 150l8 8 15-16" fill="none" stroke="#10b981" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <g className={`${p.float} ${p.float3}`}><circle cx="34" cy="70" r="12" fill="#fbbf24" opacity=".25" /><circle cx="34" cy="70" r="5" fill="#fbbf24" /></g>
    </svg>
  );
}
