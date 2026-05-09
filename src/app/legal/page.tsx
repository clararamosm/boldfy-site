import type { Metadata } from 'next';
import LegalClient from './legal-client';

export const metadata: Metadata = {
  title: 'Legal · Boldfy',
  description:
    'Política de Privacidade, Termos de Uso e Política de Cookies da Boldfy. Como coletamos, usamos e protegemos suas informações.',
  openGraph: {
    title: 'Legal · Boldfy',
    description:
      'Política de Privacidade, Termos de Uso e Política de Cookies da Boldfy.',
    url: 'https://boldfy.com.br/legal',
    images: [
      {
        url: '/images/og-default.jpg',
        width: 1200,
        height: 630,
        alt: 'Boldfy · Legal',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Legal · Boldfy',
    description:
      'Política de Privacidade, Termos de Uso e Política de Cookies da Boldfy.',
    images: ['/images/og-default.jpg'],
  },
  alternates: {
    canonical: 'https://boldfy.com.br/legal',
  },
};

export default function LegalPage() {
  return <LegalClient />;
}
