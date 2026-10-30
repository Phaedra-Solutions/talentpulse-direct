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
      const { data: dbRoles, error: rolesErr } = await supabase
        .from('roles')
        .select('*')
        .order('display_order');
      const { data: dbRoleTechs } = await supabase
        .from('role_technologies')
        .select('*');
      const { data: dbTechs } = await supabase
        .from('technologies')
        .select('*');

      if (!rolesErr && dbRoles && dbRoles.length > 0 && dbTechs) {
        let finalRoles = dbRoles.map((role: any) => {
          const techIds = (dbRoleTechs || [])
            .filter((m: any) => m.role_id === role.id)
            .map((m: any) => m.technology_id);
          const roleTechs = dbTechs.filter((t: any) => techIds.includes(t.id) && t.status === 'approved');
          return {
            ...role,
            technologies: roleTechs,
          };
        });

        if (!includeClosed) {
          finalRoles = finalRoles.filter((r: any) => r.status === 'open');
        }
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

  // Filter out closed if requested
  if (!includeClosed) {
    roles = roles.filter(r => r.status === 'open');
  }

  // Attach associated approved technologies to each role
  const rolesWithTech = roles.map(role => {
    const techIdsForRole = mappings
      .filter(m => m.role_id === role.id)
      .map(m => m.technology_id);
    
    const roleTechs = techs.filter(t => techIdsForRole.includes(t.id) && t.status === 'approved');
    return {
      ...role,
      technologies: roleTechs,
    };
  });

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

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('roles').insert([{
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
      if (newMappings.length > 0) {
        await supabase.from('role_technologies').insert(newMappings);
      }
    } catch (e) {
      console.warn('Supabase role insert warning:', e);
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

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('roles').update({
        title: updatedRole.title,
        slug: updatedRole.slug,
        short_description: updatedRole.short_description,
        description: updatedRole.description,
        status: updatedRole.status,
        display_order: updatedRole.display_order,
        updated_at: updatedRole.updated_at,
      }).eq('id', existing.id);

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
    } catch (e) {
      console.warn('Supabase role update warning:', e);
    }
  }

  if (typeof window !== 'undefined') {
    localStorage.setItem(ROLES_STORAGE_KEY, JSON.stringify(allRoles));
  } else {
    serverRoles = allRoles;
  }

  return (await getRoleBySlugOrId(existing.id))!;
}

/**
 * Count candidates associated with a role
 */
export async function getCandidateCountForRole(roleIdentifier: string): Promise<number> {
  try {
    const { getCandidatesList } = await import('./candidate-store');
    const { candidates } = await getCandidatesList();
    
    // Normalize role strings (slug vs legacy key)
    const norm = (s: string) => s.toLowerCase().replace(/[-_\s]/g, '');
    const targetNorm = norm(roleIdentifier);

    return candidates.filter(c => {
      const cNorm = norm(c.primary_role || '');
      return cNorm === targetNorm || c.primary_role === roleIdentifier;
    }).length;
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

  let allRoles = await getRolesList(true);
  allRoles = allRoles.filter(r => r.id !== role.id);

  let currentMappings: RoleTechnology[] = typeof window !== 'undefined'
    ? JSON.parse(localStorage.getItem(ROLE_TECHS_STORAGE_KEY) || '[]')
    : serverRoleTechs;
  currentMappings = currentMappings.filter(m => m.role_id !== role.id);

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('role_technologies').delete().eq('role_id', role.id);
      await supabase.from('roles').delete().eq('id', role.id);
    } catch (e) {
      console.warn('Supabase role delete warning:', e);
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

/**
 * Get technologies with filtering
 */
export async function getTechnologiesList(filters?: {
  roleId?: string;
  status?: TechnologyStatus | 'all';
  query?: string;
  limit?: number;
}): Promise<Technology[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      let q = supabase.from('technologies').select('*');
      if (filters?.status && filters.status !== 'all') {
        q = q.eq('status', filters.status);
      }
      const { data: dbTechs, error } = await q;
      const { data: dbMappings } = await supabase.from('role_technologies').select('*');

      if (!error && dbTechs && dbTechs.length > 0) {
        let techs: Technology[] = dbTechs;
        const mappings: RoleTechnology[] = dbMappings || [];

        if (filters?.roleId) {
          const techIdsForRole = mappings
            .filter(m => m.role_id === filters.roleId)
            .map(m => m.technology_id);
          techs = techs.filter(t => techIdsForRole.includes(t.id));
        }

        if (filters?.query && filters.query.trim().length > 0) {
          const term = filters.query.toLowerCase().trim();
          techs = techs.filter(t => t.name.toLowerCase().includes(term) || t.slug.includes(term));
        }

        const enriched = techs.map(t => {
          const roleIds = mappings.filter(m => m.technology_id === t.id).map(m => m.role_id);
          return { ...t, role_ids: roleIds };
        });

        if (filters?.limit && filters.limit > 0) {
          return enriched.slice(0, filters.limit);
        }
        return enriched;
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

  // Filter by status (default to approved if not specified or 'all')
  if (filters?.status && filters.status !== 'all') {
    techs = techs.filter(t => t.status === filters.status);
  }

  // Filter by role association if provided
  if (filters?.roleId) {
    const techIdsForRole = mappings
      .filter(m => m.role_id === filters.roleId)
      .map(m => m.technology_id);
    techs = techs.filter(t => techIdsForRole.includes(t.id));
  }

  // Filter by search query
  if (filters?.query && filters.query.trim().length > 0) {
    const q = filters.query.toLowerCase().trim();
    techs = techs.filter(t => t.name.toLowerCase().includes(q) || t.slug.includes(q));
  }

  // Attach role_ids to each technology
  const enriched = techs.map(t => {
    const roleIds = mappings.filter(m => m.technology_id === t.id).map(m => m.role_id);
    return { ...t, role_ids: roleIds };
  });

  if (filters?.limit && filters.limit > 0) {
    return enriched.slice(0, filters.limit);
  }

  return enriched;
}

/**
 * Get top 15 approved technologies for a given role
 */
export async function getTopTechnologiesForRole(roleIdentifier: string, limit = 15): Promise<Technology[]> {
  const role = await getRoleBySlugOrId(roleIdentifier);
  if (!role) {
    // Return general approved tech if role not found
    return getTechnologiesList({ status: 'approved', limit });
  }

  let mappings: RoleTechnology[] = typeof window !== 'undefined'
    ? JSON.parse(localStorage.getItem(ROLE_TECHS_STORAGE_KEY) || '[]')
    : serverRoleTechs;

  const techIdsForRole = mappings
    .filter(m => m.role_id === role.id)
    .map(m => m.technology_id);

  let techs: Technology[] = typeof window !== 'undefined'
    ? JSON.parse(localStorage.getItem(TECHS_STORAGE_KEY) || '[]')
    : serverTechs;

  const approvedRoleTechs = techs.filter(t => techIdsForRole.includes(t.id) && t.status === 'approved');

  // Featured first, then alphabetical
  approvedRoleTechs.sort((a, b) => {
    if (a.is_featured && !b.is_featured) return -1;
    if (!a.is_featured && b.is_featured) return 1;
    return a.name.localeCompare(b.name);
  });

  return approvedRoleTechs.slice(0, limit);
}

/**
 * Submit custom technology from candidate (handles deduplication and pending moderation)
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
  const allTechs = await getTechnologiesList({ status: 'all' });

  // Deduplication check: check if name or slug already exists (case-insensitive)
  const existing = allTechs.find(
    t => t.name.toLowerCase() === cleanName.toLowerCase() || t.slug === slug
  );

  if (existing) {
    // If it exists and a role was provided, ensure it is linked to that role
    if (roleSlugOrId) {
      const role = await getRoleBySlugOrId(roleSlugOrId);
      if (role) {
        await linkTechToRole(role.id, existing.id);
      }
    }
    return { technology: existing, isNew: false };
  }

  // Create new technology in 'pending' status
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

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('technologies').insert([{
        id: newTech.id,
        name: newTech.name,
        slug: newTech.slug,
        status: newTech.status,
        is_featured: newTech.is_featured,
        created_at: newTech.created_at,
        updated_at: newTech.updated_at,
      }]);
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
    } catch (e) {
      console.warn('Supabase technology insert warning:', e);
    }
  }

  const updatedTechs = [...allTechs, newTech];

  if (typeof window !== 'undefined') {
    localStorage.setItem(TECHS_STORAGE_KEY, JSON.stringify(updatedTechs));
  } else {
    serverTechs = updatedTechs;
  }

  // Link to role if supplied
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
 * Update a technology (Approve, Reject, rename, feature)
 */
export async function updateTechnologyRecord(
  id: string,
  data: Partial<Technology> & { role_ids?: string[] }
): Promise<Technology> {
  const allTechs = await getTechnologiesList({ status: 'all' });
  const index = allTechs.findIndex(t => t.id === id);

  if (index === -1) {
    throw new Error('Technology not found');
  }

  const existing = allTechs[index];
  const updated: Technology = {
    ...existing,
    ...data,
    updated_at: new Date().toISOString(),
  };

  allTechs[index] = updated;

  if (Array.isArray(data.role_ids)) {
    let currentMappings: RoleTechnology[] = typeof window !== 'undefined'
      ? JSON.parse(localStorage.getItem(ROLE_TECHS_STORAGE_KEY) || '[]')
      : serverRoleTechs;

    currentMappings = currentMappings.filter(m => m.technology_id !== existing.id);
    const newMappings = data.role_ids.map(roleId => ({
      role_id: roleId,
      technology_id: existing.id,
      is_featured: updated.is_featured,
    }));
    currentMappings = [...currentMappings, ...newMappings];

    if (typeof window !== 'undefined') {
      localStorage.setItem(ROLE_TECHS_STORAGE_KEY, JSON.stringify(currentMappings));
    } else {
      serverRoleTechs = currentMappings;
    }
  }

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('technologies').update({
        name: updated.name,
        slug: updated.slug,
        status: updated.status,
        is_featured: updated.is_featured,
        updated_at: updated.updated_at,
      }).eq('id', id);

      if (Array.isArray(data.role_ids)) {
        await supabase.from('role_technologies').delete().eq('technology_id', id);
        if (data.role_ids.length > 0) {
          const rows = data.role_ids.map(roleId => ({
            role_id: roleId,
            technology_id: id,
            is_featured: updated.is_featured,
          }));
          await supabase.from('role_technologies').insert(rows);
        }
      }
    } catch (e) {
      console.warn('Supabase technology update warning:', e);
    }
  }

  if (typeof window !== 'undefined') {
    localStorage.setItem(TECHS_STORAGE_KEY, JSON.stringify(allTechs));
  } else {
    serverTechs = allTechs;
  }

  return updated;
}

/**
 * Count candidates having this technology in their tech_stack
 */
export async function getCandidateCountForTech(techNameOrSlug: string): Promise<number> {
  try {
    const { getCandidatesList } = await import('./candidate-store');
    const { candidates } = await getCandidatesList();
    const clean = techNameOrSlug.toLowerCase().trim();

    return candidates.filter(c => {
      if (!Array.isArray(c.tech_stack)) return false;
      return c.tech_stack.some(t => t.toLowerCase().trim() === clean);
    }).length;
  } catch {
    return 0;
  }
}

/**
 * Delete a technology with candidate safety check
 */
export async function deleteTechnologyRecord(id: string): Promise<{ success: boolean; error?: string }> {
  const allTechs = await getTechnologiesList({ status: 'all' });
  const tech = allTechs.find(t => t.id === id);

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

  const filteredTechs = allTechs.filter(t => t.id !== id);

  let currentMappings: RoleTechnology[] = typeof window !== 'undefined'
    ? JSON.parse(localStorage.getItem(ROLE_TECHS_STORAGE_KEY) || '[]')
    : serverRoleTechs;
  currentMappings = currentMappings.filter(m => m.technology_id !== id);

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('role_technologies').delete().eq('technology_id', id);
      await supabase.from('technologies').delete().eq('id', id);
    } catch (e) {
      console.warn('Supabase technology delete warning:', e);
    }
  }

  if (typeof window !== 'undefined') {
    localStorage.setItem(TECHS_STORAGE_KEY, JSON.stringify(filteredTechs));
    localStorage.setItem(ROLE_TECHS_STORAGE_KEY, JSON.stringify(currentMappings));
  } else {
    serverTechs = filteredTechs;
    serverRoleTechs = currentMappings;
  }

  return { success: true };
}

/**
 * Reset Roles and Tech store to initial seed data
 */
export function resetRolesAndTechData(): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(ROLES_STORAGE_KEY, JSON.stringify(INITIAL_ROLES));
    localStorage.setItem(TECHS_STORAGE_KEY, JSON.stringify(INITIAL_TECHNOLOGIES));
    localStorage.setItem(ROLE_TECHS_STORAGE_KEY, JSON.stringify(INITIAL_ROLE_TECH_MAPPINGS));
  }
  serverRoles = [...INITIAL_ROLES];
  serverTechs = [...INITIAL_TECHNOLOGIES];
  serverRoleTechs = [...INITIAL_ROLE_TECH_MAPPINGS];
}
