-- ===============================================================
-- Import do Folk → Boldfy CRM (gerado em 2026-05-16)
-- Match: email (Persons), LOWER(name) (Companies)
-- Folk vence em status. Outros campos preenchidos só se vazios.
-- ===============================================================

BEGIN;

-- ========== COMPANIES ==========
-- Company: Conversion
INSERT INTO companies (name, status_id, industry, size, website, description, first_touch_at)
VALUES ('Conversion',
  (SELECT id FROM statuses WHERE kind='company' AND label='Quero prospectar'),
  NULL,
  NULL,
  NULL,
  NULL,
  NOW())
ON CONFLICT ((LOWER(name))) DO UPDATE SET
  status_id = (SELECT id FROM statuses WHERE kind='company' AND label='Quero prospectar'),
  industry = COALESCE(companies.industry, EXCLUDED.industry),
  size = COALESCE(companies.size, EXCLUDED.size),
  website = COALESCE(companies.website, EXCLUDED.website),
  description = COALESCE(companies.description, EXCLUDED.description),
  updated_at = NOW();

-- Company: Hotmart
INSERT INTO companies (name, status_id, industry, size, website, description, first_touch_at)
VALUES ('Hotmart',
  (SELECT id FROM statuses WHERE kind='company' AND label='No status'),
  'Internet',
  '1001-5000',
  'https://www.linkedin.com/company/hotmart/',
  'criada em 2011 pelos empreendedores joão pedro resende e mateus bicalho, a hotmart nasceu como uma startup mineira que não parou no primeiro passo. seguiu avante, cresceu o time de troopers (é assim que chamamos nossos colaboradores e colaboradoras) e ganhou o mundo.   nos tornamos uma empresa global que tem paixão por transformar a vida de milhões de pessoas por meio da tecnologia e inovação. somos pioneiros e líderes da creator economy (economia dos criadores de conteúdo), possibilitando que milhares de pessoas vivam de suas paixões transformando sua audiência em clientes, habilidades em produtos, e influência em negócios.   construímos um ecossistema com mais de 580 mil produtos digitais e vendas para mais de 35 milhões de usuários, em 188 países. temos colaboradores em sete países, incluindo nossa sede nos países baixos, além de brasil, espanha, colômbia, méxico, estados unidos e frança.  em cada lugar, a  cultura hotmart é verdadeiramente única, pois cultivamos todas as nossas relações com liberdade, autonomia e love. esses são os três pilares que tornam nosso ambiente acolhedor, de relações sinceras e respeito à diversidade, em que todas as pessoas importam. não por acaso, estamos entre as melhores empresas tech do ranking gptw (great place to work), pelo 5º ano seguido.   se você tem paixão por transformar e quer fazer a diferença, vem desbravar novas oportunidades com a gente. aqui na hotmart, é a sua carreira em movimento, pois temos um time movido a desafios que vai te inspirar a evoluir sempre mais.',
  NOW())
ON CONFLICT ((LOWER(name))) DO UPDATE SET
  status_id = (SELECT id FROM statuses WHERE kind='company' AND label='No status'),
  industry = COALESCE(companies.industry, EXCLUDED.industry),
  size = COALESCE(companies.size, EXCLUDED.size),
  website = COALESCE(companies.website, EXCLUDED.website),
  description = COALESCE(companies.description, EXCLUDED.description),
  updated_at = NOW();

-- Company: IndiqAI
INSERT INTO companies (name, status_id, industry, size, website, description, first_touch_at)
VALUES ('IndiqAI',
  (SELECT id FROM statuses WHERE kind='company' AND label='No status'),
  'Internet',
  '1-10',
  'indiqai.ai',
  'indiqai stands at the forefront of technological innovation, blending artificial intelligence with intuitive software solutions to revolutionize how businesses communicate and collaborate.   at the heart of indiqai''s product line-up is ultimeet, a cutting-edge meeting and collaboration platform designed to cater to the modern enterprise''s need for secure, efficient, and intelligent communication. ultimeet distinguishes itself by offering features like automated minutes generation, real-time action items tracking, and advanced security protocols, including voice biometrics and on-premise deployment options. with a focus on enhancing productivity while safeguarding data privacy, indiqai is dedicated to empowering organizations to achieve their strategic objectives through smarter, more secure, and sustainable communication practices.',
  NOW())
