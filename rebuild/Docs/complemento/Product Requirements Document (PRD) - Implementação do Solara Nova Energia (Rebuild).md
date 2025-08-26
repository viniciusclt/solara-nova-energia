# Product Requirements Document (PRD) - Implementação do Solara Nova Energia (Rebuild)

## 1. Introdução

Este PRD de Implementação detalha as diretrizes e requisitos para a recriação do projeto "Solara Nova Energia" a partir do zero, focando em uma arquitetura mais limpa, modular e otimizada. O objetivo é transformar o projeto existente, que foi identificado como um "Frankenstein" devido a múltiplas alterações e falta de padronização, em uma solução robusta, escalável e de fácil manutenção. Este documento servirá como guia para o desenvolvimento no ambiente TRAE (IDE), dentro da pasta `Rebuild`.

## 2. Visão Geral do Rebuild

O rebuild visa manter todas as funcionalidades essenciais do projeto original, conforme detalhado no `Descritivo_Tecnico_Real_Atualizado.md`, mas com uma nova base tecnológica e uma estrutura de código aprimorada. As principais mudanças na stack tecnológica são:

-   **Frontend Framework**: Migração de React/Vite para **Next.js 15+**.
-   **Autenticação**: Migração de Supabase Auth para **Clerk**.
-   **Banco de Dados**: Manutenção do **PostgreSQL 17**, mas com **Prisma ORM** para interação.
-   **Armazenamento de Arquivos**: Migração de Supabase Storage para **MinIO** (hospedado em VPS própria com Coolify).

## 3. Princípios de Desenvolvimento para o Rebuild

Para garantir uma versão mais limpa e funcional, os seguintes princípios devem ser rigorosamente seguidos:

-   **Modularidade**: Cada funcionalidade principal (Módulo Fotovoltaico, Módulo de Treinamento, etc.) deve ser desenvolvida como um módulo independente, com responsabilidades bem definidas.
-   **Componentização**: Utilização extensiva de componentes reutilizáveis (Shadcn/UI, Radix UI) para garantir consistência e agilizar o desenvolvimento da UI.
-   **Tipagem Forte**: Uso obrigatório de TypeScript em todo o projeto para garantir segurança e clareza no código.
-   **Separação de Preocupações**: Lógica de negócio em `services`, gerenciamento de estado em `stores` (Zustand), e componentes de UI separados da lógica de apresentação.
-   **Otimização de Performance**: Implementação de lazy loading, code splitting e otimização de assets desde o início do desenvolvimento.
-   **Testabilidade**: Design do código que facilite a escrita de testes unitários e de integração.
-   **Manutenibilidade**: Código limpo, legível e bem documentado (comentários e JSDoc).
-   **Conformidade com Normas**: Manter a precisão dos cálculos e validações conforme a Lei 14.300/2022 e REN ANEEL 1000/2021.

## 4. Requisitos Técnicos Detalhados por Componente

### 4.1. Ambiente de Desenvolvimento

-   **Node.js**: Versão 18+.
-   **Gerenciador de Pacotes**: npm ou yarn.
-   **IDE**: VS Code com extensões recomendadas para TypeScript, Tailwind CSS, Prisma.
-   **Controle de Versão**: Git, com uso de conventional commits.
-   **Docker**: Para ambiente de desenvolvimento consistente (PostgreSQL, MinIO).

### 4.2. Frontend (Next.js)

-   **Framework**: Next.js 15+ para renderização no lado do servidor (SSR) e rotas de API.
-   **Linguagem**: TypeScript.
-   **Estilização**: Tailwind CSS para utilitários de CSS, Shadcn/UI e Radix UI para componentes de UI.
-   **Gerenciamento de Estado**: Zustand para estado global e local.
-   **Gerenciamento de Dados Assíncronos**: React Query para requisições de dados, cache e sincronização.
-   **Animações**: Framer Motion (uso criterioso para evitar impacto na performance).
-   **Drag-and-Drop**: `@dnd-kit/core` para funcionalidades de arrastar e soltar (editor de propostas, playbooks, diagramas).
-   **Gráficos**: Recharts para visualização de dados.
-   **Validação de Formulários**: Zod para validação de esquemas.
-   **Estrutura de Pastas**: Seguir a estrutura modular `src/core`, `src/modules`, `src/shared`.

### 4.3. Backend (PostgreSQL + Prisma + Clerk + MinIO)

-   **Banco de Dados**: PostgreSQL 17 (hospedado na Hostinger).
-   **ORM**: Prisma para todas as operações de banco de dados.
    -   **Schema Prisma**: Definir o `schema.prisma` com todas as entidades do modelo de dados (ver seção 4.4).
    -   **Migrações**: Gerenciar o schema do banco de dados usando `npx prisma migrate`.
-   **Autenticação**: Clerk para gerenciamento de usuários, autenticação (login, registro, redefinição de senha) e autorização (papéis/permissões).
    -   Integrar o Clerk com as rotas de API do Next.js para proteger endpoints.
    -   Sincronizar dados de usuário do Clerk com a tabela `users` no PostgreSQL.
-   **Armazenamento de Arquivos**: MinIO (instalado em VPS própria via Docker).
    -   Configurar o MinIO para ser acessível pelo Next.js (rotas de API) para upload e download de arquivos.
    -   Utilizar SDK compatível com S3 para interagir com o MinIO.
    -   Implementar URLs assinadas para acesso seguro e temporário a arquivos.

