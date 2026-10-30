-- ==============================================================================
-- MIGRATION: 20261030000004_create_roles_and_technologies_schema.sql
-- Description:
--   1. Creates public.roles, public.technologies, and public.role_technologies junction table
--   2. Enforces Many-to-Many relationships and Row Level Security (RLS)
--   3. Seeds all 6 core roles, 40+ approved technologies, and initial mappings
-- ==============================================================================

-- 1. ROLES TABLE
CREATE TABLE IF NOT EXISTS public.roles (
    id TEXT PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    short_description TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'open', -- 'open', 'closed'
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_roles_slug ON public.roles(slug);
CREATE INDEX IF NOT EXISTS idx_roles_status ON public.roles(status);
CREATE INDEX IF NOT EXISTS idx_roles_display_order ON public.roles(display_order);

-- 2. TECHNOLOGIES TABLE
CREATE TABLE IF NOT EXISTS public.technologies (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'approved', -- 'approved', 'pending', 'rejected'
    is_featured BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_technologies_slug ON public.technologies(slug);
CREATE INDEX IF NOT EXISTS idx_technologies_status ON public.technologies(status);
CREATE INDEX IF NOT EXISTS idx_technologies_name ON public.technologies(name);

-- 3. ROLE_TECHNOLOGIES (MANY-TO-MANY JUNCTION TABLE)
CREATE TABLE IF NOT EXISTS public.role_technologies (
    role_id TEXT NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
    technology_id TEXT NOT NULL REFERENCES public.technologies(id) ON DELETE CASCADE,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    PRIMARY KEY (role_id, technology_id)
);

CREATE INDEX IF NOT EXISTS idx_role_technologies_role_id ON public.role_technologies(role_id);
CREATE INDEX IF NOT EXISTS idx_role_technologies_tech_id ON public.role_technologies(technology_id);

-- 4. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.technologies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_technologies ENABLE ROW LEVEL SECURITY;

-- Anyone can view open or all roles
DROP POLICY IF EXISTS "Anyone can view roles" ON public.roles;
CREATE POLICY "Anyone can view roles" ON public.roles FOR SELECT TO anon, authenticated USING (true);

-- Anyone can view approved technologies (and admins view all)
DROP POLICY IF EXISTS "Anyone can view technologies" ON public.technologies;
CREATE POLICY "Anyone can view technologies" ON public.technologies FOR SELECT TO anon, authenticated USING (true);

-- Anyone can view role-technology mappings
DROP POLICY IF EXISTS "Anyone can view role technologies" ON public.role_technologies;
CREATE POLICY "Anyone can view role technologies" ON public.role_technologies FOR SELECT TO anon, authenticated USING (true);

-- Allow authenticated users or service role to insert, update, delete
DROP POLICY IF EXISTS "Admin modify roles" ON public.roles;
CREATE POLICY "Admin modify roles" ON public.roles FOR ALL TO authenticated, service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admin modify technologies" ON public.technologies;
CREATE POLICY "Admin modify technologies" ON public.technologies FOR ALL TO authenticated, service_role USING (true) WITH CHECK (true);

-- Allow anonymous submission of custom technologies (starts as pending)
DROP POLICY IF EXISTS "Anyone can insert custom technology" ON public.technologies;
CREATE POLICY "Anyone can insert custom technology" ON public.technologies FOR INSERT TO anon WITH CHECK (status = 'pending');

DROP POLICY IF EXISTS "Admin modify role technologies" ON public.role_technologies;
CREATE POLICY "Admin modify role technologies" ON public.role_technologies FOR ALL TO authenticated, service_role USING (true) WITH CHECK (true);

-- ==============================================================================
-- 5. SEED DATA: 6 CORE ENGINEERING & LEADERSHIP ROLES
-- ==============================================================================
INSERT INTO public.roles (id, slug, title, short_description, description, status, display_order)
VALUES
(
  'role-ai-llm-engineer',
  'ai-llm-engineer',
  'AI & LLM Engineer',
  'Fine-tuning models and high-throughput inference. Multi-agent workflows, vLLM microservices, and specialized RAG pipelines.',
  '### Role Overview
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
- Fluent professional English for direct technical sprint communications.',
  'open',
  1
),
(
  'role-forward-deployed-engineer',
  'forward-deployed-engineer',
  'Forward Deployed Engineer',
  'Embed directly with client enterprise accounts to bridge product architectures, build custom conduits, and automate workflows.',
  '### Role Overview
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
- 5+ hours daily overlap with client operational working hours.',
  'open',
  2
),
(
  'role-mobile-developers',
  'mobile-developers',
  'Mobile Developers',
  'High-performance applications for iOS and Android. Offline-first architectures, low-latency streaming, and device-native hardware bridging.',
  '### Role Overview
Deliver fluid, high-velocity native and cross-platform mobile experiences for high-growth consumer and enterprise applications.

### Key Responsibilities
- **Offline-First Synchronization**: Engineer robust local persistence and reconciliation algorithms handling unpredictable connectivity.
- **Fluid Micro-Interactions**: Achieve 60/120fps UI performance with native thread animation pipelines.
- **Cross-Platform & Native Bridge**: Develop core modules in React Native or Flutter, coupled with Swift and Kotlin native modules where hardware access is required.
- **Release Automation**: Configure Fastlane CI/CD pipelines for automated TestFlight and Play Store internal tracks.

### Requirements & Delivery Standards
- 4+ years of proven mobile application development shipping to production stores.
- Deep expertise in React Native, Swift, Kotlin, or Flutter with state management patterns.
- High aesthetic standards regarding layout fidelity and touch responsiveness.',
  'open',
  3
),
(
  'role-solutions-architects',
  'solutions-architects',
  'Solutions Architects',
  'Multi-cloud systems, distributed event messaging, database clustering, and high-concurrency architecture governance.',
  '### Role Overview
Design and audit distributed infrastructure capable of sustaining hundred-thousand concurrent user loads, zero-downtime database migrations, and strict security compliance.

### Key Responsibilities
- **Multi-Cloud Architecture**: Formulate resilient topologies spanning AWS, GCP, and Azure with Terraform Infrastructure-as-Code.
- **Event-Driven Backbones**: Architect high-throughput Kafka and RabbitMQ streams for asynchronous messaging.
- **Data Partitioning & Caching**: Implement multi-tier caching with Redis and horizontal database sharding.
- **Security & Compliance Auditing**: Harden cloud IAM, TLS termination, network VPC peering, and encryption-at-rest.

### Requirements & Delivery Standards
- 6+ years designing large-scale distributed systems and cloud infrastructure.
- Professional AWS, GCP, or Kubernetes certifications preferred.
- Outstanding ability to produce clear architectural diagrams and executive RFCs.',
  'open',
  4
),
(
  'role-full-stack-developers',
  'full-stack-developers',
  'Full-Stack Developers',
  'Modern Next.js App Router, TypeScript, React Server Components, high-velocity APIs, and resilient transactional databases.',
  '### Role Overview
Senior engineering generalists capable of taking a greenfield feature or mission-critical contract deliverable from database schema to responsive front-end in record time.

### Key Responsibilities
- **End-to-End Delivery**: Build complete features utilizing Next.js, React, Node.js, and PostgreSQL.
- **Modern React Architectures**: Leverage React Server Components, Suspense, and optimistic UI updates for instantaneous user interactions.
- **API Design**: Implement clean REST and GraphQL endpoints backed by strict Zod schema validation.
- **Test Coverage**: Write robust integration test suites ensuring regression-free deployments.

### Requirements & Delivery Standards
- 4+ years full-stack JavaScript/TypeScript engineering experience.
- Deep knowledge of relational SQL databases (PostgreSQL), indexes, and query plans.
- High ownership mindset with proven ability to unblock dependencies independently.',
  'open',
  5
),
(
  'role-fractional-cto',
  'fractional-cto',
  'Fractional CTO',
  'Strategic technical leadership, architecture due diligence, cloud cost optimization, and team scaling for high-growth ventures.',
  '### Future Track Overview
TalentPulse Direct is curating an elite pool of battle-tested Fractional CTOs for startups and enterprises seeking strategic technical leadership without full-time executive overhead.

### Key Focus Areas
- **Technical Strategy & Roadmap**: Align engineering execution directly with commercial milestones and runway targets.
- **Architecture Due Diligence**: Audit legacy tech debt, security postures, and scalability bottlenecks prior to Series A/B or acquisitions.
- **Vendor & Cloud Optimization**: Re-architect cloud spending patterns to achieve 30-50% infrastructure cost reductions.
- **Hiring & Culture Formation**: Establish vetting rubrics, interview candidate leads, and mentor internal team leads.

### Future Candidate Pipeline
*Note: This track is currently in our curated Future Track pool. Applications submitted today are prioritized for immediate matching as incoming enterprise partner mandates open.*',
  'closed',
  6
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  short_description = EXCLUDED.short_description,
  description = EXCLUDED.description,
  status = EXCLUDED.status,
  display_order = EXCLUDED.display_order;

-- ==============================================================================
-- 6. SEED DATA: 40+ TECHNOLOGIES
-- ==============================================================================
INSERT INTO public.technologies (id, name, slug, status, is_featured)
VALUES
-- AI & ML
('tech-python', 'Python', 'python', 'approved', true),
('tech-pytorch', 'PyTorch', 'pytorch', 'approved', true),
('tech-vllm', 'vLLM', 'vllm', 'approved', true),
('tech-langchain', 'LangChain', 'langchain', 'approved', false),
('tech-llamaindex', 'LlamaIndex', 'llamaindex', 'approved', false),
('tech-triton', 'Triton', 'triton', 'approved', true),
('tech-huggingface', 'Hugging Face', 'hugging-face', 'approved', false),
('tech-lora', 'LoRA / QLoRA', 'lora-qlora', 'approved', true),
('tech-fastapi', 'FastAPI', 'fastapi', 'approved', false),
('tech-vector-db', 'Vector Databases', 'vector-databases', 'approved', false),

-- Cloud & Infrastructure
('tech-go', 'Go', 'go', 'approved', true),
('tech-kubernetes', 'Kubernetes', 'kubernetes', 'approved', true),
('tech-docker', 'Docker', 'docker', 'approved', true),
('tech-terraform', 'Terraform', 'terraform', 'approved', true),
('tech-aws', 'AWS', 'aws', 'approved', true),
('tech-gcp', 'GCP', 'gcp', 'approved', true),
('tech-webhooks', 'Webhooks & Middleware', 'webhooks-middleware', 'approved', false),
('tech-grpc', 'gRPC', 'grpc', 'approved', false),
('tech-client-eng', 'Client Engineering', 'client-engineering', 'approved', false),
('tech-kafka', 'Kafka', 'kafka', 'approved', true),

-- Mobile
('tech-react-native', 'React Native', 'react-native', 'approved', true),
('tech-swift', 'Swift / iOS', 'swift-ios', 'approved', true),
('tech-kotlin', 'Kotlin / Android', 'kotlin-android', 'approved', true),
('tech-flutter', 'Flutter', 'flutter', 'approved', false),
('tech-swiftui', 'SwiftUI', 'swiftui', 'approved', false),
('tech-sqlite', 'SQLite', 'sqlite', 'approved', false),
('tech-fastlane', 'Fastlane', 'fastlane', 'approved', false),

-- Full-Stack & Web
('tech-typescript', 'TypeScript', 'typescript', 'approved', true),
('tech-nextjs', 'Next.js', 'nextjs', 'approved', true),
('tech-react', 'React', 'react', 'approved', true),
('tech-nodejs', 'Node.js', 'nodejs', 'approved', false),
('tech-postgresql', 'PostgreSQL', 'postgresql', 'approved', true),
('tech-redis', 'Redis', 'redis', 'approved', false),
('tech-supabase', 'Supabase', 'supabase', 'approved', false),
('tech-graphql', 'GraphQL', 'graphql', 'approved', false),
('tech-tailwind', 'Tailwind CSS', 'tailwind-css', 'approved', false),

-- Fractional CTO / Strategic
('tech-tech-strategy', 'Tech Strategy', 'tech-strategy', 'approved', true),
('tech-architecture-audit', 'Architecture Due Diligence', 'architecture-due-diligence', 'approved', true),
('tech-cloud-cost', 'Cloud Cost Optimization', 'cloud-cost-optimization', 'approved', true),
('tech-soc2', 'SOC2 Compliance', 'soc2-compliance', 'approved', false),
('tech-team-scaling', 'Team Scaling & Rubrics', 'team-scaling-rubrics', 'approved', false)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  status = EXCLUDED.status,
  is_featured = EXCLUDED.is_featured;

-- ==============================================================================
-- 7. SEED DATA: ROLE <-> TECHNOLOGY MAPPINGS
-- ==============================================================================
INSERT INTO public.role_technologies (role_id, technology_id, is_featured)
VALUES
-- AI & LLM Engineer
('role-ai-llm-engineer', 'tech-python', true),
('role-ai-llm-engineer', 'tech-pytorch', true),
('role-ai-llm-engineer', 'tech-vllm', true),
('role-ai-llm-engineer', 'tech-lora', true),
('role-ai-llm-engineer', 'tech-triton', true),
('role-ai-llm-engineer', 'tech-langchain', false),
('role-ai-llm-engineer', 'tech-llamaindex', false),
('role-ai-llm-engineer', 'tech-fastapi', false),
('role-ai-llm-engineer', 'tech-vector-db', false),
('role-ai-llm-engineer', 'tech-docker', false),
('role-ai-llm-engineer', 'tech-huggingface', false),
('role-ai-llm-engineer', 'tech-redis', false),

-- Forward Deployed Engineer
('role-forward-deployed-engineer', 'tech-go', true),
('role-forward-deployed-engineer', 'tech-python', true),
('role-forward-deployed-engineer', 'tech-kubernetes', true),
('role-forward-deployed-engineer', 'tech-docker', true),
('role-forward-deployed-engineer', 'tech-webhooks', false),
('role-forward-deployed-engineer', 'tech-client-eng', false),
('role-forward-deployed-engineer', 'tech-terraform', false),
('role-forward-deployed-engineer', 'tech-aws', false),
('role-forward-deployed-engineer', 'tech-grpc', false),
('role-forward-deployed-engineer', 'tech-graphql', false),
('role-forward-deployed-engineer', 'tech-nextjs', false),

-- Mobile Developers
('role-mobile-developers', 'tech-react-native', true),
('role-mobile-developers', 'tech-swift', true),
('role-mobile-developers', 'tech-kotlin', true),
('role-mobile-developers', 'tech-flutter', false),
('role-mobile-developers', 'tech-typescript', false),
('role-mobile-developers', 'tech-swiftui', false),
('role-mobile-developers', 'tech-sqlite', false),
('role-mobile-developers', 'tech-fastlane', false),
('role-mobile-developers', 'tech-supabase', false),

-- Solutions Architects
('role-solutions-architects', 'tech-aws', true),
('role-solutions-architects', 'tech-gcp', true),
('role-solutions-architects', 'tech-terraform', true),
('role-solutions-architects', 'tech-kubernetes', true),
('role-solutions-architects', 'tech-kafka', true),
('role-solutions-architects', 'tech-postgresql', false),
('role-solutions-architects', 'tech-redis', false),
('role-solutions-architects', 'tech-docker', false),
('role-solutions-architects', 'tech-soc2', false),
('role-solutions-architects', 'tech-go', false),
('role-solutions-architects', 'tech-grpc', false),

-- Full-Stack Developers
('role-full-stack-developers', 'tech-nextjs', true),
('role-full-stack-developers', 'tech-react', true),
('role-full-stack-developers', 'tech-typescript', true),
('role-full-stack-developers', 'tech-postgresql', true),
('role-full-stack-developers', 'tech-tailwind', false),
('role-full-stack-developers', 'tech-nodejs', false),
('role-full-stack-developers', 'tech-supabase', false),
('role-full-stack-developers', 'tech-redis', false),
('role-full-stack-developers', 'tech-docker', false),
('role-full-stack-developers', 'tech-graphql', false),

-- Fractional CTO
('role-fractional-cto', 'tech-tech-strategy', true),
('role-fractional-cto', 'tech-architecture-audit', true),
('role-fractional-cto', 'tech-cloud-cost', true),
('role-fractional-cto', 'tech-soc2', false),
('role-fractional-cto', 'tech-team-scaling', false),
('role-fractional-cto', 'tech-aws', false)
ON CONFLICT (role_id, technology_id) DO UPDATE SET
  is_featured = EXCLUDED.is_featured;
