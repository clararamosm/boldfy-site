'use client';

/**
 * /case-semrush — Landing page de captura para o case
 * "Bastidores de uma estratégia que virou referência global"
 * (Case Semrush ELG, mai/2026).
 *
 * Decisões (espelha a /algoritmo-linkedin):
 *  - Mora dentro do route group `(lp)` pra ficar isolada do header/footer
 *    globais (escondidos pelo `ConditionalChrome` quando a rota é uma LP).
 *  - Form mais rico que o algoritmo-linkedin: nome + email + intencao (sempre),
 *    e quando intencao='marca-empresa' aparece empresa + cargo + tamanho_empresa
 *    (qualificação meio-funil). Mesma lógica condicional, com campos extras
 *    pra audiência mais qualificada do case.
 *  - Server action submitCaseSemrushLead sincroniza CRM-first → AC, tag
 *    'Form: Case Semrush ELG' aplicada (cadência será criada depois pela Clara).
 *  - Entrega na tela de sucesso: botão de download direto do PDF
 *    (/public/reports/Case-Semrush-Employee-Led-Growth-Boldfy.pdf).
 *  - CTA secundário "agendar conversa" no fim, depois do form.
 */

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { submitCaseSemrushLead } from '@/app/actions/case-semrush-leads';
import { useDemoPopup } from '@/components/forms/demo-popup';
import type { IntencaoUso } from '@/lib/ac-tags';
import { trackEvent } from '@/lib/track';
import { useUtmParams } from '@/hooks/use-utm-params';
import {
  Loader2,
  CheckCircle2,
  ArrowRight,
  Download,
  Users,
  Megaphone,
  TrendingUp,
  Layers,
  Coins,
  Sparkles,
  Briefcase,
  UserCircle2,
  Calendar,
  FileText,
  Building2,
} from 'lucide-react';
import { LpHeader } from '@/components/layout/lp-header';
import { LpFooter } from '@/components/layout/lp-footer';

const FORM_SECTION_ID = 'form-section';
const PDF_URL = '/reports/Case-Semrush-Employee-Led-Growth-Boldfy.pdf';

type TamanhoEmpresa = 'ate-10' | '11-50' | '51-200' | '201-500' | '500+';

