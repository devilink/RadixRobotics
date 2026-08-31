"use client";

import Link from "next/link";
import { ArrowLeft, Cpu } from "lucide-react";
import { useEffect, useRef } from "react";
import gsap from "gsap";

export default function NotFound() {
  const glitchRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (!glitchRef.current) return;
    
    // Simple glitch effect
    const tl = gsap.timeline({ repeat: -1, yoyo: true });
    tl.to(glitchRef.current, { x: 2, skewX: 2, duration: 0.1 })
      .to(glitchRef.current, { x: -2, skewX: -2, duration: 0.1 })
      .to(glitchRef.current, { x: 0, skewX: 0, duration: 0.1 })
      .to(glitchRef.current, { opacity: 0.8, duration: 0.1 })
      .to(glitchRef.current, { opacity: 1, duration: 0.1 }, "+=2");

    return () => {
      tl.kill();
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#111] text-white flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none"></div>
      
      {/* Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#ff5400] rounded-full blur-[120px] opacity-20 pointer-events-none"></div>

      <div className="relative z-10 flex flex-col items-center text-center max-w-2xl">
        <div className="text-[#ff5400] mb-8 animate-pulse">
          <Cpu size={64} strokeWidth={1.5} />
        </div>
        
        <h1 
          ref={glitchRef}
          className="text-7xl sm:text-9xl font-black uppercase tracking-tighter mb-4 text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-500"
        >
          404
        </h1>
        
        <h2 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight text-[#ff5400] mb-6">
          System Module Not Found
        </h2>
        
        <p className="text-[#a0aab8] text-sm sm:text-base leading-relaxed mb-10 max-w-md">
          The requested path could not be resolved. This directory may have been moved, deleted, or you might have mistyped the URL.
        </p>
        
        <Link 
          href="/"
          className="group relative inline-flex items-center gap-3 bg-white text-black px-8 py-4 font-bold uppercase tracking-widest text-sm transition-transform duration-300 hover:-translate-y-1"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          Return to Base
        </Link>
      </div>
    </div>
  );
}
