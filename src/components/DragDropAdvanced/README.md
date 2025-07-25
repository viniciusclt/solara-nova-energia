# Sistema Drag & Drop Avançado

Um sistema completo de arrastar e soltar com funcionalidades avançadas para criação de interfaces dinâmicas.

## 🚀 Funcionalidades

### Core Features
- **Drag & Drop Intuitivo**: Arraste e solte itens entre containers
- **Múltiplos Layouts**: Livre, horizontal, vertical e grade
- **Seleção Múltipla**: Selecione vários itens com Ctrl/Cmd
- **Snap to Grid**: Encaixe automático na grade
- **Undo/Redo**: Histórico completo de ações

### Funcionalidades Avançadas
- **Alinhamento Automático**: Alinhe itens à esquerda, centro, direita, topo, meio, base
- **Distribuição Inteligente**: Distribua itens horizontal, vertical ou em grade
- **Controle de Visibilidade**: Mostre/oculte itens
- **Sistema de Bloqueio**: Bloqueie itens para evitar edição acidental
- **Z-Index Management**: Controle de camadas
- **Constraints**: Limite tipos de itens e quantidade por container

## 📦 Componentes

### DragDropProvider
Contexto principal que gerencia todo o estado do sistema.

```tsx
import { DragDropProvider } from '@/components/DragDropAdvanced';

function App() {
  return (
    <DragDropProvider>
      {/* Seus componentes aqui */}
    </DragDropProvider>
  );
}
```

### DragDropContainer
Container que aceita itens arrastáveis.

```tsx
import { DragDropContainer } from '@/components/DragDropAdvanced';

<DragDropContainer
  containerId="my-container"
  title="Meu Container"
  layout="free" // 'free' | 'horizontal' | 'vertical' | 'grid'
  showGrid={true}
  allowReorder={true}
/>
```

### DragDropItem
Item arrastável com controles avançados.

```tsx
import { DragDropItem } from '@/components/DragDropAdvanced';

const item = {
  id: 'item-1',
  type: 'text',
  content: { title: 'Meu Texto' },
  position: { x: 100, y: 50 }
};

<DragDropItem
  item={item}
  containerId="my-container"
  showControls={true}
/>
```

### DragDropToolbar
Barra de ferramentas com controles avançados.

```tsx
import { DragDropToolbar } from '@/components/DragDropAdvanced';

<DragDropToolbar
  onSave={() => console.log('Salvando...')}
  onExport={() => console.log('Exportando...')}
  onImport={() => console.log('Importando...')}
/>
```

## 🎯 Tipos de Itens Suportados

### Text
```tsx
{
  type: 'text',
  content: {
    title: 'Título do texto',
    description: 'Descrição opcional'
  }
}
```

### Button
```tsx
{
  type: 'button',
  content: {
    title: 'Texto do botão',
    variant: 'default' | 'outline' | 'ghost'
  }
}
```

### Image
```tsx
{
  type: 'image',
  content: {
    title: 'Nome da imagem',
    url: 'https://example.com/image.jpg',
    alt: 'Texto alternativo'
  }
}
```

### Card
```tsx
{
  type: 'card',
  content: {
    title: 'Título do card',
    description: 'Descrição do card'
  }
}
```

## 🛠️ Hooks e Utilitários

### useDragDrop
Hook principal para acessar o estado e ações do sistema.

```tsx
import { useDragDrop } from '@/components/DragDropAdvanced';

function MyComponent() {
  const {
    containers,
    selectedItems,
    showGrid,
    snapToGrid,
    addItem,
    updateItem,
    deleteItem,
    selectItem,
    alignItems,
    distributeItems
  } = useDragDrop();

  // Usar as funções conforme necessário
}
```

### Funções Utilitárias

```tsx
import { 
  createDragDropItem, 
  createDragDropContainer,
  itemTemplates,
  layoutPresets
} from '@/components/DragDropAdvanced';

// Criar novo item
const newItem = createDragDropItem('text', {
  title: 'Novo texto'
}, { x: 100, y: 100 });

// Criar novo container
const newContainer = createDragDropContainer('free', ['text', 'button']);

// Usar templates predefinidos
const textItem = { ...itemTemplates.text };
const buttonItem = { ...itemTemplates.button };

// Aplicar presets de layout
const freeLayout = layoutPresets.freeForm;
const gridLayout = layoutPresets.gridLayout;
```

