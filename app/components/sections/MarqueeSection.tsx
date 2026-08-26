"use client";

import { useEffect, useRef, useState } from "react";

const ITEMS = [
  "ROS 2 AUTONOMOUS SYSTEMS",
  "ATAL TINKERING LABS SETUP",
  "NVIDIA JETSON EDGE AI",
  "ARDUPILOT AERIAL TELEMETRY",
  "LORAWAN SMART AGRICULTURE",
  "6-DOF ROBOTIC ARMS",
  "3D PROTOTYPING & CAD",
  "NEP 2020 COMPLIANT",
  "FOUNDING SCHOOL COHORT"
];

const ROW1_ITEMS = [...ITEMS, ...ITEMS, ...ITEMS];
const ROW2_ITEMS = [...ITEMS.reverse(), ...ITEMS, ...ITEMS];

export default function MarqueeSection() {
  const containerRef = useRef<HTMLElement>(null);
  const [scrollOffset, setScrollOffset] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const sectionTop = containerRef.current.offsetTop;
      const val = (window.scrollY - sectionTop + window.innerHeight) * 0.3;
      setScrollOffset(val);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section ref={containerRef} className="w-full bg-[#0C0C0C] pt-24 sm:pt-32 md:pt-40 pb-10 overflow-hidden border-t border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.1)]">
      
      {/* Row 1 */}
      <div className="flex gap-8 mb-8 relative whitespace-nowrap will-change-transform opacity-70" style={{ transform: `translateX(${scrollOffset - 500}px)` }}>
        {ROW1_ITEMS.map((item, i) => (
          <div key={`r1-${i}`} className="flex items-center gap-8 shrink-0">
            <span className="font-mono font-medium text-2xl sm:text-3xl md:text-5xl tracking-[0.2em] uppercase text-white/50">
              {item}
            </span>
            <span className="text-white/20 font-light text-2xl sm:text-3xl md:text-5xl">+</span>
          </div>
        ))}
      </div>

      {/* Row 2 */}
      <div className="flex gap-8 relative whitespace-nowrap will-change-transform opacity-70" style={{ transform: `translateX(${-(scrollOffset - 200)}px)` }}>
        {ROW2_ITEMS.map((item, i) => (
          <div key={`r2-${i}`} className="flex items-center gap-8 shrink-0">
            <span className="font-mono font-medium text-2xl sm:text-3xl md:text-5xl tracking-[0.2em] uppercase text-white/50">
              {item}
            </span>
            <span className="text-white/20 font-light text-2xl sm:text-3xl md:text-5xl">+</span>
          </div>
        ))}
      </div>

    </section>
  );
}
