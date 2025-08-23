// ============================================================================
// Unified Diagram Editor Hook - Hook unificado para editores de diagramas
// ============================================================================
// Consolidação da lógica de /training/DiagramEditor e /flowchart/FlowchartEditor
// Seguindo padrões BPMN 2.0 e referências do MindMeister
// ============================================================================

import { useCallback, useEffect, useRef, useState } from 'react';
import { 
  addEdge, 
  applyEdgeChanges, 
  applyNodeChanges, 
  Connection, 
  EdgeChange, 
  NodeChange, 
  useReactFlow,
  getIncomers,
  getOutgoers,
  getConnectedEdges
} from 'reactflow';
import { nanoid } from 'nanoid';
import { toast } from 'sonner';
import { 
  UnifiedDiagramDocument, 
  UnifiedDiagramNode, 
  UnifiedDiagramEdge, 
  UnifiedEditorState,
  UnifiedNodeType,
  UnifiedEdgeType,
  DiagramType,
  HistoryState,
  SelectionState,
  EditingState,
  ValidationState,
  DEFAULT_DIAGRAM_SETTINGS,
  DiagramDocumentSchema
} from '../types/unified-diagram';
import { useDiagramStore } from '../components/diagrams/stores/useDiagramStore';
import { useKeyboardShortcuts } from '../components/diagrams/hooks/useKeyboardShortcuts';
import { validateDiagram } from '../components/diagrams/utils/DiagramUtils';
import { generateThumbnailDataURL } from '../utils/diagramThumbnail';

// ============================================================================
// INTERFACES
// ============================================================================

interface UseUnifiedDiagramEditorProps {
  diagramId?: string;
  initialDocument?: Partial<UnifiedDiagramDocument>;
  type?: DiagramType;
  readOnly?: boolean;
  autoSave?: boolean;
  autoSaveInterval?: number;
  onSave?: (document: UnifiedDiagramDocument) => void;
  onValidationChange?: (validation: ValidationState) => void;
}

interface UseUnifiedDiagramEditorReturn {
  // Estado
  editorState: UnifiedEditorState;
  isLoading: boolean;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  
  // Operações de documento
  saveDocument: () => Promise<void>;
  loadDocument: (id: string) => Promise<void>;
  createNewDocument: (type: DiagramType) => void;
  exportDocument: (format: string) => Promise<void>;
  
  // Operações de nós
  addNode: (type: UnifiedNodeType, position: { x: number; y: number }, data?: Partial<UnifiedDiagramNode['data']>) => void;
  updateNode: (nodeId: string, updates: Partial<UnifiedDiagramNode>) => void;
  deleteNode: (nodeId: string) => void;
  duplicateNode: (nodeId: string) => void;
  
  // Operações de arestas
  addEdgeConnection: (connection: Connection) => void;
  updateEdge: (edgeId: string, updates: Partial<UnifiedDiagramEdge>) => void;
  deleteEdge: (edgeId: string) => void;
  
  // Seleção
  selectNodes: (nodeIds: string[]) => void;
  selectEdges: (edgeIds: string[]) => void;
  selectAll: () => void;
  clearSelection: () => void;
  
  // Clipboard
  copySelection: () => void;
  cutSelection: () => void;
  pasteFromClipboard: () => void;
  
  // Histórico
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  
  // Layout e visualização
  zoomToFit: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  centerView: () => void;
  
  // Validação
  validateDocument: () => ValidationState;
  
  // Handlers do ReactFlow
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  onSelectionChange: (params: { nodes: UnifiedDiagramNode[]; edges: UnifiedDiagramEdge[] }) => void;
}

// ============================================================================
// HOOK PRINCIPAL
// ============================================================================

