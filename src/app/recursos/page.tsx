import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Recursos',
  description: 'Recursos e materiais sobre Content Intelligence e Employee-Led Growth.',
};

export default function RecursosPage() {
  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-2xl px-6 text-center">
        <BookOpen className="h-12 w-12 text-primary mx-auto mb-6" />
        <h1 className="font-headline text-3xl md:text-4xl font-black text-accent-foreground mb-4">
          Em breve
        </h1>
        <p className="text-base text-muted-foreground mb-8 max-w-md mx-auto">
          Estamos preparando conteúdos, ferramentas e materiais sobre Content Intelligence e Employee-Led Growth. Volte em breve.
        </p>
        <Button asChild variant="outline" size="lg">
          <Link href="/">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao site
          </Link>
        </Button>
      </div>
    </section>
  );
}
