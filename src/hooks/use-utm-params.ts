'use client';

import { useEffect, useState } from 'react';

/**
 * UTM parameters captured from the URL query string.
 *
 * On first visit with UTMs, values are saved to sessionStorage so they
 * persist across page navigations within the same session.
 *
 * Supported params: utm_source, utm_medium, utm_campaign, utm_content, utm_term
 */

export type UtmParams = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
};

const UTM_KEYS: (keyof UtmParams)[] = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
];

const STORAGE_KEY = 'boldfy_utm';

function readFromStorage(): UtmParams {
  if (typeof window === 'undefined') return {};
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as UtmParams) : {};
  } catch {
    return {};
  }
}

function saveToStorage(params: UtmParams) {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(params));
  } catch {
    // sessionStorage unavailable — ignore
  }
}

/**
 * Lê UTMs da URL atual; se não houver, cai para sessionStorage.
 * Roda apenas no client (retorna {} no servidor).
 */
function computeInitialUtms(): UtmParams {
  if (typeof window === 'undefined') return {};

  const url = new URL(window.location.href);
  const fromUrl: UtmParams = {};
  let hasUtm = false;

  for (const key of UTM_KEYS) {
    const value = url.searchParams.get(key);
    if (value) {
      fromUrl[key] = value;
      hasUtm = true;
    }
  }

  // UTMs frescos da URL têm prioridade sobre o storage
  return hasUtm ? fromUrl : readFromStorage();
}

/**
 * Hook que captura UTM parameters da URL e persiste em sessionStorage
 * pela duração da visita. Returna {} se não houver UTMs.
 *
 * Implementação evita setState dentro de useEffect (anti-pattern do
 * React 19) usando lazy initializer no useState. O efeito colateral de
 * salvar no storage fica num useEffect separado (idempotente).
 */
export function useUtmParams(): UtmParams {
  const [utms] = useState<UtmParams>(computeInitialUtms);

  useEffect(() => {
    // Só persiste se vieram UTMs novos da URL (storage já tem os antigos)
    if (Object.keys(utms).length > 0) {
      saveToStorage(utms);
    }
  }, [utms]);

  return utms;
}

/**
 * Utility: format UTM params as tags for ActiveCampaign.
 * e.g. { utm_source: 'linkedin', utm_campaign: 'rh-q2' }
 *   → ['utm:linkedin', 'campanha:rh-q2']
 */
export function utmsToTags(utms: UtmParams): string[] {
  const tags: string[] = [];
  if (utms.utm_source) tags.push(`utm:${utms.utm_source}`);
  if (utms.utm_medium) tags.push(`meio:${utms.utm_medium}`);
  if (utms.utm_campaign) tags.push(`campanha:${utms.utm_campaign}`);
  if (utms.utm_content) tags.push(`conteudo:${utms.utm_content}`);
  if (utms.utm_term) tags.push(`termo:${utms.utm_term}`);
  return tags;
}
