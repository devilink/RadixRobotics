"use client";
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import Footer from '@/app/components/Footer';
import Breadcrumbs from '@/app/components/Breadcrumbs';

export default function AboutPage() {
    return (
        <div className="relative min-h-[100dvh] w-full max-w-full bg-[#050505] text-[#f2f3f5] font-sans overflow-x-hidden">
            
            <Breadcrumbs />

            {/* --- ABOUT SECTION --- */}
            <main className="relative z-10 max-w-[1536px] mx-auto px-4 sm:px-8 lg:px-16 pt-32 lg:pt-40 pb-24 flex flex-col justify-center">
                
                {/* Massive Header Title */}
                <div className="mb-16 md:mb-24 transition-all duration-700">
                    <span className="font-mono text-sm font-bold uppercase tracking-widest text-[#ff5400] block mb-6">
                        [ Our Mission ]
                    </span>
                    <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-[6rem] font-black leading-[0.95] tracking-tighter text-[#111] uppercase max-w-5xl">
                        Democratizing <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff5400] to-yellow-500">Innovation.</span>
                    </h1>
                </div>

                {/* Aesthetic Bento Grid Container */}
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6 auto-rows-[minmax(280px,auto)]">

                    {/* Core Mission - Large Dark Card */}
                    <div className="col-span-1 md:col-span-3 lg:col-span-2 row-span-1 md:row-span-2 bg-[#111] border-2 border-[#111] shadow-[6px_6px_0px_#ff5400] sm:shadow-[8px_8px_0px_#ff5400] rounded-none p-6 sm:p-10 lg:p-14 text-white flex flex-col justify-between group overflow-hidden relative transition-all hover:-translate-y-2">
                        
                        {/* Decorative background element */}
                        <div className="absolute top-[-50px] right-[-50px] text-[200px] font-black text-[#ffffff05] pointer-events-none select-none font-pixel leading-none">
                            X
                        </div>

                        <div className="relative z-10">
                            <div className="w-14 h-14 bg-white text-[#111] border-2 border-[#111] shadow-[4px_4px_0px_#ff5400] flex items-center justify-center mb-10 group-hover:scale-110 transition-transform">
                                <ArrowUpRight size={28} />
                            </div>
                            <h3 className="text-2xl sm:text-3xl lg:text-5xl font-black uppercase tracking-tighter leading-[1.05] mb-6">
                                Every student deserves access to the tools shaping our future.
                            </h3>
                            <p className="text-[#a1a1aa] text-base sm:text-lg leading-relaxed max-w-md font-medium">
                                We don't just sell equipment; we build ecosystems where curiosity meets capability. Our labs are active hotspots of learning, where passive consumers become active creators.
                            </p>
                        </div>
                        <div className="relative z-10 mt-12 flex items-center gap-4 pt-8 border-t border-[#333]">
                            <span className="text-xs font-black uppercase tracking-widest text-[#ff5400]">
                                // The Radix Premise
                            </span>
                        </div>
                    </div>

                    {/* Feature 1 - Wide Horizontal Card */}
                    <div className="col-span-1 md:col-span-3 lg:col-span-2 bg-[#f2f3f5] border-2 border-[#111] shadow-[6px_6px_0px_#111] rounded-none p-6 sm:p-8 lg:p-10 flex flex-col justify-center group hover:-translate-y-2 transition-transform relative overflow-hidden">
                        <div className="flex items-start justify-between mb-6 relative z-10">
                            <h4 className="text-2xl sm:text-3xl font-black uppercase tracking-tighter text-[#111]">Pan-India Vision</h4>
                            <span className="font-mono text-2xl font-bold text-[#a1a1aa] group-hover:text-[#ff5400] transition-colors">01</span>
                        </div>
                        <p className="text-[#646a73] font-medium leading-relaxed text-lg max-w-md relative z-10">
                            Equipping institutions with future-ready labs across India, from metropolitan centers to growing educational hubs.
                        </p>
                    </div>

                    {/* Feature 2 - Small Square Card */}
                    <div className="col-span-1 md:col-span-1 lg:col-span-1 bg-white border-2 border-[#111] shadow-[6px_6px_0px_#111] rounded-none p-6 sm:p-8 lg:p-10 flex flex-col justify-between group hover:-translate-y-2 transition-transform">
                        <div>
                            <span className="font-mono text-4xl font-bold text-[#e4e4e7] mb-6 block group-hover:text-[#111] transition-colors">02</span>
                            <h4 className="text-2xl font-black uppercase tracking-tighter text-[#111] mb-3 leading-[1.1]">NEP 2020 Validated</h4>
                            <p className="text-[#646a73] text-sm font-medium leading-relaxed">Full compliance with the latest education policy, promoting 21st-century experiential learning.</p>
                        </div>
                    </div>

                    {/* Feature 3 - Orange Accent Square Card */}
                    <div className="col-span-1 md:col-span-2 lg:col-span-1 bg-[#ff5400] border-2 border-[#111] shadow-[6px_6px_0px_#111] rounded-none p-6 sm:p-8 lg:p-10 flex flex-col justify-between text-white group relative overflow-hidden hover:-translate-y-2 transition-transform cursor-default">
                        
                        {/* Decorative sticker */}
                        <div className="absolute top-4 right-4 bg-white text-[#111] font-black uppercase text-[10px] tracking-widest px-3 py-1 border-2 border-[#111] shadow-[2px_2px_0px_#111] -rotate-12">
                            Core
                        </div>

                        <div className="relative z-10">
                            <span className="font-mono text-4xl font-bold text-white/40 mb-6 block group-hover:text-white transition-colors">03</span>
                            <h4 className="text-2xl font-black uppercase tracking-tighter mb-3 leading-[1.1]">Skill First Approach</h4>
                            <p className="text-white/90 text-sm font-medium leading-relaxed">A comprehensive, hands-on curriculum designed to certify students in practical technical proficiency.</p>
                        </div>
                    </div>
                </div>
            </main>

            {/* --- OUR STORY & VISION --- */}
            <section className="relative z-10 w-full border-t-2 border-[#111] bg-white pt-24 pb-32">
                <div className="max-w-[1536px] mx-auto px-4 sm:px-8 lg:px-16 flex flex-col lg:flex-row gap-16 lg:gap-24">
                    
                    <div className="w-full lg:w-5/12 flex flex-col justify-center">
                        <span className="font-mono text-sm font-bold uppercase tracking-widest text-[#ff5400] block mb-6">
                            [ The Origin ]
                        </span>
                        <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-[#111] leading-[1.05] mb-8">
                            A gap in the system, <br />
                            A spark of a solution.
                        </h2>
                        
                        <div className="p-8 border-2 border-[#111] shadow-[8px_8px_0px_#ff5400] bg-[#f8f7ef] relative">
                            {/* Decorative element */}
                            <div className="absolute -top-4 -left-4 w-8 h-8 bg-[#ff5400] border-2 border-[#111]"></div>
                            
                            <p className="text-lg font-bold text-[#111] mb-2 uppercase tracking-widest">Est. 2024</p>
                            <p className="text-[#646a73] font-medium leading-relaxed">
                                Radix Robotics was founded with a singular conviction: the traditional education system is under-equipping students for an automated future. We didn't just want to provide kits; we wanted to provide a comprehensive ecosystem of hardware, curriculum, and mentorship.
                            </p>
                        </div>
                    </div>

                    <div className="w-full lg:w-7/12 grid grid-cols-1 md:grid-cols-2 gap-6 auto-rows-fr">
                        
                        <div className="bg-[#f2f3f5] border-2 border-[#111] shadow-[6px_6px_0px_#111] p-8 lg:p-10 flex flex-col hover:-translate-y-2 transition-transform">
                            <h3 className="text-2xl font-black uppercase tracking-tighter text-[#111] mb-4">Our Vision</h3>
                            <p className="text-[#646a73] font-medium leading-relaxed mt-auto">
                                To be the foundational infrastructure for robotics education across the nation, making AI and automation accessible in every classroom.
                            </p>
                        </div>

                        <div className="bg-[#111] text-white border-2 border-[#111] shadow-[6px_6px_0px_#ff5400] p-8 lg:p-10 flex flex-col hover:-translate-y-2 transition-transform">
                            <h3 className="text-2xl font-black uppercase tracking-tighter text-white mb-4">Our Promise</h3>
                            <p className="text-[#a1a1aa] font-medium leading-relaxed mt-auto">
                                End-to-end deployment. We don't drop boxes and leave. We commission labs, train educators, and ensure sustainable learning outcomes.
                            </p>
                        </div>

                    </div>
                </div>
            </section>

            {/* --- CTA SECTION --- */}
            <section className="w-full bg-[#ff5400] border-t-2 border-b-2 border-[#111] py-24 sm:py-32 relative overflow-hidden">
                {/* Scrolling Marquee text in background */}
                <div className="absolute top-1/2 left-0 -translate-y-1/2 w-[200vw] text-[180px] font-black uppercase tracking-tighter text-[#00000010] whitespace-nowrap pointer-events-none select-none overflow-hidden font-pixel">
                    FUTURE READY FUTURE READY FUTURE READY
                </div>

                <div className="max-w-4xl mx-auto px-4 sm:px-8 text-center relative z-10 flex flex-col items-center">
                    <h2 className="text-4xl sm:text-6xl font-black uppercase tracking-tighter text-[#111] mb-8 leading-[1.05]">
                        Ready to upgrade your institution?
                    </h2>
                    <p className="text-white text-lg sm:text-xl font-medium mb-12 max-w-2xl">
                        Join our founding partner cohort and bring a state-of-the-art Composite Skill Lab to your campus.
                    </p>
                    <Link href="/contact" className="bg-[#111] text-white px-10 py-5 rounded-none border-2 border-[#111] font-black text-sm uppercase tracking-widest hover:bg-white hover:text-[#111] hover:-translate-y-2 hover:shadow-[8px_8px_0px_#111] transition-all">
                        Schedule a Consultation
                    </Link>
                </div>
            </section>

            <Footer />
        </div>
    );
}
