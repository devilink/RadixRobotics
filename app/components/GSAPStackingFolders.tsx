"use client";

import Image from 'next/image';
import { useRef } from 'react';
import { CheckCircle2, ArrowUpRight } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';

interface LabTier {
  id: string;
  number: string;
  title: string;
  shortTitle: string;
  tagline: string;
  gradeSpan: string;
  stickerColor: string;
  tabBg: string;
  tabText: string;
  rotation: string;
  image: string;
  hardwareStack: string[];
  softwareStack: string[];
  trainingHours: string;
  studentsPerBatch: string;
  nepCompliance: string;
  keyHighlight: string;
  handwrittenNote: string;
  topOffset: string;
  zIndex: number;
}

const labTiers: LabTier[] = [
  {
    id: "foundation",
    number: "01",
    title: "Foundation Tech Lab",
    shortTitle: "Foundation",
    tagline: "Igniting computational thinking, tactile snap-fit mechanics & sensor awareness for young makers.",
    gradeSpan: "Grades 3 – 5",
    stickerColor: "sticker-mint",
    tabBg: "bg-[#4ECDC4]",
    tabText: "text-[#1a1a1a]",
    rotation: "-rotate-[0.4deg]",
    image: "/foundation.png",
    keyHighlight: "Block Coding & Tactile Robotics",
    hardwareStack: [
      "Modular snap-fit robotic chassis & structural beams",
      "Ultrasonic distance sensors & IR line-tracking modules",
      "RGB LED matrix displays & piezo sound buzzer units",
      "Micro-servo motors, DC gearboxes & wheels",
    ],
    softwareStack: ["Scratch 3.0", "Radix Junior IDE", "RoboSim 2D"],
    trainingHours: "20 Hrs Faculty CPD",
    studentsPerBatch: "30–40 Students",
    nepCompliance: "Foundational Stage",
    handwrittenNote: "perfect for curious beginners! ★",
    topOffset: "top-20 sm:top-24 lg:top-28",
    zIndex: 10,
  },
  {
    id: "innovation",
    number: "02",
    title: "Innovation & Microcontroller Lab",
    shortTitle: "Innovation",
    tagline: "Transitioning from block logic to embedded C/C++, IoT breadboarding & real sensor physics.",
    gradeSpan: "Grades 6 – 8",
    stickerColor: "sticker-purple",
    tabBg: "bg-[#6B5B95]",
    tabText: "text-white",
    rotation: "rotate-[0.3deg]",
    image: "/innovation.png",
    keyHighlight: "ESP32 & IoT Mesh Telemetry",
    hardwareStack: [
      "ESP32 & Arduino dual-core Wi-Fi/BT microcontrollers",
      "Environmental multi-sensor array (DHT22, Gas, Light)",
      "High-torque metal-gear servos & motor drivers",
      "OLED telemetry displays & matrix keypads",
    ],
    softwareStack: ["Arduino IDE 2.x", "Embedded C++", "MicroPython"],
    trainingHours: "35 Hrs Faculty CPD",
    studentsPerBatch: "40–60 Students",
    nepCompliance: "Middle Stage",
    handwrittenNote: "where coding gets real →",
    topOffset: "top-24 sm:top-28 lg:top-32",
    zIndex: 20,
  },
  {
    id: "future-ready",
    number: "03",
    title: "Future-Ready AI & Drone Lab",
    shortTitle: "AI & Drone",
    tagline: "Mastering ROS robotics middleware, computer vision, aerial telemetry & edge neural networks.",
    gradeSpan: "Grades 9 – 10",
    stickerColor: "sticker-blue",
    tabBg: "bg-[#45B7D1]",
    tabText: "text-white",
    rotation: "-rotate-[0.3deg]",
    image: "/future-ready.png",
    keyHighlight: "NVIDIA Jetson & ROS 2",
    hardwareStack: [
      "NVIDIA Jetson Nano / Raspberry Pi 5 AI boards",
      "360° 2D LiDAR scanners & HD vision modules",
      "Indoor carbon-fiber quadcopter flight kits",
      "4-wheel omnidirectional mecanum chassis",
    ],
    softwareStack: ["ROS 2 Humble", "Python 3.11", "OpenCV", "ArduPilot"],
    trainingHours: "50 Hrs Faculty CPD",
    studentsPerBatch: "40–80 Students",
    nepCompliance: "Secondary Stage",
    handwrittenNote: "this is where it gets wild! ✦",
    topOffset: "top-28 sm:top-32 lg:top-36",
    zIndex: 30,
  },
  {
    id: "signature",
    number: "04",
    title: "Signature Composite Research Lab",
    shortTitle: "Signature Lab",
    tagline: "Industrial capstone facility: 6-DOF robotic arms, 3D CAD/FDM printing & autonomous systems.",
    gradeSpan: "Grades 11 – 12",
    stickerColor: "sticker-coral",
    tabBg: "bg-[#FF6B6B]",
    tabText: "text-white",
    rotation: "rotate-[0.4deg]",
    image: "/signature.png",
    keyHighlight: "6-DOF Manipulators & 3D CAD",
    hardwareStack: [
      "6-Axis industrial robotic manipulator with gripper",
      "Enclosed precision FDM 3D printer suite",
      "NVIDIA Jetson Orin workstation with CUDA",
      "Industrial ToF & load cell sensor arrays",
    ],
    softwareStack: ["Fusion 360", "MoveIt 2", "PyTorch", "Simulink"],
    trainingHours: "75 Hrs Residency",
    studentsPerBatch: "80–120 Students",
    nepCompliance: "Senior Secondary",
    handwrittenNote: "the real deal → industry grade",
    topOffset: "top-32 sm:top-36 lg:top-40",
    zIndex: 40,
  },
  {
    id: "csr-gov",
    number: "05",
    title: "CSR & NITI Aayog ATL Skill Lab",
    shortTitle: "ATL / CSR",
    tagline: "Turnkey government & CSR lab deployment scaled for institutional and community impact.",
    gradeSpan: "Grades 6 – 12",
    stickerColor: "sticker-yellow",
    tabBg: "bg-[#FFE66D]",
    tabText: "text-[#1a1a1a]",
    rotation: "-rotate-[0.2deg]",
    image: "/robotics_lab.png",
    keyHighlight: "NITI Aayog Turnkey Compliant",
    hardwareStack: [
      "Complete Packages 1, 2, 3 & 4 AIM compliant",
      "Bulk student DIY kits in ruggedized cases",
      "Dual 3D Printers & mechanical bench",
      "Solar renewable energy demonstrator kits",
    ],
    softwareStack: ["Open-Source Suites", "AIM Curriculum", "Radix Cloud LMS"],
    trainingHours: "60 Hrs Faculty CPD",
    studentsPerBatch: "100+ Students",
    nepCompliance: "National Certified",
    handwrittenNote: "government-ready, zero hassle ✓",
    topOffset: "top-36 sm:top-40 lg:top-44",
    zIndex: 50,
  }
];

