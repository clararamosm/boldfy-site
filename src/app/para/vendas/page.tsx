import type { Metadata } from 'next';
import { VendasClient } from './vendas-client';

export const metadata: Metadata = {
  title: 'Boldfy · Para times de vendas',
  description:
    'Seus vendedores fazem 100 abordagens e recebem 99 silêncios. Veja como transformar cada pessoa do comercial em autoridade digital antes da primeira abordagem.',
  openGraph: {
    title: 'Boldfy · Para times de vendas',
    description:
      'Seus vendedores fazem 100 abordagens e recebem 99 silêncios. Veja como transformar cada pessoa do comercial em autoridade digital antes da primeira abordagem.',
    url: 'https://boldfy.com.br/para/vendas',
    images: [
      {
        url: '/images/og-default.jpg',
        width: 1200,
        height: 630,
        alt: 'Boldfy · Para times de vendas',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Boldfy · Para times de vendas',
    description:
      'Seus vendedores fazem 100 abordagens e recebem 99 silêncios. Veja como transformar cada pessoa do comercial em autoridade digital antes da primeira abordagem.',
    images: ['/images/og-default.jpg'],
  },
  alternates: {
    canonical: 'https://boldfy.com.br/para/vendas',
  },
};

export default function ParaVendasPage() {
  return <VendasClient />;
}
