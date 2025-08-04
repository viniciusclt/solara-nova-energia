# KNOWLEDGE FILE - Solara Nova Energia

## 📋 RESUMO EXECUTIVO

**metadata:**
- version: "2.0"
- last_updated: "2024-12-12"
- project_type: "Sistema de Gestão para Energia Solar"
- tech_stack: "React 18 + TypeScript + Vite + Supabase + Tailwind CSS + shadcn/ui"
- maintainer: "Equipe Solara Nova Energia"
- ai_agent_priority: "critical"

**project_context:**
O **Solara Nova Energia** é um sistema completo de gestão para empresas do setor de energia solar, desenvolvido como uma aplicação web moderna. O sistema oferece funcionalidades abrangentes para gerenciamento de leads, cálculos de consumo energético, simulações técnicas, análises financeiras e geração automatizada de propostas comerciais.

A plataforma foi construída com foco na experiência do usuário, responsividade e escalabilidade, utilizando tecnologias modernas como React 18, TypeScript, Supabase para backend-as-a-service, e um design system baseado em Tailwind CSS com componentes shadcn/ui. O sistema inclui recursos avançados como auditoria de segurança, gestão de permissões por empresa, templates personalizáveis para propostas e integração com APIs externas.

**key_features:**
- lead_management: "Gestão completa de leads com validação CPF/CNPJ e busca automática por CEP"
- consumption_calculator: "Calculadora de consumo energético com validações e projeções"
- technical_simulation: "Simulador técnico para dimensionamento de sistemas solares"
- financial_analysis: "Análise financeira com cálculos de ROI, payback e VPL"
- proposal_generator: "Geração automatizada de propostas em PDF com 8 templates profissionais"
- equipment_catalog: "Catálogo completo de módulos solares, inversores e baterias"
- template_editor: "Editor visual de templates com drag-and-drop"
- proposal_sharing: "Compartilhamento seguro de propostas com tracking de visualizações"
- financial_kits: "Gestão de kits financeiros pré-configurados"
- demo_data: "Sistema de dados demonstrativos para testes"

## 🏗️ ARQUITETURA DO SISTEMA

### Stack Tecnológico Atual
- **Frontend**: React 18.3.1, TypeScript 5.5.3, Vite 5.4.1, React Router DOM 6.26.2
- **Backend**: Supabase 2.50.5 (PostgreSQL, Auth, Storage, Edge Functions)
- **UI Framework**: Tailwind CSS 3.4.11, shadcn/ui, Radix UI primitives
- **State Management**: TanStack React Query 5.56.2, React Context, React Hook Form 7.53.0
- **Build Tools**: Vite, ESLint 9.9.0, TypeScript ESLint 8.0.1
- **PDF Generation**: jsPDF 3.0.1, jsPDF-AutoTable 5.0.2
- **Charts**: Recharts 2.12.7
- **Icons**: Lucide React 0.462.0
- **Drag & Drop**: @dnd-kit/core 6.3.1, @dnd-kit/sortable 10.0.0
- **Animations**: Framer Motion 12.23.9
- **Forms**: React Hook Form 7.53.0, Zod 3.23.8
- **Date Handling**: Date-fns 3.6.0, React Day Picker 8.10.1
- **Utilities**: Class Variance Authority 0.7.1, CLSX 2.1.1, Tailwind Merge 2.5.2

