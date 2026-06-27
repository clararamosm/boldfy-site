import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Boldfy · Todos os links',
  description:
    'Os links da Boldfy num lugar só: crie seu Playbook de Team-Led Growth, baixe os materiais gratuitos, conheça as soluções e assine a newsletter.',
  openGraph: {
    title: 'Boldfy · Todos os links',
    description:
      'Os links da Boldfy num lugar só: Playbook de Team-Led Growth, materiais gratuitos, soluções e newsletter.',
    url: 'https://boldfy.com.br/link',
    images: [
      {
        url: '/images/og-default.jpg',
        width: 1200,
        height: 630,
        alt: 'Boldfy · Content Intelligence para Team-Led Growth',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Boldfy · Todos os links',
    description:
      'Os links da Boldfy num lugar só: Playbook de Team-Led Growth, materiais gratuitos, soluções e newsletter.',
    images: ['/images/og-default.jpg'],
  },
  alternates: {
    canonical: 'https://boldfy.com.br/link',
  },
};

export default function LinkLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
