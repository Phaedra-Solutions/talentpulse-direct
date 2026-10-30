// lib/seo-service.ts
// Enterprise SEO Data Layer for TalentPulse Next.js App Router

import { getSupabaseBrowserClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { getSupabaseServerClient, isServerSupabaseConfigured } from '@/lib/supabase/server';

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  is_active: boolean;
}

export interface RobotsRule {
  userAgent: string;
  allow?: string[];
  disallow?: string[];
}

export interface OrganizationJson {
  name: string;
  legalName: string;
  url: string;
  logo: string;
  description: string;
  email: string;
  foundingYear: string;
  sameAs: string[];
}

export interface SeoSettings {
  id: string;
  site_name: string;
  title_template: string;
  default_title: string;
  default_meta_description: string;
  default_keywords: string;
  canonical_base_url: string;
  gtm_id: string;
  ga_id: string;
  is_gtm_enabled: boolean;
  og_image_url: string;
  og_type: string;
  twitter_card: 'summary' | 'summary_large_image';
  twitter_handle: string;
  is_indexing_enabled: boolean;
  organization_json: OrganizationJson;
  faq_items: FaqItem[];
  robots_rules: RobotsRule[];
  created_at?: string;
  updated_at?: string;
}

export interface PageSeoOverride {
  path: string;
  title: string;
  description: string;
  keywords?: string;
  canonical_url?: string;
  og_image_url?: string;
  no_index: boolean;
  no_follow: boolean;
  h1_heading?: string;
  h2_subheadings?: string;
  schema_type?: string;
  created_at?: string;
  updated_at?: string;
}

export const DEFAULT_SEO_SETTINGS: SeoSettings = {
  id: 'main_config',
  site_name: 'TalentPulse',
  title_template: '%s | TalentPulse',
  default_title: 'TalentPulse | Hire Top 1% Vetted Remote Tech Talent',
  default_meta_description: 'Source pre-vetted senior software engineers, architects, and AI developers. Scale your engineering team with matched, ready-to-hire talent in 48 hours.',
  default_keywords: 'vetted developers, hire engineers, react developers, nextjs, python engineers, AI developers, remote tech talent',
  canonical_base_url: 'https://talentpulse.dev',
  gtm_id: 'GTM-TPULSE1',
  ga_id: 'G-TPULSE88',
  is_gtm_enabled: true,
  og_image_url: 'https://talentpulse.dev/og-talentpulse.png',
  og_type: 'website',
  twitter_card: 'summary_large_image',
  twitter_handle: '@TalentPulseDev',
  is_indexing_enabled: true,
  organization_json: {
    name: 'TalentPulse Inc.',
    legalName: 'TalentPulse Global Technologies Inc.',
    url: 'https://talentpulse.dev',
    logo: 'https://talentpulse.dev/logo.png',
    description: 'On-Demand Engineering Pool for Contractual & Project-Based Software Engineers and AI Developers.',
    email: 'hire@talentpulse.dev',
    foundingYear: '2024',
    sameAs: [
      'https://twitter.com/TalentPulseDev',
      'https://linkedin.com/company/talentpulse-dev',
      'https://github.com/talentpulse'
    ]
  },
  faq_items: [
    {
      id: 'faq-1',
      question: 'How quickly can TalentPulse match engineers to our team?',
      answer: 'We provide pre-screened, interview-ready engineering candidates within 48 hours of receiving your technical and cultural requirements.',
      is_active: true
    },
    {
      id: 'faq-2',
      question: 'How does TalentPulse vet software engineers?',
      answer: 'Our 4-stage evaluation assesses live technical coding, distributed systems architecture, real-world execution velocity, and spoken English communication proficiency. Only the top 1% pass.',
      is_active: true
    },
    {
      id: 'faq-3',
      question: 'Is there a risk-free trial period?',
      answer: 'Yes. Every placement begins with a two-week trial period. If you are not 100% satisfied with the match, you pay nothing and we match a replacement immediately.',
      is_active: true
    },
    {
      id: 'faq-4',
      question: 'Do candidates overlap with our timezone?',
      answer: 'Yes. All TalentPulse engineers guarantee a minimum of 4 to 6 hours of working overlap with US, European, or Australian business hours.',
      is_active: true
    }
  ],
  robots_rules: [
    {
      userAgent: '*',
      allow: ['/', '/candidates', '/candidates/*', '/hire-request', '/llms.txt'],
      disallow: ['/admin', '/admin/*', '/api/*', '/_next/*']
    },
    {
      userAgent: 'GPTBot',
      allow: ['/', '/llms.txt'],
      disallow: ['/admin/', '/api/']
    },
    {
      userAgent: 'PerplexityBot',
      allow: ['/', '/llms.txt'],
      disallow: ['/admin/', '/api/']
    },
    {
      userAgent: 'ClaudeBot',
      allow: ['/', '/llms.txt'],
      disallow: ['/admin/', '/api/']
    }
  ]
};

