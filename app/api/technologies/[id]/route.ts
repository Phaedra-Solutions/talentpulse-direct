import { NextRequest, NextResponse } from 'next/server';
import { updateTechnologyRecord, deleteTechnologyRecord, getCandidateCountForTech } from '@/lib/roles-tech-store';
import { verifyAdminSessionToken } from '@/lib/auth/admin-password';

function getAdminSession(req: NextRequest) {
  const cookie = req.cookies.get('admin_session')?.value;
  const authHeader = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  const token = cookie || authHeader;
  if (!token) return null;
  return verifyAdminSessionToken(token);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = getAdminSession(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized admin session' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const updated = await updateTechnologyRecord(id, body);
    return NextResponse.json({ success: true, technology: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = getAdminSession(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized admin session' }, { status: 401 });
    }

    const { id } = await params;
    const result = await deleteTechnologyRecord(id);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
