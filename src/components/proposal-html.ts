/**
 * Generates a standalone, inline-CSS HTML page for a Boldfy proposal.
 *
 * This HTML is:
 * - Email-safe (inline styles, no external CSS/JS)
 * - Responsive (max-width 600px)
 * - Branded with Boldfy colors
 * - Self-contained (can be viewed standalone or embedded in an email)
 */

import type { ProposalData } from '@/lib/proposals';

/* -------------------------------------------------------------------------- */
/*  Brand tokens (fonte: boldfy-visual-identity)                               */
/*                                                                              */
/*  Mantidos hardcoded em hex porque o HTML gerado pode rodar em qualquer       */
/*  client de email — não dá pra depender de CSS variables.                     */
/* -------------------------------------------------------------------------- */

const C = {
  primary: '#CD50F1',        // Primary roxo vibrante (marca)
  primaryLight: '#E875FF',   // Gradient secondary
  primaryDark: '#5E2A67',    // Primary Dark (headers)
  primaryBg: '#F7EEFC',      // Secondary surface (tags, badges)
  violet: '#9840AD',         // Primary Mid — usado no bloco DoD pra diferenciar do Primary
  violetBg: '#F3E6F8',
  amber: '#D97706',
  amberBg: '#FFFBEB',
  emerald: '#059669',
  emeraldBg: '#ECFDF5',
  bg: '#FAF7FF',             // Background da página
  card: '#FFFFFF',           // Card surface
  border: '#E4D8ED',         // Border padrão da marca
  borderLight: '#F0E8F5',
  text: '#45336B',           // Foreground (texto principal)
  textMuted: '#9D85B3',      // Muted
  textLight: '#B5A0CD',
} as const;

