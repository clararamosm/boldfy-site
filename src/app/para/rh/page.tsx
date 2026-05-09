import type { Metadata } from 'next';
import { RhClient } from './rh-client';

export const metadata: Metadata = {
  title: 'Boldfy · Para times de RH e People',
  description:
    'Sua empresa tá perdendo talentos pra concorrência menor que aparece mais no LinkedIn. Veja como transformar colaboradores em vitrine autêntica da cultura.',
  openGraph: {
    title: 'Boldfy · Para times de RH e People',
    description:
      'Sua empresa tá perdendo talentos pra concorrência menor que aparece mais no LinkedIn. Veja como transformar colaboradores em vitrine autêntica da cultura.',
    url: 'https://boldfy.com.br/para/rh',
    images: [
      {
        url: '/images/og-default.jpg',
        width: 1200,
        height: 630,
        alt: 'Boldfy · Para times de RH e People',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Boldfy · Para times de RH e People',
    description:
      'Sua empresa tá perdendo talentos pra concorrência menor que aparece mais no LinkedIn. Veja como transformar colaboradores em vitrine autêntica da cultura.',
    images: ['/images/og-default.jpg'],
  },
  alternates: {
    canonical: 'https://boldfy.com.br/para/rh',
  },
};

export default function ParaRhPage() {
  return <RhClient />;
}
