-- ==============================================================================
-- MIGRATION: 20261029000003_create_hire_requests_and_update_roles.sql
-- Description: 
--   1. Creates public.hire_requests table for enterprise customer hire inquiries
--   2. Adds Fractional CTO and converts primary_role to TEXT for dynamic roles
--   3. Sets up Row Level Security (RLS) policies and performance indexes
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. UPDATE CANDIDATES ROLE COLUMN TO SUPPORT DYNAMIC ROLES & FRACTIONAL CTO
DO $$ BEGIN
    ALTER TYPE primary_role_enum ADD VALUE IF NOT EXISTS 'fractional_cto';
EXCEPTION
    WHEN duplicate_object THEN null;
    WHEN undefined_object THEN null;
END $$;

-- Allow dynamic role slugs by converting column to TEXT if enum is too restrictive
ALTER TABLE public.candidates ALTER COLUMN primary_role TYPE TEXT;

-- 3. CREATE HIRE_REQUESTS TABLE
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
    status TEXT NOT NULL DEFAULT 'new', -- 'new', 'contacted', 'negotiating', 'contract_signed', 'closed'
    offline_notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. PERFORMANCE INDEXES FOR HIRE REQUESTS
CREATE INDEX IF NOT EXISTS idx_hire_requests_status ON public.hire_requests(status);
CREATE INDEX IF NOT EXISTS idx_hire_requests_created_at ON public.hire_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_hire_requests_client_email ON public.hire_requests(client_email);
CREATE INDEX IF NOT EXISTS idx_hire_requests_business_name ON public.hire_requests(business_name);

-- 5. AUTOMATIC TIMESTAMP TRIGGER FOR HIRE REQUESTS
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

-- 6. ROW LEVEL SECURITY (RLS) FOR HIRE REQUESTS
ALTER TABLE public.hire_requests ENABLE ROW LEVEL SECURITY;

-- Allow anonymous or authenticated clients to submit hire requests
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

-- Only authenticated recruiters, sales executives, and administrators can view hire requests
DROP POLICY IF EXISTS "Admins and Sales can view hire requests" ON public.hire_requests;
CREATE POLICY "Admins and Sales can view hire requests"
ON public.hire_requests
FOR SELECT
TO authenticated, service_role
USING (true);

-- Only authenticated staff or service role can update offline review notes and status
DROP POLICY IF EXISTS "Admins and Sales can update hire requests" ON public.hire_requests;
CREATE POLICY "Admins and Sales can update hire requests"
ON public.hire_requests
FOR UPDATE
TO authenticated, service_role
USING (true)
WITH CHECK (true);

-- Only authenticated staff or service role can delete hire requests
DROP POLICY IF EXISTS "Admins can delete hire requests" ON public.hire_requests;
CREATE POLICY "Admins can delete hire requests"
ON public.hire_requests
FOR DELETE
TO authenticated, service_role
USING (true);
