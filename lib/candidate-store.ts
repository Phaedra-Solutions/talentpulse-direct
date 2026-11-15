import { Candidate, CandidateApplicationFormValues, CandidateFilters, CandidateUpdateFormValues, PipelineStage } from '@/types/candidate';
import { INITIAL_MOCK_CANDIDATES } from './mock-data';
import { getSupabaseBrowserClient, isSupabaseConfigured } from './supabase/client';

const STORAGE_KEY = 'talentpulse_candidates_v2';
const OLD_STORAGE_KEY = 'talentpulse_candidates_v1';

// Helper to sanitize candidate object to guarantee no missing fields
function sanitizeCandidate(c: any): Candidate {
  return {
    id: c.id || String(Date.now()),
    user_id: c.user_id || null,
    created_at: c.created_at || new Date().toISOString(),
    updated_at: c.updated_at || new Date().toISOString(),
    full_name: c.full_name || 'Anonymous Engineer',
    email: c.email || 'engineer@talentpulse.io',
    phone_number: c.phone_number || '+1 555 0100',
    linkedin_url: c.linkedin_url || null,
    github_url: c.github_url || null,
    portfolio_url: c.portfolio_url || null,
    resume_url: c.resume_url || null,
    resume_filename: c.resume_filename || null,
    primary_role: c.primary_role === 'software_engineer' ? 'full_stack' : (c.primary_role || 'full_stack'),
    contractual_agreement_accepted: c.contractual_agreement_accepted ?? true,
    work_modes: Array.isArray(c.work_modes) && c.work_modes.length > 0 ? c.work_modes : ['remote'],
    home_timezone: c.home_timezone || 'UTC+00:00 (GMT / WET - London / Dublin / Lisbon)',
    target_timezones: Array.isArray(c.target_timezones) && c.target_timezones.length > 0 ? c.target_timezones : ['USA'],
    overlap_hours_per_day: typeof c.overlap_hours_per_day === 'number' ? c.overlap_hours_per_day : 6,
    availability_status: c.availability_status || 'available_now',
    available_from: c.available_from || new Date().toISOString().split('T')[0],
    english_proficiency: c.english_proficiency || 'professional',
    written_pitch: c.written_pitch || '',
    video_pitch_url: c.video_pitch_url || null,
    tech_stack: Array.isArray(c.tech_stack) ? c.tech_stack : [],
    pipeline_stage: c.pipeline_stage || 'new',
    internal_notes: c.internal_notes || '',
  };
}

// Helper to get local candidates
function getLocalCandidates(): Candidate[] {
  if (typeof window === 'undefined') {
    return INITIAL_MOCK_CANDIDATES;
  }
  try {
    // Check if new key exists
    let raw = localStorage.getItem(STORAGE_KEY);
    
    // Check if old key exists and migrate
    if (!raw) {
      const oldRaw = localStorage.getItem(OLD_STORAGE_KEY);
      if (oldRaw) {
        try {
          const parsedOld = JSON.parse(oldRaw);
          if (Array.isArray(parsedOld)) {
            const sanitized = parsedOld.map(sanitizeCandidate);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
            localStorage.removeItem(OLD_STORAGE_KEY);
            return sanitized;
          }
        } catch {
          // ignore error
        }
      }
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_MOCK_CANDIDATES));
      return INITIAL_MOCK_CANDIDATES;
    }
    
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_MOCK_CANDIDATES));
      return INITIAL_MOCK_CANDIDATES;
    }

    return parsed.map(sanitizeCandidate);
  } catch {
    return INITIAL_MOCK_CANDIDATES;
  }
}

function saveLocalCandidates(candidates: Candidate[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(candidates));
  } catch (err) {
    console.error('Failed to save to localStorage', err);
  }
}

export interface CandidateKpiStats {
  total: number;
  availableNow: number;
  withVideo: number;
  withResume: number;
  aiEngineers: number;
  mobileAndArchs: number;
}

