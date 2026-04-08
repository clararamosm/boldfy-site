import type { Metadata } from 'next';
import { MarketingClient } from './marketing-client';

export const metadata: Metadata = {
  title: 'Para times de marketing — Geração de demanda B2B orgânica',
  description:
    'Seu CAC subiu, seu Ads deu teto, e seu marketing precisa de um canal que não cobre por impressão. Veja como a Boldfy transforma o time num motor de aquisição orgânica.',
  openGraph: {
    title: 'Para times de marketing — Geração de demanda B2B orgânica — Boldfy',
    description:
      'Seu CAC subiu, seu Ads deu teto, e seu marketing precisa de um canal que não cobre por impressão. Veja como a Boldfy transforma o time num motor de aquisição orgânica.',
  },
};

export default function ParaMarketingPage() {
  return <MarketingClient />;
}
