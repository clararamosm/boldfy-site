/**
 * QR Code modal — client component.
 *
 * Carrega lib qrcode.js v1.4.4 via CDN on-demand (na primeira abertura).
 * Renderiza canvas + botões Baixar PNG, Baixar SVG, Copiar link.
 *
 * Usage:
 *   - Botão "QR Code" no UtmHistory dispara `window.dispatchEvent(new CustomEvent('utm:qr-open', { detail: { url } }))`
 *   - Esse componente escuta o evento e abre modal com o URL
 *
 * Lib é carregada via <script> CDN — sem dependência npm extra.
 */

'use client';

import { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    QRCode?: {
      toCanvas: (canvas: HTMLCanvasElement, text: string, opts: Record<string, unknown>, cb?: (err: Error | null) => void) => void;
      toString: (text: string, opts: Record<string, unknown>, cb: (err: Error | null, svg: string) => void) => void;
    };
  }
}

// Lista de CDNs em ordem de preferência. Se primeiro falhar (adblocker,
// jsdelivr fora do ar, CSP bloqueando), tenta o próximo.
const QRCODE_CDNS = [
  'https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js',
  'https://unpkg.com/qrcode@1.5.3/build/qrcode.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/qrcode/1.5.3/qrcode.min.js',
];

/**
 * Carrega qrcode.js do CDN com fallbacks múltiplos + timeout + polling.
 *
 * Por que não usa só `script.onload`:
 *   - React 18 strict mode roda useEffect 2x. Primeira chamada cria <script>,
 *     segunda chamada o vê e tenta `addEventListener('load')` — mas se o
 *     script já terminou (com sucesso ou erro silente), o event nunca
 *     dispara e ficaria preso pra sempre.
 *   - Adblocker pode retornar 200 OK com conteúdo vazio/HTML — onload
 *     dispara mas `window.QRCode` continua undefined.
 *
 * Solução:
 *   - Após criar script, faz polling de 100ms em `window.QRCode` por até 8s.
 *   - Se nenhum CDN carregar em 8s cada, tenta o próximo da lista.
 *   - Se todos falharem, rejeita com erro claro pro usuário.
 */
function loadQrLib(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.QRCode) return Promise.resolve();

  return new Promise((resolve, reject) => {
    let cdnIndex = 0;

    function tryNextCdn() {
      if (window.QRCode) return resolve();
      if (cdnIndex >= QRCODE_CDNS.length) {
        reject(new Error('Não consegui carregar a biblioteca de QR Code de nenhum CDN. Verifica se algum adblocker está bloqueando.'));
        return;
      }
      const url = QRCODE_CDNS[cdnIndex++];

      // Se script tag já existe pra esse CDN, pula direto pro polling
      const existing = document.querySelector<HTMLScriptElement>(`script[src="${url}"]`);
      if (!existing) {
        const s = document.createElement('script');
        s.src = url;
        s.async = true;
        s.onerror = () => {
          // Erro de rede claro — tenta próximo CDN imediatamente
          tryNextCdn();
        };
        document.body.appendChild(s);
      }

      // Polling: checa window.QRCode a cada 100ms por 8s
      const startedAt = Date.now();
      const interval = window.setInterval(() => {
        if (window.QRCode) {
          window.clearInterval(interval);
          resolve();
          return;
        }
        if (Date.now() - startedAt > 8000) {
          window.clearInterval(interval);
          tryNextCdn(); // timeout neste CDN, tenta próximo
        }
      }, 100);
    }

    tryNextCdn();
  });
}

