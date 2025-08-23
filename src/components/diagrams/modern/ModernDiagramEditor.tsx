/**
 * Editor de Diagramas Moderno
 * Inspirado no MindMeister e DrawIO com funcionalidades avançadas
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  ReactFlowProvider,
  Panel,
  useReactFlow
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Palette, Save, Download, Upload, Undo, Redo, ZoomIn, ZoomOut, Grid, Eye, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Componentes modernos
import { ElementPalette, ElementDefinition } from './palette/ElementPalette';
import { PropertiesPanel } from './panels/PropertiesPanel';
import { ModernFlowchartNode } from './nodes/ModernFlowchartNode';
import { ModernMindMapNode } from './nodes/ModernMindMapNode';
import { ModernOrgChartNode } from './nodes/ModernOrgChartNode';
import { ModernEdge } from './edges/ModernEdge';
import { LayersPanel } from './panels/LayersPanel';
import { HistoryManager } from './utils/HistoryManager';
import { ExportManager } from './utils/ExportManager';
import { CollaborationManager } from './utils/CollaborationManager';

interface ModernDiagramEditorProps {
  diagramType: 'flowchart' | 'mindmap' | 'orgchart';
  initialNodes?: Node[];
  initialEdges?: Edge[];
  onSave?: (nodes: Node[], edges: Edge[]) => void;
  onExport?: (format: string, data: any) => void;
  readOnly?: boolean;
  collaborationEnabled?: boolean;
}

const nodeTypes: NodeTypes = {
  flowchart: ModernFlowchartNode,
  mindmap: ModernMindMapNode,
  orgchart: ModernOrgChartNode,
};

const edgeTypes: EdgeTypes = {
  modern: ModernEdge,
};

const initialNodes: Node[] = [
  {
    id: '1',
    type: 'flowchart',
    position: { x: 250, y: 100 },
    data: {
      label: 'Início',
      description: 'Ponto de partida do processo',
      color: '#3b82f6',
      shape: 'ellipse'
    },
  },
];

const initialEdges: Edge[] = [];

// Componente interno que usa o useReactFlow hook
const ModernDiagramEditorInner: React.FC<ModernDiagramEditorProps> = ({
  diagramType = 'flowchart',
  initialNodes: propInitialNodes,
  initialEdges: propInitialEdges,
  onSave,
  onExport,
  readOnly = false,
  collaborationEnabled = false
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(propInitialNodes || initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(propInitialEdges || initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
  const [showPalette, setShowPalette] = useState(true);
  const [showProperties, setShowProperties] = useState(true);
  const [showLayers, setShowLayers] = useState(false);
  const [showMiniMap, setShowMiniMap] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const historyManager = useRef(new HistoryManager());
  const exportManager = useRef(new ExportManager());
  const collaborationManager = useRef(new CollaborationManager());
  const reactFlowInstance = useReactFlow();

  // Configurar colaboração se habilitada
  useEffect(() => {
    if (collaborationEnabled) {
      collaborationManager.current.initialize({
        onNodesChange: setNodes,
        onEdgesChange: setEdges,
        diagramId: `diagram-${Date.now()}`
      });
    }
    
    return () => {
      if (collaborationEnabled) {
        collaborationManager.current.cleanup();
      }
    };
  }, [collaborationEnabled]);

  // Salvar estado no histórico quando nodes/edges mudarem
  useEffect(() => {
    historyManager.current.saveState({ nodes, edges });
  }, [nodes, edges]);

  const onConnect = useCallback(
    (params: Connection) => {
      const edge = {
        ...params,
        type: 'modern',
        data: {
          label: '',
          color: '#6b7280',
          animated: false
        }
      };
      setEdges((eds) => addEdge(edge, eds));
    },
    [setEdges]
  );

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    setSelectedEdge(null);
  }, []);

  const onEdgeClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    setSelectedEdge(edge);
    setSelectedNode(null);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    setSelectedEdge(null);
  }, []);

  const handleAddNode = useCallback((nodeData: any) => {
    const newNode: Node = {
      id: `node-${Date.now()}`,
      type: diagramType,
      position: {
        x: Math.random() * 400 + 100,
        y: Math.random() * 400 + 100
      },
      data: {
        ...nodeData,
        color: nodeData.color || '#3b82f6'
      }
    };
    
    setNodes((nds) => [...nds, newNode]);
  }, [diagramType, setNodes]);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
      const elementData = event.dataTransfer.getData('application/reactflow');

      if (!elementData || !reactFlowBounds) {
        return;
      }

      try {
        const element: ElementDefinition = JSON.parse(elementData);
        
        const position = reactFlowInstance?.project({
           x: event.clientX - reactFlowBounds.left,
           y: event.clientY - reactFlowBounds.top,
         });

        if (!position) return;

        const newNode: Node = {
          id: `${element.id}-${Date.now()}`,
          type: element.nodeType,
          position,
          data: {
            ...element.defaultData,
            id: `${element.id}-${Date.now()}`
          },
        };

        setNodes((nds) => nds.concat(newNode));
        historyManager.current.saveState({ nodes, edges });
      } catch (error) {
        console.error('Erro ao processar elemento:', error);
      }
    },
    [reactFlowInstance, nodes, edges, setNodes]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const handleElementDrag = useCallback((element: ElementDefinition) => {
    // Callback para quando um elemento é arrastado da paleta
    console.log('Elemento sendo arrastado:', element);
  }, []);

  const handleUpdateNode = useCallback((nodeId: string, updates: any) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, ...updates } }
          : node
      )
    );
  }, [setNodes]);

  const handleUpdateEdge = useCallback((edgeId: string, updates: any) => {
    setEdges((eds) =>
      eds.map((edge) =>
        edge.id === edgeId
          ? { ...edge, data: { ...edge.data, ...updates } }
          : edge
      )
    );
  }, [setEdges]);

  const handleDeleteSelected = useCallback(() => {
    if (selectedNode) {
      setNodes((nds) => nds.filter((node) => node.id !== selectedNode.id));
      setEdges((eds) => eds.filter((edge) => 
        edge.source !== selectedNode.id && edge.target !== selectedNode.id
      ));
      setSelectedNode(null);
    }
    
    if (selectedEdge) {
      setEdges((eds) => eds.filter((edge) => edge.id !== selectedEdge.id));
      setSelectedEdge(null);
    }
  }, [selectedNode, selectedEdge, setNodes, setEdges]);

  const handleSave = useCallback(async () => {
    setIsLoading(true);
    try {
      if (onSave) {
        await onSave(nodes, edges);
      }
    } catch (error) {
      console.error('Erro ao salvar:', error);
    } finally {
      setIsLoading(false);
    }
  }, [nodes, edges, onSave]);

  const handleExport = useCallback(async (format: string) => {
    setIsLoading(true);
    try {
      const exportData = await exportManager.current.export(format, { nodes, edges });
      if (onExport) {
        onExport(format, exportData);
      }
    } catch (error) {
      console.error('Erro ao exportar:', error);
    } finally {
      setIsLoading(false);
    }
  }, [nodes, edges, onExport]);

  const handleUndo = useCallback(() => {
    const previousState = historyManager.current.undo();
    if (previousState) {
      setNodes(previousState.nodes);
      setEdges(previousState.edges);
    }
  }, [setNodes, setEdges]);

  const handleRedo = useCallback(() => {
    const nextState = historyManager.current.redo();
    if (nextState) {
      setNodes(nextState.nodes);
      setEdges(nextState.edges);
    }
  }, [setNodes, setEdges]);

  // Atalhos de teclado
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 's':
            event.preventDefault();
            handleSave();
            break;
          case 'z':
            event.preventDefault();
            if (event.shiftKey) {
              handleRedo();
            } else {
              handleUndo();
            }
            break;
          case 'Delete':
          case 'Backspace':
            event.preventDefault();
            handleDeleteSelected();
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleSave, handleUndo, handleRedo, handleDeleteSelected]);

  const getDiagramTypeColor = () => {
    switch (diagramType) {
      case 'flowchart': return 'bg-blue-100 text-blue-800';
      case 'mindmap': return 'bg-green-100 text-green-800';
      case 'orgchart': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDiagramTypeLabel = () => {
    switch (diagramType) {
      case 'flowchart': return 'Fluxograma';
      case 'mindmap': return 'Mapa Mental';
      case 'orgchart': return 'Organograma';
      default: return 'Diagrama';
    }
  };

  return (
    <div className="h-screen w-full flex flex-col bg-gray-50">
      {/* Toolbar Superior */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Badge className={getDiagramTypeColor()}>
            {getDiagramTypeLabel()}
          </Badge>
          
          <div className="flex items-center space-x-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleUndo}
                    disabled={!historyManager.current.canUndo()}
                  >
                    <Undo className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Desfazer (Ctrl+Z)</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRedo}
                    disabled={!historyManager.current.canRedo()}
                  >
                    <Redo className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Refazer (Ctrl+Shift+Z)</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <Separator orientation="vertical" className="h-6" />
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPalette(!showPalette)}
                  >
                    <Palette className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Paleta de Elementos</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowGrid(!showGrid)}
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Grade</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowMiniMap(!showMiniMap)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Mini Mapa</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('png')}
            disabled={isLoading}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isLoading || readOnly}
          >
            <Save className="h-4 w-4 mr-2" />
            Salvar
          </Button>
        </div>
      </div>
      
      {/* Área Principal */}
      <div className="flex-1 flex">
        {/* Paleta de Elementos */}
        {showPalette && (
          <div className="w-64 bg-white border-r border-gray-200">
            <ElementPalette
              diagramType={diagramType}
              onElementDrag={handleElementDrag}
            />
          </div>
        )}
        
        {/* Editor de Diagrama */}
        <div className="flex-1 relative" ref={reactFlowWrapper}>
          <ReactFlowProvider>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={onNodeClick}
              onEdgeClick={onEdgeClick}
              onPaneClick={onPaneClick}
              onDrop={onDrop}
              onDragOver={onDragOver}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              fitView
              attributionPosition="bottom-left"
              className="bg-gray-50"
            >
              {showGrid && (
                <Background
                  variant="dots"
                  gap={20}
                  size={1}
                  color="#e5e7eb"
                />
              )}
              
              <Controls
                position="bottom-right"
                showInteractive={false}
              />
              
              {showMiniMap && (
                <MiniMap
                  position="bottom-left"
                  nodeColor="#3b82f6"
                  maskColor="rgba(0, 0, 0, 0.1)"
                  className="bg-white border border-gray-200 rounded-lg"
                />
              )}
              
              {/* Informações de Status */}
              <Panel position="top-left" className="bg-white/90 backdrop-blur-sm rounded-lg p-2 text-sm text-gray-600">
                {nodes.length} elementos • {edges.length} conexões
                {collaborationEnabled && (
                  <span className="ml-2 text-green-600">• Colaboração ativa</span>
                )}
              </Panel>
            </ReactFlow>
          </ReactFlowProvider>
        </div>
        
        {/* Painel de Propriedades */}
        {showProperties && (
          <div className="w-80 bg-white border-l border-gray-200">
            <PropertiesPanel
              selectedNode={selectedNode}
              selectedEdge={selectedEdge}
              onUpdateNode={handleUpdateNode}
              onUpdateEdge={handleUpdateEdge}
              onDeleteSelected={handleDeleteSelected}
            />
          </div>
        )}
      </div>
    </div>
  );
};

// Componente principal que envolve com ReactFlowProvider
export const ModernDiagramEditor: React.FC<ModernDiagramEditorProps> = (props) => {
  return (
    <ReactFlowProvider>
      <ModernDiagramEditorInner {...props} />
    </ReactFlowProvider>
  );
};

export default ModernDiagramEditor;