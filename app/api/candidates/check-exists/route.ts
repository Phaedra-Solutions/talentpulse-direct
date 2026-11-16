import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient, isServerSupabaseConfigured } from '@/lib/supabase/server';
import { INITIAL_MOCK_CANDIDATES } from '@/lib/mock-data';
import { findExistingCandidateMatch } from '@/lib/candidate-duplicate';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = typeof body?.email === 'string' ? body.email.trim() : '';
    const phone_number = typeof body?.phone_number === 'string' ? body.phone_number.trim() : '';

    if (!email && !phone_number) {
      return NextResponse.json(
        { error: 'Email or phone number is required to verify candidate eligibility.' },
        { status: 400 }
      );
    }

    const supabase = isServerSupabaseConfigured ? getSupabaseServerClient() : null;
    const result = await findExistingCandidateMatch(
      supabase,
      { email, phone_number },
      INITIAL_MOCK_CANDIDATES
    );

    // Explicitly return only boolean existence and matched field — never any candidate PII
    return NextResponse.json({
      exists: result.exists,
      matchedBy: result.matchedBy,
    });
  } catch (err: any) {
    console.error('[POST /api/candidates/check-exists] Error:', err?.message || err);
    return NextResponse.json(
      { error: err?.message || 'Unable to verify email or phone right now. Please try again.' },
      { status: 500 }
    );
  }
}
