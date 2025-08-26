# Plano de Implementação — Status Atual e Próximos Passos

Legenda de status:
- ✅ Concluído
- ⌛ Em andamento / Backlog imediato

Painel de Status por Fase
- Fase 1 — Base do Projeto: ✅
- Fase 2 — Backend, Autenticação e Storage: ⌛
- Fase 3 — CRM (Contatos e Oportunidades): ⌛
- Fase 4 — Módulo Fotovoltaico (Simulação): ⌛
- Fase 5 — Propostas (MVP): ⌛
- Fase 6 — Treinamentos (Parte 1 — Conteúdo): ⌛
- Fase 7 — Treinamentos (Parte 2 — Interatividade e Avaliação): ⌛
- Fase 8 — Módulos AQP, Wallbox e Roadmap: ⌛
- Fase 9 — Qualidade, Testes e Deploy: ⌛

Resumo do que já foi entregue
- ✅ Projeto Next.js com TypeScript e App Router na pasta rebuild/, com Tailwind CSS configurado e layout base funcional.
- ✅ Rota de saúde do app em /api/health checando uptime/versão e conectividade condicional com DB: <mcfile name="route.ts" path="c:\\Users\\vinic\\OneDrive\\Documentos\\01 - Profissional\\08- Plataformas\\atualizacao nova energia plataforma\\solara-nova-energia\\rebuild\\src\\app\\api\\health\\route.ts"></mcfile>
- ✅ Navegação unificada via AppShell (Sidebar, Header, Breadcrumbs) com itens e ícones padronizados, incluindo estados de seleção e breadcrumbs por rota: <mcfile name="AppShell.tsx" path="c:\\Users\\vinic\\OneDrive\\Documentos\\01 - Profissional\\08- Plataformas\\atualizacao nova energia plataforma\\solara-nova-energia\\rebuild\\src\\app\\_components\\AppShell.tsx"></mcfile>
- ✅ Páginas base criadas/validadas para módulos: Dashboard (/), Contatos (antes: Leads), Solar, Proposals, Training, Diagrams, Playbooks, AQB, AQP, Wallbox e Admin (todas com placeholders consistentes).
- ✅ Alternância de tema (claro/escuro) com persistência em localStorage e aplicação via atributo data-theme no elemento html (toggle no Header, compatível com tokens definidos em globals.css).
- ✅ Prisma configurado com cliente singleton e schema inicial abrangendo entidades principais: <mcfile name="prisma.ts" path="c:\\Users\\vinic\\OneDrive\\Documentos\\01 - Profissional\\08- Plataformas\\atualizacao nova energia plataforma\\solara-nova-energia\\rebuild\\src\\lib\\prisma.ts"></mcfile>, <mcfile name="schema.prisma" path="c:\\Users\\vinic\\OneDrive\\Documentos\\01 - Profissional\\08- Plataformas\\atualizacao nova energia plataforma\\solara-nova-energia\\rebuild\\prisma\\schema.prisma"></mcfile>
- ✅ Scripts npm para Prisma e lifecycle do app (dev/build/start/lint/type-check/Prisma Studio): <mcfile name="package.json" path="c:\\Users\\vinic\\OneDrive\\Documentos\\01 - Profissional\\08- Plataformas\\atualizacao nova energia plataforma\\solara-nova-energia\\rebuild\\package.json"></mcfile>
- ✅ Dockerfile multi-stage preparado para build e runtime, com geração do Prisma Client em build: <mcfile name="Dockerfile" path="c:\\Users\\vinic\\OneDrive\\Documentos\\01 - Profissional\\08- Plataformas\\atualizacao nova energia plataforma\\solara-nova-energia\\rebuild\\Dockerfile"></mcfile>
- ✅ .env.example ampliado com variáveis de Clerk e MinIO (placeholders): <mcfile name=".env.example" path="c:\\Users\\vinic\\OneDrive\\Documentos\\01 - Profissional\\08- Plataformas\\atualizacao nova energia plataforma\\solara-nova-energia\\rebuild\\.env.example"></mcfile>
- ✅ Mensagens públicas da API atualizadas para “contato” mantendo compatibilidade temporária com rotas /api/leads: <mcfile name="route.ts" path="c:\\Users\\vinic\\OneDrive\\Documentos\\01 - Profissional\\08- Plataformas\\atualizacao nova energia plataforma\\solara-nova-energia\\rebuild\\src\\app\\api\\leads\\route.ts"></mcfile>, <mcfile name="[id]\\route.ts" path="c:\\Users\\vinic\\OneDrive\\Documentos\\01 - Profissional\\08- Plataformas\\atualizacao nova energia plataforma\\solara-nova-energia\\rebuild\\src\\app\\api\\leads\\[id]\\route.ts"></mcfile>

