# Fases de Implementação - Solara Nova Energia (Rebuild)

Este documento descreve as fases de implementação para a recriação do projeto "Solara Nova Energia", com base no PRD de Implementação. As fases são apresentadas em ordem lógica, sem prazos definidos, para permitir flexibilidade no planejamento e execução.

## Fase 1: Configuração do Ambiente e Base do Projeto

**Objetivo**: Estabelecer o ambiente de desenvolvimento e a estrutura fundamental do novo projeto.

-   **1.1. Configuração do Ambiente de Desenvolvimento**: Instalar Node.js (v18+), npm/yarn, VS Code com extensões essenciais (TypeScript, Tailwind CSS, Prisma, ESLint, Prettier).
-   **1.2. Inicialização do Projeto Next.js**: Criar um novo projeto Next.js (v15+) com TypeScript.
-   **1.3. Configuração do Controle de Versão**: Inicializar um novo repositório Git e configurar o uso de conventional commits.
-   **1.4. Configuração do Docker (Opcional, mas Recomendado)**: Criar arquivos Docker Compose para PostgreSQL 17 e MinIO, garantindo um ambiente de desenvolvimento consistente e isolado.
-   **1.5. Estrutura de Pastas Inicial**: Criar a estrutura básica de pastas `src/core`, `src/modules`, `src/shared`.

## Fase 2: Configuração do Backend e Autenticação

**Objetivo**: Conectar o frontend ao banco de dados e configurar o sistema de autenticação.

-   **2.1. Configuração do PostgreSQL 17**: Garantir que o banco de dados PostgreSQL esteja acessível (localmente via Docker ou na Hostinger).
-   **2.2. Instalação e Configuração do Prisma**: Instalar as dependências do Prisma.
-   **2.3. Definição do Schema Prisma (Parte 1 - Core)**: Criar o `schema.prisma` inicial com as entidades `User`, `Client`, `Opportunity`, `Proposal`, `TarifaConcessionaria` e `RoadmapItem`, incluindo suas relações.
-   **2.4. Migrações Iniciais do Prisma**: Executar as migrações para criar as tabelas no banco de dados.
-   **2.5. Integração do Clerk**: Configurar o Clerk no projeto Next.js para autenticação de usuários (login, registro, logout).
-   **2.6. Sincronização Clerk-PostgreSQL**: Implementar a lógica para sincronizar os IDs de usuário do Clerk com a tabela `User` no PostgreSQL, incluindo a definição de papéis (`role`).
-   **2.7. Configuração do MinIO**: Instalar e configurar o MinIO (localmente via Docker ou na VPS). Configurar as credenciais de acesso no projeto Next.js.

## Fase 3: Desenvolvimento do Módulo de Gestão de Usuários e Leads

**Objetivo**: Implementar as funcionalidades básicas de gerenciamento de usuários e leads.

-   **3.1. Gerenciamento de Usuários (Básico)**: Implementar a interface para visualização e edição do perfil do usuário logado. Proteger rotas com base no papel do usuário.
-   **3.2. CRUD de Clientes/Leads**: Desenvolver as telas e a lógica para criar, ler, atualizar e deletar informações de `Client` (que inicialmente serão os leads).
-   **3.3. Busca Automática de CEP**: Integrar uma API de CEP (ex: ViaCEP) para preenchimento automático de endereço.
-   **3.4. Filtragem e Busca de Leads**: Implementar funcionalidades de busca e filtragem na lista de leads.

## Fase 4: Desenvolvimento do Módulo Fotovoltaico

**Objetivo**: Implementar a calculadora solar e a análise financeira.

-   **4.1. Estrutura do Módulo Fotovoltaico**: Criar a estrutura de pastas e componentes para o módulo `solar`.
-   **4.2. Implementação do `CalculadoraSolarService`**: Desenvolver o serviço TypeScript puro com toda a lógica de cálculo (Fio B, créditos, VPL, TIR, paybacks, tarifa final ANEEL, custo de disponibilidade).
-   **4.3. Interface de Entrada de Dados**: Criar a UI para que o usuário insira os dados necessários para a simulação (consumo, custos, etc.).
-   **4.4. Exibição dos Resultados da Simulação**: Desenvolver a UI para apresentar os resultados da simulação (gráficos, tabelas de economia, indicadores financeiros).
-   **4.5. Gerenciamento de Tarifas**: Implementar o CRUD para `TarifaConcessionaria` e a lógica para seleção e aplicação das tarifas nos cálculos.
-   **4.6. Banco de Dados de Equipamentos**: Implementar o CRUD para `SolarModule` e `Inverter`.

