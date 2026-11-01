-- Migration: 20261101000001_unify_super_admin_role.sql
-- Description: Unifies any legacy 'admin' roles to 'super_admin' in public.admin_users

UPDATE public.admin_users
SET 
  role = CASE 
    WHEN role = 'admin:reset' THEN 'super_admin:reset'
    WHEN role = 'admin' THEN 'super_admin'
    ELSE role 
  END,
  updated_at = timezone('utc'::text, now())
WHERE role IN ('admin', 'admin:reset');
