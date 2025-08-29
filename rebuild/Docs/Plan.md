# Plano de Implementação — Status Atual e Próximos Passos

Legenda de status:
- ✅ Concluído
- ⌛ Em andamento / Backlog imediato

Organização
- Este arquivo controla o plano por fases, próximos passos e o status das tasks (✅/⌛).
- O resumo do que já foi feito e as tasks deixadas para depois estão concentrados em: <mcfile name="backlog.md" path="c:\\Users\\vinic\\OneDrive\\Documentos\\01 - Profissional\\08- Plataformas\\atualizacao nova energia plataforma\\solara-nova-energia\\rebuild\\Docs\\backlog.md"></mcfile>.

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
- Conteúdo movido para: <mcfile name="backlog.md" path="c:\\Users\\vinic\\OneDrive\\Documentos\\01 - Profissional\\08- Plataformas\\atualizacao nova energia plataforma\\solara-nova-energia\\rebuild\\Docs\\backlog.md"></mcfile>

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
- Handlers (Next 15): usar NextRequest e context.params como Promise em rotas dinâmicas [id]; acessar id via await context.params; padronizar autenticação com await auth() e resposta 401 quando não autenticado (ativado por flag NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY).

Status detalhado por Fase

Fase 1 — Base do Projeto — ✅
- ✅ Projeto criado em rebuild/ com App Router + TS.
- ✅ Tailwind e tipografia/cores base aplicadas ao layout.
- ✅ Página inicial (Dashboard) e layout com Sidebar/Header/Breadcrumbs.
- ✅ Navegação base via AppShell (Sidebar, Header, Breadcrumbs) e tema claro/escuro.
- ✅ Rota /api/health implementada e validada (com latência do DB quando disponível).
- ✅ Sidebar reorganizada por grupos (Início, Comercial, Projetos, Treinamentos), com seção de Configurações fixa no rodapé; ordem de destaque: Fotovoltaico > Treinamentos > Projetos > demais itens.

Confirmação da Solicitação — Organização e Módulo Fotovoltaico
- Organização das abas em grupos: ✅ Implementado no componente <mcfile name="AppShell.tsx" path="c:\\Users\\vinic\\OneDrive\\Documentos\\01 - Profissional\\08- Plataformas\\atualizacao nova energia plataforma\\solara-nova-energia\\rebuild\\src\\app\\_components\\AppShell.tsx"></mcfile> (grupos Início, Comercial, Projetos, Treinamentos) e seção de Configurações fixa no rodapé. A prioridade dentro de Projetos posiciona Fotovoltaico no topo.
- Módulo Fotovoltaico — status por subitens requisitados:
  1.1 Informações do Lead: ⌛ Não implementado o fluxo de seleção de lead com autopreenchimento de endereço (rua, número, complemento, CEP), CPF e telefone; atualmente existem apenas campos básicos (Nome, Email, Telefone, Tipo) em <mcfile name="page.tsx" path="c:\\Users\\vinic\\OneDrive\\Documentos\\01 - Profissional\\08- Plataformas\\atualizacao nova energia plataforma\\solara-nova-energia\\rebuild\\src\\app\\solar\\page.tsx"></mcfile>.
  1.2 Simulação: ⌛ Parcial — existem abas para Módulos, Inversores e Baterias, com seleção/quantidades e parâmetros técnicos básicos e cálculos simplificados na própria página <mcfile name="page.tsx" path="c:\\Users\\vinic\\OneDrive\\Documentos\\01 - Profissional\\08- Plataformas\\atualizacao nova energia plataforma\\solara-nova-energia\\rebuild\\src\\app\\solar\\page.tsx"></mcfile>. Botão “Gerenciar” para edição de catálogos (módulos/inversores/baterias) ainda não existe. A opção “Aumentar Consumo” está parcial — há consumo extra numérico e uma seção placeholder “Consumo de Equipamentos Extras” em <mcfile name="EquipmentConsumption.tsx" path="c:\\Users\\vinic\\OneDrive\\Documentos\\01 - Profissional\\08- Plataformas\\atualizacao nova energia plataforma\\solara-nova-energia\\rebuild\\src\\app\\solar\\components\\EquipmentConsumption.tsx"></mcfile> (a UI de adicionar equipamentos com uso diário/mensal/anual ainda será implementada).
  1.3 Orçamento: ⌛ Não implementado — não há etapa dedicada a seleção/gerenciamento de kits, cálculo por BDI/markup nem aplicação de margem de desconto.
  1.4 Proposta: ⌛ Parcial — já há Pré-visualização e Exportar PDF (A4) na aba Propostas, com regras @media print em <mcfile name="globals.css" path="c:\\Users\\vinic\\OneDrive\\Documentos\\01 - Profissional\\08- Plataformas\\atualizacao nova energia plataforma\\solara-nova-energia\\rebuild\\src\\app\\globals.css"></mcfile>. Link rastreável (com data/hora/IP) e formato 16:9 ainda não foram implementados.

