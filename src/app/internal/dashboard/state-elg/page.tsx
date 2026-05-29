/**
 * Dashboard · State of Employee-Led Growth.
 *
 * Painel interno que consome a view `state_elg_aggregates` + joins com
 * playbook_outputs. Foco em dados AGREGADOS NÃO-SENSÍVEIS (mai/2026 ciclo 4):
 *   - KPI top: total + threshold meter (X de 100 respostas pra publicar)
 *   - 8 cards de agregados (área, senioridade, setor, porte, dor, tentativas,
 *     budget, sponsorship)
 *   - Tendência semanal (sparkline 12 sem)
 *
 * Removido nessa página (mai/2026): a tabela "Últimos 20 respondentes" foi
 * migrada pra aba Forms (`/internal/dashboard/forms`) — ela mostra dados
 * identificáveis (nome, email, empresa) que são sinal comercial e não cabem
 * no dashboard agregado que vai virar relatório público.
 *
 * Quando passar de 100 respostas, planejamos publicar /state-of-employee-led-growth
 * (rota pública) reaproveitando os mesmos componentes. O agregado já é
 * publishable hoje.
 */

import type { Metadata } from 'next';
import { BarChart3, Briefcase, Compass, FileText, Heart, Map, Sparkles, Users } from 'lucide-react';
import {
  STATE_ELG_PUBLISH_THRESHOLD,
  getAggregateByDimension,
  getPlaybooksPorSemana,
  getStateElgSnapshot,
  type AggregateBucket,
} from '@/lib/playbook/state-elg-queries';
import { Sparkline } from '@/components/dashboard/charts';

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

      {/*
        A tabela de respondentes recentes (com nome/email/empresa) saiu daqui
        em mai/2026. Agora vive em /internal/dashboard/forms — sinal comercial
        fica junto dos outros leads, e este painel agregado pode virar
        relatório público sem expor dados identificáveis.
      */}
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

