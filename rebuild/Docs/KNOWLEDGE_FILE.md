# Knowledge Base — Solara Nova Energia

Status
- Type-check (tsc --noEmit) OK
- ESLint OK (sem warnings)
- Clerk integrado (planos de padronização em andamento)

Decisões Técnicas (resumo)
- Next.js 15 + TypeScript + App Router
- Tailwind CSS 4
- Prisma (cliente singleton)
- Autenticação: Clerk no App Router
- Storage: MinIO via SDK S3 com URLs assinadas

Padrões de Implementação
- Handlers de API (Next 15): usar NextRequest; em rotas dinâmicas [id], context.params é Promise e deve ser aguardado; recuperar id com await; usar await auth() quando Clerk ativo.
- Acessibilidade: manter aria-* corretos, sem duplicações; WCAG como referência; preferir botões controlando aria-expanded e aria-controls corretamente.
- Qualidade de Código: evitar variáveis não utilizadas; hooks com dependências declaradas; DRY; mensagens de erro consistentes.

Autenticação e Autorização — Padrão (pré-implementação do helper)
Objetivo
- Padronizar comportamento antes de extrair um helper dedicado (checkAuth), garantindo consistência e segurança.

Regras
- Quando NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY estiver presente, validar sessão com await auth() em handlers.
- 401 Unauthorized quando não houver sessão válida (userId ausente).
- 403 Forbidden para casos de autorização insuficiente (quando adicionarmos papéis/regras). Até lá, 403 não deve ser utilizado.
- Modo desenvolvimento sem Clerk: avaliar flag (ex.: AUTH_BYPASS=true) para permitir desenvolvimento local sem bloqueio — motivo e riscos devem ser documentados.

Mensagens Padrão
- JSON (default)
  - 401: { "error": "UNAUTHORIZED", "message": "Sessão não encontrada ou inválida." }
  - 403: { "error": "FORBIDDEN", "message": "Permissão insuficiente para executar esta ação." }
- Texto (modo compatibilidade)
  - 401: Unauthorized
  - 403: Forbidden

Diretrizes de Uso (handlers Next 15)
- Sempre validar autenticação no início do handler (quando o endpoint não for público).
- Em rotas dinâmicas, aguardar context.params e recuperar o id com await.
- Não expor detalhes sensíveis na resposta de erro.
- Padronizar logs de auditoria vinculados a userId quando aplicável.

Plano de Evolução
- Extrair helper checkAuth em src/lib/auth.ts com modos de resposta 'json' | 'text'.
- Aplicar o helper em contacts, leads, opportunities e storage, removendo duplicação.
- Introduzir camada de autorização por papéis/regra em fase posterior (permit/deny por recurso/ação).

Variáveis de Ambiente
- Clerk:
  - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY (client)
  - CLERK_SECRET_KEY (server)
- MinIO/S3:
  - MINIO_ENDPOINT, MINIO_PORT, MINIO_USE_SSL, MINIO_REGION
  - MINIO_ACCESS_KEY, MINIO_SECRET_KEY, MINIO_BUCKET

Observações
- Nunca commitar segredos/chaves. Somente placeholders em .env.example.
- Ajustes de a11y e lint devem evitar regressões; rodar lint e tsc após mudanças estruturais.

Atualizações Recentes — Módulo Solar
- Aba "Resultados" aprimorada com:
  - KPIs de resumo (Potência Recomendada, Geração Mensal, Compensação, Oversize estimado).
  - Gráfico simples de barras (Geração x Consumo Mensal) acessível (role="img", aria-label por mês).
- Novos memos derivados em src/app/solar/page.tsx:
  - monthlyConsumptionTotal, annualConsumptionTotal, computedOversize (DRY e melhor reuso nos cards).
- Motivações: feedback rápido ao usuário, consistência com F4 (Plan.md) e base para exportar proposta.