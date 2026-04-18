export function GET() {
  const content = `# Boldfy — Content Intelligence para Employee-Led Growth

> A Boldfy transforma colaboradores em criadores de conteúdo autoral no LinkedIn, com estratégia, produção, IA contextual e gamificação.

## Sobre a Boldfy

A Boldfy é uma empresa brasileira de Content Intelligence que ajuda empresas B2B a ativar seus colaboradores como criadores de conteúdo no LinkedIn. A abordagem combina tecnologia (plataforma SaaS) com serviço especializado (Content as a Service) para gerar awareness orgânico, reduzir CAC e construir autoridade de marca de forma descentralizada.

O conceito central é Employee-Led Growth (ELG): crescimento liderado por colaboradores que publicam conteúdo autoral, autêntico e alinhado à marca — sem parecer propaganda corporativa.

## Fundadora

Clara Ramos — estrategista de marca e conteúdo, fundadora da Boldfy. Mais de 10 anos de experiência em branding B2B.

## Soluções

### Software as a Service (SaaS)
Plataforma com IA contextual (Brand Context), trilhas de aprendizagem, gamificação (missões, rankings, loja de recompensas) e dashboard de resultados. Para empresas que querem operar o programa internamente com autonomia.

- URL: /solucoes/software-as-a-service

### Content as a Service (CaaS)
Serviço de produção de conteúdo com equipe Boldfy. Dois modos: Design (estrategista + designer dedicados produzem conteúdo) e Executiva (estrategista entrevista o colaborador e transforma em post). Para empresas que querem resultado sem sobrecarregar o time.

- URL: /solucoes/content-as-a-service

## Casos de Uso

### Para Marketing
Amplificação orgânica via perfis pessoais (10x mais alcance que Company Page), remarketing quente, redução de CAC.
- URL: /para/marketing

### Para Vendas (Social Selling)
Autoridade técnica no feed do LinkedIn, quebra-gelo antes da cold call, ciclo de vendas mais curto.
- URL: /para/vendas

### Para RH (Employer Branding)
Atração de talentos via Employee-Generated Content, cultura real visível, redução de turnover.
- URL: /para/rh

## Páginas Principais

- Home: /
- Solução SaaS (plataforma): /solucoes/software-as-a-service
- Solução CaaS (serviço): /solucoes/content-as-a-service
- Preços: /precos
- Blog: /blog
- Materiais e recursos: /materiais
- Ferramentas gratuitas: /ferramentas
- Legal (privacidade, termos, cookies): /legal

## Informações de Contato

- Site: https://boldfy.com.br
- Email: contato@boldfy.com.br
- LinkedIn: https://linkedin.com/company/boldfy-branding
- WhatsApp: +55 11 91368-8100
`;

  return new Response(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  });
}
