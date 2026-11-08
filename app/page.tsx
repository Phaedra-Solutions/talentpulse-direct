import type { Metadata } from 'next';
import { constructMetadataForPath } from '@/lib/seo-service';
import { HomePageClient } from '@/components/home/HomePageClient';

export async function generateMetadata(): Promise<Metadata> {
  return constructMetadataForPath('/', {
    fallbackTitle: 'TalentPulse | Hire Top 1% Vetted Remote Tech Talent',
    fallbackDescription: 'Source pre-vetted senior software engineers, architects, and AI developers. Scale your engineering team with matched, ready-to-hire talent in 48 hours.',
  });
}

export default function HomePage() {
  return <HomePageClient />;
}
