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
 * Hook that captures UTM parameters from the URL and persists them
 * in sessionStorage for the duration of the visit.
 *
 * Returns the UTM params object (empty if none present).
 */
export function useUtmParams(): UtmParams {
  const [utms, setUtms] = useState<UtmParams>({});

  useEffect(() => {
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

    if (hasUtm) {
      // Fresh UTMs from URL override stored ones
      saveToStorage(fromUrl);
      setUtms(fromUrl);
    } else {
      // No UTMs in URL — try sessionStorage
      const stored = readFromStorage();
      setUtms(stored);
    }
  }, []);

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
