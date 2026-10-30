import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  Terminal, 
  Briefcase, 
  Layers,
  Sparkles
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { MarkdownViewer } from '@/components/MarkdownViewer';
import { getRoleBySlugOrId } from '@/lib/roles-tech-store';

export default async function RoleDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { slug } = await params;
  const { from } = await searchParams;
  const role = await getRoleBySlugOrId(slug);

  if (!role) {
    notFound();
  }

  const isFromApply = from === 'apply';
  const isOpen = role.status === 'open';

  return (
    <div className="min-h-screen bg-[#F8F7F4] text-[#111113] flex flex-col font-sans selection:bg-[#FF4D00] selection:text-white">
      <Navbar />

      <main className="flex-1 py-12 px-4 sm:px-[4vw] max-w-5xl mx-auto w-full space-y-10">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between gap-4 font-mono text-xs uppercase tracking-wider text-[#111113]/70 border-b border-[#111113]/10 pb-4">
          <div className="flex items-center gap-2">
            <Link href="/" className="hover:text-[#FF4D00] transition-colors">
              Tracks
            </Link>
            <span>/</span>
            <span className="text-[#111113] font-bold">{role.title}</span>
          </div>

          <Link
            href="/"
            className="flex items-center gap-1.5 hover:text-[#FF4D00] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>All Specializations</span>
          </Link>
        </div>

        {/* Hero Role Header */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3 font-mono text-xs uppercase tracking-widest">
            {isOpen ? (
              <span className="bg-[#111113] text-white px-2.5 py-1 text-[11px] font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 bg-[#FF4D00] inline-block" />
                Active Track • Immediate Deployments
              </span>
            ) : (
              <span className="bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-1 text-[11px] font-bold flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-[#FF4D00]" />
                Future Track • Upcoming Client Mandates
              </span>
            )}
            <span className="text-[#111113]/60">•</span>
            <span className="text-[#111113]/70 font-bold">[CONTRACTUAL ONLY]</span>
            <span className="text-[#111113]/60">•</span>
            <span className="text-[#111113]/70">[STRICT TIMEZONE OVERLAP]</span>
          </div>

          <h1 className="font-syne font-extrabold text-4xl sm:text-6xl text-[#111113] uppercase tracking-tight">
            {role.title}
          </h1>

          {role.short_description && (
            <p className="text-base sm:text-xl text-[#111113]/85 max-w-3xl leading-relaxed">
              {role.short_description}
            </p>
          )}
        </div>

        {/* Quick Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-[#111113] border-2 border-[#111113]">
          <div className="bg-[#F8F7F4] p-5">
            <div className="font-mono text-[10px] uppercase text-[#111113]/60 font-bold mb-1">
              [TIMEZONE OVERLAP]
            </div>
            <div className="font-syne font-bold text-xl text-[#111113]">4 - 8 Hours / Day</div>
            <p className="font-mono text-xs text-[#111113]/70 mt-1">
              Direct sprint synchronization with US &amp; EU engineering leads
            </p>
          </div>

          <div className="bg-[#F8F7F4] p-5">
            <div className="font-mono text-[10px] uppercase text-[#111113]/60 font-bold mb-1">
              [ENGAGEMENT MODEL]
            </div>
            <div className="font-syne font-bold text-xl text-[#FF4D00]">Contractual Pure</div>
            <p className="font-mono text-xs text-[#111113]/70 mt-1">
              Milestone or hourly sprint contracts with zero permanent overhead
            </p>
          </div>

          <div className="bg-[#F8F7F4] p-5">
            <div className="font-mono text-[10px] uppercase text-[#111113]/60 font-bold mb-1">
              [VETTING CADENCE]
            </div>
            <div className="font-syne font-bold text-xl text-[#111113]">48-Hour Turnaround</div>
            <p className="font-mono text-xs text-[#111113]/70 mt-1">
              Screening of technical artifacts, Loom pitches, and system architecture
            </p>
          </div>
        </div>

        {/* Detailed Job Description (Markdown Rendered) */}
        <div className="p-6 sm:p-8 bg-white border-2 border-[#111113] shadow-[4px_4px_0px_0px_#111113] space-y-4">
          <div className="font-mono text-xs uppercase tracking-widest text-[#FF4D00] font-bold">
            [ROLE SPECIFICATION &amp; TECHNICAL EXPECTATIONS]
          </div>
          <MarkdownViewer content={role.description} />
        </div>

        {/* Approved Core Technologies */}
        {role.technologies && role.technologies.length > 0 && (
          <div className="p-6 sm:p-8 bg-white border-2 border-[#111113] shadow-[4px_4px_0px_0px_#111113] space-y-4">
            <div className="flex items-center justify-between">
              <div className="font-mono text-xs uppercase tracking-widest text-[#FF4D00] font-bold flex items-center gap-2">
                <Terminal className="w-4 h-4" />
                <span>Approved Technologies &amp; Tooling ({role.technologies.length})</span>
              </div>
              <span className="font-mono text-[10px] text-[#111113]/60 uppercase">
                Vetted Core Stack
              </span>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              {role.technologies.map((tech) => (
                <div
                  key={tech.id}
                  className={`px-3 py-1.5 border-2 border-[#111113] font-mono text-xs font-bold flex items-center gap-2 ${
                    tech.is_featured
                      ? 'bg-[#111113] text-white shadow-[2px_2px_0px_0px_#FF4D00]'
                      : 'bg-[#F8F7F4] text-[#111113]'
                  }`}
                >
                  <span>{tech.name}</span>
                  {tech.is_featured && (
                    <span className="text-[9px] uppercase px-1 bg-[#FF4D00] text-white font-bold">
                      Core
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Call to Action Strip */}
        <div className="p-8 bg-[#111113] text-white border-2 border-[#111113] shadow-[6px_6px_0px_0px_#FF4D00] flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="font-mono text-xs uppercase tracking-widest text-[#FF4D00] font-bold">
              {isOpen ? '[ACCEPTING APPLICATIONS]' : '[FUTURE TRACK POOL]'}
            </div>
            <h3 className="font-syne font-extrabold text-2xl uppercase">
              Ready to deploy as {role.title}?
            </h3>
            <p className="font-mono text-xs text-white/70 max-w-xl">
              {isOpen
                ? 'Join our vetted on-demand engineering pool. Screening takes 48 hours.'
                : 'Submit your credentials today to be first in line when new mandates open.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              href={`/hire?role=${role.slug}`}
              className="btn-brutalist bg-white text-[#111113] hover:bg-neutral-200 py-3.5 px-6 text-sm flex items-center gap-2 font-mono uppercase"
            >
              <span>Hire for this Role</span>
            </Link>

            <Link
              href={`/apply?role=${role.slug}`}
              className="btn-brutalist btn-brutalist-primary py-3.5 px-6 text-sm flex items-center gap-2 font-mono uppercase"
            >
              <span>{isFromApply ? 'Interested / Select Role' : 'Apply for this Role'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
