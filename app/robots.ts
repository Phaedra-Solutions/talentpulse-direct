// app/robots.ts
import type { MetadataRoute } from 'next';
import { getSeoSettings } from '@/lib/seo-service';

export default async function robots(): Promise<MetadataRoute.Robots> {
  const settings = await getSeoSettings();
  const baseUrl = settings.canonical_base_url || 'https://talentpulse.dev';

  // If site-wide indexing is turned off (e.g., staging or maintenance)
  if (!settings.is_indexing_enabled) {
    return {
      rules: {
        userAgent: '*',
        disallow: '/',
      },
      sitemap: `${baseUrl}/sitemap.xml`,
      host: baseUrl,
    };
  }

  const configuredRules = settings.robots_rules && settings.robots_rules.length > 0
    ? settings.robots_rules.map((rule) => ({
        userAgent: rule.userAgent,
        allow: rule.allow,
        disallow: rule.disallow,
      }))
    : [
        {
          userAgent: '*',
          allow: ['/', '/candidates', '/candidates/*', '/hire-request', '/llms.txt'],
          disallow: ['/admin', '/admin/*', '/api/*', '/_next/*'],
        },
        {
          userAgent: 'GPTBot',
          allow: ['/', '/llms.txt'],
          disallow: ['/admin/', '/api/'],
        },
        {
          userAgent: 'PerplexityBot',
          allow: ['/', '/llms.txt'],
          disallow: ['/admin/', '/api/'],
        },
        {
          userAgent: 'ClaudeBot',
          allow: ['/', '/llms.txt'],
          disallow: ['/admin/', '/api/'],
        },
      ];

  return {
    rules: configuredRules,
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
