"use client";

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowUpRight,
  Cpu,
  Bot,
  BookOpen,
  Trophy,
  CheckCircle2
} from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

const detailedServices = [
  {
    number: "01",
    title: "Atal Tinkering Labs & Composite Skill Setup",
    description: "Turnkey NITI Aayog & CBSE compliant infrastructure — industrial FDM 3D printers, ESD workbenches, and precision testing instrumentation. Packages 1 through 4, fully audit-ready.",
    longDescription: "Our composite skill setups are not just equipment drops; they are fully engineered ecosystems. We handle the end-to-end installation of industrial FDM 3D printers, ESD-safe workbenches, precision electronics testing instrumentation, and modular maker zones. This ensures your campus is 100% audit-ready, providing students with safe, robust tools to prototype their wildest ideas.",
    features: ["Industrial FDM 3D Printers", "Soldering & ESD Stations", "AIM Compliant Kits", "Precision Multimeters", "Safety Audited Workspaces"],
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
    description: "Edge AI compute nodes, autonomous mobile robot arenas with 2D/3D LiDAR, indoor carbon-fiber quadcopters, and LoRaWAN mesh sensor fabrics.",
    longDescription: "Step into the future with our dedicated AI and Robotics arenas. We deploy NVIDIA Jetson edge compute nodes, 2D/3D LiDAR for SLAM navigation, and LoRaWAN mesh networks for campus-wide IoT. Our indoor carbon-fiber quadcopter testbeds allow students to write telemetry scripts and test autonomous flight algorithms safely.",
    features: ["NVIDIA Jetson Nodes", "2D/3D LiDAR Mapping", "Telemetry Drones", "LoRaWAN Sensor Fabric", "Custom Testbed Arenas"],
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
    longDescription: "Hardware is useless without pedagogy. Radix provides over 40 hours of accredited Master Trainer CPD (Continuous Professional Development) to empower your faculty. Our proprietary curriculum includes 300+ lesson plans perfectly mapped to the NEP 2020 framework. A resident engineer co-teaches weekly sessions to ensure seamless adoption.",
    features: ["40+ Hrs Faculty CPD", "300+ NEP Lesson Plans", "Resident Engineer Support", "Progress Assessments", "Digital Certifications"],
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
    description: "Cloud-based student grading LMS, digital skill passports, combat obstacle arenas, and specialized coaching for World Robot Olympiad (WRO).",
    longDescription: "We gamify learning through competition and track it with precision. Our cloud-based LMS integrates seamlessly with your school's infrastructure to provide digital skill passports. Beyond the classroom, we design combat and obstacle arenas to prepare students for the World Robot Olympiad (WRO) and national hackathons.",
    features: ["Cloud Skill Passports", "RoboWars Combat Arena", "WRO Coaching", "GitHub Portfolio Gen", "Performance Analytics"],
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

const labTiers = [
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
      "Bluetooth communication dongles for wireless logic"
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
      "Custom PCB prototyping breadboard kits"
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
      "Neural compute sticks for vision acceleration"
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
      "CNC milling and laser etching micro-stations"
    ],
    softwareStack: ["Fusion 360", "MoveIt 2", "PyTorch", "Simulink"],
    trainingHours: "75 Hrs Residency",
    studentsPerBatch: "80–120 Students",
    nepCompliance: "Senior Secondary",
    handwrittenNote: "the real deal → industry grade",
    topOffset: "top-32 sm:top-36 lg:top-40",
    zIndex: 40,
  }
];

