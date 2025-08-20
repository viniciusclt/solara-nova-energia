import { useState, useCallback, useRef, useEffect } from 'react';
import { 
  CanvasState, 
  CanvasElement, 
  CanvasConfig, 
  Viewport, 
  Tool, 
  ToolConfig,
  Position,
  Transform,
  ElementAnimation,
  AnimationTimeline,
  CANVAS_CONSTANTS
} from '../types/proposal';

// =====================================================================================
// HOOK PRINCIPAL DO EDITOR DE PROPOSTAS
// =====================================================================================

export const useProposalEditor = () => {
  // Estado principal do canvas
  const [canvasState, setCanvasState] = useState<CanvasState>({
    config: {
      width: CANVAS_CONSTANTS.DEFAULT_WIDTH,
      height: CANVAS_CONSTANTS.DEFAULT_HEIGHT,
      backgroundColor: '#ffffff',
      gridSize: CANVAS_CONSTANTS.GRID_SIZE,
      showGrid: true,
      snapToGrid: true,
      zoom: 1,
      minZoom: CANVAS_CONSTANTS.MIN_ZOOM,
      maxZoom: CANVAS_CONSTANTS.MAX_ZOOM,
    },
    viewport: {
      x: 0,
      y: 0,
      zoom: 1,
    },
    elements: [],
    selectedElementIds: [],
    clipboard: [],
    history: {
      past: [],
      present: [],
      future: [],
    },
  });

  // Estado das ferramentas
  const [toolConfig, setToolConfig] = useState<ToolConfig>({
    activeTool: 'select',
    textConfig: {
      fontSize: 16,
      fontFamily: 'Inter',
      color: '#000000',
      fontWeight: 'normal',
    },
    shapeConfig: {
      fill: '#3B82F6',
      stroke: '#1E40AF',
      strokeWidth: 2,
    },
    imageConfig: {
      fit: 'cover',
    },
  });

  // Estado de drag and drop
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 });
  
  // Referências
  const canvasRef = useRef<HTMLDivElement>(null);
  const autoSaveRef = useRef<NodeJS.Timeout>();

  // =====================================================================================
  // OPERAÇÕES DE ELEMENTOS
  // =====================================================================================

  const addElement = useCallback((element: Omit<CanvasElement, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newElement: CanvasElement = {
      ...element,
      id: `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as CanvasElement;

    setCanvasState(prev => ({
      ...prev,
      elements: [...prev.elements, newElement],
      selectedElementIds: [newElement.id],
      history: {
        past: [...prev.history.past, prev.elements],
        present: [...prev.elements, newElement],
        future: [],
      },
    }));

    return newElement.id;
  }, []);

  const updateElement = useCallback((elementId: string, updates: Partial<CanvasElement>) => {
    setCanvasState(prev => {
      const elementIndex = prev.elements.findIndex(el => el.id === elementId);
      if (elementIndex === -1) return prev;

      const updatedElements = [...prev.elements];
      updatedElements[elementIndex] = {
        ...updatedElements[elementIndex],
        ...updates,
        updatedAt: new Date(),
      };

      return {
        ...prev,
        elements: updatedElements,
        history: {
          past: [...prev.history.past, prev.elements],
          present: updatedElements,
          future: [],
        },
      };
    });
  }, []);

  const deleteElement = useCallback((elementId: string) => {
    setCanvasState(prev => {
      const filteredElements = prev.elements.filter(el => el.id !== elementId);
      return {
        ...prev,
        elements: filteredElements,
        selectedElementIds: prev.selectedElementIds.filter(id => id !== elementId),
        history: {
          past: [...prev.history.past, prev.elements],
          present: filteredElements,
          future: [],
        },
      };
    });
  }, []);

  const duplicateElement = useCallback((elementId: string) => {
    const element = canvasState.elements.find(el => el.id === elementId);
    if (!element) return;

    const duplicatedElement = {
      ...element,
      transform: {
        ...element.transform,
        position: {
          x: element.transform.position.x + 20,
          y: element.transform.position.y + 20,
        },
      },
    };

    delete (duplicatedElement as Record<string, unknown>).id;
    delete (duplicatedElement as Record<string, unknown>).createdAt;
    delete (duplicatedElement as Record<string, unknown>).updatedAt;

    return addElement(duplicatedElement);
  }, [canvasState.elements, addElement]);

  // =====================================================================================
  // SELEÇÃO E MANIPULAÇÃO
  // =====================================================================================

  const selectElement = useCallback((elementId: string, multiSelect = false) => {
    setCanvasState(prev => {
      if (multiSelect) {
        const isSelected = prev.selectedElementIds.includes(elementId);
        return {
          ...prev,
          selectedElementIds: isSelected
            ? prev.selectedElementIds.filter(id => id !== elementId)
            : [...prev.selectedElementIds, elementId],
        };
      } else {
        return {
          ...prev,
          selectedElementIds: [elementId],
        };
      }
    });
  }, []);

  const clearSelection = useCallback(() => {
    setCanvasState(prev => ({
      ...prev,
      selectedElementIds: [],
    }));
  }, []);

  const selectAll = useCallback(() => {
    setCanvasState(prev => ({
      ...prev,
      selectedElementIds: prev.elements.map(el => el.id),
    }));
  }, []);

  // =====================================================================================
  // TRANSFORMAÇÕES
  // =====================================================================================

  const moveElement = useCallback((elementId: string, position: Position) => {
    const snapToGrid = canvasState.config.snapToGrid;
    const gridSize = canvasState.config.gridSize;

    const snappedPosition = snapToGrid
      ? {
          x: Math.round(position.x / gridSize) * gridSize,
          y: Math.round(position.y / gridSize) * gridSize,
        }
      : position;

    updateElement(elementId, {
      transform: {
        ...canvasState.elements.find(el => el.id === elementId)?.transform!,
        position: snappedPosition,
      },
    });
  }, [canvasState.config.snapToGrid, canvasState.config.gridSize, canvasState.elements, updateElement]);

  const resizeElement = useCallback((elementId: string, size: { width: number; height: number }) => {
    updateElement(elementId, {
      transform: {
        ...canvasState.elements.find(el => el.id === elementId)?.transform!,
        size,
      },
    });
  }, [canvasState.elements, updateElement]);

  const rotateElement = useCallback((elementId: string, rotation: number) => {
    updateElement(elementId, {
      transform: {
        ...canvasState.elements.find(el => el.id === elementId)?.transform!,
        rotation,
      },
    });
  }, [canvasState.elements, updateElement]);

  // =====================================================================================
  // VIEWPORT E ZOOM
  // =====================================================================================

  const setZoom = useCallback((zoom: number) => {
    const clampedZoom = Math.max(
      canvasState.config.minZoom,
      Math.min(canvasState.config.maxZoom, zoom)
    );

    setCanvasState(prev => ({
      ...prev,
      viewport: {
        ...prev.viewport,
        zoom: clampedZoom,
      },
    }));
  }, [canvasState.config.minZoom, canvasState.config.maxZoom]);

  const panViewport = useCallback((deltaX: number, deltaY: number) => {
    setCanvasState(prev => ({
      ...prev,
      viewport: {
        ...prev.viewport,
        x: prev.viewport.x + deltaX,
        y: prev.viewport.y + deltaY,
      },
    }));
  }, []);

  const centerViewport = useCallback(() => {
    setCanvasState(prev => ({
      ...prev,
      viewport: {
        x: 0,
        y: 0,
        zoom: 1,
      },
    }));
  }, []);

  const fitToScreen = useCallback(() => {
    if (!canvasRef.current) return;

    const containerRect = canvasRef.current.getBoundingClientRect();
    const scaleX = containerRect.width / canvasState.config.width;
    const scaleY = containerRect.height / canvasState.config.height;
    const scale = Math.min(scaleX, scaleY, 1);

    setZoom(scale);
    centerViewport();
  }, [canvasState.config.width, canvasState.config.height, setZoom, centerViewport]);

  // =====================================================================================
  // HISTÓRICO (UNDO/REDO)
  // =====================================================================================

  const undo = useCallback(() => {
    setCanvasState(prev => {
      if (prev.history.past.length === 0) return prev;

      const previous = prev.history.past[prev.history.past.length - 1];
      const newPast = prev.history.past.slice(0, prev.history.past.length - 1);

      return {
        ...prev,
        elements: previous,
        history: {
          past: newPast,
          present: previous,
          future: [prev.elements, ...prev.history.future],
        },
      };
    });
  }, []);

  const redo = useCallback(() => {
    setCanvasState(prev => {
      if (prev.history.future.length === 0) return prev;

      const next = prev.history.future[0];
      const newFuture = prev.history.future.slice(1);

      return {
        ...prev,
        elements: next,
        history: {
          past: [...prev.history.past, prev.elements],
          present: next,
          future: newFuture,
        },
      };
    });
  }, []);

  // =====================================================================================
  // CLIPBOARD
  // =====================================================================================

  const copySelected = useCallback(() => {
    const selectedElements = canvasState.elements.filter(el => 
      canvasState.selectedElementIds.includes(el.id)
    );

    setCanvasState(prev => ({
      ...prev,
      clipboard: selectedElements,
    }));
  }, [canvasState.elements, canvasState.selectedElementIds]);

  const paste = useCallback(() => {
    if (canvasState.clipboard.length === 0) return;

    const pastedElements = canvasState.clipboard.map(element => {
      const pastedElement = {
        ...element,
        transform: {
          ...element.transform,
          position: {
            x: element.transform.position.x + 20,
            y: element.transform.position.y + 20,
          },
        },
      };

      delete (pastedElement as Record<string, unknown>).id;
      delete (pastedElement as Record<string, unknown>).createdAt;
      delete (pastedElement as Record<string, unknown>).updatedAt;

      return pastedElement;
    });

    const newElementIds: string[] = [];
    pastedElements.forEach(element => {
      const id = addElement(element);
      newElementIds.push(id);
    });

    setCanvasState(prev => ({
      ...prev,
      selectedElementIds: newElementIds,
    }));
  }, [canvasState.clipboard, addElement]);

  // =====================================================================================
  // CONFIGURAÇÕES
  // =====================================================================================

  const updateCanvasConfig = useCallback((config: Partial<CanvasConfig>) => {
    setCanvasState(prev => ({
      ...prev,
      config: {
        ...prev.config,
        ...config,
      },
    }));
  }, []);

  const setActiveTool = useCallback((tool: Tool) => {
    setToolConfig(prev => ({
      ...prev,
      activeTool: tool,
    }));
  }, []);

  // =====================================================================================
  // AUTO SAVE
  // =====================================================================================

  const saveCanvas = useCallback(async () => {
    try {
      const canvasData = {
        ...canvasState,
        savedAt: new Date(),
      };

      // Aqui você implementaria a lógica de salvamento
      // Por exemplo, salvar no localStorage ou enviar para API
      localStorage.setItem('proposal_canvas', JSON.stringify(canvasData));
      
      console.log('Canvas salvo com sucesso');
    } catch (error) {
      console.error('Erro ao salvar canvas:', error);
    }
  }, [canvasState]);

  const loadCanvas = useCallback(async () => {
    try {
      const savedData = localStorage.getItem('proposal_canvas');
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        setCanvasState(parsedData);
        console.log('Canvas carregado com sucesso');
      }
    } catch (error) {
      console.error('Erro ao carregar canvas:', error);
    }
  }, []);

  // Auto save a cada 30 segundos
  useEffect(() => {
    if (autoSaveRef.current) {
      clearInterval(autoSaveRef.current);
    }

    autoSaveRef.current = setInterval(() => {
      saveCanvas();
    }, CANVAS_CONSTANTS.AUTO_SAVE_INTERVAL);

    return () => {
      if (autoSaveRef.current) {
        clearInterval(autoSaveRef.current);
      }
    };
  }, [saveCanvas]);

  // =====================================================================================
  // UTILITÁRIOS
  // =====================================================================================

  const getSelectedElements = useCallback(() => {
    return canvasState.elements.filter(el => 
      canvasState.selectedElementIds.includes(el.id)
    );
  }, [canvasState.elements, canvasState.selectedElementIds]);

  const getElementById = useCallback((id: string) => {
    return canvasState.elements.find(el => el.id === id);
  }, [canvasState.elements]);

  const getElementsInArea = useCallback((x: number, y: number, width: number, height: number) => {
    return canvasState.elements.filter(element => {
      const { position, size } = element.transform;
      return (
        position.x < x + width &&
        position.x + size.width > x &&
        position.y < y + height &&
        position.y + size.height > y
      );
    });
  }, [canvasState.elements]);

  // =====================================================================================
  // RETORNO DO HOOK
  // =====================================================================================

  return {
    // Estado
    canvasState,
    toolConfig,
    isDragging,
    dragOffset,
    canvasRef,

    // Operações de elementos
    addElement,
    updateElement,
    deleteElement,
    duplicateElement,

    // Seleção
    selectElement,
    clearSelection,
    selectAll,
    getSelectedElements,

    // Transformações
    moveElement,
    resizeElement,
    rotateElement,

    // Viewport
    setZoom,
    panViewport,
    centerViewport,
    fitToScreen,

    // Histórico
    undo,
    redo,
    canUndo: canvasState.history.past.length > 0,
    canRedo: canvasState.history.future.length > 0,

    // Clipboard
    copySelected,
    paste,
    canPaste: canvasState.clipboard.length > 0,

    // Configurações
    updateCanvasConfig,
    setActiveTool,

    // Persistência
    saveCanvas,
    loadCanvas,

    // Utilitários
    getElementById,
    getElementsInArea,

    // Estados de drag
    setIsDragging,
    setDragOffset,
  };
};

export default useProposalEditor;