// SVG inline do logo Boldfy — preferimos inline em vez de <img src> porque:
//   1) URL absoluta quebra em preview/dev (dominio diferente)
//   2) Email clients às vezes bloqueiam imagens externas por default
//   3) Custa só ~3.9KB, sem fricção
// Fonte: public/images/boldfy-logo.svg
const LOGO_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 394.52 152.57" width="84" height="33" aria-label="Boldfy" style="display:block;"><g fill="#572d63"><path d="M10.59,106.96V12.62c0-.84.68-1.52,1.52-1.52h18.48c.84,0,1.52.68,1.52,1.52v30c0,1.23,1.39,1.95,2.39,1.23,1.62-1.14,3.53-2.1,5.75-2.87,3.44-1.2,6.85-1.79,10.23-1.79,6.67,0,12.33,1.62,16.96,4.86,4.63,3.24,8.17,7.52,10.61,12.85,2.44,5.33,3.66,11.18,3.66,17.55,0,7.57-1.59,14.27-4.78,20.09-3.19,5.83-7.84,10.38-13.97,13.67-6.13,3.29-13.52,4.93-22.19,4.93-5.98,0-11.63-.55-16.96-1.64-4.81-.99-8.87-2.02-12.18-3.09-.62-.2-1.04-.79-1.04-1.44ZM32.1,72.05v20.54c0,.68.44,1.27,1.1,1.46.91.26,1.88.5,2.94.71,1.49.3,3.49.45,5.98.45,5.58,0,9.96-1.84,13.15-5.53,3.19-3.68,4.78-8.52,4.78-14.49,0-2.89-.47-5.68-1.42-8.37-.95-2.69-2.44-4.9-4.48-6.65-2.04-1.74-4.71-2.61-7.99-2.61-4.78,0-8.32,1.32-10.61,3.96-2.29,2.64-3.44,6.15-3.44,10.53Z"/><path d="M271.95,106.96V12.62c0-.84-.68-1.52-1.52-1.52h-18.48c-.84,0-1.52.68-1.52,1.52v30c0,1.23-1.39,1.95-2.39,1.23-1.62-1.14-3.53-2.1-5.75-2.87-3.44-1.2-6.85-1.79-10.23-1.79-6.67,0-12.33,1.62-16.96,4.86-4.63,3.24-8.17,7.52-10.61,12.85-2.44,5.33-3.66,11.18-3.66,17.55,0,7.57,1.59,14.27,4.78,20.09,3.19,5.83,7.84,10.38,13.97,13.67,6.13,3.29,13.52,4.93,22.19,4.93,5.98,0,11.63-.55,16.96-1.64,4.81-.99,8.87-2.02,12.18-3.09.62-.2,1.04-.79,1.04-1.44ZM250.44,72.05v20.54c0,.68-.44,1.27-1.1,1.46-.91.26-1.88.5-2.94.71-1.49.3-3.49.45-5.98.45-5.58,0-9.96-1.84-13.15-5.53-3.19-3.68-4.78-8.52-4.78-14.49,0-2.89.47-5.68,1.42-8.37.95-2.69,2.44-4.9,4.48-6.65,2.04-1.74,4.71-2.61,7.99-2.61,4.78,0,8.32,1.32,10.61,3.96,2.29,2.64,3.44,6.15,3.44,10.53Z"/><path d="M88.86,75.64c0-6.87,1.59-13.15,4.78-18.82,3.19-5.68,7.59-10.18,13.22-13.52,5.63-3.34,12.18-5,19.65-5s14.02,1.67,19.65,5c5.63,3.34,10.01,7.84,13.15,13.52,3.14,5.68,4.71,11.95,4.71,18.82s-1.57,13.15-4.71,18.82c-3.14,5.68-7.52,10.21-13.15,13.6-5.63,3.38-12.18,5.08-19.65,5.08s-14.02-1.69-19.65-5.08c-5.63-3.38-10.04-7.92-13.22-13.6-3.19-5.68-4.78-11.95-4.78-18.82ZM126.51,94.46c3.68,0,6.75-.9,9.19-2.69,2.44-1.79,4.31-4.13,5.6-7.02,1.29-2.89,1.94-5.92,1.94-9.11s-.65-6.2-1.94-9.04c-1.3-2.84-3.16-5.15-5.6-6.95-2.44-1.79-5.5-2.69-9.19-2.69s-6.65.9-9.19,2.69c-2.54,1.79-4.46,4.11-5.75,6.95-1.3,2.84-1.94,5.85-1.94,9.04s.65,6.23,1.94,9.11c1.29,2.89,3.21,5.23,5.75,7.02,2.54,1.79,5.6,2.69,9.19,2.69Z"/><path d="M203.88,110.22c-7.52-6.96-10.79-17.34-10.79-28.71h-.05V12.62c0-.84-.68-1.52-1.52-1.52h-18.48c-.84,0-1.52.68-1.52,1.52v68.91h0c-.11,21.66,5.67,33.38,17.71,44.52,11.16,10.32,26.98,15.62,44.52,16.69.84.05,1.57-.61,1.6-1.45l.82-18.5c.04-.83-.6-1.53-1.43-1.58-12.37-.81-23.48-4.14-30.87-10.97Z"/></g><path fill="#bd58e7" d="M362.68,41.64l-14.19,39.62c-.45,1.27-2.23,1.29-2.73.04l-15.69-39.71c-.22-.56-.76-.92-1.35-.92h-41.18c-.8,0-1.46-.65-1.46-1.46v-2.43c0-3.49.9-6.17,2.69-8.07,1.79-1.89,4.18-2.84,7.17-2.84,1.89,0,3.74.3,5.53.9,1.34.45,2.59,1.03,3.76,1.75.67.41,1.54.22,1.97-.43,1.23-1.87,2.49-3.73,3.75-5.57,1.29-1.88,2.57-3.77,3.83-5.69.42-.65.26-1.51-.35-1.98-2.9-2.23-6.08-3.83-9.53-4.81-3.88-1.09-7.72-1.64-11.5-1.64-4.78,0-9.36,1.02-13.75,3.06-4.38,2.04-7.97,5.15-10.76,9.34-2.79,4.18-4.18,9.61-4.18,16.28v72.2c0,.8.65,1.46,1.46,1.46h18.45c.8,0,1.46-.65,1.46-1.46v-50.27c0-.8.65-1.46,1.46-1.46h24.52c.57,0,1.08.33,1.32.85l23.54,51.05c.16.35.18.75.04,1.11l-1.88,5.11c-1.3,3.49-2.74,5.95-4.33,7.4-1.5,1.36-3.31,2.07-5.43,2.15-6.1-.16-11.1-4.84-11.75-10.8-.08-.75-.69-1.33-1.45-1.33h-14.23c-.84,0-1.5.71-1.46,1.55.81,15.42,13.6,27.71,29.22,27.71,4.88,0,9.73-.85,13.02-2.69,3.29-1.84,6-4.33,8.14-7.47,2.14-3.14,4.01-6.6,5.6-10.38,1.59-3.79,3.19-7.62,4.78-11.5l27.86-67.61c.39-.96-.31-2.01-1.35-2.01h-19.66c-.62,0-1.16.39-1.37.97Z"/></svg>';

