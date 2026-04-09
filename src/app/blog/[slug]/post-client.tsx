'use client';

import { useT } from '@/lib/i18n/context';
import { Button } from '@/components/ui/button';
import { useDemoPopup } from '@/components/forms/demo-popup';
import { Badge } from '@/components/ui/badge';
import { NotionRenderer } from '@/components/notion-renderer';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Clock, User } from 'lucide-react';
import type { BlogPost, NotionBlock } from '@/lib/notion';

interface BlogPostClientProps {
  post: BlogPost;
  blocks: NotionBlock[];
}

export function BlogPostClient({ post, blocks }: BlogPostClientProps) {
  const t = useT();
  const { openPopup } = useDemoPopup();

  return (
    <>
      {/* Breadcrumb */}
      <section className="pt-8">
        <div className="mx-auto max-w-3xl px-6">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {t.common.back}
          </Link>
        </div>
      </section>

      {/* Post header */}
      <article className="py-8 md:py-12">
        <div className="mx-auto max-w-3xl px-6">
          <Badge variant="secondary" className="mb-4">
            {post.category}
          </Badge>
          <h1 className="font-headline text-2xl md:text-4xl font-black text-accent-foreground leading-tight mb-4">
            {post.title}
          </h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-8">
            <span className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" />
              {post.author}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {post.readTime} {t.blog.readTime}
            </span>
            {post.publishedAt && (
              <span>
                {new Date(post.publishedAt).toLocaleDateString('pt-BR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            )}
          </div>

          {/* Cover */}
          {post.coverUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.coverUrl}
              alt={post.title}
              className="w-full rounded-xl mb-10"
            />
          )}

          {/* Content */}
          <NotionRenderer blocks={blocks} />

          {/* Author card */}
          {post.author && (
            <div className="mt-12 rounded-xl border border-border bg-card p-6 flex flex-col sm:flex-row items-center sm:items-start gap-5">
              {/* Avatar */}
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xl font-bold shrink-0">
                {post.author.charAt(0)}
              </div>
              <div className="flex-1 text-center sm:text-left">
                <div className="flex items-center gap-2 justify-center sm:justify-start">
                  <h3 className="text-base font-bold text-foreground">{post.author}</h3>
                  {post.authorLinkedIn && (
                    <a
                      href={post.authorLinkedIn}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`LinkedIn de ${post.author}`}
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                      </svg>
                    </a>
                  )}
                </div>
                {post.authorBio && (
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                    {post.authorBio}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="mt-12 rounded-xl border border-primary/20 bg-primary/5 p-8 text-center">
            <p className="text-lg font-bold text-accent-foreground mb-4">
              {t.blog.postCta}
            </p>
            <Button  className="font-bold" onClick={openPopup}>
              
                {t.blog.postCtaButton}
                <ArrowRight className="h-4 w-4 ml-2" />
              
            </Button>
          </div>
        </div>
      </article>
    </>
  );
}
