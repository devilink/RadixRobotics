"use client";

import { useState } from 'react';
import { ArrowUpRight, Cpu } from 'lucide-react';

interface CapstoneBuild {
  id: string;
  title: string;
  category: string;
  studentGrade: string;
  complexity: 'Intermediate' | 'Advanced' | 'Master';
  bgColor: string;
  textColor: string;
  mutedColor: string;
  borderColor: string;
  shadowColor: string;
  description: string;
  techStack: string[];
  telemetryMetrics: { label: string; val: string }[];
  handwrittenNote: string;
}

const builds: CapstoneBuild[] = [
  {
    id: "ros-rover",
    title: "ROS 2 Autonomous LiDAR Rover",
    category: "Autonomous Systems & SLAM",
    studentGrade: "Grade 10–12",
    complexity: "Master",
    bgColor: "bg-[#111]",
    textColor: "text-[#f8f7ef]",
    mutedColor: "text-[#a1a1aa]",
    borderColor: "border-[#111]",
    shadowColor: "shadow-[8px_8px_0px_#ff5400]",
    description: "Full-stack autonomous mobile robot utilizing 360° LiDAR and SLAM algorithms to map unknown environments and navigate with obstacle avoidance.",
    techStack: ["ROS 2 Humble", "Python 3.11", "Cartographer SLAM", "Nav2"],
    telemetryMetrics: [
      { label: "SLAM Precision", val: "±2 mm" },
      { label: "Lidar Range", val: "12 m" },
      { label: "Loop Rate", val: "50 Hz" }
    ],
    handwrittenNote: "Maps rooms autonomously!"
  },
  {
    id: "drone-telemetry",
    title: "Autonomous Aerial Survey Drone",
    category: "Aero & Autonomous Flight",
    studentGrade: "Grade 9–11",
    complexity: "Advanced",
    bgColor: "bg-[#ff5400]",
    textColor: "text-white",
    mutedColor: "text-white/80",
    borderColor: "border-[#111]",
    shadowColor: "shadow-[8px_8px_0px_#111]",
    description: "Custom carbon-fiber drone with ArduPilot flight controllers, real-time GPS telemetry, geofence fail-safe, and autonomous agricultural survey logging.",
    techStack: ["ArduPilot", "Mission Planner", "MAVLink", "Optical Flow"],
    telemetryMetrics: [
      { label: "Range", val: "3.5 km" },
      { label: "Stability", val: "±0.5 m" },
      { label: "Payload", val: "750 g" }
    ],
    handwrittenNote: "Full autonomous waypoint flight"
  },
  {
    id: "gesture-arm",
    title: "6-DOF Vision Robotic Arm",
    category: "Manipulators & Kinematics",
    studentGrade: "Grade 9–12",
    complexity: "Advanced",
    bgColor: "bg-white",
    textColor: "text-[#111]",
    mutedColor: "text-[#646a73]",
    borderColor: "border-[#111]",
    shadowColor: "shadow-[8px_8px_0px_#111]",
    description: "Real-time hand-pose tracking through HD camera translating finger joint coordinates into inverse kinematics for a 6-axis robotic arm.",
    techStack: ["OpenCV", "MediaPipe AI", "IK Kinematics", "ESP-NOW"],
    telemetryMetrics: [
      { label: "Freedom", val: "6-Axis" },
      { label: "Latency", val: "< 18 ms" },
      { label: "Payload", val: "1.2 kg" }
    ],
    handwrittenNote: "Hand gestures control the arm!"
  },
  {
    id: "smart-agro",
    title: "LoRaWAN Smart Agro Hub",
    category: "Industrial IoT & Nodes",
    studentGrade: "Grade 8–10",
    complexity: "Intermediate",
    bgColor: "bg-[#111]",
    textColor: "text-[#f8f7ef]",
    mutedColor: "text-[#a1a1aa]",
    borderColor: "border-[#111]",
    shadowColor: "shadow-[8px_8px_0px_white]",
    description: "Solar-powered environmental monitoring grid broadcasting soil moisture, NPK indices, and humidity over 10km LoRa mesh with automated micro-drip irrigation.",
    techStack: ["LoRaWAN Mesh", "MicroPython", "MQTT", "Grafana"],
    telemetryMetrics: [
      { label: "Mesh Range", val: "10+ km" },
      { label: "Autonomy", val: "24/7" },
      { label: "Savings", val: "42%" }
    ],
    handwrittenNote: "Data viz dashboard included"
  }
];

