'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Database, X, ShieldCheck, Info } from 'lucide-react';
import { isSupabaseConfigured } from '@/lib/supabase/client';

export function Navbar() {
  const pathname = usePathname();
  const [showDbModal, setShowDbModal] = useState(false);
  const isConnected = isSupabaseConfigured;

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: '/', label: 'Overview' },
  ];

  const legalLinks = [
    { href: '/privacy', label: 'Privacy Policy' },
    { href: '/terms', label: 'Terms of Use' },
  ];

  // Automatically close mobile menu upon subsequent route navigations
  const isFirstRender = React.useRef(true);
  React.useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setMobileMenuOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Top Technical Metadata Bar */}
      <div className="bg-[#111113] text-[#F8F7F4] border-b border-[#111113] text-[11px] font-mono tracking-wider px-3 sm:px-8 py-2">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 sm:gap-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="bg-[#FF4D00] text-white px-2 py-0.5 text-[9px] sm:text-[10px] font-bold tracking-widest uppercase shrink-0">
              Contractual Only
            </span>
            <span className="opacity-75 text-[10px] sm:text-[11px] hidden md:inline">
              [ZERO PERMANENT PLACEMENTS] • [4+ HRS CLIENT OVERLAP] • [DIRECT DEPLOYMENT]
            </span>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 text-[10px]">
            <Link
              href="/privacy"
              className="opacity-75 hover:opacity-100 hover:text-[#FF4D00] transition-colors uppercase font-mono tracking-wider hidden sm:inline"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="opacity-75 hover:opacity-100 hover:text-[#FF4D00] transition-colors uppercase font-mono tracking-wider hidden sm:inline"
            >
              Terms
            </Link>
            <a
              href="https://www.phaedrasolutions.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 opacity-80 hover:opacity-100 hover:text-[#FF4D00] transition-colors uppercase font-mono tracking-wider truncate max-w-[190px] sm:max-w-none"
            >
              Powered by Phaedra Solutions
            </a>
          </div>
        </div>
      </div>

      {/* Main Header - Editorial Brutalist */}
      <header className="sticky top-0 z-40 bg-[#F8F7F4] border-b-2 border-[#111113] px-3 sm:px-8 py-2.5 sm:py-4 transition-colors">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-3">
          {/* Logo */}
          <Link href="/" className="flex items-baseline gap-1.5 sm:gap-2 group">
            <span className="font-syne font-extrabold text-lg sm:text-2xl md:text-3xl tracking-tight text-[#111113] whitespace-nowrap">
              TALENTPULSE
            </span>
            <span className="font-mono text-[10px] sm:text-xs uppercase tracking-[0.15em] sm:tracking-[0.2em] font-bold text-[#FF4D00] shrink-0">
              DIRECT
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 lg:gap-8">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`font-mono uppercase text-xs tracking-[0.15em] transition-all py-1 border-b-2 min-h-[36px] inline-flex items-center ${
                    isActive
                      ? 'border-[#FF4D00] text-[#111113] font-bold'
                      : 'border-transparent text-[#111113]/70 hover:text-[#111113] hover:border-[#111113]'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Action & Mobile Toggle */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Desktop CTAs (Hidden on mobile, available in mobile dropdown menu) */}
            <div className="hidden md:flex items-center gap-2 sm:gap-3">
              <Link
                href="/hire"
                className="btn-brutalist text-xs py-2 px-3 sm:px-4 min-h-[40px] inline-flex items-center"
              >
                Hire Talent
              </Link>
              <Link
                href="/apply"
                className="btn-brutalist btn-brutalist-primary text-xs py-2 px-3 sm:px-4 min-h-[40px] inline-flex items-center"
              >
                <span>Join Talent Pool</span>
              </Link>
            </div>

            {/* Mobile Hamburger Toggle Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Close main navigation' : 'Open main navigation'}
              aria-expanded={mobileMenuOpen}
              className="md:hidden p-2.5 border-2 border-[#111113] bg-white hover:bg-[#111113] hover:text-white transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer shrink-0"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5 text-[#FF4D00]" />
              ) : (
                <div className="w-5 h-4 flex flex-col justify-between">
                  <span className="w-full h-0.5 bg-current" />
                  <span className="w-full h-0.5 bg-current" />
                  <span className="w-full h-0.5 bg-current" />
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t-2 border-[#111113] mt-3 pt-3 pb-2 space-y-3 bg-[#F8F7F4] animate-in slide-in-from-top-2 duration-150">
            <nav className="flex flex-col space-y-1 font-mono text-xs uppercase tracking-wider">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`py-3 px-3 border border-[#111113]/20 flex items-center justify-between ${
                      isActive
                        ? 'bg-[#111113] text-white font-bold'
                        : 'bg-white hover:bg-zinc-100 text-[#111113]'
                    }`}
                  >
                    <span>{link.label}</span>
                    {isActive && <span className="text-[#FF4D00] font-bold">●</span>}
                  </Link>
                );
              })}

              <div className="pt-2 grid grid-cols-2 gap-2">
                <Link
                  href="/hire"
                  onClick={() => setMobileMenuOpen(false)}
                  className="btn-brutalist text-center justify-center py-2.5 text-xs font-mono font-bold"
                >
                  Hire Talent
                </Link>
                <Link
                  href="/apply"
                  onClick={() => setMobileMenuOpen(false)}
                  className="btn-brutalist btn-brutalist-primary text-center justify-center py-2.5 text-xs font-mono font-bold"
                >
                  Join Pool
                </Link>
              </div>

              {/* Legal shortcuts in mobile drawer (Admin portal removed) */}
              <div className="pt-3 border-t border-[#111113]/20 flex items-center justify-start gap-4 text-[11px] text-[#111113]/70 font-mono">
                {legalLinks.map((leg) => (
                  <Link
                    key={leg.href}
                    href={leg.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="hover:text-[#FF4D00] underline underline-offset-2 py-1"
                  >
                    {leg.label}
                  </Link>
                ))}
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Supabase Status Modal (Brutalist Restyle) */}
      {showDbModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#111113]/70 backdrop-blur-xs">
          <div className="bg-[#F8F7F4] border-2 border-[#111113] max-w-lg w-full p-6 sm:p-8 relative shadow-[8px_8px_0px_0px_#111113]">
            <button
              onClick={() => setShowDbModal(false)}
              className="absolute top-4 right-4 p-1 border border-[#111113] hover:bg-[#111113] hover:text-[#F8F7F4] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="font-mono text-xs uppercase tracking-widest text-[#FF4D00] mb-1">
              [DATABASE ARCHITECTURE]
            </div>
            <h3 className="font-syne font-bold text-2xl text-[#111113] mb-4">
              {isConnected ? 'Supabase Database Connected' : 'Local Storage Active'}
            </h3>

            <p className="text-sm text-[#111113]/80 leading-relaxed mb-6 font-sans">
              {isConnected
                ? 'Your deployment is streaming queries directly from your live Supabase cloud database instance.'
                : 'Operating in self-contained fallback mode with full local candidate state persistence, multi-stage pipeline, and single admin authorization.'}
            </p>

            <div className="border border-[#111113] p-4 bg-white mb-6 font-mono text-xs space-y-2">
              <div className="font-bold uppercase tracking-wider text-[#111113] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#FF4D00]" />
                Single Admin Gate Status
              </div>
              <div className="text-[#111113]/70">
                Target: <span className="text-[#111113] font-bold">admin@talentpulse.com</span>
              </div>
              <div className="text-[#111113]/70">
                Auth: <span className="text-[#111113] font-bold">Encrypted PBKDF2 Password Required</span>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setShowDbModal(false)}
                className="btn-brutalist btn-brutalist-primary text-xs py-2 px-6"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
