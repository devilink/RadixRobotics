import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-notebook-subtle text-[#1a1a1a]">
      <div className="pt-32 pb-24 px-6 md:px-12">
        <div className="max-w-4xl mx-auto">
          <span className="font-handwriting text-2xl text-[#FF6B6B] block mb-2">
            — say hello —
          </span>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-4 text-[#1a1a1a]">
            Get in touch<span className="text-[#FFE66D]">.</span>
          </h1>
          <p className="text-base md:text-lg text-[#6a6a6a] max-w-2xl leading-relaxed mb-12">
            Whether you&apos;re a school looking to integrate our robotics & AI curriculum or a student with questions, our team is here to help you navigate the future of robotics.
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Contact Details Card */}
            <div className="space-y-6">
              <div className="p-8 paper-card -rotate-[0.5deg] hover:rotate-0 transition-transform">
                <div className="sticker sticker-yellow mb-5 text-[10px]">Direct Telemetry</div>
                <h3 className="text-xl font-black mb-6 flex items-center gap-3 text-[#1a1a1a]">
                  <Mail className="w-5 h-5 text-[#1a1a1a]" />
                  Contact Info
                </h3>
                <div className="space-y-4">
                  <a href="mailto:radixrobotics@gmail.com" className="flex items-center gap-3 text-[#4a4a4a] hover:text-[#1a1a1a] font-medium transition-colors">
                    radixrobotics@gmail.com
                  </a>
                  <a href="https://wa.me/916001979712" target="_blank" rel="noreferrer" className="flex items-center gap-3 text-[#4a4a4a] hover:text-[#1a1a1a] font-medium transition-colors">
                    <Phone className="w-4 h-4" />
                    +91 60019 79712
                  </a>
                  <div className="flex gap-3 text-[#4a4a4a] pt-2">
                    <MapPin className="w-4 h-4 shrink-0 mt-1" />
                    <p className="leading-relaxed">
                      Jalukbari,<br />
                      Guwahati, Assam 781013
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 paper-card rotate-[0.5deg] hover:rotate-0 bg-[#FFE66D] border-[#e6cf52]">
                <div className="font-handwriting text-lg text-[#1a1a1a] mb-1">
                  Fastest response via WhatsApp ✦
                </div>
                <p className="text-xs text-[#4a4a4a] mb-4">
                  Our resident engineers and program managers are active Monday through Saturday.
                </p>
                <a 
                  href="https://wa.me/916001979712?text=Hello%20Radix%20Robotics" 
                  target="_blank" 
                  rel="noreferrer"
                  className="sticker sticker-dark inline-flex text-xs px-4 py-2"
                >
                  Chat on WhatsApp →
                </a>
              </div>
            </div>

            {/* Message Form */}
            <form className="p-8 paper-card space-y-4 rotate-[0.3deg] hover:rotate-0">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-black text-[#1a1a1a]">Send a Message</h3>
                <span className="font-handwriting text-sm text-[#FF6B6B]">we reply within 24h</span>
              </div>
              <div>
                <label className="text-xs font-bold text-[#6a6a6a] uppercase tracking-wider mb-1.5 block">Name</label>
                <input type="text" className="w-full bg-[#faf8f5] border border-[#e8e0d4] rounded-lg px-4 py-3 outline-none focus:border-[#1a1a1a] transition-all text-[#1a1a1a] placeholder-[#8a8a8a] text-sm" placeholder="Dr. Sharma / Principal" />
              </div>
              <div>
                <label className="text-xs font-bold text-[#6a6a6a] uppercase tracking-wider mb-1.5 block">Email</label>
                <input type="email" className="w-full bg-[#faf8f5] border border-[#e8e0d4] rounded-lg px-4 py-3 outline-none focus:border-[#1a1a1a] transition-all text-[#1a1a1a] placeholder-[#8a8a8a] text-sm" placeholder="principal@school.edu" />
              </div>
              <div>
                <label className="text-xs font-bold text-[#6a6a6a] uppercase tracking-wider mb-1.5 block">Message</label>
                <textarea rows={4} className="w-full bg-[#faf8f5] border border-[#e8e0d4] rounded-lg px-4 py-3 outline-none focus:border-[#1a1a1a] transition-all text-[#1a1a1a] placeholder-[#8a8a8a] text-sm resize-none" placeholder="We are interested in setting up a Composite Robotics Lab at our school campus..." />
              </div>
              <button type="submit" disabled className="w-full bg-[#1a1a1a] text-white font-bold py-3.5 rounded-lg hover:bg-[#333] transition-all text-xs uppercase tracking-wider shadow-md disabled:opacity-50 disabled:cursor-not-allowed">
                Send Message
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
