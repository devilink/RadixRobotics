"use client";

import { useState } from 'react';
import { ArrowUpRight, Cpu } from 'lucide-react';

interface CapstoneBuild {
  id: string;
  title: string;
  category: string;
  studentGrade: string;
  complexity: 'Intermediate' | 'Advanced' | 'Master';
  stickerColor: string;
  rotation: string;
  bgColor: string;
  textColor: string;
  mutedColor: string;
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
    stickerColor: "sticker-blue",
    rotation: "rotate-[0.5deg]",
    bgColor: "bg-[#1a1a1a]",
    textColor: "text-[#faf8f5]",
    mutedColor: "text-[#999]",
    description: "Full-stack autonomous mobile robot utilizing 360° LiDAR and SLAM algorithms to map unknown environments and navigate with obstacle avoidance.",
    techStack: ["ROS 2 Humble", "Python 3.11", "Cartographer SLAM", "Nav2"],
    telemetryMetrics: [
      { label: "SLAM Precision", val: "±2 mm" },
      { label: "Lidar Range", val: "12 m" },
      { label: "Loop Rate", val: "50 Hz" }
    ],
    handwrittenNote: "this robot maps rooms by itself!"
  },
  {
    id: "drone-telemetry",
    title: "Autonomous Aerial Survey Drone",
    category: "Aero & Autonomous Flight",
    studentGrade: "Grade 9–11",
    complexity: "Advanced",
    stickerColor: "sticker-coral",
    rotation: "-rotate-[0.5deg]",
    bgColor: "bg-[#FFE66D]",
    textColor: "text-[#1a1a1a]",
    mutedColor: "text-[#4a4a4a]",
    description: "Custom carbon-fiber drone with ArduPilot flight controllers, real-time GPS telemetry, geofence fail-safe, and autonomous agricultural survey logging.",
    techStack: ["ArduPilot", "Mission Planner", "MAVLink", "Optical Flow"],
    telemetryMetrics: [
      { label: "Range", val: "3.5 km" },
      { label: "Stability", val: "±0.5 m" },
      { label: "Payload", val: "750 g" }
    ],
    handwrittenNote: "flies completely on its own ✦"
  },
  {
    id: "gesture-arm",
    title: "6-DOF Vision Robotic Arm",
    category: "Manipulators & Kinematics",
    studentGrade: "Grade 9–12",
    complexity: "Advanced",
    stickerColor: "sticker-yellow",
    rotation: "rotate-1",
    bgColor: "bg-white",
    textColor: "text-[#1a1a1a]",
    mutedColor: "text-[#6a6a6a]",
    description: "Real-time hand-pose tracking through HD camera translating finger joint coordinates into inverse kinematics for a 6-axis robotic arm.",
    techStack: ["OpenCV", "MediaPipe AI", "IK Kinematics", "ESP-NOW"],
    telemetryMetrics: [
      { label: "Freedom", val: "6-Axis" },
      { label: "Latency", val: "< 18 ms" },
      { label: "Payload", val: "1.2 kg" }
    ],
    handwrittenNote: "your hand controls the robot! →"
  },
  {
    id: "smart-agro",
    title: "LoRaWAN Smart Agro Hub",
    category: "Industrial IoT & Nodes",
    studentGrade: "Grade 8–10",
    complexity: "Intermediate",
    stickerColor: "sticker-mint",
    rotation: "-rotate-[0.8deg]",
    bgColor: "bg-[#1a1a1a]",
    textColor: "text-[#faf8f5]",
    mutedColor: "text-[#999]",
    description: "Solar-powered environmental monitoring grid broadcasting soil moisture, NPK indices, and humidity over 10km LoRa mesh with automated micro-drip irrigation.",
    techStack: ["LoRaWAN Mesh", "MicroPython", "MQTT", "Grafana"],
    telemetryMetrics: [
      { label: "Mesh Range", val: "10+ km" },
      { label: "Autonomy", val: "24/7" },
      { label: "Savings", val: "42%" }
    ],
    handwrittenNote: "solar powered + self-watering ★"
  },
  {
    id: "edge-ai-sorter",
    title: "TensorFlow Edge Vision Sorter",
    category: "Edge AI & Automation",
    studentGrade: "Grade 11–12",
    complexity: "Master",
    stickerColor: "sticker-purple",
    rotation: "rotate-[0.3deg]",
    bgColor: "bg-[#FFE66D]",
    textColor: "text-[#1a1a1a]",
    mutedColor: "text-[#4a4a4a]",
    description: "Miniature automated conveyor with an Edge TPU neural accelerator performing real-time defect classification on 3D printed parts.",
    techStack: ["TensorFlow Lite", "Coral Edge TPU", "PLC Relays", "Node-RED"],
    telemetryMetrics: [
      { label: "Inference", val: "60 FPS" },
      { label: "Accuracy", val: "99.2%" },
      { label: "Throughput", val: "120/m" }
    ],
    handwrittenNote: "AI that spots defects in real-time"
  },
  {
    id: "hexapod-walker",
    title: "18-Servo Biomimetic Hexapod",
    category: "Mechatronics & Gait",
    studentGrade: "Grade 9–12",
    complexity: "Advanced",
    stickerColor: "sticker-pink",
    rotation: "-rotate-1",
    bgColor: "bg-white",
    textColor: "text-[#1a1a1a]",
    mutedColor: "text-[#6a6a6a]",
    description: "Biological gait engine coordinating 18 synchronized servo actuators across six legs, maintaining dynamic balance via real-time IMU sensor fusion.",
    techStack: ["IK Gait Engine", "C++ RTOS", "Sensor Fusion", "Bluetooth 5"],
    telemetryMetrics: [
      { label: "Actuators", val: "18 Servos" },
      { label: "Gait", val: "Dynamic" },
      { label: "Terrain", val: "Adaptive" }
    ],
    handwrittenNote: "walks like a real insect! 🕷"
  }
];

