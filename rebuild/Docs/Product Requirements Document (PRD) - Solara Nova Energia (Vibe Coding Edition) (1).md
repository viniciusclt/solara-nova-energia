# Product Requirements Document (PRD) - Solara Nova Energia (Vibe Coding Edition)

## 1. Visão Geral do Produto

O **Solara Nova Energia** é uma plataforma web para o setor de energia solar fotovoltaica, focada em otimizar a gestão de leads, simulações financeiras e energéticas, criação de propostas comerciais e treinamento corporativo. O objetivo é recriar as funcionalidades existentes de forma mais limpa e bem estruturada, utilizando as melhores práticas de desenvolvimento.

## 2. Requisitos Funcionais Essenciais

### 2.1. Módulo de Cálculo e Simulação Solar

-   **Funcionalidade Principal**: Calcular a viabilidade financeira e energética de sistemas fotovoltaicos.
-   **Entradas Necessárias**: Custo do sistema, potência em kWp, geração anual (kWh), consumo mensal (kWh), incremento de consumo anual, fator de simultaneidade, ID da concessionária, tipo de ligação (monofásico/bifásico/trifásico), ano de instalação, período de projeção (anos), inflação anual, taxa de desconto anual, depreciação anual do FV, custo de O&M anual, reajuste tarifário anual.
-   **Cálculos Essenciais**: 
    -   **Fio B (Lei 14.300/2022)**: Implementar a regra de transição para a cobrança do Fio B. Sistemas instalados antes de 2023 são isentos por 25 anos. Sistemas de 2023 a 2028 seguem percentuais crescentes (15% em 2023, 30% em 2024, etc.) nos primeiros 7 anos, depois 100%. Sistemas a partir de 2029 pagam 100% desde o início.
    -   **Gerenciamento de Créditos de Energia**: Simular sistema de compensação com validade de 60 meses, utilizando FIFO.
    -   **Indicadores Financeiros**: Calcular VPL (Valor Presente Líquido), TIR (Taxa Interna de Retorno - usar método Newton-Raphson com fallback para bisseção), Payback Simples e Payback Descontado (com interpolação linear).
    -   **Cálculo de Tarifa Final**: Implementar a fórmula ANEEL: `(TUSD + TE) × (1 + PIS/COFINS) × (1 + ICMS) + (COSIP / Consumo)`. Considerar ICMS e COSIP por faixas de consumo (específicas para RJ, com possibilidade de expansão).
    -   **Custo de Disponibilidade**: Considerar o custo mínimo da rede por tipo de ligação.
-   **Saídas Esperadas**: Economia mensal/anual, VPL, TIR, paybacks, resumo anual (economia, consumo, geração, autoconsumo, injeção).

### 2.2. Módulo de Gerenciamento de Leads

-   **Funcionalidade Principal**: Gerenciar informações de clientes potenciais.
-   **Operações**: Adicionar, editar, remover, visualizar, filtrar (por nome, email, telefone, status).
-   **Dados do Lead**: `id`, `name`, `email`, `phone`, `consumo_medio`, `status`, `created_at`, `updated_at`, `address` (objeto ou string), `user_id`.
-   **Persistência**: Interagir com tabela `leads` no banco de dados. Implementar fallback para dados de demonstração se a tabela não estiver disponível.

### 2.3. Módulo de Propostas

-   **Funcionalidade Principal**: Criar e gerenciar propostas comerciais interativas. A criação de propostas é realizada dentro de cada módulo específico (ex: Módulo Fotovoltaico, Módulo Wallbox), enquanto uma página centralizada pode ser usada para visualização, busca, filtragem e administração de todas as propostas geradas.
-   **Editor Visual**: Implementar um editor de propostas com funcionalidade de arrastar e soltar elementos (texto, imagens, tabelas, gráficos, dados de simulação).
-   **Modelos**: Suporte a modelos pré-definidos e upload de novos modelos (DOC, DOCX, PDF, PPT).
-   **Formatos de Saída**: Gerar propostas em formatos A4 (Word-like) e 16:9 (PowerPoint-like).
-   **Geração de PDF**: Exportar propostas para PDF.
-   **Compartilhamento**: Gerar URLs de compartilhamento com tracking de visualização (IP, horário).

