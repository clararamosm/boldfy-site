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
 * Jun/2026 (refinamento pós-preview): o bridge "E ainda resolve pra X e Y,
 * com playbooks específicos pra cada área" veio da calculadora pra cá —
 * fica visualmente embaixo do card de setor (onde a pessoa acabou de ler a
 * versão personalizada do dela). Renderiza só se houver outras áreas.
 *
 * Substituiu as antigas dicas A_MARKETING / A_VENDAS / A_RH do TIPS_LIBRARY.
 */

import Link from 'next/link';
import { BookOpen, CheckSquare, MonitorSmartphone } from 'lucide-react';
import type {
  RenderedData,
  SetorAplicacao,
  TeseMotivo,
} from '@/lib/playbook/templates/types';
import { SETOR_JABA, SETOR_RESOLUCAO_MOTORES } from '@/lib/playbook/templates';
import { FaiAvatar } from '@/components/ui/fai-avatar';
import { SectionTag } from './playbook-snapshot';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  CheckSquare,
  BookOpen,
  MonitorSmartphone,
};

export function PlaybookTese({
  motivos,
  setorAplicacao,
  outrasAreas,
}: {
  motivos: TeseMotivo[];
  setorAplicacao?: SetorAplicacao;
  outrasAreas?: RenderedData['outrasAreas'];
}) {
  return (
    <section className="bg-secondary/30 py-16 sm:py-24">
      <div className="mx-auto max-w-[1080px] px-6">
        <SectionTag>Tese</SectionTag>
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

        {/* Wrapper relativo pra hospedar as conexões SVG (jun/2026 polish):
            linhas pontilhadas animadas saem do bottom de cada card da Tese
            e descem até o mini-card correspondente do Bloco 3.5, mostrando
            que cada motivo do "porquê programas morrem" tem solução direta
            na entrega da empresa + plataforma. Só desktop (mobile cai pra
            stack). */}
        <div className="relative">
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

          {/* Conexões SVG da Tese ao Bloco 3.5 — só renderiza se houver
              SetorAplicacaoCard (caso contrário não há onde conectar). */}
          {setorAplicacao && <TeseSetorConnectors />}
        </div>

        {/* Bridge curto pras outras áreas — embaixo do card de setor.
            Veio da calculadora no refinamento de jun/2026 (Clara). */}
        {outrasAreas && outrasAreas.length > 0 && <OutrasAreasBridge outrasAreas={outrasAreas} />}
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
      {/* Layout: 2 colunas no desktop (1.1fr / 1fr), empilhado no mobile.
          Coluna direita alinhada ao bottom da esquerda — os 3 mini-cards +
          jaba ficam na altura dos últimos bullets do "Como aplicar". */}
      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr] lg:items-end lg:gap-10">
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

        {/* Direita — 3 mini-cards fixos (Motivo 1/2/3 alinhando com Bloco 3) + jaba */}
        <div>
          <div className="grid grid-cols-3 gap-2.5">
            {SETOR_RESOLUCAO_MOTORES.map((m, i) => (
              <div
                key={m.tag}
                className="rounded-xl border border-border bg-background p-3"
              >
                <div className="mb-1 text-[9px] font-bold uppercase tracking-[0.12em] text-primary">
                  Motivo {String(i + 1).padStart(2, '0')}
                </div>
                <div className="mb-1 font-headline text-[12.5px] font-black leading-tight text-foreground">
                  {m.titulo}
                </div>
                <div className="text-[10.5px] leading-snug text-muted-foreground">{m.desc}</div>
              </div>
            ))}
          </div>
          {/* Jaba ocupando a largura dos 3 mini-cards. Avatar da Fai dá voz à
              mensagem (mantém continuidade narrativa com o wizard). */}
          <div className="mt-2.5 flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/[0.08] px-3 py-2.5">
            <FaiAvatar size={20} />
            <span className="text-[12px] font-semibold text-primary">{SETOR_JABA}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Conexões Tese -> Setor Aplicação (SVG animado, jun/2026)                  */
/* -------------------------------------------------------------------------- */

/**
 * Linhas pontilhadas animadas conectando cada card da Tese (Bloco 3) ao
 * mini-card correspondente do Bloco 3.5 (Motivo 01 / 02 / 03 do setor).
 *
 * Conceito: mostrar que cada motivo do "por que programas morrem" tem
 * solução direta no que a empresa entrega + a plataforma. Pedido da Clara.
 *
 * Implementação:
 * - SVG absoluto cobrindo o gap entre cards Tese e mini-cards do Bloco 3.5.
 * - viewBox proporcional ao container (max-w-[1080px]) — 1032px de largura
 *   útil após padding. preserveAspectRatio="none" pra esticar conforme
 *   viewport.
 * - 3 curvas Bézier quadráticas saindo do bottom-center de cada card Tese
 *   e indo até o top-center do mini-card correspondente (que fica na
 *   coluna direita do SetorAplicacaoCard, ~60% à direita do container).
 * - stroke-dasharray + animação stroke-dashoffset → efeito de fluxo
 *   contínuo (pontos descendo).
 * - opacity baixa pra ficar sutil.
 * - hidden md:block — mobile não tem layout em colunas, conexões ficariam
 *   confusas.
 *
 * Coordenadas calculadas a partir do layout real:
 *   Cards Tese: grid 3 colunas, gap-5 (20px). Larguras iguais ~330px.
 *     Card 1 centro x ≈ 167  (165 + half-width)
 *     Card 2 centro x ≈ 516
 *     Card 3 centro x ≈ 865
 *   Mini-cards (coluna direita do SetorAplicacao, grid 1.1fr/1fr com gap):
 *     Coluna direita começa em x ≈ 562, largura ≈ 470.
 *     Mini-card 1 centro x ≈ 638
 *     Mini-card 2 centro x ≈ 795
 *     Mini-card 3 centro x ≈ 953
 *
 * Top/Bottom do SVG (Y=0 a Y=140) cobre o gap entre os 2 blocos —
 * paddings dos cards já absorvem a região interna, então as linhas
 * "saem" e "chegam" nas bordas dos containers.
 */
function TeseSetorConnectors() {
  return (
    <svg
      aria-hidden
      preserveAspectRatio="none"
      viewBox="0 0 1032 140"
      className="pointer-events-none absolute left-0 right-0 z-[1] hidden h-[140px] md:block"
      style={{ top: 'calc(50% - 70px)' }}
    >
      {/* Path 1: card Tese 1 (left) → mini-card Motivo 1 */}
      <path
        d="M 167 0 Q 167 70, 638 140"
        fill="none"
        stroke="rgba(205,80,241,0.55)"
        strokeWidth="1.5"
        strokeDasharray="4 8"
        strokeLinecap="round"
        className="tese-connector-flow"
      />
      {/* Path 2: card Tese 2 (center) → mini-card Motivo 2 */}
      <path
        d="M 516 0 Q 516 70, 795 140"
        fill="none"
        stroke="rgba(205,80,241,0.55)"
        strokeWidth="1.5"
        strokeDasharray="4 8"
        strokeLinecap="round"
        className="tese-connector-flow"
        style={{ animationDelay: '0.4s' }}
      />
      {/* Path 3: card Tese 3 (right) → mini-card Motivo 3 */}
      <path
        d="M 865 0 Q 865 70, 953 140"
        fill="none"
        stroke="rgba(205,80,241,0.55)"
        strokeWidth="1.5"
        strokeDasharray="4 8"
        strokeLinecap="round"
        className="tese-connector-flow"
        style={{ animationDelay: '0.8s' }}
      />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/*  Bridge "outras áreas"                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Linha discreta abaixo do card de Setor Aplicação mostrando os links das
 * outras duas áreas. Foco editorial: depois de ler "como Marketing aplica",
 * a pessoa percebe que existe a mesma profundidade pra Vendas e RH.
 */
function OutrasAreasBridge({
  outrasAreas,
}: {
  outrasAreas: NonNullable<RenderedData['outrasAreas']>;
}) {
  const linkPorSlug = (slug: 'marketing' | 'vendas' | 'rh') => `/para/${slug}`;
  return (
    <p className="mt-6 text-center text-sm text-muted-foreground">
      E ainda resolve pra{' '}
      {outrasAreas.map((a, i) => (
        <span key={a.slug}>
          <Link href={linkPorSlug(a.slug)} className="font-bold text-primary hover:underline">
            {a.pretty}
          </Link>
          {i < outrasAreas.length - 1 ? ' e ' : ''}
        </span>
      ))}
      , com playbooks específicos pra cada área.
    </p>
  );
}
