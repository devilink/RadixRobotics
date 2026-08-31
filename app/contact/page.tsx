import Link from "next/link";
import { Mail, MapPin, Phone, ArrowUpRight, ArrowRight } from "lucide-react";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import Breadcrumbs from '@/app/components/Breadcrumbs';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with Radix Robotics to build a state-of-the-art composite skill lab at your campus.",
  alternates: { canonical: "https://radixrobotics.com/contact" },
};

export default function ContactPage() {
  return (
    <div className="relative min-h-screen bg-grid text-[#1a1a1a] font-sans overflow-x-hidden">

      <Navbar />
      <Breadcrumbs />

      {/* --- HERO HEADER --- */}
      <section className="relative z-10 pt-32 pb-16 sm:pt-48 sm:pb-24 border-b-2 border-[#111] bg-white">
        <div className="max-w-[1536px] mx-auto px-4 sm:px-8 lg:px-16">
          <span className="font-mono text-sm font-bold uppercase tracking-widest text-[#ff5400] block mb-6">
            [ Get In Touch ]
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black uppercase tracking-tighter text-[#111] leading-[0.95] max-w-5xl">
            Let&apos;s Build<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff5400] to-yellow-500">Together.</span>
          </h1>
          <p className="mt-8 text-[#646a73] text-lg sm:text-xl font-medium max-w-2xl leading-relaxed">
            Whether you&apos;re a school looking to integrate our robotics &amp; AI curriculum or a student with questions, our team is here to help you navigate the future of robotics.
          </p>
        </div>
      </section>

      {/* --- CONTACT GRID --- */}
      <section className="relative z-10 max-w-[1536px] mx-auto px-4 sm:px-8 lg:px-16 py-16 sm:py-24">
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">

          {/* LEFT COLUMN — Contact Details */}
          <div className="space-y-8">

            {/* Contact Info Card */}
            <div className="bg-[#111] text-white border-2 border-[#111] shadow-[8px_8px_0px_#ff5400] p-8 sm:p-10 relative">
              {/* Decorative corner */}
              <div className="absolute -top-3 -right-3 bg-[#ff5400] text-white font-black uppercase text-[9px] tracking-widest px-3 py-1.5 border-2 border-[#111] rotate-6">
                HQ
              </div>

              <h3 className="text-2xl font-black uppercase tracking-tighter text-white mb-8">
                Direct Contact
              </h3>

              <div className="space-y-6">
                <a href="mailto:contact@radixrobotics.com" className="flex items-center gap-4 text-[#a1a1aa] hover:text-[#ff5400] transition-colors group">
                  <div className="w-12 h-12 border-2 border-[#333] flex items-center justify-center group-hover:border-[#ff5400] group-hover:bg-[#ff5400] group-hover:text-white transition-all">
                    <Mail size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#7b828e] mb-1">Email</p>
                    <p className="text-white font-bold text-sm sm:text-base">contact@radixrobotics.com</p>
                  </div>
                </a>

                <a href="https://wa.me/916001979712" target="_blank" rel="noreferrer" className="flex items-center gap-4 text-[#a1a1aa] hover:text-[#ff5400] transition-colors group">
                  <div className="w-12 h-12 border-2 border-[#333] flex items-center justify-center group-hover:border-[#ff5400] group-hover:bg-[#ff5400] group-hover:text-white transition-all">
                    <Phone size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#7b828e] mb-1">WhatsApp</p>
                    <p className="text-white font-bold text-sm sm:text-base">+91 60019 79712</p>
                  </div>
                </a>

                <div className="flex items-start gap-4 text-[#a1a1aa]">
                  <div className="w-12 h-12 border-2 border-[#333] flex items-center justify-center shrink-0">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#7b828e] mb-1">Location</p>
                    <p className="text-white font-bold text-sm sm:text-base leading-relaxed">
                      Jalukbari,<br />
                      Guwahati, Assam 781013
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* WhatsApp CTA Card */}
            <div className="bg-[#ff5400] border-2 border-[#111] shadow-[8px_8px_0px_#111] p-8 sm:p-10 relative overflow-hidden">
              {/* Large background text */}
              <div className="absolute -bottom-4 -right-4 text-[120px] font-black text-[#00000010] leading-none pointer-events-none select-none">
                WA
              </div>

              <h3 className="text-xl font-black uppercase tracking-tighter text-white mb-2 relative z-10">
                Fastest Response via WhatsApp
              </h3>
              <p className="text-white/80 text-sm font-medium mb-6 relative z-10">
                Our resident engineers and program managers are active Monday through Saturday.
              </p>
              <a
                href="https://wa.me/916001979712?text=Hello%20Radix%20Robotics"
                target="_blank"
                rel="noreferrer"
                className="relative z-10 inline-flex items-center gap-3 bg-white text-[#111] px-8 py-4 font-black text-xs uppercase tracking-widest border-2 border-[#111] shadow-[4px_4px_0px_#111] hover:-translate-y-1 hover:shadow-[6px_6px_0px_#111] transition-all"
              >
                Chat on WhatsApp <ArrowUpRight size={16} strokeWidth={3} />
              </a>
            </div>
          </div>

          {/* RIGHT COLUMN — Contact Form */}
          <div className="bg-white border-2 border-[#111] shadow-[8px_8px_0px_#111] p-8 sm:p-10 relative">
            {/* Decorative corner */}
            <div className="absolute -top-3 -left-3 w-6 h-6 bg-[#ff5400] border-2 border-[#111]"></div>

            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-black uppercase tracking-tighter text-[#111]">Send a Message</h3>
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#ff5400]">
                // Reply &lt; 24h
              </span>
            </div>

            <form className="space-y-6">
              <div>
                <label className="text-[10px] font-mono font-bold text-[#7b828e] uppercase tracking-widest mb-2 block">Name *</label>
                <input
                  type="text"
                  className="w-full bg-[#f2f3f5] border-2 border-[#111] px-5 py-4 outline-none focus:border-[#ff5400] focus:shadow-[4px_4px_0px_#ff5400] transition-all text-[#111] placeholder-[#a1a1aa] text-sm font-bold"
                  placeholder="Dr. Sharma / Principal"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono font-bold text-[#7b828e] uppercase tracking-widest mb-2 block">Email *</label>
                <input
                  type="email"
                  className="w-full bg-[#f2f3f5] border-2 border-[#111] px-5 py-4 outline-none focus:border-[#ff5400] focus:shadow-[4px_4px_0px_#ff5400] transition-all text-[#111] placeholder-[#a1a1aa] text-sm font-bold"
                  placeholder="principal@school.edu"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono font-bold text-[#7b828e] uppercase tracking-widest mb-2 block">Institution</label>
                <input
                  type="text"
                  className="w-full bg-[#f2f3f5] border-2 border-[#111] px-5 py-4 outline-none focus:border-[#ff5400] focus:shadow-[4px_4px_0px_#ff5400] transition-all text-[#111] placeholder-[#a1a1aa] text-sm font-bold"
                  placeholder="Delhi Public School / IIT Guwahati"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono font-bold text-[#7b828e] uppercase tracking-widest mb-2 block">Message *</label>
                <textarea
                  rows={5}
                  className="w-full bg-[#f2f3f5] border-2 border-[#111] px-5 py-4 outline-none focus:border-[#ff5400] focus:shadow-[4px_4px_0px_#ff5400] transition-all text-[#111] placeholder-[#a1a1aa] text-sm font-bold resize-none"
                  placeholder="We are interested in setting up a Composite Robotics Lab at our school campus..."
                />
              </div>

              <button
                type="submit"
                disabled
                className="w-full bg-[#111] text-white font-black py-5 text-xs uppercase tracking-widest border-2 border-[#111] shadow-[6px_6px_0px_#ff5400] hover:-translate-y-1 hover:shadow-[8px_8px_0px_#ff5400] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-[6px_6px_0px_#ff5400]"
              >
                Send Message <ArrowRight size={16} strokeWidth={3} />
              </button>

              <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#a1a1aa] text-center">
                Form submission coming soon — use WhatsApp for now
              </p>
            </form>
          </div>

        </div>
      </section>

      <Footer />
    </div>
  );
}
