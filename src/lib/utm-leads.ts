/**
 * Leads atribuídos por UTM (granularidade content + term).
 *
 * GA4 conta sessões. Esse módulo conta LEADS — pessoas distintas que
 * preencheram um form da campanha. Atribuição é first-touch DENTRO da
 * campanha: pra cada pessoa, olha a primeira activity `form_submit_*`
 * cujo `data.utms.campaign` casa, e atribui o lead àquele combo de
 * source/medium/content/term.
 *
 * Por que first-touch DENTRO da campanha:
 *   Uma pessoa pode ter sido "captada" por um post de comentário (cm)
 *   e voltar dias depois por um DM (dm). Atribuímos ao primeiro contato
 *   que efetivamente virou submit — consistente com o card de campanha
 *   que usa `people.firstTouchCampaign`.
 *
 * Use junto com `analyticsKey()` pra indexar o resultado e cruzar com
 * cada UtmLinkCard.
 */

import { sql } from 'drizzle-orm';
import { db } from '@/db';
import { analyticsKey } from './ga4-utm-analytics';

/**
 * Conta leads únicos por combinação completa de UTM dentro de uma campanha.
 *
 * Retorna `Map<analyticsKey, number>`. Chaves ausentes = zero leads
 * atribuídos àquele combo.
 *
 * @param utmCampaign — valor exato salvo em `data.utms.campaign` (slug-ado)
 */
export async function getLeadsByUtm(utmCampaign: string): Promise<Map<string, number>> {
  const rows = await db.execute<{
    source: string | null;
    medium: string | null;
    content: string | null;
    term: string | null;
    n: number;
  }>(sql`
    WITH first_per_person AS (
      SELECT DISTINCT ON (person_id)
        person_id,
        data->'utms'->>'source'  AS source,
        data->'utms'->>'medium'  AS medium,
        data->'utms'->>'content' AS content,
        data->'utms'->>'term'    AS term
      FROM activities
      WHERE type LIKE 'form_submit_%'
        AND data->'utms'->>'campaign' = ${utmCampaign}
        AND person_id IS NOT NULL
      ORDER BY person_id, created_at ASC
    )
    SELECT
      source,
      medium,
      content,
      term,
      COUNT(*)::int AS n
    FROM first_per_person
    GROUP BY source, medium, content, term
  `);

  const out = new Map<string, number>();
  for (const row of rows.rows) {
    const key = analyticsKey(
      row.source ?? '',
      row.medium ?? '',
      utmCampaign,
      row.content,
      row.term,
    );
    out.set(key, Number(row.n));
  }
  return out;
}
