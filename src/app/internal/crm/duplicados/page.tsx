/**
 * Detector de duplicatas — pessoas e empresas.
 *
 * Mostra pares onde algoritmo suspeita que são a mesma entidade mas não foi
 * confiante pra mesclar automaticamente. Clara revisa e decide:
 *  - Mesclar (chama mergePeople/mergeCompanies existentes)
 *  - "Não são duplicatas" (esconde via localStorage — não persiste no DB pra
 *    evitar complexidade)
 *
 * Heurística de empresas:
 *  - Pares onde um `name` contém o outro (case-insensitive), com ≥ 4 chars
 *  - Filtra mesmo id, ignora nomes muito curtos (false positives)
 *
 * Heurística de pessoas:
 *  - Mesmo nome (case-insensitive trim) E ambas archived=false
 *  - Empresa também ajuda a confirmar mas não é obrigatória
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { db, people, companies } from '@/db';
import { sql } from 'drizzle-orm';
import { DuplicatesList } from './duplicates-list';

export const metadata: Metadata = {
  title: 'CRM · Duplicados',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export type DuplicateCompanyPair = {
  a: { id: string; name: string; linkedinUrl: string | null; industry: string | null; size: string | null; peopleCount: number };
  b: { id: string; name: string; linkedinUrl: string | null; industry: string | null; size: string | null; peopleCount: number };
  reason: string;
};

export type DuplicatePersonPair = {
  a: { id: string; name: string; email: string | null; jobTitle: string | null; companyName: string | null };
  b: { id: string; name: string; email: string | null; jobTitle: string | null; companyName: string | null };
  reason: string;
};

async function findDuplicateCompanies(): Promise<DuplicateCompanyPair[]> {
  // Self-join: pares onde um nome contém o outro (substring case-insensitive).
  // Limit 100 pares pra evitar query custosa quando tiver muitas empresas.
  const result = await db.execute<{
    a_id: string; a_name: string; a_linkedin: string | null; a_industry: string | null; a_size: string | null; a_count: number;
    b_id: string; b_name: string; b_linkedin: string | null; b_industry: string | null; b_size: string | null; b_count: number;
  }>(sql`
    WITH company_counts AS (
      SELECT company_id, COUNT(*)::int AS cnt
      FROM ${people}
      WHERE archived = false AND merged_into_id IS NULL
      GROUP BY company_id
    )
    SELECT
      a.id AS a_id, a.name AS a_name, a.linkedin_url AS a_linkedin,
      a.industry AS a_industry, a.size AS a_size,
      COALESCE(ca.cnt, 0) AS a_count,
      b.id AS b_id, b.name AS b_name, b.linkedin_url AS b_linkedin,
      b.industry AS b_industry, b.size AS b_size,
      COALESCE(cb.cnt, 0) AS b_count
    FROM ${companies} a
    JOIN ${companies} b
      ON a.id < b.id
      AND LENGTH(a.name) >= 4
      AND LENGTH(b.name) >= 4
      AND (
        LOWER(b.name) LIKE '%' || LOWER(a.name) || '%'
        OR LOWER(a.name) LIKE '%' || LOWER(b.name) || '%'
      )
    LEFT JOIN company_counts ca ON ca.company_id = a.id
    LEFT JOIN company_counts cb ON cb.company_id = b.id
    ORDER BY LENGTH(a.name) + LENGTH(b.name)
    LIMIT 100
  `);

  return result.rows.map((r) => ({
    a: { id: r.a_id, name: r.a_name, linkedinUrl: r.a_linkedin, industry: r.a_industry, size: r.a_size, peopleCount: r.a_count },
    b: { id: r.b_id, name: r.b_name, linkedinUrl: r.b_linkedin, industry: r.b_industry, size: r.b_size, peopleCount: r.b_count },
    reason: r.a_name.toLowerCase().length < r.b_name.toLowerCase().length
      ? `"${r.a_name}" está contido em "${r.b_name}"`
      : `"${r.b_name}" está contido em "${r.a_name}"`,
  }));
}

async function findDuplicatePeople(): Promise<DuplicatePersonPair[]> {
  // Pares com mesmo name (case-insensitive trim).
  const result = await db.execute<{
    a_id: string; a_name: string; a_email: string | null; a_job: string | null; a_company: string | null;
    b_id: string; b_name: string; b_email: string | null; b_job: string | null; b_company: string | null;
  }>(sql`
    SELECT
      a.id AS a_id, a.name AS a_name, a.email AS a_email, a.job_title AS a_job,
      ca.name AS a_company,
      b.id AS b_id, b.name AS b_name, b.email AS b_email, b.job_title AS b_job,
      cb.name AS b_company
    FROM ${people} a
    JOIN ${people} b
      ON a.id < b.id
      AND LOWER(TRIM(a.name)) = LOWER(TRIM(b.name))
      AND LENGTH(TRIM(a.name)) >= 6
    LEFT JOIN ${companies} ca ON a.company_id = ca.id
    LEFT JOIN ${companies} cb ON b.company_id = cb.id
    WHERE a.archived = false AND a.merged_into_id IS NULL
      AND b.archived = false AND b.merged_into_id IS NULL
    LIMIT 100
  `);

  return result.rows.map((r) => ({
    a: { id: r.a_id, name: r.a_name, email: r.a_email, jobTitle: r.a_job, companyName: r.a_company },
    b: { id: r.b_id, name: r.b_name, email: r.b_email, jobTitle: r.b_job, companyName: r.b_company },
    reason: 'Mesmo nome',
  }));
}

export default async function DuplicatesPage() {
  const [companyPairs, personPairs] = await Promise.all([
    findDuplicateCompanies(),
    findDuplicatePeople(),
  ]);

  return (
    <div style={{ maxWidth: 980 }}>
      <div style={{ marginBottom: 18 }}>
        <Link href="/internal/crm" className="crm-btn">← Voltar pro CRM</Link>
      </div>

      <h1 style={{ fontFamily: 'var(--font-headline)', fontWeight: 900, fontSize: 28, color: '#5E2A67', marginBottom: 8 }}>
        🔁 Duplicados (sugestões)
      </h1>
      <p style={{ fontSize: 13, color: '#6B5B8A', marginBottom: 24, lineHeight: 1.5, maxWidth: 700 }}>
        Pares onde o algoritmo suspeita que são a mesma entidade mas não foi confiante o suficiente
        pra mesclar automaticamente. Revise cada par e decida: mesclar (fica como uma só) ou marcar como
        diferentes (esconde dessa lista).
      </p>

      <DuplicatesList
        companyPairs={companyPairs}
        personPairs={personPairs}
      />
    </div>
  );
}
