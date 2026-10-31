"use client";

import { Suspense, useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

/** Ask the bar to start, e.g. right before router.push(). */
export function startRouteProgress() {
  window.dispatchEvent(new Event('route-progress:start'));
}

function isInternalNavigation(e: MouseEvent): boolean {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return false;
  const a = (e.target as Element | null)?.closest?.('a');
  if (!a || !a.href || a.target === '_blank' || a.hasAttribute('download')) return false;
  const url = new URL(a.href, location.href);
  if (url.origin !== location.origin) return false;
  // Same page (or just a #hash jump): nothing to wait for.
  return url.pathname !== location.pathname || url.search !== location.search;
}

/**
 * Thin brand-orange bar at the top of the window during client-side navigations.
 * Starts on internal link clicks (or startRouteProgress), creeps forward while the
 * next page renders on the server, and completes when the URL changes.
 * Updates the DOM directly, so it never re-renders the app.
 */
function Bar() {
  const pathname = usePathname();
  const search = useSearchParams();
  const barRef = useRef<HTMLDivElement>(null);
  const state = useRef({ active: false, value: 0, timer: 0, safety: 0 });

  useEffect(() => {
    const el = barRef.current!;
    const s = state.current;

    const paint = () => {
      el.style.transform = `scaleX(${s.value})`;
    };
    const done = () => {
      if (!s.active) return;
      s.active = false;
      clearInterval(s.timer);
      clearTimeout(s.safety);
      s.value = 1;
      paint();
      window.setTimeout(() => {
        if (!s.active) el.style.opacity = '0';
      }, 250);
    };
    const start = () => {
      if (s.active) return;
      s.active = true;
      s.value = 0.08;
      el.style.transition = 'none';
      el.style.opacity = '1';
      paint();
      requestAnimationFrame(() => {
        el.style.transition = 'transform 0.4s ease, opacity 0.3s ease';
      });
      // Trickle: fast at first, slowing as it approaches 90%.
      s.timer = window.setInterval(() => {
        s.value = Math.min(0.9, s.value + (0.9 - s.value) * 0.12);
        paint();
      }, 250);
      // Never leave the bar stuck if a navigation is cancelled.
      s.safety = window.setTimeout(done, 15000);
    };

    const onClick = (e: MouseEvent) => { if (isInternalNavigation(e)) start(); };
    document.addEventListener('click', onClick, true);
    window.addEventListener('route-progress:start', start);
    window.addEventListener('route-progress:done', done);
    return () => {
      document.removeEventListener('click', onClick, true);
      window.removeEventListener('route-progress:start', start);
      window.removeEventListener('route-progress:done', done);
      clearInterval(s.timer);
      clearTimeout(s.safety);
    };
  }, []);

  // The URL changed: the new page has rendered.
  useEffect(() => {
    window.dispatchEvent(new Event('route-progress:done'));
  }, [pathname, search]);

  return <div ref={barRef} className="route-progress" aria-hidden />;
}

export default function RouteProgress() {
  return (
    <Suspense fallback={null}>
      <Bar />
    </Suspense>
  );
}
