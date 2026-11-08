import type { Metadata } from 'next';
import { constructMetadataForPath } from '@/lib/seo-service';

export async function generateMetadata(): Promise<Metadata> {
  const meta = await constructMetadataForPath('/candidate/update', {
    fallbackTitle: 'Candidate Availability Portal | TalentPulse Direct',
    fallbackDescription: 'Confidential self-service candidate availability management portal.',
  });

  return {
    ...meta,
    robots: {
      index: false,
      follow: false,
      googleBot: {
        index: false,
        follow: false,
        noimageindex: true,
        'max-video-preview': -1,
        'max-image-preview': 'none',
        'max-snippet': -1,
      },
    },
  };
}

export default function CandidateLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