Fase 2 — Backend, Autenticação e Storage — ⌛
- ✅ Prisma configurado (cliente singleton) e schema inicial abrangente (<mcfile name="prisma.ts" path="c:\\Users\\vinic\\OneDrive\\Documentos\\01 - Profissional\\08- Plataformas\\atualizacao nova energia plataforma\\solara-nova-energia\\rebuild\\src\\lib\\prisma.ts"></mcfile>, <mcfile name="schema.prisma" path="c:\\Users\\vinic\\OneDrive\\Documentos\\01 - Profissional\\08- Plataformas\\atualizacao nova energia plataforma\\solara-nova-energia\\rebuild\\prisma\\schema.prisma"></mcfile>).
- ✅ Scripts Prisma e .env.example prontos (<mcfile name="package.json" path="c:\\Users\\vinic\\OneDrive\\Documentos\\01 - Profissional\\08- Plataformas\\atualizacao nova energia plataforma\\solara-nova-energia\\rebuild\\package.json"></mcfile>).
- ✅ .env.example atualizado com Clerk/MinIO (placeholders) (<mcfile name=".env.example" path="c:\\Users\\vinic\\OneDrive\\Documentos\\01 - Profissional\\08- Plataformas\\atualizacao nova energia plataforma\\solara-nova-energia\\rebuild\\.env.example"></mcfile>).
- ✅ Opção B — UX do Uploader: arrastar-e-soltar, múltiplos arquivos e barra de progresso implementados no componente <mcfile name="FileUploader.tsx" path="c:\\Users\\vinic\\OneDrive\\Documentos\\01 - Profissional\\08- Plataformas\\atualizacao nova energia plataforma\\solara-nova-energia\\rebuild\\src\\app\\_components\\FileUploader.tsx"></mcfile>.
- ✅ TypeScript: verificação de tipos sem erros (tsc --noEmit OK) e ESLint sem warnings.
- ✅ Autenticação: correções com Clerk (uso de await auth()) e compatibilização das rotas dinâmicas com Next 15 (assinaturas dos handlers conforme padrão).
- ⌛ Integrar Clerk (auth) no App Router (proteção de rotas/handlers, sincronização de usuários e papéis).
- ⌛ Configurar MinIO (SDK S3, URLs assinadas, rotas de upload/download) e variáveis em .env.
- ⌛ Executar migrações reais em ambiente de deploy quando DATABASE_URL estiver disponível.

