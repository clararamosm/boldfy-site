/**
 * Config global da extensão.
 *
 * `API_BASE` aponta pra produção por default. Pra dev local, troca pra
 * 'http://localhost:3000' aqui e rebuild — extensão respeita o que está
 * compilado no bundle.
 */

export const EXTENSION_VERSION = '0.1.0';

export const API_BASE = 'https://www.boldfy.com.br';

/** Limite client-side de capturas por dia (proteção contra ban LinkedIn). */
export const DAILY_CAPTURE_LIMIT = 50;

/** Debounce entre cliques no botão de captura. */
export const CLICK_DEBOUNCE_MS = 800;
