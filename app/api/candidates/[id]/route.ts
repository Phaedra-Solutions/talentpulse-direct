import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient, isServerSupabaseConfigured } from '@/lib/supabase/server';
import { Candidate } from '@/types/candidate';
import { verifyAdminSessionToken } from '@/lib/auth/admin-password';

function getAdminSession(req: NextRequest) {
  const cookie = req.cookies.get('admin_session')?.value;
  const authHeader = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  const token = cookie || authHeader;
  if (!token) return null;
  return verifyAdminSessionToken(token);
}

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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const updates = await req.json();

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
