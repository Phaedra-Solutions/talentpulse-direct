-- ==============================================================================
-- MIGRATION: 20261022000001_add_phone_resume_and_update_roles.sql
-- Description: Adds mandatory phone_number, resume artifacts, and hardened insert policy
-- ==============================================================================

-- 1. ADD COLUMNS
ALTER TABLE public.candidates ADD COLUMN IF NOT EXISTS phone_number TEXT NOT NULL DEFAULT '';
ALTER TABLE public.candidates ADD COLUMN IF NOT EXISTS resume_url TEXT;
ALTER TABLE public.candidates ADD COLUMN IF NOT EXISTS resume_filename TEXT;

-- 2. CREATE INDEX FOR PHONE NUMBER SEARCH
CREATE INDEX IF NOT EXISTS idx_candidates_phone_number ON public.candidates(phone_number);

-- 3. UPDATE INSERT RLS POLICY TO ENFORCE MANDATORY PHONE NUMBER
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
    AND phone_number IS NOT NULL AND phone_number <> ''
);
