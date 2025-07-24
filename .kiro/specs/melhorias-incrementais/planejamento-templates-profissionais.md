# 📋 Planejamento: Templates Profissionais de Proposta

## 🎯 Objetivo

Recriar completamente o sistema de templates de proposta do SolarCalc Pro, implementando modelos profissionais em formato A4 (PDF) e apresentação 16:9 (slides), baseados nas especificações detalhadas do arquivo `templates-modelo.md`.

---

## 🔍 Análise da Situação Atual

### Problemas Identificados
- ❌ Templates atuais não são profissionais
- ❌ Falta de padronização visual
- ❌ Ausência de sistema drag-and-drop
- ❌ Campos dinâmicos limitados
- ❌ Sem controle de compartilhamento avançado
- ❌ Falta de analytics de visualização

### Oportunidades
- ✅ Base técnica sólida (React + TypeScript)
- ✅ Sistema de dados já estruturado
- ✅ Integração com Supabase funcionando
- ✅ Componentes UI modernos (Shadcn)

---

## 🚀 Roadmap de Implementação

### **FASE 1: Fundação Técnica** (2-3 semanas)

#### 1.1 Arquitetura do Sistema de Templates

**Estrutura de Pastas:**
```
src/
├── components/
│   ├── templates/
│   │   ├── TemplateEngine.tsx
│   │   ├── DragDropEditor.tsx
│   │   ├── ComponentLibrary.tsx
│   │   ├── PropertyPanel.tsx
│   │   └── renderers/
│   │       ├── A4Renderer.tsx
│   │       ├── PresentationRenderer.tsx
│   │       └── ComponentRenderer.tsx
│   └── proposal/
│       ├── ProposalBuilder.tsx
│       ├── PDFGenerator.tsx
│       ├── SharingManager.tsx
│       └── AnalyticsDashboard.tsx
├── services/
│   ├── templateEngine.ts
│   ├── proposalService.ts
│   ├── sharingService.ts
│   └── analyticsService.ts
├── types/
│   ├── template.ts
│   ├── proposal.ts
│   └── sharing.ts
└── utils/
    ├── calculations.ts
    ├── formatters.ts
    └── placeholders.ts
```

**Tarefas Técnicas:**
- [ ] **Criar sistema de placeholders dinâmicos** (16h)
  - Engine de substituição de campos `[NOME_CLIENTE]`, `[VALOR_INVESTIMENTO]`, etc.
  - Formatação automática (moeda, data, percentual)
  - Validação de campos obrigatórios
  
- [ ] **Implementar base do editor drag-and-drop** (20h)
  - Integração com `@dnd-kit/core`
  - Componentes arrastáveis (texto, imagem, tabela, gráfico)
  - Sistema de grid e alinhamento
  
- [ ] **Configurar geração de PDF** (12h)
  - Integração com `@react-pdf/renderer`
  - Templates responsivos A4
  - Suporte a imagens e gráficos

#### 1.2 Tipos e Interfaces

```typescript
interface Template {
  id: string;
  name: string;
  type: 'A4' | 'presentation';
  pages: TemplatePage[];
  placeholders: PlaceholderConfig[];
  styles: TemplateStyles;
  metadata: TemplateMetadata;
}

interface TemplatePage {
  id: string;
  name: string;
  layout: PageLayout;
  components: TemplateComponent[];
  styles: PageStyles;
}

interface TemplateComponent {
  id: string;
  type: ComponentType;
  position: Position;
  size: Size;
  content: ComponentContent;
  styles: ComponentStyles;
  bindings: DataBinding[];
}

type ComponentType = 
  | 'text' | 'heading' | 'paragraph'
  | 'image' | 'logo' | 'chart' | 'table'
  | 'client_info' | 'system_specs' | 'financial_data'
  | 'container' | 'grid' | 'spacer' | 'page_break';
```

---

### **FASE 2: Templates Base** (3-4 semanas)

#### 2.1 Template A4 - Proposta Comercial (9 páginas)

**Página 1: Capa**
- [ ] **Layout centralizado** (4h)
  - Logo da empresa (posição configurável)
  - Título principal "PRÉ-PROPOSTA COMERCIAL"
  - Subtítulo "SISTEMA FOTOVOLTAICO CONECTADO À REDE"
  - Dados do cliente (esquerda)
  - Informações da proposta (direita)
  - Rodapé com dados da empresa

**Página 2: Benefícios e Funcionamento**
- [ ] **Layout duas colunas** (6h)
  - Lista numerada "Por que ter Energia Solar?"
  - Seção "Como Funciona?" com diagrama
  - Componente de imagem dinâmica
  - Texto explicativo formatado

**Página 3: Sobre a Empresa**
- [ ] **Layout quatro pilares** (6h)
  - Cards com ícones: Conhecimento, Segurança, Confiabilidade, Ponha na Balança
  - Texto dinâmico com placeholders da empresa
  - Design responsivo e profissional

**Página 4: Diferenciais**
- [ ] **Layout quatro blocos** (6h)
  - Projeto, Engenharia, Pós-venda, Qualidade
  - Ícones personalizados
  - Descrições detalhadas