### Estrutura de Diretórios Atual
```
src/
├── components/           # Componentes React principais
│   ├── ui/              # Componentes base (shadcn/ui) - 50+ componentes
│   ├── TemplateEditor/  # Editor visual de templates
│   └── EditableTable/   # Tabela editável customizada
├── contexts/            # Contextos React
│   └── AuthContext.tsx # Contexto de autenticação
├── features/            # Módulos organizados por feature
│   ├── auth/           # Autenticação (components, hooks, services)
│   ├── data-import/    # Importação de dados
│   ├── datasheets/     # Gestão de datasheets (components, hooks, services)
│   ├── equipment/      # Gestão de equipamentos
│   ├── leads/          # Gestão de leads
│   ├── proposals/      # Sistema de propostas (components, hooks, services, templates)
│   └── simulation/     # Simulações técnicas
├── hooks/              # Hooks customizados
│   ├── useCEP.ts       # Hook para busca de CEP
│   ├── useDebounce.ts  # Hook de debounce
│   ├── useSecurityAudit.ts # Hook de auditoria
│   └── useSecureRoleManagement.ts # Hook de gestão de permissões
├── integrations/       # Integrações externas
│   └── supabase/       # Cliente e tipos Supabase
├── lib/                # Utilitários e configurações
│   ├── utils.ts        # Utilitários gerais
│   └── validation.ts   # Validações
├── pages/              # Páginas da aplicação
│   ├── Auth.tsx        # Página de autenticação
│   ├── Index.tsx       # Página principal
│   └── NotFound.tsx    # Página 404
├── services/           # Serviços e lógica de negócio
│   ├── templates/      # 8 templates de propostas
│   ├── cepService.ts   # Serviço de CEP
│   ├── proposalPDFGenerator.ts # Geração de PDFs
│   └── proposalSharingService.ts # Compartilhamento
├── shared/             # Componentes e tipos compartilhados
│   ├── components/     # Componentes reutilizáveis
│   └── types/          # Tipos compartilhados
├── types/              # Definições de tipos TypeScript
│   └── index.ts        # Tipos principais (SolarModule, Inverter)
└── utils/              # Funções utilitárias
    └── EnvironmentDetector.ts # Detector de ambiente
```

## 🔧 COMPONENTES PRINCIPAIS

### Componentes de Interface Principais
- **SolarDashboard**: Componente principal que gerencia toda a interface do sistema
- **LeadDataEntry**: Formulário para entrada e edição de dados de leads
- **LeadList**: Lista de leads com filtros e paginação
- **LeadSearchDropdown**: Dropdown de busca de leads
- **LeadTablePage**: Página de tabela de leads
- **SelectedLeadBreadcrumb**: Breadcrumb para lead selecionado
- **ConsumptionCalculator**: Calculadora de consumo energético com validações
- **TechnicalSimulation**: Simulador técnico para dimensionamento de sistemas
- **FinancialAnalysis**: Análise financeira com cálculos de ROI, payback e VPL
- **ProposalGenerator**: Gerador de propostas com templates personalizáveis
- **ProposalTemplateSelector**: Seletor de templates de propostas
- **SharedProposalView**: Visualização de propostas compartilhadas
- **TemplateCustomizer**: Customizador de templates

### Componentes de Gestão de Equipamentos
- **EquipmentManager**: Gerenciador geral de equipamentos
- **ModuleManagerAdvanced**: Gerenciador avançado de módulos solares
- **InverterManagerAdvanced**: Gerenciador avançado de inversores
- **FinancialKitManager**: Gerenciador de kits financeiros

### Componentes de Importação e Dados
- **ExcelImporter**: Importador de dados Excel
- **PVSolImporter**: Importador de dados PVSol
- **DemoDataIndicator**: Indicador de dados demonstrativos

### Editor de Templates
- **TemplateEditor**: Editor principal de templates
- **EditorCanvas**: Canvas de edição
- **ComponentLibrary**: Biblioteca de componentes
- **PropertiesPanel**: Painel de propriedades
- **Toolbar**: Barra de ferramentas
- **TemplateRenderer**: Renderizador de templates

### Componentes de Sistema
- **ProtectedRoute**: Proteção de rotas por autenticação
- **SecurityAlert**: Alertas de segurança
- **SettingsModal**: Modal de configurações do sistema
- **VersionDisplay**: Exibição da versão do sistema
- **EditableTable**: Tabela editável customizada

### Serviços e Utilitários
- **ProposalPDFGenerator**: Geração de PDFs com múltiplos templates
- **ProposalSharingService**: Compartilhamento seguro de propostas com tracking
- **ProposalTemplateManager**: Gestão de templates de propostas
- **ProposalTemplates**: Configurações de templates
- **CEPService**: Integração com APIs de consulta de CEP (ViaCEP)
- **DemoDataService**: Serviço de dados demonstrativos
- **AuthContext**: Contexto de autenticação com Supabase

### Templates de Propostas (8 disponíveis)
- **StandardTemplate**: Template padrão básico
- **ProfessionalA4Template**: Template profissional A4
- **PremiumCorporateTemplate**: Template corporativo premium
- **AidaTemplate**: Template baseado na metodologia AIDA
- **DataFocusedTemplate**: Template focado em dados
- **StorytellingTemplate**: Template narrativo
- **Presentation16x9Template**: Template para apresentações
- **PrototypeReplicaTemplate**: Template de réplica de protótipo