export const DEFAULT_PAGE_OVERRIDES: Record<string, PageSeoOverride> = {
  '/': {
    path: '/',
    title: 'TalentPulse | Hire Top 1% Vetted Remote Tech Talent',
    description: 'Source pre-vetted senior software engineers, architects, and AI developers. Scale your engineering team with matched, ready-to-hire talent in 48 hours.',
    keywords: 'hire developers, senior engineers, vetted tech talent, on-demand engineering',
    canonical_url: 'https://talentpulse.dev/',
    no_index: false,
    no_follow: false,
    h1_heading: 'Hire Top 1% Vetted Tech Talent On Demand',
    schema_type: 'WebSite'
  },
  '/candidates': {
    path: '/candidates',
    title: 'Browse Vetted Tech Talent & Developers | TalentPulse',
    description: 'Explore verified full-stack, backend, frontend, and AI engineers. Filter by technology stack, experience level, rate, and immediate availability.',
    keywords: 'developer directory, vetted engineers, hire software engineers, talent roster',
    canonical_url: 'https://talentpulse.dev/candidates',
    no_index: false,
    no_follow: false,
    h1_heading: 'Vetted Engineers & Technical Leaders',
    schema_type: 'CollectionPage'
  },
  '/hire-request': {
    path: '/hire-request',
    title: 'Hire Top Engineers in 48 Hours | TalentPulse Request',
    description: 'Submit your tech stack requirements and team scale goals. Our technical team matches pre-screened, interview-ready engineers in as little as 48 hours.',
    keywords: 'hire developers request, engineering staffing, software development team match',
    canonical_url: 'https://talentpulse.dev/hire-request',
    no_index: false,
    no_follow: false,
    h1_heading: 'Request Your Engineering Match',
    schema_type: 'ContactPage'
  },
  '/candidates/[id]': {
    path: '/candidates/[id]',
    title: '{Candidate Name} – {Role Title} | TalentPulse Profile',
    description: 'View verified portfolio, primary skills, years of experience, and availability for contract or full-time placement.',
    keywords: 'candidate profile, engineer resume, vetted developer',
    canonical_url: 'https://talentpulse.dev/candidates/{id}',
    no_index: false,
    no_follow: false,
    h1_heading: '{Candidate Name} – {Role Title}',
    schema_type: 'ProfilePage'
  },
  '/admin': {
    path: '/admin',
    title: 'TalentPulse Admin Portal',
    description: 'TalentPulse administration workspace for managing talent profiles, hire requests, system analytics, and platform configuration.',
    keywords: 'admin portal, internal workspace',
    canonical_url: 'https://talentpulse.dev/admin',
    no_index: true,
    no_follow: true,
    h1_heading: 'Admin Workspace & Overview',
    schema_type: 'WebPage'
  },
  '/admin/seo': {
    path: '/admin/seo',
    title: 'SEO & Analytics Management | TalentPulse Admin',
    description: 'Centralized dashboard for configuring global meta, GTM tracking, social cards, schema markup, and search crawler directives.',
    keywords: 'admin seo, site management, search analytics',
    canonical_url: 'https://talentpulse.dev/admin/seo',
    no_index: true,
    no_follow: true,
    h1_heading: 'Search Engine Optimization & Growth Suite',
    schema_type: 'WebPage'
  }
};

