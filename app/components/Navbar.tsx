"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Menu, X, ChevronRight } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

export interface NavLink {
  name: string;
  href: string;
}

interface NavbarProps {
  navLinks?: NavLink[];
}

const defaultNavLinks: NavLink[] = [
  { name: 'Services', href: '/services' },
  { name: 'Projects', href: '/projects' },
  { name: 'About', href: '/about' },
  { name: 'Team', href: '/team' },
];

export default function Navbar({ navLinks = defaultNavLinks }: NavbarProps) {
  const [user, setUser] = useState<any>(null);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  const getSchoolPortalUrl = () => {
    if (!user) return '/login';
    const email = user.email || '';
    if (email === 'princedas000555@gmail.com') return '/super-admin';
    if (email.endsWith('@radix.school')) {
      const schoolId = email.replace('@radix.school', '').toUpperCase();
      return `/curriculum/${schoolId}`;
    }
    return '/login';
  };

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-[#faf8f5]/95 backdrop-blur-md shadow-sm py-3 border-b border-[#e8e0d4]' : 'bg-transparent py-4 sm:py-5'
      }`}>
        <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-16 flex items-center justify-between">

          {/* Logo */}
          <Link href="/" className="shrink-0 cursor-pointer flex items-center gap-2 lg:gap-3 group">
            <Image
              src="/imgw.PNG"
              alt="RADIX Symbol"
              width={200}
              height={200}
              className="h-8 sm:h-10 lg:h-11 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
              priority
            />
            <Image
              src="/txtw.jpeg"
              alt="RADIX Robotics"
              width={600}
              height={200}
              className="h-5 sm:h-6 lg:h-7 w-auto object-contain"
              priority
            />
          </Link>

          {/* Desktop Nav Links */}
          <div className="hide-on-mobile items-center gap-2 xl:gap-7 text-[10px] lg:text-xs font-bold uppercase tracking-widest text-[#4a4a4a]">
            {navLinks.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="nav-link hover:text-[#1a1a1a] py-1.5 transition-colors"
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* CTA / Auth */}
          <div className="shrink-0 flex items-center gap-2 lg:gap-4">
            <div className="hide-on-mobile items-center gap-2 lg:gap-4">
              {user ? (
                <>
                  <button
                    onClick={handleLogout}
                    className="text-xs font-bold uppercase tracking-widest text-[#8a8a8a] hover:text-[#FF6B6B] transition-colors"
                  >
                    Logout
                  </button>
                  <Link
                    href={getSchoolPortalUrl()}
                    className="bg-[#1a1a1a] text-white px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 hover:bg-[#333] transition-all shadow-sm"
                  >
                    Portal <ArrowRight size={14} />
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="text-xs font-bold uppercase tracking-widest text-[#4a4a4a] hover:text-[#1a1a1a] transition-colors px-3 py-2"
                  >
                    Login
                  </Link>
                  <a
                    href="https://wa.me/916001979712?text=Hello%20Radix%20Robotics,%20we%20would%20like%20to%20consult%20about%20the%20Founding%20School%20Lab%20Cohort"
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="sticker sticker-dark text-[10px] px-4 py-2"
                  >
                    Schedule Audit <ArrowRight size={12} />
                  </a>
                </>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button
              className="hide-on-desktop p-2 text-[#1a1a1a] hover:text-[#FF6B6B] transition-colors"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open Navigation Menu"
            >
              <Menu size={26} />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation Drawer */}
      <div
        style={{ zIndex: 100 }}
        className={`fixed inset-0 bg-[#faf8f5] flex flex-col p-6 sm:p-8 transition-transform duration-300 ease-in-out hide-on-desktop ${
          mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex justify-between items-center pb-5 border-b border-[#e8e0d4]">
          <Link href="/" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2">
            <Image src="/imgw.PNG" alt="RADIX Symbol" width={160} height={160} className="h-8 w-auto object-contain" priority />
            <Image src="/txtw.jpeg" alt="RADIX Robotics" width={400} height={160} className="h-5 w-auto object-contain" priority />
          </Link>
          <button onClick={() => setMobileMenuOpen(false)} className="p-2 text-[#8a8a8a] hover:text-[#1a1a1a]">
            <X size={24} />
          </button>
        </div>

        <div className="flex flex-col gap-4 text-base sm:text-lg font-bold uppercase tracking-wider mt-6 overflow-y-auto">
          {navLinks.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className="text-[#4a4a4a] hover:text-[#1a1a1a] transition-colors border-b border-[#e8e0d4] pb-3 flex items-center justify-between"
            >
              <span>{item.name}</span>
              <ChevronRight size={16} className="text-[#d4c9b8]" />
            </Link>
          ))}
        </div>

        <div className="mt-auto flex flex-col gap-3 pt-4 border-t border-[#e8e0d4]">
          {user ? (
            <>
              <Link
                href={getSchoolPortalUrl()}
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-3.5 rounded-lg bg-[#1a1a1a] text-white font-bold text-center uppercase tracking-widest text-xs flex items-center justify-center gap-2"
              >
                School Portal <ArrowRight size={14} />
              </Link>
              <button
                onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                className="text-[#FF6B6B] font-bold py-2 text-center w-full uppercase tracking-widest text-xs"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-3 rounded-lg border border-[#e8e0d4] text-[#4a4a4a] font-bold text-center uppercase tracking-widest text-xs"
              >
                Login to Portal
              </Link>
              <a
                href="https://wa.me/916001979712?text=Hello%20Radix%20Robotics"
                target="_blank"
                rel="noopener noreferrer nofollow"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-3.5 rounded-lg bg-[#FFE66D] text-[#1a1a1a] font-bold text-center uppercase tracking-widest text-xs shadow-sm"
              >
                Schedule Consultation
              </a>
            </>
          )}
        </div>
      </div>
    </>
  );
}
