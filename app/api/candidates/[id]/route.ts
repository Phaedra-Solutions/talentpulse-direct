import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient, isServerSupabaseConfigured } from '@/lib/supabase/server';
import { Candidate } from '@/types/candidate';
import { requireAdminAuth } from '@/lib/auth/server-auth';
import { canAccessCandidatePipeline } from '@/lib/auth/permissions';

function fromDbCandidate(c: any, sanitizeLargeResumeBlob = false): Candidate {
  let role = c.primary_role;
  let notes = c.internal_notes || '';

  const roleMatch = notes.match(/\[Role:\s*([\w-]+)\]/);
  if (roleMatch && roleMatch[1]) {
    role = roleMatch[1];
  } else if (role === 'software_engineer') {
    role = 'full_stack';
  }

  let resumeUrl = c.resume_url;
  if (sanitizeLargeResumeBlob && typeof resumeUrl === 'string' && resumeUrl.startsWith('data:')) {
    resumeUrl = 'data:application/pdf;base64,[stored]';
  }

  return {
    ...c,
    primary_role: role,
    internal_notes: notes,
    resume_url: resumeUrl,
  };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = requireAdminAuth(req, canAccessCandidatePipeline);
    if (auth.errorResponse) return auth.errorResponse;

    const { id } = await params;
    const supabase = getSupabaseServerClient();
    if (supabase && isServerSupabaseConfigured) {
      const { data, error } = await supabase
        .from('candidates')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error || !data) {
        return NextResponse.json({ error: 'Candidate not found' }, { status: 404 });
      }
      return NextResponse.json({ candidate: fromDbCandidate(data, true), source: 'supabase' });
    }

    return NextResponse.json({ error: 'Candidate not found' }, { status: 404 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch candidate' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = requireAdminAuth(req, canAccessCandidatePipeline);
    if (auth.errorResponse) return auth.errorResponse;

    const { id } = await params;
    const updates = await req.json();
    if (typeof updates.resume_url === 'string' && (updates.resume_url.startsWith('attached://') || updates.resume_url === 'data:application/pdf;base64,[stored]')) {
      delete updates.resume_url;
    }

    const supabase = getSupabaseServerClient();
    if (supabase && isServerSupabaseConfigured) {
      const { data, error } = await supabase
        .from('candidates')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      return NextResponse.json({ candidate: fromDbCandidate(data, true), source: 'supabase' });
    }

    return NextResponse.json({
      candidate: {
        id,
        ...updates,
        updated_at: new Date().toISOString(),
      },
      source: 'demo_memory',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Update failed' }, { status: 400 });
  }
}
