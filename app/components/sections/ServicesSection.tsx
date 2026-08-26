"use client";

import FadeIn from "../ui/FadeIn";

const SERVICES = [
  {
    id: "01",
    name: "Composite Labs",
    desc: "End-to-end setup of STEM and Robotics labs inside schools, fully compliant with NEP 2020 guidelines."
  },
  {
    id: "02",
    name: "AI Curriculum",
    desc: "Structured, grade-wise technical curriculum taking students from basic electronics to advanced machine learning."
  },
  {
    id: "03",
    name: "Hardware Testbeds",
    desc: "100+ modular hardware kits for building Drones, IoT meshes, SLAM rovers, and computer vision systems."
  },
  {
    id: "04",
    name: "Skill Passports",
    desc: "Verifiable digital portfolios and GitHub commits to prove technical competency for higher education."
  },
  {
    id: "05",
    name: "Teacher Training",
    desc: "Continuous enablement of educators to confidently deliver deep tech and programming instruction."
  }
];

export default function ServicesSection() {
  return (
    <section id="services" className="relative w-full bg-white rounded-t-[40px] sm:rounded-t-[50px] md:rounded-t-[60px] px-5 sm:px-8 md:px-10 py-20 sm:py-24 md:py-32 z-20">
      <h2 className="text-[#0C0C0C] font-black uppercase text-center text-[clamp(3rem,12vw,160px)] mb-16 sm:mb-20 md:mb-28 leading-none">
        Services
      </h2>

      <div className="max-w-5xl mx-auto flex flex-col">
        {SERVICES.map((service, i) => (
          <FadeIn key={service.id} delay={i * 0.1}>
            <div className="flex flex-col md:flex-row md:items-center gap-6 md:gap-16 py-8 sm:py-10 md:py-12 border-b border-[#0C0C0C]/15 last:border-0">
              {/* Number */}
              <div className="text-[#0C0C0C] font-black text-[clamp(3rem,10vw,140px)] leading-none shrink-0 md:w-32">
                {service.id}
              </div>
              
              {/* Content */}
              <div className="flex flex-col gap-2">
                <h3 className="text-[#0C0C0C] font-medium uppercase text-[clamp(1rem,2.2vw,2.1rem)] leading-none">
                  - {service.name}
                </h3>
                <p className="text-[#0C0C0C] font-light leading-relaxed max-w-2xl text-[clamp(0.85rem,1.6vw,1.25rem)] opacity-60">
                  {service.desc}
                </p>
              </div>
            </div>
          </FadeIn>
        ))}
      </div>
    </section>
  );
}
