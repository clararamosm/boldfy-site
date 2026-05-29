/**
 * Dashboard de seletores quebrados da extensão Chrome.
 *
 * Lê activities tipo 'extension_field_missing' agregadas por (campo, page_type)
 * nos últimos 7 e 30 dias. Quando um campo aparece muito, indica que LinkedIn
 * mudou o DOM e a extensão precisa de update.
 *
 * Spec: SPEC-extension-linkedin.md §11.
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { db, activities } from '@/db';
import { and, eq, gte, sql } from 'drizzle-orm';

export const metadata: Metadata = {
  title: 'Telemetria da extensão',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

type Row = {
  field: string;
  page_type: string;
  count: number;
};

async function fetchAggregates(sinceDays: number): Promise<Row[]> {
  const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000);
  const rows = await db
    .select({
      field: sql<string>`(data->>'field')`,
      page_type: sql<string>`(data->>'page_type')`,
      count: sql<number>`count(*)::int`,
    })
    .from(activities)
    .where(
      and(
        eq(activities.type, 'extension_field_missing'),
        gte(activities.createdAt, since),
      ),
    )
    .groupBy(sql`(data->>'field')`, sql`(data->>'page_type')`)
    .orderBy(sql`count(*) DESC`);
  return rows;
}

export default async function ExtensionTelemetryPage() {
  const [last7, last30] = await Promise.all([
    fetchAggregates(7),
    fetchAggregates(30),
  ]);

  const ALERT_THRESHOLD_24H = 5;

  // Pra o alerta de 24h: re-query separada com filtro de 1 dia.
  const last24h = await fetchAggregates(1);
  const alerting = last24h.filter((r) => r.count >= ALERT_THRESHOLD_24H);

  return (
    <div style={{ maxWidth: 880 }}>
      <div style={{ marginBottom: 20 }}>
        <Link href="/internal/crm" className="crm-btn">← Voltar pro CRM</Link>
      </div>

      <h1 style={{ fontFamily: 'var(--font-headline)', fontWeight: 900, fontSize: 28, color: '#5E2A67', marginBottom: 8 }}>
        📊 Telemetria — seletores da extensão
      </h1>
      <p style={{ fontSize: 14, color: '#6B5B8A', marginBottom: 28, lineHeight: 1.5 }}>
        Cada vez que a extensão não consegue extrair um campo do DOM do
        LinkedIn (todos os seletores fallback falharam), reporta aqui.
        Quando um campo aparece muito, é sinal de que o LinkedIn mudou
        o DOM e os seletores precisam de update.
      </p>

      {alerting.length > 0 ? (
        <section
          style={{
            marginBottom: 28,
            padding: 16,
            background: 'rgba(192, 57, 43, 0.08)',
            border: '1px solid rgba(192, 57, 43, 0.25)',
            borderRadius: 10,
          }}
        >
          <h2 style={{ fontSize: 14, fontWeight: 900, color: '#C0392B', marginBottom: 8 }}>
            ⚠ Alerta — mais de {ALERT_THRESHOLD_24H} falhas em 24h
          </h2>
          {alerting.map((r) => (
            <div key={`${r.field}-${r.page_type}`} style={{ fontSize: 12, color: '#45336B' }}>
              <strong>{r.field}</strong> ({r.page_type}) — <strong>{r.count}</strong> falhas
            </div>
          ))}
          <p style={{ marginTop: 8, fontSize: 11, color: '#9D85B3' }}>
            Recomendado: atualizar seletores em &lt; 24h pra não acumular bola de neve.
          </p>
        </section>
      ) : null}

      <Section title="Últimos 7 dias" rows={last7} />
      <Section title="Últimos 30 dias" rows={last30} />
    </div>
  );
}

function Section({ title, rows }: { title: string; rows: Row[] }) {
  return (
    <section style={{ marginBottom: 28 }}>
      <h2 style={{ fontFamily: 'var(--font-headline)', fontWeight: 900, fontSize: 18, color: '#5E2A67', marginBottom: 12 }}>
        {title}
      </h2>
      {rows.length === 0 ? (
        <div style={{ padding: 18, background: '#FAF7FF', borderRadius: 10, fontSize: 13, color: '#9D85B3' }}>
          Nenhuma falha reportada nesse período. Tudo verde.
        </div>
      ) : (
        <div style={{ background: '#FAF7FF', borderRadius: 10, padding: 4 }}>
          {rows.map((r) => (
            <div
              key={`${r.field}-${r.page_type}`}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto auto',
                gap: 12,
                padding: '10px 14px',
                fontSize: 13,
                color: '#45336B',
                borderBottom: '1px solid rgba(205, 80, 241, 0.08)',
              }}
            >
              <div style={{ fontWeight: 700 }}>{r.field}</div>
              <div style={{ color: '#9D85B3' }}>{r.page_type}</div>
              <div style={{ fontWeight: 900, color: r.count > 10 ? '#C0392B' : '#5E2A67' }}>{r.count}×</div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
