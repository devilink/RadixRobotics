"use client";

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  ArrowUpRight,
  Cpu,
  Bot,
  BookOpen,
  Trophy
} from 'lucide-react';

const services = [
  {
    number: "01",
    title: "Atal Tinkering Labs & Composite Skill Setup",
    description: "Turnkey NITI Aayog & CBSE compliant infrastructure — industrial FDM 3D printers, ESD workbenches, and precision testing instrumentation. Packages 1 through 4, fully audit-ready.",
    tags: ["FDM 3D Printer", "Soldering Station", "Anti-Static Bench", "AIM Kits"],
    bgClass: "section-black",
    textClass: "text-[#faf8f5]",
    mutedClass: "text-[#999]",
    tagStyle: "sticker-yellow",
    image: "/foundation.png",
    rotation: "rotate-[2deg]",
    ctaText: "Request Spec Sheet",
    icon: Cpu
  },
  {
    number: "02",
    title: "AI, IoT, Robotics & Drone Arenas",
    description: "Edge AI compute nodes, autonomous mobile robot arenas with 2D/3D LiDAR, indoor carbon-fiber quadcopters, and LoRaWAN mesh sensor fabrics — all factory-calibrated.",
    tags: ["NVIDIA Jetson", "2D/3D LiDAR", "Telemetry Drone", "LoRaWAN", "OpenCV"],
    bgClass: "section-yellow",
    textClass: "text-[#1a1a1a]",
    mutedClass: "text-[#4a4a4a]",
    tagStyle: "sticker-dark",
    image: "/future-ready.png",
    rotation: "-rotate-[2deg]",
    ctaText: "Inspect Rig",
    icon: Bot
  },
  {
    number: "03",
    title: "Teacher Training & NEP 2020 Curriculum",
    description: "40+ hours of accredited Master Trainer faculty masterclasses, 300+ structured lesson plans for Grades 3–12, and weekly on-campus resident engineer co-teaching sessions.",
    tags: ["300+ Lesson Plans", "NEP Mapped", "Faculty CPD", "1:1 Mentorship"],
    bgClass: "section-white",
    textClass: "text-[#1a1a1a]",
    mutedClass: "text-[#6a6a6a]",
    tagStyle: "sticker-mint",
    image: "/innovation.png",
    rotation: "rotate-[3deg]",
    ctaText: "View Plans",
    icon: BookOpen
  },
  {
    number: "04",
    title: "LMS Integration & RoboWars Competitions",
    description: "Cloud-based student grading LMS, digital skill passports, combat obstacle arenas, and specialized coaching for World Robot Olympiad (WRO) & CBSE national hackathons.",
    tags: ["RoboWars Arena", "Cloud LMS", "WRO Coaching", "Skill Passports"],
    bgClass: "section-black",
    textClass: "text-[#faf8f5]",
    mutedClass: "text-[#999]",
    tagStyle: "sticker-coral",
    image: "/signature.png",
    rotation: "-rotate-[1deg]",
    ctaText: "Learn More",
    icon: Trophy
  }
];