export interface PaginatedCandidatesResult {
  candidates: Candidate[];
  total: number;
  page: number;
  limit: number;
  stats?: CandidateKpiStats;
  stageCounts?: Record<string, number>;
  isLiveSupabase: boolean;
  source: string;
  error?: string;
}

function buildCandidateQueryParams(
  filters?: Partial<CandidateFilters>,
  options?: {
    page?: number;
    limit?: number;
    includeStats?: boolean;
    view?: 'table' | 'cards' | 'kanban';
    isExport?: boolean;
  }
): URLSearchParams {
  const params = new URLSearchParams();
  if (filters?.primaryRole && filters.primaryRole !== 'all') params.set('primaryRole', filters.primaryRole);
  if (filters?.targetRegion && filters.targetRegion !== 'all') params.set('targetRegion', filters.targetRegion);
  if (filters?.availabilityStatus && filters.availabilityStatus !== 'all') params.set('availabilityStatus', filters.availabilityStatus);
  if (filters?.pipelineStage && filters.pipelineStage !== 'all') params.set('pipelineStage', filters.pipelineStage);
  if (filters?.englishProficiency && filters.englishProficiency !== 'all') params.set('englishProficiency', filters.englishProficiency);
  if (filters?.hasVideoPitch && filters.hasVideoPitch !== 'all') params.set('hasVideoPitch', filters.hasVideoPitch);
  if (filters?.hasResume && filters.hasResume !== 'all') params.set('hasResume', filters.hasResume);
  if (filters?.searchQuery && filters.searchQuery.trim()) params.set('search', filters.searchQuery.trim());
  if (filters?.sortBy) params.set('sortBy', filters.sortBy);
  if (filters?.sortOrder) params.set('sortOrder', filters.sortOrder);

  if (options?.page) params.set('page', String(options.page));
  if (options?.limit) params.set('limit', String(options.limit));
  if (options?.includeStats) params.set('includeStats', 'true');
  if (options?.view) params.set('view', options.view);
  if (options?.isExport) params.set('export', 'true');
  return params;
}

/**
 * Fetch candidates with server-side filtering, pagination, and optional KPI stats.
 * Never falls back to 6 mock candidates when the backend reports an auth/database error.
 */
