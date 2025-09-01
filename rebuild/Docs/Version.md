# Versionamento - Solara Nova Energia (Rebuild)

## 2025-08-25

### feat(rebuild): scaffold inicial Next.js + Tailwind + Prisma + Docker
- Criação de estrutura Next.js (App Router) em `rebuild/`
- Tailwind v4 configurado (postcss + tailwind.config.ts)
- Rota `/api/health` adicionada
- Prisma inicial com `User` e `Lead` e client singleton
- Arquivos de deploy: Dockerfile multi-stage e `.dockerignore`
- `.env.example` com variáveis mínimas

### chore(docs): separar flowchart Mermaid e atualizar Plan.md
- Move fluxo UX para `rebuild/Docs/UX-FLOW.mmd`
- Atualiza `rebuild/Docs/Plan.md` referenciando o arquivo

### chore(repo): reorganização para `Old/`
- Move todo conteúdo antigo para `Old/` exceto `rebuild/` e `.git/`
- Inclui `.github/`, `.vscode/`, `.vercel/` e `.trae/`

### chore(docs): alinhar fases/stack ao PRD; atualizar próximos passos
- Atualiza `Docs/Plan.md` com F2 (Auth/Storage), F3 (CRM) e F4 (Solar) antes de F5/F6; consolida Next 15, Clerk, MinIO, Zustand, TanStack Query e Zod.
- Atualiza `Docs/UX-FLOW.mmd` para Contatos/Oportunidades e adiciona Roadmap.

### chore(env): adicionar .env.example com variáveis Clerk e MinIO
- Cria `rebuild/.env.example` com placeholders seguros para Clerk e MinIO.

### chore(ui): renomear rótulos de Lead para Contato
- Ajusta títulos, mensagens e breadcrumbs nas telas de Leads e respostas de erro da API (sem alterar rotas por enquanto).

### chore(deps): atualizar Next para 15.x
- Atualiza `package.json` para `next@15.x` e `eslint-config-next@15.x`.

## 2025-09-01

### docs(coverage): adicionar Feature Coverage Matrix
- Cria `rebuild/Docs/Feature Coverage Matrix.md` para rastrear status (✅/⌛/🔜), paths e fontes dos Docs.
- Inclui instruções de atualização e colunas para Critérios de Aceite e Testes.