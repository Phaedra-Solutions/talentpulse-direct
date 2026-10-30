// app/api/admin/seo/pages/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getPageSeoOverrides, upsertPageSeoOverride, deletePageSeoOverride, PageSeoOverride } from '@/lib/seo-service';
import { verifyAdminSessionToken } from '@/lib/auth/admin-password';
import { canManageSeo } from '@/lib/auth/recruiter-auth';

function getAdminSession(req: NextRequest) {
  const cookie = req.cookies.get('admin_session')?.value;
  const authHeader = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  const token = cookie || authHeader;
  if (!token) return null;
  return verifyAdminSessionToken(token);
}

export async function GET() {
  try {
    const overrides = await getPageSeoOverrides();
    return NextResponse.json({ pages: overrides, success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to retrieve page SEO overrides', success: false },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = getAdminSession(req);
    if (!session || !canManageSeo(session.role)) {
      return NextResponse.json(
        { error: 'Unauthorized. Only administrators can update page SEO overrides.', success: false },
        { status: 403 }
      );
    }

    const body = (await req.json()) as PageSeoOverride;
    if (!body || !body.path) {
      return NextResponse.json(
        { error: 'Invalid payload: "path" is required.', success: false },
        { status: 400 }
      );
    }

    const saved = await upsertPageSeoOverride(body);
    return NextResponse.json({
      page: saved,
      success: true,
      message: `SEO override for ${body.path} saved successfully`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to update page SEO override', success: false },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = getAdminSession(req);
    if (!session || !canManageSeo(session.role)) {
      return NextResponse.json(
        { error: 'Unauthorized. Only administrators can delete page SEO overrides.', success: false },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const path = searchParams.get('path');
    if (!path) {
      return NextResponse.json(
        { error: 'Query parameter "path" is required.', success: false },
        { status: 400 }
      );
    }

    await deletePageSeoOverride(path);
    return NextResponse.json({
      success: true,
      message: `SEO override for ${path} deleted`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to delete page SEO override', success: false },
      { status: 500 }
    );
  }
}
