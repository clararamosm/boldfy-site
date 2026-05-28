/**
 * QR Code modal — client component.
 *
 * Renderiza canvas (preview interativo) + botões Baixar PNG, Baixar SVG,
 * Copiar link.
 *
 * Mai/2026 (Clara):
 *  - Trocou CDN remoto por import npm local (qrcode v1.5+). Antes adblock /
 *    CSP / CDN fora do ar derrubava o gerador inteiro. Agora a lib é bundled
 *    no JS do site, zero rede em runtime.
 *  - Toggle Preto/Branco pra cor do código (útil pra usar em fundo escuro
 *    do site, slides, peças impressas).
 *  - Fundo SEMPRE transparente (PNG com alpha + SVG sem rect de background).
 *    Quem usar pode colar em qualquer fundo sem moldura branca.
 *
 * Usage:
 *  - Botão "QR Code" no UtmHistory dispara `window.dispatchEvent(new
 *    CustomEvent('utm:qr-open', { detail: { url } }))`.
 *  - Esse componente escuta o evento e abre modal com o URL.
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';

type FgColor = 'black' | 'white';

const COLOR_HEX: Record<FgColor, string> = {
  black: '#000000',
  white: '#FFFFFF',
};

// Fundo transparente. A lib qrcode aceita alpha em hex de 8 chars (#RRGGBBAA).
// '#00000000' = preto totalmente transparente — render em PNG fica com alpha
// channel limpo, e o SVG nem desenha o rect de background.
const TRANSPARENT_BG = '#00000000';

const QR_SIZE = 256;

export function QrModal() {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const [fgColor, setFgColor] = useState<FgColor>('black');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  // Wrapper visual atrás do canvas — mostra o QR sobre quadriculado pra
  // tornar a transparência visível no preview (xadrez tipo Photoshop).
  const previewBgClass = fgColor === 'white' ? 'qr-preview-dark' : 'qr-preview-light';

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

  // Renderiza QR quando abre OU quando muda a cor selecionada.
  useEffect(() => {
    if (!open || !url || !canvasRef.current) return;
    let cancelled = false;

    QRCode.toCanvas(canvasRef.current, url, {
      width: QR_SIZE,
      margin: 2,
      color: {
        dark: COLOR_HEX[fgColor],
        light: TRANSPARENT_BG,
      },
    }).catch((err: unknown) => {
      if (cancelled) return;
      setError(err instanceof Error ? err.message : 'Erro ao gerar QR Code');
    });

    return () => {
      cancelled = true;
    };
  }, [open, url, fgColor]);

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
    if (!url) return;
    try {
      const dataUrl = await QRCode.toDataURL(url, {
        width: 1024, // alta resolução pra impressão/slides
        margin: 2,
        color: { dark: COLOR_HEX[fgColor], light: TRANSPARENT_BG },
      });
      const link = document.createElement('a');
      link.download = `qr-${fgColor}-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar PNG');
    }
  }

  async function downloadSvg() {
    if (!url) return;
    try {
      const svg = await QRCode.toString(url, {
        type: 'svg',
        margin: 2,
        color: { dark: COLOR_HEX[fgColor], light: TRANSPARENT_BG },
      });
      // A lib qrcode no `type: 'svg'` com light transparente já gera SVG sem
      // o rect de background — só os módulos pretos/brancos do código. Cola
      // em qualquer fundo sem moldura.
      const blob = new Blob([svg], { type: 'image/svg+xml' });
      const dlUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `qr-${fgColor}-${Date.now()}.svg`;
      link.href = dlUrl;
      link.click();
      setTimeout(() => URL.revokeObjectURL(dlUrl), 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar SVG');
    }
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
      role="dialog"
      aria-modal="true"
      aria-labelledby="qr-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
    >
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Fechar"
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary"
        >
          ×
        </button>

        <h3 id="qr-modal-title" className="font-headline text-lg font-black text-accent-foreground">
          QR Code do link
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Aponte a câmera pra abrir o link rastreável. Fundo transparente pra colar onde quiser.
        </p>

        {/* Toggle cor */}
        <div className="mt-4 flex items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Cor:</span>
          <button
            type="button"
            onClick={() => setFgColor('black')}
            aria-pressed={fgColor === 'black'}
            className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-semibold transition-colors ${
              fgColor === 'black'
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-white text-muted-foreground hover:bg-secondary'
            }`}
          >
            <span className="inline-block h-3 w-3 rounded-sm bg-black" />
            Preto
          </button>
          <button
            type="button"
            onClick={() => setFgColor('white')}
            aria-pressed={fgColor === 'white'}
            className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-semibold transition-colors ${
              fgColor === 'white'
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-white text-muted-foreground hover:bg-secondary'
            }`}
          >
            <span className="inline-block h-3 w-3 rounded-sm border border-border bg-white" />
            Branco
          </button>
        </div>

        {/* Preview com fundo quadriculado pra evidenciar transparência */}
        <div
          className={`my-4 flex items-center justify-center rounded-lg p-4 ${previewBgClass}`}
          style={{ minHeight: 280 }}
        >
          <canvas ref={canvasRef} />
        </div>

        {url ? (
          <div
            className="mb-4 max-h-20 overflow-auto rounded-md bg-secondary/40 p-2 font-mono text-[11px] text-accent-foreground"
            style={{ wordBreak: 'break-all' }}
          >
            {url}
          </div>
        ) : null}

        {error ? (
          <p role="alert" className="mb-3 text-xs text-error">
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={downloadPng}
            className="flex-1 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Baixar PNG
          </button>
          <button
            type="button"
            onClick={downloadSvg}
            className="flex-1 rounded-md border border-border bg-white px-3 py-2 text-sm font-semibold text-accent-foreground transition-colors hover:bg-secondary"
          >
            Baixar SVG
          </button>
          <button
            type="button"
            onClick={copyLink}
            className="flex-1 rounded-md border border-border bg-white px-3 py-2 text-sm font-semibold text-accent-foreground transition-colors hover:bg-secondary"
          >
            {copied ? '✓ Copiado' : 'Copiar link'}
          </button>
        </div>

        {/* Quadriculado de transparência (estilo Photoshop) — versão clara
            quando o QR é preto, escura quando o QR é branco, pra contraste
            sempre legível. Pattern via repeating linear-gradient — zero
            dependência. */}
        <style>{`
          .qr-preview-light {
            background-color: #FFFFFF;
            background-image:
              linear-gradient(45deg, #EEEEEE 25%, transparent 25%),
              linear-gradient(-45deg, #EEEEEE 25%, transparent 25%),
              linear-gradient(45deg, transparent 75%, #EEEEEE 75%),
              linear-gradient(-45deg, transparent 75%, #EEEEEE 75%);
            background-size: 16px 16px;
            background-position: 0 0, 0 8px, 8px -8px, -8px 0;
          }
          .qr-preview-dark {
            background-color: #2A2A2A;
            background-image:
              linear-gradient(45deg, #3A3A3A 25%, transparent 25%),
              linear-gradient(-45deg, #3A3A3A 25%, transparent 25%),
              linear-gradient(45deg, transparent 75%, #3A3A3A 75%),
              linear-gradient(-45deg, transparent 75%, #3A3A3A 75%);
            background-size: 16px 16px;
            background-position: 0 0, 0 8px, 8px -8px, -8px 0;
          }
        `}</style>
      </div>
    </div>
  );
}
