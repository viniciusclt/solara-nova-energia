// ============================================================================
// Hooks para Sistema de Diagramas
// ============================================================================

import { useCallback, useMemo, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { ReactFlowInstance } from 'reactflow';
import { secureLogger } from '@/utils/secureLogger';
import {
  useDiagramStore,
  DiagramState,
  DiagramActions
} from '../stores/useDiagramStore';
import {
  DiagramNode,
  DiagramEdge,
  DiagramDocument,
  EditorMode,
  DiagramType,
  NodeType,
  Position,
  Viewport,
  DiagramNodeData
} from '../types';

// ============================================================================
// Hook para Nós do Diagrama
// ============================================================================

export const useDiagramNodes = () => {
  return useDiagramStore(useShallow((state) => state.document.nodes));
};

export const useDiagramNodesActions = () => {
  return useDiagramStore(useShallow((state) => ({
    addNode: state.addNode,
    updateNode: state.updateNode,
    deleteNode: state.deleteNode,
    duplicateNode: state.duplicateNode,
    moveNode: state.moveNode,
    resizeNode: state.resizeNode
  })));
};

// ============================================================================
// Hook para Edges do Diagrama
// ============================================================================

export const useDiagramEdges = () => {
  return useDiagramStore(useShallow((state) => state.document.edges));
};

export const useDiagramEdgesActions = () => {
  return useDiagramStore(useShallow((state) => ({
    addEdge: state.addEdge,
    updateEdge: state.updateEdge,
    deleteEdge: state.deleteEdge,
    duplicateEdge: state.duplicateEdge
  })));
};

// ============================================================================
// Hook para Estado da UI
// ============================================================================

export const useDiagramUI = () => {
  return useDiagramStore(useShallow((state) => state.ui));
};

export const useDiagramUIActions = () => {
  return useDiagramStore(useShallow((state) => ({
    selectNodes: state.selectNodes,
    selectEdges: state.selectEdges,
    clearSelection: state.clearSelection,
    setViewport: state.setViewport,
    toggleGrid: state.toggleGrid,
    toggleControls: state.toggleControls,
    toggleMinimap: state.toggleMinimap,
    zoomIn: state.zoomIn,
    zoomOut: state.zoomOut,
    zoomToFit: state.zoomToFit,
    resetZoom: state.resetZoom
  })));
};

// ============================================================================
// Hook para Configurações do Editor
// ============================================================================

export const useDiagramEditor = () => {
  return useDiagramStore(useShallow((state) => state.editor));
};

export const useDiagramEditorActions = () => {
  return useDiagramStore(useShallow((state) => ({
    setEditorMode: state.setEditorMode,
    setDiagramType: state.setDiagramType,
    setConnectionLineType: state.setConnectionLineType,
    setSnapToGrid: state.setSnapToGrid,
    setGridSize: state.setGridSize
  })));
};

// ============================================================================
// Hook para Histórico
// ============================================================================

export const useDiagramHistory = () => {
  return useDiagramStore(useShallow((state) => state.history));
};

export const useDiagramHistoryActions = () => {
  return useDiagramStore(useShallow((state) => ({
    undo: state.undo,
    redo: state.redo,
    pushToHistory: state.pushToHistory,
    clearHistory: state.clearHistory
  })));
};

// ============================================================================
// Hook para Operações de Clipboard
// ============================================================================

export const useDiagramClipboard = () => {
  return useDiagramStore(useShallow((state) => ({
    clipboard: state.ui.clipboard,
    copySelectedElements: state.copySelectedElements,
    cutSelectedElements: state.cutSelectedElements,
    pasteElements: state.pasteElements,
    deleteSelectedElements: state.deleteSelectedElements
  })));
};

// ============================================================================
// Hook para Gerenciamento de Documentos
// ============================================================================

export const useDiagramDocument = () => {
  const document = useDiagramStore(useShallow((state) => state.document));
  const actions = useDiagramStore(useShallow((state) => ({
    loadDocument: state.loadDocument,
    saveDocument: state.saveDocument,
    createNewDocument: state.createNewDocument,
    exportDocument: state.exportDocument,
    importDocument: state.importDocument
  })));

  return {
    document,
    ...actions
  };
};

// ============================================================================
// Hook Avançado para Editor de Diagramas
// ============================================================================

export const useDiagramEditor2 = () => {
  const reactFlowInstance = useRef<ReactFlowInstance | null>(null);
  
  const state = useDiagramStore();
  const nodes = useDiagramNodes();
  const edges = useDiagramEdges();
  const ui = useDiagramUI();
  const editor = useDiagramEditor();
  
  // ============================================================================
  // Operações de Nós
  // ============================================================================

  const addNodeAtPosition = useCallback(async (nodeType: NodeType, position: Position, data?: Partial<DiagramNodeData>) => {
    const newNode: Omit<DiagramNode, 'id'> = {
      type: nodeType,
      position,
      data: data || {},
      width: 150,
      height: 50
    };

    await state.addNode(newNode);
    secureLogger.info('Nó adicionado na posição', { nodeType, position });
  }, [state]);

  const addNodeAtCenter = useCallback((nodeType: NodeType, data?: Partial<DiagramNodeData>) => {
    const centerPosition = {
      x: ui.viewport.x + (window.innerWidth / 2) / ui.viewport.zoom,
      y: ui.viewport.y + (window.innerHeight / 2) / ui.viewport.zoom
    };

    addNodeAtPosition(nodeType, centerPosition, data);
  }, [addNodeAtPosition, ui.viewport]);

  const getSelectedNodes = useCallback(() => {
    return nodes.filter(node => ui.selectedNodes.includes(node.id));
  }, [nodes, ui.selectedNodes]);

  const getSelectedEdges = useCallback(() => {
    return edges.filter(edge => ui.selectedEdges.includes(edge.id));
  }, [edges, ui.selectedEdges]);

  // ============================================================================
  // Operações de Layout
  // ============================================================================

  const autoLayout = useCallback(async (direction: 'horizontal' | 'vertical' = 'horizontal') => {
    if (!reactFlowInstance.current) return;

    const selectedNodes = getSelectedNodes();
    const nodesToLayout = selectedNodes.length > 0 ? selectedNodes : nodes;

    if (nodesToLayout.length < 2) return;

    const spacing = 100;
    let currentX = 0;
    let currentY = 0;

    for (const [index, node] of nodesToLayout.entries()) {
      const position = direction === 'horizontal'
        ? { x: currentX, y: currentY }
        : { x: currentX, y: currentY };

      await state.updateNode(node.id, { position });

      if (direction === 'horizontal') {
        currentX += (node.width || 150) + spacing;
      } else {
        currentY += (node.height || 50) + spacing;
      }
    }

    secureLogger.info('Auto layout aplicado', { direction, nodeCount: nodesToLayout.length });
  }, [nodes, getSelectedNodes, state]);

  const alignNodes = useCallback(async (alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
    const selectedNodes = getSelectedNodes();
    if (selectedNodes.length < 2) return;

    const positions = selectedNodes.map(node => node.position);
    let targetValue: number;

    switch (alignment) {
      case 'left':
        targetValue = Math.min(...positions.map(p => p.x));
        for (const node of selectedNodes) {
          await state.updateNode(node.id, { position: { ...node.position, x: targetValue } });
        }
        break;
      case 'right':
        targetValue = Math.max(...positions.map(p => p.x));
        for (const node of selectedNodes) {
          await state.updateNode(node.id, { position: { ...node.position, x: targetValue } });
        }
        break;
      case 'center':
        targetValue = positions.reduce((sum, p) => sum + p.x, 0) / positions.length;
        for (const node of selectedNodes) {
          await state.updateNode(node.id, { position: { ...node.position, x: targetValue } });
        }
        break;
      case 'top':
        targetValue = Math.min(...positions.map(p => p.y));
        for (const node of selectedNodes) {
          await state.updateNode(node.id, { position: { ...node.position, y: targetValue } });
        }
        break;
      case 'bottom':
        targetValue = Math.max(...positions.map(p => p.y));
        for (const node of selectedNodes) {
          await state.updateNode(node.id, { position: { ...node.position, y: targetValue } });
        }
        break;
      case 'middle':
        targetValue = positions.reduce((sum, p) => sum + p.y, 0) / positions.length;
        for (const node of selectedNodes) {
          await state.updateNode(node.id, { position: { ...node.position, y: targetValue } });
        }
        break;
    }

    secureLogger.info('Nós alinhados', { alignment, nodeCount: selectedNodes.length });
  }, [getSelectedNodes, state]);

  // ============================================================================
  // Operações de Busca
  // ============================================================================

  const findNodesByLabel = useCallback((searchTerm: string) => {
    const term = searchTerm.toLowerCase();
    return nodes.filter(node => {
      const label = node.data.label?.toString().toLowerCase() || '';
      return label.includes(term);
    });
  }, [nodes]);

  const findNodeById = useCallback((nodeId: string) => {
    return nodes.find(node => node.id === nodeId);
  }, [nodes]);

  const findEdgeById = useCallback((edgeId: string) => {
    return edges.find(edge => edge.id === edgeId);
  }, [edges]);

  // ============================================================================
  // Operações de Validação
  // ============================================================================

  const validateDiagram = useCallback(() => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Verificar nós órfãos (sem conexões)
    const connectedNodeIds = new Set<string>();
    edges.forEach(edge => {
      connectedNodeIds.add(edge.source);
      connectedNodeIds.add(edge.target);
    });

    const orphanNodes = nodes.filter(node => !connectedNodeIds.has(node.id));
    if (orphanNodes.length > 0) {
      warnings.push(`${orphanNodes.length} nó(s) sem conexões encontrado(s)`);
    }

    // Verificar edges inválidas
    const nodeIds = new Set(nodes.map(node => node.id));
    const invalidEdges = edges.filter(edge => 
      !nodeIds.has(edge.source) || !nodeIds.has(edge.target)
    );
    if (invalidEdges.length > 0) {
      errors.push(`${invalidEdges.length} conexão(ões) inválida(s) encontrada(s)`);
    }

    // Verificar nós sem rótulo
    const nodesWithoutLabel = nodes.filter(node => !node.data.label);
    if (nodesWithoutLabel.length > 0) {
      warnings.push(`${nodesWithoutLabel.length} nó(s) sem rótulo encontrado(s)`);
    }

    return { errors, warnings, isValid: errors.length === 0 };
  }, [nodes, edges]);

  // ============================================================================
  // Estatísticas do Diagrama
  // ============================================================================

  const diagramStats = useMemo(() => {
    const nodesByType = nodes.reduce((acc, node) => {
      acc[node.type] = (acc[node.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const edgesByType = edges.reduce((acc, edge) => {
      const type = edge.type || 'default';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalNodes: nodes.length,
      totalEdges: edges.length,
      nodesByType,
      edgesByType,
      selectedNodes: ui.selectedNodes.length,
      selectedEdges: ui.selectedEdges.length
    };
  }, [nodes, edges, ui.selectedNodes, ui.selectedEdges]);

  // ============================================================================
  // Return
  // ============================================================================

  return {
    // Refs
    reactFlowInstance,
    
    // Estado
    nodes,
    edges,
    ui,
    editor,
    
    // Operações de Nós
    addNodeAtPosition,
    addNodeAtCenter,
    getSelectedNodes,
    getSelectedEdges,
    
    // Operações de Layout
    autoLayout,
    alignNodes,
    
    // Operações de Busca
    findNodesByLabel,
    findNodeById,
    findEdgeById,
    
    // Validação
    validateDiagram,
    
    // Estatísticas
    diagramStats,
    
    // Ações do Store
    ...state
  };
};

// ============================================================================
// Hook para Drag and Drop
// ============================================================================

export const useDiagramDragDrop = () => {
  const { addNode } = useDiagramStore();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const reactFlowInstance = useRef<ReactFlowInstance | null>(null);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(async (event: React.DragEvent) => {
    event.preventDefault();

    const nodeType = event.dataTransfer.getData('application/reactflow') as NodeType;
    if (!nodeType || !reactFlowInstance.current || !reactFlowWrapper.current) {
      return;
    }

    const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
    const position = reactFlowInstance.current.project({
      x: event.clientX - reactFlowBounds.left,
      y: event.clientY - reactFlowBounds.top
    });

    const newNode: Omit<DiagramNode, 'id'> = {
      type: nodeType,
      position,
      data: { label: `Novo ${nodeType}` }
    };

    await addNode(newNode);
    secureLogger.info('Nó adicionado via drag and drop', { nodeType, position });
  }, [addNode]);

  return {
    reactFlowWrapper,
    reactFlowInstance,
    onDragOver,
    onDrop
  };
};

// ============================================================================
// Hook para Atalhos de Teclado
// ============================================================================

export const useDiagramKeyboardShortcuts = () => {
  const {
    undo,
    redo,
    copySelectedElements,
    cutSelectedElements,
    pasteElements,
    deleteSelectedElements,
    zoomIn,
    zoomOut,
    zoomToFit,
    resetZoom
  } = useDiagramStore();

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const { ctrlKey, metaKey, key, shiftKey } = event;
    const isModifierPressed = ctrlKey || metaKey;

    if (isModifierPressed) {
      switch (key.toLowerCase()) {
        case 'z':
          event.preventDefault();
          if (shiftKey) {
            redo();
          } else {
            undo();
          }
          break;
        case 'y':
          event.preventDefault();
          redo();
          break;
        case 'c':
          event.preventDefault();
          copySelectedElements();
          break;
        case 'x':
          event.preventDefault();
          cutSelectedElements();
          break;
        case 'v':
          event.preventDefault();
          pasteElements();
          break;
        case '=':
        case '+':
          event.preventDefault();
          zoomIn();
          break;
        case '-':
          event.preventDefault();
          zoomOut();
          break;
        case '0':
          event.preventDefault();
          if (shiftKey) {
            zoomToFit();
          } else {
            resetZoom();
          }
          break;
      }
    } else {
      switch (key) {
        case 'Delete':
        case 'Backspace':
          event.preventDefault();
          deleteSelectedElements();
          break;
      }
    }
  }, [
    undo,
    redo,
    copySelectedElements,
    cutSelectedElements,
    pasteElements,
    deleteSelectedElements,
    zoomIn,
    zoomOut,
    zoomToFit,
    resetZoom
  ]);

  return { handleKeyDown };
};

// ============================================================================
// Exports
// ============================================================================

export {
  useDiagramStore
} from '../stores/useDiagramStore';

// Hooks de Export/Import
export { useDiagramExport } from './useDiagramExport';
export { useDiagramImport } from './useDiagramImport';
export { useDiagramState } from './useDiagramState';
export { useDragAndDrop } from './useDragAndDrop';
export { useNodeOperations } from './useNodeOperations';
export { useDiagramEditor } from './useDiagramEditor';