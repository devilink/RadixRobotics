"use client";

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { ArrowRight, ArrowUpRight, LogOut, Menu, X } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { getPortalPath } from '@/app/actions/portalActions';

export interface NavLink {
  name: string;
  href: string;
  badge?: string;
}

interface NavbarProps {
  navLinks?: NavLink[];
  darkHero?: boolean;
}

const defaultNavLinks: NavLink[] = [
  { name: 'Services', href: '/services' },
  { name: 'Projects', href: '/projects' },
  { name: 'About', href: '/about' },
  { name: 'Team', href: '/team' },
  { name: 'Community', href: '/community', badge: 'New' },
];

const WHATSAPP_AUDIT =
  'https://wa.me/916001979712?text=Hello%20Radix%20Robotics,%20we%20would%20like%20to%20consult%20about%20the%20Founding%20School%20Lab%20Cohort';

// Responsive show/hide uses the .nav-desktop / .nav-mobile classes in globals.css:
// plain Tailwind `hidden lg:flex` pairs are unreliable here (see app/styles/theme.css).

function Logo({ priority = false }: { priority?: boolean }) {
  return (
    <>
      <Image
        src="/imgw.PNG"
        alt=""
        width={96}
        height={44}
        className="h-8 sm:h-9 w-auto object-contain brightness-0 transition-transform duration-300 group-hover:scale-105"
        priority={priority}
      />
      <Image
        src="/txtw.png"
        alt="RADIX Robotics"
        width={112}
        height={28}
        className="h-5 sm:h-6 w-auto object-contain brightness-0"
        priority={priority}
      />
    </>
  );
}

