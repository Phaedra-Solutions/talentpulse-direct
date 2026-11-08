// app/api/seo/route.ts
// Public SEO metadata endpoint for crawlers and client DOM synchronization
import { NextRequest, NextResponse } from 'next/server';
import { getSeoSettings, getPageSeoOverride, getPageSeoOverrides } from '@/lib/seo-service';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const path = searchParams.get('path');

    const settings = await getSeoSettings();

    if (path) {
      const override = await getPageSeoOverride(path);
      return NextResponse.json({
        success: true,
        settings,
        override,
      });
    }

    const overrides = await getPageSeoOverrides();
    return NextResponse.json({
      success: true,
      settings,
      overrides,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to load SEO configuration' },
      { status: 500 }
    );
  }
}
