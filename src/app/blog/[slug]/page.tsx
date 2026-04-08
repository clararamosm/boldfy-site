import { getPostBySlug, getPageBlocks, getPublishedPosts } from '@/lib/notion';
import { notFound } from 'next/navigation';
import { BlogPostClient } from './post-client';

export const revalidate = 300;

export async function generateStaticParams() {
  const posts = await getPublishedPosts();
  return posts.map((p) => ({ slug: p.slug }));
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const blocks = await getPageBlocks(post.id);

  return <BlogPostClient post={post} blocks={blocks} />;
}
