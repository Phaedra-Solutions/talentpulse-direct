import { HireRequest, HireRequestFormValues, HireRequestStatus } from '@/types/hire-request';
import { getSupabaseServerClient, isServerSupabaseConfigured } from '@/lib/supabase/server';
import { getSupabaseBrowserClient, isSupabaseConfigured } from '@/lib/supabase/client';

function getSupabaseClient() {
  if (typeof window !== 'undefined') {
    return isSupabaseConfigured ? getSupabaseBrowserClient() : null;
  }
  return isServerSupabaseConfigured ? getSupabaseServerClient() : null;
}

const STORAGE_KEY = 'talentpulse_hire_requests_store_v1';

const INITIAL_HIRE_REQUESTS: HireRequest[] = [
  {
    id: 'hire-req-101',
    role_id: 'role-1-ai-llm',
    role_title: 'AI & LLM Engineer',
    expected_cost: '$75 - $90 / hr',
    timeline_to_start: 'Immediately (within 1 week)',
    client_name: 'Marcus Vance',
    client_email: 'marcus.vance@synthetixlabs.ai',
    client_phone: '+1 415 889 2041',
    country: 'United States',
    business_name: 'Synthetix AI Labs',
    project_scope: 'Need a senior LLM engineer to implement multi-agent RAG pipeline using LangGraph and vLLM on Kubernetes. 6-month contract with 4+ hours daily US PST overlap.',
    status: 'new',
    offline_notes: 'Initial enterprise request received via portal. Candidate profile pool ready for review.',
    created_at: new Date(Date.now() - 3600 * 1000 * 5).toISOString(),
    updated_at: new Date(Date.now() - 3600 * 1000 * 5).toISOString(),
  },
  {
    id: 'hire-req-102',
    role_id: 'role-2-fde',
    role_title: 'Forward Deployed Engineer',
    expected_cost: '$80 - $95 / hr',
    timeline_to_start: '1 - 2 Weeks',
    client_name: 'Elena Rostova',
    client_email: 'e.rostova@finvest-capital.co.uk',
    client_phone: '+44 20 7946 0912',
    country: 'United Kingdom',
    business_name: 'Finvest Capital Partners',
    project_scope: 'Onboarding enterprise financial institutions onto our automated transaction risk models. Seeking client-facing Forward Deployed Engineer with strong TypeScript, Python, and SOC2 compliance familiarity.',
    status: 'contacted',
    offline_notes: 'Had initial screening call with Elena on Oct 27. Client prefers candidates with previous Palantir or Fintech FDE background.',
    created_at: new Date(Date.now() - 3600 * 1000 * 48).toISOString(),
    updated_at: new Date(Date.now() - 3600 * 1000 * 12).toISOString(),
  },
  {
    id: 'hire-req-103',
    role_id: 'role-4-solutions-arch',
    role_title: 'Solutions Architects',
    expected_cost: '$90 - $110 / hr',
    timeline_to_start: 'Within 1 Month',
    client_name: 'Dr. Tariq Al-Mansoor',
    client_email: 'tariq@omnihealth.ae',
    client_phone: '+971 4 312 8900',
    country: 'United Arab Emirates',
    business_name: 'OmniHealth GCC Cloud',
    project_scope: 'Architecting a multi-tenant sovereign healthcare cloud across AWS and Azure GCC regions. Need a veteran Solutions Architect with HIPAA/GDPR and microservice experience.',
    status: 'negotiating',
    offline_notes: 'Contract proposal sent at $100/hr for 40 hrs/week. Reviewing standard master service agreement.',
    created_at: new Date(Date.now() - 3600 * 1000 * 96).toISOString(),
    updated_at: new Date(Date.now() - 3600 * 1000 * 24).toISOString(),
  },
];

// Helper to access memory store on server and local storage on client
let memoryHireRequests: HireRequest[] = [...INITIAL_HIRE_REQUESTS];

function loadLocalHireRequests(): HireRequest[] {
  if (typeof window === 'undefined') {
    return memoryHireRequests;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_HIRE_REQUESTS));
      return INITIAL_HIRE_REQUESTS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_HIRE_REQUESTS;
  } catch (err) {
    console.error('Error loading hire requests from localStorage:', err);
    return INITIAL_HIRE_REQUESTS;
  }
}

function saveLocalHireRequests(requests: HireRequest[]): void {
  memoryHireRequests = [...requests];
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
  } catch (err) {
    console.error('Error saving hire requests to localStorage:', err);
  }
}

export async function getHireRequestsList(): Promise<{
  requests: HireRequest[];
  isLiveSupabase: boolean;
}> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('hire_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        return {
          requests: data as HireRequest[],
          isLiveSupabase: true,
        };
      }
    } catch {
      // Graceful fallback
    }
  }

  const local = loadLocalHireRequests();
  return {
    requests: local,
    isLiveSupabase: false,
  };
}

export async function createHireRequest(
  values: HireRequestFormValues,
  roleTitle?: string
): Promise<HireRequest> {
  const newRequest: HireRequest = {
    id: `hire-req-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    role_id: values.role_id,
    role_title: roleTitle || values.role_id,
    expected_cost: values.expected_cost,
    timeline_to_start: values.timeline_to_start,
    client_name: values.client_name,
    client_email: values.client_email,
    client_phone: values.client_phone,
    country: values.country,
    business_name: values.business_name,
    project_scope: values.project_scope || '',
    status: 'new',
    offline_notes: 'New client request submitted via online portal. Pending offline review and contact.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // Try saving to Supabase if configured
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('hire_requests').insert([newRequest]);
    } catch (err) {
      console.warn('Supabase insert failed, saving locally:', err);
    }
  }

  const current = loadLocalHireRequests();
  const updated = [newRequest, ...current];
  saveLocalHireRequests(updated);

  return newRequest;
}

export async function updateHireRequestStatusAndNotes(
  id: string,
  status: HireRequestStatus,
  notes?: string
): Promise<HireRequest | null> {
  const current = loadLocalHireRequests();
  const index = current.findIndex((r) => r.id === id);
  if (index === -1) return null;

  const updatedRequest: HireRequest = {
    ...current[index],
    status,
    offline_notes: notes !== undefined ? notes : current[index].offline_notes,
    updated_at: new Date().toISOString(),
  };

  current[index] = updatedRequest;
  saveLocalHireRequests(current);

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase
        .from('hire_requests')
        .update({
          status,
          offline_notes: updatedRequest.offline_notes,
          updated_at: updatedRequest.updated_at,
        })
        .eq('id', id);
    } catch (err) {
      console.warn('Supabase update failed:', err);
    }
  }

  return updatedRequest;
}

export async function deleteHireRequest(id: string): Promise<boolean> {
  const current = loadLocalHireRequests();
  const filtered = current.filter((r) => r.id !== id);
  saveLocalHireRequests(filtered);

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('hire_requests').delete().eq('id', id);
    } catch {
      // Ignore
    }
  }
  return true;
}

export async function resetMockHireRequests(): Promise<HireRequest[]> {
  saveLocalHireRequests(INITIAL_HIRE_REQUESTS);
  return INITIAL_HIRE_REQUESTS;
}
