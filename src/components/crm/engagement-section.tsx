/**
 * <EngagementSection /> — seção de engajamento no perfil do lead.
 *
 * Server component standalone: recebe `personId`, busca o último
 * `ga4_client_id` + `consent_status` nas activities da pessoa, e cruza
 * com a Analytics Data API pra mostrar:
 *
 *   1. Status de consent LGPD (chip)
 *   2. Métricas agregadas (sessões, pageviews, primeira/última visita)
 *   3. Top páginas vistas
 *   4. Lista de sessões dia-a-dia (sessões no site)
 *
 * Isolado por design: zero acoplamento com page.tsx além do plug do
 * componente. Erros são absorvidos internamente (try/catch + render
 * vazio) pra não derrubar o perfil. Não usa nenhum CSS novo — só inline
 * styles seguindo a paleta existente do CRM detail.
 */

import { sql } from 'drizzle-orm';
import { db } from '@/db';
import { isGa4Configured } from '@/lib/ga4';
import { getEngagementByClientId } from '@/lib/ga4-person';
import { Activity, Eye, Calendar, Globe, ShieldCheck, ShieldOff, ShieldQuestion } from 'lucide-react';

type EngagementContext = {
  consentStatus: 'granted' | 'denied' | 'unset' | null;
  ga4ClientId: string | null;
};

/**
 * Lê o último `consent_status` e `ga4_client_id` salvos nas activities da
 * pessoa. Olha qualquer activity (não só form_submit) — se no futuro outro
 * tipo de captura salvar engagement, isso continua funcionando.
 *
 * Retorna nulls se a pessoa nunca teve captura (ex: lead importado pré-mai/2026).
 */
async function getLatestEngagementContext(personId: string): Promise<EngagementContext> {
  try {
    const rows = await db.execute<{
      consent_status: string | null;
      ga4_client_id: string | null;
    }>(sql`
      SELECT
        data->'engagement'->>'consent_status' AS consent_status,
        data->'engagement'->>'ga4_client_id'  AS ga4_client_id
      FROM activities
      WHERE person_id = ${personId}
        AND data->'engagement' IS NOT NULL
      ORDER BY created_at DESC
      LIMIT 1
    `);
    const row = rows.rows[0];
    if (!row) return { consentStatus: null, ga4ClientId: null };
    const cs = row.consent_status;
    return {
      consentStatus: cs === 'granted' || cs === 'denied' || cs === 'unset' ? cs : null,
      ga4ClientId: row.ga4_client_id,
    };
  } catch (err) {
    console.error('[engagement-section] getLatestEngagementContext failed:', err);
    return { consentStatus: null, ga4ClientId: null };
  }
}