const SEO_STORAGE_KEY = 'tp_seo_settings_v1';
const PAGE_OVERRIDES_STORAGE_KEY = 'tp_page_seo_overrides_v1';

/**
 * Fetch global SEO settings from Supabase (server or browser) with fallback
 */
export async function getSeoSettings(): Promise<SeoSettings> {
  const isServer = typeof window === 'undefined';

  if (isServer) {
    if (isServerSupabaseConfigured) {
      try {
        const serverClient = getSupabaseServerClient();
        if (serverClient) {
          const { data, error } = await serverClient
            .from('seo_settings')
            .select('*')
            .eq('id', 'main_config')
            .maybeSingle();

          if (!error && data) {
            return {
              ...DEFAULT_SEO_SETTINGS,
              ...data,
              organization_json: data.organization_json || DEFAULT_SEO_SETTINGS.organization_json,
              faq_items: Array.isArray(data.faq_items) ? data.faq_items : DEFAULT_SEO_SETTINGS.faq_items,
              robots_rules: Array.isArray(data.robots_rules) ? data.robots_rules : DEFAULT_SEO_SETTINGS.robots_rules,
            };
          }
        }
      } catch (err) {
        console.warn('[SEO] Failed to fetch server settings, falling back to defaults', err);
      }
    }
    return DEFAULT_SEO_SETTINGS;
  }

  // Client side
  if (isSupabaseConfigured) {
    try {
      const browserClient = getSupabaseBrowserClient();
      if (browserClient) {
        const { data, error } = await browserClient
          .from('seo_settings')
          .select('*')
          .eq('id', 'main_config')
          .maybeSingle();

        if (!error && data) {
          const merged: SeoSettings = {
            ...DEFAULT_SEO_SETTINGS,
            ...data,
            organization_json: data.organization_json || DEFAULT_SEO_SETTINGS.organization_json,
            faq_items: Array.isArray(data.faq_items) ? data.faq_items : DEFAULT_SEO_SETTINGS.faq_items,
            robots_rules: Array.isArray(data.robots_rules) ? data.robots_rules : DEFAULT_SEO_SETTINGS.robots_rules,
          };
          try {
            localStorage.setItem(SEO_STORAGE_KEY, JSON.stringify(merged));
          } catch {}
          return merged;
        }
      }
    } catch (err) {
      console.warn('[SEO] Failed to fetch browser settings, trying cache', err);
    }
  }

  // Check localStorage cache
  try {
    const cached = localStorage.getItem(SEO_STORAGE_KEY);
    if (cached) {
      return { ...DEFAULT_SEO_SETTINGS, ...JSON.parse(cached) };
    }
  } catch {}

  return DEFAULT_SEO_SETTINGS;
}

/**
 * Fetch all page-specific SEO overrides with fallback
 */
