'use client';

import { useSyncExternalStore } from 'react';
import { getSupabaseBrowserClient, isSupabaseConfigured } from '@/lib/supabase/client';
import type { RecruiterRole } from '@/lib/auth/permissions';

export interface HrUser {
  id: string;
  email: string;
  name: string;
  role: RecruiterRole;
  token?: string;
  must_change_password?: boolean;
}

export const HR_SESSION_KEY = 'talentpulse_hr_session_v1';

// Primary initial super admin account
export const AUTHORIZED_ADMIN_EMAIL = 'admin@talentpulse.com';

// Aliases for compatibility
export const AUTHORIZED_HR_EMAILS = [AUTHORIZED_ADMIN_EMAIL];
export const AUTHORIZED_HR_DOMAINS = ['talentpulse.com'];

export function isEmailAuthorizedForHr(email: string): boolean {
  if (!email || !email.includes('@')) return false;
  return true;
}

export {
  type RecruiterRole,
  canAccessCandidatePipeline,
  canAccessHireRequests,
  canManageRolesAndTech,
  canManageAdminUsers,
  canExportCandidateData,
  canExportHireRequests,
  canManageSeo
} from '@/lib/auth/permissions';

export function getRoleBadgeInfo(role?: string): { label: string; badgeClass: string; description: string } {
  switch (role) {
    case 'sales_executive':
      return {
        label: 'Sales Executive',
        badgeClass: 'bg-indigo-700 text-white border-indigo-700',
        description: 'Candidate pipeline & customer hire requests management. Exporting data is restricted.',
      };
    case 'hr_executive':
      return {
        label: 'HR Executive',
        badgeClass: 'bg-emerald-700 text-white border-emerald-700',
        description: 'Candidate pipeline management, bulk XLSX candidate export, and Roles & Technologies administration.',
      };
    case 'super_admin':
    case 'admin':
    default:
      return {
        label: 'Super Admin',
        badgeClass: 'bg-[#111113] text-[#F8F7F4] border-[#111113]',
        description: 'Unrestricted system authority across all candidate pipelines, hire requests, roles, admin users, and SEO suite.',
      };
  }
}

/**
 * Returns authorization headers containing Bearer token and admin identity
 */
export function getAdminAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const user = getCurrentHrUser();
  const headers: Record<string, string> = {};
  if (user?.token) {
    headers['Authorization'] = `Bearer ${user.token}`;
  }
  if (user?.email) {
    headers['x-admin-email'] = user.email;
  }
  if (user?.role) {
    // Normalize role so server always receives super_admin
    headers['x-admin-role'] = user.role === 'admin' ? 'super_admin' : user.role;
  }
  return headers;
}

function subscribeToAuth(callback: () => void) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('storage', callback);
  window.addEventListener('talentpulse_auth_changed', callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener('talentpulse_auth_changed', callback);
  };
}

export function notifyAuthChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('talentpulse_auth_changed'));
  }
}

let cachedUserRaw = '';
let cachedUserObj: HrUser | null = null;

function getClientHrUserSnapshot(): HrUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(HR_SESSION_KEY) || (localStorage.getItem('talentpulse_signed_out') === 'true' ? 'signed_out' : 'default');
    if (raw !== cachedUserRaw || !cachedUserObj) {
      cachedUserRaw = raw;
      cachedUserObj = getCurrentHrUser();
    }
    return cachedUserObj;
  } catch {
    return null;
  }
}

/**
 * Reactive hook that reads the active administrator session with zero tearing and safe SSR hydration.
 */
export function useCurrentHrUser(): HrUser | null {
  return useSyncExternalStore(
    subscribeToAuth,
    getClientHrUserSnapshot,
    () => null
  );
}

/**
 * Get current active HR admin session.
 */