### 4.4. Modelo de Dados (Schema Prisma)

O `schema.prisma` deve refletir as seguintes entidades, com relações e tipos de dados apropriados, seguindo a estrutura **Cliente > Oportunidade > Proposta**:

-   **`User`**: `id` (string, PK, do Clerk), `email`, `name`, `role` (enum: `SUPER_ADMIN`, `GERENTE`, `ENGENHEIRO`, `VENDEDOR`, `INSTALADOR`), `createdAt`, `updatedAt`.
-   **`Client`**: Representa o cliente final. Pode ser o `Lead` após a qualificação.
    -   `id` (string, PK), `name` (Nome), `cpf` (CPF), `addressStreet` (Rua), `addressNumber` (Número), `addressComplement` (Complemento), `addressNeighborhood` (Bairro), `addressCity` (Cidade), `addressState` (Estado), `addressZipCode` (CEP), `phoneNumber` (Celular), `email` (Email), `dateOfBirth` (Data de nascimento), `origin` (Origem).
    -   `userId` (FK para `User` - o vendedor/usuário que cadastrou o cliente).
-   **`Opportunity`**: Representa uma oportunidade de negócio para um `Client`.
    -   `id` (string, PK), `code` (Código), `name` (Nome da Oportunidade), `stage` (Etapa), `origin` (Origem), `utilityCompany` (Concessionária), `groupSubgroup` (Grupo/Sub-Grupo), `supplyType` (Fornecimento).
    -   `averageConsumption` (Consumo médio - caso tenha só a média, distribuir nos meses).
    -   `monthlyConsumption` (JSON com consumo de Jan a Dez: `[{ month: 'Jan', value: 100 }, ...]`).
    -   `generationType` (Tipo de Geração), `installationLocation` (Local de Instalação), `value` (Valor), `structure` (Estrutura), `moduleQuantity` (Qnt. Módulos), `modulePower` (Pt. Módulos), `systemPower` (Pot. Sistema), `notes` (Obs.).
    -   `clientId` (FK para `Client`).
-   **`Proposal`**: Representa uma proposta específica para uma `Opportunity`.
    -   `id` (string, PK), `title`, `content` (JSON), `status`, `opportunityId` (FK para `Opportunity`), `sharedUrl`, `viewTracking` (JSON array de IPs/timestamps).
-   **`TarifaConcessionaria`**: `id`, `nome`, `uf`, `tusdFioA`, `tusdFioB`, `te`, `pis`, `cofins`, `icmsFaixas` (JSON), `cosipFaixas` (JSON), `custoDisponibilidade`, `dataVigencia`.
-   **`SolarModule`**: `id`, `manufacturer`, `model`, `power`, `efficiency`, etc.
-   **`Inverter`**: `id`, `manufacturer`, `model`, `powerDC`, `powerAC`, `efficiency`, etc.
-   **`TrainingModule`**: `id`, `title`, `category`, `accessLevel`, `orderIndex`, `isActive`.
-   **`TrainingContent`**: `id`, `moduleId` (FK), `type` (enum: `VIDEO`, `PLAYBOOK`, `DIAGRAM`, `ASSESSMENT`), `title`, `videoUrl`, `duration`, `isRequired`.
-   **`UserTrainingProgress`**: `id`, `userId` (FK), `contentId` (FK), `progressPercentage`, `timeSpent`, `lastAccessedAt`, `completedAt`.
-   **`RoadmapItem`**: `id`, `title`, `description`, `status` (enum: `VOTACAO`, `PLANEJADO`, `EM_EXECUCAO`, `FINALIZADO`).

### 4.5. Integração entre Componentes

-   **Cálculos**: O `CalculadoraSolarService` deve ser um serviço TypeScript puro, sem dependências de UI, para ser facilmente testável e reutilizável. Ele será consumido pelos componentes do Módulo Fotovoltaico.
-   **Geração de Propostas**: A lógica de geração de PDF (jsPDF/PDF-lib) deve ser encapsulada em um serviço. O editor de propostas (`ProposalEditor`) deve interagir com este serviço e com o MinIO para salvar/carregar imagens. A criação da proposta será iniciada a partir da tela de `Opportunity`.
-   **Upload de Vídeos**: Os componentes de upload devem interagir com as rotas de API do Next.js, que por sua vez se comunicarão com o MinIO para o armazenamento.
-   **Autenticação/Autorização**: O Clerk deve ser usado para proteger rotas e componentes, garantindo que apenas usuários autorizados acessem determinadas funcionalidades com base em seus papéis (`role`).

## 5. Requisitos de Qualidade

-   **Performance**: Otimização contínua para garantir tempos de carregamento rápidos e responsividade da UI. Meta: Bundle size < 1.5MB, FCP < 1.5s.
-   **Segurança**: Implementação de RLS no PostgreSQL, proteção de rotas de API, validação de entrada de dados (Zod), uso de variáveis de ambiente para credenciais sensíveis.
-   **Usabilidade**: Interface intuitiva e consistente, com feedback visual claro para as ações do usuário.
-   **Testes**: Cobertura de testes unitários para a lógica de negócio (cálculos, serviços) e testes de integração para fluxos críticos.

## 6. Próximos Passos (para validação do usuário)

Após a validação deste PRD de Implementação, as próximas etapas serão:

1.  Definição das Fases de Implementação (sem prazos).
2.  Criação do Flowchart em Mermaid representando a UX do sistema.

Estou à disposição para quaisquer dúvidas ou ajustes neste documento.

