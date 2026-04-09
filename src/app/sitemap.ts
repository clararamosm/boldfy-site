import type { MetadataRoute } from 'next';
import { getPublishedPosts } from '@/lib/notion';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://boldfy.com.br';

  // Static pages — all public routes
  const highPriority = ['', '/solucoes/software-as-a-service', '/solucoes/content-as-a-service', '/precos'];
  const medPriority = ['/para/marketing', '/para/vendas', '/para/rh'];
  const lowPriority = ['/blog', '/privacidade', '/termos'];
  
  const staticPages = [...highPriority, ...medPriority, ...lowPriority].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' ? 'weekly' as const : 'monthly' as const,
    priority: highPriority.includes(route) ? (route === '' ? 1 : 0.9) : medPriority.includes(route) ? 0.8 : 0.6,
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
