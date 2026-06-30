import Image from 'next/image';
import Link from 'next/link';
import { getPublishedPosts } from '@/lib/notion';
import { HeroButton } from './hero-button';
import { ProposalLinkButton } from './proposal-button';

export const revalidate = 300; // ISR: revalida o mini-feed do blog a cada 5 min

/* UTM padrão pra medir o que o link-in-bio gera no dashboard de UTM. */
const UTM = 'utm_source=link-in-bio&utm_medium=bio&utm_campaign=link-in-bio';
function withUtm(path: string, content: string) {
  const sep = path.includes('?') ? '&' : '?';
  return `${path}${sep}${UTM}&utm_content=${content}`;
}

const AVATARS = [1, 2, 3, 4, 5];

const CASES = [
  {
    href: '/para/marketing',
    photo: '/images/persona-marketing.png',
    area: 'Marketing',
    metric: '+47% de alcance orgânico',
    color: '#10B981',
    utm: 'caso-marketing',
  },
  {
    href: '/para/vendas',
    photo: '/images/persona-comercial.png',
    area: 'Vendas',
    metric: 'Leads engajando no feed',
    color: '#F59E0B',
    utm: 'caso-vendas',
  },
  {
    href: '/para/rh',
    photo: '/images/persona-rh.png',
    area: 'RH',
    metric: 'Time engajado, marca forte',
    color: '#3B82F6',
    utm: 'caso-rh',
  },
];

const ArrowIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