**Página 5: Análise de Consumo**
- [ ] **Layout técnico** (8h)
  - Tabela comparativa (atual vs futuro)
  - Especificações do sistema proposto
  - Gráfico de geração mensal
  - Cálculos automáticos

**Página 6: Sustentabilidade e Cronograma**
- [ ] **Layout split vertical** (6h)
  - Métricas ambientais (CO₂, árvores)
  - Timeline do projeto (7 etapas)
  - Ícones e indicadores visuais

**Página 7: Itens Inclusos e Garantias**
- [ ] **Layout lista detalhada** (6h)
  - Equipamentos inclusos
  - Serviços inclusos
  - Garantias (módulos, inversor, mão de obra)
  - Opcionais com preços

**Página 8: Análise Econômica**
- [ ] **Layout financeiro** (8h)
  - Indicadores: VPL, TIR, Payback
  - Opções de pagamento
  - Simulação de financiamento
  - Formatação de valores em R$

**Página 9: Fluxo de Caixa**
- [ ] **Layout tabela detalhada** (8h)
  - Projeção 25 anos
  - Gráfico de economia acumulada
  - Comparação com investimentos
  - Observações técnicas

#### 2.2 Template Apresentação 16:9

- [ ] **Adaptar layouts para formato widescreen** (12h)
  - Slides com proporção 16:9
  - Navegação entre slides
  - Animações suaves
  - Modo apresentação fullscreen

---

### **FASE 3: Sistema Drag-and-Drop** (2-3 semanas)

#### 3.1 Editor Visual

- [ ] **Canvas principal** (16h)
  - Área de edição com zoom
  - Grid de alinhamento
  - Réguas e guias
  - Seleção múltipla
  
- [ ] **Biblioteca de componentes** (12h)
  - Sidebar com componentes arrastáveis
  - Categorias: Layout, Conteúdo, Mídia, Dados
  - Preview dos componentes
  - Busca e filtros
  
- [ ] **Painel de propriedades** (10h)
  - Edição de texto inline
  - Configuração de estilos
  - Vinculação de dados
  - Configurações de layout

#### 3.2 Funcionalidades Avançadas

- [ ] **Sistema de camadas** (8h)
  - Controle de z-index
  - Agrupamento de elementos
  - Bloqueio de componentes
  
- [ ] **Undo/Redo** (6h)
  - Histórico de ações
  - Atalhos de teclado
  - Estados salvos
  
- [ ] **Templates salvos** (8h)
  - Galeria de templates
  - Duplicação e customização
  - Compartilhamento entre usuários

---

### **FASE 4: Sistema de Compartilhamento** (2 semanas)

#### 4.1 Geração de Links

- [ ] **Links únicos e seguros** (8h)
  - UUID para cada proposta
  - Configurações de acesso
  - Proteção por senha
  - Data de expiração
  
- [ ] **Controle de visualizações** (6h)
  - Limite de visualizações
  - Tracking de acessos
  - Bloqueio automático

#### 4.2 Analytics Avançado

- [ ] **Dashboard de métricas** (10h)
  - Total de visualizações
  - Tempo médio de visualização
  - Dispositivos utilizados
  - Localização geográfica
  
- [ ] **Relatórios detalhados** (8h)
  - Histórico de acessos
  - Ações do usuário (download, print)
  - Notificações em tempo real
  - Exportação de dados

#### 4.3 Notificações

- [ ] **Sistema de alertas** (6h)
  - Email quando proposta é visualizada
  - Notificações push
  - Webhooks para integrações
  - Configurações personalizáveis

---

### **FASE 5: Funcionalidades Premium** (2-3 semanas)

#### 5.1 Importação de Word

- [ ] **Parser de documentos** (12h)
  - Leitura de arquivos .docx
  - Extração de texto e formatação
  - Detecção de placeholders
  - Conversão para template
  
- [ ] **Mapeamento de campos** (8h)
  - Interface para vincular dados
  - Sugestões automáticas
  - Validação de campos

#### 5.2 Colaboração

- [ ] **Edição colaborativa** (16h)
  - Múltiplos usuários simultâneos
  - Cursores em tempo real
  - Comentários e sugestões
  - Controle de conflitos
  
- [ ] **Sistema de aprovação** (10h)
  - Workflow de aprovação
  - Níveis de permissão
  - Histórico de alterações
  - Notificações de status

#### 5.3 Integrações

- [ ] **APIs externas** (12h)
  - Dados de irradiação solar
  - Tarifas de energia atualizadas
  - Validação de endereços
  - Cotações de equipamentos
  
- [ ] **CRM Integration** (8h)
  - Sincronização de leads
  - Atualização automática
  - Webhooks bidirecionais

---

## 🎨 Design System

