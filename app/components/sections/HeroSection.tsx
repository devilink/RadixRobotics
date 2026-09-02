"use client";

import Link from "next/link";
import Image from "next/image";
import FadeIn from "../ui/FadeIn";
import Magnet from "../ui/Magnet";
import ContactButton from "../ui/ContactButton";

export default function HeroSection() {
  return (
    <section className="relative w-full h-[100svh] flex flex-col overflow-x-clip bg-[#0C0C0C]">
      {/* Main Content (Absolute Fill) */}
      <div className="flex-1 flex flex-col justify-between pt-24 pb-7 sm:pb-8 md:pb-10 max-w-[1400px] mx-auto w-full px-6 md:px-10 z-20">
        
        {/* Massive Heading */}
        <div className="w-full overflow-hidden mt-6 sm:mt-4 md:-mt-5 text-center flex justify-center">
          <FadeIn delay={0.15} y={40} className="w-full">
            <h1 className="hero-heading font-black uppercase tracking-tight leading-none whitespace-nowrap w-full text-[12vw] sm:text-[13vw] md:text-[14vw] lg:text-[15vw]">
              radix robotics
            </h1>
          </FadeIn>
        </div>

        {/* Bottom Bar */}
        <div className="flex justify-between items-end w-full">
          <FadeIn delay={0.35} y={20} className="max-w-[160px] sm:max-w-[220px] md:max-w-[260px]">
            <p className="text-[#D7E2EA] font-light uppercase tracking-wide leading-snug text-[clamp(0.75rem,1.4vw,1.5rem)]">
              engineering the future through composite skill labs and ai robotics education
            </p>
          </FadeIn>

          <FadeIn delay={0.5} y={20}>
            <ContactButton label="Schedule Audit" onClick={() => window.open('https://wa.me/916001979712', '_blank')} />
          </FadeIn>
        </div>
      </div>

      {/* Center Portrait with Magnet Effect */}
      <FadeIn delay={0.6} y={30} className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 sm:top-auto sm:translate-y-0 sm:bottom-0 z-10 pointer-events-auto">
        <Magnet padding={150} strength={3}>
          <Image 
            src="/drone.png" 
            alt="Radix Drone" 
            width={520}
            height={520}
            priority
            className="w-[280px] sm:w-[360px] md:w-[440px] lg:w-[520px] h-auto object-contain pointer-events-none drop-shadow-[0_20px_50px_rgba(255,255,255,0.1)]"
          />
        </Magnet>
      </FadeIn>

    </section>
  );
}