### 2.4. Módulo de Treinamento

-   **Funcionalidade Principal**: Oferecer uma plataforma de e-learning para usuários.
-   **Upload e Streaming de Vídeos**: 
    -   Permitir upload de arquivos de vídeo.
    -   Processamento automático para múltiplas resoluções (720p, 1080p, 4K).
    -   Geração de thumbnails.
    -   Streaming adaptativo.
    -   Proteção de conteúdo: watermark dinâmico por usuário, URLs assinadas com expiração, player com controles anti-download.
-   **Editor de Diagramas/Fluxogramas**: 
    -   Ferramenta para criar mapas mentais, fluxogramas e diagramas de processo.
    -   Paleta de elementos arrastáveis (nós de entrada, saída, decisão, processo).
    -   Adição de nós por interação (ex: botão "+" ao hover).
    -   Conectores automáticos inteligentes.
    -   Painel de propriedades para customização (cores, texto, estilos).
    -   Zoom e pan com minimap.
    -   Exportação (PNG, SVG, PDF, JSON).
-   **Editor de Playbooks**: 
    -   Editor de conteúdo rico (WYSIWYG) estilo Notion.
    -   Blocos modulares: texto, imagem, vídeo, código, tabela, checklist.
    -   Arrastar e soltar para reorganização de blocos.
    -   Formatação de texto rica.
    -   Incorporação de mídias.
    -   Exportação para PDF e Markdown.
-   **Avaliações e Certificação**: 
    -   Criação de questionários (múltipla escolha, verdadeiro/falso, dissertativas, associação, ordenação, upload de arquivos).
    -   Geração automática de certificados em PDF com numeração única e verificação de autenticidade.
-   **Progresso e Analytics**: Acompanhamento do progresso individual (percentual de conclusão, tempo gasto, taxa de aprovação).
-   **Gamificação**: Sistema de pontos, badges e ranking.

### 2.5. Módulos de Aquecimento Solar e Wallbox

-   **Aquecimento Solar**: Calculadora de dimensionamento, análise de viabilidade econômica, catálogo de equipamentos, templates de proposta.
-   **Wallbox**: Funcionalidades para carregadores de veículos elétricos (detalhes a serem definidos na implementação).

### 2.6. Sistema de Gestão de Usuários

-   **Níveis de Acesso**: Implementar sistema de permissões baseado em papéis (Super Admin, Gerente, Engenheiro, Vendedor, Instalador) com controle granular sobre funcionalidades.
-   **Configurações de Usuário**: Gerenciamento de perfil (nome, função, senha, foto).
-   **Configurações Financeiras**: Gerenciamento de instituições financeiras, taxas de juros, inflação (acesso restrito a Super Admin e Gerente).

## 3. Arquitetura e Tecnologias (Vibe Coding)

### 3.1. Stack Tecnológico

-   **Frontend**: Next.js (com React e TypeScript), Tailwind CSS, Shadcn/UI, Radix UI, Zustand, Framer Motion, @dnd-kit/core, React Flow, Recharts, React Query, Zod.
-   **Backend**: PostgreSQL (na Hostinger).
-   **ORM**: Prisma.
-   **Autenticação**: Clerk.
-   **Storage**: MinIO (em VPS própria).
-   **Bibliotecas Específicas**: jsPDF, PDF-lib, React Dropzone. (A funcionalidade de OCR com `tesseract.js` é recomendada para ser movida para uma API de backend separada para otimização de bundle).

### 3.2. Estrutura de Código (para replicação)

