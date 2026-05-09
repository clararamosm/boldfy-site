/**
 * Catalogo interno (nao-listado) — URLs prontas pra copiar e colar nos
 * blog posts via Notion embed.
 *
 * Acesso: pagina nao linkada de lugar nenhum no site.
 * SEO: noindex/nofollow + bloqueio em robots.ts.
 *
 * Atualiza automaticamente quando MATERIAIS / INFOGRAFICOS sao atualizados
 * — eh a fonte de verdade lendo os mesmos catalogos que o NotionRenderer usa.
 */

import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { MATERIAIS } from '@/lib/materiais';
import { INFOGRAFICOS } from '@/lib/infograficos';
import { CopyButton } from './copy-button';

export const metadata: Metadata = {
  title: 'Catálogo interno — Boldfy',
  description: 'Catálogo de materiais e infográficos para uso interno.',
  robots: {
    index: false,
    follow: false,
  },
};

const SITE_URL = 'https://boldfy.com.br';

export default function CatalogoInternoPage() {
  const materiais = Object.values(MATERIAIS);
  const infograficos = Object.values(INFOGRAFICOS);

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <header className="mb-10">
        <span className="mb-3 inline-block rounded-full border border-primary/25 bg-primary/[0.08] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-primary">
          Interno · não indexado
        </span>
        <h1 className="font-headline text-3xl font-black text-accent-foreground md:text-4xl">
          Catálogo
        </h1>
        <p className="mt-2 text-muted-foreground">
          URLs prontas pra colar dentro de blog posts via{' '}
          <code className="rounded bg-secondary px-1.5 py-0.5 text-xs">/embed</code>{' '}
          no Notion. Substitua{' '}
          <code className="rounded bg-secondary px-1.5 py-0.5 text-xs">[slug-do-post]</code>{' '}
          pelo slug do artigo onde está embedando.
        </p>
      </header>

      {/* ============================================================ */}
      {/*  Materiais                                                   */}
      {/* ============================================================ */}
      <section className="mb-12">
        <h2 className="mb-4 font-headline text-xl font-black text-accent-foreground">
          Materiais ({materiais.length})
        </h2>

        {materiais.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border bg-card p-6 text-sm text-muted-foreground">
            Nenhum material cadastrado ainda.
          </p>
        ) : (
          <ul className="flex flex-col gap-4">
            {materiais.map((m) => {
              const url = `${SITE_URL}/embed/material/${m.slug}?source=[slug-do-post]`;
              return (
                <li
                  key={m.slug}
                  className="rounded-xl border border-border bg-card p-4 sm:p-5"
                >
                  <div className="flex items-start gap-4">
                    {/* Mini capa */}
                    <div className="relative aspect-[4/3] w-20 shrink-0 overflow-hidden rounded-lg sm:w-28">
                      <Image
                        src={m.cover}
                        alt={m.title}
                        fill
                        className="object-cover"
                        sizes="112px"
                      />
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-primary">
                        {m.tag}
                      </span>
                      <h3 className="mt-0.5 text-base font-bold text-accent-foreground">
                        {m.title}
                      </h3>
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                        {m.description}
                      </p>
                      <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                        <span>LP:</span>
                        <Link
                          href={m.href}
                          target="_blank"
                          className="text-primary underline hover:no-underline"
                        >
                          {m.href}
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* URL copiável */}
                  <div className="mt-3 flex items-stretch gap-2 rounded-lg bg-secondary/40 p-2">
                    <code className="flex-1 overflow-x-auto whitespace-nowrap px-2 py-1.5 text-xs text-foreground">
                      {url}
                    </code>
                    <CopyButton value={url} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* ============================================================ */}
      {/*  Infográficos                                                 */}
      {/* ============================================================ */}
      <section>
        <h2 className="mb-4 font-headline text-xl font-black text-accent-foreground">
          Infográficos ({infograficos.length})
        </h2>

        {infograficos.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border bg-card p-6 text-sm text-muted-foreground">
            Nenhum infográfico cadastrado ainda. Quando você pedir o primeiro,
            ele aparece aqui automaticamente com a URL pra colar.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {infograficos.map(({ meta }) => {
              const url = `${SITE_URL}/embed/grafico/${meta.slug}?source=[slug-do-post]`;
              return (
                <li
                  key={meta.slug}
                  className="rounded-xl border border-border bg-card p-4"
                >
                  <h3 className="text-base font-bold text-accent-foreground">
                    {meta.title}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Slug:{' '}
                    <code className="rounded bg-secondary px-1.5 py-0.5">
                      {meta.slug}
                    </code>
                  </p>
                  <div className="mt-3 flex items-stretch gap-2 rounded-lg bg-secondary/40 p-2">
                    <code className="flex-1 overflow-x-auto whitespace-nowrap px-2 py-1.5 text-xs text-foreground">
                      {url}
                    </code>
                    <CopyButton value={url} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <footer className="mt-16 rounded-xl border border-border bg-secondary/30 p-5 text-sm text-muted-foreground">
        <strong className="text-foreground">Como usar:</strong> no Notion, dentro
        do post, use o slash command <code className="rounded bg-card px-1 py-0.5 text-xs">/embed</code>{' '}
        e cole a URL acima — antes, troque{' '}
        <code className="rounded bg-card px-1 py-0.5 text-xs">[slug-do-post]</code>{' '}
        pelo slug real do artigo (a URL do post depois do <code className="rounded bg-card px-1 py-0.5 text-xs">/blog/</code>).
        Isso garante que os UTMs no AC mostrem qual artigo originou cada lead.
      </footer>
    </div>
  );
}
