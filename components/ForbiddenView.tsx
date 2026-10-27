'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Lock, 
  Home, 
  ArrowLeft,
  ShieldAlert
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { AUTHORIZED_ADMIN_EMAIL } from '@/lib/auth/recruiter-auth';

export function ForbiddenView() {
  return (
    <div className="min-h-screen bg-[#F8F7F4] text-[#111113] flex flex-col font-sans selection:bg-[#FF4D00] selection:text-white">
      <Navbar />

      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8">
        <div className="max-w-xl w-full text-center space-y-6 bg-white border-2 border-[#111113] p-8 sm:p-12 shadow-[8px_8px_0px_0px_#111113]">
          
          {/* Status Badge */}
          <div className="font-mono text-xs uppercase tracking-widest text-[#FF4D00] font-bold">
            [HTTP 403: CLEARANCE FORBIDDEN]
          </div>

          {/* Heading */}
          <div className="space-y-3">
            <h1 className="font-syne font-extrabold text-4xl sm:text-5xl text-[#111113] leading-none">
              403 FORBIDDEN
            </h1>
            <p className="font-sans text-sm sm:text-base text-[#111113]/80 max-w-lg mx-auto leading-relaxed">
              You do not have administrative clearance to access confidential candidate dossiers, contact numbers, or internal interview notes.
            </p>
          </div>

          {/* Security Enforcement Callout */}
          <div className="p-4 border-2 border-[#111113] bg-[#F8F7F4] text-left font-mono text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold uppercase text-[#111113] flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-[#FF4D00]" />
                Designated Admin Access Only
              </span>
              <span className="text-[10px] text-[#FF4D00] font-bold uppercase">
                [PBKDF2 SHA-512]
              </span>
            </div>
            
            <p className="text-[#111113]/70">
              Pipeline clearance is exclusively provisioned for:
            </p>
            
            <div className="p-2 border border-[#111113] bg-white text-[#111113] font-bold">
              admin@talentpulse.com
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 font-mono text-xs">
            <Link
              href="/admin/login?redirect=/admin/dashboard"
              className="w-full sm:w-auto btn-brutalist btn-brutalist-primary py-3 px-6"
            >
              <Lock className="w-4 h-4" />
              <span>Admin Login Page</span>
            </Link>

            <Link
              href="/"
              className="w-full sm:w-auto btn-brutalist py-3 px-6"
            >
              <Home className="w-4 h-4" />
              <span>Overview</span>
            </Link>
          </div>
        </div>
      </main>

      <footer className="px-4 sm:px-[4vw] py-8 font-mono text-xs border-t-2 border-[#111113] bg-[#F8F7F4]">
        <div className="max-w-7xl mx-auto flex justify-between">
          <div className="uppercase">CONTRACTUAL INFRASTRUCTURE © 2024 / 2026</div>
          <div className="flex gap-4">
            <Link href="/403" className="hover:text-[#FF4D00]">403</Link>
            <Link href="/errors/404" className="hover:text-[#FF4D00]">404</Link>
            <Link href="/errors/500" className="hover:text-[#FF4D00]">500</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
