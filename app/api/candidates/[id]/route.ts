import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient, isServerSupabaseConfigured } from '@/lib/supabase/server';
import { Candidate, candidateStagePatchSchema } from '@/types/candidate';
import { requireAdminAuth } from '@/lib/auth/server-auth';
import { canAccessCandidatePipeline } from '@/lib/auth/permissions';

function fromDbCandidate(c: any, sanitizeLargeResumeBlob = false): Candidate {
  let role = c.primary_role;
  let notes = c.internal_notes || '';
  let stage = c.pipeline_stage;

  const roleMatch = notes.match(/\[Role:\s*([\w-]+)\]/);
  if (roleMatch && roleMatch[1]) {
    role = roleMatch[1];
  } else if (role === 'software_engineer') {
    role = 'full_stack';
  }

  if (notes.includes('[Stage: rejected]')) {
    stage = 'rejected';
    notes = notes.replace(/\[Stage:\s*rejected\]\s*/g, '').trim();
  }

  let resumeUrl = c.resume_url;
  if (sanitizeLargeResumeBlob && typeof resumeUrl === 'string' && resumeUrl.startsWith('data:')) {
    resumeUrl = 'data:application/pdf;base64,[stored]';
  }

  return {
    ...c,
    primary_role: role,
    pipeline_stage: stage,
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
    const body = await req.json();
    const parsed = candidateStagePatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid pipeline stage or notes payload' },
        { status: 400 }
      );
    }

    const cleanNotes = (parsed.data.internal_notes ?? '')
      .replace(/\[Stage:\s*rejected\]\s*/g, '')
      .trim();
    const targetStage = parsed.data.pipeline_stage;

    const supabase = getSupabaseServerClient();
    if (supabase && isServerSupabaseConfigured) {
      let { data, error } = await supabase
        .from('candidates')
        .update({
          pipeline_stage: targetStage,
          internal_notes: cleanNotes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      // Graceful fallback if DB enum migration for 'rejected' has not yet run
      if (
        error &&
        targetStage === 'rejected' &&
        (error.code === '22P02' || String(error.message || '').includes('invalid input value for enum'))
      ) {
        const retry = await supabase
          .from('candidates')
          .update({
            pipeline_stage: 'on_hold',
            internal_notes: cleanNotes ? `[Stage: rejected] ${cleanNotes}` : '[Stage: rejected]',
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .select()
          .single();
        data = retry.data;
        error = retry.error;
      }

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      return NextResponse.json({ candidate: fromDbCandidate(data, true), source: 'supabase' });
    }

    return NextResponse.json({
      candidate: {
        id,
        pipeline_stage: targetStage,
        internal_notes: cleanNotes,
        updated_at: new Date().toISOString(),
      },
      source: 'demo_memory',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Update failed' }, { status: 400 });
  }
}
