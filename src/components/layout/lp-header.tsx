'use client';

/**
 * Header minimalista pra Landing Pages (LPs) standalone.
 *
 * Diferente do <Header /> global do site, esse aqui:
 * - Não tem navegação principal (a LP é foco único)
 * - Logo Boldfy linka pra home do site
 * - CTA único que faz scroll suave pro elemento alvo da própria LP
 *
 * Use em rotas que têm seu próprio <layout.tsx> e querem se isolar
 * do header/footer globais.
 */

import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { LogoFull } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { trackEvent } from '@/lib/track';

interface LpHeaderProps {
  /** ID do elemento na própria LP que vai receber o scroll do CTA */
  ctaTargetId: string;
  /** Texto do botão CTA */
  ctaLabel: string;
  /** Source pra tracking (ex: "beta:header") */
  trackingSource?: string;
}

export function LpHeader({ ctaTargetId, ctaLabel, trackingSource }: LpHeaderProps) {
  const handleCtaClick = () => {
    if (trackingSource) {
      trackEvent('cta_click', { cta_type: 'beta', source: trackingSource });
    }
    document.getElementById(ctaTargetId)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <header className="border-b sticky top-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="mx-auto max-w-6xl px-6 py-3 flex items-center justify-between">
        {/* Logo → home */}
        <Link href="/" aria-label="Voltar para a home Boldfy" className="shrink-0">
          <LogoFull height={24} />
        </Link>

        {/* CTA único */}
        <Button onClick={handleCtaClick} size="sm" className="text-[11px] font-bold h-8">
          {ctaLabel}
          <ArrowRight className="w-3 h-3 ml-1" />
        </Button>
      </div>
    </header>
  );
}
