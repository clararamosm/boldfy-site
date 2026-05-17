/**
 * Helpers do UTM Generator.
 *
 * Porto da lógica do HTML legado (cowork-artifacts/utm-generator-boldfy.html)
 * pra ter num lugar só e poder usar tanto server quanto client.
 *
 * Funções:
 *   - slug(str): normaliza pra utm-safe (lowercase, sem acento, kebab-case)
 *   - buildUtmUrl(input): monta URL completa com query params
 *   - inferMedium(source): adivinha medium a partir do source (linkedin → social, etc)
 *   - parseSourceFromText(str): parse fuzzy de descrição livre pra source
 */

export type UtmInput = {
  baseUrl: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmContent?: string;
  utmTerm?: string;
};

/**
 * Normaliza string pra valor utm-safe:
 *   - lowercase
 *   - remove acentos
 *   - troca tudo não-alfa-num por hífen
 *   - colapsa hífens repetidos
 *   - trim hífens das pontas
 */
export function slug(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Monta URL completa com UTM params. Slug-ifica os valores automaticamente.
 * Throws se baseUrl é inválida.
 */
export function buildUtmUrl(input: UtmInput): string {
  const url = new URL(input.baseUrl);
  // Limpa qualquer UTM existente na baseUrl pra evitar duplicação
  ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach((k) =>
    url.searchParams.delete(k),
  );

  url.searchParams.set('utm_source', slug(input.utmSource));
  url.searchParams.set('utm_medium', slug(input.utmMedium));
  url.searchParams.set('utm_campaign', slug(input.utmCampaign));
  if (input.utmContent && input.utmContent.trim().length > 0) {
    url.searchParams.set('utm_content', slug(input.utmContent));
  }
  if (input.utmTerm && input.utmTerm.trim().length > 0) {
    url.searchParams.set('utm_term', slug(input.utmTerm));
  }
  return url.toString();
}

/**
 * Adivinha medium baseado em source. Cobre os canais mais comuns que a Boldfy usa.
 */
export function inferMedium(source: string): string | null {
  const s = slug(source);
  if (!s) return null;
  if (['linkedin', 'instagram', 'facebook', 'tiktok', 'youtube', 'twitter', 'x'].includes(s)) return 'social';
  if (['google', 'bing', 'duckduckgo'].includes(s)) return 'cpc';
  if (['email', 'newsletter', 'mailchimp', 'activecampaign', 'sendgrid'].includes(s)) return 'email';
  if (['whatsapp', 'telegram', 'slack', 'discord'].includes(s)) return 'social';
  if (['github', 'producthunt'].includes(s)) return 'referral';
  return null;
}

/**
 * Sources sugeridos pro autocomplete (datalist).
 */
export const COMMON_SOURCES = [
  'linkedin',
  'instagram',
  'facebook',
  'tiktok',
  'youtube',
  'twitter',
  'google',
  'bing',
  'email',
  'newsletter',
  'whatsapp',
  'telegram',
  'github',
  'producthunt',
  'referral',
  'direct',
];

export const COMMON_MEDIUMS = [
  'organic',
  'paid',
  'cpc',
  'social',
  'email',
  'referral',
  'display',
  'video',
  'affiliate',
];

/**
 * Páginas internas comuns da Boldfy (autocomplete do baseUrl).
 */
export const COMMON_PAGES = [
  { url: 'https://boldfy.com.br/', label: 'Home' },
  { url: 'https://boldfy.com.br/algoritmo-linkedin', label: 'LP Algoritmo LinkedIn' },
  { url: 'https://boldfy.com.br/solucoes/software-as-a-service', label: 'Solução SaaS' },
  { url: 'https://boldfy.com.br/solucoes/content-full-service', label: 'Solução Content' },
  { url: 'https://boldfy.com.br/solucoes/design-on-demand', label: 'Solução Design' },
  { url: 'https://boldfy.com.br/precos', label: 'Preços' },
  { url: 'https://boldfy.com.br/agendar-demo', label: 'Agendar Demo' },
  { url: 'https://boldfy.com.br/para/marketing', label: 'Para Marketing' },
  { url: 'https://boldfy.com.br/blog', label: 'Blog' },
];
