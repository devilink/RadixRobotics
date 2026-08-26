"use client";

import { CheckCircle2, ArrowUpRight } from 'lucide-react';

const steps = [
  {
    number: "01",
    timeline: "Weeks 1 – 2",
    title: "Design & Turnkey Installation",
    description: "We assess your campus space, design ergonomic 3D CAD floorplans, and install industrial workstations, 3D printers, safety gear, and the full hardware stack — ready for day one.",
    deliverables: [
      "Custom 2D/3D architectural CAD lab layout",
      "ESD anti-static workbenches & power distribution",
      "Full hardware kit staging & inventory tagging"
    ],
    stickerColor: "sticker-mint",
    rotation: "-rotate-[0.5deg]",
    handwrittenNote: "we handle everything ✓"
  },
  {
    number: "02",
    timeline: "Weeks 3 – 4",
    title: "Hardware Setup & Faculty CPD Training",
    description: "We deploy certified Master Trainers directly to your campus for 40+ hours of accredited Continuous Professional Development, empowering teachers to lead hardware sessions with confidence.",
    deliverables: [
      "40+ hours hands-on faculty masterclass",
      "Complete 300+ lesson plan repository with rubrics",
      "Teacher certification under NEP 2020 standards"
    ],
    stickerColor: "sticker-yellow",
    rotation: "rotate-[0.5deg]",
    handwrittenNote: "teachers become makers too! →"
  },
  {
    number: "03",
    timeline: "Month 2 Onwards",
    title: "Dedicated Resident Engineer Mentorship",
    description: "Radix deploys a dedicated on-campus robotics specialist who conducts weekly live lab sessions, supervises prototyping, and ensures continuous hardware calibration.",
    deliverables: [
      "On-campus resident mentor for scheduled curriculum",
      "Real-time student project debugging & code reviews",
      "Preventative maintenance & kit replenishment"
    ],
    stickerColor: "sticker-blue",
    rotation: "-rotate-1",
    handwrittenNote: "your personal robotics expert ★"
  },
  {
    number: "04",
    timeline: "Annual / Ongoing",
    title: "RoboWars Arenas & Competition Coaching",
    description: "We prepare and coach student teams to represent your school at national championships, World Robot Olympiad (WRO), and inter-school RoboWars combat leagues.",
    deliverables: [
      "Custom arena builds: line-track, combat & obstacle",
      "Mentorship for national/global competitions",
      "Verifiable student skill passports & credentials"
    ],
    stickerColor: "sticker-coral",
    rotation: "rotate-[0.8deg]",
    handwrittenNote: "this is where legends are made! ✦"
  }
];

export default function AsymmetricLifecycle() {
  return (
    <section id="how" className="relative z-10 w-full py-16 sm:py-24 bg-notebook-subtle border-b border-[#e8e0d4] overflow-hidden">

      <div className="w-full 2xl:px-24 mx-auto px-4 sm:px-8 lg:px-16">

        {/* Section Header */}
        <div className="max-w-3xl mb-12 sm:mb-16">
          <span className="font-handwriting text-xl sm:text-2xl text-[#FF6B6B] block mb-2">
            — how we transform your campus —
          </span>
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-[#1a1a1a] leading-[1.05]">
            From Empty Room to<br />
            <span className="doodle-underline">World-Class Lab</span>
          </h2>
          <p className="mt-4 text-[#6a6a6a] text-sm sm:text-base max-w-lg leading-relaxed">
            A proven 4-phase implementation methodology that transforms any available campus space into a fully operational engineering environment.
          </p>
        </div>

        {/* Steps — Layered notebook cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {steps.map((step, index) => (
            <div
              key={step.number}
              className={`paper-card p-6 sm:p-8 ${step.rotation} hover:rotate-0 transition-all duration-300 relative`}
            >
              {/* Large Step Number */}
              <span className="absolute top-4 right-5 text-7xl sm:text-8xl font-black text-[#1a1a1a] opacity-[0.04] leading-none pointer-events-none select-none">
                {step.number}
              </span>

              {/* Top badges */}
              <div className="flex items-center gap-2 mb-4">
                <span className={`sticker ${step.stickerColor}`}>
                  Phase {step.number}
                </span>
                <span className="sticker sticker-white text-[10px]">
                  {step.timeline}
                </span>
              </div>

              {/* Title */}
              <h3 className="text-xl sm:text-2xl font-black text-[#1a1a1a] tracking-tight leading-snug mb-2">
                {step.title}
              </h3>

              {/* Handwritten note */}
              <div className="font-handwriting text-sm sm:text-base text-[#FF6B6B] mb-3">
                {step.handwrittenNote}
              </div>

              <p className="text-[#4a4a4a] text-sm leading-relaxed mb-5">
                {step.description}
              </p>

              {/* Deliverables checklist */}
              <ul className="space-y-2">
                {step.deliverables.map((d, dIdx) => (
                  <li key={dIdx} className="flex items-start gap-2 text-sm text-[#4a4a4a]">
                    <CheckCircle2 size={15} className="shrink-0 mt-0.5 text-[#4ECDC4]" />
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
