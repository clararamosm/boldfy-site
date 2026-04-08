import type { Metadata } from 'next';
import { CaasClient } from './caas-client';

export const metadata: Metadata = {
  title: 'Content as a Service — Produção de conteúdo com método e escala',
  description:
    'Produção de conteúdo autoral para executivos e times de marketing enxutos. Design integrado à plataforma ou ativação completa de perfis C-level, preservando a voz de quem assina.',
  openGraph: {
    title: 'Content as a Service — Produção de conteúdo com método e escala — Boldfy',
    description:
      'Produção de conteúdo autoral para executivos e times de marketing enxutos. Design integrado à plataforma ou ativação completa de perfis C-level, preservando a voz de quem assina.',
  },
};

export default function CaasPage() {
  return <CaasClient />;
}
