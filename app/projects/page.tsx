import RealBuildsShowcase from '../components/RealBuildsShowcase';
import { ArrowUpRight } from 'lucide-react';

export default function ProjectsPage() {
  return (
    <div className="relative min-h-[100dvh] w-full max-w-full bg-paper text-[#1a1a1a] font-sans overflow-x-hidden">
      
      {/* --- NOTEBOOK RULED LINE BACKGROUND --- */}
      <div className="fixed inset-0 z-[-1] h-full w-full bg-notebook-subtle pointer-events-none"></div>

      {/* --- PAGE HEADER --- */}
      <section className="relative z-10 pt-32 pb-16 sm:pt-40 sm:pb-24 border-b border-[#e8e0d4] bg-white">
        <div className="w-full 2xl:px-24 mx-auto px-4 sm:px-8 lg:px-16">
          <span className="font-handwriting text-xl sm:text-2xl text-[#FF6B6B] block mb-2">
            — past work & deployments —
          </span>
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-[#1a1a1a] leading-[1.05] max-w-4xl">
            Real Builds &<br />
            <span className="doodle-underline">Case Studies</span>
          </h1>
          <p className="mt-6 text-[#6a6a6a] text-base sm:text-lg max-w-2xl leading-relaxed">
            Take a look at the state-of-the-art robotics labs, maker spaces, and AI centers we've built across campuses. Real setups, real students, real impact.
          </p>
        </div>
      </section>

      {/* --- REAL BUILDS SHOWCASE --- */}
      <RealBuildsShowcase />

      {/* --- FOOTER --- */}
      <footer className="relative z-10 bg-[#1a1a1a] text-white pt-20 pb-12 overflow-hidden torn-edge-top mt-auto">
        <div className="w-full 2xl:px-24 mx-auto px-4 sm:px-8 lg:px-16 text-center relative z-10">
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight mb-8">
            Ready to upgrade your campus?
          </h2>
          <a href="https://wa.me/916001979712" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 px-8 py-5 rounded-xl bg-[#FFE66D] text-[#1a1a1a] font-bold text-sm uppercase tracking-widest hover:bg-white transition-all shadow-xl hover:-translate-y-1">
            Contact Engineering Team <ArrowUpRight size={18} />
          </a>
        </div>
      </footer>
    </div>
  );
}
