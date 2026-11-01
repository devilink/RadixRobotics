import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AlertTriangle, ArrowLeft, ArrowRight, CheckCircle2, Clock, Cpu, FileText, Gauge, ListChecks, Ruler } from 'lucide-react';
import Footer from '@/app/components/Footer';
import { builds, getBuild } from '../builds';
import BlueprintDiagram from './BlueprintDiagram';
import ProductDiagram, { ProductKey } from './ProductDiagram';
import CopyButton from './CopyButton';

// overflow-x-clip (not hidden) on the wrapper keeps the sticky step index working.
// Responsive classes below come in variant-only pairs (max-lg:/lg:): plain base
// utilities override responsive ones site-wide (see app/styles/theme.css).

export function generateStaticParams() {
  return builds.map((b) => ({ slug: b.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const build = getBuild(slug);
  if (!build) return {};
  return {
    title: `${build.title}: Blueprint & Build Guide`,
    description: `${build.description} Full system blueprint, wiring map, bill of materials and a step-by-step build guide.`,
    alternates: { canonical: `https://radixrobotics.com/projects/${build.slug}` },
  };
}

/** Renders `inline code` spans inside guide text. */
function Rich({ text }: { text: string }) {
  return (
    <>
      {text.split('`').map((part, i) =>
        i % 2 ? (
          <code key={i} className="rounded-sm bg-[#111]/[0.07] px-1.5 py-0.5 font-mono text-[0.9em] text-[#b83200] [overflow-wrap:anywhere]">
            {part}
          </code>
        ) : (
          part
        ),
      )}
    </>
  );
}

function SectionHeading({ index, title, icon }: { index: string; title: string; icon: ReactNode }) {
  return (
    <div className="mb-8 flex items-end gap-4 border-b-2 border-[#111] pb-4">
      <span className="font-mono text-sm font-bold text-[#ff5400]">{index}</span>
      <h2 className="flex items-center gap-3 font-black uppercase tracking-tighter text-[#111] max-sm:text-3xl sm:text-5xl">
        {icon}
        {title}
      </h2>
    </div>
  );
}

export default async function BuildPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const build = getBuild(slug);
  if (!build) notFound();

  const { blueprint, guide } = build;
  const i = builds.indexOf(build);
  const prev = builds[(i - 1 + builds.length) % builds.length];
  const next = builds[(i + 1) % builds.length];

  return (
    <div className="relative min-h-[100dvh] w-full max-w-full overflow-x-clip bg-[#f2f3f5] font-sans text-[#1a1a1a]">
      {/* --- HEADER --- */}
      <header className="border-b-2 border-[#111] bg-[#111] text-[#f8f7ef] max-lg:pt-[calc(var(--nav-h)+2rem)] lg:pt-36 max-lg:pb-12 lg:pb-20">
        <div className="mx-auto w-full max-w-[1400px] max-sm:px-5 sm:px-8 lg:px-16">
          <Link
            href="/projects"
            className="mb-8 inline-flex min-h-[44px] items-center gap-2 font-mono text-xs font-bold uppercase tracking-widest text-[#a1a1aa] transition-colors hover:text-[#ff5400]"
          >
            <ArrowLeft size={16} aria-hidden /> All builds
          </Link>

          <div className="mb-4 font-mono text-xs font-bold uppercase tracking-widest text-[#ff5400]">{'// '}{build.category}</div>
          <h1 className="max-w-4xl font-black uppercase leading-[0.98] tracking-tighter max-sm:text-[2.25rem] sm:text-6xl lg:text-7xl">
            {build.title}
          </h1>
          <p className="mt-6 max-w-2xl font-medium leading-relaxed text-[#a1a1aa] max-sm:text-base sm:text-lg">{build.description}</p>

          <div className="mt-8 flex flex-wrap gap-2">
            {[
              { icon: <Cpu size={13} aria-hidden />, text: build.studentGrade },
              { icon: <Gauge size={13} aria-hidden />, text: build.complexity },
              { icon: <Clock size={13} aria-hidden />, text: build.duration },
            ].map((chip) => (
              <span key={chip.text} className="inline-flex items-center gap-1.5 border-2 border-white/25 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest">
                {chip.icon} {chip.text}
              </span>
            ))}
            {build.techStack.map((t) => (
              <span key={t} className="inline-flex items-center border-2 border-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-[#a1a1aa]">
                {t}
              </span>
            ))}
          </div>

          <div className="mt-8 grid max-w-xl grid-cols-3 gap-px border-2 border-white/15 bg-white/15">
            {build.telemetryMetrics.map((m) => (
              <div key={m.label} className="bg-[#1a1a1a] p-4">
                <div className="mb-1 text-[9px] font-bold uppercase tracking-widest text-[#a1a1aa]">{m.label}</div>
                <div className="font-mono font-black max-sm:text-lg sm:text-2xl">{m.val}</div>
              </div>
            ))}
          </div>

          <div className="mt-10 flex gap-3 max-sm:flex-col sm:flex-wrap">
            <a href="#blueprint" className="inline-flex min-h-[48px] items-center justify-center gap-2 border-2 border-[#ff5400] bg-[#ff5400] px-6 text-xs font-black uppercase tracking-widest text-white shadow-[4px_4px_0_#fff] transition-transform hover:-translate-y-0.5">
              <Ruler size={16} aria-hidden /> View Blueprint
            </a>
            <a href="#guide" className="inline-flex min-h-[48px] items-center justify-center gap-2 border-2 border-white px-6 text-xs font-black uppercase tracking-widest text-white transition-colors hover:bg-white hover:text-[#111]">
              <FileText size={16} aria-hidden /> Build Guide · {guide.steps.length} steps
            </a>
          </div>
        </div>
      </header>

      {/* --- BLUEPRINT --- */}
      <section id="blueprint" className="scroll-mt-20 mx-auto w-full max-w-[1400px] max-sm:px-5 sm:px-8 lg:px-16 max-sm:py-14 sm:py-20">
        <SectionHeading index="01" title="Blueprint" icon={<Ruler className="max-sm:h-7 max-sm:w-7 sm:h-10 sm:w-10" aria-hidden />} />

        <h3 className="mb-2 text-xl font-black uppercase tracking-tight text-[#111]">Product drawing</h3>
        <p className="mb-5 max-w-2xl text-[15px] leading-relaxed text-[#646a73]">
          What the finished build looks like and where every part sits. The numbers match the key below the drawing.
        </p>
        <figure className="border-2 border-[#111] bg-[#163e6e] shadow-[8px_8px_0_#111]">
          <div className="overflow-x-auto overscroll-x-contain">
            <ProductDiagram build={build} />
          </div>
          <figcaption className="flex flex-wrap items-center justify-between gap-2 border-t-2 border-[#111] bg-white px-4 py-3 font-mono text-[11px] font-bold uppercase tracking-widest text-[#646a73]">
            <span>Product drawing · {blueprint.drawingNo}-P</span>
            <span className="md:hidden">Swipe sideways to see the full drawing →</span>
          </figcaption>
        </figure>
        <div className="mt-6 border-2 border-[#111] bg-white p-5">
          <ProductKey build={build} />
        </div>

        <h3 className="mb-2 mt-14 text-xl font-black uppercase tracking-tight text-[#111]">System diagram</h3>
        <p className="mb-5 max-w-2xl text-[15px] leading-relaxed text-[#646a73]">
          How the parts connect: data and control signals as solid lines, power as dashed lines.
        </p>
        <figure className="border-2 border-[#111] bg-[#163e6e] shadow-[8px_8px_0_#111]">
          <div className="overflow-x-auto overscroll-x-contain">
            <BlueprintDiagram build={build} />
          </div>
          <figcaption className="flex flex-wrap items-center justify-between gap-2 border-t-2 border-[#111] bg-white px-4 py-3 font-mono text-[11px] font-bold uppercase tracking-widest text-[#646a73]">
            <span>System block diagram · {blueprint.drawingNo}</span>
            <span className="md:hidden">Swipe sideways to see the full drawing →</span>
          </figcaption>
        </figure>

        <div className="mt-14 grid gap-12 xl:grid-cols-2">
          <div>
            <h3 className="mb-4 text-xl font-black uppercase tracking-tight text-[#111]">Wiring &amp; pin map</h3>
            <div className="overflow-x-auto border-2 border-[#111] bg-white">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="bg-[#111] text-[10px] uppercase tracking-widest text-white">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-black">From</th>
                    <th scope="col" className="px-4 py-3 font-black">To</th>
                    <th scope="col" className="px-4 py-3 font-black">Signal / notes</th>
                  </tr>
                </thead>
                <tbody>
                  {blueprint.wiring.map((w) => (
                    <tr key={w.from + w.to} className="border-t border-[#e8e0d4] align-top">
                      <td className="px-4 py-3 font-semibold text-[#111]">{w.from}</td>
                      <td className="px-4 py-3 font-mono text-[13px] text-[#b83200]">{w.to}</td>
                      <td className="px-4 py-3 text-[#646a73]">{w.signal}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-xl font-black uppercase tracking-tight text-[#111]">Bill of materials</h3>
            <div className="overflow-x-auto border-2 border-[#111] bg-white">
              <table className="w-full min-w-[480px] text-left text-sm">
                <thead className="bg-[#111] text-[10px] uppercase tracking-widest text-white">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-black">Part</th>
                    <th scope="col" className="px-4 py-3 text-center font-black">Qty</th>
                    <th scope="col" className="px-4 py-3 font-black">Spec</th>
                  </tr>
                </thead>
                <tbody>
                  {blueprint.bom.map((b) => (
                    <tr key={b.part} className="border-t border-[#e8e0d4] align-top">
                      <td className="px-4 py-3 font-semibold text-[#111]">{b.part}</td>
                      <td className="px-4 py-3 text-center font-mono font-bold text-[#ff5400]">{b.qty}</td>
                      <td className="px-4 py-3 text-[#646a73]">{b.spec}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* --- BUILD GUIDE --- */}
      <section id="guide" className="scroll-mt-20 border-t-2 border-[#111] bg-white">
        <div className="mx-auto w-full max-w-[1400px] max-sm:px-5 sm:px-8 lg:px-16 max-sm:py-14 sm:py-20">
          <SectionHeading index="02" title="Build Guide" icon={<FileText className="max-sm:h-7 max-sm:w-7 sm:h-10 sm:w-10" aria-hidden />} />

          <div className="lg:grid lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-14">
            {/* Step index (desktop) */}
            <nav aria-label="Guide steps" className="max-lg:hidden">
              <div className="sticky top-28">
                <div className="mb-3 font-mono text-[10px] font-bold uppercase tracking-widest text-[#8a8a8a]">On this page</div>
                <ol className="space-y-1 border-l-2 border-[#e8e0d4]">
                  {guide.steps.map((s, n) => (
                    <li key={s.title}>
                      <a href={`#step-${n + 1}`} className="-ml-[2px] block border-l-2 border-transparent py-1.5 pl-4 text-sm font-semibold text-[#646a73] transition-colors hover:border-[#ff5400] hover:text-[#111]">
                        <span className="mr-2 font-mono text-[11px] text-[#b5aa99]">{String(n + 1).padStart(2, '0')}</span>
                        {s.title}
                      </a>
                    </li>
                  ))}
                </ol>
              </div>
            </nav>

            <div className="min-w-0">
              {/* Before you start */}
              <div className="mb-14 grid gap-5 md:grid-cols-2">
                <div className="border-2 border-[#111] bg-[#f2f3f5] p-6">
                  <h3 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-widest text-[#111]">
                    <ListChecks size={18} aria-hidden /> Before you start
                  </h3>
                  <ul className="space-y-2.5 text-[15px] leading-relaxed text-[#3b3f46]">
                    {guide.prerequisites.map((p) => (
                      <li key={p} className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 bg-[#ff5400]" aria-hidden />{p}</li>
                    ))}
                  </ul>
                </div>
                <div className="border-2 border-[#111] bg-[#fff4ec] p-6">
                  <h3 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-widest text-[#b83200]">
                    <AlertTriangle size={18} aria-hidden /> Safety
                  </h3>
                  <ul className="space-y-2.5 text-[15px] leading-relaxed text-[#3b3f46]">
                    {guide.safety.map((s) => (
                      <li key={s} className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 bg-[#b83200]" aria-hidden />{s}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Steps */}
              <ol className="space-y-14">
                {guide.steps.map((step, n) => (
                  <li key={step.title} id={`step-${n + 1}`} className="scroll-mt-24">
                    <div className="mb-4 flex items-start gap-4">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center border-2 border-[#111] bg-[#ff5400] font-mono text-sm font-black text-white shadow-[3px_3px_0_#111]">
                        {String(n + 1).padStart(2, '0')}
                      </span>
                      <h3 className="pt-1.5 font-black uppercase leading-tight tracking-tight text-[#111] max-sm:text-xl sm:text-2xl">{step.title}</h3>
                    </div>

                    <div className="space-y-4 text-[16px] leading-relaxed text-[#3b3f46] lg:pl-[60px]">
                      {step.body.map((para, k) => (
                        <p key={k}><Rich text={para} /></p>
                      ))}

                      {step.code && (
                        <div className="overflow-hidden border-2 border-[#111] bg-[#0f1115] shadow-[4px_4px_0_#ff5400]">
                          <div className="flex items-center justify-between border-b border-white/10 pl-4">
                            <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-[#ff8a4c]">
                              {step.code.file ?? step.code.lang}
                            </span>
                            <CopyButton text={step.code.code} />
                          </div>
                          <pre className="overflow-x-auto p-4 text-[13px] leading-relaxed text-[#e6e6e6]">
                            <code className="font-mono">{step.code.code}</code>
                          </pre>
                        </div>
                      )}

                      {step.check && (
                        <div className="flex gap-3 border-l-4 border-[#1f9d55] bg-[#effaf3] p-4 text-[15px]">
                          <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-[#1f9d55]" aria-hidden />
                          <p><span className="font-black uppercase tracking-wide text-[#1f7a45]">Checkpoint: </span><Rich text={step.check} /></p>
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* --- MORE BUILDS --- */}
      <nav aria-label="More builds" className="grid border-t-2 border-[#111] bg-[#f2f3f5] md:grid-cols-2">
        {[
          { b: prev, dir: 'Previous build', icon: <ArrowLeft size={18} aria-hidden /> },
          { b: next, dir: 'Next build', icon: <ArrowRight size={18} aria-hidden /> },
        ].map(({ b, dir, icon }, k) => (
          <Link
            key={dir}
            href={`/projects/${b.slug}`}
            className={`group flex flex-col gap-2 p-8 transition-colors hover:bg-[#111] hover:text-white max-sm:px-5 ${k === 1 ? 'md:items-end md:border-l-2 md:border-[#111] md:text-right max-md:border-t-2 max-md:border-[#111]' : ''}`}
          >
            <span className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-widest text-[#ff5400]">
              {k === 0 && icon}{dir}{k === 1 && icon}
            </span>
            <span className="font-black uppercase tracking-tighter max-sm:text-2xl sm:text-3xl">{b.title}</span>
          </Link>
        ))}
      </nav>

      <Footer />
    </div>
  );
}
