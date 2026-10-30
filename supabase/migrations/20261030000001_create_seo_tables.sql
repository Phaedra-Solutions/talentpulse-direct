-- Migration: 20261030000001_create_seo_tables.sql
-- Description: Create seo_settings and page_seo_overrides tables with strict RLS and initial metadata

-- 1. Global SEO Settings Table (Singleton pattern with id = 'main_config')
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
    { "userAgent": "*", "allow": ["/", "/candidates", "/candidates/*", "/hire-request", "/llms.txt"], "disallow": ["/admin", "/admin/*", "/api/*", "/_next/*"] },
    { "userAgent": "GPTBot", "allow": ["/", "/llms.txt"], "disallow": ["/admin/", "/api/"] },
    { "userAgent": "PerplexityBot", "allow": ["/", "/llms.txt"], "disallow": ["/admin/", "/api/"] },
    { "userAgent": "ClaudeBot", "allow": ["/", "/llms.txt"], "disallow": ["/admin/", "/api/"] }
  ]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Page Specific SEO Overrides Table
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

-- 3. Row Level Security Policies (Admin Restricted)
ALTER TABLE public.seo_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_seo_overrides ENABLE ROW LEVEL SECURITY;

-- Allow anyone (public/SSR) to read SEO settings for rendering metadata & robots
DROP POLICY IF EXISTS "Public can view seo_settings" ON public.seo_settings;
CREATE POLICY "Public can view seo_settings" ON public.seo_settings
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can view page_seo_overrides" ON public.page_seo_overrides;
CREATE POLICY "Public can view page_seo_overrides" ON public.page_seo_overrides
  FOR SELECT USING (true);

-- Allow authenticated admins to insert/update/delete seo_settings
DROP POLICY IF EXISTS "Admins can update seo_settings" ON public.seo_settings;
CREATE POLICY "Admins can update seo_settings" ON public.seo_settings
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can update page_seo_overrides" ON public.page_seo_overrides;
CREATE POLICY "Admins can update page_seo_overrides" ON public.page_seo_overrides
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 4. Seed Initial Global Settings
INSERT INTO public.seo_settings (id, site_name, default_title, default_meta_description)
VALUES (
  'main_config',
  'TalentPulse',
  'TalentPulse | Hire Top 1% Vetted Remote Tech Talent',
  'Source pre-vetted senior software engineers, architects, and AI developers. Scale your engineering team with matched, ready-to-hire talent in 48 hours.'
)
ON CONFLICT (id) DO UPDATE SET
  updated_at = timezone('utc'::text, now());

-- 5. Seed Initial Page-Specific Overrides from Specification Review Table
INSERT INTO public.page_seo_overrides (path, title, description, keywords, canonical_url, no_index, no_follow, h1_heading, schema_type)
VALUES
  (
    '/',
    'TalentPulse | Hire Top 1% Vetted Remote Tech Talent',
    'Source pre-vetted senior software engineers, architects, and AI developers. Scale your engineering team with matched, ready-to-hire talent in 48 hours.',
    'hire developers, senior engineers, vetted tech talent, on-demand engineering',
    'https://talentpulse.dev/',
    false,
    false,
    'Hire Top 1% Vetted Tech Talent On Demand',
    'WebSite'
  ),
  (
    '/candidates',
    'Browse Vetted Tech Talent & Developers | TalentPulse',
    'Explore verified full-stack, backend, frontend, and AI engineers. Filter by technology stack, experience level, rate, and immediate availability.',
    'developer directory, vetted engineers, hire software engineers, talent roster',
    'https://talentpulse.dev/candidates',
    false,
    false,
    'Vetted Engineers & Technical Leaders',
    'CollectionPage'
  ),
  (
    '/hire-request',
    'Hire Top Engineers in 48 Hours | TalentPulse Request',
    'Submit your tech stack requirements and team scale goals. Our technical team matches pre-screened, interview-ready engineers in as little as 48 hours.',
    'hire developers request, engineering staffing, software development team match',
    'https://talentpulse.dev/hire-request',
    false,
    false,
    'Request Your Engineering Match',
    'ContactPage'
  ),
  (
    '/candidates/[id]',
    '{Candidate Name} – {Role Title} | TalentPulse Profile',
    'View verified portfolio, primary skills, years of experience, and availability for contract or full-time placement.',
    'candidate profile, engineer resume, vetted developer',
    'https://talentpulse.dev/candidates/{id}',
    false,
    false,
    '{Candidate Name} – {Role Title}',
    'ProfilePage'
  ),
  (
    '/admin',
    'TalentPulse Admin Portal',
    'TalentPulse administration workspace for managing talent profiles, hire requests, system analytics, and platform configuration.',
    'admin portal, internal workspace',
    'https://talentpulse.dev/admin',
    true,
    true,
    'Admin Workspace & Overview',
    'WebPage'
  ),
  (
    '/admin/seo',
    'SEO & Analytics Management | TalentPulse Admin',
    'Centralized dashboard for configuring global meta, GTM tracking, social cards, schema markup, and search crawler directives.',
    'admin seo, site management, search analytics',
    'https://talentpulse.dev/admin/seo',
    true,
    true,
    'Search Engine Optimization & Growth Suite',
    'WebPage'
  )
ON CONFLICT (path) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  updated_at = timezone('utc'::text, now());
