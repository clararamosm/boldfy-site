'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { sendBetaLeadToNotion } from '@/app/actions/beta-leads';
import { Loader2, CheckCircle2, Calendar, ArrowRight, Megaphone, Target, Heart, Rocket, Skull, Calculator, Users, Eye, TrendingUp } from 'lucide-react';
import { useT, useLocale } from '@/lib/i18n/context';

const CALENDAR_URL = 'https://calendar.app.google/5Q1HDD2jZSkWa1DH6';

export default function BetaTestPage() {
  const t = useT();
  const locale = useLocale();

  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  // Simulator state
  const [simColabs, setSimColabs] = useState(5);
  const [simImpressions, setSimImpressions] = useState(10000);

  const simResults = useMemo(() => {
    const CPM_BOLDFY = 0.30;
    const CPM_ADS_LOW = 0.20;
    const CPM_ADS_HIGH = 0.50;
    const totalImpressions = simColabs * simImpressions;
    const valorBoldfy = totalImpressions * CPM_BOLDFY;
    const custoAdsLow = totalImpressions * CPM_ADS_LOW;
    const custoAdsHigh = totalImpressions * CPM_ADS_HIGH;
    const custoBoldfySeat = simColabs <= 10 ? 499 : simColabs <= 20 ? 449 : simColabs <= 40 ? 399 : 349;
    const custoMensal = simColabs * custoBoldfySeat;
    const custoBetaSeat = Math.round(custoBoldfySeat * 0.7);
    const custoMensalBeta = simColabs * custoBetaSeat;
    const roi = valorBoldfy > 0 ? ((valorBoldfy - custoMensalBeta) / custoMensalBeta * 100) : 0;
    return { totalImpressions, valorBoldfy, custoAdsLow, custoAdsHigh, custoMensal, custoBoldfySeat, custoMensalBeta, custoBetaSeat, roi };
  }, [simColabs, simImpressions]);

  // Locale-aware data arrays
  const quotes = locale === 'en' ? [
    { initial: 'R', name: 'Renata', role: 'CMO', quote: 'I spend money on Ads and the lead arrives cold. The Company Page is dead. I need reach that doesn\'t depend on budget.', gradient: 'from-primary to-primary/70' },
    { initial: 'F', name: 'Fernando', role: 'Head of Sales', quote: '100 outreach attempts, 99 silences. Nobody answers someone with no reputation in the feed.', gradient: 'from-primary/70 to-[#5E2A67]' },
    { initial: 'C', name: 'Camila', role: 'Head of People', quote: 'We lose candidates to competitors because they look more innovative. Our talent is silent.', gradient: 'from-[#7E22CE] to-primary' },
    { initial: 'M', name: 'Marcelo', role: 'CEO', quote: 'Brand authority depends only on me. If I stop posting, the brand disappears.', gradient: 'from-[#0F0A18] to-[#2D1445]' },
  ] : [
    { initial: 'R', name: 'Renata', role: 'CMO', quote: 'Coloco dinheiro em Ads e o lead chega frio. A Company Page tá morta. Preciso de alcance que não dependa de budget.', gradient: 'from-primary to-primary/70' },
    { initial: 'F', name: 'Fernando', role: 'Head de Vendas', quote: '100 abordagens, 99 silêncios. Ninguém atende quem não tem reputação no feed.', gradient: 'from-primary/70 to-[#5E2A67]' },
    { initial: 'C', name: 'Camila', role: 'Head de People', quote: 'Perdemos candidatos pra concorrência porque eles parecem mais inovadores. Nossos talentos tão calados.', gradient: 'from-[#7E22CE] to-primary' },
    { initial: 'M', name: 'Marcelo', role: 'CEO', quote: 'A autoridade da marca depende só de mim. Se eu parar de postar, a marca some.', gradient: 'from-[#0F0A18] to-[#2D1445]' },
  ];

  const useCases = locale === 'en' ? [
    { icon: <Megaphone className="w-4 h-4 text-primary" />, title: 'Marketing & Branding', pain: 'Dead Company Page · Rising CAC', solution: 'Personal profiles with 10x more reach become brand channels. AI aligns everything with Brand Context.', tags: ['Organic amplification', 'Remarketing', '-CAC'], border: 'border-l-primary' },
    { icon: <Target className="w-4 h-4 text-primary/70" />, title: 'Sales & Social Selling', pain: 'Cold ignored · No digital authority', solution: 'Seller builds technical authority in the feed. Prospect already "knows" them before the call.', tags: ['Ice-breaker', 'Shorter cycle', 'Authority'], border: 'border-l-primary/70' },
    { icon: <Heart className="w-4 h-4 text-[#5E2A67]" />, title: 'HR & Employer Branding', pain: 'Talent going to visible competitors', solution: 'Employees show how they really work. Trails teach how to document technical challenges.', tags: ['Talent attraction', 'Real culture', 'EGC'], border: 'border-l-[#5E2A67]' },
  ] : [
    { icon: <Megaphone className="w-4 h-4 text-primary" />, title: 'Marketing & Branding', pain: 'Company Page morta · CAC subindo', solution: 'Perfis pessoais com 10x mais alcance viram canais da marca. IA alinha tudo com o Brand Context.', tags: ['Amplificação orgânica', 'Remarketing', '-CAC'], border: 'border-l-primary' },
    { icon: <Target className="w-4 h-4 text-primary/70" />, title: 'Vendas & Social Selling', pain: 'Cold ignorado · Sem autoridade digital', solution: 'Vendedor constrói autoridade técnica no feed. Prospect já "conhece" antes da call.', tags: ['Quebra-gelo', 'Ciclo menor', 'Autoridade'], border: 'border-l-primary/70' },
    { icon: <Heart className="w-4 h-4 text-[#5E2A67]" />, title: 'RH & Employer Branding', pain: 'Talentos indo pra concorrência visível', solution: 'Colaboradores mostram como trabalham de verdade. Trilhas ensinam a documentar desafios técnicos.', tags: ['Atração de talentos', 'Cultura real', 'EGC'], border: 'border-l-[#5E2A67]' },
  ];

  const journeyWithout = locale === 'en' ? [
    { when: 'Week 1', what: 'Initial excitement', how: 'Leader sends "let\'s post on LinkedIn!" in the group. 5 people post.' },
    { when: 'Month 1', what: 'No direction or development', how: 'Nobody knows what to write. No trail, no teaching, no brand context.' },
    { when: 'Month 2-3', what: 'No tool, no reason', how: 'No AI to help, no reward, no metrics. Everyone stops.' },
  ] : [
    { when: 'Semana 1', what: 'Empolgação inicial', how: 'Líder manda "vamos postar no LinkedIn!" no grupo. 5 pessoas postam.' },
    { when: 'Mês 1', what: 'Sem direção nem desenvolvimento', how: 'Ninguém sabe o que escrever. Sem trilha, sem ensino, sem contexto de marca.' },
    { when: 'Mês 2-3', what: 'Sem ferramenta, sem motivo', how: 'Sem IA pra ajudar, sem recompensa, sem métrica. Todo mundo para.' },
  ];

  const journeyWithoutEnd = locale === 'en'
    ? { when: 'Month 4+', text: 'Program died. Flash in the pan. Back to paid traffic. CAC keeps rising.' }
    : { when: 'Mês 4+', text: 'Programa morreu. Voo de galinha. Volta pro tráfego pago. CAC continua subindo.' };

  const journeyWith = locale === 'en' ? [
    { when: 'Week 1', what: 'Assisted setup + onboarding', how: 'Brand Context, active trails, reward store set up, team invited.' },
    { when: 'Month 1', what: 'Development + first posts', how: 'Trails teach content creation. AI + personal voice eliminates the blank page.' },
    { when: 'Month 2-3', what: 'Tools + data + game', how: 'Contextual AI, rankings and rewards sustain engagement. Dashboard shows impressions and value in R$.' },
  ] : [
    { when: 'Semana 1', what: 'Setup assistido + onboarding', how: 'Brand Context, trilhas ativas, loja de recompensas montada, time convidado.' },
    { when: 'Mês 1', what: 'Desenvolvimento + primeiros posts', how: 'Trilhas ensinam a criar conteúdo. IA + voz pessoal elimina a página em branco.' },
    { when: 'Mês 2-3', what: 'Ferramentas + dados + jogo', how: 'IA contextual, rankings e recompensas mantêm engajamento. Dashboard mostra impressões e valor em R$.' },
  ];

  const journeyWithEnd = locale === 'en'
    ? { when: 'Month 4+', text: 'Consistent program. Compound effect. Awareness grows exponentially month by month.' }
    : { when: 'Mês 4+', text: 'Programa consistente. Efeito composto. Awareness cresce exponencialmente mês a mês.' };

  const flowSteps = locale === 'en' ? [
    { n: '1', label: 'Setup', desc: 'Brand Context, trails, rewards, team invited' },
    { n: '2', label: 'Creation', desc: 'AI + personal voice = authentic content in seconds' },
    { n: '3', label: 'Habit', desc: 'Missions and trails educate and build routine' },
    { n: '4', label: 'Game', desc: 'Rankings, points and reward store' },
    { n: '5', label: 'Return', desc: 'Awareness, remarketing and strong brand' },
  ] : [
    { n: '1', label: 'Setup', desc: 'Brand Context, trilhas, recompensas, time convidado' },
    { n: '2', label: 'Criação', desc: 'IA + voz pessoal = conteúdo autêntico em segundos' },
    { n: '3', label: 'Hábito', desc: 'Missões e trilhas educam e criam rotina' },
    { n: '4', label: 'Jogo', desc: 'Rankings, pontos e lojinha de recompensas' },
    { n: '5', label: 'Retorno', desc: 'Awareness, remarketing e marca forte' },
  ];

  const benefitsCompany = locale === 'en'
    ? ['Measurable awareness', 'More engagement', 'Less turnover', 'Collaboration culture', 'Decentralized authority', 'Warm remarketing']
    : ['Awareness mensurável', 'Mais engajamento', 'Menos turnover', 'Cultura de colaboração', 'Autoridade descentralizada', 'Remarketing quente'];

  const benefitsCollaborator = locale === 'en'
    ? ['Personal brand', 'Development', 'Rewards', 'Visibility', 'Educational trails', 'Recognition']
    : ['Marca pessoal', 'Desenvolvimento', 'Recompensas', 'Visibilidade', 'Trilhas educativas', 'Reconhecimento'];

  const timelineItems = locale === 'en' ? [
    { when: 'Week 1', what: 'Complete setup', detail: 'Brand Context + trails + store + team' },
    { when: 'Week 2-3', what: 'First posts', detail: 'AI content + first missions' },
    { when: 'Month 1-2', what: 'Real data', detail: 'Impressions, engagement, value in R$' },
    { when: 'Month 3+', what: 'Compound effect', detail: 'Positive ROI, self-sustaining program' },
  ] : [
    { when: 'Semana 1', what: 'Setup completo', detail: 'Brand Context + trilhas + loja + time' },
    { when: 'Semana 2-3', what: 'Primeiros posts', detail: 'Conteúdo com IA + primeiras missões' },
    { when: 'Mês 1-2', what: 'Dados reais', detail: 'Impressões, engajamento, valor em R$' },
    { when: 'Mês 3+', what: 'Efeito composto', detail: 'ROI positivo, programa autossuficiente' },
  ];

  const pricingTiers = [
    { range: '5 – 10 seats', price: 'R$ 499', betaPrice: 'R$ 349', featured: false, enterprise: false },
    { range: '11 – 20 seats', price: 'R$ 449', betaPrice: 'R$ 315', featured: false, enterprise: false },
    { range: '21 – 40 seats', price: 'R$ 399', betaPrice: 'R$ 279', featured: true, enterprise: false },
    { range: '41 – 70 seats', price: 'R$ 349', betaPrice: 'R$ 245', featured: false, enterprise: false },
    { range: '70+ seats', price: '', betaPrice: '', featured: false, enterprise: true },
  ];

  // Form state
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [cargo, setCargo] = useState('');
  const [empresa, setEmpresa] = useState('');
  const [setor, setSetor] = useState('');
  const [colaboradores, setColaboradores] = useState('');
  const [objetivoPrincipal, setObjetivoPrincipal] = useState('');
  const [comoConheceu, setComoConheceu] = useState('');
  const [observacoes, setObservacoes] = useState('');

  const scrollToForm = () => {
    document.getElementById('form-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSending(true);

    const result = await sendBetaLeadToNotion({
      nome, email, telefone, cargo, empresa, setor,
      colaboradores, objetivoPrincipal, comoConheceu, observacoes,
    });

    if (result.success) {
      setSent(true);
    } else {
      setError(result.error || t.betaTest.formErrorDefault);
    }
    setSending(false);
  };

  return (
    <div className="mx-auto max-w-6xl px-6">

      {/* HERO */}
      <section className="rounded-2xl bg-gradient-to-br from-[#0F0A18] via-[#1A0E2E] to-[#2D1445] px-8 py-12 md:px-12 md:py-16 mt-6 mb-6 relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-56 h-56 bg-primary/20 rounded-full blur-3xl" />
        <p className="text-[11px] font-bold uppercase tracking-[.14em] text-primary mb-3 relative z-10">
          {t.betaTest.heroTag}
        </p>
        <h1 className="font-headline text-2xl md:text-3xl font-bold text-white leading-tight mb-4 relative z-10">
          {t.betaTest.heroTitle}<br />
          <span className="text-primary">{t.betaTest.heroTitleHighlight}</span>
        </h1>
        <p className="text-sm text-white/50 leading-relaxed max-w-3xl relative z-10">
          {t.betaTest.heroSubtitle}
        </p>
        <Button onClick={scrollToForm} size="sm" className="mt-6 text-[11px] font-bold h-8 relative z-10">
          {t.betaTest.betaTesterButton} <ArrowRight className="w-3 h-3 ml-1" />
        </Button>
      </section>

      {/* QUOTES */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {quotes.map((q) => (
          <div key={q.initial} className="bg-card border rounded-xl p-4 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${q.gradient} flex items-center justify-center text-xs font-bold text-white shrink-0`}>
                {q.initial}
              </div>
              <div>
                <p className="text-[11px] font-bold text-accent-foreground">{q.name}</p>
                <p className="text-[9px] text-muted-foreground">{q.role}</p>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground leading-relaxed italic">
              &ldquo;{q.quote}&rdquo;
            </p>
          </div>
        ))}
      </section>

      {/* USE CASES */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        {useCases.map((uc) => (
          <div key={uc.title} className={`bg-card border rounded-xl p-4 border-l-[3px] ${uc.border}`}>
            <div className="mb-2">{uc.icon}</div>
            <h3 className="text-[12px] font-bold text-accent-foreground mb-1">{uc.title}</h3>
            <p className="text-[10px] text-primary/70 font-semibold mb-2">{uc.pain}</p>
            <p className="text-[10px] text-muted-foreground leading-relaxed mb-3">
              <span className="font-semibold text-accent-foreground">{t.betaTest.antidote}</span>{uc.solution}
            </p>
            <div className="flex flex-wrap gap-1">
              {uc.tags.map((tag) => (
                <span key={tag} className="text-[8px] font-semibold px-2 py-1 rounded-full bg-secondary text-secondary-foreground">{tag}</span>
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* TWO JOURNEYS */}
      <section className="border rounded-xl overflow-hidden mb-6">
        <div className="bg-[#5E2A67] px-6 py-3 flex items-center justify-between">
          <h3 className="font-headline text-sm font-bold text-white">{t.betaTest.twoJourneysTitle}</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 bg-card">
          {/* Without Boldfy */}
          <div className="p-5 md:border-r">
            <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-border" /> {t.betaTest.withoutBoldfy}
            </p>
            {journeyWithout.map((s, i) => (
              <div key={i} className="flex gap-3 mb-0">
                <div className="flex flex-col items-center w-4 shrink-0">
                  <div className="w-[10px] h-[10px] rounded-full border-2 border-border bg-background shrink-0" />
                  <div className="w-[2px] flex-1 bg-border" />
                </div>
                <div className="pb-4">
                  <p className="text-[9px] font-bold uppercase tracking-wide text-muted-foreground">{s.when}</p>
                  <p className="text-[11px] font-semibold text-accent-foreground">{s.what}</p>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">{s.how}</p>
                </div>
              </div>
            ))}
            <div className="flex gap-3">
              <div className="flex flex-col items-center w-4 shrink-0">
                <div className="w-[10px] h-[10px] rounded-full border-2 border-border bg-background shrink-0" />
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wide text-muted-foreground">{journeyWithoutEnd.when}</p>
                <div className="flex items-center gap-2 bg-destructive/10 border border-destructive/20 rounded-lg p-3 mt-1">
                  <Skull className="w-5 h-5 text-destructive/70 shrink-0" />
                  <p className="text-[10px] font-semibold text-destructive/80 leading-snug">
                    {journeyWithoutEnd.text}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* With Boldfy */}
          <div className="p-5">
            <p className="text-[11px] font-bold uppercase tracking-wide text-accent-foreground mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary" /> {t.betaTest.withBoldfy}
            </p>
            {journeyWith.map((s, i) => (
              <div key={i} className="flex gap-3 mb-0">
                <div className="flex flex-col items-center w-4 shrink-0">
                  <div className="w-[10px] h-[10px] rounded-full border-2 border-primary bg-secondary shrink-0" />
                  <div className="w-[2px] flex-1 bg-gradient-to-b from-primary to-primary/60" />
                </div>
                <div className="pb-4">
                  <p className="text-[9px] font-bold uppercase tracking-wide text-primary">{s.when}</p>
                  <p className="text-[11px] font-semibold text-accent-foreground">{s.what}</p>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">{s.how}</p>
                </div>
              </div>
            ))}
            <div className="flex gap-3">
              <div className="flex flex-col items-center w-4 shrink-0">
                <div className="w-[10px] h-[10px] rounded-full border-2 border-primary bg-secondary shrink-0" />
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wide text-primary">{journeyWithEnd.when}</p>
                <div className="flex items-center gap-2 bg-secondary border border-border rounded-lg p-3 mt-1">
                  <Rocket className="w-5 h-5 text-primary shrink-0" />
                  <p className="text-[10px] font-semibold text-accent-foreground leading-snug">
                    {journeyWithEnd.text}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ROI CHART */}
      <section className="bg-card border rounded-xl p-5 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <h3 className="font-headline text-sm font-bold text-accent-foreground">{t.betaTest.chartTitle}</h3>
          <p className="text-[10px] text-muted-foreground">{t.betaTest.chartSubtitle}</p>
        </div>
        <svg viewBox="0 0 680 170" className="w-full h-auto block" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="egcFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#CD50F1" stopOpacity="0.15"/>
              <stop offset="100%" stopColor="#CD50F1" stopOpacity="0"/>
            </linearGradient>
            <clipPath id="chartClip"><rect x="60" y="5" width="570" height="135"/></clipPath>
          </defs>
          <line x1="60" y1="10" x2="60" y2="140" stroke="hsl(279 33% 90%)" strokeWidth="1"/>
          <line x1="60" y1="140" x2="630" y2="140" stroke="hsl(279 33% 90%)" strokeWidth="1"/>
          <line x1="60" y1="105" x2="630" y2="105" stroke="hsl(279 33% 90%)" strokeWidth="0.5" strokeDasharray="4"/>
          <line x1="60" y1="70" x2="630" y2="70" stroke="hsl(279 33% 90%)" strokeWidth="0.5" strokeDasharray="4"/>
          <line x1="60" y1="35" x2="630" y2="35" stroke="hsl(279 33% 90%)" strokeWidth="0.5" strokeDasharray="4"/>
          <line x1="420" y1="15" x2="420" y2="140" stroke="#D4A0B8" strokeWidth="1" strokeDasharray="4,3" opacity="0.6"/>
          <text x="420" y="11" fontFamily="Inter, sans-serif" fontSize="7" fill="#C06080" textAnchor="middle" fontWeight="600">{t.betaTest.adsStoppedLabel}</text>
          <path d="M60,92 C130,89 200,85 270,82 C330,79 370,77 420,74" fill="none" stroke="#B8A4CC" strokeWidth="2.2" strokeLinecap="round" clipPath="url(#chartClip)"/>
          <path d="M420,74 C440,88 460,115 480,130 C490,135 500,138 520,139" fill="none" stroke="#B8A4CC" strokeWidth="2.2" strokeLinecap="round" strokeDasharray="5,4" opacity="0.5" clipPath="url(#chartClip)"/>
          <text x="530" y="135" fontFamily="Inter, sans-serif" fontSize="7" fill="#C0A4B8" opacity="0.8">{t.betaTest.noReachLabel}</text>
          <path d="M60,138 C130,136 200,130 270,118 C340,100 380,78 420,58 C470,38 530,22 580,14 L630,10 L630,140 L60,140 Z" fill="url(#egcFill)" clipPath="url(#chartClip)"/>
          <path d="M60,138 C130,136 200,130 270,118 C340,100 380,78 420,58 C470,38 530,22 580,14 L630,10" fill="none" stroke="#CD50F1" strokeWidth="2.8" strokeLinecap="round" clipPath="url(#chartClip)"/>
          <text x="610" y="71" fontFamily="Inter, sans-serif" fontSize="8.5" fill="#B8A4CC" fontWeight="600">Ads</text>
          <text x="610" y="8" fontFamily="Inter, sans-serif" fontSize="8.5" fill="#CD50F1" fontWeight="700">EGC</text>
          <text x="118" y="157" fontFamily="Inter, sans-serif" fontSize="9" fill="hsl(279 33% 45%)" textAnchor="middle">{t.betaTest.chartMonthLabel} 1</text>
          <text x="232" y="157" fontFamily="Inter, sans-serif" fontSize="9" fill="hsl(279 33% 45%)" textAnchor="middle">{t.betaTest.chartMonthLabel} 2</text>
          <text x="346" y="157" fontFamily="Inter, sans-serif" fontSize="9" fill="hsl(279 33% 45%)" textAnchor="middle">{t.betaTest.chartMonthLabel} 3</text>
          <text x="460" y="157" fontFamily="Inter, sans-serif" fontSize="9" fill="hsl(279 33% 45%)" textAnchor="middle">{t.betaTest.chartMonthLabel} 4</text>
          <text x="574" y="157" fontFamily="Inter, sans-serif" fontSize="9" fill="hsl(279 33% 45%)" textAnchor="middle">{t.betaTest.chartMonthLabel} 5</text>
        </svg>
      </section>

      {/* ROI SIMULATOR */}
      <section className="border rounded-xl overflow-hidden mb-6">
        <div className="bg-gradient-to-br from-[#0F0A18] via-[#1A0E2E] to-[#2D1445] px-6 py-4 flex items-center gap-3">
          <Calculator className="w-5 h-5 text-primary" />
          <div>
            <h3 className="font-headline text-sm font-bold text-white">{t.betaTest.simulatorTitle}</h3>
            <p className="text-[10px] text-white/40">{t.betaTest.simulatorSubtitle}</p>
          </div>
        </div>
        <div className="bg-card p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  <span className="text-xs font-semibold text-accent-foreground">{t.betaTest.collaboratorsInProgram}</span>
                </div>
                <span className="text-sm font-bold text-primary bg-secondary px-3 py-1 rounded-full">{simColabs}</span>
              </div>
              <Slider value={[simColabs]} onValueChange={(v) => setSimColabs(v[0])} min={5} max={70} step={1} className="w-full" />
              <div className="flex justify-between mt-1">
                <span className="text-[9px] text-muted-foreground">5</span>
                <span className="text-[9px] text-muted-foreground">70</span>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-primary" />
                  <span className="text-xs font-semibold text-accent-foreground">{t.betaTest.impressionsPerMonth}</span>
                </div>
                <span className="text-sm font-bold text-primary bg-secondary px-3 py-1 rounded-full">{simImpressions.toLocaleString('pt-BR')}</span>
              </div>
              <Slider value={[simImpressions]} onValueChange={(v) => setSimImpressions(v[0])} min={1000} max={50000} step={1000} className="w-full" />
              <div className="flex justify-between mt-1">
                <span className="text-[9px] text-muted-foreground">1.000</span>
                <span className="text-[9px] text-muted-foreground">50.000</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            <div className="bg-secondary rounded-xl p-4 text-center">
              <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">{t.betaTest.totalImpressionsMonth}</p>
              <p className="font-headline text-lg font-bold text-accent-foreground">{simResults.totalImpressions.toLocaleString('pt-BR')}</p>
            </div>
            <div className="bg-secondary rounded-xl p-4 text-center border-2 border-primary">
              <p className="text-[9px] font-semibold text-primary uppercase tracking-wide mb-1">{t.betaTest.mediaEquivalentValue}</p>
              <p className="font-headline text-lg font-bold text-primary">R$ {simResults.valorBoldfy.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
              <p className="text-[8px] text-muted-foreground">{t.betaTest.perImpression}</p>
            </div>
            <div className="bg-secondary rounded-xl p-4 text-center">
              <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">{t.betaTest.sameReachViaAds}</p>
              <p className="font-headline text-lg font-bold text-accent-foreground">
                R$ {simResults.custoAdsLow.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                <span className="text-xs font-normal text-muted-foreground"> a </span>
                R$ {simResults.custoAdsHigh.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </p>
              <p className="text-[8px] text-muted-foreground">{t.betaTest.cpmRange}</p>
            </div>
            <div className="bg-secondary rounded-xl p-4 text-center border-2 border-primary/30">
              <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">{t.betaTest.boldfyCostMonth}</p>
              <p className="text-[10px] text-muted-foreground line-through">R$ {simResults.custoMensal.toLocaleString('pt-BR')}</p>
              <p className="font-headline text-lg font-bold text-primary">R$ {simResults.custoMensalBeta.toLocaleString('pt-BR')}</p>
              <p className="text-[8px] text-muted-foreground">R$ {simResults.custoBetaSeat}{t.betaTest.perSeat}</p>
              <span className="inline-flex text-[7px] font-bold uppercase tracking-wide bg-primary/15 text-primary px-2 py-0.5 rounded-full mt-1">{t.betaTest.betaPriceLabel}</span>
            </div>
          </div>
          {simResults.roi > 0 && (
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-xs font-bold text-accent-foreground">{t.betaTest.roiTitle}</p>
                  <p className="text-[10px] text-muted-foreground">{t.betaTest.roiSubtitle}</p>
                </div>
              </div>
              <span className="font-headline text-2xl font-bold text-primary">
                {simResults.roi > 0 ? '+' : ''}{simResults.roi.toFixed(0)}%
              </span>
            </div>
          )}
          <p className="text-[9px] text-muted-foreground text-center mt-4 leading-relaxed max-w-xl mx-auto">{t.betaTest.simulatorNote}</p>
        </div>
      </section>

      {/* FLOW */}
      <section className="bg-card border rounded-xl p-5 mb-6">
        <span className="inline-flex text-[10px] font-bold uppercase tracking-wide bg-primary text-white px-3 py-1 rounded-full mb-4">{t.betaTest.howItWorks}</span>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-0">
          {flowSteps.map((s, i) => (
            <div key={s.n} className="text-center px-2 py-3 relative">
              {i < 4 && <span className="hidden sm:block absolute right-[-8px] top-1/2 -translate-y-1/2 text-primary font-bold text-lg z-10">&rarr;</span>}
              <div className="w-7 h-7 rounded-full bg-primary text-white text-[11px] font-bold flex items-center justify-center mx-auto mb-2">{s.n}</div>
              <p className="text-[10px] font-bold text-accent-foreground mb-1">{s.label}</p>
              <p className="text-[9px] text-muted-foreground leading-snug">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* BENEFITS */}
      <section className="space-y-3 mb-6">
        <div className="bg-gradient-to-br from-[#5E2A67] to-[#3A1A45] rounded-xl px-5 py-3 flex flex-wrap items-center gap-3">
          <span className="inline-flex text-[10px] font-bold uppercase tracking-wide bg-[#0F0A18] text-primary px-3 py-1 rounded-full shrink-0">{t.betaTest.forCompany}</span>
          <div className="flex flex-wrap gap-2">
            {benefitsCompany.map((b) => (
              <span key={b} className="text-[10px] font-semibold px-3 py-1 rounded-full bg-primary/20 text-purple-200">{b}</span>
            ))}
          </div>
        </div>
        <div className="bg-secondary border rounded-xl px-5 py-3 flex flex-wrap items-center gap-3">
          <span className="inline-flex text-[10px] font-bold uppercase tracking-wide bg-primary text-white px-3 py-1 rounded-full shrink-0">{t.betaTest.forCollaborator}</span>
          <div className="flex flex-wrap gap-2">
            {benefitsCollaborator.map((b) => (
              <span key={b} className="text-[10px] font-semibold px-3 py-1 rounded-full bg-card text-accent-foreground border">{b}</span>
            ))}
          </div>
        </div>
      </section>

      {/* TIMELINE */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {timelineItems.map((item) => (
          <div key={item.when} className="bg-card border rounded-xl p-4 text-center">
            <p className="text-[10px] font-bold uppercase tracking-wide text-primary/70 mb-1">{item.when}</p>
            <p className="text-[11px] font-semibold text-accent-foreground mb-1">{item.what}</p>
            <p className="text-[9px] text-muted-foreground">{item.detail}</p>
          </div>
        ))}
      </section>

      {/* BETA BANNER */}
      <section className="bg-gradient-to-br from-[#1A0E2E] to-[#0F0A18] rounded-xl px-6 py-5 mb-6 flex flex-col md:flex-row items-center justify-between gap-4 border-2 border-primary relative overflow-hidden">
        <div className="absolute top-3 right-[-28px] bg-primary text-white text-[8px] font-extrabold tracking-widest px-8 py-[3px] rotate-45">BETA</div>
        <div>
          <h3 className="font-headline text-lg font-bold text-white mb-1">
            <span className="text-primary">{t.betaTest.betaBannerTitle}</span> {t.betaTest.betaBannerTitleSuffix}
          </h3>
          <p className="text-[11px] text-white/50">{t.betaTest.betaBannerSubtitle}</p>
          <p className="text-[10px] text-primary/70 font-semibold mt-1">{t.betaTest.betaContractTerms}</p>
        </div>
        <div className="flex gap-2 shrink-0">
          {[t.betaTest.freeSetup, t.betaTest.strategyIncluded, t.betaTest.directSupport].map((f) => (
            <span key={f} className="text-[10px] font-bold px-3 py-2 rounded-lg bg-primary/20 text-primary whitespace-nowrap">{f}</span>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {pricingTiers.map((p) => (
          <div key={p.range} className={`bg-card rounded-xl p-4 text-center ${p.featured ? 'border-2 border-primary bg-secondary' : 'border'} ${p.enterprise ? 'bg-gradient-to-br from-[#1A0E2E] to-[#0F0A18] border-primary/30' : ''}`}>
            <p className={`text-[10px] font-semibold mb-1 ${p.enterprise ? 'text-primary' : 'text-primary/70'}`}>{p.range}</p>
            {p.enterprise ? (
              <>
                <p className="font-headline text-sm font-bold text-white mt-2">{t.betaTest.enterprisePrice}</p>
                <button onClick={scrollToForm} className="mt-2 text-[9px] font-bold text-primary hover:text-primary/80 underline underline-offset-2 transition-colors">
                  {t.betaTest.enterpriseCta}
                </button>
              </>
            ) : (
              <>
                <p className="text-[10px] text-muted-foreground line-through mb-0.5">{p.price}</p>
                <p className="font-headline text-xl font-bold text-accent-foreground">{p.betaPrice}</p>
                <p className="text-[9px] text-muted-foreground">{t.betaTest.seatMonth}</p>
                <span className="inline-flex text-[8px] font-bold uppercase tracking-wide bg-primary/15 text-primary px-2 py-0.5 rounded-full mt-1.5">{t.betaTest.betaPriceLabel}</span>
              </>
            )}
          </div>
        ))}
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-br from-[#0F0A18] to-[#1A0E2E] rounded-xl px-6 py-5 mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="font-headline text-base md:text-lg font-bold text-white mb-1">
            {t.betaTest.ctaTitle} <span className="text-primary">{t.betaTest.ctaTitleHighlight}</span> {t.betaTest.ctaTitleSuffix}
          </h2>
          <p className="text-[11px] text-white/40">{t.betaTest.ctaSubtitle}</p>
        </div>
        <Button onClick={scrollToForm} className="text-[11px] font-bold shrink-0">
          {t.betaTest.ctaButton} <ArrowRight className="w-3 h-3 ml-1" />
        </Button>
      </section>

      {/* FORM */}
      <section id="form-section" className="bg-card border rounded-xl p-6 md:p-8 mb-8 scroll-mt-20">
        {sent ? (
          <div className="text-center py-8">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="font-headline text-xl font-bold text-accent-foreground mb-2">{t.betaTest.formSuccessTitle}</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">{t.betaTest.formSuccessMessage}</p>
            <a href={CALENDAR_URL} target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="text-sm font-bold gap-2">
                <Calendar className="w-4 h-4" />
                {t.betaTest.formSuccessButton}
              </Button>
            </a>
          </div>
        ) : (
          <>
            <div className="text-center mb-6">
              <span className="inline-flex text-[10px] font-bold uppercase tracking-wide bg-primary text-white px-3 py-1 rounded-full mb-3">{t.betaTest.formTag}</span>
              <h3 className="font-headline text-lg font-bold text-accent-foreground mb-1">{t.betaTest.formTitle}</h3>
              <p className="text-sm text-muted-foreground">{t.betaTest.formSubtitle}</p>
            </div>
            <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="nome" className="text-xs">{t.betaTest.formName} {t.betaTest.formRequired}</Label>
                  <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder={t.betaTest.formNamePlaceholder} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs">{t.betaTest.formEmail} {t.betaTest.formRequired}</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t.betaTest.formEmailPlaceholder} required />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="telefone" className="text-xs">{t.betaTest.formPhone} {t.betaTest.formRequired}</Label>
                  <Input id="telefone" type="tel" value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder={t.betaTest.formPhonePlaceholder} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cargo" className="text-xs">{t.betaTest.formRole} {t.betaTest.formRequired}</Label>
                  <select id="cargo" value={cargo} onChange={(e) => setCargo(e.target.value)} required
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                    <option value="">{t.betaTest.formSelect}</option>
                    <option value="CMO">{t.betaTest.selectRoleCMO}</option>
                    <option value="Head de Vendas">{t.betaTest.selectRoleSales}</option>
                    <option value="CEO">{t.betaTest.selectRoleCEO}</option>
                    <option value="Head de People">{t.betaTest.selectRolePeople}</option>
                    <option value="Coord. Marketing">{t.betaTest.selectRoleCoord}</option>
                    <option value="Outro">{t.betaTest.selectRoleOther}</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="empresa" className="text-xs">{t.betaTest.formCompany} {t.betaTest.formRequired}</Label>
                  <Input id="empresa" value={empresa} onChange={(e) => setEmpresa(e.target.value)} placeholder={t.betaTest.formCompanyPlaceholder} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="setor" className="text-xs">{t.betaTest.formSector} {t.betaTest.formRequired}</Label>
                  <select id="setor" value={setor} onChange={(e) => setSetor(e.target.value)} required
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                    <option value="">{t.betaTest.formSelect}</option>
                    <option value="Tech/SaaS">{t.betaTest.selectSectorTech}</option>
                    <option value="Fintech">{t.betaTest.selectSectorFintech}</option>
                    <option value="Consultoria">{t.betaTest.selectSectorConsulting}</option>
                    <option value="Indústria">{t.betaTest.selectSectorIndustry}</option>
                    <option value="Startup B2B">{t.betaTest.selectSectorStartup}</option>
                    <option value="EdTech">{t.betaTest.selectSectorEdTech}</option>
                    <option value="Outro">{t.betaTest.selectSectorOther}</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="colaboradores" className="text-xs">{t.betaTest.formCollaborators} {t.betaTest.formRequired}</Label>
                  <select id="colaboradores" value={colaboradores} onChange={(e) => setColaboradores(e.target.value)} required
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                    <option value="">{t.betaTest.formSelect}</option>
                    <option value="5-10">5 &ndash; 10</option>
                    <option value="11-30">11 &ndash; 30</option>
                    <option value="31-99">31 &ndash; 99</option>
                    <option value="100-500">100 &ndash; 500</option>
                    <option value="500+">500+</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="objetivo" className="text-xs">{t.betaTest.formObjective} {t.betaTest.formRequired}</Label>
                  <select id="objetivo" value={objetivoPrincipal} onChange={(e) => setObjetivoPrincipal(e.target.value)} required
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                    <option value="">{t.betaTest.formSelect}</option>
                    <option value="Marketing/Awareness">{t.betaTest.selectObjMarketing}</option>
                    <option value="Social Selling">{t.betaTest.selectObjSocialSelling}</option>
                    <option value="Employer Branding">{t.betaTest.selectObjEmployerBranding}</option>
                    <option value="Todos">{t.betaTest.selectObjAll}</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="como" className="text-xs">{t.betaTest.formHowFound} {t.betaTest.formRequired}</Label>
                <select id="como" value={comoConheceu} onChange={(e) => setComoConheceu(e.target.value)} required
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                  <option value="">{t.betaTest.formSelect}</option>
                  <option value="LinkedIn">{t.betaTest.selectHowLinkedIn}</option>
                  <option value="Indicação">{t.betaTest.selectHowReferral}</option>
                  <option value="Google">{t.betaTest.selectHowGoogle}</option>
                  <option value="Evento">{t.betaTest.selectHowEvent}</option>
                  <option value="Outro">{t.betaTest.selectHowOther}</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="obs" className="text-xs">{t.betaTest.formNotes} <span className="text-muted-foreground">{t.betaTest.formOptional}</span></Label>
                <Textarea id="obs" value={observacoes} onChange={(e) => setObservacoes(e.target.value)} placeholder={t.betaTest.formNotesPlaceholder} rows={3} />
              </div>
              {error && (
                <div className="text-sm text-destructive text-center">{error}</div>
              )}
              <Button type="submit" className="w-full font-bold" disabled={sending}>
                {sending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t.betaTest.formSubmitting}</>
                ) : (
                  <>{t.betaTest.formSubmit} <ArrowRight className="w-4 h-4 ml-2" /></>
                )}
              </Button>
            </form>
          </>
        )}
      </section>
    </div>
  );
}
