import { NextRequest, NextResponse } from 'next/server';
import { getRolesList, getRolesPaginated, createRoleRecord } from '@/lib/roles-tech-store';
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

    const pageParam = searchParams.get('page');
    const limitParam = searchParams.get('limit');
    const statusParam = searchParams.get('status') as 'open' | 'closed' | 'all' | null;
    const queryParam = searchParams.get('query') || undefined;
    const includeCounts = searchParams.get('includeCounts') === 'true';
    const summary = searchParams.get('summary') === 'true';

    if (pageParam || limitParam || statusParam || queryParam || includeCounts || summary) {
      const page = pageParam ? parseInt(pageParam, 10) : 1;
      const limit = limitParam ? parseInt(limitParam, 10) : 12;
      const effectiveStatus =
        !includeClosed ? 'open' : statusParam || (includeClosed ? 'all' : 'open');

      const result = await getRolesPaginated({
        includeClosed,
        status: effectiveStatus,
        query: queryParam,
        page,
        limit,
        includeCounts,
        summary,
      });

      return NextResponse.json({
        success: true,
        roles: result.roles,
        total: result.total,
        page: result.page,
        limit: result.limit,
        counts: result.counts,
      });
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
