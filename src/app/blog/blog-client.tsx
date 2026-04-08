'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useT } from '@/lib/i18n/context';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowRight, Clock, Send } from 'lucide-react';
import type { BlogPost } from '@/lib/notion';

interface BlogPageClientProps {
  posts: BlogPost[];
}

function PostCard({ post }: { post: BlogPost }) {
  const t = useT();

  return (
    <Link href={`/blog/${post.slug}`} className="group block">
      <article className="rounded-xl border border-border bg-card overflow-hidden transition-shadow hover:shadow-md hover:border-primary/20">
        {/* Cover image */}
        {post.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.coverUrl}
            alt={post.title}
            className="w-full h-48 object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-48 bg-primary/5 flex items-center justify-center">
            <span className="text-4xl font-bold text-primary/20">B</span>
          </div>
        )}

        <div className="p-5">
          <Badge variant="secondary" className="mb-3 text-[10px]">
            {post.category}
          </Badge>
          <h2 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors mb-2 line-clamp-2">
            {post.title}
          </h2>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
            {post.summary}
          </p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {post.readTime} {t.blog.readTime}
            </div>
            <span className="text-sm font-medium text-primary group-hover:underline flex items-center gap-1">
              {t.blog.readMore}
              <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}

export function BlogPageClient({ posts }: BlogPageClientProps) {
  const t = useT();
  const [activeCategory, setActiveCategory] = useState('all');

  const categories = [
    { key: 'all', label: t.blog.categories.all },
    { key: 'Employee Advocacy', label: t.blog.categories.employeeAdvocacy },
    { key: 'Social Selling', label: t.blog.categories.socialSelling },
    { key: 'Employer Branding', label: t.blog.categories.employerBranding },
    { key: 'Marketing B2B', label: t.blog.categories.marketingB2B },
    { key: 'Cultura & Pessoas', label: t.blog.categories.culturaPessoas },
    { key: 'Produto', label: t.blog.categories.produto },
  ];

  const filteredPosts = activeCategory === 'all'
    ? posts
    : posts.filter((p) => p.category === activeCategory);

  return (
    <>
      {/* Hero */}
      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-accent-foreground mb-3">
            {t.blog.title}
          </h1>
          <p className="text-base text-muted-foreground max-w-lg mx-auto">
            {t.blog.subtitle}
          </p>
        </div>
      </section>

      {/* Category filters */}
      <section className="pb-8">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-wrap gap-2 justify-center">
            {categories.map((cat) => (
              <button
                key={cat.key}
                type="button"
                onClick={() => setActiveCategory(cat.key)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  activeCategory === cat.key
                    ? 'bg-primary text-white'
                    : 'bg-secondary text-foreground/70 hover:text-foreground'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Posts grid */}
      <section className="pb-20">
        <div className="mx-auto max-w-6xl px-6">
          {filteredPosts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-lg text-muted-foreground">
                Em breve novos conteúdos aqui! Enquanto isso, assine a newsletter.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-16 bg-primary/5">
        <div className="mx-auto max-w-lg px-6 text-center">
          <h2 className="text-xl font-bold text-accent-foreground mb-2">
            {t.blog.newsletter.title}
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            {t.blog.newsletter.subtitle}
          </p>
          <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
            <Input
              type="email"
              placeholder={t.blog.newsletter.placeholder}
              className="flex-1"
            />
            <Button type="submit">
              {t.blog.newsletter.cta}
              <Send className="h-4 w-4 ml-1.5" />
            </Button>
          </form>
        </div>
      </section>
    </>
  );
}
