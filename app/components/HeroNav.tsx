"use client";

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronDown, ArrowRight } from 'lucide-react';
import gsap from 'gsap';

export default function HeroNav() {
  const droneRef = useRef(null);

  useEffect(() => {
    if (droneRef.current) {
      // Antigravity floating animation
      gsap.to(droneRef.current, {
        y: -30,
        rotationZ: 2,
        rotationX: 5,
        duration: 3.5,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
      });
    }
  }, []);

  return (
    <div className="relative min-h-screen bg-white overflow-hidden font-sans">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image 
          src="/bg.png" 
          alt="Mountain Background" 
          fill 
          className="object-cover object-center"
          priority 
        />
      </div>

      {/* Navbar */}
      <nav className="absolute top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-24">
            
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center gap-2 cursor-pointer">
              <span className="text-4xl font-black tracking-tighter text-gray-900">R</span>
              <div className="flex flex-col leading-none">
                <span className="font-bold tracking-wide text-sm text-gray-900">RADIX</span>
                <span className="text-[10px] tracking-[0.25em] text-gray-600">ROBOTICS</span>
              </div>
            </div>

            {/* Nav Links */}
            <div className="hidden md:flex items-center space-x-8">
              <Link href="#" className="flex items-center text-sm font-medium text-gray-900 hover:text-blue-500 transition-colors">
                Education <ChevronDown className="ml-1 w-4 h-4 opacity-50" />
              </Link>
              <Link href="#" className="flex items-center text-sm font-medium text-gray-900 hover:text-blue-500 transition-colors">
                Labs <ChevronDown className="ml-1 w-4 h-4 opacity-50" />
              </Link>
              <Link href="#" className="flex items-center text-sm font-medium text-gray-900 hover:text-blue-500 transition-colors">
                Products <ChevronDown className="ml-1 w-4 h-4 opacity-50" />
              </Link>
              <Link href="#" className="flex items-center text-sm font-medium text-gray-900 hover:text-blue-500 transition-colors">
                R&D
              </Link>
              <Link href="#" className="flex items-center text-sm font-medium text-gray-900 hover:text-blue-500 transition-colors">
                Drone Division
              </Link>
              <Link href="#" className="flex items-center text-sm font-medium text-gray-900 hover:text-blue-500 transition-colors">
                Team <ChevronDown className="ml-1 w-4 h-4 opacity-50" />
              </Link>
              <Link href="#" className="flex items-center text-sm font-medium text-gray-900 hover:text-blue-500 transition-colors">
                About Us <ChevronDown className="ml-1 w-4 h-4 opacity-50" />
              </Link>
            </div>

            {/* CTA Button */}
            <div className="hidden md:flex">
              <button className="flex items-center justify-center bg-black text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors shadow-lg">
                Get in Touch <ArrowRight className="ml-2 w-4 h-4" />
              </button>
            </div>

          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full min-h-screen flex items-center">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 w-full mt-20 md:mt-0 items-center">
          
          {/* Left Column - Content */}
          <div className="flex flex-col items-start">
            <span className="text-blue-500 font-bold tracking-[0.2em] uppercase text-sm mb-6">
              LEARN. BUILD. INNOVATE.
            </span>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 leading-[1.1] mb-6 tracking-tight">
              Building India's<br/>
              Next Generation of<br/>
              <span className="text-blue-500">Future Tech.</span>
            </h1>
            
            <p className="text-lg md:text-xl text-gray-600 mb-10 max-w-lg leading-relaxed font-medium">
              Engineering the future through Robotics Education, Research, AI, Drones and Innovation.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <button className="flex items-center justify-center bg-black text-white px-8 py-3.5 rounded-xl font-medium hover:bg-gray-900 transition-colors shadow-lg text-sm md:text-base w-full sm:w-auto">
                Explore Education <ArrowRight className="ml-2 w-5 h-5" />
              </button>
              <button className="flex items-center justify-center bg-transparent border border-gray-300 text-gray-900 px-8 py-3.5 rounded-xl font-medium hover:border-gray-500 hover:bg-gray-50 transition-all text-sm md:text-base w-full sm:w-auto">
                Research & Development <ArrowRight className="ml-2 w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Right Column - Image */}
          <div className="relative h-[500px] md:h-[700px] w-full flex items-center justify-center pointer-events-none">
             <div ref={droneRef} className="relative w-[130%] h-[130%] lg:w-[150%] lg:h-[150%] lg:-right-20">
               <Image 
                 src="/drone.png" 
                 alt="Antigravity Drone" 
                 fill 
                 className="object-contain drop-shadow-2xl" 
                 priority 
               />
             </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
