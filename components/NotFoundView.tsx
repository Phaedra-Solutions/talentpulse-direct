'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Home, 
  ArrowLeft,
  ArrowRight
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';

export function NotFoundView() {
  return (
    <div className="min-h-screen bg-[#F8F7F4] text-[#111113] flex flex-col font-sans selection:bg-[#FF4D00] selection:text-white">
      <Navbar />

      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8">
        <div className="max-w-2xl w-full text-center space-y-6 bg-white border-2 border-[#111113] p-8 sm:p-12 shadow-[8px_8px_0px_0px_#111113]">
          
          {/* Status Badge */}
          <div className="font-mono text-xs uppercase tracking-widest text-[#FF4D00] font-bold">
            [HTTP 404: RESOURCE NOT LOCATED]
          </div>

          {/* Heading */}
          <div className="space-y-3">
            <h1 className="font-syne font-extrabold text-4xl sm:text-6xl text-[#111113] leading-none">
              404 NOT FOUND
            </h1>
            <p className="font-sans text-sm sm:text-base text-[#111113]/80 max-w-lg mx-auto leading-relaxed">
              The candidate dossier, administrative endpoint, or engineering track route you requested does not exist on this cluster.
            </p>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4 font-mono text-xs">
            <Link
              href="/"
              className="btn-brutalist btn-brutalist-primary py-3 px-6"
            >
              <Home className="w-4 h-4" />
              <span>Back to Overview</span>
            </Link>

            <button
              onClick={() => {
                if (typeof window !== 'undefined') window.history.back();
              }}
              className="btn-brutalist py-3 px-6"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Previous Page</span>
            </button>
          </div>

          {/* Direct Technical Index */}
          <div className="pt-6 border-t-2 border-[#111113] text-left">
            <div className="font-mono text-xs uppercase tracking-widest text-[#FF4D00] font-bold mb-3">
              [AVAILABLE ROUTING DIRECTORY]
            </div>
            <div className="grid sm:grid-cols-3 gap-px bg-[#111113] border border-[#111113] font-mono text-xs">
              <Link
                href="/apply"
                className="p-3 bg-[#F8F7F4] hover:bg-white text-[#111113] transition-colors"
              >
                <span className="font-bold block">[01] /apply</span>
                <span className="text-[10px] text-[#111113]/60 uppercase">Candidate Flow</span>
              </Link>
              <Link
                href="/candidate/update"
                className="p-3 bg-[#F8F7F4] hover:bg-white text-[#111113] transition-colors"
              >
                <span className="font-bold block">[02] /candidate/update</span>
                <span className="text-[10px] text-[#111113]/60 uppercase">Availability Portal</span>
              </Link>
              <Link
                href="/admin/dashboard"
                className="p-3 bg-[#F8F7F4] hover:bg-white text-[#111113] transition-colors"
              >
                <span className="font-bold block">[03] /admin/dashboard</span>
                <span className="text-[10px] text-[#111113]/60 uppercase">Recruiter Pipeline</span>
              </Link>
            </div>
          </div>
        </div>
      </main>

      <footer className="px-4 sm:px-[4vw] py-8 font-mono text-xs border-t-2 border-[#111113] bg-[#F8F7F4]">
        <div className="max-w-7xl mx-auto flex justify-between">
          <div className="uppercase">
            <a
              href="https://www.phaedrasolutions.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#FF4D00] transition-colors"
            >
              Phaedra Solutions
            </a>{' '}
            © 2024 / 2026
          </div>
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
