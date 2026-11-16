import { Role, Technology, RoleTechnology, RoleStatus, TechnologyStatus } from '@/types/roles-tech';
import { getSupabaseServerClient, isServerSupabaseConfigured } from './supabase/server';
import { getSupabaseBrowserClient, isSupabaseConfigured } from './supabase/client';
import {
  slugifyTech,
  canonicalTechKey,
  findBestMatchingTechnology,
  DuplicateMatchReason,
} from './tech-normalization';

export const INITIAL_ROLES: Role[] = [
  {
    id: 'role-ai-llm-engineer',
    slug: 'ai-llm-engineer',
    title: 'AI & LLM Engineer',
    short_description: 'Fine-tuning models and high-throughput inference. Multi-agent workflows, vLLM microservices, and specialized RAG pipelines.',
    description: `### Role Overview
We deploy seasoned AI & LLM Engineers directly into enterprise customer infrastructure for high-throughput model optimization, fine-tuning, and production multi-agent system execution.

### Key Responsibilities
- **High-Throughput Inference**: Architect and tune low-latency vLLM and Triton inference microservices across NVIDIA H100/A100 clusters.
- **Model Fine-Tuning**: Execute targeted LoRA, QLoRA, and full-weight parameter fine-tuning on domain-specific corpora.
- **Advanced RAG Pipelines**: Build production RAG topologies combining hybrid vector indexing, graph structures, and semantic re-ranking.
- **Evaluation & Latency Guardrails**: Implement automated benchmark harnesses tracking token throughput, time-to-first-token (TTFT), and factual hallucination rates.

### Requirements & Delivery Standards
- Minimum 3+ years in production PyTorch and deep learning systems.
- Demonstrated experience deploying production models using vLLM, TensorRT-LLM, or Triton.
- Strict 4+ hours daily timezone overlap with US or European client engineering leads.
- Fluent professional English for direct technical sprint communications.`,
    status: 'open',
    display_order: 1,
    created_at: new Date('2026-01-01').toISOString(),
    updated_at: new Date('2026-01-01').toISOString(),
  },
  {
    id: 'role-forward-deployed-engineer',
    slug: 'forward-deployed-engineer',
    title: 'Forward Deployed Engineer',
    short_description: 'Embed directly with client enterprise accounts to bridge product architectures, build custom conduits, and automate workflows.',
    description: `### Role Overview
Forward Deployed Engineers (FDEs) operate at the intersection of senior software architecture, rapid customer prototyping, and executive client collaboration. You embed directly into customer environments to unblock mission-critical platform adoptions.

### Key Responsibilities
- **Bespoke Enterprise Conduits**: Develop secure API bridges, webhooks, and ETL pipelines linking client ERPs/CRMs to core software backends.
- **On-Prem & Hybrid Cloud Deployments**: Manage hardened Kubernetes Helm deployments within restricted customer VPCs.
- **Rapid Proof-of-Concept (POC)**: Deliver high-velocity working software prototypes during pilot phases with zero loss in code quality.
- **Technical Stakeholder Advisory**: Speak directly with customer CTOs and VP Engineers to map complex business rules into performant schemas.

### Requirements & Delivery Standards
- Strong mastery of Go, Python, Docker, and Kubernetes.
- Experience operating inside enterprise client security perimeters (SOC2, HIPAA, FedRAMP).
- Exceptional client-facing presence and proactive written delivery cadence.
- 5+ hours daily overlap with client operational working hours.`,
    status: 'open',
    display_order: 2,
    created_at: new Date('2026-01-01').toISOString(),
    updated_at: new Date('2026-01-01').toISOString(),
  },
  {
    id: 'role-mobile-developers',
    slug: 'mobile-developers',
    title: 'Mobile Developers',
    short_description: 'High-performance applications for iOS and Android. Offline-first architectures, low-latency streaming, and device-native hardware bridging.',
    description: `### Role Overview
Deliver fluid, high-velocity native and cross-platform mobile experiences for high-growth consumer and enterprise applications.

### Key Responsibilities
- **Offline-First Synchronization**: Engineer robust local persistence and reconciliation algorithms handling unpredictable connectivity.
- **Fluid Micro-Interactions**: Achieve 60/120fps UI performance with native thread animation pipelines.
- **Cross-Platform & Native Bridge**: Develop core modules in React Native or Flutter, coupled with Swift and Kotlin native modules where hardware access is required.
- **Release Automation**: Configure Fastlane CI/CD pipelines for automated TestFlight and Play Store internal tracks.

### Requirements & Delivery Standards
- 4+ years of proven mobile application development shipping to production stores.
- Deep expertise in React Native, Swift, Kotlin, or Flutter with state management patterns.
- High aesthetic standards regarding layout fidelity and touch responsiveness.`,
    status: 'open',
    display_order: 3,
    created_at: new Date('2026-01-01').toISOString(),
    updated_at: new Date('2026-01-01').toISOString(),
  },
  {
    id: 'role-solutions-architects',
    slug: 'solutions-architects',
    title: 'Solutions Architects',
    short_description: 'Multi-cloud systems, distributed event messaging, database clustering, and high-concurrency architecture governance.',
    description: `### Role Overview
Design and audit distributed infrastructure capable of sustaining hundred-thousand concurrent user loads, zero-downtime database migrations, and strict security compliance.

### Key Responsibilities
- **Multi-Cloud Architecture**: Formulate resilient topologies spanning AWS, GCP, and Azure with Terraform Infrastructure-as-Code.
- **Event-Driven Backbones**: Architect high-throughput Kafka and RabbitMQ streams for asynchronous messaging.
- **Data Partitioning & Caching**: Implement multi-tier caching with Redis and horizontal database sharding.
- **Security & Compliance Auditing**: Harden cloud IAM, TLS termination, network VPC peering, and encryption-at-rest.

### Requirements & Delivery Standards
- 6+ years designing large-scale distributed systems and cloud infrastructure.
- Professional AWS, GCP, or Kubernetes certifications preferred.
- Outstanding ability to produce clear architectural diagrams and executive RFCs.`,
    status: 'open',
    display_order: 4,
    created_at: new Date('2026-01-01').toISOString(),
    updated_at: new Date('2026-01-01').toISOString(),
  },
  {
    id: 'role-full-stack-developers',
    slug: 'full-stack-developers',
    title: 'Full-Stack Developers',
    short_description: 'Modern Next.js App Router, TypeScript, React Server Components, high-velocity APIs, and resilient transactional databases.',
    description: `### Role Overview
Senior engineering generalists capable of taking a greenfield feature or mission-critical contract deliverable from database schema to responsive front-end in record time.

### Key Responsibilities
- **End-to-End Delivery**: Build complete features utilizing Next.js, React, Node.js, and PostgreSQL.
- **Modern React Architectures**: Leverage React Server Components, Suspense, and optimistic UI updates for instantaneous user interactions.
- **API Design**: Implement clean REST and GraphQL endpoints backed by strict Zod schema validation.
- **Test Coverage**: Write robust integration test suites ensuring regression-free deployments.

### Requirements & Delivery Standards
- 4+ years full-stack JavaScript/TypeScript engineering experience.
- Deep knowledge of relational SQL databases (PostgreSQL), indexes, and query plans.
- High ownership mindset with proven ability to unblock dependencies independently.`,
    status: 'open',
    display_order: 5,
    created_at: new Date('2026-01-01').toISOString(),
    updated_at: new Date('2026-01-01').toISOString(),
  },
  {
    id: 'role-fractional-cto',
    slug: 'fractional-cto',
    title: 'Fractional CTO',
    short_description: 'Strategic technical leadership, architecture due diligence, cloud cost optimization, and team scaling for high-growth ventures.',
    description: `### Future Track Overview
TalentPulse Direct is curating an elite pool of battle-tested Fractional CTOs for startups and enterprises seeking strategic technical leadership without full-time executive overhead.

### Key Focus Areas
- **Technical Strategy & Roadmap**: Align engineering execution directly with commercial milestones and runway targets.
- **Architecture Due Diligence**: Audit legacy tech debt, security postures, and scalability bottlenecks prior to Series A/B or acquisitions.
- **Vendor & Cloud Optimization**: Re-architect cloud spending patterns to achieve 30-50% infrastructure cost reductions.
- **Hiring & Culture Formation**: Establish vetting rubrics, interview candidate leads, and mentor internal team leads.

### Future Candidate Pipeline
*Note: This track is currently in our curated Future Track pool. Applications submitted today are prioritized for immediate matching as incoming enterprise partner mandates open.*`,
    status: 'closed',
    display_order: 6,
    created_at: new Date('2026-01-01').toISOString(),
    updated_at: new Date('2026-01-01').toISOString(),
  },
];

