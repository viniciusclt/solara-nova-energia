# Descritivo Técnico Real e Atualizado - Solara Nova Energia

## 1. Visão Geral do Projeto

O projeto **Solara Nova Energia** é uma plataforma web abrangente, desenvolvida para o setor de energia solar fotovoltaica no Brasil. Ele integra funcionalidades essenciais para a gestão de leads, simulações financeiras e energéticas, criação de propostas comerciais, e um robusto módulo de treinamento corporativo. A plataforma visa otimizar processos, garantir conformidade regulatória e capacitar equipes, atendendo às necessidades de empresas e profissionais do setor.

## 2. Arquitetura Técnica e Stack Tecnológico

A plataforma adota uma arquitetura moderna e modular, focada em escalabilidade, performance e manutenibilidade. A escolha das tecnologias reflete um compromisso com o desenvolvimento ágil e a entrega de uma experiência de usuário de alta qualidade.

### 2.1. Stack Tecnológico

-   **Frontend**: Next.js (com React 18+ e TypeScript 5.0+), Tailwind CSS 3.4+ para estilização, Shadcn/UI e Radix UI para componentes de UI, Zustand 4.4+ para gerenciamento de estado, Framer Motion 10.0+ para animações, @dnd-kit/core 6.0+ para funcionalidades de arrastar e soltar, React Flow 11.0+ para diagramas, Recharts 2.8+ para gráficos, React Query (@tanstack/react-query) para gerenciamento de estado assíncrono, Zod para validação de dados.
-   **Backend e Infraestrutura**: PostgreSQL 15 (na Hostinger) para o banco de dados, Clerk para autenticação e autorização, MinIO (em VPS própria) para armazenamento de arquivos.
-   **ORM**: Prisma para todas as interações com o banco de dados.
-   **Bibliotecas Especializadas**: jsPDF e PDF-lib para geração de documentos PDF, React Dropzone para upload de arquivos. (A funcionalidade de OCR com `tesseract.js` é recomendada para ser movida para uma API de backend separada para otimização de bundle).
-   **Ferramentas de Desenvolvimento**: Node.js 18+, npm/yarn, VS Code, Git, Docker (para ambiente de desenvolvimento consistente), GitHub Actions (CI/CD), Jest e React Testing Library (testes), ESLint e Prettier (análise de código), Sentry (tracking de erros), Vercel Analytics (métricas de performance).

### 2.2. Estrutura Modular do Projeto

A organização do código segue uma estrutura modular, promovendo a separação de responsabilidades e a reutilização de componentes:

```
src/
├── core/                    # Código principal e utilitários globais
│   ├── components/          # Componentes essenciais
│   ├── hooks/               # Hooks customizados
│   ├── services/            # Serviços principais (e.g., TarifaService, CalculadoraSolarService)
│   ├── types/               # Tipos TypeScript globais
│   └── utils/               # Utilitários essenciais
├── modules/                # Módulos de funcionalidades específicas
│   ├── solar/               # Módulo fotovoltaico
│   ├── aqb/                 # Módulo Aquecimento Banho
│   ├── aqp/                 # Módulo Aquecimento Piscina
│   ├── wallbox/             # Módulo Wallbox
│   ├── training/            # Módulo de treinamento
│   ├── proposals/           # Módulo de gerenciamento de propostas (visualização e administração)
│   ├── playbooks/           # Módulo de criação de conteúdo (editor estilo Notion)
│   └── home/                # Dashboard e visão geral
├── shared/                  # Recursos compartilhados entre módulos
│   ├── ui/                  # Design system (componentes Shadcn/UI)
│   ├── layouts/             # Layouts base da aplicação
│   └── constants/           # Constantes globais
└── docs/                    # Documentação do projeto
```

## 3. Módulos Principais e Funcionalidades

### 3.1. Módulo Fotovoltaico (95% Concluído)

Este módulo é o cerne técnico da plataforma, oferecendo ferramentas avançadas para dimensionamento e análise financeira de sistemas solares.

