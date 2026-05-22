/**
 * Dashboard · Forms — silo simples.
 * Leads recentes, contagem por form, heatmap dia × hora.
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { db, people, companies, statuses } from '@/db';
import { eq, and, isNull, desc, count, gte } from 'drizzle-orm';
import { getConversionHeatmap, getFormConversionRate } from '@/lib/dashboard-queries';
import { HeatmapChart } from '@/components/dashboard/charts';
import { channelLabel, timeAgo, methodVia } from '@/lib/crm-format';
import { daysAgo } from '@/lib/now';
import {
  ClipboardList,
  Flame,
  Lightbulb,
  Users,
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
};

export default async function FormsPage() {
  const since = daysAgo(DAYS);

  const [byForm, recentLeads, heatmap, formCvr] = await Promise.all([
    db.select({ method: people.sourceMethod, n: count() })
      .from(people)
      .where(and(eq(people.archived, false), isNull(people.mergedIntoId), gte(people.createdAt, since)))
      .groupBy(people.sourceMethod)
      .catch(() => []),
    db.select({ person: people, company: companies, status: statuses })
      .from(people)
      .leftJoin(companies, eq(people.companyId, companies.id))
      .leftJoin(statuses, eq(people.statusId, statuses.id))
      .where(and(eq(people.archived, false), isNull(people.mergedIntoId), gte(people.createdAt, since)))
      .orderBy(desc(people.createdAt))
      .limit(20)
      .catch(() => []),
    getConversionHeatmap(90).catch(() => Array.from({ length: 7 }, () => Array(24).fill(0))),
    getFormConversionRate(DAYS).catch(() => []),
  ]);

  const totalLeads = recentLeads.length;

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

      <div className="dash-card">
        <div className="dash-card-title"><Users /> Leads recentes</div>
        {recentLeads.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: '#9D85B3', fontSize: 13 }}>Sem leads no período.</div>
        ) : (
          <table className="dash-table">
            <thead><tr><th>Lead</th><th>Empresa</th><th>Via</th><th>Canal</th><th>Status</th><th className="right">Quando</th></tr></thead>
            <tbody>
              {recentLeads.map(({ person, company, status }) => {
                const via = methodVia(person.sourceMethod);
                return (
                  <tr key={person.id}>
                    <td>
                      <Link href={`/internal/crm/people/${person.id}`} className="strong" style={{ textDecoration: 'none', color: '#5E2A67' }}>{person.name}</Link>
                      <div className="muted">{person.jobTitle ?? person.email}</div>
                    </td>
                    <td>{company?.name ?? <span className="muted">—</span>}</td>
                    <td>{via ? <span className="dash-pill">{via.label}</span> : <span className="muted">—</span>}</td>
                    <td><span className="dash-pill blue">{channelLabel(person.sourceChannel)}</span></td>
                    <td><span className="dash-pill">{status?.label ?? '—'}</span></td>
                    <td className="right muted">{timeAgo(person.createdAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