export const INITIAL_TECHNOLOGIES: Technology[] = [
  // AI & ML
  { id: 'tech-python', name: 'Python', slug: 'python', status: 'approved', is_featured: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'tech-pytorch', name: 'PyTorch', slug: 'pytorch', status: 'approved', is_featured: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'tech-vllm', name: 'vLLM', slug: 'vllm', status: 'approved', is_featured: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'tech-langchain', name: 'LangChain', slug: 'langchain', status: 'approved', is_featured: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'tech-llamaindex', name: 'LlamaIndex', slug: 'llamaindex', status: 'approved', is_featured: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'tech-triton', name: 'Triton', slug: 'triton', status: 'approved', is_featured: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'tech-huggingface', name: 'Hugging Face', slug: 'hugging-face', status: 'approved', is_featured: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'tech-lora', name: 'LoRA / QLoRA', slug: 'lora-qlora', status: 'approved', is_featured: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'tech-fastapi', name: 'FastAPI', slug: 'fastapi', status: 'approved', is_featured: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'tech-vector-db', name: 'Vector Databases', slug: 'vector-databases', status: 'approved', is_featured: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },

  // FDE & Cloud
  { id: 'tech-go', name: 'Go', slug: 'go', status: 'approved', is_featured: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'tech-kubernetes', name: 'Kubernetes', slug: 'kubernetes', status: 'approved', is_featured: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'tech-docker', name: 'Docker', slug: 'docker', status: 'approved', is_featured: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'tech-terraform', name: 'Terraform', slug: 'terraform', status: 'approved', is_featured: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'tech-aws', name: 'AWS', slug: 'aws', status: 'approved', is_featured: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'tech-gcp', name: 'GCP', slug: 'gcp', status: 'approved', is_featured: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'tech-webhooks', name: 'Webhooks & Middleware', slug: 'webhooks-middleware', status: 'approved', is_featured: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'tech-grpc', name: 'gRPC', slug: 'grpc', status: 'approved', is_featured: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'tech-client-eng', name: 'Client Engineering', slug: 'client-engineering', status: 'approved', is_featured: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'tech-kafka', name: 'Kafka', slug: 'kafka', status: 'approved', is_featured: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },

  // Mobile
  { id: 'tech-react-native', name: 'React Native', slug: 'react-native', status: 'approved', is_featured: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'tech-swift', name: 'Swift / iOS', slug: 'swift-ios', status: 'approved', is_featured: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'tech-kotlin', name: 'Kotlin / Android', slug: 'kotlin-android', status: 'approved', is_featured: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'tech-flutter', name: 'Flutter', slug: 'flutter', status: 'approved', is_featured: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'tech-swiftui', name: 'SwiftUI', slug: 'swiftui', status: 'approved', is_featured: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'tech-sqlite', name: 'SQLite', slug: 'sqlite', status: 'approved', is_featured: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'tech-fastlane', name: 'Fastlane', slug: 'fastlane', status: 'approved', is_featured: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },

  // Full-Stack & Architecture
  { id: 'tech-typescript', name: 'TypeScript', slug: 'typescript', status: 'approved', is_featured: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'tech-nextjs', name: 'Next.js', slug: 'nextjs', status: 'approved', is_featured: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'tech-react', name: 'React', slug: 'react', status: 'approved', is_featured: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'tech-nodejs', name: 'Node.js', slug: 'nodejs', status: 'approved', is_featured: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'tech-postgresql', name: 'PostgreSQL', slug: 'postgresql', status: 'approved', is_featured: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'tech-redis', name: 'Redis', slug: 'redis', status: 'approved', is_featured: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'tech-supabase', name: 'Supabase', slug: 'supabase', status: 'approved', is_featured: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'tech-graphql', name: 'GraphQL', slug: 'graphql', status: 'approved', is_featured: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'tech-tailwind', name: 'Tailwind CSS', slug: 'tailwind-css', status: 'approved', is_featured: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },

  // Fractional CTO / Strategy
  { id: 'tech-tech-strategy', name: 'Tech Strategy', slug: 'tech-strategy', status: 'approved', is_featured: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'tech-architecture-audit', name: 'Architecture Due Diligence', slug: 'architecture-due-diligence', status: 'approved', is_featured: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'tech-cloud-cost', name: 'Cloud Cost Optimization', slug: 'cloud-cost-optimization', status: 'approved', is_featured: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'tech-soc2', name: 'SOC2 Compliance', slug: 'soc2-compliance', status: 'approved', is_featured: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'tech-team-scaling', name: 'Team Scaling & Rubrics', slug: 'team-scaling-rubrics', status: 'approved', is_featured: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

export const INITIAL_ROLE_TECH_MAPPINGS: RoleTechnology[] = [
  // AI & LLM Engineer (Top 12)
  { role_id: 'role-ai-llm-engineer', technology_id: 'tech-python', is_featured: true },
  { role_id: 'role-ai-llm-engineer', technology_id: 'tech-pytorch', is_featured: true },
  { role_id: 'role-ai-llm-engineer', technology_id: 'tech-vllm', is_featured: true },
  { role_id: 'role-ai-llm-engineer', technology_id: 'tech-lora', is_featured: true },
  { role_id: 'role-ai-llm-engineer', technology_id: 'tech-triton', is_featured: true },
  { role_id: 'role-ai-llm-engineer', technology_id: 'tech-langchain', is_featured: false },
  { role_id: 'role-ai-llm-engineer', technology_id: 'tech-llamaindex', is_featured: false },
  { role_id: 'role-ai-llm-engineer', technology_id: 'tech-fastapi', is_featured: false },
  { role_id: 'role-ai-llm-engineer', technology_id: 'tech-vector-db', is_featured: false },
  { role_id: 'role-ai-llm-engineer', technology_id: 'tech-docker', is_featured: false },
  { role_id: 'role-ai-llm-engineer', technology_id: 'tech-huggingface', is_featured: false },
  { role_id: 'role-ai-llm-engineer', technology_id: 'tech-redis', is_featured: false },

  // Forward Deployed Engineer (Top 11)
  { role_id: 'role-forward-deployed-engineer', technology_id: 'tech-go', is_featured: true },
  { role_id: 'role-forward-deployed-engineer', technology_id: 'tech-python', is_featured: true },
  { role_id: 'role-forward-deployed-engineer', technology_id: 'tech-kubernetes', is_featured: true },
  { role_id: 'role-forward-deployed-engineer', technology_id: 'tech-docker', is_featured: true },
  { role_id: 'role-forward-deployed-engineer', technology_id: 'tech-webhooks', is_featured: false },
  { role_id: 'role-forward-deployed-engineer', technology_id: 'tech-client-eng', is_featured: false },
  { role_id: 'role-forward-deployed-engineer', technology_id: 'tech-terraform', is_featured: false },
  { role_id: 'role-forward-deployed-engineer', technology_id: 'tech-aws', is_featured: false },
  { role_id: 'role-forward-deployed-engineer', technology_id: 'tech-grpc', is_featured: false },
  { role_id: 'role-forward-deployed-engineer', technology_id: 'tech-graphql', is_featured: false },
  { role_id: 'role-forward-deployed-engineer', technology_id: 'tech-nextjs', is_featured: false },

  // Mobile Developers (Top 10)
  { role_id: 'role-mobile-developers', technology_id: 'tech-react-native', is_featured: true },
  { role_id: 'role-mobile-developers', technology_id: 'tech-swift', is_featured: true },
  { role_id: 'role-mobile-developers', technology_id: 'tech-kotlin', is_featured: true },
  { role_id: 'role-mobile-developers', technology_id: 'tech-flutter', is_featured: false },
  { role_id: 'role-mobile-developers', technology_id: 'tech-typescript', is_featured: false },
  { role_id: 'role-mobile-developers', technology_id: 'tech-swiftui', is_featured: false },
  { role_id: 'role-mobile-developers', technology_id: 'tech-sqlite', is_featured: false },
  { role_id: 'role-mobile-developers', technology_id: 'tech-fastlane', is_featured: false },
  { role_id: 'role-mobile-developers', technology_id: 'tech-supabase', is_featured: false },

  // Solutions Architects (Top 11)
  { role_id: 'role-solutions-architects', technology_id: 'tech-aws', is_featured: true },
  { role_id: 'role-solutions-architects', technology_id: 'tech-gcp', is_featured: true },
  { role_id: 'role-solutions-architects', technology_id: 'tech-terraform', is_featured: true },
  { role_id: 'role-solutions-architects', technology_id: 'tech-kubernetes', is_featured: true },
  { role_id: 'role-solutions-architects', technology_id: 'tech-kafka', is_featured: true },
  { role_id: 'role-solutions-architects', technology_id: 'tech-postgresql', is_featured: false },
  { role_id: 'role-solutions-architects', technology_id: 'tech-redis', is_featured: false },
  { role_id: 'role-solutions-architects', technology_id: 'tech-docker', is_featured: false },
  { role_id: 'role-solutions-architects', technology_id: 'tech-soc2', is_featured: false },
  { role_id: 'role-solutions-architects', technology_id: 'tech-go', is_featured: false },
  { role_id: 'role-solutions-architects', technology_id: 'tech-grpc', is_featured: false },

  // Full-Stack Developers (Top 11)
  { role_id: 'role-full-stack-developers', technology_id: 'tech-nextjs', is_featured: true },
  { role_id: 'role-full-stack-developers', technology_id: 'tech-react', is_featured: true },
  { role_id: 'role-full-stack-developers', technology_id: 'tech-typescript', is_featured: true },
  { role_id: 'role-full-stack-developers', technology_id: 'tech-postgresql', is_featured: true },
  { role_id: 'role-full-stack-developers', technology_id: 'tech-tailwind', is_featured: false },
  { role_id: 'role-full-stack-developers', technology_id: 'tech-nodejs', is_featured: false },
  { role_id: 'role-full-stack-developers', technology_id: 'tech-supabase', is_featured: false },
  { role_id: 'role-full-stack-developers', technology_id: 'tech-redis', is_featured: false },
  { role_id: 'role-full-stack-developers', technology_id: 'tech-docker', is_featured: false },
  { role_id: 'role-full-stack-developers', technology_id: 'tech-graphql', is_featured: false },

  // Fractional CTO (Top 6)
  { role_id: 'role-fractional-cto', technology_id: 'tech-tech-strategy', is_featured: true },
  { role_id: 'role-fractional-cto', technology_id: 'tech-architecture-audit', is_featured: true },
  { role_id: 'role-fractional-cto', technology_id: 'tech-cloud-cost', is_featured: true },
  { role_id: 'role-fractional-cto', technology_id: 'tech-soc2', is_featured: false },
  { role_id: 'role-fractional-cto', technology_id: 'tech-team-scaling', is_featured: false },
  { role_id: 'role-fractional-cto', technology_id: 'tech-aws', is_featured: false },
];

const ROLES_STORAGE_KEY = 'talentpulse_roles_v1';
const TECHS_STORAGE_KEY = 'talentpulse_techs_v1';
const ROLE_TECHS_STORAGE_KEY = 'talentpulse_role_techs_v1';

// In-memory server fallback cache
let serverRoles: Role[] = [...INITIAL_ROLES];
let serverTechs: Technology[] = [...INITIAL_TECHNOLOGIES];
let serverRoleTechs: RoleTechnology[] = [...INITIAL_ROLE_TECH_MAPPINGS];

function getSupabaseClient() {
  if (typeof window !== 'undefined') {
    return isSupabaseConfigured ? getSupabaseBrowserClient() : null;
  }
  return isServerSupabaseConfigured ? getSupabaseServerClient() : null;
}

function slugify(text: string): string {
  return slugifyTech(text);
}

/**
 * Get all roles with database or client/server storage hydration
 */
export async function getRolesList(includeClosed = true): Promise<Role[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      let rolesQuery = supabase
        .from('roles')
        .select('id, slug, title, short_description, description, status, display_order, created_at, updated_at')
        .order('display_order');
      if (!includeClosed) {
        rolesQuery = rolesQuery.eq('status', 'open');
      }

      const [rolesRes, mappingsRes, techsRes] = await Promise.all([
        rolesQuery,
        supabase.from('role_technologies').select('role_id, technology_id, is_featured'),
        supabase
          .from('technologies')
          .select('id, name, slug, status, is_featured, created_at, updated_at')
          .eq('status', 'approved'),
      ]);

      const dbRoles = rolesRes.data;
      const dbRoleTechs = mappingsRes.data;
      const dbTechs = techsRes.data;

      if (!rolesRes.error && dbRoles && dbRoles.length > 0) {
        const techById = new Map<string, Technology>();
        for (const t of dbTechs || []) {
          techById.set(t.id, t);
        }

        const techsByRoleId = new Map<string, Technology[]>();
        for (const m of dbRoleTechs || []) {
          const tech = techById.get(m.technology_id);
          if (!tech) continue;
          const arr = techsByRoleId.get(m.role_id);
          if (arr) {
            arr.push(tech);
          } else {
            techsByRoleId.set(m.role_id, [tech]);
          }
        }

        const finalRoles = dbRoles.map((role: any) => ({
          ...role,
          technologies: techsByRoleId.get(role.id) || [],
        }));

        return finalRoles.sort((a: any, b: any) => a.display_order - b.display_order);
      }
    } catch {
      // Fallback to local cache if database tables not yet created
    }
  }

  let roles: Role[] = [];
  let techs: Technology[] = [];
  let mappings: RoleTechnology[] = [];

  if (typeof window !== 'undefined') {
    try {
      const rawRoles = localStorage.getItem(ROLES_STORAGE_KEY);
      const rawTechs = localStorage.getItem(TECHS_STORAGE_KEY);
      const rawMappings = localStorage.getItem(ROLE_TECHS_STORAGE_KEY);

      roles = rawRoles ? JSON.parse(rawRoles) : INITIAL_ROLES;
      techs = rawTechs ? JSON.parse(rawTechs) : INITIAL_TECHNOLOGIES;
      mappings = rawMappings ? JSON.parse(rawMappings) : INITIAL_ROLE_TECH_MAPPINGS;

      if (!rawRoles) {
        localStorage.setItem(ROLES_STORAGE_KEY, JSON.stringify(INITIAL_ROLES));
        localStorage.setItem(TECHS_STORAGE_KEY, JSON.stringify(INITIAL_TECHNOLOGIES));
        localStorage.setItem(ROLE_TECHS_STORAGE_KEY, JSON.stringify(INITIAL_ROLE_TECH_MAPPINGS));
      }
    } catch {
      roles = INITIAL_ROLES;
      techs = INITIAL_TECHNOLOGIES;
      mappings = INITIAL_ROLE_TECH_MAPPINGS;
    }
  } else {
    roles = serverRoles;
    techs = serverTechs;
    mappings = serverRoleTechs;
  }

  if (!includeClosed) {
    roles = roles.filter(r => r.status === 'open');
  }

  const approvedTechById = new Map<string, Technology>();
  for (const t of techs) {
    if (t.status === 'approved') {
      approvedTechById.set(t.id, t);
    }
  }

  const techsByRoleId = new Map<string, Technology[]>();
  for (const m of mappings) {
    const tech = approvedTechById.get(m.technology_id);
    if (!tech) continue;
    const arr = techsByRoleId.get(m.role_id);
    if (arr) {
      arr.push(tech);
    } else {
      techsByRoleId.set(m.role_id, [tech]);
    }
  }

  const rolesWithTech = roles.map(role => ({
    ...role,
    technologies: techsByRoleId.get(role.id) || [],
  }));

  return rolesWithTech.sort((a, b) => a.display_order - b.display_order);
}