## Fase 5: Desenvolvimento do Módulo de Oportunidades e Propostas

**Objetivo**: Implementar a gestão de oportunidades e o editor de propostas.

-   **5.1. CRUD de Oportunidades**: Desenvolver as telas e a lógica para criar, ler, atualizar e deletar `Opportunity`, vinculando-as a um `Client`.
-   **5.2. Geração de Propostas por Oportunidade**: Integrar a funcionalidade de criação de propostas dentro da tela de detalhes da `Opportunity`.
-   **5.3. Editor Visual de Propostas (MVP)**: Implementar a versão inicial do editor drag-and-drop com elementos básicos (texto, imagem, dados da simulação).
-   **5.4. Geração de PDF**: Implementar a exportação da proposta para PDF.
-   **5.5. Compartilhamento Seguro**: Desenvolver a funcionalidade de geração de URLs compartilháveis com tracking de visualização.
-   **5.6. Gerenciamento Central de Propostas**: Criar uma página para visualização e administração de todas as propostas geradas (sem edição).

## Fase 6: Desenvolvimento do Módulo de Treinamento (Parte 1 - Conteúdo)

**Objetivo**: Implementar a base do sistema de treinamento, focando na gestão de conteúdo.

-   **6.1. CRUD de Módulos de Treinamento**: Desenvolver a interface para criar, ler, atualizar e deletar `TrainingModule`.
-   **6.2. CRUD de Conteúdo de Treinamento**: Implementar a gestão de `TrainingContent` (vídeos, playbooks, diagramas, avaliações).
-   **6.3. Upload e Streaming de Vídeos**: Integrar o upload de arquivos de vídeo com o MinIO e implementar o streaming protegido.
-   **6.4. Editor de Playbooks (MVP)**: Implementar a versão inicial do editor WYSIWYG estilo Notion para `Playbook`.

## Fase 7: Desenvolvimento do Módulo de Treinamento (Parte 2 - Interatividade e Avaliação)

**Objetivo**: Adicionar funcionalidades interativas e de avaliação ao módulo de treinamento.

-   **7.1. Editor de Diagramas/Fluxogramas (MVP)**: Implementar a versão inicial do editor de diagramas com paleta de elementos e conectores básicos.
-   **7.2. Sistema de Avaliações (MVP)**: Desenvolver a criação de questionários e a aplicação de testes.
-   **7.3. Tracking de Progresso**: Implementar o registro e visualização do `UserTrainingProgress`.
-   **7.4. Geração de Certificados**: Desenvolver a funcionalidade de geração automática de certificados em PDF.
-   **7.5. Gamificação (MVP)**: Implementar o sistema de pontos e badges.

## Fase 8: Módulos de Aquecimento Solar, Wallbox e Roadmap

**Objetivo**: Implementar os módulos adicionais e a funcionalidade de roadmap.

-   **8.1. Módulo de Aquecimento Solar**: Implementar a calculadora de dimensionamento e a análise de viabilidade.
-   **8.2. Módulo Wallbox**: Implementar as funcionalidades básicas para carregadores de veículos elétricos.
-   **8.3. Módulo Roadmap**: Implementar o CRUD para `RoadmapItem` e a interface para visualização e votação.

## Fase 9: Otimização, Testes e Deploy

**Objetivo**: Garantir a qualidade, performance e a capacidade de deploy do projeto.

-   **9.1. Otimização de Performance**: Revisar e otimizar o código para reduzir o bundle size, implementar lazy loading em todos os módulos e considerar a migração de OCR para backend.
-   **9.2. Testes Abrangentes**: Escrever e executar testes unitários e de integração para todas as funcionalidades críticas.
-   **9.3. Configuração de CI/CD**: Configurar GitHub Actions para automação de testes e deploy para ambientes de staging e produção (via Coolify).
-   **9.4. Monitoramento e Logs**: Integrar Sentry para tracking de erros e configurar logs.
-   **9.5. Refatoração e Padronização Final**: Revisão geral do código para garantir consistência, legibilidade e aderência aos princípios de desenvolvimento.

Estou pronto para a sua validação destas fases antes de prosseguir para o Flowchart em Mermaid.