Fase 3 — CRM (Contatos e Oportunidades) — ⌛
- ✅ Modelos Contact e Opportunity presentes no schema e serviços (prisma/services) e rotas de API básicas para ambas as entidades.
- ✅ Terminologia da UI e respostas públicas da API atualizadas para “Contato”, com migração efetiva da navegação para /contacts e redirects server-side de /leads → /contacts (parâmetros preservados).
- ✅ Unificação de Leads → Contatos na UI: navegação e breadcrumbs apontando para /contacts; redirects server-side ativos para /leads, /leads/new e /leads/[id]; busca (q) concluída.
- ⌛ Ajustar navegação/rotas: Lista de Contatos → Detalhe do Contato → Oportunidades do Contato → Propostas da Oportunidade. Estado atual: Contatos ↔ Oportunidades OK; Propostas pendente.
- ✅ UI: lista e detalhe de Contatos operacionais; seção de Oportunidades com criação inline e recarga automática — filtro por status, paginação e busca (q) implementados. Na lista de Oportunidades, coluna "Responsável" adicionada e busca (q) habilitada.
- ⌛ Estratégia de migração: aproveitar dados atuais de Leads para Contatos (quando houver base).

Subtarefas detalhadas — F3 (próximo ciclo)
- ⌛ Páginas nativas em /contacts:
  - ✅ Lista de Contatos com paginação, filtro por status e busca (q) implementados (UI + API + service).
  - ✅ Detalhe do Contato com dados básicos e seção de Oportunidades do Contato (criação inline + recarga automática da lista).
- ⌛ Páginas nativas em /opportunities:
  - ✅ Lista de Oportunidades com coluna "Responsável", filtro por status, paginação e busca (q) implementados (UI + API + service).
- ⌛ Componentes reutilizáveis:
  - ⌛ ContactList, ContactFilters e ContactDetailCard.
  - ✅ Reuso do formulário existente aplicado em <mcfile name="OpportunityForm.tsx" path="c:\\Users\\vinic\\OneDrive\\Documentos\\01 - Profissional\\08- Plataformas\\atualizacao nova energia plataforma\\solara-nova-energia\\rebuild\\src\\app\\opportunities\\_components\\OpportunityForm.tsx"></mcfile> para criação inline no detalhe do contato; ⌛ extrair listagem para componente "OpportunityListInline".
- ⌛ Navegação e UX:
  - ✅ Sidebar e breadcrumbs apontando para /contacts.
  - ⌛ Manter redirects server-side nas rotas legadas (/leads, /leads/new, /leads/[id]) e remover UIs legadas em fase posterior.
- ⌛ API e Auth:
  - ✅ Contacts/Opportunities handlers básicos implementados.
  - ⌛ Padronizar 401/403 com o futuro helper checkAuth (aplicar primeiro em contacts e opportunities) e alinhar mensagens JSON.
- ⌛ Testes manuais:
  - ⌛ Verificar 200/400/401/404 nos endpoints principais.
  - ⌛ Navegação, estados vazios, loading e erros manejados na UI.
  - ✅ Validação visual inicial com open_preview em /contacts, /contacts/[id] e /opportunities; sem erros no navegador; logs do servidor OK.
- ⌛ Documentação:
  - ⌛ Atualizar Plan.md, KNOWLEDGE_FILE.md e Version.md ao final do ciclo.

Critérios de Aceite — Fase 3 (UI mínima)
- Lista de Contatos exibe colunas: name, email, phone, status e owner (quando houver), com paginação e filtro por status.
- Detalhe do Contato exibe dados básicos e lista de oportunidades relacionadas; permite criar/editar oportunidade inline ou via modal.
- Criação/edição de contato e oportunidade via POST/PATCH funcionam, com respostas 201/200 e 400 (Zod) padronizadas.
- Rotas protegidas por Clerk quando habilitado, retornando 401 JSON padronizado; sem Clerk (dev) podem operar abertas conforme flag.
- Lint/TypeScript sem erros e acessibilidade básica (rótulos e foco visível) nos componentes adicionados.

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
- ✅ Linters e TypeScript sem warnings/erros; ajustes de acessibilidade aplicados no AppShell.
- ⌛ Otimizações de performance, lint/format/TS estritos, testes unitários/integração/E2E.
- ⌛ CI/CD (GitHub Actions) + deploy via Coolify; observabilidade (logs/erros).
- ⌛ Executar migrações em produção (Prisma) e validação de build/start no ambiente.
- ⌛ Extrair helper de autorização (checkAuth) para evitar duplicação nos endpoints e padronizar 401/403.
- ⌛ Atualizar documentação técnica (Docs/KNOWLEDGE_FILE.md) com unificação Leads/Contatos, remoções e padrões de handlers/Clerk.

