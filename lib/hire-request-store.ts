import {
  HireRequest,
  HireRequestFilterStatus,
  HireRequestFormValues,
  HireRequestStatus,
} from '@/types/hire-request';
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

const HIRE_REQUEST_SUMMARY_COLUMNS = [
  'id',
  'role_id',
  'role_title',
  'expected_cost',
  'timeline_to_start',
  'client_name',
  'client_email',
  'client_phone',
  'country',
  'business_name',
  'status',
  'offline_notes',
  'created_at',
  'updated_at',
].join(',');

export interface HireRequestStatusStats {
  total: number;
  activeCount: number;
  newCount: number;
  contactedCount: number;
  negotiatingCount: number;
  signedCount: number;
  closedCount: number;
}

export interface PaginatedHireRequestsResult {
  requests: HireRequest[];
  total: number;
  page: number;
  limit: number;
  isLiveSupabase: boolean;
  stats?: HireRequestStatusStats;
  error?: string;
}

function applyHireRequestFilters(
  q: any,
  status?: HireRequestFilterStatus,
  search?: string
) {
  const effectiveStatus = status || 'active';
  if (effectiveStatus === 'active') {
    q = q.neq('status', 'closed').neq('status', 'archived');
  } else if (effectiveStatus === 'closed') {
    q = q.in('status', ['closed', 'archived']);
  } else if (effectiveStatus !== 'all') {
    q = q.eq('status', effectiveStatus);
  }
  if (search && search.trim().length > 0) {
    const safe = search.trim().replace(/[,()%]/g, ' ').trim();
    if (safe) {
      q = q.or(
        [
          `business_name.ilike.%${safe}%`,
          `client_name.ilike.%${safe}%`,
          `client_email.ilike.%${safe}%`,
          `client_phone.ilike.%${safe}%`,
          `role_title.ilike.%${safe}%`,
          `country.ilike.%${safe}%`,
          `expected_cost.ilike.%${safe}%`,
        ].join(',')
      );
    }
  }
  return q;
}

