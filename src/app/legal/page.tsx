import type { Metadata } from 'next';
import LegalClient from './legal-client';

export const metadata: Metadata = {
  title: 'Legal · Boldfy',
  description:
    'Política de Privacidade, Termos de Uso e Política de Cookies da Boldfy. Como coletamos, usamos e protegemos suas informações.',
  alternates: {
    canonical: 'https://boldfy.com.br/legal',
  },
};

export default function LegalPage() {
  return <LegalClient />;
}
