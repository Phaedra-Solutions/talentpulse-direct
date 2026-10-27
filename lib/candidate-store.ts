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

/**
 * Fetch candidates with optional filters
 */
export async function getCandidatesList(filters?: Partial<CandidateFilters>): Promise<{
  candidates: Candidate[];
  isLiveSupabase: boolean;
}> {
  try {
    const params = new URLSearchParams();
    if (filters?.primaryRole && filters.primaryRole !== 'all') params.set('primaryRole', filters.primaryRole);
    if (filters?.availabilityStatus && filters.availabilityStatus !== 'all') params.set('availabilityStatus', filters.availabilityStatus);
    if (filters?.pipelineStage && filters.pipelineStage !== 'all') params.set('pipelineStage', filters.pipelineStage);

    const queryStr = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`/api/candidates${queryStr}`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.candidates)) {
        let items: Candidate[] = data.candidates;
        
        // Client-side quick filter/search refinement if needed
        if (filters?.searchQuery) {
          const q = filters.searchQuery.toLowerCase().trim();
          items = items.filter(c => 
            c.full_name?.toLowerCase().includes(q) ||
            c.email?.toLowerCase().includes(q) ||
            c.written_pitch?.toLowerCase().includes(q) ||
            c.tech_stack?.some((t: string) => t.toLowerCase().includes(q)) ||
            c.internal_notes?.toLowerCase().includes(q)
          );
        }

        if (filters?.targetRegion && filters.targetRegion !== 'all') {
          items = items.filter(c => c.target_timezones?.includes(filters.targetRegion as any));
        }

        if (filters?.hasVideoPitch === 'yes') {
          items = items.filter(c => Boolean(c.video_pitch_url && c.video_pitch_url.trim().length > 0));
        } else if (filters?.hasVideoPitch === 'no') {
          items = items.filter(c => !c.video_pitch_url || c.video_pitch_url.trim().length === 0);
        }

        if (filters?.hasResume === 'yes') {
          items = items.filter(c => Boolean(c.resume_url && c.resume_url.trim().length > 0));
        } else if (filters?.hasResume === 'no') {
          items = items.filter(c => !c.resume_url || c.resume_url.trim().length === 0);
        }

        const sortBy = filters?.sortBy || 'created_at';
        const isAsc = filters?.sortOrder === 'asc';
        items.sort((a, b) => {
          let valA = (a as any)[sortBy];
          let valB = (b as any)[sortBy];
          if (sortBy === 'created_at') {
            valA = new Date(valA).getTime();
            valB = new Date(valB).getTime();
          }
          if (valA < valB) return isAsc ? -1 : 1;
          if (valA > valB) return isAsc ? 1 : -1;
          return 0;
        });

        const isLive = data.source === 'supabase';
        if (isLive && items.length > 0) {
          saveLocalCandidates(items);
        }
        return { candidates: items, isLiveSupabase: isLive };
      }
    }
  } catch (err) {
    console.warn('API fetch candidates failed, falling back to local storage:', err);
  }

  // Fallback to local storage
  let items = getLocalCandidates();

  if (filters?.searchQuery) {
    const q = filters.searchQuery.toLowerCase().trim();
    items = items.filter(c => 
      c.full_name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.written_pitch.toLowerCase().includes(q) ||
      c.tech_stack.some(t => t.toLowerCase().includes(q)) ||
      c.internal_notes.toLowerCase().includes(q)
    );
  }

  if (filters?.primaryRole && filters.primaryRole !== 'all') {
    items = items.filter(c => c.primary_role === filters.primaryRole);
  }

  if (filters?.targetRegion && filters.targetRegion !== 'all') {
    items = items.filter(c => c.target_timezones.includes(filters.targetRegion as any));
  }

  if (filters?.availabilityStatus && filters.availabilityStatus !== 'all') {
    items = items.filter(c => c.availability_status === filters.availabilityStatus);
  }

  if (filters?.pipelineStage && filters.pipelineStage !== 'all') {
    items = items.filter(c => c.pipeline_stage === filters.pipelineStage);
  }

  if (filters?.englishProficiency && filters.englishProficiency !== 'all') {
    items = items.filter(c => c.english_proficiency === filters.englishProficiency);
  }

  if (filters?.hasVideoPitch === 'yes') {
    items = items.filter(c => Boolean(c.video_pitch_url && c.video_pitch_url.trim().length > 0));
  } else if (filters?.hasVideoPitch === 'no') {
    items = items.filter(c => !c.video_pitch_url || c.video_pitch_url.trim().length === 0);
  }

  if (filters?.hasResume === 'yes') {
    items = items.filter(c => Boolean(c.resume_url && c.resume_url.trim().length > 0));
  } else if (filters?.hasResume === 'no') {
    items = items.filter(c => !c.resume_url || c.resume_url.trim().length === 0);
  }

  // Sorting
  const sortBy = filters?.sortBy || 'created_at';
  const isAsc = filters?.sortOrder === 'asc';
  items.sort((a, b) => {
    let valA = (a as any)[sortBy];
    let valB = (b as any)[sortBy];

    if (sortBy === 'created_at') {
      valA = new Date(valA).getTime();
      valB = new Date(valB).getTime();
    }

    if (valA < valB) return isAsc ? -1 : 1;
    if (valA > valB) return isAsc ? 1 : -1;
    return 0;
  });

  return { candidates: items, isLiveSupabase: false };
}

/**
 * Fetch candidate by email (for self-service update portal)
 */
export async function getCandidateByEmail(email: string): Promise<{
  candidate: Candidate | null;
  isLiveSupabase: boolean;
}> {
  const normalizedEmail = email.trim().toLowerCase();
  
  try {
    const res = await fetch(`/api/candidates?email=${encodeURIComponent(normalizedEmail)}`);
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
  updates: CandidateUpdateFormValues
): Promise<{ success: boolean; candidate?: Candidate; error?: string; isLiveSupabase: boolean }> {
  const normalizedEmail = email.toLowerCase().trim();

  try {
    const res = await fetch('/api/candidates', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
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
    const res = await fetch(`/api/candidates/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
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

/**
 * Reset local demo candidates to default initial mock dataset
 */
export function resetMockData(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(OLD_STORAGE_KEY);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_MOCK_CANDIDATES));
  }
}
