"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import LiveProjectButton from "../ui/LiveProjectButton";
import { ArrowUpRight } from "lucide-react";

const PROJECTS = [
  {
    id: "01",
    category: "Autonomous Systems & SLAM",
    name: "ROS 2 Autonomous LiDAR Rover",
    studentGrade: "Grade 10–12",
    complexity: "Master",
    description: "Full-stack autonomous mobile robot utilizing 360° LiDAR and SLAM algorithms to map unknown environments and navigate with obstacle avoidance.",
    techStack: ["ROS 2 Humble", "Python 3.11", "Cartographer SLAM", "Nav2"],
    telemetryMetrics: [
      { label: "SLAM Precision", val: "±2 mm" },
      { label: "Lidar Range", val: "12 m" },
      { label: "Loop Rate", val: "50 Hz" }
    ],
    technicalNote: "SYS_CAPABILITY: AUTO_MAPPING"
  },
  {
    id: "02",
    category: "Aero & Autonomous Flight",
    name: "Autonomous Aerial Survey Drone",
    studentGrade: "Grade 9–11",
    complexity: "Advanced",
    description: "Custom carbon-fiber drone with ArduPilot flight controllers, real-time GPS telemetry, geofence fail-safe, and autonomous agricultural survey logging.",
    techStack: ["ArduPilot", "Mission Planner", "MAVLink", "Optical Flow"],
    telemetryMetrics: [
      { label: "Range", val: "3.5 km" },
      { label: "Stability", val: "±0.5 m" },
      { label: "Payload", val: "750 g" }
    ],
    technicalNote: "SYS_CAPABILITY: AUTO_FLIGHT"
  },
  {
    id: "03",
    category: "Manipulators & Kinematics",
    name: "6-DOF Vision Robotic Arm",
    studentGrade: "Grade 9–12",
    complexity: "Advanced",
    description: "Real-time hand-pose tracking through HD camera translating finger joint coordinates into inverse kinematics for a 6-axis robotic arm.",
    techStack: ["OpenCV", "MediaPipe AI", "IK Kinematics", "ESP-NOW"],
    telemetryMetrics: [
      { label: "Freedom", val: "6-Axis" },
      { label: "Latency", val: "< 18 ms" },
      { label: "Payload", val: "1.2 kg" }
    ],
    technicalNote: "SYS_CAPABILITY: TELEOP_SYNC"
  }
];

export default function ProjectsSection() {
  return (
    <section id="projects" className="relative w-full bg-[#0C0C0C] rounded-t-[40px] sm:rounded-t-[50px] md:rounded-t-[60px] -mt-10 sm:-mt-12 md:-mt-14 z-30 pt-20 pb-40 px-4 sm:px-8 md:px-16">
      <div className="w-full flex justify-center mb-16 sm:mb-24">
        <h2 className="hero-heading font-black uppercase tracking-tight text-[clamp(3rem,12vw,160px)] leading-none text-center">
          Projects
        </h2>
      </div>

      <div className="max-w-[1400px] mx-auto flex flex-col gap-10">
        {PROJECTS.map((project, i) => (
          <ProjectCard key={project.id} project={project} index={i} totalCards={PROJECTS.length} />
        ))}
      </div>
    </section>
  );
}

function ProjectCard({ project, index, totalCards }: { project: any; index: number; totalCards: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const targetScale = 1 - (totalCards - 1 - index) * 0.03;
  const scale = useTransform(scrollYProgress, [0, 1], [1, targetScale]);

  return (
    <div ref={containerRef} className="h-[85vh] w-full flex items-start justify-center">
      <motion.div 
        style={{ 
          scale,
          top: `calc(6rem + ${index * 28}px)`
        }}
        className="sticky w-full h-[65vh] md:h-[70vh] bg-[#0a0a0a] border-2 border-[#D7E2EA]/20 rounded-[40px] sm:rounded-[50px] md:rounded-[60px] p-6 sm:p-10 md:p-14 flex flex-col justify-between shadow-2xl overflow-hidden"
      >
        
        {/* Top Row */}
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 z-10">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <span className="text-[#D7E2EA]/30 font-black text-6xl sm:text-7xl md:text-8xl leading-none">
                {project.id}
              </span>
              <div className="flex flex-col">
                <span className="text-[#D7E2EA]/50 font-mono uppercase tracking-widest text-xs sm:text-sm mb-1">
                  [ {project.complexity} ] {project.studentGrade}
                </span>
                <span className="text-[#D7E2EA]/80 font-light uppercase tracking-widest text-xs sm:text-sm">
                  {project.category}
                </span>
              </div>
            </div>
            
            <h3 className="text-[#D7E2EA] font-medium uppercase text-3xl sm:text-4xl md:text-6xl leading-[0.9] max-w-3xl mt-4">
              {project.name}
            </h3>
          </div>
          
          <LiveProjectButton 
            label="View Blueprint"
            href="https://wa.me/916001979712?text=I%20am%20interested%20in%20learning%20more%20about%20Radix%20student%20capstone%20projects" 
            className="shrink-0 w-fit self-start hidden lg:flex" 
          />
        </div>

        {/* Bottom Row - Data Grid instead of Images */}
        <div className="flex flex-col md:flex-row gap-8 md:gap-16 z-10 w-full pt-8 border-t border-[#D7E2EA]/10">
          
          <div className="flex-1">
            <div className="font-mono text-[9px] text-[#D7E2EA]/60 mb-4 font-semibold tracking-widest uppercase">
              + {project.technicalNote}
            </div>
            <p className="text-[#D7E2EA]/70 font-light text-sm sm:text-base md:text-lg leading-relaxed max-w-2xl mb-8">
              {project.description}
            </p>
            
            {/* Tech stack tags */}
            <div className="flex flex-wrap gap-2">
              {project.techStack.map((tech: string, techIdx: number) => (
                <span key={techIdx} className="font-mono text-[9px] uppercase tracking-widest px-3 py-1.5 border border-[#D7E2EA]/20 text-[#D7E2EA]/70 rounded-md bg-white/5">
                  {tech}
                </span>
              ))}
            </div>
          </div>

          <div className="w-full md:w-[350px] shrink-0 flex flex-col justify-end">
            <div className="grid grid-cols-3 gap-3 p-6 glass-panel border border-white/5 rounded-2xl bg-white/[0.02]">
              {project.telemetryMetrics.map((tel: any, tIdx: number) => (
                <div key={tIdx} className="text-center">
                  <div className="text-[8px] font-mono text-white/30 uppercase font-semibold tracking-widest mb-2">{tel.label}</div>
                  <div className="text-xs sm:text-sm font-mono font-light text-white">{tel.val}</div>
                </div>
              ))}
            </div>
          </div>
          
        </div>

        {/* Background Accent */}
        <div className="absolute top-0 right-0 w-[50%] h-full bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.03)_0%,transparent_60%)] pointer-events-none z-0"></div>

      </motion.div>
    </div>
  );
}