Decisões técnicas consolidadas
- Framework: Next.js 15 com TypeScript e App Router.
- Node: 20 LTS (engines e Volta fixados em package.json).
- Gerenciador de pacotes: npm.
- Autenticação: Clerk (App Router; proteção de rotas e endpoints de API).
- Storage de arquivos: MinIO via SDK S3 com URLs assinadas (upload/download via rotas de API).
- Estado global: Zustand; Dados assíncronos: TanStack Query (React Query).
- Validação de schemas: Zod.
- Estilos: Tailwind CSS 4 e tokens/light–dark via data-theme em globals.
- Estrutura atual: src/app (rotas e layout), src/lib (utilitários/clients), src/server (esquemas/serviços) — aderente ao plano e evolutiva para src/core e src/modules quando iniciarmos regras de domínio mais densas.

Status detalhado por Fase

Fase 1 — Base do Projeto — ✅
- ✅ Projeto criado em rebuild/ com App Router + TS.
- ✅ Tailwind e tipografia/cores base aplicadas ao layout.
- ✅ Página inicial (Dashboard) e layout com Sidebar/Header/Breadcrumbs.
- ✅ Navegação base via AppShell (Sidebar, Header, Breadcrumbs) e tema claro/escuro.
- ✅ Rota /api/health implementada e validada (com latência do DB quando disponível).

Fase 2 — Backend, Autenticação e Storage — ⌛
- ✅ Prisma configurado (cliente singleton) e schema inicial abrangente (<mcfile name="prisma.ts" path="c:\\Users\\vinic\\OneDrive\\Documentos\\01 - Profissional\\08- Plataformas\\atualizacao nova energia plataforma\\solara-nova-energia\\rebuild\\src\\lib\\prisma.ts"></mcfile>, <mcfile name="schema.prisma" path="c:\\Users\\vinic\\OneDrive\\Documentos\\01 - Profissional\\08- Plataformas\\atualizacao nova energia plataforma\\solara-nova-energia\\rebuild\\prisma\\schema.prisma"></mcfile>).
- ✅ Scripts Prisma e .env.example prontos (<mcfile name="package.json" path="c:\\Users\\vinic\\OneDrive\\Documentos\\01 - Profissional\\08- Plataformas\\atualizacao nova energia plataforma\\solara-nova-energia\\rebuild\\package.json"></mcfile>).
- ✅ .env.example atualizado com Clerk/MinIO (placeholders) (<mcfile name=".env.example" path="c:\\Users\\vinic\\OneDrive\\Documentos\\01 - Profissional\\08- Plataformas\\atualizacao nova energia plataforma\\solara-nova-energia\\rebuild\\.env.example"></mcfile>).
- ⌛ Integrar Clerk (auth) no App Router (proteção de rotas/handlers, sincronização de usuários e papéis).
- ⌛ Configurar MinIO (SDK S3, URLs assinadas, rotas de upload/download) e variáveis em .env.
- ⌛ Executar migrações reais em ambiente de deploy quando DATABASE_URL estiver disponível.

Fase 3 — CRM (Contatos e Oportunidades) — ⌛
- ✅ Terminologia da UI e respostas públicas da API atualizada para “Contato” (rotas ainda em /leads temporariamente; migração completa pendente).
- ⌛ Unificar Client/Lead em Contato (modelo Contact) e introduzir Opportunity no schema (relacionado ao Contato).
- ⌛ Ajustar navegação/rotas: Lista de Contatos → Detalhe do Contato → Oportunidades do Contato → Propostas da Oportunidade.
- ⌛ CRUD mínimo de Contatos e Oportunidades (API + UI com placeholders) e filtros básicos.
- ⌛ Estratégia de migração: aproveitar dados atuais de Leads para Contatos (quando houver base).

Fase 4 — Módulo Fotovoltaico (Simulação) — ⌛
- ⌛ Implementar CalculationService (src/core/services) conforme PRD/Descritivo (Fio B, créditos 60m FIFO, tarifação, KPIs VPL/TIR/Paybacks).
- ⌛ Tipos/DTOs (src/core/types) e fixtures de validação; testes unitários mínimos.

Fase 5 — Propostas (MVP) — ⌛
- ⌛ CRUD básico (listar/criar/editar rascunho) + exportação PDF inicial (placeholders).
- ⌛ Geração de link seguro + tracking de visualizações.

Fase 6 — Treinamentos (Parte 1 — Conteúdo) — ⌛
- ⌛ CRUD de módulos e conteúdos; upload de vídeos para MinIO; leitor de playbooks.

Fase 7 — Treinamentos (Parte 2 — Interatividade e Avaliação) — ⌛
- ⌛ Editor de diagramas (MVP), avaliações, tracking de progresso e certificados.

Fase 8 — Módulos AQP, Wallbox e Roadmap — ⌛
- ⌛ Calculadora AQP, módulo Wallbox e CRUD/visualização do Roadmap.