-   **Calculadora Solar Avançada**: Realiza dimensionamento de sistemas fotovoltaicos considerando consumo, irradiação, características de equipamentos e restrições locais. Implementa a lógica da Lei 14.300/2022 para cálculo do Fio B e gerenciamento de créditos de energia (validade de 60 meses, FIFO).
-   **Análise Financeira Completa**: Calcula VPL, TIR, Payback Simples e Descontado, Payback Financiado, Economia Bruta, LCOE. Considera inflação anual, degradação do sistema, OPEX, cobrança de ICMS na TUSD e Fio B para projeções de 25 anos.
-   **Base de Tarifas**: Gerencia tarifas de concessionárias (atualmente RJ, com expansão planejada), incluindo cálculo de ICMS e COSIP por faixa de consumo e aplicação da fórmula ANEEL para tarifa final.
-   **Banco de Dados de Equipamentos**: Catálogo de painéis solares e inversores com especificações técnicas.
-   **Geração de Relatórios Técnicos**: Produção automatizada de relatórios com análises e gráficos.

### 3.2. Módulo de Propostas (85% Concluído)

Automatiza a criação e gestão de propostas comerciais. A criação de propostas é realizada dentro de cada módulo específico (ex: Módulo Fotovoltaico, Módulo Wallbox), enquanto a página `/proposals` serve para visualização, busca, filtragem e administração de todas as propostas geradas.

-   **Gerador de Propostas Automatizado**: Combina dados técnicos e comerciais para gerar propostas em PDF.
-   **Templates Personalizáveis**: Biblioteca de modelos customizáveis.
-   **Editor Drag-and-Drop (Gaps Críticos)**: Funcionalidade em desenvolvimento para interface visual avançada com cards, tabelas, gráficos e elementos de dados (Payback, potência, módulos, inversores).
-   **Upload de Modelos**: Suporte para DOC, DOCX, PDF, PPT.
-   **Formatos Diferenciados**: A4 (Word) e 16:9 (PowerPoint).
-   **Sistema de Animações**: Transições e animações para propostas online.
-   **Canvas Infinito**: Zoom, pan e elementos visuais.
-   **Compartilhamento Seguro**: URLs com tracking (IP e horários de visualização).
-   **Controle de Versões**: Histórico de alterações.
-   **Integração com CRM**: Sincronização com dados de leads.

### 3.3. Módulo de Treinamentos (90% Concluído)

Plataforma completa de gestão do conhecimento corporativo.

-   **Sistema de Upload e Hospedagem de Vídeos**: Upload para VPS própria (via MinIO), processamento automático (múltiplas resoluções, thumbnails), streaming adaptativo, watermark dinâmico por usuário, URLs assinadas, player customizado com proteção contra download.
-   **Editor de Diagramas e Fluxogramas**: Ferramenta para criação de mapas mentais, fluxogramas e diagramas de processo (inspirado em MindMeister/Whimsical). Inclui paleta de elementos arrastáveis, adição de nós por hover/seleção, conectores automáticos, painel de propriedades, zoom/pan, exportação (PNG, SVG, PDF, JSON), salvamento automático e controle de versões.
-   **Sistema de Playbooks Interativos**: Editor de conteúdo rico estilo Notion (WYSIWYG) com blocos modulares (texto, imagem, vídeo, código, tabela, checklist), drag-and-drop para reorganização, formatação rica, incorporação de mídias, exportação (PDF, Markdown).
-   **Sistema de Avaliações e Certificação**: Criação de questionários (múltipla escolha, verdadeiro/falso, dissertativas, associação, ordenação, upload de arquivos). Geração automática de certificados em PDF (design profissional, numeração única, verificação de autenticidade, templates personalizáveis, assinatura digital, histórico).
-   **Dashboard de Progresso e Analytics**: Acompanhamento de progresso individual/coletivo (percentual de conclusão, tempo médio, taxa de aprovação), identificação de gargalos, relatórios gerenciais, ranking de performance.
-   **Sistema de Gamificação**: Pontos por atividades, badges/conquistas, ranking competitivo, desafios, notificações de conquistas.

### 3.4. Módulos de Aquecimento Solar (Banho/Piscina) e Wallbox (70% Concluído)