// URL do CTA principal — leva pra LP da demo com UTM marcando origem.
// Não usamos prefill porque a proposta pode ser compartilhada com decisores
// diferentes do lead original (CMO recebe link do head de marketing, etc.)
const DEMO_CTA_URL = 'https://boldfy.com.br/agendar-demo?utm_source=proposta-personalizada&utm_medium=link&utm_campaign=proposta-personalizada';

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function fmt(n: number): string {
  return n.toLocaleString('pt-BR');
}

function fmtBRL(n: number): string {
  return `R$ ${fmt(n)}`;
}

const DESIGN_LABELS: Record<string, { label: string; pieces: number; listPrice: number }> = {
  starter: { label: 'Starter', pieces: 4, listPrice: 1600 },
  growth: { label: 'Growth', pieces: 7, listPrice: 2800 },
  scale: { label: 'Scale', pieces: 10, listPrice: 3600 },
};

/* -------------------------------------------------------------------------- */
/*  HTML Generator                                                             */
/* -------------------------------------------------------------------------- */

export function generateProposalHTML(data: ProposalData, proposalUrl?: string): string {
  const dateStr = new Date(data.createdAt).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  // Countdown logic: proposals valid for 15 days
  const VALIDITY_DAYS = 15;
  const createdDate = new Date(data.createdAt);
  const expiresDate = new Date(createdDate.getTime() + VALIDITY_DAYS * 24 * 60 * 60 * 1000);
  const now = new Date();
  const daysRemaining = Math.ceil((expiresDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const isExpired = daysRemaining <= 0;

  const perSeat = data.betaActive ? data.platform.perSeatBeta : data.platform.perSeatFull;
  const platformTotal = data.platform.seats * perSeat;
  const platformTotalFull = data.platform.seats * data.platform.perSeatFull;
  const designMeta = DESIGN_LABELS[data.design.pack] ?? { label: data.design.pack, pieces: 0, listPrice: 0 };

  // Team section — só itens dedicados ganham marcação visual. Compartilhado
  // é o default (não precisa rotular o que é padrão).
  const teamHTML = data.team.length > 0
    ? data.team.map(t => `
      <tr>
        <td style="padding:4px 0;">
          <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${t.dedicated ? C.amber : C.primary};vertical-align:middle;margin-right:8px;"></span>
          <span style="font-size:13px;color:${C.text};">${t.text}</span>
          ${t.dedicated ? `<span class="badge" style="background:${C.amberBg};color:${C.amber};margin-left:8px;">dedicado</span>` : ''}
        </td>
      </tr>
    `).join('')
    : '';

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="noindex, nofollow">
  <title>Proposta Boldfy — ${data.lead.nome}</title>
  <style>
    body { margin:0; padding:0; background:${C.card}; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; color:${C.text}; -webkit-font-smoothing:antialiased; }
    a { color:${C.primary}; text-decoration:none; }
    .wrap { max-width:600px; margin:0 auto; padding:24px 16px; }
    .card { background:${C.bg}; border:1px solid ${C.border}; border-radius:12px; padding:32px 28px; }
    .section { border-top:1px solid ${C.borderLight}; padding-top:20px; margin-top:20px; }
    .badge { display:inline-block; padding:3px 10px; border-radius:20px; font-size:11px; font-weight:600; }
    @media (max-width:480px) {
      .card { padding:20px 16px; }
      .wrap { padding:16px 8px; }
    }
  </style>
</head>
<body>
  <div class="wrap">
    <!-- Header -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td>
          <a href="https://boldfy.com.br" style="display:inline-block;line-height:0;text-decoration:none;">
            ${LOGO_SVG}
          </a>
        </td>
        <td align="right">
          <span style="font-size:12px;color:${C.textMuted};">${dateStr}</span>
        </td>
      </tr>
    </table>

    <div class="card">
      <!-- Title -->
      <h1 style="margin:0 0 4px;font-size:20px;font-weight:800;color:${C.text};">Proposta personalizada</h1>
      <p style="margin:0 0 24px;font-size:13px;color:${C.textMuted};">
        Preparada para <strong style="color:${C.text};">${data.lead.nome}</strong>${data.lead.empresa && data.lead.empresa !== '—' ? ` · ${data.lead.empresa}` : ''}
      </p>

      <!-- Countdown / Expiration banner -->
      ${isExpired ? `
      <div style="background:#FEF2F2;border:1px solid #FECACA;border-radius:8px;padding:14px 16px;margin-bottom:20px;text-align:center;">
        <span style="font-size:14px;font-weight:700;color:#DC2626;">⏰ Esta proposta expirou</span>
        <p style="margin:6px 0 0;font-size:12px;color:#737373;">Essa proposta era válida por ${VALIDITY_DAYS} dias. Entre em contato ou gere uma nova proposta.</p>
        <a href="https://boldfy.com.br/#simulador" style="display:inline-block;margin-top:12px;background:${C.primary};color:#fff;padding:10px 24px;border-radius:8px;font-size:13px;font-weight:700;text-decoration:none;">Gerar nova proposta</a>
      </div>
      ` : `
      <div style="background:#FFF7ED;border:1px solid #FED7AA;border-radius:8px;padding:10px 14px;margin-bottom:20px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td>
              <span style="font-size:12px;font-weight:700;color:#EA580C;">⏳ Válida por mais ${daysRemaining} dia${daysRemaining !== 1 ? 's' : ''}</span>
            </td>
            <td align="right">
              <span style="font-size:11px;color:#9A3412;">Expira em ${expiresDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
            </td>
          </tr>
        </table>
      </div>
      `}

      <!-- Platform -->
      ${data.platform.enabled ? `
      <div>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="vertical-align:middle;">
              <span style="font-size:14px;font-weight:700;color:${C.text};">🖥 Conteúdo feito pelo time</span>
              <span style="font-size:11px;color:${C.textMuted};margin-left:6px;">Software as a Service</span>
              ${data.betaActive ? `<span class="badge" style="background:${C.emeraldBg};color:${C.emerald};margin-left:8px;">✦ Beta · 30% off</span>` : ''}
            </td>
            <td align="right" style="vertical-align:middle;">
              ${data.betaActive ? `<span style="font-size:12px;color:${C.textLight};text-decoration:line-through;">${fmtBRL(platformTotalFull)}</span><br>` : ''}
              <span style="font-size:16px;font-weight:800;color:${data.betaActive ? C.primary : C.text};">${fmtBRL(platformTotal)}</span>
              <span style="font-size:11px;color:${C.textMuted};">/mês</span>
            </td>
          </tr>
        </table>
        <p style="margin:8px 0 0;font-size:12px;color:${C.textMuted};">
          ${data.platform.seats} seats · ${fmtBRL(perSeat)}/seat${data.betaActive ? ' (beta)' : ''}
        </p>
        <div style="margin-top:10px;">
          ${['IA Contextual', 'Gamificação', 'Trilhas LXP', 'Dashboard', 'Biblioteca de Marca', 'Setup assistido']
            .map(f => `<span class="badge" style="background:${C.primaryBg};color:${C.primary};margin:2px 4px 2px 0;">✓ ${f}</span>`)
            .join('')}
        </div>
      </div>
      ` : ''}

      <!-- Design -->
      ${data.design.enabled ? `
      <div class="section">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="vertical-align:middle;">
              <span style="font-size:14px;font-weight:700;color:${C.text};">🎨 Biblioteca de Peças</span>
              <span style="font-size:11px;color:${C.textMuted};margin-left:6px;">Design on Demand</span>
            </td>
            <td align="right" style="vertical-align:middle;">
              <span style="font-size:16px;font-weight:800;color:${C.text};">${fmtBRL(data.design.price)}</span><span style="font-size:11px;color:${C.textMuted};">/mês</span>
            </td>
          </tr>
        </table>
        <p style="margin:8px 0 0;font-size:12px;color:${C.textMuted};">
          ${designMeta.label} · ${designMeta.pieces} peças/mês · <strong style="color:${C.text};">2–3 variações</strong> por peça
        </p>
        <div style="margin-top:10px;">
          ${['Carrosséis', 'Infográficos', 'Templates de marca', 'Brand Context']
            .map(f => `<span class="badge" style="background:${C.violetBg};color:${C.violet};margin:2px 4px 2px 0;">✓ ${f}</span>`)
            .join('')}
        </div>
        <p style="margin:12px 0 0;font-size:12px;color:${C.textMuted};line-height:1.5;">
          Por que designs importam pra Employee-Led Growth?
          <a href="https://boldfy.com.br/case-semrush" style="color:${C.primary};font-weight:600;">Veja o case da Semrush →</a>
        </p>
      </div>
      ` : ''}

      <!-- Full-Service -->
      ${data.fullService.enabled ? `
      <div class="section">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="vertical-align:middle;">
              <span style="font-size:14px;font-weight:700;color:${C.text};">🎙 Conteúdo feito pela Boldfy</span>
            </td>
            <td align="right" style="vertical-align:middle;">
              <span style="font-size:16px;font-weight:800;color:${C.text};">${fmtBRL(data.fullService.price)}</span>
              <span style="font-size:11px;color:${C.textMuted};">/mês</span>
            </td>
          </tr>
        </table>
        <p style="margin:8px 0 0;font-size:12px;color:${C.textMuted};">
          ${data.fullService.tls} executivo${data.fullService.tls > 1 ? 's' : ''} · ${data.fullService.freq}x por semana cada
        </p>
        <div style="margin-top:10px;">
          ${['Estratégia', 'Produção autoral', 'Design dedicado', 'Report mensal', 'Lead Magnet']
            .map(f => `<span class="badge" style="background:${C.amberBg};color:${C.amber};margin:2px 4px 2px 0;">✓ ${f}</span>`)
            .join('')}
        </div>
      </div>
      ` : ''}

      <!-- Team -->
      ${teamHTML ? `
      <div class="section">
        <p style="margin:0 0 8px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:${C.textMuted};">Sua equipe Boldfy</p>
        <table cellpadding="0" cellspacing="0">
          ${teamHTML}
        </table>
      </div>
      ` : ''}

      <!-- Total -->
      <div style="border-top:2px solid ${C.border};padding-top:24px;margin-top:24px;">
        <p style="margin:0 0 4px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:${C.textMuted};">Investimento mensal</p>
        ${data.betaActive && data.totals.savings > 0 ? `
        <p style="margin:0;font-size:14px;color:${C.textLight};text-decoration:line-through;">${fmtBRL(data.totals.full)}/mês</p>
        ` : ''}
        <p style="margin:4px 0 0;font-size:32px;font-weight:800;color:${C.text};letter-spacing:-1px;">
          ${fmtBRL(data.totals.current)}<span style="font-size:14px;font-weight:500;color:${C.textMuted};margin-left:4px;">/mês</span>
        </p>
        ${data.betaActive && data.totals.savings > 0 ? `
        <p style="margin:6px 0 0;font-size:12px;font-weight:600;color:${C.emerald};">Economia beta: ${fmtBRL(data.totals.savings)}/mês</p>
        ` : ''}
      </div>
    </div>

    <!-- Footer -->
    <div style="text-align:center;margin-top:24px;padding:0 16px;">
      <p style="margin:0 0 8px;">
        <a href="${DEMO_CTA_URL}" style="display:inline-block;background:${C.primary};color:#fff;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:700;text-decoration:none;">
          Marcar minha demo
        </a>
      </p>
      <p style="margin:0 0 16px;font-size:11px;color:${C.textMuted};">
        Sem formulário extra — vai direto pro agendador.
      </p>
      <p style="margin:0;font-size:10px;color:${C.textLight};line-height:1.6;">
        Proposta válida por ${VALIDITY_DAYS} dias a partir de ${dateStr}. Pricing vigente Boldfy (2026).<br>
        Desconto Beta Tester (30% off) aplica-se somente ao Modo Time. Contrato mínimo de 6 meses.<br>
        Executivos do Modo Executivo não consomem seats do Modo Time.<br><br>
        <a href="https://boldfy.com.br" style="color:${C.primary};font-weight:600;">boldfy.com.br</a>
      </p>
    </div>
  </div>
</body>
</html>`;
}
