import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import { Navbar } from '@/components/Navbar';
import { 
  Scale, 
  FileText, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  Briefcase, 
  DollarSign, 
  ArrowLeft, 
  ChevronRight, 
  AlertTriangle,
  Mail,
  Zap,
  Lock
} from 'lucide-react';

import { constructMetadataForPath } from '@/lib/seo-service';

export async function generateMetadata(): Promise<Metadata> {
  return constructMetadataForPath('/terms', {
    fallbackTitle: 'Commercial Terms of Use | TalentPulse Direct',
    fallbackDescription: 'Enterprise terms governing contractual staffing, 4+ hour timezone overlap, 2-week risk-free trial, non-circumvention, and 100% client intellectual property ownership.',
  });
}

export default function TermsOfUsePage() {
  const lastUpdated = 'November 3, 2026';

  const schemaJson = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    'headline': 'TalentPulse Direct Commercial Terms of Use',
    'description': 'Commercial terms governing contractual placements, 4-hour timezone overlap guarantee, 2-week risk-free trial, and intellectual property assignment.',
    'datePublished': '2026-11-03',
    'dateModified': '2026-11-03',
    'author': {
      '@type': 'Organization',
      'name': 'TalentPulse Global Technologies Inc.',
      'url': 'https://talentpulse.dev'
    },
    'publisher': {
      '@type': 'Organization',
      'name': 'TalentPulse Global Technologies Inc.',
      'logo': {
        '@type': 'ImageObject',
        'url': 'https://talentpulse.dev/logo.png'
      }
    }
  };

  const sections = [
    { id: 'acceptance', label: '1. Acceptance & Agreement' },
    { id: 'model', label: '2. Operating Model & Standards' },
    { id: 'candidates', label: '3. Candidate Terms' },
    { id: 'clients', label: '4. Client Terms & Billing' },
    { id: 'circumvention', label: '5. Non-Circumvention (12 Mos)' },
    { id: 'ip', label: '6. Work Product & IP (100% Client)' },
    { id: 'prohibited', label: '7. Prohibited Misuse' },
    { id: 'warranty', label: '8. Warranty Disclaimers' },
    { id: 'liability', label: '9. Limitation of Liability' },
    { id: 'indemnity', label: '10. Indemnification' },
    { id: 'governing', label: '11. Governing Law & Arbitration' },
    { id: 'contact', label: '12. Legal Contact' },
  ];

  return (
    <div className="min-h-screen bg-[#F8F7F4] text-[#111113] flex flex-col font-sans selection:bg-[#FF4D00] selection:text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaJson) }}
      />

      <Navbar />

      {/* Header Banner */}
      <section className="border-b-2 border-[#111113] bg-white py-8 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-[#111113]/60 mb-3">
            <Link href="/" className="hover:text-[#FF4D00] transition-colors flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-[#111113] font-bold">Legal &amp; Compliance</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-[#FF4D00] font-bold">Terms of Use</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 bg-[#111113] text-[#F8F7F4] px-2.5 py-1 text-xs font-mono font-bold uppercase tracking-widest mb-3">
                <Scale className="w-4 h-4 text-[#FF4D00]" /> Commercial Contract Standard
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-syne font-extrabold tracking-tight text-[#111113]">
                Commercial Terms of Use
              </h1>
              <p className="font-mono text-xs sm:text-sm text-[#111113]/70 mt-2">
                Contractual Placements &bull; 4+ Hr Overlap Guarantee &bull; 2-Week Trial &bull; Last Revised: {lastUpdated}
              </p>
            </div>

            <div className="flex items-center gap-3 font-mono text-xs">
              <Link
                href="/privacy"
                className="btn-brutalist py-2 px-3 flex items-center gap-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#FF4D00]" />
                <span>Privacy Policy</span>
              </Link>
              <a
                href="mailto:legal@talentpulse.dev"
                className="btn-brutalist btn-brutalist-primary py-2 px-3 flex items-center gap-1.5"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Legal Inquiries</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Highlights Strip */}
      <section className="bg-[#111113] text-[#F8F7F4] py-4 px-4 sm:px-8 border-b-2 border-[#111113]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-[#FF4D00] shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block font-bold uppercase">Contractual Only</strong>
              <span className="text-[#F8F7F4]/70 text-[11px]">Zero permanent placement fee commissions.</span>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-[#FF4D00] shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block font-bold uppercase">4+ Hours Overlap</strong>
              <span className="text-[#F8F7F4]/70 text-[11px]">Guaranteed US/EU business hours synchronization.</span>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-[#FF4D00] shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block font-bold uppercase">2-Week Trial</strong>
              <span className="text-[#F8F7F4]/70 text-[11px]">100% risk-free trial on every candidate placement.</span>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-[#FF4D00] shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block font-bold uppercase">100% Client IP</strong>
              <span className="text-[#F8F7F4]/70 text-[11px]">All work product belongs exclusively to Client.</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content & TOC */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Table of Contents */}
          <aside className="hidden lg:block lg:col-span-3 sticky top-28 bg-white border-2 border-[#111113] p-5 shadow-[4px_4px_0px_0px_#111113]">
            <h3 className="font-mono text-xs uppercase tracking-widest font-bold text-[#111113] mb-4 pb-2 border-b-2 border-[#111113] flex items-center justify-between">
              <span>Terms Navigation</span>
              <FileText className="w-3.5 h-3.5 text-[#FF4D00]" />
            </h3>
            <nav className="space-y-1.5 font-mono text-xs">
              {sections.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className="block text-[#111113]/70 hover:text-[#FF4D00] hover:translate-x-1 transition-all py-1 border-l-2 border-transparent hover:border-[#FF4D00] pl-2 text-[11px]"
                >
                  {s.label}
                </a>
              ))}
            </nav>

            <div className="mt-6 pt-4 border-t border-zinc-200">
              <span className="text-[10px] font-mono text-[#111113]/60 block uppercase mb-2">Commercial Legal Support</span>
              <a
                href="mailto:legal@talentpulse.dev"
                className="text-xs font-mono font-bold text-[#FF4D00] underline block"
              >
                legal@talentpulse.dev
              </a>
            </div>
          </aside>

          {/* Quick Navigation Dropdown / Accordion for Mobile & Tablet */}
          <details className="lg:hidden col-span-1 bg-white border-2 border-[#111113] p-4 shadow-[4px_4px_0px_0px_#111113] group">
            <summary className="font-mono text-xs uppercase tracking-widest font-bold text-[#111113] flex items-center justify-between cursor-pointer list-none select-none">
              <span className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#FF4D00]" />
                <span>Jump to Clause ({sections.length} sections)</span>
              </span>
              <span className="font-bold text-[#FF4D00] text-sm group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <nav className="mt-3 pt-3 border-t border-[#111113]/20 grid grid-cols-1 sm:grid-cols-2 gap-1.5 font-mono text-xs">
              {sections.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className="py-2 px-2.5 bg-[#F8F7F4] hover:bg-[#111113] hover:text-white transition-colors border border-[#111113]/20 text-[11px] flex items-center justify-between"
                >
                  <span>{s.label}</span>
                  <span className="text-[#FF4D00] text-[10px]">→</span>
                </a>
              ))}
            </nav>
          </details>

          {/* Legal Document Content */}
          <article className="lg:col-span-9 bg-white border-2 border-[#111113] p-4 sm:p-8 lg:p-10 shadow-[6px_6px_0px_0px_#111113] space-y-8 sm:space-y-10">

            {/* Section 1 */}
            <section id="acceptance" className="scroll-mt-32 space-y-4">
              <div className="flex items-center gap-2 font-mono text-xs text-[#FF4D00] font-bold uppercase tracking-widest">
                [SECTION 01]
              </div>
              <h2 className="text-2xl font-syne font-bold text-[#111113] border-b-2 border-[#111113] pb-2">
                1. Acceptance of Terms &amp; Agreement Overview
              </h2>
              <p className="font-sans text-sm text-[#111113]/80 leading-relaxed">
                These Commercial Terms of Use (&quot;Terms&quot;, &quot;Agreement&quot;) constitute a legally binding agreement between <strong>TalentPulse Global Technologies Inc.</strong> (&quot;TalentPulse&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;), operated in partnership with <strong>Phaedra Solutions</strong>, and you, whether personally or on behalf of an enterprise entity (&quot;User&quot;, &quot;Candidate&quot;, or &quot;Client&quot;).
              </p>
              <div className="bg-[#F8F7F4] border-2 border-[#111113] p-4 font-mono text-xs space-y-1">
                <div>By submitting an application (<code className="font-bold">/apply</code>), submitting a hire request (<code className="font-bold">/hire</code>), or accessing the platform, you affirmatively accept and agree to all provisions herein.</div>
              </div>
            </section>

            {/* Section 2 */}
            <section id="model" className="scroll-mt-32 space-y-4">
              <div className="flex items-center gap-2 font-mono text-xs text-[#FF4D00] font-bold uppercase tracking-widest">
                [SECTION 02]
              </div>
              <h2 className="text-2xl font-syne font-bold text-[#111113] border-b-2 border-[#111113] pb-2">
                2. Operating Model &amp; Core Standards
              </h2>
              <div className="space-y-4 font-sans text-sm text-[#111113]/80 leading-relaxed">
                <div>
                  <h3 className="font-bold text-[#111113] mb-1">A. Contractual Staffing Exclusivity</h3>
                  <p>
                    All talent engagements facilitated through TalentPulse are structured on a contractual, project-based, or time-and-materials basis. TalentPulse levies zero permanent placement fees or placement percentage commissions.
                  </p>
                </div>
                <div>
                  <h3 className="font-bold text-[#111113] mb-1">B. 4+ Hours Working Overlap Guarantee</h3>
                  <p>
                    Candidates accepted into our active talent pool guarantee a minimum of four (4) to six (6) hours of synchronized working overlap with Client business hours (US Eastern, US Pacific, European CET, or Australian AEST).
                  </p>
                </div>
                <div>
                  <h3 className="font-bold text-[#111113] mb-1">C. Two-Week Risk-Free Trial</h3>
                  <p>
                    Every new talent placement commences with a fourteen (14) calendar day trial period. If a Client determines that an engineer does not meet technical or velocity expectations within the trial period, the Client may cancel the engagement immediately at zero cost.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 3 */}
            <section id="candidates" className="scroll-mt-32 space-y-4">
              <div className="flex items-center gap-2 font-mono text-xs text-[#FF4D00] font-bold uppercase tracking-widest">
                [SECTION 03]
              </div>
              <h2 className="text-2xl font-syne font-bold text-[#111113] border-b-2 border-[#111113] pb-2">
                3. Terms Governing Candidates &amp; Applicants
              </h2>
              <ul className="list-disc pl-5 font-sans text-sm text-[#111113]/80 space-y-2">
                <li><strong>Truthful Representation:</strong> Candidates warrant that all credentials, employment history, portfolios, and skills submitted are completely accurate. Falsifying experience results in immediate and permanent disqualification.</li>
                <li><strong>Independent Contractor Status:</strong> Candidates operate as independent professionals and are solely responsible for local tax filings, registrations, and withholdings.</li>
                <li><strong>Client Confidentiality:</strong> Candidates covenant to safeguard all client code repositories, architectures, and proprietary business roadmaps under strict non-disclosure obligations.</li>
              </ul>
            </section>

            {/* Section 4 */}
            <section id="clients" className="scroll-mt-32 space-y-4">
              <div className="flex items-center gap-2 font-mono text-xs text-[#FF4D00] font-bold uppercase tracking-widest">
                [SECTION 04]
              </div>
              <h2 className="text-2xl font-syne font-bold text-[#111113] border-b-2 border-[#111113] pb-2">
                4. Terms Governing Clients &amp; Enterprise Procurement
              </h2>
              <p className="font-sans text-sm text-[#111113]/80 leading-relaxed">
                Clients agree to compensate TalentPulse for active candidate hours at the mutually agreed-upon hourly or monthly rate set forth in the definitive Statement of Work (SOW). Invoices are billed in United States Dollars (USD) bi-weekly or monthly and are payable upon receipt or net-15 days.
              </p>
            </section>

            {/* Section 5 */}
            <section id="circumvention" className="scroll-mt-32 space-y-4">
              <div className="flex items-center gap-2 font-mono text-xs text-[#FF4D00] font-bold uppercase tracking-widest">
                [SECTION 05]
              </div>
              <h2 className="text-2xl font-syne font-bold text-[#111113] border-b-2 border-[#111113] pb-2">
                5. Strict 12-Month Non-Circumvention Protection
              </h2>
              <div className="bg-amber-50 border-2 border-amber-900 p-4 font-mono text-xs text-amber-950 space-y-2">
                <div className="font-bold uppercase tracking-wider text-amber-900">Non-Circumvention Covenant:</div>
                <p>
                  Clients covenant that for a period of twelve (12) consecutive months following the introduction of any candidate by TalentPulse, the Client (including its affiliates, subsidiaries, and successors) shall not directly or indirectly hire, contract with, or engage that candidate outside of the TalentPulse platform without prior written agreement.
                </p>
                <p className="font-bold text-[#111113]">
                  Liquidated Damages: In the event of a breach, Client agrees to pay a placement fee equal to thirty percent (30%) of first-year annualized compensation or $35,000 USD (whichever is greater).
                </p>
              </div>
            </section>

            {/* Section 6 */}
            <section id="ip" className="scroll-mt-32 space-y-4">
              <div className="flex items-center gap-2 font-mono text-xs text-[#FF4D00] font-bold uppercase tracking-widest">
                [SECTION 06]
              </div>
              <h2 className="text-2xl font-syne font-bold text-[#111113] border-b-2 border-[#111113] pb-2">
                6. Work Product &amp; Intellectual Property Ownership
              </h2>
              <div className="space-y-3 font-sans text-sm text-[#111113]/80 leading-relaxed">
                <div className="p-4 border-2 border-[#111113] bg-[#F8F7F4] font-mono text-xs space-y-1">
                  <div className="text-emerald-800 font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> 100% CLIENT WORK PRODUCT OWNERSHIP
                  </div>
                  <p>
                    All code, pull requests, architectures, documentation, and technical deliverables authored by a candidate specifically for a Client during paid contractual engagements belong exclusively to the Client upon receipt of payment.
                  </p>
                </div>
                <p>
                  TalentPulse and its candidates irrevocably assign all worldwide right, title, and intellectual property interest in such deliverables to the Client. The TalentPulse platform, software, and vetting infrastructure remain the exclusive property of TalentPulse and Phaedra Solutions.
                </p>
              </div>
            </section>

            {/* Section 7 */}
            <section id="prohibited" className="scroll-mt-32 space-y-4">
              <div className="flex items-center gap-2 font-mono text-xs text-[#FF4D00] font-bold uppercase tracking-widest">
                [SECTION 07]
              </div>
              <h2 className="text-2xl font-syne font-bold text-[#111113] border-b-2 border-[#111113] pb-2">
                7. Prohibited Misuse &amp; System Abuse
              </h2>
              <p className="font-sans text-sm text-[#111113]/80 leading-relaxed">
                Users are strictly prohibited from scraping candidate directories, attempting to breach PBKDF2 authentication gateways, sharing administrator invite credentials, or uploading corrupted or malicious files to intake forms.
              </p>
            </section>

            {/* Section 8 */}
            <section id="warranty" className="scroll-mt-32 space-y-4">
              <div className="flex items-center gap-2 font-mono text-xs text-[#FF4D00] font-bold uppercase tracking-widest">
                [SECTION 08]
              </div>
              <h2 className="text-2xl font-syne font-bold text-[#111113] border-b-2 border-[#111113] pb-2">
                8. Disclaimer of Warranties
              </h2>
              <p className="font-sans text-sm text-[#111113]/80 leading-relaxed uppercase font-mono text-xs">
                THE PLATFORM IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot;. TALENTPULSE DISCLAIMS ALL WARRANTIES OF ANY KIND, WHETHER EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
              </p>
            </section>

            {/* Section 9 */}
            <section id="liability" className="scroll-mt-32 space-y-4">
              <div className="flex items-center gap-2 font-mono text-xs text-[#FF4D00] font-bold uppercase tracking-widest">
                [SECTION 09]
              </div>
              <h2 className="text-2xl font-syne font-bold text-[#111113] border-b-2 border-[#111113] pb-2">
                9. Limitation of Liability
              </h2>
              <p className="font-sans text-sm text-[#111113]/80 leading-relaxed">
                To the maximum extent permitted by applicable law, TalentPulse and Phaedra Solutions shall not be liable for indirect, incidental, punitive, or consequential damages. Total aggregate liability is limited to fees paid by Client in the preceding six (6) months or $1,000 USD.
              </p>
            </section>

            {/* Section 10 */}
            <section id="indemnity" className="scroll-mt-32 space-y-4">
              <div className="flex items-center gap-2 font-mono text-xs text-[#FF4D00] font-bold uppercase tracking-widest">
                [SECTION 10]
              </div>
              <h2 className="text-2xl font-syne font-bold text-[#111113] border-b-2 border-[#111113] pb-2">
                10. Indemnification
              </h2>
              <p className="font-sans text-sm text-[#111113]/80 leading-relaxed">
                Users agree to defend and indemnify TalentPulse and Phaedra Solutions from any claims, damages, or expenses arising from their breach of these Terms, misrepresentation of skills, or direct contractor disputes.
              </p>
            </section>

            {/* Section 11 */}
            <section id="governing" className="scroll-mt-32 space-y-4">
              <div className="flex items-center gap-2 font-mono text-xs text-[#FF4D00] font-bold uppercase tracking-widest">
                [SECTION 11]
              </div>
              <h2 className="text-2xl font-syne font-bold text-[#111113] border-b-2 border-[#111113] pb-2">
                11. Governing Law &amp; Binding Arbitration
              </h2>
              <p className="font-sans text-sm text-[#111113]/80 leading-relaxed">
                These Terms are governed by the laws of the State of Delaware, USA. Unresolved disputes shall be resolved through binding commercial arbitration administered by the American Arbitration Association (AAA) in Wilmington, Delaware, or via remote digital proceedings.
              </p>
            </section>

            {/* Section 12 */}
            <section id="contact" className="scroll-mt-32 space-y-4">
              <div className="flex items-center gap-2 font-mono text-xs text-[#FF4D00] font-bold uppercase tracking-widest">
                [SECTION 12]
              </div>
              <h2 className="text-2xl font-syne font-bold text-[#111113] border-b-2 border-[#111113] pb-2">
                12. Legal Notice &amp; Inquiries
              </h2>
              <div className="bg-[#111113] text-white p-5 border-2 border-[#111113] space-y-2 font-mono text-xs">
                <div className="text-[#FF4D00] font-bold uppercase">COMMERCIAL LEGAL CONTACT:</div>
                <div>Email: <strong className="text-white">legal@talentpulse.dev</strong></div>
                <div>General Operations: <strong className="text-zinc-300">admin@talentpulse.com</strong></div>
                <div>Operator: TalentPulse Global Technologies Inc. in partnership with Phaedra Solutions</div>
              </div>
            </section>

          </article>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t-2 border-[#111113] bg-white py-6 px-4 sm:px-8 font-mono text-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-syne font-bold text-sm">TALENTPULSE DIRECT</span>
            <span className="text-[#111113]/40">|</span>
            <span className="text-[#111113]/70">Commercial Terms v1.4</span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-[#FF4D00] transition-colors underline">
              Privacy Policy
            </Link>
            <Link href="/hire" className="hover:text-[#FF4D00] transition-colors underline">
              Hire Talent
            </Link>
            <Link href="/" className="hover:text-[#FF4D00] transition-colors underline">
              Platform Overview
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
