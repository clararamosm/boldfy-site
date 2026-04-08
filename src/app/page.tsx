import { Button } from '@/components/ui/button';
import { LogoFull } from '@/components/logo';
import { ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-6xl px-6 py-24 text-center">
        <div className="mb-8">
          <LogoFull height={40} className="inline-flex" />
        </div>
        <span className="inline-flex text-[11px] font-bold uppercase tracking-[.14em] text-primary mb-4">
          Site institucional em construção
        </span>
        <h1 className="font-headline text-3xl md:text-5xl font-bold text-accent-foreground leading-tight mb-6">
          O maior canal de aquisição da sua empresa{' '}
          <span className="text-primary">já bate ponto todo dia.</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
          Plataforma gamificada que transforma colaboradores em influenciadores
          corporativos. IA contextual + trilhas + recompensas.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Button size="lg" className="font-bold">
            Agendar diagnóstico gratuito <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
          <Button variant="outline" size="lg">
            Ver como funciona
          </Button>
        </div>
      </main>
    </div>
  );
}