Manter a estrutura modular `src/core`, `src/modules`, `src/shared` para organização clara. Foco na separação de responsabilidades: componentes de UI genéricos em `shared/ui`, lógica de negócio em `services`, estado em `stores`, e funcionalidades específicas em `modules`.

### 3.3. Banco de Dados (PostgreSQL com Prisma)

-   **ORM**: Utilizar Prisma para todas as interações com o banco de dados PostgreSQL.
-   **Schema**: Definir o `schema.prisma` com as entidades: `users` (vinculada ao Clerk), `training_modules`, `training_content`, `user_training_progress`, `leads`, `tarifas_concessionarias`, `solar_modules`, `inverters`, `proposals`, `roadmap_items`.
-   **Migrações**: Gerenciar o schema do banco de dados via migrações do Prisma.

## 4. Próximos Passos (Foco em Implementação)

1.  **Configuração do Ambiente**: Configurar Node.js (18+), VS Code, Git, Docker.
2.  **Inicialização do Projeto**: Criar um novo projeto Next.js.
3.  **Configuração do Prisma**: Instalar Prisma, definir `schema.prisma` com base nos modelos de dados identificados, gerar o cliente Prisma.
4.  **Integração do Clerk**: Configurar o Clerk para autenticação.
5.  **Integração do MinIO**: Configurar o MinIO para armazenamento de arquivos.
6.  **Desenvolvimento por Módulo**: Implementar as funcionalidades módulo a módulo, começando pelos mais críticos (Cálculo Solar, Leads, Propostas, Treinamento).
    -   Priorizar a lógica de negócio nos serviços (`src/services`).
    -   Utilizar Zustand para gerenciamento de estado local e global.
    -   Interagir com o banco de dados exclusivamente via Prisma.
    -   Reutilizar componentes Shadcn/UI e Radix UI.
7.  **Otimização de Performance**: Implementar lazy loading para módulos e code splitting. Considerar migrar OCR para uma API de backend separada.
8.  **Testes**: Escrever testes unitários e de integração para as funcionalidades críticas, especialmente os cálculos e validações.

## 5. Sugestões Futuras (Pós-Vibe Coding)

-   **Refatoração e Padronização**: Refatorar código legado, padronizar interfaces de tipo.
-   **Documentação Interna**: Adicionar comentários detalhados ao código.
-   **Monitoramento**: Integrar Sentry para erros e Vercel Analytics para performance.
-   **CI/CD**: Configurar GitHub Actions para automação de testes e deploy.
-   **UX/UI Avançado**: Melhorias no editor de diagramas, sistema de notificações push, interface administrativa dedicada.

## 6. Informações Não Essenciais para Vibe Coding (Removidas do PRD Principal)

Para evitar "alucinações" e manter o foco na implementação direta, as seguintes informações foram omitidas do PRD principal, mas são relevantes para o contexto geral do projeto:

-   **Métricas de Sucesso**: KPIs técnicos e de Negócio.
-   **Cronograma/Roadmap Detalhado**: Fases de implementação com prazos específicos.
-   **Investimento e Recursos**: Estimativas financeiras e equipe necessária.
-   **Diferenciais Competitivos**: Descrições de inovações técnicas e segurança/compliance como pontos de venda.
-   **Visão Futura**: Expansão planejada e potencial de mercado.
-   **Análise de Usabilidade Atual Detalhada**: Pontos fortes e áreas de melhoria de UX/UI além das funcionalidades.
-   **Estratégia de Deploy**: Detalhes sobre ambientes e estratégias de rollout.
-   **Manutenção e Suporte**: Detalhes sobre atualizações de dependências, backup e recuperação.

Estas informações são importantes para o planejamento estratégico e de negócios, mas podem ser consideradas "ruído" para um desenvolvedor focado em "vibe coding" e na replicação funcional do sistema. Elas devem ser consultadas em documentos de nível superior ou em discussões de planejamento.


