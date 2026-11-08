'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { getPageSeoOverride } from '@/lib/seo-service';

/**
 * PageSeoSync ensures that dynamic database page overrides saved via /admin/seo
 * are actively applied to the document title, meta tags, OpenGraph cards,
 * and canonical tags in the browser, including during client-side navigations.
 */
export function PageSeoSync() {
  const pathname = usePathname();

  useEffect(() => {
    let isCancelled = false;

    async function applySeo() {
      if (!pathname) return;

      try {
        const override = await getPageSeoOverride(pathname);
        if (isCancelled || !override) return;

        // Apply Page Title
        if (override.title) {
          document.title = override.title;
        }

        // Apply Meta Description
        if (override.description) {
          let metaDesc = document.querySelector('meta[name="description"]');
          if (!metaDesc) {
            metaDesc = document.createElement('meta');
            metaDesc.setAttribute('name', 'description');
            document.head.appendChild(metaDesc);
          }
          metaDesc.setAttribute('content', override.description);
        }

        // Apply OpenGraph Title
        let ogTitle = document.querySelector('meta[property="og:title"]');
        if (ogTitle && override.title) {
          ogTitle.setAttribute('content', override.title);
        }

        // Apply OpenGraph Description
        let ogDesc = document.querySelector('meta[property="og:description"]');
        if (ogDesc && override.description) {
          ogDesc.setAttribute('content', override.description);
        }

        // Apply Custom Social Share Image (og:image)
        if (override.og_image_url) {
          let ogImg = document.querySelector('meta[property="og:image"]');
          if (!ogImg) {
            ogImg = document.createElement('meta');
            ogImg.setAttribute('property', 'og:image');
            document.head.appendChild(ogImg);
          }
          ogImg.setAttribute('content', override.og_image_url);

          let twitterImg = document.querySelector('meta[name="twitter:image"]');
          if (twitterImg) {
            twitterImg.setAttribute('content', override.og_image_url);
          }
        }

        // Apply Robots Directives (noindex, nofollow)
        if (override.no_index || override.no_follow) {
          let robots = document.querySelector('meta[name="robots"]');
          if (!robots) {
            robots = document.createElement('meta');
            robots.setAttribute('name', 'robots');
            document.head.appendChild(robots);
          }
          const directives: string[] = [
            override.no_index ? 'noindex' : 'index',
            override.no_follow ? 'nofollow' : 'follow',
          ];
          robots.setAttribute('content', directives.join(', '));
        }

        // Apply Canonical URL
        if (override.canonical_url) {
          let linkCanonical = document.querySelector('link[rel="canonical"]');
          if (!linkCanonical) {
            linkCanonical = document.createElement('link');
            linkCanonical.setAttribute('rel', 'canonical');
            document.head.appendChild(linkCanonical);
          }
          linkCanonical.setAttribute('href', override.canonical_url);
        }
      } catch (err) {
        console.warn('[SEO] Failed to sync page SEO in browser', err);
      }
    }

    applySeo();

    return () => {
      isCancelled = true;
    };
  }, [pathname]);

  return null;
}