export async function getHireRequestsPaginated(filters?: {
  page?: number;
  limit?: number;
  status?: HireRequestFilterStatus;
  search?: string;
  includeStats?: boolean;
  summary?: boolean;
}): Promise<PaginatedHireRequestsResult> {
  const page = filters?.page && filters.page > 0 ? filters.page : 1;
  const limit = filters?.limit && filters.limit > 0 ? Math.min(filters.limit, 100) : 25;
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  const statusFilter: HireRequestFilterStatus = filters?.status || 'active';
  const search = filters?.search || '';

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const cols = filters?.summary ? HIRE_REQUEST_SUMMARY_COLUMNS : '*';
      let listQuery = supabase.from('hire_requests').select(cols, { count: 'exact' });
      listQuery = applyHireRequestFilters(listQuery, statusFilter, search);
      listQuery = listQuery.order('created_at', { ascending: false }).range(from, to);

      const statsPromise = filters?.includeStats
        ? Promise.all([
            supabase.from('hire_requests').select('id', { count: 'exact', head: true }),
            supabase.from('hire_requests').select('id', { count: 'exact', head: true }).eq('status', 'new'),
            supabase.from('hire_requests').select('id', { count: 'exact', head: true }).eq('status', 'contacted'),
            supabase.from('hire_requests').select('id', { count: 'exact', head: true }).eq('status', 'negotiating'),
            supabase.from('hire_requests').select('id', { count: 'exact', head: true }).eq('status', 'contract_signed'),
            supabase.from('hire_requests').select('id', { count: 'exact', head: true }).in('status', ['closed', 'archived']),
          ])
        : Promise.resolve(null);

      const [listRes, statsRes] = await Promise.all([listQuery, statsPromise]);

      if (listRes.error) {
        console.error('[getHireRequestsPaginated] Supabase query error:', listRes.error.message);
        return {
          requests: [],
          total: 0,
          page,
          limit,
          isLiveSupabase: false,
          error: `Database query failed: ${listRes.error.message}`,
        };
      }

      const rows = (listRes.data || []) as unknown as HireRequest[];
      const total = typeof listRes.count === 'number' ? listRes.count : rows.length;

      const stats: HireRequestStatusStats | undefined = statsRes
        ? (() => {
            const totalAll = statsRes[0].count || 0;
            const closedAll = statsRes[5].count || 0;
            return {
              total: totalAll,
              activeCount: Math.max(0, totalAll - closedAll),
              newCount: statsRes[1].count || 0,
              contactedCount: statsRes[2].count || 0,
              negotiatingCount: statsRes[3].count || 0,
              signedCount: statsRes[4].count || 0,
              closedCount: closedAll,
            };
          })()
        : undefined;

      return {
        requests: rows,
        total,
        page,
        limit,
        isLiveSupabase: true,
        stats,
      };
    } catch (err: any) {
      console.error('[getHireRequestsPaginated] Unexpected Supabase error:', err);
      return {
        requests: [],
        total: 0,
        page,
        limit,
        isLiveSupabase: false,
        error: err?.message || 'Unexpected database error fetching hire requests',
      };
    }
  }

  // Fallback demo store only when Supabase is not configured
  let all = loadLocalHireRequests();
  const stats: HireRequestStatusStats | undefined = filters?.includeStats
    ? (() => {
        const closedAll = all.filter(
          (r) => r.status === 'closed' || (r.status as string) === 'archived'
        ).length;
        return {
          total: all.length,
          activeCount: Math.max(0, all.length - closedAll),
          newCount: all.filter((r) => r.status === 'new').length,
          contactedCount: all.filter((r) => r.status === 'contacted').length,
          negotiatingCount: all.filter((r) => r.status === 'negotiating').length,
          signedCount: all.filter((r) => r.status === 'contract_signed').length,
          closedCount: closedAll,
        };
      })()
    : undefined;

  if (statusFilter === 'active') {
    all = all.filter((r) => r.status !== 'closed' && (r.status as string) !== 'archived');
  } else if (statusFilter === 'closed') {
    all = all.filter((r) => r.status === 'closed' || (r.status as string) === 'archived');
  } else if (statusFilter !== 'all') {
    all = all.filter((r) => r.status === statusFilter);
  }
  if (search.trim()) {
    const q = search.trim().toLowerCase();
    all = all.filter(
      (r) =>
        r.business_name.toLowerCase().includes(q) ||
        r.client_name.toLowerCase().includes(q) ||
        r.client_email.toLowerCase().includes(q) ||
        r.role_title.toLowerCase().includes(q) ||
        r.country.toLowerCase().includes(q) ||
        r.client_phone.includes(q)
    );
  }

  const total = all.length;
  const sliced = all.slice(from, from + limit);

  return {
    requests: sliced,
    total,
    page,
    limit,
    isLiveSupabase: false,
    stats,
  };
}

export async function exportHireRequestsList(filters?: {
  status?: HireRequestFilterStatus;
  search?: string;
}): Promise<{ requests: HireRequest[]; isLiveSupabase: boolean; error?: string }> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const allRows: HireRequest[] = [];
      const chunkSize = 500;
      let offset = 0;

      while (offset < 10000) {
        let q = supabase.from('hire_requests').select('*');
        q = applyHireRequestFilters(q, filters?.status || 'active', filters?.search || '');
        q = q.order('created_at', { ascending: false }).range(offset, offset + chunkSize - 1);

        const { data, error } = await q;
        if (error) {
          return { requests: [], isLiveSupabase: false, error: error.message };
        }
        if (!data || data.length === 0) break;
        allRows.push(...(data as HireRequest[]));
        if (data.length < chunkSize) break;
        offset += chunkSize;
      }

      return { requests: allRows, isLiveSupabase: true };
    } catch (err: any) {
      return { requests: [], isLiveSupabase: false, error: err?.message || 'Export failed' };
    }
  }

  const res = await getHireRequestsPaginated({
    page: 1,
    limit: 100,
    status: filters?.status,
    search: filters?.search,
  });
  return { requests: res.requests, isLiveSupabase: false };
}

