"use client";

import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { UserButton } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function Header() {
  const { isSignedIn } = useUser();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    // Use setTimeout to avoid setState in effect warning
    const timer = setTimeout(() => {
      setMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);
  
  // Don't show header on workflow page (it has its own layout)
  if (pathname?.startsWith("/workflow")) {
    return null;
  }
  
  // Prevent hydration mismatch by not rendering user-dependent content until mounted
  const showUserButton = mounted && isSignedIn;
  const showSignIn = mounted && !isSignedIn;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              <div className="w-1 h-8 bg-gray-900"></div>
              <div className="w-1 h-6 bg-gray-900 mt-1"></div>
              <div className="w-1 h-7 bg-gray-900 mt-0.5"></div>
              <div className="w-1 h-5 bg-gray-900 mt-2"></div>
            </div>
            <span className="text-xl font-bold text-gray-900 tracking-tight">WEAVY</span>
            <div className="w-px h-6 bg-gray-400"></div>
            <span className="text-sm font-medium text-gray-600 uppercase tracking-wider">
              ARTISTIC INTELLIGENCE
            </span>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/workflows" className="text-sm font-medium text-gray-900 uppercase tracking-wide hover:text-gray-600 transition-colors">
              COLLECTIVE
            </Link>
            <Link href="/enterprise" className="text-sm font-medium text-gray-900 uppercase tracking-wide hover:text-gray-600 transition-colors">
              ENTERPRISE
            </Link>
            <Link href="/pricing" className="text-sm font-medium text-gray-900 uppercase tracking-wide hover:text-gray-600 transition-colors">
              PRICING
            </Link>
            <Link href="/demo" className="text-sm font-medium text-gray-900 uppercase tracking-wide hover:text-gray-600 transition-colors">
              REQUEST A DEMO
            </Link>
            {showUserButton ? (
              <UserButton afterSignOutUrl="/" />
            ) : showSignIn ? (
              <Link href="/sign-in" className="text-sm font-medium text-gray-900 uppercase tracking-wide hover:text-gray-600 transition-colors">
                SIGN IN
              </Link>
            ) : (
              <div className="w-20 h-6" /> // Placeholder to prevent layout shift
            )}
          </nav>

          {/* CTA Button */}
          {mounted ? (
            <Link
              href={isSignedIn ? "/workflow" : "/sign-up"}
              className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 px-6 py-2.5 text-sm font-semibold uppercase tracking-wide transition-colors relative"
            >
              Start Now
              <span className="absolute -top-1 -right-1 text-xs">★</span>
            </Link>
          ) : (
            <div className="bg-yellow-400 text-gray-900 px-6 py-2.5 text-sm font-semibold uppercase tracking-wide relative">
              Start Now
              <span className="absolute -top-1 -right-1 text-xs">★</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
