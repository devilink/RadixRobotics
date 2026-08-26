"use client";

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  ArrowUpRight,
  Bot,
  ShieldCheck,
  Award,
  Cpu,
  Clock,
  Sparkles
} from 'lucide-react';
import gsap from 'gsap';

import TrustMetricsBar from '@/app/components/TrustMetricsBar';
import ProductServiceMatrix from '@/app/components/ProductServiceMatrix';
import GSAPStackingFolders from '@/app/components/GSAPStackingFolders';
import RealBuildsShowcase from '@/app/components/RealBuildsShowcase';
import PedagogicalImpact from '@/app/components/PedagogicalImpact';
import AsymmetricLifecycle from '@/app/components/AsymmetricLifecycle';

export default function Page() {
  const droneRef = useRef<HTMLImageElement>(null);

  // GSAP Drone Floating
  useEffect(() => {
    if (!droneRef.current) return;

    const tween = gsap.to(droneRef.current, {
      y: -20,
      rotationZ: -2,
      duration: 3.5,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut"
    });

    return () => {
      tween.kill();
    };
  }, []);

  const navLinks = [
    { name: 'Services', href: '/services' },
    { name: 'Projects', href: '#showcase' },
    { name: 'Impact', href: '#impact' },
    { name: 'Process', href: '#how' },
    { name: 'About', href: '/about' },
    { name: 'Team', href: '/team' },
  ];

  return (
    <div className="relative min-h-[100dvh] w-full max-w-full bg-paper text-[#1a1a1a] font-sans overflow-x-hidden">

      {/* --- NOTEBOOK RULED LINE BACKGROUND --- */}
      <div className="fixed inset-0 z-[-1] h-full w-full bg-notebook-subtle pointer-events-none"></div>

      {/* --- HERO SECTION EXACT MATCH (Adjusted pt for fixed nav) --- */}
      <section className="relative w-full h-[calc(100vh-56px)] min-h-[600px] sm:min-h-[650px] overflow-hidden flex flex-col pt-24 sm:pt-28 bg-white">
        <div className="absolute inset-0 z-0">
          <Image src="/bg.png" alt="Background" fill priority sizes="100vw" className="object-cover object-center" />
        </div>

        <div className="relative z-10 w-full w-full 2xl:px-24 mx-auto px-8 lg:px-16 h-full flex flex-col">
          <div className="flex-1 w-full flex items-center relative lg:-mt-12">
            {/* Left Content */}
            <div className="w-full lg:w-[60%] xl:w-[55%] relative z-20 opacity-100 transition-all duration-1000 ease-out">
              <span className="text-[#2563eb] font-bold tracking-[0.15em] text-xs uppercase block mb-6 flex items-center gap-4">
                <span className="w-8 h-[2px] bg-blue-600 block"></span> Learn. Build. Innovate.
              </span>

              <h1 className="text-[4rem] xl:text-[5.5rem] max-md:text-5xl font-bold text-[#111] leading-[1.05] tracking-tight mb-8">
                Building India's <br />
                Next Generation of <br />
                <span className="text-[#2563eb] inline-block hover:scale-105 transition-transform duration-500 cursor-default">Future Tech.</span>
              </h1>

              <p className="text-gray-600 text-lg mb-10 max-w-[450px] leading-relaxed">
                Engineering the future through Robotics Education with our Composite Skill Lab,<br />
                Research, AI, Drones and Innovation.
              </p>

              <div className="flex items-center gap-4 max-md:flex-col max-md:w-full">
                <button className="group relative overflow-hidden bg-[#0f1115] text-white px-8 py-4 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all max-md:w-full max-md:justify-center">
                  <div className="absolute inset-0 w-full h-full bg-blue-600 -translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-out"></div>
                  <span className="relative z-10 flex items-center gap-2">Explore Education <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" /></span>
                </button>
                <button className="bg-white/40 backdrop-blur-md border border-gray-300 text-black px-8 py-4 rounded-xl text-sm font-semibold flex items-center gap-2 hover:bg-white hover:shadow-xl transition-all duration-300 max-md:w-full max-md:justify-center">
                  R&D <ArrowUpRight size={16} />
                </button>
              </div>
            </div>

            {/* Right Content (Drone) */}
            <div className="absolute right-[-5%] xl:right-[2%] top-1/2 -translate-y-[45%] w-[60%] lg:w-[50%] xl:w-[45%] z-10 pointer-events-none hide-on-mobile justify-end flex">
              <Image ref={droneRef} src="/drone.png" alt="RADIX Drone" width={800} height={800} priority className="w-full h-auto max-w-[800px] object-contain drop-shadow-2xl" />
            </div>
          </div>
        </div>
      </section>

      {/* --- MARQUEE --- */}
      <div className="relative z-20 bg-[#1a1a1a] text-white py-3 sm:py-4 overflow-hidden flex whitespace-nowrap w-full">
        <div className="flex w-fit animate-marquee">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex gap-8 sm:gap-12 items-center shrink-0 pr-8 sm:pr-12">
              {[
                "ROS 2 Autonomous Systems",
                "Atal Tinkering Labs Setup",
                "NVIDIA Jetson Edge AI",
                "ArduPilot Aerial Telemetry",
                "LoRaWAN Smart Agriculture",
                "6-DOF Robotic Arms",
                "3D Prototyping & CAD",
                "NEP 2020 Compliant",
                "Founding School Cohort"
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-6 sm:gap-10">
                  <span className="font-bold text-xs sm:text-sm tracking-[0.15em] uppercase text-white/80 hover:text-[#FFE66D] transition-colors">
                    {item}
                  </span>
                  <span className="text-[#FFE66D]">★</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* --- SECTION 1: TRUST METRICS --- */}
      <TrustMetricsBar />

      {/* --- SECTION 2: PRODUCT & SERVICE MATRIX --- */}
      <ProductServiceMatrix />

      {/* --- SECTION 3: LAB PACKAGES --- */}
      <GSAPStackingFolders />

      {/* --- SECTION 4: REAL BUILDS SHOWCASE --- */}
      <RealBuildsShowcase />

      {/* --- SECTION 5: PEDAGOGICAL IMPACT --- */}
      <PedagogicalImpact />

      {/* --- SECTION 6: CAMPUS TRANSFORMATION LIFECYCLE --- */}
      <AsymmetricLifecycle />

      {/* --- SECTION 7: MISSION ABOUT --- */}
      <section className="relative z-10 py-16 sm:py-24 bg-paper border-b border-[#e8e0d4]" id="about">
        <div className="w-full 2xl:px-24 mx-auto px-4 sm:px-8 lg:px-16">

          {/* Header */}
          <div className="mb-12 sm:mb-16">
            <span className="font-handwriting text-xl sm:text-2xl text-[#FF6B6B] block mb-2">
              — our mission & ecosystem —
            </span>
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black leading-[1.05] tracking-tight text-[#1a1a1a] max-w-4xl">
              Democratizing<br />
              <span className="doodle-underline">Deep Tech</span> Education.
            </h2>
          </div>

          {/* Bento-like paper card grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">

            {/* Big mission card */}
            <div className="col-span-1 md:col-span-2 lg:col-span-2 md:row-span-2 paper-card p-7 sm:p-10 bg-[#1a1a1a] text-[#faf8f5] border-[#333] -rotate-[0.3deg] hover:rotate-0 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-6">
                  <Bot size={24} className="text-[#FFE66D]" />
                </div>
                <h3 className="text-xl sm:text-2xl lg:text-3xl font-black leading-snug mb-4 tracking-tight">
                  Every student deserves access to the tools shaping our automated future.
                </h3>
                <p className="text-[#999] text-sm sm:text-base leading-relaxed">
                  We don't just supply equipment — we build ecosystems where curiosity meets industrial capability. Our labs turn passive consumers into active robotics creators.
                </p>
              </div>

              <div className="mt-6 pt-5 border-t border-[#333] flex items-center gap-2">
                <span className="sticker sticker-yellow text-[10px]">The Radix Premise</span>
              </div>
            </div>

            {/* Pillar card 1 */}
            <div className="col-span-1 md:col-span-2 lg:col-span-2 paper-card p-6 sm:p-7 rotate-[0.3deg] hover:rotate-0">
              <div className="flex items-start justify-between mb-3">
                <span className="sticker sticker-purple text-[9px]">Pillar 01</span>
                <span className="text-3xl font-black text-[#1a1a1a] opacity-10 font-mono">01</span>
              </div>
              <h4 className="text-xl sm:text-2xl font-black text-[#1a1a1a] tracking-tight mb-2">
                Pan-India Vision & Reach
              </h4>
              <p className="text-[#6a6a6a] text-sm leading-relaxed">
                Equipping institutions across India with identical high-standard hardware and certified mentors.
              </p>
              <div className="font-handwriting text-sm text-[#FF6B6B] mt-3">
                same quality, every campus →
              </div>
            </div>

            {/* Small cards */}
            {[
              { icon: ShieldCheck, title: "NEP 2020 Validated", desc: "Full compliance with the latest education framework.", note: "checks every box ✓", sticker: "sticker-yellow", rotation: "-rotate-[0.5deg]" },
              { icon: Award, title: "Skill-First Certification", desc: "Digital skill passports with verifiable GitHub portfolios.", note: "proof of real skills →", sticker: "sticker-mint", rotation: "rotate-[0.5deg]" },
              { icon: Cpu, title: "Hardware-First Model", desc: "100+ modular hardware testbeds for circuits and kinematics.", note: "touch it, build it, learn it ★", sticker: "sticker-blue", rotation: "-rotate-[0.3deg]" },
              { icon: Clock, title: "14-Day Rapid Setup", desc: "Full lab installation and onboarding in just two weeks.", note: "zero delays, guaranteed", sticker: "sticker-coral", rotation: "rotate-[0.3deg]" },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className={`paper-card p-5 sm:p-6 ${item.rotation} hover:rotate-0 transition-transform duration-300`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 rounded-lg bg-[#faf8f5] border border-[#e8e0d4]">
                      <Icon size={18} className="text-[#1a1a1a]" />
                    </div>
                    <span className="text-2xl font-black text-[#1a1a1a] opacity-10 font-mono">0{i + 2}</span>
                  </div>
                  <h4 className="text-base sm:text-lg font-bold text-[#1a1a1a] mb-1.5">{item.title}</h4>
                  <p className="text-[#6a6a6a] text-xs leading-relaxed mb-2">{item.desc}</p>
                  <div className="font-handwriting text-sm text-[#FF6B6B]">{item.note}</div>
                </div>
              );
            })}

          </div>
        </div>
      </section>

      {/* --- CTA BANNER --- */}
      <section className="relative z-10" id="consultation">
        <div className="section-yellow py-16 sm:py-24 px-4 sm:px-8 lg:px-16 relative overflow-hidden">

          <div className="w-full 2xl:px-24 mx-auto flex flex-col lg:flex-row items-center justify-between gap-8 text-center lg:text-left relative z-10">
            <div>
              <span className="font-handwriting text-xl sm:text-2xl text-[#1a1a1a] block mb-3">
                — ready to get started? —
              </span>
              <h3 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#1a1a1a] tracking-tight mb-3 leading-[1.05]">
                Ready to build<br />the future?
              </h3>
              <p className="text-[#4a4a4a] text-sm sm:text-base max-w-xl">
                Partner with RADIX to bring world-class robotic and STEM infrastructure directly to your campus.
              </p>
            </div>

            <a
              href="https://wa.me/916001979712?text=Hello%20Radix%20Robotics,%20we%20want%20to%20apply%20for%20the%20Founding%20Partner%20School%20Cohort"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto bg-[#1a1a1a] text-white hover:bg-[#333] px-8 sm:px-10 py-4 sm:py-5 rounded-lg font-bold uppercase tracking-widest text-xs sm:text-sm transition-all duration-300 inline-flex items-center justify-center gap-3 shadow-lg hover:-translate-y-0.5"
            >
              Apply as Founding School <ArrowRight size={15} />
            </a>
          </div>

          {/* Decorative doodle elements */}
          <div className="absolute top-6 right-8 font-handwriting text-2xl text-[#1a1a1a] opacity-20 hidden lg:block rotate-12">★ ★ ★</div>
          <div className="absolute bottom-8 left-10 font-handwriting text-lg text-[#1a1a1a] opacity-20 hidden lg:block -rotate-6">let's go! →</div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="relative z-10 bg-[#1a1a1a] text-white pt-20 sm:pt-24 pb-12 overflow-hidden torn-edge-top">

        {/* Massive Watermark */}
        <div className="absolute top-0 left-0 w-full overflow-hidden flex justify-center pointer-events-none opacity-[0.03] select-none">
          <h1 className="text-[22vw] font-black leading-none tracking-tighter translate-y-[-20%]">RADIX</h1>
        </div>

        <div className="w-full 2xl:px-24 mx-auto px-4 sm:px-8 lg:px-16 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-8 mb-16">

            {/* Brand Column */}
            <div className="lg:col-span-5 flex flex-col justify-between">
              <div>
                <Link href="/" className="block w-fit mb-6 group cursor-pointer">
                  <Image
                    src="/tib.PNG"
                    alt="RADIX Robotics"
                    width={400}
                    height={150}
                    className="w-auto h-10 sm:h-12 object-contain"
                  />
                </Link>
                <p className="text-[#999] text-sm sm:text-base max-w-sm leading-relaxed mb-6">
                  Engineering the future through elite Robotics Education, AI research, and turnkey Composite Skill Labs across Indian schools.
                </p>
              </div>

              <a
                href="mailto:radixrobotics@gmail.com"
                className="text-lg sm:text-xl font-bold hover:text-[#FFE66D] transition-colors duration-300 w-fit flex items-center gap-2"
              >
                radixrobotics@gmail.com
                <ArrowUpRight size={18} className="text-[#FFE66D]" />
              </a>
            </div>

            {/* Navigation Links */}
            <div className="lg:col-span-2 lg:col-start-7">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#666] mb-4">Navigation</h4>
              <ul className="flex flex-col gap-3 text-sm font-medium">
                {navLinks.map((item) => (
                  <li key={item.name}>
                    <a href={item.href} className="text-[#999] hover:text-white transition-colors">
                      {item.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Social Links */}
            <div className="lg:col-span-2">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#666] mb-4">Connect</h4>
              <ul className="flex flex-col gap-3 text-sm font-medium">
                {[
                  { name: 'WhatsApp', url: 'https://wa.me/916001979712' },
                  { name: 'Instagram', url: 'https://www.instagram.com/radix.robotics?igsh=OHZiazg4eDA5ejl2' }
                ].map((item) => (
                  <li key={item.name}>
                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-[#999] hover:text-white transition-colors">
                      {item.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div className="lg:col-span-2">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#666] mb-4">Legal</h4>
              <ul className="flex flex-col gap-4 text-sm font-medium">
                {['Privacy Policy', 'Terms of Deployment', 'NEP 2020 Compliance'].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-[#666] hover:text-[#999] transition-colors">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

          </div>

          {/* Bottom Bar */}
          <div className="border-t border-[#333] pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#666] font-medium">
            <p>RADIX Robotics Pvt Ltd &copy; {new Date().getFullYear()} — All Rights Reserved</p>
            <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-white/5 border border-white/10 text-[#999]">
              <span>Operating in India</span>
              <div className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FFE66D] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FFE66D]"></span>
              </div>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}