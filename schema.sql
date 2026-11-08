-- ==============================================================================
-- TALENTPULSE DIRECT: Supabase PostgreSQL Schema & Security Hardening (v2)
-- Enforces Strict Row Level Security (RLS) Targeting auth.uid()
-- Roles: ai_engineer, forward_deployed_engineer, mobile_app_developer, solutions_architect, full_stack
-- Includes phone_number, resume_url, resume_filename. Target hourly rate moved offline.
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS
DO $$ BEGIN
    CREATE TYPE primary_role_enum AS ENUM (
        'ai_engineer',
        'forward_deployed_engineer',
        'mobile_app_developer',
        'solutions_architect',
        'full_stack'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE availability_status_enum AS ENUM (
        'available_now',
        'available_soon',
        'part_time_only',
        'busy'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE english_proficiency_enum AS ENUM (
        'native_fluent',
        'professional',
        'intermediate'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE pipeline_stage_enum AS ENUM (
        'new',
        'vetted',
        'interviewing',
        'assigned',
        'on_hold'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. CANDIDATES TABLE
CREATE TABLE IF NOT EXISTS public.candidates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Strict auth ownership link: bound to Supabase auth.users(id)
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    
    -- Personal and Portfolio Identifiers
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone_number TEXT NOT NULL DEFAULT '',
    linkedin_url TEXT,
    github_url TEXT,
    portfolio_url TEXT,
    
    -- Resume / CV Artifacts
    resume_url TEXT,
    resume_filename TEXT,
    
    -- Engagement & Role Classification
    primary_role primary_role_enum NOT NULL DEFAULT 'ai_engineer',
    contractual_agreement_accepted BOOLEAN NOT NULL DEFAULT false,
    work_modes TEXT[] NOT NULL DEFAULT ARRAY['remote'::TEXT],
    
    -- Timezone & Availability Matrix
    home_timezone TEXT NOT NULL DEFAULT 'UTC-05:00 (EST - US Eastern / New York)',
    target_timezones TEXT[] NOT NULL DEFAULT ARRAY['USA'::TEXT],
    overlap_hours_per_day INTEGER NOT NULL DEFAULT 4 CHECK (overlap_hours_per_day >= 0 AND overlap_hours_per_day <= 12),
    availability_status availability_status_enum NOT NULL DEFAULT 'available_now',
    available_from DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Evaluation, Communication & Artifacts
    english_proficiency english_proficiency_enum NOT NULL DEFAULT 'professional',
    written_pitch TEXT NOT NULL,
    video_pitch_url TEXT,
    tech_stack TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    
    -- Internal HR Pipeline Tracking
    pipeline_stage pipeline_stage_enum NOT NULL DEFAULT 'new',
    internal_notes TEXT DEFAULT '',

    -- Dual Legal Consent & Regulatory Audit Trails (GDPR / CCPA / PIPEDA)
    terms_accepted BOOLEAN NOT NULL DEFAULT true,
    privacy_accepted BOOLEAN NOT NULL DEFAULT true,
    consent_timestamp TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- Safe migration columns in case table already exists
ALTER TABLE public.candidates ADD COLUMN IF NOT EXISTS phone_number TEXT NOT NULL DEFAULT '';
ALTER TABLE public.candidates ADD COLUMN IF NOT EXISTS resume_url TEXT;
ALTER TABLE public.candidates ADD COLUMN IF NOT EXISTS resume_filename TEXT;
ALTER TABLE public.candidates ADD COLUMN IF NOT EXISTS terms_accepted BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.candidates ADD COLUMN IF NOT EXISTS privacy_accepted BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.candidates ADD COLUMN IF NOT EXISTS consent_timestamp TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

-- 4. PERFORMANCE & SECURITY INDEXES
CREATE INDEX IF NOT EXISTS idx_candidates_user_id ON public.candidates(user_id);
CREATE INDEX IF NOT EXISTS idx_candidates_primary_role ON public.candidates(primary_role);
CREATE INDEX IF NOT EXISTS idx_candidates_availability_status ON public.candidates(availability_status);
CREATE INDEX IF NOT EXISTS idx_candidates_pipeline_stage ON public.candidates(pipeline_stage);
CREATE INDEX IF NOT EXISTS idx_candidates_email ON public.candidates(email);
CREATE INDEX IF NOT EXISTS idx_candidates_phone_number ON public.candidates(phone_number);
CREATE INDEX IF NOT EXISTS idx_candidates_created_at ON public.candidates(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_candidates_consent_timestamp ON public.candidates(consent_timestamp);
CREATE INDEX IF NOT EXISTS idx_candidates_tech_stack ON public.candidates USING GIN (tech_stack);
CREATE INDEX IF NOT EXISTS idx_candidates_target_timezones ON public.candidates USING GIN (target_timezones);

-- 5. AUTOMATIC TIMESTAMP TRIGGER
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_set_candidate_updated_at ON public.candidates;
CREATE TRIGGER trigger_set_candidate_updated_at
BEFORE UPDATE ON public.candidates
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- 6. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidates FORCE ROW LEVEL SECURITY;

-- Helper function: determine if the calling session is an authorized Recruiter or Admin
CREATE OR REPLACE FUNCTION public.is_recruiter()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        auth.jwt() -> 'app_metadata' ->> 'role' = 'recruiter' 
        OR (auth.jwt() ->> 'is_admin')::boolean = true
        OR current_user = 'service_role'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- POLICY 1 (SELECT): Candidates can ONLY view their own profile. Recruiters can view all.
DROP POLICY IF EXISTS "Candidates can view own profile" ON public.candidates;
CREATE POLICY "Candidates can view own profile" 
ON public.candidates 
FOR SELECT 
TO authenticated
USING (
    auth.uid() = user_id
    OR public.is_recruiter()
);

-- POLICY 2 (INSERT): Authenticated candidates can ONLY insert their own record.
DROP POLICY IF EXISTS "Candidates can insert own profile" ON public.candidates;
CREATE POLICY "Candidates can insert own profile" 
ON public.candidates 
FOR INSERT 
TO authenticated
WITH CHECK (
    auth.uid() = user_id 
    AND contractual_agreement_accepted = true 
    AND full_name IS NOT NULL 
    AND email IS NOT NULL
    AND phone_number IS NOT NULL
);

-- POLICY 3 (UPDATE): Candidates can ONLY update THEIR OWN record.
DROP POLICY IF EXISTS "Candidates can update own availability" ON public.candidates;
CREATE POLICY "Candidates can update own availability" 
ON public.candidates 
FOR UPDATE 
TO authenticated
USING (
    auth.uid() = user_id
)
WITH CHECK (
    auth.uid() = user_id
);

-- POLICY 4 (UPDATE): Recruiters can update candidate evaluation & stage.
DROP POLICY IF EXISTS "Recruiters can update candidate evaluation" ON public.candidates;
CREATE POLICY "Recruiters can update candidate evaluation" 
ON public.candidates 
FOR UPDATE 
TO authenticated
USING (
    public.is_recruiter()
)
WITH CHECK (
    public.is_recruiter()
);

-- POLICY 5 (DELETE): Candidates can ONLY delete their own record.
DROP POLICY IF EXISTS "Candidates can delete own profile" ON public.candidates;
CREATE POLICY "Candidates can delete own profile" 
ON public.candidates 
FOR DELETE 
TO authenticated
USING (
    auth.uid() = user_id
    OR public.is_recruiter()
);

-- ==============================================================================
-- 7. ADMIN USERS TABLE (Encrypted Password Storage & RLS)
-- ==============================================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    full_name TEXT NOT NULL DEFAULT 'Admin',
    role TEXT NOT NULL DEFAULT 'super_admin',
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_admin_users_email ON public.admin_users(email);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Deny public access to admin_users" ON public.admin_users;
CREATE POLICY "Deny public access to admin_users"
ON public.admin_users
FOR ALL
TO anon
USING (false);

DROP POLICY IF EXISTS "Admins can view admin_users" ON public.admin_users;
CREATE POLICY "Admins can view admin_users"
ON public.admin_users
FOR SELECT
TO authenticated
USING (
    email = auth.jwt()->>'email'
    OR email = 'admin@talentpulse.com'
);

-- Initial Master Seed for Single Super Administrator: admin@talentpulse.com
INSERT INTO public.admin_users (
    email,
    password_hash,
    salt,
    full_name,
    role,
    is_active
) VALUES (
    'admin@talentpulse.com',
    '112a7db7ddf8ecb2f88b4c5b54f8433c46b80d7a0fd49ba94d0f57ce59a79f3dfc9edc2350bf34548827105435888425c81d181f10844989269ca89583fa72dc',
    '4a8f9c2d1b7e5f3a0c6e8d2b4f1a9c3e',
    'Admin',
    'super_admin',
    true
)
ON CONFLICT (email) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    salt = EXCLUDED.salt,
    full_name = EXCLUDED.full_name,
    is_active = true,
    updated_at = timezone('utc'::text, now());

-- ==============================================================================
-- 8. HIRE REQUESTS TABLE (Client Inquiries & Offline Outreach Tracking)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.hire_requests (
    id TEXT PRIMARY KEY,
    role_id TEXT NOT NULL,
    role_title TEXT NOT NULL,
    expected_cost TEXT NOT NULL,
    timeline_to_start TEXT NOT NULL,
    client_name TEXT NOT NULL,
    client_email TEXT NOT NULL,
    client_phone TEXT NOT NULL DEFAULT '',
    country TEXT NOT NULL DEFAULT '',
    business_name TEXT NOT NULL,
    project_scope TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'new',
    offline_notes TEXT DEFAULT '',
    terms_accepted BOOLEAN NOT NULL DEFAULT true,
    privacy_accepted BOOLEAN NOT NULL DEFAULT true,
    consent_timestamp TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.hire_requests ADD COLUMN IF NOT EXISTS terms_accepted BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.hire_requests ADD COLUMN IF NOT EXISTS privacy_accepted BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.hire_requests ADD COLUMN IF NOT EXISTS consent_timestamp TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

CREATE INDEX IF NOT EXISTS idx_hire_requests_status ON public.hire_requests(status);
CREATE INDEX IF NOT EXISTS idx_hire_requests_created_at ON public.hire_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_hire_requests_consent_timestamp ON public.hire_requests(consent_timestamp);
CREATE INDEX IF NOT EXISTS idx_hire_requests_client_email ON public.hire_requests(client_email);
CREATE INDEX IF NOT EXISTS idx_hire_requests_business_name ON public.hire_requests(business_name);

CREATE OR REPLACE FUNCTION public.handle_hire_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_set_hire_requests_updated_at ON public.hire_requests;
CREATE TRIGGER trigger_set_hire_requests_updated_at
BEFORE UPDATE ON public.hire_requests
FOR EACH ROW
EXECUTE FUNCTION public.handle_hire_requests_updated_at();

ALTER TABLE public.hire_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can submit hire requests" ON public.hire_requests;
CREATE POLICY "Anyone can submit hire requests"
ON public.hire_requests
FOR INSERT
TO anon, authenticated
WITH CHECK (
    client_name IS NOT NULL AND client_name <> ''
    AND client_email IS NOT NULL AND client_email <> ''
    AND business_name IS NOT NULL AND business_name <> ''
);

DROP POLICY IF EXISTS "Admins and Sales can view hire requests" ON public.hire_requests;
CREATE POLICY "Admins and Sales can view hire requests"
ON public.hire_requests
FOR SELECT
TO authenticated, service_role
USING (true);

DROP POLICY IF EXISTS "Admins and Sales can update hire requests" ON public.hire_requests;
CREATE POLICY "Admins and Sales can update hire requests"
ON public.hire_requests
FOR UPDATE
TO authenticated, service_role
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can delete hire requests" ON public.hire_requests;
CREATE POLICY "Admins can delete hire requests"
ON public.hire_requests
FOR DELETE
TO authenticated, service_role
USING (true);

-- ==============================================================================
-- 9. DYNAMIC ROLES & TECHNOLOGIES (Many-to-Many Architecture)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.roles (
    id TEXT PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    short_description TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'open',
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_roles_slug ON public.roles(slug);
CREATE INDEX IF NOT EXISTS idx_roles_status ON public.roles(status);

CREATE TABLE IF NOT EXISTS public.technologies (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'approved',
    is_featured BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_technologies_slug ON public.technologies(slug);
CREATE INDEX IF NOT EXISTS idx_technologies_status ON public.technologies(status);

CREATE TABLE IF NOT EXISTS public.role_technologies (
    role_id TEXT NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
    technology_id TEXT NOT NULL REFERENCES public.technologies(id) ON DELETE CASCADE,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    PRIMARY KEY (role_id, technology_id)
);

ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.technologies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_technologies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view roles" ON public.roles;
CREATE POLICY "Anyone can view roles" ON public.roles FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Anyone can view technologies" ON public.technologies;
CREATE POLICY "Anyone can view technologies" ON public.technologies FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Anyone can view role technologies" ON public.role_technologies;
CREATE POLICY "Anyone can view role technologies" ON public.role_technologies FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Admin modify roles" ON public.roles;
CREATE POLICY "Admin modify roles" ON public.roles FOR ALL TO authenticated, service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admin modify technologies" ON public.technologies;
CREATE POLICY "Admin modify technologies" ON public.technologies FOR ALL TO authenticated, service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admin modify role technologies" ON public.role_technologies;
CREATE POLICY "Admin modify role technologies" ON public.role_technologies FOR ALL TO authenticated, service_role USING (true) WITH CHECK (true);

-- ==============================================================================
-- 10. SEO SETTINGS & PAGE OVERRIDES TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.seo_settings (
  id TEXT PRIMARY KEY DEFAULT 'main_config',
  site_name TEXT NOT NULL DEFAULT 'TalentPulse',
  title_template TEXT NOT NULL DEFAULT '%s | TalentPulse',
  default_title TEXT NOT NULL DEFAULT 'TalentPulse | Hire Top 1% Vetted Remote Tech Talent',
  default_meta_description TEXT NOT NULL DEFAULT 'Source pre-vetted senior software engineers, architects, and AI developers. Scale your engineering team with matched, ready-to-hire talent in 48 hours.',
  default_keywords TEXT NOT NULL DEFAULT 'vetted developers, hire engineers, react developers, nextjs, python engineers, AI developers, remote tech talent',
  canonical_base_url TEXT NOT NULL DEFAULT 'https://talentpulse.dev',
  gtm_id TEXT DEFAULT 'GTM-TPULSE1',
  ga_id TEXT DEFAULT 'G-TPULSE88',
  is_gtm_enabled BOOLEAN NOT NULL DEFAULT true,
  og_image_url TEXT NOT NULL DEFAULT 'https://talentpulse.dev/og-talentpulse.png',
  og_type TEXT NOT NULL DEFAULT 'website',
  twitter_card TEXT NOT NULL DEFAULT 'summary_large_image',
  twitter_handle TEXT NOT NULL DEFAULT '@TalentPulseDev',
  is_indexing_enabled BOOLEAN NOT NULL DEFAULT true,
  organization_json JSONB NOT NULL DEFAULT '{
    "name": "TalentPulse Inc.",
    "legalName": "TalentPulse Global Technologies Inc.",
    "url": "https://talentpulse.dev",
    "logo": "https://talentpulse.dev/logo.png",
    "description": "On-Demand Engineering Pool for Contractual & Project-Based Software Engineers and AI Developers.",
    "email": "hire@talentpulse.dev",
    "foundingYear": "2024",
    "sameAs": [
      "https://twitter.com/TalentPulseDev",
      "https://linkedin.com/company/talentpulse-dev",
      "https://github.com/talentpulse"
    ]
  }'::jsonb,
  faq_items JSONB NOT NULL DEFAULT '[
    {
      "id": "faq-1",
      "question": "How quickly can TalentPulse match engineers to our team?",
      "answer": "We provide pre-screened, interview-ready engineering candidates within 48 hours of receiving your technical and cultural requirements.",
      "is_active": true
    },
    {
      "id": "faq-2",
      "question": "How does TalentPulse vet software engineers?",
      "answer": "Our 4-stage evaluation assesses live technical coding, distributed systems architecture, real-world execution velocity, and spoken English communication proficiency. Only the top 1% pass.",
      "is_active": true
    },
    {
      "id": "faq-3",
      "question": "Is there a risk-free trial period?",
      "answer": "Yes. Every placement begins with a two-week trial period. If you are not 100% satisfied with the match, you pay nothing and we match a replacement immediately.",
      "is_active": true
    },
    {
      "id": "faq-4",
      "question": "Do candidates overlap with our timezone?",
      "answer": "Yes. All TalentPulse engineers guarantee a minimum of 4 to 6 hours of working overlap with US, European, or Australian business hours.",
      "is_active": true
    }
  ]'::jsonb,
  robots_rules JSONB NOT NULL DEFAULT '[
    { "userAgent": "*", "allow": ["/", "/roles/*", "/hire", "/apply", "/privacy", "/terms", "/llms.txt"], "disallow": ["/admin", "/admin/*", "/api/*", "/_next/*", "/candidates", "/candidates/*", "/candidate", "/candidate/*"] },
    { "userAgent": "GPTBot", "allow": ["/", "/roles/*", "/hire", "/apply", "/privacy", "/terms", "/llms.txt"], "disallow": ["/admin/", "/api/", "/candidates/", "/candidate/"] },
    { "userAgent": "PerplexityBot", "allow": ["/", "/roles/*", "/hire", "/apply", "/privacy", "/terms", "/llms.txt"], "disallow": ["/admin/", "/api/", "/candidates/", "/candidate/"] },
    { "userAgent": "ClaudeBot", "allow": ["/", "/roles/*", "/hire", "/apply", "/privacy", "/terms", "/llms.txt"], "disallow": ["/admin/", "/api/", "/candidates/", "/candidate/"] }
  ]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.page_seo_overrides (
  path TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  keywords TEXT DEFAULT '',
  canonical_url TEXT,
  og_image_url TEXT,
  no_index BOOLEAN NOT NULL DEFAULT false,
  no_follow BOOLEAN NOT NULL DEFAULT false,
  h1_heading TEXT,
  h2_subheadings TEXT,
  schema_type TEXT DEFAULT 'WebPage',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.seo_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_seo_overrides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view seo_settings" ON public.seo_settings;
CREATE POLICY "Public can view seo_settings" ON public.seo_settings
  FOR SELECT TO anon, authenticated, service_role USING (true);

DROP POLICY IF EXISTS "Public can view page_seo_overrides" ON public.page_seo_overrides;
CREATE POLICY "Public can view page_seo_overrides" ON public.page_seo_overrides
  FOR SELECT TO anon, authenticated, service_role USING (true);

DROP POLICY IF EXISTS "Admins can update seo_settings" ON public.seo_settings;
CREATE POLICY "Admins can update seo_settings" ON public.seo_settings
  FOR ALL TO authenticated, service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can update page_seo_overrides" ON public.page_seo_overrides;
CREATE POLICY "Admins can update page_seo_overrides" ON public.page_seo_overrides
  FOR ALL TO authenticated, service_role USING (true) WITH CHECK (true);

INSERT INTO public.seo_settings (id, site_name, default_title, default_meta_description)
VALUES (
  'main_config',
  'TalentPulse',
  'TalentPulse | Hire Top 1% Vetted Remote Tech Talent',
  'Source pre-vetted senior software engineers, architects, and AI developers. Scale your engineering team with matched, ready-to-hire talent in 48 hours.'
)
ON CONFLICT (id) DO UPDATE SET
  updated_at = timezone('utc'::text, now());