ON CONFLICT ((LOWER(name))) DO UPDATE SET
  status_id = (SELECT id FROM statuses WHERE kind='company' AND label='No status'),
  industry = COALESCE(companies.industry, EXCLUDED.industry),
  size = COALESCE(companies.size, EXCLUDED.size),
  website = COALESCE(companies.website, EXCLUDED.website),
  description = COALESCE(companies.description, EXCLUDED.description),
  updated_at = NOW();

-- Company: Junior Achievement Brazil
INSERT INTO companies (name, status_id, industry, size, website, description, first_touch_at)
VALUES ('Junior Achievement Brazil',
  (SELECT id FROM statuses WHERE kind='company' AND label='Reunião marcada'),
  'Civic & Social Organization',
  '11-50',
  'https://www.linkedin.com/school/jabrasil/',
  'as one of the largest social organizations that encourage young people in the world, ja encourages and develops them for the job market. through the "learning-doing" method, pioneering financial education, preparation for the job market and entrepreneurship, we generate paths for employability and job creation.',
  NOW())
ON CONFLICT ((LOWER(name))) DO UPDATE SET
  status_id = (SELECT id FROM statuses WHERE kind='company' AND label='Reunião marcada'),
  industry = COALESCE(companies.industry, EXCLUDED.industry),
  size = COALESCE(companies.size, EXCLUDED.size),
  website = COALESCE(companies.website, EXCLUDED.website),
  description = COALESCE(companies.description, EXCLUDED.description),
  updated_at = NOW();

-- Company: MOTIM
INSERT INTO companies (name, status_id, industry, size, website, description, first_touch_at)
VALUES ('MOTIM',
  (SELECT id FROM statuses WHERE kind='company' AND label='No status'),
  'Public Relations and Communications',
  '51-200',
  'https://www.linkedin.com/company/motim-cc/',
  'somos especialistas em acelerar a reputação de empresas inovadoras para mostrarem do que são capazes para o mundo. assim, combinamos nossas técnicas de relações públicas, posicionamento de porta-vozes e conteúdo de marca para construir estrategicamente um plano para cada negócio. afirmamos sem medo que: reputação é a nova moeda!  fazemos 1 motim por marcas e causas que defendemos, mas isso não se faz sozinho. ele é feito junto, em equipe. temos um verdadeiro bando de profissionais únicos, com experiências múltiplas e propósitos alinhados prontos para enfrentar qualquer motim. esse é o nosso motime.',
  NOW())
ON CONFLICT ((LOWER(name))) DO UPDATE SET
  status_id = (SELECT id FROM statuses WHERE kind='company' AND label='No status'),
  industry = COALESCE(companies.industry, EXCLUDED.industry),
  size = COALESCE(companies.size, EXCLUDED.size),
  website = COALESCE(companies.website, EXCLUDED.website),
  description = COALESCE(companies.description, EXCLUDED.description),
  updated_at = NOW();

-- Company: Numen Investments Limited
INSERT INTO companies (name, status_id, industry, size, website, description, first_touch_at)
VALUES ('Numen Investments Limited',
  (SELECT id FROM statuses WHERE kind='company' AND label='No status'),
  'Information Technology and Services',
  '201-500',
  'facebook.com/numenit.solucoes',
  'numen is an international consultancy specialized in enterprise technologies. founded in 2009, we help organizations modernize their systems and processes, unlock the value of their data, reduce inefficiencies, and achieve measurable results. over the years, we have grown organically and consistently, expanding our presence to the united states and europe. today, we combine deep expertise with global diversity and strong alliances with leading technology partners such as sap, salesforce, aws, and celonis. guided by our pillars—discover, build, learn, and invent—we deliver end-to-end solutions that empower businesses to innovate and thrive. together, we drive transformation.',
  NOW())
