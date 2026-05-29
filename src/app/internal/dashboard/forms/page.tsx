/**
 * Dashboard · Forms — silo simples.
 *
 * Conteúdo (mai/2026 ciclo 4):
 *   - KPI top com totais por form
 *   - Tabela de CVR por form (CRM submits ÷ GA4 page views)
 *   - Heatmap dia × hora
 *   - **Respondentes do Playbook ELG** (substituiu "Leads recentes" — sinal
 *     comercial enriquecido com sessões/usuários únicos vindos do GA4 +
 *     gráfico expandable de acessos por dia)
 *
 * Removida nesta página: tabela "Leads recentes" — já temos a visão na aba
 * geral de CRM e em outros lugares; aqui ela perdia espaço útil pro sinal
 * mais valioso que é a engajamento por slug de playbook.
 */

import type { Metadata } from 'next';
import { db, people, companies } from '@/db';
import { eq, and, isNull, count, gte } from 'drizzle-orm';
import { getConversionHeatmap, getFormConversionRate } from '@/lib/dashboard-queries';
import { HeatmapChart } from '@/components/dashboard/charts';
import { daysAgo } from '@/lib/now';
import { getLastPlaybookOutputs } from '@/lib/playbook/state-elg-queries';
import {
  analyticsForPlaybook,
  getPlaybookAnalyticsBatch,
} from '@/lib/playbook/playbook-analytics';
import {
  PlaybookResponderRow,
  type PlaybookResponderData,
} from '@/components/dashboard/playbook-responder-row';
import {
  Flame,
  Lightbulb,
  Sparkles,
  Target as TargetIcon,
  FlaskConical,
  Download,
  Briefcase as BriefcaseIcon,
  FileText,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Dashboard · Forms',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

const DAYS = 30;

const FORM_META: Record<string, { label: string; Icon: React.ComponentType<{ size?: number }> }> = {
  form_demo: { label: 'Demo', Icon: TargetIcon },
  form_beta: { label: 'Beta', Icon: FlaskConical },
  form_algoritmo_linkedin: { label: 'Algoritmo LinkedIn', Icon: Download },
  form_case_semrush: { label: 'Case Semrush', Icon: Download },
  form_proposta: { label: 'Proposta', Icon: BriefcaseIcon },
  form_playbook_employee_led_growth: { label: 'Playbook ELG', Icon: Sparkles },
};

export default async function FormsPage() {
  const since = daysAgo(DAYS);

  // Quanto puxar de playbooks: 20 últimos é suficiente pra dar visibilidade
  // sem alongar a query do GA4 (que vê todos os slugs no batch independente
  // do recorte, o limit aqui é só da tabela exibida).
  const PLAYBOOK_LIMIT = 20;

  // sinceDate do batch GA4 = 90d ou desde o primeiro dos 20 últimos slugs,
  // o que for mais antigo (pega contexto histórico de re-visitas).
  const analyticsSince = daysAgo(90);

  const [byForm, totalLeadsRow, heatmap, formCvr, playbookResponders, analyticsBatch] =
    await Promise.all([
      db
        .select({ method: people.sourceMethod, n: count() })
        .from(people)
        .where(
          and(
            eq(people.archived, false),
            isNull(people.mergedIntoId),
            gte(people.createdAt, since),
          ),
        )
        .groupBy(people.sourceMethod)
        .catch(() => []),
      db
        .select({ n: count() })
        .from(people)
        .where(
          and(
            eq(people.archived, false),
            isNull(people.mergedIntoId),
            gte(people.createdAt, since),
          ),
        )
        .catch(() => [{ n: 0 } as { n: number }]),
      getConversionHeatmap(90).catch(() => Array.from({ length: 7 }, () => Array(24).fill(0))),
      getFormConversionRate(DAYS).catch(() => []),
      getLastPlaybookOutputs(PLAYBOOK_LIMIT).catch(() => []),
      getPlaybookAnalyticsBatch(analyticsSince).catch(() => new Map()),
    ]);

  const totalLeads = totalLeadsRow[0]?.n ?? 0;

  return (
    <div>
      <div className="dash-header">
        <div>
          <h1 className="dash-title">Forms</h1>
          <p className="dash-subtitle">Leads capturados via forms · últimos {DAYS} dias</p>
        </div>
      </div>

      <div className="dash-kpi-grid">
        <div className="dash-kpi">
          <div className="dash-kpi-icon"><FileText /></div>
          <div className="dash-kpi-label">Leads no período</div>
          <div className="dash-kpi-value">{totalLeads}</div>
        </div>
        {byForm.filter((b) => b.method && FORM_META[b.method]).slice(0, 3).map((b) => {
          const meta = FORM_META[b.method!];
          return (
            <div key={b.method} className="dash-kpi">
              <div className="dash-kpi-icon blue"><meta.Icon /></div>
              <div className="dash-kpi-label">{meta.label}</div>
              <div className="dash-kpi-value">{b.n}</div>
            </div>
          );
        })}
      </div>

      {formCvr.length > 0 ? (
        <div className="dash-card">
          <div className="dash-card-title"><Lightbulb /> Conversion rate por form</div>
          <div className="dash-card-subtitle">CRM submissões ÷ GA4 page views</div>
          <table className="dash-table">
            <thead><tr><th>Form</th><th className="right">Submissões</th><th className="right">Page views</th><th className="right">CVR</th></tr></thead>
            <tbody>
              {formCvr.map((f) => {
                const meta = FORM_META[`form_${f.form}`];
                const Icon = meta?.Icon ?? FileText;
                return (
                  <tr key={f.form}>
                    <td className="strong" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Icon size={14} />
                      {meta?.label ?? f.form}
                    </td>
                    <td className="right">{f.submissions}</td>
                    <td className="right muted">{f.pageViews?.toLocaleString('pt-BR') ?? '—'}</td>
                    <td className="right">
                      {f.cvr !== null ? (
                        <span className={`dash-pill ${f.cvr >= 5 ? 'green' : f.cvr >= 2 ? 'amber' : 'gray'}`}>{f.cvr.toFixed(1)}%</span>
                      ) : <span className="muted">—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}

      <div className="dash-card">
        <div className="dash-card-title"><Flame /> Heatmap dia × hora — quando convertem</div>
        <div className="dash-card-subtitle">Forms preenchidos · 90d</div>
        <HeatmapChart matrix={heatmap} />
      </div>

      {/*
        Respondentes do Playbook ELG.
        Substituiu "Leads recentes" — sinal comercial enriquecido com:
        - Sessões + usuários únicos do GA4 por slug (intenção e compartilhamento)
        - Gráfico expandable de acessos por dia (saber se houve revisita)
        Histórico de "todos os leads" continua acessível em /internal/crm.
      */}
      <div className="dash-card">
        <div className="dash-card-title">
          <Sparkles /> Respondentes do Playbook ELG
        </div>
        <div className="dash-card-subtitle">
          Últimos {PLAYBOOK_LIMIT} playbooks gerados com sessões e usuários únicos
          rastreados pelo GA4. Múltiplos usuários únicos no mesmo slug = lead
          compartilhou o playbook com o time.
        </div>
        {playbookResponders.length === 0 ? (
          <div
            style={{ padding: 24, textAlign: 'center', color: '#9D85B3', fontSize: 13 }}
          >
            Nenhum playbook gerado ainda. Quando o primeiro lead completar o quiz, aparece aqui.
          </div>
        ) : (
          <table className="dash-table">
            <thead>
              <tr>
                <th>Quando</th>
                <th>Pessoa</th>
                <th>Empresa</th>
                <th>Setor</th>
                <th>Template</th>
                <th className="right">Sessões</th>
                <th className="right">Únicos</th>
                <th className="right">Acessos/dia</th>
                <th className="right">Playbook</th>
              </tr>
            </thead>
            <tbody>
              {playbookResponders.map((row) => {
                const data: PlaybookResponderData = {
                  personId: row.personId,
                  personName: row.personName,
                  personEmail: row.personEmail,
                  companyName: row.companyName,
                  industry: row.industry,
                  templateKey: row.templateKey,
                  slug: row.slug,
                  createdAt: row.createdAt,
                };
                const analytics = analyticsForPlaybook(analyticsBatch, row.slug, row.createdAt);
                return (
                  <PlaybookResponderRow key={row.slug} row={data} analytics={analytics} />
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
