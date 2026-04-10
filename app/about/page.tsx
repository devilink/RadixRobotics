import Link from "next/link";
import { ArrowLeft, Target, Users, Zap } from "lucide-react";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white selection:bg-emerald-500/30">
      <nav className="fixed w-full z-50 border-b border-white/5 bg-zinc-950/80 backdrop-blur-xl px-6 md:px-12 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-emerald-500 font-black text-xl tracking-tighter hover:opacity-80 transition-opacity">RADIX</Link>
            <div className="h-5 w-px bg-zinc-800" />
            <Link href="/" className="text-sm font-semibold text-zinc-400 hover:text-white transition-colors">Home</Link>
          </div>
          <Link href="/" className="flex items-center gap-2 text-sm font-bold text-zinc-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
        </div>
      </nav>

      <div className="pt-32 pb-24 px-6 md:px-12">
        <div className="max-w-4xl mx-auto">
          
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-8 bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
            Democratizing Robotics Education.
          </h1>
          
          <p className="text-xl md:text-2xl text-zinc-400 font-light leading-relaxed mb-16">
            We built Radix Robotics because we believe that the next generation of engineers shouldn&apos;t wait until college to build real hardware. Our curriculum bridges the gap between toy robots and industry-grade engineering.
          </p>

          <div className="grid md:grid-cols-3 gap-6 mb-20">
            <div className="p-8 rounded-2xl bg-zinc-900 border border-zinc-800">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-6">
                <Target className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold mb-3">Our Mission</h3>
              <p className="text-zinc-400 leading-relaxed text-sm">
                To provide schools with plug-and-play, NEP 2020 aligned robotics curriculums that actually teach core engineering, not just block-coding.
              </p>
            </div>
            <div className="p-8 rounded-2xl bg-zinc-900 border border-zinc-800">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-6">
                <Zap className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold mb-3">The Curriculum</h3>
              <p className="text-zinc-400 leading-relaxed text-sm">
                A structured, highly engaging 250+ session pathway moving students from basic mechanical systems to autonomous AI-driven machines.
              </p>
            </div>
            <div className="p-8 rounded-2xl bg-zinc-900 border border-zinc-800">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-6">
                <Users className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-xl font-bold mb-3">For Everyone</h3>
              <p className="text-zinc-400 leading-relaxed text-sm">
                A multi-tenant platform tailored for school administrators, teachers tracking progress, and students looking for immersive hands-on learning.
              </p>
            </div>
          </div>

          <div className="p-8 md:p-12 rounded-3xl bg-emerald-950/20 border border-emerald-900/30 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />
             <div className="relative z-10 max-w-2xl">
               <h2 className="text-3xl font-black tracking-tight mb-4">Partner with Radix</h2>
               <p className="text-emerald-100/70 mb-8 max-w-xl leading-relaxed">
                 Bring Radix Robotics to your institution. Get full access to our Super Admin dashboards, progress tracking tools, and comprehensive curriculum maps.
               </p>
               <Link href="/contact" className="inline-flex py-3 px-8 rounded-full bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold transition-all shadow-lg shadow-emerald-500/25">
                 Get in Touch
               </Link>
             </div>
          </div>

        </div>
      </div>
    </main>
  );
}
