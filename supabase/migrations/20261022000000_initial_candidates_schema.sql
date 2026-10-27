-- ==============================================================================
-- MIGRATION: 20261022000000_initial_candidates_schema.sql
-- Description: Baseline schema for TalentPulse Direct candidates table & enums
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
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone_number TEXT NOT NULL DEFAULT '',
    linkedin_url TEXT,
    github_url TEXT,
    portfolio_url TEXT,
    
    primary_role primary_role_enum NOT NULL DEFAULT 'ai_engineer',
    contractual_agreement_accepted BOOLEAN NOT NULL DEFAULT false,
    work_modes TEXT[] NOT NULL DEFAULT ARRAY['remote'::TEXT],
    
    home_timezone TEXT NOT NULL DEFAULT 'UTC-05:00 (EST - US Eastern / New York)',
    target_timezones TEXT[] NOT NULL DEFAULT ARRAY['USA'::TEXT],
    overlap_hours_per_day INTEGER NOT NULL DEFAULT 4 CHECK (overlap_hours_per_day >= 0 AND overlap_hours_per_day <= 12),
    availability_status availability_status_enum NOT NULL DEFAULT 'available_now',
    available_from DATE NOT NULL DEFAULT CURRENT_DATE,
    
    english_proficiency english_proficiency_enum NOT NULL DEFAULT 'professional',
    written_pitch TEXT NOT NULL,
    video_pitch_url TEXT,
    tech_stack TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    
    pipeline_stage pipeline_stage_enum NOT NULL DEFAULT 'new',
    internal_notes TEXT DEFAULT ''
);

-- 4. PERFORMANCE & SECURITY INDEXES
CREATE INDEX IF NOT EXISTS idx_candidates_user_id ON public.candidates(user_id);
CREATE INDEX IF NOT EXISTS idx_candidates_primary_role ON public.candidates(primary_role);
CREATE INDEX IF NOT EXISTS idx_candidates_availability_status ON public.candidates(availability_status);
CREATE INDEX IF NOT EXISTS idx_candidates_pipeline_stage ON public.candidates(pipeline_stage);
CREATE INDEX IF NOT EXISTS idx_candidates_email ON public.candidates(email);
CREATE INDEX IF NOT EXISTS idx_candidates_created_at ON public.candidates(created_at DESC);
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

-- POLICIES
DROP POLICY IF EXISTS "Candidates can view own profile" ON public.candidates;
CREATE POLICY "Candidates can view own profile" 
ON public.candidates 
FOR SELECT 
TO authenticated
USING (
    auth.uid() = user_id
    OR public.is_recruiter()
);

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
);

DROP POLICY IF EXISTS "Candidates can update own availability" ON public.candidates;
CREATE POLICY "Candidates can update own availability" 
ON public.candidates 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Recruiters can update candidate evaluation" ON public.candidates;
CREATE POLICY "Recruiters can update candidate evaluation" 
ON public.candidates 
FOR UPDATE 
TO authenticated
USING (public.is_recruiter())
WITH CHECK (public.is_recruiter());

DROP POLICY IF EXISTS "Candidates can delete own profile" ON public.candidates;
CREATE POLICY "Candidates can delete own profile" 
ON public.candidates 
FOR DELETE 
TO authenticated
USING (
    auth.uid() = user_id
    OR public.is_recruiter()
);
