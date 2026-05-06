'use client';

/**
 * /algoritmo-linkedin — Landing page de captura para o report
 * "O Algoritmo do LinkedIn Mudou Tudo" (atualização 360Brew, março/2026).
 *
 * Decisões:
 *  - Mora dentro do route group `(lp)` pra ficar isolada do header/footer
 *    globais (escondidos pelo `ConditionalChrome` quando a rota é uma LP).
 *  - Form leve: nome + email + empresa. Server action `sendReportLead`
 *    sincroniza com ActiveCampaign (sem Notion DB), tag
 *    'Report: Algoritmo LinkedIn 2026' dispara cadência de email com o PDF.
 *  - Entrega dupla: tela de sucesso mostra botão de download direto
 *    (PDF em /public/reports/) E o AC envia o email da cadência.
 *  - CTA secundário "agendar conversa" no fim da LP, depois do form.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { sendReportLead } from '@/app/actions/report-leads';
import { trackEvent } from '@/lib/track';
import { useUtmParams } from '@/hooks/use-utm-params';
import {
  Loader2,
  CheckCircle2,
  ArrowRight,
  Download,
  TrendingDown,
  Building2,
  PieChart,
  Save,
  Link2,
  UserCircle2,
  Megaphone,
  Target,
  Briefcase,
  Calendar,
  FileText,
  Sparkles,
} from 'lucide-react';
import { LpHeader } from '@/components/layout/lp-header';
import { LpFooter } from '@/components/layout/lp-footer';

const FORM_SECTION_ID = 'form-section';
const PDF_URL = '/reports/algoritmo-linkedin-2026-boldfy.pdf';
const CALENDAR_URL = 'https://calendar.app.google/5Q1HDD2jZSkWa1DH6';

export default function AlgoritmoLinkedinPage() {
  const utms = useUtmParams();

  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [empresa, setEmpresa] = useState('');

  // 6 destaques de dados do report — números que param o scroll e dão
  // densidade ao que a LP promete entregar.
  const dataHighlights = [
    {
      icon: <TrendingDown className="w-4 h-4" />,
      number: '−50%',
      label: 'Alcance perfis pessoais',
      desc: 'Queda ano contra ano, mas ainda é o melhor tipo de conta.',
      tone: 'destructive',
    },
    {
      icon: <Building2 className="w-4 h-4" />,
      number: '−66%',
      label: 'Páginas de empresa',
      desc: 'Colapso. Hoje representam 5% do feed total.',
      tone: 'destructive',
    },
    {
      icon: <PieChart className="w-4 h-4" />,
      number: '65%',
      label: 'Domínio do feed',
      desc: 'Pertence a perfis pessoais, contra 40% em 2024.',
      tone: 'primary',
    },
    {
      icon: <Save className="w-4 h-4" />,
      number: '5–10×',
      label: 'Salvamentos vs. curtidas',
      desc: 'O novo super-sinal do algoritmo. Curtida virou ruído.',
      tone: 'primary',
    },
    {
      icon: <Link2 className="w-4 h-4" />,
      number: '−60%',
      label: 'Posts com link externo',
      desc: 'Penalidade vale inclusive para link no primeiro comentário.',
      tone: 'destructive',
    },
    {
      icon: <UserCircle2 className="w-4 h-4" />,
      number: '0,4',
      label: 'Score de alinhamento',
      desc: 'Limite mínimo entre perfil e post pra desbloquear distribuição.',
      tone: 'primary',
    },
  ];

  // 4 capítulos do report — sumário pra dar transparência sobre o que
  // o lead vai receber.
  const chapters = [
    {
      n: '01',
      title: 'A realidade do alcance',
      desc: 'Como o feed se redistribuiu entre perfis pessoais e páginas de empresa em 2026.',
    },
    {
      n: '02',
      title: 'Perfil como distribuição',
      desc: 'A auditoria de pré-distribuição que decide se seu post chega a alguém.',
    },
    {
      n: '03',
      title: 'Identidade e penalidades',
      desc: 'O que acontece quando perfil, conteúdo e rede divergem de nicho.',
    },
    {
      n: '04',
      title: 'Sinais e formatos',
      desc: 'Os multiplicadores de alcance ranqueados, os formatos que ainda funcionam, os que foram penalizados.',
    },
  ];

  // 3 perfis de leitor — autosegmentação por cargo/função
  const audience = [
    {
      icon: <Megaphone className="w-4 h-4 text-primary" />,
      title: 'CMOs e Heads de Marketing',
      bullet:
        'Pra entender por que o alcance da Company Page caiu 66% e o que fazer com isso no plano do próximo trimestre.',
    },
    {
      icon: <Target className="w-4 h-4 text-primary/70" />,
      title: 'Founders e CEOs',
      bullet:
        'Pra calibrar o playbook de founder-led growth quando o algoritmo agora premia coerência semântica em vez de frequência.',
    },
    {
      icon: <Briefcase className="w-4 h-4 text-[#5E2A67]" />,
      title: 'Heads de Vendas e Social Selling',
      bullet:
        'Pra reposicionar o perfil do time comercial como ativo de distribuição, e não currículo digital.',
    },
  ];

  const scrollToForm = (source: string) => {
    trackEvent('cta_click', { cta_type: 'report_download', source });
    document.getElementById(FORM_SECTION_ID)?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSending(true);

    trackEvent('form_submit_start', {
      form_type: 'report',
      source: 'algoritmo-linkedin-page',
    });

    const result = await sendReportLead({
      nome,
      email,
      empresa,
      origem: 'LP Algoritmo LinkedIn',
      ...utms,
    });

    if (result.success) {
      setSent(true);
      trackEvent('form_submit_success', {
        form_type: 'report',
        source: 'algoritmo-linkedin-page',
      });
      // Dispara o download automaticamente — o lead também recebe por email.
      // window.open dá menos atrito que redirect, e como o link é interno,
      // não cai em popup blocker na maioria dos browsers.
      setTimeout(() => {
        window.open(PDF_URL, '_blank', 'noopener');
      }, 400);
    } else {
      const msg = result.error || 'Não foi possível enviar. Tente de novo em instantes.';
      setError(msg);
      trackEvent('form_submit_error', {
        form_type: 'report',
        error_message: msg,
      });
    }
    setSending(false);
  };

  return (
    <>
      <LpHeader
        ctaTargetId={FORM_SECTION_ID}
        ctaLabel="Baixar o report"
        trackingSource="report:lp-header"
      />

      <div className="mx-auto max-w-6xl px-6">
        {/* HERO */}
        <section className="rounded-2xl bg-gradient-to-br from-[#0F0A18] via-[#1A0E2E] to-[#2D1445] px-8 py-12 md:px-12 md:py-16 mt-6 mb-6 relative overflow-hidden">
          <div className="absolute -top-16 -right-16 w-56 h-56 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-8 items-center relative z-10">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[.14em] text-primary mb-3">
                Relatório de pesquisa · Março 2026
              </p>
              <h1 className="font-headline text-3xl md:text-4xl lg:text-5xl font-black text-white leading-[1.05] mb-5">
                O algoritmo do LinkedIn{' '}
                <span className="text-primary">mudou tudo</span> em 2026.
              </h1>
              <p className="text-sm md:text-base text-white/60 leading-relaxed max-w-2xl mb-6">
                Em março, o LinkedIn implantou o 360Brew — um modelo com 150 bilhões
                de parâmetros que substituiu milhares de classificadores antigos por
                um único motor semântico. Reunimos os dados de 16 fontes primárias e
                consolidamos numa análise prática sobre o que muda no alcance, no
                perfil e nos formatos a partir de agora.
              </p>

              <div className="flex flex-wrap gap-2 mb-6">
                {[
                  '6 capítulos',
                  '16 fontes citadas',
                  'PDF · gratuito',
                  '15 min de leitura',
                ].map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] font-semibold px-3 py-1 rounded-full bg-white/10 text-white/80 border border-white/10"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <Button
                onClick={() => scrollToForm('report:hero')}
                size="lg"
                className="text-sm font-bold gap-2"
              >
                <Download className="w-4 h-4" />
                Baixar o report grátis
                <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </div>

            {/* Mock visual da capa do report — versão visual, não imagem real */}
            <div className="hidden lg:block">
              <div className="relative w-[260px] h-[340px]">
                <div
                  className="absolute inset-0 rounded-lg bg-gradient-to-br from-white to-[#F4ECFB] shadow-2xl border-4 border-primary/40"
                  style={{ transform: 'rotate(-3deg)' }}
                >
                  <div className="p-6 h-full flex flex-col">
                    <p className="text-[8px] font-bold uppercase tracking-[.18em] text-primary mb-4">
                      Boldfy · Março 2026
                    </p>
                    <div className="flex-1">
                      <p className="font-headline text-[13px] font-black text-[#1A0E2E] leading-tight">
                        O Algoritmo
                        <br />
                        do LinkedIn
                      </p>
                      <p className="font-headline text-[15px] font-black text-primary leading-tight mt-1">
                        Mudou Tudo.
                      </p>
                      <div className="w-8 h-[2px] bg-primary mt-3 mb-4" />
                      <p className="text-[8px] text-[#1A0E2E]/70 leading-snug">
                        Análise da atualização 360Brew: o que mudou e o que precisa
                        mudar na estratégia de conteúdo agora.
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 mt-3">
                      {['Alcance', 'Perfil', 'Identidade', 'Formatos'].map((c) => (
                        <div
                          key={c}
                          className="text-[7px] font-semibold text-[#1A0E2E]/70 bg-primary/5 border border-primary/20 rounded px-2 py-1"
                        >
                          {c}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* DATA HIGHLIGHTS — números chave do report */}
        <section className="mb-6">
          <div className="text-center mb-5">
            <span className="inline-flex text-[10px] font-bold uppercase tracking-wide bg-primary text-white px-3 py-1 rounded-full mb-3">
              O que tem dentro
            </span>
            <h2 className="font-headline text-xl md:text-2xl font-black text-accent-foreground mb-2">
              Os números que reorganizaram o jogo
            </h2>
            <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
              Uma prévia dos dados que estão no relatório completo. Cada um deles
              tem uma implicação prática diferente pro seu time.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {dataHighlights.map((d) => (
              <div
                key={d.label}
                className={`bg-card border rounded-xl p-4 ${
                  d.tone === 'primary' ? 'border-l-[3px] border-l-primary' : 'border-l-[3px] border-l-destructive/40'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center mb-3 ${
                    d.tone === 'primary'
                      ? 'bg-primary/10 text-primary'
                      : 'bg-destructive/10 text-destructive/70'
                  }`}
                >
                  {d.icon}
                </div>
                <p
                  className={`font-headline text-2xl md:text-3xl font-black mb-1 ${
                    d.tone === 'primary' ? 'text-primary' : 'text-destructive/80'
                  }`}
                >
                  {d.number}
                </p>
                <p className="text-[11px] font-bold text-accent-foreground mb-1.5">
                  {d.label}
                </p>
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  {d.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* CHAPTERS — sumário do report */}
        <section className="bg-card border rounded-xl p-5 md:p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-5">
            <div>
              <span className="inline-flex text-[10px] font-bold uppercase tracking-wide bg-secondary text-primary px-3 py-1 rounded-full mb-2">
                Sumário
              </span>
              <h2 className="font-headline text-lg md:text-xl font-black text-accent-foreground">
                4 capítulos. 16 fontes. 1 leitura.
              </h2>
            </div>
            <p className="text-[11px] text-muted-foreground sm:text-right max-w-xs">
              O report é estruturado pra que você consiga voltar nele depois como
              referência — não pra ser lido uma vez e esquecido.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {chapters.map((c) => (
              <div
                key={c.n}
                className="border rounded-lg p-4 bg-background hover:bg-secondary/30 transition-colors"
              >
                <div className="flex items-baseline gap-3">
                  <span className="font-headline text-2xl font-black text-primary/30 tabular-nums">
                    {c.n}
                  </span>
                  <div>
                    <p className="text-[12px] font-bold text-accent-foreground mb-1">
                      {c.title}
                    </p>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                      {c.desc}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* AUDIENCE — quem deveria ler */}
        <section className="mb-6">
          <div className="text-center mb-5">
            <span className="inline-flex text-[10px] font-bold uppercase tracking-wide bg-primary text-white px-3 py-1 rounded-full mb-3">
              Pra quem é
            </span>
            <h2 className="font-headline text-xl md:text-2xl font-black text-accent-foreground mb-2">
              Quem precisa lidar com isso essa semana
            </h2>
            <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
              O report foi escrito pra três tipos de leitor. Se você se reconhece em
              algum deles, vai sair com um plano concreto pra ajustar.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {audience.map((a) => (
              <div
                key={a.title}
                className="bg-card border rounded-xl p-4 border-l-[3px] border-l-primary/60"
              >
                <div className="mb-2">{a.icon}</div>
                <h3 className="text-[12px] font-bold text-accent-foreground mb-2">
                  {a.title}
                </h3>
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  {a.bullet}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* PROOF QUOTE — citação curta do próprio report */}
        <section className="bg-gradient-to-br from-[#1A0E2E] to-[#0F0A18] rounded-xl p-6 md:p-8 mb-6 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/15 rounded-full blur-3xl" />
          <div className="relative z-10 max-w-3xl">
            <span className="inline-flex text-[10px] font-bold uppercase tracking-wide bg-primary/20 text-primary px-3 py-1 rounded-full mb-3">
              Trecho do report
            </span>
            <p className="font-headline text-base md:text-lg text-white/90 leading-relaxed italic">
              &ldquo;O algoritmo deixou de ser um código a ser hackeado e passou a
              funcionar como um sistema de relacionamentos com memória longa. Quem
              trata o LinkedIn como um lugar de troca real vai ver a visibilidade
              virar consequência da expertise demonstrada.&rdquo;
            </p>
          </div>
        </section>

        {/* FORM — captura de lead */}
        <section
          id={FORM_SECTION_ID}
          className="bg-card border rounded-xl p-6 md:p-10 mb-6 scroll-mt-20"
        >
          {sent ? (
            <div className="text-center py-6 max-w-md mx-auto">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-headline text-xl md:text-2xl font-black text-accent-foreground mb-2">
                Pronto, {nome.split(' ')[0]}.
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                Seu download começou em uma nova aba. Também enviamos o PDF pro seu
                email — se não chegar em alguns minutos, dá uma olhada no spam.
              </p>
              <a href={PDF_URL} target="_blank" rel="noopener noreferrer">
                <Button size="lg" className="text-sm font-bold gap-2 w-full sm:w-auto">
                  <Download className="w-4 h-4" />
                  Baixar o PDF de novo
                </Button>
              </a>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide bg-primary text-white px-3 py-1 rounded-full mb-3">
                  <FileText className="w-3 h-3" />
                  Download do report
                </span>
                <h3 className="font-headline text-xl md:text-2xl font-black text-accent-foreground mb-2">
                  Onde a gente envia?
                </h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  O PDF abre na hora e também vai pro seu email — pra você achar
                  depois. Sem newsletter automática, prometido.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="nome" className="text-xs">
                    Seu nome <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="nome"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Como prefere ser chamado"
                    required
                    autoComplete="name"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs">
                    Email corporativo <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="voce@empresa.com"
                    required
                    autoComplete="email"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="empresa" className="text-xs">
                    Empresa <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="empresa"
                    value={empresa}
                    onChange={(e) => setEmpresa(e.target.value)}
                    placeholder="Onde você trabalha hoje"
                    required
                    autoComplete="organization"
                  />
                </div>

                {error && (
                  <div className="text-sm text-destructive text-center">{error}</div>
                )}

                <Button
                  type="submit"
                  className="w-full font-bold gap-2"
                  size="lg"
                  disabled={sending}
                >
                  {sending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      Quero o report
                    </>
                  )}
                </Button>

                <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
                  Ao baixar, você aceita receber emails da Boldfy sobre o tema. Dá
                  pra sair quando quiser, com um clique.
                </p>
              </form>
            </>
          )}
        </section>

        {/* CTA SECUNDÁRIO — agendar conversa com a Boldfy */}
        <section className="bg-gradient-to-br from-[#5E2A67] to-[#2D1445] rounded-xl p-6 md:p-8 mb-8 relative overflow-hidden border border-primary/20">
          <div className="absolute -bottom-16 -right-16 w-56 h-56 bg-primary/15 rounded-full blur-3xl" />

          <div className="relative z-10 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6 items-center">
            <div>
              <div className="inline-flex items-center gap-1 mb-3">
                <Sparkles className="w-3 h-3 text-primary" />
                <span className="text-[10px] font-bold uppercase tracking-wide text-primary">
                  Trabalhando com a Boldfy
                </span>
              </div>
              <h3 className="font-headline text-lg md:text-2xl font-black text-white mb-2 leading-tight">
                Acompanhar tudo isso é um trabalho em tempo integral.
                <br />
                <span className="text-primary">A gente faz por você.</span>
              </h3>
              <p className="text-sm text-white/60 leading-relaxed max-w-xl mb-4">
                Auditoria de perfil, calendário consistente com o nicho, formatos
                que geram salvamento, estratégia de comentários. Cada métrica do
                report precisa de alguém olhando todos os dias — e os founders e
                executivos não têm tempo pra pensar em atualização de algoritmo.
              </p>

              <div className="flex flex-wrap gap-2">
                {[
                  { tag: 'B2B', desc: 'Especialistas em founders' },
                  { tag: '360Brew', desc: 'Workflows atualizados' },
                  { tag: 'ELG', desc: 'Crescimento liderado por funcionários' },
                ].map((b) => (
                  <span
                    key={b.tag}
                    className="text-[10px] font-bold px-3 py-1.5 rounded-lg bg-white/5 text-white/80 border border-white/10"
                    title={b.desc}
                  >
                    {b.tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="shrink-0">
              <a
                href={CALENDAR_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() =>
                  trackEvent('cta_click', {
                    cta_type: 'schedule_meeting',
                    source: 'report:bottom-cta',
                  })
                }
              >
                <Button
                  size="lg"
                  variant="secondary"
                  className="text-sm font-bold gap-2 w-full md:w-auto"
                >
                  <Calendar className="w-4 h-4" />
                  Agendar uma conversa
                </Button>
              </a>
              <p className="text-[10px] text-white/40 mt-2 text-center md:text-right">
                15 min · sem compromisso
              </p>
            </div>
          </div>
        </section>
      </div>

      <LpFooter />
    </>
  );
}
