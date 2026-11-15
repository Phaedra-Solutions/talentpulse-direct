import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient, isServerSupabaseConfigured } from '@/lib/supabase/server';
import { candidateApplicationSchema, Candidate } from '@/types/candidate';
import { INITIAL_MOCK_CANDIDATES } from '@/lib/mock-data';
import { getAuthenticatedAdmin, requireAdminAuth } from '@/lib/auth/server-auth';
import { canAccessCandidatePipeline } from '@/lib/auth/permissions';
import { 
  uploadResumeToSpaces, 
  deleteResumeFromSpaces, 
  buildResumeStorageKey 
} from '@/lib/storage/do-spaces';

function parseBase64FileData(dataUri: string): { buffer: Buffer; mimeType: string } | null {
  if (!dataUri || typeof dataUri !== 'string' || !dataUri.startsWith('data:')) return null;
  const commaIndex = dataUri.indexOf(',');
  if (commaIndex === -1) return null;
  const header = dataUri.slice(0, commaIndex);
  const base64Data = dataUri.slice(commaIndex + 1).replace(/\s/g, '');
  const mimeMatch = header.match(/^data:([^;]+)/);
  const mimeType = mimeMatch ? mimeMatch[1] : 'application/pdf';
  try {
    const buffer = Buffer.from(base64Data, 'base64');
    return { buffer, mimeType };
  } catch (err) {
    console.warn('Failed to parse base64 data URI:', err);
    return null;
  }
}

function sanitizeCandidateForPublic(c: Candidate): Candidate {
  return {
    ...c,
    phone_number: '',
    internal_notes: '',
    resume_url: '',
    resume_filename: '',
  };
}

function sanitizeCandidateForSelfService(c: Candidate): Candidate {
  return {
    ...c,
    internal_notes: '',
  };
}

async function getVerifiedSupabaseCandidateEmail(
  req: NextRequest,
  supabase: ReturnType<typeof getSupabaseServerClient>
): Promise<string | null> {
  if (!supabase || !isServerSupabaseConfigured) return null;
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.replace(/^Bearer\s+/i, '').trim();
  if (!token || token.split('.').length !== 3) return null;

  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user?.email) return null;
    return data.user.email.trim().toLowerCase();
  } catch {
    return null;
  }
}

// Helper to safely map application roles to existing Supabase DB enum values
function toDbCandidateData(candidate: any) {
  const data = { ...candidate };
  const role = data.primary_role;

  const standardDbRoles = ['ai_engineer', 'forward_deployed_engineer', 'full_stack'];
  if (!standardDbRoles.includes(role)) {
    data.primary_role = 'full_stack';
    data.internal_notes = `[Role: ${role}] ${data.internal_notes || ''}`.trim();
  }

  return data;
}

// Helper to format Supabase row back to application Candidate model
function fromDbCandidate(c: any): Candidate {
  let role = c.primary_role;
  let notes = c.internal_notes || '';

  const roleMatch = notes.match(/\[Role:\s*([\w-]+)\]/);
  if (roleMatch && roleMatch[1]) {
    role = roleMatch[1];
  } else if (role === 'software_engineer') {
    role = 'full_stack';
  }

  return {
    ...c,
    primary_role: role,
    internal_notes: notes,
  };
}

// Lightweight columns for admin list & export queries (NEVER includes multi-MB base64 resume_url blobs)
const CANDIDATE_LIST_COLUMNS = [
  'id',
  'created_at',
  'updated_at',
  'full_name',
  'email',
  'phone_number',
  'linkedin_url',
  'github_url',
  'portfolio_url',
  'resume_filename',
  'primary_role',
  'work_modes',
  'home_timezone',
  'target_timezones',
  'overlap_hours_per_day',
  'availability_status',
  'available_from',
  'english_proficiency',
  'written_pitch',
  'video_pitch_url',
  'tech_stack',
  'pipeline_stage',
  'internal_notes',
  'contractual_agreement_accepted',
].join(',');

