import type { MetadataRoute } from 'next';
import { getPublishedPosts } from '@/lib/notion';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://boldfy.com.br';

  // Static pages
  const staticPages = [
    '',
    '/plataforma',
    '/casos-de-uso/marketing',
    '/casos-de-uso/social-selling',
    '/casos-de-uso/employer-branding',
    '/precos',
    '/servico',
    '/blog',
    '/sobre',
    '/contato',
    '/privacidade',
    '/termos',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' ? 'weekly' as const : 'monthly' as const,
    priority: route === '' ? 1 : route === '/plataforma' || route === '/precos' ? 0.9 : 0.7,
  }));

  // Dynamic blog posts
  let blogPages: MetadataRoute.Sitemap = [];
  try {
    const posts = await getPublishedPosts();
    blogPages = posts.map((post) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: post.publishedAt ? new Date(post.publishedAt) : new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }));
  } catch {
    // Notion might not be configured yet
  }

  return [...staticPages, ...blogPages];
}
