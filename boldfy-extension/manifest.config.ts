/**
 * Manifest MV3 da extensão Chrome Boldfy.
 *
 * Permissions:
 *   - storage: chrome.storage.local pra token e config
 *   - activeTab: ler URL atual do popup
 *
 * Host permissions:
 *   - *://*.linkedin.com/* — content scripts em /in/ e /company/
 *   - https://boldfy.com.br/* — backend (chamadas /api/extension/*)
 *
 * Spec: SPEC-extension-linkedin.md §3.
 */

import { defineManifest } from '@crxjs/vite-plugin';

export default defineManifest({
  manifest_version: 3,
  name: 'Boldfy CRM — captura LinkedIn',
  description: 'Captura perfis e empresas do LinkedIn direto pro CRM da Boldfy em 1 clique.',
  version: '0.1.0',
  action: {
    default_popup: 'src/popup/index.html',
    default_title: 'Boldfy CRM',
  },
  background: {
    service_worker: 'src/background/service-worker.ts',
    type: 'module',
  },
  content_scripts: [
    {
      matches: ['https://*.linkedin.com/in/*'],
      js: ['src/content/person.ts'],
      run_at: 'document_idle',
    },
    {
      matches: ['https://*.linkedin.com/company/*'],
      js: ['src/content/company.ts'],
      run_at: 'document_idle',
    },
  ],
  permissions: ['storage', 'activeTab'],
  host_permissions: [
    'https://*.linkedin.com/*',
    'https://boldfy.com.br/*',
    'https://www.boldfy.com.br/*',
  ],
  icons: {
    '16': 'public/icon-16.png',
    '48': 'public/icon-48.png',
    '128': 'public/icon-128.png',
  },
});
