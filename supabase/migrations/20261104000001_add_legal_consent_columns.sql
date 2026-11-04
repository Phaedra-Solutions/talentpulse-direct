-- ==============================================================================
-- TALENTPULSE DIRECT: Supabase PostgreSQL Migration
-- Migration ID: 20261104000001_add_legal_consent_columns.sql
-- Description: Adds terms_accepted, privacy_accepted, and consent_timestamp
--              columns to candidates and hire_requests tables for GDPR / CCPA / 
--              PIPEDA dual affirmative consent auditing.
-- ==============================================================================

-- 1. CANDIDATES TABLE LEGAL CONSENT COLUMNS
ALTER TABLE public.candidates 
ADD COLUMN IF NOT EXISTS terms_accepted BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS privacy_accepted BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS consent_timestamp TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

-- Performance index for consent and compliance auditing
CREATE INDEX IF NOT EXISTS idx_candidates_consent_timestamp ON public.candidates(consent_timestamp);

-- 2. HIRE REQUESTS TABLE LEGAL CONSENT COLUMNS
ALTER TABLE public.hire_requests 
ADD COLUMN IF NOT EXISTS terms_accepted BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS privacy_accepted BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS consent_timestamp TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

-- Performance index for enterprise client consent auditing
CREATE INDEX IF NOT EXISTS idx_hire_requests_consent_timestamp ON public.hire_requests(consent_timestamp);
