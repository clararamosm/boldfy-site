import type { Metadata } from 'next';
import { getPublishedPosts, type BlogPost } from '@/lib/notion';
import { BlogPageClient } from './blog-client';

export const revalidate = 300; // ISR: revalidate every 5 min

export const metadata: Metadata = {
  title: 'Blog · Boldfy',
  description:
    'Conteúdo sobre Employee-Led Growth, LinkedIn B2B, employee advocacy e estratégia de conteúdo para times de marketing, vendas e RH.',
  openGraph: {
    title: 'Blog · Boldfy',
    description:
      'Conteúdo sobre Employee-Led Growth, LinkedIn B2B, employee advocacy e estratégia de conteúdo para times de marketing, vendas e RH.',
    url: 'https://boldfy.com.br/blog',
    images: [
      {
        url: '/images/og-default.jpg',
        width: 1200,
        height: 630,
        alt: 'Blog Boldfy · Content Intelligence para Employee-Led Growth',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Blog · Boldfy',
    description:
      'Conteúdo sobre Employee-Led Growth, LinkedIn B2B, employee advocacy e estratégia de conteúdo para times de marketing, vendas e RH.',
    images: ['/images/og-default.jpg'],
  },
  alternates: {
    canonical: 'https://boldfy.com.br/blog',
  },
};

export default async function BlogPage() {
  const posts = await getPublishedPosts();
  return <BlogPageClient posts={posts} />;
}
