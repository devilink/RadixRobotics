"use client";

import { CheckCircle2, XCircle } from 'lucide-react';

export default function PedagogicalImpact() {
  const benchmarks = [
    {
      metric: "4X",
      title: "Faster Comprehension",
      description: "Tactile electromechanical assembly compresses complex physics into intuitive physical realities.",
      handwrittenNote: "learn by doing, not reading!",
      stickerColor: "sticker-yellow",
      rotation: "-rotate-1"
    },
    {
      metric: "89%",
      title: "Higher Engagement",
      description: "Active hardware debugging fosters spontaneous peer collaboration over passive listening.",
      handwrittenNote: "kids actually want to stay in class →",
      stickerColor: "sticker-mint",
      rotation: "rotate-[0.5deg]"
    },
    {
      metric: "94%",
      title: "Long-Term Retention",
      description: "Kinesthetic pedagogy delivers 94% retention after 90 days vs 20% from video lectures.",
      handwrittenNote: "they remember it forever ★",
      stickerColor: "sticker-coral",
      rotation: "-rotate-[0.5deg]"
    },
    {
      metric: "100%",
      title: "NEP 2020 Aligned",
      description: "Fully compliant with NEP 2020 directives for vocational training, AI literacy, and design thinking.",
      handwrittenNote: "checks every box ✓",
      stickerColor: "sticker-purple",
      rotation: "rotate-1"
    }
  ];

  return (
    <section id="impact" className="relative z-10 w-full overflow-hidden">

      {/* Yellow Section — Metrics */}
      <div className="section-yellow py-16 sm:py-24">
        <div className="w-full 2xl:px-24 mx-auto px-4 sm:px-8 lg:px-16">

          {/* Header */}
          <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
            <span className="font-handwriting text-xl sm:text-2xl text-[#1a1a1a] block mb-2">
              — why this approach works —
            </span>
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-[#1a1a1a] leading-[1.05]">
              Hands-On Hardware<br />
              <span className="relative">Outperforms
                <span className="absolute -bottom-2 left-0 right-0 h-3 bg-[#1a1a1a]/10 rounded-sm"></span>
              </span> Passive Models
            </h2>
          </div>

          {/* 4 Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {benchmarks.map((b, i) => (
              <div
                key={i}
                className={`paper-card p-6 sm:p-7 ${b.rotation} hover:rotate-0 transition-transform duration-300`}
              >
                {/* Metric number */}
                <div className="text-4xl sm:text-5xl font-black tracking-tight text-[#1a1a1a] mb-2">
                  {b.metric}
                </div>

                <h3 className="text-base sm:text-lg font-bold text-[#1a1a1a] mb-2">
                  {b.title}
                </h3>

                {/* Handwritten note */}
                <div className="font-handwriting text-sm text-[#FF6B6B] mb-3">
                  {b.handwrittenNote}
                </div>

                <p className="text-[#4a4a4a] text-xs sm:text-sm leading-relaxed">
                  {b.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Black Section — Head-to-Head Comparison */}
      <div className="section-black py-16 sm:py-24">
        <div className="w-full 2xl:px-24 mx-auto px-4 sm:px-8 lg:px-16">

          <div className="text-center mb-10 sm:mb-14">
            <span className="font-handwriting text-xl sm:text-2xl text-[#FFE66D] block mb-2">
              — the comparison —
            </span>
            <h3 className="text-2xl sm:text-4xl font-black text-[#faf8f5] tracking-tight">
              Traditional Classroom vs. Radix Lab
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">

            {/* Traditional Column */}
            <div className="paper-card p-6 sm:p-8 -rotate-[0.3deg] hover:rotate-0">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#e8e0d4]">
                <div className="p-2 rounded-lg bg-red-50 text-[#FF6B6B]">
                  <XCircle size={20} />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-[#1a1a1a]">Traditional Model</h4>
                  <span className="font-handwriting text-sm text-[#8a8a8a]">rote & passive consumption</span>
                </div>
              </div>

              <ul className="space-y-3 text-sm text-[#4a4a4a]">
                {[
                  { bold: "~20% 90-Day Retention:", rest: "High cognitive decay from lack of kinesthetic reinforcement." },
                  { bold: "Theoretical Only:", rest: "Code on blackboard without physical actuator feedback." },
                  { bold: "Zero Failure Tolerance:", rest: "Exams penalize mistakes instead of encouraging debugging." },
                  { bold: "Generic Portfolio:", rest: "No verifiable GitHub repos or functional hardware prototypes." }
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <span className="text-[#FF6B6B] font-bold shrink-0 mt-0.5">✕</span>
                    <span><strong>{item.bold}</strong> {item.rest}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Radix Column */}
            <div className="paper-card p-6 sm:p-8 rotate-[0.3deg] hover:rotate-0 border-[#FFE66D] border-2">
              <div className="absolute top-0 right-0 px-4 py-1.5 bg-[#FFE66D] text-[#1a1a1a] font-bold text-[10px] uppercase tracking-wider rounded-bl-lg">
                Radix Model
              </div>

              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#e8e0d4]">
                <div className="p-2 rounded-lg bg-green-50 text-[#4ECDC4]">
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-[#1a1a1a]">Radix Experiential Model</h4>
                  <span className="font-handwriting text-sm text-[#4ECDC4]">kinesthetic & problem-based ★</span>
                </div>
              </div>

              <ul className="space-y-3 text-sm text-[#4a4a4a]">
                {[
                  { bold: "94% 90-Day Retention:", rest: "Tactile manipulation cements algorithmic principles permanently." },
                  { bold: "Instant Feedback:", rest: "Circuits light up, beep, and move physically upon compilation." },
                  { bold: "Iterative Mindset:", rest: "Hardware bugs teach resilience, analysis, and root-cause discovery." },
                  { bold: "Verifiable Passports:", rest: "Capstone projects ready for WRO, university portfolios, and careers." }
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <span className="text-[#4ECDC4] font-bold shrink-0 mt-0.5">✓</span>
                    <span><strong>{item.bold}</strong> {item.rest}</span>
                  </li>
                ))}
              </ul>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