export async function getHireRequestsList(): Promise<{
  requests: HireRequest[];
  isLiveSupabase: boolean;
}> {
  const res = await getHireRequestsPaginated({ page: 1, limit: 100 });
  return {
    requests: res.requests,
    isLiveSupabase: res.isLiveSupabase,
  };
}

export async function getHireRequestById(id: string): Promise<HireRequest | null> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('hire_requests')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (!error && data) {
        return data as HireRequest;
      }
    } catch (err) {
      console.warn('[getHireRequestById] Supabase error:', err);
    }
  }
  const local = loadLocalHireRequests();
  return local.find((r) => r.id === id) || null;
}

export async function createHireRequest(
  values: HireRequestFormValues,
  roleTitle?: string
): Promise<HireRequest> {
  const now = new Date().toISOString();
  const newRequest: HireRequest = {
    id: `hire-req-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    role_id: values.role_id,
    role_title: roleTitle || values.role_id,
    expected_cost: values.expected_cost.trim(),
    timeline_to_start: values.timeline_to_start.trim(),
    client_name: values.client_name.trim(),
    client_email: values.client_email.trim(),
    client_phone: values.client_phone.trim(),
    country: values.country.trim(),
    business_name: values.business_name.trim(),
    project_scope: (values.project_scope || '').trim(),
    status: 'new',
    offline_notes: 'New client request submitted via online portal. Pending offline review and contact.',
    terms_accepted: values.terms_accepted,
    privacy_accepted: values.privacy_accepted,
    consent_timestamp: now,
    created_at: now,
    updated_at: now,
  };

  const supabase = getSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase
      .from('hire_requests')
      .insert([newRequest])
      .select()
      .maybeSingle();

    if (
      error &&
      (error.message?.includes('terms_accepted') ||
        error.message?.includes('privacy_accepted') ||
        error.message?.includes('consent_timestamp'))
    ) {
      const fallbackRequest = { ...newRequest };
      delete fallbackRequest.terms_accepted;
      delete fallbackRequest.privacy_accepted;
      delete fallbackRequest.consent_timestamp;
      const retry = await supabase
        .from('hire_requests')
        .insert([fallbackRequest])
        .select()
        .maybeSingle();
      if (retry.error) {
        throw new Error(`Database error saving hire request: ${retry.error.message}`);
      }
      if (retry.data) {
        return retry.data as HireRequest;
      }
    } else if (error) {
      throw new Error(`Database error saving hire request: ${error.message}`);
    } else if (data) {
      return data as HireRequest;
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
  const now = new Date().toISOString();
  const supabase = getSupabaseClient();

  if (supabase) {
    const updatePayload: Record<string, any> = {
      updated_at: now,
    };
    if (status) updatePayload.status = status;
    if (notes !== undefined) updatePayload.offline_notes = notes;

    const { data, error } = await supabase
      .from('hire_requests')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) {
      throw new Error(`Database error updating hire request: ${error.message}`);
    }
    if (data) {
      return data as HireRequest;
    }
  }

  const current = loadLocalHireRequests();
  const index = current.findIndex((r) => r.id === id);
  if (index === -1) return null;

  const updatedRequest: HireRequest = {
    ...current[index],
    status: status || current[index].status,
    offline_notes: notes !== undefined ? notes : current[index].offline_notes,
    updated_at: now,
  };

  current[index] = updatedRequest;
  saveLocalHireRequests(current);

  return updatedRequest;
}

export async function deleteHireRequest(id: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (supabase) {
    const { error } = await supabase.from('hire_requests').delete().eq('id', id);
    if (error) {
      throw new Error(`Database error deleting hire request: ${error.message}`);
    }
    return true;
  }

  const current = loadLocalHireRequests();
  const filtered = current.filter((r) => r.id !== id);
  saveLocalHireRequests(filtered);
  return true;
}