export interface PaginatedRolesResult {
  roles: Role[];
  total: number;
  page: number;
  limit: number;
  counts?: {
    open: number;
    closed: number;
    all: number;
  };
}

/**
 * Get paginated roles with SQL filtering, summary projection (omits markdown body when summary=true),
 * and tight .in('role_id', pageRoleIds) mapping lookups instead of scanning all role_technologies.
 */
export async function getRolesPaginated(filters?: {
  includeClosed?: boolean;
  status?: RoleStatus | 'all';
  query?: string;
  page?: number;
  limit?: number;
  includeCounts?: boolean;
  summary?: boolean;
}): Promise<PaginatedRolesResult> {
  const page = filters?.page && filters.page > 0 ? filters.page : 1;
  const limit = filters?.limit && filters.limit > 0 ? Math.min(filters.limit, 100) : 12;
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  const includeClosed = filters?.includeClosed !== false;
  const effectiveStatus: RoleStatus | 'all' = !includeClosed
    ? 'open'
    : filters?.status || 'all';

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const roleCols = filters?.summary
        ? 'id, slug, title, short_description, status, display_order, created_at, updated_at'
        : 'id, slug, title, short_description, description, status, display_order, created_at, updated_at';

      let q = supabase.from('roles').select(roleCols, { count: 'exact' });
      if (effectiveStatus !== 'all') {
        q = q.eq('status', effectiveStatus);
      }
      if (filters?.query && filters.query.trim().length > 0) {
        const safe = filters.query.trim().replace(/[,()%]/g, '').trim();
        if (safe) {
          q = q.or(`title.ilike.%${safe}%,slug.ilike.%${safe}%,short_description.ilike.%${safe}%`);
        }
      }
      q = q.order('display_order', { ascending: true }).range(from, to);

      const countQueries = filters?.includeCounts
        ? Promise.all([
            supabase.from('roles').select('id', { count: 'exact', head: true }).eq('status', 'open'),
            supabase.from('roles').select('id', { count: 'exact', head: true }).eq('status', 'closed'),
          ])
        : Promise.resolve(null);

      const [{ data: dbRoles, error, count }, countsRes] = await Promise.all([q, countQueries]);

      if (!error && Array.isArray(dbRoles)) {
        const roleIds = dbRoles.map((r: any) => r.id).filter(Boolean);
        const techsByRoleId = new Map<string, Technology[]>();

        if (roleIds.length > 0) {
          const { data: mappings } = await supabase
            .from('role_technologies')
            .select('role_id, technology_id, is_featured')
            .in('role_id', roleIds);

          const techIds = Array.from(
            new Set((mappings || []).map((m: any) => m.technology_id).filter(Boolean))
          );

          if (techIds.length > 0) {
            const { data: approvedTechs } = await supabase
              .from('technologies')
              .select('id, name, slug, status, is_featured, created_at, updated_at')
              .in('id', techIds)
              .eq('status', 'approved');

            const techById = new Map<string, Technology>();
            for (const t of approvedTechs || []) {
              techById.set(t.id, t);
            }

            for (const m of mappings || []) {
              const tech = techById.get(m.technology_id);
              if (!tech) continue;
              const arr = techsByRoleId.get(m.role_id);
              if (arr) arr.push(tech);
              else techsByRoleId.set(m.role_id, [tech]);
            }
          }
        }

        const enrichedRoles: Role[] = dbRoles.map((r: any) => ({
          description: '',
          ...r,
          technologies: techsByRoleId.get(r.id) || [],
        }));

        const counts = countsRes
          ? {
              open: countsRes[0].count || 0,
              closed: countsRes[1].count || 0,
              all: (countsRes[0].count || 0) + (countsRes[1].count || 0),
            }
          : undefined;

        return {
          roles: enrichedRoles,
          total: typeof count === 'number' ? count : enrichedRoles.length,
          page,
          limit,
          counts,
        };
      }
    } catch {
      // Fall through to local/memory fallback
    }
  }

  let all = await getRolesList(includeClosed);
  const counts = filters?.includeCounts
    ? {
        open: all.filter((r) => r.status === 'open').length,
        closed: all.filter((r) => r.status === 'closed').length,
        all: all.length,
      }
    : undefined;

  if (effectiveStatus !== 'all') {
    all = all.filter((r) => r.status === effectiveStatus);
  }
  if (filters?.query && filters.query.trim()) {
    const ql = filters.query.trim().toLowerCase();
    all = all.filter(
      (r) =>
        r.title.toLowerCase().includes(ql) ||
        r.slug.toLowerCase().includes(ql) ||
        r.short_description.toLowerCase().includes(ql)
    );
  }
  const total = all.length;
  const sliced = all.slice(from, from + limit);
  return { roles: sliced, total, page, limit, counts };
}

