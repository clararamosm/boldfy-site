import type { Metadata } from 'next';
import { RhClient } from './rh-client';

export const metadata: Metadata = {
  title: 'Para times de RH e People — Employer branding autêntico',
  description:
    'Sua empresa tá perdendo talentos pra concorrência menor que aparece mais no LinkedIn. Veja como transformar colaboradores em vitrine autêntica da cultura — sem parecer institucional.',
  openGraph: {
    title: 'Para times de RH e People — Employer branding autêntico — Boldfy',
    description:
      'Sua empresa tá perdendo talentos pra concorrência menor que aparece mais no LinkedIn. Veja como transformar colaboradores em vitrine autêntica da cultura — sem parecer institucional.',
  },
};

export default function ParaRhPage() {
  return <RhClient />;
}
