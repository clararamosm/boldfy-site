/**
 * Extrator do perfil LinkedIn (/in/<slug>).
 *
 * Estratégia (mai/2026 — LinkedIn redesenhou tudo com classes hashed):
 *  - Nome: `document.title` ("Nome | LinkedIn")
 *  - Headline + Location: parsing por linhas do `main.innerText`
 *  - Foto: `img[src*="profile-displayphoto"]` (CDN estável)
 *  - URL canonical: window.location
 *
 * Classes do LinkedIn novo são hashes (`_0d046cac`, `a550bd36`) que mudam
 * a cada deploy. Resistência depende de parsing semântico, não DOM lookup.
 *
 * Quando algo falhar, telemetria via reportFieldMissing — dashboard
 * `/internal/crm/settings/extension-telemetry` sinaliza.
 */

import { EXTENSION_VERSION } from '../config';
import { reportFieldMissing } from '../api/client';
import { canonicalizeLinkedinUrl, extractJobTitleFromHeadline, extractCompanyNameFromHeadline } from './utils';

const URL_PATTERN = '/in/<slug>';

function reportMissing(field: string, selectors_tried: string[]) {
  void reportFieldMissing({
    field,
    page_type: 'person',
    selectors_tried,
    url_pattern: URL_PATTERN,
    extension_version: EXTENSION_VERSION,
    captured_at: new Date().toISOString(),
  }).catch(() => { /* silencioso */ });
}

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

  // ---- NOME via document.title (formato "Nome | LinkedIn") ----
  const name = extractNameFromTitle();
  if (!name) {
    reportMissing('name', ['document.title.split(" | ")[0]']);
    return null;
  }

  // ---- TEXTO DO MAIN ----
  const main = document.querySelector('main');
  const mainLines = (main?.innerText ?? '')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  // Acha índice do nome dentro do main pra ancorar parsing
  const nameIdx = mainLines.findIndex((l) => l === name);

  // ---- HEADLINE ----
  // Costuma vir 2-3 linhas depois do nome. Pula linhas que são só "· 1º", etc.
  let headline: string | undefined;
  if (nameIdx >= 0) {
    for (let i = nameIdx + 1; i < Math.min(nameIdx + 5, mainLines.length); i++) {
      const l = mainLines[i];
      if (l.length < 4 || /^[·•]/.test(l) || /^\d+[ºo°]/.test(l)) continue;
      headline = l;
      break;
    }
  }
  if (!headline) reportMissing('headline', ['mainText parse after name']);

  // ---- LOCATION ----
  // Formato comum: "City, State, Country" (PT-BR ou similar)
  // Aparece logo depois da headline.
  let location: string | undefined;
  if (nameIdx >= 0 && headline) {
    const headlineIdx = mainLines.indexOf(headline);
    for (let i = headlineIdx + 1; i < Math.min(headlineIdx + 4, mainLines.length); i++) {
      const l = mainLines[i];
      // Heurística: 1-3 vírgulas, sem palavras tipo "seguidores", "conexões", etc.
      const commas = (l.match(/,/g) ?? []).length;
      if (commas >= 1 && commas <= 3 && !/seguidor|conex|message|mensagem|dados de contato/i.test(l)) {
        location = l;
        break;
      }
    }
  }

  // ---- FOTO ----
  // LinkedIn CDN tem URL estável que contém 'profile-displayphoto'
  let photoUrl: string | undefined;
  const photoCandidates = Array.from(document.querySelectorAll('img'))
    .map((img) => img.src)
    .filter((src) => /profile-displayphoto/i.test(src) && /licdn\.com/i.test(src));
  if (photoCandidates.length > 0) {
    // Pega a maior resolução disponível (geralmente a primeira ou a com _200_200 em vez de _100_100)
    photoUrl = photoCandidates.find((s) => /_200_200/.test(s))
      ?? photoCandidates.find((s) => /_400_400/.test(s))
      ?? photoCandidates[0];
  } else {
    reportMissing('photo_url', ['img[src*="profile-displayphoto"]']);
  }

  // ---- ABOUT ----
  // Seção "Sobre" — heurística: primeiras linhas substanciais depois do marker "Sobre"
  let about: string | undefined;
  const aboutIdx = mainLines.findIndex((l) => l === 'Sobre' || l === 'About');
  if (aboutIdx >= 0) {
    const aboutLines: string[] = [];
    for (let i = aboutIdx + 1; i < Math.min(aboutIdx + 8, mainLines.length); i++) {
      const l = mainLines[i];
      // Para quando bater em headers/CTAs de próxima section
      if (/^(Experiência|Experience|Formação|Education|Habilidades|Skills|Atividade|Activity|Destaques)$/i.test(l)) break;
      if (/^(\.\.\. mais|mais|See more|… more)$/i.test(l)) continue;
      aboutLines.push(l);
    }
    if (aboutLines.length > 0) {
      about = aboutLines.join('\n').slice(0, 3000);
    }
  }

  // ---- CONNECTIONS COUNT ----
  // Heurística por texto: linha tipo "Mais de 500 conexões" / "500+ connections"
  const connectionsCount = mainLines
    .find((l) => /^(mais de|over|≈)?\s*\d+\+?\s*(conex|connection)/i.test(l));

  // ---- HEADLINE PARSING → jobTitle / companyName ----
  const jobTitle = extractJobTitleFromHeadline(headline);
  const companyName = extractCompanyNameFromHeadline(headline);

  return {
    name,
    linkedinUrl,
    headline,
    jobTitle,
    companyName,
    photoUrl,
    location,
    about,
    connectionsCount,
    capturedAt: new Date().toISOString(),
    sourceUrl: window.location.href,
  };
}

function extractNameFromTitle(): string | null {
  const title = document.title?.trim();
  if (!title) return null;
  // Formatos comuns: "Nome | LinkedIn", "(N) Nome | LinkedIn", "Nome – Sobrenome | LinkedIn"
  // Remove badges de notificação "(3)" no início
  const cleaned = title.replace(/^\(\d+\)\s*/, '');
  // Divide por " | LinkedIn"
  const idx = cleaned.lastIndexOf(' | LinkedIn');
  const name = idx > 0 ? cleaned.slice(0, idx).trim() : cleaned.replace(/\s*\|\s*LinkedIn\s*$/i, '').trim();
  return name.length > 0 && name.length < 200 ? name : null;
}
