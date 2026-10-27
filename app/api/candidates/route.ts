import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient, isServerSupabaseConfigured } from '@/lib/supabase/server';
import { candidateApplicationSchema, Candidate } from '@/types/candidate';
import { INITIAL_MOCK_CANDIDATES } from '@/lib/mock-data';
import { verifyAdminSessionToken } from '@/lib/auth/admin-password';

function getAdminSession(req: NextRequest) {
  const cookie = req.cookies.get('admin_session')?.value;
  const authHeader = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  const token = cookie || authHeader;
  if (!token) return null;
  return verifyAdminSessionToken(token);
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

// Helper to safely map application roles to existing Supabase DB enum values
function toDbCandidateData(candidate: any) {
  const data = { ...candidate };
  const role = data.primary_role;

  if (role === 'solutions_architect') {
    data.primary_role = 'full_stack';
    data.internal_notes = `[Role: solutions_architect] ${data.internal_notes || ''}`.trim();
  } else if (role === 'mobile_app_developer') {
    data.primary_role = 'software_engineer';
    data.internal_notes = `[Role: mobile_app_developer] ${data.internal_notes || ''}`.trim();
  }

  return data;
}

// Helper to format Supabase row back to application Candidate model
function fromDbCandidate(c: any): Candidate {
  let role = c.primary_role;
  let notes = c.internal_notes || '';

  if (notes.includes('[Role: solutions_architect]')) {
    role = 'solutions_architect';
  } else if (notes.includes('[Role: mobile_app_developer]')) {
    role = 'mobile_app_developer';
  } else if (role === 'software_engineer') {
    role = 'full_stack';
  }

  return {
    ...c,
    primary_role: role,
    internal_notes: notes,
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const primaryRole = searchParams.get('primaryRole');
  const availabilityStatus = searchParams.get('availabilityStatus');
  const pipelineStage = searchParams.get('pipelineStage');
  const email = searchParams.get('email');

  const session = getAdminSession(req);
  const isAdmin = Boolean(session);

  const supabase = getSupabaseServerClient();

  if (supabase && isServerSupabaseConfigured) {
    let query = supabase.from('candidates').select('*');
    if (primaryRole && primaryRole !== 'all') {
      if (primaryRole === 'solutions_architect') {
        query = query.or('primary_role.eq.solutions_architect,internal_notes.ilike.%[Role: solutions_architect]%');
      } else if (primaryRole === 'mobile_app_developer') {
        query = query.or('primary_role.eq.mobile_app_developer,internal_notes.ilike.%[Role: mobile_app_developer]%');
      } else {
        query = query.eq('primary_role', primaryRole);
      }
    }
    if (availabilityStatus && availabilityStatus !== 'all') query = query.eq('availability_status', availabilityStatus);
    if (pipelineStage && pipelineStage !== 'all') query = query.eq('pipeline_stage', pipelineStage);
    if (email) query = query.ilike('email', email.trim().toLowerCase());

    const { data, error } = await query.order('created_at', { ascending: false });
    if (!error && data) {
      let formatted = data.map(fromDbCandidate);
      // If not authenticated admin and not single candidate lookup, sanitize PII
      if (!isAdmin && !email) {
        formatted = formatted.map(sanitizeCandidateForPublic);
      }
      return NextResponse.json({ candidates: formatted, source: 'supabase' });
    }
  }

  // Fallback demo dataset
  let candidates = [...INITIAL_MOCK_CANDIDATES];
  if (primaryRole && primaryRole !== 'all') {
    candidates = candidates.filter(c => c.primary_role === primaryRole);
  }
  if (availabilityStatus && availabilityStatus !== 'all') {
    candidates = candidates.filter(c => c.availability_status === availabilityStatus);
  }
  if (pipelineStage && pipelineStage !== 'all') {
    candidates = candidates.filter(c => c.pipeline_stage === pipelineStage);
  }
  if (email) {
    candidates = candidates.filter(c => c.email.toLowerCase() === email.trim().toLowerCase());
  }

  if (!isAdmin && !email) {
    candidates = candidates.map(sanitizeCandidateForPublic);
  }

  return NextResponse.json({ candidates, source: 'demo_memory' });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = candidateApplicationSchema.parse(body);

    const candidateData = {
      ...validated,
      overlap_hours_per_day: Number(validated.overlap_hours_per_day),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      pipeline_stage: 'new',
      internal_notes: 'Submitted via public application route.',
    };

    const supabase = getSupabaseServerClient();
    if (supabase && isServerSupabaseConfigured) {
      const dbPayload = toDbCandidateData(candidateData);
      const { data, error } = await supabase
        .from('candidates')
        .insert([dbPayload])
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      return NextResponse.json({ candidate: fromDbCandidate(data), source: 'supabase' }, { status: 201 });
    }

    // Return created payload in demo mode
    return NextResponse.json({
      candidate: {
        id: crypto.randomUUID(),
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

    // Pipeline stage and internal notes modifications require authenticated admin
    if (updates.pipeline_stage !== undefined || updates.internal_notes !== undefined) {
      const session = getAdminSession(req);
      if (isServerSupabaseConfigured && !session) {
        return NextResponse.json(
          { error: 'Unauthorized: Admin authentication session required to update candidate pipeline stage or internal notes.' },
          { status: 401 }
        );
      }
    }

    const supabase = getSupabaseServerClient();
    if (supabase && isServerSupabaseConfigured) {
      const payload: any = {
        ...updates,
        updated_at: new Date().toISOString(),
      };

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
      return NextResponse.json({ candidate: fromDbCandidate(data), source: 'supabase' });
    }

    return NextResponse.json({
      candidate: {
        id: id || crypto.randomUUID(),
        email: email || '',
        ...updates,
        updated_at: new Date().toISOString(),
      },
      source: 'demo_memory',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Update failed' }, { status: 400 });
  }
}
