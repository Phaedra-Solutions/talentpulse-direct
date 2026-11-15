import { Role, Technology, RoleTechnology, RoleStatus, TechnologyStatus } from '@/types/roles-tech';
import { getSupabaseServerClient, isServerSupabaseConfigured } from './supabase/server';
import { getSupabaseBrowserClient, isSupabaseConfigured } from './supabase/client';

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
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
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

/**
 * Get single role by slug or ID
 */
export async function getRoleBySlugOrId(identifier: string): Promise<Role | null> {
  const roles = await getRolesList(true);
  const found = roles.find(r => r.slug === identifier || r.id === identifier);
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
 * Submit custom technology from candidate (single indexed lookup instead of full-table scan)
 */
export async function submitCustomTechnology(
  name: string,
  roleSlugOrId?: string,
  candidateId?: string
): Promise<{ technology: Technology; isNew: boolean }> {
  const cleanName = name.trim();
  if (cleanName.length === 0) {
    throw new Error('Technology name cannot be empty');
  }

  const slug = slugify(cleanName);
  const supabase = getSupabaseClient();

  if (supabase) {
    try {
      const safeClean = cleanName.replace(/[,()%]/g, '').trim();
      const { data: existing } = await supabase
        .from('technologies')
        .select('id, name, slug, status, is_featured, created_at, updated_at')
        .or(`slug.eq.${slug},name.ilike.${safeClean}`)
        .limit(1)
        .maybeSingle();

      if (existing) {
        if (roleSlugOrId) {
          const role = await getRoleBySlugOrId(roleSlugOrId);
          if (role) {
            await supabase
              .from('role_technologies')
              .upsert(
                [{ role_id: role.id, technology_id: existing.id, is_featured: false }],
                { onConflict: 'role_id,technology_id', ignoreDuplicates: true }
              );
          }
        }
        return { technology: existing as Technology, isNew: false };
      }

      const newTech: Technology = {
        id: `tech-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: cleanName,
        slug,
        status: 'pending',
        is_featured: false,
        suggested_by_candidate_id: candidateId || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { error: insertErr } = await supabase.from('technologies').insert([{
        id: newTech.id,
        name: newTech.name,
        slug: newTech.slug,
        status: newTech.status,
        is_featured: newTech.is_featured,
        created_at: newTech.created_at,
        updated_at: newTech.updated_at,
      }]);

      if (!insertErr) {
        if (roleSlugOrId) {
          const role = await getRoleBySlugOrId(roleSlugOrId);
          if (role) {
            await supabase.from('role_technologies').insert([{
              role_id: role.id,
              technology_id: newTech.id,
              is_featured: false,
            }]);
          }
        }
        return { technology: newTech, isNew: true };
      }
    } catch (e) {
      console.warn('Supabase submitCustomTechnology warning:', e);
    }
  }

  // Fallback local/memory deduplication
  const allTechs = await getTechnologiesList({ status: 'all' });
  const existing = allTechs.find(
    (t) => t.name.toLowerCase() === cleanName.toLowerCase() || t.slug === slug
  );

  if (existing) {
    if (roleSlugOrId) {
      const role = await getRoleBySlugOrId(roleSlugOrId);
      if (role) {
        await linkTechToRole(role.id, existing.id);
      }
    }
    return { technology: existing, isNew: false };
  }

  const newTech: Technology = {
    id: `tech-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: cleanName,
    slug,
    status: 'pending',
    is_featured: false,
    suggested_by_candidate_id: candidateId || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
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

  const exists = mappings.some(m => m.role_id === roleId && m.technology_id === techId);
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
 * Update a single technology (Approve, Reject, rename, feature) without full-table scan
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

  const supabase = getSupabaseClient();
  if (supabase) {
    const { data: existing, error: fetchErr } = await supabase
      .from('technologies')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (fetchErr) {
      throw new Error(`Database error fetching technology: ${fetchErr.message}`);
    }
    if (!existing) {
      throw new Error('Technology not found');
    }

    const updated: Technology = {
      ...existing,
      ...data,
      updated_at: new Date().toISOString(),
    };

    const { error: techErr } = await supabase
      .from('technologies')
      .update({
        name: updated.name,
        slug: updated.slug,
        status: updated.status,
        is_featured: updated.is_featured,
        updated_at: updated.updated_at,
      })
      .eq('id', id);

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
    }

    return updated;
  }

  const index = serverTechs.findIndex((t) => t.id === id);
  if (index === -1) {
    throw new Error('Technology not found');
  }
  const updated: Technology = {
    ...serverTechs[index],
    ...data,
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
 * Delete a technology with candidate safety check (zero full-table scans)
 */
export async function deleteTechnologyRecord(id: string): Promise<{ success: boolean; error?: string }> {
  // If in browser, dispatch through authenticated admin API endpoint
  if (typeof window !== 'undefined') {
    const { getAdminAuthHeaders } = await import('./auth/recruiter-auth');
    const res = await fetch(`/api/technologies/${id}`, {
      method: 'DELETE',
      headers: {
        ...getAdminAuthHeaders(),
      },
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      return { success: false, error: json.error || 'Failed to delete technology' };
    }
    return { success: true };
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

    const count = await getCandidateCountForTech(tech.name);
    if (count > 0) {
      return {
        success: false,
        error: `Cannot delete technology "${tech.name}" because it is associated with ${count} candidate(s). You can reject or hide it instead.`,
      };
    }

    await supabase.from('role_technologies').delete().eq('technology_id', id);
    const { error: delErr } = await supabase.from('technologies').delete().eq('id', id);
    if (delErr) {
      console.error('Supabase technology delete error:', delErr);
      return { success: false, error: delErr.message };
    }
    return { success: true };
  }

  const tech = serverTechs.find((t) => t.id === id);
  if (!tech) {
    return { success: false, error: 'Technology not found' };
  }

  const count = await getCandidateCountForTech(tech.name);
  if (count > 0) {
    return {
      success: false,
      error: `Cannot delete technology "${tech.name}" because it is associated with ${count} candidate(s). You can reject or hide it instead.`,
    };
  }

  serverTechs = serverTechs.filter((t) => t.id !== id);
  serverRoleTechs = serverRoleTechs.filter((m) => m.technology_id !== id);

  return { success: true };
}