### Hooks Customizados
- **useCEP**: Busca e validação de endereços por CEP com ViaCEP
- **useDebounce**: Debounce para otimização de performance em buscas
- **useSecurityAudit**: Auditoria e logging de eventos de segurança
- **useSecureRoleManagement**: Gestão segura de permissões de usuários
- **use-mobile**: Detecção de dispositivos móveis responsivos
- **use-toast**: Sistema de notificações toast (shadcn/ui)
- **useTemplateEditor**: Hook para editor de templates (features/proposals)

### Componentes UI (shadcn/ui) - 50+ componentes
- **Formulários**: Input, Textarea, Select, Checkbox, Radio Group, Switch
- **Navegação**: Button, Dropdown Menu, Navigation Menu, Breadcrumb
- **Layout**: Card, Sheet, Dialog, Popover, Tooltip, Separator
- **Feedback**: Alert, Toast, Progress, Skeleton, Badge
- **Data Display**: Table, Calendar, Chart, Avatar, Accordion
- **Especializado**: CEP Input (customizado), File Upload, Responsive components

## 📊 MODELO DE DADOS

### Entidades Principais (Supabase)
- **profiles**: Perfis de usuários com tipos de acesso e empresas
- **companies**: Empresas com configurações e assinaturas
- **leads**: Leads de clientes com dados pessoais e de consumo
- **solar_modules**: Catálogo completo de módulos solares com especificações técnicas detalhadas
  - Especificações elétricas (Voc, Isc, Vmp, Imp, eficiência)
  - Coeficientes de temperatura (Pmax, Voc, Isc)
  - Dimensões físicas (comprimento, largura, espessura, peso, área)
  - Tecnologia (tipo de célula, contagem, tecnologias)
  - Garantias (produto e performance)
  - Certificações e datasheet
- **inverters**: Catálogo de inversores com características elétricas completas
  - Especificações DC (potência máxima, tensão, corrente, MPPT)
  - Especificações AC (potência, tensão, frequência, fases)
  - Eficiência (máxima, europeia, MPPT)
  - Proteções e especificações físicas/ambientais
- **financial_kits**: Kits financeiros pré-configurados com preços
- **shared_proposals**: Propostas compartilhadas com tokens de acesso e tracking
- **proposal_views**: Logs de visualizações de propostas compartilhadas
- **datasheets**: Bucket de armazenamento para documentos técnicos

### Relacionamentos
- **profiles** ↔ **companies**: Usuários pertencem a empresas (many-to-one)
- **leads** ↔ **companies**: Leads são associados a empresas (many-to-one)
- **datasheets** ↔ **equipments**: Datasheets vinculados a equipamentos (many-to-many)
- **shared_proposals** ↔ **leads**: Propostas geradas para leads específicos
- **audit_logs** ↔ **profiles**: Logs rastreiam ações de usuários

## 🔐 SISTEMA DE AUTENTICAÇÃO E PERMISSÕES

### Autenticação
- **Provider**: Supabase Auth com JWT tokens
- **Métodos**: Email/senha com validação de força
- **Sessão**: Persistência automática com refresh tokens
- **Segurança**: Rate limiting e auditoria de tentativas

### Níveis de Permissão
- **admin**: Acesso total, gestão de usuários e configurações
- **user**: Acesso completo às funcionalidades operacionais
- **viewer**: Acesso somente leitura aos dados

### Controle de Acesso
- **Row Level Security (RLS)**: Políticas no Supabase por empresa
- **Componente ProtectedRoute**: Proteção de rotas por permissão
- **Hook useAuth**: Verificação de permissões em tempo real
- **Auditoria**: Log completo de ações sensíveis

## 🚀 FUNCIONALIDADES PRINCIPAIS

### Gestão de Leads
- Cadastro completo com validação de CPF/CNPJ
- Busca automática de endereço por CEP (ViaCEP)
- Lista de leads com filtros e paginação
- Dropdown de busca de leads
- Breadcrumb para lead selecionado
- Histórico de interações e status

### Calculadora de Consumo
- Cálculo baseado em histórico de faturas
- Projeções de crescimento de consumo
- Validação de dados de entrada
- Interface responsiva e intuitiva

