/**
 * CRUD de Campanhas.
 *
 * Schema rico: cada campanha tem N canais, cada canal tem N touchpoints
 * (URL + label opcional). Suporta always-on (sem data de fim).
 */

import { db, campaigns, type CampaignRow } from '@/db';
import { eq, asc } from 'drizzle-orm';

export type CampaignStatus = 'planejada' | 'ativa' | 'encerrada' | 'always-on';

export type Touchpoint = { url: string; label?: string };
export type ChannelEntry = { name: string; touchpoints: Touchpoint[] };

export type Campaign = {
  id: string;
  slug: string;
  name: string;
  objective: string;
  utmCampaign: string;  // = slug (compat com a UI)
  startDate: string;    // YYYY-MM-DD
  endDate: string | null;  // null = always-on
  alwaysOn: boolean;
  channels: ChannelEntry[];
  notes?: string;
};

function rowToCampaign(r: CampaignRow): Campaign {
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    objective: r.objective,
    utmCampaign: r.slug,
    startDate: new Date(r.startDate).toISOString().split('T')[0],
    endDate: r.endDate ? new Date(r.endDate).toISOString().split('T')[0] : null,
    alwaysOn: r.alwaysOn,
    channels: (r.channels ?? []) as ChannelEntry[],
    notes: r.notes ?? undefined,
  };
}

/** Seed inicial — só roda se a tabela estiver vazia. */
async function seedIfEmpty(): Promise<void> {
  const existing = await db.select({ id: campaigns.id }).from(campaigns).limit(1);
  if (existing.length > 0) return;

  await db.insert(campaigns).values({
    slug: 'web-summit-rio-2026',
    name: 'Web Summit Rio 2026',
    objective: 'Posicionar Boldfy como o player de Employee Advocacy B2B no maior evento de tech LatAm. Gerar 50 leads qualificados + 10 reuniões pós-evento.',
    startDate: new Date('2026-05-01T00:00:00-03:00'),
    endDate: new Date('2026-06-15T23:59:59-03:00'),
    alwaysOn: false,
    channels: [
      { name: 'Eventos', touchpoints: [
        { url: 'https://www.boldfy.com.br/?utm_source=event&utm_medium=qr&utm_campaign=web-summit-rio-2026', label: 'QR code no stand' },
      ]},
      { name: 'LinkedIn', touchpoints: [
        { url: 'https://www.boldfy.com.br/agendar-demo?utm_source=linkedin&utm_medium=organic&utm_campaign=web-summit-rio-2026', label: 'Post anúncio' },
      ]},
      { name: 'PR', touchpoints: [] },
    ],
    notes: 'Pré-evento: cards QR no stand · LinkedIn ads pra atendentes confirmados · post-evento: cadência de nurturing 7d/14d/30d.',
  });
}

export async function listCampaigns(): Promise<Campaign[]> {
  try {
    await seedIfEmpty();
    const rows = await db.select().from(campaigns).orderBy(asc(campaigns.startDate));
    return rows.map(rowToCampaign);
  } catch (err) {
    console.error('[campaigns] listCampaigns error:', err);
    return [];
  }
}

export async function getCampaignBySlug(slug: string): Promise<Campaign | null> {
  try {
    const rows = await db.select().from(campaigns).where(eq(campaigns.slug, slug)).limit(1);
    return rows[0] ? rowToCampaign(rows[0]) : null;
  } catch {
    return null;
  }
}

export async function getCampaignById(id: string): Promise<Campaign | null> {
  try {
    const rows = await db.select().from(campaigns).where(eq(campaigns.id, id)).limit(1);
    return rows[0] ? rowToCampaign(rows[0]) : null;
  } catch {
    return null;
  }
}

export function getCampaignStatus(c: Campaign, now = new Date()): CampaignStatus {
  if (c.alwaysOn) return 'always-on';
  const start = new Date(`${c.startDate}T00:00:00`);
  if (now < start) return 'planejada';
  if (c.endDate) {
    const end = new Date(`${c.endDate}T23:59:59`);
    if (now > end) return 'encerrada';
  }
  return 'ativa';
}

