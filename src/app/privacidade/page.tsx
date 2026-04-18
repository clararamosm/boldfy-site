import type { Metadata } from 'next';
import PrivacidadeClient from './privacidade-client';

export const metadata: Metadata = {
  title: 'Política de Privacidade · Boldfy',
  description:
    'Política de Privacidade da Boldfy. Saiba como coletamos, usamos e protegemos suas informações pessoais.',
};

export default function PrivacidadePage() {
  return <PrivacidadeClient />;
}
