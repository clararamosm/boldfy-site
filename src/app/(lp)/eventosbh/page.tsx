'use client';

/**
 * /eventosbh — Landing page de PRÉ-INSCRIÇÃO pros eventos B2B presenciais que a
 * Boldfy está construindo em BH (jun/2026).
 *
 * Decisões:
 *  - Mora no route group `(lp)` (sem header/footer global — ConditionalChrome).
 *  - Usa os componentes padrão <LpHeader />/<LpFooter /> (mesma cara das outras
 *    LPs standalone), não header/footer caseiros.
 *  - Identidade Boldfy: hero com gradiente escuro + glows, gradient text no
 *    headline, cards no padrão (border-border, rounded-2xl, shadow roxa sutil),
 *    tipografia font-headline (Nunito Sans) nos títulos.
 *  - Captura CRM-first via `submitEventosbhLead` → adapter `adaptEventosbh`.
 *    Sempre Líder B2B; o campo `empresa` (obrigatório) é o gate.
 *  - Campos: nome*, email*, empresa* obrigatórios; zap e cargo opcionais.
 *  - Pós-envio: confirma e REDIRECIONA pra /materiais (aproveita o movimento —
 *    lead quente acabou de demonstrar interesse, oferece material rico).
 *  - noindex (LP de captura, não conteúdo público) — ver metadata no layout.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Loader2,
  CheckCircle2,
  ArrowRight,
  Rocket,
  Megaphone,
  Gem,
  TrendingUp,
  MapPin,
} from 'lucide-react';
import { LpHeader } from '@/components/layout/lp-header';
import { LpFooter } from '@/components/layout/lp-footer';
import { submitEventosbhLead } from '@/app/actions/eventosbh-leads';
import { useUtmParams } from '@/hooks/use-utm-params';
import { captureSubmissionMeta } from '@/lib/source-detection';
import { trackEvent } from '@/lib/track';

const FORM_SECTION_ID = 'form-section';
const REDIRECT_TO = '/materiais';

const TEMAS = [
  {
    icon: Rocket,
    title: 'O novo playbook B2B',
    desc: 'O que mudou de 2025 pra 2026 e como o jogo de aquisição se reinventou.',
  },
  {
    icon: Megaphone,
    title: 'A dependência em ads',
    desc: 'Por que apoiar tudo em tráfego pago corrói margem e como sair dessa.',
  },
  {
    icon: Gem,
    title: 'Branding no B2B',
    desc: 'Marca não é só pra B2C. Como construir percepção que encurta venda.',
  },
  {
    icon: TrendingUp,
    title: 'O jogo do LinkedIn',
    desc: 'Como usar o canal pra gerar alcance e autoridade sem depender de budget.',
  },
];

const QUALIFICA = [
  'É de BH ou região',
  'Lidera marketing em uma empresa B2B',
  'Se anima com a ideia de construir isso junto',
];

export default function EventosBhPage() {
  const router = useRouter();

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [empresa, setEmpresa] = useState('');
  const [telefone, setTelefone] = useState('');
  const [cargo, setCargo] = useState('');

  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const utms = useUtmParams();

  const canSubmit =
    nome.trim().length > 0 && email.trim().length > 0 && empresa.trim().length > 0;

  const scrollToForm = () => {
    document.getElementById(FORM_SECTION_ID)?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setError('');
    setSending(true);

    trackEvent('form_submit_start', { form_type: 'eventosbh', source: 'eventosbh-page' });

    const result = await submitEventosbhLead({
      nome,
      email,
      empresa,
      telefone,
      cargo,
      origem: 'LP Eventos BH',
      ...utms,
      ...captureSubmissionMeta(),
    });

    if (result.success) {
      setSent(true);
      trackEvent('form_submit_success', { form_type: 'eventosbh', source: 'eventosbh-page' });
      // Aproveita o movimento: leva o lead quente pros materiais ricos.
      window.setTimeout(() => router.push(REDIRECT_TO), 2600);
    } else {
      const msg = result.error || 'Algo deu errado. Tenta de novo em instantes.';
      setError(msg);
      trackEvent('form_submit_error', { form_type: 'eventosbh', error_message: msg });
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <LpHeader ctaTargetId={FORM_SECTION_ID} ctaLabel="Quero participar" />

      <main className="flex-1 w-full">
        <div className="mx-auto max-w-5xl px-5 sm:px-6 py-8 sm:py-12">
          {/* ───────────────── Hero ───────────────── */}
          <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0F0A18] via-[#1A0E2E] to-[#2D1445] px-6 py-12 sm:px-12 sm:py-16">
            <div className="absolute -top-20 -right-16 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
            <div className="absolute -bottom-24 -left-12 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />

            <div className="relative max-w-2xl">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[.14em] text-primary">
                <MapPin className="h-3 w-3" />
                Eventos B2B · Belo Horizonte
              </span>

              <h1 className="mt-5 font-headline text-3xl font-black leading-[1.07] text-white sm:text-4xl lg:text-5xl">
                Vamos movimentar a{' '}
                <span className="bg-gradient-to-r from-[#CD50F1] to-[#E875FF] bg-clip-text text-transparent">
                  cena B2B de BH
                </span>
              </h1>

              <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-white/70">
                SP e RJ têm roda de conversa, palestra e evento de networking o ano
                inteiro. BH, quase nada, mesmo sendo casa de empresas B2B que viraram
                referência nacional e global. A Boldfy está abrindo um espaço pra
                mudar isso: conversas de alto nível sobre o futuro do marketing, com
                quem realmente faz acontecer.
              </p>

              <div className="mt-7">
                <Button
                  onClick={scrollToForm}
                  size="lg"
                  className="font-bold shadow-[0_8px_24px_rgba(205,80,241,.28)]"
                >
                  Quero participar
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <p className="mt-3 text-xs text-white/40">
                  Sem data nem local ainda, é daqui que a gente começa a construir.
                </p>
              </div>
            </div>
          </section>

          {/* ───────────────── Temas ───────────────── */}
          <section className="mt-12">
            <div className="text-center sm:text-left">
              <span className="inline-flex rounded-full bg-secondary px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-primary">
                O que vamos discutir
              </span>
              <h2 className="mt-3 font-headline text-2xl font-black text-foreground sm:text-3xl">
                Conversas que importam pra quem lidera
              </h2>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {TEMAS.map((t) => {
                const Icon = t.icon;
                return (
                  <div
                    key={t.title}
                    className="rounded-2xl border border-border bg-card p-5 shadow-[0_8px_32px_rgba(93,42,103,.06)] transition-all hover:-translate-y-1 hover:border-primary/35"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" strokeWidth={2} />
                    </div>
                    <h3 className="mt-4 font-headline text-lg font-black text-foreground">
                      {t.title}
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                      {t.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ───────────────── Qualificação ───────────────── */}
          <section className="mt-12 rounded-2xl border border-primary/20 bg-secondary/60 p-6 sm:p-8">
            <h2 className="font-headline text-xl font-black text-foreground sm:text-2xl">
              É pra você se
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {QUALIFICA.map((q) => (
                <div key={q} className="flex items-start gap-2.5">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" strokeWidth={2} />
                  <span className="text-sm leading-snug text-foreground">{q}</span>
                </div>
              ))}
            </div>
          </section>

          {/* ───────────────── Form ───────────────── */}
          <section id={FORM_SECTION_ID} className="mt-12 scroll-mt-20">
            <div className="mx-auto max-w-xl">
              <div className="text-center">
                <h2 className="font-headline text-2xl font-black text-foreground sm:text-3xl">
                  Garante seu lugar na lista
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Deixa seu interesse e você fica sabendo dos eventos em primeira mão.
                </p>
              </div>

              <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-[0_8px_32px_rgba(93,42,103,.06)] sm:p-8">
                {sent ? (
                  <div className="flex flex-col items-center gap-3 py-6 text-center">
                    <CheckCircle2 className="h-12 w-12 text-primary" strokeWidth={2} />
                    <h3 className="font-headline text-xl font-black text-foreground">
                      Interesse registrado 💜
                    </h3>
                    <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
                      Você está na lista. Enquanto a gente desenha os primeiros
                      eventos de BH, dá uma olhada nos nossos materiais, são de graça
                      e direto ao ponto.
                    </p>
                    <Button onClick={() => router.push(REDIRECT_TO)} size="lg" className="mt-2 font-bold">
                      Ver materiais agora
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                    <p className="text-xs text-muted-foreground/70">
                      Te levando pros materiais em instantes…
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <p className="rounded-lg bg-secondary/70 px-3 py-2.5 text-xs leading-relaxed text-secondary-foreground">
                      Esses eventos são pensados pra líderes B2B. Por isso o nome da
                      empresa é obrigatório.
                    </p>

                    <div className="space-y-1.5">
                      <Label htmlFor="nome">Nome *</Label>
                      <Input
                        id="nome"
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                        placeholder="Seu nome"
                        autoComplete="name"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="email">E-mail *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="voce@empresa.com.br"
                        autoComplete="email"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="empresa">Empresa *</Label>
                      <Input
                        id="empresa"
                        value={empresa}
                        onChange={(e) => setEmpresa(e.target.value)}
                        placeholder="Onde você lidera marketing"
                        autoComplete="organization"
                        required
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="telefone">WhatsApp</Label>
                        <Input
                          id="telefone"
                          type="tel"
                          value={telefone}
                          onChange={(e) => setTelefone(e.target.value)}
                          placeholder="(31) 9 0000-0000"
                          autoComplete="tel"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="cargo">Cargo</Label>
                        <Input
                          id="cargo"
                          value={cargo}
                          onChange={(e) => setCargo(e.target.value)}
                          placeholder="Ex: Head de Marketing"
                          autoComplete="organization-title"
                        />
                      </div>
                    </div>

                    {error && (
                      <p className="text-sm text-destructive" role="alert">
                        {error}
                      </p>
                    )}

                    <Button
                      type="submit"
                      size="lg"
                      className="w-full font-bold"
                      disabled={sending || !canSubmit}
                    >
                      {sending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Enviando…
                        </>
                      ) : (
                        <>
                          Quero participar
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>

                    <p className="text-center text-xs text-muted-foreground/70">
                      Sem spam. Só te chamo quando tiver evento de verdade pra te
                      contar.
                    </p>
                  </form>
                )}
              </div>
            </div>
          </section>
        </div>
      </main>

      <LpFooter />
    </div>
  );
}