/* -------------------------------------------------------------------------- */
/*  Mutations                                                                  */
/* -------------------------------------------------------------------------- */

export type CampaignInput = {
  slug: string;
  name: string;
  objective: string;
  startDate: string;       // YYYY-MM-DD
  endDate: string | null;  // null se alwaysOn
  alwaysOn: boolean;
  channels: ChannelEntry[];
  notes?: string;
};

function cleanSlug(raw: string): string {
  return raw.toLowerCase().trim()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function validateInput(input: CampaignInput): string | null {
  if (!input.name.trim()) return 'Nome obrigatório';
  if (!input.objective.trim()) return 'Objetivo obrigatório';
  if (!input.startDate) return 'Data de início obrigatória';
  if (!input.alwaysOn && !input.endDate) return 'Marque "always on" ou defina data de fim';
  return null;
}

function sanitizeChannels(channels: ChannelEntry[]): ChannelEntry[] {
  return channels
    .map((c) => ({
      name: c.name.trim(),
      touchpoints: (c.touchpoints ?? [])
        .filter((t) => t.url && t.url.trim())
        .map((t) => ({ url: t.url.trim(), label: t.label?.trim() || undefined })),
    }))
    .filter((c) => c.name);
}

export async function createCampaign(input: CampaignInput): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  try {
    const slug = cleanSlug(input.slug);
    if (!slug) return { ok: false, error: 'Slug inválido' };
    const err = validateInput(input);
    if (err) return { ok: false, error: err };

    const existing = await db.select({ id: campaigns.id }).from(campaigns).where(eq(campaigns.slug, slug)).limit(1);
    if (existing[0]) return { ok: false, error: `Já existe uma campanha com slug "${slug}"` };

    const [row] = await db.insert(campaigns).values({
      slug,
      name: input.name.trim(),
      objective: input.objective.trim(),
      startDate: new Date(`${input.startDate}T00:00:00-03:00`),
      endDate: input.alwaysOn || !input.endDate ? null : new Date(`${input.endDate}T23:59:59-03:00`),
      alwaysOn: input.alwaysOn,
      channels: sanitizeChannels(input.channels),
      notes: input.notes?.trim() || null,
    }).returning({ id: campaigns.id });

    return { ok: true, id: row.id };
  } catch (err) {
    console.error('[campaigns] createCampaign error:', err);
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function updateCampaign(id: string, input: CampaignInput): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const slug = cleanSlug(input.slug);
    if (!slug) return { ok: false, error: 'Slug inválido' };
    const err = validateInput(input);
    if (err) return { ok: false, error: err };

    // Slug pode mudar — confere se conflita com outra campanha
    const conflict = await db.select({ id: campaigns.id }).from(campaigns).where(eq(campaigns.slug, slug)).limit(1);
    if (conflict[0] && conflict[0].id !== id) {
      return { ok: false, error: `Slug "${slug}" já é usado por outra campanha` };
    }

    await db.update(campaigns).set({
      slug,
      name: input.name.trim(),
      objective: input.objective.trim(),
      startDate: new Date(`${input.startDate}T00:00:00-03:00`),
      endDate: input.alwaysOn || !input.endDate ? null : new Date(`${input.endDate}T23:59:59-03:00`),
      alwaysOn: input.alwaysOn,
      channels: sanitizeChannels(input.channels),
      notes: input.notes?.trim() || null,
      updatedAt: new Date(),
    }).where(eq(campaigns.id, id));

    return { ok: true };
  } catch (err) {
    console.error('[campaigns] updateCampaign error:', err);
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function deleteCampaign(id: string): Promise<{ ok: boolean; error?: string }> {
  try {
    await db.delete(campaigns).where(eq(campaigns.id, id));
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
