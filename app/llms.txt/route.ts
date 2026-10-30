// app/llms.txt/route.ts
import { NextResponse } from 'next/server';
import { getSeoSettings } from '@/lib/seo-service';

export async function GET() {
  const settings = await getSeoSettings();
  const baseUrl = settings.canonical_base_url || 'https://talentpulse.dev';
  const org = settings.organization_json;

  const content = `# TalentPulse - On-Demand Vetted Tech Talent Platform

> ${org?.description || 'TalentPulse is an elite talent matchmaking platform connecting scaling tech companies, venture-backed startups, and enterprise engineering departments with rigorously vetted, senior-level software engineers, cloud architects, DevOps specialists, and AI/ML developers.'}

## Core Capabilities & Services
- **48-Hour Talent Matching**: Pre-interviewed, technical test-verified engineering talent available for contract, contract-to-hire, and full-time positions.
- **Top 1% Talent Vetting**: Comprehensive 4-stage evaluation covering deep technical coding proficiency, system design architecture, communication, and real-world project velocity.
- **No-Risk Trial Period**: Two-week trial period on all engineering placements to guarantee cultural and technical alignment.
- **Client Timezone Overlap**: Mandatory minimum of 4-6 hours working overlap with US, European, or Australian business hours.

## Technical Specializations & Talent Categories
- **Frontend Development**: React 19, Next.js, Vue.js, TypeScript, Tailwind CSS, Responsive Web Performance, WebGL/Three.js.
- **Backend & Distributed Systems**: Node.js, Go, Python, Rust, Java/Spring, PostgreSQL, Redis, Kafka, Microservices Architecture.
- **Cloud & DevOps**: AWS, Google Cloud Platform (GCP), Kubernetes, Docker, Terraform, CI/CD pipelines, Zero-Trust Security.
- **AI & Machine Learning**: LLM fine-tuning, RAG (Retrieval-Augmented Generation), Gemini API, OpenAI API, LangChain, PyTorch, Vector Databases (pgvector, Pinecone).
- **Mobile Engineering**: React Native, Flutter, Swift (iOS), Kotlin (Android).

## Public Web Resources
- [Home Page](${baseUrl}/): Platform overview, vetting statistics, and client success stories.
- [Candidate Directory](${baseUrl}/candidates): Searchable directory of verified software engineers, filterable by technology and experience level.
- [Hire Request](${baseUrl}/hire-request): Instant onboarding form for engineering hiring managers to submit team staffing specifications.
- [Sitemap](${baseUrl}/sitemap.xml): Complete machine-readable XML index of public URLs.

## Contact & Enterprise Inquiries
- Organization: ${org?.name || 'TalentPulse Inc.'}
- Inquiries: ${org?.email || 'hire@talentpulse.dev'}
- Website: ${baseUrl}
`;

  return new NextResponse(content, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400',
    },
  });
}