ON CONFLICT ((LOWER(name))) DO UPDATE SET
  status_id = (SELECT id FROM statuses WHERE kind='company' AND label='No status'),
  industry = COALESCE(companies.industry, EXCLUDED.industry),
  size = COALESCE(companies.size, EXCLUDED.size),
  website = COALESCE(companies.website, EXCLUDED.website),
  description = COALESCE(companies.description, EXCLUDED.description),
  updated_at = NOW();

-- Company: Piperz
INSERT INTO companies (name, status_id, industry, size, website, description, first_touch_at)
VALUES ('Piperz',
  (SELECT id FROM statuses WHERE kind='company' AND label='Em andamento'),
  'Internet',
  '51-200',
  'https://www.linkedin.com/company/piperz/',
  'piperz is a b2b startup to facilitate the production of visual content to present properties, environments and varied spaces. at piperz we have available a  marketplace with different creatives which produce professional photos, videos, aerial drone images, 360/3d virtual tours and rendered images. piperz helps developers, real estate agencies, hotels, hospitals, universities, schools, museums optimize their channels and your presence on the web, increasing visit conversion rates and generating results through a modern and immersive experience.',
  NOW())
ON CONFLICT ((LOWER(name))) DO UPDATE SET
  status_id = (SELECT id FROM statuses WHERE kind='company' AND label='Em andamento'),
  industry = COALESCE(companies.industry, EXCLUDED.industry),
  size = COALESCE(companies.size, EXCLUDED.size),
  website = COALESCE(companies.website, EXCLUDED.website),
  description = COALESCE(companies.description, EXCLUDED.description),
  updated_at = NOW();

-- Company: Siteware
INSERT INTO companies (name, status_id, industry, size, website, description, first_touch_at)
VALUES ('Siteware',
  (SELECT id FROM statuses WHERE kind='company' AND label='No status'),
  'Computer Software',
  '51-200',
  'facebook.com/siteware',
  'simplify and make it happen.  in the market for 15 years, siteware is considered reference in cpm (corporate performance management). its products are used by over 40 thousand managers in both national and international companies. development efforts target product usability, since siteware strongly believes a system’s acceptance is related to how easy it is to use and how much it fits into employees’ workflow.  get to know our solutions at www.siteware.co/en/',
  NOW())
ON CONFLICT ((LOWER(name))) DO UPDATE SET
  status_id = (SELECT id FROM statuses WHERE kind='company' AND label='No status'),
  industry = COALESCE(companies.industry, EXCLUDED.industry),
  size = COALESCE(companies.size, EXCLUDED.size),
  website = COALESCE(companies.website, EXCLUDED.website),
  description = COALESCE(companies.description, EXCLUDED.description),
  updated_at = NOW();

-- Company: Vexia
INSERT INTO companies (name, status_id, industry, size, website, description, first_touch_at)
VALUES ('Vexia',
  (SELECT id FROM statuses WHERE kind='company' AND label='Reunião marcada'),
  'Information Technology and Services',
  '201-500',
  'https://www.linkedin.com/company/vexiasolutions/',
  'nós somos a vexia!  atuamos com transformação, inovação e excelência.  nossa missão é simplificar processos vitais das empresas, focando no sucesso do cliente. potencializando valor aos acionistas, colaboradores, parceiros, sociedade e meio ambiente.  somos especialistas em processos vitais com foco no seu negócio. entre em contato para podermos te apoiar em suas necessidades!',
  NOW())
ON CONFLICT ((LOWER(name))) DO UPDATE SET
  status_id = (SELECT id FROM statuses WHERE kind='company' AND label='Reunião marcada'),
  industry = COALESCE(companies.industry, EXCLUDED.industry),
  size = COALESCE(companies.size, EXCLUDED.size),
  website = COALESCE(companies.website, EXCLUDED.website),
  description = COALESCE(companies.description, EXCLUDED.description),
  updated_at = NOW();

