// Advanced Drag and Drop System
export { DragDropProvider, useDragDrop } from './DragDropProvider';
export { DragDropContainer } from './DragDropContainer';
export { DragDropItem } from './DragDropItem';
export { DragDropToolbar } from './DragDropToolbar';
export type {
  DragDropItemData,
  DragDropContainerData,
  DragDropState,
  Position,
  ItemContent
} from './types';

// Re-export commonly used types from dnd-kit
export type {
  DragEndEvent,
  DragStartEvent,
  DragOverEvent,
  UniqueIdentifier
} from '@dnd-kit/core';

// Utility functions
export const createDragDropItem = (
  type: string,
  content?: Record<string, unknown>,
  position?: { x: number; y: number }
): Partial<DragDropItemData> => ({
  id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  type,
  content,
  position,
  visible: true,
  locked: false,
  zIndex: 1
});

export const createDragDropContainer = (
  layout: 'free' | 'horizontal' | 'vertical' | 'grid' = 'free',
  acceptedTypes?: string[]
): Partial<DragDropContainerData> => ({
  id: `container-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  layout,
  items: [],
  acceptedTypes,
  maxItems: undefined
});

// Predefined item templates
export const itemTemplates = {
  text: {
    type: 'text',
    content: {
      title: 'Novo Texto',
      description: 'Descrição do texto'
    }
  },
  button: {
    type: 'button',
    content: {
      title: 'Botão',
      variant: 'default'
    }
  },
  image: {
    type: 'image',
    content: {
      title: 'Nova Imagem',
      url: '',
      alt: 'Imagem'
    }
  },
  card: {
    type: 'card',
    content: {
      title: 'Novo Card',
      description: 'Descrição do card'
    }
  }
};

// Layout presets
export const layoutPresets = {
  freeForm: {
    layout: 'free' as const,
    showGrid: true,
    snapToGrid: true,
    gridSize: 20
  },
  horizontalList: {
    layout: 'horizontal' as const,
    showGrid: false,
    snapToGrid: false
  },
  verticalList: {
    layout: 'vertical' as const,
    showGrid: false,
    snapToGrid: false
  },
  gridLayout: {
    layout: 'grid' as const,
    showGrid: true,
    snapToGrid: true,
    gridSize: 30
  }
};