/**
 * Danger Zone — operações destrutivas do CRM.
 *
 * Vive em URL-only pra não aparecer na nav padrão (evita acidente).
 * Acessar diretamente em /internal/crm/settings/danger-zone.
 *
 * Use case (mai/2026): preparar terreno pra começar o CRM zerado, partindo
 * só do AC como fonte. Snapshot antes do nuke como rede de proteção.
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { SnapshotButton } from './snapshot-button';
import { NukeButton } from './nuke-button';

export const metadata: Metadata = {
  title: 'Danger Zone',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default function DangerZonePage() {
  return (
    <div style={{ maxWidth: 720 }}>
      <div style={{ marginBottom: 20 }}>
        <Link href="/internal/crm" className="crm-btn">← Voltar pro CRM</Link>
      </div>

      <h1 style={{ fontFamily: 'var(--font-headline)', fontWeight: 900, fontSize: 28, color: '#5E2A67', marginBottom: 8 }}>
        ⚠ Danger Zone
      </h1>
      <p style={{ fontSize: 14, color: '#6B5B8A', marginBottom: 28, lineHeight: 1.5 }}>
        Operações destrutivas que não dá pra desfazer. Tem que ter certeza antes de tocar em qualquer botão aqui.
      </p>

      <section style={{ marginBottom: 32, padding: 20, background: '#FAF7FF', borderRadius: 14 }}>
        <h2 style={{ fontFamily: 'var(--font-headline)', fontWeight: 900, fontSize: 18, color: '#5E2A67', marginBottom: 8 }}>
          📥 Snapshot do CRM
        </h2>
        <p style={{ fontSize: 13, color: '#45336B', marginBottom: 16, lineHeight: 1.5 }}>
          Baixa um arquivo JSON com todas as pessoas, empresas, activities e meetings do CRM. Rede de proteção pra recuperar caso o nuke leve algo importante. Roda sempre que quiser — sem efeitos colaterais.
        </p>
        <SnapshotButton />
      </section>

      <section style={{ padding: 20, background: 'rgba(192, 57, 43, 0.05)', border: '1px solid rgba(192, 57, 43, 0.2)', borderRadius: 14 }}>
        <h2 style={{ fontFamily: 'var(--font-headline)', fontWeight: 900, fontSize: 18, color: '#C0392B', marginBottom: 8 }}>
          💣 Nuke do CRM
        </h2>
        <p style={{ fontSize: 13, color: '#45336B', marginBottom: 16, lineHeight: 1.5 }}>
          Apaga <strong>todas as pessoas, empresas, activities e meetings</strong>. Mantém statuses, tokens OAuth do Google e config geral. Use quando quiser começar o CRM zerado e re-popular pelo sync do AC.
        </p>
        <p style={{ fontSize: 12, color: '#9D85B3', marginBottom: 16, lineHeight: 1.5 }}>
          Fluxo recomendado: (1) Baixa o snapshot acima como backup, (2) clica em "Iniciar nuke" abaixo e confirma, (3) vai em <Link href="/internal/crm/settings/import" style={{ color: '#CD50F1' }}>/internal/crm/settings/import</Link> e roda o import do AC pra re-popular tudo a partir da fonte de verdade.
        </p>
        <NukeButton />
      </section>
    </div>
  );
}
