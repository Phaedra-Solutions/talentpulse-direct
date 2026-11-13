import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedAdmin, requireAdminAuth } from '@/lib/auth/server-auth';
import { canAccessCandidatePipeline } from '@/lib/auth/permissions';
import { runResumeMigration } from '@/scripts/migrate-resumes-to-do-spaces';
import { isDoSpacesConfigured } from '@/lib/storage/do-spaces';

export async function POST(req: NextRequest) {
  const auth = requireAdminAuth(req, canAccessCandidatePipeline);
  if (auth.errorResponse) {
    return auth.errorResponse;
  }

  try {
    const result = await runResumeMigration();
    return NextResponse.json({
      ...result,
      isDoSpacesConfigured: isDoSpacesConfigured(),
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err.message || 'Resume migration failed',
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const auth = requireAdminAuth(req, canAccessCandidatePipeline);
  if (auth.errorResponse) {
    return auth.errorResponse;
  }

  return NextResponse.json({
    status: 'ready',
    isDoSpacesConfigured: isDoSpacesConfigured(),
    folderStructure: 'Talent Pulse/{Month-Year}/candidate/{candidateId}_{filename}',
    accessControl: 'Private (system proxy only)',
  });
}
