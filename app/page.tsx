"use client";

import Link from 'next/link';
import {
  ArrowRight,
  ArrowUpRight,
  Bot,
  ShieldCheck,
  Award,
  Cpu,
  Clock,
  GraduationCap,
  Pencil,
  Settings,
  Code,
  MessageCircle,
  Mail
} from 'lucide-react';
import { MotionConfig, motion, useScroll, useTransform } from 'framer-motion';

import TrustMetricsBar from '@/app/components/TrustMetricsBar';
import ProductServiceMatrix from '@/app/components/ProductServiceMatrix';
import ProjectGlimpse from '@/app/components/ProjectGlimpse';
import PedagogicalImpact from '@/app/components/PedagogicalImpact';
import AsymmetricLifecycle from '@/app/components/AsymmetricLifecycle';
import Footer from '@/app/components/Footer';
import GSAPStackingFolders from '@/app/components/GSAPStackingFolders';
import HeroRobot from '@/app/components/HeroRobot';

export default function Page() {
// Framer Motion Parallax setup using vh for responsive scaling
  const { scrollY } = useScroll();
  const yBg = useTransform(scrollY, [0, 1000], ["0vh", "10vh"]); // Slow movement down (background)
  const yBgFast = useTransform(scrollY, [0, 1000], ["0vh", "20vh"]); // Faster movement down
  const yFg = useTransform(scrollY, [0, 1000], ["0vh", "-10vh"]); // Move up slightly (foreground)
  const yFloat = useTransform(scrollY, [0, 1000], ["0vh", "-20vh"]); // Float up fast

  return (
    <MotionConfig reducedMotion="user">
    <div className="relative min-h-[100dvh] w-full max-w-full bg-grid text-[#1a1a1a] font-sans">

      {/* --- 100dvh Hero + Marquee Wrapper --- */}
      <div className="w-full h-[100dvh] flex flex-col">
        {/* --- HERO SECTION --- */}
        <section className="w-full flex-1 min-h-0 relative flex flex-col overflow-hidden text-[#111317]" style={{ background: 'radial-gradient(circle at 50% 50%, #ffffff 0%, #f1f2f4 65%, #e5e7eb 100%)' }}>
        <style dangerouslySetInnerHTML={{__html: `
          /* --- HERO ENTRANCE (pure CSS so it runs at first paint, before hydration) --- */
          @keyframes pr-rise { from { opacity: 0; transform: translate3d(0, 1.5rem, 0); } to { opacity: 1; transform: none; } }
          @keyframes pr-slide-in { from { opacity: 0; transform: translate3d(2.5rem, 0, 0); } to { opacity: 1; transform: none; } }
          @keyframes pr-pop { from { transform: scale(0.85); } to { transform: scale(1); } }
          .pr-rise { animation: pr-rise 0.7s cubic-bezier(0.2, 0.7, 0.2, 1) both; animation-delay: var(--pr-delay, 0s); }
          .pr-slide-in { animation: pr-slide-in 0.8s ease-out 0.35s both; }
          .pr-pop { animation: pr-pop 0.9s cubic-bezier(0.2, 0.7, 0.2, 1) both; }
          @media (prefers-reduced-motion: reduce) {
            .pr-rise, .pr-slide-in, .pr-pop { animation: none; }
          }

          /* --- HERO FLEX LAYOUT --- */
          .pr-hero-flex {
            --pr-pad-x: 3.75rem;
            display: flex;
            flex-direction: column;
            height: 100%;
            /* max() keeps content clear of the iPhone notch in landscape */
            padding: 0 max(var(--pr-pad-x), env(safe-area-inset-right)) 0 max(var(--pr-pad-x), env(safe-area-inset-left));
            padding-top: calc(4.375rem + env(safe-area-inset-top)); /* space for fixed navbar */
          }
          .pr-hero-row-top { flex-shrink: 0; padding-top: clamp(0.375rem, 1.5vh, 1.25rem); }
          .pr-hero-row-center { flex: 1 1 0%; min-height: 0; display: flex; align-items: center; justify-content: center; position: relative; }
          .pr-hero-row-bottom { flex-shrink: 0; padding-bottom: clamp(0.5rem, 1.5vh, 1.5rem); }

          @media (max-width: 768px) {
            .pr-hero-flex { --pr-pad-x: 1rem; padding-top: calc(3.875rem + env(safe-area-inset-top)); }
          }
          @media (min-width: 769px) and (max-width: 1024px) {
            .pr-hero-flex { --pr-pad-x: 2rem; padding-top: calc(4.25rem + env(safe-area-inset-top)); }
          }

          /* --- PIXEL BACKDROP --- */
          .pr-pixel-backdrop { position: absolute; top: 55%; left: 0; width: 100%; transform: translateY(-50%); display: flex; justify-content: space-between; padding: 0 4vw; font-size: min(14vw, 18vh); font-weight: 700; color: #ffffff; text-shadow: 0 1px 0 #dedede, 0 2px 0 #cfcfcf, 0 3px 0 #c2c2c2, 0 4px 0 #b5b5b5, 0 25px 45px rgba(0, 0, 0, 0.07); letter-spacing: 0.2vw; z-index: 1; pointer-events: none; line-height: 0.9; }

          /* --- CENTER WORKSPACE --- */
          .pr-center-workspace {
            position: relative;
            width: min(100%, 45rem, 55vw);
            height: 100%;
            max-height: 100%;
            aspect-ratio: 1 / 1;
            display: flex;
            justify-content: center;
            align-items: center;
            pointer-events: none;
            perspective: 75rem;
            z-index: 30;
          }

          .pr-sticky-note { position: absolute; top: 6%; left: 12%; width: clamp(1.5rem, 4vw, 3.25rem); height: clamp(1.5rem, 4vw, 3.25rem); background: #ffab00; border-radius: 0.375rem; box-shadow: 0 0.75rem 1.5rem rgba(255, 171, 0, 0.35); transform: rotate(-14deg); display: flex; flex-direction: column; align-items: center; justify-content: center; }
          .pr-note-smile { width: 30%; height: 15%; border-bottom: 2px solid #111; border-radius: 0 0 0.625rem 0.625rem; }

          .pr-floating-letter { position: absolute; top: 5%; right: 10%; width: clamp(2rem, 5vw, 4.25rem); height: clamp(1.375rem, 3.5vw, 2.875rem); background: linear-gradient(135deg, #ffc83b, #ff9f1c); border-radius: 0.375rem; box-shadow: 0 0.9375rem 1.875rem rgba(255, 159, 28, 0.35); transform: rotate(20deg); }
          .pr-floating-letter::after { content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 50%; border-bottom: 2px solid rgba(0,0,0,0.12); clip-path: polygon(0 0, 50% 100%, 100% 0); }

          .pr-retro-rig { position: relative; width: 20rem; height: 20rem; transform: rotateX(24deg) rotateY(-26deg) rotateZ(8deg); transform-style: preserve-3d; }
          .pr-rig-camera { position: absolute; top: 0.3125rem; left: 8.75rem; width: 2.375rem; height: 2.125rem; background: #d62222; border-radius: 0.375rem; box-shadow: 0.375rem 0.375rem 0px #8f1212; display: flex; align-items: center; justify-content: center; z-index: 10; }
          .pr-rig-monitor { position: absolute; top: 2.1875rem; left: 3.4375rem; width: 13.125rem; height: 10.9375rem; background: #ff5400; border-radius: 1.25rem; border: 0.5rem solid #ff7324; box-shadow: 1.125rem 1.125rem 0px #b83200, 1.875rem 1.875rem 2.8125rem rgba(0, 0, 0, 0.28); display: flex; justify-content: center; align-items: center; }
          .pr-rig-screen { width: 9.6875rem; height: 7.5rem; background: #ffffff; border-radius: 0.625rem; padding: 0.75rem; display: flex; flex-direction: column; gap: 0.375rem; box-shadow: inset 0 0.1875rem 0.5rem rgba(0,0,0,0.18); }
          .pr-code-line { height: 0.3125rem; background: #e2e5eb; border-radius: 0.1875rem; }

          .pr-rig-keyboard { position: absolute; bottom: 1.5625rem; left: 1.25rem; width: 15.625rem; height: 5.625rem; background: #ff5400; border-radius: 0.75rem; transform: rotateX(45deg); box-shadow: 0 0.875rem 0px #b83200, 0 1.875rem 2.5rem rgba(0, 0, 0, 0.35); padding: 0.625rem; display: grid; grid-template-columns: repeat(7, 1fr); gap: 0.3125rem; }
          .pr-key-cap { background: #ffffff; height: 0.6875rem; border-radius: 0.1875rem; box-shadow: 0 0.125rem 0 #d1d5db; }

          .pr-floating-white-torus { position: absolute; top: 28%; left: 6%; width: clamp(0.75rem, 2vw, 1.75rem); height: clamp(0.75rem, 2vw, 1.75rem); border: clamp(0.1875rem, 0.4vw, 0.375rem) solid #ffffff; border-radius: 50%; box-shadow: 0 0.5rem 1rem rgba(0,0,0,0.12); }
          .pr-floating-orange-ring { position: absolute; bottom: 14%; left: 14%; width: clamp(2.25rem, 5.5vw, 4.6875rem); height: clamp(0.75rem, 2vw, 1.625rem); border: clamp(0.1875rem, 0.5vw, 0.4375rem) solid #ff5e00; border-radius: 50%; box-shadow: 0 0.75rem 1.5rem rgba(255, 94, 0, 0.35); transform: rotate(-15deg); }

          .pr-smiley-mouse { position: absolute; bottom: 14%; right: 14%; width: clamp(1.375rem, 3.5vw, 2.75rem); height: clamp(1.375rem, 3.5vw, 2.75rem); background: #ffb100; border-radius: 50%; box-shadow: 0 0.625rem 1.375rem rgba(0,0,0,0.2); display: flex; flex-direction: column; align-items: center; justify-content: center; }
          .pr-mouse-smile { width: 30%; height: 15%; border-bottom: 2px solid #111; border-radius: 0 0 0.5rem 0.5rem; }

          .pr-social-dock { position: absolute; right: 2rem; top: 50%; transform: translateY(-50%); background: rgba(215, 218, 224, 0.55); -webkit-backdrop-filter: blur(0.75rem); backdrop-filter: blur(0.75rem); border: 1px solid rgba(255, 255, 255, 0.7); border-radius: 0.75rem; display: flex; flex-direction: column; gap: 1rem; padding: 0.875rem 0.625rem; z-index: 15; }
          .pr-social-dock a { color: #555b66; display: flex; align-items: center; justify-content: center; text-decoration: none; transition: color 0.2s ease, transform 0.15s ease; }
          .pr-social-dock a:hover { color: #ff5400; transform: scale(1.15); }

          .pr-btn-cta-orange { background: linear-gradient(180deg, #ff6c00 0%, #ee4700 100%); color: #ffffff; font-size: clamp(0.6875rem, 1.5vh, 0.8125rem); font-weight: 700; padding: clamp(0.5rem, 1.2vh, 0.75rem) clamp(1rem, 2vw, 1.625rem); border-radius: 0.5rem; border: none; box-shadow: 0 0.5rem 1.25rem rgba(238, 71, 0, 0.35); cursor: pointer; transition: transform 0.15s ease; }
          .pr-btn-cta-orange:hover { transform: translateY(-2px); }

          .pr-btn-cta-ghost { background: rgba(255, 255, 255, 0.6); color: #2b2f36; font-size: clamp(0.6875rem, 1.5vh, 0.8125rem); font-weight: 700; padding: clamp(0.5rem, 1.2vh, 0.75rem) clamp(0.875rem, 2vw, 1.5rem); border-radius: 0.5rem; border: 1px solid rgba(255, 255, 255, 0.9); -webkit-backdrop-filter: blur(0.5rem); backdrop-filter: blur(0.5rem); cursor: pointer; transition: background 0.2s ease; }
          .pr-btn-cta-ghost:hover { background: rgba(255, 255, 255, 0.9); }

          .pr-scroll-mouse-icon { width: 0.875rem; height: 1.375rem; border: 1.5px solid #7b828e; border-radius: 0.625rem; position: relative; }
          .pr-scroll-mouse-icon::after { content: ''; position: absolute; top: 0.1875rem; left: 50%; transform: translateX(-50%); width: 0.125rem; height: 0.25rem; background: #7b828e; border-radius: 0.125rem; }

          .pr-nav-pill { background: rgba(185, 187, 192, 0.45); -webkit-backdrop-filter: blur(0.75rem); backdrop-filter: blur(0.75rem); border: 1px solid rgba(255, 255, 255, 0.6); padding: 0.375rem 0.5rem; border-radius: 2.5rem; display: flex; align-items: center; gap: 0.25rem; }
          .pr-nav-link { color: #383c43; text-decoration: none; font-size: 0.78rem; font-weight: 600; padding: 0.5rem 1rem; border-radius: 1.875rem; transition: 0.2s ease; display: flex; align-items: center; gap: 0.25rem; }
          .pr-nav-link.active { background: #888d95; color: #ffffff; }
          .pr-nav-link svg { width: 0.625rem; height: 0.625rem; stroke: currentColor; }

          /* --- EDITORIAL HEADING --- fully vh-based */
          .pr-editorial-heading { font-size: clamp(1.125rem, 4.5vh, 2.125rem); line-height: 1.15; letter-spacing: -0.03125rem; font-weight: 900; color: #121418; text-transform: uppercase; }
          .pr-heading-line-1 { padding-left: 0; }
          .pr-heading-line-2 { padding-left: 0; }
          .pr-heading-line-3 { padding-left: 0; }
          .pr-heading-line-4 { padding-left: 0; }

          /* --- HERO DESCRIPTION TEXT --- */
          .pr-hero-desc { font-size: clamp(0.625rem, 1.4vh, 0.75rem); line-height: 1.45; }
          .pr-hero-stats-big { font-size: clamp(1.75rem, 5vh, 2.625rem); }
          .pr-hero-stats-label { font-size: clamp(0.625rem, 1.6vh, 0.875rem); }
          .pr-hero-stats-arrow { font-size: clamp(1rem, 3vh, 1.5rem); }

          /* --- DESKTOP OVERRIDES --- */
          @media (max-width: 1024px) { .pr-editorial-heading { font-size: clamp(1.125rem, 4vh, 1.75rem); } }

          /* --- MOBILE OVERRIDES --- */
          @media (max-width: 768px) {
            .pr-nav-pill, .pr-pixel-backdrop, .pr-social-dock, .pr-floating-icon { display: none !important; }
            .pr-hero-upper, .pr-hero-bottom { flex-direction: column; gap: clamp(0.5rem, 1.5vh, 1rem); text-align: left; }
            .pr-bottom-right { display: none; }
            .pr-btn-group { flex-direction: row; width: 100%; }
            .pr-btn-group button, .pr-btn-group a { flex: 1; justify-content: center; text-align: center; }
            .pr-center-workspace { width: min(100%, 85vw); }
            .pr-heading-line-1, .pr-heading-line-3 { padding-left: 0; }
            .pr-editorial-heading { font-size: clamp(1rem, 4vh, 1.625rem); }
          }

          @media (max-width: 380px) {
            .pr-editorial-heading { font-size: clamp(0.875rem, 3.5vh, 1.25rem); }
            .pr-center-workspace { width: min(100%, 75vw); }
          }
        `}} />

        {/* HERO 3-ROW FLEX LAYOUT */}
        <div className="pr-hero-flex pr-font-sans">

          {/* ROW 1: HEADLINE & STATS */}
          <div className="pr-hero-row-top">
            <div className="flex justify-between items-start w-full pr-hero-upper">
              <div className="w-full md:w-auto relative z-20">
                <h1 className="pr-editorial-heading relative">
                  <span className="block pr-rise">Building India&apos;s</span>
                  <span className="block pr-rise" style={{ ['--pr-delay' as string]: '0.12s' }}>Next Generation of</span>
                  <span className="block pr-rise" style={{ ['--pr-delay' as string]: '0.24s' }}>
                    <span className="text-[#ff5400]">Future</span> Tech.
                  </span>
                </h1>
              </div>

              <div className="md:max-w-[260px] text-left pr-bottom-right pr-slide-in">
                <div className="flex items-baseline gap-[6px] justify-start">
                  <span className="pr-hero-stats-arrow text-[#7b828e] font-[800]">↑</span>
                  <span className="pr-hero-stats-big font-[900] tracking-[-1.5px] text-[#111] leading-[1]">10x</span>
                  <span className="pr-hero-stats-label font-[800] uppercase text-[#3b3f46]">Efficiency</span>
                </div>
                <p className="pr-hero-desc text-[#646a73] mt-[6px] font-[500] m-0">
                  Our autonomous systems deliver measurable operational efficiency and global scale.
                </p>
              </div>
            </div>
          </div>

          {/* ROW 2: CENTER GRAPHIC (fills remaining space) */}
          <div className="pr-hero-row-center">
            {/* GIANT PIXEL TEXT WATERMARK (Parallax) */}
            <div className="pr-pixel-backdrop pr-font-pixel">
              <motion.div style={{ y: yBgFast }}>RADIX</motion.div>
              <motion.div style={{ y: yBgFast }} className="self-end mt-[180px] -translate-x-[25vw]">ROBOTICS</motion.div>
            </div>

            {/* CENTER WORKSPACE */}
            <div className="pr-center-workspace">
              {/* Floating Elements (Parallax) */}
              <motion.div style={{ y: yFg }} className="pr-sticky-note pr-floating-icon flex animate-bounce z-[20]">
                <div className="flex gap-[10px] mb-[3px]">
                  <span className="w-[4px] h-[4px] bg-[#111] rounded-full"></span>
                  <span className="w-[4px] h-[4px] bg-[#111] rounded-full"></span>
                </div> 
                <div className="pr-note-smile"></div>
              </motion.div>
              
              <motion.div style={{ y: yFloat }} className="pr-floating-letter pr-floating-icon block animate-pulse z-[20]"></motion.div>
              
              <motion.div style={{ y: yBg, animation: 'spin 10s linear infinite' }} className="pr-floating-white-torus pr-floating-icon block z-[20]"></motion.div>
              <motion.div style={{ y: yBgFast, animation: 'spin 8s linear infinite reverse' }} className="pr-floating-orange-ring pr-floating-icon block z-[20]"></motion.div>
              
              {/* Vibrant Orange Tech/Edu Elements (Parallax) */}
              <motion.div style={{ y: yFloat }} className="absolute top-[10%] left-[10%] text-[#ff5400] animate-bounce block z-[20]">
                <GraduationCap size={48} strokeWidth={1.5} className="drop-shadow-lg" />
              </motion.div>
              <motion.div style={{ y: yFg }} className="absolute pr-floating-icon top-[20%] right-[5%] text-[#ff6c00] block z-[20]">
                <Settings size={42} strokeWidth={1.5} className="drop-shadow-lg" style={{animation: 'spin 12s linear infinite'}} />
              </motion.div>
              <motion.div style={{ y: yBg }} className="absolute pr-floating-icon bottom-[10%] left-[5%] text-[#ff9f1c] animate-pulse block z-[20]">
                <Code size={40} strokeWidth={2} className="drop-shadow-lg" />
              </motion.div>
              <motion.div style={{ y: yFloat, animationDuration: '4.2s', animationDelay: '1s' }} className="absolute bottom-[15%] right-[5%] text-[#ee4700] animate-bounce block z-[20]">
                <Pencil size={36} strokeWidth={2} className="drop-shadow-lg -rotate-45" />
              </motion.div>
              
              <div className="w-[72%] h-[72%] z-10 pr-pop">
                <HeroRobot className="w-full h-full drop-shadow-2xl" />
              </div>
            </div>
          </div>

          {/* ROW 3: BOTTOM CTA */}
          <div className="pr-hero-row-bottom">
            <div
              className="flex justify-between items-end w-full pr-hero-bottom pr-rise"
              style={{ ['--pr-delay' as string]: '0.4s' }}
            >
              <div className="w-full md:max-w-[340px]">
                <p className="pr-hero-desc text-[#646a73] font-[500] mb-[clamp(8px,1.5vh,18px)] m-0">
                  Engineering the future through Robotics Education with our Composite Skill Lab, Research, AI, Drones and Innovation.
                </p>
                <div className="flex items-center gap-[12px] pr-btn-group">
                  <Link href="#packages" className="pr-btn-cta-orange flex items-center justify-center gap-1.5">
                    Get Started <ArrowRight size={14} strokeWidth={2.5} />
                  </Link>
                  <Link href="/contact" className="pr-btn-cta-ghost flex items-center justify-center">Contact Us</Link>
                </div>
              </div>

              <div className="max-w-[270px] text-right pr-bottom-right">
                <p className="pr-hero-desc text-[#646a73] font-[500] m-0">
                  From the first spark of an idea to worldwide recognition — we partner with brands
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* FLOATING SOCIAL SIDEBAR */}
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
      </section>

      {/* --- MARQUEE --- */}
      <div className="shrink-0 relative z-20 bg-[#1a1a1a] text-white py-2 sm:py-3 overflow-hidden flex whitespace-nowrap w-full">
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
              We don&apos;t just supply equipment — we build ecosystems where curiosity meets industrial capability. Our labs turn passive consumers into active robotics creators.
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
            <motion.div 
              className="lg:w-7/12 grid grid-cols-1 sm:grid-cols-2 gap-6 relative pt-0 lg:pt-16"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={{
                hidden: { opacity: 0 },
                visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
              }}
            >
              {[
                { icon: ShieldCheck, title: "NEP Validated", desc: "Full compliance with the latest education framework.", mt: "mt-0" },
                { icon: Award, title: "Skill-First", desc: "Digital skill passports with verifiable GitHub portfolios.", mt: "mt-0" },
                { icon: Cpu, title: "Hardware-First", desc: "100+ modular hardware testbeds for circuits.", mt: "mt-0" },
                { icon: Clock, title: "14-Day Setup", desc: "Full lab installation and onboarding in just two weeks.", mt: "mt-0" },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <motion.div 
                    key={i} 
                    className={`bg-gradient-to-br from-[#111] to-black border-2 border-[#222] p-6 sm:p-8 relative group cursor-default ${item.mt}`}
                    variants={{
                      hidden: { opacity: 0, y: 50, rotateX: 15, perspective: 800 },
                      visible: { opacity: 1, y: 0, rotateX: 0, transition: { type: "spring", damping: 14 } }
                    }}
                    whileHover={{ 
                      scale: 1.05, 
                      y: -10, 
                      borderColor: "rgba(255, 84, 0, 0.6)",
                      boxShadow: "0 25px 50px -12px rgba(255, 84, 0, 0.25)"
                    }}
                  >
                    <div className="flex items-center justify-between mb-8">
                      <motion.div 
                        className="text-[#ff5400]"
                        whileHover={{ rotate: 180, scale: 1.2 }}
                        transition={{ type: "spring", stiffness: 200, damping: 10 }}
                      >
                        <Icon size={32} strokeWidth={1.5} />
                      </motion.div>
                      <span className="font-mono text-xs text-white/30">0{i + 2}</span>
                    </div>
                    <h4 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight mb-3">{item.title}</h4>
                    <p className="text-[#888] text-sm leading-relaxed">{item.desc}</p>
                  </motion.div>
                );
              })}
            </motion.div>

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
            <div className="font-mono font-bold text-4xl text-white/5 mt-10">{"///"}</div>
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

            <motion.a
              href="https://wa.me/916001979712?text=Hello%20Radix%20Robotics,%20we%20want%20to%20apply%20for%20the%20Founding%20Partner%20School%20Cohort"
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="relative z-10 w-fit bg-[#111] text-white px-8 sm:px-12 py-5 font-bold uppercase tracking-widest text-sm flex items-center gap-4 group/btn cursor-pointer"
              whileHover={{ 
                scale: 1.05, 
                y: -5,
                boxShadow: "12px 12px 0px rgba(17,17,17,0.6)"
              }}
              whileTap={{ scale: 0.95, y: 0, boxShadow: "4px 4px 0px rgba(17,17,17,0.8)" }}
              style={{ boxShadow: "8px 8px 0px rgba(17,17,17,0.3)" }}
            >
              Apply as Founding School 
              <motion.div
                animate={{ x: [0, 5, 0] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
              >
                <ArrowRight size={20} />
              </motion.div>
            </motion.a>
          </motion.div>
        </div>
      </section>
      <Footer />
    </div>
    </MotionConfig>
  );
}