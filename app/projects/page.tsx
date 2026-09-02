import RealBuildsShowcase from '../components/RealBuildsShowcase';
import { ArrowUpRight } from 'lucide-react';
import Footer from '@/app/components/Footer';
import Breadcrumbs from '@/app/components/Breadcrumbs';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Real Builds & Case Studies",
  description: "View our past deployments, state-of-the-art robotics labs, maker spaces, and AI centers built across campuses.",
  alternates: { canonical: "https://radixrobotics.com/projects" },
};

export default function ProjectsPage() {
  return (
    <div className="relative min-h-[100dvh] w-full max-w-full bg-[#f2f3f5] text-[#1a1a1a] font-sans overflow-x-hidden">
      
      <Breadcrumbs />

      {/* --- PAGE HEADER --- */}
      <section className="relative z-10 pt-32 pb-16 sm:pt-48 sm:pb-24 border-b-2 border-[#111] bg-white">
        <div className="w-full 2xl:px-24 mx-auto px-4 sm:px-8 lg:px-16 flex flex-col items-start">
          <span className="font-mono text-sm font-bold uppercase tracking-widest text-[#ff5400] block mb-6">
            [ Past Work & Deployments ]
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black uppercase tracking-tighter text-[#111] leading-[0.95] max-w-5xl">
            Real Builds &<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff5400] to-yellow-500">Case Studies</span>
          </h1>
          <p className="mt-8 text-[#646a73] text-lg sm:text-xl font-medium max-w-2xl leading-relaxed">
            Take a look at the state-of-the-art robotics labs, maker spaces, and AI centers we've built across campuses. Real setups, real students, real impact.
          </p>
        </div>
      </section>

      {/* --- REAL BUILDS SHOWCASE --- */}
      <RealBuildsShowcase />

      {/* --- CTA BANNER --- */}
      <section className="relative z-10 w-full border-t-2 border-[#111] bg-[#111] text-white pt-24 pb-24 overflow-hidden">
        <div className="w-full 2xl:px-24 mx-auto px-4 sm:px-8 lg:px-16 flex flex-col items-center text-center relative z-10">
          <h2 className="text-4xl sm:text-6xl font-black uppercase tracking-tighter mb-8 leading-[1.05]">
            Ready to upgrade your campus?
          </h2>
          <p className="text-[#a1a1aa] font-medium text-lg max-w-2xl mb-12">
            Get in touch with our engineering team to design a custom turnkey robotics lab for your institution.
          </p>
          <a href="/contact" className="inline-flex items-center gap-3 px-10 py-5 bg-[#ff5400] text-white font-black text-sm uppercase tracking-widest border-2 border-transparent hover:border-white transition-all shadow-[6px_6px_0px_white] hover:-translate-y-1">
            Contact Engineering Team <ArrowUpRight size={20} strokeWidth={2.5} />
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
}