export function QrModal() {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Escuta evento global
  useEffect(() => {
    function onOpen(e: Event) {
      const detail = (e as CustomEvent<{ url: string }>).detail;
      if (!detail?.url) return;
      setUrl(detail.url);
      setOpen(true);
      setError(null);
      setCopied(false);
    }
    window.addEventListener('utm:qr-open', onOpen);
    return () => window.removeEventListener('utm:qr-open', onOpen);
  }, []);

  // Renderiza QR quando abre. cancelled flag impede setState após unmount
  // ou re-open rápido (strict mode dispara 2x — segunda corrida pode setar
  // estado antigo).
  useEffect(() => {
    if (!open || !url) return;
    let cancelled = false;
    // setState aqui é intencional — precisamos resetar loading/error toda
    // vez que o usuário abre o modal com uma URL nova. Sem isso, modal
    // reaberto mostraria o erro/loading antigo do click anterior.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(null);

    loadQrLib()
      .then(() => {
        if (cancelled) return;
        if (!canvasRef.current || !window.QRCode) {
          setError('Biblioteca de QR não disponível. Tenta recarregar a página.');
          setLoading(false);
          return;
        }
        // toCanvas é assíncrono com callback — só sai do loading quando ele
        // termina (não no .then). Antes setLoading(false) ia pro .finally
        // imediato, deixando "Gerando…" preso quando dava erro silente.
        window.QRCode.toCanvas(
          canvasRef.current,
          url,
          { width: 256, margin: 2, color: { dark: '#5E2A67', light: '#FFFFFF' } },
          (err) => {
            if (cancelled) return;
            if (err) {
              setError('Erro ao gerar QR: ' + err.message);
            }
            setLoading(false);
          },
        );
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, url]);

  // ESC fecha
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  async function downloadPng() {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = `qr-${Date.now()}.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  }

  async function downloadSvg() {
    if (!url || !window.QRCode) return;
    window.QRCode.toString(url, { type: 'svg', margin: 2, color: { dark: '#5E2A67', light: '#FFFFFF' } }, (err, svg) => {
      if (err || !svg) return;
      const blob = new Blob([svg], { type: 'image/svg+xml' });
      const dlUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `qr-${Date.now()}.svg`;
      link.href = dlUrl;
      link.click();
      setTimeout(() => URL.revokeObjectURL(dlUrl), 1000);
    });
  }

  async function copyLink() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setError('Falha ao copiar');
    }
  }

  if (!open) return null;

  return (
    <div
      role="dialog" aria-modal="true" aria-labelledby="qr-modal-title"
      onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
    >
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <button
          type="button" onClick={() => setOpen(false)}
          aria-label="Fechar"
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary"
        >
          ×
        </button>

        <h3 id="qr-modal-title" className="font-headline text-lg font-black text-accent-foreground">
          QR Code do link
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">Aponte a câmera pra abrir o link rastreável.</p>

        <div className="my-5 flex items-center justify-center rounded-lg bg-secondary/40 p-4 relative" style={{ minHeight: 280 }}>
          {/* Canvas sempre montado (não usa display:none) — algumas libs
              falham silenciosamente quando o canvas tá escondido durante
              toCanvas. Loading aparece sobreposto via absolute. */}
          <canvas ref={canvasRef} />
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-secondary/40">
              <span className="text-sm text-muted-foreground">Gerando…</span>
            </div>
          ) : null}
        </div>

        {url ? (
          <div className="mb-4 max-h-20 overflow-auto rounded-md bg-secondary/40 p-2 font-mono text-[11px] text-accent-foreground" style={{ wordBreak: 'break-all' }}>
            {url}
          </div>
        ) : null}

        {error ? <p role="alert" className="mb-3 text-xs text-error">{error}</p> : null}

        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={downloadPng} className="flex-1 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90">
            Baixar PNG
          </button>
          <button type="button" onClick={downloadSvg} className="flex-1 rounded-md border border-border bg-white px-3 py-2 text-sm font-semibold text-accent-foreground transition-colors hover:bg-secondary">
            Baixar SVG
          </button>
          <button type="button" onClick={copyLink} className="flex-1 rounded-md border border-border bg-white px-3 py-2 text-sm font-semibold text-accent-foreground transition-colors hover:bg-secondary">
            {copied ? '✓ Copiado' : 'Copiar link'}
          </button>
        </div>
      </div>
    </div>
  );
}