export default function CaseSemrushPage() {
  const utms = useUtmParams();
  const { openPopup } = useDemoPopup();

  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  // Intenção declarada — segue o mesmo padrão do report. Decide segmento AC
  // e gating dos campos B2B abaixo. '' = ainda não escolheu.
  const [intencaoUso, setIntencaoUso] = useState<IntencaoUso | ''>('');
  // Campos B2B só aparecem quando intencaoUso === 'marca-empresa'.
  const [empresa, setEmpresa] = useState('');
  const [cargo, setCargo] = useState('');
  const [tamanhoEmpresa, setTamanhoEmpresa] = useState<TamanhoEmpresa | ''>('');
  // Opt-in da newsletter — default false pra LGPD.
  const [newsletterOptIn, setNewsletterOptIn] = useState(false);

  // 6 destaques numéricos do case — combinam alcance, dinheiro e estrutura.
  // tone: 'primary' = números positivos da estratégia / 'destructive' = números
  // que mostram o problema (página de empresa morrendo).
  const dataHighlights = [
    {
      icon: <TrendingUp className="w-4 h-4" />,
      number: '+500k',
      label: 'Alcance adicional em 2 meses',
      desc: 'O delta direto que o programa de advocacy entregou, segundo a líder do programa.',
      tone: 'primary',
    },
    {
      icon: <Users className="w-4 h-4" />,
      number: '1,2 mi',
      label: 'Alcance total no período',
      desc: 'Somatório dos posts dos colaboradores no mesmo intervalo de 2 meses.',
      tone: 'primary',
    },
    {
      icon: <Coins className="w-4 h-4" />,
      number: 'R$ 360k',
      label: 'Earned media em 2 meses',
      desc: 'Cálculo Boldfy de R$ 0,30 por impressão (CPM de R$ 300 do LinkedIn Ads no Brasil).',
      tone: 'primary',
    },
    {
      icon: <Megaphone className="w-4 h-4" />,
      number: 'R$ 1,8 mi',
      label: 'Projetado ao ano',
      desc: 'Pela faixa de 6 a 9 milhões de impressões/ano que o programa sustenta na escala.',
      tone: 'primary',
    },
    {
      icon: <Layers className="w-4 h-4" />,
      number: '8×',
      label: 'Mais engajamento que post institucional',
      desc: 'Benchmark de mercado que a Semrush bateu em escala enterprise com 1.600+ funcionários.',
      tone: 'primary',
    },
    {
      icon: <Briefcase className="w-4 h-4" />,
      number: '~30',
      label: 'Colaboradores ativados',
      desc: 'A liderança trabalhou perfil por perfil, na unha, antes de virar sistema.',
      tone: 'primary',
    },
  ];

  // 4 capítulos consolidados do case (o PDF tem 9 seções; agrupei pra ficar
  // no mesmo formato 4-card do report).
  const chapters = [
    {
      n: '01',
      title: 'Os três pilares do modelo',
      desc: 'Conteúdo que vale salvar, apoio direto perfil a perfil, e amplificação contextual de cada peça por cada voz.',
    },
    {
      n: '02',
      title: 'O padrão na prática',
      desc: 'Três clusters de variação visual: mesma peça com hooks diferentes, resultado financeiro virando conteúdo de time, e campanha inteira distribuída por pessoas.',
    },
    {
      n: '03',
      title: 'Os resultados em alcance',
      desc: 'O delta de +500k em 2 meses, a projeção anual e o cálculo proprietário Boldfy do earned media que o programa gerou.',
    },
    {
      n: '04',
      title: 'Cinco lições que se aplicam aqui',
      desc: 'Por que estrutura é tudo, e por que a maioria dos programas brasileiros morre na praia em 2 ou 3 semanas tentando fazer isso na unha.',
    },
  ];

  // 3 perfis de leitor — autosegmentação por cargo/responsabilidade
  const audience = [
    {
      icon: <Megaphone className="w-4 h-4 text-primary" />,
      title: 'CMOs e Heads de Marketing',
      bullet:
        'Pra parar de jogar dinheiro em alcance que não vem mais e estruturar um canal que multiplica orgânico via time.',
    },
    {
      icon: <UserCircle2 className="w-4 h-4 text-primary/70" />,
      title: 'Founders e CEOs B2B',
      bullet:
        'Pra distribuir a marca pra além da própria voz, sem depender só do founder-led growth que tem teto natural.',
    },
    {
      icon: <Building2 className="w-4 h-4 text-[#5E2A67]" />,
      title: 'Heads de RH e Marca Empregadora',
      bullet:
        'Pra entender por que advocacy bem estruturado ataca employer branding e crescimento de receita na mesma jogada.',
    },
  ];

  const scrollToForm = (source: string) => {
    trackEvent('cta_click', { cta_type: 'case_semrush_download', source });
    document.getElementById(FORM_SECTION_ID)?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!intencaoUso) {
      setError('Escolha pra que você vai usar o case.');
      return;
    }

    setSending(true);

    trackEvent('form_submit_start', {
      form_type: 'case-semrush',
      source: 'case-semrush-page',
    });

    const result = await submitCaseSemrushLead({
      nome,
      email,
      intencaoUso,
      // Campos B2B só são enviados quando faz sentido (intenção = marca da
      // empresa). Pra outros casos, o backend e o schema tratam como undefined.
      empresa: intencaoUso === 'marca-empresa' ? empresa : undefined,
      cargo: intencaoUso === 'marca-empresa' ? cargo : undefined,
      tamanhoEmpresa:
        intencaoUso === 'marca-empresa' && tamanhoEmpresa ? tamanhoEmpresa : undefined,
      origem: 'LP Case Semrush ELG',
      newsletterOptIn,
      ...utms,
    });

    if (result.success) {
      setSent(true);
      trackEvent('form_submit_success', {
        form_type: 'case-semrush',
        source: 'case-semrush-page',
      });
      // Dispara o download automaticamente. A cadência de email com PDF
      // ainda não está configurada no AC pra esse material (Clara cria
      // depois) — por enquanto, o lead só recebe o PDF pelo botão.
      setTimeout(() => {
        window.open(PDF_URL, '_blank', 'noopener');
      }, 400);
    } else {
      const msg = result.error || 'Não foi possível enviar. Tente de novo em instantes.';
      setError(msg);
      trackEvent('form_submit_error', {
        form_type: 'case-semrush',
        error_message: msg,
      });
    }
    setSending(false);
  };

  const isB2B = intencaoUso === 'marca-empresa';

  return (
    <>
      <LpHeader
        ctaTargetId={FORM_SECTION_ID}
        ctaLabel="Baixar o case"
        trackingSource="case:lp-header"
      />

      <div className="mx-auto max-w-6xl px-6">
        {/* HERO */}
        <section className="rounded-2xl bg-gradient-to-br from-[#0F0A18] via-[#1A0E2E] to-[#2D1445] px-8 py-12 md:px-12 md:py-16 mt-6 mb-6 relative overflow-hidden">
          <div className="absolute -top-16 -right-16 w-56 h-56 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-8 items-center relative z-10">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[.14em] text-primary mb-3">
                Case de estratégia · Maio 2026
              </p>
              <h1 className="font-headline text-3xl md:text-4xl lg:text-5xl font-black text-white leading-[1.05] mb-5">
                Bastidores de uma estratégia{' '}
                <span className="text-primary">que virou referência global.</span>
              </h1>
              <p className="text-sm md:text-base text-white/60 leading-relaxed max-w-2xl mb-6">
                Como a Semrush, gigante global de marketing digital, transformou
                dezenas de colaboradores em porta-vozes da marca e fez o feed
                trabalhar a favor. Leitura de bastidores do programa de Employee-Led
                Growth com os posts reais, os números, e o método que tá por trás.
              </p>

              <div className="flex flex-wrap gap-2 mb-6">
                {[
                  'B2B SaaS',
                  'Employee-Led Growth',
                  'Distribuição Orgânica',
                  '12 min de leitura',
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
                onClick={() => scrollToForm('case:hero')}
                size="lg"
                className="text-sm font-bold gap-2"
              >
                <Download className="w-4 h-4" />
                Baixar o case grátis
                <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </div>

            {/* Capa do case — imagem editorial inclinada -3deg, mesmo padrão do report */}
            <div className="hidden lg:block">
              <div
                className="relative w-[260px] h-[340px] rounded-lg overflow-hidden shadow-2xl border-4 border-primary/40"
                style={{ transform: 'rotate(-3deg)' }}
              >
                <Image
                  src="/images/case-semrush-cover.jpeg"
                  alt="Capa do Case Semrush · Employee-Led Growth"
                  fill
                  sizes="260px"
                  className="object-cover"
                  priority
                />
              </div>
            </div>
          </div>
        </section>

        {/* DATA HIGHLIGHTS — números chave do case */}
        <section className="mb-6">
          <div className="text-center mb-5">
            <span className="inline-flex text-[10px] font-bold uppercase tracking-wide bg-primary text-white px-3 py-1 rounded-full mb-3">
              Os números do programa
            </span>
            <h2 className="font-headline text-xl md:text-2xl font-black text-accent-foreground mb-2">
              O que o time entregou em escala
            </h2>
            <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
              Cada número tem uma implicação prática diferente sobre o que muda
              quando você para de depender da página da empresa e ativa o time
              como canal de distribuição.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {dataHighlights.map((d) => (
              <div
                key={d.label}
                className={`bg-card border rounded-xl p-4 ${
                  d.tone === 'primary'
                    ? 'border-l-[3px] border-l-primary'
                    : 'border-l-[3px] border-l-destructive/40'
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

        {/* CHAPTERS — sumário do case */}
        <section className="bg-card border rounded-xl p-5 md:p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-5">
            <div>
              <span className="inline-flex text-[10px] font-bold uppercase tracking-wide bg-secondary text-primary px-3 py-1 rounded-full mb-2">
                Sumário
              </span>
              <h2 className="font-headline text-lg md:text-xl font-black text-accent-foreground">
                4 partes. Posts reais. Método replicável.
              </h2>
            </div>
            <p className="text-[11px] text-muted-foreground sm:text-right max-w-xs">
              Cada capítulo tem prints dos posts originais que circularam no
              LinkedIn — não é teoria, é o que apareceu no feed.
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
              Quem precisa ler antes do próximo planejamento
            </h2>
            <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
              O case foi escrito pra três tipos de leitor que estão tomando
              decisão de canal agora. Se você se reconhece, vai sair com um
              mapa do que pra fazer na sua empresa.
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
                O PDF abre na hora pra leitura. Salva ele numa pasta de
                referência — vale como base pra discussão do próximo
                planejamento.
              </p>
              <a href={PDF_URL} target="_blank" rel="noopener noreferrer">
                <Button size="lg" className="text-sm font-bold gap-2 w-full sm:w-auto">
                  <Download className="w-4 h-4" />
                  Baixar o PDF
                </Button>
              </a>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide bg-primary text-white px-3 py-1 rounded-full mb-3">
                  <FileText className="w-3 h-3" />
                  Download do case
                </span>
                <h3 className="font-headline text-xl md:text-2xl font-black text-accent-foreground mb-2">
                  Onde a gente envia?
                </h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  O PDF abre na hora. Se você marcar &ldquo;marca da empresa&rdquo;,
                  a gente já se prepara pra entender melhor seu contexto.
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
                    Email <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="voce@email.com"
                    required
                    autoComplete="email"
                  />
                </div>
                {/* Dropdown de intenção — decide segmento, cadência e gate dos
                    campos B2B abaixo. Native <select> em vez de Radix pra ficar
                    leve no bundle da LP. */}
                <div className="space-y-1.5">
                  <Label htmlFor="intencao" className="text-xs">
                    Quero baixar pra usar... <span className="text-destructive">*</span>
                  </Label>
                  <select
                    id="intencao"
                    value={intencaoUso}
                    onChange={(e) => setIntencaoUso(e.target.value as IntencaoUso | '')}
                    required
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="" disabled>
                      Selecione uma opção
                    </option>
                    <option value="marca-empresa">
                      Na marca da empresa onde trabalho
                    </option>
                    <option value="marca-clientes">
                      Na marca dos meus clientes (sou de agência, consultor)
                    </option>
                    <option value="marca-pessoal">Na minha marca pessoal</option>
                  </select>
                </div>

                {/* Bloco B2B condicional — só aparece quando intencao='marca-empresa'.
                    Pros outros casos, o form fica curto como o do report. */}
                {isB2B && (
                  <>
                    <div className="space-y-1.5">
                      <Label htmlFor="empresa" className="text-xs">
                        Empresa onde trabalha <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="empresa"
                        value={empresa}
                        onChange={(e) => setEmpresa(e.target.value)}
                        placeholder="Nome da empresa"
                        required
                        autoComplete="organization"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="cargo" className="text-xs">
                        Seu cargo <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="cargo"
                        value={cargo}
                        onChange={(e) => setCargo(e.target.value)}
                        placeholder="Ex: CMO, Head de Marketing, Founder"
                        required
                        autoComplete="organization-title"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="tamanho" className="text-xs">
                        Tamanho da empresa <span className="text-destructive">*</span>
                      </Label>
                      <select
                        id="tamanho"
                        value={tamanhoEmpresa}
                        onChange={(e) =>
                          setTamanhoEmpresa(e.target.value as TamanhoEmpresa | '')
                        }
                        required
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="" disabled>
                          Selecione o porte
                        </option>
                        <option value="ate-10">Até 10 colaboradores</option>
                        <option value="11-50">11 a 50 colaboradores</option>
                        <option value="51-200">51 a 200 colaboradores</option>
                        <option value="201-500">201 a 500 colaboradores</option>
                        <option value="500+">Mais de 500 colaboradores</option>
                      </select>
                    </div>
                  </>
                )}

                {/* Opt-in opcional da newsletter — separado da entrega do case
                    (essa é parte do que o lead pediu ao baixar). Default
                    desmarcado pra LGPD. */}
                <label className="flex items-start gap-2.5 cursor-pointer select-none pt-1">
                  <input
                    type="checkbox"
                    checked={newsletterOptIn}
                    onChange={(e) => setNewsletterOptIn(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-input text-primary focus:ring-2 focus:ring-primary/30 focus:ring-offset-0 cursor-pointer accent-primary"
                  />
                  <span className="text-[11px] text-muted-foreground leading-snug">
                    Quero aproveitar e assinar a newsletter da Boldfy. Aceito
                    receber comunicações por email — dá pra cancelar com um
                    clique.
                  </span>
                </label>

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
                      Quero o case
                    </>
                  )}
                </Button>

                <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
                  Ao baixar, você recebe o PDF na hora pra leitura. A gente
                  guarda seus dados pra entender melhor a audiência da Boldfy.
                  Pode sair quando quiser.
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
                  Da teoria pra prática
                </span>
              </div>
              <h3 className="font-headline text-lg md:text-2xl font-black text-white mb-2 leading-tight">
                Tudo que a Semrush fez na unha,
                <br />
                <span className="text-primary">a Boldfy faz por você.</span>
              </h3>
              <p className="text-sm text-white/60 leading-relaxed max-w-xl mb-4">
                Conteúdo pronto pro time postar. Variação visual automática pra
                não parecer repetido. Trilhas que ensinam o colaborador a achar
                a própria voz. Gamificação que mantém todo mundo publicando. E
                o alcance medido em valor de mídia, nativo.
              </p>

              <div className="flex flex-wrap gap-2">
                {[
                  { tag: 'B2B', desc: 'Marcas brasileiras que vivem de autoridade' },
                  { tag: 'ELG', desc: 'A estrutura completa, virou plataforma' },
                  { tag: 'EGC', desc: 'Voz própria de cada pessoa' },
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
              <Button
                onClick={() => openPopup('case:bottom-cta')}
                size="lg"
                variant="secondary"
                className="text-sm font-bold gap-2 w-full md:w-auto"
              >
                <Calendar className="w-4 h-4" />
                Agendar uma conversa
              </Button>
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