### Simulação Técnica
- Dimensionamento automático do sistema
- Cálculo de geração por localização
- Seleção otimizada de equipamentos
- Análise técnica detalhada

### Análise Financeira
- Cálculo de ROI e payback
- Projeção de economia em 25 anos
- Análise de viabilidade econômica
- Gestão de kits financeiros
- Comparação de cenários

### Geração de Propostas
- 8 templates profissionais personalizáveis
- Editor visual de templates com drag-and-drop
- Geração automática de PDF
- Seletor de templates
- Customizador de templates
- Compartilhamento seguro com clientes
- Tracking detalhado de visualizações
- Logs de acesso com IP e user agent

### Sistema de Equipamentos
- Catálogo completo de módulos solares com especificações técnicas detalhadas
- Catálogo de inversores com características elétricas completas
- Gerenciadores avançados para módulos e inversores
- Upload e gestão de datasheets
- Integração com simulações

### Importação de Dados
- Importador de dados Excel
- Importador de dados PVSol
- Sistema de dados demonstrativos
- Indicador visual de dados demo

### Sistema de Segurança
- Autenticação com Supabase Auth
- Proteção de rotas
- Auditoria de segurança
- Gestão segura de permissões
- Alertas de segurança

## 🔄 FLUXOS DE TRABALHO

### Fluxo Principal de Vendas
1. **Gestão de Leads**: 
   - Cadastro com validação de CPF/CNPJ
   - Busca automática de endereço por CEP
   - Seleção de lead via dropdown ou lista
2. **Cálculo de Consumo**: Inserção de dados de consumo histórico
3. **Simulação Técnica**: Dimensionamento automático do sistema
4. **Análise Financeira**: Seleção de kit financeiro e cálculo de viabilidade
5. **Geração de Proposta**: 
   - Seleção de template (8 opções disponíveis)
   - Customização via editor visual
   - Geração de PDF
6. **Compartilhamento**: 
   - Criação de link seguro com token
   - Tracking detalhado de visualizações
   - Logs de acesso com IP e user agent

### Fluxo de Gestão de Equipamentos
1. **Módulos Solares**:
   - Cadastro via gerenciador avançado
   - Especificações técnicas completas
   - Upload de datasheet
2. **Inversores**:
   - Cadastro com características elétricas
   - Especificações DC/AC detalhadas
   - Gestão de eficiência e proteções
3. **Kits Financeiros**:
   - Configuração de preços por Wp
   - Categorização por fabricante
   - Gestão de status ativo/inativo

### Fluxo de Importação de Dados
1. **Excel**: Importação de planilhas estruturadas
2. **PVSol**: Importação de dados de simulação
3. **Dados Demo**: Ativação de dados demonstrativos

### Fluxo de Autenticação
1. **Login/Registro**: Validação de credenciais
2. **Verificação de Empresa**: Associação automática
3. **Carregamento de Perfil**: Definição de permissões
4. **Auditoria**: Log de acesso e ações

### Fluxo de Segurança
1. **Autenticação**: Login via Supabase Auth
2. **Autorização**: Verificação de permissões por rota
3. **Auditoria**: Logs de ações e alertas de segurança
4. **Proteção**: Rotas protegidas e gestão segura de dados

## 📱 RESPONSIVIDADE E UX

### Estratégia Mobile-First
- **Breakpoints**: 768px (mobile), 1024px (tablet), 1280px (desktop)
- **Hook useIsMobile**: Detecção automática de dispositivo
- **Componentes Adaptativos**: Layout flexível por tamanho de tela
- **Navegação Responsiva**: Tabs horizontais (desktop) vs. dropdown (mobile)

### Design System
- **Cores**: Paleta inspirada em energia solar (azuis e dourados)
- **Tipografia**: Sistema hierárquico com Tailwind CSS
- **Componentes**: shadcn/ui com customizações temáticas
- **Animações**: Transições suaves com CSS transitions

### Experiência do Usuário
- **Loading States**: Skeletons e spinners contextuais
- **Feedback Visual**: Toasts, badges e indicadores de status
- **Validação em Tempo Real**: Feedback imediato em formulários
- **Acessibilidade**: Suporte a screen readers e navegação por teclado

## 🧪 TESTES E QUALIDADE

