/**
 * Dashboard · Ações no site.
 *
 * Mostra como visitantes interagem com o site no agregado — cross-pessoa:
 *   1. CTAs / botões — quem cliques, em quais, qual converte mais
 *   2. FAQs — quais perguntas concentram dúvida
 *   3. Funil do Playbook — onde abandona o quiz
 *   4. Funil de forms — open → start → success por form_type
 *   5. Páginas mais engajadas — onde acontecem mais ações
 *
 * Cada bloco em safeBlock pra falha individual não derrubar a page.
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import {
  getCtaActions,
  getFaqActions,
  getPlaybookFunnel,
  getFormFunnel,
  getEngagedPages,
} from '@/lib/ga4-actions';
import { isGa4Configured } from '@/lib/ga4';
import { safeBlock } from '@/lib/safe-block';
import { MousePointerClick, HelpCircle, Workflow, ClipboardCheck, Globe } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Dashboard · Ações no site',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

const DAYS = 30;

export default async function AcoesDashboardPage() {
  if (!isGa4Configured()) {
    return (
      <div>
        <h1 className="dash-title">Ações no site</h1>
        <p className="dash-subtitle">Como os visitantes interagem · últimos {DAYS} dias</p>
        <div className="dash-card">
          <div style={{ padding: 24, textAlign: 'center', color: '#9D85B3', fontSize: 13 }}>
            GA4 não configurado. Configure em{' '}
            <Link href="/internal/dashboard/connect-google" style={{ color: '#CD50F1' }}>
              /connect-google
            </Link>{' '}
            pra começar a coletar.
          </div>
        </div>
      </div>
    );
  }

  const [ctas, faqs, playbookFunnel, formFunnel, engagedPages] = await Promise.all([
    safeBlock('acoes', 'cta', () => getCtaActions(DAYS), []),
    safeBlock('acoes', 'faq', () => getFaqActions(DAYS), []),
    safeBlock('acoes', 'playbook', () => getPlaybookFunnel(90), []),
    safeBlock('acoes', 'forms', () => getFormFunnel(DAYS), []),
    safeBlock('acoes', 'pages', () => getEngagedPages(DAYS, 15), []),
  ]);

  return (
    <div>
      <div className="dash-header">
        <div>
          <h1 className="dash-title">Ações no site</h1>
          <p className="dash-subtitle">
            Como visitantes interagem · agregado cross-pessoa · últimos {DAYS} dias
          </p>
        </div>
      </div>

      {/* ----------------------------- 1. CTAs ----------------------------- */}
      <div className="dash-card">
        <div className="dash-card-title">
          <MousePointerClick /> Cliques em CTAs / botões
        </div>
        <div className="dash-card-subtitle">
          Quem clicou em quais botões e quantos viraram form submetido.
          Granularidade: cta_type × source (header:desktop vs hero vs footer
          aparecem separados). Sort por cliques desc.
        </div>
        {ctas.length === 0 ? (
          <Empty label="Sem cliques em CTA no período. Verifica se trackEvent('cta_click', ...) está disparando." />
        ) : (
          <table className="dash-table">
            <thead>
              <tr>
                <th>CTA</th>
                <th>Source</th>
                <th className="right">Cliques</th>
                <th className="right">Pessoas únicas</th>
                <th className="right">Submits do tipo</th>
                <th className="right">Taxa</th>
              </tr>
            </thead>
            <tbody>
              {ctas.map((c, i) => (
                <tr key={`${c.ctaType}-${c.source}-${i}`}>
                  <td><strong>{prettyCta(c.ctaType)}</strong></td>
                  <td>
                    <code style={{ background: '#F7EEFC', padding: '1px 6px', borderRadius: 4, fontSize: 11 }}>
                      {c.source}
                    </code>
                  </td>
                  <td className="right">{c.clicks.toLocaleString('pt-BR')}</td>
                  <td className="right">{c.uniqueUsers.toLocaleString('pt-BR')}</td>
                  <td className="right">{c.submits.toLocaleString('pt-BR')}</td>
                  <td className="right">
                    <span className={`dash-pill ${c.submitRate >= 0.1 ? 'green' : c.submitRate >= 0.03 ? 'amber' : ''}`}>
                      {(c.submitRate * 100).toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ----------------------------- 2. FAQs ----------------------------- */}
      <div className="dash-card">
        <div className="dash-card-title">
          <HelpCircle /> Perguntas mais clicadas (FAQ)
        </div>
        <div className="dash-card-subtitle">
          Quais perguntas as pessoas mais expandem — identifica as dúvidas
          dominantes. % do total mostra o share daquela pergunta dentro de
          todos os cliques de FAQ.
        </div>
        {faqs.length === 0 ? (
          <Empty label="Sem cliques em FAQ ainda. trackEvent('faq_expanded') foi adicionado recentemente — espera ~24h pra GA4 processar." />
        ) : (
          <table className="dash-table">
            <thead>
              <tr>
                <th>Pergunta</th>
                <th>Página</th>
                <th className="right">Cliques</th>
                <th className="right">Pessoas únicas</th>
                <th className="right">% do total</th>
              </tr>
            </thead>
            <tbody>
              {faqs.map((f, i) => (
                <tr key={`${f.question}-${i}`}>
                  <td>{f.question}</td>
                  <td>
                    <code style={{ background: '#F7EEFC', padding: '1px 6px', borderRadius: 4, fontSize: 11 }}>
                      {f.page}
                    </code>
                  </td>
                  <td className="right">{f.clicks.toLocaleString('pt-BR')}</td>
                  <td className="right">{f.uniqueUsers.toLocaleString('pt-BR')}</td>
                  <td className="right">
                    <span className={`dash-pill ${f.shareOfTotal >= 0.20 ? 'amber' : ''}`}>
                      {(f.shareOfTotal * 100).toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* -------------------- 3. Funil do Playbook -------------------- */}
      <div className="dash-card">
        <div className="dash-card-title">
          <Workflow /> Funil do quiz Playbook
        </div>
        <div className="dash-card-subtitle">
          Quantas pessoas completaram cada step do quiz nos últimos 90 dias.
          Dropoff = perda relativa ao step anterior. Step com dropoff alto =
          ponto crítico pra revisar.
        </div>
        {playbookFunnel.length === 0 ? (
          <Empty label="Sem dados de quiz nos últimos 90d." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {(() => {
              const max = Math.max(...playbookFunnel.map((s) => s.startedAt), 1);
              return playbookFunnel.map((s, i) => {
                const widthPct = (s.startedAt / max) * 100;
                return (
                  <div key={`${s.step}-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ minWidth: 22, fontSize: 11, color: '#9D85B3', fontWeight: 700 }}>
                      {s.stepNumber}.
                    </span>
                    <span style={{ minWidth: 140, fontSize: 12, color: '#45336B', fontWeight: 600 }}>
                      {s.step}
                    </span>
                    <div style={{ flex: 1, position: 'relative', height: 24 }}>
                      <div
                        style={{
                          width: `${widthPct}%`,
                          height: '100%',
                          background: 'linear-gradient(90deg, #CD50F1 0%, #E875FF 100%)',
                          borderRadius: 4,
                          display: 'flex',
                          alignItems: 'center',
                          paddingLeft: 8,
                          color: 'white',
                          fontSize: 12,
                          fontWeight: 700,
                          minWidth: 28,
                        }}
                      >
                        {s.startedAt}
                      </div>
                    </div>
                    {i > 0 ? (
                      <span style={{ minWidth: 70, fontSize: 11, color: s.dropoff > 0.30 ? '#DC2626' : '#9D85B3', fontWeight: 600 }}>
                        {s.dropoff > 0 ? `−${(s.dropoff * 100).toFixed(0)}%` : '—'}
                      </span>
                    ) : (
                      <span style={{ minWidth: 70, fontSize: 11, color: '#9D85B3' }}>baseline</span>
                    )}
                  </div>
                );
              });
            })()}
          </div>
        )}
      </div>

      {/* -------------------- 4. Funil de forms -------------------- */}
      <div className="dash-card">
        <div className="dash-card-title">
          <ClipboardCheck /> Funil de forms · open → start → submit
        </div>
        <div className="dash-card-subtitle">
          Por form_type, quantos abriram o form (form_open), começaram a
          preencher (form_submit_start) e completaram (form_submit_success).
          Forms sem form_open (já visíveis na LP) mostram opens=0.
        </div>
        {formFunnel.length === 0 ? (
          <Empty label="Sem dados de forms no período." />
        ) : (
          <table className="dash-table">
            <thead>
              <tr>
                <th>Form</th>
                <th className="right">Opens</th>
                <th className="right">Starts</th>
                <th className="right">Success</th>
                <th className="right">Open → Start</th>
                <th className="right">Start → Success</th>
              </tr>
            </thead>
            <tbody>
              {formFunnel.map((f, i) => (
                <tr key={`${f.formType}-${i}`}>
                  <td><strong>{f.formType}</strong></td>
                  <td className="right">{f.opens > 0 ? f.opens.toLocaleString('pt-BR') : '—'}</td>
                  <td className="right">{f.starts.toLocaleString('pt-BR')}</td>
                  <td className="right">{f.successes.toLocaleString('pt-BR')}</td>
                  <td className="right">{f.opens > 0 ? `${(f.openToStart * 100).toFixed(0)}%` : '—'}</td>
                  <td className="right">
                    <span className={`dash-pill ${f.startToSuccess >= 0.70 ? 'green' : f.startToSuccess >= 0.40 ? 'amber' : ''}`}>
                      {f.starts > 0 ? `${(f.startToSuccess * 100).toFixed(0)}%` : '—'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* -------------------- 5. Páginas mais engajadas -------------------- */}
      <div className="dash-card">
        <div className="dash-card-title">
          <Globe /> Páginas mais engajadas
        </div>
        <div className="dash-card-subtitle">
          Onde os visitantes mais executam ações (cliques, expansões, forms
          abertos). Exclui page_view automático — só conta eventos
          deliberados.
        </div>
        {engagedPages.length === 0 ? (
          <Empty label="Sem eventos no período." />
        ) : (
          <table className="dash-table">
            <thead>
              <tr>
                <th>Página</th>
                <th className="right">Eventos</th>
                <th className="right">Pessoas únicas</th>
              </tr>
            </thead>
            <tbody>
              {engagedPages.map((p, i) => (
                <tr key={`${p.page}-${i}`}>
                  <td>
                    <code style={{ background: '#F7EEFC', padding: '2px 8px', borderRadius: 4 }}>
                      {p.page}
                    </code>
                  </td>
                  <td className="right">{p.eventCount.toLocaleString('pt-BR')}</td>
                  <td className="right">{p.uniqueUsers.toLocaleString('pt-BR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------- helpers */

function Empty({ label }: { label: string }) {
  return (
    <div style={{ padding: 24, textAlign: 'center', color: '#9D85B3', fontSize: 12 }}>
      {label}
    </div>
  );
}

/** Tradução de cta_type técnico pra label humano. */
function prettyCta(ctaType: string): string {
  const map: Record<string, string> = {
    demo: 'Agendar demo',
    beta: 'Beta tester',
    proposal: 'Simulador de proposta',
    contact: 'Contato',
    algoritmo_linkedin_download: 'Algoritmo LinkedIn',
    case_semrush_download: 'Case Semrush',
    schedule_meeting: 'Agendar reunião',
  };
  return map[ctaType] ?? ctaType;
}