-- ========== PERSONS ==========
-- Person: Fernanda Silva (fernanda.silva@sermaisdigital.com.br) → Reunião marcada
UPDATE people SET
  status_id = (SELECT id FROM statuses WHERE kind='person' AND label='Reunião marcada'),
  job_title = COALESCE(NULLIF(people.job_title, ''), 'Marketing'),
  phone = COALESCE(NULLIF(people.phone, ''), '11985647227'),
  linkedin_url = COALESCE(NULLIF(people.linkedin_url, ''), 'https://www.linkedin.com/in/fernandacssilva'),
  description = COALESCE(NULLIF(people.description, ''), 'Olá! Eu sou a Fernanda Silva, mãe do Joaquim, esposa do Fabricio e uma apaixonada por viajar e desbravar o mundo. Sou jornalista e estrategista de comunicação com mais de uma década de experiência ajudando empresas e profissionais a construírem marcas mais relevantes.  Ao longo da minha trajetória, passei por diferentes lados da comunicação: redação jornalística, assessoria de imprensa, eventos, marketing de influência e comunicação corporativa.  Essas experiências me mostraram algo muito claro: Pessoas empreendedoras e empresárias não precisam virar influenciadores para construir uma marca forte.  O que eles precisam é de posicionamento claro, narrativa estratégica e uma comunicação consistente. Hoje ajudo empreendedoras e empresas a desenvolverem seu posicionamento, uma comunicação estratégica e presença digital alinhada aos seus objetivos de negócio.  Se esses temas também fazem parte do seu universo (ou precisam fazer e você não sabe por onde começar), me mande uma mensagem por aqui. Vamos conversar! ;)'),
  metadata = COALESCE(people.metadata, '{}'::jsonb) || '{"folk_channel":"linkedin"}'::jsonb,
  updated_at = NOW(),
  company_id = COALESCE(people.company_id, (SELECT id FROM companies WHERE LOWER(name) = LOWER('Ser Mais Digital')))
WHERE LOWER(email) = LOWER('fernanda.silva@sermaisdigital.com.br');

-- Person: João Pedro Caixeta Marinho (joao@piperz.io) → Fechado
UPDATE people SET
  status_id = (SELECT id FROM statuses WHERE kind='person' AND label='Fechado'),
  job_title = COALESCE(NULLIF(people.job_title, ''), 'Head de Projetos'),
  phone = COALESCE(NULLIF(people.phone, ''), '61998922301'),
  linkedin_url = COALESCE(NULLIF(people.linkedin_url, ''), 'https://www.linkedin.com/in/jpcaixeta'),
  description = COALESCE(NULLIF(people.description, ''), '📊 My story has always started where most people give up: in operational chaos.  It''s been +4 years building results in Operations and Business Development for the B2B market, working on the front line to transform messy processes into scalable operations.  +45 high-impact deliveries, 9 teams led, 12 projects scaled in different sectors.  If it were a graph, my curve would be: Disorder → Processes → Scalability.  I''m where strategy, execution and people leadership meet.  📌 Results delivered: ✅ I restructured the commercial operation of a B2B company and increased monthly turnover by 72% in 4 months. ✅ Transformed an unproductive sector into a high-performance area, reducing turnover by 35% and increasing productivity by 60%. Implemented process improvements and eliminated bottlenecks, reducing customer service time from 18 to 6 hours.  I modeled and led operations squads, achieving an NPS of 91 in 3 months. Structured, trained and led operations and business teams that scaled +300% on an active basis in less than a year. ✅ I modeled and automated flows that saved +1,200 operational hours/year.  📌 How I do it: ✅ With close leadership and a culture of real ownership. ✅ With data analysis, people management and continuous improvement. ✅ With tools like ClickUp, various CRMs, Notion and Apollo.io. ✅ With practical experience in operations management, business development, process improvement, commercial planning and team leadership.  🌎 I speak English, Spanish and understand French too.  🎓 I have a degree in Psychology, with a focus on Business Management and advanced courses in Team Leadership, Project Management, Business Process Management, Customer Success and Product Management.  A few words that define me behind the scenes: Operations Management - Process Improvement - Business Development - People Leadership - B2B.  💬 If you need someone who turns complex problems into scalable solutions and leads delivery, hit me up in the inbox.'),
  metadata = COALESCE(people.metadata, '{}'::jsonb) || '{"folk_channel":"linkedin"}'::jsonb,
  updated_at = NOW(),
  company_id = COALESCE(people.company_id, (SELECT id FROM companies WHERE LOWER(name) = LOWER('Piperz')))
