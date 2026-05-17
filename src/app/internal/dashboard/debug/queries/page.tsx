/**
 * Debug — executa cada query usada nas pages do dashboard em isolamento
 * e mostra qual falha. Ajuda a localizar o que está causando 500 em runtime.
 */

import type { Metadata } from 'next';
import {
  getActivityByDay,
  getUnifiedFunnel,
  getLeadsByOrigin,
  getConversionHeatmap,
  getStackedTrafficByChannel,
  getLast5Leads,
  getBentoSnapshot,
  getLowCtrForPosition,
  getTopicGaps,
  getQueriesScatter,
  getSourceToStatusSankey,
  getStuckLeads,
  getScoreDistributionByChannel,
  getVelocityByChannel,
  getCohortMatrix,
  getTimePerStage,
  getFormConversionRate,
} from '@/lib/dashboard-queries';
import { getTrafficByDayAndChannel, getTrafficByDay, getTrafficByChannel, getTopUtms, getTopPages, getTrafficSummary } from '@/lib/ga4';
import { getSeoSummary, getTopQueries, getTopPagesSeo, getRankingOpportunities, getSeoByDay, getBrandedQueries } from '@/lib/search-console';
import { getContactCountSince } from '@/lib/activecampaign';

export const metadata: Metadata = { title: 'Debug · Queries', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

type CheckResult = { name: string; ok: boolean; ms: number; error?: string; sample?: string };

async function check(name: string, fn: () => Promise<unknown>): Promise<CheckResult> {
  const t0 = Date.now();
  try {
    const result = await fn();
    const ms = Date.now() - t0;
    const sample = JSON.stringify(result).slice(0, 200);
    return { name, ok: true, ms, sample };
  } catch (err) {
    return { name, ok: false, ms: Date.now() - t0, error: err instanceof Error ? `${err.message}\n${err.stack?.slice(0, 600)}` : String(err) };
  }
}

export default async function DebugQueriesPage() {
  const checks = await Promise.all([
    // GA4
    check('ga4.getTrafficSummary(28)', () => getTrafficSummary(28)),
    check('ga4.getTrafficByChannel(28)', () => getTrafficByChannel(28)),
    check('ga4.getTrafficByDay(28)', () => getTrafficByDay(28)),
    check('ga4.getTrafficByDayAndChannel(28)', () => getTrafficByDayAndChannel(28)),
    check('ga4.getTopPages(28, 10)', () => getTopPages(28, 10)),
    check('ga4.getTopUtms(28, 15)', () => getTopUtms(28, 15)),
    // SC
    check('sc.getSeoSummary(28)', () => getSeoSummary(28)),
    check('sc.getTopQueries(28, 20)', () => getTopQueries(28, 20)),
    check('sc.getTopPagesSeo(28, 12)', () => getTopPagesSeo(28, 12)),
    check('sc.getRankingOpportunities(28, 12)', () => getRankingOpportunities(28, 12)),
    check('sc.getSeoByDay(28)', () => getSeoByDay(28)),
    check('sc.getBrandedQueries(28)', () => getBrandedQueries(28)),
    // AC
    check('ac.getContactCountSince(30)', () => getContactCountSince(30)),
    // Dashboard queries
    check('dq.getActivityByDay(28)', () => getActivityByDay(28)),
    check('dq.getUnifiedFunnel(30)', () => getUnifiedFunnel(30)),
    check('dq.getLeadsByOrigin(30)', () => getLeadsByOrigin(30)),
    check('dq.getConversionHeatmap(90)', () => getConversionHeatmap(90)),
    check('dq.getStackedTrafficByChannel(28)', () => getStackedTrafficByChannel(28)),
    check('dq.getLast5Leads(5)', () => getLast5Leads(5)),
    check('dq.getBentoSnapshot()', () => getBentoSnapshot()),
    check('dq.getLowCtrForPosition(28)', () => getLowCtrForPosition(28)),
    check('dq.getTopicGaps(28)', () => getTopicGaps(28)),
    check('dq.getQueriesScatter(28)', () => getQueriesScatter(28)),
    check('dq.getSourceToStatusSankey()', () => getSourceToStatusSankey()),
    check('dq.getStuckLeads(7)', () => getStuckLeads(7)),
    check('dq.getScoreDistributionByChannel()', () => getScoreDistributionByChannel()),
    check('dq.getVelocityByChannel()', () => getVelocityByChannel()),
    check('dq.getCohortMatrix(6)', () => getCohortMatrix(6)),
    check('dq.getTimePerStage()', () => getTimePerStage()),
    check('dq.getFormConversionRate(30)', () => getFormConversionRate(30)),
  ]);

  const failed = checks.filter((c) => !c.ok);
  const ok = checks.filter((c) => c.ok);

  return (
    <div>
      <div className="dash-header">
        <div>
          <h1 className="dash-title">Debug · Queries</h1>
          <p className="dash-subtitle">{checks.length} queries · {ok.length} ok · {failed.length} falharam</p>
        </div>
      </div>

      {failed.length > 0 ? (
        <div className="dash-card">
          <div className="dash-card-title" style={{ color: '#EE5A52' }}>❌ Queries que quebraram ({failed.length})</div>
          {failed.map((f) => (
            <div key={f.name} style={{ padding: 14, marginBottom: 10, background: 'rgba(238, 90, 82, 0.06)', border: '1px solid rgba(238, 90, 82, 0.2)', borderRadius: 8 }}>
              <div style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 700, color: '#C0392B', marginBottom: 6 }}>
                {f.name} ({f.ms}ms)
              </div>
              <pre style={{ fontSize: 11, color: '#5E2A67', whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0 }}>
                {f.error}
              </pre>
            </div>
          ))}
        </div>
      ) : null}

      <div className="dash-card">
        <div className="dash-card-title">✓ Queries OK ({ok.length})</div>
        <table className="dash-table">
          <thead><tr><th>Query</th><th className="right">Tempo</th><th>Sample</th></tr></thead>
          <tbody>
            {ok.map((c) => (
              <tr key={c.name}>
                <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{c.name}</td>
                <td className="right muted">{c.ms}ms</td>
                <td style={{ fontFamily: 'monospace', fontSize: 10, color: '#9D85B3', maxWidth: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.sample}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
