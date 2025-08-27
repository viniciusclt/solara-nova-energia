# Backlog

Este arquivo concentra:
- Resumo do que já foi feito (concluído ✅)
- Tarefas deixadas para depois (adiadas/priorização futura)

Para o plano ativo (próximos passos por fase e status), consulte: <mcfile name="Plan.md" path="c:\\Users\\vinic\\OneDrive\\Documentos\\01 - Profissional\\08- Plataformas\\atualizacao nova energia plataforma\\solara-nova-energia\\rebuild\\Docs\\Plan.md"></mcfile>.

Resumo do que já foi feito (✅)
- Projeto Next.js com TypeScript e App Router em rebuild/, Tailwind configurado e layout base.
- AppShell com Sidebar/Header/Breadcrumbs e tema claro/escuro persistido.
- Rota /api/health verificando uptime/versão e conectividade condicional com DB: <mcfile name="route.ts" path="c:\\Users\\vinic\\OneDrive\\Documentos\\01 - Profissional\\08- Plataformas\\atualizacao nova energia plataforma\\solara-nova-energia\\rebuild\\src\\app\\api\\health\\route.ts"></mcfile>
- Prisma configurado (cliente singleton) e schema inicial: <mcfile name="prisma.ts" path="c:\\Users\\vinic\\OneDrive\\Documentos\\01 - Profissional\\08- Plataformas\\atualizacao nova energia plataforma\\solara-nova-energia\\rebuild\\src\\lib\\prisma.ts"></mcfile>, <mcfile name="schema.prisma" path="c:\\Users\\vinic\\OneDrive\\Documentos\\01 - Profissional\\08- Plataformas\\atualizacao nova energia plataforma\\solara-nova-energia\\rebuild\\prisma\\schema.prisma"></mcfile>
- Scripts npm de ciclo de vida e Prisma: <mcfile name="package.json" path="c:\\Users\\vinic\\OneDrive\\Documentos\\01 - Profissional\\08- Plataformas\\atualizacao nova energia plataforma\\solara-nova-energia\\rebuild\\package.json"></mcfile>
- Dockerfile multi-stage e .dockerignore prontos: <mcfile name="Dockerfile" path="c:\\Users\\vinic\\OneDrive\\Documentos\\01 - Profissional\\08- Plataformas\\atualizacao nova energia plataforma\\solara-nova-energia\\rebuild\\Dockerfile"></mcfile>
- .env.example ampliado com Clerk e MinIO: <mcfile name=".env.example" path="c:\\Users\\vinic\\OneDrive\\Documentos\\01 - Profissional\\08- Plataformas\\atualizacao nova energia plataforma\\solara-nova-energia\\rebuild\\.env.example"></mcfile>
- Correções de type-check com Clerk e compatibilização das rotas dinâmicas ([id]) com Next 15: <mcfile name="route.ts" path="c:\\Users\\vinic\\OneDrive\\Documentos\\01 - Profissional\\08- Plataformas\\atualizacao nova energia plataforma\\solara-nova-energia\\rebuild\\src\\app\\api\\contacts\\[id]\\route.ts"></mcfile> <mcfile name="route.ts" path="c:\\Users\\vinic\\OneDrive\\Documentos\\01 - Profissional\\08- Plataformas\\atualizacao nova energia plataforma\\solara-nova-energia\\rebuild\\src\\app\\api\\leads\\[id]\\route.ts"></mcfile> <mcfile name="route.ts" path="c:\\Users\\vinic\\OneDrive\\Documentos\\01 - Profissional\\08- Plataformas\\atualizacao nova energia plataforma\\solara-nova-energia\\rebuild\\src\\app\\api\\opportunities\\[id]\\route.ts"></mcfile>
- Ajustes de acessibilidade no AppShell (aria-expanded/aria-controls/id revisados): <mcfile name="AppShell.tsx" path="c:\\Users\\vinic\\OneDrive\\Documentos\\01 - Profissional\\08- Plataformas\\atualizacao nova energia plataforma\\solara-nova-energia\\rebuild\\src\\app\\_components\\AppShell.tsx"></mcfile>
- Limpeza de warnings de lint e type-check OK, com ajustes em: <mcfile name="AppShell.tsx" path="c:\\Users\\vinic\\OneDrive\\Documentos\\01 - Profissional\\08- Plataformas\\atualizacao nova energia plataforma\\solara-nova-energia\\rebuild\\src\\app\\_components\\AppShell.tsx"></mcfile> <mcfile name="layout.tsx" path="c:\\Users\\vinic\\OneDrive\\Documentos\\01 - Profissional\\08- Plataformas\\atualizacao nova energia plataforma\\solara-nova-energia\\rebuild\\src\\app\\layout.tsx"></mcfile> <mcfile name="FileUploader.tsx" path="c:\\Users\\vinic\\OneDrive\\Documentos\\01 - Profissional\\08- Plataformas\\atualizacao nova energia plataforma\\solara-nova-energia\\rebuild\\src\\app\\_components\\FileUploader.tsx"></mcfile> <mcfile name="OpportunityForm.tsx" path="c:\\Users\\vinic\\OneDrive\\Documentos\\01 - Profissional\\08- Plataformas\\atualizacao nova energia plataforma\\solara-nova-energia\\rebuild\\src\\app\\opportunities\\_components\\OpportunityForm.tsx"></mcfile>
- KNOWLEDGE_FILE.md criado/atualizado com decisões e padrões: <mcfile name="KNOWLEDGE_FILE.md" path="c:\\Users\\vinic\\OneDrive\\Documentos\\01 - Profissional\\08- Plataformas\\atualizacao nova energia plataforma\\solara-nova-energia\\rebuild\\Docs\\KNOWLEDGE_FILE.md"></mcfile>
- Migração de navegação para /contacts concluída com redirects server-side ativos em /leads, /leads/new e /leads/[id]; validação visual inicial ok (open_preview) e logs do servidor OK.

