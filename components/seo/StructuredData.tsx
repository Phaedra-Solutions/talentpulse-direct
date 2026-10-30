// components/seo/StructuredData.tsx
import React from 'react';
import type { Organization, WebPage, FAQPage, WithContext } from 'schema-dts';
import { SeoSettings, FaqItem } from '@/lib/seo-service';

interface OrganizationJsonLdProps {
  settings: SeoSettings;
}

export function OrganizationJsonLd({ settings }: OrganizationJsonLdProps) {
  const org = settings.organization_json;
  if (!org) return null;

  const schema: WithContext<Organization> = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${settings.canonical_base_url}/#organization`,
    name: org.name || settings.site_name,
    legalName: org.legalName || org.name,
    url: org.url || settings.canonical_base_url,
    logo: org.logo || `${settings.canonical_base_url}/logo.png`,
    description: org.description || settings.default_meta_description,
    email: org.email || 'hire@talentpulse.dev',
    foundingDate: org.foundingYear || '2024',
    sameAs: Array.isArray(org.sameAs) ? org.sameAs : [],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface WebPageJsonLdProps {
  title: string;
  description: string;
  url: string;
  siteName: string;
}

export function WebPageJsonLd({ title, description, url, siteName }: WebPageJsonLdProps) {
  const schema: WithContext<WebPage> = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: title,
    description: description,
    url: url,
    inLanguage: 'en-US',
    isPartOf: {
      '@type': 'WebSite',
      name: siteName,
      url: url.startsWith('http') ? new URL(url).origin : url,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface FaqJsonLdProps {
  faqs: FaqItem[];
}

export function FaqJsonLd({ faqs }: FaqJsonLdProps) {
  const activeFaqs = faqs.filter((item) => item.is_active && item.question && item.answer);
  if (activeFaqs.length === 0) return null;

  const schema: WithContext<FAQPage> = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: activeFaqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
