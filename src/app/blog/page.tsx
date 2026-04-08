import { getPublishedPosts, type BlogPost } from '@/lib/notion';
import { BlogPageClient } from './blog-client';

export const revalidate = 300; // ISR: revalidate every 5 min

export default async function BlogPage() {
  const posts = await getPublishedPosts();
  return <BlogPageClient posts={posts} />;
}
