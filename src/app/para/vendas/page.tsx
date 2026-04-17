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
  },
};

export default function ParaVendasPage() {
  return <VendasClient />;
}