Tarefas deixadas para depois (adiadas)
- Integrar Clerk completo (proteção de rotas no App Router; sincronização de usuários e papéis conforme disponibilidade de requisitos).
- Configurar MinIO com SDK S3 e URLs assinadas (upload/download) e variáveis de ambiente.
- Executar migrações reais em ambiente de deploy quando DATABASE_URL estiver disponível.
- Unificar Lead/Client → Contact no schema e ajustar rotas/UI (migração de dados quando houver base).
- Implementar CalculationService (Fio B, créditos 60m, tarifação, KPIs) e tipos/fixtures de validação.
- CRUD básico de Propostas e Treinamentos (MVP), geração de PDF inicial, tracking de visualização.
- CI/CD (GitHub Actions) + deploy via Coolify; observabilidade (logs/erros).
- Otimizações de performance, lint/format/TS estritos, testes unitários/integração/E2E.
- Extrair helper de autorização (checkAuth) e padronizar 401/403 em endpoints, atualizando docs.
- Limpar UI legado de Leads (/leads/_components/LeadForm.tsx) e remover páginas substituídas após estabilização da migração.
- Extrair componente OpportunityListInline da página de detalhes de contato para reuso.
- Acessibilidade mínima: garantir labels/aria e foco visível nos inputs adicionados em Contacts/Opportunities.

Itens adicionados — Próximos passos sugeridos (UI/CRM)
- Paginação da lista de oportunidades dentro do contato (limit atual=100) e filtros por status.
- Mostrar owner da oportunidade na tabela de oportunidades do contato (se exigido pelo negócio).
- Validar manualmente criação/edição de oportunidade em /opportunities/new e /opportunities/[id] com e sem contactId predefinido.

Notas
- Mantenha os itens curtos, claros e com contexto suficiente para futura execução.
- Quando um item entrar em execução, mova-o para o plano ativo (Docs/Plan.md) ou abra tarefa técnica específica.