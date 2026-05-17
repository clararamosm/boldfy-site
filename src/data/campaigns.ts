/**
 * Catálogo de campanhas — hardcoded por enquanto (conforme spec dashboard-revamp-v2:
 * "sem schema novo de OKRs/metas, campanhas começam aqui em código").
 *
 * Quando virar necessidade ter UI de CRUD, mover pra tabela `campaigns` no schema.
 */

export type CampaignStatus = 'planejada' | 'ativa' | 'encerrada';

export type Campaign = {
  slug: string;
  name: string;
  objective: string;          // 1 linha
  utmCampaign: string;        // valor exato em utm_campaign
  startDate: string;          // YYYY-MM-DD
  endDate: string;            // YYYY-MM-DD
  channels: string[];         // ['SEO', 'LinkedIn', 'Mídia', 'Eventos']
  shortlinks?: string[];      // códigos /l/<code> vinculados (opcional)
  notes?: string;
};

export const CAMPAIGNS: Campaign[] = [
  {
    slug: 'web-summit-rio-2026',
    name: 'Web Summit Rio 2026',
    objective: 'Posicionar Boldfy como o player de Employee Advocacy B2B no maior evento de tech LatAm. Gerar 50 leads qualificados + 10 reuniões pós-evento.',
    utmCampaign: 'web-summit-rio-2026',
    startDate: '2026-05-01',
    endDate: '2026-06-15',
    channels: ['Eventos', 'LinkedIn', 'PR'],
    shortlinks: ['ws-card', 'ws-keynote', 'ws-stand'],
    notes: 'Pré-evento: cards QR no stand · LinkedIn ads pra atendentes confirmados · post-evento: cadência de nurturing 7d/14d/30d.',
  },
];

export function getCampaignBySlug(slug: string): Campaign | undefined {
  return CAMPAIGNS.find((c) => c.slug === slug);
}

export function getCampaignStatus(c: Campaign, now = new Date()): CampaignStatus {
  const start = new Date(`${c.startDate}T00:00:00`);
  const end = new Date(`${c.endDate}T23:59:59`);
  if (now < start) return 'planejada';
  if (now > end) return 'encerrada';
  return 'ativa';
}
