'use client';

/**
 * Bloco 3 — Tese (fixa, não varia entre playbooks).
 * Spec §2.1 do copy-final. 3 cards lado a lado, cada um com ícone Lucide,
 * número, título e descrição curta.
 */

import { BookOpen, CheckSquare, MonitorSmartphone } from 'lucide-react';
import type { TeseMotivo } from '@/lib/playbook/templates/types';
import { SectionTag } from './playbook-snapshot';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  CheckSquare,
  BookOpen,
  MonitorSmartphone,
};

export function PlaybookTese({ motivos }: { motivos: TeseMotivo[] }) {
  return (
    <section className="bg-secondary/30 py-16 sm:py-24">
      <div className="mx-auto max-w-[1080px] px-6">
        <SectionTag>Bloco 3 · Tese</SectionTag>
        <h2 className="mb-3 font-headline text-3xl font-black tracking-tight text-foreground sm:text-4xl">
          Por que{' '}
          <span className="bg-gradient-to-br from-[#CD50F1] to-[#E875FF] bg-clip-text text-transparent">
            programas de Employee-Led Growth morrem
          </span>
        </h2>
        <p className="mb-10 max-w-[680px] text-base leading-relaxed text-muted-foreground">
          A maioria tenta resolver pedindo pro time postar. Não funciona. Programas morrem por 3 motivos
          clássicos, e cobrir os três é o que sustenta o resultado.
        </p>

        <div className="grid gap-5 sm:grid-cols-3">
          {motivos.map((m) => {
            const Icon = ICON_MAP[m.icon] ?? CheckSquare;
            return (
              <div
                key={m.num}
                className="rounded-2xl border border-border bg-card p-6 shadow-[0_8px_32px_rgba(93,42,103,.06)]"
              >
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.15em] text-primary">
                  Motivo {m.num}
                </div>
                <h3 className="mb-2 font-headline text-lg font-black leading-tight tracking-tight text-foreground">
                  {m.titulo}
                </h3>
                <p className="text-[13px] leading-relaxed text-muted-foreground">{m.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