### Ferramentas de Qualidade
- **ESLint**: Linting com regras TypeScript e React
- **TypeScript**: Tipagem estática para prevenção de erros
- **Prettier**: Formatação consistente de código
- **Husky**: Git hooks para qualidade pré-commit

### Estratégias de Teste
- **Validação de Tipos**: TypeScript strict mode
- **Testes de Integração**: Validação com Supabase
- **Testes de Componentes**: Testes unitários de UI
- **Auditoria de Segurança**: Logs e monitoramento

### Monitoramento
- **Error Boundaries**: Captura de erros React
- **Logs de Auditoria**: Rastreamento de ações críticas
- **Performance**: Lazy loading e otimizações
- **Supabase Analytics**: Métricas de uso e performance

## 📦 DEPLOYMENT E CI/CD

### Ambiente de Produção
- **Plataforma**: Lovable (deployment automático)
- **Build**: Vite com otimizações de produção
- **CDN**: Assets estáticos otimizados
- **SSL**: HTTPS automático

### Configuração de Build
- **Vite Config**: Otimizações para produção
- **Tree Shaking**: Remoção de código não utilizado
- **Code Splitting**: Carregamento lazy de rotas
- **Asset Optimization**: Compressão de imagens e fonts

### Supabase Backend
- **Database**: PostgreSQL com RLS
- **Auth**: JWT com refresh automático
- **Storage**: Upload de datasheets e imagens
- **Edge Functions**: Processamento serverless

## 🔧 CONFIGURAÇÕES E VARIÁVEIS