/**
 * Get single role by slug or ID
 */
export async function getRoleBySlugOrId(identifier: string): Promise<Role | null> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const safe = identifier.replace(/[,()%]/g, '').trim();
      const { data: role } = await supabase
        .from('roles')
        .select('id, slug, title, short_description, description, status, display_order, created_at, updated_at')
        .or(`id.eq.${safe},slug.eq.${safe}`)
        .limit(1)
        .maybeSingle();

      if (role) {
        const { data: mappings } = await supabase
          .from('role_technologies')
          .select('technology_id')
          .eq('role_id', role.id);

        const techIds = (mappings || []).map((m: any) => m.technology_id).filter(Boolean);
        let roleTechs: Technology[] = [];
        if (techIds.length > 0) {
          const { data: approvedTechs } = await supabase
            .from('technologies')
            .select('id, name, slug, status, is_featured, created_at, updated_at')
            .in('id', techIds)
            .eq('status', 'approved');
          roleTechs = (approvedTechs || []) as Technology[];
        }
        return { ...(role as Role), technologies: roleTechs };
      }
    } catch {
      // Fallback
    }
  }
  const roles = await getRolesList(true);
  const found = roles.find((r) => r.slug === identifier || r.id === identifier);
  return found || null;
}

/**
 * Create a new role
 */
export async function createRoleRecord(data: {
  title: string;
  slug?: string;
  short_description: string;
  description: string;
  status?: RoleStatus;
  display_order?: number;
  technology_ids?: string[];
}): Promise<Role> {
  const allRoles = await getRolesList(true);
  const slug = data.slug || slugify(data.title);

  const newRole: Role = {
    id: `role-${Date.now()}`,
    slug,
    title: data.title,
    short_description: data.short_description || '',
    description: data.description || '',
    status: data.status || 'open',
    display_order: data.display_order ?? (allRoles.length + 1),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const updatedRoles = [...allRoles, newRole];
  
  // Update mappings
  let currentMappings = typeof window !== 'undefined'
    ? JSON.parse(localStorage.getItem(ROLE_TECHS_STORAGE_KEY) || '[]')
    : serverRoleTechs;

  const newMappings = Array.isArray(data.technology_ids)
    ? data.technology_ids.map(techId => ({
        role_id: newRole.id,
        technology_id: techId,
        is_featured: false,
      }))
    : [];

  if (newMappings.length > 0) {
    currentMappings = [...currentMappings, ...newMappings];
  }

  // If in browser, dispatch through authenticated admin API endpoint
  if (typeof window !== 'undefined') {
    try {
      const { getAdminAuthHeaders } = await import('./auth/recruiter-auth');
      const res = await fetch('/api/roles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAdminAuthHeaders(),
        },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to create role');
      }
      localStorage.setItem(ROLES_STORAGE_KEY, JSON.stringify(updatedRoles));
      localStorage.setItem(ROLE_TECHS_STORAGE_KEY, JSON.stringify(currentMappings));
      return json.role;
    } catch (apiErr: any) {
      if (apiErr.message && !apiErr.message.includes('fetch')) {
        throw apiErr;
      }
    }
  }

  const supabase = getSupabaseClient();
  if (supabase) {
    const { error: insertErr } = await supabase.from('roles').insert([{
      id: newRole.id,
      slug: newRole.slug,
      title: newRole.title,
      short_description: newRole.short_description,
      description: newRole.description,
      status: newRole.status,
      display_order: newRole.display_order,
      created_at: newRole.created_at,
      updated_at: newRole.updated_at,
    }]);

    if (insertErr) {
      console.error('Supabase role insert error:', insertErr);
      throw new Error(`Database error creating role: ${insertErr.message}`);
    }

    if (newMappings.length > 0) {
      const { error: mapErr } = await supabase.from('role_technologies').insert(newMappings);
      if (mapErr) {
        console.warn('Supabase role_technologies insert warning:', mapErr);
      }
    }
  }

  if (typeof window !== 'undefined') {
    localStorage.setItem(ROLES_STORAGE_KEY, JSON.stringify(updatedRoles));
    localStorage.setItem(ROLE_TECHS_STORAGE_KEY, JSON.stringify(currentMappings));
  } else {
    serverRoles = updatedRoles;
    serverRoleTechs = currentMappings;
  }

  return (await getRoleBySlugOrId(newRole.id))!;
}

/**
 * Update an existing role
 */
