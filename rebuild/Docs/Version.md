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