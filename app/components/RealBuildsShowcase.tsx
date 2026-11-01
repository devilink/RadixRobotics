import Link from 'next/link';
import { ArrowUpRight, Cpu, FileText, Ruler } from 'lucide-react';
import { builds } from '@/app/projects/builds';

// Each card opens /projects/[slug]: the build's blueprint and step-by-step guide.

export default function RealBuildsShowcase() {
  return (
    <section className="relative z-10 py-12 sm:py-16 md:py-24 max-w-[1536px] mx-auto px-4 sm:px-8 lg:px-16">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 md:gap-12">
        {builds.map((build) => (
          <Link
            key={build.id}
            href={`/projects/${build.slug}`}
            className={`
              block focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#ff5400] focus-visible:ring-offset-4
              relative p-6 sm:p-8 md:p-12 transition-all duration-300
              border-2 ${build.borderColor} ${build.bgColor} ${build.textColor}
              hover:-translate-y-2 group ${build.shadowColor} rounded-none
            `}
          >

            {/* Sticker Decorator */}
            <div className={`
              absolute -top-3 -right-2 sm:-top-4 sm:-right-4 md:-top-6 md:-right-6 
              px-3 py-2 text-[9px] md:text-xs font-black uppercase tracking-widest text-[#111] bg-[#f2f3f5]
              transform rotate-6 border-2 border-[#111] shadow-[2px_2px_0px_#111]
            `}>
              {build.complexity}
            </div>

            {/* Header section */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
              <div>
                <div className={`font-mono text-xs font-bold uppercase tracking-widest mb-3 ${build.mutedColor}`}>
                  // {build.category}
                </div>
                <h3 className="text-xl sm:text-2xl md:text-4xl font-black uppercase tracking-tighter leading-[1.05] max-w-sm">
                  {build.title}
                </h3>
              </div>
              <div className="flex flex-col items-start sm:items-end gap-2">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-black uppercase tracking-widest border-2 ${build.borderColor}`}>
                  <Cpu size={12} strokeWidth={2.5} /> {build.studentGrade}
                </span>
                <div className={`font-mono text-[10px] uppercase font-bold tracking-widest ${build.mutedColor}`}>
                  Live Deploy
                </div>
              </div>
            </div>

            <p className={`text-base md:text-lg font-medium leading-relaxed mb-10 max-w-md ${build.mutedColor}`}>
              {build.description}
            </p>

            {/* Telemetry Dashboard Box */}
            <div className={`
              mb-8 p-4 md:p-6 border-2 ${build.borderColor} ${build.bgColor === 'bg-[#111]' ? 'bg-[#1a1a1a]' : 'bg-[#fff] text-[#111]'}
            `}>
              <h4 className={`text-[10px] font-black uppercase tracking-widest mb-4 flex items-center gap-2 ${build.bgColor === 'bg-[#111]' ? 'text-[#ff5400]' : 'text-[#ff5400]'}`}>
                <div className="w-1.5 h-1.5 rounded-full bg-[#ff5400] animate-pulse"></div> Live Telemetry
              </h4>
              <div className="grid grid-cols-3 gap-4">
                {build.telemetryMetrics.map((metric, i) => (
                  <div key={i} className="flex flex-col">
                    <span className="text-[9px] font-bold uppercase tracking-widest opacity-60 mb-1">{metric.label}</span>
                    <span className="font-mono text-base md:text-xl font-black">{metric.val}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-6 pt-6 border-t-2 border-[#111] border-opacity-20">
              
              {/* Tech Stack Pills */}
              <div className="flex flex-wrap gap-2">
                {build.techStack.map((tech) => (
                  <span 
                    key={tech} 
                    className={`
                      px-2.5 py-1 text-[9px] md:text-[10px] font-bold uppercase tracking-widest
                      border-2 ${build.borderColor} border-opacity-40
                    `}
                  >
                    {tech}
                  </span>
                ))}
              </div>

              {/* Opens the blueprint + build guide */}
              <span
                className={`
                  flex items-center gap-2 h-10 px-3 border-2 border-[#111] shadow-[2px_2px_0px_#111] bg-white text-[#111]
                  text-[10px] font-black uppercase tracking-widest
                  group-hover:bg-[#ff5400] group-hover:text-white transition-colors duration-300
                `}
              >
                <Ruler size={14} strokeWidth={2.5} aria-hidden /> Blueprint
                <span className="opacity-40">+</span>
                <FileText size={14} strokeWidth={2.5} aria-hidden /> Guide
                <ArrowUpRight size={16} strokeWidth={2.5} aria-hidden />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
