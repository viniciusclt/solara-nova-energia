// ============================================================================
// useDiagramIntegration - Hook para gerenciar estado e lógica dos diagramas
// ============================================================================

import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';

// ============================================================================
// Types
// ============================================================================

export type DiagramType = 'flowchart' | 'mindmap' | 'organogram';
export type NodeType = 'start' | 'process' | 'decision' | 'end' | 'data' | 'document' | 
                      'root' | 'branch' | 'leaf' | 'idea' |
                      'ceo' | 'director' | 'manager' | 'employee' | 'department';
export type EdgeType = 'straight' | 'curved' | 'stepped' | 'bezier';
export type ToolType = 'select' | 'node' | 'edge' | 'text' | 'pan' | 'zoom';

interface DiagramNode {
  id: string;
  type: NodeType;
  position: { x: number; y: number };
  data: {
    label: string;
    description?: string;
    color?: string;
    backgroundColor?: string;
    borderColor?: string;
    icon?: string;
    metadata?: Record<string, any>;
  };
  style?: React.CSSProperties;
}

interface DiagramEdge {
  id: string;
  source: string;
  target: string;
  type: EdgeType;
  data?: {
    label?: string;
    color?: string;
    animated?: boolean;
  };
  style?: React.CSSProperties;
}

interface DiagramData {
  id: string;
  title: string;
  description?: string;
  type: DiagramType;
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  viewport: {
    x: number;
    y: number;
    zoom: number;
  };
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    author: string;
    version: string;
    tags: string[];
  };
}

interface DiagramHistory {
  past: DiagramData[];
  present: DiagramData;
  future: DiagramData[];
}

interface UseDiagramIntegrationProps {
  initialData?: DiagramData;
  type?: DiagramType;
  autoSave?: boolean;
  autoSaveInterval?: number;
  onSave?: (data: DiagramData) => void;
  onError?: (error: Error) => void;
}

interface UseDiagramIntegrationReturn {
  // State
  diagramData: DiagramData;
  selectedNodes: string[];
  selectedEdges: string[];
  selectedTool: ToolType;
  hasUnsavedChanges: boolean;
  isLoading: boolean;
  history: DiagramHistory;
  
  // Actions
  setDiagramData: (data: DiagramData | ((prev: DiagramData) => DiagramData)) => void;
  setSelectedNodes: (nodes: string[]) => void;
  setSelectedEdges: (edges: string[]) => void;
  setSelectedTool: (tool: ToolType) => void;
  
  // Node operations
  addNode: (nodeType: NodeType, position?: { x: number; y: number }) => void;
  updateNode: (nodeId: string, updates: Partial<DiagramNode>) => void;
  deleteNode: (nodeId: string) => void;
  duplicateNode: (nodeId: string) => void;
  
  // Edge operations
  addEdge: (source: string, target: string, type?: EdgeType) => void;
  updateEdge: (edgeId: string, updates: Partial<DiagramEdge>) => void;
  deleteEdge: (edgeId: string) => void;
  
  // Selection operations
  selectNode: (nodeId: string, multi?: boolean) => void;
  selectEdge: (edgeId: string, multi?: boolean) => void;
  clearSelection: () => void;
  deleteSelected: () => void;
  
  // History operations
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  
  // Utility operations
  save: () => void;
  reset: () => void;
  exportData: (format: 'json' | 'png' | 'svg' | 'pdf') => void;
  importData: (data: DiagramData) => void;
  
  // Layout operations
  autoLayout: () => void;
  fitToView: () => void;
  centerView: () => void;
  
  // Validation
  validate: () => { isValid: boolean; errors: string[] };
}

// ============================================================================
// Default Values
// ============================================================================

const createDefaultDiagram = (type: DiagramType): DiagramData => ({
  id: `diagram-${Date.now()}`,
  title: `Novo ${type === 'flowchart' ? 'Fluxograma' : type === 'mindmap' ? 'Mapa Mental' : 'Organograma'}`,
  type,
  nodes: [],
  edges: [],
  viewport: { x: 0, y: 0, zoom: 1 },
  metadata: {
    createdAt: new Date(),
    updatedAt: new Date(),
    author: 'Usuário',
    version: '1.0',
    tags: []
  }
});

const NODE_COLORS = {
  flowchart: {
    start: '#10b981',
    process: '#3b82f6',
    decision: '#f59e0b',
    end: '#ef4444',
    data: '#8b5cf6',
    document: '#06b6d4'
  },
  mindmap: {
    root: '#8b5cf6',
    branch: '#06b6d4',
    leaf: '#84cc16',
    idea: '#f97316'
  },
  organogram: {
    ceo: '#dc2626',
    director: '#2563eb',
    manager: '#059669',
    employee: '#64748b',
    department: '#7c3aed'
  }
};

