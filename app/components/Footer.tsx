import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

export default function Footer() {
  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'About', href: '/about' },
    { name: 'Team', href: '/team' },
    { name: 'Projects', href: '/projects' },
    { name: 'Services', href: '/services' }
  ];

  return (
    <footer className="relative z-10 bg-[#111] text-white pt-20 sm:pt-24 pb-12 overflow-hidden border-t-2 border-[#111]">
      {/* Massive Watermark */}
      <div className="absolute top-0 left-0 w-full overflow-hidden flex justify-center pointer-events-none opacity-[0.03] select-none pr-font-sans">
        <div className="text-[22vw] font-black leading-none tracking-tighter translate-y-[-20%]">RADIX</div>
      </div>

      <div className="w-full 2xl:px-24 mx-auto px-4 sm:px-8 lg:px-16 relative z-10 pr-font-sans">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-8 mb-16">

          {/* Brand Column */}
          <div className="lg:col-span-5 flex flex-col justify-between">
            <div>
              <Link href="/" className="block w-fit mb-6 group cursor-pointer flex items-center gap-2">
                <img src="/ttiig.png" alt="RADIX Icon" className="h-8 w-auto object-contain" />
                <img src="/txttt.png" alt="RADIX Robotics" className="h-6 w-auto object-contain" />
              </Link>
              <p className="text-[#a0aab8] text-sm sm:text-base max-w-sm leading-relaxed mb-6 font-semibold">
                Engineering the future through elite Robotics Education, AI research, and turnkey Composite Skill Labs across Indian schools.
              </p>
            </div>

            <Link
              href="/contact"
              className="text-lg sm:text-xl font-black uppercase tracking-tighter hover:text-[#ff5400] transition-colors duration-300 w-fit flex items-center gap-2"
            >
              radixrobotics [at] gmail.com
              <ArrowUpRight size={18} className="text-[#ff5400]" />
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="lg:col-span-2 lg:col-start-7">
            <h4 className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#7b828e] mb-4">Navigation</h4>
            <ul className="flex flex-col gap-3 text-sm font-bold uppercase tracking-wide">
              {navLinks.map((item) => (
                <li key={item.name}>
                  <Link href={item.href} className="text-white hover:text-[#ff5400] transition-colors">
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Social Links */}
          <div className="lg:col-span-2">
            <h4 className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#7b828e] mb-4">Connect</h4>
            <ul className="flex flex-col gap-3 text-sm font-bold uppercase tracking-wide">
              {[
                { name: 'WhatsApp', url: 'https://wa.me/916001979712' },
                { name: 'Instagram', url: 'https://www.instagram.com/radix.robotics?igsh=OHZiazg4eDA5ejl2' }
              ].map((item) => (
                <li key={item.name}>
                  <a href={item.url} target="_blank" rel="noopener noreferrer nofollow" className="text-white hover:text-[#ff5400] transition-colors">
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div className="lg:col-span-2">
            <h4 className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#7b828e] mb-4">Legal</h4>
            <ul className="flex flex-col gap-3 text-sm font-bold uppercase tracking-wide">
              {['Privacy Policy', 'Terms of Deployment', 'NEP 2020 Compliance'].map((item) => (
                <li key={item}>
                  <Link href="#" className="text-[#a0aab8] hover:text-[#ff5400] transition-colors">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="border-t-2 border-[#333] pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono font-bold text-[#7b828e] uppercase tracking-wider">
          <p>RADIX Robotics &copy; {new Date().getFullYear()} — All Rights Reserved</p>
          <div className="flex items-center gap-2 px-3 py-1 bg-white/5 border-2 border-white/10 text-white">
            <span>Operating in India</span>
            <div className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ff5400] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#ff5400]"></span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
