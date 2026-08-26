"use client";
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight } from 'lucide-react';

export default function AboutPage() {

    const navLinks = [
        { name: 'About', href: '/about' },
        { name: 'Programs', href: '/#programs' },
        { name: 'Team', href: '/team' },
        { name: 'Impact', href: '/#impact' }
    ];

    return (
        <div className="relative min-h-screen font-sans text-[#1a1a1a]">
            
            {/* --- NOTEBOOK PAPER BACKGROUND --- */}
            <div className="fixed inset-0 z-[-1] h-full w-full bg-notebook-subtle pointer-events-none"></div>

            {/* --- ABOUT SECTION --- */}
            <section className="relative z-10 max-w-[1536px] mx-auto px-8 lg:px-16 pt-40 pb-24 min-h-[80vh] flex flex-col justify-center">
                {/* Massive Header Title */}
                <div className="mb-16 md:mb-24 transition-all duration-700">
                    <span className="text-blue-600 font-bold text-xs tracking-[0.2em] uppercase mb-8 flex items-center gap-4">
                        <span className="w-8 h-[2px] bg-blue-600 block"></span> Our Mission
                    </span>
                    <h2 className="text-5xl md:text-7xl lg:text-[6rem] max-md:text-4xl font-bold leading-[1.05] tracking-tighter text-black max-w-5xl">
                        Democratizing <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-black to-gray-400">Innovation.</span>
                    </h2>
                </div>

                {/* Aesthetic Bento Grid Container */}
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6 auto-rows-[minmax(280px,auto)]">

                    {/* Core Mission - Large Dark Card */}
                    <div className="col-span-1 md:col-span-3 lg:col-span-2 row-span-2 bg-[#0a0a0a] rounded-[2rem] p-10 lg:p-14 text-white flex flex-col justify-between group overflow-hidden relative transition-all duration-700 shadow-xl">
                        <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.15),transparent_50%)] pointer-events-none"></div>

                        <div className="relative z-10">
                            <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mb-10 group-hover:scale-110 group-hover:bg-blue-600 transition-all duration-500">
                                <ArrowUpRight className="text-white" size={28} />
                            </div>
                            <h3 className="text-3xl lg:text-4xl font-bold leading-tight mb-6 tracking-tight">
                                Every student deserves access to the tools shaping our future.
                            </h3>
                            <p className="text-gray-400 text-lg leading-relaxed max-w-md font-light">
                                We don't just sell equipment; we build ecosystems where curiosity meets capability. Our labs are active hotspots of learning, where passive consumers become active creators.
                            </p>
                        </div>
                        <div className="relative z-10 mt-12 flex items-center gap-4">
                            <div className="h-[1px] w-12 bg-blue-600"></div>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-blue-500">The Radix Premise</span>
                        </div>
                    </div>

                    {/* Feature 1 - Wide Horizontal Card */}
                    <div className="col-span-1 md:col-span-3 lg:col-span-2 bg-white/80 backdrop-blur-md border border-gray-200 rounded-[2rem] p-8 lg:p-10 flex flex-col justify-center group hover:bg-white hover:shadow-2xl hover:shadow-blue-900/5 transition-all duration-500 relative overflow-hidden">
                        <div className="flex items-start justify-between mb-6 relative z-10">
                            <h4 className="text-3xl font-bold text-black tracking-tight group-hover:text-blue-600 transition-colors duration-300">Pan-India Vision</h4>
                            <span className="text-gray-300 font-bold text-2xl group-hover:text-blue-200 transition-colors duration-300">01</span>
                        </div>
                        <p className="text-gray-500 leading-relaxed text-lg max-w-md relative z-10">Equipping institutions with future-ready labs across India, from metropolitan centers to growing educational hubs.</p>

                        <div className="mt-8 w-full h-[2px] bg-gray-200 relative overflow-hidden z-10">
                            <div className="absolute top-0 left-0 h-full w-0 bg-blue-600 group-hover:w-full transition-all duration-700 ease-in-out"></div>
                        </div>
                    </div>

                    {/* Feature 2 - Small Square Card */}
                    <div className="col-span-1 md:col-span-1 lg:col-span-1 bg-white/80 backdrop-blur-md border border-gray-200 rounded-[2rem] p-8 lg:p-10 flex flex-col justify-between group hover:border-black transition-colors duration-500 cursor-default">
                        <div className="transform group-hover:-translate-y-2 transition-transform duration-500">
                            <span className="text-gray-200 font-bold text-4xl mb-6 block group-hover:text-black transition-colors duration-500">02</span>
                            <h4 className="text-xl font-bold text-black mb-3">NEP 2020 Validated</h4>
                            <p className="text-gray-500 text-sm leading-relaxed">Full compliance with the latest education policy, promoting 21st-century experiential learning.</p>
                        </div>
                    </div>

                    {/* Feature 3 - Blue Accent Square Card */}
                    <div className="col-span-1 md:col-span-2 lg:col-span-1 bg-blue-600 rounded-[2rem] p-8 lg:p-10 flex flex-col justify-between text-white group overflow-hidden relative transition-all duration-700 cursor-default shadow-xl shadow-blue-600/20">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.2),transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                        <div className="relative z-10 transform group-hover:-translate-y-2 transition-transform duration-500">
                            <span className="text-white/50 font-bold text-4xl mb-6 block group-hover:text-white transition-colors duration-500">03</span>
                            <h4 className="text-xl font-bold mb-3">Skill First Approach</h4>
                            <p className="text-white/80 text-sm leading-relaxed">A comprehensive, hands-on curriculum designed to certify students in practical technical proficiency.</p>
                        </div>

                        <div className="relative z-10 w-10 h-10 rounded-full border border-white/30 flex items-center justify-center group-hover:bg-white group-hover:text-blue-600 transition-all duration-500 mt-6">
                            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform duration-300" />
                        </div>
                    </div>
                </div>
            </section>

            {/* --- OUR STORY & VISION --- */}
            <section className="relative z-10 max-w-[1536px] mx-auto px-8 lg:px-16 py-24 border-t border-gray-200">
                <div className="max-w-4xl mx-auto flex flex-col justify-center text-center items-center">
                    <span className="text-blue-600 font-bold text-xs tracking-[0.2em] uppercase mb-6 flex items-center justify-center gap-4">
                        <span className="w-8 h-[2px] bg-blue-600 block"></span> Our Story <span className="w-8 h-[2px] bg-blue-600 block"></span>
                    </span>
                    <h3 className="text-4xl md:text-5xl font-bold tracking-tight mb-8">Redefining Education in India.</h3>
                    <p className="text-gray-600 text-lg leading-relaxed mb-6">
                        Radix Robotics began with a simple but powerful realization: theoretical knowledge is no longer enough. To thrive in the 21st century, students must interact with technology, not just read about it.
                    </p>
                    <p className="text-gray-600 text-lg leading-relaxed mb-10">
                        We bridge the gap between traditional curriculums and modern industry demands by establishing state-of-the-art Composite Skill Laboratories directly inside schools. We provide the infrastructure, the curriculum, and the mentorship needed to transform students into innovators.
                    </p>
                </div>
            </section>


            {/* --- OUR CORE PRINCIPLES --- */}
            <section className="relative z-10 bg-[#0a0a0a] text-white py-32">
                <div className="max-w-[1536px] mx-auto px-8 lg:px-16">
                    <div className="text-center mb-20 max-w-3xl mx-auto">
                        <span className="text-blue-500 font-bold text-xs tracking-[0.2em] uppercase mb-4 block">The Foundation</span>
                        <h3 className="text-4xl md:text-6xl font-bold tracking-tight">Our Core Principles.</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { title: 'Hands-on Learning', desc: 'Active participation over passive observation. Students build, break, and innovate.' },
                            { title: 'Future-Ready Skills', desc: 'Curriculums centered on AI, IoT, and Robotics to prepare students for tomorrow.' },
                            { title: 'Inclusive Education', desc: 'Accessible technology for all demographics, bridging the digital divide in India.' },
                            { title: 'Continuous Innovation', desc: 'Constantly updating our tech stacks and syllabi to match industry standards.' }
                        ].map((principle, idx) => (
                            <div key={idx} className="bg-white/5 border border-white/10 rounded-[2rem] p-10 hover:bg-white/10 hover:-translate-y-2 transition-all duration-300">
                                <span className="text-blue-500 font-bold text-4xl mb-6 block">0{idx + 1}</span>
                                <h4 className="text-xl font-bold mb-4">{principle.title}</h4>
                                <p className="text-gray-400 leading-relaxed text-sm">{principle.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- FOOTER (MODERN & AESTHETIC) --- */}
            <footer className="relative z-10 bg-[#050505] text-white pt-32 pb-12 overflow-hidden border-t border-gray-900 mt-auto">
                <div className="absolute top-0 left-0 w-full overflow-hidden flex justify-center pointer-events-none opacity-[0.03] select-none">
                    <h1 className="text-[25vw] font-bold leading-none tracking-tighter translate-y-[-20%]">RADIX</h1>
                </div>

                <div className="max-w-[1536px] mx-auto px-8 lg:px-16 relative z-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-16 lg:gap-8 mb-24 transition-all duration-700">
                        <div className="lg:col-span-5 flex flex-col justify-between">
                            <div>
                                <Link href="/" className="block w-fit mb-8 group cursor-pointer">
                                    <Image src="/tib.PNG" alt="RADIX Robotics" width={600} height={230} className="w-auto h-50 object-contain" />
                                </Link>
                                <p className="text-gray-400 text-lg max-w-sm leading-relaxed mb-12 font-light">
                                    Engineering the future through elite Robotics Education, AI, and Innovation. Building India's next generation of tech leaders.
                                </p>
                            </div>
                            <a href="mailto:radixrobotics@gmail.com" className="text-2xl md:text-3xl font-bold hover:text-blue-500 transition-colors duration-300 w-fit flex items-center gap-4 group">
                                radixrobotics@gmail.com
                                <ArrowUpRight size={28} className="opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500 text-blue-500" />
                            </a>
                        </div>
                        <div className="lg:col-span-2 lg:col-start-7">
                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-8">Navigation</h4>
                            <ul className="flex flex-col gap-5">
                                {navLinks.map((item) => (
                                    <li key={item.name}>
                                        <Link href={item.href} className="text-gray-300 hover:text-white text-sm font-medium transition-colors duration-300 flex items-center gap-3 group w-fit">
                                            <span className="w-0 h-[2px] bg-blue-600 group-hover:w-6 transition-all duration-500 ease-out"></span>
                                            <span className="group-hover:translate-x-1 transition-transform duration-500">{item.name}</span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="lg:col-span-2">
                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-8">Connect</h4>
                            <ul className="flex flex-col gap-5">
                                {[
                                    { name: 'WhatsApp', url: 'https://wa.me/916001979712' },
                                    { name: 'Instagram', url: 'https://www.instagram.com/radix.robotics?igsh=OHZiazg4eDA5ejl2' }
                                ].map((item) => (
                                    <li key={item.name}>
                                        <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white text-sm font-medium transition-colors duration-300 flex items-center gap-2 group w-fit">
                                            <ArrowUpRight size={14} className="text-gray-500 group-hover:text-blue-500 group-hover:-translate-y-1 group-hover:translate-x-1 transition-all" />
                                            {item.name}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="lg:col-span-2">
                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-8">Legal</h4>
                            <ul className="flex flex-col gap-5">
                                {['Privacy Policy', 'Terms of Service'].map((item) => (
                                    <li key={item}>
                                        <Link href="#" className="text-gray-400 hover:text-white text-sm transition-colors duration-300 block w-fit">
                                            {item}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                    <div className="pt-8 border-t border-gray-900 flex flex-col md:flex-row items-center justify-between gap-4">
                        <p className="text-gray-500 text-xs">
                            © {new Date().getFullYear()} RADIX Robotics. All rights reserved.
                        </p>
                        <p className="text-gray-600 text-xs flex items-center gap-1">
                            Crafted in India
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
