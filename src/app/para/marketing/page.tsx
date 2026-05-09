import type { Metadata } from 'next';
import { MarketingClient } from './marketing-client';

export const metadata: Metadata = {
  title: 'Boldfy · Para times de marketing',
  description:
    'Seu CAC subiu, seu Ads deu teto, e seu marketing precisa de um canal que não cobre por impressão. Veja como a Boldfy transforma o time num motor de aquisição orgânica.',
  openGraph: {
    title: 'Boldfy · Para times de marketing',
    description:
      'Seu CAC subiu, seu Ads deu teto, e seu marketing precisa de um canal que não cobre por impressão. Veja como a Boldfy transforma o time num motor de aquisição orgânica.',
    url: 'https://boldfy.com.br/para/marketing',
    images: [
      {
        url: '/images/og-default.jpg',
        width: 1200,
        height: 630,
        alt: 'Boldfy · Para times de marketing',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Boldfy · Para times de marketing',
    description:
      'Seu CAC subiu, seu Ads deu teto, e seu marketing precisa de um canal que não cobre por impressão.',
    images: ['/images/og-default.jpg'],
  },
  alternates: {
    canonical: 'https://boldfy.com.br/para/marketing',
  },
};

export default function ParaMarketingPage() {
  return <MarketingClient />;
}
