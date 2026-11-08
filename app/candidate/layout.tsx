import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Candidate Availability Portal | TalentPulse Direct',
  description: 'Confidential self-service candidate availability management portal.',
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

export default function CandidateLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