export default function Navbar({ navLinks = defaultNavLinks, darkHero = false }: NavbarProps) {
  const pathname = usePathname();
  const supabase = useMemo(() => createClient(), []);
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [portalUrl, setPortalUrl] = useState('/login');
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Session: read once, then follow sign-in / sign-out events.
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setAuthReady(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAuthReady(true);
    });
    return () => subscription.unsubscribe();
  }, [supabase]);

  // The portal link is resolved on the server from stored roles, never from the email.
  useEffect(() => {
    if (!user) return;
    getPortalPath().then(setPortalUrl).catch(() => setPortalUrl('/login'));
  }, [user]);

  // Scroll state, throttled to one update per frame.
  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        setScrolled(window.scrollY > 24);
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  // While the drawer is open: lock page scroll (iOS ignores overflow on body alone) and close on Escape.
  useEffect(() => {
    if (!menuOpen) return;
    const root = document.documentElement;
    root.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => {
      root.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  const isActive = (href: string) => pathname === href || pathname?.startsWith(`${href}/`);
  const transparent = darkHero && !scrolled;

  return (
    <>
      <header
        className="fixed inset-x-0 top-0 z-50"
        style={{ paddingTop: 'env(safe-area-inset-top)', paddingLeft: 'env(safe-area-inset-left)', paddingRight: 'env(safe-area-inset-right)' }}
      >
        <nav
          aria-label="Main"
          className={`transition-[background-color,box-shadow,border-color,padding] duration-300 border-b ${
            transparent
              ? 'bg-transparent border-transparent py-4 sm:py-5'
              : `bg-white/85 backdrop-blur-xl backdrop-saturate-150 border-[#e8e0d4] ${scrolled ? 'py-2.5 shadow-[0_8px_30px_-12px_rgba(17,17,17,0.18)]' : 'py-3.5 sm:py-4'}`
          }`}
        >
          <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between gap-4 px-4 sm:px-8 lg:px-12">
            {/* Logo */}
            <div className="nav-side flex items-center">
              <Link href="/" aria-label="RADIX Robotics home" className="group flex shrink-0 items-center gap-2 lg:gap-2.5 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff5400] focus-visible:ring-offset-4">
                <Logo priority />
              </Link>
            </div>

            {/* Desktop links */}
            <ul className="nav-desktop items-center gap-1 rounded-full border border-[#e8e0d4] bg-white/70 p-1 shadow-[0_1px_0_rgba(17,17,17,0.04)] backdrop-blur">
              {navLinks.map((item) => {
                const active = isActive(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? 'page' : undefined}
                      className={`relative flex items-center gap-1.5 rounded-full px-4 py-2 text-[11px] font-bold uppercase tracking-[0.14em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff5400] ${
                        active ? 'bg-[#111] text-white' : 'text-[#3a3a3a] hover:bg-[#f4efe8] hover:text-[#111]'
                      }`}
                    >
                      {item.name}
                      {item.badge && (
                        <span className={`rounded-full px-1.5 py-px text-[8px] font-black tracking-wider ${active ? 'bg-[#ff5400] text-white' : 'bg-[#ff5400]/12 text-[#ff5400]'}`}>
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>

            {/* Actions */}
            <div className="nav-side flex items-center justify-end gap-2">
              <div className={`nav-desktop items-center gap-3 transition-opacity duration-300 ${authReady ? 'opacity-100' : 'opacity-0'}`}>
                {user ? (
                  <>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-1.5 px-2 py-2 text-[11px] font-bold uppercase tracking-widest text-[#8a8a8a] transition-colors hover:text-[#e5484d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff5400] rounded-sm"
                    >
                      <LogOut size={14} aria-hidden /> Logout
                    </button>
                    <Link
                      href={portalUrl}
                      className="group/cta flex items-center gap-2 border-2 border-[#111] bg-[#111] px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-white shadow-[3px_3px_0_#ff5400] transition-all hover:-translate-y-px hover:shadow-[4px_4px_0_#ff5400] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff5400] focus-visible:ring-offset-2"
                    >
                      Portal <ArrowRight size={14} className="transition-transform group-hover/cta:translate-x-0.5" aria-hidden />
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="px-2 py-2 text-[11px] font-bold uppercase tracking-widest text-[#1a1a1a] transition-colors hover:text-[#ff5400] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff5400] rounded-sm"
                    >
                      Login
                    </Link>
                    <a
                      href={WHATSAPP_AUDIT}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="group/cta flex items-center gap-2 border-2 border-[#111] bg-[#111] px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-white shadow-[3px_3px_0_#ff5400] transition-all hover:-translate-y-px hover:shadow-[4px_4px_0_#ff5400] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff5400] focus-visible:ring-offset-2"
                    >
                      Schedule Audit <ArrowUpRight size={14} className="transition-transform group-hover/cta:-translate-y-0.5 group-hover/cta:translate-x-0.5" aria-hidden />
                    </a>
                  </>
                )}
              </div>

              {/* Mobile toggle */}
              <button
                type="button"
                className="nav-mobile h-11 w-11 items-center justify-center border-2 border-[#111] bg-white text-[#111] shadow-[2px_2px_0_#ff5400] transition-colors active:translate-x-px active:translate-y-px active:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff5400]"
                onClick={() => setMenuOpen(true)}
                aria-label="Open menu"
                aria-expanded={menuOpen}
                aria-controls="mobile-nav"
              >
                <Menu size={22} aria-hidden />
              </button>
            </div>
          </div>
        </nav>
      </header>

      {/* Mobile drawer */}
      <div
        className={`nav-mobile-block fixed inset-0 z-[99] bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${menuOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={() => setMenuOpen(false)}
        aria-hidden
      />
      <div
        id="mobile-nav"
        role="dialog"
        onClick={(e) => { if ((e.target as HTMLElement).closest('a')) setMenuOpen(false); }}
        aria-modal="true"
        aria-label="Menu"
        inert={!menuOpen}
        aria-hidden={!menuOpen}
        style={{
          paddingTop: 'max(1.25rem, env(safe-area-inset-top))',
          paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))',
          paddingRight: 'max(1.25rem, env(safe-area-inset-right))',
        }}
        className={`nav-mobile-col fixed inset-y-0 right-0 z-[100] w-full max-w-sm flex-col overscroll-contain border-l-2 border-[#111] bg-[#faf8f5] pl-5 transition-[transform,visibility] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          menuOpen ? 'visible translate-x-0' : 'invisible translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b-2 border-[#111] pb-4">
          <Link href="/" className="flex items-center gap-2" aria-label="RADIX Robotics home">
            <Logo />
          </Link>
          <button
            type="button"
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
            className="flex h-11 w-11 items-center justify-center border-2 border-[#111] bg-white text-[#111] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff5400]"
          >
            <X size={22} aria-hidden />
          </button>
        </div>

        <ul className="mt-4 flex-1 overflow-y-auto">
          {navLinks.map((item, i) => {
            const active = isActive(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={`group flex items-center gap-4 border-b border-[#e8e0d4] py-4 transition-colors ${active ? 'text-[#ff5400]' : 'text-[#111] hover:text-[#ff5400]'}`}
                >
                  <span className="w-6 font-mono text-[11px] font-bold text-[#b5aa99]">{String(i + 1).padStart(2, '0')}</span>
                  <span className="flex-1 text-2xl font-black uppercase tracking-tighter">{item.name}</span>
                  {item.badge && (
                    <span className="rounded-full bg-[#ff5400] px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white">{item.badge}</span>
                  )}
                  <ArrowUpRight size={18} className={`transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 ${active ? 'text-[#ff5400]' : 'text-[#c9bfae]'}`} aria-hidden />
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="flex flex-col gap-3 border-t-2 border-[#111] pt-4">
          {user ? (
            <>
              <Link
                href={portalUrl}
                className="flex w-full items-center justify-center gap-2 border-2 border-[#111] bg-[#111] py-3.5 text-xs font-bold uppercase tracking-widest text-white shadow-[3px_3px_0_#ff5400]"
              >
                Open Portal <ArrowRight size={14} aria-hidden />
              </Link>
              <button
                onClick={() => { setMenuOpen(false); handleLogout(); }}
                className="flex w-full items-center justify-center gap-2 py-2 text-xs font-bold uppercase tracking-widest text-[#e5484d]"
              >
                <LogOut size={14} aria-hidden /> Logout
              </button>
            </>
          ) : (
            <>
              <a
                href={WHATSAPP_AUDIT}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="flex w-full items-center justify-center gap-2 border-2 border-[#111] bg-[#ff5400] py-3.5 text-xs font-bold uppercase tracking-widest text-white shadow-[3px_3px_0_#111]"
              >
                Schedule Audit <ArrowUpRight size={14} aria-hidden />
              </a>
              <Link
                href="/login"
                className="w-full border-2 border-[#111] bg-white py-3 text-center text-xs font-bold uppercase tracking-widest text-[#111]"
              >
                Login to Portal
              </Link>
            </>
          )}
        </div>
      </div>
    </>
  );
}