Próximos passos (priorizados)
1) F4 — Solar (Simulação)
   - ⌛ Detalhar Plan.md (F4) conforme requisitos funcionais: Lead (seleção + dados + histórico + “Aumentar Consumo”), Simulação (equipamentos e parâmetros técnicos), Orçamento (kits e margem/BDI) e Proposta (prévia + link rastreável + A4/16:9).
   - ⌛ Definir tipos/DTOs em src/core/types para entrada/saída dos cálculos e criar esqueleto de src/core/services/CalculationService (normalização, geração kWh, Fio B, compensação 60m FIFO, tarifação e KPIs).
   - ⌛ UI: implementar etapa “Informações do Lead” com histórico de consumo e botão “Aumentar Consumo”.

2) F6/F7 — Treinamentos
   - ⌛ CRUD de módulos e conteúdos; upload de vídeos (MinIO) e leitor de playbooks; interatividade básica (MVP) e avaliação (F7).

3) F5 — Propostas (MVP)
   - ⌛ CRUD de rascunhos, pré-visualização e exportação PDF inicial; geração de link seguro com tracking de visualizações.

4) F3 — CRM (Contatos e Oportunidades)
   - ⌛ Refinos de navegação e componentes reutilizáveis; padronização de respostas e auth (quando helper estiver pronto).

5) F2 — Backend, Autenticação e Storage
   - ⌛ Integrar Clerk (auth) e MinIO (storage) quando variáveis de ambiente forem disponibilizadas; manter no fim da fila conforme decisão.

Referências
- Descritivo Técnico: <mcfile name="Descritivo Técnico Real e Atualizado - Solara Nova Energia.md" path="c:\\Users\\vinic\\OneDrive\\Documentos\\01 - Profissional\\08- Plataformas\\atualizacao nova energia plataforma\\solara-nova-energia\\rebuild\\Docs\\Descritivo Técnico Real e Atualizado - Solara Nova Energia.md"></mcfile>
- PRD: <mcfile name="Product Requirements Document (PRD) - Solara Nova Energia (Vibe Coding Edition) (1).md" path="c:\\Users\\vinic\\OneDrive\\Documentos\\01 - Profissional\\08- Plataformas\\atualizacao nova energia plataforma\\solara-nova-energia\\rebuild\\Docs\\Product Requirements Document (PRD) - Solara Nova Energia (Vibe Coding Edition) (1).md"></mcfile>
- Fluxo UX: <mcfile name="UX-FLOW.mmd" path="c:\\Users\\vinic\\OneDrive\\Documentos\\01 - Profissional\\08- Plataformas\\atualizacao nova energia plataforma\\solara-nova-energia\\rebuild\\Docs\\UX-FLOW.mmd"></mcfile>
        
Planejamento do Módulo Fotovoltaico (F4) — Sem executar

Detalhamento Funcional — Fluxo e Requisitos (sem executar)
- Lead
  - Seleção do lead: busca por nome/telefone/email; ao selecionar, autopreencher dados básicos (nome, endereço/cidade/UF, classe de consumo, distribuidora, tarifa vigente quando conhecida).
  - Histórico de consumo: exibir 12–24 meses (quando disponível) com gráfico mensal; fallback: média trimestral/últimos 6–12 meses.
  - “Aumentar Consumo”: botão abre popover/modal para adicionar cargas novas (ar-condicionado, chuveiro, piscina/bomba, veículo elétrico, outros) com estimativa de kWh/mês; aplicar ajuste percentual e registrar evento de rastreio.

