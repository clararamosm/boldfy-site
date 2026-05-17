/**
 * Histórico de links UTM gerados — client component.
 *
 * Recebe a lista (vinda do server) já enriquecida com sessions GA4. Mostra:
 *   - Label (se tem) + utm_campaign
 *   - 3 pills com source/medium/campaign
 *   - URL longo + botão copiar
 *   - Sessions GA4 (cliques rastreados)
 *   - Botão Remover
 *   - Botão "Reusar" → preenche o form
 */

'use client';

import { useState } from 'react';
import { deleteUtmLink, clearAllUtmLinks } from './actions';

type LinkRow = {
  id: string;
  label: string | null;
  baseUrl: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmContent: string | null;
  utmTerm: string | null;
  fullUrl: string;
  createdAt: Date;
  sessionsGa4: number | null;
};

export function UtmHistory({ links }: { links: LinkRow[] }) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function handleCopy(id: string, url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      // ignored
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Remover esse link do histórico?')) return;
    await deleteUtmLink(id);
  }

  async function handleClearAll() {
    if (!confirm(`Apagar TODOS os ${links.length} links do histórico? Não dá pra desfazer.`)) return;
    await clearAllUtmLinks();
  }

  if (links.length === 0) {
    return (
      <div className="crm-detail-card" style={{ textAlign: 'center', padding: 40, color: '#9D85B3' }}>
        Nenhum link gerado ainda. Use o form acima pra começar.
      </div>
    );
  }

  return (
    <div className="crm-detail-card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <h2 style={{ fontFamily: 'var(--font-headline)', fontWeight: 900, fontSize: 18, color: '#5E2A67' }}>
          📜 Histórico ({links.length})
        </h2>
        <button onClick={handleClearAll} className="crm-btn" style={{ fontSize: 11, color: '#9D85B3' }}>
          Limpar tudo
        </button>
      </div>
      <p style={{ fontSize: 12, color: '#9D85B3', marginBottom: 16 }}>
        Links salvos no DB · Sessions GA4 dos últimos 90d cruzadas por utm_campaign
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {links.map((link) => (
          <div key={link.id} style={{ padding: 14, background: '#FAF7FF', borderRadius: 10, border: '1px solid #F0E5F8' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#5E2A67', marginBottom: 4 }}>
                  {link.label ?? link.utmCampaign}
                  {link.label ? <span style={{ fontWeight: 400, color: '#9D85B3', fontSize: 12, marginLeft: 8 }}>· {link.utmCampaign}</span> : null}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  <span style={{ padding: '2px 8px', background: 'rgba(59, 130, 246, 0.12)', color: '#3B82F6', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>source: {link.utmSource}</span>
                  <span style={{ padding: '2px 8px', background: 'rgba(245, 158, 11, 0.12)', color: '#92580E', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>medium: {link.utmMedium}</span>
                  <span style={{ padding: '2px 8px', background: 'rgba(205, 80, 241, 0.12)', color: '#CD50F1', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>campaign: {link.utmCampaign}</span>
                  {link.utmContent ? <span style={{ padding: '2px 8px', background: 'rgba(157, 133, 179, 0.12)', color: '#6B5B8A', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>content: {link.utmContent}</span> : null}
                  {link.utmTerm ? <span style={{ padding: '2px 8px', background: 'rgba(157, 133, 179, 0.12)', color: '#6B5B8A', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>term: {link.utmTerm}</span> : null}
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                {link.sessionsGa4 !== null ? (
                  <>
                    <div style={{ fontSize: 22, fontFamily: 'var(--font-headline)', fontWeight: 900, color: link.sessionsGa4 > 0 ? '#10B981' : '#9D85B3', lineHeight: 1 }}>
                      {link.sessionsGa4}
                    </div>
                    <div style={{ fontSize: 9, color: '#9D85B3', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginTop: 4 }}>
                      sessões GA4
                    </div>
                  </>
                ) : (
                  <div style={{ fontSize: 10, color: '#9D85B3' }}>sem GA4</div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 8, background: '#FFFFFF', borderRadius: 6, marginBottom: 8 }}>
              <code style={{ flex: 1, fontSize: 11, color: '#45336B', wordBreak: 'break-all' }}>{link.fullUrl}</code>
              <button onClick={() => handleCopy(link.id, link.fullUrl)} className="crm-btn" style={{ fontSize: 11, padding: '4px 10px', flexShrink: 0 }}>
                {copiedId === link.id ? '✓ Copiado' : '📋 Copiar'}
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, color: '#9D85B3' }}>
              <span>{new Date(link.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
              <button onClick={() => handleDelete(link.id)} style={{ background: 'transparent', border: 'none', color: '#C0392B', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>
                Remover
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
