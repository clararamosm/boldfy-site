'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowUp, Shield, FileText, Cookie, ShieldAlert } from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Âncora de navegação lateral (sticky)                               */
/* ------------------------------------------------------------------ */
function NavAnchor() {
  const [active, setActive] = useState<string>('privacidade');

  useEffect(() => {
    const sections = ['privacidade', 'termos', 'uso-aceitavel', 'cookies'];
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { rootMargin: '-30% 0px -60% 0px' },
    );

    sections.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const items = [
    { id: 'privacidade', label: 'Política de Privacidade', icon: Shield },
    { id: 'termos', label: 'Termos de Uso', icon: FileText },
    { id: 'uso-aceitavel', label: 'Política de Uso Aceitável', icon: ShieldAlert },
    { id: 'cookies', label: 'Política de Cookies', icon: Cookie },
  ];

  return (
    <nav className="sticky top-24 flex flex-col gap-1.5">
      <div className="mb-3 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
        Nesta página
      </div>
      {items.map((item) => (
        <a
          key={item.id}
          href={`#${item.id}`}
          className={`group flex items-center gap-2.5 rounded-lg border px-3 py-2 text-[13px] font-semibold transition-all ${
            active === item.id
              ? 'border-primary bg-primary/[0.08] text-primary'
              : 'border-transparent text-muted-foreground hover:border-border hover:bg-card hover:text-accent-foreground'
          }`}
        >
          <item.icon className="h-4 w-4 shrink-0" />
          <span>{item.label}</span>
        </a>
      ))}
    </nav>
  );
}

/* ------------------------------------------------------------------ */
/*  Botão "voltar ao topo"                                             */
/* ------------------------------------------------------------------ */
function BackToTop() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed bottom-8 right-8 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-primary text-white shadow-[0_8px_24px_rgba(205,80,241,0.35)] transition-all hover:-translate-y-0.5"
      aria-label="Voltar ao topo"
    >
      <ArrowUp className="h-5 w-5" />
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Título de seção                                                    */
/* ------------------------------------------------------------------ */
function SectionTitle({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2
      id={id}
      className="scroll-mt-24 font-headline text-[clamp(26px,3vw,34px)] font-black leading-[1.15] tracking-[-0.02em] text-accent-foreground"
    >
      {children}
    </h2>
  );
}

function H3({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mt-8 mb-3 font-headline text-[18px] font-black text-accent-foreground">
      {children}
    </h3>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="mb-4 text-[14.5px] leading-[1.7] text-muted-foreground">{children}</p>;
}

function UL({ children }: { children: React.ReactNode }) {
  return (
    <ul className="mb-4 flex flex-col gap-2 pl-5 text-[14.5px] leading-[1.7] text-muted-foreground [&>li]:list-disc">
      {children}
    </ul>
  );
}

/* ------------------------------------------------------------------ */
/*  Legal client                                                       */
/* ------------------------------------------------------------------ */
export default function LegalClient() {
  const LAST_UPDATE = '24 de maio de 2026';

  return (
    <>
      {/* Hero compacto */}
      <section className="relative overflow-hidden bg-background px-6 pb-12 pt-28 md:px-12">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(rgba(205,80,241,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(205,80,241,0.05) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
            maskImage: 'radial-gradient(ellipse at center, black 20%, transparent 70%)',
            WebkitMaskImage: 'radial-gradient(ellipse at center, black 20%, transparent 70%)',
          }}
        />
        <div className="relative z-10 mx-auto max-w-[1100px]">
          <span className="mb-4 inline-block rounded-full border border-primary/25 bg-primary/[0.08] px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.15em] text-primary">
            Legal
          </span>
          <h1 className="font-headline text-[clamp(32px,4vw,48px)] font-black leading-[1.05] tracking-[-0.03em] text-accent-foreground">
            Privacidade, Termos, Uso Aceitável e Cookies
          </h1>
          <p className="mt-4 max-w-[640px] text-[15px] leading-[1.6] text-muted-foreground">
            Tudo que rege nossa relação com você, num só lugar. Direto ao ponto, sem juridiquês
            desnecessário.
          </p>
          <div className="mt-4 text-[12px] text-muted-foreground">
            Última atualização: {LAST_UPDATE}
          </div>
        </div>
      </section>

      {/* Conteúdo principal — grid com nav lateral */}
      <section className="relative bg-background px-6 pb-24 md:px-12">
        <div className="mx-auto grid max-w-[1100px] grid-cols-1 gap-12 lg:grid-cols-[240px_1fr]">
          {/* Nav lateral sticky */}
          <aside className="hidden lg:block">
            <NavAnchor />
          </aside>

          {/* Conteúdo */}
          <div className="flex flex-col gap-20">
            {/* ============================================== */}
            {/*  1. POLÍTICA DE PRIVACIDADE                    */}
            {/* ============================================== */}
            <section>
              <SectionTitle id="privacidade">1. Política de Privacidade</SectionTitle>
              <p className="mt-3 text-[13px] font-semibold uppercase tracking-wider text-primary">
                Como tratamos seus dados, em linha com a LGPD
              </p>

              <H3>1.1 Quem somos</H3>
              <P>
                Somos a Boldfy, uma empresa brasileira que oferece plataforma de software
                (Software as a Service) e serviço de produção de conteúdo (Content as a Service)
                para programas de Employee Advocacy no LinkedIn. Para fins desta política, somos
                a controladora dos dados coletados através do site{' '}
                <strong>boldfy.com.br</strong> e da nossa plataforma.
              </P>

              <H3>1.2 Quais dados coletamos</H3>
              <P>Coletamos apenas o necessário para operar o serviço e falar com você:</P>
              <UL>
                <li>
                  <strong>Dados de cadastro</strong> — nome, e-mail corporativo, empresa, cargo,
                  quando você preenche formulário de demo, orçamento ou newsletter.
                </li>
                <li>
                  <strong>Dados de uso</strong> — cookies de sessão, logs de acesso, páginas
                  visitadas, tempo de navegação (para melhorar o produto).
                </li>
                <li>
                  <strong>Dados de comunicação</strong> — mensagens trocadas por e-mail, WhatsApp
                  ou dentro da plataforma.
                </li>
                <li>
                  <strong>Dados da plataforma (clientes)</strong> — conteúdo publicado, Brand
                  Context da empresa, métricas de posts, integrações com LinkedIn.
                </li>
              </UL>

              <H3>1.3 Por que coletamos</H3>
              <UL>
                <li>Entregar o serviço contratado (base legal: execução de contrato).</li>
                <li>Responder dúvidas e propostas comerciais (legítimo interesse).</li>
                <li>Melhorar o produto e medir performance (legítimo interesse).</li>
                <li>Cumprir obrigações legais e fiscais (obrigação legal).</li>
                <li>
                  Enviar comunicações de marketing apenas com seu consentimento explícito — você
                  pode descadastrar a qualquer momento.
                </li>
              </UL>

              <H3>1.4 Com quem compartilhamos</H3>
              <P>
                Seus dados nunca são vendidos. Compartilhamos apenas com fornecedores essenciais à
                operação, todos contratualmente obrigados a tratar dados com o mesmo cuidado:
              </P>
              <UL>
                <li>Hospedagem e CDN (Vercel, Cloudflare)</li>
                <li>E-mail transacional e marketing (ActiveCampaign)</li>
                <li>Análise de tráfego agregada (Google Analytics, Search Console)</li>
                <li>Integrações autorizadas por você (LinkedIn API, Notion)</li>
                <li>Autoridades públicas, quando exigido por lei</li>
              </UL>

              <H3>1.5 Seus direitos (LGPD)</H3>
              <P>A qualquer momento, você pode solicitar:</P>
              <UL>
                <li>Confirmação da existência de tratamento dos seus dados</li>
                <li>Acesso aos dados que temos sobre você</li>
                <li>Correção de dados incompletos ou desatualizados</li>
                <li>Anonimização, bloqueio ou eliminação de dados desnecessários</li>
                <li>Portabilidade dos seus dados para outro fornecedor</li>
                <li>Revogação do consentimento</li>
              </UL>
              <P>
                Para exercer qualquer direito, envie um e-mail para{' '}
                <a
                  href="mailto:admin@boldfy.com.br"
                  className="font-semibold text-primary underline underline-offset-2"
                >
                  admin@boldfy.com.br
                </a>{' '}
                com o assunto &quot;LGPD - solicitação&quot;. Respondemos em até 15 dias úteis.
              </P>

              <H3>1.6 Retenção e segurança</H3>
              <P>
                Mantemos seus dados pelo tempo necessário para cumprir as finalidades descritas,
                respeitando prazos legais de guarda fiscal e trabalhista. Usamos criptografia em
                trânsito (HTTPS), controles de acesso e backups regulares. Nenhum sistema é 100%
                invulnerável, mas fazemos o possível para manter seus dados protegidos.
              </P>

              <H3>1.7 Playbook de Team-Led Growth (ferramenta gratuita)</H3>
              <P>
                A ferramenta em <strong>boldfy.com.br/ferramentas/playbook-team-led-growth</strong>{' '}
                gera uma página personalizada (Playbook) a partir das suas respostas. Como tratamos
                esses dados:
              </P>
              <UL>
                <li>
                  <strong>O que coletamos no quiz</strong> — porte da empresa, setor, sua área e
                  senioridade, voz da empresa no LinkedIn hoje, tentativas anteriores, dores
                  principais, prioridades, status de orçamento, sponsorship da liderança e
                  observações livres (opcional). No fim, pedimos nome, e-mail corporativo, empresa
                  e telefone (opcional) para te entregar o Playbook.
                </li>
                <li>
                  <strong>Página personalizada (link compartilhável)</strong> — o Playbook gerado
                  fica em uma URL única do tipo <code>boldfy.com.br/playbook/[empresa-código]</code>.
                  Essa página é configurada como <em>noindex, nofollow, noarchive</em>: ela não aparece
                  no Google e quem tem o link consegue acessar (você pode compartilhar com seu time).
                </li>
                <li>
                  <strong>Visualizações da página</strong> — registramos quantas vezes a página foi
                  aberta e a data da última visita, para o nosso time identificar quando você
                  voltou. O IP do visualizador é armazenado de forma anonimizada (hash criptográfico
                  com sal secreto), sem possibilidade de reverter pra IP original.
                </li>
                <li id="state-of-elg">
                  <strong>Uso anônimo no Panorama TLG no Brasil</strong> — você pode optar (no fim
                  do quiz, via toggle opt-out já ativado por default) por permitir que suas
                  respostas sejam usadas de forma <strong>anônima e agregada</strong> pra construir
                  o primeiro panorama de Team-Led Growth do Brasil.{' '}
                  <strong>Nesses agregados não há nome, e-mail nem empresa identificáveis</strong>:
                  só contagens (ex.: &quot;42% das empresas de marketing relatam CAC subindo&quot;).
                  Você pode optar separadamente, no mesmo box do form, por receber o relatório em
                  primeira mão quando ele for publicado — esse opt-in é independente do consent de
                  uso anônimo.
                </li>
                <li>
                  <strong>Active Campaign</strong> — seu contato é registrado no nosso provedor de
                  e-mail (ActiveCampaign) com a tag &quot;Form: Playbook Team-Led Growth&quot; e
                  alguns campos do quiz (cargo, dores, budget) para que possamos enviar conteúdos
                  relevantes. Você pode descadastrar a qualquer momento via link no e-mail.
                </li>
                <li>
                  <strong>Retenção do Playbook</strong> — a página do seu Playbook fica disponível
                  por tempo indeterminado, para que você possa revisitar ou compartilhar com o time.
                  Se quiser que removamos a página e seus dados associados, é só pedir por e-mail
                  para <a
                    href="mailto:admin@boldfy.com.br"
                    className="font-semibold text-primary underline underline-offset-2"
                  >admin@boldfy.com.br</a> com o assunto &quot;LGPD - exclusão Playbook&quot;.
                </li>
              </UL>
            </section>

            {/* ============================================== */}
            {/*  2. TERMOS DE USO                              */}
            {/* ============================================== */}
            <section>
              <SectionTitle id="termos">2. Termos de Uso</SectionTitle>
              <p className="mt-3 text-[13px] font-semibold uppercase tracking-wider text-primary">
                Regras de uso do site e da plataforma
              </p>

              <H3>2.1 Aceitação</H3>
              <P>
                Ao acessar o site boldfy.com.br ou usar a plataforma Boldfy, você concorda com
                estes termos. Se não concordar, por favor não use nossos serviços.
              </P>

              <H3>2.2 Conta e cadastro</H3>
              <UL>
                <li>
                  Você é responsável por manter seu login e senha seguros e por toda atividade na
                  sua conta.
                </li>
                <li>Os dados informados no cadastro devem ser verdadeiros e atualizados.</li>
                <li>
                  Contas são individuais — não compartilhe seu acesso com outras pessoas da
                  empresa; cada colaborador deve ter o próprio usuário.
                </li>
              </UL>

              <H3>2.3 Uso aceitável</H3>
              <P>
                Ao usar a plataforma e os serviços da Boldfy, você se compromete a respeitar a{' '}
                <a
                  href="#uso-aceitavel"
                  className="font-semibold text-primary underline underline-offset-2"
                >
                  Política de Uso Aceitável
                </a>{' '}
                (Seção 3 desta página), que detalha o que é permitido e o que é vedado dentro
                da plataforma e nos conteúdos produzidos pela Boldfy.
              </P>

              <H3>2.4 Conteúdo que você publica</H3>
              <P>
                Você mantém a titularidade de todo conteúdo que produz através da plataforma.
                Concede à Boldfy licença limitada para hospedar, processar e distribuir esse
                conteúdo estritamente para fins de operação do serviço contratado.
              </P>

              <H3>2.5 Propriedade intelectual da Boldfy</H3>
              <P>
                O software, a marca, o site, os templates, a metodologia e todo o conteúdo
                desenvolvido pela Boldfy são de nossa propriedade. Você não adquire direito
                algum sobre eles ao usar o serviço — apenas uma licença de uso enquanto o
                contrato estiver ativo.
              </P>

              <H3>2.6 Planos, cobrança e cancelamento</H3>
              <UL>
                <li>
                  Valores, vigências e condições específicas são definidos no contrato comercial
                  assinado por cada cliente.
                </li>
                <li>
                  Cancelamento deve ser solicitado por escrito, respeitando o aviso prévio
                  contratual.
                </li>
                <li>
                  Em caso de inadimplência superior a 30 dias, a Boldfy pode suspender o acesso
                  até regularização.
                </li>
              </UL>

              <H3>2.7 Limitação de responsabilidade</H3>
              <P>
                A Boldfy não se responsabiliza por:
              </P>
              <UL>
                <li>
                  Decisões de terceiros (ex: alcance do LinkedIn, algoritmos de redes sociais)
                </li>
                <li>Indisponibilidades causadas por fornecedores externos (LinkedIn, Vercel)</li>
                <li>
                  Resultados específicos de negócio — ajudamos no processo, mas performance
                  depende de execução, constância e contexto de cada empresa
                </li>
                <li>Conteúdo que o cliente escolhe publicar, mesmo quando produzido por nós</li>
              </UL>

              <H3>2.8 Alterações</H3>
              <P>
                Podemos atualizar estes termos a qualquer momento. Mudanças relevantes serão
                avisadas por e-mail com 15 dias de antecedência. Uso continuado após a mudança
                implica aceitação.
              </P>

              <H3>2.9 Foro</H3>
              <P>
                Estes termos são regidos pelas leis brasileiras. Fica eleito o foro da Comarca de
                Belo Horizonte/MG para dirimir qualquer questão.
              </P>
            </section>

            {/* ============================================== */}
            {/*  3. POLÍTICA DE USO ACEITÁVEL                  */}
            {/* ============================================== */}
            <section>
              <SectionTitle id="uso-aceitavel">3. Política de Uso Aceitável</SectionTitle>
              <p className="mt-3 text-[13px] font-semibold uppercase tracking-wider text-primary">
                O que esperamos de quem usa a plataforma e os serviços
              </p>

              <H3>3.1 A quem se aplica</H3>
              <P>
                Esta política vale para qualquer pessoa que acesse a plataforma Boldfy ou
                consuma serviços de produção de conteúdo (Content as a Service) — sejam
                administradores, colaboradores, embaixadores cadastrados ou convidados. Faz
                parte integrante dos Termos de Uso e do contrato comercial assinado com cada
                cliente.
              </P>

              <H3>3.2 Princípio geral</H3>
              <P>
                A Boldfy existe para amplificar a voz de marcas e profissionais sérios no
                LinkedIn. Tudo que acontece dentro da plataforma e do conteúdo produzido pela
                equipe Boldfy deve ser compatível com prática comercial legítima, com a
                cultura B2B e com as diretrizes da rede social onde o conteúdo é publicado.
              </P>

              <H3>3.3 Usos vedados</H3>
              <P>É proibido usar a plataforma ou os serviços da Boldfy para:</P>
              <UL>
                <li>
                  <strong>Conteúdo ilegal, ofensivo ou enganoso</strong> — discurso de ódio,
                  discriminação, assédio, difamação, desinformação deliberada, fake news,
                  pornografia ou qualquer material que viole leis brasileiras.
                </li>
                <li>
                  <strong>Violação de direitos de terceiros</strong> — uso não autorizado de
                  marca, imagem, voz, obra protegida, dados pessoais alheios ou qualquer
                  conteúdo sobre o qual o cliente não tenha autorização clara.
                </li>
                <li>
                  <strong>Práticas abusivas no LinkedIn</strong> — automação não autorizada,
                  spam de mensagens privadas, criação de contas falsas, compra de seguidores,
                  pods de engajamento artificial, raspagem (scraping) de dados em escala ou
                  qualquer prática que viole os Termos do LinkedIn.
                </li>
                <li>
                  <strong>Concorrência desleal</strong> — fazer engenharia reversa, copiar
                  metodologia, replicar templates, decompilar software, ou tentar reproduzir o
                  serviço Boldfy fora dos limites do contrato.
                </li>
                <li>
                  <strong>Ataque à infraestrutura</strong> — sobrecarga intencional, tentativa
                  de invasão, exploração de vulnerabilidade, distribuição de malware ou
                  qualquer ação que comprometa a segurança da plataforma e de outros clientes.
                </li>
                <li>
                  <strong>Uso indevido de dados</strong> — compartilhamento de logins, criação
                  de usuários genéricos para múltiplas pessoas, exportação de Brand Context ou
                  conteúdo de outros clientes, repasse de credenciais a terceiros não
                  autorizados.
                </li>
                <li>
                  <strong>Conteúdo regulado sem competência</strong> — recomendações
                  financeiras, médicas, jurídicas ou de qualquer área regulamentada sem que a
                  pessoa responsável tenha habilitação profissional adequada.
                </li>
              </UL>

              <H3>3.4 Conteúdo produzido pela Boldfy (CaaS)</H3>
              <P>
                Quando a Boldfy produz conteúdo em nome do cliente, o material passa por nossa
                curadoria editorial e respeita esta política. Reservamo-nos o direito de
                recusar pedidos que confrontem estas regras — mesmo que o cliente insista —
                sem que isso configure descumprimento contratual.
              </P>

              <H3>3.5 Consequências</H3>
              <P>
                Identificada qualquer violação, a Boldfy pode, conforme a gravidade e a
                reincidência:
              </P>
              <UL>
                <li>Notificar o cliente para regularização imediata</li>
                <li>Suspender preventivamente o acesso à plataforma</li>
                <li>Recusar a publicação ou produção de conteúdo específico</li>
                <li>
                  Rescindir o contrato por descumprimento, sem prejuízo das demais sanções
                  previstas no contrato comercial e na legislação aplicável
                </li>
                <li>
                  Reportar às autoridades competentes em casos que envolvam crime ou risco
                  iminente
                </li>
              </UL>

              <H3>3.6 Como reportar</H3>
              <P>
                Se você identificar conteúdo ou comportamento que viole esta política — seja
                de outro usuário, de cliente ou da própria Boldfy —, mande um e-mail para{' '}
                <a
                  href="mailto:admin@boldfy.com.br"
                  className="font-semibold text-primary underline underline-offset-2"
                >
                  admin@boldfy.com.br
                </a>{' '}
                com o assunto &quot;Uso aceitável - denúncia&quot;. Apuramos toda denúncia
                recebida e respondemos em até 5 dias úteis.
              </P>
            </section>

            {/* ============================================== */}
            {/*  4. POLÍTICA DE COOKIES                        */}
            {/* ============================================== */}
            <section>
              <SectionTitle id="cookies">4. Política de Cookies</SectionTitle>
              <p className="mt-3 text-[13px] font-semibold uppercase tracking-wider text-primary">
                O que guardamos no seu navegador e por quê
              </p>

              <H3>4.1 O que são cookies</H3>
              <P>
                Cookies são pequenos arquivos que sites gravam no seu navegador para lembrar
                preferências, manter você logado e medir uso. Usamos o mínimo necessário.
              </P>

              <H3>4.2 Quais cookies usamos</H3>
              <UL>
                <li>
                  <strong>Essenciais</strong> — autenticação, sessão, preferências de idioma.
                  Esses não podem ser desativados, o site não funciona sem eles.
                </li>
                <li>
                  <strong>Analíticos</strong> — Google Analytics agregado, para entender
                  navegação em escala (sem identificar você individualmente).
                </li>
                <li>
                  <strong>Marketing</strong> — só são ativados com seu consentimento. Usados para
                  medir efetividade de campanhas (Meta Pixel, LinkedIn Insight Tag, Google Ads).
                </li>
              </UL>

              <H3>4.3 Como controlar</H3>
              <P>
                Você pode bloquear ou deletar cookies a qualquer momento nas configurações do seu
                navegador. Observe que bloquear cookies essenciais pode impedir o funcionamento
                correto do site.
              </P>
              <UL>
                <li>
                  <a
                    href="https://support.google.com/chrome/answer/95647"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-primary underline underline-offset-2"
                  >
                    Gerenciar cookies no Google Chrome
                  </a>
                </li>
                <li>
                  <a
                    href="https://support.mozilla.org/pt-BR/kb/limpe-cookies-e-dados-de-sites-no-firefox"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-primary underline underline-offset-2"
                  >
                    Gerenciar cookies no Firefox
                  </a>
                </li>
                <li>
                  <a
                    href="https://support.apple.com/pt-br/guide/safari/sfri11471/mac"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-primary underline underline-offset-2"
                  >
                    Gerenciar cookies no Safari
                  </a>
                </li>
              </UL>

              <H3>4.4 Dúvidas</H3>
              <P>
                Qualquer pergunta sobre cookies ou privacidade, fala com a gente:{' '}
                <a
                  href="mailto:admin@boldfy.com.br"
                  className="font-semibold text-primary underline underline-offset-2"
                >
                  admin@boldfy.com.br
                </a>
                .
              </P>
            </section>

            {/* Links relacionados */}
            <div className="rounded-[16px] border border-border bg-card p-6">
              <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                Precisa de algo mais?
              </div>
              <div className="flex flex-wrap gap-4 text-[14px]">
                <Link
                  href="/"
                  className="font-semibold text-primary underline underline-offset-2"
                >
                  Voltar pra home
                </Link>
                <a
                  href="mailto:admin@boldfy.com.br"
                  className="font-semibold text-primary underline underline-offset-2"
                >
                  Falar com a Boldfy
                </a>
              </div>
            </div>
          </div>
        </div>

        <BackToTop />
      </section>
    </>
  );
}
