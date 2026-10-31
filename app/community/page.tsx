import type { Metadata } from "next";
import { Cpu, Lightbulb, Rocket, Users, Wrench, Trophy } from "lucide-react";
import Footer from "@/app/components/Footer";
import Breadcrumbs from "@/app/components/Breadcrumbs";
import JoinCommunity from "./JoinCommunity";

export const metadata: Metadata = {
  title: "Community",
  description:
    "Join the Radix Community — a network of students, makers, engineers and educators building real robotics, electronics and AI projects together.",
  alternates: { canonical: "https://radixrobotics.com/community" },
};

const PILLARS = [
  { icon: Wrench, title: "Build Real Things", body: "Work on hands-on robotics, IoT and AI builds — from first circuits to market-ready products." },
  { icon: Users, title: "Learn Together", body: "Get feedback from mentors and peers, pair up on projects, and share what you know with others." },
  { icon: Trophy, title: "Showcase Your Work", body: "Take your work to the next level of innovation and commercialization." },
  { icon: Rocket, title: "Open Doors", body: "Explore new opportunities, people, products, trends, knowledge and more." },
];

const WHO = [
  { icon: Cpu, label: "Students & young makers" },
  { icon: Lightbulb, label: "Engineers & hobbyists" },
  { icon: Users, label: "Teachers & mentors" },
];

export default function CommunityPage() {
  return (
    <div className="relative min-h-[100dvh] w-full max-w-full bg-grid text-[#1a1a1a] font-sans overflow-x-hidden">
      <Breadcrumbs />

      {/* --- HERO --- */}
      <section className="relative z-10 pt-32 pb-16 sm:pt-48 sm:pb-24 border-b-2 border-[#111] bg-white">
        <div className="max-w-[1536px] mx-auto px-4 sm:px-8 lg:px-16">
          <span className="font-mono text-sm font-bold uppercase tracking-widest text-[#ff5400] block mb-6">
            [ The Radix Community ]
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black uppercase tracking-tighter text-[#111] leading-[0.95] max-w-5xl">
            Build With<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff5400] to-yellow-500">The Makers.</span>
          </h1>
          <p className="mt-8 text-[#646a73] text-lg sm:text-xl font-medium max-w-2xl leading-relaxed">
            The Radix Community brings together curious minds who love to build — students, engineers, hobbyists and
            educators. We share projects, learn from each other and turn ideas into working products.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <JoinCommunity />
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#7b828e]">Free to join · Takes 2 minutes</span>
          </div>
        </div>
      </section>

      {/* --- ABOUT / PILLARS --- */}
      <section className="relative z-10 max-w-[1536px] mx-auto px-4 sm:px-8 lg:px-16 py-16 sm:py-24">
        <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
          <div className="bg-[#111] text-white border-2 border-[#111] shadow-[8px_8px_0px_#ff5400] p-8 sm:p-10 relative lg:row-span-2">
            <div className="absolute -top-3 -right-3 bg-[#ff5400] text-white font-black uppercase text-[9px] tracking-widest px-3 py-1.5 border-2 border-[#111] rotate-6">
              About
            </div>
            <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tighter mb-6">What is the Radix Community?</h2>
            <p className="text-[#a1a1aa] leading-relaxed font-medium">
              Radix Robotics Private Limited is a premier startup working on robotics, automation and AI across India. The Radix community is 
              open for everyone through which we want to build the most exclusive group of Robotics Enthusiasts and doers.
            </p>
            <p className="mt-4 text-[#a1a1aa] leading-relaxed font-medium">
              Tell us a little about yourself, share your resume and a few photos of your work, and our team will get
              back to you.
            </p>
            <div className="mt-8 pt-8 border-t border-[#333] space-y-4">
              <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#7b828e]">Who it&apos;s for</p>
              {WHO.map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="w-10 h-10 border-2 border-[#333] flex items-center justify-center text-[#ff5400]">
                    <Icon size={18} />
                  </div>
                  <span className="font-bold text-sm">{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2 grid sm:grid-cols-2 gap-6">
            {PILLARS.map(({ icon: Icon, title, body }) => (
              <div key={title} className="bg-white border-2 border-[#111] shadow-[6px_6px_0px_#111] p-6 sm:p-8 transition-transform hover:-translate-y-1">
                <div className="w-12 h-12 bg-[#ff5400] text-white border-2 border-[#111] flex items-center justify-center mb-6">
                  <Icon size={22} />
                </div>
                <h3 className="text-xl font-black uppercase tracking-tighter text-[#111] mb-3">{title}</h3>
                <p className="text-[#646a73] font-medium leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- CTA --- */}
      <section className="relative z-10 border-t-2 border-[#111] bg-[#111] text-white">
        <div className="max-w-[1536px] mx-auto px-4 sm:px-8 lg:px-16 py-16 sm:py-20 flex flex-col md:flex-row md:items-center md:justify-between gap-8">
          <div>
            <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tighter">Ready to build with us?</h2>
            <p className="mt-3 text-[#a1a1aa] font-medium max-w-xl">Send your details and a few pictures of your work. We review every application.</p>
          </div>
          <JoinCommunity variant="light" />
        </div>
      </section>

      <Footer />
    </div>
  );
}