const ALLOWED_SORT_COLUMNS = new Set([
  'created_at',
  'full_name',
  'availability_status',
  'overlap_hours_per_day',
]);

function applyCandidateFilters(
  query: any,
  params: {
    primaryRole?: string | null;
    targetRegion?: string | null;
    availabilityStatus?: string | null;
    pipelineStage?: string | null;
    englishProficiency?: string | null;
    hasVideoPitch?: string | null;
    hasResume?: string | null;
    email?: string | null;
    search?: string | null;
    matchedTechNames?: string[];
  }
) {
  const {
    primaryRole,
    targetRegion,
    availabilityStatus,
    pipelineStage,
    englishProficiency,
    hasVideoPitch,
    hasResume,
    email,
    search,
    matchedTechNames,
  } = params;

  if (primaryRole && primaryRole !== 'all') {
    if (primaryRole === 'solutions_architect') {
      query = query.or('primary_role.eq.solutions_architect,internal_notes.ilike.%[Role: solutions_architect]%');
    } else if (primaryRole === 'mobile_app_developer') {
      query = query.or('primary_role.eq.mobile_app_developer,internal_notes.ilike.%[Role: mobile_app_developer]%');
    } else if (primaryRole === 'fractional_cto') {
      query = query.or('primary_role.eq.fractional_cto,internal_notes.ilike.%[Role: fractional_cto]%,internal_notes.ilike.%[Role: fractional-cto]%');
    } else {
      query = query.eq('primary_role', primaryRole);
    }
  }

  if (targetRegion && targetRegion !== 'all') {
    query = query.contains('target_timezones', [targetRegion]);
  }

  if (availabilityStatus && availabilityStatus !== 'all') {
    query = query.eq('availability_status', availabilityStatus);
  }

  if (pipelineStage && pipelineStage !== 'all') {
    query = query.eq('pipeline_stage', pipelineStage);
  }

  if (englishProficiency && englishProficiency !== 'all') {
    query = query.eq('english_proficiency', englishProficiency);
  }

  if (hasVideoPitch === 'yes') {
    query = query.not('video_pitch_url', 'is', null).neq('video_pitch_url', '');
  } else if (hasVideoPitch === 'no') {
    query = query.or('video_pitch_url.is.null,video_pitch_url.eq.');
  }

  if (hasResume === 'yes') {
    query = query.not('resume_url', 'is', null).neq('resume_url', '');
  } else if (hasResume === 'no') {
    query = query.or('resume_url.is.null,resume_url.eq.');
  }

  if (email) {
    query = query.ilike('email', email.trim().toLowerCase());
  }

  if (search && search.trim().length > 0) {
    // Strip characters that can break PostgREST `.or(...)` syntax
    const safeQ = search.trim().replace(/[,()%]/g, ' ').trim();
    if (safeQ) {
      const orClauses = [
        `full_name.ilike.%${safeQ}%`,
        `email.ilike.%${safeQ}%`,
        `phone_number.ilike.%${safeQ}%`,
        `written_pitch.ilike.%${safeQ}%`,
        `internal_notes.ilike.%${safeQ}%`,
      ];
      if (matchedTechNames && matchedTechNames.length > 0) {
        const quotedTechs = matchedTechNames
          .slice(0, 20)
          .map((t) => `"${t.replace(/"/g, '')}"`)
          .join(',');
        orClauses.push(`tech_stack.ov.{${quotedTechs}}`);
      }
      query = query.or(orClauses.join(','));
    }
  }

  return query;
}

