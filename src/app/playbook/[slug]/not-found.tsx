import Link from 'next/link';
import { ArrowRight, Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Página de não-encontrado pra /playbook/[slug].
 *
 * Disparada quando `notFound()` é chamado no page.tsx (slug inexistente
 * ou playbook deletado). Mensagem útil + CTA pra refazer o quiz.
 */
export default function PlaybookNotFound() {
  return (
    <section className="relative flex min-h-[80vh] items-center justify-center px-6 py-20">
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-48 -top-48 h-[600px] w-[600px] rounded-full bg-primary opacity-[0.06] blur-[120px]" />
      </div>
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-full bg-primary/10">
          <Compass className="h-7 w-7 text-primary" />
        </div>
        <h1 className="mb-4 font-headline text-3xl font-black tracking-tight text-foreground">
          Playbook não encontrado
        </h1>
        <p className="mb-8 text-base leading-relaxed text-muted-foreground">
          O link que você abriu não existe ou expirou. Pode ser um typo na URL, ou o playbook foi
          deletado. Cria o seu agora em 5 minutos.
        </p>
        <Button asChild size="lg">
          <Link href="/ferramentas/playbook-team-led-growth">
            Fazer meu playbook
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </section>
  );
}
