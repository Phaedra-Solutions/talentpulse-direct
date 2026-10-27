'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  AlertOctagon, 
  RefreshCw, 
  Home, 
  Terminal, 
  Copy, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  ShieldAlert,
  Bug
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';

interface ServerErrorViewProps {
  error?: Error & { digest?: string };
  reset?: () => void;
  showNavbar?: boolean;
}

export function ServerErrorView({ 
  error, 
  reset,
  showNavbar = true 
}: ServerErrorViewProps) {
  const [showTrace, setShowTrace] = useState(false);
  const [copied, setCopied] = useState(false);

  const errorTitle = error?.name || 'InternalServerError';
  const errorMessage = error?.message || 'A critical runtime exception halted server-side processing for this request.';
  const [errorDigest] = useState(() => error?.digest || 'ERR_PULSE_500_SYSTEM');
  const errorStack = error?.stack || `Error: ${errorMessage}
    at CandidatePipelineController.executeRequest (/app/api/pipeline/route.ts:42:15)
    at async NextNodeServer.handleCatchallRenderRequest (next/server/app-render.js:1284:22)
    at async processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async Server.renderToHTML (/node_modules/next/dist/server/render.js:342:19)`;

  const handleCopyTrace = async () => {
    try {
      const payload = `--- TalentPulse Direct Diagnostics ---
Status: 500 Internal Server Error
Time: ${new Date().toISOString()}
Error Name: ${errorTitle}
Message: ${errorMessage}
Digest: ${errorDigest}

Stack Trace:
${errorStack}`;

      await navigator.clipboard.writeText(payload);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F7F4] text-[#111113] flex flex-col font-sans selection:bg-[#FF4D00] selection:text-white">
      {showNavbar && <Navbar />}

      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8">
        <div className="max-w-2xl w-full text-center space-y-6 bg-white border-2 border-[#111113] p-8 sm:p-12 shadow-[8px_8px_0px_0px_#111113]">
          
          {/* Status Badge */}
          <div className="font-mono text-xs uppercase tracking-widest text-[#FF4D00] font-bold">
            [HTTP 500: RUNTIME EXCEPTION HALT]
          </div>

          {/* Heading */}
          <div className="space-y-2">
            <h1 className="font-syne font-extrabold text-4xl sm:text-5xl text-[#111113] leading-none">
              500 SERVER ERROR
            </h1>
            
            {/* Description with the interactive '.' linked to toggle error trace */}
            <p className="font-sans text-sm sm:text-base text-[#111113]/80 max-w-xl mx-auto leading-relaxed">
              We encountered an unexpected server exception while processing candidate operations or pipeline data
              <button
                type="button"
                onClick={() => setShowTrace(prev => !prev)}
                title="Click this '.' to inspect the runtime error trace"
                aria-label="Toggle runtime error trace details"
                className={`inline-block font-extrabold text-lg transition-all duration-150 px-0.5 rounded cursor-pointer select-none focus:outline-hidden ${
                  showTrace 
                    ? 'text-[#FF4D00] underline scale-125 font-black' 
                    : 'text-[#111113] hover:text-[#FF4D00] hover:scale-125'
                }`}
              >
                .
              </button>
            </p>
          </div>

          {/* Interactive Hint Banner when trace is collapsed */}
          <div className="flex items-center justify-center gap-2 font-mono text-[11px] text-[#111113]/60">
            <span>TIP: CLICK THE</span>
            <button
              onClick={() => setShowTrace(prev => !prev)}
              className="inline-flex items-center justify-center w-5 h-5 border border-[#111113] bg-[#F8F7F4] hover:bg-[#FF4D00] hover:text-white text-[#FF4D00] font-black cursor-pointer transition-colors"
              title="Click to toggle error trace"
            >
              .
            </button>
            <span>TO EXPAND RUNTIME STACK DIAGNOSTICS</span>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2 font-mono text-xs">
            {reset ? (
              <button
                onClick={() => reset()}
                className="btn-brutalist btn-brutalist-primary py-3 px-6"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Retry Operation</span>
              </button>
            ) : (
              <button
                onClick={() => window.location.reload()}
                className="btn-brutalist btn-brutalist-primary py-3 px-6"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload Page</span>
              </button>
            )}

            <Link
              href="/"
              className="btn-brutalist py-3 px-6"
            >
              <Home className="w-4 h-4" />
              <span>Return Home</span>
            </Link>

            <button
              type="button"
              onClick={() => setShowTrace(prev => !prev)}
              className="btn-brutalist py-3 px-4 border-dashed"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>{showTrace ? 'Hide Trace' : 'Expand Trace'}</span>
              {showTrace ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Expandable Error Trace Drawer */}
          {showTrace && (
            <div className="w-full text-left mt-6 border-2 border-[#111113] bg-[#111113] shadow-[4px_4px_0px_0px_#111113] overflow-hidden">
              
              {/* Terminal Title Bar */}
              <div className="flex items-center justify-between px-4 py-2.5 bg-[#111113] border-b border-white/20 font-mono text-xs text-white">
                <span className="flex items-center gap-2">
                  <Bug className="w-3.5 h-3.5 text-[#FF4D00]" />
                  <span>RUNTIME EXCEPTION TRACE (EXPANDED VIA &apos;.&apos;)</span>
                </span>

                <button
                  onClick={handleCopyTrace}
                  className="px-2.5 py-1 border border-white text-white hover:bg-white hover:text-[#111113] transition-colors uppercase font-bold text-[10px]"
                  title="Copy full trace to clipboard"
                >
                  {copied ? '[COPIED!]' : '[COPY TRACE]'}
                </button>
              </div>

              {/* Terminal Body */}
              <div className="p-4 sm:p-5 font-mono text-xs space-y-3 max-h-[380px] overflow-y-auto text-[#F8F7F4]">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pb-3 border-b border-white/10 text-[11px]">
                  <div>
                    <span className="text-white/50 uppercase">Exception: </span>
                    <span className="text-[#FF4D00] font-bold">{errorTitle}</span>
                  </div>
                  <div>
                    <span className="text-white/50 uppercase">Digest: </span>
                    <span className="text-white font-semibold">{errorDigest}</span>
                  </div>
                </div>

                <div>
                  <span className="text-white/50 block mb-1 uppercase text-[10px]">Message:</span>
                  <p className="p-2.5 border border-white/20 bg-black text-white break-words">
                    {errorMessage}
                  </p>
                </div>

                <div>
                  <div className="text-white/50 mb-1 uppercase text-[10px]">Stack Execution Frame:</div>
                  <pre className="p-3 border border-white/20 bg-black text-white/90 overflow-x-auto whitespace-pre font-mono text-[11px] leading-relaxed">
                    {errorStack}
                  </pre>
                </div>
              </div>

              {/* Terminal Footer */}
              <div className="px-4 py-2 border-t border-white/20 bg-black font-mono text-[10px] text-white/60 flex items-center justify-between">
                <span>TALENTPULSE DIAGNOSTIC ENGINE</span>
                <button
                  onClick={() => setShowTrace(false)}
                  className="hover:text-white uppercase underline"
                >
                  [Collapse Trace]
                </button>
              </div>
            </div>
          )}

          {/* Quick Route Links */}
          <div className="pt-6 border-t-2 border-[#111113] flex flex-wrap items-center justify-center gap-6 font-mono text-xs">
            <Link href="/admin/dashboard" className="hover:text-[#FF4D00] transition">
              [HR Pipeline]
            </Link>
            <Link href="/apply" className="hover:text-[#FF4D00] transition">
              [Apply]
            </Link>
            <Link href="/candidate/update" className="hover:text-[#FF4D00] transition">
              [Availability]
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
