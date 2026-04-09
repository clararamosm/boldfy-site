'use client';

import { useT } from '@/lib/i18n/context';
import { Users } from 'lucide-react';
import Image from 'next/image';

// Quando tiver a imagem, substituir null por '/images/team-collaboration.webp'
const teamImage: string | null = null;

export function SocialProofSection() {
  const t = useT();

  return (
    <section className="py-16 bg-secondary/30">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          {/* Text side */}
          <div>
            <span className="inline-flex text-[11px] font-bold uppercase tracking-[.14em] text-primary mb-4">
              {t.home.socialProofTag || 'Por que Employee Advocacy?'}
            </span>
            <h2 className="font-headline text-2xl md:text-3xl font-black text-accent-foreground leading-tight mb-4">
              {t.home.socialProofTitle || 'Perfis pessoais geram até 10x mais alcance que páginas corporativas'}
            </h2>
            <p className="text-base text-muted-foreground leading-relaxed mb-6">
              {t.home.socialProofText || 'Quando colaboradores compartilham conteúdo autêntico, a marca ganha credibilidade, alcance orgânico e conexões reais. Sem investir em mídia paga.'}
            </p>
            <div className="flex gap-8">
              <div>
                <p className="font-headline text-3xl font-black text-primary">10x</p>
                <p className="text-xs text-muted-foreground mt-1">{t.home.socialProofStat1Label || 'mais alcance orgânico'}</p>
              </div>
              <div>
                <p className="font-headline text-3xl font-black text-primary">8x</p>
                <p className="text-xs text-muted-foreground mt-1">{t.home.socialProofStat2Label || 'mais engajamento'}</p>
              </div>
              <div>
                <p className="font-headline text-3xl font-black text-primary">5x</p>
                <p className="text-xs text-muted-foreground mt-1">{t.home.socialProofStat3Label || 'mais cliques'}</p>
              </div>
            </div>
          </div>

          {/* Image side */}
          <div className="relative">
            <div className="rounded-2xl overflow-hidden shadow-lg shadow-primary/5 border border-border/50">
              {teamImage ? (
                <Image
                  src={teamImage}
                  alt="Equipe colaborando com Employee Advocacy"
                  width={600}
                  height={400}
                  className="w-full h-auto object-cover"
                />
              ) : (
                <div className="aspect-[3/2] flex items-center justify-center bg-secondary/30">
                  <div className="text-center">
                    <Users className="h-14 w-14 text-primary/20 mx-auto mb-3" />
                    <p className="text-sm font-medium text-muted-foreground/50">Foto: equipe colaborando</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
