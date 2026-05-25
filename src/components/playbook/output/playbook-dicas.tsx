'use client';

/**
 * Bloco 4 — Dicas + Boldfy (com accordion).
 * Spec §2.3 do copy-final + curadoria mai/2026.
 *
 * Grid de cards de dicas. Cada card tem ícone Lucide, número renumerado,
 * título descritivo (verb-led — diz o que fazer) e accordion <details>
 * "Como a Boldfy resolve" que abre embaixo com bullets.
 *
 * Curadoria mai/2026:
 *   - Removido o parágrafo `tip.texto` — título descritivo + bullets bastam.
 *   - Accordion mais convidativo (label "Veja como a Boldfy resolve",
 *     destaque de cor mais forte e CTA visualmente mais clicável).
 */

import {
  Award,
  BarChart3,
  BookOpen,
  ChevronDown,
  Compass,
  Crown,
  DollarSign,
  Feather,
  FileText,
  Globe,
  Heart,
  MessageSquare,
  Network,
  PiggyBank,
  RotateCcw,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
  UserCheck,
  Users,
  type LucideIcon,
} from 'lucide-react';
import type { Tip } from '@/lib/playbook/templates/types';
import { trackEvent } from '@/lib/track';
import { SectionTag } from './playbook-snapshot';

const ICON_MAP: Record<string, LucideIcon> = {
  Users,
  Compass,
  MessageSquare,
  Trophy,
  TrendingUp,
  BarChart3,
  UserCheck,
  Heart,
  DollarSign,
  Globe,
  Target,
  Award,
  RotateCcw,
  Network,
  Crown,
  BookOpen,
  FileText,
  PiggyBank,
  Sparkles,
  Feather,
};

export function PlaybookDicas({ dicas, slug }: { dicas: Tip[]; slug: string }) {
  const especificas = dicas.filter((d) => !d.selectors.universal);
  const tagsList = especificas.map((d) => d.tagEspecifica).filter(Boolean).join(', ');

  return (
    <section className="py-16 sm:py-24">
      <div className="mx-auto max-w-[1080px] px-6">
        <SectionTag>Bloco 4 · Dicas + Boldfy</SectionTag>
        <h2 className="mb-3 font-headline text-3xl font-black tracking-tight text-foreground sm:text-4xl">
          {dicas.length} dicas pra fazer dar{' '}
          <span className="bg-gradient-to-br from-[#CD50F1] to-[#E875FF] bg-clip-text text-transparent">
            certo no seu caso
          </span>
        </h2>
        <p className="mb-10 max-w-[720px] text-base leading-relaxed text-muted-foreground">
          5 universais que aparecem pra todo mundo, mais {dicas.length - 5} selecionadas pelo perfil de vocês
          {tagsList ? ` (${tagsList})` : ''}. Cada dica abre como a Boldfy resolve embaixo.
        </p>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {dicas.map((tip) => (
            <DicaCard key={tip.id} tip={tip} slug={slug} />
          ))}
        </div>
      </div>
    </section>
  );
}

function DicaCard({ tip, slug }: { tip: Tip; slug: string }) {
  const Icon = ICON_MAP[tip.icon] ?? Compass;
  return (
    <div
      className="dica-card group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-[0_8px_32px_rgba(93,42,103,.06)] transition duration-300 hover:-translate-y-1.5 hover:border-primary/60 hover:shadow-[0_24px_56px_rgba(205,80,241,.22)]"
    >
      {/* Shine effect — varre o card no hover */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full"
      />
      {/* Glow gradient atrás do card no hover */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 rounded-2xl bg-gradient-to-br from-[#CD50F1]/0 via-[#E875FF]/0 to-[#CD50F1]/0 opacity-0 blur-2xl transition-opacity duration-500 group-hover:from-[#CD50F1]/15 group-hover:via-[#E875FF]/10 group-hover:to-[#CD50F1]/15 group-hover:opacity-100"
      />
      <div className="relative mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary transition group-hover:bg-gradient-to-br group-hover:from-[#CD50F1] group-hover:to-[#E875FF] group-hover:text-white group-hover:shadow-[0_4px_14px_rgba(205,80,241,.4)]">
        <Icon className="h-[18px] w-[18px]" />
      </div>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-primary">{tip.numero}</span>
        {tip.tagEspecifica && (
          <span className="rounded-full bg-secondary px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-secondary-foreground">
            {tip.tagEspecifica}
          </span>
        )}
      </div>
      <h3 className="mb-4 flex-1 font-headline text-base font-black leading-snug tracking-tight text-foreground">
        {tip.titulo}
      </h3>
      <details
        className="group/details rounded-lg"
        onToggle={(e) => {
          if ((e.currentTarget as HTMLDetailsElement).open) {
            trackEvent('playbook_tip_expanded', { tip_id: tip.id, slug });
          }
        }}
      >
        <summary
          className="-mx-1 flex cursor-pointer list-none items-center justify-between gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-[12px] font-bold text-primary transition hover:border-primary/40 hover:bg-primary/10 group-open/details:rounded-b-none group-open/details:border-b-0"
        >
          <span className="flex items-center gap-1.5">
            <Sparkles className="h-3 w-3" />
            Veja como a Boldfy resolve
          </span>
          <ChevronDown className="h-3.5 w-3.5 transition-transform group-open/details:rotate-180" />
        </summary>
        <div className="-mx-1 rounded-b-lg border border-t-0 border-primary/20 bg-primary/[0.03] p-3">
          <div className="mb-2 text-[12px] font-bold text-foreground">{tip.boldfy.titulo}</div>
          <ul className="space-y-1.5 text-[12px] leading-relaxed text-muted-foreground">
            {tip.boldfy.items.map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </details>
    </div>
  );
}
