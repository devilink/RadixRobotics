"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

export default function Breadcrumbs() {
  const pathname = usePathname();
  
  if (pathname === "/") return null;

  const pathSegments = pathname.split("/").filter((segment) => segment !== "");

  return (
    <nav aria-label="Breadcrumb" className="w-full py-4 px-4 sm:px-8 md:px-[60px] bg-[#111317] border-b border-white/5">
      <ol className="flex items-center space-x-2 text-xs sm:text-sm font-medium text-[#7b828e] font-sans">
        <li>
          <Link href="/" className="hover:text-white transition-colors flex items-center">
            <Home size={14} className="mr-1" />
            <span className="sr-only">Home</span>
            Home
          </Link>
        </li>
        
        {pathSegments.map((segment, index) => {
          const href = `/${pathSegments.slice(0, index + 1).join("/")}`;
          const isLast = index === pathSegments.length - 1;
          const label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ");

          return (
            <li key={segment} className="flex items-center space-x-2">
              <ChevronRight size={14} className="text-[#3b3f46]" />
              {isLast ? (
                <span className="text-white font-bold" aria-current="page">
                  {label}
                </span>
              ) : (
                <Link href={href} className="hover:text-white transition-colors">
                  {label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
