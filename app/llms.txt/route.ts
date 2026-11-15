// app/llms.txt/route.ts
import { NextResponse } from 'next/server';
import { getSeoSettings, generateDefaultLlmsTxt } from '@/lib/seo-service';

export const dynamic = 'force-dynamic';

export async function GET() {
  const settings = await getSeoSettings();
  const content =
    settings.llms_txt && settings.llms_txt.trim().length > 0
      ? settings.llms_txt
      : generateDefaultLlmsTxt(settings);

  return new NextResponse(content, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store, max-age=0, must-revalidate',
    },
  });
}
