/**
 * Bloco 4.5 — Resultados esperados (curadoria mai/2026).
 *
 * Micro-bloco entre Dicas (Bloco 4) e Checklist (Bloco 5). 1 chip por dor
 * selecionada — derivado de `RESULTADOS_POR_DOR`. Não renderiza se a lista
 * estiver vazia (caso 'outra' isolada).
 *
 * Decisão de copy: substitui a antiga P9 (resultados_prioritarios) — em vez
 * de pedir ao usuário, derivamos da dor. Menos atrito no quiz, mesma utilidade
 * editorial na saída.
 */

import { Sparkles } from 'lucide-react';
import { SectionTag } from './playbook-snapshot';

export function PlaybookResultadosEsperados({ resultados }: { resultados: string[] }) {
  if (!resultados || resultados.length === 0) return null;

  return (
    <section className="py-10 sm:py-14">
      <div className="mx-auto max-w-[1080px] px-6">
        <SectionTag>Bloco 4.5 · Resultados esperados</SectionTag>
        <h2 className="mb-2 font-headline text-2xl font-black tracking-tight text-foreground sm:text-3xl">
          O que vocês{' '}
          <span className="bg-gradient-to-br from-[#CD50F1] to-[#E875FF] bg-clip-text text-transparent">
            podem destravar
          </span>
        </h2>
        <p className="mb-6 max-w-[720px] text-sm leading-relaxed text-muted-foreground">
          Esses são os resultados típicos que aparecem nos 3 a 6 primeiros meses, quando o programa cobre os 3
          motores: porquê, como e ferramenta.
        </p>

        <ul className="grid gap-3 sm:grid-cols-2">
          {resultados.map((r, i) => (
            <li
              key={i}
              className="flex items-start gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-[0_4px_16px_rgba(93,42,103,.04)]"
            >
              <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Sparkles className="h-3.5 w-3.5" />
              </span>
              <span className="text-[14px] leading-snug text-foreground">{r}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
