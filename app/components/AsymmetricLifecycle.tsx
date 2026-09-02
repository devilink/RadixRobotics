"use client";

import { useRef } from 'react';
import { CheckCircle2, ArrowUpRight } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';

const steps = [
  {
    number: "01",
    timeline: "Weeks 1 – 2",
    title: "Design & Turnkey Installation",
    description: "We assess your campus space, design ergonomic 3D CAD floorplans, and install industrial workstations, 3D printers, safety gear, and the full hardware stack — ready for day one.",
    deliverables: [
      "Custom 2D/3D architectural CAD lab layout",
      "ESD anti-static workbenches & power distribution",
      "Full hardware kit staging & inventory tagging"
    ],
    stickerColor: "bg-[#111] text-white",
    handwrittenNote: "// We handle everything"
  },
  {
    number: "02",
    timeline: "Weeks 3 – 4",
    title: "Hardware Setup & Faculty CPD Training",
    description: "We deploy certified Master Trainers directly to your campus for 40+ hours of accredited Continuous Professional Development, empowering teachers to lead hardware sessions with confidence.",
    deliverables: [
      "40+ hours hands-on faculty masterclass",
      "Complete 300+ lesson plan repository with rubrics",
      "Teacher certification under NEP 2020 standards"
    ],
    stickerColor: "bg-[#ff5400] text-white",
    handwrittenNote: "// Teachers become makers"
  },
  {
    number: "03",
    timeline: "Month 2 Onwards",
    title: "Dedicated Resident Engineer Mentorship",
    description: "Radix deploys a dedicated on-campus robotics specialist who conducts weekly live lab sessions, supervises prototyping, and ensures continuous hardware calibration.",
    deliverables: [
      "On-campus resident mentor for scheduled curriculum",
      "Real-time student project debugging & code reviews",
      "Preventative maintenance & kit replenishment"
    ],
    stickerColor: "bg-[#111] text-white",
    handwrittenNote: "// Your personal expert"
  },
  {
    number: "04",
    timeline: "Annual / Ongoing",
    title: "RoboWars Arenas & Competition Coaching",
    description: "We prepare and coach student teams to represent your school at national championships, World Robot Olympiad (WRO), and inter-school RoboWars combat leagues.",
    deliverables: [
      "Custom arena builds: line-track, combat & obstacle",
      "Mentorship for national/global competitions",
      "Verifiable student skill passports & credentials"
    ],
    stickerColor: "bg-white text-[#111]",
    handwrittenNote: "// Legends are made here"
  }
];