### Paleta de Cores
```css
:root {
  /* Cores Primárias */
  --solar-primary: #f59e0b;     /* Amarelo solar */
  --solar-secondary: #0ea5e9;   /* Azul céu */
  --solar-accent: #10b981;      /* Verde sustentável */
  
  /* Cores Neutras */
  --gray-50: #f9fafb;
  --gray-100: #f3f4f6;
  --gray-200: #e5e7eb;
  --gray-300: #d1d5db;
  --gray-400: #9ca3af;
  --gray-500: #6b7280;
  --gray-600: #4b5563;
  --gray-700: #374151;
  --gray-800: #1f2937;
  --gray-900: #111827;
  
  /* Cores de Status */
  --success: #10b981;
  --warning: #f59e0b;
  --error: #ef4444;
  --info: #3b82f6;
}
```

### Tipografia
```css
/* Fontes */
--font-heading: 'Inter', sans-serif;
--font-body: 'Inter', sans-serif;
--font-mono: 'JetBrains Mono', monospace;

/* Tamanhos */
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */
--text-4xl: 2.25rem;   /* 36px */
```

### Componentes Base
- **Cards**: Sombra sutil, bordas arredondadas
- **Botões**: Estados hover/active bem definidos
- **Inputs**: Foco com cor primária
- **Tabelas**: Zebra striping, headers destacados
- **Gráficos**: Cores consistentes com o design system

---

## 📊 Métricas de Sucesso

### Performance
- **Tempo de carregamento**: < 2s para templates
- **Geração de PDF**: < 5s para propostas completas
- **Responsividade**: 100% em dispositivos móveis

### Usabilidade
- **Facilidade de uso**: 4.5/5 em testes de usuário
- **Tempo para criar proposta**: < 10 minutos
- **Taxa de adoção**: 90% dos usuários ativos

### Qualidade
- **Bugs críticos**: 0
- **Cobertura de testes**: > 80%
- **Performance Lighthouse**: > 90

### Negócio
- **Conversão de propostas**: +25%
- **Tempo de fechamento**: -30%
- **Satisfação do cliente**: +40%

---

## 🛠️ Stack Tecnológico

### Frontend
- **React 18** + **TypeScript**
- **Tailwind CSS** para estilização
- **Shadcn/ui** para componentes base
- **@dnd-kit/core** para drag-and-drop
- **@react-pdf/renderer** para geração de PDF
- **Recharts** para gráficos
- **Framer Motion** para animações

### Backend
- **Supabase** (já integrado)
- **PostgreSQL** para dados
- **Storage** para arquivos
- **Edge Functions** para processamento

### Ferramentas
- **Vite** para build
- **Vitest** para testes
- **Playwright** para E2E
- **ESLint** + **Prettier** para qualidade

---

## 📅 Cronograma Detalhado

### Semana 1-2: Fundação
- Setup da arquitetura
- Sistema de placeholders
- Base do editor drag-and-drop

### Semana 3-5: Templates A4
- Implementação das 9 páginas
- Sistema de cálculos
- Geração de PDF

### Semana 6-7: Template Apresentação
- Adaptação para 16:9
- Modo apresentação
- Navegação entre slides

### Semana 8-10: Drag-and-Drop
- Editor visual completo
- Biblioteca de componentes
- Painel de propriedades

### Semana 11-12: Compartilhamento
- Sistema de links
- Analytics
- Notificações

### Semana 13-15: Funcionalidades Premium
- Importação Word
- Colaboração
- Integrações

### Semana 16: Testes e Deploy
- Testes completos
- Otimizações
- Deploy em produção

---

## 🎯 Entregáveis

### MVP (Mínimo Viável)
- ✅ Template A4 com 9 páginas profissionais
- ✅ Sistema de placeholders dinâmicos
- ✅ Geração de PDF de alta qualidade
- ✅ Compartilhamento básico com links

### Versão Completa
- ✅ Editor drag-and-drop completo
- ✅ Template apresentação 16:9
- ✅ Analytics avançado
- ✅ Sistema de colaboração
- ✅ Importação de Word
- ✅ Integrações externas

---

## 🚨 Riscos e Mitigações

### Riscos Técnicos
- **Complexidade do drag-and-drop**
  - *Mitigação*: Usar biblioteca testada (@dnd-kit)
  - *Plano B*: Implementação simplificada

- **Performance na geração de PDF**
  - *Mitigação*: Otimização e cache
  - *Plano B*: Geração server-side

### Riscos de Prazo
- **Subestimativa de complexidade**
  - *Mitigação*: Buffer de 20% no cronograma
  - *Plano B*: Priorizar MVP

### Riscos de Qualidade
- **Bugs em produção**
  - *Mitigação*: Testes automatizados extensivos
  - *Plano B*: Rollback rápido

---

## 💡 Próximos Passos

1. **Aprovação do planejamento** (1 dia)
2. **Setup do ambiente de desenvolvimento** (2 dias)
3. **Início da Fase 1: Fundação Técnica** (imediato)
4. **Reuniões semanais de acompanhamento**
5. **Demos quinzenais para stakeholders**

---

**Documento criado em**: Janeiro 2025  
**Estimativa total**: 15-16 semanas  
**Esforço estimado**: 300-400 horas  
**Prioridade**: ALTA  
**Status**: Aguardando Aprovação