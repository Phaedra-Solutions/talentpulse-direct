// app/sitemap.ts
import type { MetadataRoute } from 'next';
import { getSeoSettings, getPageSeoOverrides } from '@/lib/seo-service';
import { getRolesList } from '@/lib/roles-tech-store';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const settings = await getSeoSettings();
  const baseUrl = settings.canonical_base_url || 'https://talentpulse.dev';
  const overrides = await getPageSeoOverrides();
  const now = new Date();

  // Core static public routes (Strictly excludes all candidate profiles and directories)
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/hire`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/apply`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/llms.txt`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.6,
    },
  ];

  // Dynamic public role tracks (Open specialized engineering tracks)
  let roleRoutes: MetadataRoute.Sitemap = [];
  try {
    const roles = await getRolesList(true);
    roleRoutes = roles
      .filter((r) => r.status === 'open')
      .map((role) => ({
        url: `${baseUrl}/roles/${role.slug}`,
        lastModified: role.updated_at ? new Date(role.updated_at) : now,
        changeFrequency: 'weekly',
        priority: 0.8,
      }));
  } catch (err) {
    console.warn('[Sitemap] Failed to fetch role tracks for sitemap:', err);
  }

  // Exclude routes marked no_index, admin workspace, and any candidate paths
  const noIndexPaths = new Set(
    overrides.filter((o) => o.no_index).map((o) => o.path)
  );

  return [...staticRoutes, ...roleRoutes].filter((entry) => {
    try {
      const pathname = new URL(entry.url).pathname;
      return (
        !noIndexPaths.has(pathname) &&
        !pathname.startsWith('/admin') &&
        !pathname.startsWith('/candidate') &&
        !pathname.startsWith('/candidates')
      );
    } catch {
      return true;
    }
  });
}

