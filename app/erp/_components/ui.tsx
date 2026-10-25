import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { ATTENDANCE_STATUS_LABELS, INSTITUTION_TYPE_LABELS, type AttendanceStatus, type InstitutionType } from "@/lib/erp/types";

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

export const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950";

export function PageHeader({
  title,
  description,
  crumbs = [],
  actions,
}: {
  title: string;
  description?: ReactNode;
  crumbs?: { href?: string; label: string }[];
  actions?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        {crumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="mb-2">
            <ol className="flex flex-wrap items-center gap-1 text-xs text-zinc-500">
              {crumbs.map((c, i) => (
                <li key={i} className="flex items-center gap-1">
                  {c.href ? (
                    <Link href={c.href} className={cx("rounded hover:text-zinc-100 hover:underline", focusRing)}>
                      {c.label}
                    </Link>
                  ) : (
                    <span aria-current="page">{c.label}</span>
                  )}
                  {i < crumbs.length - 1 && <ChevronRight aria-hidden className="h-3 w-3" />}
                </li>
              ))}
            </ol>
          </nav>
        )}
        <h1 className="font-[family-name:var(--font-space-grotesk)] text-2xl font-bold tracking-tight text-white">
          {title}
        </h1>
        {description && <p className="mt-1 max-w-3xl text-sm text-zinc-400">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

export function Card({ title, actions, children, className, bodyClassName }: {
  title?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cx("min-w-0 rounded-2xl border border-zinc-800/50 bg-zinc-900/50", className)}>
      {(title || actions) && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/60 px-4 py-3 sm:px-5">
          {title && <h2 className="text-sm font-semibold text-zinc-100">{title}</h2>}
          {actions}
        </div>
      )}
      <div className={cx("p-4 sm:p-5", bodyClassName)}>{children}</div>
    </section>
  );
}