export default function GSAPStackingFolders() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const yFast = useTransform(scrollYProgress, [0, 1], [-100, 100]);
  const ySlow = useTransform(scrollYProgress, [0, 1], [-40, 40]);
  
  // Scrubbed Scale Reveal
  const scaleReveal = useTransform(scrollYProgress, [0.1, 0.5], [0.5, 1]);
  const opacityReveal = useTransform(scrollYProgress, [0.1, 0.4], [0, 1]);
  const blurReveal = useTransform(scrollYProgress, [0.1, 0.4], ["blur(20px)", "blur(0px)"]);

  return (
    <section ref={containerRef} id="packages" className="relative z-10 w-full py-16 sm:py-24 bg-grid border-b border-[#e8e0d4] overflow-hidden">
      
      {/* Background Parallax Watermark */}
      <motion.div style={{ y: yFast }} className="absolute right-0 top-1/4 text-[250px] font-black text-[#111] opacity-[0.02] select-none pointer-events-none pr-font-sans leading-none">
        PACKAGES
      </motion.div>

      <div className="w-full 2xl:px-24 mx-auto px-4 sm:px-8 lg:px-16 relative z-10">

        {/* Section Header */}
        <div className="mb-14 sm:mb-16 text-center">
          <span className="font-handwriting text-xl sm:text-2xl text-[#FF6B6B] block mb-2">
            — core packages —
          </span>
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-[#1a1a1a] leading-[1.05]">
            Lab Packages &<br />
            <span className="doodle-underline">Future-Ready</span> Tracks
          </h2>
          <p className="mt-4 text-[#6a6a6a] text-sm sm:text-base max-w-lg mx-auto leading-relaxed">
            A quick glimpse of our turnkey hardware packages. Click to view full details.
          </p>
        </div>

        {/* Glimpse Cards Grid */}
        <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:gap-8 max-w-5xl mx-auto overflow-visible">
          {labTiers.slice(0, 4).map((tier, index) => {
            return (
            <motion.a
              style={{ 
                y: index % 2 === 0 ? ySlow : yFast,
                scale: scaleReveal,
                opacity: opacityReveal,
                filter: blurReveal
              }}
              key={tier.id}
              href={`/services#${tier.id}`}
              className={`relative aspect-square rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden group cursor-pointer shadow-lg hover:shadow-2xl transition-shadow duration-500 block ${tier.rotation}`}
            >
              <Image 
                src={tier.image} 
                alt={tier.title} 
                fill 
                priority={index < 4}
                className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out" 
                sizes="(max-width: 768px) 50vw, 25vw" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent opacity-80 group-hover:opacity-95 transition-opacity duration-500"></div>
              
              <div className="absolute inset-0 p-4 sm:p-6 lg:p-10 flex flex-col justify-end">
                <div className="transform translate-y-0">
                  <span className={`inline-block px-2 sm:px-3 py-1 text-[8px] sm:text-[10px] font-bold uppercase rounded-md mb-2 sm:mb-3 shadow-sm ${tier.tabBg} ${tier.tabText}`}>
                    {tier.shortTitle}
                  </span>
                  
                  <h3 className="text-lg sm:text-xl lg:text-3xl font-black text-white leading-tight">
                    {tier.title}
                  </h3>
                  
                  <div className="grid grid-rows-[0fr] group-hover:grid-rows-[1fr] transition-[grid-template-rows] duration-500 ease-in-out mt-0 group-hover:mt-3">
                    <div className="overflow-hidden">
                      <p className="text-white/90 text-[10px] sm:text-sm leading-relaxed mb-4 line-clamp-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                        {tier.tagline}
                      </p>
                      
                      <div className="inline-flex items-center gap-1 text-white font-bold text-[9px] sm:text-xs uppercase tracking-wider group-hover:text-[#FFE66D] transition-colors opacity-0 group-hover:opacity-100 duration-500 delay-150">
                        Explore Details <ArrowUpRight size={12} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
