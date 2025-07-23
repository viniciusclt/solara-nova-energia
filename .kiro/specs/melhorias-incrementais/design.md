# Design Document - Melhorias Incrementais SolarCalc Pro

## Overview

Este documento descreve o design técnico para implementar melhorias incrementais no SolarCalc Pro. O objetivo é adicionar funcionalidades e ajustes visuais de forma controlada, mantendo a estabilidade do sistema através de commits validados a cada etapa.

## Architecture

### Sistema de Desenvolvimento Incremental
- **Abordagem**: Desenvolvimento iterativo com validação contínua
- **Controle de Versão**: Commits granulares com validação a cada etapa
- **Integração**: Push para GitHub conectado ao Lovable para validação automática
- **Rollback**: Capacidade de reverter para versão estável a qualquer momento

### Estrutura de Componentes
```
src/
├── components/
│   ├── ui/                    # Componentes base reutilizáveis
│   ├── leads/                 # Componentes específicos de leads
│   ├── equipment/             # Gerenciamento de equipamentos
│   ├── simulation/            # Componentes de simulação
│   └── proposals/             # Sistema de propostas
├── services/                  # Serviços e integrações
├── hooks/                     # Custom hooks
└── types/                     # Definições de tipos TypeScript
```

## Components and Interfaces

### 1. Interface e UX Responsiva

#### ResponsiveButton Component
```typescript
interface ResponsiveButtonProps {
  title: string;
  subtitle?: string;
  icon: React.ComponentType;
  onClick: () => void;
  variant?: 'default' | 'outline';
}
```

**Design Decisions:**
- Subtítulos se adaptam automaticamente ao tamanho da tela
- Breakpoints responsivos para ocultar texto em telas pequenas
- Manutenção da funcionalidade em todos os dispositivos

### 2. Sistema de Leads Aprimorado

#### LeadSearchDropdown Component
```typescript
interface LeadSearchDropdownProps {
  onLeadSelect: (lead: Lead) => void;
  placeholder?: string;
  debounceMs?: number;
}
```

#### LeadTablePage Component
```typescript
interface LeadTablePageProps {
  initialFilters?: LeadFilters;
  showActions?: boolean;
}
```

**Design Decisions:**
- Busca suspensa com debounce de 300ms para performance
- Página dedicada para visualização completa de leads
- Filtros avançados por status, data, consumo e cidade
- Manutenção de foco durante digitação

### 3. Sistema de CEP Automático

#### CEPService
```typescript
interface CEPService {
  searchByCEP(cep: string): Promise<AddressData>;
  validateCEP(cep: string): boolean;
}

interface AddressData {
  street: string;
  city: string;
  state: string;
  district?: string;
}
```

**Design Decisions:**
- Integração com API ViaCEP para dados confiáveis
- Validação de formato antes da consulta
- Preenchimento automático de campos de endereço
- Tratamento de erros para CEPs inválidos

### 4. Sistema de Equipamentos Expandido

#### SolarModule Interface (Expandida)
```typescript
interface SolarModule {
  // Campos básicos existentes
  id: string;
  manufacturer: string;
  model: string;
  power: number;
  
  // Especificações técnicas expandidas
  voc: number;           // Tensão de circuito aberto
  isc: number;           // Corrente de curto-circuito
  vmp: number;           // Tensão no ponto de máxima potência
  imp: number;           // Corrente no ponto de máxima potência
  
  // Coeficientes de temperatura
  tempCoeffPmax: number; // %/°C
  tempCoeffVoc: number;  // %/°C
  tempCoeffIsc: number;  // %/°C
  
  // Dimensões físicas
  length: number;        // mm
  width: number;         // mm
  thickness: number;     // mm
  weight: number;        // kg
  
  // Sistema de tecnologias
  technology: string[];  // Array de tags selecionáveis
  
  // Garantias
  warrantyFactory: number; // anos
  warrantyPerformance: number; // anos
  
  // Datasheet
  datasheetUrl?: string;
}
```

#### Inverter Interface (Expandida)
```typescript
interface Inverter {
  // Campos básicos existentes
  id: string;
  manufacturer: string;
  model: string;
  
  // Especificações DC
  maxDcPower: number;
  maxDcVoltage: number;
  minDcVoltage: number;
  nominalDcVoltage: number;
  maxDcCurrent: number;
  mpptChannels: number;
  
  // Especificações AC
  nominalAcPower: number;
  maxAcPower: number;
  nominalAcVoltage: number;
  acFrequency: number;
  phases: 1 | 3;
  
  // Eficiência
  maxEfficiency: number;
  euEfficiency: number;
  mpptEfficiency: number;
  
  // Proteções
  protections: string[]; // Array de proteções
  
  // Especificações físicas
  dimensions: {
    length: number;
    width: number;
    height: number;
    weight: number;
  };
  
  // Condições ambientais
  operatingTempRange: {
    min: number;
    max: number;
  };
  
  // Garantias
  warranty: number; // anos
  expectedLifetime: number; // anos
  
  // Datasheet
  datasheetUrl?: string;
}
```

