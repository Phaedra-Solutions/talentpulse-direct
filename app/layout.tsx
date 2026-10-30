import type { Metadata } from 'next';
import { Inter, Space_Mono, Syne } from 'next/font/google';
import './globals.css';
import { getSeoSettings } from '@/lib/seo-service';
import { GoogleTagManagerHead, GoogleTagManagerBody } from '@/components/seo/GoogleTagManager';
import { OrganizationJsonLd, WebPageJsonLd } from '@/components/seo/StructuredData';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const spaceMono = Space_Mono({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

const syne = Syne({
  weight: ['700', '800'],
  subsets: ['latin'],
  variable: '--font-syne',
  display: 'swap',
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSeoSettings();
  const baseUrl = settings.canonical_base_url || 'https://talentpulse.dev';

  return {
    metadataBase: new URL(baseUrl),
    title: {
      default: settings.default_title,
      template: settings.title_template || '%s | TalentPulse',
    },
    description: settings.default_meta_description,
    keywords: settings.default_keywords ? settings.default_keywords.split(',').map((k) => k.trim()) : undefined,
    alternates: {
      canonical: baseUrl,
    },
    robots: {
      index: settings.is_indexing_enabled,
      follow: settings.is_indexing_enabled,
      googleBot: {
        index: settings.is_indexing_enabled,
        follow: settings.is_indexing_enabled,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    icons: {
      icon: [
        { url: '/assets/aistudio/favicon_a799297b.png', type: 'image/png' },
        { url: '/favicon.ico' },
        { url: '/favicon.png', type: 'image/png' },
      ],
      shortcut: '/assets/aistudio/favicon_a799297b.png',
      apple: '/assets/aistudio/favicon_a799297b.png',
    },
    openGraph: {
      title: settings.default_title,
      description: settings.default_meta_description,
      url: baseUrl,
      siteName: settings.site_name,
      images: [
        {
          url: settings.og_image_url || `${baseUrl}/og-talentpulse.png`,
          width: 1200,
          height: 630,
          alt: settings.site_name,
        },
      ],
      type: 'website',
    },
    twitter: {
      card: settings.twitter_card || 'summary_large_image',
      title: settings.default_title,
      description: settings.default_meta_description,
      creator: settings.twitter_handle || '@TalentPulseDev',
      images: [settings.og_image_url || `${baseUrl}/og-talentpulse.png`],
    },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSeoSettings();
  const baseUrl = settings.canonical_base_url || 'https://talentpulse.dev';

  return (
    <html lang="en" className={`${inter.variable} ${spaceMono.variable} ${syne.variable}`}>
      <head>
        <GoogleTagManagerHead gtmId={settings.gtm_id} isEnabled={settings.is_gtm_enabled} />
        <OrganizationJsonLd settings={settings} />
        <WebPageJsonLd
          title={settings.default_title}
          description={settings.default_meta_description}
          url={baseUrl}
          siteName={settings.site_name}
        />
      </head>
      <body suppressHydrationWarning className="bg-[#F8F7F4] text-[#111113] min-h-screen selection:bg-[#FF4D00] selection:text-white font-sans">
        <GoogleTagManagerBody gtmId={settings.gtm_id} isEnabled={settings.is_gtm_enabled} />
        {children}
      </body>
    </html>
  );
}
