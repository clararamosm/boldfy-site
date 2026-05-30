'use client';

/**
 * Comparativo "Sem Boldfy vs. com Boldfy" — bloco COMPACTO embutido (jun/2026,
 * Clara). Vive DENTRO do box "Na Boldfy · primeiro mês" da checklist, pra deixar
 * claro que o comparativo está atrelado ao que a Boldfy assume — antes ficava
 * numa seção solta, muito distante, e não parecia ligado.
 *
 * Mais delicado e menor que a versão antiga: sem seção própria, sem legenda
 * topo (cada barra já diz "Sem/Com Boldfy"), fundo roxo levemente colorido pra
 * destacar do card branco. Nenhuma informação importante perdida (2 gráficos +
 * card de economia).
 *
 * Cor sem Boldfy = neutro cinza-roxo (#9D85B3), com Boldfy = primary roxo.
 */

import { Clock, Pencil } from 'lucide-react';
import type { RenderedData } from '@/lib/playbook/templates/types';

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
    <div className="mt-6 rounded-xl border border-primary/15 bg-gradient-to-br from-primary/[0.07] via-[#E875FF]/[0.035] to-transparent p-5">
      <div className="mb-4 text-[11px] font-bold uppercase tracking-[0.14em] text-primary">
        Sem Boldfy vs. com Boldfy
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <BattleColuna
          icon={<Clock className="h-3.5 w-3.5" />}
          titulo="Tempo do admin pra gerenciar o programa"
          barras={[
            { label: 'Sem Boldfy', valor: '~9h / semana', percent: 90, cor: COR_SEM },
            { label: 'Com Boldfy', valor: '~1h / semana', percent: 10, cor: COR_COM },
          ]}
        />
        <BattleColuna
          icon={<Pencil className="h-3.5 w-3.5" />}
          titulo="Tempo do colaborador por post"
          barras={[
            { label: 'Sem Boldfy', valor: '~2h / post', percent: 80, cor: COR_SEM },
            { label: 'Com Boldfy', valor: '~30min / post', percent: 20, cor: COR_COM },
          ]}
        />
      </div>

      {/* Card de economia */}
      <div className="mt-5 rounded-lg border border-primary/20 bg-card/60 p-4 text-center text-[12.5px] leading-relaxed text-foreground">
        Pra {empresa} com {colabAtivos} colaboradores ativos postando 2x/semana, isso vira{' '}
        <strong>aproximadamente {battleCard.economiaMensalHoras}h/mês economizadas</strong> entre admin e
        time. Equivale a {formatFTEs(battleCard.economiaFTEs)} liberado pra outra frente.
      </div>
    </div>
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
      <div className="mb-3.5 flex items-center gap-2">
        <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </span>
        <h4 className="text-[12.5px] font-bold leading-tight text-foreground">{titulo}</h4>
      </div>
      <div className="space-y-3">
        {barras.map((b) => (
          <div key={b.label}>
            <div className="mb-1 flex items-baseline justify-between text-[11px]">
              <span className="font-semibold text-muted-foreground">{b.label}</span>
              <span className="font-bold text-foreground tabular-nums">{b.valor}</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-border">
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
  if (ftes < 0.4) return `~${ftes.toFixed(1)} FTE`;
  if (ftes <= 0.7) return 'meio FTE';
  if (ftes <= 1.2) return '1 FTE';
  return `${ftes.toFixed(1)} FTEs`;
}
