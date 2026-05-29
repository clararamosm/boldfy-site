/**
 * Seletores resilientes pra páginas de pessoa (/in/<slug>).
 *
 * Múltiplos fallbacks por campo. Reportam telemetria quando todos falham.
 * Atualizar quando LinkedIn mudar DOM (dashboard de telemetria avisa).
 */

import { trySelectors, trySelectorsSync, canonicalizeLinkedinUrl, extractJobTitleFromHeadline, extractCompanyNameFromHeadline } from './utils';

const URL_PATTERN = '/in/<slug>';

export async function extractPersonPayload(): Promise<{
  name: string;
  linkedinUrl: string;
  headline?: string;
  jobTitle?: string;
  companyName?: string;
  photoUrl?: string;
  location?: string;
  about?: string;
  experience?: Array<{ title: string; company: string; period?: string }>;
  education?: { school: string; degree?: string; year?: string };
  connectionsCount?: string;
  capturedAt: string;
  sourceUrl: string;
} | null> {
  const linkedinUrl = canonicalizeLinkedinUrl(window.location.href);

  const name = await trySelectors({
    field: 'name',
    page_type: 'person',
    url_pattern: URL_PATTERN,
    selectors: [
      'main h1.text-heading-xlarge',
      'main h1.inline.t-24',
      'main section h1',
      'main h1',
    ],
  });
  if (!name) return null;

  const headline = await trySelectors({
    field: 'headline',
    page_type: 'person',
    url_pattern: URL_PATTERN,
    selectors: [
      'main .text-body-medium.break-words',
      'main .pv-text-details__title',
      'main section .text-body-medium',
    ],
  });

  const photoUrl =
    (await trySelectors({
      field: 'photo_url',
      page_type: 'person',
      url_pattern: URL_PATTERN,
      attr: 'src',
      selectors: [
        'main button[aria-label*="foto"] img',
        'main img.pv-top-card-profile-picture__image',
        'main img[alt*="foto"]',
      ],
    })) ?? undefined;

  const location =
    (await trySelectors({
      field: 'location',
      page_type: 'person',
      url_pattern: URL_PATTERN,
      selectors: [
        'main .text-body-small.inline.t-black--light.break-words',
        'main .pv-text-details__left-panel .text-body-small',
      ],
    })) ?? undefined;

  const about =
    trySelectorsSync([
      'section[data-section="about"] div.display-flex.full-width span[aria-hidden="true"]',
      'section.pv-about-section div.inline-show-more-text span[aria-hidden="true"]',
    ]) ?? undefined;

  const connectionsCount =
    trySelectorsSync([
      'main a[href*="/connections/"] span',
      'main span:has(> .t-black--light):contains("conex")',
    ]) ?? undefined;

  // Experience top 3 — heurística: cards dentro da seção "Experience"
  const experience = extractExperienceTop3();

  // Education top 1 — primeiro card dentro da seção "Education"
  const education = extractEducationTop1();

  const jobTitle = extractJobTitleFromHeadline(headline);
  const companyName = extractCompanyNameFromHeadline(headline);

  return {
    name,
    linkedinUrl,
    headline: headline ?? undefined,
    jobTitle,
    companyName,
    photoUrl,
    location,
    about,
    experience,
    education,
    connectionsCount,
    capturedAt: new Date().toISOString(),
    sourceUrl: window.location.href,
  };
}

function extractExperienceTop3(): Array<{ title: string; company: string; period?: string }> | undefined {
  // LinkedIn não tem data attribute estável; heurística por id de section
  const section =
    document.querySelector('#experience')?.parentElement ??
    document.querySelector('section[data-section="experience"]');
  if (!section) return undefined;
  const items = section.querySelectorAll('li.artdeco-list__item');
  const out: Array<{ title: string; company: string; period?: string }> = [];
  items.forEach((li, i) => {
    if (i >= 3) return;
    const title = li.querySelector('span[aria-hidden="true"]')?.textContent?.trim();
    const subspans = li.querySelectorAll('span.t-14.t-normal span[aria-hidden="true"]');
    const company = subspans[0]?.textContent?.trim();
    const period = subspans[1]?.textContent?.trim();
    if (title && company) out.push({ title, company, period });
  });
  return out.length > 0 ? out : undefined;
}

function extractEducationTop1(): { school: string; degree?: string; year?: string } | undefined {
  const section =
    document.querySelector('#education')?.parentElement ??
    document.querySelector('section[data-section="education"]');
  if (!section) return undefined;
  const li = section.querySelector('li.artdeco-list__item');
  if (!li) return undefined;
  const school = li.querySelector('span[aria-hidden="true"]')?.textContent?.trim();
  const subspans = li.querySelectorAll('span.t-14.t-normal span[aria-hidden="true"]');
  const degree = subspans[0]?.textContent?.trim();
  const year = subspans[1]?.textContent?.trim();
  if (!school) return undefined;
  return { school, degree, year };
}
