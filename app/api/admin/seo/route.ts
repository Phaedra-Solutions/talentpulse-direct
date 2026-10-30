// app/api/admin/seo/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSeoSettings, updateSeoSettings, SeoSettings } from '@/lib/seo-service';
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
    const session = getAdminSession(req);
    if (!session || !canManageSeo(session.role)) {
      return NextResponse.json(
        { error: 'Unauthorized. Only administrators can modify SEO and tracking settings.', success: false },
        { status: 403 }
      );
    }

    const body = await req.json();
    const updated = await updateSeoSettings(body as Partial<SeoSettings>);

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
