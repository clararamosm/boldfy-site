import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Agendar Demo',
  description: 'Agende uma demonstração da plataforma Boldfy.',
};

const CALENDAR_URL = 'https://calendar.app.google/5Q1HDD2jZSkWa1DH6';

export default function DemoPage() {
  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-2xl px-6 text-center">
        <Calendar className="h-12 w-12 text-primary mx-auto mb-6" />
        <h1 className="font-headline text-3xl md:text-4xl font-bold text-accent-foreground mb-4">
          Agende uma demo
        </h1>
        <p className="text-base text-muted-foreground mb-8 max-w-md mx-auto">
          Veja a Boldfy em ação. Escolha o melhor horário e a Clara te mostra como funciona.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild size="lg" className="font-bold">
            <a href={CALENDAR_URL} target="_blank" rel="noopener noreferrer">
              <Calendar className="w-4 h-4 mr-2" />
              Escolher horário
            </a>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao site
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
