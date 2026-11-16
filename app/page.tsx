import type { Metadata } from 'next';
import { constructMetadataForPath, getSeoSettings } from '@/lib/seo-service';
import { getRolesPaginated } from '@/lib/roles-tech-store';
import { HomePageClient } from '@/components/home/HomePageClient';

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  return constructMetadataForPath('/', {
    fallbackTitle: 'TalentPulse | Hire Top 1% Vetted Remote Tech Talent',
    fallbackDescription: 'Source pre-vetted senior software engineers, architects, and AI developers. Scale your engineering team with matched, ready-to-hire talent in 48 hours.',
  });
}

export default async function HomePage() {
  let activeRoles: any[] = [];
  let futureRoles: any[] = [];
  let activeFaqs: any[] = [];

  try {
    const [rolesResult, seo] = await Promise.all([
      getRolesPaginated({ includeClosed: true, summary: true, limit: 100 }),
      getSeoSettings(),
    ]);
    activeRoles = rolesResult.roles.filter((r) => r.status === 'open');
    futureRoles = rolesResult.roles.filter((r) => r.status === 'closed');
    if (seo && Array.isArray(seo.faq_items)) {
      activeFaqs = seo.faq_items.filter((f) => f.is_active);
    }
  } catch {
    // HomePageClient will fall back cleanly on mount if needed
  }

  return (
    <HomePageClient
      initialActiveRoles={activeRoles}
      initialFutureRoles={futureRoles}
      initialFaqs={activeFaqs}
    />
  );
}
