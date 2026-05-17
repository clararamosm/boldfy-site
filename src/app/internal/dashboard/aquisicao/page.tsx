/**
 * BISECT MINIMAL — versão completa em page-full.tsx.bak.
 * Adicionar imports/componentes UM POR UM até quebrar pra identificar culpado real.
 *
 * Esta versão tem ABSOLUTAMENTE NADA — só HTML estático. Se quebrar, problema
 * é em level higher (layout, error.tsx, topbar...).
 */

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard · Aquisição (bisect)',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function AquisicaoBisect() {
  return (
    <div>
      <div className="dash-header">
        <div>
          <h1 className="dash-title">Aquisição (bisect)</h1>
          <p className="dash-subtitle">
            Se você está vendo isso, a base funciona. Vou adicionar coisa por coisa nos próximos commits até reproduzir o bug.
          </p>
        </div>
      </div>

      <div className="dash-card">
        <div className="dash-card-title">✅ Page renderizada com sucesso</div>
        <div style={{ padding: 18, color: '#45336B' }}>
          <p><strong>Camadas que SABEMOS que funcionam:</strong></p>
          <ul style={{ paddingLeft: 20, marginTop: 8, lineHeight: 1.7 }}>
            <li>Layout do dashboard (sub-nav, internal-topbar, error.tsx wrapper)</li>
            <li>Server Component bare async</li>
            <li>Metadata + force-dynamic</li>
          </ul>
          <p style={{ marginTop: 12 }}><strong>Próximo bisect:</strong> adicionar 1 import ou 1 componente por commit.</p>
        </div>
      </div>
    </div>
  );
}