export default async function LinkPage() {
  let posts: Awaited<ReturnType<typeof getPublishedPosts>> = [];
  try {
    posts = (await getPublishedPosts()).slice(0, 3);
  } catch {
    posts = [];
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background px-5 pb-16 pt-10">
      {/* atmosfera de fundo */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-36 -top-32 h-[420px] w-[420px] rounded-full bg-primary opacity-[0.12] blur-[120px]" />
        <div className="absolute -bottom-32 -right-32 h-[380px] w-[380px] rounded-full bg-[#E875FF] opacity-[0.10] blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-[480px] flex-col items-center gap-3.5">
        {/* LOGO + tag de posicionamento */}
        <div className="relative mb-1 flex flex-col items-center pt-2">
          <span className="z-10 mb-[18px] inline-block rounded-full border border-primary/25 bg-primary/10 px-[15px] py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-primary">
            Content Intelligence para Team-Led Growth
          </span>
          <div className="absolute top-0 h-[200px] w-[200px] rounded-full bg-primary opacity-[0.14] blur-[70px]" />
          <Link href="/" aria-label="Ir para a home da Boldfy" className="relative z-10">
            <Image
              src="/images/boldfy-logo.svg"
              alt="Boldfy"
              width={145}
              height={56}
              priority
              className="boldfy-float h-[56px] w-auto transition-transform duration-200 hover:-translate-y-0.5"
            />
          </Link>
        </div>

        {/* PROVA SOCIAL */}
        <div className="flex items-center gap-3 rounded-full border border-border bg-card py-[7px] pl-2.5 pr-4 shadow-[0_8px_32px_rgba(93,42,103,0.06)]">
          <div className="flex items-center pl-[11px]">
            {AVATARS.map((n) => (
              <div
                key={n}
                className="relative -ml-[11px] h-[30px] w-[30px] overflow-hidden rounded-full border-2 border-card transition-transform duration-200 hover:-translate-y-1 hover:z-10"
              >
                <Image
                  src={`/images/avatar-${n}.jpeg`}
                  alt=""
                  width={30}
                  height={30}
                  className="h-full w-full object-cover"
                />
              </div>
            ))}
          </div>
          <p className="text-[12px] font-semibold leading-tight text-foreground">
            times inteiros virando
            <br />
            <span className="text-[#5E2A67]">criadores no LinkedIn</span>
          </p>
        </div>

        {/* HERÓI */}
        <div className="my-2 w-full">
          <HeroButton href={withUtm('/ferramentas/playbook-team-led-growth', 'playbook')} />
        </div>

        {/* MATERIAIS GRATUITOS (inclui a newsletter como asset gratuito) */}
        <h2 className="mt-[18px] w-full pl-1 text-left text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
          Materiais gratuitos
        </h2>

        {/* Case (destaque) */}
        <Link
          href={withUtm('/case-semrush', 'case-semrush')}
          className="group flex w-full items-center gap-[13px] rounded-[16px] border border-primary/45 bg-card p-3 shadow-[0_12px_36px_rgba(205,80,241,0.14)] transition-transform duration-200 hover:translate-x-1"
        >
          <Image
            src="/images/case-semrush-cover.jpeg"
            alt=""
            width={54}
            height={54}
            className="h-[54px] w-[54px] shrink-0 rounded-[11px] object-cover"
          />
          <div className="min-w-0 flex-1">
            <div className="mb-0.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-primary">
              <span className="link-newdot inline-block h-[7px] w-[7px] rounded-full bg-primary" />
              Case · destaque
            </div>
            <div className="text-[14px] font-bold leading-tight text-[#5E2A67]">
              Semrush: Team-Led Growth na prática
            </div>
            <div className="mt-0.5 text-[11.5px] text-muted-foreground">
              Bastidores de uma estratégia global
            </div>
          </div>
          <ArrowIcon className="shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-1" />
        </Link>

        {/* Report */}
        <Link
          href={withUtm('/algoritmo-linkedin', 'report-algoritmo')}
          className="group flex w-full items-center gap-[13px] rounded-[16px] border border-border bg-card p-3 shadow-[0_8px_32px_rgba(93,42,103,0.06)] transition-transform duration-200 hover:translate-x-1 hover:border-primary/45"
        >
          <Image
            src="/images/algoritmo-linkedin-cover.jpeg"
            alt=""
            width={54}
            height={54}
            className="h-[54px] w-[54px] shrink-0 rounded-[11px] object-cover"
          />
          <div className="min-w-0 flex-1">
            <div className="mb-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-primary">
              Report
            </div>
            <div className="text-[14px] font-bold leading-tight text-[#5E2A67]">
              O algoritmo do LinkedIn mudou tudo
            </div>
            <div className="mt-0.5 text-[11.5px] text-muted-foreground">
              Análise da atualização 360Brew · 2026
            </div>
          </div>
          <ArrowIcon className="shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-1" />
        </Link>

        {/* Newsletter (asset gratuito) */}
        <a
          href={withUtm('https://brandingdeproposito.substack.com', 'newsletter')}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex w-full items-center gap-[13px] rounded-[16px] border border-border bg-card p-3 shadow-[0_8px_32px_rgba(93,42,103,0.06)] transition-transform duration-200 hover:translate-x-1 hover:border-[#FF6719]/45"
        >
          <div className="flex h-[54px] w-[54px] shrink-0 items-center justify-center rounded-[11px] bg-[#FF6719]/[0.12] text-[#FF6719]">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M22.539 8.242H1.46V5.406h21.08v2.836zM22.539 12.322v11.538l-10.5-5.836-10.5 5.836V12.322h21zM1.46 1.458h21.08v2.836H1.46V1.458z" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-[#FF6719]">
              Newsletter
            </div>
            <div className="text-[14px] font-bold leading-tight text-[#5E2A67]">
              Branding de Propósito
            </div>
            <div className="mt-0.5 text-[11.5px] text-muted-foreground">
              A news da Clara Ramos · grátis no Substack
            </div>
          </div>
          <ArrowIcon className="shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-1" />
        </a>

        {/* CASOS DE USO (fotos das personas) */}
        <h2 className="mt-[18px] w-full pl-1 text-left text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
          Casos de uso
        </h2>
        <div className="grid w-full grid-cols-3 gap-[9px]">
          {CASES.map((c) => (
            <Link
              key={c.href}
              href={withUtm(c.href, c.utm)}
              className="group relative block aspect-[3/4] overflow-hidden rounded-[14px] shadow-[0_8px_32px_rgba(93,42,103,0.06)] transition-transform duration-300 hover:-translate-y-1.5 hover:shadow-[0_18px_44px_rgba(205,80,241,0.18)]"
            >
              <Image
                src={c.photo}
                alt={`Caso de uso: ${c.area}`}
                fill
                sizes="150px"
                className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.07]"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[rgba(15,10,24,0.88)]" />
              <div className="absolute inset-x-0 bottom-0 z-[1] p-[10px]">
                <span
                  className="mb-[5px] inline-flex items-center rounded-full px-[7px] py-[3px] text-[8.5px] font-bold uppercase tracking-[0.08em] text-white"
                  style={{ backgroundColor: c.color }}
                >
                  {c.area}
                </span>
                <div className="font-headline text-[14px] font-black leading-none text-white">
                  {c.area}
                </div>
                <div className="mt-0.5 text-[9.5px] font-semibold text-white/80">
                  {c.metric}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Conhecer a Boldfy (depois dos casos de uso) */}
        <Link
          href={withUtm('/', 'site')}
          className="group flex w-full items-center justify-center gap-2.5 rounded-[14px] border border-border bg-card px-[22px] py-[15px] text-[14.5px] font-bold text-[#5E2A67] shadow-[0_6px_20px_rgba(93,42,103,0.05)] transition-transform duration-200 hover:-translate-y-0.5 hover:border-primary hover:text-primary"
        >
          Conhecer a Boldfy
          <ArrowIcon className="text-muted-foreground transition-transform duration-200 group-hover:translate-x-1 group-hover:text-primary" />
        </Link>

        {/* SOLUÇÕES (cards de ícone, na marca) */}
        <h2 className="mt-[18px] w-full pl-1 text-left text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
          Soluções
        </h2>
        <div className="grid w-full grid-cols-2 gap-2.5">
          <Link
            href={withUtm('/solucoes/software-as-a-service', 'solucao-saas')}
            className="flex flex-col gap-2.5 rounded-[16px] bg-gradient-to-br from-primary to-[#7E3FA6] p-4 text-white shadow-[0_10px_30px_rgba(93,42,103,0.12)] transition-transform duration-200 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(205,80,241,0.4)]"
          >
            <div className="flex h-[38px] w-[38px] items-center justify-center rounded-[11px] bg-white/20">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .962 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.582a.5.5 0 0 1 0 .962L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.962 0Z" />
                <path d="M20 3v4M22 5h-4M4 17v2M5 18H3" />
              </svg>
            </div>
            <div>
              <div className="text-[9px] font-extrabold uppercase tracking-[0.12em] opacity-85">
                Software as a Service
              </div>
              <div className="font-headline text-[15px] font-black leading-tight">Conteúdo feito pelo time</div>
            </div>
            <p className="text-[11px] leading-snug opacity-90">
              O software que põe o time pra criar e mede o alcance.
            </p>
          </Link>
          <Link
            href={withUtm('/solucoes/content-as-a-service', 'solucao-caas')}
            className="flex flex-col gap-2.5 rounded-[16px] bg-gradient-to-br from-[#5E2A67] to-[#3C1A45] p-4 text-white shadow-[0_10px_30px_rgba(93,42,103,0.12)] transition-transform duration-200 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(94,42,103,0.4)]"
          >
            <div className="flex h-[38px] w-[38px] items-center justify-center rounded-[11px] bg-white/20">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" x2="12" y1="19" y2="22" />
              </svg>
            </div>
            <div>
              <div className="text-[9px] font-extrabold uppercase tracking-[0.12em] opacity-85">
                Content as a Service
              </div>
              <div className="font-headline text-[15px] font-black leading-tight">Conteúdo feito pela Boldfy</div>
            </div>
            <p className="text-[11px] leading-snug opacity-90">
              A Boldfy produz o conteúdo pelo seu time, ponta a ponta.
            </p>
          </Link>
        </div>

        {/* Proposta personalizada → abre o pop-up "Monte sua proposta" */}
        <ProposalLinkButton />

        {/* BLOG */}
        {posts.length > 0 && (
          <>
            <h2 className="mt-[18px] w-full pl-1 text-left text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
              Do nosso blog
            </h2>
            <div className="grid w-full grid-cols-3 gap-2">
              {posts.map((post) => (
                <Link
                  key={post.slug}
                  href={withUtm(`/blog/${post.slug}`, 'blog')}
                  className="group relative block aspect-square overflow-hidden rounded-[12px] bg-secondary"
                >
                  {post.coverUrl ? (
                    <Image
                      src={post.coverUrl}
                      alt={post.title}
                      fill
                      sizes="150px"
                      className="object-cover transition-transform duration-300 group-hover:scale-[1.08]"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-[#E875FF]/20" />
                  )}
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[rgba(15,10,24,0.85)] to-transparent px-2 pb-[7px] pt-3.5 text-[9.5px] font-bold leading-tight text-white">
                    {post.title}
                  </span>
                </Link>
              ))}
            </div>
            <Link
              href={withUtm('/blog', 'blog-todos')}
              className="group mt-2.5 inline-flex items-center gap-1.5 text-[13px] font-bold text-primary"
            >
              Ver todos os artigos
              <ArrowIcon className="transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
          </>
        )}

        {/* FOOTER mínimo */}
        <div className="mt-6 flex items-center gap-[18px] opacity-85">
          <a
            href="https://www.linkedin.com/company/boldfy-branding"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn da Boldfy"
            className="flex h-[38px] w-[38px] items-center justify-center rounded-full border border-border bg-card text-[#5E2A67] transition-transform duration-200 hover:-translate-y-0.5 hover:border-primary hover:text-primary"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
            </svg>
          </a>
          <Link
            href="/legal#privacidade"
            className="flex h-[38px] items-center justify-center rounded-full border border-border bg-card px-4 text-[12px] font-semibold text-[#5E2A67] transition-transform duration-200 hover:-translate-y-0.5 hover:border-primary hover:text-primary"
          >
            Privacidade
          </Link>
        </div>
      </div>
    </div>
  );
}
