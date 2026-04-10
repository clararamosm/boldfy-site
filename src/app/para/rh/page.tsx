import type { Metadata } from 'next';
import { RhClient } from './rh-client';

export const metadata: Metadata = {
  title: 'Boldfy · Para times de RH e People',
  description:
    'Sua empresa tá perdendo talentos pra concorrência menor que aparece mais no LinkedIn. Veja como transformar colaboradores em vitrine autêntica da cultura.',
  openGraph: {
    title: 'Boldfy · Para times de RH e People',
    description:
      'Sua empresa tá perdendo talentos pra concorrência menor que aparece mais no LinkedIn. Veja como transformar colaboradores em vitrine autêntica da cultura.',
  },
};

export default function ParaRhPage() {
  return <RhClient />;
}
