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
  Github
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { getCandidatesList } from '@/lib/candidate-store';
import { CandidateCard } from '@/components/CandidateCard';
import { CandidateDetailDrawer } from '@/components/CandidateDetailDrawer';
import { Candidate, PipelineStage } from '@/types/candidate';

export default function HomePage() {
  const [sampleCandidates, setSampleCandidates] = useState<Candidate[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    async function loadSample() {
      const { candidates } = await getCandidatesList();
      setSampleCandidates(candidates.slice(0, 3));
    }
    loadSample();
  }, []);

  const handleStageChange = async (id: string, stage: PipelineStage, notes: string) => {
    const { updateCandidateStageAndNotesRecord } = await import('@/lib/candidate-store');
    await updateCandidateStageAndNotesRecord(id, stage, notes);
    setSampleCandidates(prev => prev.map(c => c.id === id ? { ...c, pipeline_stage: stage, internal_notes: notes } : c));
  };

  return (
    <div className="min-h-screen bg-[#F8F7F4] text-[#111113] flex flex-col font-sans selection:bg-[#FF4D00] selection:text-white">
      <Navbar />

      {/* Hero Section - Variation 1 Editorial Brutalist */}
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

          {/* Huge Syne Display Heading */}
          <h1 className="font-syne font-extrabold text-[clamp(2.75rem,7.5vw,7.5rem)] leading-[0.92] tracking-[-0.04em] text-[#111113] uppercase mb-8">
            GLOBAL ON-DEMAND<br />
            <span className="text-[#111113]">ENGINEERING POOL</span>
          </h1>

          <div className="max-w-2xl mt-4">
            <p className="text-lg sm:text-2xl text-[#111113]/85 font-normal leading-relaxed mb-8">
              We connect elite AI Engineers, FDEs, and Systems Architects with global tech clients. No permanent placements. Pure delivery.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <Link href="/apply" className="btn-brutalist btn-brutalist-primary">
                <span>Join Talent Pool</span>
                <ArrowRight className="w-4 h-4" />
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

      {/* Tracks Section - Variation 1 Specification */}
      <section className="px-4 sm:px-[4vw] py-16 sm:py-20 border-b-2 border-[#111113]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between mb-10 gap-4">
            <div>
              <div className="font-mono text-xs uppercase tracking-widest text-[#FF4D00] mb-2 font-bold">
                [SPECIALIZATIONS]
              </div>
              <h2 className="font-syne font-extrabold text-4xl sm:text-5xl text-[#111113] tracking-tight">
                Tracks
              </h2>
            </div>
            <p className="font-mono text-xs text-[#111113]/70 uppercase tracking-wider max-w-md">
              Screened for high-concurrency production competence, timezone overlap, and direct English communication.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-[#111113] border-2 border-[#111113]">
            {/* Track 01 */}
            <div className="bg-[#F8F7F4] p-6 sm:p-8 flex flex-col justify-between group hover:bg-white transition-colors">
              <div>
                <div className="font-mono text-xs uppercase tracking-widest text-[#FF4D00] font-bold mb-4">[01]</div>
                <h3 className="font-syne font-bold text-2xl text-[#111113] mb-3 group-hover:text-[#FF4D00] transition-colors">
                  AI &amp; LLM Engineers
                </h3>
                <p className="text-sm text-[#111113]/80 leading-relaxed font-sans mb-6">
                  Fine-tuning models and high-throughput inference. Multi-agent workflows, vLLM microservices, and specialized RAG pipelines.
                </p>
              </div>
              <div className="border-t border-[#111113]/20 pt-4 font-mono text-[11px] text-[#111113]/60 uppercase">
                PyTorch • vLLM • LoRA • Triton
              </div>
            </div>

            {/* Track 02 */}
            <div className="bg-[#F8F7F4] p-6 sm:p-8 flex flex-col justify-between group hover:bg-white transition-colors">
              <div>
                <div className="font-mono text-xs uppercase tracking-widest text-[#FF4D00] font-bold mb-4">[02]</div>
                <h3 className="font-syne font-bold text-2xl text-[#111113] mb-3 group-hover:text-[#FF4D00] transition-colors">
                  Forward Deployed
                </h3>
                <p className="text-sm text-[#111113]/80 leading-relaxed font-sans mb-6">
                  Embed with enterprise clients to build integrations. Direct customer engineering, API conduits, and bespoke micro-apps.
                </p>
              </div>
              <div className="border-t border-[#111113]/20 pt-4 font-mono text-[11px] text-[#111113]/60 uppercase">
                Go • Python • K8s • Webhooks
              </div>
            </div>

            {/* Track 03 */}
            <div className="bg-[#F8F7F4] p-6 sm:p-8 flex flex-col justify-between group hover:bg-white transition-colors">
              <div>
                <div className="font-mono text-xs uppercase tracking-widest text-[#FF4D00] font-bold mb-4">[03]</div>
                <h3 className="font-syne font-bold text-2xl text-[#111113] mb-3 group-hover:text-[#FF4D00] transition-colors">
                  Mobile Developers
                </h3>
                <p className="text-sm text-[#111113]/80 leading-relaxed font-sans mb-6">
                  High-performance apps for all platforms. Offline-first architectures, low-latency audio/video streaming, and mobile SDKs.
                </p>
              </div>
              <div className="border-t border-[#111113]/20 pt-4 font-mono text-[11px] text-[#111113]/60 uppercase">
                React Native • Swift • Kotlin
              </div>
            </div>

            {/* Track 04 */}
            <div className="bg-[#F8F7F4] p-6 sm:p-8 flex flex-col justify-between group hover:bg-white transition-colors">
              <div>
                <div className="font-mono text-xs uppercase tracking-widest text-[#FF4D00] font-bold mb-4">[04]</div>
                <h3 className="font-syne font-bold text-2xl text-[#111113] mb-3 group-hover:text-[#FF4D00] transition-colors">
                  Solutions Architects
                </h3>
                <p className="text-sm text-[#111113]/80 leading-relaxed font-sans mb-6">
                  Cloud infrastructure and scalable microservices. Multi-region redundancy, distributed event messaging, and database clustering.
                </p>
              </div>
              <div className="border-t border-[#111113]/20 pt-4 font-mono text-[11px] text-[#111113]/60 uppercase">
                AWS • GCP • Terraform • Kafka
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Talent Dossiers */}
      <section className="px-4 sm:px-[4vw] py-16 sm:py-20 border-b-2 border-[#111113]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
            <div>
              <div className="font-mono text-xs uppercase tracking-widest text-[#FF4D00] mb-2 font-bold">
                [LIVE TALENT STREAM]
              </div>
              <h2 className="font-syne font-extrabold text-3xl sm:text-4xl text-[#111113]">
                Available Contract Engineers
              </h2>
              <p className="font-mono text-xs text-[#111113]/70 uppercase tracking-wider mt-2">
                Click any dossier to open technical artifacts, video walkthroughs, and hourly contract rates.
              </p>
            </div>

            <Link
              href="/admin/dashboard"
              className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest font-bold text-[#111113] hover:text-[#FF4D00] transition-colors"
            >
              <span>View Full Pipeline</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {sampleCandidates.map((candidate) => (
              <CandidateCard
                key={candidate.id}
                candidate={candidate}
                onSelect={(cand) => {
                  setSelectedCandidate(cand);
                  setIsDrawerOpen(true);
                }}
              />
            ))}
          </div>
        </div>
      </section>

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

      {/* Footer - Variation 1 Exact Specification */}
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

      {/* Candidate Dossier Drawer */}
      <CandidateDetailDrawer
        candidate={selectedCandidate}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onStageChange={handleStageChange}
      />
    </div>
  );
}
