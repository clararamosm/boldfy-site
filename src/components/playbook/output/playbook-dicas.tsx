'use client';

/**
 * Bloco 4 — Dicas + Boldfy (com accordion).
 * Spec §2.3 do copy-final. Grid de cards de dicas, cada uma com ícone Lucide,
 * número renumerado, título, texto editorial e accordion <details> "Como a
 * Boldfy resolve" que abre embaixo com bullets.
 */

import {
  Award,
  BarChart3,
  BookOpen,
  ChevronDown,
  Compass,
  Crown,
  DollarSign,
  Globe,
  Heart,
  MessageSquare,
  Network,
  RotateCcw,
  Target,
  TrendingUp,
  Trophy,
  UserCheck,
  Users,
  type LucideIcon,
} from 'lucide-react';
import type { Tip } from '@/lib/playbook/templates/types';
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
};

export function PlaybookDicas({ dicas }: { dicas: Tip[] }) {
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
            <DicaCard key={tip.id} tip={tip} />
          ))}
        </div>
      </div>
    </section>
  );
}

function DicaCard({ tip }: { tip: Tip }) {
  const Icon = ICON_MAP[tip.icon] ?? Compass;
  return (
    <div className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-[0_8px_32px_rgba(93,42,103,.06)] transition hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_16px_40px_rgba(205,80,241,.12)]">
      <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
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
      <h3 className="mb-2 font-headline text-base font-black leading-tight tracking-tight text-foreground">
        {tip.titulo}
      </h3>
      <p className="mb-4 flex-1 text-[13px] leading-relaxed text-muted-foreground">{tip.texto}</p>
      <details className="group rounded-lg border-t border-border/50 pt-3">
        <summary className="flex cursor-pointer items-center justify-between gap-2 text-[12px] font-bold text-primary hover:text-primary/80">
          <span>→ Como a Boldfy resolve</span>
          <ChevronDown className="h-3 w-3 transition-transform group-open:rotate-180" />
        </summary>
        <div className="mt-3 rounded-lg bg-secondary/50 p-3">
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