## 🎨 Layouts Disponíveis

### Free (Livre)
- Posicionamento absoluto
- Coordenadas X, Y
- Ideal para design livre

### Horizontal
- Itens em linha
- Flex row com wrap
- Ideal para barras de ferramentas

### Vertical
- Itens em coluna
- Flex column
- Ideal para listas

### Grid
- Grade 3x3 responsiva
- CSS Grid
- Ideal para dashboards

## ⚙️ Configurações Avançadas

### Grid Settings
```tsx
const {
  showGrid,
  snapToGrid,
  gridSize,
  toggleGrid,
  toggleSnapToGrid,
  setGridSize
} = useDragDrop();

// Mostrar/ocultar grade
toggleGrid();

// Ativar/desativar snap
toggleSnapToGrid();

// Definir tamanho da grade (10-50px)
setGridSize(25);
```

### Constraints
```tsx
<DragDropContainer
  containerId="restricted-container"
  acceptedTypes={['text', 'button']} // Apenas texto e botões
  maxItems={5} // Máximo 5 itens
/>
```

### Seleção e Manipulação
```tsx
const {
  selectedItems,
  selectItem,
  toggleItemSelection,
  selectAll,
  clearSelection,
  alignItems,
  distributeItems
} = useDragDrop();

// Selecionar item único
selectItem('item-1');

// Adicionar à seleção (Ctrl+click)
toggleItemSelection('item-2');

// Selecionar todos
selectAll();

// Limpar seleção
clearSelection();

// Alinhar itens selecionados
alignItems(selectedItems, 'center');

// Distribuir itens
distributeItems('container-1', 'horizontal');
```

## 🔧 Atalhos de Teclado

- **Ctrl/Cmd + Click**: Seleção múltipla
- **Ctrl/Cmd + A**: Selecionar todos
- **Ctrl/Cmd + Z**: Desfazer
- **Ctrl/Cmd + Y**: Refazer
- **Delete**: Excluir itens selecionados
- **Ctrl/Cmd + D**: Duplicar itens selecionados

## 📱 Responsividade

O sistema é totalmente responsivo e se adapta a diferentes tamanhos de tela:

- **Desktop**: Funcionalidade completa
- **Tablet**: Interface adaptada com controles touch
- **Mobile**: Versão simplificada com gestos otimizados

## 🎯 Casos de Uso

### Editor de Templates
```tsx
import { DragDropExample } from '@/components/DragDropAdvanced';

// Componente completo de exemplo
<DragDropExample />
```

### Dashboard Builder
```tsx
const dashboardContainers = [
  createDragDropContainer('grid', ['card', 'chart']),
  createDragDropContainer('horizontal', ['button'])
];
```

### Form Builder
```tsx
const formContainer = createDragDropContainer('vertical', [
  'input', 'textarea', 'select', 'button'
]);
```

## 🚀 Performance

- **Virtualização**: Renderização otimizada para grandes quantidades de itens
- **Memoização**: Componentes otimizados com React.memo
- **Debounce**: Operações de drag otimizadas
- **Lazy Loading**: Carregamento sob demanda de recursos

## 🔒 Segurança

- **Validação de Tipos**: Verificação rigorosa de tipos TypeScript
- **Sanitização**: Conteúdo sanitizado para prevenir XSS
- **Constraints**: Validação de regras de negócio

## 📚 Exemplos Avançados

Veja o arquivo `DragDropExample.tsx` para exemplos completos de implementação.

## 🤝 Contribuição

Para contribuir com melhorias:

1. Mantenha a tipagem TypeScript rigorosa
2. Adicione testes para novas funcionalidades
3. Documente mudanças na API
4. Siga os padrões de código estabelecidos

## 📄 Licença

Este componente faz parte do sistema Solara Nova Energia.