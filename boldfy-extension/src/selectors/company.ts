/**
 * Seletores resilientes pra páginas de empresa (/company/<slug>).
 *
 * Lista enxuta de 7 campos (Spec §6).
 */

import { trySelectors, trySelectorsSync, canonicalizeLinkedinUrl } from './utils';

const URL_PATTERN = '/company/<slug>';

export async function extractCompanyPayload(): Promise<{
  name: string;
  linkedinUrl: string;
  industry?: string;
  size?: string;
  description?: string;
  website?: string;
  specialties?: string[];
  capturedAt: string;
  sourceUrl: string;
} | null> {
  const linkedinUrl = canonicalizeLinkedinUrl(window.location.href);

  const name = await trySelectors({
    field: 'name',
    page_type: 'company',
    url_pattern: URL_PATTERN,
    selectors: [
      'main h1.org-top-card-summary__title',
      'main section h1',
      'main h1',
    ],
  });
  if (!name) return null;

  const industry =
    (await trySelectors({
      field: 'industry',
      page_type: 'company',
      url_pattern: URL_PATTERN,
      selectors: [
        'main .org-top-card-summary-info-list__info-item',
        'main dd:has(+ dt:contains("Industry"))',
      ],
    })) ?? undefined;

  const size =
    trySelectorsSync([
      'main dd:has(+ dt:contains("size"))',
      'main .org-page-details__definition-text:contains("employees")',
    ]) ?? undefined;

  const description =
    trySelectorsSync([
      'main section.org-about-us-organization-description p',
      'section.artdeco-card p.break-words',
    ]) ?? undefined;

  const website =
    trySelectorsSync(
      ['main a[data-tracking-control-name="about_website"]', 'main a.org-about-us-company-module__website'],
      document,
      'href',
    ) ?? undefined;

  // Specialties — lista de tags. Heurística: dt com texto "Specialties" → dd com lista
  const specialties = extractSpecialties();

  return {
    name,
    linkedinUrl,
    industry,
    size,
    description,
    website,
    specialties,
    capturedAt: new Date().toISOString(),
    sourceUrl: window.location.href,
  };
}

function extractSpecialties(): string[] | undefined {
  // LinkedIn renderiza specialties como texto separado por vírgulas dentro de dd
  const dt = Array.from(document.querySelectorAll('main dt')).find((el) =>
    el.textContent?.toLowerCase().includes('specialties'),
  );
  const dd = dt?.nextElementSibling;
  const text = dd?.textContent?.trim();
  if (!text) return undefined;
  const list = text
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  return list.length > 0 ? list.slice(0, 50) : undefined;
}
