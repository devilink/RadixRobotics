"use client";

import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight, Cpu, Bot, BookOpen, Trophy, CheckCircle2 } from 'lucide-react';
import Navbar from '@/app/components/Navbar';
import Footer from '@/app/components/Footer';
import Breadcrumbs from '@/app/components/Breadcrumbs';

const detailedServices = [
  {
    number: "01",
    title: "Atal Tinkering Labs & Composite Skill Setup",
    description: "Turnkey NITI Aayog & CBSE compliant infrastructure — industrial FDM 3D printers, ESD workbenches, and precision testing instrumentation. Packages 1 through 4, fully audit-ready.",
    features: ["Industrial FDM 3D Printers", "Soldering & ESD Stations", "AIM Compliant Kits", "Precision Multimeters", "Safety Audited Workspaces"],
    tags: ["FDM 3D Printer", "Soldering Station", "Anti-Static Bench", "AIM Kits"],
    bgClass: "bg-[#111]",
    textClass: "text-white",
    mutedClass: "text-[#a1a1aa]",
    image: "/foundation.png",
    ctaText: "Request Spec Sheet",
    icon: Cpu
  },
  {
    number: "02",
    title: "AI, IoT, Robotics & Drone Arenas",
    description: "Edge AI compute nodes, autonomous mobile robot arenas with 2D/3D LiDAR, indoor carbon-fiber quadcopters, and LoRaWAN mesh sensor fabrics.",
    features: ["NVIDIA Jetson Nodes", "2D/3D LiDAR Mapping", "Telemetry Drones", "LoRaWAN Sensor Fabric", "Custom Testbed Arenas"],
    tags: ["NVIDIA Jetson", "2D/3D LiDAR", "Telemetry Drone", "LoRaWAN", "OpenCV"],
    bgClass: "bg-[#ff5400]",
    textClass: "text-white",
    mutedClass: "text-white/80",
    image: "/future-ready.png",
    ctaText: "Inspect Rig",
    icon: Bot
  },
  {
    number: "03",
    title: "Teacher Training & NEP 2020 Curriculum",
    description: "40+ hours of accredited Master Trainer faculty masterclasses, 300+ structured lesson plans for Grades 3–12, and weekly on-campus resident engineer co-teaching sessions.",
    features: ["40+ Hrs Faculty CPD", "300+ NEP Lesson Plans", "Resident Engineer Support", "Progress Assessments", "Digital Certifications"],
    tags: ["300+ Lesson Plans", "NEP Mapped", "Faculty CPD", "1:1 Mentorship"],
    bgClass: "bg-white",
    textClass: "text-[#111]",
    mutedClass: "text-[#646a73]",
    image: "/innovation.png",
    ctaText: "View Plans",
    icon: BookOpen
  },
  {
    number: "04",
    title: "LMS Integration & RoboWars Competitions",
    description: "Cloud-based student grading LMS, digital skill passports, combat obstacle arenas, and specialized coaching for World Robot Olympiad (WRO).",
    features: ["Cloud Skill Passports", "RoboWars Combat Arena", "WRO Coaching", "GitHub Portfolio Gen", "Performance Analytics"],
    tags: ["RoboWars Arena", "Cloud LMS", "WRO Coaching", "Skill Passports"],
    bgClass: "bg-[#f2f3f5]",
    textClass: "text-[#111]",
    mutedClass: "text-[#646a73]",
    image: "/signature.png",
    ctaText: "Learn More",
    icon: Trophy
  }
];

