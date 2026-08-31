"use client";

import Link from 'next/link';
import { useRef } from 'react';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
const glimpseProjects = [
  {
    id: "agro",
    title: "Smart Agro Hub",
    category: "Beginner",
    tech: "LoRaWAN",
    objectPosition: "0% 50%",
    transform: "scale(2.5) rotate(45deg)",
    filter: "hue-rotate(90deg) saturate(1.5) contrast(1.2)",
    cardClass: "bg-white border-2 border-[#111] shadow-[6px_6px_0_#111]",
    textColor: "text-[#111]",
    tagClass: "bg-[#111] text-white",
  },
  {
    id: "arm",
    title: "6-DOF Vision Arm",
    category: "Intermediate",
    tech: "OpenCV",
    objectPosition: "50% 50%",
    transform: "scale(3.5) rotate(-30deg)",
    filter: "hue-rotate(180deg) saturate(2.5) brightness(0.6) contrast(1.4)",
    cardClass: "bg-[#111] border-2 border-[#111] shadow-[6px_6px_0_#ff5400]",
    textColor: "text-white",
    tagClass: "bg-[#ff5400] text-[#111]",
  },
  {
    id: "drone",
    title: "Aerial Survey Drone",
    category: "Advanced",
    tech: "ArduPilot",
    objectPosition: "100% 50%",
    transform: "scale(2.2) rotate(180deg)",
    filter: "hue-rotate(270deg) saturate(2) contrast(1.5)",
    cardClass: "bg-transparent border-2 border-dashed border-[#111] shadow-none hover:border-solid",
    textColor: "text-[#111]",
    tagClass: "bg-transparent text-[#111] border-2 border-[#111]",
  },
  {
    id: "ros-rover",
    title: "Autonomous LiDAR Rover",
    category: "Master",
    tech: "ROS 2",
    objectPosition: "50% 100%",
    transform: "scale(3) translate(-20%, -20%) rotate(90deg)",
    filter: "sepia(1) hue-rotate(-50deg) saturate(3) brightness(0.9)",
    cardClass: "bg-[#ff5400] border-2 border-[#111] shadow-[6px_6px_0_#111]",
    textColor: "text-[#111]",
    tagClass: "bg-[#111] text-white",
  }
];

export default function ProjectGlimpse() {
  const containerRef = useRef(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  // Parallax values for alternating cards
  const yFast = useTransform(scrollYProgress, [0, 1], [-150, 150]);
  const ySlow = useTransform(scrollYProgress, [0, 1], [-50, 50]);

  return (
    <section ref={containerRef} className="relative z-10 w-full bg-grid border-b border-[#e8e0d4] py-20 sm:py-32 overflow-hidden">
      
      {/* Dynamic Parallax Background Pattern */}
      <motion.div style={{ y: yFast }} className="absolute -left-20 top-20 text-[300px] font-black text-[#111] opacity-[0.03] select-none pointer-events-none">
        03
      </motion.div>

      <div className="w-full 2xl:px-24 mx-auto px-4 sm:px-8 lg:px-16 relative z-10">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pr-font-sans">
          <div className="max-w-2xl">
            <span className="font-mono text-xs sm:text-sm font-bold uppercase tracking-widest text-[#ff5400] block mb-4">
              [ Student Capstone Projects ]
            </span>
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tighter text-[#111] uppercase leading-[1.05] mb-4">
              Real Builds &<br />
              Case Studies
            </h2>
            <p className="text-[#3b3f46] text-sm sm:text-base font-semibold leading-relaxed max-w-lg">
              Take a look at the state-of-the-art robotics labs and AI centers we've built. Real setups, real students, real impact.
            </p>
          </div>
          <Link 
            href="/projects" 
            className="group relative bg-[#111] text-white px-8 py-4 text-xs font-bold uppercase tracking-widest inline-flex items-center gap-3 transition-transform hover:-translate-y-1 hover:shadow-[4px_4px_0_#ff5400] shrink-0 w-fit"
          >
            Explore All <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* 4 Cards Row Grid - Small Squares */}
        <div className="grid grid-cols-4 gap-2 sm:gap-4 md:gap-6 pt-4 pr-font-sans pb-10 items-center justify-center max-w-6xl mx-auto w-full overflow-x-auto">
          {glimpseProjects.map((p, idx) => (
            <motion.a 
              style={{ y: idx % 2 === 0 ? yFast : ySlow }}
              initial={{ opacity: 0, y: 50, rotate: idx % 2 === 0 ? -2 : 2 }}
              whileInView={{ opacity: 1, rotate: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: idx * 0.1, type: "spring" }}
              href="/projects" 
              key={p.id} 
              className="block group"
            >
              <div className={`p-5 sm:p-6 aspect-square w-full flex flex-col justify-between relative overflow-hidden transition-all duration-300 hover:-translate-y-2 rounded-3xl ${p.cardClass} hover:border-[#ff5400]/50 shadow-xl`}>
                {/* Background Video */}
                <video 
                  src="/fff.mp4" 
                  autoPlay 
                  loop 
                  muted 
                  playsInline 
                  style={{ objectPosition: p.objectPosition, transform: p.transform, filter: p.filter }}
                  className="absolute inset-0 w-full h-full object-cover z-0 opacity-100 transition-transform duration-700 hover:!scale-[4]"
                />

                <div className="flex justify-between items-start z-20 relative">
                  <span className={`px-3 py-1.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest bg-white/20 backdrop-blur-md text-white rounded-full border border-white/20 shadow-md drop-shadow-md`}>{p.category}</span>
                  <ArrowUpRight size={20} className="text-white opacity-40 group-hover:opacity-100 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all hidden sm:block drop-shadow-md" />
                </div>
                <div className="z-20 mt-auto relative">
                  <h3 className="text-base sm:text-xl lg:text-3xl font-black uppercase tracking-tighter text-white mb-2 leading-[1.1] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{p.title}</h3>
                  <div className="flex items-center mt-3 pt-3 border-t border-white/40 shadow-sm">
                    <span className="font-mono text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-[#fff] group-hover:text-[#ff5400] transition-colors drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                      // {p.tech}
                    </span>
                  </div>
                </div>
              </div>
            </motion.a>
          ))}
        </div>

      </div>
    </section>
  );
}
