/**
 * Atribuição de evento/campanha — resolve a tag "Evento: X" e a membership
 * local a partir do utm_campaign de um toque.
 *
 * Usado em dois pontos:
 *  - recordLeadFromForm (captura online): UTM do submit dispara a tag.
 *  - import-leads (captura offline): a campanha escolhida no import dispara.
 *
 * A tag de evento vive no AC; o CRM espelha a membership em
 * people.campaign_memberships (append-only) pra conseguir filtrar/contar sem
 * consultar o AC em tempo real.
 */

import { db, campaigns } from '@/db';
import { eq } from 'drizzle-orm';

// Tag de evento aplicada no AC. Usa o override `acTag` da campanha se existir;
// senão deriva "Evento: {name}" (prefixo consistente pra agrupar eventos).
export function eventTagForCampaign(c: { name: string; acTag: string | null }): string {
  const override = c.acTag?.trim();
  return override && override.length > 0 ? override : `Evento: ${c.name}`;
}

export type CampaignAttribution = {
  slug: string;
  name: string;
  eventTag: string;
};

// Resolve a campanha a partir do utm_campaign (== slug). Retorna null quando
// não há campanha cadastrada com aquele slug OU quando ela não está marcada
// como evento (`is_event`). Campanha de material (Case, Report) não é evento,
// então não gera tag nem membership — segue o fluxo normal só com a tag de form.
export async function getCampaignAttributionBySlug(
  slug: string | null | undefined,
): Promise<CampaignAttribution | null> {
  const s = slug?.trim();
  if (!s) return null;
  try {
    const rows = await db
      .select({ slug: campaigns.slug, name: campaigns.name, acTag: campaigns.acTag, isEvent: campaigns.isEvent })
      .from(campaigns)
      .where(eq(campaigns.slug, s))
      .limit(1);
    if (rows.length === 0) return null;
    const c = rows[0];
    if (!c.isEvent) return null;
    return { slug: c.slug, name: c.name, eventTag: eventTagForCampaign(c) };
  } catch (err) {
    console.error('[events] getCampaignAttributionBySlug failed:', err);
    return null;
  }
}
