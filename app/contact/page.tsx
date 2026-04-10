import Link from "next/link";
import { ArrowLeft, Mail, MapPin, Phone } from "lucide-react";

export default function ContactPage() {
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
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-6 bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">Get in touch.</h1>
          <p className="text-xl text-zinc-400 max-w-2xl leading-relaxed mb-16 font-light">
            Whether you&apos;re a school looking to integrate our curriculum or a student with questions, our team is here to help you navigate the future of robotics.
          </p>

          <div className="grid md:grid-cols-2 gap-12">
            <div className="space-y-8">
              <div className="p-8 rounded-2xl bg-zinc-900/50 border border-zinc-800/50 backdrop-blur-sm">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                  <Mail className="w-5 h-5 text-emerald-400" />
                  Contact Info
                </h3>
                <div className="space-y-4">
                  <a href="mailto:radixrobotics@gmail.com" className="flex items-center gap-3 text-zinc-400 hover:text-emerald-400 transition-colors">
                    radixrobotics@gmail.com
                  </a>
                  <a href="https://wa.me/916001979712" target="_blank" rel="noreferrer" className="flex items-center gap-3 text-zinc-400 hover:text-emerald-400 transition-colors">
                    <Phone className="w-4 h-4" />
                    +91 60019 79712
                  </a>
                  <div className="flex gap-3 text-zinc-400 pt-2">
                    <MapPin className="w-4 h-4 shrink-0 mt-1" />
                    <p className="leading-relaxed">
                      Jalukbari,<br />
                      Guwahati, 781013
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <form className="space-y-4 p-8 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl">
              <h3 className="text-xl font-bold mb-6">Send a Message</h3>
              <div>
                <label className="text-sm font-bold text-zinc-400 mb-1.5 block">Name</label>
                <input type="text" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-white placeholder-zinc-600" placeholder="John Doe" />
              </div>
              <div>
                <label className="text-sm font-bold text-zinc-400 mb-1.5 block">Email</label>
                <input type="email" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-white placeholder-zinc-600" placeholder="john@school.edu" />
              </div>
              <div>
                <label className="text-sm font-bold text-zinc-400 mb-1.5 block">Message</label>
                <textarea rows={4} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-white placeholder-zinc-600 resize-none" placeholder="We are interested in bringing Radix to our campus..." />
              </div>
              <button type="submit" disabled className="w-full bg-emerald-600 text-white font-bold py-3.5 rounded-xl hover:bg-emerald-500 transition-all active:scale-[0.98] mt-4 shadow-[0_0_20px_rgba(16,185,129,0.15)] disabled:opacity-50 disabled:cursor-not-allowed">
                Send Message
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
