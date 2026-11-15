import { NextRequest, NextResponse } from 'next/server';
import {
  getTechnologiesPaginated,
  submitCustomTechnology,
  bulkUpdateTechnologyStatus,
} from '@/lib/roles-tech-store';
import { getAuthenticatedAdmin, requireAdminAuth } from '@/lib/auth/server-auth';
import { canManageRolesAndTech } from '@/lib/auth/permissions';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const roleId = searchParams.get('roleId') || undefined;
    const statusParam = searchParams.get('status') || 'approved';
    const query = searchParams.get('query') || undefined;
    const limitParam = searchParams.get('limit');
    const pageParam = searchParams.get('page');
    const includeCounts = searchParams.get('includeCounts') === 'true';

    const limit = limitParam ? parseInt(limitParam, 10) : 50;
    const page = pageParam ? parseInt(pageParam, 10) : 1;

    // Only authenticated Super Admin and HR Executives can view 'pending', 'rejected', or 'all'
    let status: any = statusParam;
    if (statusParam !== 'approved') {
      const session = getAuthenticatedAdmin(req);
      if (!session || !canManageRolesAndTech(session.role)) {
        status = 'approved'; // Force approved for public/unauthorized callers
      }
    }

    const result = await getTechnologiesPaginated({
      roleId,
      status,
      query,
      page,
      limit,
      includeCounts,
    });

    return NextResponse.json({
      success: true,
      technologies: result.technologies,
      total: result.total,
      page: result.page,
      limit: result.limit,
      counts: result.counts,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = requireAdminAuth(req, canManageRolesAndTech);
    if (auth.errorResponse) return auth.errorResponse;

    const body = await req.json();
    const { ids, status } = body || {};

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ success: false, error: 'Technology ids array is required' }, { status: 400 });
    }
    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return NextResponse.json({ success: false, error: 'Valid status is required' }, { status: 400 });
    }

    const result = await bulkUpdateTechnologyStatus(ids, status);
    try {
      const { revalidatePath } = await import('next/cache');
      revalidatePath('/', 'layout');
    } catch {}

    return NextResponse.json({ success: true, updatedCount: result.updatedCount });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, roleSlugOrId, candidateId } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ success: false, error: 'Technology name is required' }, { status: 400 });
    }

    const result = await submitCustomTechnology(name, roleSlugOrId, candidateId);
    return NextResponse.json({
      success: true,
      technology: result.technology,
      isNew: result.isNew,
    }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
