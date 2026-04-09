import type { Metadata } from 'next';
import { getPostBySlug, getPageBlocks, getPublishedPosts } from '@/lib/notion';
import { notFound } from 'next/navigation';
import { BlogPostClient } from './post-client';

export const revalidate = 300;

/* -------------------------------------------------------------------------- */
/*  Static params (SSG)                                                       */
/* -------------------------------------------------------------------------- */

export async function generateStaticParams() {
  const posts = await getPublishedPosts();
  return posts.map((p) => ({ slug: p.slug }));
}

/* -------------------------------------------------------------------------- */
/*  SEO — generateMetadata                                                    */
/* -------------------------------------------------------------------------- */

const SITE_URL = 'https://boldfy.com.br';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return {};

  const title = post.metaTitle || post.title;
  const description = post.metaDescription || post.summary;
  const ogTitle = post.ogTitle || title;
  const ogDescription = post.ogDescription || description;
  const canonical = post.canonicalUrl || `${SITE_URL}/blog/${post.slug}`;

  // Palavras-chave combinadas
  const keywords = [post.keywordPrincipal, ...post.keywordsSecundarias.split(',').map(k => k.trim())]
    .filter(Boolean);

  return {
    title,
    description,
    keywords: keywords.length > 0 ? keywords : undefined,

    // Canonical URL
    alternates: {
      canonical,
    },

    // Robots — respeita campo "Indexar" do Notion
    robots: post.indexar
      ? { index: true, follow: true }
      : { index: false, follow: false },

    // Open Graph
    openGraph: {
      type: 'article',
      locale: 'pt_BR',
      url: canonical,
      siteName: 'Boldfy',
      title: ogTitle,
      description: ogDescription,
      publishedTime: post.publishedAt || undefined,
      authors: post.author ? [post.author] : undefined,
      tags: post.tags.length > 0 ? post.tags : undefined,
      ...(post.coverUrl ? { images: [{ url: post.coverUrl, alt: post.title }] } : {}),
    },

    // Twitter Card
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      description: ogDescription,
      ...(post.coverUrl ? { images: [post.coverUrl] } : {}),
    },
  };
}

/* -------------------------------------------------------------------------- */
/*  Page component                                                            */
/* -------------------------------------------------------------------------- */

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const blocks = await getPageBlocks(post.id);

  // Schema.org Article structured data
  const canonical = post.canonicalUrl || `${SITE_URL}/blog/${post.slug}`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': post.schemaType || 'Article',
    headline: post.metaTitle || post.title,
    description: post.metaDescription || post.summary,
    url: canonical,
    datePublished: post.publishedAt || undefined,
    dateModified: post.publishedAt || undefined,
    author: {
      '@type': 'Person',
      name: post.author,
      ...(post.authorLinkedIn ? { url: post.authorLinkedIn } : {}),
    },
    publisher: {
      '@type': 'Organization',
      name: 'Boldfy',
      url: SITE_URL,
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': canonical,
    },
    ...(post.coverUrl
      ? { image: { '@type': 'ImageObject', url: post.coverUrl } }
      : {}),
    ...(post.keywordPrincipal ? { keywords: post.keywordPrincipal } : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BlogPostClient post={post} blocks={blocks} />
    </>
  );
}
