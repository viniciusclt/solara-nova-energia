# Sistema de Templates de Diagramas

## Visão Geral

O sistema de templates permite aos usuários criar, gerenciar e aplicar templates pré-definidos para acelerar a criação de diagramas. O sistema inclui templates padrão e permite a criação de templates personalizados.

## Arquitetura

### Componentes Principais

1. **DiagramTemplateService** (`src/services/DiagramTemplateService.ts`)
   - Gerencia CRUD de templates
   - Controla estatísticas de uso
   - Gera thumbnails automáticos
   - Inclui templates padrão

2. **TemplateSelector** (`src/components/diagrams/TemplateSelector.tsx`)
   - Interface para seleção de templates
   - Funcionalidades de busca e filtro
   - Preview de templates
   - Aplicação de templates

3. **Tipos TypeScript** (`src/types/diagramTemplates.ts`)
   - Definições de tipos para templates
   - Interfaces para serviços
   - Configurações de aplicação

### Integração

O sistema está integrado ao **UnifiedDiagramEditor** através de:
- Botão "Templates" na toolbar
- Modal de seleção de templates
- Aplicação automática de templates

## Funcionalidades

### Templates Padrão

1. **Organograma Básico**
   - CEO, Diretores, Gerentes
   - Estrutura hierárquica
   - Categoria: Organização

2. **Processo de Aprovação**
   - Fluxo BPMN básico
   - Início, tarefas, decisões, fim
   - Categoria: Processo

3. **Mapa Mental de Projeto**
   - Nó central com ramificações
   - Estrutura de mindmap
   - Categoria: Planejamento

### Criação de Templates

```typescript
// Exemplo de criação de template
const template: DiagramTemplate = {
  id: 'custom-template',
  name: 'Meu Template',
  description: 'Template personalizado',
  category: 'custom',
  difficulty: 'beginner',
  tags: ['custom', 'exemplo'],
  nodes: [...], // Nós do diagrama
  edges: [...], // Conexões
  thumbnail: 'data:image/svg+xml;base64,...',
  metadata: {
    author: 'Usuario',
    version: '1.0.0'
  }
};

await diagramTemplateService.createTemplate(template);
```

### Aplicação de Templates

```typescript
// Aplicar template substituindo diagrama atual
const applyData: ApplyTemplateData = {
  templateId: 'template-id',
  replaceExisting: true,
  position: { x: 100, y: 100 },
  scale: 1.0
};

await handleApplyTemplate(applyData);
```

## Categorias de Templates

- **organization**: Organogramas e estruturas hierárquicas
- **process**: Fluxos de processo e BPMN
- **planning**: Mapas mentais e planejamento
- **custom**: Templates personalizados
- **flowchart**: Fluxogramas gerais
- **network**: Diagramas de rede
- **database**: Modelos de dados

## Níveis de Dificuldade

- **beginner**: Templates simples e básicos
- **intermediate**: Templates com complexidade média
- **advanced**: Templates complexos e especializados

## Persistência

Os templates são armazenados no `localStorage` do navegador:
- Chave: `diagram-templates`
- Formato: JSON serializado
- Backup automático de templates padrão

## Estatísticas de Uso

O sistema rastreia:
- Número de vezes que cada template foi usado
- Data da última utilização
- Templates mais populares

## Funcionalidades Avançadas

### Busca e Filtros
- Busca por nome, descrição e tags
- Filtro por categoria
- Filtro por nível de dificuldade
- Ordenação por popularidade ou data

### Import/Export
- Exportar templates como JSON
- Importar templates de arquivos
- Compartilhamento de templates

### Thumbnails
- Geração automática de miniaturas SVG
- Preview visual dos templates
- Otimização para performance

## Uso no Editor

1. **Acessar Templates**:
   - Clique no botão "Templates" na toolbar
   - Ou use o atalho de teclado (se configurado)

2. **Selecionar Template**:
   - Navegue pelas categorias
   - Use a busca para encontrar templates específicos
   - Visualize o preview antes de aplicar

3. **Aplicar Template**:
   - Escolha se deseja substituir o diagrama atual
   - Configure posição e escala se necessário
   - Confirme a aplicação

4. **Personalizar**:
   - Edite os elementos do template aplicado
   - Salve como novo template se desejar

## Extensibilidade

O sistema foi projetado para ser extensível:
- Novos tipos de templates podem ser adicionados
- Categorias personalizadas
- Integração com APIs externas
- Plugins de templates

## Considerações de Performance

- Templates são carregados sob demanda
- Thumbnails são otimizados para tamanho
- Cache inteligente de templates frequentes
- Lazy loading de previews

## Próximos Passos

1. **Templates Online**: Sincronização com servidor
2. **Marketplace**: Compartilhamento público de templates
3. **IA Generativa**: Criação automática de templates
4. **Colaboração**: Templates compartilhados em equipe
5. **Versionamento**: Controle de versões de templates