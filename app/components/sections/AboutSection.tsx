"use client";

import FadeIn from "../ui/FadeIn";
import AnimatedText from "../ui/AnimatedText";
import ContactButton from "../ui/ContactButton";

export default function AboutSection() {
  return (
    <section id="about" className="relative w-full min-h-screen flex flex-col justify-center items-center px-5 sm:px-8 md:px-10 py-20 bg-[#0C0C0C] overflow-hidden">
      
      {/* Content */}
      <div className="flex flex-col items-center gap-10 sm:gap-14 md:gap-16 z-10 w-full">
        <FadeIn delay={0} y={40} className="w-full text-center">
          <h2 className="hero-heading font-black uppercase leading-none tracking-tight text-[clamp(3rem,12vw,160px)]">
            About radix
          </h2>
        </FadeIn>

        <div className="flex flex-col items-center gap-16 sm:gap-20 md:gap-24 w-full px-4">
          <div className="max-w-2xl w-full mx-auto text-center">
            <AnimatedText 
              text="Every student deserves access to the tools shaping our automated future. We don't just supply equipment — we build ecosystems where curiosity meets industrial capability. Our labs turn passive consumers into active robotics creators. Let's build something incredible together!"
              className="text-[#D7E2EA] font-medium leading-relaxed justify-center text-[clamp(1rem,2.5vw,1.75rem)]"
            />
          </div>

          <ContactButton label="Consult With Us" onClick={() => window.open('https://wa.me/916001979712', '_blank')} />
        </div>
      </div>
    </section>
  );
}