### 5. Sistema de Simulação Avançada

#### PVSolImporter Component
```typescript
interface PVSolData {
  month: string;
  generation: number; // kWh
}

interface PVSolImporterProps {
  onDataImport: (data: PVSolData[]) => void;
  onValidationError: (errors: string[]) => void;
}
```

**Design Decisions:**
- Parser para formato tabular PV*Sol (Mês x Gerador)
- Validação de dados importados
- Toggle entre simulação básica e dados PV*Sol
- Integração com sistema de simulação existente

### 6. Sistema Financeiro e Propostas

#### FinancialKit Interface
```typescript
interface FinancialKit {
  id: string;
  name: string;
  modules: SolarModule[];
  inverters: Inverter[];
  accessories: Accessory[];
  totalCost: number;
  installationCost: number;
  margin: number;
}
```

#### ExcelImporter Component
```typescript
interface ExcelImporterProps {
  onImport: (kits: FinancialKit[]) => void;
  templateUrl: string;
  validationRules: ValidationRule[];
}
```

#### ProposalTemplate Interface
```typescript
interface ProposalTemplate {
  id: string;
  name: string;
  description: string;
  layout: 'aida' | 'data-focused' | 'storytelling' | 'corporate' | 'replica';
  customizable: boolean;
}
```

### 7. Sistema de Upload de Arquivos

#### FileUpload Component
```typescript
interface FileUploadProps {
  acceptedTypes: string[];
  maxSize: number; // bytes
  onUpload: (file: File) => Promise<string>; // returns URL
  onRemove: (url: string) => Promise<void>;
}
```

**Design Decisions:**
- Validação de tipo de arquivo (apenas PDF para datasheets)
- Limite de tamanho de arquivo (10MB)
- Integração com Supabase Storage
- Preview e remoção de arquivos

## Data Models

### Database Schema Extensions

#### Módulos Solares (solar_modules)
```sql
ALTER TABLE solar_modules ADD COLUMN IF NOT EXISTS voc DECIMAL(8,2);
ALTER TABLE solar_modules ADD COLUMN IF NOT EXISTS isc DECIMAL(8,2);
ALTER TABLE solar_modules ADD COLUMN IF NOT EXISTS vmp DECIMAL(8,2);
ALTER TABLE solar_modules ADD COLUMN IF NOT EXISTS imp DECIMAL(8,2);
ALTER TABLE solar_modules ADD COLUMN IF NOT EXISTS temp_coeff_pmax DECIMAL(5,3);
ALTER TABLE solar_modules ADD COLUMN IF NOT EXISTS temp_coeff_voc DECIMAL(5,3);
ALTER TABLE solar_modules ADD COLUMN IF NOT EXISTS temp_coeff_isc DECIMAL(5,3);
ALTER TABLE solar_modules ADD COLUMN IF NOT EXISTS dimensions JSONB;
ALTER TABLE solar_modules ADD COLUMN IF NOT EXISTS technology TEXT[];
ALTER TABLE solar_modules ADD COLUMN IF NOT EXISTS warranty_factory INTEGER;
ALTER TABLE solar_modules ADD COLUMN IF NOT EXISTS warranty_performance INTEGER;
ALTER TABLE solar_modules ADD COLUMN IF NOT EXISTS datasheet_url TEXT;
```

#### Inversores (inverters)
```sql
ALTER TABLE inverters ADD COLUMN IF NOT EXISTS dc_specs JSONB;
ALTER TABLE inverters ADD COLUMN IF NOT EXISTS ac_specs JSONB;
ALTER TABLE inverters ADD COLUMN IF NOT EXISTS efficiency JSONB;
ALTER TABLE inverters ADD COLUMN IF NOT EXISTS protections TEXT[];
ALTER TABLE inverters ADD COLUMN IF NOT EXISTS physical_specs JSONB;
ALTER TABLE inverters ADD COLUMN IF NOT EXISTS environmental_specs JSONB;
ALTER TABLE inverters ADD COLUMN IF NOT EXISTS warranty INTEGER;
ALTER TABLE inverters ADD COLUMN IF NOT EXISTS expected_lifetime INTEGER;
ALTER TABLE inverters ADD COLUMN IF NOT EXISTS datasheet_url TEXT;
```

### Estado da Aplicação

#### Gerenciamento de Estado
- **React Context**: Para estado global da aplicação
- **Local State**: Para componentes específicos
- **Supabase Realtime**: Para sincronização de dados
- **Demo Data Service**: Para dados de demonstração em localhost

## Error Handling

### Estratégia de Tratamento de Erros

#### Níveis de Erro
1. **Validação de Entrada**: Validação em tempo real nos formulários
2. **Erros de API**: Tratamento de falhas de comunicação
3. **Erros de Upload**: Validação de arquivos e limites
4. **Erros de Importação**: Validação de dados Excel/PV*Sol

#### Componentes de Erro
```typescript
interface ErrorBoundaryProps {
  fallback: React.ComponentType<{error: Error}>;
  onError?: (error: Error) => void;
}

interface ToastErrorProps {
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}
```

