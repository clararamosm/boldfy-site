import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Beta Test · Boldfy',
  description:
    'Faça parte do beta da Boldfy e transforme o LinkedIn do seu time em canal de aquisição. Acesso antecipado com condições especiais para os primeiros clientes.',
  openGraph: {
    title: 'Beta Test · Boldfy',
    description:
      'Faça parte do beta da Boldfy e transforme o LinkedIn do seu time em canal de aquisição. Acesso antecipado com condições especiais para os primeiros clientes.',
    url: 'https://boldfy.com.br/beta-test',
    images: [
      {
        url: '/images/og-default.jpg',
        width: 1200,
        height: 630,
        alt: 'Beta Test Boldfy · Content Intelligence para Employee-Led Growth',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Beta Test · Boldfy',
    description:
      'Faça parte do beta da Boldfy e transforme o LinkedIn do seu time em canal de aquisição. Acesso antecipado com condições especiais para os primeiros clientes.',
    images: ['/images/og-default.jpg'],
  },
  alternates: {
    canonical: 'https://boldfy.com.br/beta-test',
  },
};

const howToJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: 'Como funciona o Beta da Boldfy',
  description:
    'Processo de onboarding para empresas que querem transformar colaboradores em criadores de conteúdo no LinkedIn com a Boldfy.',
  step: [
    {
      '@type': 'HowToStep',
      position: 1,
      name: 'Candidatura',
      text: 'Preencha o formulário de interesse com informações sobre a sua empresa e o tamanho do time.',
    },
    {
      '@type': 'HowToStep',
      position: 2,
      name: 'Diagnóstico',
      text: 'A Boldfy analisa o perfil da empresa e dos colaboradores para montar a estratégia de conteúdo ideal.',
    },
    {
      '@type': 'HowToStep',
      position: 3,
      name: 'Onboarding',
      text: 'Configuração da plataforma, criação das trilhas de aprendizagem e ativação dos colaboradores.',
    },
    {
      '@type': 'HowToStep',
      position: 4,
      name: 'Produção e publicação',
      text: 'Os colaboradores começam a criar e publicar conteúdo autoral no LinkedIn com apoio de IA contextual e equipe especializada.',
    },
    {
      '@type': 'HowToStep',
      position: 5,
      name: 'Resultados e otimização',
      text: 'Acompanhamento de métricas reais no dashboard e otimização contínua da estratégia com base em dados.',
    },
  ],
  tool: [
    {
      '@type': 'HowToTool',
      name: 'Plataforma Boldfy (SaaS)',
    },
    {
      '@type': 'HowToTool',
      name: 'IA contextual de criação de conteúdo',
    },
  ],
};

export default function BetaTestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }}
      />
      {children}
    </>
  );
}
