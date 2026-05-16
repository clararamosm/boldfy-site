/**
 * Página pra conectar conta Google (OAuth) — substitui Service Account.
 *
 * Por que existe:
 *   GA4 admin UI e Search Console UI bloqueiam adicionar Service Account como
 *   usuário (bug conhecido do Google). Solução: OAuth de usuário — Clara
 *   autoriza UMA vez aqui, refresh_token salvo no DB, dashboards usam pra ler
 *   GA4/SC com permissão dela (que já tem acesso total).
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { isGoogleOauthConfigured, getConnectedAccount } from '@/lib/google-oauth';

export const metadata: Metadata = {
  title: 'Conectar Google — Dashboard',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

type SearchParams = Promise<{ error?: string; connected?: string }>;

export default async function ConnectGooglePage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const configured = isGoogleOauthConfigured();
  let account: Awaited<ReturnType<typeof getConnectedAccount>> = null;
  if (configured) {
    try {
      account = await getConnectedAccount();
    } catch {
      // DB pode estar sem a tabela ainda — ok
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Link href="/internal/dashboard" className="crm-btn">← Voltar pro Dashboard</Link>
      </div>

      <div className="crm-header">
        <div>
          <h1 className="crm-title">Conectar Google</h1>
          <p className="crm-subtitle">
            OAuth com sua conta @boldfy.com.br pra dashboards lerem GA4 + Search Console
          </p>
        </div>
      </div>

      {params.error ? (
        <div style={{ padding: 14, background: 'rgba(238, 90, 82, 0.08)', border: '1px solid rgba(238, 90, 82, 0.25)', borderRadius: 10, color: '#C0392B', fontSize: 13, marginBottom: 16 }}>
          <strong>Erro:</strong> {decodeURIComponent(params.error)}
        </div>
      ) : null}

      {params.connected ? (
        <div style={{ padding: 14, background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: 10, color: '#066B4D', fontSize: 13, marginBottom: 16 }}>
          ✓ <strong>Conectado como {decodeURIComponent(params.connected)}.</strong> Dashboards de Tráfego e SEO já podem buscar dados.
        </div>
      ) : null}

      <div className="crm-detail-card">
        {!configured ? (
          <div>
            <h2 style={{ fontFamily: 'var(--font-headline)', fontWeight: 900, fontSize: 16, color: '#5E2A67', marginBottom: 12 }}>
              ⚠️ OAuth Client não configurado
            </h2>
            <p style={{ fontSize: 13, color: '#45336B', lineHeight: 1.6, marginBottom: 14 }}>
              Falta configurar no Vercel:
            </p>
            <ul style={{ fontSize: 13, color: '#45336B', lineHeight: 1.7, paddingLeft: 20, marginBottom: 18 }}>
              <li><code>GOOGLE_OAUTH_CLIENT_ID</code></li>
              <li><code>GOOGLE_OAUTH_CLIENT_SECRET</code></li>
              <li><code>GOOGLE_OAUTH_REDIRECT_URI</code> = <code>https://www.boldfy.com.br/api/auth/google/callback</code></li>
            </ul>
            <p style={{ fontSize: 12, color: '#9D85B3', lineHeight: 1.6 }}>
              Cria o Client em: <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" style={{ color: '#CD50F1' }}>console.cloud.google.com/apis/credentials</a> → Criar credenciais → ID do cliente OAuth → Aplicativo da Web → Origens autorizadas: <code>https://www.boldfy.com.br</code> · URIs de redirecionamento autorizados: o REDIRECT_URI acima.
            </p>
          </div>
        ) : account ? (
          <div>
            <h2 style={{ fontFamily: 'var(--font-headline)', fontWeight: 900, fontSize: 16, color: '#5E2A67', marginBottom: 12 }}>
              ✓ Google conectado
            </h2>
            <div style={{ fontSize: 13, color: '#45336B', lineHeight: 1.8, marginBottom: 18 }}>
              <div><strong>Email:</strong> {account.email}</div>
              <div><strong>Expira em:</strong> {account.expiresAt.toLocaleString('pt-BR')}</div>
              <div><strong>Scopes:</strong></div>
              <ul style={{ paddingLeft: 20, fontSize: 12, color: '#9D85B3' }}>
                {account.scopes.map((s) => (
                  <li key={s}><code>{s.replace('https://www.googleapis.com/auth/', '')}</code></li>
                ))}
              </ul>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <a href="/api/auth/google/start" className="crm-btn">🔄 Reconectar (refresh)</a>
              <Link href="/internal/dashboard/trafego" className="crm-btn crm-btn-primary">Ir pro Tráfego →</Link>
            </div>
          </div>
        ) : (
          <div>
            <h2 style={{ fontFamily: 'var(--font-headline)', fontWeight: 900, fontSize: 16, color: '#5E2A67', marginBottom: 12 }}>
              Conectar conta Google
            </h2>
            <p style={{ fontSize: 13, color: '#45336B', lineHeight: 1.6, marginBottom: 14 }}>
              Clica no botão abaixo, escolhe a conta @boldfy.com.br (com acesso ao GA4 e Search Console), e autoriza os scopes de leitura. Vai funcionar imediatamente.
            </p>
            <div style={{ padding: 12, background: 'rgba(157, 133, 179, 0.08)', borderRadius: 8, fontSize: 12, color: '#5E2A67', marginBottom: 18 }}>
              💡 Scopes: <code>analytics.readonly</code> + <code>webmasters.readonly</code> + <code>userinfo.email</code>. Não escreve nada, só lê.
            </div>
            <a href="/api/auth/google/start" className="crm-btn crm-btn-primary">🔐 Conectar com Google</a>
          </div>
        )}
      </div>
    </div>
  );
}
