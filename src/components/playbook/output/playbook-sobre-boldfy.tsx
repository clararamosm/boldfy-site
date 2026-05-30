'use client';

/**
 * Bloco 7.5 — Sobre a Boldfy (curadoria mai/2026).
 *
 * Aparece entre o Battle card (Bloco 7) e o CTA final (Bloco 8). Apresenta
 * as modalidades da Boldfy:
 *
 *   - SaaS (Plataforma Boldfy) — sempre visível, é o produto core.
 *   - CaaS (Boldfy Full Content) — aparece SOMENTE se sobreBoldfy.caas !== null,
 *     o que acontece quando P11 = sim_full_content (líder topa postar mas
 *     precisa de quem produza por ele).
 *
 * Decisão editorial: o respondente nunca pediu pra ver a Boldfy, então o bloco
 * abre com "Como destravar isso" — frame de meio, não pitch. Cards são opção
 * (1 ou 2), nunca obrigatório.
 *
 * CTAs vão pro mesmo demo popup com `source` específico pra a gente conseguir
 * segmentar no AC quem clicou em SaaS vs CaaS.
 */

import { ArrowRight, Layers, Sparkles } from 'lucide-react';
import { useDemoPopup } from '@/components/forms/demo-popup';
import type { RenderedData } from '@/lib/playbook/templates/types';
import { trackEvent } from '@/lib/track';
import { SectionTag } from './playbook-snapshot';

type SobreBoldfy = NonNullable<RenderedData['sobreBoldfy']>;

export function PlaybookSobreBoldfy({
  sobreBoldfy,
  slug,
}: {
  sobreBoldfy: SobreBoldfy;
  slug: string;
}) {
  const { openPopup } = useDemoPopup();
  const hasCaas = sobreBoldfy.caas !== null;

  const handleClick = (modalidade: 'saas' | 'caas') => {
    trackEvent('playbook_sobre_boldfy_clicked', { modalidade, slug });
    openPopup(`playbook:sobre_boldfy:${modalidade}`);
  };

  return (
    <section className="py-16 sm:py-24">
      <div className="mx-auto max-w-[1080px] px-6">
        <SectionTag>Sobre a Boldfy</SectionTag>
        <h2 className="mb-3 font-headline text-3xl font-black tracking-tight text-foreground sm:text-4xl">
          Como destravar isso{' '}
          <span className="bg-gradient-to-br from-[#CD50F1] to-[#E875FF] bg-clip-text text-transparent">
            com a Boldfy
          </span>
        </h2>
        <p className="mb-10 max-w-[720px] text-base leading-relaxed text-muted-foreground">
          {hasCaas
            ? 'Pelo seu cenário, vocês têm 2 caminhos com a gente: a plataforma pros líderes que topam postar sozinhos, e o Full Content pros que topam aparecer mas não têm tempo de escrever.'
            : 'A plataforma Boldfy é o jeito mais rápido de subir Employee-Led Growth no time, sem montar máquina interna.'}
        </p>

        <div className={hasCaas ? 'grid gap-6 lg:grid-cols-2' : 'grid gap-6'}>
          <Card
            card={sobreBoldfy.saas}
            icon={<Layers className="h-5 w-5" />}
            accent="primary"
            onClick={() => handleClick('saas')}
          />
          {sobreBoldfy.caas && (
            <Card
              card={sobreBoldfy.caas}
              icon={<Sparkles className="h-5 w-5" />}
              accent="service"
              onClick={() => handleClick('caas')}
            />
          )}
        </div>
      </div>
    </section>
  );
}

function Card({
  card,
  icon,
  accent,
  onClick,
}: {
  card: SobreBoldfy['saas'];
  icon: React.ReactNode;
  accent: 'primary' | 'service';
  onClick: () => void;
}) {
  const isService = accent === 'service';
  // Serviço (CaaS) = roxo escuro premium com borda animada. Nunca amarelo
  // (amarelo é do Vendas). Plataforma (SaaS) = roxo vivo (primary).
  const badgeClass = isService
    ? 'border-[#8E4FB0]/30 bg-[#5E2A67]/10 text-[#5E2A67]'
    : 'border-primary/25 bg-primary/10 text-primary';
  const iconClass = isService
    ? 'bg-[#5E2A67]/10 text-[#5E2A67]'
    : 'bg-primary/10 text-primary';
  const btnClass = isService
    ? 'text-white shadow-[0_8px_24px_rgba(94,42,103,.3)] hover:shadow-[0_12px_32px_rgba(94,42,103,.4)]'
    : 'bg-primary text-primary-foreground shadow-[0_8px_24px_rgba(205,80,241,.28)] hover:shadow-[0_12px_32px_rgba(205,80,241,.38)]';
  const btnStyle = isService
    ? { backgroundImage: 'linear-gradient(135deg, #5E2A67, #9840AD)' }
    : undefined;

  return (
    <div
      className={`flex flex-col rounded-2xl bg-card p-6 shadow-[0_8px_32px_rgba(93,42,103,.06)] sm:p-8 ${
        isService ? 'boldfy-service-glow' : 'border border-border'
      }`}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${iconClass}`}>
          {icon}
        </span>
        <span
          className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.15em] ${badgeClass}`}
        >
          {card.badge}
        </span>
      </div>

      <h3 className="mb-2 font-headline text-xl font-black tracking-tight text-foreground sm:text-2xl">
        {card.titulo}
      </h3>
      <p className="mb-5 text-[15px] leading-relaxed text-muted-foreground">{card.subtitulo}</p>

      <ul className="mb-7 flex-1 space-y-2.5">
        {card.bullets.map((bullet, i) => (
          <li key={i} className="flex items-start gap-2.5 text-[14px] leading-snug text-foreground">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
            <span>{bullet}</span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={onClick}
        className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition-all hover:-translate-y-0.5 ${btnClass}`}
        style={btnStyle}
      >
        {card.ctaLabel}
        <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.5} />
      </button>
    </div>
  );
}
