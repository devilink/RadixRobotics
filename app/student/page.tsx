"use client";

import Link from "next/link";
import { Mail } from "lucide-react";
import "./student.css";

const Twitter = ({ size = 24, className = "" }: { size?: number; className?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
  </svg>
);

const Github = ({ size = 24, className = "" }: { size?: number; className?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

const introCopy =
  "A CONTINUOUS JOURNEY OF DISCOVERY. MASTERING ROBOTICS, AI, AND IOT THROUGH HANDS-ON LEARNING AND EXPLORATION.";

const navLinks = [
  { label: "HOME", href: "/" },
  { label: "DASHBOARD", href: "#hero" },
  { label: "PROJECTS", href: "#gallery" },
  { label: "COURSES", href: "#gallery" },
  { label: "RESOURCES", href: "#about" },
  { label: "VISUALIZER", href: "https://radix-visualizer.vercel.app/" },
  { label: "CONTACT", href: "#signal" },
];

const socialLinks = [
  { label: "Mail", href: "/contact", icon: Mail },
  { label: "Github", href: "https://github.com", icon: Github },
];

const collectionCards = [
  {
    video:
      "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260331_053923_22c0a6a5-313c-474c-85ff-3b50d25e944a.mp4",
    score: "8.7/10",
  },
  {
    video:
      "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260331_054411_511c1b7a-fb2f-42ef-bf6c-32c0b1a06e79.mp4",
    score: "9/10",
  },
  {
    video:
      "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260331_055427_ac7035b5-9f3b-4289-86fc-941b2432317d.mp4",
    score: "8.2/10",
  },
];

function FloatingSocials({
  className,
  buttonClassName,
  stacked,
}: {
  className: string;
  buttonClassName: string;
  stacked?: boolean;
}) {
  return (
    <div className={className}>
      {socialLinks.map(({ label, href, icon: Icon }, index) => (
        <Link
          key={label}
          href={href}
          aria-label={label}
          className={[
            buttonClassName,
            stacked && index !== socialLinks.length - 1
              ? "border-b border-white/10"
              : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <Icon size={20} className="transition-transform group-hover:scale-110" />
        </Link>
      ))}
    </div>
  );
}

export default function StudentPage() {
  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#010828] text-cream font-mono">
      {/* Texture Overlay */}
      <div className="pointer-events-none fixed inset-0 z-50 bg-[url('/texture.png')] bg-cover bg-center opacity-60 mix-blend-lighten" />

      {/* SECTION 1: HERO */}
      <section id="hero" className="relative min-h-screen overflow-hidden rounded-b-[32px] shadow-2xl">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 h-full w-full object-cover opacity-90 transition-opacity duration-1000"
        >
          <source
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260331_045634_e1c98c76-1265-4f5c-882a-4276f2080894.mp4"
            type="video/mp4"
          />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-[#010828]/40 via-transparent to-[#010828]/25" />

        <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1831px] flex-col px-5 py-6 sm:px-8 md:px-12 md:py-8">
          <header className="flex items-center justify-between gap-6 animate-fade-up w-full">
            <div className="flex-1 font-grotesk text-[16px] uppercase tracking-[0.12em] text-cream drop-shadow-md">
              RADIX.STUDENT
            </div>

            <nav className="liquid-glass rounded-[28px] px-[52px] py-[24px] backdrop-blur-md shrink-0">
              <ul className="flex items-center gap-10">
                {navLinks.map((link) => (
                  <li key={link.label}>
                    {link.href.startsWith("http") ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        className="font-grotesk text-[13px] uppercase tracking-[0.12em] text-cream transition-all duration-300 hover:text-neon hover:shadow-[0_0_8px_rgba(111,255,0,0.5)] drop-shadow-sm"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="font-grotesk text-[13px] uppercase tracking-[0.12em] text-cream transition-all duration-300 hover:text-neon hover:shadow-[0_0_8px_rgba(111,255,0,0.5)] drop-shadow-sm"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </nav>

            <div className="flex-1" />
          </header>

          <FloatingSocials
            className="absolute right-4 top-8 z-20 flex flex-col gap-4 animate-fade-up delay-200 lg:right-12"
            buttonClassName="liquid-glass group flex h-[48px] w-[48px] lg:h-[56px] lg:w-[56px] items-center justify-center rounded-[1rem] text-cream transition-all duration-300 hover:bg-white/10 hover:text-neon hover:scale-110 shadow-lg"
          />

          <div className="relative flex flex-1 items-center">
            <div className="relative w-full sm:ml-24 lg:ml-32 xl:ml-40">
              <div className="relative max-w-[780px] xl:max-w-[1000px] animate-fade-up delay-100 pr-16 lg:pr-0">
                <h1 className="font-grotesk text-[40px] uppercase leading-[1.05] text-cream sm:text-[60px] md:text-[75px] md:leading-[1] lg:text-[90px] xl:text-[110px] drop-shadow-lg">
                  BEYOND THE CLASSROOM
                  <br />
                  AND INTO THE FUTURE
                </h1>
                <span className="font-condiment pointer-events-none absolute left-0 top-0 -translate-y-[80%] md:-translate-y-[70%] -translate-x-[5%] md:-translate-x-[2%] -rotate-2 text-[54px] normal-case text-neon opacity-90 mix-blend-exclusion sm:text-[36px] md:text-[42px] lg:text-[48px] xl:text-[56px] drop-shadow-[0_0_15px_rgba(111,255,0,0.4)]">
                  Skill portfolio
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: ABOUT / INTRO */}
      <section id="about" className="relative min-h-screen overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 h-full w-full object-cover"
        >
          <source
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260331_151551_992053d1-3d3e-4b8c-abac-45f22158f411.mp4"
            type="video/mp4"
          />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-[#010828]/20 via-transparent to-[#010828]/35" />

        <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1831px] flex-col justify-between px-5 py-16 sm:px-8 md:px-12 md:py-24 xl:py-32">
          <div className="flex flex-col gap-12 sm:flex-row sm:items-start sm:justify-between animate-fade-up">
            <div className="relative">
              <h2 className="font-grotesk text-[32px] uppercase leading-[1.05] text-cream sm:text-[44px] md:text-[52px] lg:text-[60px] xl:text-[80px] drop-shadow-md">
                HELLO!
                <br />
                FUTURE INNOVATORS
              </h2>
              <span className="font-condiment pointer-events-none absolute bottom-0 right-0 translate-x-[38%] translate-y-[22%] rotate-[2deg] text-[36px] normal-case text-neon mix-blend-exclusion sm:text-[48px] md:text-[58px] lg:text-[68px] xl:text-[80px] drop-shadow-[0_0_15px_rgba(111,255,0,0.5)]">
                Radix
              </span>
            </div>

            <p className="max-w-[266px] text-[14px] uppercase leading-relaxed text-cream drop-shadow-sm md:text-[16px] lg:max-w-[340px] xl:max-w-[420px] xl:text-[18px]">
              {introCopy}
            </p>
          </div>

          <div className="mt-16 flex items-end justify-between gap-12 animate-fade-up delay-200">
            <div className="max-w-[266px] space-y-4 text-[#010828] opacity-10 sm:text-cream lg:max-w-[340px] xl:max-w-[420px]">
              <p className="text-[14px] uppercase leading-relaxed md:text-[16px] xl:text-[18px]">
                {introCopy}
              </p>
              <p className="text-[14px] uppercase leading-relaxed md:text-[16px] xl:text-[18px]">
                {introCopy}
              </p>
            </div>

            <div className="hidden max-w-[266px] space-y-4 text-cream opacity-10 sm:block lg:max-w-[340px] xl:max-w-[420px]">
              <p className="text-[14px] uppercase leading-relaxed md:text-[16px] xl:text-[18px]">
                {introCopy}
              </p>
              <p className="text-[14px] uppercase leading-relaxed md:text-[16px] xl:text-[18px]">
                {introCopy}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: NFT COLLECTION GRID */}
      <section id="gallery" className="bg-[#010828] py-20 md:py-24 xl:py-32 relative">
        <div className="absolute inset-0 bg-gradient-to-t from-transparent to-[#010828]/50" />
        <div className="relative z-10 mx-auto w-full max-w-[1831px] px-5 sm:px-8 md:px-12 xl:px-16">
          <div className="mb-14 flex flex-col gap-10 md:mb-16 md:flex-row md:items-end md:justify-between xl:mb-24 animate-fade-up">
            <h2 className="font-grotesk text-[32px] uppercase leading-[1.02] text-cream sm:text-[44px] md:text-[52px] lg:text-[60px] xl:text-[80px] drop-shadow-md">
              SHOWCASE OF
              <br />
              <span className="ml-12 block sm:ml-20 md:ml-24 lg:ml-32">
                <span className="font-condiment normal-case text-neon drop-shadow-[0_0_10px_rgba(111,255,0,0.3)]">
                  Student{" "}
                </span>
                <span>PROJECTS</span>
              </span>
            </h2>

            <button className="group inline-flex flex-col items-start text-left text-cream transition-opacity hover:opacity-80">
              <span className="flex items-end gap-3">
                <span className="font-grotesk text-[32px] uppercase leading-none sm:text-[44px] md:text-[52px] lg:text-[60px] xl:text-[80px]">
                  SEE
                </span>
                <span className="flex flex-col font-grotesk text-[20px] uppercase leading-[0.9] sm:text-[28px] lg:text-[36px] xl:text-[44px]">
                  <span>ALL</span>
                  <span>WORKS</span>
                </span>
              </span>
              <span className="mt-2 h-[6px] w-full bg-neon transition-all duration-300 group-hover:bg-cream group-hover:shadow-[0_0_15px_rgba(255,255,255,0.8)] md:h-[10px] xl:h-[12px]" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3 md:gap-6 lg:gap-8 xl:gap-12">
            {collectionCards.map((card, idx) => (
              <article
                key={card.video}
                className="liquid-glass group rounded-[32px] p-[18px] transition-all duration-500 hover:-translate-y-2 hover:bg-white/10 hover:shadow-[0_10px_40px_-10px_rgba(255,255,255,0.15)] animate-fade-up"
                style={{ animationDelay: `${idx * 150}ms` }}
              >
                <div className="relative mb-4 w-full overflow-hidden rounded-[24px] pb-[100%] shadow-inner">
                  <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  >
                    <source src={card.video} type="video/mp4" />
                  </video>
                </div>

                <div className="liquid-glass flex items-center justify-between rounded-[20px] px-5 py-4 backdrop-blur-xl">
                  <div className="flex flex-col">
                    <span className="text-[11px] uppercase tracking-[0.18em] text-cream/70">
                      MASTERY LEVEL:
                    </span>
                    <span className="mt-1 font-grotesk text-[16px] uppercase tracking-[0.08em] text-cream">
                      {card.score}
                    </span>
                  </div>

                  <button className="flex h-[48px] w-[48px] items-center justify-center rounded-full bg-gradient-to-br from-[#b724ff] to-[#7c3aed] text-white shadow-[0_0_20px_rgba(183,36,255,0.4)] transition-all duration-300 hover:scale-110 hover:shadow-[0_0_30px_rgba(183,36,255,0.7)] hover:rotate-12">
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4: CTA / FINAL SECTION */}
      <section id="signal" className="relative">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="block h-auto w-full object-cover"
        >
          <source
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260331_055729_72d66327-b59e-4ae9-bb70-de6ccb5ecdb0.mp4"
            type="video/mp4"
          />
        </video>

        <div className="absolute inset-0 z-10 mx-auto w-full max-w-[1831px]">
          <div className="flex h-full items-center justify-end px-5 sm:px-8 md:px-12">
            <div className="pointer-events-auto relative w-full text-right lg:pl-[15%] lg:pr-[20%] xl:pr-[25%] animate-fade-up">
              <span className="font-condiment pointer-events-none absolute left-[10%] top-0 -translate-y-full text-[17px] normal-case text-neon mix-blend-exclusion drop-shadow-[0_0_20px_rgba(111,255,0,0.6)] sm:text-[32px] md:text-[50px] lg:left-[15%] lg:text-[68px] xl:text-[80px]">
                Start learning
              </span>

              <h2 className="flex flex-col items-end font-grotesk text-[16px] uppercase leading-[1.15] text-cream sm:text-[28px] md:text-[42px] lg:text-[60px] xl:text-[80px] drop-shadow-xl">
                <span className="mb-4 sm:mb-8 md:mb-12 xl:mb-16">JOIN US.</span>
                <span>MASTER THE SKILLS.</span>
                <span>BUILD THE FUTURE.</span>
                <span>IGNITE YOUR POTENTIAL.</span>
              </h2>
            </div>
          </div>

          {/* Premium Footer */}
          <div className="absolute bottom-0 left-0 w-full border-t border-white/10 bg-[#010828]/30 backdrop-blur-xl px-5 py-6 sm:px-8 md:px-12 xl:px-16 animate-fade-up delay-300">
            <div className="mx-auto grid w-full max-w-[1831px] grid-cols-1 items-center gap-6 md:grid-cols-3">
              <div className="flex items-center justify-center gap-3 md:justify-start">
                <div className="h-2 w-2 rounded-full bg-neon animate-pulse shadow-[0_0_12px_rgba(111,255,0,0.9)]" />
                <span className="font-grotesk text-[14px] uppercase tracking-[0.2em] text-cream/70">
                  SYSTEM ONLINE
                </span>
              </div>

              <div className="text-center font-mono text-[11px] uppercase tracking-[0.15em] text-cream/40">
                © 2026 RADIX ROBOTICS — EMPOWERING MINDS
              </div>

              <div className="flex items-center justify-center gap-6 md:justify-end xl:gap-8">
                {["CERTIFICATES", "TERMS", "PRIVACY"].map((link) => (
                  <Link key={link} href="#" className="font-grotesk text-[12px] uppercase tracking-[0.15em] text-cream/60 transition-all duration-300 hover:text-neon hover:drop-shadow-[0_0_8px_rgba(111,255,0,0.6)]">
                    {link}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