WHERE LOWER(email) = LOWER('joao@piperz.io');

-- Person: Rafael Coelho (orafaelcoelho@gmail.com) → Reunião marcada
UPDATE people SET
  status_id = (SELECT id FROM statuses WHERE kind='person' AND label='Reunião marcada'),
  job_title = COALESCE(NULLIF(people.job_title, ''), 'Gerente de Comunicação e Marketing'),
  phone = COALESCE(NULLIF(people.phone, ''), '21 98780-8842'),
  linkedin_url = COALESCE(NULLIF(people.linkedin_url, ''), 'https://www.linkedin.com/in/orafaelcoelho'),
  description = COALESCE(NULLIF(people.description, ''), 'Sou um jornalista com mais de 15 anos de experiência, com trajetória em empresas como Grupo Globo, Klabin, PSafe, Contax e Ampla. Meu propósito de vida e carreira é unir estratégia, criatividade e boas histórias para gerar impacto relevante e conectar marcas, pessoas e causas.  Atualmente, sou gerente de Comunicação e Marketing na JA Brasil, parte da rede global Junior Achievement- uma das organizações mais relevantes do mundo, fundada em 1919 e indicada ao Prêmio Nobel da Paz.'),
  metadata = COALESCE(people.metadata, '{}'::jsonb) || '{"folk_channel":"linkedin"}'::jsonb,
  updated_at = NOW(),
  company_id = COALESCE(people.company_id, (SELECT id FROM companies WHERE LOWER(name) = LOWER('Junior Achievement Brazil,Junior Achievement Brasil')))
WHERE LOWER(email) = LOWER('orafaelcoelho@gmail.com');

-- Person: Lucas Buarque (buarquelucas@icloud.com) → Ativo
UPDATE people SET
  status_id = (SELECT id FROM statuses WHERE kind='person' AND label='Ativo'),
  metadata = COALESCE(people.metadata, '{}'::jsonb) || '{"folk_channel":"linkedin"}'::jsonb,
  updated_at = NOW(),
  company_id = COALESCE(people.company_id, (SELECT id FROM companies WHERE LOWER(name) = LOWER('IndiqAI')))
WHERE LOWER(email) = LOWER('buarquelucas@icloud.com');

-- Person: Paulo (paulo@sollaric.com.br) → Ativo
UPDATE people SET
  status_id = (SELECT id FROM statuses WHERE kind='person' AND label='Ativo'),
  metadata = COALESCE(people.metadata, '{}'::jsonb) || '{"folk_channel":"linkedin"}'::jsonb,
  updated_at = NOW(),
  company_id = COALESCE(people.company_id, (SELECT id FROM companies WHERE LOWER(name) = LOWER('Sollaric')))
WHERE LOWER(email) = LOWER('paulo@sollaric.com.br');