// ============================================================================
// Hook Implementation
// ============================================================================

export const useDiagramIntegration = ({
  initialData,
  type = 'flowchart',
  autoSave = false,
  autoSaveInterval = 30000, // 30 seconds
  onSave,
  onError
}: UseDiagramIntegrationProps = {}): UseDiagramIntegrationReturn => {
  
  // ============================================================================
  // State
  // ============================================================================
  
  const [diagramData, setDiagramDataState] = useState<DiagramData>(
    initialData || createDefaultDiagram(type)
  );
  
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
  const [selectedEdges, setSelectedEdges] = useState<string[]>([]);
  const [selectedTool, setSelectedTool] = useState<ToolType>('select');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [history, setHistory] = useState<DiagramHistory>({
    past: [],
    present: diagramData,
    future: []
  });
  
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // ============================================================================
  // History Management
  // ============================================================================
  
  const addToHistory = useCallback((newData: DiagramData) => {
    setHistory(prev => ({
      past: [...prev.past, prev.present],
      present: newData,
      future: []
    }));
  }, []);
  
  const undo = useCallback(() => {
    setHistory(prev => {
      if (prev.past.length === 0) return prev;
      
      const previous = prev.past[prev.past.length - 1];
      const newPast = prev.past.slice(0, prev.past.length - 1);
      
      setDiagramDataState(previous);
      setHasUnsavedChanges(true);
      
      return {
        past: newPast,
        present: previous,
        future: [prev.present, ...prev.future]
      };
    });
  }, []);
  
  const redo = useCallback(() => {
    setHistory(prev => {
      if (prev.future.length === 0) return prev;
      
      const next = prev.future[0];
      const newFuture = prev.future.slice(1);
      
      setDiagramDataState(next);
      setHasUnsavedChanges(true);
      
      return {
        past: [...prev.past, prev.present],
        present: next,
        future: newFuture
      };
    });
  }, []);
  
  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;
  
  // ============================================================================
  // Data Management
  // ============================================================================
  
  const setDiagramData = useCallback((data: DiagramData | ((prev: DiagramData) => DiagramData)) => {
    const newData = typeof data === 'function' ? data(diagramData) : data;
    
    addToHistory(diagramData);
    setDiagramDataState(newData);
    setHasUnsavedChanges(true);
    
    // Update history present
    setHistory(prev => ({ ...prev, present: newData }));
  }, [diagramData, addToHistory]);
  
  // ============================================================================
  // Node Operations
  // ============================================================================
  
  const addNode = useCallback((nodeType: NodeType, position = { x: 200, y: 200 }) => {
    const nodeColors = NODE_COLORS[diagramData.type] as Record<string, string>;
    const color = nodeColors[nodeType] || '#64748b';
    
    const newNode: DiagramNode = {
      id: `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: nodeType,
      position,
      data: {
        label: `Novo ${nodeType}`,
        color,
        backgroundColor: `${color}20`,
        borderColor: color
      }
    };
    
    setDiagramData(prev => ({
      ...prev,
      nodes: [...prev.nodes, newNode],
      metadata: {
        ...prev.metadata,
        updatedAt: new Date()
      }
    }));
    
    toast.success('Novo elemento adicionado!');
  }, [diagramData.type, setDiagramData]);
  
  const updateNode = useCallback((nodeId: string, updates: Partial<DiagramNode>) => {
    setDiagramData(prev => ({
      ...prev,
      nodes: prev.nodes.map(node => 
        node.id === nodeId ? { ...node, ...updates } : node
      ),
      metadata: {
        ...prev.metadata,
        updatedAt: new Date()
      }
    }));
  }, [setDiagramData]);
  
  const deleteNode = useCallback((nodeId: string) => {
    setDiagramData(prev => ({
      ...prev,
      nodes: prev.nodes.filter(node => node.id !== nodeId),
      edges: prev.edges.filter(edge => 
        edge.source !== nodeId && edge.target !== nodeId
      ),
      metadata: {
        ...prev.metadata,
        updatedAt: new Date()
      }
    }));
    
    setSelectedNodes(prev => prev.filter(id => id !== nodeId));
    toast.success('Elemento removido!');
  }, [setDiagramData]);
  
  const duplicateNode = useCallback((nodeId: string) => {
    const node = diagramData.nodes.find(n => n.id === nodeId);
    if (!node) return;
    
    const newNode: DiagramNode = {
      ...node,
      id: `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      position: {
        x: node.position.x + 50,
        y: node.position.y + 50
      },
      data: {
        ...node.data,
        label: `${node.data.label} (Cópia)`
      }
    };
    
    setDiagramData(prev => ({
      ...prev,
      nodes: [...prev.nodes, newNode],
      metadata: {
        ...prev.metadata,
        updatedAt: new Date()
      }
    }));
    
    toast.success('Elemento duplicado!');
  }, [diagramData.nodes, setDiagramData]);
  
  // ============================================================================
  // Edge Operations
  // ============================================================================
  
  const addEdge = useCallback((source: string, target: string, type: EdgeType = 'straight') => {
    const newEdge: DiagramEdge = {
      id: `edge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      source,
      target,
      type,
      data: {
        color: '#64748b'
      }
    };
    
    setDiagramData(prev => ({
      ...prev,
      edges: [...prev.edges, newEdge],
      metadata: {
        ...prev.metadata,
        updatedAt: new Date()
      }
    }));
    
    toast.success('Conexão criada!');
  }, [setDiagramData]);
  
  const updateEdge = useCallback((edgeId: string, updates: Partial<DiagramEdge>) => {
    setDiagramData(prev => ({
      ...prev,
      edges: prev.edges.map(edge => 
        edge.id === edgeId ? { ...edge, ...updates } : edge
      ),
      metadata: {
        ...prev.metadata,
        updatedAt: new Date()
      }
    }));
  }, [setDiagramData]);
  
  const deleteEdge = useCallback((edgeId: string) => {
    setDiagramData(prev => ({
      ...prev,
      edges: prev.edges.filter(edge => edge.id !== edgeId),
      metadata: {
        ...prev.metadata,
        updatedAt: new Date()
      }
    }));
    
    setSelectedEdges(prev => prev.filter(id => id !== edgeId));
    toast.success('Conexão removida!');
  }, [setDiagramData]);
  
  // ============================================================================
  // Selection Operations
  // ============================================================================
  
  const selectNode = useCallback((nodeId: string, multi = false) => {
    setSelectedNodes(prev => {
      if (multi) {
        return prev.includes(nodeId) 
          ? prev.filter(id => id !== nodeId)
          : [...prev, nodeId];
      }
      return [nodeId];
    });
    
    if (!multi) {
      setSelectedEdges([]);
    }
  }, []);
  
  const selectEdge = useCallback((edgeId: string, multi = false) => {
    setSelectedEdges(prev => {
      if (multi) {
        return prev.includes(edgeId) 
          ? prev.filter(id => id !== edgeId)
          : [...prev, edgeId];
      }
      return [edgeId];
    });
    
    if (!multi) {
      setSelectedNodes([]);
    }
  }, []);
  
  const clearSelection = useCallback(() => {
    setSelectedNodes([]);
    setSelectedEdges([]);
  }, []);
  
  const deleteSelected = useCallback(() => {
    if (selectedNodes.length === 0 && selectedEdges.length === 0) return;
    
    setDiagramData(prev => ({
      ...prev,
      nodes: prev.nodes.filter(node => !selectedNodes.includes(node.id)),
      edges: prev.edges.filter(edge => 
        !selectedEdges.includes(edge.id) &&
        !selectedNodes.includes(edge.source) &&
        !selectedNodes.includes(edge.target)
      ),
      metadata: {
        ...prev.metadata,
        updatedAt: new Date()
      }
    }));
    
    clearSelection();
    toast.success(`${selectedNodes.length + selectedEdges.length} elemento(s) removido(s)!`);
  }, [selectedNodes, selectedEdges, setDiagramData, clearSelection]);
  
  // ============================================================================
  // Utility Operations
  // ============================================================================
  
  const save = useCallback(async () => {
    if (!onSave) return;
    
    try {
      setIsLoading(true);
      await onSave(diagramData);
      setHasUnsavedChanges(false);
      toast.success('Diagrama salvo com sucesso!');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast.error(`Erro ao salvar: ${errorMessage}`);
      onError?.(error instanceof Error ? error : new Error(errorMessage));
    } finally {
      setIsLoading(false);
    }
  }, [diagramData, onSave, onError]);
  
  const reset = useCallback(() => {
    const defaultData = createDefaultDiagram(type);
    setDiagramDataState(defaultData);
    setHistory({
      past: [],
      present: defaultData,
      future: []
    });
    clearSelection();
    setHasUnsavedChanges(false);
    toast.success('Diagrama resetado!');
  }, [type, clearSelection]);
  
  const exportData = useCallback((format: 'json' | 'png' | 'svg' | 'pdf') => {
    try {
      switch (format) {
        case 'json':
          const dataStr = JSON.stringify(diagramData, null, 2);
          const dataBlob = new Blob([dataStr], { type: 'application/json' });
          const url = URL.createObjectURL(dataBlob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${diagramData.title}.json`;
          link.click();
          URL.revokeObjectURL(url);
          break;
        
        default:
          toast.info(`Exportação para ${format.toUpperCase()} será implementada em breve`);
      }
      
      toast.success(`Diagrama exportado como ${format.toUpperCase()}!`);
    } catch (error) {
      toast.error('Erro ao exportar diagrama');
      onError?.(error instanceof Error ? error : new Error('Erro na exportação'));
    }
  }, [diagramData, onError]);
  
  const importData = useCallback((data: DiagramData) => {
    try {
      addToHistory(diagramData);
      setDiagramDataState(data);
      setHistory(prev => ({ ...prev, present: data }));
      clearSelection();
      setHasUnsavedChanges(true);
      toast.success('Diagrama importado com sucesso!');
    } catch (error) {
      toast.error('Erro ao importar diagrama');
      onError?.(error instanceof Error ? error : new Error('Erro na importação'));
    }
  }, [diagramData, addToHistory, clearSelection, onError]);
  
  // ============================================================================
  // Layout Operations
  // ============================================================================
  
  const autoLayout = useCallback(() => {
    // Implementar algoritmo de layout automático
    toast.info('Layout automático será implementado em breve');
  }, []);
  
  const fitToView = useCallback(() => {
    // Implementar ajuste de visualização
    toast.info('Ajuste de visualização será implementado em breve');
  }, []);
  
  const centerView = useCallback(() => {
    // Implementar centralização da visualização
    toast.info('Centralização será implementada em breve');
  }, []);
  
  // ============================================================================
  // Validation
  // ============================================================================
  
  const validate = useCallback(() => {
    const errors: string[] = [];
    
    // Validar nós
    diagramData.nodes.forEach(node => {
      if (!node.data.label || node.data.label.trim() === '') {
        errors.push(`Nó ${node.id} não possui rótulo`);
      }
    });
    
    // Validar conexões
    diagramData.edges.forEach(edge => {
      const sourceExists = diagramData.nodes.some(node => node.id === edge.source);
      const targetExists = diagramData.nodes.some(node => node.id === edge.target);
      
      if (!sourceExists) {
        errors.push(`Conexão ${edge.id} possui origem inválida`);
      }
      if (!targetExists) {
        errors.push(`Conexão ${edge.id} possui destino inválido`);
      }
    });
    
    // Validações específicas por tipo
    if (diagramData.type === 'flowchart') {
      const startNodes = diagramData.nodes.filter(node => node.type === 'start');
      if (startNodes.length === 0) {
        errors.push('Fluxograma deve ter pelo menos um nó de início');
      }
      if (startNodes.length > 1) {
        errors.push('Fluxograma deve ter apenas um nó de início');
      }
    }
    
    if (diagramData.type === 'mindmap') {
      const rootNodes = diagramData.nodes.filter(node => node.type === 'root');
      if (rootNodes.length === 0) {
        errors.push('Mapa mental deve ter um nó raiz');
      }
      if (rootNodes.length > 1) {
        errors.push('Mapa mental deve ter apenas um nó raiz');
      }
    }
    
    if (diagramData.type === 'organogram') {
      const ceoNodes = diagramData.nodes.filter(node => node.type === 'ceo');
      if (ceoNodes.length > 1) {
        errors.push('Organograma deve ter no máximo um CEO');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }, [diagramData]);
  
  // ============================================================================
  // Auto Save Effect
  // ============================================================================
  
  useEffect(() => {
    if (!autoSave || !hasUnsavedChanges || !onSave) return;
    
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    
    autoSaveTimeoutRef.current = setTimeout(() => {
      save();
    }, autoSaveInterval);
    
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [autoSave, hasUnsavedChanges, autoSaveInterval, save, onSave]);
  
  // ============================================================================
  // Return
  // ============================================================================
  
  return {
    // State
    diagramData,
    selectedNodes,
    selectedEdges,
    selectedTool,
    hasUnsavedChanges,
    isLoading,
    history,
    
    // Actions
    setDiagramData,
    setSelectedNodes,
    setSelectedEdges,
    setSelectedTool,
    
    // Node operations
    addNode,
    updateNode,
    deleteNode,
    duplicateNode,
    
    // Edge operations
    addEdge,
    updateEdge,
    deleteEdge,
    
    // Selection operations
    selectNode,
    selectEdge,
    clearSelection,
    deleteSelected,
    
    // History operations
    undo,
    redo,
    canUndo,
    canRedo,
    
    // Utility operations
    save,
    reset,
    exportData,
    importData,
    
    // Layout operations
    autoLayout,
    fitToView,
    centerView,
    
    // Validation
    validate
  };
};

export default useDiagramIntegration;