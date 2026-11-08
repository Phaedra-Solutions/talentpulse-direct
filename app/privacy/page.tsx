import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import { Navbar } from '@/components/Navbar';
import { 
  ShieldCheck, 
  FileText, 
  Lock, 
  CheckCircle2, 
  Globe, 
  ExternalLink, 
  ArrowLeft,
  ChevronRight,
  Printer,
  Scale,
  Mail,
  UserCheck,
  Building2,
  Database
} from 'lucide-react';
import { constructMetadataForPath } from '@/lib/seo-service';

export async function generateMetadata(): Promise<Metadata> {
  return constructMetadataForPath('/privacy', {
    fallbackTitle: 'Global Privacy Policy | TalentPulse Direct',
    fallbackDescription: 'Learn how TalentPulse protects candidate and client data. Fully compliant with EU/UK GDPR, California CCPA/CPRA, and Canadian PIPEDA regulations.',
  });
}

export default function PrivacyPolicyPage() {
  const lastUpdated = 'November 3, 2026';

  const schemaJson = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    'headline': 'TalentPulse Direct Global Privacy Policy',
    'description': 'Comprehensive privacy policy detailing data processing, candidate protections, and regulatory compliance under GDPR, CCPA/CPRA, and PIPEDA.',
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
    { id: 'controller', label: '1. Data Controller' },
    { id: 'scope', label: '2. Scope & Coverage' },
    { id: 'collection', label: '3. Data We Collect' },
    { id: 'gdpr', label: '4. Legal Bases (GDPR)' },
    { id: 'ccpa', label: '5. California (CCPA/CPRA)' },
    { id: 'pipeda', label: '6. Canada (PIPEDA)' },
    { id: 'redaction', label: '7. PII Redaction' },
    { id: 'transfers', label: '8. International Transfers' },
    { id: 'retention', label: '9. Retention & Erasure' },
    { id: 'security', label: '10. Technical Security' },
    { id: 'rights', label: '11. Your Privacy Rights' },
    { id: 'contact', label: '12. Contact & Supervisory' },
  ];

  return (
    <div className="min-h-screen bg-[#F8F7F4] text-[#111113] flex flex-col font-sans selection:bg-[#FF4D00] selection:text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaJson) }}
      />

      <Navbar />

      {/* Breadcrumb & Header Banner */}
      <section className="border-b-2 border-[#111113] bg-white py-8 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-[#111113]/60 mb-3">
            <Link href="/" className="hover:text-[#FF4D00] transition-colors flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-[#111113] font-bold">Legal &amp; Compliance</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-[#FF4D00] font-bold">Privacy Policy</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 bg-[#FF4D00] text-white px-2.5 py-1 text-xs font-mono font-bold uppercase tracking-widest mb-3">
                <ShieldCheck className="w-4 h-4" /> Global Privacy Standard
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-syne font-extrabold tracking-tight text-[#111113]">
                Global Privacy Policy
              </h1>
              <p className="font-mono text-xs sm:text-sm text-[#111113]/70 mt-2">
                GDPR (EU &amp; UK) &bull; CCPA / CPRA (California) &bull; PIPEDA (Canada) &bull; Last Revised: {lastUpdated}
              </p>
            </div>

            <div className="flex items-center gap-3 font-mono text-xs">
              <Link
                href="/terms"
                className="btn-brutalist py-2 px-3 flex items-center gap-1.5"
              >
                <Scale className="w-3.5 h-3.5 text-[#FF4D00]" />
                <span>Terms of Use</span>
              </Link>
              <a
                href="mailto:privacy@talentpulse.dev"
                className="btn-brutalist btn-brutalist-primary py-2 px-3 flex items-center gap-1.5"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Contact DPO</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Summary Highlights Strip */}
      <section className="bg-[#111113] text-[#F8F7F4] py-4 px-4 sm:px-8 border-b-2 border-[#111113]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-[#FF4D00] shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block font-bold uppercase">Zero Data Sales</strong>
              <span className="text-[#F8F7F4]/70 text-[11px]">We never sell or rent candidate or client data.</span>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-[#FF4D00] shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block font-bold uppercase">Public PII Redacted</strong>
              <span className="text-[#F8F7F4]/70 text-[11px]">Direct contact details withheld from public eyes.</span>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-[#FF4D00] shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block font-bold uppercase">Candidate Self-Service</strong>
              <span className="text-[#F8F7F4]/70 text-[11px]">Update or erase your records at any time.</span>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-[#FF4D00] shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block font-bold uppercase">PBKDF2 SHA-512</strong>
              <span className="text-[#F8F7F4]/70 text-[11px]">Salted 100,000-iteration credentials encryption.</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content & TOC Layout */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Sticky Table of Contents (Desktop) */}
          <aside className="hidden lg:block lg:col-span-3 sticky top-28 bg-white border-2 border-[#111113] p-5 shadow-[4px_4px_0px_0px_#111113]">
            <h3 className="font-mono text-xs uppercase tracking-widest font-bold text-[#111113] mb-4 pb-2 border-b-2 border-[#111113] flex items-center justify-between">
              <span>Table of Contents</span>
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
              <span className="text-[10px] font-mono text-[#111113]/60 block uppercase mb-2">Need assistance?</span>
              <a
                href="mailto:privacy@talentpulse.dev"
                className="text-xs font-mono font-bold text-[#FF4D00] underline block"
              >
                privacy@talentpulse.dev
              </a>
            </div>
          </aside>

          {/* Quick Navigation Dropdown / Accordion for Mobile & Tablet */}
          <details className="lg:hidden col-span-1 bg-white border-2 border-[#111113] p-4 shadow-[4px_4px_0px_0px_#111113] group">
            <summary className="font-mono text-xs uppercase tracking-widest font-bold text-[#111113] flex items-center justify-between cursor-pointer list-none select-none">
              <span className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#FF4D00]" />
                <span>Jump to Section ({sections.length} topics)</span>
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

          {/* Legal Text Body */}
          <article className="lg:col-span-9 bg-white border-2 border-[#111113] p-4 sm:p-8 lg:p-10 shadow-[6px_6px_0px_0px_#111113] space-y-8 sm:space-y-10">

            {/* Section 1 */}
            <section id="controller" className="scroll-mt-32 space-y-4">
              <div className="flex items-center gap-2 font-mono text-xs text-[#FF4D00] font-bold uppercase tracking-widest">
                [SECTION 01]
              </div>
              <h2 className="text-2xl font-syne font-bold text-[#111113] border-b-2 border-[#111113] pb-2">
                1. Data Controller Identity &amp; Contact Information
              </h2>
              <p className="font-sans text-sm text-[#111113]/80 leading-relaxed">
                <strong>TalentPulse Global Technologies Inc.</strong> (&quot;TalentPulse&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;), operated in technology and operational partnership with <strong>Phaedra Solutions</strong>, provides on-demand engineering staffing, contractual talent intelligence, and vetting platforms.
              </p>
              <div className="bg-[#F8F7F4] border-2 border-[#111113] p-4 font-mono text-xs space-y-1">
                <div><strong>Data Controller:</strong> TalentPulse Global Technologies Inc.</div>
                <div><strong>Lead Operating Partner:</strong> Phaedra Solutions (https://www.phaedrasolutions.com)</div>
                <div><strong>Designated Privacy Officer (DPO):</strong> privacy@talentpulse.dev</div>
                <div><strong>Platform Inquiries &amp; Operations:</strong> admin@talentpulse.com</div>
              </div>
            </section>

            {/* Section 2 */}
            <section id="scope" className="scroll-mt-32 space-y-4">
              <div className="flex items-center gap-2 font-mono text-xs text-[#FF4D00] font-bold uppercase tracking-widest">
                [SECTION 02]
              </div>
              <h2 className="text-2xl font-syne font-bold text-[#111113] border-b-2 border-[#111113] pb-2">
                2. Scope &amp; Covered Individuals
              </h2>
              <p className="font-sans text-sm text-[#111113]/80 leading-relaxed">
                This Privacy Policy applies to personal information collected when you access our website (<code className="font-mono bg-zinc-100 px-1">talentpulse.dev</code>), apply as a candidate (<code className="font-mono bg-zinc-100 px-1">/apply</code>), submit an enterprise talent hire request (<code className="font-mono bg-zinc-100 px-1">/hire</code>), update your profile via candidate self-service (<code className="font-mono bg-zinc-100 px-1">/candidate/update</code>), or interact with our recruiter and administrator portals.
              </p>
              <ul className="list-disc pl-5 font-sans text-sm text-[#111113]/80 space-y-2">
                <li><strong>Candidates / Talent Applicants:</strong> Engineers, architects, and technical contributors participating in our vetting roster.</li>
                <li><strong>Clients &amp; Enterprise Procurement:</strong> Corporate representatives submitting project staffing requests.</li>
                <li><strong>Website Visitors:</strong> Public users browsing talent directories and platform literature.</li>
              </ul>
            </section>

            {/* Section 3 */}
            <section id="collection" className="scroll-mt-32 space-y-4">
              <div className="flex items-center gap-2 font-mono text-xs text-[#FF4D00] font-bold uppercase tracking-widest">
                [SECTION 03]
              </div>
              <h2 className="text-2xl font-syne font-bold text-[#111113] border-b-2 border-[#111113] pb-2">
                3. Categories of Personal Data We Collect
              </h2>
              <div className="space-y-4 font-sans text-sm text-[#111113]/80 leading-relaxed">
                <div>
                  <h3 className="font-bold text-[#111113] mb-1">A. Candidate Profile &amp; Vetting Data</h3>
                  <p>
                    Full name, email address, international telephone number, country of residence, GitHub URL, LinkedIn profile, target hourly and annual compensation (USD), daily timezone working overlap schedule, uploaded resume documents, written pitch, and voluntary video elevator pitches.
                  </p>
                </div>
                <div>
                  <h3 className="font-bold text-[#111113] mb-1">B. Client Procurement &amp; Project Requirements</h3>
                  <p>
                    Corporate contact name, company email, corporate phone number, company legal name, country of operation, target budget bands, hiring timeline, and project technical specifications.
                  </p>
                </div>
                <div>
                  <h3 className="font-bold text-[#111113] mb-1">C. Technical Telemetry &amp; System Logs</h3>
                  <p>
                    Internet Protocol (IP) address, browser client user-agent, operating system, session cookies, and cryptographic authentication tokens.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 4 */}
            <section id="gdpr" className="scroll-mt-32 space-y-4">
              <div className="flex items-center gap-2 font-mono text-xs text-[#FF4D00] font-bold uppercase tracking-widest">
                [SECTION 04]
              </div>
              <h2 className="text-2xl font-syne font-bold text-[#111113] border-b-2 border-[#111113] pb-2">
                4. Legal Bases for Processing under GDPR &amp; UK GDPR
              </h2>
              <p className="font-sans text-sm text-[#111113]/80 leading-relaxed">
                Under Article 6 of the General Data Protection Regulation (EU) 2016/679 and UK Data Protection Act 2018, we process personal data strictly pursuant to the following lawful grounds:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs mt-3">
                <div className="p-4 border border-[#111113] bg-[#F8F7F4]">
                  <strong className="text-[#FF4D00] block mb-1">CONSENT (ART. 6(1)(a))</strong>
                  <span>Affirmative checkbox consent provided during application submission and video pitch sharing.</span>
                </div>
                <div className="p-4 border border-[#111113] bg-[#F8F7F4]">
                  <strong className="text-[#FF4D00] block mb-1">CONTRACTUAL PRE-STEPS (ART. 6(1)(b))</strong>
                  <span>Processing necessary to match candidates with client contracts and execute talent trials.</span>
                </div>
                <div className="p-4 border border-[#111113] bg-[#F8F7F4]">
                  <strong className="text-[#FF4D00] block mb-1">LEGITIMATE INTERESTS (ART. 6(1)(f))</strong>
                  <span>Maintaining cybersecurity, verifying work authorization, and screening for technical fit.</span>
                </div>
                <div className="p-4 border border-[#111113] bg-[#F8F7F4]">
                  <strong className="text-[#FF4D00] block mb-1">LEGAL OBLIGATION (ART. 6(1)(c))</strong>
                  <span>Tax records, audit trails, and anti-fraud monitoring required by corporate authorities.</span>
                </div>
              </div>
            </section>

            {/* Section 5 */}
            <section id="ccpa" className="scroll-mt-32 space-y-4">
              <div className="flex items-center gap-2 font-mono text-xs text-[#FF4D00] font-bold uppercase tracking-widest">
                [SECTION 05]
              </div>
              <h2 className="text-2xl font-syne font-bold text-[#111113] border-b-2 border-[#111113] pb-2">
                5. California Consumer Privacy Act (CCPA / CPRA) Disclosures
              </h2>
              <p className="font-sans text-sm text-[#111113]/80 leading-relaxed">
                For residents of California pursuant to the California Consumer Privacy Act of 2018 as amended by the California Privacy Rights Act of 2020:
              </p>
              <div className="bg-amber-50 border-2 border-amber-900 p-4 font-mono text-xs text-amber-950 space-y-2">
                <div className="font-bold uppercase tracking-wider text-amber-900">Notice at Collection:</div>
                <p>
                  TalentPulse Direct collects candidate identifiers, employment history, and professional qualifications exclusively to provide engineering staffing services.
                </p>
                <p className="font-bold text-[#111113]">
                  WE DO NOT SELL YOUR PERSONAL INFORMATION. WE DO NOT SHARE YOUR PERSONAL INFORMATION FOR CROSS-CONTEXT BEHAVIORAL ADVERTISING.
                </p>
              </div>
              <p className="font-sans text-sm text-[#111113]/80 leading-relaxed mt-2">
                California residents hold statutory rights to access personal information, request deletion, correct inaccurate records, and exercise rights without commercial discrimination. Contact <code className="font-mono text-[#FF4D00]">privacy@talentpulse.dev</code> with subject *&quot;California Privacy Rights&quot;*.
              </p>
            </section>

            {/* Section 6 */}
            <section id="pipeda" className="scroll-mt-32 space-y-4">
              <div className="flex items-center gap-2 font-mono text-xs text-[#FF4D00] font-bold uppercase tracking-widest">
                [SECTION 06]
              </div>
              <h2 className="text-2xl font-syne font-bold text-[#111113] border-b-2 border-[#111113] pb-2">
                6. Canadian Privacy Compliance (PIPEDA)
              </h2>
              <p className="font-sans text-sm text-[#111113]/80 leading-relaxed">
                TalentPulse complies with the <strong>Personal Information Protection and Electronic Documents Act (PIPEDA)</strong> and applicable provincial privacy standards in Alberta, British Columbia, and Quebec. We uphold the 10 Fair Information Principles: Accountability, Purpose Identification, Informed Consent, Limited Collection, Limited Retention, Data Accuracy, Enterprise Safeguards, Openness, Individual Access, and Recourse.
              </p>
            </section>

            {/* Section 7 */}
            <section id="redaction" className="scroll-mt-32 space-y-4">
              <div className="flex items-center gap-2 font-mono text-xs text-[#FF4D00] font-bold uppercase tracking-widest">
                [SECTION 07]
              </div>
              <h2 className="text-2xl font-syne font-bold text-[#111113] border-b-2 border-[#111113] pb-2">
                7. Public Candidate Directory &amp; Server-Side PII Redaction
              </h2>
              <p className="font-sans text-sm text-[#111113]/80 leading-relaxed">
                Candidate confidentiality is vital to protecting independent professionals from unsolicited contact and competitive exposure:
              </p>
              <div className="p-4 border-2 border-[#111113] bg-[#F8F7F4] font-mono text-xs space-y-2">
                <div className="flex items-center gap-2 text-emerald-800 font-bold">
                  <CheckCircle2 className="w-4 h-4" /> SERVER-SIDE AUTOMATIC REDACTION ACTIVE
                </div>
                <p className="text-[#111113]/80">
                  When unauthenticated visitors browse the talent roster, our API route handlers (<code className="bg-zinc-200 px-1">/api/candidates</code>) strip candidate phone numbers, direct email addresses, raw resume files, and recruiter notes prior to HTTP transmission. Full credentials are disclosed to enterprise clients only after mutual vetting.
                </p>
              </div>
            </section>

            {/* Section 8 */}
            <section id="transfers" className="scroll-mt-32 space-y-4">
              <div className="flex items-center gap-2 font-mono text-xs text-[#FF4D00] font-bold uppercase tracking-widest">
                [SECTION 08]
              </div>
              <h2 className="text-2xl font-syne font-bold text-[#111113] border-b-2 border-[#111113] pb-2">
                8. International Data Transfers
              </h2>
              <p className="font-sans text-sm text-[#111113]/80 leading-relaxed">
                TalentPulse operates cloud infrastructure spanning the United States and the European Union. Transfers of personal data from the EEA or UK are governed by the European Commission&apos;s approved <strong>Standard Contractual Clauses (SCCs)</strong> and enforceable Data Protection Agreements (DPAs) requiring AES-256 rest encryption and TLS 1.3 in-transit protections.
              </p>
            </section>

            {/* Section 9 */}
            <section id="retention" className="scroll-mt-32 space-y-4">
              <div className="flex items-center gap-2 font-mono text-xs text-[#FF4D00] font-bold uppercase tracking-widest">
                [SECTION 09]
              </div>
              <h2 className="text-2xl font-syne font-bold text-[#111113] border-b-2 border-[#111113] pb-2">
                9. Data Retention &amp; Erasure Schedules
              </h2>
              <p className="font-sans text-sm text-[#111113]/80 leading-relaxed">
                Candidate profiles remain active during enrollment in our talent pool. Inactive profiles without login or communication for <strong>24 consecutive months</strong> are automatically scheduled for archival or permanent deletion. When an individual submits a Right to Erasure request, all profile records, evaluation notes, and uploaded resumes are permanently purged within <strong>30 calendar days</strong>.
              </p>
            </section>

            {/* Section 10 */}
            <section id="security" className="scroll-mt-32 space-y-4">
              <div className="flex items-center gap-2 font-mono text-xs text-[#FF4D00] font-bold uppercase tracking-widest">
                [SECTION 10]
              </div>
              <h2 className="text-2xl font-syne font-bold text-[#111113] border-b-2 border-[#111113] pb-2">
                10. Technical Security Standards
              </h2>
              <div className="space-y-3 font-sans text-sm text-[#111113]/80 leading-relaxed">
                <p>
                  TalentPulse enforces state-of-the-art security safeguards:
                </p>
                <ul className="list-disc pl-5 space-y-1.5 font-mono text-xs">
                  <li><strong>PBKDF2 SHA-512 Encryption:</strong> Salted password hashes using 16-byte random salts across 100,000 iterations.</li>
                  <li><strong>Cryptographic Session Tokens:</strong> HMAC-SHA256 signatures stored in HTTP-Only, Secure, SameSite=None cookies.</li>
                  <li><strong>PostgreSQL Row-Level Security:</strong> Database-enforced isolation ensuring recruiters only access permitted data.</li>
                  <li><strong>Mandatory First-Login Password Rotation:</strong> Temporary credentials cannot access operational pipelines.</li>
                </ul>
              </div>
            </section>

            {/* Section 11 */}
            <section id="rights" className="scroll-mt-32 space-y-4">
              <div className="flex items-center gap-2 font-mono text-xs text-[#FF4D00] font-bold uppercase tracking-widest">
                [SECTION 11]
              </div>
              <h2 className="text-2xl font-syne font-bold text-[#111113] border-b-2 border-[#111113] pb-2">
                11. Your Data Subject Rights (DSR) &amp; Execution
              </h2>
              <p className="font-sans text-sm text-[#111113]/80 leading-relaxed">
                You may exercise your rights of Access, Rectification, Erasure, Data Portability, Restriction, or Consent Withdrawal by submitting a verified request:
              </p>
              <div className="bg-[#111113] text-white p-5 border-2 border-[#111113] space-y-2 font-mono text-xs">
                <div className="text-[#FF4D00] font-bold uppercase">HOW TO SUBMIT A PRIVACY REQUEST:</div>
                <div>Send an email to: <strong className="text-white">privacy@talentpulse.dev</strong></div>
                <div>Subject line: <span className="text-zinc-300">Data Subject Rights Request — [Your Full Name]</span></div>
                <div className="text-zinc-400 text-[11px] mt-1">
                  We verify requester identity via registered email address and respond in full within thirty (30) calendar days at zero cost.
                </div>
              </div>
            </section>

            {/* Section 12 */}
            <section id="contact" className="scroll-mt-32 space-y-4">
              <div className="flex items-center gap-2 font-mono text-xs text-[#FF4D00] font-bold uppercase tracking-widest">
                [SECTION 12]
              </div>
              <h2 className="text-2xl font-syne font-bold text-[#111113] border-b-2 border-[#111113] pb-2">
                12. Supervisory Authorities &amp; Legal Recourse
              </h2>
              <p className="font-sans text-sm text-[#111113]/80 leading-relaxed">
                If you believe our processing of your personal data violates statutory regulations, you maintain the right to lodge a complaint with your competent supervisory authority:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
                <div className="p-3 border border-zinc-300 bg-zinc-50">
                  <strong>European Union:</strong> Contact your local national supervisory authority via the European Data Protection Board (EDPB).
                </div>
                <div className="p-3 border border-zinc-300 bg-zinc-50">
                  <strong>United Kingdom:</strong> Information Commissioner’s Office (ICO) at ico.org.uk.
                </div>
                <div className="p-3 border border-zinc-300 bg-zinc-50">
                  <strong>California:</strong> California Privacy Protection Agency (CPPA) at cppa.ca.gov.
                </div>
                <div className="p-3 border border-zinc-300 bg-zinc-50">
                  <strong>Canada:</strong> Office of the Privacy Commissioner of Canada (OPC) at priv.gc.ca.
                </div>
              </div>
            </section>

          </article>
        </div>
      </main>

      {/* Bottom Footer Callout */}
      <footer className="border-t-2 border-[#111113] bg-white py-6 px-4 sm:px-8 font-mono text-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-syne font-bold text-sm">TALENTPULSE DIRECT</span>
            <span className="text-[#111113]/40">|</span>
            <span className="text-[#111113]/70">Global Privacy Standard v1.4</span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/terms" className="hover:text-[#FF4D00] transition-colors underline">
              Terms of Use
            </Link>
            <Link href="/candidate/update" className="hover:text-[#FF4D00] transition-colors underline">
              Manage Profile
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
