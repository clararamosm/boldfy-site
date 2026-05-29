'use client';

/**
 * Bloco 7 — Battle card (gráfico de barras 2 colunas).
 * Spec §2.6 do copy-final.
 *
 * 2 colunas lado a lado (admin / colab) com 2 barras cada (sem / com Boldfy)
 * e card de economia mensal embaixo.
 *
 * Cor sem Boldfy = neutro cinza-roxo (#9D85B3), com Boldfy = primary roxo.
 */

import { Clock, Pencil } from 'lucide-react';
import type { RenderedData } from '@/lib/playbook/templates/types';
import { SectionTag } from './playbook-snapshot';

const COR_SEM = '#9D85B3';
const COR_COM = '#CD50F1';

export function PlaybookBattleCard({
  battleCard,
  empresa,
  colabAtivos,
}: {
  battleCard: RenderedData['battleCard'];
  empresa: string;
  colabAtivos: number;
}) {
  return (
    <section className="bg-secondary/30 py-16 sm:py-24">
      <div className="mx-auto max-w-[1080px] px-6">
        <SectionTag>Comparativo</SectionTag>
        <h2 className="mb-3 font-headline text-3xl font-black tracking-tight text-foreground sm:text-4xl">
          Sem Boldfy{' '}
          <span className="bg-gradient-to-br from-[#CD50F1] to-[#E875FF] bg-clip-text text-transparent">
            vs. com Boldfy
          </span>
        </h2>
        <p className="mb-10 max-w-[720px] text-base leading-relaxed text-muted-foreground">
          A diferença no dia a dia, em números aproximados de programas comparáveis.
        </p>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-[0_8px_32px_rgba(93,42,103,.06)] sm:p-9">
          {/* Legenda */}
          <div className="mb-8 flex flex-wrap justify-center gap-6 text-xs font-semibold text-foreground">
            <LegendItem color={COR_SEM} label="Sem Boldfy" />
            <LegendItem color={COR_COM} label="Com Boldfy" />
          </div>

          <div className="grid gap-7 sm:grid-cols-2">
            <BattleColuna
              icon={<Clock className="h-[18px] w-[18px]" />}
              titulo="Tempo do admin pra gerenciar o programa"
              barras={[
                { label: 'Sem Boldfy', valor: '~9h / semana', percent: 90, cor: COR_SEM },
                { label: 'Com Boldfy', valor: '~1h / semana', percent: 10, cor: COR_COM },
              ]}
            />
            <BattleColuna
              icon={<Pencil className="h-[18px] w-[18px]" />}
              titulo="Tempo do colaborador por post"
              barras={[
                { label: 'Sem Boldfy', valor: '~2h / post', percent: 80, cor: COR_SEM },
                { label: 'Com Boldfy', valor: '~30min / post', percent: 20, cor: COR_COM },
              ]}
            />
          </div>

          {/* Card de economia */}
          <div className="mt-8 rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-5 text-center text-sm leading-relaxed text-foreground">
            Pra {empresa} com {colabAtivos} colaboradores ativos postando 2x/semana, isso vira{' '}
            <strong>aproximadamente {battleCard.economiaMensalHoras}h/mês economizadas</strong> entre admin e
            time. Equivale a {formatFTEs(battleCard.economiaFTEs)} liberado pra outra frente.
          </div>
        </div>
      </div>
    </section>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-2">
      <span className="h-3 w-3 rounded" style={{ backgroundColor: color }} aria-hidden />
      {label}
    </span>
  );
}

function BattleColuna({
  icon,
  titulo,
  barras,
}: {
  icon: React.ReactNode;
  titulo: string;
  barras: Array<{ label: string; valor: string; percent: number; cor: string }>;
}) {
  return (
    <div>
      <div className="mb-5 flex items-center gap-2.5">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </span>
        <h3 className="text-sm font-bold text-foreground">{titulo}</h3>
      </div>
      <div className="space-y-4">
        {barras.map((b) => (
          <div key={b.label}>
            <div className="mb-1.5 flex items-baseline justify-between text-xs">
              <span className="font-semibold text-muted-foreground">{b.label}</span>
              <span className="font-bold text-foreground tabular-nums">{b.valor}</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-border">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${b.percent}%`, backgroundColor: b.cor }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatFTEs(ftes: number): string {
  if (ftes < 0.4) return `~${(ftes).toFixed(1)} FTE`;
  if (ftes <= 0.7) return 'meio FTE';
  if (ftes <= 1.2) return '1 FTE';
  return `${ftes.toFixed(1)} FTEs`;
}