export async function updateRoleRecord(
  id: string,
  data: Partial<Role> & { technology_ids?: string[] }
): Promise<Role> {
  const allRoles = await getRolesList(true);
  const roleIndex = allRoles.findIndex(r => r.id === id || r.slug === id);

  if (roleIndex === -1) {
    throw new Error('Role not found');
  }

  const existing = allRoles[roleIndex];
  const updatedRole: Role = {
    ...existing,
    ...data,
    updated_at: new Date().toISOString(),
  };

  allRoles[roleIndex] = updatedRole;

  if (Array.isArray(data.technology_ids)) {
    let currentMappings: RoleTechnology[] = typeof window !== 'undefined'
      ? JSON.parse(localStorage.getItem(ROLE_TECHS_STORAGE_KEY) || '[]')
      : serverRoleTechs;

    // Filter out old mappings for this role
    currentMappings = currentMappings.filter(m => m.role_id !== existing.id);
    // Add new ones
    const newMappings = data.technology_ids.map(techId => ({
      role_id: existing.id,
      technology_id: techId,
      is_featured: false,
    }));
    currentMappings = [...currentMappings, ...newMappings];

    if (typeof window !== 'undefined') {
      localStorage.setItem(ROLE_TECHS_STORAGE_KEY, JSON.stringify(currentMappings));
    } else {
      serverRoleTechs = currentMappings;
    }
  }

  // If in browser, dispatch through authenticated admin API endpoint
  if (typeof window !== 'undefined') {
    try {
      const { getAdminAuthHeaders } = await import('./auth/recruiter-auth');
      const res = await fetch(`/api/roles/${existing.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAdminAuthHeaders(),
        },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to update role');
      }
      localStorage.setItem(ROLES_STORAGE_KEY, JSON.stringify(allRoles));
      return json.role;
    } catch (apiErr: any) {
      if (apiErr.message && !apiErr.message.includes('fetch')) {
        throw apiErr;
      }
    }
  }

  const supabase = getSupabaseClient();
  if (supabase) {
    const { error: updateErr } = await supabase.from('roles').update({
      title: updatedRole.title,
      slug: updatedRole.slug,
      short_description: updatedRole.short_description,
      description: updatedRole.description,
      status: updatedRole.status,
      display_order: updatedRole.display_order,
      updated_at: updatedRole.updated_at,
    }).eq('id', existing.id);

    if (updateErr) {
      console.error('Supabase role update error:', updateErr);
      throw new Error(`Database error updating role: ${updateErr.message}`);
    }

    if (Array.isArray(data.technology_ids)) {
      await supabase.from('role_technologies').delete().eq('role_id', existing.id);
      if (data.technology_ids.length > 0) {
        const rows = data.technology_ids.map(techId => ({
          role_id: existing.id,
          technology_id: techId,
          is_featured: false,
        }));
        await supabase.from('role_technologies').insert(rows);
      }
    }
  }

  if (typeof window !== 'undefined') {
    localStorage.setItem(ROLES_STORAGE_KEY, JSON.stringify(allRoles));
  } else {
    serverRoles = allRoles;
  }

  return (await getRoleBySlugOrId(existing.id))!;
}

function getCandidateRoleKeysForSlug(roleIdentifier: string): string[] {
  const clean = roleIdentifier.toLowerCase().trim();
  const under = clean.replace(/-/g, '_');
  const keys = new Set<string>([clean, under]);
  if (clean.includes('ai')) keys.add('ai_engineer');
  if (clean.includes('forward')) keys.add('forward_deployed_engineer');
  if (clean.includes('mobile')) keys.add('mobile_app_developer');
  if (clean.includes('architect')) keys.add('solutions_architect');
  if (clean.includes('full-stack') || clean.includes('full_stack')) keys.add('full_stack');
  if (clean.includes('fractional')) keys.add('fractional_cto');
  return Array.from(keys);
}

/**
 * Count candidates associated with a role using lightweight SQL projection (zero resume blobs)
 */
export async function getCandidateCountForRole(roleIdentifier: string): Promise<number> {
  try {
    const roleKeys = getCandidateRoleKeysForSlug(roleIdentifier);
    const supabase = getSupabaseClient();
    if (supabase) {
      const orParts = roleKeys.map((k) => `internal_notes.ilike.%[Role: ${k}]%`);
      const enumRoles = roleKeys.filter((k) =>
        ['ai_engineer', 'forward_deployed_engineer', 'mobile_app_developer', 'solutions_architect', 'full_stack'].includes(k)
      );
      for (const er of enumRoles) {
        orParts.push(`primary_role.eq.${er}`);
      }
      const { count, error } = await supabase
        .from('candidates')
        .select('id', { count: 'exact', head: true })
        .or(orParts.join(','));
      if (!error && typeof count === 'number') {
        return count;
      }
    }

    const { getCandidatesPaginated } = await import('./candidate-store');
    const res = await getCandidatesPaginated({ primaryRole: roleKeys[0] }, { page: 1, limit: 1 });
    return res.total;
  } catch {
    return 0;
  }
}

/**
 * Delete a role with candidate safety check
 */
export async function deleteRoleRecord(id: string): Promise<{ success: boolean; error?: string }> {
  const role = await getRoleBySlugOrId(id);
  if (!role) {
    return { success: false, error: 'Role not found' };
  }

  // Check if any candidate has this role
  const count = await getCandidateCountForRole(role.slug);
  if (count > 0) {
    return {
      success: false,
      error: `Cannot delete role "${role.title}" because it is associated with ${count} candidate(s). You can close the role instead.`,
    };
  }

  // If in browser, dispatch through authenticated admin API endpoint
  if (typeof window !== 'undefined') {
    try {
      const { getAdminAuthHeaders } = await import('./auth/recruiter-auth');
      const res = await fetch(`/api/roles/${role.id}`, {
        method: 'DELETE',
        headers: {
          ...getAdminAuthHeaders(),
        },
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        return { success: false, error: json.error || 'Failed to delete role' };
      }
      return { success: true };
    } catch (apiErr: any) {
      if (apiErr.message && !apiErr.message.includes('fetch')) {
        return { success: false, error: apiErr.message };
      }
    }
  }

  let allRoles = await getRolesList(true);
  allRoles = allRoles.filter(r => r.id !== role.id);

  let currentMappings: RoleTechnology[] = typeof window !== 'undefined'
    ? JSON.parse(localStorage.getItem(ROLE_TECHS_STORAGE_KEY) || '[]')
    : serverRoleTechs;
  currentMappings = currentMappings.filter(m => m.role_id !== role.id);

  const supabase = getSupabaseClient();
  if (supabase) {
    await supabase.from('role_technologies').delete().eq('role_id', role.id);
    const { error: delErr } = await supabase.from('roles').delete().eq('id', role.id);
    if (delErr) {
      console.error('Supabase role delete error:', delErr);
      return { success: false, error: delErr.message };
    }
  }

  if (typeof window !== 'undefined') {
    localStorage.setItem(ROLES_STORAGE_KEY, JSON.stringify(allRoles));
    localStorage.setItem(ROLE_TECHS_STORAGE_KEY, JSON.stringify(currentMappings));
  } else {
    serverRoles = allRoles;
    serverRoleTechs = currentMappings;
  }

  return { success: true };
}

export interface PaginatedTechnologiesResult {
  technologies: Technology[];
  total: number;
  page: number;
  limit: number;
  counts?: {
    pending: number;
    approved: number;
    rejected: number;
    all: number;
  };
}

/**
 * Get technologies with SQL-level filtering, pagination, and O(N) Map role enrichment
 */
export async function getTechnologiesPaginated(filters?: {
  roleId?: string;
  status?: TechnologyStatus | 'all';
  query?: string;
  page?: number;
  limit?: number;
  includeCounts?: boolean;
}): Promise<PaginatedTechnologiesResult> {
  const page = filters?.page && filters.page > 0 ? filters.page : 1;
  const limit = filters?.limit && filters.limit > 0 ? Math.min(filters.limit, 500) : 50;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      // If roleId filter is requested, resolve matching technology IDs first
      let roleTechFilterIds: string[] | null = null;
      if (filters?.roleId) {
        const { data: roleMap } = await supabase
          .from('role_technologies')
          .select('technology_id')
          .eq('role_id', filters.roleId);
        roleTechFilterIds = (roleMap || []).map((m: any) => m.technology_id);
        if (roleTechFilterIds.length === 0) {
          return { technologies: [], total: 0, page, limit };
        }
      }

      let q = supabase
        .from('technologies')
        .select('id, name, slug, status, is_featured, created_at, updated_at', { count: 'exact' });

      if (filters?.status && filters.status !== 'all') {
        q = q.eq('status', filters.status);
      }

      if (roleTechFilterIds) {
        q = q.in('id', roleTechFilterIds);
      }

      if (filters?.query && filters.query.trim().length > 0) {
        const safeTerm = filters.query.trim().replace(/[,()%]/g, '').trim();
        if (safeTerm) {
          q = q.or(`name.ilike.%${safeTerm}%,slug.ilike.%${safeTerm}%`);
        }
      }

      const sortByName = filters?.status === 'approved';
      q = sortByName
        ? q.order('is_featured', { ascending: false }).order('name', { ascending: true })
        : q.order('created_at', { ascending: false });

      if (filters?.limit && filters.limit > 0) {
        q = q.range(from, to);
      }

      const countQueries = filters?.includeCounts
        ? Promise.all([
            supabase.from('technologies').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
            supabase.from('technologies').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
            supabase.from('technologies').select('id', { count: 'exact', head: true }).eq('status', 'rejected'),
          ])
        : Promise.resolve(null);

      const [{ data: dbTechs, error, count }, countsRes] = await Promise.all([q, countQueries]);

      if (!error && Array.isArray(dbTechs)) {
        const techIds = dbTechs.map((t: any) => t.id);
        const roleIdsByTechId = new Map<string, string[]>();

        if (techIds.length > 0) {
          const { data: mappings } = await supabase
            .from('role_technologies')
            .select('role_id, technology_id')
            .in('technology_id', techIds);

          for (const m of mappings || []) {
            const arr = roleIdsByTechId.get(m.technology_id);
            if (arr) {
              arr.push(m.role_id);
            } else {
              roleIdsByTechId.set(m.technology_id, [m.role_id]);
            }
          }
        }

        const enriched = dbTechs.map((t: any) => ({
          ...t,
          role_ids: roleIdsByTechId.get(t.id) || [],
        }));

        const counts = countsRes
          ? {
              pending: countsRes[0].count || 0,
              approved: countsRes[1].count || 0,
              rejected: countsRes[2].count || 0,
              all: (countsRes[0].count || 0) + (countsRes[1].count || 0) + (countsRes[2].count || 0),
            }
          : undefined;

        return {
          technologies: enriched,
          total: typeof count === 'number' ? count : enriched.length,
          page,
          limit,
          counts,
        };
      }
    } catch {
      // Fallback to local cache if database tables not yet created
    }
  }

  let techs: Technology[] = [];
  let mappings: RoleTechnology[] = [];

  if (typeof window !== 'undefined') {
    try {
      const rawTechs = localStorage.getItem(TECHS_STORAGE_KEY);
      const rawMappings = localStorage.getItem(ROLE_TECHS_STORAGE_KEY);
      techs = rawTechs ? JSON.parse(rawTechs) : INITIAL_TECHNOLOGIES;
      mappings = rawMappings ? JSON.parse(rawMappings) : INITIAL_ROLE_TECH_MAPPINGS;
    } catch {
      techs = INITIAL_TECHNOLOGIES;
      mappings = INITIAL_ROLE_TECH_MAPPINGS;
    }
  } else {
    techs = serverTechs;
    mappings = serverRoleTechs;
  }

  const counts = filters?.includeCounts
    ? {
        pending: techs.filter((t) => t.status === 'pending').length,
        approved: techs.filter((t) => t.status === 'approved').length,
        rejected: techs.filter((t) => t.status === 'rejected').length,
        all: techs.length,
      }
    : undefined;

  if (filters?.status && filters.status !== 'all') {
    techs = techs.filter((t) => t.status === filters.status);
  }

  if (filters?.roleId) {
    const techIdSet = new Set(
      mappings.filter((m) => m.role_id === filters.roleId).map((m) => m.technology_id)
    );
    techs = techs.filter((t) => techIdSet.has(t.id));
  }

  if (filters?.query && filters.query.trim().length > 0) {
    const q = filters.query.toLowerCase().trim();
    techs = techs.filter((t) => t.name.toLowerCase().includes(q) || t.slug.includes(q));
  }

  const roleIdsByTechId = new Map<string, string[]>();
  for (const m of mappings) {
    const arr = roleIdsByTechId.get(m.technology_id);
    if (arr) arr.push(m.role_id);
    else roleIdsByTechId.set(m.technology_id, [m.role_id]);
  }

  const enriched = techs.map((t) => ({
    ...t,
    role_ids: roleIdsByTechId.get(t.id) || [],
  }));

  const total = enriched.length;
  const sliced = filters?.limit && filters.limit > 0 ? enriched.slice(from, from + limit) : enriched;

  return {
    technologies: sliced,
    total,
    page,
    limit,
    counts,
  };
}

/**
 * Get technologies with filtering (compat wrapper)
 */
export async function getTechnologiesList(filters?: {
  roleId?: string;
  status?: TechnologyStatus | 'all';
  query?: string;
  limit?: number;
}): Promise<Technology[]> {
  const res = await getTechnologiesPaginated({
    ...filters,
    limit: filters?.limit || 500,
    page: 1,
  });
  return res.technologies;
}

/**
 * Get top 15 approved technologies for a given role
 */
export async function getTopTechnologiesForRole(roleIdentifier: string, limit = 15): Promise<Technology[]> {
  const role = await getRoleBySlugOrId(roleIdentifier);
  if (!role) {
    return getTechnologiesList({ status: 'approved', limit });
  }

  if (Array.isArray(role.technologies) && role.technologies.length > 0) {
    const sorted = [...role.technologies].sort((a, b) => {
      if (a.is_featured && !b.is_featured) return -1;
      if (!a.is_featured && b.is_featured) return 1;
      return a.name.localeCompare(b.name);
    });
    return sorted.slice(0, limit);
  }

  return getTechnologiesList({ roleId: role.id, status: 'approved', limit });
}

/**
 * Submit custom or master technology with multi-layer deduplication BEFORE saving:
 * 1. Indexed exact slug / case-insensitive name / canonical_key lookup
 * 2. Compact all-tech scan comparing canonical fingerprint & known aliases + Damerau-Levenshtein typo match
 * 3. DB UNIQUE(canonical_key) race-condition handling (error 23505)
 */
export async function submitCustomTechnology(
  name: string,
  roleSlugOrId?: string,
  candidateId?: string
): Promise<{ technology: Technology; isNew: boolean; matchedReason?: DuplicateMatchReason }> {
  const cleanName = name.trim();
  if (cleanName.length === 0) {
    throw new Error('Technology name cannot be empty');
  }

  const slug = slugifyTech(cleanName);
  const canonKey = canonicalTechKey(cleanName);
  const supabase = getSupabaseClient();

  const ensureRoleLink = async (techId: string) => {
    if (!roleSlugOrId || !supabase) return;
    const role = await getRoleBySlugOrId(roleSlugOrId);
    if (role) {
      await supabase
        .from('role_technologies')
        .upsert(
          [{ role_id: role.id, technology_id: techId, is_featured: false }],
          { onConflict: 'role_id,technology_id', ignoreDuplicates: true }
        );
    }
  };

  if (supabase) {
    try {
      const safeClean = cleanName.replace(/[,()%]/g, '').trim();

      // Stage 1: Fast indexed lookup by slug or exact name (case-insensitive)
      const { data: exactRow } = await supabase
        .from('technologies')
        .select('id, name, slug, status, is_featured, created_at, updated_at')
        .or(`slug.eq.${slug},name.ilike.${safeClean}`)
        .limit(1)
        .maybeSingle();

      if (exactRow) {
        await ensureRoleLink(exactRow.id);
        return { technology: exactRow as Technology, isNew: false, matchedReason: 'exact' };
      }

      // Stage 2: Load lightweight projection of existing technologies for canonical alias + typo deduplication
      const existingCompact: Array<{
        id: string;
        name: string;
        slug: string;
        status: TechnologyStatus;
        is_featured: boolean;
        created_at: string;
        updated_at: string;
      }> = [];
      let offset = 0;
      const chunkSize = 1000;
      while (offset < 5000) {
        const { data: chunk, error: chunkErr } = await supabase
          .from('technologies')
          .select('id, name, slug, status, is_featured, created_at, updated_at')
          .range(offset, offset + chunkSize - 1);
        if (chunkErr || !chunk || chunk.length === 0) break;
        existingCompact.push(...(chunk as any));
        if (chunk.length < chunkSize) break;
        offset += chunkSize;
      }

      const duplicate = findBestMatchingTechnology(cleanName, existingCompact, { allowFuzzy: true });
      if (duplicate) {
        await ensureRoleLink(duplicate.match.id);
        return {
          technology: duplicate.match as Technology,
          isNew: false,
          matchedReason: duplicate.reason,
        };
      }

      // Stage 3: Insert new pending technology with canonical_key (fallback cleanly if DB hasn't added column yet)
      const now = new Date().toISOString();
      const newTech: Technology = {
        id: `tech-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: cleanName,
        slug,
        canonical_key: canonKey || undefined,
        status: 'pending',
        is_featured: false,
        suggested_by_candidate_id: candidateId || null,
        created_at: now,
        updated_at: now,
      };

      const insertPayload: Record<string, any> = {
        id: newTech.id,
        name: newTech.name,
        slug: newTech.slug,
        status: newTech.status,
        is_featured: newTech.is_featured,
        created_at: newTech.created_at,
        updated_at: newTech.updated_at,
      };
      if (canonKey) {
        insertPayload.canonical_key = canonKey;
      }

      let { error: insertErr } = await supabase.from('technologies').insert([insertPayload]);

      // Retry without canonical_key if column isn't present in DB yet
      if (insertErr && insertErr.message?.includes('canonical_key')) {
        delete insertPayload.canonical_key;
        const retry = await supabase.from('technologies').insert([insertPayload]);
        insertErr = retry.error;
      }

      // Handle concurrent unique constraint collision (Postgres 23505) by returning existing winning row
      if (insertErr && insertErr.code === '23505') {
        const { data: winner } = await supabase
          .from('technologies')
          .select('id, name, slug, status, is_featured, created_at, updated_at')
          .or(`slug.eq.${slug},name.ilike.${safeClean}`)
          .limit(1)
          .maybeSingle();
        if (winner) {
          await ensureRoleLink(winner.id);
          return { technology: winner as Technology, isNew: false, matchedReason: 'canonical_alias' };
        }
      }

      if (!insertErr) {
        await ensureRoleLink(newTech.id);
        return { technology: newTech, isNew: true };
      }
    } catch (e) {
      console.warn('Supabase submitCustomTechnology warning:', e);
    }
  }

  // Fallback local/memory deduplication using the same canonical + fuzzy matcher
  const allTechs = await getTechnologiesList({ status: 'all', limit: 2000 });
  const duplicate = findBestMatchingTechnology(cleanName, allTechs, { allowFuzzy: true });

  if (duplicate) {
    if (roleSlugOrId) {
      const role = await getRoleBySlugOrId(roleSlugOrId);
      if (role) {
        await linkTechToRole(role.id, duplicate.match.id);
      }
    }
    return { technology: duplicate.match, isNew: false, matchedReason: duplicate.reason };
  }

  const now = new Date().toISOString();
  const newTech: Technology = {
    id: `tech-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: cleanName,
    slug,
    canonical_key: canonKey || undefined,
    status: 'pending',
    is_featured: false,
    suggested_by_candidate_id: candidateId || null,
    created_at: now,
    updated_at: now,
  };

  const updatedTechs = [...allTechs, newTech];

  if (typeof window !== 'undefined') {
    localStorage.setItem(TECHS_STORAGE_KEY, JSON.stringify(updatedTechs));
  } else {
    serverTechs = updatedTechs;
  }

  if (roleSlugOrId) {
    const role = await getRoleBySlugOrId(roleSlugOrId);
    if (role) {
      await linkTechToRole(role.id, newTech.id);
    }
  }

  return { technology: newTech, isNew: true };
}

/**
 * Link technology to role
 */
async function linkTechToRole(roleId: string, techId: string) {
  let mappings: RoleTechnology[] = typeof window !== 'undefined'
    ? JSON.parse(localStorage.getItem(ROLE_TECHS_STORAGE_KEY) || '[]')
    : serverRoleTechs;

  const exists = mappings.some((m) => m.role_id === roleId && m.technology_id === techId);
  if (!exists) {
    mappings.push({ role_id: roleId, technology_id: techId, is_featured: false });
    if (typeof window !== 'undefined') {
      localStorage.setItem(ROLE_TECHS_STORAGE_KEY, JSON.stringify(mappings));
    } else {
      serverRoleTechs = mappings;
    }
  }
}

/**
 * Bulk moderate multiple technologies in a single SQL UPDATE
 */
export async function bulkUpdateTechnologyStatus(
  ids: string[],
  status: TechnologyStatus
): Promise<{ updatedCount: number }> {
  const cleanIds = Array.from(new Set(ids.filter(Boolean)));
  if (cleanIds.length === 0) return { updatedCount: 0 };

  const now = new Date().toISOString();
  const supabase = getSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase
      .from('technologies')
      .update({ status, updated_at: now })
      .in('id', cleanIds)
      .select('id');

    if (error) {
      throw new Error(`Database error bulk updating technologies: ${error.message}`);
    }
    return { updatedCount: data?.length || cleanIds.length };
  }

  const idSet = new Set(cleanIds);
  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem(TECHS_STORAGE_KEY);
    const list: Technology[] = raw ? JSON.parse(raw) : INITIAL_TECHNOLOGIES;
    const next = list.map((t) => (idSet.has(t.id) ? { ...t, status, updated_at: now } : t));
    localStorage.setItem(TECHS_STORAGE_KEY, JSON.stringify(next));
  } else {
    serverTechs = serverTechs.map((t) => (idSet.has(t.id) ? { ...t, status, updated_at: now } : t));
  }
  return { updatedCount: cleanIds.length };
}

/**
 * Update a single technology (rename, slug, status, featured flag, role associations)
 * with pre-save canonical duplicate check so renames cannot create duplicates.
 */
export async function updateTechnologyRecord(
  id: string,
  data: Partial<Technology> & { role_ids?: string[] }
): Promise<Technology> {
  // If in browser, dispatch through authenticated admin API endpoint first
  if (typeof window !== 'undefined') {
    const { getAdminAuthHeaders } = await import('./auth/recruiter-auth');
    const res = await fetch(`/api/technologies/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAdminAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Failed to update technology');
    }
    return json.technology;
  }

  const cleanName = typeof data.name === 'string' ? data.name.trim() : undefined;
  if (typeof data.name === 'string' && (!cleanName || cleanName.length === 0)) {
    throw new Error('Technology name cannot be empty');
  }

  const supabase = getSupabaseClient();
  if (supabase) {
    const { data: existing, error: fetchErr } = await supabase
      .from('technologies')
      .select('id, name, slug, status, is_featured, created_at, updated_at')
      .eq('id', id)
      .maybeSingle();

    if (fetchErr) {
      throw new Error(`Database error fetching technology: ${fetchErr.message}`);
    }
    if (!existing) {
      throw new Error('Technology not found');
    }

    const nextName = cleanName ?? existing.name;
    const nextSlug =
      typeof data.slug === 'string' && data.slug.trim()
        ? slugifyTech(data.slug.trim())
        : cleanName
        ? slugifyTech(cleanName)
        : existing.slug;
    const nextCanonKey = canonicalTechKey(nextName);

    // Check for duplicate collision on another row whenever name or slug is changing
    if (cleanName !== undefined || data.slug !== undefined) {
      const { data: others } = await supabase
        .from('technologies')
        .select('id, name, slug, status')
        .neq('id', id)
        .limit(3000);

      const collision = findBestMatchingTechnology(
        nextName,
        (others || []) as Technology[],
        { allowFuzzy: false }
      );
      if (collision) {
        throw new Error(
          `Duplicate detected: "${nextName}" matches existing technology "${collision.match.name}" (${collision.match.status}). Use Merge instead.`
        );
      }

      const slugDup = (others || []).find((o: any) => o.slug === nextSlug);
      if (slugDup) {
        throw new Error(
          `Slug "${nextSlug}" is already used by "${slugDup.name}". Use Merge instead.`
        );
      }
    }

    const updated: Technology = {
      ...(existing as Technology),
      ...data,
      name: nextName,
      slug: nextSlug,
      canonical_key: nextCanonKey || undefined,
      updated_at: new Date().toISOString(),
    };

    const updatePayload: Record<string, any> = {
      name: updated.name,
      slug: updated.slug,
      status: updated.status,
      is_featured: updated.is_featured,
      updated_at: updated.updated_at,
    };
    if (nextCanonKey) {
      updatePayload.canonical_key = nextCanonKey;
    }

    let { error: techErr } = await supabase
      .from('technologies')
      .update(updatePayload)
      .eq('id', id);

    if (techErr && techErr.message?.includes('canonical_key')) {
      delete updatePayload.canonical_key;
      const retry = await supabase.from('technologies').update(updatePayload).eq('id', id);
      techErr = retry.error;
    }

    if (techErr) {
      console.error('Supabase technology update error:', techErr);
      throw new Error(`Database error updating technology: ${techErr.message}`);
    }

    if (Array.isArray(data.role_ids)) {
      await supabase.from('role_technologies').delete().eq('technology_id', id);
      if (data.role_ids.length > 0) {
        const rows = data.role_ids.map((roleId) => ({
          role_id: roleId,
          technology_id: id,
          is_featured: updated.is_featured,
        }));
        await supabase.from('role_technologies').insert(rows);
      }
      updated.role_ids = data.role_ids;
    }

    return updated;
  }

  const index = serverTechs.findIndex((t) => t.id === id);
  if (index === -1) {
    throw new Error('Technology not found');
  }

  const nextName = cleanName ?? serverTechs[index].name;
  const nextSlug =
    typeof data.slug === 'string' && data.slug.trim()
      ? slugifyTech(data.slug.trim())
      : cleanName
      ? slugifyTech(cleanName)
      : serverTechs[index].slug;

  if (cleanName !== undefined || data.slug !== undefined) {
    const others = serverTechs.filter((t) => t.id !== id);
    const collision = findBestMatchingTechnology(nextName, others, { allowFuzzy: false });
    if (collision) {
      throw new Error(
        `Duplicate detected: "${nextName}" matches existing technology "${collision.match.name}". Use Merge instead.`
      );
    }
  }

  const updated: Technology = {
    ...serverTechs[index],
    ...data,
    name: nextName,
    slug: nextSlug,
    updated_at: new Date().toISOString(),
  };
  serverTechs[index] = updated;

  if (Array.isArray(data.role_ids)) {
    serverRoleTechs = serverRoleTechs.filter((m) => m.technology_id !== id);
    serverRoleTechs.push(
      ...data.role_ids.map((roleId) => ({
        role_id: roleId,
        technology_id: id,
        is_featured: updated.is_featured,
      }))
    );
  }

  return updated;
}

