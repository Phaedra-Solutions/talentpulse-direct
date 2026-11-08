// app/api/admin/seo/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getSeoSettings, updateSeoSettings, SeoSettings } from '@/lib/seo-service';
import { requireAdminAuth } from '@/lib/auth/server-auth';
import { canManageSeo } from '@/lib/auth/permissions';

export async function GET(req: NextRequest) {
  try {
    const auth = requireAdminAuth(req, canManageSeo);
    if (auth.errorResponse) return auth.errorResponse;

    const settings = await getSeoSettings();
    return NextResponse.json({ settings, success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to retrieve SEO settings', success: false },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = requireAdminAuth(req, canManageSeo);
    if (auth.errorResponse) return auth.errorResponse;

    const body = await req.json();
    const updated = await updateSeoSettings(body as Partial<SeoSettings>);

    try {
      revalidatePath('/', 'layout');
    } catch {}

    return NextResponse.json({
      settings: updated,
      success: true,
      message: 'SEO settings successfully updated',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to update SEO settings', success: false },
      { status: 500 }
    );
  }
}