Fase 9 — Qualidade, Testes e Deploy — ⌛
- ✅ Dockerfile multi-stage e .dockerignore prontos.
- ⌛ Otimizações de performance, lint/format/TS estritos, testes unitários/integração/E2E.
- ⌛ CI/CD (GitHub Actions) + deploy via Coolify; observabilidade (logs/erros).
- ⌛ Executar migrações em produção (Prisma) e validação de build/start no ambiente.

Próximos passos (priorizados)
1) F2 — Backend, Autenticação e Storage
   - ⌛ Integrar Clerk (proteção de rotas e handlers, sincronização de usuários/papéis).
   - ⌛ Configurar MinIO (SDK S3, URLs assinadas) e variáveis de ambiente; rotas de upload/download.
   - ⌛ QA de acessibilidade e responsividade contínuos.

2) F3 — CRM (Contatos e Oportunidades)
   - ⌛ Adicionar modelos Contact e Opportunity ao schema e rotas de API mínimas.
   - ⌛ UI: lista de Contatos, detalhe e Oportunidades associadas (placeholders funcionais).

3) F4 — Solar (Simulação)
   - ⌛ Criar esqueleto de src/core/services/CalculationService e fixtures de validação.
   - ⌛ Definir tipos/DTOs em src/core/types para entrada/saída dos cálculos.

4) F5/F6 — Propostas e Treinamentos
   - ⌛ Definir rotas de API mínimas e modelos de UI para CRUD e progresso.

5) F9 — Qualidade, Testes e Deploy
   - ⌛ Configurar CI/CD no GitHub Actions e provisionar no Coolify; executar migrações com DATABASE_URL do ambiente.

Referências
- Descritivo Técnico: <mcfile name="Descritivo Técnico Real e Atualizado - Solara Nova Energia.md" path="c:\\Users\\vinic\\OneDrive\\Documentos\\01 - Profissional\\08- Plataformas\\atualizacao nova energia plataforma\\solara-nova-energia\\rebuild\\Docs\\Descritivo Técnico Real e Atualizado - Solara Nova Energia.md"></mcfile>
- PRD: <mcfile name="Product Requirements Document (PRD) - Solara Nova Energia (Vibe Coding Edition) (1).md" path="c:\\Users\\vinic\\OneDrive\\Documentos\\01 - Profissional\\08- Plataformas\\atualizacao nova energia plataforma\\solara-nova-energia\\rebuild\\Docs\\Product Requirements Document (PRD) - Solara Nova Energia (Vibe Coding Edition) (1).md"></mcfile>
- Fluxo UX: <mcfile name="UX-FLOW.mmd" path="c:\\Users\\vinic\\OneDrive\\Documentos\\01 - Profissional\\08- Plataformas\\atualizacao nova energia plataforma\\solara-nova-energia\\rebuild\\Docs\\UX-FLOW.mmd"></mcfile>
        
Planejamento do Módulo Fotovoltaico (F4) — Sem executar
- Arquitetura e Tipos (src/core/types/solar.ts)
  - Input: consumo_mensal_kWh, tarifa_atual, classe/tipo (residencial/comercial), UF/distribuidora, bandeira tarifária, irradiação média, perdas (%), perfil horário opcional.
  - Catálogo: SolarModule, Inverter, TarifaConcessionaria (já no schema), com DTOs de leitura para o serviço.
  - Output: potência_recomendada_kWp, energia_gerada_kWh/ano, % compensação, economia R$/mês e R$/ano, VPL, TIR, paybacks.
- Serviço de Cálculo (src/core/services/CalculationService.ts)
  - Normalização de input (validações com Zod, defaults e sanitização).
  - Geração estimada (kWh) considerando irradiação, perdas e performance ratio.
  - Aplicação do Fio B (Lei 14.300/2022) com transições 2023–2028 e 100% a partir de 2029.
  - Compensação de créditos (validade 60 meses; FIFO) e saldo mês a mês.
  - Cálculo tarifário: TUSD + TE, PIS/COFINS, ICMS por faixa, COSIP por faixa, custo de disponibilidade.
  - Indicadores financeiros: VPL, TIR (Newton–Raphson com fallback), paybacks simples e descontado.
  - Sensibilidades: variação de tarifa e irradiação (+/− x%).
- Integração de Dados
  - Seeds mínimos de tarifas (TarifaConcessionaria) e catálogos de módulos/inversores para cenários de teste.
  - Serviço de tarifas por UF/distribuidora/tipo e vigência, com cache in-memory simples.
- Testes e Validação
  - Unitários por subrotina (compensação, Fio B, tarifação, finanças) com casos limite.
  - “Resultados-espelho” para cenários reais (fixtures) e teste de regressão.
  - Critérios de aceite: erro máximo tolerado (ex.: ±2% em kWh; ±1 p.p. em TIR), rastreabilidade de cada etapa do cálculo.
- UI mínima (src/app/solar)
  - Formulário wizard (2–3 etapas) para entrada de dados; loading states e validação.
  - Tabela/Resumo dos KPIs e gráfico simples de economia ao longo do tempo.
        