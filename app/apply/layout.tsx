import type { Metadata } from 'next';
import React from 'react';
import { constructMetadataForPath } from '@/lib/seo-service';

export async function generateMetadata(): Promise<Metadata> {
  return constructMetadataForPath('/apply', {
    fallbackTitle: 'Join the TalentPulse Engineer Network | Apply as Talent',
    fallbackDescription: 'Apply to join our vetted talent pool. Work directly with top global technology companies with contractual flexibility and guaranteed hourly rates.',
  });
}

export default function ApplyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
