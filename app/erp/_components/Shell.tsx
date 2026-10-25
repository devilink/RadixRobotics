"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useOptimistic, useRef, useState, useSyncExternalStore, useTransition, type CSSProperties, type ReactNode } from "react";
import { ArrowLeft, ChevronDown, CornerDownLeft, LogOut, Menu, PanelLeftClose, PanelLeftOpen, Search, X, Zap } from "lucide-react";
import { TONE_HEX, type NavItem, type NavSection, type NavTone, type QuickAction } from "@/lib/erp/nav";
import { CATEGORIES, CATEGORY_LABELS, type Category } from "@/lib/erp/types";
import { setCategory, signOut } from "../actions";
import { cx } from "./ui";
import { NavIcon } from "./navIcons";
import s from "./Shell.module.css";

const Icon = ({ name }: { name: string }) => <NavIcon name={name} />;
const tone = (t: NavTone) => ({ "--tone": TONE_HEX[t] }) as CSSProperties;

function isActive(href: string, pathname: string, search: URLSearchParams) {
  const [path, query] = href.split("?");
  if (path === "/erp") return pathname === "/erp";
  const pathMatch =
    pathname === path ||
    (pathname.startsWith(`${path}/`) &&
      // Keep the overview entries from lighting up on their sub-pages.
      path !== "/erp/attendance" && path !== "/erp/inventory");
  if (!pathMatch) return false;
  if (!query) return true;
  const want = new URLSearchParams(query);
  return [...want.entries()].every(([k, v]) => search.get(k) === v);
}

/** The nav entry for the current page: an exact match first, then the longest path prefix. */
function currentEntry(nav: NavSection[], pathname: string, search: URLSearchParams) {
  let best: { section: NavSection; item: NavItem; len: number } | null = null;
  for (const section of nav) {
    for (const item of section.items) {
      if (isActive(item.href, pathname, search)) return { section, item };
      const path = item.href.split("?")[0];
      if ((pathname === path || pathname.startsWith(`${path}/`)) && (!best || path.length > best.len)) best = { section, item, len: path.length };
    }
  }
  return best;
}

const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join("") || "?";

// Per-viewer sidebar preferences in localStorage, read via useSyncExternalStore so
// the server render (no storage) and the first client render agree.
const STORE_EVENT = "erp-prefs";
function subscribe(cb: () => void) {
  window.addEventListener("storage", cb);
  window.addEventListener(STORE_EVENT, cb);
  return () => { window.removeEventListener("storage", cb); window.removeEventListener(STORE_EVENT, cb); };
}
function usePref(key: string): [string | null, (v: string) => void] {
  const value = useSyncExternalStore(subscribe, () => { try { return localStorage.getItem(key); } catch { return null; } }, () => null);
  const set = (v: string) => {
    try { localStorage.setItem(key, v); } catch { /* storage unavailable */ }
    window.dispatchEvent(new Event(STORE_EVENT));
  };
  return [value, set];
}

