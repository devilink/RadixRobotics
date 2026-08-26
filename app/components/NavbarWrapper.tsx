"use client";

import { usePathname } from 'next/navigation';
import Navbar from './Navbar';

export default function NavbarWrapper() {
  const pathname = usePathname();

  // List of path prefixes where the global Navbar should NOT be shown
  const hiddenPaths = [
    '/super-admin',
    '/school-admin',
    '/login',
    '/update-password',
    '/student',
    '/curriculum',
    '/auth'
  ];

  const shouldHideNavbar = hiddenPaths.some(path => pathname?.startsWith(path));

  if (shouldHideNavbar) {
    return null;
  }

  return <Navbar />;
}
