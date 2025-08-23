# DocView — Design Técnico do Editor Unificado de Diagramas

1) Arquitetura Geral
- Frontend React 18 + Zustand + Tailwind; Editor unificado em /flowcharts/editor.
- Core: Node/Edge Registry único; Store Zustand única; Hooks dedicados (import/export/NLP/RBAC).
- Serviços: DiagramService (único ponto) com persistência local (IndexedDB/Drizzle) e trilha para Prisma/SQLite → PostgreSQL.

2) Componentes Principais
- UnifiedDiagramEditor: Shell do editor, toolbar, paleta, canvas ReactFlow, status.
- Hooks: useUnifiedDiagramEditor, useRBACPermissions, useDiagramImport/Export, useDiagramStore.
- Serviços: DiagramService (CRUD, versões, permissões), NLPDiagramService (parsers DSL), Importers (draw.io/HTML/Mermaid).

3) RBAC
- Papéis de acesso da conta: super_admin, engenheiro, vendedor, instalador, etc.
- Papéis no diagrama: owner, editor, viewer, commenter (para compartilhamentos finos).
- Política: create/edit/delete/share somente super_admin e engenheiro; view para todos; export/comment opcionais.
- Implementação: centralizar checagens no hook useRBACPermissions e refletir no UI (habilitar/desabilitar ações).

4) Fluxos
- Abrir Editor: rota → carregar documento (novo/existente) → RBAC → render.
- Salvar: validação → RBAC → persistência → versionar → thumbnail.
- Compartilhar: definir escopo (privado/equipe/público) → registrar permissões → link opcional com expiração.
- Importar: detectar tipo (draw.io/html/mermaid) → parser → validar → normalizar → carregar na store.
- Geração por Texto: DSL → parser determinístico → construir grafo → validar → carregar.

5) Modelo de Dados (Prisma/SQLite — rascunho)
- diagrams(id, title, type, category, status, tags, versionLabel, document(json), thumbnail, createdById, createdAt, updatedAt)
- diagram_versions(id, diagramId, versionLabel, document(json), createdAt, createdById)
- diagram_permissions(id, diagramId, userId, role, createdAt, updatedAt)
- diagram_shares(id, diagramId, scope(enum: private, team, public), teamRoles(json), linkToken, expiresAt, createdAt)

6) Importadores
- draw.io/.drawio.html: extrair mxGraph/xml do HTML; mapear shapes/edges principais para nós/arestas unificadas.
- Mermaid: suportar flowchart e mindmap iniciais; converter nodos e conexões.
- HTML genérico: heurísticas simples para listas/itens → mindmap/organograma (opcional).

7) Mini-DSL (PT-BR) — regras iniciais
- MindMap: "Raiz: Filho 1, Filho 2; Filho 1: Neto A, Neto B".
- Organograma: "CEO > VP > Gerente > Analista" ("a > b" cria hierarquia pai-filho).
- BPMN: "Início -> Tarefa X -> Decisão? sim: Caminho A; não: Caminho B -> Fim"; gateways por "?" + ramificações.
- Erros retornam com linha/coluna e dica de correção.

8) Qualidade, Testes e Observabilidade
- Testes unitários: parsers DSL e importadores; validação de RBAC.
- Integração: salvar/versionar/compartilhar; importar arquivo exemplo.
- e2e: criação básica por papel (engenheiro vs vendedor) e bloqueios de UI.
- Logs: secureLogger; nunca expor secrets.

9) Migração e Backends
- Passo 1: manter service atual (IndexedDB/Drizzle) com a mesma interface.
- Passo 2: introduzir Prisma/SQLite com schema acima; feature flag de service.
- Passo 3: migrar para PostgreSQL mantendo schema compatível.

10) Decisões em Aberto
- Export permitido a todos? (padrão: sim) — confirmar.
- Converter todos imports para DiagramServiceFactory ou consolidar em um único DiagramService? Recomendado: 1 serviço único.