Extensões da plataforma para outras áreas de energia renovável.

-   **Aquecimento Solar**: Calculadora de dimensionamento, análise de viabilidade econômica, catálogo de equipamentos, templates de proposta específicos.
-   **Wallbox**: Módulo para carregadores de veículos elétricos, com funcionalidades a serem detalhadas.

### 3.5. Sistema de Gestão de Usuários (100% Concluído)

Gerenciamento de usuários e permissões.

-   **Níveis de Acesso**: Super Admin, Gerente, Engenheiro, Vendedor, Instalador, com permissões detalhadas por funcionalidade (criar módulos de treinamento, editar conteúdo, upload de vídeos, criar propostas, editar templates, acessar relatórios, gerenciar usuários).
-   **Categorias de Treinamento**: Comercial, Engenharia, Instalação, com níveis de acesso e certificações requeridas.
-   **Configurações**: Dados do usuário (nome, função, senha, foto de perfil), dados financeiros (instituições financeiras, taxas de juros, inflação - acesso restrito a Super Admin e Gerente).

## 4. Modelo de Dados

O modelo de dados é baseado em PostgreSQL, com **Prisma ORM** para interação. As principais entidades incluem:

-   **`users`**: Tabela centralizada para usuários, vinculada ao ID do Clerk. Contém `id` (TEXT PRIMARY KEY, ID do Clerk), `role` (VARCHAR(50) NOT NULL DEFAULT 'vendedor'), e outros campos de perfil.
-   **`training_modules`**: Módulos de treinamento (título, categoria, nível de acesso, ordem, ativo).
-   **`training_content`**: Conteúdo de treinamento (tipo - vídeo, playbook, diagrama, avaliação, título, URL de vídeo, duração, obrigatório).
-   **`user_training_progress`**: Progresso do usuário em treinamentos (usuário, conteúdo, percentual de progresso, tempo gasto, última acesso, conclusão). Deve ter chaves estrangeiras para `users` e `training_content`.
-   **`leads`**: Informações de clientes potenciais (id, nome, email, telefone, consumo médio, status, timestamps, endereço, user_id).
-   **`tarifas_concessionarias`**: Dados tarifários (id, nome, estado/uf, TUSD Fio A/B, TE, PIS, COFINS, ICMS por faixa, COSIP por faixa, custo de disponibilidade, data de vigência). Pode incluir coluna `jsonb` para regras de cálculo específicas.
-   **`solar_modules`**: Módulos solares (id, nome, fabricante, modelo, potência, especificações elétricas/físicas, garantias, certificações).
-   **`inverters`**: Inversores (id, nome, fabricante, modelo, potência, especificações DC/AC, eficiência, proteções, dimensões, garantias, certificações).
-   **`proposals`**: Propostas comerciais (detalhes da proposta, elementos, status).
-   **`roadmap_items`**: Itens do roadmap (título, descrição, status - Votação, Planejado, Em Execução, Finalizado).

## 5. Análise de Performance e Otimizações

### 5.1. Estado Atual

-   **Bundle Size**: Aproximadamente 2.8MB (comprimido).
-   **Métricas de Carregamento (3G)**: FCP: 1.8s, LCP: 2.4s, TTI: 3.2s.
-   **Dependências de Alto Impacto**: tesseract.js (~1.2MB), reactflow (~380KB), recharts (~290KB), framer-motion (~180KB), lodash (~150KB).

### 5.2. Estratégias de Otimização Implementadas

-   **Lazy Loading de Módulos**: Carregamento sob demanda para módulos não críticos.
-   **Code Splitting Inteligente**: Divisão do código em chunks menores por rotas/funcionalidades.
-   **Otimização de Assets**: Compressão de imagens, uso de WebP/AVIF, lazy loading de elementos visuais.
-   **Cache Estratégico**: Configuração de cache via React Query.

### 5.3. Recomendações de Melhoria