-- Person: Beatriz Azul (serra.azul@outlook.com) → Em andamento
UPDATE people SET
  status_id = (SELECT id FROM statuses WHERE kind='person' AND label='Em andamento'),
  job_title = COALESCE(NULLIF(people.job_title, ''), 'Diretora de Marketing & Encantamento'),
  linkedin_url = COALESCE(NULLIF(people.linkedin_url, ''), 'https://www.linkedin.com/in/beatriz-serra-azul'),
  description = COALESCE(NULLIF(people.description, ''), 'Acredito que o crescimento real de um negócio não nasce do esforço bruto. Ele nasce da estrutura.Ao longo da minha carreira, entendi que a verdadeira inovação acontece na interseção: entre dados sólidos e intuição humana, entre processos eficientes e a capacidade genuína de encantar quem está do outro lado.Hoje, vivo essa visão na prática como Diretora de Marketing e Encantamento na VexIA. Minha missão vai muito além de gerar demanda. Atuo construindo a governança estratégica do marketing e liderando no centro de uma transformação profunda — incluindo a orquestração e lançamento de novas soluções de inteligência artificial que estão redefinindo o nosso mercado.Em paralelo, vivo a intensidade de construir do zero como fundadora da amanava. É o espaço onde transformo minha visão de mundo em um negócio próprio, provando que é possível criar caminhos que tenham propósito, inovação e rentabilidade na mesma frase.Minha bagagem foi forjada em contextos de transformação. De passagens por empresas como Johnson &amp; Johnson, Kenvue e Natura à cofundação da Find4U (focada em Growth, automação comercial e prospecção), sempre atuei conectando estratégia de produto, inteligência de mercado e RevOps.Sou formada pela UFABC, com especializações em Growth Hacking, Inovação e Design Thinking (CSUN e Tera), e atualmente curso um MBA em IA e Dados para Negócios pelo Inteli. Em 2026, obtive a primeira certificação brasileira em Gestão de IA reconhecida pelo MEC, em conformidade com a ISO 42001 — reforçando minha atuação na construção de negócios orientados por dados, governança e inteligência artificial.Onde eu gero maior impacto: • Governança de Marketing e Estruturação de RevOps para escala; • Transformação Digital e Tomada de Decisão orientada a Dados (Analytics); • Liderança em Inovação, Produto e Lançamentos no setor de Tecnologia/IA; • Experiência do Usuário (Encantamento) conectada à estratégia de receita.O marketing não é apenas a vitrine do negócio. É a espinha dorsal que conec'),
  metadata = COALESCE(people.metadata, '{}'::jsonb) || '{"folk_channel":"linkedin"}'::jsonb,
  updated_at = NOW(),
  company_id = COALESCE(people.company_id, (SELECT id FROM companies WHERE LOWER(name) = LOWER('Vexia')))
WHERE LOWER(email) = LOWER('serra.azul@outlook.com');

-- Person: clara ramos miranda (clara@boldfy.com.br) → Ativo
UPDATE people SET
  status_id = (SELECT id FROM statuses WHERE kind='person' AND label='Ativo'),
  job_title = COALESCE(NULLIF(people.job_title, ''), 'CEO'),
  updated_at = NOW(),
  company_id = COALESCE(people.company_id, (SELECT id FROM companies WHERE LOWER(name) = LOWER('boldfy')))
WHERE LOWER(email) = LOWER('clara@boldfy.com.br');

-- Person: Larissa Akamine (larissa.akamine@hotmail.com) → Quente
UPDATE people SET
  status_id = (SELECT id FROM statuses WHERE kind='person' AND label='Quente'),
  job_title = COALESCE(NULLIF(people.job_title, ''), 'Analista de Employer Branding Sênior'),
  linkedin_url = COALESCE(NULLIF(people.linkedin_url, ''), 'https://www.linkedin.com/in/larissa-akamine'),
  description = COALESCE(NULLIF(people.description, ''), 'Ao longo da minha carreira, atuei nas áreas de Vendas, Marketing e Recursos Humanos, sempre com foco no uso estratégico dos canais de comunicação com clientes, candidatos e colaboradores. Gerenciar a marca corporativa significa manter vivo o propósito da organização, além de engajar todos que se conectam com ela.  Acredito no poder de criar experiências memoráveis ​​entre marcas e pessoas, trabalhando a reputação da empresa com alcance, frequência e consistência. Todos nos identificamos com histórias, minha missão é usar todos os recursos e técnicas da Comunicação para criar um storytelling de forma criativa, humana e transparente.'),
  metadata = COALESCE(people.metadata, '{}'::jsonb) || '{"folk_channel":"linkedin"}'::jsonb,
  updated_at = NOW(),
  company_id = COALESCE(people.company_id, (SELECT id FROM companies WHERE LOWER(name) = LOWER('Hotmart')))
WHERE LOWER(email) = LOWER('larissa.akamine@hotmail.com');

-- Person: georgia (georgia.rovaris@starian.com) → Ativo
UPDATE people SET
  status_id = (SELECT id FROM statuses WHERE kind='person' AND label='Ativo'),
  updated_at = NOW(),
  company_id = COALESCE(people.company_id, (SELECT id FROM companies WHERE LOWER(name) = LOWER('Starian')))
WHERE LOWER(email) = LOWER('georgia.rovaris@starian.com');

