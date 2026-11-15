// app/robots.txt/route.ts
import { NextResponse } from 'next/server';
import { getSeoSettings, generateDefaultRobotsTxt } from '@/lib/seo-service';

export const dynamic = 'force-dynamic';

export async function GET() {
  const settings = await getSeoSettings();
  const baseUrl = (settings.canonical_base_url || 'https://talentpulse.dev').replace(/\/$/, '');

  const content = !settings.is_indexing_enabled
    ? `User-agent: *\nDisallow: /\n\nSitemap: ${baseUrl}/sitemap.xml\nHost: ${baseUrl}\n`
    : settings.robots_txt && settings.robots_txt.trim().length > 0
      ? settings.robots_txt
      : generateDefaultRobotsTxt(settings);

  return new NextResponse(content, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store, max-age=0, must-revalidate',
    },
  });
}