-   **Migração de OCR para Backend/Edge Functions**: Reduzir bundle do frontend, movendo a funcionalidade de `tesseract.js` para uma API de backend separada.
-   **Implementação de Service Workers**: Cache offline e controle de recursos.
-   **Otimização de Dependências**: Substituição de `lodash` por funções nativas ou importação seletiva. Avaliar `recharts` e `framer-motion` para alternativas mais leves se a complexidade visual não justificar.
-   **Bundle Analysis Contínuo**: Monitoramento no CI/CD.

## 6. Melhorias de Usabilidade e Interface

### 6.1. Pontos Fortes

-   Interface consistente (sistema de design unificado).
-   Navegação intuitiva (sidebar estruturada).
-   Feedback visual adequado.
-   Responsividade eficaz.
-   Acessibilidade básica (componentes Radix UI).

### 6.2. Áreas de Melhoria

-   **Editor de Diagramas**: Melhorias na usabilidade, especialmente na paleta de elementos e conectores.
-   **Editor de Propostas**: Finalização do editor drag-and-drop.
-   **Notificações**: Implementação de um sistema de notificações push em tempo real.
-   **Interface Administrativa**: Criação de uma interface dedicada para gerenciamento de usuários, permissões e configurações avançadas.

## 7. Considerações de Implementação para Replicação

### 7.1. Ambiente de Desenvolvimento

-   **Node.js**: Versão 18+ (com npm ou yarn).
-   **VS Code**: Com extensões para TypeScript e Tailwind CSS.
-   **Git**: Com uso de conventional commits.
-   **Docker**: Para garantir um ambiente de desenvolvimento consistente.

### 7.2. Estratégia de Deploy

-   **Ambientes**: Desenvolvimento (local), Staging (testes com dados sintéticos), Produção (live, alta disponibilidade).
-   **CI/CD**: GitHub Actions para automação de testes e deploy.
-   **Monitoramento**: Sentry para erros, Vercel Analytics para performance, Supabase Dashboard para backend.

### 7.3. Manutenção e Suporte

-   **Atualizações de Dependências**: Revisão mensal, testes de regressão, monitoramento de vulnerabilidades.
-   **Backup e Recuperação**: Backup automático diário do banco de dados, replicação geográfica, testes regulares de recuperação.

## 8. Recomendações para Banco de Dados e Autenticação

### 8.1. PostgreSQL com Prisma

A migração para PostgreSQL com Prisma é altamente recomendada. O Prisma oferece um ORM moderno, tipado e com excelentes ferramentas de migração, o que se alinha perfeitamente com a stack TypeScript e a necessidade de um banco de dados relacional robusto.

-   **Passos para a Migração**: Definição do Schema Prisma, Geração do Cliente Prisma, Migrações Iniciais, Adaptação do Código (substituindo chamadas de ORM anteriores por Prisma), Testes, Migração de Dados (se necessário).
-   **Benefícios do Prisma**: Tipagem Forte, Produtividade, Migrações Declarativas, Conexão Otimizada, Ecossistema Rico (Prisma Studio, Prisma Migrate).

### 8.2. Autenticação com Clerk

Clerk é uma excelente solução de autenticação que se integra bem com Next.js. Ele gerencia sessões, perfis de usuário e permissões de forma segura, simplificando o desenvolvimento de autenticação.

### 8.3. Armazenamento de Arquivos com MinIO

Para o armazenamento de arquivos em sua própria VPS, a utilização do MinIO é a solução recomendada. MinIO é um servidor de armazenamento de objetos compatível com a API S3, que pode ser facilmente instalado via Docker. Isso permite total controle sobre o armazenamento e flexibilidade, utilizando qualquer biblioteca ou SDK compatível com S3.

## 9. Conclusões

O projeto Solara Nova Energia é uma aplicação complexa e multifacetada, com um alto grau de maturidade em suas funcionalidades principais. A documentação detalhada aqui apresentada, combinada com a análise do código-fonte e as novas recomendações, fornece uma base sólida para a replicação do projeto em uma versão mais limpa e otimizada. A adoção de Next.js, PostgreSQL com Prisma, Clerk e MinIO é um passo estratégico que trará benefícios significativos em termos de desenvolvimento, manutenção e controle de infraestrutura.


