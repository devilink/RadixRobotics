"use client";

import { useEffect, useRef, useState, type CSSProperties } from 'react';

interface LazyVideoProps {
  src: string;
  /** Still frame shown before loading and when iOS Low Power Mode blocks autoplay. */
  poster?: string;
  className?: string;
  style?: CSSProperties;
}

/**
 * Muted looping background video that only downloads once it nears the viewport
 * and pauses while off-screen, so below-the-fold clips don't slow the first paint.
 */
export default function LazyVideo({ src, poster, className, style }: LazyVideoProps) {
  const ref = useRef<HTMLVideoElement>(null);
  const [load, setLoad] = useState(false);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setLoad(true);
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { rootMargin: '200px 0px' }
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  return (
    <video
      ref={ref}
      src={load ? src : undefined}
      poster={poster}
      autoPlay={load}
      loop
      muted
      playsInline
      preload="none"
      disablePictureInPicture
      disableRemotePlayback
      aria-hidden="true"
      style={style}
      className={className}
    />
  );
}
