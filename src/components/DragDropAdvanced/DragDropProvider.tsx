import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverEvent,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  rectIntersection,
  getFirstCollision,
  pointerWithin
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
  rectSortingStrategy
} from '@dnd-kit/sortable';
import { restrictToWindowEdges, restrictToParentElement } from '@dnd-kit/modifiers';
import { toast } from 'sonner';

interface DragDropItem {
  id: string;
  type: string;
  data: any;
  position?: { x: number; y: number };
  size?: { width: number; height: number };
  locked?: boolean;
  grouped?: boolean;
  groupId?: string;
}

interface DragDropContainer {
  id: string;
  type: string;
  items: DragDropItem[];
  maxItems?: number;
  acceptedTypes?: string[];
  layout?: 'vertical' | 'horizontal' | 'grid' | 'free';
  snapToGrid?: boolean;
  gridSize?: number;
}

interface DragDropContextType {
  // State
  containers: DragDropContainer[];
  activeItem: DragDropItem | null;
  selectedItems: string[];
  draggedItem: DragDropItem | null;
  isMultiSelectMode: boolean;
  snapToGrid: boolean;
  gridSize: number;
  showGrid: boolean;
  
  // Actions
  addContainer: (container: Omit<DragDropContainer, 'items'>) => void;
  removeContainer: (containerId: string) => void;
  updateContainer: (containerId: string, updates: Partial<DragDropContainer>) => void;
  
  addItem: (containerId: string, item: Omit<DragDropItem, 'id'>) => void;
  removeItem: (itemId: string) => void;
  updateItem: (itemId: string, updates: Partial<DragDropItem>) => void;
  moveItem: (itemId: string, fromContainer: string, toContainer: string, index?: number) => void;
  
  selectItem: (itemId: string, multiSelect?: boolean) => void;
  selectMultiple: (itemIds: string[]) => void;
  clearSelection: () => void;
  
  duplicateItems: (itemIds: string[]) => void;
  deleteItems: (itemIds: string[]) => void;
  groupItems: (itemIds: string[]) => void;
  ungroupItems: (groupId: string) => void;
  
