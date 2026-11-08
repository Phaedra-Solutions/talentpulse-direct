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

  const disallowedPrivatePaths = [
    '/admin',
    '/admin/*',
    '/api/*',
    '/_next/*',
    '/candidates',
    '/candidates/*',
    '/candidate',
    '/candidate/*',
  ];

  const configuredRules = settings.robots_rules && settings.robots_rules.length > 0
    ? settings.robots_rules.map((rule) => ({
        userAgent: rule.userAgent,
        allow: (rule.allow || []).filter(
          (p) => !p.startsWith('/candidate') && !p.startsWith('/candidates')
        ),
        disallow: Array.from(new Set([...(rule.disallow || []), ...disallowedPrivatePaths])),
      }))
    : [
        {
          userAgent: '*',
          allow: ['/', '/roles/*', '/hire', '/apply', '/privacy', '/terms', '/llms.txt'],
          disallow: disallowedPrivatePaths,
        },
        {
          userAgent: 'GPTBot',
          allow: ['/', '/roles/*', '/hire', '/apply', '/privacy', '/terms', '/llms.txt'],
          disallow: disallowedPrivatePaths,
        },
        {
          userAgent: 'PerplexityBot',
          allow: ['/', '/roles/*', '/hire', '/apply', '/privacy', '/terms', '/llms.txt'],
          disallow: disallowedPrivatePaths,
        },
        {
          userAgent: 'ClaudeBot',
          allow: ['/', '/roles/*', '/hire', '/apply', '/privacy', '/terms', '/llms.txt'],
          disallow: disallowedPrivatePaths,
        },
      ];

  return {
    rules: configuredRules,
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
