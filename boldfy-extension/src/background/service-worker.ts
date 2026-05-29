/**
 * Service worker (background) — MV3.
 *
 * Hoje é praticamente vazio: content scripts falam direto com fetch (a
 * extensão tem host_permissions pra boldfy.com.br). O SW fica disponível
 * pra futuras necessidades de comunicação entre content + popup.
 *
 * Quando precisar: receber mensagens via chrome.runtime.onMessage e
 * coordenar (ex: notificar popup quando uma captura acontece, abrir tab
 * com perfil no CRM, etc).
 */

chrome.runtime.onInstalled.addListener(() => {
  console.log('[Boldfy CRM] extension installed/updated');
});

export {};
