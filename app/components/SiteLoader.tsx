"use client";

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

// App-style areas skip the splash: people there want the tool, not the brand moment.
const SKIP_PREFIXES = ['/super-admin', '/erp', '/school-admin', '/login', '/update-password', '/student', '/curriculum', '/kits', '/auth'];

const MIN_VISIBLE_MS = 900;   // long enough for the logo animation to read
const MAX_VISIBLE_MS = 4000;  // never hold a slow connection hostage
const EXIT_MS = 700;

type Phase = 'loading' | 'leaving' | 'done';

function waitForPageLoad(): Promise<void> {
  if (document.readyState === 'complete') return Promise.resolve();
  return new Promise((resolve) => window.addEventListener('load', () => resolve(), { once: true }));
}

/**
 * Branded splash shown on the first full page load of the public site. It is server-rendered so it
 * covers the page from the very first paint, and lifts once the page, its images and fonts are in.
 * Client-side navigations never show it again because the root layout stays mounted.
 */
export default function SiteLoader() {
  const pathname = usePathname();
  const skip = SKIP_PREFIXES.some((p) => pathname?.startsWith(p));
  const [phase, setPhase] = useState<Phase>(skip ? 'done' : 'loading');

  useEffect(() => {
    if (phase !== 'loading') return;

    const root = document.documentElement;
    root.style.overflow = 'hidden';

    let cancelled = false;
    const sinceNavigation = performance.now();
    const minDelay = new Promise((r) => setTimeout(r, Math.max(0, MIN_VISIBLE_MS - sinceNavigation)));
    const maxDelay = new Promise((r) => setTimeout(r, Math.max(0, MAX_VISIBLE_MS - sinceNavigation)));
    const ready = Promise.all([waitForPageLoad(), document.fonts?.ready, minDelay]);

    Promise.race([ready, maxDelay]).then(() => {
      if (cancelled) return;
      root.style.overflow = '';
      setPhase('leaving');
    });

    return () => {
      cancelled = true;
      root.style.overflow = '';
    };
  }, [phase]);

  // Unmount once the exit transition has played.
  useEffect(() => {
    if (phase !== 'leaving') return;
    const timer = setTimeout(() => setPhase('done'), EXIT_MS);
    return () => clearTimeout(timer);
  }, [phase]);

  if (phase === 'done') return null;

  return (
    <div
      className={`site-loader${phase === 'leaving' ? ' is-leaving' : ''}`}
      role="status"
      aria-live="polite"
      aria-label="Loading RADIX Robotics"
    >
      <noscript>
        <style>{`.site-loader{display:none!important}`}</style>
      </noscript>
      <div className="site-loader__inner">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="site-loader__mark" src="/loader-mark.webp" alt="" width={240} height={77} />
        <div className="site-loader__word">RADIX</div>
        <div className="site-loader__sub">Robotics</div>
        <div className="site-loader__bar"><span /></div>
        <div className="site-loader__status">
          Booting systems<span className="site-loader__cursor">_</span>
        </div>
      </div>
    </div>
  );
}