function formatListCandidateRow(row: any, resumeIdSet: Set<string>, truncatePitch: boolean): Candidate {
  const formatted = fromDbCandidate(row);
  const hasResume = resumeIdSet.has(formatted.id) || Boolean(formatted.resume_filename);
  const writtenPitch =
    truncatePitch && typeof formatted.written_pitch === 'string' && formatted.written_pitch.length > 320
      ? `${formatted.written_pitch.slice(0, 320)}...`
      : formatted.written_pitch || '';

  return {
    ...formatted,
    written_pitch: writtenPitch,
    resume_url: hasResume ? `attached://${formatted.resume_filename || 'resume.pdf'}` : null,
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const primaryRole = searchParams.get('primaryRole');
  const targetRegion = searchParams.get('targetRegion');
  const availabilityStatus = searchParams.get('availabilityStatus');
  const pipelineStage = searchParams.get('pipelineStage');
  const englishProficiency = searchParams.get('englishProficiency');
  const hasVideoPitch = searchParams.get('hasVideoPitch');
  const hasResume = searchParams.get('hasResume');
  const email = searchParams.get('email');
  const search = searchParams.get('search');
  const sortByParam = searchParams.get('sortBy') || 'created_at';
  const sortBy = ALLOWED_SORT_COLUMNS.has(sortByParam) ? sortByParam : 'created_at';
  const sortAscending = searchParams.get('sortOrder') === 'asc';
  const includeStats = searchParams.get('includeStats') === 'true';
  const isExport = searchParams.get('export') === 'true';
  const view = searchParams.get('view');

  const session = getAuthenticatedAdmin(req);
  const isAdmin = Boolean(session && canAccessCandidatePipeline(session.role));

  // Candidates are confidential: unauthenticated public requests cannot list candidates
  if (!isAdmin && !email) {
    return NextResponse.json(
      {
        candidates: [],
        total: 0,
        error: 'Access Denied: Candidate profiles and talent directory are confidential and restricted to authorized administrative personnel.',
      },
      { status: 403 }
    );
  }

  const supabase = getSupabaseServerClient();

  if (supabase && isServerSupabaseConfigured) {
    try {
      // Single-candidate lookup (used by Candidate Self-Service Update Portal)
      if (email && !search && !isExport) {
        const { data, error } = await supabase
          .from('candidates')
          .select('*')
          .ilike('email', email.trim().toLowerCase())
          .order('created_at', { ascending: false })
          .limit(5);

        if (error) {
          console.error('[GET /api/candidates] Supabase email lookup error:', error.message);
          return NextResponse.json(
            { candidates: [], total: 0, error: error.message, source: 'supabase_error' },
            { status: 500 }
          );
        }

        let formatted = (data || []).map(fromDbCandidate);
        if (!isAdmin) {
          const verifiedEmail = await getVerifiedSupabaseCandidateEmail(req, supabase);
          formatted = formatted.map((c) => {
            const isOwner = Boolean(verifiedEmail && c.email?.trim().toLowerCase() === verifiedEmail);
            if (!isOwner) return sanitizeCandidateForPublic(c);
            const sanitized = sanitizeCandidateForSelfService(c);
            if (sanitized.resume_url && sanitized.resume_url.startsWith('data:')) {
              sanitized.resume_url = 'data:application/pdf;base64,[stored]';
            }
            return sanitized;
          });
        }
        return NextResponse.json({
          candidates: formatted,
          total: formatted.length,
          source: 'supabase',
        });
      }

      // Resolve matching tech_stack names for case-insensitive search using GIN index
      let matchedTechNames: string[] = [];
      if (search && search.trim().length > 0) {
        const safeTerm = search.trim().replace(/[,()%]/g, '').trim();
        if (safeTerm.length > 0) {
          const { data: matchedTechs } = await supabase
            .from('technologies')
            .select('name')
            .ilike('name', `%${safeTerm}%`)
            .limit(20);
          matchedTechNames = (matchedTechs || []).map((t: any) => t.name).filter(Boolean);
          // Also include capitalized / raw variant in case candidate added custom unapproved skill casing
          const capitalized = safeTerm.charAt(0).toUpperCase() + safeTerm.slice(1);
          for (const variant of [safeTerm, safeTerm.toLowerCase(), safeTerm.toUpperCase(), capitalized]) {
            if (!matchedTechNames.includes(variant)) {
              matchedTechNames.push(variant);
            }
          }
        }
      }

      const filterParams = {
        primaryRole,
        targetRegion,
        availabilityStatus,
        pipelineStage,
        englishProficiency,
        hasVideoPitch,
        hasResume,
        email,
        search,
        matchedTechNames,
      };

      // Helper for KPI counts using head:true (0 rows transferred!)
      const fetchKpiStats = async () => {
        const [
          totalRes,
          availRes,
          videoRes,
          resumeRes,
          aiRes,
          mobileRes,
          archRes,
        ] = await Promise.all([
          supabase.from('candidates').select('id', { count: 'exact', head: true }),
          supabase.from('candidates').select('id', { count: 'exact', head: true }).eq('availability_status', 'available_now'),
          supabase.from('candidates').select('id', { count: 'exact', head: true }).not('video_pitch_url', 'is', null).neq('video_pitch_url', ''),
          supabase.from('candidates').select('id', { count: 'exact', head: true }).not('resume_url', 'is', null).neq('resume_url', ''),
          supabase.from('candidates').select('id', { count: 'exact', head: true }).eq('primary_role', 'ai_engineer'),
          supabase.from('candidates').select('id', { count: 'exact', head: true }).or('primary_role.eq.mobile_app_developer,internal_notes.ilike.%[Role: mobile_app_developer]%'),
          supabase.from('candidates').select('id', { count: 'exact', head: true }).or('primary_role.eq.solutions_architect,internal_notes.ilike.%[Role: solutions_architect]%'),
        ]);

        return {
          total: totalRes.count || 0,
          availableNow: availRes.count || 0,
          withVideo: videoRes.count || 0,
          withResume: resumeRes.count || 0,
          aiEngineers: aiRes.count || 0,
          mobileAndArchs: (mobileRes.count || 0) + (archRes.count || 0),
        };
      };

      // Export mode: paginate cleanly in chunks of 500 without base64 resume_url blobs
      if (isExport) {
        const allRows: any[] = [];
        const chunkSize = 500;
        let offset = 0;
        let totalCount = 0;

        while (offset < 10000) {
          let q = supabase
            .from('candidates')
            .select(CANDIDATE_LIST_COLUMNS, offset === 0 ? { count: 'exact' } : undefined);
          q = applyCandidateFilters(q, filterParams);
          q = q.order(sortBy, { ascending: sortAscending }).range(offset, offset + chunkSize - 1);

          const { data: chunk, error: chunkErr, count } = await q;
          if (chunkErr) {
            console.error('[GET /api/candidates?export=true] Supabase error:', chunkErr.message);
            return NextResponse.json(
              { candidates: [], total: 0, error: chunkErr.message, source: 'supabase_error' },
              { status: 500 }
            );
          }
          if (offset === 0 && typeof count === 'number') {
            totalCount = count;
          }
          if (!chunk || chunk.length === 0) break;
          allRows.push(...chunk);
          if (chunk.length < chunkSize) break;
          offset += chunkSize;
        }

        const formattedExport = allRows.map((row) => formatListCandidateRow(row, new Set(), false));
        return NextResponse.json({
          candidates: formattedExport,
          total: totalCount || formattedExport.length,
          source: 'supabase',
        });
      }

      // Kanban mode: fetch top 25 candidates per stage + exact count per stage
      if (view === 'kanban') {
        const stages = ['new', 'vetted', 'interviewing', 'assigned', 'on_hold'];
        const stageResults = await Promise.all(
          stages.map(async (stage) => {
            let q = supabase
              .from('candidates')
              .select(CANDIDATE_LIST_COLUMNS, { count: 'exact' });
            q = applyCandidateFilters(q, { ...filterParams, pipelineStage: stage });
            q = q.order(sortBy, { ascending: sortAscending }).range(0, 24);
            return q;
          })
        );

        const firstErr = stageResults.find((r) => r.error)?.error;
        if (firstErr) {
          console.error('[GET /api/candidates?view=kanban] Supabase error:', firstErr.message);
          return NextResponse.json(
            { candidates: [], total: 0, error: firstErr.message, source: 'supabase_error' },
            { status: 500 }
          );
        }

        const combinedRows = stageResults.flatMap((r) => r.data || []);
        const stageCounts: Record<string, number> = {};
        stages.forEach((stage, i) => {
          stageCounts[stage] = stageResults[i].count || 0;
        });

        const pageIds = combinedRows.map((r: any) => r.id).filter(Boolean);
        let resumeIdSet = new Set<string>();
        if (pageIds.length > 0 && hasResume !== 'no') {
          if (hasResume === 'yes') {
            resumeIdSet = new Set(pageIds);
          } else {
            const { data: resumeIds } = await supabase
              .from('candidates')
              .select('id')
              .in('id', pageIds)
              .not('resume_url', 'is', null)
              .neq('resume_url', '');
            resumeIdSet = new Set((resumeIds || []).map((r: any) => r.id));
          }
        }

        const stats = includeStats ? await fetchKpiStats() : undefined;
        const totalFiltered = Object.values(stageCounts).reduce((a, b) => a + b, 0);

        return NextResponse.json({
          candidates: combinedRows.map((r: any) => formatListCandidateRow(r, resumeIdSet, true)),
          total: totalFiltered,
          stageCounts,
          stats,
          source: 'supabase',
        });
      }

      // Standard paginated table / cards query (default 20 per page, max 100)
      const limitParam = parseInt(searchParams.get('limit') || '20', 10);
      const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 100) : 20;
      const pageParam = parseInt(searchParams.get('page') || '1', 10);
      const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      let listQuery = supabase
        .from('candidates')
        .select(CANDIDATE_LIST_COLUMNS, { count: 'exact' });
      listQuery = applyCandidateFilters(listQuery, filterParams);
      listQuery = listQuery.order(sortBy, { ascending: sortAscending }).range(from, to);

      const [listResult, stats] = await Promise.all([
        listQuery,
        includeStats ? fetchKpiStats() : Promise.resolve(undefined),
      ]);

      if (listResult.error) {
        console.error('[GET /api/candidates] Supabase query error:', listResult.error.message, listResult.error.code);
        return NextResponse.json(
          {
            candidates: [],
            total: 0,
            error: `Database query failed: ${listResult.error.message}`,
            code: listResult.error.code || 'SUPABASE_QUERY_ERROR',
            source: 'supabase_error',
          },
          { status: listResult.error.code === '57014' ? 504 : 500 }
        );
      }

      const rows = listResult.data || [];
      const total = typeof listResult.count === 'number' ? listResult.count : rows.length;

      // Check resume presence ONLY for the 20 IDs on the current page (0 bytes of base64!)
      const pageIds = rows.map((r: any) => r.id).filter(Boolean);
      let resumeIdSet = new Set<string>();
      if (pageIds.length > 0 && hasResume !== 'no') {
        if (hasResume === 'yes') {
          resumeIdSet = new Set(pageIds);
        } else {
          const { data: resumeIds } = await supabase
            .from('candidates')
            .select('id')
            .in('id', pageIds)
            .not('resume_url', 'is', null)
            .neq('resume_url', '');
          resumeIdSet = new Set((resumeIds || []).map((r: any) => r.id));
        }
      }

      const formatted = rows.map((row: any) => formatListCandidateRow(row, resumeIdSet, true));

      return NextResponse.json({
        candidates: formatted,
        total,
        page,
        limit,
        stats,
        source: 'supabase',
      });
    } catch (err: any) {
      console.error('[GET /api/candidates] Unexpected server error:', err);
      return NextResponse.json(
        {
          candidates: [],
          total: 0,
          error: err?.message || 'Unexpected database error while fetching candidates',
          source: 'supabase_error',
        },
        { status: 500 }
      );
    }
  }

  // Fallback demo dataset ONLY when Supabase is not configured
  let candidates = [...INITIAL_MOCK_CANDIDATES];
  if (primaryRole && primaryRole !== 'all') {
    candidates = candidates.filter((c) => c.primary_role === primaryRole);
  }
  if (targetRegion && targetRegion !== 'all') {
    candidates = candidates.filter((c) => c.target_timezones?.includes(targetRegion as any));
  }
  if (availabilityStatus && availabilityStatus !== 'all') {
    candidates = candidates.filter((c) => c.availability_status === availabilityStatus);
  }
  if (pipelineStage && pipelineStage !== 'all') {
    candidates = candidates.filter((c) => c.pipeline_stage === pipelineStage);
  }
  if (englishProficiency && englishProficiency !== 'all') {
    candidates = candidates.filter((c) => c.english_proficiency === englishProficiency);
  }
  if (hasVideoPitch === 'yes') {
    candidates = candidates.filter((c) => Boolean(c.video_pitch_url && c.video_pitch_url.trim().length > 0));
  } else if (hasVideoPitch === 'no') {
    candidates = candidates.filter((c) => !c.video_pitch_url || c.video_pitch_url.trim().length === 0);
  }
  if (hasResume === 'yes') {
    candidates = candidates.filter((c) => Boolean(c.resume_url && c.resume_url.trim().length > 0));
  } else if (hasResume === 'no') {
    candidates = candidates.filter((c) => !c.resume_url || c.resume_url.trim().length === 0);
  }
  if (email) {
    candidates = candidates.filter((c) => c.email.toLowerCase() === email.trim().toLowerCase());
  }
  if (search && search.trim()) {
    const q = search.toLowerCase().trim();
    candidates = candidates.filter(
      (c) =>
        c.full_name?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.phone_number?.toLowerCase().includes(q) ||
        c.written_pitch?.toLowerCase().includes(q) ||
        c.tech_stack?.some((t) => t.toLowerCase().includes(q)) ||
        c.internal_notes?.toLowerCase().includes(q)
    );
  }

  candidates.sort((a, b) => {
    let valA: any = (a as any)[sortBy];
    let valB: any = (b as any)[sortBy];
    if (sortBy === 'created_at') {
      valA = new Date(valA || 0).getTime();
      valB = new Date(valB || 0).getTime();
    }
    if (valA < valB) return sortAscending ? -1 : 1;
    if (valA > valB) return sortAscending ? 1 : -1;
    return 0;
  });

  if (!isAdmin) {
    candidates = candidates.map(sanitizeCandidateForPublic);
  }

  const total = candidates.length;
  const stats = includeStats
    ? {
        total: INITIAL_MOCK_CANDIDATES.length,
        availableNow: INITIAL_MOCK_CANDIDATES.filter((c) => c.availability_status === 'available_now').length,
        withVideo: INITIAL_MOCK_CANDIDATES.filter((c) => Boolean(c.video_pitch_url?.trim())).length,
        withResume: INITIAL_MOCK_CANDIDATES.filter((c) => Boolean(c.resume_url?.trim())).length,
        aiEngineers: INITIAL_MOCK_CANDIDATES.filter((c) => c.primary_role === 'ai_engineer').length,
        mobileAndArchs: INITIAL_MOCK_CANDIDATES.filter(
          (c) => c.primary_role === 'mobile_app_developer' || c.primary_role === 'solutions_architect'
        ).length,
      }
    : undefined;

  if (!isExport && view !== 'kanban') {
    const limitParam = parseInt(searchParams.get('limit') || '20', 10);
    const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 100) : 20;
    const pageParam = parseInt(searchParams.get('page') || '1', 10);
    const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
    const from = (page - 1) * limit;
    candidates = candidates.slice(from, from + limit);
  }

  return NextResponse.json({ candidates, total, stats, source: 'demo_memory' });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = candidateApplicationSchema.parse(body);
    const candidateId = crypto.randomUUID();

    let resumeStorageKey = validated.resume_url;
    if (validated.resume_url && validated.resume_url.startsWith('data:')) {
      const parsed = parseBase64FileData(validated.resume_url);
      if (parsed) {
        const uploadRes = await uploadResumeToSpaces({
          fileBuffer: parsed.buffer,
          filename: validated.resume_filename || 'Candidate_Resume.pdf',
          contentType: parsed.mimeType,
          candidateId,
        });
        if (uploadRes.success) {
          resumeStorageKey = uploadRes.storageKey;
        } else {
          return NextResponse.json(
            {
              error: uploadRes.error || 'Failed to store resume in DigitalOcean Spaces',
              code: uploadRes.code || 'DO_SPACES_UPLOAD_FAILED',
            },
            { status: uploadRes.statusCode || 502 }
          );
        }
      }
    }

    const candidateData = {
      ...validated,
      id: candidateId,
      resume_url: resumeStorageKey,
      overlap_hours_per_day: Number(validated.overlap_hours_per_day),
      consent_timestamp: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      pipeline_stage: 'new',
      internal_notes: 'Submitted via public application route.',
    };

    const supabase = getSupabaseServerClient();
    if (supabase && isServerSupabaseConfigured) {
      const dbPayload = toDbCandidateData(candidateData);
      let { data, error } = await supabase
        .from('candidates')
        .insert([dbPayload])
        .select()
        .single();

      // Graceful fallback if database has not yet run the legal consent migration
      if (error && (error.message?.includes('terms_accepted') || error.message?.includes('privacy_accepted') || error.message?.includes('consent_timestamp'))) {
        const fallbackPayload = { ...dbPayload };
        delete fallbackPayload.terms_accepted;
        delete fallbackPayload.privacy_accepted;
        delete fallbackPayload.consent_timestamp;

        const retry = await supabase
          .from('candidates')
          .insert([fallbackPayload])
          .select()
          .single();

        if (!retry.error) {
          data = retry.data;
          error = null;
        }
      }

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      return NextResponse.json({ candidate: fromDbCandidate(data), source: 'supabase' }, { status: 201 });
    }

    // Return created payload in demo mode
    return NextResponse.json({
      candidate: {
        ...candidateData,
      },
      source: 'demo_memory',
    }, { status: 201 });

  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Validation failed' }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, id, ...updates } = body;

    if (!email && !id) {
      return NextResponse.json({ error: 'Candidate email or id is required for updates' }, { status: 400 });
    }

    const adminSession = getAuthenticatedAdmin(req);
    const isAdmin = Boolean(adminSession && canAccessCandidatePipeline(adminSession.role));

    // Pipeline stage and internal notes modifications require authenticated admin
    if (updates.pipeline_stage !== undefined || updates.internal_notes !== undefined) {
      if (!isAdmin) {
        const auth = requireAdminAuth(req, canAccessCandidatePipeline);
        if (auth.errorResponse) {
          return auth.errorResponse;
        }
      }
    }

    const supabase = getSupabaseServerClient();

    // When live Supabase is configured, require either an authorized admin or a verified Supabase OTP session matching the candidate email
    if (supabase && isServerSupabaseConfigured && !isAdmin) {
      const verifiedEmail = await getVerifiedSupabaseCandidateEmail(req, supabase);
      const targetEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
      if (!verifiedEmail || (targetEmail && verifiedEmail !== targetEmail)) {
        return NextResponse.json(
          { error: 'Verification Required: Please verify your email via OTP before updating your profile.' },
          { status: 401 }
        );
      }
    }

    // Look up existing candidate to handle resume deletion/replacement
    let existingCandidate: any = null;
    if (supabase && isServerSupabaseConfigured) {
      let q = supabase.from('candidates').select('*');
      if (id) q = q.eq('id', id);
      else if (email) q = q.ilike('email', email.trim().toLowerCase());
      const { data } = await q.maybeSingle();
      existingCandidate = data;
    } else {
      existingCandidate = INITIAL_MOCK_CANDIDATES.find(c => 
        (id && c.id === id) || (email && c.email.toLowerCase() === email.trim().toLowerCase())
      );
    }

    const targetCandId = existingCandidate?.id || id || crypto.randomUUID();
    const oldResumeKey = existingCandidate?.resume_url;

    if (
      updates.resume_url === 'data:application/pdf;base64,[stored]' ||
      (typeof updates.resume_url === 'string' && updates.resume_url.startsWith('attached://'))
    ) {
      delete updates.resume_url;
    }

    // Handle resume replacement or deletion
    if (updates.resume_url && updates.resume_url.startsWith('data:')) {
      const parsed = parseBase64FileData(updates.resume_url);
      if (parsed) {
        const uploadRes = await uploadResumeToSpaces({
          fileBuffer: parsed.buffer,
          filename: updates.resume_filename || existingCandidate?.resume_filename || 'Candidate_Resume.pdf',
          contentType: parsed.mimeType,
          candidateId: targetCandId,
          oldResumeKey, // Automatically deletes old file from DigitalOcean Spaces
        });
        if (uploadRes.success) {
          updates.resume_url = uploadRes.storageKey;
        } else {
          return NextResponse.json(
            {
              error: uploadRes.error || 'Failed to store replacement resume in DigitalOcean Spaces',
              code: uploadRes.code || 'DO_SPACES_UPLOAD_FAILED',
            },
            { status: uploadRes.statusCode || 502 }
          );
        }
      }
    } else if (updates.resume_url === '' && oldResumeKey && oldResumeKey.startsWith('Talent Pulse/')) {
      // Resume removed: delete old file from DO Spaces
      await deleteResumeFromSpaces(oldResumeKey);
    }

    if (supabase && isServerSupabaseConfigured) {
      if (supabase && isServerSupabaseConfigured && !isAdmin) {
        const verifiedEmail = await getVerifiedSupabaseCandidateEmail(req, supabase);
        const ownerEmail = existingCandidate?.email?.trim().toLowerCase();
        if (!verifiedEmail || !ownerEmail || verifiedEmail !== ownerEmail) {
          return NextResponse.json(
            { error: 'Verification Required: Authenticated email does not match the target candidate record.' },
            { status: 403 }
          );
        }
      }

      const payload: any = {
        ...updates,
        updated_at: new Date().toISOString(),
      };
      if (!isAdmin) {
        delete payload.pipeline_stage;
        delete payload.internal_notes;
        delete payload.id;
        delete payload.user_id;
        delete payload.email;
      }

      if (payload.primary_role) {
        const mapped = toDbCandidateData(payload);
        payload.primary_role = mapped.primary_role;
        if (mapped.internal_notes) {
          payload.internal_notes = mapped.internal_notes;
        }
      }

      let query = supabase.from('candidates').update(payload);

      if (id) {
        query = query.eq('id', id);
      } else if (email) {
        query = query.ilike('email', email.trim().toLowerCase());
      }

      const { data, error } = await query.select().single();
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      const formatted = fromDbCandidate(data);
      return NextResponse.json({
        candidate: isAdmin ? formatted : sanitizeCandidateForSelfService(formatted),
        source: 'supabase',
      });
    }

    return NextResponse.json({
      candidate: {
        id: targetCandId,
        email: email || existingCandidate?.email || '',
        ...updates,
        updated_at: new Date().toISOString(),
      },
      source: 'demo_memory',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Update failed' }, { status: 400 });
  }
}
