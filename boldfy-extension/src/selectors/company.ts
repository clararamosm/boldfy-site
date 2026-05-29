/**
 * Extrator da página de empresa LinkedIn (/company/<slug>).
 *
 * Mesma estratégia do person.ts: classes são hashed, então parseia por
 * texto + heurística semântica.
 */

import { EXTENSION_VERSION } from '../config';
import { reportFieldMissing } from '../api/client';
import { canonicalizeLinkedinUrl } from './utils';

const URL_PATTERN = '/company/<slug>';

function reportMissing(field: string, selectors_tried: string[]) {
  void reportFieldMissing({
    field,
    page_type: 'company',
    selectors_tried,
    url_pattern: URL_PATTERN,
    extension_version: EXTENSION_VERSION,
    captured_at: new Date().toISOString(),
  }).catch(() => { /* silencioso */ });
}

export async function extractCompanyPayload(): Promise<{
  name: string;
  linkedinUrl: string;
  industry?: string;
  size?: string;
  description?: string;
  website?: string;
  specialties?: string[];
  /** Logo da empresa no LinkedIn CDN. Renderizado no card de empresa do CRM. */
  logoUrl?: string;
  capturedAt: string;
  sourceUrl: string;
} | null> {
  const linkedinUrl = canonicalizeLinkedinUrl(window.location.href);

  // ---- NOME via title ("Nome da Empresa | LinkedIn") ----
  const name = extractNameFromTitle();
  if (!name) {
    reportMissing('name', ['document.title']);
    return null;
  }

  // ---- TEXTO DO MAIN ----
  const main = document.querySelector('main');
  const mainText = main?.innerText ?? '';
  const mainLines = mainText.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);

  // ---- WEBSITE ----
  // Link externo (com data-tracking ou simplesmente href fora do linkedin.com)
  let website: string | undefined;
  const links = Array.from(document.querySelectorAll('main a[href]'));
  for (const a of links) {
    const href = a.getAttribute('href') ?? '';
    if (/^https?:\/\//i.test(href) && !/linkedin\.com|licdn\.com/i.test(href)) {
      // Heurística: ignora links genéricos como Twitter, Instagram da empresa? Por enquanto pega o primeiro
      website = href;
      break;
    }
  }

  // ---- INDÚSTRIA / TAMANHO / DESCRIÇÃO ----
  // LinkedIn novo mostra essas infos na "Visão geral" / "About" da empresa.
  // Heurística: procurar linhas que casem com padrões conhecidos.
  let industry: string | undefined;
  let size: string | undefined;
  let description: string | undefined;
  let specialties: string[] | undefined;

  // Range de funcionários: "11-50 funcionários", "501-1000 employees", etc.
  for (const l of mainLines) {
    if (!size && /(\d+[-–]\d+|\d+\+|mais de \d+)\s*(funcion|employee|colaborador)/i.test(l)) {
      size = l.match(/(\d+[-–]\d+|\d+\+|mais de \d+)/i)?.[0];
    }
  }

  // Description: primeiro parágrafo grande na seção Sobre.
  const aboutIdx = mainLines.findIndex((l) => /^(Sobre|About|Visão geral)$/i.test(l));
  if (aboutIdx >= 0) {
    for (let i = aboutIdx + 1; i < Math.min(aboutIdx + 5, mainLines.length); i++) {
      const l = mainLines[i];
      if (l.length > 60) { description = l.slice(0, 3000); break; }
    }
  }

  // Indústria: aparece como label seguido de valor, ou inline. Heurística rudimentar.
  for (let i = 0; i < mainLines.length; i++) {
    if (/^(Setor|Indústria|Industry)$/i.test(mainLines[i]) && mainLines[i + 1]) {
      industry = mainLines[i + 1];
      break;
    }
  }
  // Fallback: tem casos onde o setor vem inline em texto curto antes do "Site"
  if (!industry) {
    for (const l of mainLines) {
      // Heurística: linha curta, sem dígitos, antes de "Site" ou "Tamanho"
      if (l.length < 60 && /^[A-Za-zÀ-ú\s,&-]+$/.test(l) && /software|consultoria|marketing|tecnologia|saúde|educação|finanças/i.test(l)) {
        industry = l;
        break;
      }
    }
  }

  // Specialties: linha "Especialidades" → linha seguinte vírgula-separada
  for (let i = 0; i < mainLines.length - 1; i++) {
    if (/^(Especialidades|Specialties)$/i.test(mainLines[i])) {
      specialties = mainLines[i + 1]
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
        .slice(0, 50);
      break;
    }
  }

  // ---- LOGO ----
  // Mesma estratégia da foto de pessoa: filtra por tamanho pra não pegar
  // mini-logos de empresas relacionadas na sidebar.
  let logoUrl: string | undefined;
  const logoCandidates = Array.from(document.querySelectorAll('img'))
    .filter((img) => /company-logo/i.test(img.src) && /licdn\.com/i.test(img.src))
    .filter((img) => img.width >= 80);
  if (logoCandidates.length > 0) {
    let src = logoCandidates[0].src;
    src = src.replace('_100_100', '_200_200');
    logoUrl = src;
  }

  return {
    name,
    linkedinUrl,
    industry,
    size,
    description,
    website,
    specialties,
    logoUrl,
    capturedAt: new Date().toISOString(),
    sourceUrl: window.location.href,
  };
}

function extractNameFromTitle(): string | null {
  const title = document.title?.trim();
  if (!title) return null;
  const cleaned = title.replace(/^\(\d+\)\s*/, '');
  const idx = cleaned.lastIndexOf(' | LinkedIn');
  const name = idx > 0 ? cleaned.slice(0, idx).trim() : cleaned.replace(/\s*\|\s*LinkedIn\s*$/i, '').trim();
  return name.length > 0 && name.length < 200 ? name : null;
}
