# SOLARA NOVA ENERGIA - DESCRITIVO TÉCNICO DETALHADO

## 🎯 VISÃO GERAL DO PROJETO

O **Solara Nova Energia** é uma plataforma completa e inovadora para o setor de energia solar fotovoltaica no Brasil, desenvolvida com tecnologias modernas e arquitetura escalável. O sistema integra cálculos precisos baseados na Lei 14.300/2022, módulo avançado de treinamento corporativo e sistema sofisticado de geração de propostas comerciais.



## 🏗️ ARQUITETURA TÉCNICA

### Stack Tecnológico Completo
```typescript
const techStack = {
  frontend: {
    framework: 'React 18.2+',
    language: 'TypeScript 5.0+',
    bundler: 'Vite 5.0+',
    styling: 'Tailwind CSS 3.4+',
    stateManagement: 'Zustand 4.4+',
    animations: 'Framer Motion 10.0+',
    dragDrop: '@dnd-kit/core 6.0+',
    diagrams: 'React Flow 11.0+',
    charts: 'Recharts 2.8+'
  },
  backend: {
    database: 'Supabase (PostgreSQL 15)',
    auth: 'Supabase Auth',
    storage: 'Supabase Storage',
    realtime: 'Supabase Realtime',
    functions: 'Supabase Edge Functions'
  },
  deployment: {
    frontend: 'Vercel',
        monitoring: 'Vercel Analytics + Sentry'
  }
};
```




### Estrutura Modular Otimizada
```
src/
├── core/                    # 🎯 Código principal enxuto
│   ├── components/          # Componentes essenciais
│   ├── hooks/              # Hooks customizados
│   ├── services/           # Serviços principais
│   ├── types/              # Tipos TypeScript
│   └── utils/              # Utilitários essenciais
├── modules/                # 📦 Módulos específicos
│   ├── solar/              # Módulo fotovoltaico
│   ├── aqb/              # Módulo Aquecimento Banho
│   ├── aqp/              # Módulo Aquecimento Piscina
│   ├── wallbox/              # Módulo Wallbox
│   ├── training/           # Módulo de treinamento
│   └── home/          # Resumo geral com dashboard e visão de propostas geradas no dia e no mês, orçamento em aberto, total e perdido,e outras informações
├── shared/                 # 🔄 Recursos compartilhados
│   ├── ui/                 # Design system
│   ├── layouts/            # Layouts base
│   └── constants/          # Constantes globais
└── docs/                   # 📚 Documentação
```

## ⚡ MÓDULOS PRINCIPAIS

### 1. CRITÉRIOS DE SUCESSO

