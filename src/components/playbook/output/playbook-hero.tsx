'use client';

/**
 * Bloco 1 — Hero do playbook.
 * Spec §2.7 do copy-final. Fundo dark gradient da marca, soco numérico em
 * gradient text, legenda interpolada por dor, tag de colab ativos, botão
 * único "Compartilhar link" (PDF foi removido).
 */

import { Upload } from 'lucide-react';
import type { RenderedData } from '@/lib/playbook/templates/types';
import { ShareButton } from './share-button';

export function PlaybookHero({
  hero,
  colabAtivos,
  shareUrl,
}: {
  hero: RenderedData['hero'];
  colabAtivos: number;
  shareUrl: string;
}) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#0F0A18] via-[#1A0E2E] to-[#2D1445] py-20 text-white sm:py-28">
      {/* Grid pattern sutil */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(205,80,241,.4) 1px, transparent 1px), linear-gradient(90deg, rgba(205,80,241,.4) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
          maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 70%)',
        }}
      />

      <div className="relative mx-auto max-w-[1080px] px-6 text-center">
        {/* Logo mini */}
        <div className="mb-6 inline-flex font-headline text-base font-black tracking-tight">
          <span className="text-white/85">bold</span>
          <span className="text-[#E875FF]">fy</span>
        </div>

        {/* Pretitle */}
        <div className="mb-3 text-[11px] font-bold uppercase tracking-[0.15em] text-white/55">
          Playbook de Employee-Led Growth
        </div>

        {/* H1 — nome empresa */}
        <h1 className="mb-10 font-headline text-[clamp(2.5rem,5vw,3.75rem)] font-black leading-tight tracking-tight text-white">
          {hero.headlineEmpresa}
        </h1>

        {/* Soco */}
        <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/55">
          Sua oportunidade no LinkedIn
        </div>
        <div className="mb-3 font-headline text-[clamp(3rem,6vw,5rem)] font-black leading-none tracking-tight">
          <span className="bg-gradient-to-br from-[#CD50F1] to-[#E875FF] bg-clip-text text-transparent">
            {hero.socoNumero}
          </span>
        </div>
        <p className="mx-auto mb-4 max-w-[640px] text-base leading-relaxed text-white/80 sm:text-lg">
          {hero.socoLabel}
        </p>
        <div className="mb-9 inline-flex rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/55">
          considerando {colabAtivos} colaboradores ativos
        </div>

        {/* CTAs do hero — só Compartilhar (PDF removido na sessão de copy editorial) */}
        <div className="flex justify-center">
          <ShareButton url={shareUrl} variant="dark">
            <Upload className="mr-2 h-3.5 w-3.5" />
            Compartilhar link
          </ShareButton>
        </div>
      </div>
    </section>
  );
}