### Variáveis de Ambiente
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=[chave_publica_supabase]
```

### Configurações Principais
- **tailwind.config.ts**: Tema customizado com cores solares
- **vite.config.ts**: Aliases de path e plugins
- **tsconfig.json**: Configuração TypeScript strict
- **components.json**: Configuração shadcn/ui
- **supabase/config.toml**: Configurações do projeto Supabase

### Configurações de Integração
- **CEP Service**: APIs de consulta de endereço
- **Google Sheets**: Sincronização de dados (opcional)
- **PDF Templates**: Configurações de geração
- **Email Service**: Notificações e compartilhamento

## 📚 DEPENDÊNCIAS CRÍTICAS

### Core Dependencies
- **react**: ^18.3.1 - Framework principal
- **typescript**: ^5.5.3 - Tipagem estática
- **vite**: ^5.4.1 - Build tool e dev server
- **@supabase/supabase-js**: ^2.50.5 - Cliente Supabase
- **react-router-dom**: ^6.26.2 - Roteamento

### UI e Styling
- **tailwindcss**: ^3.4.11 - Framework CSS
- **@radix-ui/***: Primitivos de UI acessíveis
- **lucide-react**: ^0.441.0 - Ícones
- **class-variance-authority**: ^0.7.0 - Variantes de componentes

### Funcionalidades Específicas
- **jspdf**: ^2.5.2 - Geração de PDFs
- **recharts**: ^2.12.7 - Gráficos e visualizações
- **@tanstack/react-query**: ^5.56.2 - State management server
- **react-day-picker**: ^9.1.3 - Seletor de datas

### Desenvolvimento
- **eslint**: ^9.9.0 - Linting
- **@typescript-eslint/eslint-plugin**: Regras TypeScript
- **lovable-tagger**: ^1.1.7 - Tagging para Lovable

## 🐛 PROBLEMAS CONHECIDOS E LIMITAÇÕES

### Limitações Técnicas
- **Performance**: Carregamento pode ser lento em listas grandes de equipamentos
- **Memória**: Uso elevado de RAM em simulações complexas
- **Compatibilidade**: Otimizado para navegadores modernos
- **Responsividade**: Algumas telas podem precisar de ajustes em dispositivos móveis

### Dependências Críticas
- **ViaCEP**: Dependência para busca automática de endereços por CEP
- **Supabase**: Infraestrutura completa de backend, autenticação e banco de dados
- **Vercel**: Hospedagem e deployment automatizado
- **APIs Externas**: Possíveis limitações de rate limiting

### Limitações de Funcionalidade
- **Templates**: Editor visual pode ter limitações em layouts muito complexos
- **Importação**: Formatos específicos para Excel e PVSol
- **Compartilhamento**: Links de proposta têm expiração configurável
- **Dados Demo**: Indicação visual quando dados demonstrativos estão ativos

### Considerações de Segurança
- **Tokens**: Gestão de expiração de tokens de compartilhamento
- **Auditoria**: Logs de segurança requerem monitoramento regular
- **Permissões**: Sistema de roles precisa ser mantido atualizado
- **Dados Sensíveis**: Proteção de informações de leads e propostas

### Limitações de Armazenamento
- **Datasheets**: Armazenamento no Supabase Storage
- **Propostas**: Dados JSONB podem ter limitações de tamanho
- **Logs**: Acúmulo de logs de visualização e auditoria

## 🔮 ROADMAP E MELHORIAS FUTURAS

### Melhorias Imediatas
- **Performance**: Otimização de carregamento de listas grandes
- **Responsividade**: Ajustes para dispositivos móveis
- **Editor de Templates**: Expansão de funcionalidades drag-and-drop
- **Validações**: Melhorias na validação de dados de entrada

### Funcionalidades em Desenvolvimento
- **Dashboard Analytics**: Métricas de propostas e conversões
- **Relatórios Avançados**: Exportação e análise de dados
- **Notificações**: Sistema de alertas e lembretes
- **Backup Automático**: Backup regular de dados críticos

### Integrações Futuras
- **CRM**: Conexão com sistemas de gestão de clientes
- **ERP**: Integração com sistemas empresariais
- **WhatsApp Business**: Envio de propostas via WhatsApp
- **E-mail Marketing**: Automação de follow-up

### Funcionalidades Avançadas
- **IA/ML**: Recomendações inteligentes de equipamentos
- **Análise Preditiva**: Previsão de performance de sistemas
- **Otimização Automática**: Sugestões de melhorias em propostas
- **Simulação 3D**: Visualização tridimensional de instalações

### Expansão Técnica
- **API Pública**: Endpoints para integrações externas
- **PWA**: Transformar em Progressive Web App
- **Testes Automatizados**: Cobertura completa com Jest/Cypress
- **Monitoramento**: Implementar observabilidade completa

### Escalabilidade
- **Multi-tenancy**: Suporte a múltiplas empresas
- **White Label**: Versão customizável para revendas
- **Internacionalização**: Suporte a múltiplos idiomas
- **Compliance**: Adequação a regulamentações específicas

## 📖 RECURSOS ADICIONAIS

### Documentação Técnica
- **KNOWLEDGE_FILE.md**: Documentação completa do projeto (este arquivo)
- **README.md**: Instruções de instalação e configuração
- **Component Library**: Componentes shadcn/ui documentados
- **Database Schema**: Migrações Supabase organizadas

### Ferramentas de Desenvolvimento
- **ESLint + Prettier**: Padronização de código configurada
- **TypeScript**: Tipagem estática completa
- **Vite**: Build tool otimizado para desenvolvimento
- **Tailwind CSS**: Framework CSS utilitário

### Estrutura de Qualidade
- **Hooks Customizados**: Reutilização de lógica
- **Componentes Modulares**: Arquitetura componentizada
- **Serviços Organizados**: Separação de responsabilidades
- **Tipos TypeScript**: Interfaces bem definidas

### Recursos de Segurança
- **Supabase Auth**: Autenticação robusta
- **RLS Policies**: Políticas de segurança no banco
- **Proteção de Rotas**: Controle de acesso
- **Auditoria**: Logs de segurança e acesso

### Templates Disponíveis
- **8 Templates de Proposta**: Variedade de layouts profissionais
- **Editor Visual**: Customização drag-and-drop
- **Geração PDF**: Exportação automática
- **Compartilhamento**: Links seguros com tracking

---

1. ESTRUTURA BASE (Sempre incluir)
    # IDENTIDADE DO PROJETO
        product_vision: "Descrição clara do produto e objetivos"
        target_users: "Perfis detalhados dos usuários-alvo"

    # ARQUITETURA TÉCNICA
        tech_stack: "React, Next.js, Tailwind, Supabase, etc."
        project_structure: "Organização de pastas e componentes"

    # REGRAS DE NEGÓCIO
        business_rules: "Validações e lógicas específicas"
        user_permissions: "Níveis de acesso e restrições"

2. REGRAS DE CONTEXTO
    Versionamento: Sempre incluir version e last_updated
    Prioridade: Marcar seções críticas como ai_agent_priority: "high"
    Dependências: Listar arquivos/seções relacionados

3. REGRAS DE CONTEÚDO
    ✅ INCLUIR SEMPRE:
        User journeys mapeados passo a passo
        Exemplos de dados mockados
        Componentes de design system
        Estados de error/loading/success
        Validações específicas

    ❌ EVITAR:
        Informações genéricas demais
        Contexto desatualizado
        Regras conflitantes
        Descrições ambíguas

4. TEMPLATE ESTRUTURADO
# KNOWLEDGE FILE - Solara Nova Energia
    metadata:
        version: "1.0"
        last_updated: "2024-12-12"
        project_type: "Sistema de Gestão para Energia Solar"
        tech_stack: "React + TypeScript + Vite + Supabase + Tailwind CSS + shadcn/ui"
        maintainer: "Equipe Solara Nova Energia"
        ai_agent_priority: "critical"

    project_context:
        vision: "Sistema completo de gestão para empresas do setor de energia solar"
        key_features:
            - lead_management: "Gestão completa de leads com validação CPF/CNPJ"
            - consumption_calculator: "Calculadora de consumo energético avançada"
            - technical_simulation: "Simulador técnico para dimensionamento"
            - financial_analysis: "Análise financeira com ROI e payback"
            - proposal_generator: "Geração automatizada de propostas em PDF"
            - equipment_catalog: "Catálogo completo de equipamentos solares"

    user_journeys:
        primary_flow: "Login → Cadastro Lead → Cálculo Consumo → Simulação → Análise Financeira → Proposta → Compartilhamento"
        user_types:
            - admin: "Acesso total, gestão de usuários e configurações"
            - user: "Acesso completo às funcionalidades operacionais"
            - viewer: "Acesso somente leitura aos dados"

    technical_specs:
        frontend: "React 18 + TypeScript + Vite + Tailwind CSS"
        backend: "Supabase (PostgreSQL + Auth + Storage)"
        auth: "Supabase Auth com JWT tokens"
        ui_framework: "shadcn/ui + Radix UI primitives"
        
    business_rules:
        - rls_security: "Row Level Security por empresa no Supabase"
        - audit_logging: "Log completo de ações sensíveis"
        - data_validation: "Validação rigorosa de CPF/CNPJ e dados técnicos"
        - permission_control: "Controle granular de permissões por usuário"

    design_system:
        colors: "Primary: azuis solares, Secondary: dourados energéticos"
        components: "shadcn/ui customizado com tema solar"
        responsive: "Mobile-first com breakpoints 768px/1024px/1280px"
        
    ai_instructions:
        - "Sempre implementar loading states e error boundaries"
        - "Usar TypeScript strict mode para type safety"
        - "Aplicar responsive design mobile-first"
        - "Implementar RLS policies no Supabase"
        - "Usar React Query para state management"
        - "Aplicar auditoria de segurança em ações críticas"

5. REGRAS DE MANUTENÇÃO

    ATUALIZAÇÃO OBRIGATÓRIA quando:
        Adicionar novas funcionalidades
        Mudar regras de negócio
        Alterar fluxos de usuário
        Modificar estrutura técnica

    VERIFICAÇÃO REGULAR:
        Consistência com código atual
        Relevância das informações
        Clareza das instruções
        Completude do contexto

6. REGRAS DE QUALIDADE

    CHECKLIST OBRIGATÓRIO:

        quality_check:
        - [ ] Contexto específico e detalhado
        - [ ] Exemplos práticos incluídos
        - [ ] Regras de negócio claras
        - [ ] User journeys mapeados
        - [ ] Stack técnica definida
        - [ ] Estados de UI especificados
        - [ ] Validações documentadas

7. REGRA DE PROMPTING INTEGRADO

    Sempre inclua uma seção para orientar a IA:
        ai_guidance:
            code_standards: "Use TypeScript, componentes funcionais, hooks"
            ui_patterns: "Shadcn/ui, Tailwind classes, responsive design"
            error_handling: "Try-catch, user feedback, graceful degradation"
            testing: "Implementar testes básicos quando solicitado"

VEREDICTO
    O Knowledge File estruturado com essas regras é CRÍTICO para:
        ✅ Consistência entre iterações
        ✅ Qualidade do código gerado
        ✅ Eficiência no desenvolvimento
        ✅ Redução de ambiguidades
        ✅ Manutenibilidade do projeto

