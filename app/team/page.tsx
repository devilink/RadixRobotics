"use client";
import Image from 'next/image';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { useEffect } from 'react';
import Link from 'next/link';
import Footer from '@/app/components/Footer';
import Breadcrumbs from '@/app/components/Breadcrumbs';

export default function TeamPage() {

    useEffect(() => {
        // Intersection Observer for Scroll Reveals
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('opacity-100', 'translate-y-0');
                    entry.target.classList.remove('opacity-0', 'translate-y-12');
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

        document.querySelectorAll('.reveal-on-scroll').forEach((el) => observer.observe(el));

        return () => {
            observer.disconnect();
        };
    }, []);

    const executiveDirectors = [
        {
            name: "Dimpu Baruah",
            role: "Director & Co-Founder",
            bio: "Visionary leader with a passion for robotics education and scaling impact across institutions.",
            image: "/DIRECTOR.jpeg"
        },
        {
            name: "Aman Ahmed",
            role: "Founder & CEO",
            bio: "Driving operational excellence and strategic growth.",
            image: "/CEO.jpeg"
        },
        {
            name: "Gourangon Gogoi",
            role: "Chief Financial Officer",
            bio: "Architecting the technical infrastructure and advanced curriculum frameworks.",
            image: "/CFO.jpeg"
        },
        {
            name: "Prince Das",
            role: "Chief Technical Officer",
            bio: "Ensuring our programs meet the highest pedagogical standards.",
            image: "/CTO.jpeg"
        },
        {
            name: "Bidyut Nayan Nath",
            role: "Chief Marketing Officer",
            bio: "Building long-term partnerships and expanding globally.",
            image: "/CMO.jpeg"
        }
    ];

    const teamMembers = [
        { name: "Apurba Sarmah", role: "Software Engineer", image: "/teams/1.jpeg" },
        { name: "Abhinash Sarmah", role: "AI Engineer", image: "/teams/2.jpeg" },
        { name: "Aleeza Khanam", role: "Business Development", image: "/teams/3.jpeg" },
        { name: "Manash Kumar Das", role: "3D Designer", image: "/teams/4.jpeg" },
        { name: "Gyandeep Duwarah", role: "Robotics Engineer", image: "/teams/5.jpeg" },
        { name: "Nirmal Jyoti Thakuria", role: "Hardware Engineer", image: "/teams/6.jpeg" },
        { name: "Himanta Bijoy Sarmah", role: "Sales & Marketing", image: "/teams/7.jpeg" },
        { name: "Jerifa Ahmed", role: "Operator Manager", image: "/teams/8.jpeg" },
        { name: "Nistha Rani Barphukon", role: "Robotics Engineer", image: "/teams/9.jpeg" },
        { name: "Riyan Rishav Deka", role: "Data Engineer", image: "/teams/10.jpeg" },
        { name: "Nayan Jyoti Athporia", role: "AI Engineer", image: "/teams/11.jpeg" },
        { name: "Tofajul Hoque", role: "Software Engineer", image: "/teams/12.jpeg" },
        { name: "Plaban Jyoti Rajhkhowa", role: "Designer", image: "/teams/13.jpeg" },
        { name: "Eshan Kashyap", role: "Backend Developer", image: "/teams/14.jpeg" },
        { name: "Divyam Bajpai", role: "Technical Manager", image: "/teams/15.jpeg" }
    ];

    return (
        <div className="relative min-h-[100dvh] w-full max-w-full bg-grid text-[#1a1a1a] font-sans overflow-x-hidden">
      
      <Breadcrumbs />

            {/* --- HERO SECTION --- */}
            <main className="relative w-full pt-32 lg:pt-48 pb-24 overflow-hidden border-b-2 border-[#111]">
                <div className="max-w-[1536px] mx-auto px-4 sm:px-8 lg:px-16 text-center reveal-on-scroll opacity-0 translate-y-12 transition-all duration-700">
                    <span className="font-mono text-sm font-bold uppercase tracking-widest text-[#ff5400] block mb-6">
                        [ Leadership ]
                    </span>
                    <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black uppercase tracking-tighter text-[#111] leading-[0.95] max-w-5xl mx-auto mt-6 mb-8">
                        The Minds Behind <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff5400] to-yellow-500">RADIX.</span>
                    </h1>
                    <p className="text-[#646a73] text-base sm:text-lg md:text-xl max-w-2xl mx-auto leading-relaxed font-medium">
                        Meet the engineers, educators, and visionaries dedicated to democratizing robotics education and building India's next generation of innovators.
                    </p>
                </div>
            </main>

            {/* --- DIRECTORS BENTO GRID --- */}
            <section className="relative z-10 w-full py-24 bg-white border-b-2 border-[#111]">
                <div className="max-w-[1536px] mx-auto px-4 sm:px-8 lg:px-16">
                    
                    <div className="mb-16 reveal-on-scroll opacity-0 translate-y-12 transition-all duration-700 flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <span className="font-mono text-sm font-bold uppercase tracking-widest text-[#ff5400] block mb-2">
                                // 01
                            </span>
                            <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-[#111]">Board of Directors</h2>
                        </div>
                    </div>

                    <div className="flex flex-col gap-4 md:gap-6 w-full max-w-[1200px] mx-auto">
                        {/* Top Row: 2 Wide Bento Cards */}
                        <div className="grid grid-cols-2 gap-4 md:gap-6 w-full">
                            {executiveDirectors.slice(0, 2).map((director, i) => (
                                <div key={i} className="relative bg-[#f2f3f5] border-2 border-[#111] overflow-hidden shadow-[6px_6px_0px_#111] aspect-[4/3] md:aspect-[16/9] w-full">
                                    <Image src={director.image} alt={director.name} fill className="object-cover object-[center_20%]" sizes="(max-width: 768px) 100vw, 50vw" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-[#111]/40 to-transparent opacity-90"></div>
                                    <div className="absolute bottom-0 left-0 w-full flex flex-col justify-end p-6 md:p-8 lg:p-10">
                                        <h3 className="text-2xl md:text-3xl lg:text-4xl font-black uppercase tracking-tighter text-white mb-2 leading-tight">{director.name}</h3>
                                        <p className="w-fit font-mono font-bold uppercase tracking-widest bg-white text-[#111] text-[10px] md:text-xs px-3 py-1.5">{director.role}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Bottom Row: 3 Square Bento Cards */}
                        <div className="grid grid-cols-3 gap-4 md:gap-6 w-full">
                            {executiveDirectors.slice(2, 5).map((director, i) => (
                                <div key={i + 2} className="relative bg-[#f2f3f5] border-2 border-[#111] overflow-hidden shadow-[6px_6px_0px_#111] aspect-[4/5] md:aspect-square w-full">
                                    <Image src={director.image} alt={director.name} fill className="object-cover object-top" sizes="(max-width: 768px) 100vw, 33vw" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-[#111]/60 to-transparent opacity-90"></div>
                                    <div className="absolute bottom-0 left-0 w-full flex flex-col justify-end p-4 md:p-6">
                                        <h3 className="text-lg md:text-xl lg:text-2xl font-black uppercase tracking-tighter text-white mb-2 leading-tight">{director.name}</h3>
                                        <p className="w-fit font-mono font-bold uppercase tracking-widest bg-white text-[#111] text-[9px] md:text-[10px] px-2.5 py-1">{director.role}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* --- TEAM GRID --- */}
            <section className="relative z-10 w-full py-24 bg-grid border-b-2 border-[#111]">
                <div className="max-w-[1536px] mx-auto px-4 sm:px-8 lg:px-16">
                    
                    <div className="mb-16 reveal-on-scroll opacity-0 translate-y-12 transition-all duration-700">
                        <span className="font-mono text-sm font-bold uppercase tracking-widest text-[#ff5400] block mb-2">
                            // 02
                        </span>
                        <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-[#111]">Core Team</h2>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 sm:gap-x-6 gap-y-10 sm:gap-y-12 max-w-7xl mx-auto">
                        {teamMembers.map((member, i) => (
                            <div key={i} className="reveal-on-scroll opacity-0 translate-y-12 transition-all duration-700 flex flex-col" style={{ transitionDelay: `${(i % 5) * 100}ms` }}>
                                {/* Brutalist Portrait Box */}
                                <div className="relative w-full aspect-square border-2 border-[#111] bg-[#111] mb-6 overflow-hidden shadow-[6px_6px_0px_#ff5400]">
                                    <Image src={member.image} alt={member.name} fill className="object-cover" sizes="250px" />
                                </div>
                                
                                <h3 className="text-base sm:text-xl font-black uppercase tracking-tighter text-[#111] mb-1 leading-[1.1]">{member.name}</h3>
                                <p className="text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-widest text-[#7b828e]">{member.role}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- CTA BANNER --- */}
            <section className="relative z-10 bg-[#111] py-24 px-4 sm:px-8 lg:px-16 overflow-hidden border-b-2 border-[#111]">
                <div className="max-w-[1536px] mx-auto flex flex-col md:flex-row items-center justify-between gap-12 text-center md:text-left relative z-10 reveal-on-scroll opacity-0 translate-y-12 transition-all duration-700">
                    <div>
                        <h3 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-white mb-4">Want to join the team?</h3>
                        <p className="text-[#a1a1aa] text-lg font-medium max-w-2xl">We are always looking for passionate educators and brilliant engineers to join our mission.</p>
                    </div>
                    <Link href="/contact" className="bg-[#ff5400] text-white border-2 border-transparent hover:border-white px-10 py-5 rounded-none font-black uppercase tracking-widest text-sm transition-all inline-flex items-center gap-3 transform hover:-translate-y-1 hover:shadow-[6px_6px_0px_white]">
                        Contact Us <ArrowRight size={16} />
                    </Link>
                </div>
            </section>

            <Footer />
        </div>
    );
}