export default function RealBuildsShowcase() {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <section className="relative z-10 py-12 sm:py-16 md:py-24 max-w-[1536px] mx-auto px-4 sm:px-8 lg:px-16">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 md:gap-12">
        {builds.map((build, idx) => (
          <div 
            key={build.id}
            onMouseEnter={() => setHoveredId(build.id)}
            onMouseLeave={() => setHoveredId(null)}
            className={`
              relative p-6 sm:p-8 md:p-12 transition-all duration-300
              border-2 ${build.borderColor} ${build.bgColor} ${build.textColor}
              hover:-translate-y-2 group ${build.shadowColor} rounded-none
            `}
          >

            {/* Sticker Decorator */}
            <div className={`
              absolute -top-4 -right-4 md:-top-6 md:-right-6 
              px-3 py-2 text-[9px] md:text-xs font-black uppercase tracking-widest text-[#111] bg-[#f2f3f5]
              transform rotate-6 border-2 border-[#111] shadow-[2px_2px_0px_#111]
            `}>
              {build.complexity}
            </div>

            {/* Header section */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
              <div>
                <div className={`font-mono text-xs font-bold uppercase tracking-widest mb-3 ${build.mutedColor}`}>
                  // {build.category}
                </div>
                <h3 className="text-xl sm:text-2xl md:text-4xl font-black uppercase tracking-tighter leading-[1.05] max-w-sm">
                  {build.title}
                </h3>
              </div>
              <div className="flex flex-col items-start sm:items-end gap-2">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-black uppercase tracking-widest border-2 ${build.borderColor}`}>
                  <Cpu size={12} strokeWidth={2.5} /> {build.studentGrade}
                </span>
                <div className={`font-mono text-[10px] uppercase font-bold tracking-widest ${build.mutedColor}`}>
                  Live Deploy
                </div>
              </div>
            </div>

            <p className={`text-base md:text-lg font-medium leading-relaxed mb-10 max-w-md ${build.mutedColor}`}>
              {build.description}
            </p>

            {/* Telemetry Dashboard Box */}
            <div className={`
              mb-8 p-4 md:p-6 border-2 ${build.borderColor} ${build.bgColor === 'bg-[#111]' ? 'bg-[#1a1a1a]' : 'bg-[#fff] text-[#111]'}
            `}>
              <h4 className={`text-[10px] font-black uppercase tracking-widest mb-4 flex items-center gap-2 ${build.bgColor === 'bg-[#111]' ? 'text-[#ff5400]' : 'text-[#ff5400]'}`}>
                <div className="w-1.5 h-1.5 rounded-full bg-[#ff5400] animate-pulse"></div> Live Telemetry
              </h4>
              <div className="grid grid-cols-3 gap-4">
                {build.telemetryMetrics.map((metric, i) => (
                  <div key={i} className="flex flex-col">
                    <span className="text-[9px] font-bold uppercase tracking-widest opacity-60 mb-1">{metric.label}</span>
                    <span className="font-mono text-base md:text-xl font-black">{metric.val}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-6 pt-6 border-t-2 border-[#111] border-opacity-20">
              
              {/* Tech Stack Pills */}
              <div className="flex flex-wrap gap-2">
                {build.techStack.map((tech) => (
                  <span 
                    key={tech} 
                    className={`
                      px-2.5 py-1 text-[9px] md:text-[10px] font-bold uppercase tracking-widest
                      border-2 ${build.borderColor} border-opacity-40
                    `}
                  >
                    {tech}
                  </span>
                ))}
              </div>

              {/* Action Button */}
              <button 
                className={`
                  w-10 h-10 flex items-center justify-center border-2 border-[#111] shadow-[2px_2px_0px_#111] bg-white text-[#111]
                  group-hover:bg-[#ff5400] group-hover:text-white transition-colors duration-300
                `}
                aria-label="View Project Specs"
              >
                <ArrowUpRight size={20} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
