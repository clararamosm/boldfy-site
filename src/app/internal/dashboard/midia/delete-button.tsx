'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { deleteArticle } from './actions';

export function DeleteArticleButton({ id, title }: { id: string; title: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm(`Apagar artigo "${title}"?`)) return;
    startTransition(async () => {
      const res = await deleteArticle(id);
      if (!res.ok) {
        alert(`Erro: ${res.error}`);
      }
      router.refresh();
    });
  }

  return (
    <button onClick={handleDelete} disabled={pending} className="crm-btn" style={{ padding: '4px 10px', fontSize: 11, color: '#C0392B' }}>
      Apagar
    </button>
  );
}