export async function getPageSeoOverrides(): Promise<PageSeoOverride[]> {
  const isServer = typeof window === 'undefined';

  if (isServer) {
    if (isServerSupabaseConfigured) {
      try {
        const serverClient = getSupabaseServerClient();
        if (serverClient) {
          const { data, error } = await serverClient
            .from('page_seo_overrides')
            .select('*');

          if (!error && data && data.length > 0) {
            return data;
          }
        }
      } catch (err) {
        console.warn('[SEO] Server fetch page overrides failed, using default', err);
      }
    }
    return Object.values(DEFAULT_PAGE_OVERRIDES);
  }

  // Client side
  if (isSupabaseConfigured) {
    try {
      const browserClient = getSupabaseBrowserClient();
      if (browserClient) {
        const { data, error } = await browserClient
          .from('page_seo_overrides')
          .select('*');

        if (!error && data && data.length > 0) {
          try {
            localStorage.setItem(PAGE_OVERRIDES_STORAGE_KEY, JSON.stringify(data));
          } catch {}
          return data;
        }
      }
    } catch (err) {
      console.warn('[SEO] Client fetch page overrides failed', err);
    }
  }

  try {
    const cached = localStorage.getItem(PAGE_OVERRIDES_STORAGE_KEY);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch {}

  return Object.values(DEFAULT_PAGE_OVERRIDES);
}

/**
 * Fetch a single page override by exact path
 */
export async function getPageSeoOverride(path: string): Promise<PageSeoOverride | null> {
  const allOverrides = await getPageSeoOverrides();
  const match = allOverrides.find((o) => o.path === path);
  if (match) return match;
  return DEFAULT_PAGE_OVERRIDES[path] || null;
}

/**
 * Admin action: Update global SEO settings
 */
export async function updateSeoSettings(updates: Partial<SeoSettings>): Promise<SeoSettings> {
  const current = await getSeoSettings();
  const updated: SeoSettings = {
    ...current,
    ...updates,
    updated_at: new Date().toISOString()
  };

  if (isSupabaseConfigured) {
    const browserClient = getSupabaseBrowserClient();
    if (browserClient) {
      const { error } = await browserClient
        .from('seo_settings')
        .upsert(
          {
            id: 'main_config',
            site_name: updated.site_name,
            title_template: updated.title_template,
            default_title: updated.default_title,
            default_meta_description: updated.default_meta_description,
            default_keywords: updated.default_keywords,
            canonical_base_url: updated.canonical_base_url,
            gtm_id: updated.gtm_id,
            ga_id: updated.ga_id,
            is_gtm_enabled: updated.is_gtm_enabled,
            og_image_url: updated.og_image_url,
            og_type: updated.og_type,
            twitter_card: updated.twitter_card,
            twitter_handle: updated.twitter_handle,
            is_indexing_enabled: updated.is_indexing_enabled,
            organization_json: updated.organization_json,
            faq_items: updated.faq_items,
            robots_rules: updated.robots_rules,
            updated_at: updated.updated_at
          },
          { onConflict: 'id' }
        );

      if (error) {
        console.error('[SEO] Error updating seo_settings in Supabase:', error);
      }
    }
  }

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(SEO_STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  }

  return updated;
}

/**
 * Admin action: Upsert page-specific SEO override
 */
export async function upsertPageSeoOverride(override: PageSeoOverride): Promise<PageSeoOverride> {
  const record: PageSeoOverride = {
    ...override,
    updated_at: new Date().toISOString()
  };

  if (isSupabaseConfigured) {
    const browserClient = getSupabaseBrowserClient();
    if (browserClient) {
      const { error } = await browserClient
        .from('page_seo_overrides')
        .upsert(record, { onConflict: 'path' });

      if (error) {
        console.error('[SEO] Error upserting page_seo_override in Supabase:', error);
      }
    }
  }

  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem(PAGE_OVERRIDES_STORAGE_KEY);
      let list: PageSeoOverride[] = cached ? JSON.parse(cached) : Object.values(DEFAULT_PAGE_OVERRIDES);
      const existingIdx = list.findIndex((p) => p.path === record.path);
      if (existingIdx >= 0) {
        list[existingIdx] = record;
      } else {
        list.push(record);
      }
      localStorage.setItem(PAGE_OVERRIDES_STORAGE_KEY, JSON.stringify(list));
    } catch {}
  }

  return record;
}

/**
 * Admin action: Delete page-specific SEO override
 */
export async function deletePageSeoOverride(path: string): Promise<boolean> {
  if (isSupabaseConfigured) {
    const browserClient = getSupabaseBrowserClient();
    if (browserClient) {
      await browserClient.from('page_seo_overrides').delete().eq('path', path);
    }
  }

  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem(PAGE_OVERRIDES_STORAGE_KEY);
      if (cached) {
        let list: PageSeoOverride[] = JSON.parse(cached);
        list = list.filter((p) => p.path !== path);
        localStorage.setItem(PAGE_OVERRIDES_STORAGE_KEY, JSON.stringify(list));
      }
    } catch {}
  }

  return true;
}
