import { NextRequest, NextResponse } from 'next/server';
import { getRolesList, createRoleRecord } from '@/lib/roles-tech-store';
import { verifyAdminSessionToken } from '@/lib/auth/admin-password';

function getAdminSession(req: NextRequest) {
  const cookie = req.cookies.get('admin_session')?.value;
  const authHeader = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  const token = cookie || authHeader;
  if (!token) return null;
  return verifyAdminSessionToken(token);
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const includeClosed = searchParams.get('includeClosed') !== 'false';
    const roles = await getRolesList(includeClosed);
    return NextResponse.json({ success: true, roles });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = getAdminSession(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized admin session' }, { status: 401 });
    }

    const body = await req.json();
    if (!body.title) {
      return NextResponse.json({ success: false, error: 'Role title is required' }, { status: 400 });
    }

    const created = await createRoleRecord(body);
    return NextResponse.json({ success: true, role: created }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
