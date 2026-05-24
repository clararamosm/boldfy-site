'use client';

/**
 * Bloco 5 — Checklist (antes + na Boldfy).
 * Spec §2.5 do copy-final.
 *
 * Duas seções:
 *   1. "Antes de tudo" — 5 itens condicionais por área (+1 item-zero quando
 *      tentou_morreu, visualmente destacado como banner).
 *   2. Divisor "↓ A partir daqui, a Boldfy assume a operação ↓".
 *   3. "Na Boldfy · primeiro mês" — 4 itens fixos reformulados.
 *
 * Cada item: check circle + título + descrição + prazo (pill).
 */

import { CheckCircle2, Sparkles } from 'lucide-react';
import type { ChecklistItem } from '@/lib/playbook/templates/types';
import { SectionTag } from './playbook-snapshot';

export function PlaybookChecklist({
  antes,
  naBoldfy,
}: {
  antes: ChecklistItem[];
  naBoldfy: ChecklistItem[];
}) {
  // Item-zero: o primeiro da lista quando tentativas !== 'nunca' (render
  // adiciona no início). Detecta pelo título começar com "Antes de tudo".
  const itemZero = antes[0]?.titulo.startsWith('Antes de tudo,') ? antes[0] : null;
  const itensRegulares = itemZero ? antes.slice(1) : antes;

  return (
    <section className="bg-secondary/30 py-16 sm:py-24">
      <div className="mx-auto max-w-[1080px] px-6">
        <SectionTag>Bloco 5 · Ação</SectionTag>
        <h2 className="mb-3 font-headline text-3xl font-black tracking-tight text-foreground sm:text-4xl">
          Seu próximo{' '}
          <span className="bg-gradient-to-br from-[#CD50F1] to-[#E875FF] bg-clip-text text-transparent">
            movimento
          </span>
        </h2>
        <p className="mb-10 max-w-[720px] text-base leading-relaxed text-muted-foreground">
          O que destravar internamente antes de subir o programa, e o que muda quando a Boldfy assume a operação.
        </p>

        {/* Seção 1 — Antes de tudo */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-[0_8px_32px_rgba(93,42,103,.06)] sm:p-8">
          <div className="mb-5 flex items-center gap-3">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <CheckCircle2 className="h-4 w-4" strokeWidth={2.5} />
            </span>
            <h3 className="font-headline text-base font-black uppercase tracking-wider text-foreground">
              Antes de tudo · destrave isso internamente
            </h3>
          </div>

          {itemZero && (
            <div className="mb-4 rounded-xl border border-primary/30 bg-primary/5 p-4">
              <ChecklistRow item={itemZero} zero />
            </div>
          )}

          <div className="space-y-4">
            {itensRegulares.map((item, i) => (
              <ChecklistRow key={i} item={item} />
            ))}
          </div>
        </div>

        {/* Divisor */}
        <div className="my-8 flex items-center justify-center gap-3 text-xs font-bold uppercase tracking-[0.18em] text-primary">
          <span className="h-px flex-1 bg-gradient-to-r from-transparent to-primary/40" />
          <span>↓ A partir daqui, a Boldfy assume a operação ↓</span>
          <span className="h-px flex-1 bg-gradient-to-l from-transparent to-primary/40" />
        </div>

        {/* Seção 2 — Na Boldfy */}
        <div className="rounded-2xl border border-primary/30 bg-card p-6 shadow-[0_16px_40px_rgba(205,80,241,.12)] sm:p-8">
          <div className="mb-5 flex items-center gap-3">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[#CD50F1] to-[#E875FF] text-white">
              <Sparkles className="h-4 w-4" strokeWidth={2.5} />
            </span>
            <h3 className="font-headline text-base font-black uppercase tracking-wider text-foreground">
              Na Boldfy · primeiro mês
            </h3>
          </div>
          <div className="space-y-4">
            {naBoldfy.map((item, i) => (
              <ChecklistRow key={i} item={item} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ChecklistRow({ item, zero = false }: { item: ChecklistItem; zero?: boolean }) {
  return (
    <div className="flex items-start gap-3">
      <span
        className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
          zero ? 'border-primary bg-primary/15' : 'border-border bg-card'
        }`}
        aria-hidden
      />
      <div className="flex-1 min-w-0">
        <div className="mb-1 flex flex-wrap items-baseline gap-2">
          <span className="text-[15px] font-bold text-foreground">{item.titulo}</span>
          {item.prazo && (
            <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-secondary-foreground">
              {item.prazo}
            </span>
          )}
        </div>
        <p className="text-[13px] leading-relaxed text-muted-foreground">{item.descricao}</p>
      </div>
    </div>
  );
}
