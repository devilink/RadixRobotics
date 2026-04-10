"use client";
import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { Menu, X, Moon, Sun, ArrowRight, Play, Server, Layers, Cpu, Code2, Wifi, Trophy, LogOut } from 'lucide-react';

export default function Page() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [isHeroActive, setIsHeroActive] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    // Initial user check
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    const saved = localStorage.getItem('radix-theme');
    if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    }
    
    const handleWinScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleWinScroll);
    return () => window.removeEventListener('scroll', handleWinScroll);
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('radix-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('radix-theme', 'light');
    }
  };

  const heroRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const heroContentRef = useRef<HTMLDivElement>(null);
  const scrollCueRef = useRef<HTMLDivElement>(null);
  const diveInRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  // Derive school portal URL from user's email if they are a school admin
  const getSchoolPortalUrl = () => {
    if (!user) return '/login';
    const email = user.email || '';
    // Super admin goes to super-admin dashboard
    if (email === 'princedas000555@gmail.com') {
      return '/super-admin';
    }
    if (email.endsWith('@radix.school')) {
      const schoolId = email.replace('@radix.school', '').toUpperCase();
      return `/curriculum/${schoolId}`;
    }
    return '/login';
  };

  // Load animation scripts safely after mounting
  useEffect(() => {
    const loadScript = (src: string) => {
      return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) return resolve(true);
        const s = document.createElement('script');
        s.src = src;
        s.onload = resolve;
        s.onerror = reject;
        document.body.appendChild(s);
      });
    };

    Promise.all([
      loadScript("https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"),
      loadScript("https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js")
    ]).then(() => {
      return loadScript("https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js");
    }).then(() => {
      return loadScript("https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js");
    }).then(() => {
      return loadScript("/landing-animations.js");
    }).catch(err => console.error("Script load error", err));
  }, []);

  // Image-sequence scroll-driven hero
  useEffect(() => {
    const canvas = canvasRef.current;
    const heroContainer = heroRef.current;
    const heroContent = heroContentRef.current;
    const scrollCue = scrollCueRef.current;
    if (!canvas || !heroContainer) return;

    const ctx = canvas.getContext('2d')!;
    const TOTAL_FRAMES = 298;
    const FPS = 24;
    const DURATION = TOTAL_FRAMES / FPS; // ~12.4s
    const images: HTMLImageElement[] = [];
    let currentFrame = -1;

    // Preload all frames
    for (let i = 1; i <= TOTAL_FRAMES; i++) {
      const img = new Image();
      img.src = `/hero-frames/frame${String(i).padStart(4, '0')}.webp`;
      img.onload = () => {
        // Draw first frame as soon as it loads
        if (i === 1 && canvas) {
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          ctx.drawImage(img, 0, 0);
          currentFrame = 0;
        }
      };
      images.push(img);
    }

    if (scrollCue) scrollCue.classList.add('opacity-100');
    setIsHeroActive(true);

    const handleScroll = () => {
      const rect = heroContainer.getBoundingClientRect();
      const scrolledY = -rect.top;
      const scrollRange = heroContainer.offsetHeight - window.innerHeight;
      const diveIn = diveInRef.current;

      if (scrolledY < 0 || scrollRange <= 0) {
        // Draw first frame
        if (currentFrame !== 0 && images[0]?.complete) {
          ctx.drawImage(images[0], 0, 0);
          currentFrame = 0;
        }
        if (heroContent) {
           heroContent.style.opacity = '0';
           heroContent.style.transform = 'translateY(20px)';
           heroContent.style.pointerEvents = 'none';
        }
        if (diveIn) {
           diveIn.style.opacity = '0';
        }
        if (scrollCue) scrollCue.classList.add('opacity-100');
        setIsHeroActive(true);
        return;
      }

      const progress = Math.min(scrolledY / scrollRange, 1);
      const frameIndex = Math.min(Math.floor(progress * (TOTAL_FRAMES - 1)), TOTAL_FRAMES - 1);
      const videoTime = progress * DURATION;

      if (frameIndex !== currentFrame && images[frameIndex]?.complete) {
        ctx.drawImage(images[frameIndex], 0, 0);
        currentFrame = frameIndex;
      }

      // UI updates based on video timeline
      if (scrollCue) {
        if (videoTime > 0.5) scrollCue.classList.remove('opacity-100');
        else scrollCue.classList.add('opacity-100');
      }
      if (heroContent) {
        if (videoTime >= 2 && videoTime <= 6) {
           heroContent.style.opacity = '1';
           heroContent.style.transform = 'translateY(0)';
           heroContent.style.pointerEvents = 'auto';
        } else {
           heroContent.style.opacity = '0';
           heroContent.style.transform = 'translateY(20px)';
           heroContent.style.pointerEvents = 'none';
        }
      }
      if (diveIn) {
        if (videoTime > 6) diveIn.style.opacity = '1';
        else diveIn.style.opacity = '0';
      }
      if (progress < 0.95) {
         setIsHeroActive(true);
      } else {
         setIsHeroActive(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <>
      <div className="cursor hidden lg:block w-2 h-2 bg-emerald-400 rounded-full fixed pointer-events-none z-50 mix-blend-difference" id="cursor"></div>
      <div className="cursor-ring hidden lg:block w-10 h-10 border border-emerald-400/40 rounded-full fixed pointer-events-none z-50 transition-all duration-300 ease-out" id="cr"></div>

      {/* NAV */}
      <nav id="nav" className={`fixed z-[1000] flex items-center justify-between transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] ${
          isHeroActive 
          ? 'top-5 left-1/2 -translate-x-1/2 w-[90%] max-w-[1400px] rounded-[50px] border border-white/15 px-[3rem] py-[0.9rem] bg-white/5 backdrop-blur-[60px] saturate-[1.8] shadow-[0_10px_40px_rgba(0,0,0,0.3)]' 
          : scrolled 
            ? 'top-0 left-1/2 -translate-x-1/2 w-full rounded-none border-b border-zinc-200 dark:border-zinc-800 px-6 md:px-16 py-[1.1rem] bg-zinc-100/95 dark:bg-zinc-950/95 backdrop-blur-xl shadow-sm'
            : 'top-0 left-1/2 -translate-x-1/2 w-full rounded-none border-b border-white/10 px-6 md:px-16 py-[1.1rem] bg-white/10 backdrop-blur-[48px] saturate-[1.6]'
        }`}>
        <a href="#" className="flex items-center gap-[0.7rem] no-underline outline-none text-[1.35rem] font-black tracking-[0.08em] text-zinc-900 dark:text-white" style={{ fontFamily: "'Orbitron', monospace" }}>
          <img src={isDark || isHeroActive ? "logo1.jpeg" : "logo.jpeg"} alt="RADIX Robotics Logo" className="h-[40px] w-auto object-contain" />
        </a>
        
        <ul className="hidden md:flex items-center gap-[2.5rem]">
          {[
            { href: '/', label: 'Home' },
            { href: '/#programs', label: 'Programs' },
            { href: '/about', label: 'About Us' },
            { href: '/contact', label: 'Contact' }
          ].map(link => (
            <li key={link.label}>
               <a href={link.href} className={`relative text-[0.8rem] font-semibold tracking-[0.1em] uppercase pb-[4px] transition-all border-b-2 border-transparent hover:border-emerald-500 ${isHeroActive ? 'text-white/85 hover:text-white' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'}`} style={{ fontFamily: "'Syne', sans-serif" }}>
                 {link.label}
               </a>
            </li>
          ))}
          <li>
             <Link href={getSchoolPortalUrl()} className={`relative text-[0.8rem] font-semibold tracking-[0.1em] uppercase pb-[4px] transition-all border-b-2 border-transparent hover:border-emerald-500 ${isHeroActive ? 'text-white/85 hover:text-white' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'}`} style={{ fontFamily: "'Syne', sans-serif" }}>
               School Portal
             </Link>
          </li>
          
          <li>
            <div className="flex items-center gap-4">
              <button className="w-[54px] h-[28px] rounded-[30px] border border-zinc-300 dark:border-zinc-700 bg-zinc-300 dark:bg-slate-800 flex items-center px-[2px] transition-colors" onClick={toggleTheme} aria-label="Toggle theme">
                <div className={`w-[22px] h-[22px] rounded-full bg-white dark:bg-slate-900 flex items-center justify-center transition-transform duration-[400ms] shadow-sm ${isDark ? 'translate-x-[26px]' : 'translate-x-0'}`}>
                  <span className="text-[10px] leading-none">{isDark ? '🌙' : '☀️'}</span>
                </div>
              </button>
              
              {!user ? (
                <a href="/login" className="px-[1.5rem] py-[0.55rem] rounded-[6px] bg-white text-zinc-950 font-bold tracking-[0.12em] text-[0.78rem] uppercase shadow-[0_2px_12px_rgba(255,255,255,0.2)] hover:shadow-[0_4px_20px_rgba(255,255,255,0.4)] transition-all hover:-translate-y-[1px]" style={{ fontFamily: "'Syne', sans-serif" }}>Log In</a>
              ) : (
                <button onClick={handleLogout} className="px-[1.5rem] py-[0.55rem] rounded-[6px] bg-zinc-800 text-white font-bold tracking-[0.12em] text-[0.78rem] uppercase border border-white/10 hover:bg-zinc-700 transition-all flex items-center gap-2" style={{ fontFamily: "'Syne', sans-serif" }}>
                  <LogOut className="w-3 h-3" /> Out
                </button>
              )}

              {user?.email === 'princedas000555@gmail.com' && (
                <Link href="/super-admin" className="px-[1.5rem] py-[0.55rem] rounded-[6px] bg-emerald-500 text-white font-bold tracking-[0.12em] text-[0.78rem] uppercase shadow-[0_2px_12px_rgba(52,211,153,0.3)] hover:shadow-[0_4px_20px_rgba(52,211,153,0.4)] transition-all hover:-translate-y-[1px]" style={{ fontFamily: "'Syne', sans-serif" }}>Admin</Link>
              )}
            </div>
          </li>
        </ul>
        
        <div className="md:hidden flex items-center gap-4">
           <button className="w-[54px] h-[28px] rounded-[30px] border border-zinc-300 dark:border-zinc-700 bg-zinc-300 dark:bg-slate-800 flex items-center px-[2px] transition-colors" onClick={toggleTheme} aria-label="Toggle theme">
                <div className={`w-[22px] h-[22px] rounded-full bg-white dark:bg-slate-900 flex items-center justify-center transition-transform duration-[400ms] shadow-sm ${isDark ? 'translate-x-[26px]' : 'translate-x-0'}`}>
                  <span className="text-[10px] leading-none">{isDark ? '🌙' : '☀️'}</span>
                </div>
           </button>
           <button className="flex flex-col gap-[6px] p-2" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
             <span className={`w-[25px] h-[2px] rounded-[2px] transition-colors ${isHeroActive ? 'bg-white' : 'bg-zinc-900 dark:bg-white'}`} />
             <span className={`w-[25px] h-[2px] rounded-[2px] transition-colors ${isHeroActive ? 'bg-white' : 'bg-zinc-900 dark:bg-white'}`} />
             <span className={`w-[25px] h-[2px] rounded-[2px] transition-colors ${isHeroActive ? 'bg-white' : 'bg-zinc-900 dark:bg-white'}`} />
           </button>
        </div>
      </nav>

      {/* MOBILE OVERLAY */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-sm pt-24 px-6">
          <ul className="flex flex-col gap-6 text-center">
            <li><a href="/" onClick={() => setIsMobileMenuOpen(false)} className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Home</a></li>
            <li><a href="/#programs" onClick={() => setIsMobileMenuOpen(false)} className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Programs</a></li>
            <li><a href="/about" onClick={() => setIsMobileMenuOpen(false)} className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">About Us</a></li>
            <li><a href="/contact" onClick={() => setIsMobileMenuOpen(false)} className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Contact</a></li>
             <li><Link href={getSchoolPortalUrl()} onClick={() => setIsMobileMenuOpen(false)} className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">School Portal</Link></li>
             
             {!user ? (
               <a href="/login" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-bold text-white bg-zinc-800 rounded-xl py-3 mt-4 text-center">Log In</a>
             ) : (
               <button onClick={handleLogout} className="text-xl font-bold text-red-500 mt-4 text-center border border-red-500/20 py-2 rounded-xl">Log Out</button>
             )}

             {user?.email === 'princedas000555@gmail.com' && (
               <a href="/super-admin" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-bold text-emerald-500 mt-2 text-center">Admin Panel</a>
             )}
          </ul>
        </div>
      )}

      <div className="w-full relative">

        {/* HERO — Scroll-driven image sequence */}
        <div className="h-[400vh] relative" ref={heroRef}>
          <section id="hero" className="sticky top-0 h-screen w-full bg-black flex items-center overflow-hidden">
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover z-0" />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-zinc-950/40 to-transparent z-10 pointer-events-none" />
            
            <div className="relative z-20 px-6 md:px-16 w-full max-w-4xl mx-auto md:mx-0 opacity-0 transition-all duration-1000 ease-out" ref={heroContentRef}>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-zinc-700 bg-white/5 backdrop-blur-md mb-8" style={{ fontFamily: "'Syne', sans-serif" }}>
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                <span className="text-xs font-semibold tracking-wider text-zinc-300 uppercase">Skill Labs for Schools</span>
              </div>
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight text-white mb-6 uppercase leading-none" style={{ fontFamily: "'Orbitron', sans-serif", textShadow: '0 0 15px rgba(0, 229, 255, 0.4)' }}>
                Building <br/>
                <span className="text-zinc-400">Tomorrow&apos;s</span> <br/>
                <span className="text-emerald-400" style={{ textShadow: '0 0 15px rgba(52, 211, 153, 0.4)' }}>Innovators</span>
              </h1>
              <p className="text-lg md:text-xl text-zinc-300 max-w-xl mb-10 leading-relaxed font-medium" style={{ fontFamily: "'Syne', sans-serif" }}>
                RADIX Robotics installs world-class composite skill laboratories inside schools — empowering students with robotics, AI, and advanced tech education.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <a href="#programs" className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-bold uppercase tracking-wider rounded-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_30px_-10px_rgba(16,185,129,0.5)] active:scale-95">
                  Explore Programs <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </a>
                <a href="/3d-lab" target="_blank" rel="noreferrer" className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-bold uppercase tracking-wider rounded-lg backdrop-blur-md transition-all duration-300 border border-white/10 hover:-translate-y-1 hover:shadow-[0_10px_30px_-10px_rgba(255,255,255,0.2)] active:scale-95">
                  <Play className="w-4 h-4 group-hover:scale-125 transition-transform" /> View 3D Lab
                </a>
              </div>
            </div>

            <div className="absolute z-30 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center opacity-0 transition-opacity duration-1000 pointer-events-none" ref={diveInRef}>
              <h2 
                className="text-3xl md:text-6xl font-medium tracking-[0.15em] text-cyan-200 px-4 uppercase" 
                style={{ 
                  fontFamily: "'Orbitron', sans-serif", 
                  textShadow: '0 0 25px rgba(34, 211, 238, 0.8), 0 0 50px rgba(34, 211, 238, 0.4)' 
                }}
              >
                Dive In_
              </h2>
            </div>

            <div className="absolute z-30 bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 opacity-0 transition-opacity duration-500" ref={scrollCueRef}>
              <span className="text-xs font-semibold tracking-[0.2em] text-white/50 uppercase">Scroll</span>
              <div className="w-[1px] h-12 bg-gradient-to-b from-white/50 to-transparent" />
            </div>
          </section>
        </div>

        {/* MINIMALIST MARQUEE */}
        <div className="py-6 bg-zinc-900 border-y border-zinc-800 overflow-hidden flex whitespace-nowrap">
          <div className="animate-marquee flex whitespace-nowrap gap-12 text-zinc-400 text-sm font-medium tracking-wide uppercase px-6">
             {['Arduino & Raspberry Pi', 'AI & Machine Learning', 'Drone Technology', '3D Printing & CAD', 'IoT Systems', 'Python & C++', 'Sensor Integration', 'Autonomous Vehicles'].map((t, i) => (
                <span key={i} className="flex items-center gap-12">
                   {t}
                   <span className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
                </span>
             ))}
          </div>
          <div className="animate-marquee flex whitespace-nowrap gap-12 text-zinc-400 text-sm font-medium tracking-wide uppercase px-6" aria-hidden="true">
             {['Arduino & Raspberry Pi', 'AI & Machine Learning', 'Drone Technology', '3D Printing & CAD', 'IoT Systems', 'Python & C++', 'Sensor Integration', 'Autonomous Vehicles'].map((t, i) => (
                <span key={`dup-${i}`} className="flex items-center gap-12">
                   {t}
                   <span className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
                </span>
             ))}
          </div>
        </div>

        {/* PROGRAMS SECTION */}
        <section id="programs" className="py-24 md:py-32 px-6 lg:px-12 bg-white dark:bg-zinc-950">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-3xl mx-auto mb-20">
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold tracking-wider text-sm uppercase mb-4 block">06 Structured Tracks</span>
              <h2 className="text-4xl md:text-6xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 mb-6">
                Curriculum Built <br/><span className="text-zinc-400">for the Future</span>
              </h2>
              <p className="text-lg text-zinc-600 dark:text-zinc-400">
                Multi-tiered programs scale from elementary exploration to advanced engineering pipelines — structured around real-world industry standards.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { icon: <Cpu className="w-6 h-6 text-blue-500" />, title: 'Intro to Robotics & Coding', label: 'FOUNDATION', desc: 'Block-based and Python programming with hands-on robot assembly. Perfect entry point for grades 4–7.', tags: ['Scratch', 'Python', 'Lego NXT'] },
                { icon: <Server className="w-6 h-6 text-violet-500" />, title: 'Advanced Mechatronics', label: 'INTERMEDIATE', desc: 'Servo systems, sensor integration, and autonomous navigation. Deep-dive for grades 8–10.', tags: ['Arduino', 'C++', 'Sensors'] },
                { icon: <Code2 className="w-6 h-6 text-emerald-500" />, title: 'AI & Machine Learning', label: 'ELITE', desc: 'Computer vision, neural networks, and TensorFlow Lite on embedded systems for grades 10–12.', tags: ['TensorFlow', 'OpenCV', 'RPi'] },
                { icon: <Layers className="w-6 h-6 text-rose-500" />, title: '3D Design & Prototyping', label: 'FABRICATION', desc: 'CAD modeling with Fusion 360 and FDM printing to bring robot chassis concepts to life.', tags: ['Fusion 360', 'FDM', 'CAD'] },
                { icon: <Wifi className="w-6 h-6 text-cyan-500" />, title: 'IoT & Smart Systems', label: 'CONNECTED', desc: 'Build networked sensor arrays and real-time monitoring dashboards using MQTT and cloud APIs.', tags: ['ESP32', 'MQTT', 'Cloud'] },
                { icon: <Trophy className="w-6 h-6 text-amber-500" />, title: 'Robotics Olympiad Prep', label: 'COMPETITIVE', desc: 'Structured training for WRO, FRC, and national robotics competitions with mentored sprints.', tags: ['WRO', 'FRC', 'Strategy'] }
              ].map((prog, idx) => (
                <div key={idx} className="group p-8 rounded-3xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500 dark:hover:border-emerald-500 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(16,185,129,0.15)] flex flex-col h-full cursor-pointer">
                  <div className="w-12 h-12 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 group-hover:bg-emerald-500/10 group-hover:border-emerald-500/30 transition-all duration-500">
                    {prog.icon}
                  </div>
                  <span className="text-xs font-bold tracking-widest text-zinc-400 mb-2">{prog.label}</span>
                  <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-3">{prog.title}</h3>
                  <p className="text-zinc-600 dark:text-zinc-400 mb-8 flex-grow leading-relaxed">{prog.desc}</p>
                  <div className="flex flex-wrap gap-2">
                    {prog.tags.map(t => (
                      <span key={t} className="px-3 py-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 rounded-full text-xs font-medium">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* MEASURABLE IMPACT SECTION */}
        <section id="features" className="py-24 md:py-32 px-6 lg:px-12 bg-zinc-100 dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
               <div>
                  <h2 className="text-4xl md:text-6xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 mb-6">
                    Measurable Impact<br/><span className="text-zinc-400">at Every Level</span>
                  </h2>
                  <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-xl mb-8">
                    Data-driven, mentorship-heavy, and built to produce engineers — not just students who&apos;ve seen a robot. We track success across every cohort.
                  </p>
                  <ul className="space-y-4 mb-8">
                     {['Safety-First Lab Design', 'Real-Time Analytics Dashboard', 'National Robotics Network'].map(item => (
                        <li key={item} className="flex items-center gap-3 text-zinc-700 dark:text-zinc-300 font-medium">
                           <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                             <span className="w-2 h-2 rounded-full bg-emerald-500" />
                           </span>
                           {item}
                        </li>
                     ))}
                  </ul>
               </div>

               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 {[
                   { val: '340%', label: 'Increase in STEM Enrollment' },
                   { val: '250+', label: 'Hands-on Curriculum Hours' },
                   { val: '98%', label: 'Student Satisfaction Rate' },
                   { val: '40hr', label: 'Teacher Certification Time' }
                 ].map((stat, i) => (
                   <div key={i} className="group p-8 rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:border-emerald-500/30 cursor-default">
                     <div className="text-4xl lg:text-5xl font-black tracking-tighter text-zinc-900 dark:text-white mb-2 group-hover:text-emerald-400 transition-colors duration-500">{stat.val}</div>
                     <div className="text-sm font-medium text-zinc-500 dark:text-zinc-400 leading-tight flex items-center gap-2">
                       {stat.label}
                       <ArrowRight className="w-3 h-3 text-emerald-500 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500" />
                     </div>
                   </div>
                 ))}
               </div>
            </div>
          </div>
        </section>

        {/* LABS SETUP SECTION */}
        <section id="labs" className="py-24 md:py-32 px-6 lg:px-12 bg-white dark:bg-zinc-950">
          <div className="max-w-7xl mx-auto">
             <div className="text-center max-w-3xl mx-auto mb-20">
              <h2 className="text-4xl md:text-6xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 mb-6">
                From Empty Room<br/><span className="text-emerald-500">to Composite Skill Lab</span>
              </h2>
              <p className="text-lg text-zinc-600 dark:text-zinc-400">
                We handle everything. RADIX assesses, designs, installs, and trains — turning any unused classroom into a world-class robotics facility.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-start">
               {/* Minimal Timeline */}
               <div className="space-y-12">
                 {[
                   { n: '01', t: 'Site Assessment & Design', d: 'Our engineers survey available space and design a custom lab layout optimized for learning flow and safety compliance.' },
                   { n: '02', t: 'Equipment Installation', d: 'We supply and install all hardware — workstations, robotics kits, 3D printers, soldering stations, and network infrastructure.' },
                   { n: '03', t: 'Teacher Certification', d: 'School staff undergo a 40-hour certification program covering curriculum delivery and lab management.' },
                   { n: '04', t: 'Live Program Delivery', d: 'Weekly sessions with certified educators, supplemented by our digital platform and progress tracking.' }
                 ].map((s, i) => (
                   <div key={i} className="relative pl-10 md:pl-16">
                     <div className="absolute left-0 top-1 w-8 text-sm font-black text-zinc-300 dark:text-zinc-700">{s.n}</div>
                     <h3 className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-3">{s.t}</h3>
                     <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">{s.d}</p>
                   </div>
                 ))}
               </div>
               
               {/* Showcase Image */}
               <div className="relative rounded-[2rem] overflow-hidden bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-2 group">
                 <div className="relative rounded-[1.5rem] overflow-hidden">
                   <img src="robotics_lab.png" alt="Composite Robotics Lab" className="w-full h-auto object-cover aspect-video lg:aspect-[4/5] group-hover:scale-105 transition-transform duration-700" />
                   
                   {/* 3D Lab Button Overlay */}
                   <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center">
                     <a 
                       href="/3d-lab" 
                       target="_blank" 
                       rel="noreferrer"
                       className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-3 px-8 rounded-full shadow-[0_0_30px_rgba(16,185,129,0.5)] transform translate-y-4 group-hover:translate-y-0 transition-all duration-500 flex items-center gap-2"
                     >
                       <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                       See our labs in 3D
                     </a>
                   </div>

                   <div className="absolute bottom-6 left-6 right-6 p-4 rounded-xl bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 flex justify-between items-center shadow-xl">
                      <span className="font-medium text-zinc-600 dark:text-zinc-400">Standard Setup Time</span>
                      <span className="font-black text-lg text-emerald-600 dark:text-emerald-400">4-6 Weeks</span>
                   </div>
                 </div>
               </div>
            </div>
          </div>
        </section>

        {/* CTA SECTION */}
        <section className="py-32 px-6 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-center">
           <div className="max-w-4xl mx-auto">
             <span className="px-4 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-sm font-bold tracking-widest uppercase mb-8 inline-block">Now Enrolling 2026</span>
             <h2 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight text-zinc-900 dark:text-white mb-8">
               Let&apos;s Build the<br/><span className="text-zinc-400">Lab of Tomorrow</span>
             </h2>
             <p className="text-xl text-zinc-600 dark:text-zinc-400 mb-12 max-w-2xl mx-auto">
               Join the <strong className="text-zinc-900 dark:text-white font-bold">forward-thinking pioneer schools</strong> across Northeast India that have already partnered with RADIX Robotics.
             </p>
             <div className="flex flex-col sm:flex-row items-center justify-center gap-4 group cursor-pointer w-full sm:w-auto">
                <a href="https://wa.me/916001979712" target="_blank" rel="noreferrer" className="w-full sm:w-auto px-10 py-5 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 text-lg font-bold rounded-2xl transition-all duration-300 inline-flex items-center justify-center gap-3 hover:-translate-y-1 hover:shadow-[0_20px_40px_-15px_rgba(255,255,255,0.3)] active:scale-95">
                  Apply for Lab <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </a>
             </div>
           </div>
        </section>

        {/* FOOTER */}
        <footer className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-6 py-20">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 lg:col-span-2">
              <a href="#" className="flex items-center gap-3 mb-6 no-underline outline-none">
                <img src={isDark ? "logo1.jpeg" : "logo.jpeg"} alt="RADIX Robotics Logo" className="h-8 md:h-10 w-auto object-contain" />
              </a>
              <p className="text-zinc-600 dark:text-zinc-400 max-w-sm mb-8">
                Making robotics and coding the most fun part of the school day. Equipping students with the skills they need to invent the future.
              </p>
              <div className="flex gap-4">
                 <a href="#" className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-zinc-600 dark:text-zinc-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-all duration-300 hover:scale-110 active:scale-95">
                   <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                 </a>
                 <a href="#" className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-zinc-600 dark:text-zinc-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-all duration-300 hover:scale-110 active:scale-95">
                   <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                 </a>
              </div>
            </div>
            
            <div>
              <h4 className="font-bold text-zinc-900 dark:text-zinc-100 mb-6">Quick Links</h4>
              <ul className="space-y-4">
                <li><a href="#programs" className="inline-block text-zinc-600 dark:text-zinc-400 hover:text-emerald-500 hover:translate-x-1 transition-all duration-300">Our Programs</a></li>
                <li><a href="/school-admin/students" className="inline-block text-zinc-600 dark:text-zinc-400 hover:text-emerald-500 hover:translate-x-1 transition-all duration-300">School Portal</a></li>
                <li><a href="#labs" className="inline-block text-zinc-600 dark:text-zinc-400 hover:text-emerald-500 hover:translate-x-1 transition-all duration-300">Teacher Training</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold text-zinc-900 dark:text-zinc-100 mb-6">Get in Touch</h4>
              <ul className="space-y-4">
                <li><a href="/about" className="inline-block text-zinc-600 dark:text-zinc-400 hover:text-emerald-500 hover:translate-x-1 transition-all duration-300">About RADIX</a></li>
                <li><a href="/contact" className="inline-block text-zinc-600 dark:text-zinc-400 hover:text-emerald-500 hover:translate-x-1 transition-all duration-300">Join the Team</a></li>
                <li><a href="https://wa.me/916001979712" target="_blank" rel="noreferrer" className="inline-block text-zinc-600 dark:text-zinc-400 hover:text-emerald-500 hover:translate-x-1 transition-all duration-300">Contact Us</a></li>
              </ul>
            </div>
          </div>
          <div className="max-w-7xl mx-auto pt-8 border-t border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-zinc-500 dark:text-zinc-500">
             <p>© 2026 RADIX Robotics Pvt. Ltd.</p>
             <p>Built with <span className="text-emerald-500">❤️</span> for Future Innovators</p>
          </div>
        </footer>
      </div>
    </>
  );
}