export default function ProductServiceMatrix() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLAnchorElement | null)[]>([]);
  const bgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    if (sectionRef.current) {
      // Smooth stagger reveal for the cards
      gsap.fromTo(
        cardsRef.current,
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 50%", 
            toggleActions: "play none none reverse",
          }
        }
      );
    }
  }, []);

  return (
    <section 
      id="matrix" 
      ref={sectionRef}
      className="relative z-20 w-full pt-[calc(4vw+5rem)] sm:pt-[calc(4vw+8rem)] pb-20 sm:pb-32 bg-[#0a0a0a] overflow-hidden -mt-[4vw]"
      style={{ 
        clipPath: 'polygon(0 4vw, 100% 0, 100% 100%, 0 100%)', 
        perspective: '1000px',
        backgroundImage: 'radial-gradient(circle at center, rgba(255,255,255,0.05) 1px, transparent 1px)',
        backgroundSize: '32px 32px',
        backgroundAttachment: 'fixed'
      }}
    >
      
      {/* Background accents with Parallax Ref */}
      <div ref={bgRef} className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
        <div className="absolute top-[10%] -right-64 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px]"></div>
        <div className="absolute top-[60%] -left-64 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px]"></div>
      </div>

      <div className="w-full 2xl:px-24 mx-auto px-4 sm:px-8 lg:px-16 relative z-10">
        
        {/* Section Header */}
        <div className="text-center mb-16 sm:mb-24">
          <span className="text-blue-500 font-bold text-xs sm:text-sm tracking-[0.2em] uppercase mb-4 block">
            Our Core Pillars
          </span>
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.1] max-w-3xl mx-auto">
            Complete Turnkey<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
              Ecosystems
            </span> for Schools
          </h2>
          <p className="mt-6 text-gray-400 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            From spatial CAD blueprints to resident engineer co-teaching, Radix delivers an integrated STEM execution stack. 
            <Link href="/services" className="text-blue-400 hover:text-blue-300 ml-2 inline-flex items-center gap-1 group transition-colors">
              View detailed specs <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
          </p>
        </div>

        {/* 4 Iconly-Style Cards Grid (2x2 Always Side-by-Side) */}
        <div 
          className="w-full max-w-[1200px] mx-auto mt-12 grid grid-cols-2 gap-4 sm:gap-6 lg:gap-10"
        >
          {services.map((service, idx) => {
            const Icon = service.icon;
            
            // Map index to the Iconly styles: White, Orange, Black, White
            const isOrange = idx === 1;
            const isBlack = idx === 2;
            const isWhite = idx === 0 || idx === 3;

            let cardBg = "bg-white";
            let titleColor = "text-[#101010]";
            let subtitleColor = "text-[#909090]";
            let arrowBg = "bg-[#111] text-white";
            let iconColor = "text-[#e5e5e5]";

            if (isOrange) {
              cardBg = "bg-gradient-to-br from-[#ff3b0d] to-[#ff9d25]";
              titleColor = "text-white";
              subtitleColor = "text-[#c9c9c9]";
              arrowBg = "bg-white text-[#111]";
              iconColor = "text-white/20";
            } else if (isBlack) {
              cardBg = "bg-gradient-to-br from-[#050505] to-[#191919]";
              titleColor = "text-white";
              subtitleColor = "text-[#c9c9c9]";
              arrowBg = "bg-white text-[#111]";
              iconColor = "text-[#333]";
            }

            // Split the long title into title and subtitle for the specific aesthetic
            const words = service.title.split(' ');
            const mid = Math.ceil(words.length / 2);
            const titleTop = words.slice(0, mid).join(' ');
            const titleBottom = words.slice(mid).join(' ');

            return (
              <Link
                key={service.number}
                href="/services"
                ref={(el) => {
                  cardsRef.current[idx] = el;
                }}
                className={`group relative min-h-[220px] sm:min-h-[280px] lg:min-h-[320px] rounded-[14px] sm:rounded-[24px] overflow-hidden p-5 sm:p-8 lg:p-10 block transition-transform hover:-translate-y-2 hover:shadow-2xl ${cardBg} w-full`}
                style={{ isolation: 'isolate', opacity: 0 }}
              >
                {/* Title and Subtitle */}
                <div className="relative z-10 flex flex-col">
                  <span className={`text-[16px] sm:text-[24px] lg:text-[32px] leading-[1.1] sm:leading-[1.05] font-bold tracking-tight sm:tracking-[-0.03em] ${titleColor}`}>
                    {titleTop}
                  </span>
                  <span className={`text-[16px] sm:text-[24px] lg:text-[32px] leading-[1.1] sm:leading-[1.05] font-semibold tracking-tight sm:tracking-[-0.03em] mt-1 ${subtitleColor}`}>
                    {titleBottom}
                  </span>
                </div>

                {/* 'Learn More' Button */}
                <div className="absolute left-[15px] sm:left-[30px] bottom-[15px] sm:bottom-[30px] flex items-center gap-2 sm:gap-3 text-[9px] sm:text-[13px] font-bold tracking-[0.05em] z-10 text-inherit">
                  <div className={`w-[20px] h-[20px] sm:w-[28px] sm:h-[28px] rounded-full flex items-center justify-center text-[10px] sm:text-[14px] leading-none ${arrowBg} transition-transform group-hover:scale-110 group-hover:rotate-45 shadow-md`}>
                    ↗
                  </div>
                  <span className={isWhite ? 'text-[#101010]' : 'text-white'}>LEARN MORE</span>
                </div>

                {/* Oversized Graphic Illustration */}
                <div className="absolute -right-8 -bottom-8 sm:-right-4 sm:-bottom-4 z-0 group-hover:scale-110 group-hover:-rotate-12 transition-transform duration-500 ease-out pointer-events-none">
                  <Icon size={140} className={`${iconColor} drop-shadow-2xl w-[140px] h-[140px] sm:w-[200px] sm:h-[200px] lg:w-[240px] lg:h-[240px]`} strokeWidth={1.5} />
                </div>
              </Link>
            );
          })}
        </div>

        {/* View All CTA */}
        <div className="mt-16 text-center">
          <Link href="/services" className="inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-white text-black font-bold text-xs sm:text-sm uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all duration-300 shadow-xl hover:-translate-y-1">
            Explore All Lab Tiers <ArrowUpRight size={16} />
          </Link>
        </div>

      </div>
    </section>
  );
}
