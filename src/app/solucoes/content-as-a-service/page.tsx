import type { Metadata } from 'next';
import { CaasClient } from './caas-client';

export const metadata: Metadata = {
  title: 'Boldfy · Content as a Service',
  description:
    'Produção de conteúdo autoral para executivos e times de marketing enxutos. Design integrado à plataforma ou ativação completa de perfis C-level, preservando a voz de quem assina.',
  openGraph: {
    title: 'Boldfy · Content as a Service',
    description:
      'Produção de conteúdo autoral para executivos e times de marketing enxutos. Design integrado à plataforma ou ativação completa de perfis C-level, preservando a voz de quem assina.',
  },
};

export default function CaasPage() {
  return <CaasClient />;
}
