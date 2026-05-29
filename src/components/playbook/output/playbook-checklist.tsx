'use client';

/**
 * Bloco 5 — Próximo movimento (jun/2026 polish 6).
 *
 * Sequência visual:
 *   1. Timeline horizontal estilo Notion — resumo cronológico do que acontece
 *      na Semana 0 (vocês destravam) até Mês 4+ (programa autônomo). Mostra
 *      onde a Boldfy entra na operação. (jun/2026 — pedido da Clara)
 *   2. "Antes de tudo" — checklist com 5 itens condicionais por área
 *      (+1 item-zero quando tentou_morreu, visualmente destacado como banner).
 *   3. Divisor "↓ A partir daqui, a Boldfy assume a operação ↓".
 *   4. "Na Boldfy · primeiro mês" — 4 itens fixos reformulados.
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
        <SectionTag>Ação</SectionTag>
        <h2 className="mb-3 font-headline text-3xl font-black tracking-tight text-foreground sm:text-4xl">
          Seu próximo{' '}
          <span className="bg-gradient-to-br from-[#CD50F1] to-[#E875FF] bg-clip-text text-transparent">
            movimento
          </span>
        </h2>
        <p className="mb-8 max-w-[720px] text-base leading-relaxed text-muted-foreground">
          O que destravar internamente antes de subir o programa, e o que muda quando a Boldfy assume a operação.
        </p>

        {/* Timeline cronológica — resumo visual dos 6 marcos */}
        <TimelineProximoMovimento />

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

/* -------------------------------------------------------------------------- */
/*  Timeline — resumo cronológico dos 6 marcos do programa (jun/2026)          */
/* -------------------------------------------------------------------------- */

/**
 * Timeline horizontal estilo Notion. 6 marcos cronológicos:
 *   - Semana 0: vocês destravam (cinza, fase "antes da Boldfy")
 *   - Semana 1: Boldfy entra (transição visual cinza → rosa)
 *   - Sem 2-3, Mês 1, Mês 2-3, Mês 4+: programa rodando (rosa)
 *
 * A linha cronológica de fundo usa gradient (cinza → rosa) marcando o
 * "Boldfy entrou" entre Semana 0 e Semana 1. Pontos circulares em cada
 * marco com label de período + título curto + sub-descrição.
 *
 * Desktop (md+): grid horizontal 6 colunas.
 * Mobile (<md): stack vertical com linha à esquerda.
 *
 * Conteúdo fixo (não varia por perfil) — descreve o roadmap padrão do
 * programa que se aplica em todos os cenários.
 */
const TIMELINE_FASES: Array<{
  periodo: string;
  titulo: string;
  sub: string;
  fase: 'antes' | 'boldfy';
}> = [
  {
    periodo: 'Semana 0',
    titulo: 'Destrave interno',
    sub: 'Sponsor C-level, primeiro grupo, pacote de recompensas',
    fase: 'antes',
  },
  {
    periodo: 'Semana 1',
    titulo: 'Setup + onboarding',
    sub: 'Brand Context, trilhas ativas, time entra na plataforma',
    fase: 'boldfy',
  },
  {
    periodo: 'Sem 2-3',
    titulo: 'Primeiros conteúdos',
    sub: 'IA assistente sugere ângulos, posts começam a sair no feed',
    fase: 'boldfy',
  },
  {
    periodo: 'Mês 1',
    titulo: 'Time engajado',
    sub: 'Gamificação rodando, dashboard mostra impressões em tempo real',
    fase: 'boldfy',
  },
  {
    periodo: 'Mês 2-3',
    titulo: 'Ritmo consolidado',
    sub: 'Earned media mensurado, case pronto pra defender budget',
    fase: 'boldfy',
  },
  {
    periodo: 'Mês 4+',
    titulo: 'Programa autônomo',
    sub: 'Hábito estabelecido no time, ROI consistente, sem dependência',
    fase: 'boldfy',
  },
];

function TimelineProximoMovimento() {
  return (
    <div className="mb-8 rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/[0.04] to-card p-6 shadow-[0_8px_32px_rgba(93,42,103,.05)] sm:p-7">
      {/* Sub-header da timeline */}
      <div className="mb-6 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h3 className="font-headline text-base font-black uppercase tracking-wider text-foreground">
          Roadmap do programa
        </h3>
        <span className="text-[12px] text-muted-foreground">
          do primeiro alinhamento até rodar autônomo
        </span>
      </div>

      {/* Desktop: timeline horizontal */}
      <div className="relative hidden md:block">
        {/* Linha cronológica de fundo (gradient cinza → rosa marca a entrada
            da Boldfy entre Semana 0 e Semana 1). Posicionada na altura do
            centro dos dots. */}
        <div
          aria-hidden
          className="absolute left-[8.33%] right-[8.33%] top-[26px] h-0.5 rounded-full"
          style={{
            background:
              'linear-gradient(to right, rgba(184,164,204,0.6) 0%, rgba(184,164,204,0.6) 9%, rgba(205,80,241,0.5) 18%, rgba(205,80,241,0.75) 100%)',
          }}
        />
        {/* Marca "Boldfy entrou" entre Semana 0 e Semana 1 */}
        <div
          aria-hidden
          className="absolute top-0 text-[9.5px] font-bold uppercase tracking-[0.12em] text-primary"
          style={{ left: '17%' }}
        >
          ↓ Boldfy entra
        </div>

        {/* Grid de 6 marcos */}
        <div className="relative grid grid-cols-6 gap-3 pt-5">
          {TIMELINE_FASES.map((f, i) => (
            <div key={i} className="flex flex-col items-center text-center">
              <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.1em] text-primary">
                {f.periodo}
              </div>
              <div
                className={`mb-3 h-3.5 w-3.5 shrink-0 rounded-full border-[2.5px] ${
                  f.fase === 'antes'
                    ? 'border-[#B8A4CC] bg-card'
                    : 'border-primary bg-gradient-to-br from-primary to-[#E875FF] shadow-[0_2px_8px_rgba(205,80,241,0.30)]'
                }`}
              />
              <div className="font-headline text-[12.5px] font-black leading-tight tracking-tight text-foreground">
                {f.titulo}
              </div>
              <div className="mt-1 text-[10.5px] leading-snug text-muted-foreground">
                {f.sub}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile: timeline vertical */}
      <ol className="relative space-y-5 md:hidden">
        {/* Linha vertical à esquerda */}
        <div
          aria-hidden
          className="absolute left-[7px] top-2 bottom-2 w-0.5 rounded-full"
          style={{
            background:
              'linear-gradient(to bottom, rgba(184,164,204,0.6) 0%, rgba(184,164,204,0.6) 12%, rgba(205,80,241,0.5) 22%, rgba(205,80,241,0.75) 100%)',
          }}
        />
        {TIMELINE_FASES.map((f, i) => (
          <li key={i} className="relative flex items-start gap-4 pl-1">
            <div
              className={`mt-1 h-4 w-4 shrink-0 rounded-full border-[2.5px] ${
                f.fase === 'antes'
                  ? 'border-[#B8A4CC] bg-card'
                  : 'border-primary bg-gradient-to-br from-primary to-[#E875FF]'
              }`}
            />
            <div className="flex-1">
              <div className="flex flex-wrap items-baseline gap-x-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-primary">
                  {f.periodo}
                </span>
                <span className="font-headline text-[13.5px] font-black leading-tight tracking-tight text-foreground">
                  {f.titulo}
                </span>
              </div>
              <div className="mt-0.5 text-[11.5px] leading-snug text-muted-foreground">
                {f.sub}
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
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
