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

  const navLinks = [
    { href: '/', label: 'Overview' },
    { href: '/candidate/update', label: 'Candidate Portal' },
  ];

  return (
    <>
      {/* Top Technical Metadata Bar */}
      <div className="bg-[#111113] text-[#F8F7F4] border-b border-[#111113] text-[11px] font-mono tracking-wider px-4 sm:px-8 py-2">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="bg-[#FF4D00] text-white px-2 py-0.5 text-[10px] font-bold tracking-widest uppercase">
              Contractual Only
            </span>
            <span className="opacity-75 hidden md:inline">
              [ZERO PERMANENT PLACEMENTS] • [4+ HRS CLIENT OVERLAP] • [DIRECT DEPLOYMENT]
            </span>
          </div>

          <div className="flex items-center gap-4 text-[10px]">
            <a
              href="https://www.phaedrasolutions.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 opacity-80 hover:opacity-100 hover:text-[#FF4D00] transition-colors uppercase font-mono tracking-wider"
            >
              Powered by Phaedra Solutions
            </a>
          </div>
        </div>
      </div>

      {/* Main Header - Variation 1 Editorial Brutalist */}
      <header className="sticky top-0 z-40 bg-[#F8F7F4] border-b-2 border-[#111113] px-4 sm:px-8 py-4 sm:py-5 transition-colors">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-baseline gap-2 group">
            <span className="font-syne font-extrabold text-2xl sm:text-3xl tracking-tight text-[#111113]">
              TALENTPULSE
            </span>
            <span className="font-mono text-xs uppercase tracking-[0.2em] font-bold text-[#FF4D00]">
              DIRECT
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 lg:gap-8">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`font-mono uppercase text-xs tracking-[0.15em] transition-all py-1 border-b-2 ${
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

          {/* Right Action */}
          <div className="flex items-center gap-3">
            <Link
              href="/apply"
              className="btn-brutalist btn-brutalist-primary text-xs py-2 px-4 sm:px-5"
            >
              Join Talent Pool
            </Link>
          </div>
        </div>
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
