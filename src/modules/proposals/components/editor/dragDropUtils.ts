// Utilitários para DragDrop

interface DragDropItem {
  id: string;
  [key: string]: unknown;
}

interface DragDropContainer {
  id: string;
  items: DragDropItem[];
  maxItems?: number;
  acceptedTypes?: string[];
  [key: string]: unknown;
}

export const generateId = () => `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export const snapToGridPosition = (position: { x: number; y: number }, snapToGrid: boolean, gridSize: number) => {
  if (!snapToGrid) return position;
  return {
    x: Math.round(position.x / gridSize) * gridSize,
    y: Math.round(position.y / gridSize) * gridSize
  };
};

export const validateItemMove = (
  container: DragDropContainer,
  itemType: string
): { isValid: boolean; error?: string } => {
  if (container.maxItems && container.items.length >= container.maxItems) {
    return { isValid: false, error: 'Container já está cheio' };
  }

  if (container.acceptedTypes && !container.acceptedTypes.includes(itemType)) {
    return { isValid: false, error: 'Tipo de item não aceito neste container' };
  }

  return { isValid: true };
};

export const findContainer = (containers: DragDropContainer[], itemId: string) => {
  return containers.find(container => 
    container.items.some(item => item.id === itemId)
  );
};

export const findItem = (containers: DragDropContainer[], itemId: string) => {
  for (const container of containers) {
    const item = container.items.find(item => item.id === itemId);
    if (item) return item;
  }
  return null;
};