// app/sitemap.ts
import type { MetadataRoute } from 'next';
import { getSeoSettings, getPageSeoOverrides } from '@/lib/seo-service';
import { getSupabaseServerClient, isServerSupabaseConfigured } from '@/lib/supabase/server';
import { INITIAL_MOCK_CANDIDATES } from '@/lib/mock-data';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const settings = await getSeoSettings();
  const baseUrl = settings.canonical_base_url || 'https://talentpulse.dev';
  const overrides = await getPageSeoOverrides();
  const now = new Date();

  // Core static public routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/candidates`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/hire-request`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/llms.txt`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
  ];

  // Dynamically load candidate profile URLs
  let candidateEntries: { id: string; updated_at?: string }[] = INITIAL_MOCK_CANDIDATES.map((c) => ({
    id: c.id,
    updated_at: c.updated_at,
  }));

  if (isServerSupabaseConfigured) {
    try {
      const serverClient = getSupabaseServerClient();
      if (serverClient) {
        const { data, error } = await serverClient
          .from('candidates')
          .select('id, updated_at');
        if (!error && data && data.length > 0) {
          candidateEntries = data;
        }
      }
    } catch (err) {
      console.warn('[Sitemap] Failed to fetch candidate IDs from Supabase, using mock fallback', err);
    }
  }

  const candidateRoutes: MetadataRoute.Sitemap = candidateEntries.map((candidate) => ({
    url: `${baseUrl}/candidates/${candidate.id}`,
    lastModified: candidate.updated_at ? new Date(candidate.updated_at) : now,
    changeFrequency: 'weekly',
    priority: 0.75,
  }));

  // Exclude routes marked no_index
  const noIndexPaths = new Set(
    overrides.filter((o) => o.no_index).map((o) => o.path)
  );

  return [...staticRoutes, ...candidateRoutes].filter((entry) => {
    try {
      const pathname = new URL(entry.url).pathname;
      return !noIndexPaths.has(pathname) && !pathname.startsWith('/admin');
    } catch {
      return true;
    }
  });
}
