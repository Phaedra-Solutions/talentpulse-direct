// lib/auth/permissions.ts
// Shared, server-safe RBAC permission helper functions (No 'use client')

export type RecruiterRole = 'super_admin' | 'sales_executive' | 'hr_executive' | 'recruiter' | 'hr_lead' | 'admin';

/**
 * Super Admin has unrestricted authority across the entire platform.
 */
export function canAccessCandidatePipeline(role?: string): boolean {
  if (!role) return false;
  return ['super_admin', 'admin', 'sales_executive', 'hr_executive', 'recruiter', 'hr_lead'].includes(role);
}

export function canAccessHireRequests(role?: string): boolean {
  if (!role) return false;
  return ['super_admin', 'admin', 'sales_executive'].includes(role);
}

export function canManageRolesAndTech(role?: string): boolean {
  if (!role) return false;
  return ['super_admin', 'admin', 'hr_executive'].includes(role);
}

export function canManageAdminUsers(role?: string): boolean {
  if (!role) return false;
  return ['super_admin', 'admin'].includes(role);
}

export function canExportCandidateData(role?: string): boolean {
  if (!role) return false;
  return ['super_admin', 'admin', 'hr_executive', 'recruiter', 'hr_lead'].includes(role);
}

export function canExportHireRequests(role?: string): boolean {
  if (!role) return false;
  return ['super_admin', 'admin'].includes(role);
}

export function canManageSeo(role?: string): boolean {
  if (!role) return false;
  return ['super_admin', 'admin'].includes(role);
}
