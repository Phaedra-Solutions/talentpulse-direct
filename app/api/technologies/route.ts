import { NextRequest, NextResponse } from 'next/server';
import { getTechnologiesList, submitCustomTechnology } from '@/lib/roles-tech-store';
import { getAuthenticatedAdmin } from '@/lib/auth/server-auth';
import { canManageRolesAndTech } from '@/lib/auth/permissions';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const roleId = searchParams.get('roleId') || undefined;
    const statusParam = searchParams.get('status') || 'approved';
    const query = searchParams.get('query') || undefined;
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : undefined;

    // Only authenticated Super Admin and HR Executives can view 'pending', 'rejected', or 'all'
    let status: any = statusParam;
    if (statusParam !== 'approved') {
      const session = getAuthenticatedAdmin(req);
      if (!session || !canManageRolesAndTech(session.role)) {
        status = 'approved'; // Force approved for public/unauthorized callers
      }
    }

    const technologies = await getTechnologiesList({
      roleId,
      status,
      query,
      limit,
    });

    return NextResponse.json({ success: true, technologies });
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