- Simulação
  - Equipamentos: seleção e gerenciamento de Módulos, Inversores e (opcional) Baterias; validações visuais (DC/AC ratio, oversize por MPPT/string, corrente por string, tensão VOC em T°C mínima).
  - Parâmetros técnicos: Performance Ratio, perdas ambientais/técnicas, orientação/inclinação, irradiação por UF/cidade; níveis de precisão: Básico, Preciso, Importar PV*Sol (anexar arquivo e mapear dados essenciais).
  - Cálculos automáticos: potência recomendada (kWp), geração (kWh/ano e mensal), compensação %, regras do Fio B (Lei 14.300), custo de disponibilidade, tarifação (TUSD/TE + tributos) e KPIs financeiros.
  - Baterias (opcional): capacidade (kWh), potência (kW), profundidade de descarga, estratégia de uso (backup/TOU quando aplicável).

- Orçamento
  - Seleção/gerenciamento de kits fotovoltaicos (catálogo interno): itens, BDI/markup, impostos, custos indiretos (logística, projeto, ART), margem/desc.; cálculo de preço sugerido e margem final.
  - Variações de proposta por kit e por condições (ex.: com/sem bateria) mantendo rastreabilidade.

- Proposta
  - Pré-visualização com branding (logo, cores), blocos editáveis (escopo, prazos, garantias, condições); link rastreável (token) com vencimento; exportação em A4 (PDF) e 16:9 (slides).
  - Eventos de tracking (visualização, tempo, cliques em CTAs); CTA para aceitar/solicitar contato.

- Dados e Integrações
  - Tarifas: uso de TarifaConcessionaria (schema existente) por UF/distribuidora/classe e vigência; cache in-memory simples.
  - Catálogos: módulos/inversores/baterias com atributos elétricos completos; seeds mínimos para cenários de teste.

- Critérios de Aceite (funcionais — UI/Serviço)
  - Lead selecionado autopreenche dados; histórico de consumo reativo à seleção; ajuste de consumo via “Aumentar Consumo” refletido na simulação.
  - Simulação valida oversize, corrente/tensão por string e MPPT; orientações/inclinação ajustam geração; import PV*Sol preenche parâmetros e dados de geração.
  - Orçamento calcula preço/margem coerentes com BDI/markup e impostos; variações (com/sem bateria) mantêm rastreio.
  - Proposta gera link rastreável e exporta A4/16:9 sem erro; visualização registra evento.

- Métricas de Qualidade
  - Geração: erro ≤ ±2% vs. cenários-espelho (fixtures); KPIs financeiros: TIR ±1 p.p.; validação de limites elétricos por equipamento e por string.

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

Backlog — Final da Fila (priorização adiada por solicitação)
- Conteúdo movido para: <mcfile name="backlog.md" path="c:\\Users\\vinic\\OneDrive\\Documentos\\01 - Profissional\\08- Plataformas\\atualizacao nova energia plataforma\\solara-nova-energia\\rebuild\\Docs\\backlog.md"></mcfile>
- Curto prazo (UX + robustez)
  - Adicionar cancelamento/remoção de itens da fila e botão "limpar concluídos".
  - Mensagens de validação para content-type e tamanho (front e backend) e limite de quantidade por lote.
  - Refinar acessibilidade (rótulos ARIA no dropzone e feedback de status).
- Backend e ambiente
  - Confirmar .env com MINIO_ENDPOINT, MINIO_PORT, MINIO_USE_SSL, MINIO_REGION, MINIO_ACCESS_KEY, MINIO_SECRET_KEY e MINIO_BUCKET para upload real.
  - Habilitar proteção por Clerk quando as chaves estiverem no .env, validando sessão nos handlers.
