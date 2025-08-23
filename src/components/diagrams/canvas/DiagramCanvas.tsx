// ============================================================================
// DiagramCanvas - Área de desenho dos diagramas
// ============================================================================

import React, { useCallback, useRef, useMemo, useEffect, useState, memo } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  MiniMap,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  EdgeChange,
  NodeChange,
  ReactFlowInstance,
  BackgroundVariant,
  ConnectionLineType,
  MarkerType,
  OnSelectionChangeParams
} from 'reactflow';
import 'reactflow/dist/style.css';
import { cn } from '@/lib/utils';
import { secureLogger } from '@/utils/secureLogger';
import {
  DiagramCanvasProps,
  DiagramNode,
  DiagramEdge,
  ReactFlowNode,
  ReactFlowEdge,
  DiagramNodeData,
  DiagramViewport
} from '../types';
import {
  useDiagramStore,
  useDiagramNodes,
  useDiagramEdges,
  useDiagramUI,
  useDiagramEditor
} from '../stores/useDiagramStore';
import {
  useAccessibleDiagram,
  useKeyboardNavigation,
  useFocusManagement,
  useDiagramScreenReader
} from '../accessibility';

// Importar componentes de nós e arestas
import { nodeTypes, enhancedNodeTypes } from '../nodes';
import { edgeTypes } from '../edges';

// ============================================================================
// Tipos de Nós e Arestas Disponíveis
// ============================================================================

// ============================================================================
// Estilos de Edge Padrão
// ============================================================================

const defaultEdgeOptions = {
  animated: false,
  style: {
    strokeWidth: 2,
    stroke: '#64748b'
  },
  markerEnd: {
    type: MarkerType.ArrowClosed,
    color: '#64748b'
  }
};

// ============================================================================
// Componente Principal
// ============================================================================

