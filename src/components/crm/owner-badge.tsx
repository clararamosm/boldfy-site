/**
 * Avatar do responsável NO CARD do kanban, clicável.
 *
 * Clicar abre um mini-popover pra trocar o dono (Clara ↔ José) sem sair do
 * kanban. Usa posição fixed ancorada no botão pra não ser cortado pelo
 * overflow das colunas. Não é auth — só troca a etiqueta de responsável.
 */

'use client';

import { useState, useEffect, useRef, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { setPersonOwner } from '@/app/internal/crm/actions';
import { initials } from '@/lib/crm-format';

export type OwnerOption = { id: string; name: string; photoUrl: string | null };

type Props = {
  personId: string;
  currentOwnerId: string | null;
  users: OwnerOption[];
};

function Avatar({ user, size }: { user: OwnerOption | null; size: number }) {
  return (
    <span
      className="crm-owner-badge"
      style={{ width: size, height: size, fontSize: size < 24 ? 8 : 10 }}
    >
      {user?.photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={user.photoUrl} alt="" />
      ) : user ? (
        initials(user.name)
      ) : (
        '+'
      )}
    </span>
  );
}

export function OwnerBadge({ personId, currentOwnerId, users }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const [optimisticId, setOptimisticId] = useState<string | null>(currentOwnerId);
  const btnRef = useRef<HTMLButtonElement>(null);

  const current = users.find((u) => u.id === optimisticId) ?? null;

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (btnRef.current && !btnRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    window.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onKey);
    window.addEventListener('scroll', () => setOpen(false), true);
    return () => {
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      // Abre o menu acima-esquerda do avatar (avatar fica no canto inf. direito).
      setPos({ top: r.top, left: r.left });
    }
    setOpen((v) => !v);
  }

  function pick(e: React.MouseEvent, ownerId: string) {
    e.preventDefault();
    e.stopPropagation();
    setOpen(false);
    if (ownerId === optimisticId) return;
    setOptimisticId(ownerId);
    startTransition(async () => {
      const res = await setPersonOwner(personId, ownerId);
      if (res.ok) router.refresh();
      else setOptimisticId(currentOwnerId);
    });
  }

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        disabled={pending}
        className="crm-owner-badge-btn"
        title={current ? `Responsável: ${current.name} (trocar)` : 'Atribuir responsável'}
        aria-label={current ? `Responsável: ${current.name}` : 'Atribuir responsável'}
        style={{ opacity: pending ? 0.5 : 1 }}
      >
        <Avatar user={current} size={20} />
      </button>

      {open && pos ? (
        <div
          className="crm-owner-menu"
          style={{ position: 'fixed', top: pos.top, left: pos.left, transform: 'translate(-100%, -100%)' }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="crm-owner-menu-title">Responsável</div>
          {users.map((u) => (
            <button
              key={u.id}
              type="button"
              onClick={(e) => pick(e, u.id)}
              className={`crm-owner-menu-item ${u.id === optimisticId ? 'active' : ''}`}
            >
              <Avatar user={u} size={22} />
              <span>{u.name}</span>
              {u.id === optimisticId ? <span className="crm-owner-menu-check">✓</span> : null}
            </button>
          ))}
        </div>
      ) : null}
    </>
  );
}