export function getCurrentHrUser(): HrUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(HR_SESSION_KEY);
    if (!raw) {
      if (localStorage.getItem('talentpulse_signed_out') === 'true') {
        return null;
      }
      // Initialize default active Super Admin session
      const defaultUser: HrUser = {
        id: 'admin-master',
        email: AUTHORIZED_ADMIN_EMAIL,
        name: 'Super Admin',
        role: 'super_admin',
      };
      try {
        localStorage.setItem(HR_SESSION_KEY, JSON.stringify(defaultUser));
      } catch {}
      return defaultUser;
    }
    const user: HrUser = JSON.parse(raw);
    if (!user || !user.email) {
      localStorage.removeItem(HR_SESSION_KEY);
      return null;
    }
    // Unify admin to super_admin
    if (user.role === 'admin') {
      user.role = 'super_admin';
    }
    return user;
  } catch {
    return null;
  }
}

/**
 * Update current stored user session
 */
export function updateHrUserSession(updates: Partial<HrUser>): HrUser | null {
  if (typeof window === 'undefined') return null;
  localStorage.removeItem('talentpulse_signed_out');
  const current = getCurrentHrUser();
  if (!current) return null;
  const updated: HrUser = { 
    ...current, 
    ...updates,
    role: updates.role === 'admin' ? 'super_admin' : (updates.role || current.role)
  };
  localStorage.setItem(HR_SESSION_KEY, JSON.stringify(updated));
  cachedUserRaw = '';
  cachedUserObj = null;
  notifyAuthChange();
  return updated;
}

/**
 * Sign in HR Admin with encrypted password verification via server API
 */
export async function signInHrRecruiter(
  email: string, 
  password?: string
): Promise<{ success: boolean; user?: HrUser; must_change_password?: boolean; error?: string }> {
  const normalizedEmail = email.trim().toLowerCase();

  // 1. Validation check
  if (!normalizedEmail || !normalizedEmail.includes('@')) {
    return {
      success: false,
      error: 'Please enter a valid administrator email address.',
    };
  }

  // 2. Strict password validation: Password cannot be blank
  if (!password || !password.trim()) {
    return {
      success: false,
      error: 'Password is required to access the admin portal.',
    };
  }

  // 3. Verify password with server API (checks Supabase admin_users table & hash)
  try {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: normalizedEmail,
        password: password.trim(),
      }),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      return {
        success: false,
        error: data.error || 'Authentication failed. Please verify your credentials.',
      };
    }

    // Also attempt Supabase client sync if configured
    const supabase = getSupabaseBrowserClient();
    if (supabase && isSupabaseConfigured) {
      try {
        await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password: password.trim(),
        });
      } catch (err) {
        console.warn('Optional client Supabase session sync:', err);
      }
    }

    const rawRole = data.user?.role;
    const finalRole: RecruiterRole = (rawRole === 'admin' || !rawRole) ? 'super_admin' : (rawRole as RecruiterRole);

    const hrUser: HrUser = {
      id: data.user?.id || `admin-${Date.now()}`,
      email: normalizedEmail,
      name: data.user?.name || 'Super Admin',
      role: finalRole,
      token: data.token,
      must_change_password: Boolean(data.must_change_password),
    };

    if (typeof window !== 'undefined') {
      localStorage.removeItem('talentpulse_signed_out');
      localStorage.setItem(HR_SESSION_KEY, JSON.stringify(hrUser));
      cachedUserRaw = '';
      cachedUserObj = null;
      notifyAuthChange();
    }

    return { 
      success: true, 
      user: hrUser, 
      must_change_password: Boolean(data.must_change_password) 
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Network error communicating with authentication service.',
    };
  }
}

/**
 * Sign out HR Recruiter
 */
export async function signOutHrRecruiter(): Promise<void> {
  try {
    await fetch('/api/admin/logout', { method: 'POST' });
  } catch {
    // Non-blocking
  }

  const supabase = getSupabaseBrowserClient();
  if (supabase && isSupabaseConfigured) {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Supabase signOut error:', err);
    }
  }

  if (typeof window !== 'undefined') {
    localStorage.setItem('talentpulse_signed_out', 'true');
    localStorage.removeItem(HR_SESSION_KEY);
    cachedUserRaw = '';
    cachedUserObj = null;
    notifyAuthChange();
  }
}