- Médio prazo (Autorização e padronização)
  - Implementar helper `checkAuth` em `src/lib/auth.ts` com modos de resposta (JSON e texto) e integração com `await auth()` (Clerk).
  - Aplicar o helper nas rotas de API para padronizar 401/403 e reduzir duplicação: <mcfolder name="contacts API" path="c:\\Users\\vinic\\OneDrive\\Documentos\\01 - Profissional\\08- Plataformas\\atualizacao nova energia plataforma\\solara-nova-energia\\rebuild\\src\\app\\api\\contacts"></mcfolder> <mcfolder name="leads API" path="c:\\Users\\vinic\\OneDrive\\Documentos\\01 - Profissional\\08- Plataformas\\atualizacao nova energia plataforma\\solara-nova-energia\\rebuild\\src\\app\\api\\leads"></mcfolder> <mcfolder name="opportunities API" path="c:\\Users\\vinic\\OneDrive\\Documentos\\01 - Profissional\\08- Plataformas\\atualizacao nova energia plataforma\\solara-nova-energia\\rebuild\\src\\app\\api\\opportunities"></mcfolder> <mcfolder name="storage API" path="c:\\Users\\vinic\\OneDrive\\Documentos\\01 - Profissional\\08- Plataformas\\atualizacao nova energia plataforma\\solara-nova-energia\\rebuild\\src\\app\\api\\storage"></mcfolder>.
  - Validar com lint e type-check e testar endpoints (200/401/403 e erros), ajustando mensagens de resposta para consistência.
  - Atualizar Plan.md e KNOWLEDGE_FILE.md com a nova padronização.
  - Atualizar Version.md com changelog resumido (padrão AngularJS) para a refatoração de autorização.
        
Critérios de Aceite — Auth/Authorization (checkAuth e padronização)
- Lint (ESLint) sem warnings e TypeScript (tsc --noEmit) sem erros após a refatoração.
- Todos os endpoints protegidos retornam 401 quando não autenticado, com mensagem padronizada (JSON por default).
- Endpoints que exigem permissão futura retornam 403 quando a checagem for ativada (fase posterior), com mensagem padronizada.
- Remoção de duplicação de `await auth()` direta dentro dos handlers, substituída pelo helper documentado.
- Documentação atualizada em <mcfile name="Plan.md" path="c:\\Users\\vinic\\OneDrive\\Documentos\\01 - Profissional\\08- Plataformas\\atualizacao nova energia plataforma\\solara-nova-energia\\rebuild\\Docs\\Plan.md"></mcfile> e <mcfile name="KNOWLEDGE_FILE.md" path="c:\\Users\\vinic\\OneDrive\\Documentos\\01 - Profissional\\08- Plataformas\\atualizacao nova energia plataforma\\solara-nova-energia\\rebuild\\Docs\\KNOWLEDGE_FILE.md"></mcfile>.
- Exemplos de respostas incluídos e validados para JSON e texto.

Plano de Testes (manual) — Endpoints relevantes
- Pré-condições: ambiente local com e sem Clerk habilitado (variar NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY). Se usar bypass, configurar AUTH_BYPASS=true (quando documentado/ativado).
- Coleções protegidas (ex.: GET /api/contacts)
  - Sem sessão (Clerk on) → 401 JSON: { error: "UNAUTHORIZED", message: "Sessão não encontrada ou inválida." }
  - Com sessão válida → 200 e payload esperado.
- Criação/alteração (ex.: POST /api/opportunities)
  - Sem sessão (Clerk on) → 401.
  - Com sessão válida e corpo válido → 201/200.
  - Com sessão válida e corpo inválido → 400 (Zod validation) com mensagem coerente.
- Storage (ex.: POST /api/storage/presign-upload)
  - Sem sessão (Clerk on) → 401 JSON.
  - Com sessão válida → 200 com URL assinada, expiração configurada.
- Rotas dinâmicas [id] (ex.: PATCH /api/contacts/[id])
  - Checar extração de id via `await context.params` e 404 para id inexistente.