/**
 * Count candidates having this technology in their tech_stack (uses GIN index, 0 resume blobs)
 */
export async function getCandidateCountForTech(techNameOrSlug: string): Promise<number> {
  try {
    const clean = techNameOrSlug.trim();
    const supabase = getSupabaseClient();
    if (supabase) {
      const variants = Array.from(
        new Set([
          clean,
          clean.toLowerCase(),
          clean.toUpperCase(),
          clean.charAt(0).toUpperCase() + clean.slice(1),
        ])
      );
      const { count, error } = await supabase
        .from('candidates')
        .select('id', { count: 'exact', head: true })
        .overlaps('tech_stack', variants);
      if (!error && typeof count === 'number') {
        return count;
      }
    }

    const { getCandidatesPaginated } = await import('./candidate-store');
    const res = await getCandidatesPaginated({ searchQuery: clean }, { page: 1, limit: 1 });
    return res.total;
  } catch {
    return 0;
  }
}

/**
 * Merge one or multiple duplicate technologies (`sourceIds`) into a canonical `targetId`.
 * 1. Updates `candidates.tech_stack` (zero resume blobs touched) to replace source names with target name cleanly
 * 2. Transfers `role_technologies` associations without duplicates
 * 3. Deletes redundant source technologies
 */
export async function mergeTechnologies(
  sourceIds: string[],
  targetId: string,
  options?: { approveTarget?: boolean }
): Promise<{
  mergedCount: number;
  updatedCandidatesCount: number;
  transferredRoleLinksCount: number;
  targetTechnology: Technology;
}> {
  const uniqueSources = Array.from(new Set(sourceIds.filter((s) => Boolean(s) && s !== targetId)));
  if (uniqueSources.length === 0) {
    throw new Error('At least one source technology different from the target is required.');
  }

  const now = new Date().toISOString();
  const supabase = getSupabaseClient();

  if (supabase) {
    const { data: targetRow, error: targetErr } = await supabase
      .from('technologies')
      .select('id, name, slug, status, is_featured, created_at, updated_at')
      .eq('id', targetId)
      .maybeSingle();

    if (targetErr || !targetRow) {
      throw new Error(targetErr?.message || 'Target technology not found');
    }

    const { data: sourceRows, error: srcErr } = await supabase
      .from('technologies')
      .select('id, name, slug, status')
      .in('id', uniqueSources);

    if (srcErr || !sourceRows || sourceRows.length === 0) {
      throw new Error(srcErr?.message || 'Source technologies not found');
    }

    // Build case/variant matching set for source technologies
    const sourceVariants = new Set<string>();
    const sourceNamesLower = new Set<string>();
    for (const s of sourceRows as any[]) {
      const clean = (s.name || '').trim();
      if (!clean) continue;
      sourceNamesLower.add(clean.toLowerCase());
      sourceVariants.add(clean);
      sourceVariants.add(clean.toLowerCase());
      sourceVariants.add(clean.toUpperCase());
      sourceVariants.add(clean.charAt(0).toUpperCase() + clean.slice(1));
    }

    // 1. Update affected candidates' tech_stack without touching resume_url blobs
    let updatedCandidatesCount = 0;
    const variantsArr = Array.from(sourceVariants);
    if (variantsArr.length > 0) {
      let offset = 0;
      const chunkSize = 500;
      while (offset < 10000) {
        const { data: candChunk, error: candErr } = await supabase
          .from('candidates')
          .select('id, tech_stack')
          .overlaps('tech_stack', variantsArr)
          .range(offset, offset + chunkSize - 1);

        if (candErr || !candChunk || candChunk.length === 0) break;

        for (const c of candChunk as any[]) {
          if (!Array.isArray(c.tech_stack)) continue;
          let changed = false;
          const nextStack: string[] = [];
          const seen = new Set<string>();

          for (const rawItem of c.tech_stack) {
            if (typeof rawItem !== 'string') continue;
            const trimmed = rawItem.trim();
            if (!trimmed) continue;

            const isSource = sourceNamesLower.has(trimmed.toLowerCase());
            const replacement = isSource ? targetRow.name : trimmed;
            if (isSource) changed = true;

            const key = replacement.toLowerCase();
            if (!seen.has(key)) {
              seen.add(key);
              nextStack.push(replacement);
            } else if (isSource) {
              changed = true;
            }
          }

          if (changed) {
            const { error: updCandErr } = await supabase
              .from('candidates')
              .update({ tech_stack: nextStack, updated_at: now })
              .eq('id', c.id);
            if (!updCandErr) {
              updatedCandidatesCount++;
            }
          }
        }

        if (candChunk.length < chunkSize) break;
        offset += chunkSize;
      }
    }

    // 2. Transfer role_technologies mappings from sources -> target
    const { data: srcMappings } = await supabase
      .from('role_technologies')
      .select('role_id, is_featured')
      .in('technology_id', uniqueSources);

    const uniqueRoleIds = Array.from(
      new Set((srcMappings || []).map((m: any) => m.role_id).filter(Boolean))
    );

    if (uniqueRoleIds.length > 0) {
      await supabase
        .from('role_technologies')
        .upsert(
          uniqueRoleIds.map((roleId) => ({
            role_id: roleId,
            technology_id: targetId,
            is_featured: Boolean(targetRow.is_featured),
          })),
          { onConflict: 'role_id,technology_id', ignoreDuplicates: true }
        );
    }

    // Remove old source role_technologies links and source technology rows
    await supabase.from('role_technologies').delete().in('technology_id', uniqueSources);
    const { error: delSrcErr } = await supabase
      .from('technologies')
      .delete()
      .in('id', uniqueSources);

    if (delSrcErr) {
      throw new Error(`Failed removing merged source technologies: ${delSrcErr.message}`);
    }

    // Optionally promote target technology to approved
    let finalTarget = targetRow as Technology;
    if (options?.approveTarget !== false && targetRow.status !== 'approved') {
      const { data: promoted } = await supabase
        .from('technologies')
        .update({ status: 'approved', updated_at: now })
        .eq('id', targetId)
        .select('id, name, slug, status, is_featured, created_at, updated_at')
        .maybeSingle();
      if (promoted) {
        finalTarget = promoted as Technology;
      }
    }

    return {
      mergedCount: sourceRows.length,
      updatedCandidatesCount,
      transferredRoleLinksCount: uniqueRoleIds.length,
      targetTechnology: finalTarget,
    };
  }

  // Fallback offline / memory store merge
  const target = serverTechs.find((t) => t.id === targetId);
  if (!target) {
    throw new Error('Target technology not found');
  }
  const sourceSet = new Set(uniqueSources);
  const existingSources = serverTechs.filter((t) => sourceSet.has(t.id));

  const rolesFromSources = serverRoleTechs
    .filter((m) => sourceSet.has(m.technology_id))
    .map((m) => m.role_id);

  let transferredRoleLinksCount = 0;
  for (const rId of rolesFromSources) {
    const already = serverRoleTechs.some((m) => m.role_id === rId && m.technology_id === targetId);
    if (!already) {
      serverRoleTechs.push({
        role_id: rId,
        technology_id: targetId,
        is_featured: target.is_featured,
      });
      transferredRoleLinksCount++;
    }
  }

  serverRoleTechs = serverRoleTechs.filter((m) => !sourceSet.has(m.technology_id));
  serverTechs = serverTechs
    .filter((t) => !sourceSet.has(t.id))
    .map((t) =>
      t.id === targetId && options?.approveTarget !== false
        ? { ...t, status: 'approved', updated_at: now }
        : t
    );

  return {
    mergedCount: existingSources.length,
    updatedCandidatesCount: 0,
    transferredRoleLinksCount,
    targetTechnology: {
      ...target,
      status: options?.approveTarget !== false ? 'approved' : target.status,
    },
  };
}