-- Person: Paulo santos (paulosantos.valinhos@gmail.com) → Ativo
UPDATE people SET
  status_id = (SELECT id FROM statuses WHERE kind='person' AND label='Ativo'),
  updated_at = NOW(),
  company_id = COALESCE(people.company_id, (SELECT id FROM companies WHERE LOWER(name) = LOWER('pauloleads.com.br')))
WHERE LOWER(email) = LOWER('paulosantos.valinhos@gmail.com');

-- Person: JOSE HERCULANO (jherculanosantos@hotmail.com) → Ativo
UPDATE people SET
  status_id = (SELECT id FROM statuses WHERE kind='person' AND label='Ativo'),
  metadata = COALESCE(people.metadata, '{}'::jsonb) || '{"folk_channel":"linkedin"}'::jsonb,
  updated_at = NOW(),
  company_id = COALESCE(people.company_id, (SELECT id FROM companies WHERE LOWER(name) = LOWER('JH Consultoria')))
WHERE LOWER(email) = LOWER('jherculanosantos@hotmail.com');

-- Person: Gabrielly (gabriellymoretti@gmail.com) → Ativo
UPDATE people SET
  status_id = (SELECT id FROM statuses WHERE kind='person' AND label='Ativo'),
  updated_at = NOW(),
  company_id = COALESCE(people.company_id, (SELECT id FROM companies WHERE LOWER(name) = LOWER('Altice Labs')))
WHERE LOWER(email) = LOWER('gabriellymoretti@gmail.com');

-- Person: Mayra Oliveira (mayra.oliveira@tibox.com.br) → Ativo
UPDATE people SET
  status_id = (SELECT id FROM statuses WHERE kind='person' AND label='Ativo'),
  metadata = COALESCE(people.metadata, '{}'::jsonb) || '{"folk_channel":"linkedin"}'::jsonb,
  updated_at = NOW(),
  company_id = COALESCE(people.company_id, (SELECT id FROM companies WHERE LOWER(name) = LOWER('Tibox Innovations,Tibox')))
WHERE LOWER(email) = LOWER('mayra.oliveira@tibox.com.br');

-- Person: Beatrix Valiceli (beatrix.valiceli@numenit.com) → Ativo
UPDATE people SET
  status_id = (SELECT id FROM statuses WHERE kind='person' AND label='Ativo'),
  metadata = COALESCE(people.metadata, '{}'::jsonb) || '{"folk_channel":"linkedin"}'::jsonb,
  updated_at = NOW(),
  company_id = COALESCE(people.company_id, (SELECT id FROM companies WHERE LOWER(name) = LOWER('Numen Investments Limited,Numen')))
WHERE LOWER(email) = LOWER('beatrix.valiceli@numenit.com');

-- Person: Maria (marianaduarte.jobie@gmail.com) → Ativo
UPDATE people SET
  status_id = (SELECT id FROM statuses WHERE kind='person' AND label='Ativo'),
  metadata = COALESCE(people.metadata, '{}'::jsonb) || '{"folk_channel":"linkedin"}'::jsonb,
  updated_at = NOW(),
  company_id = COALESCE(people.company_id, (SELECT id FROM companies WHERE LOWER(name) = LOWER('Applica')))
WHERE LOWER(email) = LOWER('marianaduarte.jobie@gmail.com');

-- Person: Mauro (mauro@ozia.io) → Ativo
UPDATE people SET
  status_id = (SELECT id FROM statuses WHERE kind='person' AND label='Ativo'),
  metadata = COALESCE(people.metadata, '{}'::jsonb) || '{"folk_channel":"linkedin"}'::jsonb,
  updated_at = NOW(),
  company_id = COALESCE(people.company_id, (SELECT id FROM companies WHERE LOWER(name) = LOWER('Ozia')))
WHERE LOWER(email) = LOWER('mauro@ozia.io');

-- Person: Aline (aline.mello@siteware.com.br) → Ativo
UPDATE people SET
  status_id = (SELECT id FROM statuses WHERE kind='person' AND label='Ativo'),
  metadata = COALESCE(people.metadata, '{}'::jsonb) || '{"folk_channel":"linkedin"}'::jsonb,
  updated_at = NOW(),
  company_id = COALESCE(people.company_id, (SELECT id FROM companies WHERE LOWER(name) = LOWER('Siteware')))