Checklist de Integração em Handlers (Next 15)
- Importar e invocar o helper (modo JSON por default) no início do handler.
- Se retorno for `Response` (401/403), retornar imediatamente.
- Extrair `userId` do sucesso e usar para rastreio/auditoria quando aplicável.
- Substituir chamadas diretas a `await auth()` pelo helper e remover duplicação.
- Manter mensagens de erro consistentes; em Storage, preferir JSON para melhor DX do cliente.

Feature Flags e Variáveis
- Clerk
  - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY (frontend) e CLERK_SECRET_KEY (server) — quando ausentes, endpoints podem operar em modo aberto (somente em dev) se AUTH_BYPASS for true.
- Bypass de Auth (apenas dev)
  - AUTH_BYPASS=true habilita fluxo de desenvolvimento sem Clerk (documentado no KNOWLEDGE_FILE.md). Nunca usar em produção.

Riscos e Mitigações
- Risco: divergência de mensagens entre endpoints após refatoração.
  - Mitigação: helper único e testes manuais por categoria (coleção, item, storage).
- Risco: regressões em rotas dinâmicas [id].
  - Mitigação: checar `await context.params` em todos os handlers de [id]; incluir caminho feliz e erro 404.
- Risco: esquecer endpoints específicos (ex.: storage) com contratos diferentes.
  - Mitigação: checklist de integração por pasta: <mcfolder name="contacts" path="c:\\Users\\vinic\\OneDrive\\Documentos\\01 - Profissional\\08- Plataformas\\atualizacao nova energia plataforma\\solara-nova-energia\\rebuild\\src\\app\\api\\contacts"></mcfolder>, <mcfolder name="leads" path="c:\\Users\\vinic\\OneDrive\\Documentos\\01 - Profissional\\08- Plataformas\\atualizacao nova energia plataforma\\solara-nova-energia\\rebuild\\src\\app\\api\\leads"></mcfolder>, <mcfolder name="opportunities" path="c:\\Users\\vinic\\OneDrive\\Documentos\\01 - Profissional\\08- Plataformas\\atualizacao nova energia plataforma\\solara-nova-energia\\rebuild\\src\\app\\api\\opportunities"></mcfolder>, <mcfolder name="storage" path="c:\\Users\\vinic\\OneDrive\\Documentos\\01 - Profissional\\08- Plataformas\\atualizacao nova energia plataforma\\solara-nova-energia\\rebuild\\src\\app\\api\\storage"></mcfolder>.

Cronograma sugerido (curto ciclo)
- Dia 1: Implementar helper e aplicar em contacts; rodar lint/tsc e testes manuais.
- Dia 2: Aplicar em leads e opportunities; validar dinâmicas [id].
- Dia 3: Aplicar em storage e ajustar mensagens específicas; testes de upload/download end-to-end (local).
- Dia 4: Revisão geral, ajustes finos, atualização de docs (Plan/Knowledge) e changelog em Version.md.
        
Referências
- Descritivo Técnico: <mcfile name="Descritivo Técnico Real e Atualizado - Solara Nova Energia.md" path="c:\\Users\\vinic\\OneDrive\\Documentos\\01 - Profissional\\08- Plataformas\\atualizacao nova energia plataforma\\solara-nova-energia\\rebuild\\Docs\\Descritivo Técnico Real e Atualizado - Solara Nova Energia.md"></mcfile>
- PRD: <mcfile name="Product Requirements Document (PRD) - Solara Nova Energia (Vibe Coding Edition) (1).md" path="c:\\Users\\vinic\\OneDrive\\Documentos\\01 - Profissional\\08- Plataformas\\atualizacao nova energia plataforma\\solara-nova-energia\\rebuild\\Docs\\Product Requirements Document (PRD) - Solara Nova Energia (Vibe Coding Edition) (1).md"></mcfile>
- Fluxo UX: <mcfile name="UX-FLOW.mmd" path="c:\\Users\\vinic\\OneDrive\\Documentos\\01 - Profissional\\08- Plataformas\\atualizacao nova energia plataforma\\solara-nova-energia\\rebuild\\Docs\\UX-FLOW.mmd"></mcfile>
        