  distributeItems: (containerId: string, distribution: 'horizontal' | 'vertical' | 'grid') => void;
  alignItems: (itemIds: string[], alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => void;
  
  toggleSnapToGrid: () => void;
  setGridSize: (size: number) => void;
  toggleGrid: () => void;
  toggleMultiSelect: () => void;
  
  exportData: () => any;
  importData: (data: any) => void;
  resetAll: () => void;
}

const DragDropContext = createContext<DragDropContextType | null>(null);

export const useDragDrop = () => {
  const context = useContext(DragDropContext);
  if (!context) {
    throw new Error('useDragDrop must be used within a DragDropProvider');
  }
  return context;
};

interface DragDropProviderProps {
  children: React.ReactNode;
  onItemMove?: (item: DragDropItem, fromContainer: string, toContainer: string) => void;
  onSelectionChange?: (selectedItems: string[]) => void;
  onError?: (error: string) => void;
}

export const DragDropProvider: React.FC<DragDropProviderProps> = ({
  children,
  onItemMove,
  onSelectionChange,
  onError
}) => {
  const [containers, setContainers] = useState<DragDropContainer[]>([]);
  const [activeItem, setActiveItem] = useState<DragDropItem | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [draggedItem, setDraggedItem] = useState<DragDropItem | null>(null);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [gridSize, setGridSizeState] = useState(20);
  const [showGrid, setShowGrid] = useState(true);
  
  const lastOverContainer = useRef<string | null>(null);
  
  // Sensors for different input methods
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  // Utility functions
  const snapToGridPosition = useCallback((position: { x: number; y: number }) => {
    if (!snapToGrid) return position;
    return {
      x: Math.round(position.x / gridSize) * gridSize,
      y: Math.round(position.y / gridSize) * gridSize
    };
  }, [snapToGrid, gridSize]);

  const generateId = () => `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const findContainer = useCallback((itemId: string) => {
    return containers.find(container => 
      container.items.some(item => item.id === itemId)
    );
  }, [containers]);

  const findItem = useCallback((itemId: string) => {
    for (const container of containers) {
      const item = container.items.find(item => item.id === itemId);
      if (item) return item;
    }
    return null;
  }, [containers]);

  // Container management
  const addContainer = useCallback((containerData: Omit<DragDropContainer, 'items'>) => {
    const newContainer: DragDropContainer = {
      ...containerData,
      items: []
    };
    setContainers(prev => [...prev, newContainer]);
  }, []);

  const removeContainer = useCallback((containerId: string) => {
    setContainers(prev => prev.filter(container => container.id !== containerId));
  }, []);

  const updateContainer = useCallback((containerId: string, updates: Partial<DragDropContainer>) => {
    setContainers(prev => prev.map(container => 
      container.id === containerId ? { ...container, ...updates } : container
    ));
  }, []);

  // Item management
  const addItem = useCallback((containerId: string, itemData: Omit<DragDropItem, 'id'>) => {
    const container = containers.find(c => c.id === containerId);
    if (!container) {
      onError?.('Container not found');
      return;
    }

    if (container.maxItems && container.items.length >= container.maxItems) {
      onError?.('Container is full');
      toast.error('Container já está cheio');
      return;
    }

    if (container.acceptedTypes && !container.acceptedTypes.includes(itemData.type)) {
      onError?.('Item type not accepted');
      toast.error('Tipo de item não aceito neste container');
      return;
    }

    const newItem: DragDropItem = {
      ...itemData,
      id: generateId(),
      position: itemData.position ? snapToGridPosition(itemData.position) : undefined
    };

    setContainers(prev => prev.map(container => 
      container.id === containerId 
        ? { ...container, items: [...container.items, newItem] }
        : container
    ));
  }, [containers, snapToGridPosition, onError]);

  const removeItem = useCallback((itemId: string) => {
    setContainers(prev => prev.map(container => ({
      ...container,
      items: container.items.filter(item => item.id !== itemId)
    })));
    setSelectedItems(prev => prev.filter(id => id !== itemId));
  }, []);

  const updateItem = useCallback((itemId: string, updates: Partial<DragDropItem>) => {
    setContainers(prev => prev.map(container => ({
      ...container,
      items: container.items.map(item => 
        item.id === itemId 
          ? { 
              ...item, 
              ...updates,
              position: updates.position ? snapToGridPosition(updates.position) : item.position
            }
          : item
      )
    })));
  }, [snapToGridPosition]);

  const moveItem = useCallback((itemId: string, fromContainer: string, toContainer: string, index?: number) => {
    const item = findItem(itemId);
    if (!item) return;

    const targetContainer = containers.find(c => c.id === toContainer);
    if (!targetContainer) return;

    // Check constraints
    if (targetContainer.maxItems && targetContainer.items.length >= targetContainer.maxItems) {
      toast.error('Container de destino está cheio');
      return;
    }

    if (targetContainer.acceptedTypes && !targetContainer.acceptedTypes.includes(item.type)) {
      toast.error('Tipo de item não aceito no container de destino');
      return;
    }

    setContainers(prev => {
      const newContainers = prev.map(container => {
        if (container.id === fromContainer) {
          return {
            ...container,
            items: container.items.filter(i => i.id !== itemId)
          };
        }
        if (container.id === toContainer) {
          const newItems = [...container.items];
          if (index !== undefined) {
            newItems.splice(index, 0, item);
          } else {
            newItems.push(item);
          }
          return {
            ...container,
            items: newItems
          };
        }
        return container;
      });
      
      onItemMove?.(item, fromContainer, toContainer);
      return newContainers;
    });
  }, [containers, findItem, onItemMove]);

  // Selection management
  const selectItem = useCallback((itemId: string, multiSelect = false) => {
    if (multiSelect || isMultiSelectMode) {
      setSelectedItems(prev => {
        const newSelection = prev.includes(itemId)
          ? prev.filter(id => id !== itemId)
          : [...prev, itemId];
        onSelectionChange?.(newSelection);
        return newSelection;
      });
    } else {
      const newSelection = [itemId];
      setSelectedItems(newSelection);
      onSelectionChange?.(newSelection);
    }
  }, [isMultiSelectMode, onSelectionChange]);

  const selectMultiple = useCallback((itemIds: string[]) => {
    setSelectedItems(itemIds);
    onSelectionChange?.(itemIds);
  }, [onSelectionChange]);

  const clearSelection = useCallback(() => {
    setSelectedItems([]);
    onSelectionChange?.([]);
  }, [onSelectionChange]);

  // Advanced operations
  const duplicateItems = useCallback((itemIds: string[]) => {
    itemIds.forEach(itemId => {
      const item = findItem(itemId);
      const container = findContainer(itemId);
      if (item && container) {
        const duplicatedItem = {
          ...item,
          position: item.position ? {
            x: item.position.x + 20,
            y: item.position.y + 20
          } : undefined
        };
        addItem(container.id, duplicatedItem);
      }
    });
    toast.success(`${itemIds.length} item(s) duplicado(s)`);
  }, [findItem, findContainer, addItem]);

  const deleteItems = useCallback((itemIds: string[]) => {
    itemIds.forEach(removeItem);
    toast.success(`${itemIds.length} item(s) removido(s)`);
  }, [removeItem]);

  const groupItems = useCallback((itemIds: string[]) => {
    if (itemIds.length < 2) return;
    
    const groupId = generateId();
    itemIds.forEach(itemId => {
      updateItem(itemId, { grouped: true, groupId });
    });
    toast.success(`${itemIds.length} itens agrupados`);
  }, [updateItem]);

  const ungroupItems = useCallback((groupId: string) => {
    containers.forEach(container => {
      container.items.forEach(item => {
        if (item.groupId === groupId) {
          updateItem(item.id, { grouped: false, groupId: undefined });
        }
      });
    });
    toast.success('Itens desagrupados');
  }, [containers, updateItem]);

  const distributeItems = useCallback((containerId: string, distribution: 'horizontal' | 'vertical' | 'grid') => {
    const container = containers.find(c => c.id === containerId);
    if (!container || container.items.length < 2) return;

    const items = [...container.items];
    const containerBounds = { width: 800, height: 600 }; // Default bounds

    switch (distribution) {
      case 'horizontal': {
        const spacing = containerBounds.width / (items.length + 1);
        items.forEach((item, index) => {
          updateItem(item.id, {
            position: snapToGridPosition({
              x: spacing * (index + 1),
              y: item.position?.y || 100
            })
          });
        });
        break;
      }
      case 'vertical': {
        const spacing = containerBounds.height / (items.length + 1);
        items.forEach((item, index) => {
          updateItem(item.id, {
            position: snapToGridPosition({
              x: item.position?.x || 100,
              y: spacing * (index + 1)
            })
          });
        });
        break;
      }
      case 'grid': {
        const cols = Math.ceil(Math.sqrt(items.length));
        const cellWidth = containerBounds.width / cols;
        const cellHeight = containerBounds.height / Math.ceil(items.length / cols);
        
        items.forEach((item, index) => {
          const row = Math.floor(index / cols);
          const col = index % cols;
          updateItem(item.id, {
            position: snapToGridPosition({
              x: col * cellWidth + cellWidth / 2,
              y: row * cellHeight + cellHeight / 2
            })
          });
        });
        break;
      }
    }
    
    toast.success('Itens distribuídos automaticamente');
  }, [containers, updateItem, snapToGridPosition]);

  const alignItems = useCallback((itemIds: string[], alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
    if (itemIds.length < 2) return;

    const items = itemIds.map(findItem).filter(Boolean) as DragDropItem[];
    if (items.length < 2) return;

    const positions = items.map(item => item.position).filter(Boolean) as { x: number; y: number }[];
    if (positions.length < 2) return;

    let targetValue: number;

    switch (alignment) {
      case 'left':
        targetValue = Math.min(...positions.map(p => p.x));
        items.forEach(item => {
          if (item.position) {
            updateItem(item.id, {
              position: snapToGridPosition({ ...item.position, x: targetValue })
            });
          }
        });
        break;
      case 'right':
        targetValue = Math.max(...positions.map(p => p.x));
        items.forEach(item => {
          if (item.position) {
            updateItem(item.id, {
              position: snapToGridPosition({ ...item.position, x: targetValue })
            });
          }
        });
        break;
      case 'center':
        targetValue = positions.reduce((sum, p) => sum + p.x, 0) / positions.length;
        items.forEach(item => {
          if (item.position) {
            updateItem(item.id, {
              position: snapToGridPosition({ ...item.position, x: targetValue })
            });
          }
        });
        break;
      case 'top':
        targetValue = Math.min(...positions.map(p => p.y));
        items.forEach(item => {
          if (item.position) {
            updateItem(item.id, {
              position: snapToGridPosition({ ...item.position, y: targetValue })
            });
          }
        });
        break;
      case 'bottom':
        targetValue = Math.max(...positions.map(p => p.y));
        items.forEach(item => {
          if (item.position) {
            updateItem(item.id, {
              position: snapToGridPosition({ ...item.position, y: targetValue })
            });
          }
        });
        break;
      case 'middle':
        targetValue = positions.reduce((sum, p) => sum + p.y, 0) / positions.length;
        items.forEach(item => {
          if (item.position) {
            updateItem(item.id, {
              position: snapToGridPosition({ ...item.position, y: targetValue })
            });
          }
        });
        break;
    }
    
    toast.success('Itens alinhados');
  }, [findItem, updateItem, snapToGridPosition]);

  // Settings
  const toggleSnapToGrid = useCallback(() => {
    setSnapToGrid(prev => !prev);
  }, []);

  const setGridSize = useCallback((size: number) => {
    setGridSizeState(Math.max(5, Math.min(50, size)));
  }, []);

  const toggleGrid = useCallback(() => {
    setShowGrid(prev => !prev);
  }, []);

  const toggleMultiSelect = useCallback(() => {
    setIsMultiSelectMode(prev => !prev);
    if (isMultiSelectMode) {
      clearSelection();
    }
  }, [isMultiSelectMode, clearSelection]);

  // Data management
  const exportData = useCallback(() => {
    return {
      containers,
      settings: {
        snapToGrid,
        gridSize,
        showGrid
      },
      timestamp: new Date().toISOString()
    };
  }, [containers, snapToGrid, gridSize, showGrid]);

  const importData = useCallback((data: any) => {
    try {
      if (data.containers) {
        setContainers(data.containers);
      }
      if (data.settings) {
        setSnapToGrid(data.settings.snapToGrid ?? true);
        setGridSizeState(data.settings.gridSize ?? 20);
        setShowGrid(data.settings.showGrid ?? true);
      }
      clearSelection();
      toast.success('Dados importados com sucesso');
    } catch (error) {
      onError?.('Erro ao importar dados');
      toast.error('Erro ao importar dados');
    }
  }, [clearSelection, onError]);

  const resetAll = useCallback(() => {
    setContainers([]);
    clearSelection();
    setSnapToGrid(true);
    setGridSizeState(20);
    setShowGrid(true);
    setIsMultiSelectMode(false);
    toast.success('Tudo resetado');
  }, [clearSelection]);

  // Drag and drop handlers
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const item = findItem(active.id as string);
    
    if (item) {
      setActiveItem(item);
      setDraggedItem(item);
      
      // If dragging a non-selected item, select it
      if (!selectedItems.includes(item.id)) {
        selectItem(item.id);
      }
    }
  }, [findItem, selectedItems, selectItem]);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { over } = event;
    const overId = over?.id;
    
    if (overId) {
      lastOverContainer.current = overId as string;
    }
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    
    setActiveItem(null);
    setDraggedItem(null);
    
    if (!over) return;
    
    const activeId = active.id as string;
    const overId = over.id as string;
    
    const activeContainer = findContainer(activeId);
    const overContainer = containers.find(c => c.id === overId) || findContainer(overId);
    
    if (!activeContainer || !overContainer) return;
    
    if (activeContainer.id !== overContainer.id) {
      moveItem(activeId, activeContainer.id, overContainer.id);
    } else {
      // Reorder within same container
      const activeIndex = activeContainer.items.findIndex(item => item.id === activeId);
      const overIndex = activeContainer.items.findIndex(item => item.id === overId);
      
      if (activeIndex !== overIndex) {
        const newItems = arrayMove(activeContainer.items, activeIndex, overIndex);
        updateContainer(activeContainer.id, { items: newItems });
      }
    }
  }, [containers, findContainer, moveItem, updateContainer]);

  const contextValue: DragDropContextType = {
    // State
    containers,
    activeItem,
    selectedItems,
    draggedItem,
    isMultiSelectMode,
    snapToGrid,
    gridSize,
    showGrid,
    
    // Actions
    addContainer,
    removeContainer,
    updateContainer,
    
    addItem,
    removeItem,
    updateItem,
    moveItem,
    
    selectItem,
    selectMultiple,
    clearSelection,
    
    duplicateItems,
    deleteItems,
    groupItems,
    ungroupItems,
    
    distributeItems,
    alignItems,
    
    toggleSnapToGrid,
    setGridSize,
    toggleGrid,
    toggleMultiSelect,
    
    exportData,
    importData,
    resetAll
  };

  return (
    <DragDropContext.Provider value={contextValue}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToWindowEdges]}
      >
        {children}
        <DragOverlay>
          {draggedItem && (
            <div className="bg-blue-100 border-2 border-blue-300 rounded-lg p-3 shadow-lg opacity-90">
              <div className="text-sm font-medium text-blue-800">
                {draggedItem.type}
              </div>
              {selectedItems.length > 1 && (
                <div className="text-xs text-blue-600 mt-1">
                  +{selectedItems.length - 1} outros itens
                </div>
              )}
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </DragDropContext.Provider>
  );
};