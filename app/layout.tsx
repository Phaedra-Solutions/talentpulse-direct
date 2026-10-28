import type {Metadata} from 'next';
import { Inter, Space_Mono, Syne } from 'next/font/google';
import './globals.css';

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

export const metadata: Metadata = {
  title: 'TalentPulse Direct | Global On-Demand Engineering Pool',
  description: 'On-Demand Engineering Pool for Contractual & Project-Based Software Engineers, AI Engineers, and Forward Deployed Engineers (FDEs). Pure delivery.',
  icons: {
    icon: [
      { url: '/assets/aistudio/Favicon_2bbfcb3d.png', type: 'image/png' },
      { url: '/favicon.ico' },
    ],
    shortcut: '/assets/aistudio/Favicon_2bbfcb3d.png',
    apple: '/assets/aistudio/Favicon_2bbfcb3d.png',
  },
  openGraph: {
    title: 'TalentPulse Direct | Global On-Demand Engineering Pool',
    description: 'Vetted Contractual & Project-Based Software, AI, and Forward Deployed Engineers with Client Timezone Overlap.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TalentPulse Direct | Global On-Demand Engineering Pool',
    description: 'Vetted Contractual & Project-Based Software, AI, and Forward Deployed Engineers with Client Timezone Overlap.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceMono.variable} ${syne.variable}`}>
      <body suppressHydrationWarning className="bg-[#F8F7F4] text-[#111113] min-h-screen selection:bg-[#FF4D00] selection:text-white font-sans">
        {children}
      </body>
    </html>
  );
}
