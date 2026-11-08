import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient, isServerSupabaseConfigured } from '@/lib/supabase/server';
import { Candidate } from '@/types/candidate';
import { requireAdminAuth } from '@/lib/auth/server-auth';
import { canAccessCandidatePipeline } from '@/lib/auth/permissions';

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
      return NextResponse.json({ candidate: fromDbCandidate(data), source: 'supabase' });
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
      return NextResponse.json({ candidate: fromDbCandidate(data), source: 'supabase' });
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