/**
 * Helper to strip deleted technology names from affected candidates.tech_stack when force=true.
 */
async function removeTechNamesFromCandidates(
  supabase: NonNullable<ReturnType<typeof getSupabaseClient>>,
  techNames: string[]
): Promise<number> {
  const variants = new Set<string>();
  const lowerSet = new Set<string>();
  for (const name of techNames) {
    const clean = name.trim();
    if (!clean) continue;
    lowerSet.add(clean.toLowerCase());
    variants.add(clean);
    variants.add(clean.toLowerCase());
    variants.add(clean.toUpperCase());
    variants.add(clean.charAt(0).toUpperCase() + clean.slice(1));
  }

  let updatedCount = 0;
  const variantArr = Array.from(variants);
  if (variantArr.length === 0) return 0;

  let offset = 0;
  const chunkSize = 500;
  const now = new Date().toISOString();

  while (offset < 10000) {
    const { data: chunk, error } = await supabase
      .from('candidates')
      .select('id, tech_stack')
      .overlaps('tech_stack', variantArr)
      .range(offset, offset + chunkSize - 1);

    if (error || !chunk || chunk.length === 0) break;

    for (const c of chunk as any[]) {
      if (!Array.isArray(c.tech_stack)) continue;
      const filtered = c.tech_stack.filter(
        (item: any) => typeof item === 'string' && !lowerSet.has(item.trim().toLowerCase())
      );
      if (filtered.length !== c.tech_stack.length) {
        const { error: updErr } = await supabase
          .from('candidates')
          .update({ tech_stack: filtered, updated_at: now })
          .eq('id', c.id);
        if (!updErr) updatedCount++;
      }
    }

    if (chunk.length < chunkSize) break;
    offset += chunkSize;
  }

  return updatedCount;
}

