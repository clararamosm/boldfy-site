import type { Metadata } from 'next';
import { PlaybookLandingClient } from './playbook-landing-client';

/**
 * Landing page do Playbook de Employee-Led Growth.
 *
 * Em desktop ≥960px: 2 colunas — pitch à esquerda + wizard embed à direita.
 * Em mobile <960px: single column com pitch + CTA "Começar o quiz" que abre
 * o wizard como modal fullscreen.
 *
 * Esse padrão evita a fricção de uma tela "welcome" separada que duplica
 * o conteúdo da LP, e otimiza pra mobile (Web Summit é o primeiro caso de uso).
 *
 * Spec: source-of-truth/specs/playbook-team-led-growth.md §2 (URLs), §3.1 (UX).
 */
export const metadata: Metadata = {
  title: 'Playbook de Team-Led Growth',
  description:
    'Tenha sua estratégia de Team-Led Growth em 5 minutos. Conta pra Fai o cenário da sua empresa e ela monta um playbook acionável personalizado.',
  openGraph: {
    title: 'Playbook de Team-Led Growth · Boldfy',
    description:
      'Diagnóstico + plano em 3 fases + checklist + calculadora de earned media. Tudo gerado em 5 minutos a partir do seu cenário.',
    url: 'https://boldfy.com.br/ferramentas/playbook-team-led-growth',
    images: [
      {
        url: '/images/og-default.jpg',
        width: 1200,
        height: 630,
        alt: 'Playbook de Team-Led Growth · Boldfy',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Playbook de Team-Led Growth · Boldfy',
    description: 'Diagnóstico + plano + calculadora em 5 minutos.',
    images: ['/images/og-default.jpg'],
  },
  alternates: {
    canonical: 'https://boldfy.com.br/ferramentas/playbook-team-led-growth',
  },
};

export default function PlaybookTeamLedGrowthPage() {
  return <PlaybookLandingClient />;
}