export default function RealBuildsShowcase() {
  const [activeFilter, setActiveFilter] = useState<'All' | 'Master' | 'Advanced' | 'Intermediate'>('All');

  const filteredBuilds = activeFilter === 'All'
    ? builds
    : builds.filter((b) => b.complexity === activeFilter);

  return (
    <section id="showcase" className="relative z-10 w-full py-16 sm:py-24 bg-paper border-b border-[#e8e0d4] overflow-hidden">

      <div className="w-full 2xl:px-24 mx-auto px-4 sm:px-8 lg:px-16">

        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10 sm:mb-14">
          <div>
            <span className="font-handwriting text-xl sm:text-2xl text-[#FF6B6B] block mb-2">
              — student capstone projects —
            </span>
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-[#1a1a1a] leading-[1.05]">
              From Prototype to<br />
              <span className="doodle-underline">Competition Blueprint</span>
            </h2>
          </div>

          {/* Filter stickers */}
          <div className="flex flex-wrap gap-2">
            {(['All', 'Master', 'Advanced', 'Intermediate'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`sticker cursor-pointer transition-all ${
                  activeFilter === filter
                    ? 'sticker-dark scale-110'
                    : 'sticker-white opacity-70 hover:opacity-100'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Build Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {filteredBuilds.map((build) => (
            <div
              key={build.id}
              className={`paper-card ${build.rotation} hover:rotate-0 p-5 sm:p-7 flex flex-col justify-between transition-all duration-300`}
            >
              <div>
                {/* Top badges */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className={`sticker ${build.stickerColor} text-[9px]`}>
                    {build.complexity}
                  </span>
                  <span className="text-xs font-mono text-[#8a8a8a] font-bold">
                    {build.studentGrade}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-lg sm:text-xl font-black text-[#1a1a1a] tracking-tight leading-snug mb-1">
                  {build.title}
                </h3>
                <div className="text-[11px] font-mono text-[#8a8a8a] uppercase tracking-wider font-semibold mb-2">
                  {build.category}
                </div>

                {/* Handwritten note */}
                <div className="font-handwriting text-sm text-[#FF6B6B] mb-3">
                  {build.handwrittenNote}
                </div>

                <p className="text-[#4a4a4a] text-xs sm:text-sm leading-relaxed mb-4">
                  {build.description}
                </p>

                {/* Telemetry chips */}
                <div className="grid grid-cols-3 gap-2 mb-4 p-3 bg-[#faf8f5] border border-[#e8e0d4] rounded-md">
                  {build.telemetryMetrics.map((tel, tIdx) => (
                    <div key={tIdx} className="text-center">
                      <div className="text-[9px] font-mono text-[#8a8a8a] uppercase font-semibold">{tel.label}</div>
                      <div className="text-xs font-mono font-black text-[#1a1a1a] mt-0.5">{tel.val}</div>
                    </div>
                  ))}
                </div>

                {/* Tech stack tags */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {build.techStack.map((tech, techIdx) => (
                    <span key={techIdx} className="sticker sticker-white text-[9px]">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              {/* CTA */}
              <a
                href="https://wa.me/916001979712?text=I%20am%20interested%20in%20learning%20more%20about%20Radix%20student%20capstone%20projects"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 rounded-md bg-[#1a1a1a] hover:bg-[#333] text-white font-bold text-xs uppercase tracking-wider inline-flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                View Blueprint <ArrowUpRight size={13} />
              </a>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
