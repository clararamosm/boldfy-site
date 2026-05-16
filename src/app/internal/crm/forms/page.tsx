/**
 * CRM · Formulários — lista respondentes por form em formato tabela.
 *
 * Mostra os 4 forms (Demo, Beta, Report, Proposta) como cards expansíveis.
 * Click expande tabela com colunas específicas do form mostrando exatamente
 * o que cada lead respondeu, ordem cronológica (mais recente em cima).
 */

import type { Metadata } from 'next';
import { db, activities, people, companies } from '@/db';
import { eq, desc, and, like, sql } from 'drizzle-orm';
import { FormsList } from './forms-list';

export const metadata: Metadata = {
  title: 'CRM · Formulários',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export type FormType = 'form_submit_demo' | 'form_submit_beta' | 'form_submit_report' | 'form_submit_proposta';

export type FormSubmission = {
  activityId: string;
  createdAt: Date;
  data: Record<string, unknown> | null;
  /**
   * Metadata da person — usado como fallback quando activity.data está vazio
   * (caso clássico: leads importados do AC, onde os dados ricos do form ficaram
   * em person.metadata.ac_custom_fields / form_data ao invés de activity.data).
   */
  personMetadata: Record<string, unknown> | null;
  person: { id: string; name: string; email: string } | null;
  company: { id: string; name: string } | null;
};

async function getSubmissionsByForm(): Promise<Record<FormType, FormSubmission[]>> {
  const rows = await db
    .select({
      activityId: activities.id,
      createdAt: activities.createdAt,
      type: activities.type,
      data: activities.data,
      personId: people.id,
      personName: people.name,
      personEmail: people.email,
      personMetadata: people.metadata,
      companyId: companies.id,
      companyName: companies.name,
    })
    .from(activities)
    .leftJoin(people, eq(activities.personId, people.id))
    .leftJoin(companies, eq(activities.companyId, companies.id))
    .where(like(activities.type, 'form_submit_%'))
    .orderBy(desc(activities.createdAt))
    .limit(1000);

  const grouped: Record<FormType, FormSubmission[]> = {
    form_submit_demo: [],
    form_submit_beta: [],
    form_submit_report: [],
    form_submit_proposta: [],
  };

  for (const row of rows) {
    const t = row.type as FormType;
    if (!grouped[t]) continue;
    grouped[t].push({
      activityId: row.activityId,
      createdAt: row.createdAt,
      data: row.data as Record<string, unknown> | null,
      personMetadata: row.personMetadata as Record<string, unknown> | null,
      person: row.personId
        ? { id: row.personId, name: row.personName ?? '', email: row.personEmail ?? '' }
        : null,
      company: row.companyId ? { id: row.companyId, name: row.companyName ?? '' } : null,
    });
  }

  return grouped;
}

export default async function CrmFormsPage() {
  let submissions: Record<FormType, FormSubmission[]> = {
    form_submit_demo: [],
    form_submit_beta: [],
    form_submit_report: [],
    form_submit_proposta: [],
  };
  let dbError: string | null = null;
  try {
    submissions = await getSubmissionsByForm();
  } catch (err) {
    dbError = err instanceof Error ? err.message : String(err);
  }

  return (
    <div>
      <div className="crm-header">
        <div>
          <h1 className="crm-title">Formulários</h1>
          <p className="crm-subtitle">
            Respondentes por form · click pra expandir e ver campos exatos respondidos
          </p>
        </div>
      </div>

      {dbError ? (
        <div className="crm-empty-db">
          <strong>Postgres não conectado.</strong>
          <p>{dbError}</p>
        </div>
      ) : (
        <FormsList submissions={submissions} />
      )}
    </div>
  );
}
