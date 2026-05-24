'use client';

/**
 * Bloco 2 — Snapshot + accordion curva de ativação.
 * Spec §2.2 + §2.9 do copy-final.
 *
 * 4 mini-cards (porte, área, voz, tentativas) + parágrafo conector +
 * accordion <details> "Por que estimamos N e não M?" com tabela das 4 faixas.
 */

import { Building2, ChevronDown, Info, RotateCcw, User, Wifi } from 'lucide-react';
import type { RenderedData } from '@/lib/playbook/templates/types';

export function PlaybookSnapshot({
  snapshot,
  curvaAtivacao,
  empresa,
}: {
  snapshot: RenderedData['snapshot'];
  curvaAtivacao: RenderedData['curvaAtivacao'];
  empresa: string;
}) {
  return (
    <section className="py-16 sm:py-24">
      <div className="mx-auto max-w-[1080px] px-6">
        <SectionTag>Bloco 2 · Diagnóstico</SectionTag>
        <h2 className="mb-10 font-headline text-3xl font-black tracking-tight text-foreground sm:text-4xl">
          Você está{' '}
          <span className="bg-gradient-to-br from-[#CD50F1] to-[#E875FF] bg-clip-text text-transparent">
            aqui hoje
          </span>
        </h2>

        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Mini icon={<Building2 className="h-5 w-5" />} label="Porte" value={snapshot.portePretty} />
          <Mini icon={<User className="h-5 w-5" />} label="Área" value={snapshot.areaPretty} />
          <Mini icon={<Wifi className="h-5 w-5" />} label="Voz hoje" value={snapshot.vozAtualPretty} />
          <Mini icon={<RotateCcw className="h-5 w-5" />} label="Tentativas" value={snapshot.tentativasPretty} />
        </div>

        <p className="mb-6 rounded-2xl border border-border bg-secondary px-6 py-5 text-[15px] leading-relaxed text-foreground">
          {snapshot.paragrafoConector}
        </p>

        <details className="group rounded-xl border border-border bg-card open:shadow-[0_8px_32px_rgba(93,42,103,.06)]">
          <summary className="flex cursor-pointer items-center gap-3 px-5 py-4 text-sm font-semibold text-foreground hover:text-primary">
            <Info className="h-4 w-4 text-primary" />
            <span className="flex-1">
              Por que estimamos {curvaAtivacao.colabAtivos} colaboradores ativos na plataforma e não {snapshot.porte}?
            </span>
            <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
          </summary>
          <div className="border-t border-border px-5 py-5">
            <p className="mb-5 text-sm leading-relaxed text-foreground">
              Programa B2B sustentável raramente ativa o time inteiro. Em empresas menores, o senso de
              pertencimento puxa adesão maior. Em escalas grandes, o ritmo se acomoda na faixa de 15-20%. A{' '}
              {empresa} cai na faixa típica de empresas {curvaAtivacao.faixaLabel}.
            </p>
            <CurvaTabela porte={snapshot.porte} faixaLabel={curvaAtivacao.faixaLabel} />
          </div>
        </details>
      </div>
    </section>
  );
}

function Mini({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-[0_8px_32px_rgba(93,42,103,.06)]">
      <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </div>
      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-sm font-bold text-foreground">{value}</div>
    </div>
  );
}

function CurvaTabela({ porte, faixaLabel }: { porte: number; faixaLabel: string }) {
  const rows = [
    { label: 'Até 20 colaboradores', percent: '~35%', match: porte <= 20 },
    { label: '21–100 colaboradores', percent: '~30%', match: porte > 20 && porte <= 100 },
    { label: '101–300 colaboradores', percent: '~22%', match: porte > 100 && porte <= 300 },
    { label: '300+ colaboradores', percent: '~17%', match: porte > 300 },
  ];
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <div className="grid grid-cols-[1fr_auto] divide-y divide-border">
        <div className="bg-secondary px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Porte da empresa
        </div>
        <div className="bg-secondary px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Ativação típica
        </div>
        {rows.map((r) => (
          <div key={r.label} className={`contents ${r.match ? 'bg-primary/5' : ''}`}>
            <div className={`px-4 py-3 text-sm ${r.match ? 'font-bold text-primary' : 'text-foreground'}`}>
              {r.label}
              {r.match && <span className="ml-2 text-xs font-semibold text-primary/70">({faixaLabel} — você está aqui)</span>}
            </div>
            <div className={`px-4 py-3 text-sm tabular-nums ${r.match ? 'font-bold text-primary' : 'text-foreground'}`}>
              {r.percent}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SectionTag({ children }: { children: React.ReactNode }) {
  return (
    <span className="mb-3 inline-flex rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-primary">
      {children}
    </span>
  );
}
