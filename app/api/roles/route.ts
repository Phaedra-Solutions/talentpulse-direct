import { NextRequest, NextResponse } from 'next/server';
import { getRolesList, createRoleRecord } from '@/lib/roles-tech-store';
import { requireAdminAuth, getAuthenticatedAdmin } from '@/lib/auth/server-auth';
import { canManageRolesAndTech } from '@/lib/auth/permissions';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const requestedIncludeClosed = searchParams.get('includeClosed') !== 'false';
    
    // Closed internal roles are only visible to authenticated Super Admin & HR Executives
    let includeClosed = false;
    if (requestedIncludeClosed) {
      const session = getAuthenticatedAdmin(req);
      if (session && canManageRolesAndTech(session.role)) {
        includeClosed = true;
      }
    }

    const roles = await getRolesList(includeClosed);
    return NextResponse.json({ success: true, roles });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = requireAdminAuth(req, canManageRolesAndTech);
    if (auth.errorResponse) return auth.errorResponse;

    const body = await req.json();
    if (!body.title) {
      return NextResponse.json({ success: false, error: 'Role title is required' }, { status: 400 });
    }

    const created = await createRoleRecord(body);
    try {
      const { revalidatePath } = await import('next/cache');
      revalidatePath('/', 'layout');
    } catch {}
    return NextResponse.json({ success: true, role: created }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
