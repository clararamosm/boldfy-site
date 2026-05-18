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

const QRCODE_CDN = 'https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js';

function loadQrLib(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.QRCode) return Promise.resolve();
  return new Promise((resolve, reject) => {
    // Reaproveita script tag se já tem
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${QRCODE_CDN}"]`);
    if (existing) {
      if (window.QRCode) return resolve();
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Falha ao carregar qrcode.js')));
      return;
    }
    const s = document.createElement('script');
    s.src = QRCODE_CDN;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Falha ao carregar qrcode.js'));
    document.body.appendChild(s);
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

  // Renderiza QR quando abre
  useEffect(() => {
    if (!open || !url) return;
    setLoading(true);
    setError(null);
    loadQrLib()
      .then(() => {
        if (!canvasRef.current || !window.QRCode) {
          setError('Lib QR não disponível');
          return;
        }
        window.QRCode.toCanvas(canvasRef.current, url, { width: 256, margin: 2, color: { dark: '#5E2A67', light: '#FFFFFF' } }, (err) => {
          if (err) setError('Erro ao gerar QR: ' + err.message);
        });
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
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

        <div className="my-5 flex items-center justify-center rounded-lg bg-secondary/40 p-4" style={{ minHeight: 280 }}>
          {loading ? <span className="text-sm text-muted-foreground">Gerando…</span> : null}
          <canvas ref={canvasRef} className={loading ? 'hidden' : ''} />
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
