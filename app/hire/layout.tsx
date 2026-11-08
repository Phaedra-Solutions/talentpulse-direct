import type { Metadata } from 'next';
import React from 'react';
import { constructMetadataForPath } from '@/lib/seo-service';

export async function generateMetadata(): Promise<Metadata> {
  return constructMetadataForPath('/hire', {
    fallbackTitle: 'Hire Top 1% Engineers in 48 Hours | TalentPulse',
    fallbackDescription: 'Submit your engineering requirements. TalentPulse matches verified, pre-screened technical talent with 4+ hours daily US overlap and a 2-week risk-free trial.',
  });
}

export default function HireLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