WHERE LOWER(email) = LOWER('aline.mello@siteware.com.br');

-- Person: Gustavo Março (gustavo.marco@teiasservice.com.br) → Ativo
UPDATE people SET
  status_id = (SELECT id FROM statuses WHERE kind='person' AND label='Ativo'),
  metadata = COALESCE(people.metadata, '{}'::jsonb) || '{"folk_channel":"linkedin"}'::jsonb,
  updated_at = NOW(),
  company_id = COALESCE(people.company_id, (SELECT id FROM companies WHERE LOWER(name) = LOWER('TEIAS Service')))
WHERE LOWER(email) = LOWER('gustavo.marco@teiasservice.com.br');

-- Person: Eduardo Fleury (eduardo.fleury@bushatsky.com.br) → Ativo
UPDATE people SET
  status_id = (SELECT id FROM statuses WHERE kind='person' AND label='Ativo'),
  metadata = COALESCE(people.metadata, '{}'::jsonb) || '{"folk_channel":"linkedin"}'::jsonb,
  updated_at = NOW(),
  company_id = COALESCE(people.company_id, (SELECT id FROM companies WHERE LOWER(name) = LOWER('Bushatsky Advogados')))
WHERE LOWER(email) = LOWER('eduardo.fleury@bushatsky.com.br');

-- Person: Waldo Lima (waldo@goalfy.com.br) → Ativo
UPDATE people SET
  status_id = (SELECT id FROM statuses WHERE kind='person' AND label='Ativo'),
  metadata = COALESCE(people.metadata, '{}'::jsonb) || '{"folk_channel":"linkedin"}'::jsonb,
  updated_at = NOW(),
  company_id = COALESCE(people.company_id, (SELECT id FROM companies WHERE LOWER(name) = LOWER('tecnologia')))
WHERE LOWER(email) = LOWER('waldo@goalfy.com.br');

-- Person: Ana Feliciano (anafeliciano.rp@gmail.com) → Quente
UPDATE people SET
  status_id = (SELECT id FROM statuses WHERE kind='person' AND label='Quente'),
  job_title = COALESCE(NULLIF(people.job_title, ''), 'People Lead'),
  linkedin_url = COALESCE(NULLIF(people.linkedin_url, ''), 'https://www.linkedin.com/in/anacarolinafeliciano'),
  description = COALESCE(NULLIF(people.description, ''), 'Graduated in Public Relations and holding an MBA in Strategic People Management, I am currently People Lead at MOTIM with over 10 years of experience in technology companies, navigating dynamic and fast-growing environments. I specialize in organizational design, performance, and building HR functions from the ground up, driving cultural alignment, operational efficiency, and strategic impact.  I support founders and leaders at all levels (junior, senior, and technical) in people-related decision-making and leadership development. As a certified facilitator for the #IAmRemarkable initiative, I host workshops that empower individuals to celebrate their achievements and challenge societal perceptions.  My approach blends data-driven insights with conscious, authentic, and transformative interactions, anchored in the belief that people thrive where business success, well-being, and career growth go hand in hand.'),
  metadata = COALESCE(people.metadata, '{}'::jsonb) || '{"folk_channel":"linkedin"}'::jsonb,
  updated_at = NOW(),
  company_id = COALESCE(people.company_id, (SELECT id FROM companies WHERE LOWER(name) = LOWER('MOTIM')))
WHERE LOWER(email) = LOWER('anafeliciano.rp@gmail.com');

-- Person: Francielly (franciellycunha11@gmail.com) → Ativo
UPDATE people SET
  status_id = (SELECT id FROM statuses WHERE kind='person' AND label='Ativo'),
  metadata = COALESCE(people.metadata, '{}'::jsonb) || '{"folk_channel":"linkedin"}'::jsonb,
  updated_at = NOW(),
  company_id = COALESCE(people.company_id, (SELECT id FROM companies WHERE LOWER(name) = LOWER('Claro Brasil')))
WHERE LOWER(email) = LOWER('franciellycunha11@gmail.com');

COMMIT;

-- Após executar, recarrega o CRM. Os dados estarão atualizados.