export async function EngagementSection({ personId }: { personId: string }) {
  const ctx = await getLatestEngagementContext(personId);
  const engagement = ctx.ga4ClientId && isGa4Configured()
    ? await getEngagementByClientId(ctx.ga4ClientId, 180).catch(() => null)
    : null;

  // Se a gente não tem NEM consent NEM engagement, não renderiza —
  // perfis legados (pré-captura) não mostram seção vazia.
  if (ctx.consentStatus === null && !engagement) return null;

  return (
    <div style={{ marginTop: 24 }}>
      <h3
        style={{
          fontFamily: 'var(--font-headline)',
          fontWeight: 900,
          fontSize: 15,
          color: '#5E2A67',
          marginBottom: 10,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <Activity size={16} /> Engajamento
      </h3>

      <div
        style={{
          background: '#FFFFFF',
          border: '1px solid #E4D8ED',
          borderRadius: 12,
          padding: 16,
        }}
      >
        {/* Linha 1: consent + métricas agregadas */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: engagement ? 16 : 0 }}>
          <ConsentChip status={ctx.consentStatus} />
          {engagement ? (
            <>
              <MetricChip
                icon={<Activity size={13} />}
                label="Sessões"
                value={engagement.totalSessions.toLocaleString('pt-BR')}
              />
              <MetricChip
                icon={<Eye size={13} />}
                label="Pageviews"
                value={engagement.totalPageViews.toLocaleString('pt-BR')}
              />
              {engagement.firstSeen ? (
                <MetricChip
                  icon={<Calendar size={13} />}
                  label="Primeiro acesso"
                  value={formatBR(engagement.firstSeen)}
                />
              ) : null}
              {engagement.lastSeen ? (
                <MetricChip
                  icon={<Calendar size={13} />}
                  label="Último acesso"
                  value={formatBR(engagement.lastSeen)}
                />
              ) : null}
            </>
          ) : null}
        </div>

        {/* Top páginas */}
        {engagement && engagement.topPages.length > 0 ? (
          <div style={{ marginBottom: 16 }}>
            <div
              style={{
                fontSize: 11,
                color: '#9D85B3',
                textTransform: 'uppercase',
                fontWeight: 700,
                letterSpacing: 0.06,
                marginBottom: 8,
              }}
            >
              <Globe size={11} style={{ display: 'inline-block', marginRight: 4, verticalAlign: '-1px' }} />
              Páginas mais vistas
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {engagement.topPages.slice(0, 5).map((p) => (
                <div
                  key={p.page}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 12,
                    padding: '6px 10px',
                    background: '#FAF7FF',
                    borderRadius: 6,
                    fontSize: 12,
                  }}
                >
                  <code
                    style={{
                      color: '#45336B',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      flex: 1,
                    }}
                  >
                    {p.page}
                  </code>
                  <span style={{ color: '#9D85B3', fontWeight: 600, fontSize: 11 }}>
                    {p.pageViews} {p.pageViews === 1 ? 'view' : 'views'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* Sessões dia-a-dia */}
        {engagement && engagement.dailyVisits.length > 0 ? (
          <div>
            <div
              style={{
                fontSize: 11,
                color: '#9D85B3',
                textTransform: 'uppercase',
                fontWeight: 700,
                letterSpacing: 0.06,
                marginBottom: 8,
              }}
            >
              <Calendar size={11} style={{ display: 'inline-block', marginRight: 4, verticalAlign: '-1px' }} />
              Sessões no site ({engagement.dailyVisits.length} dia
              {engagement.dailyVisits.length === 1 ? '' : 's'})
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                maxHeight: 200,
                overflow: 'auto',
              }}
            >
              {[...engagement.dailyVisits].reverse().slice(0, 30).map((d) => (
                <div
                  key={d.date}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '6px 10px',
                    background: '#FAF7FF',
                    borderRadius: 6,
                    fontSize: 12,
                  }}
                  title={d.pages.join('\n')}
                >
                  <span style={{ color: '#45336B', fontWeight: 600, minWidth: 70 }}>
                    {formatBR(d.date)}
                  </span>
                  <span style={{ color: '#9D85B3', fontSize: 11 }}>
                    {d.sessions} sessão{d.sessions === 1 ? '' : 'es'} ·{' '}
                    {d.pageViews} {d.pageViews === 1 ? 'pageview' : 'pageviews'}
                  </span>
                  <span
                    style={{
                      color: '#CD50F1',
                      fontSize: 11,
                      marginLeft: 'auto',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: '40%',
                    }}
                  >
                    {d.pages[0]}
                    {d.pages.length > 1 ? ` +${d.pages.length - 1}` : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* Fallback: tem consent mas GA4 não retornou dado */}
        {!engagement && ctx.consentStatus !== null ? (
          <p style={{ fontSize: 11, color: '#9D85B3', margin: 0 }}>
            {ctx.consentStatus === 'granted'
              ? ctx.ga4ClientId
                ? 'GA4 ainda não tem dado pra essa pessoa nos últimos 180 dias.'
                : 'Consentimento aceito, mas client_id do GA4 não foi capturado (cookie pode ter sido bloqueado por adblocker).'
              : ctx.consentStatus === 'denied'
                ? 'Pessoa recusou cookies — não conseguimos rastrear navegação dela no GA4.'
                : 'Pessoa ainda não interagiu com o banner de cookies.'}
          </p>
        ) : null}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ chips */

function ConsentChip({ status }: { status: 'granted' | 'denied' | 'unset' | null }) {
  if (status === null) {
    return (
      <Chip
        icon={<ShieldQuestion size={13} />}
        bg="#F0E5F8"
        color="#9D85B3"
        label="Consent"
        value="—"
      />
    );
  }
  if (status === 'granted') {
    return (
      <Chip
        icon={<ShieldCheck size={13} />}
        bg="rgba(16, 185, 129, 0.12)"
        color="#059669"
        label="Cookies"
        value="Aceitos"
      />
    );
  }
  if (status === 'denied') {
    return (
      <Chip
        icon={<ShieldOff size={13} />}
        bg="rgba(239, 68, 68, 0.10)"
        color="#DC2626"
        label="Cookies"
        value="Recusados"
      />
    );
  }
  return (
    <Chip
      icon={<ShieldQuestion size={13} />}
      bg="#F0E5F8"
      color="#9D85B3"
      label="Cookies"
      value="Sem escolha"
    />
  );
}

function MetricChip({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Chip
      icon={icon}
      bg="#FAF7FF"
      color="#5E2A67"
      label={label}
      value={value}
    />
  );
}

function Chip({
  icon,
  bg,
  color,
  label,
  value,
}: {
  icon: React.ReactNode;
  bg: string;
  color: string;
  label: string;
  value: string;
}) {
  return (
    <div
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        gap: 2,
        padding: '8px 12px',
        background: bg,
        borderRadius: 8,
        minWidth: 90,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          color,
          opacity: 0.7,
          fontSize: 10,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: 0.05,
        }}
      >
        {icon}
        {label}
      </div>
      <div style={{ color, fontWeight: 800, fontSize: 14 }}>{value}</div>
    </div>
  );
}

function formatBR(dateIso: string): string {
  // dateIso = YYYY-MM-DD; formata pra DD/MM
  const [, m, d] = dateIso.split('-');
  return `${d}/${m}`;
}