export const useUnifiedDiagramEditor = ({
  diagramId,
  initialDocument,
  type = 'flowchart',
  readOnly = false,
  autoSave = true,
  autoSaveInterval = 30000,
  onSave,
  onValidationChange
}: UseUnifiedDiagramEditorProps = {}): UseUnifiedDiagramEditorReturn => {
  
  // ============================================================================
  // ESTADO E REFS
  // ============================================================================
  
  const reactFlowInstance = useReactFlow();
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();
  const lastSaveRef = useRef<string>();
  
  // Estado do store
  const {
    currentDocument,
    setCurrentDocument,
    saveDocument: storeSaveDocument,
    loadDocument: storeLoadDocument
  } = useDiagramStore();
  
  // Estados locais
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Estado do editor
  const [editorState, setEditorState] = useState<UnifiedEditorState>(() => {
    const baseDocument: UnifiedDiagramDocument = {
      id: diagramId || nanoid(),
      title: 'Novo Diagrama',
      description: '',
      type,
      category: 'process',
      status: 'draft',
      tags: [],
      nodes: [],
      edges: [],
      viewport: { x: 0, y: 0, zoom: 1 },
      settings: DEFAULT_DIAGRAM_SETTINGS,
      version: 1,
      isFavorite: false,
      viewCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: {
        id: 'current-user',
        name: 'Usuário Atual',
        email: 'user@example.com'
      },
      collaborators: [],
      isTemplate: false,
      ...initialDocument
    };
    
    return {
      document: baseDocument,
      history: {
        past: [],
        present: baseDocument,
        future: []
      },
      selection: {
        selectedNodes: [],
        selectedEdges: []
      },
      editing: {
        mode: 'select',
        isEditing: false,
        clipboard: {
          nodes: [],
          edges: []
        }
      },
      validation: {
        errors: [],
        isValid: true,
        lastValidation: new Date().toISOString()
      },
      viewport: { x: 0, y: 0, zoom: 1 },
      ui: {
        showSidebar: true,
        showToolbar: true,
        showProperties: true,
        showMinimap: true,
        showGrid: true,
        sidebarWidth: 300,
        propertiesWidth: 350
      },
      collaboration: {
        isConnected: false,
        activeUsers: []
      }
    };
  });
  
  // ============================================================================
  // FUNÇÕES AUXILIARES
  // ============================================================================
  
  const updateEditorState = useCallback((updates: Partial<UnifiedEditorState>) => {
    setEditorState(prev => ({ ...prev, ...updates }));
  }, []);
  
  const updateDocument = useCallback((updates: Partial<UnifiedDiagramDocument>) => {
    setEditorState(prev => ({
      ...prev,
      document: {
        ...prev.document,
        ...updates,
        updatedAt: new Date().toISOString(),
        version: prev.document.version + 1
      }
    }));
    setHasUnsavedChanges(true);
  }, []);
  
  const addToHistory = useCallback((document: UnifiedDiagramDocument) => {
    setEditorState(prev => {
      const newHistory: HistoryState = {
        past: [...prev.history.past, prev.history.present].slice(-50), // Máximo 50 estados
        present: document,
        future: []
      };
      
      return {
        ...prev,
        history: newHistory,
        document
      };
    });
  }, []);
  
  const generateNodeId = useCallback(() => `node_${nanoid()}`, []);
  const generateEdgeId = useCallback(() => `edge_${nanoid()}`, []);
  
  // ============================================================================
  // OPERAÇÕES DE DOCUMENTO
  // ============================================================================
  
  const saveDocument = useCallback(async () => {
    if (readOnly || isSaving) return;
    
    setIsSaving(true);
    try {
      // Gerar thumbnail do documento atual
      const thumbnailDataURL = generateThumbnailDataURL(editorState.document, {
        width: 300,
        height: 200,
        format: 'dataurl'
      });
      
      const documentToSave = {
        ...editorState.document,
        thumbnail: thumbnailDataURL
      };
      
      // Validar documento antes de salvar
      const validation = validateDiagram(documentToSave);
      if (!validation.isValid && validation.errors.some(e => e.type === 'error')) {
        toast.error('Não é possível salvar: documento contém erros de validação');
        return;
      }
      
      await storeSaveDocument(documentToSave);
      
      if (onSave) {
        onSave(documentToSave);
      }
      
      setHasUnsavedChanges(false);
      lastSaveRef.current = JSON.stringify(documentToSave);
      toast.success('Diagrama salvo com sucesso!');
      
    } catch (error) {
      console.error('Erro ao salvar documento:', error);
      toast.error('Erro ao salvar diagrama');
    } finally {
      setIsSaving(false);
    }
  }, [editorState.document, readOnly, isSaving, storeSaveDocument, onSave, reactFlowInstance]);
  
  const loadDocument = useCallback(async (id: string) => {
    setIsLoading(true);
    try {
      const document = await storeLoadDocument(id);
      if (document) {
        setEditorState(prev => ({
          ...prev,
          document,
          history: {
            past: [],
            present: document,
            future: []
          },
          selection: {
            selectedNodes: [],
            selectedEdges: []
          }
        }));
        setHasUnsavedChanges(false);
        lastSaveRef.current = JSON.stringify(document);
      }
    } catch (error) {
      console.error('Erro ao carregar documento:', error);
      toast.error('Erro ao carregar diagrama');
    } finally {
      setIsLoading(false);
    }
  }, [storeLoadDocument]);
  
  const createNewDocument = useCallback((newType: DiagramType) => {
    const newDocument: UnifiedDiagramDocument = {
      id: nanoid(),
      title: `Novo ${newType === 'flowchart' ? 'Fluxograma' : newType === 'mindmap' ? 'Mapa Mental' : 'Organograma'}`,
      description: '',
      type: newType,
      category: 'process',
      status: 'draft',
      tags: [],
      nodes: [],
      edges: [],
      viewport: { x: 0, y: 0, zoom: 1 },
      settings: DEFAULT_DIAGRAM_SETTINGS,
      version: 1,
      isFavorite: false,
      viewCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: {
        id: 'current-user',
        name: 'Usuário Atual',
        email: 'user@example.com'
      },
      collaborators: [],
      isTemplate: false
    };
    
    setEditorState(prev => ({
      ...prev,
      document: newDocument,
      history: {
        past: [],
        present: newDocument,
        future: []
      },
      selection: {
        selectedNodes: [],
        selectedEdges: []
      }
    }));
    
    setHasUnsavedChanges(true);
  }, []);
  
  const exportDocument = useCallback(async (format: string) => {
    try {
      let exportData;
      
      switch (format) {
        case 'json':
          exportData = JSON.stringify(editorState.document, null, 2);
          break;
        case 'png':
        case 'jpg':
        case 'svg':
          exportData = await reactFlowInstance.getViewport();
          break;
        default:
          throw new Error(`Formato ${format} não suportado`);
      }
      
      // Aqui você implementaria a lógica de download
      console.log('Exportando:', format, exportData);
      toast.success(`Diagrama exportado como ${format.toUpperCase()}`);
      
    } catch (error) {
      console.error('Erro ao exportar:', error);
      toast.error('Erro ao exportar diagrama');
    }
  }, [editorState.document, reactFlowInstance]);
  
  // ============================================================================
  // OPERAÇÕES DE NÓS
  // ============================================================================
  
  const addNode = useCallback((nodeType: UnifiedNodeType, position: { x: number; y: number }, data?: Partial<UnifiedDiagramNode['data']>) => {
    if (readOnly) return;
    
    const newNode: UnifiedDiagramNode = {
      id: generateNodeId(),
      type: nodeType,
      position,
      data: {
        label: `Novo ${nodeType}`,
        ...data
      }
    };
    
    const updatedDocument = {
      ...editorState.document,
      nodes: [...editorState.document.nodes, newNode]
    };
    
    addToHistory(updatedDocument);
  }, [readOnly, generateNodeId, editorState.document, addToHistory]);
  
  const updateNode = useCallback((nodeId: string, updates: Partial<UnifiedDiagramNode>) => {
    if (readOnly) return;
    
    const updatedDocument = {
      ...editorState.document,
      nodes: editorState.document.nodes.map(node => 
        node.id === nodeId ? { ...node, ...updates } : node
      )
    };
    
    updateDocument(updatedDocument);
  }, [readOnly, editorState.document, updateDocument]);
  
  const deleteNode = useCallback((nodeId: string) => {
    if (readOnly) return;
    
    const nodeToDelete = editorState.document.nodes.find(n => n.id === nodeId);
    if (!nodeToDelete) return;
    
    // Remover nó e todas as arestas conectadas
    const connectedEdges = getConnectedEdges([nodeToDelete], editorState.document.edges);
    
    const updatedDocument = {
      ...editorState.document,
      nodes: editorState.document.nodes.filter(node => node.id !== nodeId),
      edges: editorState.document.edges.filter(edge => 
        !connectedEdges.some(ce => ce.id === edge.id)
      )
    };
    
    addToHistory(updatedDocument);
  }, [readOnly, editorState.document, addToHistory]);
  
  const duplicateNode = useCallback((nodeId: string) => {
    if (readOnly) return;
    
    const nodeToDuplicate = editorState.document.nodes.find(n => n.id === nodeId);
    if (!nodeToDuplicate) return;
    
    const newNode: UnifiedDiagramNode = {
      ...nodeToDuplicate,
      id: generateNodeId(),
      position: {
        x: nodeToDuplicate.position.x + 50,
        y: nodeToDuplicate.position.y + 50
      },
      selected: false
    };
    
    const updatedDocument = {
      ...editorState.document,
      nodes: [...editorState.document.nodes, newNode]
    };
    
    addToHistory(updatedDocument);
  }, [readOnly, editorState.document, generateNodeId, addToHistory]);
  
  // ============================================================================
  // OPERAÇÕES DE ARESTAS
  // ============================================================================
  
  const addEdgeConnection = useCallback((connection: Connection) => {
    if (readOnly) return;
    
    const newEdge: UnifiedDiagramEdge = {
      id: generateEdgeId(),
      type: 'smoothstep',
      source: connection.source!,
      target: connection.target!,
      sourceHandle: connection.sourceHandle,
      targetHandle: connection.targetHandle,
      data: {
        label: ''
      }
    };
    
    const updatedDocument = {
      ...editorState.document,
      edges: addEdge(newEdge, editorState.document.edges)
    };
    
    addToHistory(updatedDocument);
  }, [readOnly, generateEdgeId, editorState.document, addToHistory]);
  
  const updateEdge = useCallback((edgeId: string, updates: Partial<UnifiedDiagramEdge>) => {
    if (readOnly) return;
    
    const updatedDocument = {
      ...editorState.document,
      edges: editorState.document.edges.map(edge => 
        edge.id === edgeId ? { ...edge, ...updates } : edge
      )
    };
    
    updateDocument(updatedDocument);
  }, [readOnly, editorState.document, updateDocument]);
  
  const deleteEdge = useCallback((edgeId: string) => {
    if (readOnly) return;
    
    const updatedDocument = {
      ...editorState.document,
      edges: editorState.document.edges.filter(edge => edge.id !== edgeId)
    };
    
    addToHistory(updatedDocument);
  }, [readOnly, editorState.document, addToHistory]);
  
  // ============================================================================
  // OPERAÇÕES DE SELEÇÃO
  // ============================================================================
  
  const selectNodes = useCallback((nodeIds: string[]) => {
    updateEditorState({
      selection: {
        ...editorState.selection,
        selectedNodes: nodeIds
      }
    });
  }, [editorState.selection, updateEditorState]);
  
  const selectEdges = useCallback((edgeIds: string[]) => {
    updateEditorState({
      selection: {
        ...editorState.selection,
        selectedEdges: edgeIds
      }
    });
  }, [editorState.selection, updateEditorState]);
  
  const selectAll = useCallback(() => {
    updateEditorState({
      selection: {
        selectedNodes: editorState.document.nodes.map(n => n.id),
        selectedEdges: editorState.document.edges.map(e => e.id)
      }
    });
  }, [editorState.document, updateEditorState]);
  
  const clearSelection = useCallback(() => {
    updateEditorState({
      selection: {
        selectedNodes: [],
        selectedEdges: []
      }
    });
  }, [updateEditorState]);
  
  // ============================================================================
  // OPERAÇÕES DE CLIPBOARD
  // ============================================================================
  
  const copySelection = useCallback(() => {
    const selectedNodes = editorState.document.nodes.filter(n => 
      editorState.selection.selectedNodes.includes(n.id)
    );
    const selectedEdges = editorState.document.edges.filter(e => 
      editorState.selection.selectedEdges.includes(e.id)
    );
    
    updateEditorState({
      editing: {
        ...editorState.editing,
        clipboard: {
          nodes: selectedNodes,
          edges: selectedEdges
        }
      }
    });
    
    toast.success(`${selectedNodes.length} nós e ${selectedEdges.length} conexões copiados`);
  }, [editorState.document, editorState.selection, editorState.editing, updateEditorState]);
  
  const cutSelection = useCallback(() => {
    copySelection();
    
    // Deletar nós e arestas selecionados
    const updatedDocument = {
      ...editorState.document,
      nodes: editorState.document.nodes.filter(n => 
        !editorState.selection.selectedNodes.includes(n.id)
      ),
      edges: editorState.document.edges.filter(e => 
        !editorState.selection.selectedEdges.includes(e.id)
      )
    };
    
    addToHistory(updatedDocument);
    clearSelection();
  }, [copySelection, editorState.document, editorState.selection, addToHistory, clearSelection]);
  
  const pasteFromClipboard = useCallback(() => {
    if (readOnly) return;
    
    const { clipboard } = editorState.editing;
    if (clipboard.nodes.length === 0 && clipboard.edges.length === 0) {
      toast.error('Clipboard vazio');
      return;
    }
    
    // Criar novos IDs e ajustar posições
    const nodeIdMap = new Map<string, string>();
    const newNodes = clipboard.nodes.map(node => {
      const newId = generateNodeId();
      nodeIdMap.set(node.id, newId);
      return {
        ...node,
        id: newId,
        position: {
          x: node.position.x + 50,
          y: node.position.y + 50
        },
        selected: true
      };
    });
    
    const newEdges = clipboard.edges
      .filter(edge => nodeIdMap.has(edge.source) && nodeIdMap.has(edge.target))
      .map(edge => ({
        ...edge,
        id: generateEdgeId(),
        source: nodeIdMap.get(edge.source)!,
        target: nodeIdMap.get(edge.target)!,
        selected: true
      }));
    
    const updatedDocument = {
      ...editorState.document,
      nodes: [...editorState.document.nodes, ...newNodes],
      edges: [...editorState.document.edges, ...newEdges]
    };
    
    addToHistory(updatedDocument);
    
    // Selecionar elementos colados
    updateEditorState({
      selection: {
        selectedNodes: newNodes.map(n => n.id),
        selectedEdges: newEdges.map(e => e.id)
      }
    });
    
    toast.success(`${newNodes.length} nós e ${newEdges.length} conexões colados`);
  }, [readOnly, editorState.editing, editorState.document, generateNodeId, generateEdgeId, addToHistory, updateEditorState]);
  
  // ============================================================================
  // OPERAÇÕES DE HISTÓRICO
  // ============================================================================
  
  const undo = useCallback(() => {
    if (readOnly || editorState.history.past.length === 0) return;
    
    const previous = editorState.history.past[editorState.history.past.length - 1];
    const newPast = editorState.history.past.slice(0, -1);
    
    setEditorState(prev => ({
      ...prev,
      document: previous,
      history: {
        past: newPast,
        present: previous,
        future: [prev.history.present, ...prev.history.future]
      }
    }));
    
    setHasUnsavedChanges(true);
  }, [readOnly, editorState.history]);
  
  const redo = useCallback(() => {
    if (readOnly || editorState.history.future.length === 0) return;
    
    const next = editorState.history.future[0];
    const newFuture = editorState.history.future.slice(1);
    
    setEditorState(prev => ({
      ...prev,
      document: next,
      history: {
        past: [...prev.history.past, prev.history.present],
        present: next,
        future: newFuture
      }
    }));
    
    setHasUnsavedChanges(true);
  }, [readOnly, editorState.history]);
  
  const canUndo = editorState.history.past.length > 0 && !readOnly;
  const canRedo = editorState.history.future.length > 0 && !readOnly;
  
  // ============================================================================
  // OPERAÇÕES DE LAYOUT E VISUALIZAÇÃO
  // ============================================================================
  
  const zoomToFit = useCallback(() => {
    reactFlowInstance.fitView({ padding: 0.1 });
  }, [reactFlowInstance]);
  
  const zoomIn = useCallback(() => {
    reactFlowInstance.zoomIn();
  }, [reactFlowInstance]);
  
  const zoomOut = useCallback(() => {
    reactFlowInstance.zoomOut();
  }, [reactFlowInstance]);
  
  const centerView = useCallback(() => {
    reactFlowInstance.setCenter(0, 0);
  }, [reactFlowInstance]);
  
  // ============================================================================
  // VALIDAÇÃO
  // ============================================================================
  
  const validateDocument = useCallback((): ValidationState => {
    const validation = validateDiagram(
      editorState.document.nodes || [],
      editorState.document.edges || [],
      editorState.document.type
    );
    
    const validationState: ValidationState = {
      errors: validation.errors.map(error => ({
        id: error.id,
        type: error.severity === 'error' ? 'error' : 'warning',
        message: error.message,
        nodeId: error.id,
        edgeId: undefined
      })),
      isValid: validation.isValid,
      lastValidation: new Date().toISOString()
    };
    
    updateEditorState({
      validation: validationState
    });
    
    if (onValidationChange) {
      onValidationChange(validationState);
    }
    
    return validationState;
  }, [editorState.document, updateEditorState, onValidationChange]);
  
  // ============================================================================
  // HANDLERS DO REACTFLOW
  // ============================================================================
  
  const onNodesChange = useCallback((changes: NodeChange[]) => {
    if (readOnly) return;
    
    const updatedNodes = applyNodeChanges(changes, editorState.document.nodes);
    updateDocument({ nodes: updatedNodes });
  }, [readOnly, editorState.document.nodes, updateDocument]);
  
  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    if (readOnly) return;
    
    const updatedEdges = applyEdgeChanges(changes, editorState.document.edges);
    updateDocument({ edges: updatedEdges });
  }, [readOnly, editorState.document.edges, updateDocument]);
  
  const onConnect = useCallback((connection: Connection) => {
    addEdgeConnection(connection);
  }, [addEdgeConnection]);
  
  const onSelectionChange = useCallback((params: { nodes: UnifiedDiagramNode[]; edges: UnifiedDiagramEdge[] }) => {
    updateEditorState({
      selection: {
        selectedNodes: params.nodes.map(n => n.id),
        selectedEdges: params.edges.map(e => e.id)
      }
    });
  }, [updateEditorState]);
  
  // ============================================================================
  // ATALHOS DE TECLADO
  // ============================================================================
  
  useKeyboardShortcuts({
    'ctrl+s': saveDocument,
    'ctrl+z': undo,
    'ctrl+y': redo,
    'ctrl+c': copySelection,
    'ctrl+v': pasteFromClipboard,
    'ctrl+x': cutSelection,
    'ctrl+a': selectAll,
    'escape': clearSelection,
    'delete': () => {
      if (editorState.selection.selectedNodes.length > 0) {
        editorState.selection.selectedNodes.forEach(deleteNode);
      }
      if (editorState.selection.selectedEdges.length > 0) {
        editorState.selection.selectedEdges.forEach(deleteEdge);
      }
    }
  }, !readOnly);
  
  // ============================================================================
  // EFEITOS
  // ============================================================================
  
  // Auto-save
  useEffect(() => {
    if (!autoSave || readOnly || !hasUnsavedChanges) return;
    
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    
    autoSaveTimeoutRef.current = setTimeout(() => {
      saveDocument();
    }, autoSaveInterval);
    
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [autoSave, readOnly, hasUnsavedChanges, autoSaveInterval, saveDocument]);
  
  // Carregar documento inicial
  useEffect(() => {
    if (diagramId && diagramId !== editorState.document.id) {
      loadDocument(diagramId);
    }
  }, [diagramId, editorState.document.id, loadDocument]);
  
  // Validação automática
  useEffect(() => {
    if (editorState.document.settings.validation.enabled) {
      const timeoutId = setTimeout(() => {
        validateDocument();
      }, 1000); // Debounce de 1 segundo
      
      return () => clearTimeout(timeoutId);
    }
  }, [editorState.document, validateDocument]);
  
  // ============================================================================
  // RETORNO
  // ============================================================================
  
  return {
    // Estado
    editorState,
    isLoading,
    isSaving,
    hasUnsavedChanges,
    
    // Operações de documento
    saveDocument,
    loadDocument,
    createNewDocument,
    exportDocument,
    
    // Operações de nós
    addNode,
    updateNode,
    deleteNode,
    duplicateNode,
    
    // Operações de arestas
    addEdgeConnection,
    updateEdge,
    deleteEdge,
    
    // Seleção
    selectNodes,
    selectEdges,
    selectAll,
    clearSelection,
    
    // Clipboard
    copySelection,
    cutSelection,
    pasteFromClipboard,
    
    // Histórico
    undo,
    redo,
    canUndo,
    canRedo,
    
    // Layout e visualização
    zoomToFit,
    zoomIn,
    zoomOut,
    centerView,
    
    // Validação
    validateDocument,
    
    // Handlers do ReactFlow
    onNodesChange,
    onEdgesChange,
    onConnect,
    onSelectionChange
  };
};

export default useUnifiedDiagramEditor;