export const DiagramCanvas: React.FC<DiagramCanvasProps> = memo(({
  readOnly = false,
  className
}) => {
  // ============================================================================
  // Store e Estado
  // ============================================================================

  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const reactFlowInstance = useRef<ReactFlowInstance | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  
  const nodes = useDiagramNodes();
  const edges = useDiagramEdges();
  const ui = useDiagramUI();
  const editor = useDiagramEditor();
  
  const {
    addNode,
    updateNode,
    updateEdge,
    addEdge: addDiagramEdge,
    deleteNode,
    deleteEdge,
    selectNodes,
    selectEdges,
    clearSelection,
    setViewport,
    pushToHistory
  } = useDiagramStore();

  // ============================================================================
  // Hooks de Acessibilidade
  // ============================================================================
  
  const { 
    isAccessibilityEnabled,
    announceAction,
    validateAccessibility 
  } = useAccessibleDiagram({
    containerId: 'diagram-canvas',
    nodes: reactFlowNodes,
    edges: reactFlowEdges
  });
  
  const {
    handleKeyDown: handleAccessibleKeyDown,
    focusedElementId,
    navigateToNext,
    navigateToPrevious
  } = useKeyboardNavigation({
    elements: [...reactFlowNodes, ...reactFlowEdges],
    onAction: (action, elementId) => {
      announceAction(action, elementId);
    }
  });
  
  const {
    registerFocusable,
    unregisterFocusable,
    setFocus
  } = useFocusManagement();
  
  const {
    announceNodeCreated,
    announceNodeDeleted,
    announceNodeMoved,
    announceEdgeCreated,
    announceEdgeDeleted,
    announceSelection,
    announceZoom,
    announcePan
  } = useDiagramScreenReader();

  // ============================================================================
  // Conversão de Dados
  // ============================================================================

  const reactFlowNodes: ReactFlowNode[] = useMemo(() => {
    return nodes.map(node => ({
      id: node.id,
      type: node.type,
      position: node.position,
      data: node.data,
      selected: ui.selectedNodes.includes(node.id),
      draggable: !readOnly && editor.mode === 'select',
      selectable: !readOnly,
      connectable: !readOnly && editor.mode === 'connect',
      deletable: !readOnly,
      width: node.width,
      height: node.height
    }));
  }, [nodes, ui.selectedNodes, readOnly, editor.mode]);

  const reactFlowEdges: ReactFlowEdge[] = useMemo(() => {
    return edges.map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: edge.type || 'default',
      label: edge.label,
      animated: edge.animated || false,
      style: edge.style || defaultEdgeOptions.style,
      markerEnd: edge.markerEnd || defaultEdgeOptions.markerEnd,
      selected: ui.selectedEdges.includes(edge.id),
      deletable: !readOnly,
      data: edge.data
    }));
  }, [edges, ui.selectedEdges, readOnly]);

  // ============================================================================
  // Handlers do ReactFlow
  // ============================================================================

  const onNodesChange = useCallback(async (changes: NodeChange[]) => {
    if (readOnly) return;

    for (const change of changes) {
      switch (change.type) {
        case 'position':
          if (change.position && change.dragging === false) {
            await updateNode(change.id, { position: change.position });
            const node = reactFlowNodes.find(n => n.id === change.id);
            if (node) {
              announceNodeMoved(node.id, node.data?.label || 'Nó', change.position);
            }
            secureLogger.info('Posição do nó atualizada', { nodeId: change.id, position: change.position });
          }
          break;
          
        case 'dimensions':
          if (change.dimensions) {
            secureLogger.debug('Dimensões do nó atualizadas', {
              nodeId: change.id,
              dimensions: change.dimensions
            });
            await updateNode(change.id, {
              width: change.dimensions.width,
              height: change.dimensions.height
            });
          }
          break;
          
        case 'remove':
          const node = reactFlowNodes.find(n => n.id === change.id);
          await deleteNode(change.id);
          if (node) {
            announceNodeDeleted(node.id, node.data?.label || 'Nó');
          }
          secureLogger.info('Nó removido via canvas', { nodeId: change.id });
          break;
        case 'select':
          secureLogger.debug('Nó selecionado via canvas', {
            nodeId: change.id,
            selected: change.selected
          });
          break;
      }
    }
  }, [readOnly, updateNode, deleteNode, reactFlowNodes, announceNodeDeleted, announceNodeMoved]);

  const onEdgesChange = useCallback(async (changes: EdgeChange[]) => {
    if (readOnly) return;

    for (const change of changes) {
      switch (change.type) {
        case 'remove':
          await deleteEdge(change.id);
          secureLogger.info('Edge removida via canvas', { edgeId: change.id });
          break;
        case 'select':
          secureLogger.debug('Edge selecionada via canvas', {
            edgeId: change.id,
            selected: change.selected
          });
          break;
      }
    }
  }, [readOnly, deleteEdge]);

  const onConnect = useCallback((connection: Connection) => {
    if (readOnly || !connection.source || !connection.target) return;

    const newEdge: Omit<DiagramEdge, 'id'> = {
      source: connection.source,
      target: connection.target,
      type: (editor.connectionLineType as ConnectionLineType) || 'default'
    };

    addDiagramEdge(newEdge);
    announceEdgeCreated(`edge-${Date.now()}`, connection.source, connection.target);
    secureLogger.info('Nova conexão criada', { source: connection.source, target: connection.target });
  }, [readOnly, addDiagramEdge, editor.connectionLineType, announceEdgeCreated]);

  const onSelectionChange = useCallback((params: OnSelectionChangeParams) => {
    const selectedNodeIds = params.nodes.map(node => node.id);
    const selectedEdgeIds = params.edges.map(edge => edge.id);

    secureLogger.debug('Seleção alterada via canvas', {
      selectedNodes: selectedNodeIds.length,
      selectedEdges: selectedEdgeIds.length,
      nodeIds: selectedNodeIds,
      edgeIds: selectedEdgeIds
    });

    // Anunciar seleção para leitores de tela
    if (selectedNodeIds.length > 0 || selectedEdgeIds.length > 0) {
      announceSelection(selectedNodeIds, selectedEdgeIds);
    }

    if (selectedNodeIds.length > 0) {
      selectNodes(selectedNodeIds);
    } else if (selectedEdgeIds.length > 0) {
      selectEdges(selectedEdgeIds);
    } else {
      clearSelection();
    }
  }, [selectNodes, selectEdges, clearSelection, announceSelection]);

  const onInit = useCallback((instance: ReactFlowInstance) => {
    reactFlowInstance.current = instance;
    secureLogger.info('ReactFlow inicializado');
  }, []);

  const onMoveEnd = useCallback((event: React.MouseEvent | React.TouchEvent, viewport: DiagramViewport) => {
    secureLogger.debug('Viewport alterado via canvas', {
      viewport,
      eventType: 'moveEnd'
    });
    setViewport(viewport);
  }, [setViewport]);

  // ============================================================================
  // Handlers de Drag & Drop
  // ============================================================================