function NavList({ nav, onNavigate }: { nav: NavSection[]; onNavigate?: () => void }) {
  const pathname = usePathname();
  const search = useSearchParams();
  const [stored, setStored] = usePref("erp-nav-closed");
  const closed = useMemo(() => { try { return new Set<string>(JSON.parse(stored ?? "[]")); } catch { return new Set<string>(); } }, [stored]);
  const toggle = (label: string) => {
    const next = new Set(closed);
    if (next.has(label)) next.delete(label); else next.add(label);
    setStored(JSON.stringify([...next]));
  };

  return (
    <nav aria-label="ERP">
      {nav.map((section) => {
        const hasActive = section.items.some((i) => isActive(i.href, pathname, search));
        const isClosed = closed.has(section.label) && !hasActive;
        const single = section.items.length === 1;
        return (
          <div key={section.label} className={cx(s.section, isClosed && s.sectionClosed)} style={tone(section.tone)}>
            <button type="button" className={s.sectionHead} onClick={() => toggle(section.label)} aria-expanded={!isClosed} disabled={single}>
              <span className={s.dot} aria-hidden />
              <span>{section.label}</span>
              {!single && <ChevronDown className={s.chev} aria-hidden />}
            </button>
            <ul className={s.items}>
              {section.items.map((item) => {
                const active = isActive(item.href, pathname, search);
                return (
                  <li key={item.href}>
                    <Link href={item.href} onClick={onNavigate} aria-current={active ? "page" : undefined}
                      className={cx(s.item, active && s.active)} data-label={item.label}>
                      <span className={s.tile}><Icon name={item.icon} /></span>
                      <span className={s.itemText}><strong>{item.label}</strong><small>{item.hint}</small></span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}

const CAT_TONE: Record<Category, NavTone> = { all: "brand", school: "sky", learning_center: "violet" };

function CategorySelector({ value }: { value: Category }) {
  const [pending, start] = useTransition();
  const [optimistic, setOptimistic] = useOptimistic(value);
  const short: Record<Category, string> = { all: "All", school: "Schools", learning_center: "Centres" };
  return (
    <div role="radiogroup" aria-label="Show data for" aria-busy={pending} className={s.cats}>
      {CATEGORIES.map((c) => (
        <button key={c} type="button" role="radio" aria-checked={optimistic === c} title={CATEGORY_LABELS[c]}
          className={s.cat} style={tone(CAT_TONE[c])}
          onClick={() => start(async () => { setOptimistic(c); await setCategory(c); })}>
          <i aria-hidden />
          <span className={s.catShort}>{short[c]}</span>
          <span className={s.catLong}>{CATEGORY_LABELS[c]}</span>
        </button>
      ))}
    </div>
  );
}

type PaletteEntry = { key: string; href: string; label: string; hint: string; icon: string; tone: NavTone; group: string; tag: string };

/** Ctrl/⌘ + K: jump to any page or quick action. Mounted only while open, so it starts fresh each time. */
function CommandPalette({ onClose, nav, actions }: { onClose: () => void; nav: NavSection[]; actions: QuickAction[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const entries = useMemo<PaletteEntry[]>(() => [
    ...actions.map((a) => ({ key: `a:${a.href}`, href: a.href, label: a.label, hint: a.hint, icon: a.icon, tone: a.tone, group: "Quick actions", tag: "Action" })),
    ...nav.flatMap((sec) => sec.items.map((i) => ({ key: `p:${i.href}`, href: i.href, label: i.label, hint: i.hint, icon: i.icon, tone: sec.tone, group: "Pages", tag: sec.label }))),
  ], [nav, actions]);
  const query = q.trim().toLowerCase();
  const results = query
    ? entries.filter((e) => `${e.label} ${e.hint} ${e.tag}`.toLowerCase().includes(query))
    : entries;

  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-idx="${sel}"]`)?.scrollIntoView({ block: "nearest" });
  }, [sel]);

  const go = (e?: PaletteEntry) => { if (!e) return; onClose(); router.push(e.href); };
  let lastGroup = "";

  return (
    <div className={s.paletteWrap} role="dialog" aria-modal="true" aria-label="Jump to">
      <div className={s.scrim} onClick={onClose} aria-hidden />
      <div className={s.palette}>
        <div className={s.paletteInput}>
          <Search aria-hidden />
          <input autoFocus value={q} onChange={(e) => { setQ(e.target.value); setSel(0); }} placeholder="Jump to a page or action…"
            role="combobox" aria-expanded="true" aria-controls="erp-palette-list" aria-activedescendant={results[sel] ? `pal-${sel}` : undefined}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") { e.preventDefault(); setSel((i) => Math.min(results.length - 1, i + 1)); }
              else if (e.key === "ArrowUp") { e.preventDefault(); setSel((i) => Math.max(0, i - 1)); }
              else if (e.key === "Enter") { e.preventDefault(); go(results[sel]); }
              else if (e.key === "Escape") { e.preventDefault(); onClose(); }
            }} />
          <span className={s.kbd}>Esc</span>
        </div>
        <div className={s.paletteList} id="erp-palette-list" role="listbox" ref={listRef}>
          {results.length === 0 ? (
            <p className={s.paletteEmpty}>Nothing matches “{q.trim()}”.</p>
          ) : results.map((e, i) => {
            const header = e.group !== lastGroup ? <p className={s.paletteGroup}>{e.group}</p> : null;
            lastGroup = e.group;
            return (
              <div key={e.key}>
                {header}
                <button type="button" id={`pal-${i}`} data-idx={i} role="option" aria-selected={i === sel} className={s.option} style={tone(e.tone)}
                  onMouseEnter={() => setSel(i)} onClick={() => go(e)}>
                  <span className={s.tile}>{e.group === "Quick actions" ? <Zap aria-hidden /> : <Icon name={e.icon} />}</span>
                  <span className={s.optText}><strong>{e.label}</strong><small>{e.hint}</small></span>
                  <span className={s.optTag}>{e.tag}</span>
                </button>
              </div>
            );
          })}
        </div>
        <div className={s.paletteFoot}>
          <span><span className={s.kbd}>↑</span><span className={s.kbd}>↓</span> move</span>
          <span><span className={s.kbd}><CornerDownLeft size={11} /></span> open</span>
          <span><span className={s.kbd}>Ctrl K</span> toggle</span>
        </div>
      </div>
    </div>
  );
}

export function Shell({ nav, actions, category, user, children }: {
  nav: NavSection[];
  actions: QuickAction[];
  category: Category;
  user: { name: string; email: string; roles: string[] };
  children: ReactNode;
}) {
  const pathname = usePathname();
  const search = useSearchParams();
  const [drawer, setDrawer] = useState(false);
  const [palette, setPalette] = useState(false);
  const [rail, setRail] = usePref("erp-sidebar");
  const collapsed = rail === "rail";
  const toggleRail = () => setRail(collapsed ? "full" : "rail");

  // Escape closes the drawer; Ctrl/⌘+K opens the palette anywhere.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setPalette((p) => !p); }
      else if (e.key === "Escape") setDrawer(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const here = currentEntry(nav, pathname, search);
  const roles = user.roles.join(" · ") || "No role";

  const brand = (
    <Link href="/erp" className={s.brand} aria-label="Radix ERP home">
      <span className={s.logo} aria-hidden>R</span>
      <span className={s.brandText}><strong>Radix ERP</strong><small>Schools · Centres · Kits</small></span>
    </Link>
  );
  const sidebarBody = (onNavigate?: () => void) => (
    <>
      <button type="button" className={s.search} onClick={() => setPalette(true)} aria-label="Search pages and actions (Ctrl K)">
        <Search aria-hidden /><span>Jump to…</span><span className={s.kbd}>Ctrl K</span>
      </button>
      <div className={s.navScroll}><NavList nav={nav} onNavigate={onNavigate} /></div>
      <div className={s.foot}>
        <div className={s.user}>
          <span className={s.avatar} aria-hidden>{initials(user.name)}</span>
          <span className={s.userText}><strong>{user.name}</strong><small title={user.email}>{roles}</small></span>
          <form action={signOut}>
            <button type="submit" className={s.iconBtn} aria-label="Sign out" title="Sign out"><LogOut aria-hidden /></button>
          </form>
        </div>
        <Link href="/" className={s.backLink}><ArrowLeft aria-hidden /><span>Back to website</span></Link>
      </div>
    </>
  );

  return (
    <div className={cx("erp-root [color-scheme:dark] selection:bg-brand-500/30", s.root, collapsed && s.collapsed)}>
      <a href="#erp-main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-zinc-900 focus:px-3 focus:py-2 focus:shadow">
        Skip to content
      </a>

      <aside className={s.sidebar} aria-label="Sidebar">
        <div className={s.brandRow}>
          {brand}
          <button type="button" className={s.iconBtn} onClick={toggleRail} aria-pressed={collapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} title={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
            {collapsed ? <PanelLeftOpen aria-hidden /> : <PanelLeftClose aria-hidden />}
          </button>
        </div>
        {sidebarBody()}
      </aside>

      {drawer && (
        <div className={s.drawerWrap} role="dialog" aria-modal="true" aria-label="Navigation">
          <div className={s.scrim} onClick={() => setDrawer(false)} aria-hidden />
          <div className={s.drawer}>
            <div className={s.brandRow}>
              {brand}
              <button type="button" className={s.iconBtn} onClick={() => setDrawer(false)} aria-label="Close navigation"><X aria-hidden /></button>
            </div>
            {sidebarBody(() => setDrawer(false))}
          </div>
        </div>
      )}

      <div className={s.content}>
        <header className={s.topbar}>
          <button type="button" className={cx(s.iconBtn, s.menuBtn)} onClick={() => setDrawer(true)} aria-label="Open navigation" aria-expanded={drawer}>
            <Menu aria-hidden />
          </button>
          {here && (
            <nav aria-label="You are here" className={s.crumbs} style={tone(here.section.tone)}>
              {here.section.label !== here.item.label && (
                <>
                  <span className={s.crumbSection}><span className={s.dot} aria-hidden />{here.section.label}</span>
                  <span className={s.crumbSep} aria-hidden>/</span>
                </>
              )}
              <Link href={here.item.href} className={s.crumbPage}>
                <span className={s.tile}><Icon name={here.item.icon} /></span>{here.item.label}
              </Link>
            </nav>
          )}
          <div className={s.topRight}>
            <CategorySelector value={category} />
            <button type="button" className={cx(s.iconBtn, s.topSearch)} onClick={() => setPalette(true)} aria-label="Search pages and actions">
              <Search aria-hidden />
            </button>
            <span className={cx(s.avatar, s.topAvatar)} title={`${user.name} · ${roles}`} aria-hidden>{initials(user.name)}</span>
          </div>
        </header>
        <main id="erp-main" className={s.main}>
          {children}
        </main>
      </div>

      {palette && <CommandPalette onClose={() => setPalette(false)} nav={nav} actions={actions} />}
    </div>
  );
}
