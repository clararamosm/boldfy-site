import type { Metadata } from 'next';
import SaasPageClient from './saas-client';

export const metadata: Metadata = {
  title: 'Plataforma de influenciadores corporativos — Boldfy',
  description:
    'O SaaS que transforma colaboradores em criadores de conteúdo autoral no LinkedIn. IA contextual, gamificação, trilhas de aprendizagem e dashboard com métricas reais.',
};

export default function SaasPage() {
  return <SaasPageClient />;
}