export default function AsymmetricLifecycle() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });
  
  const yParallaxFast = useTransform(scrollYProgress, [0, 1], [-200, 200]);
  const yParallaxSlow = useTransform(scrollYProgress, [0, 1], [-100, 100]);

  return (
    <section ref={containerRef} id="how" className="relative z-10 w-full py-16 sm:py-32 bg-[#faf8f5] border-b-2 border-[#111] overflow-hidden">

      <div className="w-full 2xl:px-24 mx-auto px-4 sm:px-8 lg:px-16 pr-font-sans">

        {/* Section Header */}
        <div className="max-w-3xl mb-12 sm:mb-16">
          <span className="font-mono text-xs sm:text-sm font-bold uppercase tracking-widest text-[#ff5400] block mb-4">
            [ How We Transform Your Campus ]
          </span>
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tighter text-[#111] uppercase leading-[1.05]">
            From Empty Room to<br />
            World-Class Lab
          </h2>
          <p className="mt-4 text-[#3b3f46] text-sm sm:text-base max-w-lg leading-relaxed font-semibold">
            A proven 4-phase implementation methodology that transforms any available campus space into a fully operational engineering environment.
          </p>
        </div>

        {/* Steps — Winding Timeline */}
        <div className="relative max-w-5xl mx-auto">
          {/* Central Dashed Line for Desktop, Left for Mobile */}
          <div className="absolute left-[27px] md:left-1/2 top-0 bottom-0 w-1 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNCIgaGVpZ2h0PSI0IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjIiIGZpbGw9IiMxMTEiLz48L3N2Zz4=')] opacity-20 -translate-x-1/2 z-0"></div>

          <div className="flex flex-col gap-12 sm:gap-24 relative z-10 pt-10">
            {steps.map((step, index) => {
              const isEven = index % 2 === 0;
              return (
                <motion.div 
                  initial={{ opacity: 0, y: 50, rotateX: 20, perspective: 1000 }}
                  whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.6, delay: index * 0.1, type: "spring", bounce: 0.4 }}
                  key={step.number} 
                  className={`flex flex-col md:flex-row items-center gap-8 md:gap-16 ${isEven ? '' : 'md:flex-row-reverse'}`}
                >
                  
                  {/* Content Card */}
                  <div className={`w-full md:w-1/2 flex ${isEven ? 'md:justify-end' : 'md:justify-start'} pl-16 md:pl-0 relative`}>
                    
                    {/* Mobile Timeline Node */}
                    <div className="absolute left-[27px] top-8 -translate-x-1/2 w-6 h-6 bg-[#ff5400] border-4 border-[#faf8f5] rounded-full z-20 md:hidden"></div>

                    <motion.div 
                      className="bg-white border-2 border-[#111] p-6 sm:p-10 shadow-[8px_8px_0_#111] w-full max-w-[480px] relative group origin-center cursor-default"
                      whileHover={{ 
                        scale: 1.03, 
                        rotate: 1,
                        boxShadow: "15px 15px 0px #ff5400",
                        y: -5
                      }}
                      transition={{ type: "spring", stiffness: 300, damping: 15 }}
                    >
                      {/* Large Step Number */}
                      <span className="absolute top-4 right-5 text-7xl sm:text-8xl font-black text-[#111] opacity-[0.03] leading-none pointer-events-none select-none font-mono group-hover:opacity-[0.08] transition-opacity">
                        {step.number}
                      </span>

                      {/* Top badges */}
                      <div className="flex flex-wrap items-center gap-2 mb-6">
                        <span className="bg-[#111] text-white px-3 py-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-widest border-2 border-[#111]">
                          Phase {step.number}
                        </span>
                        <span className="bg-[#f2f3f5] text-[#111] border-2 border-transparent px-3 py-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-widest font-mono">
                          {step.timeline}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="text-2xl sm:text-3xl font-black text-[#111] uppercase tracking-tighter leading-none mb-3 pr-10">
                        {step.title}
                      </h3>

                      {/* Mono note */}
                      <div className="font-mono text-[10px] sm:text-xs font-bold text-[#ff5400] uppercase tracking-wider mb-5">
                        {step.handwrittenNote}
                      </div>

                      <p className="text-[#3b3f46] text-sm sm:text-base font-medium leading-relaxed mb-8">
                        {step.description}
                      </p>

                      {/* Deliverables checklist */}
                      <ul className="space-y-4 border-t-2 border-[#111]/10 pt-6">
                        {step.deliverables.map((d, dIdx) => (
                          <li key={dIdx} className="flex items-start gap-3 text-sm text-[#111] font-bold">
                            <span className="shrink-0 mt-[-2px] text-lg text-[#ff5400]">✓</span>
                            <span>{d}</span>
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  </div>

                  {/* Desktop Timeline Node & Spacer */}
                  <div className="hidden md:flex w-1/2 relative justify-center items-center">
                    {/* Node on the line */}
                    <div className={`absolute ${isEven ? 'left-0 -translate-x-1/2' : 'right-0 translate-x-1/2'} w-8 h-8 bg-[#ff5400] border-4 border-[#faf8f5] shadow-[0_0_0_2px_#111] rounded-full z-20`}></div>
                    
                    {/* Abstract Graphic / Number for the empty side */}
                    <motion.div 
                      style={{ y: isEven ? yParallaxFast : yParallaxSlow }}
                      className={`text-[180px] font-black text-[#111] opacity-[0.03] leading-none pointer-events-none select-none font-mono ${isEven ? 'ml-24' : 'mr-24'}`}
                    >
                      {step.number}
                    </motion.div>
                  </div>

                </motion.div>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
}