export async function getCandidatesPaginated(
  filters?: Partial<CandidateFilters>,
  options?: {
    page?: number;
    limit?: number;
    includeStats?: boolean;
    view?: 'table' | 'cards' | 'kanban';
    isExport?: boolean;
  }
): Promise<PaginatedCandidatesResult> {
  const page = options?.page || 1;
  const limit = options?.limit || 20;
  const params = buildCandidateQueryParams(filters, { ...options, page, limit });

  let authHeaders: Record<string, string> = {};
  if (typeof window !== 'undefined') {
    const { getAdminAuthHeaders } = await import('./auth/recruiter-auth');
    authHeaders = getAdminAuthHeaders();
  }

  const res = await fetch(`/api/candidates?${params.toString()}`, {
    headers: { ...authHeaders },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    return {
      candidates: [],
      total: 0,
      page,
      limit,
      isLiveSupabase: false,
      source: data.source || 'error',
      error: data.error || `Failed to load candidates (HTTP ${res.status})`,
    };
  }

  const items: Candidate[] = Array.isArray(data.candidates)
    ? data.candidates.map(sanitizeCandidate)
    : [];

  return {
    candidates: items,
    total: typeof data.total === 'number' ? data.total : items.length,
    page: typeof data.page === 'number' ? data.page : page,
    limit: typeof data.limit === 'number' ? data.limit : limit,
    stats: data.stats,
    stageCounts: data.stageCounts,
    isLiveSupabase: data.source === 'supabase',
    source: data.source || 'supabase',
  };
}

/**
 * Fetch full single-candidate dossier by ID (used when opening detail drawer)
 */
export async function getCandidateById(id: string): Promise<Candidate | null> {
  try {
    let authHeaders: Record<string, string> = {};
    if (typeof window !== 'undefined') {
      const { getAdminAuthHeaders } = await import('./auth/recruiter-auth');
      authHeaders = getAdminAuthHeaders();
    }
    const res = await fetch(`/api/candidates/${encodeURIComponent(id)}`, {
      headers: { ...authHeaders },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.candidate ? sanitizeCandidate(data.candidate) : null;
  } catch {
    return null;
  }
}

/**
 * Fetch candidates with optional filters (legacy/compat wrapper)
 */
export async function getCandidatesList(filters?: Partial<CandidateFilters>): Promise<{
  candidates: Candidate[];
  isLiveSupabase: boolean;
  error?: string;
}> {
  try {
    const result = await getCandidatesPaginated(filters, {
      page: 1,
      limit: 100,
    });
    if (!result.error) {
      return { candidates: result.candidates, isLiveSupabase: result.isLiveSupabase };
    }
    return { candidates: [], isLiveSupabase: false, error: result.error };
  } catch (err: any) {
    console.warn('API fetch candidates failed:', err);
    return {
      candidates: [],
      isLiveSupabase: false,
      error: err?.message || 'Network error fetching candidates',
    };
  }
}

/**
 * Fetch candidate by email (for self-service update portal)
 */
export async function getCandidateByEmail(
  email: string,
  accessToken?: string
): Promise<{
  candidate: Candidate | null;
  isLiveSupabase: boolean;
}> {
  const normalizedEmail = email.trim().toLowerCase();
  
  try {
    const headers: Record<string, string> = {};
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }
    const res = await fetch(`/api/candidates?email=${encodeURIComponent(normalizedEmail)}`, {
      headers,
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.candidates) && data.candidates.length > 0) {
        return { candidate: data.candidates[0] as Candidate, isLiveSupabase: data.source === 'supabase' };
      }
    }
  } catch (err) {
    console.warn('API query error, falling back to local cache:', err);
  }

  const items = getLocalCandidates();
  const found = items.find(c => c.email.toLowerCase() === normalizedEmail) || null;
  return { candidate: found, isLiveSupabase: false };
}

/**
 * Create a new candidate application
 */
export async function createCandidateRecord(values: CandidateApplicationFormValues): Promise<{
  success: boolean;
  candidate?: Candidate;
  error?: string;
  isLiveSupabase: boolean;
}> {
  try {
    const res = await fetch('/api/candidates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    });

    const data = await res.json();
    if (res.ok && data.candidate) {
      const isLive = data.source === 'supabase';
      // Sync local cache
      const locals = getLocalCandidates();
      saveLocalCandidates([data.candidate as Candidate, ...locals.filter(c => c.email !== data.candidate.email)]);
      return { success: true, candidate: data.candidate as Candidate, isLiveSupabase: isLive };
    }

    if (!res.ok) {
      return { success: false, error: data.error || 'Failed to submit candidate application.', isLiveSupabase: false };
    }
  } catch (err: any) {
    console.warn('API submit failed, falling back to local storage:', err);
  }

  // Fallback to local storage
  const newCandidate: Candidate = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `cand-${Date.now()}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    full_name: values.full_name,
    email: values.email.toLowerCase(),
    phone_number: values.phone_number,
    linkedin_url: values.linkedin_url || null,
    github_url: values.github_url || null,
    portfolio_url: values.portfolio_url || null,
    resume_url: values.resume_url || null,
    resume_filename: values.resume_filename || null,
    primary_role: values.primary_role,
    contractual_agreement_accepted: values.contractual_agreement_accepted,
    work_modes: values.work_modes,
    home_timezone: values.home_timezone,
    target_timezones: values.target_timezones,
    overlap_hours_per_day: Number(values.overlap_hours_per_day),
    availability_status: values.availability_status,
    available_from: values.available_from,
    english_proficiency: values.english_proficiency,
    written_pitch: values.written_pitch,
    video_pitch_url: values.video_pitch_url || null,
    tech_stack: values.tech_stack,
    pipeline_stage: 'new',
    internal_notes: 'Submitted via TalentPulse public application portal. Awaiting technical screening.',
  };

  const locals = getLocalCandidates();
  const existingIdx = locals.findIndex(c => c.email.toLowerCase() === newCandidate.email.toLowerCase());
  if (existingIdx >= 0) {
    locals[existingIdx] = { ...locals[existingIdx], ...newCandidate, updated_at: new Date().toISOString() };
  } else {
    locals.unshift(newCandidate);
  }
  saveLocalCandidates(locals);

  return { success: true, candidate: newCandidate, isLiveSupabase: false };
}

/**
 * Update candidate availability & pitch (Candidate Self-Update Portal)
 */
export async function updateCandidateAvailabilityRecord(
  email: string,
  updates: CandidateUpdateFormValues,
  accessToken?: string
): Promise<{ success: boolean; candidate?: Candidate; error?: string; isLiveSupabase: boolean }> {
  const normalizedEmail = email.toLowerCase().trim();

  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }
    const res = await fetch('/api/candidates', {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ email: normalizedEmail, ...updates }),
    });

    const data = await res.json();
    if (res.ok && data.candidate) {
      const isLive = data.source === 'supabase';
      const locals = getLocalCandidates();
      const updatedLocals = locals.map(c => c.email.toLowerCase() === normalizedEmail ? (data.candidate as Candidate) : c);
      saveLocalCandidates(updatedLocals);
      return { success: true, candidate: data.candidate as Candidate, isLiveSupabase: isLive };
    }

    if (!res.ok) {
      return { success: false, error: data.error || 'Failed to update candidate record', isLiveSupabase: false };
    }
  } catch (err: any) {
    console.warn('API update failed, fallback to local storage:', err);
  }

  // Fallback to local
  const locals = getLocalCandidates();
  const idx = locals.findIndex(c => c.email.toLowerCase() === normalizedEmail);
  if (idx === -1) {
    return { success: false, error: 'Candidate profile with this email was not found.', isLiveSupabase: false };
  }

  locals[idx] = {
    ...locals[idx],
    ...updates,
    updated_at: new Date().toISOString(),
  };
  saveLocalCandidates(locals);

  return { success: true, candidate: locals[idx], isLiveSupabase: false };
}

/**
 * Update candidate stage and recruiter notes (Recruiter Dashboard)
 */
export async function updateCandidateStageAndNotesRecord(
  id: string,
  stage: PipelineStage,
  internalNotes: string
): Promise<{ success: boolean; candidate?: Candidate; error?: string; isLiveSupabase: boolean }> {
  try {
    let authHeaders: Record<string, string> = {};
    if (typeof window !== 'undefined') {
      const { getAdminAuthHeaders } = await import('./auth/recruiter-auth');
      authHeaders = getAdminAuthHeaders();
    }
    const res = await fetch(`/api/candidates/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      body: JSON.stringify({
        pipeline_stage: stage,
        internal_notes: internalNotes,
      }),
    });

    const data = await res.json();
    if (res.ok && data.candidate) {
      const isLive = data.source === 'supabase';
      const locals = getLocalCandidates();
      saveLocalCandidates(locals.map(c => c.id === id ? (data.candidate as Candidate) : c));
      return { success: true, candidate: data.candidate as Candidate, isLiveSupabase: isLive };
    }

    if (!res.ok) {
      return { success: false, error: data.error || 'Failed to update candidate pipeline stage', isLiveSupabase: false };
    }
  } catch (err: any) {
    console.warn('API recruiter update failed, falling back to local storage:', err);
  }

  // Fallback to local
  const locals = getLocalCandidates();
  const idx = locals.findIndex(c => c.id === id);
  if (idx === -1) {
    return { success: false, error: 'Candidate not found', isLiveSupabase: false };
  }

  locals[idx] = {
    ...locals[idx],
    pipeline_stage: stage,
    internal_notes: internalNotes,
    updated_at: new Date().toISOString(),
  };
  saveLocalCandidates(locals);

  return { success: true, candidate: locals[idx], isLiveSupabase: false };
}