/**
 * Delete a technology (blocks if candidates are linked unless options.force === true).
 */
export async function deleteTechnologyRecord(
  id: string,
  options?: { force?: boolean }
): Promise<{ success: boolean; error?: string; cleanedCandidates?: number }> {
  // If in browser, dispatch through authenticated admin API endpoint
  if (typeof window !== 'undefined') {
    const { getAdminAuthHeaders } = await import('./auth/recruiter-auth');
    const url = options?.force ? `/api/technologies/${id}?force=true` : `/api/technologies/${id}`;
    const res = await fetch(url, {
      method: 'DELETE',
      headers: {
        ...getAdminAuthHeaders(),
      },
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      return { success: false, error: json.error || 'Failed to delete technology' };
    }
    return { success: true, cleanedCandidates: json.cleanedCandidates };
  }

  const supabase = getSupabaseClient();
  if (supabase) {
    const { data: tech } = await supabase
      .from('technologies')
      .select('id, name')
      .eq('id', id)
      .maybeSingle();

    if (!tech) {
      return { success: false, error: 'Technology not found' };
    }

    let cleanedCandidates = 0;
    const count = await getCandidateCountForTech(tech.name);
    if (count > 0) {
      if (!options?.force) {
        return {
          success: false,
          error: `Cannot delete technology "${tech.name}" because it is associated with ${count} candidate(s). Merge it into another technology or choose Force Delete.`,
        };
      }
      cleanedCandidates = await removeTechNamesFromCandidates(supabase, [tech.name]);
    }

    await supabase.from('role_technologies').delete().eq('technology_id', id);
    const { error: delErr } = await supabase.from('technologies').delete().eq('id', id);
    if (delErr) {
      console.error('Supabase technology delete error:', delErr);
      return { success: false, error: delErr.message };
    }
    return { success: true, cleanedCandidates };
  }

  const tech = serverTechs.find((t) => t.id === id);
  if (!tech) {
    return { success: false, error: 'Technology not found' };
  }

  const count = await getCandidateCountForTech(tech.name);
  if (count > 0 && !options?.force) {
    return {
      success: false,
      error: `Cannot delete technology "${tech.name}" because it is associated with ${count} candidate(s). You can merge or reject it instead.`,
    };
  }

  serverTechs = serverTechs.filter((t) => t.id !== id);
  serverRoleTechs = serverRoleTechs.filter((m) => m.technology_id !== id);

  return { success: true, cleanedCandidates: 0 };
}

/**
 * Bulk delete multiple technologies (supports optional force removal from candidates.tech_stack).
 */
export async function bulkDeleteTechnologies(
  ids: string[],
  options?: { force?: boolean }
): Promise<{
  deletedCount: number;
  skippedBlocked: Array<{ id: string; name: string; count: number }>;
}> {
  const cleanIds = Array.from(new Set(ids.filter(Boolean)));
  if (cleanIds.length === 0) return { deletedCount: 0, skippedBlocked: [] };

  const supabase = getSupabaseClient();
  if (supabase) {
    const { data: rows, error } = await supabase
      .from('technologies')
      .select('id, name')
      .in('id', cleanIds);

    if (error) {
      throw new Error(`Database error loading technologies for deletion: ${error.message}`);
    }

    const deletableIds: string[] = [];
    const deletableNames: string[] = [];
    const skippedBlocked: Array<{ id: string; name: string; count: number }> = [];

    for (const row of (rows || []) as any[]) {
      if (options?.force) {
        deletableIds.push(row.id);
        deletableNames.push(row.name);
      } else {
        const count = await getCandidateCountForTech(row.name);
        if (count > 0) {
          skippedBlocked.push({ id: row.id, name: row.name, count });
        } else {
          deletableIds.push(row.id);
          deletableNames.push(row.name);
        }
      }
    }

    if (deletableIds.length > 0) {
      if (options?.force) {
        await removeTechNamesFromCandidates(supabase, deletableNames);
      }
      await supabase.from('role_technologies').delete().in('technology_id', deletableIds);
      const { error: delErr } = await supabase
        .from('technologies')
        .delete()
        .in('id', deletableIds);
      if (delErr) {
        throw new Error(`Database error bulk deleting technologies: ${delErr.message}`);
      }
    }

    return {
      deletedCount: deletableIds.length,
      skippedBlocked,
    };
  }

  const idSet = new Set(cleanIds);
  const existingCount = serverTechs.filter((t) => idSet.has(t.id)).length;
  serverTechs = serverTechs.filter((t) => !idSet.has(t.id));
  serverRoleTechs = serverRoleTechs.filter((m) => !idSet.has(m.technology_id));
  return { deletedCount: existingCount, skippedBlocked: [] };
}

