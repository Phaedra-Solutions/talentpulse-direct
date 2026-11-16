import { NextRequest, NextResponse } from 'next/server';
import { mergeTechnologies } from '@/lib/roles-tech-store';
import { requireAdminAuth } from '@/lib/auth/server-auth';
import { canManageRolesAndTech } from '@/lib/auth/permissions';

export async function POST(req: NextRequest) {
  try {
    const auth = requireAdminAuth(req, canManageRolesAndTech);
    if (auth.errorResponse) return auth.errorResponse;

    const body = await req.json();
    const { sourceIds, targetId, approveTarget = true } = body || {};

    if (!Array.isArray(sourceIds) || sourceIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one source technology id is required.' },
        { status: 400 }
      );
    }

    if (!targetId || typeof targetId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'A valid target technology id is required.' },
        { status: 400 }
      );
    }

    const filteredSources = sourceIds.filter((id: unknown): id is string => typeof id === 'string' && id !== targetId);
    if (filteredSources.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Source technologies must differ from the target technology.' },
        { status: 400 }
      );
    }

    const result = await mergeTechnologies(filteredSources, targetId, {
      approveTarget: Boolean(approveTarget),
    });

    try {
      const { revalidatePath } = await import('next/cache');
      revalidatePath('/', 'layout');
    } catch {}

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to merge technologies' },
      { status: 500 }
    );
  }
}
