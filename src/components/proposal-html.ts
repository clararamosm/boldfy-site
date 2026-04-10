/**
 * Generates a standalone, inline-CSS HTML page for a Boldfy proposal.
 *
 * This HTML is:
 * - Email-safe (inline styles, no external CSS/JS)
 * - Responsive (max-width 600px)
 * - Branded with Boldfy colors
 * - Self-contained (can be viewed standalone or embedded in an email)
 */

import type { ProposalData } from '@/lib/notion-crm';

/* -------------------------------------------------------------------------- */
/*  Brand tokens (hardcoded for inline CSS — HSL 279 71% 63% ≈ #8B6CDB)       */
/* -------------------------------------------------------------------------- */

const C = {
  primary: '#8B6CDB',
  primaryLight: '#A78BEA',
  primaryBg: '#F3F0FF',
  violet: '#7C3AED',
  violetBg: '#F5F3FF',
  amber: '#D97706',
  amberBg: '#FFFBEB',
  emerald: '#059669',
  emeraldBg: '#ECFDF5',
  bg: '#FFFFFF',
  card: '#FAFAFA',
  border: '#E5E5E5',
  borderLight: '#F0F0F0',
  text: '#171717',
  textMuted: '#737373',
  textLight: '#A3A3A3',
} as const;

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function fmt(n: number): string {
  return n.toLocaleString('pt-BR');
}

function fmtBRL(n: number): string {
  return `R$ ${fmt(n)}`;
}

const DESIGN_LABELS: Record<string, { label: string; pieces: number }> = {
  starter: { label: 'Starter', pieces: 4 },
  growth: { label: 'Growth', pieces: 8 },
  scale: { label: 'Scale', pieces: 12 },
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

  const perSeat = data.betaActive ? data.platform.perSeatBeta : data.platform.perSeatFull;
  const platformTotal = data.platform.seats * perSeat;
  const platformTotalFull = data.platform.seats * data.platform.perSeatFull;
  const designMeta = DESIGN_LABELS[data.design.pack] ?? { label: data.design.pack, pieces: 0 };

  // Team section
  const teamHTML = data.team.length > 0
    ? data.team.map(t => `
      <tr>
        <td style="padding:4px 0;">
          <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${t.dedicated ? C.amber : C.primary};vertical-align:middle;margin-right:8px;"></span>
          <span style="font-size:13px;color:${C.text};">${t.text}</span>
          <span style="font-size:11px;color:${t.dedicated ? C.amber : C.textMuted};margin-left:6px;">${t.dedicated ? '● dedicado' : '○ compartilhado'}</span>
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
          <div style="display:inline-block;background:${C.primaryBg};padding:6px 14px;border-radius:8px;">
            <span style="font-size:16px;font-weight:800;color:${C.primary};letter-spacing:-0.5px;">BOLDFY</span>
          </div>
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

      ${data.betaActive ? `
      <div style="background:${C.emeraldBg};border:1px solid #A7F3D0;border-radius:8px;padding:10px 14px;margin-bottom:20px;">
        <span style="font-size:12px;font-weight:700;color:${C.emerald};">✦ Beta Tester — 30% off na Plataforma</span>
      </div>
      ` : ''}

      <!-- Platform -->
      ${data.platform.enabled ? `
      <div>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="vertical-align:middle;">
              <span style="font-size:14px;font-weight:700;color:${C.text};">🖥 Plataforma</span>
              <span style="font-size:11px;color:${C.textMuted};margin-left:6px;">Software as a Service</span>
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
              <span style="font-size:16px;font-weight:800;color:${C.text};">${fmtBRL(data.design.price)}</span>
              <span style="font-size:11px;color:${C.textMuted};">/mês</span>
            </td>
          </tr>
        </table>
        <p style="margin:8px 0 0;font-size:12px;color:${C.textMuted};">
          ${designMeta.label} · ${designMeta.pieces} peças/mês
        </p>
        <div style="margin-top:10px;">
          ${['Carrosséis', 'Infográficos', 'Templates de marca', 'Brand Context']
            .map(f => `<span class="badge" style="background:${C.violetBg};color:${C.violet};margin:2px 4px 2px 0;">✓ ${f}</span>`)
            .join('')}
        </div>
      </div>
      ` : ''}

      <!-- Full-Service -->
      ${data.fullService.enabled ? `
      <div class="section">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="vertical-align:middle;">
              <span style="font-size:14px;font-weight:700;color:${C.text};">🎙 Content Full-Service</span>
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
      ${proposalUrl ? `
      <p style="margin:0 0 12px;">
        <a href="${proposalUrl}" style="display:inline-block;background:${C.primary};color:#fff;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:700;text-decoration:none;">
          Ver proposta online
        </a>
      </p>
      ` : ''}
      <p style="margin:0;font-size:10px;color:${C.textLight};line-height:1.6;">
        Pricing vigente Boldfy (2026). Desconto Beta Tester (30% off) aplica-se somente à Plataforma.<br>
        Contrato mínimo de 6 meses. Executivos do Content Full-Service não consomem seats da Plataforma.<br><br>
        <a href="https://boldfy.com.br" style="color:${C.primary};font-weight:600;">boldfy.com.br</a>
      </p>
    </div>
  </div>
</body>
</html>`;
}
