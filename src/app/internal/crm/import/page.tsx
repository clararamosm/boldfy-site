import 'server-only';
import { db } from '@/db';
import { campaigns } from '@/db/schema';
import { desc } from 'drizzle-orm';
import { ImportClient } from './import-client';

export const dynamic = 'force-dynamic';

export default async function ImportPage() {
  const camps = await db
    .select({ slug: campaigns.slug, name: campaigns.name })
    .from(campaigns)
    .orderBy(desc(campaigns.createdAt));

  return (
    <div>
      <h1 className="text-2xl font-bold text-purple-900">Inserir leads</h1>
      <p className="mt-1 text-sm text-gray-500">
        Importe uma lista (CSV) — de scanner de evento, planilha, ou qualquer
        fonte. Você escolhe o de-para das colunas e o que vai junto: campanha,
        tags e segmento. Contatos importados entram marcados como inserção
        manual.
      </p>
      <ImportClient campaigns={camps} />
    </div>
  );
}
