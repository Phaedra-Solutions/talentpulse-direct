import { NextRequest, NextResponse } from 'next/server';
import { getRoleBySlugOrId, updateRoleRecord, deleteRoleRecord, getCandidateCountForRole } from '@/lib/roles-tech-store';
import { verifyAdminSessionToken } from '@/lib/auth/admin-password';

function getAdminSession(req: NextRequest) {
  const cookie = req.cookies.get('admin_session')?.value;
  const authHeader = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  const token = cookie || authHeader;
  if (!token) return null;
  return verifyAdminSessionToken(token);
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const role = await getRoleBySlugOrId(id);
    if (!role) {
      return NextResponse.json({ success: false, error: 'Role not found' }, { status: 404 });
    }
    const candidate_count = await getCandidateCountForRole(role.slug);
    return NextResponse.json({ success: true, role: { ...role, candidate_count } });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
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
    const updated = await updateRoleRecord(id, body);
    return NextResponse.json({ success: true, role: updated });
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
    const result = await deleteRoleRecord(id);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
