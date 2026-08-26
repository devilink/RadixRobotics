"use client";
import Image from 'next/image';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { useEffect } from 'react';
import Link from 'next/link';
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
            role: "CEO & Co-Founder",
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
        { name: "Nirmal Jyoti Thakuria", role: "Developer", image: "/teams/6.jpeg" },
        { name: "Himanta Bijoy Sarmah", role: "Sales & Marketing", image: "/teams/7.jpeg" },
        { name: "Jerifa Ahmed", role: "Operatior Manager", image: "/teams/8.jpeg" },
        { name: "Nistha Rani Barphukon", role: "Robotics Engineer", image: "/teams/9.jpeg" },
        { name: "Riyan Rishav Deka", role: "Data Engineer", image: "/teams/10.jpeg" },
        { name: "Nayan Jyoti Athporia", role: "AI Engineer", image: "/teams/11.jpeg" },
        { name: "Tofajul Hoque", role: "Software Engineer", image: "/teams/12.jpeg" },
        { name: "Plaban Jyoti Rajhkhowa", role: "Designer", image: "/teams/13.jpeg" },
        { name: "Eshan Kashyap", role: "Backend Developer", image: "/teams/14.jpeg" },
        { name: "Divyam Bajpai", role: "Technical Manager", image: "/teams/15.jpeg" }
    ];

    return (
        <div className="relative min-h-screen font-sans text-[#1a1a1a]">
            
            {/* --- NOTEBOOK PAPER BACKGROUND --- */}
            <div className="fixed inset-0 z-[-1] h-full w-full bg-notebook-subtle pointer-events-none"></div>

            {/* --- HERO SECTION --- */}
            <section className="relative w-full pt-48 pb-24 overflow-hidden">
                <div className="max-w-[1536px] mx-auto px-8 lg:px-16 text-center reveal-on-scroll opacity-0 translate-y-12 transition-all duration-700">
                    <span className="text-blue-600 font-bold text-xs tracking-[0.2em] uppercase mb-4 flex items-center justify-center gap-4 bg-white/80 backdrop-blur-sm px-4 py-1 rounded-full border border-blue-100 w-fit mx-auto">
                         Leadership
                    </span>
                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold leading-[1.05] tracking-tighter text-black max-w-5xl mx-auto mt-6 mb-8">
                        The Minds Behind <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-400">RADIX.</span>
                    </h1>
                    <p className="text-gray-500 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed font-light">
                        Meet the engineers, educators, and visionaries dedicated to democratizing robotics education and building India's next generation of innovators.
                    </p>
                </div>
            </section>

            {/* --- DIRECTORS BENTO GRID --- */}
            <section className="relative z-10 w-full pb-24">
                <div className="max-w-[1536px] mx-auto px-8 lg:px-16">
                    <div className="mb-12 reveal-on-scroll opacity-0 translate-y-12 transition-all duration-700">
                        <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-black">Board of Directors</h2>
                        <div className="w-16 h-1 bg-blue-600 mt-4"></div>
                    </div>
                    <div className="grid grid-cols-6 gap-4 md:gap-6">
                        {executiveDirectors.map((director, i) => (
                            <div key={i} className={`reveal-on-scroll opacity-0 translate-y-12 transition-all duration-700 group relative bg-white/60 backdrop-blur-xl border border-gray-200 rounded-[2rem] overflow-hidden hover:shadow-2xl hover:shadow-blue-900/10 hover:-translate-y-1 aspect-[4/5] md:aspect-[3/4] lg:aspect-[4/5] ${
                                i < 2 ? 'col-span-3' : 'col-span-2'
                            }`} style={{ transitionDelay: `${i * 100}ms` }}>
                                <Image src={director.image} alt={director.name} fill className="object-cover object-top" sizes="(max-width: 768px) 100vw, 50vw" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-500"></div>
                                <div className={`absolute bottom-0 left-0 w-full flex flex-col justify-end ${i < 2 ? 'p-4 md:p-10' : 'p-3 md:p-8'}`}>
                                    <h3 className={`${i < 2 ? 'text-xl md:text-3xl lg:text-4xl' : 'text-xs sm:text-sm md:text-2xl lg:text-3xl'} font-bold text-white mb-1 group-hover:text-blue-400 transition-colors duration-300 leading-tight`}>{director.name}</h3>
                                    <p className={`w-fit font-bold uppercase tracking-widest bg-blue-600 text-white rounded-lg ${i < 2 ? 'text-[10px] md:text-sm px-3 py-1.5 mb-1 md:mb-4' : 'text-[9px] md:text-xs px-2.5 py-1 mb-1 md:mb-2'}`}>{director.role}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- TEAM CIRCLE GRID --- */}
            <section className="relative z-10 w-full pb-32">
                <div className="max-w-[1536px] mx-auto px-8 lg:px-16">
                    <div className="mb-12 reveal-on-scroll opacity-0 translate-y-12 transition-all duration-700">
                        <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-black">Core Team</h2>
                        <div className="w-16 h-1 bg-blue-600 mt-4"></div>
                    </div>
                    <div className="grid grid-cols-3 gap-x-8 gap-y-16 max-w-6xl mx-auto">
                        {teamMembers.map((member, i) => (
                            <div key={i} className="reveal-on-scroll opacity-0 translate-y-12 transition-all duration-700 flex flex-col items-center text-center group cursor-pointer" style={{ transitionDelay: `${(i % 3) * 100}ms` }}>
                                <div className="relative w-32 h-32 md:w-48 md:h-48 rounded-full overflow-hidden mb-6 border-4 border-white shadow-xl group-hover:border-blue-500 transition-colors duration-500 group-hover:shadow-blue-500/20">
                                    <Image src={member.image} alt={member.name} fill className="object-cover" sizes="200px" />
                                </div>
                                <h3 className="text-xl md:text-2xl font-bold text-black mb-1 group-hover:text-blue-600 transition-colors duration-300">{member.name}</h3>
                                <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-gray-500">{member.role}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- CTA BANNER --- */}
            <section className="relative z-10 bg-black py-24 max-md:py-16 px-8 lg:px-16 overflow-hidden group border-t border-gray-900">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center opacity-20 group-hover:opacity-30 group-hover:scale-105 transition-all duration-1000 grayscale"></div>
                <div className="absolute inset-0 bg-blue-600 mix-blend-multiply opacity-50"></div>

                <div className="max-w-[1536px] mx-auto flex flex-col lg:flex-row items-center justify-between gap-12 text-center lg:text-left relative z-10 reveal-on-scroll opacity-0 translate-y-12 transition-all duration-700">
                    <div>
                        <h3 className="text-3xl md:text-5xl font-bold text-white tracking-tight mb-4">Want to join the team?</h3>
                        <p className="text-gray-300 text-lg md:text-xl max-w-2xl font-light">We are always looking for passionate educators and brilliant engineers to join our mission.</p>
                    </div>
                    <a href="mailto:radixrobotics@gmail.com" className="bg-white text-black hover:bg-blue-600 hover:text-white px-10 py-5 rounded-xl font-bold uppercase tracking-widest text-sm transition-all duration-500 inline-flex items-center gap-3 transform hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-600/30">
                        Email Us <ArrowRight size={16} />
                    </a>
                </div>
            </section>

            {/* --- FOOTER (MODERN & AESTHETIC) --- */}
            <footer className="relative z-10 bg-[#050505] text-white pt-32 pb-12 overflow-hidden border-t border-gray-900">
                <div className="absolute top-0 left-0 w-full overflow-hidden flex justify-center pointer-events-none opacity-[0.03] select-none">
                    <h1 className="text-[25vw] font-bold leading-none tracking-tighter translate-y-[-20%]">RADIX</h1>
                </div>

                <div className="max-w-[1536px] mx-auto px-8 lg:px-16 relative z-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-16 lg:gap-8 mb-24 reveal-on-scroll opacity-0 translate-y-12 transition-all duration-700">
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
                                {[{name: 'About', href: '/about'}, {name: 'Programs', href: '/#programs'}, {name: 'Team', href: '/team'}, {name: 'Impact', href: '/#impact'}].map((item) => (
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
