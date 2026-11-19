import type { Metadata } from 'next';
import { Download, ExternalLink } from 'lucide-react';
import Footer from '@/app/components/Footer';
import Breadcrumbs from '@/app/components/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Labs',
  description: 'Explore the Radix Robotics lab brochure: the robotics and STEM labs we set up for schools across India.',
  alternates: { canonical: 'https://www.radixrobotics.in/labs' },
};

// The file lives at public/labs/lab bro.pdf; the space must be URL-encoded.
const PDF_URL = '/labs/lab%20bro.pdf';

export default function LabsPage() {
  return (
    <div className="relative min-h-[100dvh] w-full max-w-full bg-[#050505] text-[#f2f3f5] font-sans overflow-x-hidden">
      <Breadcrumbs />

      <main className="relative z-10 max-w-[1536px] mx-auto px-4 sm:px-8 lg:px-16 pt-16 lg:pt-24 pb-24">
        <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="font-mono text-sm font-bold uppercase tracking-widest text-[#ff5400] block mb-4">
              [ Our Labs ]
            </span>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black leading-[0.95] tracking-tighter uppercase">
              Lab <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff5400] to-yellow-500">Brochure.</span>
            </h1>
          </div>

          <div className="flex flex-wrap gap-3">
            <a
              href={PDF_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-white text-[#111] border-2 border-[#111] shadow-[4px_4px_0px_#ff5400] px-5 py-3 text-sm font-black uppercase tracking-wider hover:-translate-y-1 transition-transform"
            >
              <ExternalLink size={16} /> Open
            </a>
            <a
              href={PDF_URL}
              download="Radix-Robotics-Lab-Brochure.pdf"
              className="inline-flex items-center gap-2 bg-[#ff5400] text-white border-2 border-[#111] shadow-[4px_4px_0px_#fff] px-5 py-3 text-sm font-black uppercase tracking-wider hover:-translate-y-1 transition-transform"
            >
              <Download size={16} /> Download
            </a>
          </div>
        </div>

        <div className="border-2 border-[#111] shadow-[6px_6px_0px_#ff5400] sm:shadow-[8px_8px_0px_#ff5400] bg-[#111]">
          <object
            data={`${PDF_URL}#view=FitH`}
            type="application/pdf"
            className="block w-full h-[75vh] min-h-[500px]"
            aria-label="Radix Robotics lab brochure"
          >
            {/* Shown where the browser cannot display PDFs inline (many phones). */}
            <div className="flex h-[300px] flex-col items-center justify-center gap-4 p-8 text-center">
              <p className="text-[#a1a1aa] font-medium">Your browser can&apos;t show the PDF here.</p>
              <a
                href={PDF_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#ff5400] text-white px-5 py-3 text-sm font-black uppercase tracking-wider"
              >
                <ExternalLink size={16} /> Open the brochure
              </a>
            </div>
          </object>
        </div>
      </main>

      <Footer />
    </div>
  );
}
