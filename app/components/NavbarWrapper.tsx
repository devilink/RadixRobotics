"use client";

import { usePathname } from 'next/navigation';
import Navbar from './Navbar';

export default function NavbarWrapper() {
  const pathname = usePathname();

  // List of path prefixes where the global Navbar should NOT be shown
  const hiddenPaths = [
    '/super-admin',
    '/erp',
    '/school-admin',
    '/login',
    '/update-password',
    '/student',
    '/curriculum',
    '/kits',
    '/auth'
  ];

  const shouldHideNavbar = hiddenPaths.some(path => pathname?.startsWith(path));

  const isHomePage = pathname === '/';

  if (shouldHideNavbar) {
    return null;
  }

  return <Navbar darkHero={isHomePage} />;
}
