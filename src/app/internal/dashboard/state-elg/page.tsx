/**
 * Dashboard · State of Employee-Led Growth.
 *
 * Painel interno (mai/2026) que consome a view `state_elg_aggregates` +
 * joins com playbook_outputs/people/companies. Mostra:
 *   - KPI top: total + threshold meter (X de 100 respostas pra publicar)
 *   - 8 cards de agregados (área, senioridade, setor, porte, dor, tentativas,
 *     budget, sponsorship)
 *   - Tendência semanal (sparkline 12 sem)
 *   - Tabela últimos 20 respondentes com link pro lead detail
 *
 * Quando passar de 100 respostas, planejamos publicar /state-of-employee-led-growth
 * (rota pública) reaproveitando os mesmos componentes — spec §10.3.
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowUpRight, BarChart3, Briefcase, Compass, FileText, Heart, Map, Sparkles, Users } from 'lucide-react';
import {
  STATE_ELG_PUBLISH_THRESHOLD,
  getAggregateByDimension,
  getLastPlaybookOutputs,
  getPlaybooksPorSemana,
  getStateElgSnapshot,
  type AggregateBucket,
  type LastResponder,
} from '@/lib/playbook/state-elg-queries';
import { Sparkline } from '@/components/dashboard/charts';
import { timeAgo } from '@/lib/crm-format';

export const metadata: Metadata = {
  title: 'State of ELG · Dashboard',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function StateElgPage() {
  const [
    snapshot,
    porArea,
    porSeniority,
    porSetor,
    porPorte,
    porDor,
    porTentativas,
    porBudget,
    porSponsorship,
    porSemana,
    ultimos,
  ] = await Promise.all([
    getStateElgSnapshot().catch(() => ({ total: 0, thresholdRemaining: STATE_ELG_PUBLISH_THRESHOLD, progressPercent: 0 })),
    getAggregateByDimension('area').catch(() => []),
    getAggregateByDimension('seniority').catch(() => []),
    getAggregateByDimension('industry').catch(() => []),
    getAggregateByDimension('porte_faixa').catch(() => []),
    getAggregateByDimension('dor_principal').catch(() => []),
    getAggregateByDimension('tentativas_anteriores').catch(() => []),
    getAggregateByDimension('budget_status').catch(() => []),
    getAggregateByDimension('sponsorship_lideranca').catch(() => []),
    getPlaybooksPorSemana(12).catch(() => []),
    getLastPlaybookOutputs(20).catch(() => []),
  ]);

  return (
    <div className="dash-page">
      <header className="dash-page-header">
        <div>
          <h1 className="dash-page-title">State of Employee-Led Growth</h1>
          <p className="dash-page-subtitle">
            Agregados anônimos das respostas do quiz em{' '}
            <code>/ferramentas/playbook-employee-led-growth</code>. Quando passarmos de{' '}
            {STATE_ELG_PUBLISH_THRESHOLD} respostas, publicamos o relatório em{' '}
            <code>/state-of-employee-led-growth</code>.
          </p>
        </div>
      </header>

      {/* Top KPI — total + threshold meter */}
      <div className="state-elg-hero">
        <div className="state-elg-hero-num">
          <div className="state-elg-hero-label">Total de respostas</div>
          <div className="state-elg-hero-value">{snapshot.total}</div>
          {porSemana.length > 0 && (
            <div className="state-elg-hero-sparkline">
              <Sparkline data={porSemana.map((w) => w.count)} height={32} />
              <div className="state-elg-hero-sparkline-label">Últimas 12 semanas</div>
            </div>
          )}
        </div>
        <div className="state-elg-hero-threshold">
          <div className="state-elg-hero-label">
            {snapshot.thresholdRemaining > 0
              ? `Faltam ${snapshot.thresholdRemaining} pra publicar`
              : 'Threshold atingido — pode publicar'}
          </div>
          <div className="state-elg-hero-progress-track">
            <div
              className="state-elg-hero-progress-fill"
              style={{ width: `${snapshot.progressPercent}%` }}
            />
          </div>
          <div className="state-elg-hero-progress-meta">
            <span>{snapshot.total}</span>
            <span>{snapshot.progressPercent}%</span>
            <span>{STATE_ELG_PUBLISH_THRESHOLD}</span>
          </div>
        </div>
      </div>

      {/* Grid de agregados */}
      <div className="state-elg-grid">
        <AggregateCard icon={<Briefcase className="h-4 w-4" />} title="Por área funcional" buckets={porArea} />
        <AggregateCard icon={<Users className="h-4 w-4" />} title="Por senioridade" buckets={porSeniority} />
        <AggregateCard icon={<BarChart3 className="h-4 w-4" />} title="Por setor" buckets={porSetor} />
        <AggregateCard icon={<Map className="h-4 w-4" />} title="Por porte (colaboradores)" buckets={porPorte} />
        <AggregateCard icon={<Compass className="h-4 w-4" />} title="Dor principal #1" buckets={porDor} />
        <AggregateCard icon={<Sparkles className="h-4 w-4" />} title="Tentativas anteriores" buckets={porTentativas} />
        <AggregateCard icon={<FileText className="h-4 w-4" />} title="Status do budget" buckets={porBudget} />
        <AggregateCard icon={<Heart className="h-4 w-4" />} title="Sponsorship da liderança" buckets={porSponsorship} />
      </div>

      {/* Tabela — últimos respondentes */}
      <section className="state-elg-table-section">
        <h2 className="state-elg-table-title">Últimos 20 respondentes</h2>
        {ultimos.length === 0 ? (
          <p className="state-elg-empty">Nenhum playbook gerado ainda. Quando o primeiro lead completar o quiz, ele aparece aqui.</p>
        ) : (
          <div className="state-elg-table-wrap">
            <table className="state-elg-table">
              <thead>
                <tr>
                  <th>Quando</th>
                  <th>Pessoa</th>
                  <th>Empresa</th>
                  <th>Setor</th>
                  <th>Template</th>
                  <th>Playbook</th>
                </tr>
              </thead>
              <tbody>
                {ultimos.map((row) => (
                  <ResponderRow key={row.slug} row={row} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Sub-componentes                                                            */
/* -------------------------------------------------------------------------- */

function AggregateCard({
  icon,
  title,
  buckets,
}: {
  icon: React.ReactNode;
  title: string;
  buckets: AggregateBucket[];
}) {
  return (
    <div className="state-elg-card">
      <div className="state-elg-card-header">
        <span className="state-elg-card-icon">{icon}</span>
        <h3 className="state-elg-card-title">{title}</h3>
      </div>
      {buckets.length === 0 ? (
        <p className="state-elg-card-empty">Sem dados.</p>
      ) : (
        <div className="state-elg-card-body">
          {buckets.map((b) => (
            <div className="state-elg-bar" key={b.value}>
              <div className="state-elg-bar-header">
                <span className="state-elg-bar-label">{b.label}</span>
                <span className="state-elg-bar-value">
                  <strong>{b.count}</strong>
                  <span>{b.percent}%</span>
                </span>
              </div>
              <div className="state-elg-bar-track">
                <div className="state-elg-bar-fill" style={{ width: `${b.percent}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ResponderRow({ row }: { row: LastResponder }) {
  return (
    <tr>
      <td className="state-elg-table-when">{timeAgo(row.createdAt)}</td>
      <td>
        <Link href={`/internal/crm/people/${row.personId}`} className="state-elg-table-link">
          {row.personName}
          <ArrowUpRight className="h-3 w-3" />
        </Link>
        <div className="state-elg-table-sub">{row.personEmail}</div>
      </td>
      <td>{row.companyName ?? <span className="state-elg-empty-inline">—</span>}</td>
      <td>{row.industry ?? <span className="state-elg-empty-inline">—</span>}</td>
      <td><code className="state-elg-template-key">{row.templateKey}</code></td>
      <td>
        <Link href={`/playbook/${row.slug}`} target="_blank" className="state-elg-table-link">
          Ver
          <ArrowUpRight className="h-3 w-3" />
        </Link>
      </td>
    </tr>
  );
}