### Recuperação de Erros
- **Retry Logic**: Para falhas de rede temporárias
- **Fallback UI**: Interfaces alternativas para falhas críticas
- **Data Recovery**: Backup automático de dados em localStorage
- **Version Rollback**: Capacidade de reverter para versão estável

## Testing Strategy

### Estratégia de Testes

#### Testes Unitários
- **Componentes**: Testes de renderização e interação
- **Serviços**: Testes de lógica de negócio
- **Hooks**: Testes de custom hooks
- **Utilitários**: Testes de funções auxiliares

#### Testes de Integração
- **Fluxos de Usuário**: Testes end-to-end críticos
- **APIs**: Testes de integração com Supabase
- **Upload de Arquivos**: Testes de upload e validação
- **Importação de Dados**: Testes de Excel e PV*Sol

#### Testes de Regressão
- **Funcionalidades Existentes**: Garantir que não há quebras
- **Performance**: Monitoramento de tempo de carregamento
- **Responsividade**: Testes em diferentes dispositivos
- **Compatibilidade**: Testes em diferentes navegadores

### Ferramentas de Teste
- **Vitest**: Framework de testes unitários
- **React Testing Library**: Testes de componentes
- **Playwright**: Testes end-to-end
- **MSW**: Mock de APIs para testes

## Performance Considerations

### Otimizações de Performance

#### Carregamento
- **Code Splitting**: Divisão de código por rotas
- **Lazy Loading**: Carregamento sob demanda de componentes
- **Image Optimization**: Otimização de imagens e PDFs
- **Bundle Analysis**: Monitoramento do tamanho do bundle

#### Runtime
- **Debouncing**: Para buscas e validações
- **Memoization**: Para cálculos complexos
- **Virtual Scrolling**: Para listas grandes
- **Caching**: Cache de dados frequentemente acessados

#### Database
- **Indexing**: Índices para consultas frequentes
- **Query Optimization**: Otimização de consultas Supabase
- **Connection Pooling**: Gerenciamento eficiente de conexões
- **Data Pagination**: Paginação para grandes datasets

## Security Considerations

### Segurança

#### Autenticação e Autorização
- **Supabase Auth**: Sistema de autenticação robusto
- **Row Level Security**: Políticas de segurança no banco
- **JWT Validation**: Validação de tokens
- **Session Management**: Gerenciamento seguro de sessões

#### Upload de Arquivos
- **File Type Validation**: Validação rigorosa de tipos
- **Size Limits**: Limites de tamanho de arquivo
- **Virus Scanning**: Integração com antivírus (futuro)
- **Access Control**: Controle de acesso a arquivos

#### Dados Sensíveis
- **Data Encryption**: Criptografia de dados sensíveis
- **Input Sanitization**: Sanitização de entradas
- **SQL Injection Prevention**: Prevenção através do Supabase
- **XSS Protection**: Proteção contra cross-site scripting

## Deployment Strategy

### Estratégia de Deploy

#### Ambientes
- **Development**: Localhost com dados de demonstração
- **Staging**: Ambiente de testes com dados reais
- **Production**: Ambiente de produção com Supabase

#### Pipeline de Deploy
1. **Build Validation**: Verificação de build sem erros
2. **Test Execution**: Execução de todos os testes
3. **Security Scan**: Verificação de vulnerabilidades
4. **Performance Check**: Verificação de performance
5. **Deploy**: Deploy automático via GitHub/Lovable

#### Rollback Strategy
- **Version Tagging**: Tags de versão para rollback
- **Database Migrations**: Migrações reversíveis
- **Feature Flags**: Flags para desabilitar funcionalidades
- **Monitoring**: Monitoramento pós-deploy

## Monitoring and Analytics

### Monitoramento

#### Application Monitoring
- **Error Tracking**: Rastreamento de erros em produção
- **Performance Monitoring**: Métricas de performance
- **User Analytics**: Análise de uso das funcionalidades
- **Uptime Monitoring**: Monitoramento de disponibilidade

#### Business Metrics
- **Feature Usage**: Uso das novas funcionalidades
- **User Engagement**: Engajamento dos usuários
- **Conversion Rates**: Taxas de conversão de leads
- **System Performance**: Performance do sistema

## Future Considerations

### Considerações Futuras

#### Escalabilidade
- **Microservices**: Migração para arquitetura de microserviços
- **CDN Integration**: Integração com CDN para assets
- **Database Sharding**: Particionamento de dados
- **Load Balancing**: Balanceamento de carga

#### Funcionalidades Avançadas
- **AI Integration**: Integração com IA para otimização
- **Mobile App**: Aplicativo móvel nativo
- **API Public**: API pública para integrações
- **Multi-tenant**: Suporte a múltiplos inquilinos

#### Tecnologias Emergentes
- **WebAssembly**: Para cálculos complexos
- **Progressive Web App**: Funcionalidades offline
- **Real-time Collaboration**: Colaboração em tempo real
- **Blockchain Integration**: Para contratos inteligentes