1. Evitar Duplicação de Código (DRY - Don't Repeat Yourself)
2. Eliminar Código Não Utilizado (Dead Code)
3. Uso Consistente de WpeScript
4. Componentes Bem Estruturados
5. Gerenciamento de Estado Eficiente
6. Uso Adequado de Hooks React
7. Separação de Lógica e Apresentação
8. Tratamento Adequado de Erros
9. Performance e Otimizações
10. Organização e Estrutura do Projeto
11. Acessibilidade (ally)
12. Testes Adequados
13. Todos os botões e redirecionamentos funcionais
14.  Cálculo financeiro com as principais informações (VPL, Economia Bruta, Payback, Payback Descontado, Payback Financiado, TIR, Rentabilidade mensal, entre outros)
15. Opção de criação/edição de propostas como templates, com drag-and-drop e opções de formatação em A4 (Estilo Word) e 16:4 (Estilo PowerPoint)
16. Análise financeira considerando inflação anual, degradação do sistema, OPEX, cobrança de icms na TUSD, cobrança do fio B (lei 14.300) e outras regras que se apliquem, para um prazo de 25 anos
17. Ter uma parte de Roadmap com futuras atualizações para serem solicitadas e votadas pelos usuários, com tags de Votação, Planejado, Em Execução, Finalizo.
18. Módulo Treinamentos:
Andamento de treinamento (quais aulas já assistiu e percentual);
Possibilidade de importar video-aulas na própria VPS (referencia pandavideo.com.br ou bunny.net), playbooks, 
Montar fluxogramas e mind maps (referencia: Whimsical e MindMeister)
Desenhar processos, 
Realizar consultas e visualizar novidades,
Realizar avalição dos colaboradores, ver andamento de estudo e mais o que tiver de ideia.
sistema de edição tipo Notion
Notificações de conclusão, progresso e outras, 


### 2. MÓDULO FOTOVOLTAICO (95% Concluído)

**Funcionalidades Implementadas:**
- ✅ **Calculadora Solar Avançada**: Dimensionamento baseado na Lei 14.300/2022
- ✅ **Análise Financeira Completa**: VPL, TIR, Payback com precisão regulamentar, payback em caso de financiamento, Economia bruta, LCOE
- ✅ **Gestão de Créditos FIFO**: Sistema conforme normativas ANEEL
- ✅ **Base de Tarifas**: Concessionárias do Rio de Janeiro com cache otimizado (possibilidade de expansão para outros estados)
- ✅ **Interface Responsiva**: Dashboard com gráficos interativos
- ❌ **Exibição de comparação do R$/Wp (Projeto) x R$/Wp (Greener) **: Possibilidade de importar os valores de estimativa da greener

**Características Técnicas:**
```typescript
// Cálculos regulamentares corretos
const calcularFioB = (anoInstalacao: number): number => {
  if (anoInstalacao <= 2022) return 0; // Isento por 25 anos
  if (anoInstalacao === 2023) return 0.15; // 15%
  if (anoInstalacao === 2024) return 0.30; // 30%
  // Progressão correta até 2028
};
```

**Melhorias Planejadas:**
- ⌛ Expansão para outros estados (SP, MG, PR)
- ⌛ Integração com APIs de preços em tempo real
- ⌛ Otimização com Web Workers para cálculos complexos

### 3. MÓDULO DE TREINAMENTO CORPORATIVO (75% Concluído)

**Funcionalidades Implementadas:**
- ✅ **Sistema Base**: Estrutura de módulos e conteúdo
- ✅ **Tracking de Progresso**: Acompanhamento detalhado por usuário
- ✅ **Sistema de Avaliações**: Questionários com feedback automático
- ✅ **Gamificação**: Pontos, badges e ranking
- ✅ **Relatórios**: Dashboard de performance

**Funcionalidades Pendentes (Prioridade Alta):**
- ❌ **Sistema de Upload de Vídeos VPS Própria**
- ❌ **Editor de Playbooks Estilo Notion**
- ❌ **Editor de Fluxogramas/Mind Maps - estilo Whimsical e MindMeister**
- ❌ **Sistema de Certificação Automática**
- ❌ ** Notificações (tempo sem assistir treinamento, treinamento sem conclusão, etc)
**

**Especificações do Sistema de Vídeos:**
```typescript
interface VideoUploadSystem {
  // Upload para VPS própria (sem custos externos)
  uploadToVPS: (file: File) => Promise<VideoMetadata>;
  // Streaming protegido com autenticação por token
  generateStreamingUrls: (videoId: string) => Promise<StreamingUrls>;
  // Player customizado com proteção contra download
  addWatermark: (videoUrl: string, userInfo: UserInfo) => string;
  // Compressão automática em múltiplas qualidades
  compressVideo: (videoUrl: string, quality: VideoQuality) => Promise<string>;
}
```

**Segurança Implementada:**
- 🔒 Row Level Security (RLS) para controle de acesso
- 🔒 URLs assinadas com expiração
- 🔒 Watermark dinâmico por usuário
- 🔒 Verificação de domínio
- 🔒 Player protegido contra download

### 4. SISTEMA DE PROPOSTAS (60% Concluído)

**Funcionalidades Implementadas:**
- ✅ **Editor Básico**: Criação simples de propostas
- ✅ **Sistema de Templates**: Modelos reutilizáveis
- ✅ **Compartilhamento Seguro**: URLs com tracking (possibilidade de ver o ip e horarios que a proposta foi visualizada - ex.: Visualizado dia 01/01/2025 às 13:47 - ip 123.456.789)
- ✅ **Geração de PDF**: Funcionalidade básica

**Gaps Críticos Identificados:**
- ❌ **Editor Drag-and-Drop**: Interface visual avançada com cards, podendo ser tabelas, gráficos, valores como Tempo de PAyback, Quantidade, Potência , Modelo e Fabricante de Módulos e Inversores, entre outras informações
- ❌ **Upload de Modelos**: Suporte para DOC, DOCX, PDF, PPT
- ❌ **Formatos Diferenciados**: A4 (Word) e 16:9 (PowerPoint)
- ❌ **Sistema de Animações**: Transições fade-in/fade-out e outras animações
- ❌ **Canvas Infinito**: Zoom, pan e elementos visuais
- ❌ **Geração de apresentações online**

**Especificações do Editor Avançado:**
```typescript
interface ProposalEditor {
  canvas: CanvasElement[];
  dragElement: (elementId: string, position: Position) => void;
  resizeElement: (elementId: string, size: Size) => void;
  addElement: (type: ElementType) => void;
  formatDocument: (format: 'A4' | '16:9') => void;
  addAnimation: (elementId: string, animation: AnimationType) => void;
}
```

## 5. 🔐 SISTEMA DE AUTENTICAÇÃO E PERMISSÕES

### Níveis de Acesso Detalhados

| Funcionalidade | Super Admin | Gerente | Engenheiro | Vendedor | Instalador |
|----------------|-------|---------|------------|----------|------------|
| Criar Módulos de Treinamento | ✅ | ✅ | ❌ | ❌ | ❌ |
| Editar Conteúdo | ✅ | ✅ | ✅* | ❌ | ❌ |
| Upload de Vídeos | ✅ | ✅ | ✅* | ❌ | ❌ |
| Criar Propostas | ✅ | ✅ | ✅ | ✅ | ❌ |
| Editar Templates | ✅ | ✅ | ❌ | ❌ | ❌ |
| Acessar Relatórios | ✅ | ✅ | ✅* | ✅* | ✅* |
| Gerenciar Usuários | ✅ | ✅* | ❌ | ❌ | ❌ |

*Restrito à sua categoria/departamento

### Categorias de Treinamento
```typescript
const trainingCategories = [
  {
    id: 'comercial',
    name: 'Treinamento Comercial',
    accessLevels: ['admin', 'gerente', 'vendedor'],
    requiredCertifications: ['vendas_basico']
  },
  {
    id: 'engenharia',
    name: 'Treinamento de Engenharia',
    accessLevels: ['admin', 'gerente', 'engenheiro'],
    requiredCertifications: ['tecnico_solar', 'nr35']
  },
  {
    id: 'instalacao',
    name: 'Treinamento de Instalação',
    accessLevels: ['admin', 'gerente', 'engenheiro', 'instalador'],
    requiredCertifications: ['nr35', 'nr10']
  }
];
```

## 📊 MODELO DE DADOS

### Entidades Principais
```sql
-- Estrutura principal do banco
CREATE TABLE training_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('comercial', 'engenharia', 'instalacao', 'geral')),
    access_level VARCHAR(50) NOT NULL,
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE training_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID REFERENCES training_modules(id),
    type VARCHAR(50) CHECK (type IN ('video', 'playbook', 'diagram', 'assessment')),
    title VARCHAR(255) NOT NULL,
    video_url VARCHAR(500),
    duration INTEGER DEFAULT 0,
    is_required BOOLEAN DEFAULT false
);

CREATE TABLE user_training_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    content_id UUID REFERENCES training_content(id),
    progress_percentage INTEGER DEFAULT 0,
    completed_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id, content_id)
);
```

## 6. CONFIGURAÇÕES
Deve pertencer a aba de configurações:
Dados do usuário (nome, função, senha/alterar a senha, adicionar foto de perfil)
Adicionar/editar dados financeiros  (instituições financeiras, taxa de juros, inflação, etc) [acessos: super admin e gerente]
Outras configurações

## 🚀 ROADMAP DE IMPLEMENTAÇÃO 2025

### FASE 1 - LIMPEZA E OTIMIZAÇÃO (2 semanas)
- ✅ **Reorganização de Código**: Estrutura modular otimizada
- ⌛ **Performance**: Bundle size 2MB → 500KB (75% redução)
- ⌛ **Code Splitting**: Lazy loading de módulos
- ⌛ **Otimização de Assets**: WebP, lazy loading

### FASE 2 - MÓDULO DE TREINAMENTO (6 semanas)
- ⌛ **Sistema de Upload VPS** (3 semanas): Hospedagem própria com segurança
- ⌛ **Editor de Playbooks** (3 semanas): Interface estilo Notion
- ⌛ **Editor de Fluxogramas** (2 semanas): React Flow + D3.js

### FASE 3 - SISTEMA DE PROPOSTAS (4 semanas)
- ⌛ **Editor Drag-and-Drop** (2 semanas): Canvas infinito
- ⌛ **Upload de Modelos** (1 semana): DOC, DOCX, PDF, PPT
- ⌛ **Sistema de Animações** (1 semana): Framer Motion

### FASE 4 - UX/UI E FINALIZAÇÃO (2 semanas)
- ⌛ **Design System** (1 semana): Tokens e componentes
- ⌛ **Micro-interações** (1 semana): Animações e feedback

## 💰 INVESTIMENTO E RECURSOS

### Estimativa Detalhada
```
💰 RESUMO FINANCEIRO
├── Desenvolvimento: R$ 180.800
├── Infraestrutura: R$ 5.160
├── Contingência (10%): R$ 18.596
└── TOTAL: R$ 204.556

📊 DISTRIBUIÇÃO POR FASE
├── Fase 1 (Limpeza): R$ 12.000 (6%)
├── Fase 2 (Treinamento): R$ 96.000 (47%)
├── Fase 3 (Propostas): R$ 48.000 (23%)
└── Fase 4 (UX/UI): R$ 24.000 (12%)
```

### Equipe Necessária
- **2 Desenvolvedores Sênior**: R$ 84.000
- **2 Desenvolvedores Pleno**: R$ 67.200
- **1 Designer UX/UI**: R$ 16.000
- **1 DevOps Engineer**: R$ 10.400
- **1 QA Tester**: R$ 3.200

## 📈 MÉTRICAS DE SUCESSO

### KPIs Técnicos
| Métrica | Atual | Meta | Melhoria |
|---------|-------|------|----------|
| Bundle Size | 2MB | 500KB | 75% ↓ |
| Page Load Time | 3.2s | 1.5s | 53% ↓ |
| Lighthouse Score | 65 | 90+ | 38% ↑ |
| TypeScript Coverage | 85% | 95% | 12% ↑ |
| ESLint Warnings | 56 | 0 | 100% ↓ |

### KPIs de Negócio
| Métrica | Baseline | Meta 3 meses | Meta 6 meses |
|---------|----------|--------------|---------------|
| Usuários Ativos | 150 | 300 | 500 |
| Tempo na Plataforma | 12 min | 25 min | 35 min |
| Taxa de Conclusão Treinamentos | 45% | 70% | 85% |
| Propostas Geradas/Mês | 80 | 150 | 250 |
| NPS Score | 6.5 | 8.0 | 8.5 |

## 🎯 DIFERENCIAIS COMPETITIVOS

### Inovações Técnicas
- **VPS Própria para Vídeos**: Redução de custos e controle total
- **Editor Estilo Notion**: Interface intuitiva para playbooks
- **Drag-and-Drop Avançado**: Propostas visuais profissionais
- **Cálculos Regulamentares**: 100% conforme Lei 14.300
- **Gamificação Corporativa**: Engajamento em treinamentos

### Segurança e Compliance
- **Row Level Security (RLS)**: Controle granular de acesso
- **Watermark Dinâmico**: Proteção de conteúdo por usuário
- **Auditoria Completa**: Logs de todas as ações
- **LGPD Compliance**: Proteção de dados pessoais
- **Backup Automático**: Recuperação de desastres

## 🔮 VISÃO FUTURA

### Expansão Planejada
- **Outros Estados**: SP, MG, PR, SC (Q2 2025)
- **Mobile App**: Aplicativo nativo (Q4 2025)
- **IA Integrada**: Assistente virtual (Q1 2026)
- **Marketplace**: Equipamentos e serviços (Q2 2026)

### Potencial de Mercado
- **Mercado Solar BR**: R$ 15 bilhões (2024)
- **Crescimento Anual**: 40% (próximos 5 anos)
- **Empresas Alvo**: 5.000+ no Brasil
- **ROI Projetado**: 300% em 24 meses

---

**O Solara Nova Energia representa a evolução natural do setor solar brasileiro, combinando tecnologia de ponta, conformidade regulamentar e experiência do usuário excepcional. Com 85% já implementado e um roadmap claro para os próximos 14 semanas, a plataforma está posicionada para se tornar a referência do mercado nacional.**
        


