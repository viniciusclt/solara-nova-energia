import { useState, useCallback, useRef } from 'react';
import { Node, Edge, Connection, addEdge, applyNodeChanges, applyEdgeChanges, NodeChange, EdgeChange } from 'reactflow';
import type {
  ProposalElement,
  CanvasData,
  TemplateFormat,
  Position,
  ElementType
} from '../types/proposal-editor';
import { ProposalElementService } from '../services/ProposalElementService';

interface UseCanvasProps {
  templateId?: string;
  initialFormat?: TemplateFormat;
  onSave?: (canvasData: CanvasData) => void;
}

interface UseCanvasReturn {
  // Estado do canvas
  nodes: Node[];
  edges: Edge[];
  selectedElements: string[];
  canvasFormat: TemplateFormat;
  showGrid: boolean;
  gridSize: number;
  zoom: number;
  
  // Ações do canvas
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  
  // Gerenciamento de elementos
  addElement: (type: ElementType, position: Position) => void;
  updateElement: (elementId: string, updates: Partial<ProposalElement>) => void;
  deleteElement: (elementId: string) => void;
  duplicateElement: (elementId: string) => void;
  
  // Seleção
  selectElement: (elementId: string, multiSelect?: boolean) => void;
  selectAll: () => void;
  clearSelection: () => void;
  
  // Formatação
  setCanvasFormat: (format: TemplateFormat) => void;
  setShowGrid: (show: boolean) => void;
  setGridSize: (size: number) => void;
  
  // Camadas (z-index)
  bringToFront: (elementId: string) => void;
  sendToBack: (elementId: string) => void;
  moveUp: (elementId: string) => void;
  moveDown: (elementId: string) => void;
  
  // Alinhamento
  alignElements: (alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => void;
  
  // Histórico (undo/redo)
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  
  // Utilitários
  getCanvasData: () => CanvasData;
  loadCanvasData: (data: CanvasData) => void;
  resetCanvas: () => void;
  exportCanvas: () => Promise<string>;
}

const GRID_SIZES = [10, 20, 25, 50];
const MAX_HISTORY = 50;

export const useCanvas = ({
  templateId,
  initialFormat = 'a4',
  onSave
}: UseCanvasProps = {}): UseCanvasReturn => {
  // Estado principal
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedElements, setSelectedElements] = useState<string[]>([]);
  const [canvasFormat, setCanvasFormat] = useState<TemplateFormat>(initialFormat);
  const [showGrid, setShowGrid] = useState(true);
  const [gridSize, setGridSize] = useState(20);
  const [zoom, setZoom] = useState(1);
  
