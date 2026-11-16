import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth/server-auth';
import { canAccessCandidatePipeline } from '@/lib/auth/permissions';
import {
  getResumeMigrationStatus,
  runResumeMigrationBatch,
} from '@/scripts/migrate-resumes-to-do-spaces';
import { isDoSpacesConfigured } from '@/lib/storage/do-spaces';

export async function POST(req: NextRequest) {
  const auth = requireAdminAuth(req, canAccessCandidatePipeline);
  if (auth.errorResponse) {
    return auth.errorResponse;
  }

  try {
    let batchSize = 5;
    let cursorId: string | undefined = undefined;

    try {
      const body = await req.json();
      if (body && typeof body.batchSize === 'number') {
        batchSize = body.batchSize;
      }
      if (body && typeof body.cursorId === 'string' && body.cursorId.trim()) {
        cursorId = body.cursorId.trim();
      }
    } catch {
      // Allow empty POST body (uses defaults batchSize=5, cursorId=undefined)
    }

    const result = await runResumeMigrationBatch({ batchSize, cursorId });
    return NextResponse.json({
      ...result,
      isDoSpacesConfigured: isDoSpacesConfigured(),
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Resume migration failed',
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const auth = requireAdminAuth(req, canAccessCandidatePipeline);
  if (auth.errorResponse) {
    return auth.errorResponse;
  }

  try {
    const queueStatus = await getResumeMigrationStatus();
    return NextResponse.json({
      status: 'ready',
      isDoSpacesConfigured: isDoSpacesConfigured(),
      folderStructure: 'Talent Pulse/{Month-Year}/candidate/{candidateId}_{filename}',
      accessControl: 'Private (system proxy only)',
      queue: queueStatus,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        status: 'error',
        isDoSpacesConfigured: isDoSpacesConfigured(),
        error: err?.message || 'Failed to inspect resume migration status',
      },
      { status: 500 }
    );
  }
}
