"use client";

import { useRef } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useEffect } from 'react';

export default function PedagogicalImpact() {
  const containerRef = useRef(null);
  const textRef = useRef<HTMLParagraphElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });
  
  const yWatermark = useTransform(scrollYProgress, [0, 1], [-200, 200]);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    
    let ctx = gsap.context(() => {
      if (textRef.current) {
        gsap.fromTo(
          textRef.current.children,
          { opacity: 0.1, filter: "blur(4px)" },
          {
            opacity: 1,
            filter: "blur(0px)",
            stagger: 0.1,
            scrollTrigger: {
              trigger: textRef.current,
              start: "top 85%",
              end: "bottom 50%",
              scrub: true,
            }
          }
        );
      }
    }, textRef);

    return () => ctx.revert();
  }, []);

  const highlightText = "Traditional rote memorization fails to equip students with real-world skills. By interacting physically with robotics components, students bridge the gap between abstract code and tangible mechanical action.";
  const words = highlightText.split(" ");
  const benchmarks = [
    {
      metric: "4X",
      title: "Faster Comprehension",
      description: "Tactile electromechanical assembly compresses complex physics into intuitive physical realities.",
      handwrittenNote: "Learn by doing",
      stickerColor: "bg-[#111] text-white",
    },
    {
      metric: "89%",
      title: "Higher Engagement",
      description: "Active hardware debugging fosters spontaneous peer collaboration over passive listening.",
      handwrittenNote: "Active collaboration",
      stickerColor: "bg-[#ff5400] text-white",
    },
    {
      metric: "94%",
      title: "Long-Term Retention",
      description: "Kinesthetic pedagogy delivers 94% retention after 90 days vs 20% from video lectures.",
      handwrittenNote: "Permanent memory",
      stickerColor: "bg-white text-[#111]",
    },
    {
      metric: "100%",
      title: "NEP 2020 Aligned",
      description: "Fully compliant with NEP 2020 directives for vocational training, AI literacy, and design thinking.",
      handwrittenNote: "Framework compliant",
      stickerColor: "bg-[#111] text-[#ff5400]",
    }
  ];

  return (
    <section ref={containerRef} id="impact" className="relative z-10 w-full overflow-hidden">

      {/* Section 1 — Metrics (Dark, Asymmetric Typography) */}
      <div className="bg-[#111] py-16 sm:py-24 border-b-2 border-white/10 relative overflow-hidden">
        <motion.div style={{ y: yWatermark }} className="absolute top-10 right-10 opacity-[0.02] text-[400px] font-black leading-none pointer-events-none pr-font-sans">4X</motion.div>
        
        <div className="w-full 2xl:px-24 mx-auto px-4 sm:px-8 lg:px-16 pr-font-sans relative z-10">

          {/* Header */}
          <div className="max-w-4xl mb-20 sm:mb-32">
            <span className="font-mono text-xs sm:text-sm font-bold uppercase tracking-widest text-[#ff5400] block mb-4">
              [ Why This Approach Works ]
            </span>
            <h2 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tighter text-white uppercase leading-[0.95] mb-12">
              Hands-On Hardware<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff5400] to-yellow-500">Outperforms</span> Passive Models
            </h2>

            <p ref={textRef} className="text-2xl sm:text-3xl lg:text-4xl font-bold leading-snug text-white max-w-3xl flex flex-wrap gap-x-2">
              {words.map((word, i) => (
                <span key={i} className="inline-block">{word}</span>
              ))}
            </p>
          </div>

          {/* Staggered Metrics */}
          <div className="flex flex-col gap-16 md:gap-24">
            {benchmarks.map((b, i) => (
              <div
                key={i}
                className={`flex flex-col md:flex-row items-start gap-6 md:gap-16 ${i % 2 === 0 ? 'md:mr-auto' : 'md:ml-auto'} max-w-2xl group`}
              >
                {/* Metric number */}
                <div className="text-6xl sm:text-8xl lg:text-[120px] font-black tracking-tighter text-[#ff5400] leading-none pr-font-sans drop-shadow-[4px_4px_0_rgba(255,84,0,0.3)] group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 origin-left">
                  {b.metric}
                </div>

                <div className="pt-2 md:pt-6">
                  <h3 className="text-xl sm:text-3xl font-black uppercase text-white mb-3 tracking-tighter">
                    {b.title}
                  </h3>
                  <div className="font-mono text-xs font-bold text-white/50 uppercase tracking-wider mb-4 border-l-2 border-[#ff5400] pl-3">
                    // {b.handwrittenNote}
                  </div>
                  <p className="text-[#a0aab8] text-sm sm:text-base font-medium leading-relaxed max-w-sm">
                    {b.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Asymmetric Section — Head-to-Head Comparison */}
      <div className="flex flex-col md:flex-row w-full pr-font-sans">
        
        {/* Traditional Column (Light, Faded, Rigid) */}
        <div className="w-full md:w-5/12 bg-[#f2f3f5] p-10 sm:p-16 lg:p-24 border-b-2 md:border-b-0 md:border-r-2 border-[#111]">
          <div className="flex items-center gap-4 mb-10 pb-6 border-b-2 border-[#d1d5db]">
            <div className="p-3 bg-white border-2 border-[#111] text-[#111] shadow-[2px_2px_0_#111]">
              <XCircle size={28} />
            </div>
            <div>
              <span className="font-mono text-[10px] font-bold text-[#7b828e] uppercase tracking-widest">// Rote & Passive</span>
              <h4 className="text-2xl sm:text-3xl font-black text-[#111] uppercase tracking-tighter mt-1">Traditional</h4>
            </div>
          </div>

          <ul className="space-y-8 text-sm font-semibold text-[#5c6370]">
            {[
              { bold: "20% Retention", rest: "High cognitive decay from lack of kinesthetic reinforcement." },
              { bold: "Theoretical Only", rest: "Code on blackboard without physical actuator feedback." },
              { bold: "Zero Failure Tolerance", rest: "Exams penalize mistakes instead of encouraging debugging." },
              { bold: "Generic Portfolio", rest: "No verifiable GitHub repos or functional hardware prototypes." }
            ].map((item, idx) => (
              <li key={idx} className="flex items-start gap-4 opacity-70 grayscale">
                <span className="text-[#111] font-black text-xl shrink-0 mt-[-2px]">✕</span>
                <span className="leading-relaxed"><strong className="text-[#111] block mb-1 text-base uppercase tracking-tight">{item.bold}</strong> {item.rest}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Radix Column (Dark, Vibrant, Energetic) */}
        <div className="w-full md:w-7/12 bg-[#111] p-10 sm:p-16 lg:p-24 relative overflow-hidden">
          {/* Abstract geometric background elements */}
          <div className="absolute right-0 bottom-0 w-[500px] h-[500px] bg-[radial-gradient(circle_at_bottom_right,rgba(255,84,0,0.15)_0%,transparent_70%)] pointer-events-none"></div>

          <div className="flex items-center gap-4 mb-12 pb-6 border-b-2 border-white/10 relative z-10">
            <div className="p-3 bg-[#ff5400] text-white border-2 border-[#ff5400] shadow-[4px_4px_0_white]">
              <CheckCircle2 size={32} />
            </div>
            <div>
              <span className="font-mono text-xs font-bold text-[#ff5400] uppercase tracking-widest">// Kinesthetic & Problem-Based</span>
              <h4 className="text-3xl sm:text-5xl font-black text-white uppercase tracking-tighter mt-1">Radix Model</h4>
            </div>
          </div>

          <ul className="space-y-10 text-sm md:text-base font-semibold text-[#a0aab8] relative z-10">
            {[
              { bold: "94% Retention", rest: "Tactile manipulation cements algorithmic principles permanently." },
              { bold: "Instant Feedback", rest: "Circuits light up, beep, and move physically upon compilation." },
              { bold: "Iterative Mindset", rest: "Hardware bugs teach resilience, analysis, and root-cause discovery." },
              { bold: "Verifiable Passports", rest: "Capstone projects ready for WRO, university portfolios, and careers." }
            ].map((item, idx) => (
              <li key={idx} className="flex items-start gap-5 hover:translate-x-2 transition-transform duration-300">
                <span className="text-[#ff5400] font-black text-2xl shrink-0 mt-[-2px]">✓</span>
                <span className="leading-relaxed">
                  <strong className="text-white block mb-1.5 text-lg uppercase tracking-tight font-black">{item.bold}</strong> 
                  {item.rest}
                </span>
              </li>
            ))}
          </ul>
        </div>

      </div>
    </section>
  );
}