const [dragPreview, setDragPreview] = useState<{
    position: { x: number; y: number };
    nodeType: string;
    visible: boolean;
  } | null>(null);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    
    // Mostrar preview do nó durante o drag
    const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
    if (!reactFlowBounds) return;
    
    const nodeType = event.dataTransfer.getData('application/reactflow');
    if (!nodeType) return;
    
    const position = reactFlowInstance?.project({
      x: event.clientX - reactFlowBounds.left,
      y: event.clientY - reactFlowBounds.top,
    });
    
    if (position) {
      // Snap to grid para o preview
      const snappedPosition = editor.snapToGrid ? {
        x: Math.round(position.x / editor.gridSize) * editor.gridSize,
        y: Math.round(position.y / editor.gridSize) * editor.gridSize
      } : position;
      
      setDragPreview({
        position: snappedPosition,
        nodeType,
        visible: true
      });
    }
  }, [reactFlowInstance, editor.snapToGrid, editor.gridSize]);

   const onDragLeave = useCallback((event: React.DragEvent) => {
     event.preventDefault();
     // Só remove o estado se realmente saiu do canvas
     if (!event.currentTarget.contains(event.relatedTarget as Node)) {
       setIsDragOver(false);
       setDragPreview(null);
     }
   }, []);

  const onDrop = useCallback(async (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
    
    if (readOnly) return;

    try {
      const dragData = event.dataTransfer.getData('application/reactflow');
      const jsonData = event.dataTransfer.getData('application/json');
      
      if (!dragData) return;

      let nodeData = JSON.parse(dragData);
      if (!nodeData.type) return;
      
      // Tentar obter dados adicionais do JSON
      let additionalData = null;
      try {
        additionalData = jsonData ? JSON.parse(jsonData) : null;
      } catch (error) {
        secureLogger.warn('Erro ao parsear dados JSON do drag-and-drop', { error });
      }

      // Obter posição do drop relativa ao canvas
      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
      if (!reactFlowBounds || !reactFlowInstance.current) return;

      const position = reactFlowInstance.current.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });
      
      // Snap to grid se habilitado
      const snappedPosition = editor.snapToGrid ? {
        x: Math.round(position.x / editor.gridSize) * editor.gridSize,
        y: Math.round(position.y / editor.gridSize) * editor.gridSize
      } : position;

      // Criar novo nó com dados aprimorados
      const newNode: Omit<DiagramNode, 'id'> = {
        type: nodeData.type,
        position: snappedPosition,
        data: {
          label: additionalData?.label || nodeData.label || 'Novo Nó',
          category: additionalData?.category || nodeData.category || 'basic',
          ...nodeData.data,
          ...additionalData?.defaultData
        }
      };

      await addNode(newNode);
      
      // Anunciar criação do nó para acessibilidade
      const nodeId = `node-${Date.now()}`;
      announceNodeCreated(nodeId, newNode.data.label);
      
      // Limpar preview e estado de drag
      setDragPreview(null);
      setIsDragOver(false);
      
      secureLogger.info('Nó adicionado via drop', {
        type: nodeData.type,
        position: snappedPosition,
        label: newNode.data.label,
        snapToGrid: editor.snapToGrid,
        gridSize: editor.gridSize
      });
    } catch (error) {
      secureLogger.error('Erro ao processar drop de nó', { error });
      setDragPreview(null);
      setIsDragOver(false);
    }
  }, [readOnly, addNode, announceNodeCreated, editor.snapToGrid, editor.gridSize]);

  // ============================================================================
  // Handlers de Teclado
  // ============================================================================

  const onKeyDown = useCallback(async (event: React.KeyboardEvent) => {
    if (readOnly) return;
    
    // Primeiro, tenta lidar com navegação acessível
    const accessibilityHandled = handleAccessibleKeyDown(event);
    if (accessibilityHandled) {
      return;
    }

    // Delete/Backspace - Remove elementos selecionados
    if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault();
      
      for (const nodeId of ui.selectedNodes) {
        await deleteNode(nodeId);
      }
      
      for (const edgeId of ui.selectedEdges) {
        await deleteEdge(edgeId);
      }
      
      if (ui.selectedNodes.length > 0 || ui.selectedEdges.length > 0) {
        secureLogger.info('Elementos removidos via teclado', {
          nodes: ui.selectedNodes.length,
          edges: ui.selectedEdges.length
        });
      }
    }

    // Escape - Limpa seleção
    if (event.key === 'Escape') {
      clearSelection();
    }
  }, [readOnly, ui.selectedNodes, ui.selectedEdges, deleteNode, deleteEdge, clearSelection, handleAccessibleKeyDown]);

  // ============================================================================
  // Configurações do ReactFlow
  // ============================================================================

  const reactFlowProps = useMemo(() => ({
    nodes: reactFlowNodes,
    edges: reactFlowEdges,
    nodeTypes: enhancedNodeTypes,
    edgeTypes,
    defaultEdgeOptions,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onSelectionChange,
    onInit,
    onMoveEnd,
    fitView: true,
    snapToGrid: editor.snapToGrid,
    snapGrid: [editor.gridSize, editor.gridSize] as [number, number],
    connectionLineType: editor.connectionLineType as ConnectionLineType,
    panOnDrag: editor.mode === 'pan' || editor.mode === 'select',
    selectionOnDrag: editor.mode === 'select',
    panOnScroll: true,
    zoomOnScroll: true,
    zoomOnPinch: true,
    zoomOnDoubleClick: true,
    preventScrolling: true,
    nodesDraggable: !readOnly && editor.mode === 'select',
    nodesConnectable: !readOnly && editor.mode === 'connect',
    elementsSelectable: !readOnly,
    selectNodesOnDrag: false,
    multiSelectionKeyCode: 'Shift',
    deleteKeyCode: readOnly ? null : ['Delete', 'Backspace']
  }), [
    reactFlowNodes,
    reactFlowEdges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onSelectionChange,
    onInit,
    onMoveEnd,
    editor,
    readOnly
  ]);

  // ============================================================================
  // Render
  // ============================================================================

  // ============================================================================
  // Efeitos de Acessibilidade
  // ============================================================================
  
  useEffect(() => {
    if (reactFlowWrapper.current) {
      registerFocusable(reactFlowWrapper.current, {
        id: 'diagram-canvas',
        priority: 1,
        description: 'Área de desenho do diagrama'
      });
      
      return () => {
        unregisterFocusable('diagram-canvas');
      };
    }
  }, [registerFocusable, unregisterFocusable]);
  
  useEffect(() => {
    if (isAccessibilityEnabled) {
      validateAccessibility();
    }
  }, [reactFlowNodes, reactFlowEdges, isAccessibilityEnabled, validateAccessibility]);

  return (
    <div
      ref={reactFlowWrapper}
      className={cn(
        'h-full w-full transition-all duration-200',
        isDragOver && 'bg-blue-50 ring-2 ring-blue-300 ring-opacity-50',
        className
      )}
      onKeyDown={onKeyDown}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      tabIndex={0}
      role="application"
      aria-label="Editor de diagrama"
      aria-describedby="diagram-instructions"
    >
      {/* Instruções ocultas para leitores de tela */}
      <div id="diagram-instructions" className="sr-only">
        Use as setas para navegar entre elementos. 
        Pressione Enter para selecionar. 
        Pressione Espaço para editar. 
        Pressione Delete para excluir.
      </div>
      <ReactFlow {...reactFlowProps}>
        {/* Background */}
        <Background
          variant={BackgroundVariant.Dots}
          gap={editor.gridSize}
          size={1}
          color="#e2e8f0"
          style={{
            opacity: ui.showGrid ? 0.5 : 0
          }}
        />

        {/* Controls */}
        {ui.showControls && (
          <Controls
            position="bottom-right"
            showZoom
            showFitView
            showInteractive={!readOnly}
          />
        )}

        {/* MiniMap */}
        {ui.showMinimap && (
          <MiniMap
            position="bottom-left"
            zoomable
            pannable
            nodeColor={(node) => {
              const nodeData = node.data as DiagramNodeData;
              return nodeData?.color || '#64748b';
            }}
            nodeStrokeWidth={2}
            maskColor="rgb(240, 242, 247, 0.7)"
          />
        )}
        
        {/* Preview do nó durante drag */}
        {dragPreview && dragPreview.visible && (
          <div
            className="absolute pointer-events-none z-50 opacity-60"
            style={{
              left: dragPreview.position.x,
              top: dragPreview.position.y,
              transform: 'translate(-50%, -50%)'
            }}
          >
            <div className="bg-primary/20 border-2 border-primary border-dashed rounded-lg p-3 min-w-[120px] min-h-[60px] flex items-center justify-center">
              <span className="text-sm font-medium text-primary">
                {dragPreview.nodeType}
              </span>
            </div>
          </div>
        )}
      </ReactFlow>
    </div>
  );
});

export default memo(DiagramCanvas);