export default function ServicesPage() {
  return (
    <div className="relative min-h-[100dvh] w-full max-w-full bg-paper text-[#1a1a1a] font-sans overflow-x-hidden">
      
      {/* --- NOTEBOOK RULED LINE BACKGROUND --- */}
      <div className="fixed inset-0 z-[-1] h-full w-full bg-notebook-subtle pointer-events-none"></div>

      {/* --- PAGE HEADER --- */}
      <section className="relative z-10 pt-32 pb-16 sm:pt-40 sm:pb-24 border-b border-[#e8e0d4] bg-white">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-16">
          <span className="font-handwriting text-xl sm:text-2xl text-[#FF6B6B] block mb-2">
            — complete ecosystem —
          </span>
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-[#1a1a1a] leading-[1.05] max-w-4xl">
            Detailed Services &<br />
            <span className="doodle-underline">Lab Packages</span>
          </h1>
          <p className="mt-6 text-[#6a6a6a] text-base sm:text-lg max-w-2xl leading-relaxed">
            From spatial CAD blueprints to resident engineer co-teaching, Radix delivers an integrated STEM execution stack. Explore our services and hardware tiers in detail below.
          </p>
        </div>
      </section>

      {/* --- SECTION 2: DETAILED PRODUCT & SERVICE MATRIX --- */}
      <section id="matrix" className="relative z-10 w-full overflow-hidden">
        {detailedServices.map((service, index) => {
          const Icon = service.icon;
          return (
            <div key={service.number} className={`${service.bgClass} relative overflow-hidden border-b border-[#333]/10`}>
              <div className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-16 py-16 sm:py-24">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-16 items-center w-full desktop-side-by-side">
                  
                  {/* Text Content */}
                  <div className="md:col-span-7 w-full desktop-left-col">
                    <div className="flex items-center gap-4 mb-5">
                      <span className={`text-6xl sm:text-8xl font-black ${service.textClass} opacity-20 font-mono leading-none`}>
                        {service.number}
                      </span>
                      <div className={`p-3 rounded-lg ${service.bgClass === 'section-black' ? 'bg-white/10' : 'bg-black/5'}`}>
                        <Icon size={24} className={service.textClass} />
                      </div>
                    </div>

                    <h3 className={`text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight ${service.textClass} mb-4`}>
                      {service.title}
                    </h3>

                    <p className={`${service.mutedClass} text-base sm:text-lg leading-relaxed mb-6 font-medium`}>
                      {service.description}
                    </p>

                    <div className={`p-6 sm:p-8 rounded-xl ${service.bgClass === 'section-black' ? 'bg-white/5 border border-white/10' : 'bg-black/5 border border-black/10'} mb-8`}>
                      <h4 className={`text-xs font-bold uppercase tracking-widest ${service.textClass} opacity-70 mb-3`}>Deep Dive</h4>
                      <p className={`${service.textClass} opacity-90 text-sm leading-relaxed mb-6`}>
                        {service.longDescription}
                      </p>
                      <h4 className={`text-xs font-bold uppercase tracking-widest ${service.textClass} opacity-70 mb-3`}>Core Offerings</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {service.features.map((feature, fIdx) => (
                          <div key={fIdx} className="flex items-start gap-2">
                            <CheckCircle2 size={16} className={`${service.textClass} opacity-60 mt-0.5 shrink-0`} />
                            <span className={`text-sm font-medium ${service.textClass}`}>{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-8">
                      {service.tags.map((tag, tIdx) => (
                        <span key={tIdx} className={`sticker ${service.tagStyle} text-[10px]`}>
                          {tag}
                        </span>
                      ))}
                    </div>

                    <a href="https://wa.me/916001979712" target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg font-bold text-xs uppercase tracking-wider transition-all duration-300 ${
                        service.bgClass === 'section-black' ? 'bg-[#FFE66D] text-[#1a1a1a] hover:bg-white' : 'bg-[#1a1a1a] text-white hover:bg-[#333]'
                      } shadow-md hover:-translate-y-0.5`}>
                      {service.ctaText} <ArrowUpRight size={14} />
                    </a>
                  </div>

                  {/* Polaroid Image */}
                  <div className="md:col-span-5 w-full flex items-center justify-center md:justify-end desktop-right-col">
                    <div className={`polaroid ${service.rotation} w-full max-w-[500px] hover:rotate-0 transition-transform duration-500`}>
                      <div className="tape tape-top-center"></div>
                      <div className="relative w-full aspect-[16/11] overflow-hidden">
                        <Image src={service.image} alt={service.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 45vw" />
                      </div>
                      <span className="polaroid-caption font-handwriting text-lg">
                        {service.title.split(' ').slice(0, 3).join(' ')} ✦
                      </span>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* --- SECTION 3: DETAILED LAB PACKAGES --- */}
      <section id="lab-packages" className="relative z-10 w-full py-16 sm:py-24 bg-notebook-subtle border-b border-[#e8e0d4]">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-16">
          <div className="mb-14 sm:mb-20">
            <span className="font-handwriting text-xl sm:text-2xl text-[#FF6B6B] block mb-2">
              — hardware hierarchy —
            </span>
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-[#1a1a1a] leading-[1.05]">
              Interactive Lab <span className="doodle-underline">Tiers</span>
            </h2>
            <p className="mt-4 text-[#6a6a6a] text-sm sm:text-base max-w-lg leading-relaxed">
              Explore the exact specifications and hardware loadouts of our 4 progressive lab packages.
            </p>
          </div>

          <div className="relative space-y-12 sm:space-y-16 pb-16">
            {labTiers.map((tier, index) => (
              <div key={tier.id} style={{ zIndex: tier.zIndex }} className={`sticky ${tier.topOffset} transition-all duration-300`}>
                
                {/* Notebook Folder Tab */}
                <div className="flex items-center gap-2 pl-4 sm:pl-8">
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-t-lg font-mono font-bold text-xs sm:text-sm uppercase tracking-wider ${tier.tabBg} ${tier.tabText} shadow-sm border-t border-x border-[#e8e0d4]`}>
                    <span>TIER {tier.number}</span>
                    <span>/</span>
                    <span>{tier.shortTitle}</span>
                  </div>
                  <div className="font-handwriting text-sm text-[#8a8a8a] hidden sm:block">
                    {tier.gradeSpan}
                  </div>
                </div>

                <div className={`paper-card ${tier.rotation} hover:rotate-0 p-6 sm:p-10 lg:p-12 bg-white rounded-xl shadow-2xl border border-[#e8e0d4] transition-transform duration-300`}>
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-14 items-center w-full desktop-side-by-side">
                    
                    {/* Left: Written Content */}
                    <div className="md:col-span-7 w-full desktop-left-col">
                      <div className="flex flex-wrap items-center gap-2 mb-4">
                        <span className={`sticker ${tier.stickerColor}`}>Tier {tier.number} — {tier.gradeSpan}</span>
                        <span className="sticker sticker-white text-[10px]">{tier.nepCompliance}</span>
                      </div>

                      <h3 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-[#1a1a1a] leading-tight mb-2">
                        {tier.title}
                      </h3>

                      <div className="font-handwriting text-xl sm:text-2xl text-[#FF6B6B] mb-4">
                        {tier.handwrittenNote}
                      </div>

                      <p className="text-[#4a4a4a] text-base sm:text-lg leading-relaxed mb-6 max-w-xl font-medium">
                        {tier.tagline}
                      </p>

                      <div className="flex gap-4 mb-8">
                        <div className="paper-card-flat px-4 py-3 text-center bg-[#faf8f5] w-full">
                          <div className="text-[10px] font-bold text-[#8a8a8a] uppercase mb-1">Capacity</div>
                          <div className="text-lg sm:text-xl font-black text-[#1a1a1a]">{tier.studentsPerBatch}</div>
                        </div>
                        <div className="paper-card-flat px-4 py-3 text-center bg-[#faf8f5] w-full">
                          <div className="text-[10px] font-bold text-[#8a8a8a] uppercase mb-1">Faculty CPD</div>
                          <div className="text-lg sm:text-xl font-black text-[#FF6B6B]">{tier.trainingHours}</div>
                        </div>
                      </div>

                      <div className="mb-8 bg-[#faf8f5] border border-[#e8e0d4] rounded-xl p-6">
                        <div className="text-xs font-bold uppercase tracking-wider text-[#8a8a8a] mb-4">
                          ★ Detailed Hardware Loadout
                        </div>
                        <ul className="space-y-3">
                          {tier.hardwareStack.map((hw, hIdx) => (
                            <li key={hIdx} className="flex items-start gap-3 text-sm text-[#1a1a1a] font-medium">
                              <CheckCircle2 size={18} className="shrink-0 mt-0.5 text-[#FF6B6B]" />
                              <span>{hw}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-8">
                        {tier.softwareStack.map((sw, sIdx) => (
                          <span key={sIdx} className="sticker sticker-white text-[10px]">
                            {sw}
                          </span>
                        ))}
                      </div>

                      <a href="https://wa.me/916001979712" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-6 py-4 rounded-lg bg-[#1a1a1a] text-white font-bold text-xs uppercase tracking-wider hover:bg-[#333] transition-all shadow-md hover:-translate-y-0.5">
                        Request Tier {tier.number} Proposal <ArrowUpRight size={14} />
                      </a>
                    </div>

                    {/* Right: Polaroid Lab Photo */}
                    <div className="md:col-span-5 w-full flex items-center justify-center md:justify-end desktop-right-col">
                      <div className={`polaroid ${tier.rotation} w-full max-w-[500px]`}>
                        <div className="tape tape-top-left"></div>
                        <div className="tape tape-top-right"></div>
                        <div className="relative w-full aspect-[16/11] overflow-hidden">
                          <Image src={tier.image} alt={tier.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 45vw" />
                        </div>
                        <span className="polaroid-caption font-handwriting text-lg">
                          {tier.keyHighlight} ✦
                        </span>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="relative z-10 bg-[#1a1a1a] text-white pt-20 pb-12 overflow-hidden torn-edge-top">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-16 text-center relative z-10">
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight mb-8">
            Ready to upgrade your campus?
          </h2>
          <a href="https://wa.me/916001979712" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 px-8 py-5 rounded-xl bg-[#FFE66D] text-[#1a1a1a] font-bold text-sm uppercase tracking-widest hover:bg-white transition-all shadow-xl hover:-translate-y-1">
            Contact Engineering Team <ArrowUpRight size={18} />
          </a>
        </div>
      </footer>
    </div>
  );
}
