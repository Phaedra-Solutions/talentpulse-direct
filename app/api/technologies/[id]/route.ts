import { NextRequest, NextResponse } from 'next/server';
import { updateTechnologyRecord, deleteTechnologyRecord } from '@/lib/roles-tech-store';
import { requireAdminAuth } from '@/lib/auth/server-auth';
import { canManageRolesAndTech } from '@/lib/auth/permissions';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = requireAdminAuth(req, canManageRolesAndTech);
    if (auth.errorResponse) return auth.errorResponse;

    const { id } = await params;
    const body = await req.json();
    const updated = await updateTechnologyRecord(id, body);
    try {
      const { revalidatePath } = await import('next/cache');
      revalidatePath('/', 'layout');
    } catch {}
    return NextResponse.json({ success: true, technology: updated });
  } catch (err: any) {
    const msg = err?.message || 'Failed to update technology';
    const isConflict = msg.includes('Duplicate detected:') || msg.includes('already used by');
    return NextResponse.json({ success: false, error: msg }, { status: isConflict ? 409 : 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = requireAdminAuth(req, canManageRolesAndTech);
    if (auth.errorResponse) return auth.errorResponse;

    const { id } = await params;
    const force = new URL(req.url).searchParams.get('force') === 'true';
    const result = await deleteTechnologyRecord(id, { force });
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    try {
      const { revalidatePath } = await import('next/cache');
      revalidatePath('/', 'layout');
    } catch {}

    return NextResponse.json({
      success: true,
      cleanedCandidates: result.cleanedCandidates || 0,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
