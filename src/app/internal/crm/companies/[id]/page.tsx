/**
 * Company Detail page — perfil completo da Empresa + lista de Pessoas linkadas.
 *
 * Sprint 2 entrega versão básica. Editor de status (drag) e merge ficam Sprint 3.
 */

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { db, people, activities } from '@/db';
import { eq, and, isNull, desc } from 'drizzle-orm';
import { getCompanyById } from '@/lib/crm-queries';
import { avatarHue, initials, timeAgo, describeActivity, timelineDotClass } from '@/lib/crm-format';
import { statusForScore } from '@/lib/crm';

export const metadata: Metadata = {
  title: 'Empresa',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ id: string }> };

export default async function CompanyDetailPage({ params }: Props) {
  const { id } = await params;

  const company = await getCompanyById(id);
  if (!company) notFound();

  const [companyPeople, companyActivities] = await Promise.all([
    db.select().from(people)
      .where(and(eq(people.companyId, id), eq(people.archived, false), isNull(people.mergedIntoId)))
      .orderBy(desc(people.leadScore)),
    db.select().from(activities)
      .where(eq(activities.companyId, id))
      .orderBy(desc(activities.createdAt))
      .limit(50),
  ]);

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Link href="/internal/crm/empresas" className="crm-btn">← Voltar pro kanban</Link>
      </div>

      <div className="crm-detail-card">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
          <div>
            <h1 className="crm-detail-name">{company.name}</h1>
            <p className="crm-detail-headline">
              {company.industry ?? '—'}
              {company.size ? ` · ${company.size}` : ''}
              {company.website ? (
                <>
                  {' · '}
                  <a href={company.website} target="_blank" rel="noopener" style={{ color: '#CD50F1' }}>{company.website}</a>
                </>
              ) : null}
            </p>
            <div style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', background: 'rgba(205, 80, 241, 0.1)', color: '#CD50F1', borderRadius: 999, fontSize: 12, fontWeight: 700 }}>
              {company.status}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 10, color: '#9D85B3', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Pessoas</div>
              <div style={{ fontFamily: 'var(--font-headline)', fontWeight: 900, fontSize: 28, color: '#5E2A67', lineHeight: 1 }}>{company.peopleCount}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 10, color: '#9D85B3', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Top score</div>
              <div style={{ fontFamily: 'var(--font-headline)', fontWeight: 900, fontSize: 28, color: '#5E2A67', lineHeight: 1 }}>{company.topScore}</div>
            </div>
            {company.estimatedValue ? (
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 10, color: '#9D85B3', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Valor estimado</div>
                <div style={{ fontFamily: 'var(--font-headline)', fontWeight: 900, fontSize: 18, color: '#10B981', lineHeight: 1 }}>
                  R$ {Number(company.estimatedValue).toLocaleString('pt-BR')}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {company.nextAction ? (
          <div style={{ padding: '12px 14px', background: '#FAF7FF', borderRadius: 10, fontSize: 13, color: '#45336B', marginBottom: 14 }}>
            <strong style={{ color: '#CD50F1' }}>Próxima ação: </strong>
            {company.nextAction}
            {company.nextActionAt ? ` · ${timeAgo(company.nextActionAt)}` : ''}
          </div>
        ) : null}

        {company.internalNotes ? (
          <div style={{ padding: 14, background: '#FAF7FF', borderRadius: 10, fontSize: 13, color: '#45336B', whiteSpace: 'pre-wrap' }}>
            {company.internalNotes}
          </div>
        ) : null}
      </div>

      {/* Pessoas linkadas */}
      <div className="crm-detail-card">
        <h2 style={{ fontFamily: 'var(--font-headline)', fontWeight: 900, fontSize: 16, color: '#5E2A67', marginBottom: 14 }}>
          Pessoas linkadas ({companyPeople.length})
        </h2>
        {companyPeople.length === 0 ? (
          <div className="crm-empty-timeline">Nenhuma pessoa linkada ainda.</div>
        ) : (
          <div style={{ display: 'grid', gap: 8 }}>
            {companyPeople.map((p) => {
              const hue = avatarHue(p.email);
              const tier = statusForScore(p.leadScore);
              const tierClass = tier === 'Quente' ? 'quente' : tier === 'Lead' ? 'lead' : '';
              return (
                <Link key={p.id} href={`/internal/crm/people/${p.id}`} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 10, background: '#FAF7FF', borderRadius: 10, textDecoration: 'none', color: 'inherit' }}>
                  <div className={`crm-avatar hue-${hue}`} style={{ width: 32, height: 32, fontSize: 12 }}>
                    {p.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.photoUrl} alt="" />
                    ) : (
                      initials(p.name)
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: '#5E2A67' }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: '#9D85B3' }}>{p.jobTitle ?? p.email}</div>
                  </div>
                  <span className={`crm-score-pill ${tierClass}`}>⚡ {p.leadScore}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Activities */}
      <div className="crm-detail-card">
        <h2 style={{ fontFamily: 'var(--font-headline)', fontWeight: 900, fontSize: 16, color: '#5E2A67', marginBottom: 14 }}>
          Histórico ({companyActivities.length})
        </h2>
        {companyActivities.length === 0 ? (
          <div className="crm-empty-timeline">Sem activities registradas pra essa empresa.</div>
        ) : (
          <div className="crm-timeline">
            {companyActivities.map((act) => {
              const display = describeActivity(act.type, act.data as Record<string, unknown> | null);
              const dotClass = timelineDotClass(display.category);
              return (
                <div key={act.id} className="crm-timeline-item">
                  <div className={`crm-timeline-dot ${dotClass}`}>
                    <span>{display.icon}</span>
                  </div>
                  <div className="crm-timeline-content">
                    <div className="crm-timeline-header">
                      <div className="crm-timeline-title">{display.text}</div>
                      <div className="crm-timeline-time">{timeAgo(act.createdAt)}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
