# Plano de Implementação — Status Atual e Próximos Passos

Legenda de status:
- ✅ Concluído
- ⌛ Em andamento / Backlog imediato

Painel de Status por Fase
- Fase 0 — Fundação: ✅
# (pular essa etapa) - Fase 1 — Persistência (Prisma + PostgreSQL): ⌛
- Fase 2 — UX Base e Navegação: ✅
- Fase 3 — Módulo Solar (Cálculo e Regras): ⌛
- Fase 4 — Propostas (MVP): ⌛
- Fase 5 — Treinamentos (MVP): ⌛
- Fase 6 — Diagramas (MVP): ⌛
- Fase 7 — Deploy (Coolify + Docker): ⌛
- Fase 8 — Qualidade e Segurança: ⌛

Resumo do que já foi entregue
- ✅ Projeto Next.js com TypeScript e App Router na pasta rebuild/, com Tailwind CSS configurado e layout base funcional.
- ✅ Rota de saúde do app em /api/health checando uptime/versão e conectividade condicional com DB: <mcfile name="route.ts" path="c:\\Users\\vinic\\OneDrive\\Documentos\\01 - Profissional\\08- Plataformas\\atualizacao nova energia plataforma\\solara-nova-energia\\rebuild\\src\\app\\api\\health\\route.ts"></mcfile>
- ✅ Navegação unificada via AppShell (Sidebar, Header, Breadcrumbs) com itens e ícones padronizados, incluindo estados de seleção e breadcrumbs por rota: <mcfile name="AppShell.tsx" path="c:\\Users\\vinic\\OneDrive\\Documentos\\01 - Profissional\\08- Plataformas\\atualizacao nova energia plataforma\\solara-nova-energia\\rebuild\\src\\app\\_components\\AppShell.tsx"></mcfile>
- ✅ Páginas base criadas/validadas para módulos: Dashboard (/), Leads, Solar, Proposals, Training, Diagrams, Playbooks, AQB, AQP, Wallbox e Admin (todas com placeholders consistentes).
- ✅ Alternância de tema (claro/escuro) com persistência em localStorage e aplicação via atributo data-theme no elemento html (toggle no Header, compatível com tokens definidos em globals.css).
- ✅ Prisma configurado com cliente singleton e schema inicial abrangendo entidades principais: <mcfile name="prisma.ts" path="c:\\Users\\vinic\\OneDrive\\Documentos\\01 - Profissional\\08- Plataformas\\atualizacao nova energia plataforma\\solara-nova-energia\\rebuild\\src\\lib\\prisma.ts"></mcfile>, <mcfile name="schema.prisma" path="c:\\Users\\vinic\\OneDrive\\Documentos\\01 - Profissional\\08- Plataformas\\atualizacao nova energia plataforma\\solara-nova-energia\\rebuild\\prisma\\schema.prisma"></mcfile>
- ✅ Scripts npm para Prisma e lifecycle do app (dev/build/start/lint/type-check/Prisma Studio): <mcfile name="package.json" path="c:\\Users\\vinic\\OneDrive\\Documentos\\01 - Profissional\\08- Plataformas\\atualizacao nova energia plataforma\\solara-nova-energia\\rebuild\\package.json"></mcfile>
- ✅ Dockerfile multi-stage preparado para build e runtime, com geração do Prisma Client em build: <mcfile name="Dockerfile" path="c:\\Users\\vinic\\OneDrive\\Documentos\\01 - Profissional\\08- Plataformas\\atualizacao nova energia plataforma\\solara-nova-energia\\rebuild\\Dockerfile"></mcfile>

Decisões técnicas consolidadas
- Framework: Next.js 14.2.13 com TypeScript e App Router.
- Node: 20 LTS (engines e Volta fixados em package.json).
- Gerenciador de pacotes: npm.
- Estilos: Tailwind CSS 4 e tokens/light–dark via data-theme em globals.
- Estrutura atual: src/app (rotas e layout), src/lib (utilitários/clients), src/server (esquemas/serviços) — aderente ao plano e evolutiva para src/core e src/modules quando iniciarmos regras de domínio mais densas.

Status detalhado por Fase

Fase 0 — Fundação (estrutura e ambiente) — ✅
- ✅ Projeto criado em rebuild/ com App Router + TS.
- ✅ Tailwind e tipografia/cores base aplicadas ao layout.
- ✅ Página inicial (Dashboard) e layout com Sidebar/Header/Breadcrumbs.
- ✅ Rota /api/health implementada e validada.

Fase 1 — Persistência (Prisma + PostgreSQL) — ⌛
- ✅ Prisma instalado e configurado; cliente singleton exposto em <mcfile name="prisma.ts" path="c:\\Users\\vinic\\OneDrive\\Documentos\\01 - Profissional\\08- Plataformas\\atualizacao nova energia plataforma\\solara-nova-energia\\rebuild\\src\\lib\\prisma.ts"></mcfile>.
- ✅ Schema abrangente inicial em <mcfile name="schema.prisma" path="c:\\Users\\vinic\\OneDrive\\Documentos\\01 - Profissional\\08- Plataformas\\atualizacao nova energia plataforma\\solara-nova-energia\\rebuild\\prisma\\schema.prisma"></mcfile> (Users, Leads, Proposals, Training, Catálogos de Solar e Tarifas, Roadmap).
- ✅ Scripts: db:generate, db:push, db:migrate, db:studio em <mcfile name="package.json" path="c:\\Users\\vinic\\OneDrive\\Documentos\\01 - Profissional\\08- Plataformas\\atualizacao nova energia plataforma\\solara-nova-energia\\rebuild\\package.json"></mcfile>.
- ⌛ Criar .env.example com DATABASE_URL (sem valores reais) e instruções mínimas.
- ⌛ Rodar migrações/local (ou db push) após configurar DATABASE_URL.
- ⌛ Ativar checagem de conexão real no /api/health em ambientes com DB (hoje condicional ao env).

