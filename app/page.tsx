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
  Sparkles,
  ArrowDownLeft,
  Radio,
  GraduationCap,
  Pencil,
  Settings,
  Code,
  MessageCircle,
  Mail
} from 'lucide-react';
import gsap from 'gsap';
import { motion, useScroll, useTransform } from 'framer-motion';

import TrustMetricsBar from '@/app/components/TrustMetricsBar';
import ProductServiceMatrix from '@/app/components/ProductServiceMatrix';
import ProjectGlimpse from '@/app/components/ProjectGlimpse';
import PedagogicalImpact from '@/app/components/PedagogicalImpact';
import AsymmetricLifecycle from '@/app/components/AsymmetricLifecycle';
import Footer from '@/app/components/Footer';
import dynamic from 'next/dynamic';

const GSAPStackingFolders = dynamic(() => import('@/app/components/GSAPStackingFolders'), { 
  ssr: false, 
  loading: () => <div className="h-64 flex items-center justify-center text-white">Loading Packages...</div> 
});


export default function Page() {
  const droneRef = useRef<HTMLImageElement>(null);

  // Framer Motion Parallax setup
  const { scrollY } = useScroll();
  const yBg = useTransform(scrollY, [0, 1000], [0, 200]); // Slow movement down (background)
  const yBgFast = useTransform(scrollY, [0, 1000], [0, 350]); // Faster movement down
  const yFg = useTransform(scrollY, [0, 1000], [0, -150]); // Move up slightly (foreground)
  const yFloat = useTransform(scrollY, [0, 1000], [0, -300]); // Float up fast
  
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
    { name: 'Projects', href: '/projects' },
    { name: 'About', href: '/about' },
    { name: 'Team', href: '/team' },
  ];

  return (
    <div className="relative min-h-[100dvh] w-full max-w-full bg-grid text-[#1a1a1a] font-sans">

      {/* --- HERO SECTION (PIXEL RISE EXACT MATCH) --- */}
      <section className="w-full min-h-[calc(100vh-80px)] relative flex flex-col justify-between py-[20px] px-4 sm:px-8 md:px-[60px] pb-[24px] overflow-hidden text-[#111317]" style={{ background: 'radial-gradient(circle at 50% 50%, #ffffff 0%, #f1f2f4 65%, #e5e7eb 100%)' }}>
        <style dangerouslySetInnerHTML={{__html: `
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=Silkscreen:wght@700&display=swap');
          .pr-font-sans { font-family: 'Plus Jakarta Sans', sans-serif; }
          .pr-font-pixel { font-family: 'Silkscreen', monospace; }
          
          .pr-pixel-backdrop { position: absolute; top: 65%; left: 0; width: 100%; transform: translateY(-50%); display: flex; justify-content: space-between; padding: 0 4vw; font-size: 14vw; font-weight: 700; color: #ffffff; text-shadow: 0 1px 0 #dedede, 0 2px 0 #cfcfcf, 0 3px 0 #c2c2c2, 0 4px 0 #b5b5b5, 0 25px 45px rgba(0, 0, 0, 0.07); letter-spacing: 0.2vw; z-index: 15; pointer-events: none; line-height: 0.9; }
          
          .pr-center-workspace { position: absolute; top: 52%; left: 50%; transform: translate(-50%, -50%); width: 500px; height: 500px; z-index: 30; display: flex; justify-content: center; align-items: center; pointer-events: none; perspective: 1200px; }
          .pr-sticky-note { position: absolute; top: 30px; left: 60px; width: 52px; height: 52px; background: #ffab00; border-radius: 6px; box-shadow: 0 12px 24px rgba(255, 171, 0, 0.35); transform: rotate(-14deg); display: flex; flex-direction: column; align-items: center; justify-content: center; }
          .pr-note-smile { width: 16px; height: 7px; border-bottom: 2px solid #111; border-radius: 0 0 10px 10px; }

          .pr-floating-letter { position: absolute; top: 25px; right: 50px; width: 68px; height: 46px; background: linear-gradient(135deg, #ffc83b, #ff9f1c); border-radius: 6px; box-shadow: 0 15px 30px rgba(255, 159, 28, 0.35); transform: rotate(20deg); }
          .pr-floating-letter::after { content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 50%; border-bottom: 2px solid rgba(0,0,0,0.12); clip-path: polygon(0 0, 50% 100%, 100% 0); }

          .pr-retro-rig { position: relative; width: 320px; height: 320px; transform: rotateX(24deg) rotateY(-26deg) rotateZ(8deg); transform-style: preserve-3d; }
          .pr-rig-camera { position: absolute; top: 5px; left: 140px; width: 38px; height: 34px; background: #d62222; border-radius: 6px; box-shadow: 6px 6px 0px #8f1212; display: flex; align-items: center; justify-content: center; z-index: 10; }
          .pr-rig-monitor { position: absolute; top: 35px; left: 55px; width: 210px; height: 175px; background: #ff5400; border-radius: 20px; border: 8px solid #ff7324; box-shadow: 18px 18px 0px #b83200, 30px 30px 45px rgba(0, 0, 0, 0.28); display: flex; justify-content: center; align-items: center; }
          .pr-rig-screen { width: 155px; height: 120px; background: #ffffff; border-radius: 10px; padding: 12px; display: flex; flex-direction: column; gap: 6px; box-shadow: inset 0 3px 8px rgba(0,0,0,0.18); }
          .pr-code-line { height: 5px; background: #e2e5eb; border-radius: 3px; }
          
          .pr-rig-keyboard { position: absolute; bottom: 25px; left: 20px; width: 250px; height: 90px; background: #ff5400; border-radius: 12px; transform: rotateX(45deg); box-shadow: 0 14px 0px #b83200, 0 30px 40px rgba(0, 0, 0, 0.35); padding: 10px; display: grid; grid-template-columns: repeat(7, 1fr); gap: 5px; }
          .pr-key-cap { background: #ffffff; height: 11px; border-radius: 3px; box-shadow: 0 2px 0 #d1d5db; }

          .pr-floating-white-torus { position: absolute; top: 140px; left: 30px; width: 28px; height: 28px; border: 6px solid #ffffff; border-radius: 50%; box-shadow: 0 8px 16px rgba(0,0,0,0.12); }
          .pr-floating-orange-ring { position: absolute; bottom: 70px; left: 70px; width: 75px; height: 26px; border: 7px solid #ff5e00; border-radius: 50%; box-shadow: 0 12px 24px rgba(255, 94, 0, 0.35); transform: rotate(-15deg); }

          .pr-smiley-mouse { position: absolute; bottom: 70px; right: 70px; width: 44px; height: 44px; background: #ffb100; border-radius: 50%; box-shadow: 0 10px 22px rgba(0,0,0,0.2); display: flex; flex-direction: column; align-items: center; justify-content: center; }
          .pr-mouse-smile { width: 12px; height: 6px; border-bottom: 2px solid #111; border-radius: 0 0 8px 8px; }

          .pr-social-dock { position: absolute; right: 32px; top: 50%; transform: translateY(-50%); background: rgba(215, 218, 224, 0.55); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.7); border-radius: 12px; display: flex; flex-direction: column; gap: 16px; padding: 14px 10px; z-index: 15; }
          .pr-social-dock a { color: #555b66; display: flex; align-items: center; justify-content: center; text-decoration: none; transition: color 0.2s ease, transform 0.15s ease; }
          .pr-social-dock a:hover { color: #ff5400; transform: scale(1.15); }

          .pr-btn-cta-orange { background: linear-gradient(180deg, #ff6c00 0%, #ee4700 100%); color: #ffffff; font-size: 13px; font-weight: 700; padding: 12px 26px; border-radius: 8px; border: none; box-shadow: 0 8px 20px rgba(238, 71, 0, 0.35); cursor: pointer; transition: transform 0.15s ease; }
          .pr-btn-cta-orange:hover { transform: translateY(-2px); }

          .pr-btn-cta-ghost { background: rgba(255, 255, 255, 0.6); color: #2b2f36; font-size: 13px; font-weight: 700; padding: 12px 24px; border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.9); backdrop-filter: blur(8px); cursor: pointer; transition: background 0.2s ease; }
          .pr-btn-cta-ghost:hover { background: rgba(255, 255, 255, 0.9); }

          .pr-scroll-mouse-icon { width: 14px; height: 22px; border: 1.5px solid #7b828e; border-radius: 10px; position: relative; }
          .pr-scroll-mouse-icon::after { content: ''; position: absolute; top: 3px; left: 50%; transform: translateX(-50%); width: 2px; height: 4px; background: #7b828e; border-radius: 2px; }

          .pr-nav-pill { background: rgba(185, 187, 192, 0.45); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.6); padding: 6px 8px; border-radius: 40px; display: flex; align-items: center; gap: 4px; }
          .pr-nav-link { color: #383c43; text-decoration: none; font-size: 12.5px; font-weight: 600; padding: 8px 16px; border-radius: 30px; transition: 0.2s ease; display: flex; align-items: center; gap: 4px; }
          .pr-nav-link.active { background: #888d95; color: #ffffff; }
          .pr-nav-link svg { width: 10px; height: 10px; stroke: currentColor; }

          .pr-editorial-heading { font-size: 34px; line-height: 1.15; letter-spacing: -0.5px; font-weight: 900; color: #121418; text-transform: uppercase; }
          .pr-heading-line-1 { padding-left: 0; }
          .pr-heading-line-2 { padding-left: 0; }
          .pr-heading-line-3 { padding-left: 0; }
          .pr-heading-line-4 { padding-left: 0; }

          @media (max-width: 1024px) { .pr-center-workspace { transform: translate(-50%, -50%) scale(0.8); } .pr-editorial-heading { font-size: 28px; } }
          @media (max-width: 768px) { .pr-nav-pill, .pr-pixel-backdrop, .pr-social-dock { display: none; } .pr-hero-upper, .pr-hero-bottom { flex-direction: column; gap: 24px; text-align: left; } .pr-bottom-right { text-align: left; } .pr-btn-group { flex-direction: column; width: 100%; } .pr-btn-group button, .pr-btn-group a { width: 100%; justify-content: center; text-align: center; } .pr-center-workspace { position: relative; top: 0; left: 0; transform: none; margin: 30px auto; width: 100%; max-width: 320px; height: 350px; } .pr-heading-line-1, .pr-heading-line-3 { padding-left: 0; } .pr-editorial-heading { font-size: 28px; } }
          @media (max-width: 480px) { .pr-editorial-heading { font-size: 22px; } .pr-center-workspace { max-width: 260px; height: 280px; } .pr-retro-rig { width: 220px; height: 220px; } }
        `}} />

        {/* 1. NAVBAR */}
        <header className="flex justify-between items-center relative z-[20] w-full pr-font-sans hidden md:flex">
          <a href="#" className="flex items-center gap-[10px] font-[800] text-[17px] text-[#111] no-underline">
            <div className="grid grid-cols-[repeat(3,4px)] gap-[2px]">
              {[...Array(9)].map((_,i) => <span key={i} className="w-[4px] h-[4px]"></span>)}
            </div>
            RADIX ROBOTICS
          </a>

          <nav className="pr-nav-pill">
            <a href="#home" className="pr-nav-link active">Home</a>
            <a href="#about" className="pr-nav-link">About</a>
            <a href="#services" className="pr-nav-link">
              Services
              <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </a>
            <a href="#pricing" className="pr-nav-link">Pricing</a>
            <a href="#solution" className="pr-nav-link">Solution</a>
            <a href="#english" className="pr-nav-link">
              English
              <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </a>
          </nav>

          <button className="bg-[#0f1115] text-white border-none py-[10px] px-[22px] rounded-[8px] text-[12.5px] font-[700] cursor-pointer">Login / Register</button>
        </header>

        {/* 2. TOP ROW: [1/8] HEADLINE & GROWTH STATS */}
        <div className="flex justify-between items-start relative z-[10] w-full pr-font-sans pr-hero-upper mt-[60px] md:mt-[18vh]">
          <motion.div 
            className="w-full md:w-auto relative z-20"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
            }}
          >
            <h1 className="pr-editorial-heading relative">
              <motion.div variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } }} className="pr-heading-line-1">Building India's</motion.div>
              <motion.div variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } }} className="pr-heading-line-2">Next Generation of</motion.div>
              <motion.div variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } }} className="pr-heading-line-3">Future Tech.</motion.div>
            </h1>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
            className="w-full md:w-auto md:max-w-[260px] text-left pr-bottom-right mt-6 md:mt-0"
          >
            <div className="flex items-baseline gap-[6px] justify-start">
              <span className="text-[#7b828e] text-[24px] font-[800]">↑</span>
              <span className="text-[42px] font-[900] tracking-[-1.5px] text-[#111] leading-[1]">10x</span>
              <span className="text-[14px] font-[800] uppercase text-[#3b3f46]">Efficiency</span>
            </div>
            <p className="text-[12px] leading-[1.45] text-[#646a73] mt-[6px] font-[500] m-0">
              Our autonomous systems deliver measurable operational efficiency and global scale.
            </p>
          </motion.div>
        </div>

        {/* 3. GIANT PIXEL TEXT WATERMARK (Parallax) */}
        <div className="pr-pixel-backdrop pr-font-pixel">
          <motion.div style={{ y: yBgFast }}>RADIX</motion.div>
          <motion.div style={{ y: yBgFast }} className="self-end mt-[180px] -translate-x-[25vw]">ROBOTICS</motion.div>
        </div>

        {/* 4. ACCURATE ISOMETRIC 3D WORKSPACE */}
        <div className="pr-center-workspace">
          {/* Floating Elements (Parallax) */}
          <motion.div style={{ y: yFg }} className="pr-sticky-note flex animate-bounce z-[20]">
            <div className="flex gap-[10px] mb-[3px]">
              <span className="w-[4px] h-[4px] bg-[#111] rounded-full"></span>
              <span className="w-[4px] h-[4px] bg-[#111] rounded-full"></span>
            </div> 
            <div className="pr-note-smile"></div>
          </motion.div>
          
          <motion.div style={{ y: yFloat }} className="pr-floating-letter block animate-pulse z-[20]"></motion.div>
          
          <motion.div style={{ y: yBg, animation: 'spin 10s linear infinite' }} className="pr-floating-white-torus block z-[20]"></motion.div>
          <motion.div style={{ y: yBgFast, animation: 'spin 8s linear infinite reverse' }} className="pr-floating-orange-ring block z-[20]"></motion.div>
          
          {/* New Vibrant Orange Tech/Edu Elements (Parallax) */}
          <motion.div style={{ y: yFloat }} className="absolute top-[-40px] left-[50px] text-[#ff5400] animate-bounce block z-[20]">
            <GraduationCap size={48} strokeWidth={1.5} className="drop-shadow-lg" />
          </motion.div>
          <motion.div style={{ y: yFg }} className="absolute top-[80px] right-[-60px] text-[#ff6c00] block z-[20]">
            <Settings size={42} strokeWidth={1.5} className="drop-shadow-lg" style={{animation: 'spin 12s linear infinite'}} />
          </motion.div>
          <motion.div style={{ y: yBg }} className="absolute bottom-[-20px] left-[0px] text-[#ff9f1c] animate-pulse block z-[20]">
            <Code size={40} strokeWidth={2} className="drop-shadow-lg" />
          </motion.div>
          <motion.div style={{ y: yFloat, animationDuration: '4.2s', animationDelay: '1s' }} className="absolute bottom-[40px] right-[-80px] text-[#ee4700] animate-bounce block z-[20]">
            <Pencil size={36} strokeWidth={2} className="drop-shadow-lg -rotate-45" />
          </motion.div>
          
          <motion.img
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
            src="/her.gif"
            alt="Hero Video"  
            className="w-[150%] h-auto max-w-none object-contain drop-shadow-2xl z-10 translate-x-[40px] md:translate-x-[80px]"
          />
        </div>

        {/* 5. BOTTOM ROW & CTA */}
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex justify-between items-end relative z-[10] w-full pr-font-sans pr-hero-bottom mt-12 md:mt-0"
        >
          <div className="w-full md:max-w-[340px]">
            <p className="text-[12px] leading-[1.45] text-[#646a73] font-[500] mb-[18px] m-0">
              Engineering the future <br />through Robotics Education with our <br />Composite Skill Lab, Research, <br />AI, Drones and Innovation.
            </p>
            <div className="flex items-center gap-[12px] pr-btn-group">
              <button className="pr-btn-cta-orange">Get Started</button>
              <Link href="/contact" className="pr-btn-cta-ghost flex items-center justify-center">Contact Us</Link>
            </div>
          </div>

          <div className="max-w-[270px] text-right pr-bottom-right hidden md:block">
            <p className="text-[12px] leading-[1.45] text-[#646a73] font-[500] m-0">
              From the first spark of an idea to worldwide recognition — we partner with brands
            </p>
          </div>
        </motion.div>

        {/* 6. FLOATING SOCIAL SIDEBAR */}
        <aside className="pr-social-dock">
          <a href="#instagram" aria-label="Instagram">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
            </svg>
          </a>
          <a href="#whatsapp" aria-label="WhatsApp">
            <MessageCircle size={18} strokeWidth={2} />
          </a>
          <Link href="/contact" aria-label="Email">
            <Mail size={18} strokeWidth={2} />
          </Link>
        </aside>

        {/* 7. BOTTOM SCROLL INDICATOR */}
        <div className="absolute bottom-[12px] left-[50%] -translate-x-[50%] flex flex-col items-center gap-[4px] text-[10px] font-[600] text-[#7b828e] z-[10] pr-font-sans hidden md:flex">
          <div className="pr-scroll-mouse-icon"></div>
          <span>Scroll to explore more</span>
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

      {/* --- PROJECTS GLIMPSE --- */}
      <ProjectGlimpse />

      {/* --- SECTION 5: PEDAGOGICAL IMPACT --- */}
      <PedagogicalImpact />

      {/* --- SECTION 6: CAMPUS TRANSFORMATION LIFECYCLE --- */}
      <AsymmetricLifecycle />

      {/* --- SECTION 7: MISSION ABOUT (The Void) --- */}
      <section className="relative z-10 py-24 sm:py-32 bg-[#050505] border-y-2 border-white/10 overflow-hidden" id="about">
        
        {/* Floating abstract elements (Parallax) */}
        <motion.div style={{ y: yFg }} className="absolute top-10 right-20 w-64 h-64 border border-white/5 rounded-full blur-[1px] pointer-events-none"></motion.div>
        <motion.div style={{ y: yBg }} className="absolute bottom-10 left-10 w-96 h-96 border border-[#ff5400]/20 rounded-full blur-[80px] pointer-events-none"></motion.div>
        <motion.div style={{ y: yBgFast }} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-mono text-[400px] text-white opacity-[0.01] pointer-events-none">01</motion.div>

        <div className="w-full 2xl:px-24 mx-auto px-4 sm:px-8 lg:px-16 pr-font-sans relative z-10">

          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, rotateX: -90, y: 50 }}
            whileInView={{ opacity: 1, rotateX: 0, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, type: "spring", bounce: 0.3 }}
            style={{ transformPerspective: 1000 }}
            className="mb-16 sm:mb-24 flex flex-col md:flex-row md:items-end justify-between gap-8 border-b-2 border-white/10 pb-10"
          >
            <div className="max-w-3xl">
              <span className="font-mono text-xs sm:text-sm font-bold uppercase tracking-widest text-[#ff5400] block mb-6 flex items-center gap-4">
                <span className="w-8 h-[2px] bg-[#ff5400]"></span>
                The Radix Premise
              </span>
              <h2 className="text-4xl sm:text-6xl lg:text-7xl font-black leading-[0.95] tracking-tighter text-white uppercase">
                Democratizing<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-500 to-white">Deep Tech.</span>
              </h2>
            </div>
            <div className="md:w-1/3 text-[#a0aab8] text-sm sm:text-base leading-relaxed font-medium">
              We don't just supply equipment — we build ecosystems where curiosity meets industrial capability. Our labs turn passive consumers into active robotics creators.
            </div>
          </motion.div>

          {/* Asymmetric Floating Cards */}
          <div className="flex flex-col lg:flex-row gap-6 md:gap-10">

            {/* Left large pillar */}
            <div className="lg:w-5/12 bg-white/5 border-2 border-white/10 p-8 sm:p-12 hover:bg-white/10 transition-colors duration-500 group relative overflow-hidden backdrop-blur-sm">
              <div className="absolute -right-10 -bottom-10 opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-all duration-700 pointer-events-none">
                <Bot size={240} />
              </div>
              <span className="font-mono text-4xl text-white/20 font-black mb-8 block">01</span>
              <h4 className="text-2xl sm:text-4xl font-black text-white tracking-tighter uppercase mb-6 leading-none">
                Pan-India<br />Vision & Reach
              </h4>
              <p className="text-[#a0aab8] text-sm sm:text-base leading-relaxed max-w-sm">
                Equipping institutions across India with identical high-standard hardware and certified mentors, ensuring geography does not dictate capability.
              </p>
              <div className="mt-12 inline-flex items-center justify-center w-12 h-12 border-2 border-[#ff5400] text-[#ff5400] rounded-full group-hover:bg-[#ff5400] group-hover:text-black transition-colors duration-300">
                <ArrowUpRight size={20} />
              </div>
            </div>

            {/* Right scattered small cards */}
            <div className="lg:w-7/12 grid grid-cols-1 sm:grid-cols-2 gap-6 relative pt-0 lg:pt-16">
              {[
                { icon: ShieldCheck, title: "NEP Validated", desc: "Full compliance with the latest education framework.", mt: "mt-0" },
                { icon: Award, title: "Skill-First", desc: "Digital skill passports with verifiable GitHub portfolios.", mt: "sm:mt-12" },
                { icon: Cpu, title: "Hardware-First", desc: "100+ modular hardware testbeds for circuits.", mt: "mt-0" },
                { icon: Clock, title: "14-Day Setup", desc: "Full lab installation and onboarding in just two weeks.", mt: "sm:mt-12" },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className={`bg-gradient-to-br from-[#111] to-black border-2 border-[#222] p-6 sm:p-8 hover:border-[#ff5400]/50 transition-colors duration-300 relative group ${item.mt}`}>
                    <div className="flex items-center justify-between mb-8">
                      <div className="text-[#ff5400] group-hover:scale-110 transition-transform">
                        <Icon size={32} strokeWidth={1.5} />
                      </div>
                      <span className="font-mono text-xs text-white/30">0{i + 2}</span>
                    </div>
                    <h4 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight mb-3">{item.title}</h4>
                    <p className="text-[#888] text-sm leading-relaxed">{item.desc}</p>
                  </div>
                );
              })}
            </div>

          </div>
        </div>
      </section>

      {/* --- CTA BANNER (Asymmetric Split) --- */}
      <section className="relative z-10 bg-[#111] overflow-hidden" id="consultation">
        <div className="flex flex-col lg:flex-row w-full pr-font-sans border-b-2 border-black">
          
          {/* Left Dark Side */}
          <motion.div 
            initial={{ opacity: 0, x: -100 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="w-full lg:w-1/2 bg-[#1a1a1a] p-12 sm:p-20 lg:p-24 flex flex-col justify-center border-b-2 lg:border-b-0 lg:border-r-2 border-black relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#ff5400] to-transparent"></div>
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#ff5400] mb-6">
              [ Execute() ]
            </span>
            <h3 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white uppercase tracking-tighter leading-[1.05] max-w-md">
              Ready to build the future?
            </h3>
            <div className="font-mono font-bold text-4xl text-white/5 mt-10">///</div>
          </motion.div>

          {/* Right Vibrant Side */}
          <motion.div 
            initial={{ opacity: 0, x: 100 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="w-full lg:w-1/2 bg-[#ff5400] p-12 sm:p-20 lg:p-24 flex flex-col justify-center relative group"
          >
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9IiMxMTEiIGZpbGwtb3BhY2l0eT0iMC4xNSIvPjwvc3ZnPg==')] opacity-50 mix-blend-overlay"></div>
            
            <p className="text-[#111] font-bold text-lg sm:text-xl mb-10 max-w-md relative z-10 leading-relaxed">
              Partner with RADIX to bring world-class robotic and STEM infrastructure directly to your campus.
            </p>

            <a
              href="https://wa.me/916001979712?text=Hello%20Radix%20Robotics,%20we%20want%20to%20apply%20for%20the%20Founding%20Partner%20School%20Cohort"
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="relative z-10 w-fit bg-[#111] text-white px-8 sm:px-12 py-5 font-bold uppercase tracking-widest text-sm transition-transform duration-300 hover:scale-105 shadow-[8px_8px_0_rgba(17,17,17,0.3)] hover:shadow-[12px_12px_0_rgba(17,17,17,0.5)] flex items-center gap-4 group/btn"
            >
              Apply as Founding School 
              <ArrowRight size={20} className="group-hover/btn:translate-x-1 transition-transform" />
            </a>
          </motion.div>
        </div>
      </section>
      <Footer />
    </div>
  );
}