export default function ServicesPage() {
  return (
    <div className="relative min-h-[100dvh] w-full max-w-full bg-grid text-[#1a1a1a] font-sans overflow-x-hidden">
      
      <Navbar />
      <Breadcrumbs />

      {/* --- PAGE HEADER --- */}
      <section className="relative z-10 pt-32 pb-16 sm:pt-48 sm:pb-24 border-b-2 border-[#111] bg-white">
        <div className="max-w-[1536px] mx-auto px-4 sm:px-8 lg:px-16 flex flex-col items-start">
          <span className="font-mono text-sm font-bold uppercase tracking-widest text-[#ff5400] block mb-6">
            [ Complete Ecosystem ]
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black uppercase tracking-tighter text-[#111] leading-[0.95] max-w-5xl">
            Detailed Services &<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff5400] to-yellow-500">Lab Packages</span>
          </h1>
          <p className="mt-8 text-[#646a73] text-lg sm:text-xl font-medium max-w-2xl leading-relaxed">
            From spatial CAD blueprints to resident engineer co-teaching, Radix delivers an integrated STEM execution stack. Explore our services and hardware tiers in detail below.
          </p>
        </div>
      </section>

      {/* --- DETAILED PRODUCT & SERVICE MATRIX --- */}
      <section className="relative z-10 w-full overflow-hidden">
        {detailedServices.map((service, index) => {
          const Icon = service.icon;
          return (
            <div key={service.number} className={`${service.bgClass} border-b-2 border-[#111]`}>
              <div className="max-w-[1536px] mx-auto px-4 sm:px-8 lg:px-16 py-16 sm:py-24">
                <div className="flex flex-col lg:flex-row gap-8 lg:gap-24 items-start lg:items-center w-full">
                  
                  {/* Text Content */}
                  <div className="w-full lg:w-7/12 flex flex-col items-start">
                    <div className="flex items-center gap-4 mb-6">
                      <span className={`text-6xl sm:text-8xl font-black ${service.textClass} opacity-20 font-mono leading-none`}>
                        {service.number}
                      </span>
                      <div className={`p-4 border-2 border-transparent ${service.bgClass === 'bg-[#111]' ? 'border-white/20' : 'border-[#111]'}`}>
                        <Icon size={32} className={service.textClass} />
                      </div>
                    </div>

                    <h3 className={`text-2xl sm:text-3xl md:text-5xl font-black uppercase tracking-tighter leading-[1.05] ${service.textClass} mb-6`}>
                      {service.title}
                    </h3>

                    <p className={`${service.mutedClass} text-lg leading-relaxed mb-10 font-medium max-w-xl`}>
                      {service.description}
                    </p>

                    <div className={`w-full p-6 sm:p-8 border-2 ${service.bgClass === 'bg-[#111]' ? 'border-[#333]' : service.bgClass === 'bg-[#ff5400]' ? 'border-white/30' : 'border-[#111] bg-white'} mb-8 shadow-[6px_6px_0px_${service.bgClass === 'bg-[#111]' ? '#ff5400' : '#111'}]`}>
                      <h4 className={`text-xs font-black uppercase tracking-widest ${service.textClass} mb-4 flex items-center gap-2`}>
                        <div className={`w-2 h-2 ${service.bgClass === 'bg-[#111]' ? 'bg-[#ff5400]' : 'bg-[#111]'}`}></div>
                        Core Offerings
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {service.features.map((feature, fIdx) => (
                          <div key={fIdx} className="flex items-start gap-3">
                            <CheckCircle2 size={18} strokeWidth={3} className={`${service.bgClass === 'bg-[#111]' ? 'text-[#ff5400]' : 'text-[#ff5400]'} shrink-0`} />
                            <span className={`text-sm font-bold uppercase tracking-widest ${service.textClass}`}>{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-10">
                      {service.tags.map((tag, tIdx) => (
                        <span key={tIdx} className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-widest border-2 ${service.bgClass === 'bg-[#111]' ? 'border-[#333] text-[#a1a1aa]' : service.bgClass === 'bg-[#ff5400]' ? 'border-white/30 text-white' : 'border-[#111] text-[#111]'}`}>
                          {tag}
                        </span>
                      ))}
                    </div>

                    <a href="https://wa.me/916001979712" target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-3 px-8 py-4 font-black text-xs uppercase tracking-widest border-2 transition-all shadow-[6px_6px_0px_${service.bgClass === 'bg-[#111]' ? 'white' : service.bgClass === 'bg-[#ff5400]' ? '#111' : '#ff5400'}] hover:-translate-y-1 ${
                        service.bgClass === 'bg-[#111]' ? 'bg-white text-[#111] border-transparent' : 
                        service.bgClass === 'bg-[#ff5400]' ? 'bg-white text-[#111] border-transparent' : 
                        'bg-[#111] text-white border-[#111]'
                      }`}>
                      {service.ctaText} <ArrowUpRight size={18} strokeWidth={2.5} />
                    </a>
                  </div>

                  {/* Aesthetic Image Wrapper */}
                  <div className="w-full lg:w-5/12 flex items-center justify-center">
                    <div className={`relative w-full aspect-[4/3] border-2 border-transparent ${service.bgClass === 'bg-[#111]' ? 'border-[#333]' : service.bgClass === 'bg-[#ff5400]' ? 'border-white' : 'border-[#111]'} p-4`}>
                      {/* Corner Accents */}
                      <div className={`absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 ${service.bgClass === 'bg-[#111]' ? 'border-white' : service.bgClass === 'bg-[#ff5400]' ? 'border-white' : 'border-[#111]'}`}></div>
                      <div className={`absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 ${service.bgClass === 'bg-[#111]' ? 'border-white' : service.bgClass === 'bg-[#ff5400]' ? 'border-white' : 'border-[#111]'}`}></div>
                      <div className={`absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 ${service.bgClass === 'bg-[#111]' ? 'border-white' : service.bgClass === 'bg-[#ff5400]' ? 'border-white' : 'border-[#111]'}`}></div>
                      <div className={`absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 ${service.bgClass === 'bg-[#111]' ? 'border-white' : service.bgClass === 'bg-[#ff5400]' ? 'border-white' : 'border-[#111]'}`}></div>
                      
                      <div className={`relative w-full h-full border-2 ${service.bgClass === 'bg-[#111]' ? 'border-[#333]' : service.bgClass === 'bg-[#ff5400]' ? 'border-white/30' : 'border-[#111]'}`}>
                        <Image src={service.image} alt={service.title} fill className="object-cover filter grayscale hover:grayscale-0 transition-all duration-700" sizes="(max-width: 768px) 100vw, 40vw" />
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* --- FOOTER --- */}
      <footer className="relative z-10 bg-[#111] text-white pt-24 pb-24 overflow-hidden border-t-2 border-[#111]">
        <div className="max-w-[1536px] mx-auto px-4 sm:px-8 lg:px-16 text-center relative z-10 flex flex-col items-center">
          <h2 className="text-4xl sm:text-6xl font-black uppercase tracking-tighter mb-8 leading-[1.05]">
            Ready to upgrade your campus?
          </h2>
          <a href="https://wa.me/916001979712" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 px-10 py-5 bg-[#ff5400] text-white border-2 border-transparent font-black text-sm uppercase tracking-widest hover:border-white transition-all shadow-[8px_8px_0px_white] hover:-translate-y-1">
            Contact Engineering Team <ArrowUpRight size={20} strokeWidth={2.5} />
          </a>
        </div>
      </footer>
    </div>
  );
}
