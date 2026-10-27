-- ==============================================================================
-- MIGRATION: 20261022000002_create_admin_users_table.sql
-- Description: Creates public.admin_users table to store authorized admin accounts
--              with encrypted passwords (hash + salt) and security policies.
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. CREATE ADMIN USERS TABLE
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

-- 3. CREATE INDEX FOR FAST EMAIL LOOKUP
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON public.admin_users(email);

-- 4. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- 5. RLS POLICIES
-- Policy: Anon/Public users CANNOT read or query admin_users table
DROP POLICY IF EXISTS "Deny public access to admin_users" ON public.admin_users;
CREATE POLICY "Deny public access to admin_users"
ON public.admin_users
FOR ALL
TO anon
USING (false);

-- Policy: Only authenticated super admins or service role can select
DROP POLICY IF EXISTS "Admins can view admin_users" ON public.admin_users;
CREATE POLICY "Admins can view admin_users"
ON public.admin_users
FOR SELECT
TO authenticated
USING (
    email = auth.jwt()->>'email'
    OR email = 'admin@talentpulse.com'
);

-- 6. SEED INITIAL SUPER ADMIN: admin@talentpulse.com
-- Password: lahore123$
-- Algorithm: PBKDF2 with SHA-512 (100,000 iterations)
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
