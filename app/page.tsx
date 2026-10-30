'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  ArrowRight, 
  ArrowUpRight,
  ShieldCheck,
  Clock,
  Video,
  Layers,
  Terminal,
  Cpu,
  Smartphone,
  CheckCircle2,
  Linkedin,
  Instagram,
  AtSign,
  Twitter,
  Github,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Role } from '@/types/roles-tech';
import { getRolesList } from '@/lib/roles-tech-store';
import { getSeoSettings, FaqItem } from '@/lib/seo-service';
import { FaqJsonLd } from '@/components/seo/StructuredData';

export default function HomePage() {
  const [activeRoles, setActiveRoles] = useState<Role[]>([]);
  const [futureRoles, setFutureRoles] = useState<Role[]>([]);
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [allRoles, seo] = await Promise.all([
          getRolesList(true),
          getSeoSettings(),
        ]);
        setActiveRoles(allRoles.filter(r => r.status === 'open'));
        setFutureRoles(allRoles.filter(r => r.status === 'closed'));
        if (seo && Array.isArray(seo.faq_items)) {
          setFaqs(seo.faq_items.filter(f => f.is_active));
        }
      } catch (err) {
        console.error('Failed to load overview data', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-[#F8F7F4] text-[#111113] flex flex-col font-sans selection:bg-[#FF4D00] selection:text-white">
      <Navbar />

      {/* Hero Section - Editorial Brutalist */}
      <section className="px-4 sm:px-[4vw] py-16 sm:py-24 border-b-2 border-[#111113] relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          {/* Metadata Tagline */}
          <div className="flex flex-wrap items-center gap-3 mb-6 font-mono text-xs uppercase tracking-[0.15em] text-[#111113]/70">
            <span className="text-[#FF4D00] font-bold">[CONTRACTUAL INFRASTRUCTURE]</span>
            <span className="hidden sm:inline">•</span>
            <span>[STRICT CLIENT TIMEZONE OVERLAP]</span>
            <span className="hidden sm:inline">•</span>
            <span>[NO PERMANENT PLACEMENTS]</span>
          </div>

          {/* Syne Display Heading */}
          <h1 className="font-syne font-extrabold text-[clamp(2.75rem,7.5vw,7.5rem)] leading-[0.92] tracking-[-0.04em] text-[#111113] uppercase mb-8">
            GLOBAL ON-DEMAND<br />
            <span className="text-[#111113]">ENGINEERING POOL</span>
          </h1>

          <div className="max-w-2xl mt-4">
            <p className="text-lg sm:text-2xl text-[#111113]/85 font-normal leading-relaxed mb-8">
              We connect elite AI Engineers, FDEs, and Systems Architects with global tech clients. No permanent placements. Pure delivery.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <Link href="/hire" className="btn-brutalist btn-brutalist-primary">
                <span>Hire Contract Talent</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link href="/apply" className="btn-brutalist">
                <span>Join Talent Pool</span>
              </Link>

              <Link href="/candidate/update" className="btn-brutalist">
                <span>Update Availability</span>
              </Link>

              <Link href="/admin/dashboard" className="btn-brutalist border-dashed">
                <span>HR Pipeline</span>
              </Link>
            </div>
          </div>

          {/* Key Metrics Strip - Brutalist Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-[#111113] border-2 border-[#111113] mt-16 text-left">
            <div className="bg-[#F8F7F4] p-5 sm:p-6">
              <div className="font-mono text-[10px] uppercase tracking-widest text-[#111113]/60 mb-1">[METRIC 01]</div>
              <div className="font-syne font-extrabold text-3xl sm:text-4xl text-[#111113]">48 HRS</div>
              <div className="font-mono text-xs text-[#111113]/70 mt-1 uppercase">Vetting to Deploy</div>
            </div>
            <div className="bg-[#F8F7F4] p-5 sm:p-6">
              <div className="font-mono text-[10px] uppercase tracking-widest text-[#111113]/60 mb-1">[METRIC 02]</div>
              <div className="font-syne font-extrabold text-3xl sm:text-4xl text-[#FF4D00]">100%</div>
              <div className="font-mono text-xs text-[#111113]/70 mt-1 uppercase">Contractual Pure</div>
            </div>
            <div className="bg-[#F8F7F4] p-5 sm:p-6">
              <div className="font-mono text-[10px] uppercase tracking-widest text-[#111113]/60 mb-1">[METRIC 03]</div>
              <div className="font-syne font-extrabold text-3xl sm:text-4xl text-[#111113]">4 - 8 HRS</div>
              <div className="font-mono text-xs text-[#111113]/70 mt-1 uppercase">Daily Overlap</div>
            </div>
            <div className="bg-[#F8F7F4] p-5 sm:p-6">
              <div className="font-mono text-[10px] uppercase tracking-widest text-[#111113]/60 mb-1">[METRIC 04]</div>
              <div className="font-syne font-extrabold text-3xl sm:text-4xl text-[#111113]">VERIFIED</div>
              <div className="font-mono text-xs text-[#111113]/70 mt-1 uppercase">Artifacts &amp; Pitches</div>
            </div>
          </div>
        </div>
      </section>

      {/* ACTIVE TRACKS SECTION (Open Roles Only) */}
      <section className="px-4 sm:px-[4vw] py-16 sm:py-20 border-b-2 border-[#111113]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between mb-10 gap-4">
            <div>
              <div className="font-mono text-xs uppercase tracking-widest text-[#FF4D00] mb-2 font-bold flex items-center gap-2">
                <span className="w-2 h-2 bg-[#FF4D00] inline-block animate-pulse" />
                <span>[ACTIVE TRACKS • IMMEDIATE ENGAGEMENTS]</span>
              </div>
              <h2 className="font-syne font-extrabold text-4xl sm:text-5xl text-[#111113] tracking-tight">
                Specialized Engineering Tracks
              </h2>
            </div>
            <p className="font-mono text-xs text-[#111113]/70 uppercase tracking-wider max-w-md">
              Screened for high-concurrency production competence, timezone overlap, and direct English communication. Click any tile to inspect full specifications.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-[#111113] border-2 border-[#111113]">
            {activeRoles.map((role, idx) => {
              const coreTechs = (role.technologies || [])
                .filter(t => t.is_featured)
                .slice(0, 5)
                .map(t => t.name);

              const displayTechs = coreTechs.length > 0
                ? coreTechs.join(' • ')
                : (role.technologies || []).slice(0, 4).map(t => t.name).join(' • ');

              return (
                <Link
                  key={role.id}
                  href={`/roles/${role.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#F8F7F4] p-6 sm:p-8 flex flex-col justify-between group hover:bg-white transition-all relative cursor-pointer"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4 font-mono text-xs uppercase tracking-widest font-bold">
                      <span className="text-[#FF4D00]">[0{idx + 1}]</span>
                      <span className="text-[#111113]/60 group-hover:text-[#FF4D00] transition-colors flex items-center gap-1 text-[11px]">
                        <span>Specification</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </span>
                    </div>

                    <h3 className="font-syne font-bold text-2xl text-[#111113] mb-3 group-hover:text-[#FF4D00] transition-colors">
                      {role.title}
                    </h3>

                    <p className="text-sm text-[#111113]/80 leading-relaxed font-sans mb-6">
                      {role.short_description}
                    </p>
                  </div>

                  <div className="border-t border-[#111113]/20 pt-4 font-mono text-[11px] text-[#111113]/60 uppercase flex items-center justify-between">
                    <span className="truncate pr-2">{displayTechs || 'Multi-stack verified'}</span>
                    <ArrowRight className="w-3.5 h-3.5 shrink-0 text-[#111113]/40 group-hover:text-[#FF4D00] group-hover:translate-x-1 transition-all" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* FUTURE TRACKS SECTION (Closed Roles) */}
      {futureRoles.length > 0 && (
        <section className="px-4 sm:px-[4vw] py-16 sm:py-20 border-b-2 border-[#111113] bg-[#F2F0EB]">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between mb-10 gap-4">
              <div>
                <div className="font-mono text-xs uppercase tracking-widest text-[#111113]/70 mb-2 font-bold flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-[#FF4D00]" />
                  <span>[FUTURE TRACKS • UPCOMING TALENT POOLS]</span>
                </div>
                <h2 className="font-syne font-extrabold text-3xl sm:text-4xl text-[#111113] tracking-tight">
                  Upcoming Strategic Specializations
                </h2>
              </div>
              <p className="font-mono text-xs text-[#111113]/70 uppercase tracking-wider max-w-md">
                Pre-registering elite practitioners for forthcoming client mandates. Applications are reviewed for early onboarding.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-[#111113] border-2 border-[#111113]">
              {futureRoles.map((role) => {
                const coreTechs = (role.technologies || [])
                  .slice(0, 4)
                  .map(t => t.name)
                  .join(' • ');

                return (
                  <Link
                    key={role.id}
                    href={`/roles/${role.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white/80 p-6 sm:p-8 flex flex-col justify-between group hover:bg-white transition-all cursor-pointer border-dashed"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4 font-mono text-[10px] uppercase tracking-widest font-bold">
                        <span className="bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5">
                          Future Track
                        </span>
                        <span className="text-[#111113]/60 group-hover:text-[#FF4D00] transition-colors flex items-center gap-1">
                          <span>Details</span>
                          <ExternalLink className="w-3 h-3" />
                        </span>
                      </div>

                      <h3 className="font-syne font-bold text-2xl text-[#111113] mb-3 group-hover:text-[#FF4D00] transition-colors">
                        {role.title}
                      </h3>

                      <p className="text-sm text-[#111113]/80 leading-relaxed font-sans mb-6">
                        {role.short_description}
                      </p>
                    </div>

                    <div className="border-t border-[#111113]/20 pt-4 font-mono text-[11px] text-[#111113]/60 uppercase flex items-center justify-between">
                      <span className="truncate pr-2">{coreTechs || 'Curated roadmap'}</span>
                      <ArrowRight className="w-3.5 h-3.5 shrink-0 text-[#111113]/40 group-hover:text-[#FF4D00] group-hover:translate-x-1 transition-all" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Vetting Protocol Section */}
      <section className="px-4 sm:px-[4vw] py-16 sm:py-20 border-b-2 border-[#111113]">
        <div className="max-w-7xl mx-auto">
          <div className="mb-10">
            <div className="font-mono text-xs uppercase tracking-widest text-[#FF4D00] mb-2 font-bold">
              [VETTING PROTOCOL]
            </div>
            <h2 className="font-syne font-extrabold text-3xl sm:text-4xl text-[#111113]">
              Four-Phase Contractual Verification
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-[#111113] border-2 border-[#111113]">
            <div className="bg-[#F8F7F4] p-6">
              <div className="font-mono text-xs uppercase tracking-widest text-[#111113]/50 font-bold mb-3">[STAGE 01]</div>
              <h4 className="font-syne font-bold text-lg text-[#111113] mb-2">Strict Agreement</h4>
              <p className="text-xs text-[#111113]/75 leading-relaxed font-sans">
                Binding acceptance that engagements are strictly contractual, with defined deliverable milestones and zero permanent overhead.
              </p>
            </div>

            <div className="bg-[#F8F7F4] p-6">
              <div className="font-mono text-xs uppercase tracking-widest text-[#111113]/50 font-bold mb-3">[STAGE 02]</div>
              <h4 className="font-syne font-bold text-lg text-[#111113] mb-2">Timezone Mapping</h4>
              <p className="text-xs text-[#111113]/75 leading-relaxed font-sans">
                Engineers specify target regions (US EST/PST, EMEA, APAC) with 4 to 8 hours guaranteed simultaneous client collaboration.
              </p>
            </div>

            <div className="bg-[#F8F7F4] p-6">
              <div className="font-mono text-xs uppercase tracking-widest text-[#111113]/50 font-bold mb-3">[STAGE 03]</div>
              <h4 className="font-syne font-bold text-lg text-[#111113] mb-2">Video Pitch Vetting</h4>
              <p className="text-xs text-[#111113]/75 leading-relaxed font-sans">
                Mandatory Loom or YouTube recording demonstrating architectural fluency, system trade-offs, and clear communication.
              </p>
            </div>

            <div className="bg-[#F8F7F4] p-6">
              <div className="font-mono text-xs uppercase tracking-widest text-[#111113]/50 font-bold mb-3">[STAGE 04]</div>
              <h4 className="font-syne font-bold text-lg text-[#111113] mb-2">Direct Deployment</h4>
              <p className="text-xs text-[#111113]/75 leading-relaxed font-sans">
                Streamlined contract activation with pre-negotiated USD rates, direct client channels, and daily asynchronous standups.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* JSON-LD Structured Data for FAQs */}
      <FaqJsonLd faqs={faqs} />

      {/* Frequently Asked Questions Section (Schema-supported) */}
      {faqs.length > 0 && (
        <section className="px-4 sm:px-[4vw] py-16 sm:py-24 border-b-2 border-[#111113] bg-white">
          <div className="max-w-5xl mx-auto">
            <div className="font-mono text-xs uppercase tracking-widest text-[#FF4D00] font-bold mb-3">
              [FREQUENTLY ASKED QUESTIONS]
            </div>
            <h3 className="text-3xl sm:text-4xl font-syne font-black tracking-tight text-[#111113] mb-4">
              Everything You Need to Know About TalentPulse
            </h3>
            <p className="text-sm font-mono text-[#111113]/60 mb-12 max-w-2xl">
              Transparent terms, rigorous vetting metrics, and zero-risk trial structures designed for high-velocity engineering organizations.
            </p>

            <div className="divide-y-2 divide-[#111113] border-y-2 border-[#111113]">
              {faqs.map((faq, idx) => (
                <details key={faq.id || idx} className="group py-6 cursor-pointer">
                  <summary className="flex items-center justify-between font-syne font-bold text-lg sm:text-xl text-[#111113] list-none select-none">
                    <span className="flex items-start gap-4">
                      <span className="font-mono text-sm text-[#FF4D00] mt-1 font-bold">
                        {String(idx + 1).padStart(2, '0')}.
                      </span>
                      <span>{faq.question}</span>
                    </span>
                    <span className="ml-4 font-mono text-xl font-bold text-[#FF4D00] transition-transform duration-200 group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <div className="mt-4 pl-10 text-sm text-[#111113]/75 leading-relaxed font-sans max-w-3xl">
                    {faq.answer}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="mt-auto px-4 sm:px-[4vw] py-12 font-mono text-xs border-t-2 border-[#111113] bg-[#F8F7F4]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="font-bold tracking-wider uppercase text-[#111113]">
            <a
              href="https://www.phaedrasolutions.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#FF4D00] transition-colors underline underline-offset-4 decoration-[#FF4D00]"
            >
              Phaedra Solutions
            </a>{' '}
            © 2024 / 2026
          </div>

          <div className="flex items-center gap-6 text-[#111113]/80 uppercase tracking-widest text-[11px]">
            <Link href="/" className="hover:text-[#FF4D00] transition-colors">Overview</Link>
            <Link href="/candidate/update" className="hover:text-[#FF4D00] transition-colors">Candidate Portal</Link>
          </div>

          <div className="flex items-center gap-3 text-[#111113]">
            <a
              href="https://www.linkedin.com/company/phaedra-solutions"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              title="LinkedIn"
              className="p-2 border border-[#111113] hover:bg-[#111113] hover:text-[#F8F7F4] transition-colors"
            >
              <Linkedin className="w-4 h-4" />
            </a>
            <a
              href="https://www.instagram.com/phaedrasolutions"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              title="Instagram"
              className="p-2 border border-[#111113] hover:bg-[#111113] hover:text-[#F8F7F4] transition-colors"
            >
              <Instagram className="w-4 h-4" />
            </a>
            <a
              href="https://www.threads.net/@phaedrasolutions"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Threads"
              title="Threads"
              className="p-2 border border-[#111113] hover:bg-[#111113] hover:text-[#F8F7F4] transition-colors"
            >
              <AtSign className="w-4 h-4" />
            </a>
            <a
              href="https://x.com/phaedrasolution"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="X"
              title="X"
              className="p-2 border border-[#111113] hover:bg-[#111113] hover:text-[#F8F7F4] transition-colors"
            >
              <Twitter className="w-4 h-4" />
            </a>
            <a
              href="https://github.com/phaedrasolutions"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
              title="GitHub"
              className="p-2 border border-[#111113] hover:bg-[#111113] hover:text-[#F8F7F4] transition-colors"
            >
              <Github className="w-4 h-4" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
