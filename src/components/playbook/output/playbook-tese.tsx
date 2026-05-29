'use client';

/**
 * Bloco 3 — Tese + Bloco 3.5 — Setor aplicação.
 *
 * Bloco 3 (cards da tese) é fixo, não varia entre playbooks. Spec §2.1 do
 * copy-final. 3 cards lado a lado, cada um com ícone Lucide, número,
 * título e descrição curta.
 *
 * Bloco 3.5 (NOVO mai/2026 3ª curadoria): card horizontal único logo abaixo
 * dos 3 cards da tese, no mesmo container. Sem título de seção próprio (faz
 * parte do mesmo bloco visual). Conteúdo personalizado pelo setor (P3):
 *   - Esquerda: título + bullets de aplicação prática (varia por setor)
 *   - Direita: 3 mini-cards FIXOS em 3 colunas (porquê/como/ferramenta)
 *   - Embaixo dos 3 mini-cards: linha jaba "E a Boldfy te ajuda nos três"
 *     ocupando a largura dos 3 mini-cards.
 *
 * Substituiu as antigas dicas A_MARKETING / A_VENDAS / A_RH do TIPS_LIBRARY.
 */

import { BookOpen, CheckSquare, MonitorSmartphone, Sparkles } from 'lucide-react';
import type { SetorAplicacao, TeseMotivo } from '@/lib/playbook/templates/types';
import { SETOR_JABA, SETOR_RESOLUCAO_MOTORES } from '@/lib/playbook/templates';
import { SectionTag } from './playbook-snapshot';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  CheckSquare,
  BookOpen,
  MonitorSmartphone,
};

export function PlaybookTese({
  motivos,
  setorAplicacao,
}: {
  motivos: TeseMotivo[];
  setorAplicacao?: SetorAplicacao;
}) {
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

        {/* Bloco 3.5 — Setor aplicação (logo abaixo dos cards da tese,
            sem título separado, faz parte do mesmo bloco visual) */}
        {setorAplicacao && <SetorAplicacaoCard data={setorAplicacao} />}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Card horizontal do Bloco 3.5                                               */
/* -------------------------------------------------------------------------- */

function SetorAplicacaoCard({ data }: { data: SetorAplicacao }) {
  return (
    <div className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-[0_8px_32px_rgba(93,42,103,.06)] sm:p-8">
      {/* Layout: 2 colunas no desktop (1.1fr / 1fr), empilhado no mobile */}
      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr] lg:gap-10">
        {/* Esquerda — título do setor + bullets condicionais */}
        <div>
          <div className="mb-3 inline-flex items-center rounded-full bg-primary px-3 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-white">
            {data.setorBadge}
          </div>
          <h3 className="mb-4 font-headline text-xl font-black leading-tight tracking-tight text-foreground sm:text-2xl">
            {data.titulo}
          </h3>
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
            Como aplicar no seu setor
          </p>
          <ul className="space-y-2">
            {data.dicas.map((dica, i) => (
              <li key={i} className="flex items-start gap-2 text-[13.5px] leading-relaxed text-muted-foreground">
                <span className="mt-2 h-1 w-1 flex-shrink-0 rounded-full bg-primary" />
                <span>{dica}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Direita — 3 mini-cards fixos (porquê/como/ferramenta) + jaba */}
        <div>
          <div className="grid grid-cols-3 gap-2.5">
            {SETOR_RESOLUCAO_MOTORES.map((m) => (
              <div
                key={m.tag}
                className="rounded-xl border border-border bg-background p-3"
              >
                <div className="mb-1 text-[9px] font-bold uppercase tracking-[0.12em] text-primary">
                  {m.tag}
                </div>
                <div className="mb-1 font-headline text-[12.5px] font-black leading-tight text-foreground">
                  {m.titulo}
                </div>
                <div className="text-[10.5px] leading-snug text-muted-foreground">{m.desc}</div>
              </div>
            ))}
          </div>
          {/* Jaba ocupando a largura dos 3 mini-cards */}
          <div className="mt-2.5 flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/[0.08] px-3 py-2.5">
            <Sparkles className="h-3.5 w-3.5 flex-shrink-0 text-primary" />
            <span className="text-[12px] font-semibold text-primary">{SETOR_JABA}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
