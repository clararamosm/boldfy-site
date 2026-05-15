import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Marque sua demo · Boldfy',
  description:
    'Agende uma conversa de 30 minutos com a Boldfy. Vamos te mostrar como transformar o time de vendas e lideranças em motor de marketing B2B no LinkedIn.',
  openGraph: {
    title: 'Marque sua demo · Boldfy',
    description:
      'Agende uma conversa de 30 minutos com a Boldfy. Vamos te mostrar como transformar o time de vendas e lideranças em motor de marketing B2B no LinkedIn.',
    url: 'https://boldfy.com.br/agendar-demo',
    images: [
      {
        url: '/images/og-default.jpg',
        width: 1200,
        height: 630,
        alt: 'Boldfy · Marque sua demo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Marque sua demo · Boldfy',
    description:
      'Agende uma conversa de 30 minutos com a Boldfy. Vamos te mostrar como transformar o time de vendas e lideranças em motor de marketing B2B no LinkedIn.',
    images: ['/images/og-default.jpg'],
  },
  alternates: {
    canonical: 'https://boldfy.com.br/agendar-demo',
  },
  // LP de captura — não indexar (lead form, não conteúdo público).
  robots: {
    index: false,
    follow: true,
  },
};

export default function AgendarDemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
