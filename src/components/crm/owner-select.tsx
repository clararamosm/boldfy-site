/**
 * Seletor de dono do lead — usado na sidebar do perfil da pessoa.
 *
 * Mostra os membros do time como avatares clicáveis; clicar reatribui o lead
 * via setPersonOwner. Não é auth — só troca a etiqueta de responsável.
 */

'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { setPersonOwner } from '@/app/internal/crm/actions';
import { initials } from '@/lib/crm-format';

type OwnerOption = { id: string; name: string; photoUrl: string | null };

type Props = {
  personId: string;
  currentOwnerId: string | null;
  users: OwnerOption[];
};

export function OwnerSelect({ personId, currentOwnerId, users }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [optimisticId, setOptimisticId] = useState<string | null>(currentOwnerId);

  function assign(ownerId: string | null) {
    if (pending) return;
    const target = ownerId === optimisticId ? null : ownerId; // clicar no atual desvincula
    setOptimisticId(target);
    setError(null);
    startTransition(async () => {
      const res = await setPersonOwner(personId, target);
      if (!res.ok) {
        setOptimisticId(currentOwnerId);
        setError(res.error);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {users.map((u) => {
          const active = u.id === optimisticId;
          return (
            <button
              key={u.id}
              type="button"
              onClick={() => assign(u.id)}
              disabled={pending}
              title={active ? `${u.name} (clique pra remover)` : `Atribuir pra ${u.name}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 10px 6px 6px',
                borderRadius: 999,
                border: active ? '2px solid #CD50F1' : '1px solid #E7DBF0',
                background: active ? 'rgba(205, 80, 241, 0.08)' : '#fff',
                cursor: pending ? 'default' : 'pointer',
                opacity: pending ? 0.6 : 1,
                fontSize: 12,
                fontWeight: 600,
                color: '#45336B',
              }}
            >
              <span
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: '50%',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#EED9F5',
                  color: '#5E2A67',
                  fontSize: 10,
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {u.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={u.photoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  initials(u.name)
                )}
              </span>
              {u.name}
            </button>
          );
        })}
      </div>
      {error ? (
        <div style={{ fontSize: 11, color: '#C0392B', marginTop: 8 }}>{error}</div>
      ) : (
        <div style={{ fontSize: 10, color: '#9D85B3', marginTop: 10 }}>
          Lead novo de formulário cai na Clara até alguém reatribuir aqui.
        </div>
      )}
    </div>
  );
}