export function StatCard({ label, value, hint, tone = "default", href, chart, icon, accent }: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: "default" | "good" | "warn" | "bad";
  href?: string;
  /** Optional mini chart (e.g. a Sparkline) under the figures. */
  chart?: ReactNode;
  /** Optional icon shown in a tinted badge, with its accent colour (hex). */
  icon?: ReactNode;
  accent?: string;
}) {
  const toneBar = { default: "bg-zinc-700", good: "bg-emerald-500", warn: "bg-amber-500", bad: "bg-rose-500" }[tone];
  const body = (
    <>
      <span aria-hidden className={cx("absolute inset-y-3 left-0 w-1 rounded-r", toneBar)} />
      {icon && (
        <span aria-hidden className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-xl [&>svg]:h-[18px] [&>svg]:w-[18px]"
          style={{ color: accent, background: `color-mix(in srgb, ${accent} 14%, transparent)`, boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${accent} 28%, transparent)` }}>
          {icon}
        </span>
      )}
      <p className={cx("text-xs font-medium uppercase tracking-wide text-zinc-500", !!icon && "pr-10")}>{label}</p>
      <p className="mt-1 font-[family-name:var(--font-space-grotesk)] text-2xl font-semibold tabular-nums text-zinc-100">{value}</p>
      {hint && <p className="mt-1 text-xs text-zinc-500">{hint}</p>}
      {chart}
    </>
  );
  const cls = "relative block min-w-0 rounded-2xl border border-zinc-800/50 bg-zinc-900/50 p-4 pl-5";
  return href ? (
    <Link href={href} className={cx(cls, "transition-colors hover:border-zinc-700", focusRing)}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

const BADGE_TONES = {
  neutral: "bg-zinc-800 text-zinc-300 ring-zinc-700",
  green: "bg-emerald-500/10 text-emerald-300 ring-emerald-500/25",
  red: "bg-rose-500/10 text-rose-300 ring-rose-500/25",
  amber: "bg-amber-500/10 text-amber-300 ring-amber-500/25",
  sky: "bg-sky-500/10 text-sky-300 ring-sky-500/25",
  violet: "bg-violet-500/10 text-violet-300 ring-violet-500/25",
  dark: "bg-zinc-100 text-zinc-900 ring-zinc-100",
} as const;
export type BadgeTone = keyof typeof BADGE_TONES;

export function Badge({ tone = "neutral", children }: { tone?: BadgeTone; children: ReactNode }) {
  return (
    <span className={cx("inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset", BADGE_TONES[tone])}>
      {children}
    </span>
  );
}

export const ATTENDANCE_TONES: Record<AttendanceStatus, BadgeTone> = {
  present: "green",
  absent: "red",
  late: "amber",
  excused: "sky",
  half_day: "violet",
  on_leave: "neutral",
};

export function AttendanceBadge({ status }: { status: AttendanceStatus | null }) {
  if (!status) return <Badge>Unmarked</Badge>;
  return <Badge tone={ATTENDANCE_TONES[status]}>{ATTENDANCE_STATUS_LABELS[status]}</Badge>;
}

export function TypeBadge({ type }: { type: InstitutionType }) {
  const tone: BadgeTone = type === "school" ? "sky" : type === "learning_center" ? "violet" : "neutral";
  return <Badge tone={tone}>{INSTITUTION_TYPE_LABELS[type]}</Badge>;
}

export function StatusBadge({ status }: { status: string }) {
  const tone: BadgeTone =
    ({ active: "green", approved: "green", finalized: "dark", submitted: "sky", pending: "amber", draft: "amber",
       rejected: "red", inactive: "neutral", archived: "neutral", cancelled: "neutral", left: "neutral", graduated: "violet" } as Record<string, BadgeTone>)[status] ?? "neutral";
  return <Badge tone={tone}>{status.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase())}</Badge>;
}

export function EmptyState({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-zinc-700 px-6 py-10 text-center">
      <p className="text-sm font-medium text-zinc-100">{title}</p>
      {children && <div className="mx-auto mt-1 max-w-md text-sm text-zinc-400">{children}</div>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

export function Notice({ tone = "info", children }: { tone?: "info" | "success" | "error" | "warn"; children: ReactNode }) {
  const cls = {
    info: "border-sky-500/30 bg-sky-500/10 text-sky-300",
    success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    error: "border-rose-500/30 bg-rose-500/10 text-rose-300",
    warn: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  }[tone];
  return (
    <div role={tone === "error" ? "alert" : "status"} className={cx("rounded-lg border px-4 py-3 text-sm", cls)}>
      {children}
    </div>
  );
}

const BUTTON_VARIANTS = {
  primary: "bg-brand-500 font-bold text-zinc-950 hover:bg-brand-400 disabled:bg-zinc-800 disabled:text-zinc-600",
  secondary: "border border-zinc-700 bg-zinc-900/60 text-zinc-200 hover:bg-zinc-800 hover:text-white disabled:text-zinc-600",
  danger: "border border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 disabled:opacity-50",
  ghost: "text-zinc-400 hover:bg-zinc-800 hover:text-white",
} as const;
export type ButtonVariant = keyof typeof BUTTON_VARIANTS;

export function buttonClass(variant: ButtonVariant = "primary", size: "sm" | "md" = "md") {
  return cx(
    "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-colors disabled:cursor-not-allowed",
    size === "sm" ? "px-2.5 py-1.5 text-xs" : "px-3.5 py-2 text-sm",
    BUTTON_VARIANTS[variant],
    focusRing
  );
}

export function LinkButton({ href, variant = "primary", size = "md", children }: {
  href: string;
  variant?: ButtonVariant;
  size?: "sm" | "md";
  children: ReactNode;
}) {
  return (
    <Link href={href} className={buttonClass(variant, size)}>
      {children}
    </Link>
  );
}

export function Table({ children, caption }: { children: ReactNode; caption?: string }) {
  return (
    <div className="-mx-4 overflow-x-auto sm:mx-0">
      <table className="w-full min-w-[640px] border-collapse text-left text-sm">
        {caption && <caption className="sr-only">{caption}</caption>}
        {children}
      </table>
    </div>
  );
}

export const th = "border-b border-zinc-800 bg-zinc-950/40 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 first:pl-4 sm:first:pl-3";
export const td = "border-b border-zinc-800/60 px-3 py-2.5 align-middle text-zinc-200 first:pl-4 sm:first:pl-3";

export const inputClass = cx(
  "block w-full rounded-xl border border-zinc-800 bg-zinc-950/50 px-3 py-2 text-sm text-white placeholder:text-zinc-600 [color-scheme:dark]",
  "focus:border-brand-500/50 focus:outline-none focus:ring-1 focus:ring-brand-500/50 disabled:bg-zinc-900 disabled:text-zinc-500 aria-[invalid=true]:border-rose-500"
);

export function Field({ label, htmlFor, error, hint, children, required }: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: ReactNode;
  required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1 block text-sm font-medium text-zinc-200">
        {label}
        {required && <span className="text-rose-400" aria-hidden> *</span>}
      </label>
      {children}
      {hint && !error && <p id={`${htmlFor}-hint`} className="mt-1 text-xs text-zinc-500">{hint}</p>}
      {error && <p id={`${htmlFor}-error`} className="mt-1 text-xs font-medium text-rose-400">{error}</p>}
    </div>
  );
}

export function Pagination({ page, pageSize, total, hrefFor }: {
  page: number;
  pageSize: number;
  total: number;
  hrefFor: (page: number) => string;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;
  return (
    <nav aria-label="Pagination" className="mt-4 flex items-center justify-between text-sm text-zinc-400">
      <span>
        Page {page} of {pages} · {total} total
      </span>
      <div className="flex gap-2">
        {page > 1 ? <LinkButton variant="secondary" size="sm" href={hrefFor(page - 1)}>Previous</LinkButton> : null}
        {page < pages ? <LinkButton variant="secondary" size="sm" href={hrefFor(page + 1)}>Next</LinkButton> : null}
      </div>
    </nav>
  );
}

export function DescriptionList({ items }: { items: { label: string; value: ReactNode }[] }) {
  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
      {items.map((i) => (
        <div key={i.label}>
          <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">{i.label}</dt>
          <dd className="mt-0.5 text-sm text-zinc-100">{i.value ?? "—"}</dd>
        </div>
      ))}
    </dl>
  );
}