  // Histórico para undo/redo
  const [history, setHistory] = useState<CanvasData[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const isUndoRedo = useRef(false);
  
  // Contador para IDs únicos
  const elementCounter = useRef(0);
  
  // Salvar estado no histórico
  const saveToHistory = useCallback(() => {
    if (isUndoRedo.current) return;
    
    const currentState = getCanvasData();
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(currentState);
    
    if (newHistory.length > MAX_HISTORY) {
      newHistory.shift();
    } else {
      setHistoryIndex(prev => prev + 1);
    }
    
    setHistory(newHistory);
  }, [history, historyIndex]);
  
  // Handlers do React Flow
  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes(nodes => applyNodeChanges(changes, nodes));
    saveToHistory();
  }, [saveToHistory]);
  
  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    setEdges(edges => applyEdgeChanges(changes, edges));
    saveToHistory();
  }, [saveToHistory]);
  
  const onConnect = useCallback((connection: Connection) => {
    setEdges(edges => addEdge(connection, edges));
    saveToHistory();
  }, [saveToHistory]);
  
  // Gerar ID único para elemento
  const generateElementId = useCallback(() => {
    elementCounter.current += 1;
    return `element_${Date.now()}_${elementCounter.current}`;
  }, []);

  // Seleção - definida antes de elementToNode
  const selectElement = useCallback((elementId: string, multiSelect = false) => {
    setSelectedElements(prev => {
      if (multiSelect) {
        return prev.includes(elementId)
          ? prev.filter(id => id !== elementId)
          : [...prev, elementId];
      }
      return [elementId];
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedElements(nodes.map(node => node.id));
  }, [nodes]);

  const clearSelection = useCallback(() => {
    setSelectedElements([]);
  }, []);

  // Converter elemento para nó do React Flow
  const elementToNode = useCallback((element: ProposalElement): Node => {
    return {
      id: element.id,
      type: `${element.type}Element`,
      position: { x: element.position.x, y: element.position.y },
      data: {
        element,
        isSelected: selectedElements.includes(element.id),
        onUpdate: (updates: Partial<ProposalElement>) => updateElement(element.id, updates),
        onDelete: () => deleteElement(element.id),
        onSelect: () => selectElement(element.id)
      },
      style: {
        width: element.position.width,
        height: element.position.height,
        zIndex: element.z_index
      }
    };
  }, [selectedElements, selectElement]);
  
  // Adicionar elemento
  const addElement = useCallback((type: ElementType, position: Position) => {
    const elementId = generateElementId();
    const newElement: ProposalElement = {
      id: elementId,
      template_id: templateId || '',
      type,
      position,
      z_index: nodes.length + 1,
      properties: ProposalElementService.getDefaultProperties(type),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const newNode = elementToNode(newElement);
    setNodes(prev => [...prev, newNode]);
    selectElement(elementId);
    saveToHistory();
  }, [templateId, nodes.length, elementToNode, generateElementId, selectElement, saveToHistory]);
  
  // Atualizar elemento
  const updateElement = useCallback((elementId: string, updates: Partial<ProposalElement>) => {
    setNodes(prev => prev.map(node => {
      if (node.id === elementId) {
        const updatedElement = { ...node.data.element, ...updates };
        return {
          ...node,
          data: {
            ...node.data,
            element: updatedElement
          },
          style: {
            ...node.style,
            width: updatedElement.position.width,
            height: updatedElement.position.height,
            zIndex: updatedElement.z_index
          }
        };
      }
      return node;
    }));
    saveToHistory();
  }, [saveToHistory]);
  
  // Deletar elemento
  const deleteElement = useCallback((elementId: string) => {
    setNodes(prev => prev.filter(node => node.id !== elementId));
    setSelectedElements(prev => prev.filter(id => id !== elementId));
    saveToHistory();
  }, [saveToHistory]);
  
  // Duplicar elemento
  const duplicateElement = useCallback((elementId: string) => {
    const node = nodes.find(n => n.id === elementId);
    if (!node) return;
    
    const element = node.data.element as ProposalElement;
    const newElementId = generateElementId();
    const duplicatedElement: ProposalElement = {
      ...element,
      id: newElementId,
      position: {
        ...element.position,
        x: element.position.x + 20,
        y: element.position.y + 20
      },
      z_index: nodes.length + 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const newNode = elementToNode(duplicatedElement);
    setNodes(prev => [...prev, newNode]);
    selectElement(newElementId);
    saveToHistory();
  }, [nodes, elementToNode, generateElementId, selectElement, saveToHistory]);
  
  // Funções de seleção já definidas acima
  
  // Gerenciamento de camadas
  const bringToFront = useCallback((elementId: string) => {
    const maxZIndex = Math.max(...nodes.map(n => n.data.element.z_index || 0));
    updateElement(elementId, { z_index: maxZIndex + 1 });
  }, [nodes, updateElement]);
  
  const sendToBack = useCallback((elementId: string) => {
    const minZIndex = Math.min(...nodes.map(n => n.data.element.z_index || 0));
    updateElement(elementId, { z_index: minZIndex - 1 });
  }, [nodes, updateElement]);
  
  const moveUp = useCallback((elementId: string) => {
    const element = nodes.find(n => n.id === elementId)?.data.element;
    if (element) {
      updateElement(elementId, { z_index: (element.z_index || 0) + 1 });
    }
  }, [nodes, updateElement]);
  
  const moveDown = useCallback((elementId: string) => {
    const element = nodes.find(n => n.id === elementId)?.data.element;
    if (element) {
      updateElement(elementId, { z_index: (element.z_index || 0) - 1 });
    }
  }, [nodes, updateElement]);
  
  // Alinhamento
  const alignElements = useCallback((alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
    if (selectedElements.length < 2) return;
    
    const selectedNodes = nodes.filter(n => selectedElements.includes(n.id));
    const elements = selectedNodes.map(n => n.data.element as ProposalElement);
    
    let referenceValue: number;
    
    switch (alignment) {
      case 'left':
        referenceValue = Math.min(...elements.map(e => e.position.x));
        elements.forEach(element => {
          updateElement(element.id, {
            position: { ...element.position, x: referenceValue }
          });
        });
        break;
      case 'right':
        referenceValue = Math.max(...elements.map(e => e.position.x + e.position.width));
        elements.forEach(element => {
          updateElement(element.id, {
            position: { ...element.position, x: referenceValue - element.position.width }
          });
        });
        break;
      case 'center':
        const minX = Math.min(...elements.map(e => e.position.x));
        const maxX = Math.max(...elements.map(e => e.position.x + e.position.width));
        referenceValue = (minX + maxX) / 2;
        elements.forEach(element => {
          updateElement(element.id, {
            position: { ...element.position, x: referenceValue - element.position.width / 2 }
          });
        });
        break;
      case 'top':
        referenceValue = Math.min(...elements.map(e => e.position.y));
        elements.forEach(element => {
          updateElement(element.id, {
            position: { ...element.position, y: referenceValue }
          });
        });
        break;
      case 'bottom':
        referenceValue = Math.max(...elements.map(e => e.position.y + e.position.height));
        elements.forEach(element => {
          updateElement(element.id, {
            position: { ...element.position, y: referenceValue - element.position.height }
          });
        });
        break;
      case 'middle':
        const minY = Math.min(...elements.map(e => e.position.y));
        const maxY = Math.max(...elements.map(e => e.position.y + e.position.height));
        referenceValue = (minY + maxY) / 2;
        elements.forEach(element => {
          updateElement(element.id, {
            position: { ...element.position, y: referenceValue - element.position.height / 2 }
          });
        });
        break;
    }
  }, [selectedElements, nodes, updateElement]);
  
  // Histórico
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      isUndoRedo.current = true;
      const previousState = history[historyIndex - 1];
      loadCanvasData(previousState);
      setHistoryIndex(prev => prev - 1);
      isUndoRedo.current = false;
    }
  }, [history, historyIndex]);
  
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      isUndoRedo.current = true;
      const nextState = history[historyIndex + 1];
      loadCanvasData(nextState);
      setHistoryIndex(prev => prev + 1);
      isUndoRedo.current = false;
    }
  }, [history, historyIndex]);
  
  // Utilitários
  const getCanvasData = useCallback((): CanvasData => {
    const elements = nodes.map(node => node.data.element as ProposalElement);
    return {
      format: canvasFormat,
      elements,
      settings: {
        showGrid,
        gridSize,
        zoom
      }
    };
  }, [nodes, canvasFormat, showGrid, gridSize, zoom]);
  
  const loadCanvasData = useCallback((data: CanvasData) => {
    const newNodes = data.elements.map(elementToNode);
    setNodes(newNodes);
    setCanvasFormat(data.format);
    if (data.settings) {
      setShowGrid(data.settings.showGrid ?? true);
      setGridSize(data.settings.gridSize ?? 20);
      setZoom(data.settings.zoom ?? 1);
    }
    clearSelection();
  }, [elementToNode, clearSelection]);
  
  const resetCanvas = useCallback(() => {
    setNodes([]);
    setEdges([]);
    clearSelection();
    setHistory([]);
    setHistoryIndex(-1);
    elementCounter.current = 0;
  }, [clearSelection]);
  
  const exportCanvas = useCallback(async (): Promise<string> => {
    // Implementar exportação para imagem/PDF
    // Por enquanto, retorna JSON do canvas
    return JSON.stringify(getCanvasData(), null, 2);
  }, [getCanvasData]);
  
  return {
    // Estado
    nodes,
    edges,
    selectedElements,
    canvasFormat,
    showGrid,
    gridSize,
    zoom,
    
    // Handlers do React Flow
    onNodesChange,
    onEdgesChange,
    onConnect,
    
    // Gerenciamento de elementos
    addElement,
    updateElement,
    deleteElement,
    duplicateElement,
    
    // Seleção
    selectElement,
    selectAll,
    clearSelection,
    
    // Formatação
    setCanvasFormat,
    setShowGrid,
    setGridSize,
    
    // Camadas
    bringToFront,
    sendToBack,
    moveUp,
    moveDown,
    
    // Alinhamento
    alignElements,
    
    // Histórico
    undo,
    redo,
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1,
    
    // Utilitários
    getCanvasData,
    loadCanvasData,
    resetCanvas,
    exportCanvas
  };
};