Fase 2 — UX Base e Navegação — ✅
- ✅ Páginas mínimas com navegação e placeholders:
  - Dashboard (/), Leads, Solar, Proposals, Training, Diagrams, Playbooks, AQB, AQP, Wallbox e Admin.
- ✅ AppShell unificado: Sidebar com estados ativo/inativo, Breadcrumb por rota (inclui rota dinâmica de Leads), Header com ações (incl. toggle de tema).
- ✅ Tema claro/escuro: toggle no Header, persistência em localStorage e aplicação via data-theme (compatível com tokens em globals.css).
# (pular essa etapa) - ⌛ Ajustes finos de acessibilidade (foco/ARIA/contraste), QA responsivo e microinterações.

Fase 3 — Módulo Solar (Cálculo e Regras) — ⌛
- ⌛ Implementar CalculationService (src/core/services) com regras do PRD/Descritivo:
  - Fio B (Lei 14.300/2022 — transições 2023–2028 e 100% em 2029), compensação/créditos (60 meses, FIFO), tarifa (TUSD/TE, PIS/COFINS, ICMS, COSIP, disponibilidade), indicadores (VPL, TIR com Newton-Raphson + fallback, paybacks).
- ⌛ Testes mínimos e “resultados-espelho” para validação.

Fase 4 — Propostas (MVP) — ⌛
- ⌛ CRUD básico (listar/criar/editar rascunho) + exportação PDF inicial (placeholders).
- ⌛ Versionamento e status.

Fase 5 — Treinamentos (MVP) — ⌛
- ⌛ Listagem de módulos/conteúdos e marcação de progresso.
- ⌛ Player placeholder e certificado placeholder.

Fase 6 — Diagramas (MVP) — ⌛
- ⌛ Integração React Flow (canvas, paleta, salvar/abrir JSON no DB).

Fase 7 — Deploy Coolify e Docker — ⌛
- ✅ Dockerfile multi-stage e .dockerignore prontos.
- ⌛ Provisionar app no Coolify, configurar envs e pipeline de deploy.
- ⌛ Validar build e start (PORT=3000) no ambiente.

Fase 8 — Qualidade e Segurança — ⌛
- ⌛ Lint/Prettier e TS estritos em toda a base (parcial hoje; lint já configurado).
- ⌛ Testes (unitários/integração/E2E) para cálculos e APIs críticas.
- ⌛ Observabilidade inicial (logs estruturados) e checklist de segurança.

Próximos passos (priorizados)
1) Persistência (F1)
   - ⌛ Criar .env.example (DATABASE_URL, NODE_ENV, PORT) e documentação curta no topo do arquivo.
   - ⌛ Configurar DATABASE_URL local e executar db:generate/db:push ou db:migrate.
   - ⌛ Ajustar /api/health para refletir estado do DB (mensagens amigáveis e latência do ping).

2) UX/UI (F2)
   - ⌛ QA visual e responsivo das páginas base; revisar tokens de cor em dark mode para contraste AA.
   - ⌛ Melhorias de acessibilidade (foco visível, ARIA nos itens da Sidebar, ordem de tab, labels).

3) Solar (F3)
   - ⌛ Criar esqueleto de src/core/services/CalculationService e fixtures de validação.
   - ⌛ Definir tipos/dtos em src/core/types para entrada/saída dos cálculos.

4) Propostas (F4) e Treinamentos (F5)
   - ⌛ Definir rotas de API mínimas e modelos de UI para CRUD e progresso.

5) Deploy (F7)
   - ⌛ Configurar app no Coolify, variáveis de ambiente e primeiro deploy.

Referências
- Descritivo Técnico: <mcfile name="Descritivo Técnico Real e Atualizado - Solara Nova Energia.md" path="c:\\Users\\vinic\\OneDrive\\Documentos\\01 - Profissional\\08- Plataformas\\atualizacao nova energia plataforma\\solara-nova-energia\\rebuild\\Docs\\Descritivo Técnico Real e Atualizado - Solara Nova Energia.md"></mcfile>
- PRD: <mcfile name="Product Requirements Document (PRD) - Solara Nova Energia (Vibe Coding Edition) (1).md" path="c:\\Users\\vinic\\OneDrive\\Documentos\\01 - Profissional\\08- Plataformas\\atualizacao nova energia plataforma\\solara-nova-energia\\rebuild\\Docs\\Product Requirements Document (PRD) - Solara Nova Energia (Vibe Coding Edition) (1).md"></mcfile>
- Fluxo UX: <mcfile name="UX-FLOW.mmd" path="c:\\Users\\vinic\\OneDrive\\Documentos\\01 - Profissional\\08- Plataformas\\atualizacao nova energia plataforma\\solara-nova-energia\\rebuild\\Docs\\UX-FLOW.mmd"></mcfile>
        