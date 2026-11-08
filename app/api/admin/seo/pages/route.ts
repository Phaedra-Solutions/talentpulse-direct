// app/api/admin/seo/pages/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getPageSeoOverrides, upsertPageSeoOverride, deletePageSeoOverride, PageSeoOverride } from '@/lib/seo-service';
import { requireAdminAuth } from '@/lib/auth/server-auth';
import { canManageSeo } from '@/lib/auth/permissions';

export async function GET(req: NextRequest) {
  try {
    const auth = requireAdminAuth(req, canManageSeo);
    if (auth.errorResponse) return auth.errorResponse;

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
    const auth = requireAdminAuth(req, canManageSeo);
    if (auth.errorResponse) return auth.errorResponse;

    const body = (await req.json()) as PageSeoOverride;
    if (!body || !body.path) {
      return NextResponse.json(
        { error: 'Invalid payload: "path" is required.', success: false },
        { status: 400 }
      );
    }

    const saved = await upsertPageSeoOverride(body);

    // Revalidate Next.js cache for the modified path
    try {
      revalidatePath(saved.path);
      revalidatePath('/', 'layout');
    } catch {}

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
    const auth = requireAdminAuth(req, canManageSeo);
    if (auth.errorResponse) return auth.errorResponse;

    const { searchParams } = new URL(req.url);
    const path = searchParams.get('path');
    if (!path) {
      return NextResponse.json(
        { error: 'Query parameter "path" is required.', success: false },
        { status: 400 }
      );
    }

    await deletePageSeoOverride(path);
    try {
      revalidatePath(path);
      revalidatePath('/', 'layout');
    } catch {}

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
