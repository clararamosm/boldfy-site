/**
 * Generates a PNG image of the proposal using @vercel/og (ImageResponse).
 *
 * GET /proposta/[id]/og → returns a 1200x630 PNG image
 *
 * Used for:
 * - Anexar no Notion (cover ou dentro da page)
 * - Enviar no email de prospect via ActiveCampaign (embed/attach)
 * - OpenGraph social preview quando o link da proposta for compartilhado
 */

import { ImageResponse } from 'next/og';
import {
  getInteracaoById,
  getInteracaoBlocks,
  parseProposalFromBlocks,
} from '@/lib/notion-crm';

export const runtime = 'edge';
export const revalidate = 3600;

// Brand tokens
const C = {
  primary: '#CD50F1',
  primaryDark: '#9B2FB8',
  primaryLight: '#E875FF',
  caasAccent: '#5E2A67',
  bg: '#0F0A18',
  bgLight: '#FFFFFF',
  card: '#FAFAFA',
  border: '#E5E5E5',
  text: '#171717',
  textMuted: '#737373',
  textInverse: '#FFFFFF',
  success: '#059669',
  warning: '#D97706',
};

const DESIGN_LABELS: Record<string, { label: string; pieces: number }> = {
  starter: { label: 'Starter', pieces: 4 },
  growth: { label: 'Growth', pieces: 8 },
  scale: { label: 'Scale', pieces: 12 },
};

const fmt = (n: number) => n.toLocaleString('pt-BR');
const fmtBRL = (n: number) => `R$ ${fmt(n)}`;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const normalizedId =
    id.length === 32 && !id.includes('-')
      ? `${id.slice(0, 8)}-${id.slice(8, 12)}-${id.slice(12, 16)}-${id.slice(16, 20)}-${id.slice(20)}`
      : id;

  const meta = await getInteracaoById(normalizedId);
  const blocks = meta ? await getInteracaoBlocks(normalizedId) : [];
  const proposal = blocks.length > 0 ? parseProposalFromBlocks(blocks) : null;

  // Fallback: image de proposta não encontrada
  if (!proposal) {
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: `linear-gradient(135deg, ${C.bg} 0%, #1A0E2E 100%)`,
            color: C.textInverse,
            fontSize: 48,
            fontWeight: 900,
          }}
        >
          Proposta Boldfy
        </div>
      ),
      { width: 1200, height: 630 },
    );
  }

  // Dados calculados
  const dateStr = new Date(proposal.createdAt).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  const perSeat = proposal.betaActive
    ? proposal.platform.perSeatBeta
    : proposal.platform.perSeatFull;
  const platformTotal = proposal.platform.seats * perSeat;
  const designMeta = DESIGN_LABELS[proposal.design.pack] ?? {
    label: proposal.design.pack,
    pieces: 0,
  };

  // Lista de módulos ativos
  const modules: { label: string; detail: string; value: string }[] = [];
  if (proposal.platform.enabled) {
    modules.push({
      label: 'Plataforma',
      detail: `${proposal.platform.seats} colaboradores · ${fmtBRL(perSeat)}/seat`,
      value: `${fmtBRL(platformTotal)}/mês`,
    });
  }
  if (proposal.design.enabled) {
    modules.push({
      label: 'Design on Demand',
      detail: `${designMeta.label} · ${designMeta.pieces} peças/mês`,
      value: `${fmtBRL(proposal.design.price)}/mês`,
    });
  }
  if (proposal.fullService.enabled) {
    modules.push({
      label: 'Content Full-Service',
      detail: `${proposal.fullService.tls} executivo(s) · ${proposal.fullService.freq}x/semana`,
      value: `${fmtBRL(proposal.fullService.price)}/mês`,
    });
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: `linear-gradient(135deg, ${C.bg} 0%, #1A0E2E 50%, ${C.caasAccent} 100%)`,
          color: C.textInverse,
          padding: 56,
          fontFamily: 'sans-serif',
        }}
      >
        {/* ─── Header ─── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 32,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 44,
                height: 44,
                borderRadius: 10,
                background: `linear-gradient(135deg, ${C.primary}, ${C.primaryLight})`,
                fontSize: 22,
                fontWeight: 900,
              }}
            >
              B
            </div>
            <div
              style={{
                fontSize: 24,
                fontWeight: 900,
                letterSpacing: -0.5,
              }}
            >
              Boldfy
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '8px 16px',
              borderRadius: 999,
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)',
              fontSize: 14,
              fontWeight: 600,
              color: 'rgba(255,255,255,0.9)',
            }}
          >
            Proposta personalizada · {dateStr}
          </div>
        </div>

        {/* ─── Lead info ─── */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            marginBottom: 24,
          }}
        >
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: 2,
              color: C.primaryLight,
              marginBottom: 6,
            }}
          >
            Para
          </div>
          <div
            style={{
              fontSize: 40,
              fontWeight: 900,
              letterSpacing: -1,
              lineHeight: 1.1,
              marginBottom: 4,
            }}
          >
            {proposal.lead.nome}
          </div>
          <div
            style={{
              fontSize: 20,
              color: 'rgba(255,255,255,0.7)',
              fontWeight: 500,
            }}
          >
            {proposal.lead.empresa}
            {proposal.lead.cargo && proposal.lead.cargo !== '—'
              ? ` · ${proposal.lead.cargo}`
              : ''}
          </div>
        </div>

        {/* ─── Módulos ─── */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            marginBottom: 20,
            flex: 1,
          }}
        >
          {modules.slice(0, 3).map((m) => (
            <div
              key={m.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '18px 22px',
                borderRadius: 14,
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 2 }}>
                  {m.label}
                </div>
                <div
                  style={{
                    fontSize: 14,
                    color: 'rgba(255,255,255,0.6)',
                  }}
                >
                  {m.detail}
                </div>
              </div>
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 900,
                  color: C.primaryLight,
                }}
              >
                {m.value}
              </div>
            </div>
          ))}
        </div>

        {/* ─── Total + beta badge ─── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '22px 28px',
            borderRadius: 16,
            background: `linear-gradient(135deg, ${C.primary}, ${C.primaryDark})`,
            boxShadow: '0 12px 32px rgba(205,80,241,0.4)',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: 1.5,
                opacity: 0.85,
                marginBottom: 2,
              }}
            >
              Total mensal
            </div>
            <div
              style={{
                fontSize: 44,
                fontWeight: 900,
                letterSpacing: -1,
                lineHeight: 1,
              }}
            >
              {fmtBRL(proposal.totals.current)}
            </div>
          </div>

          {proposal.betaActive && proposal.totals.savings > 0 && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '6px 14px',
                  borderRadius: 999,
                  background: 'rgba(255,255,255,0.22)',
                  fontSize: 14,
                  fontWeight: 800,
                  marginBottom: 4,
                }}
              >
                Beta · 30% off
              </div>
              <div
                style={{
                  fontSize: 15,
                  opacity: 0.9,
                  fontWeight: 600,
                }}
              >
                economia de {fmtBRL(proposal.totals.savings)}/mês
              </div>
            </div>
          )}
        </div>

        {/* ─── Footer ─── */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 24,
            fontSize: 13,
            color: 'rgba(255,255,255,0.5)',
          }}
        >
          <div>Válida por 15 dias · boldfy.com.br</div>
          <div>Content Intelligence para Employee-Led Growth</div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}
