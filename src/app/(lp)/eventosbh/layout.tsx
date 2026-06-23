import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Eventos B2B em BH · Boldfy',
  description:
    'Pré-inscrição pros eventos B2B presenciais que a Boldfy está construindo em Belo Horizonte. Conversas de alto nível sobre o futuro do marketing B2B, pra quem lidera marketing em empresas B2B de BH e região.',
  openGraph: {
    title: 'Eventos B2B em BH · Boldfy',
    description:
      'Pré-inscrição pros eventos B2B presenciais que a Boldfy está construindo em Belo Horizonte. Conversas de alto nível sobre o futuro do marketing B2B, pra quem lidera marketing em empresas B2B de BH e região.',
    url: 'https://boldfy.com.br/eventosbh',
    images: [
      {
        url: '/images/og-default.jpg',
        width: 1200,
        height: 630,
        alt: 'Boldfy · Eventos B2B em BH',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Eventos B2B em BH · Boldfy',
    description:
      'Pré-inscrição pros eventos B2B presenciais que a Boldfy está construindo em Belo Horizonte.',
    images: ['/images/og-default.jpg'],
  },
  alternates: {
    canonical: 'https://boldfy.com.br/eventosbh',
  },
  // LP de captura — não indexar (lead form, não conteúdo público).
  robots: {
    index: false,
    follow: true,
  },
};

export default function EventosBhLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
