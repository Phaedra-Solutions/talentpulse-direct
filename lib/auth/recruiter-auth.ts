'use client';

import { getSupabaseBrowserClient, isSupabaseConfigured } from '@/lib/supabase/client';

export interface HrUser {
  id: string;
  email: string;
  name: string;
  role: 'super_admin' | 'hr_lead' | 'recruiter' | 'admin';
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

/**
 * Get current active HR admin session.
 */
export function getCurrentHrUser(): HrUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(HR_SESSION_KEY);
    if (!raw) return null;
    const user: HrUser = JSON.parse(raw);
    if (!user || !user.email) {
      localStorage.removeItem(HR_SESSION_KEY);
      return null;
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
  const current = getCurrentHrUser();
  if (!current) return null;
  const updated: HrUser = { ...current, ...updates };
  localStorage.setItem(HR_SESSION_KEY, JSON.stringify(updated));
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

    const hrUser: HrUser = {
      id: data.user?.id || `admin-${Date.now()}`,
      email: normalizedEmail,
      name: data.user?.name || 'Admin',
      role: (data.user?.role as any) || 'admin',
      must_change_password: Boolean(data.must_change_password),
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem(HR_SESSION_KEY, JSON.stringify(hrUser));
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
    localStorage.removeItem(HR_SESSION_KEY);
  }
}
