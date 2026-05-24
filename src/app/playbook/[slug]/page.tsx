import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db, playbookOutputs } from '@/db';
import type { RenderedData } from '@/lib/playbook/templates/types';
import { PlaybookOutput } from '@/components/playbook/output/playbook-output';
import { incrementPlaybookView } from './track-action';

/**
 * Página personalizada do Playbook de Employee-Led Growth.
 *
 * URL: /playbook/[slug] — slug = `[kebab-empresa]-[6-char-hash]`
 *
 * - Server component que busca `playbook_outputs` por slug e renderiza
 *   o `<PlaybookOutput>` (client orquestrador).
 * - 404 se slug não existe.
 * - Headers `noindex, nofollow` — link compartilhável mas não indexável (§11.1).
 * - Tracking de view via `incrementPlaybookView` (best-effort, fire-and-forget).
 *
 * Spec: source-of-truth/specs/playbook-employee-led-growth.md +
 *       source-of-truth/specs/playbook-employee-led-growth-copy-final.md
 */

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  // Buscar nome da empresa pra title — não bloqueia render se falhar
  let empresa = 'sua empresa';
  try {
    const [row] = await db
      .select({ renderedData: playbookOutputs.renderedData })
      .from(playbookOutputs)
      .where(eq(playbookOutputs.slug, slug))
      .limit(1);
    if (row) {
      const rd = row.renderedData as RenderedData;
      empresa = rd.hero?.headlineEmpresa ?? empresa;
    }
  } catch {
    /* noop — fallback no nome genérico */
  }

  return {
    title: `Playbook de Employee-Led Growth · ${empresa}`,
    description:
      'Estratégia personalizada de Employee-Led Growth com diagnóstico, plano em fases, dicas e calculadora de earned media.',
    // Privacy: noindex/nofollow/noarchive/nosnippet/noimageindex (spec §11.1)
    robots: {
      index: false,
      follow: false,
      noarchive: true,
      nosnippet: true,
      noimageindex: true,
    },
    alternates: {
      canonical: `https://boldfy.com.br/playbook/${slug}`,
    },
  };
}

export default async function PlaybookSlugPage({ params }: PageProps) {
  const { slug } = await params;

  const [row] = await db
    .select({
      slug: playbookOutputs.slug,
      renderedData: playbookOutputs.renderedData,
      templateKey: playbookOutputs.templateKey,
      createdAt: playbookOutputs.createdAt,
    })
    .from(playbookOutputs)
    .where(eq(playbookOutputs.slug, slug))
    .limit(1);

  if (!row) {
    notFound();
  }

  // Fire-and-forget tracking — não bloqueia render. Se falhar, página
  // funciona normal e o erro é logado pelo server action.
  void incrementPlaybookView(slug);

  return (
    <PlaybookOutput
      slug={row.slug}
      templateKey={row.templateKey}
      data={row.renderedData as RenderedData}
    />
  );
}
