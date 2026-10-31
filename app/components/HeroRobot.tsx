"use client";

import { useState, useSyncExternalStore } from 'react';

type Media = 'poster' | 'video' | 'animated-image';

// WebKit (Safari and every iOS browser) can't render VP9 alpha, so it gets the animated WebP instead.
// Nothing animated is fetched until the page has finished loading, so it never competes with first paint.
function pickMedia(): Media {
  if (document.readyState !== 'complete') return 'poster';
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return 'poster';
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  if (connection?.saveData) return 'poster';
  const ua = navigator.userAgent;
  const isWebKit = /AppleWebKit/.test(ua) && !/Chrome|Chromium|Edg|Android/.test(ua);
  return isWebKit ? 'animated-image' : 'video';
}

function subscribeToLoad(onChange: () => void) {
  window.addEventListener('load', onChange);
  return () => window.removeEventListener('load', onChange);
}

/**
 * The hero mascot. A 24 KB still paints immediately; the animation (800 KB WebM, or 2.2 MB
 * animated WebP on WebKit) replaces it after page load. Replaces a 12.7 MB GIF.
 */
export default function HeroRobot({ className = '' }: { className?: string }) {
  // Server render and hydration always use the still; the client then upgrades to the animation.
  const media = useSyncExternalStore(subscribeToLoad, pickMedia, () => 'poster' as Media);
  const [ready, setReady] = useState(false);

  const mediaClass = 'absolute inset-0 w-full h-full object-contain transition-opacity duration-500';

  return (
    <div className={`relative ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/hero-robot-poster.webp"
        alt="RADIX robot mascot waving"
        width={560}
        height={560}
        fetchPriority="high"
        decoding="async"
        className={`${mediaClass} ${ready ? 'opacity-0' : 'opacity-100'}`}
      />
      {media === 'video' && (
        <video
          src="/hero-robot.webm"
          autoPlay
          loop
          muted
          playsInline
          aria-hidden="true"
          onPlaying={() => setReady(true)}
          className={`${mediaClass} ${ready ? 'opacity-100' : 'opacity-0'}`}
        />
      )}
      {media === 'animated-image' && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src="/hero-robot.webp"
          alt=""
          aria-hidden="true"
          decoding="async"
          onLoad={() => setReady(true)}
          className={`${mediaClass} ${ready ? 'opacity-100' : 'opacity-0'}`}
        />
      )}
    </div>
  );
}
