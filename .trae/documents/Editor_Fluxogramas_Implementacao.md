# EDITOR DE FLUXOGRAMAS - DOCUMENTAÇÃO TÉCNICA

## 1. Visão Geral

O Editor de Fluxogramas é uma ferramenta visual interativa que permite criar, editar e gerenciar diagramas de fluxo para processos de negócio, workflows de treinamento e documentação técnica. A implementação utiliza React Flow como base, com funcionalidades avançadas de edição, templates pré-definidos e integração com o sistema de propostas.

## 2. Arquitetura de Componentes

### 2.1 Estrutura de Componentes

```typescript
interface FlowchartEditorSystem {
  editor: {
    FlowchartEditor: React.FC<FlowchartEditorProps>;
    FlowCanvas: React.FC<FlowCanvasProps>;
    NodeEditor: React.FC<NodeEditorProps>;
    EdgeEditor: React.FC<EdgeEditorProps>;
    FlowToolbar: React.FC<FlowToolbarProps>;
    MiniMap: React.FC<MiniMapProps>;
  };
  nodes: {
    StartNode: React.FC<StartNodeProps>;
    ProcessNode: React.FC<ProcessNodeProps>;
    DecisionNode: React.FC<DecisionNodeProps>;
    EndNode: React.FC<EndNodeProps>;
    ConnectorNode: React.FC<ConnectorNodeProps>;
    DocumentNode: React.FC<DocumentNodeProps>;
    DataNode: React.FC<DataNodeProps>;
    CustomNode: React.FC<CustomNodeProps>;
  };
  panels: {
    NodeLibrary: React.FC<NodeLibraryProps>;
    PropertiesPanel: React.FC<PropertiesPanelProps>;
    LayersPanel: React.FC<LayersPanelProps>;
    TemplatesPanel: React.FC<TemplatesPanelProps>;
  };
  templates: {
    TemplateManager: React.FC<TemplateManagerProps>;
    TemplatePreview: React.FC<TemplatePreviewProps>;
    TemplateSelector: React.FC<TemplateSelectorProps>;
  };
  export: {
    ExportDialog: React.FC<ExportDialogProps>;
    ShareDialog: React.FC<ShareDialogProps>;
    EmbedDialog: React.FC<EmbedDialogProps>;
  };
}
```

### 2.2 Tipos TypeScript

```typescript
// Flowchart Types
interface Flowchart {
  id: string;
  title: string;
  description?: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
  viewport: Viewport;
  settings: FlowchartSettings;
  companyId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  isPublished: boolean;
  tags: string[];
  category?: string;
  templateId?: string;
}

interface FlowNode {
  id: string;
  type: NodeType;
  position: Position;
  data: NodeData;
  style?: NodeStyle;
  className?: string;
  draggable?: boolean;
  selectable?: boolean;
  deletable?: boolean;
  connectable?: boolean;
  parentNode?: string;
  extent?: 'parent' | [[number, number], [number, number]];
  expandParent?: boolean;
  positionAbsolute?: Position;
  ariaLabel?: string;
  focusable?: boolean;
  resizing?: boolean;
  selected?: boolean;
  zIndex?: number;
}

interface FlowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  type?: EdgeType;
  data?: EdgeData;
  style?: EdgeStyle;
  className?: string;
  animated?: boolean;
  hidden?: boolean;
  deletable?: boolean;
  focusable?: boolean;
  updatable?: boolean;
  selected?: boolean;
  markerStart?: EdgeMarker;
  markerEnd?: EdgeMarker;
  pathOptions?: PathOptions;
  interactionWidth?: number;
  zIndex?: number;
}

type NodeType = 
  | 'start'
  | 'process'
  | 'decision'
  | 'end'
  | 'connector'
  | 'document'
  | 'data'
  | 'subprocess'
  | 'manual'
  | 'preparation'
  | 'display'
  | 'delay'
  | 'storage'
  | 'custom';

type EdgeType = 
  | 'default'
  | 'straight'
  | 'step'
  | 'smoothstep'
  | 'bezier'
  | 'custom';

interface Position {
  x: number;
  y: number;
}

interface NodeData {
  label: string;
  description?: string;
  icon?: string;
  color?: string;
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
  fontSize?: number;
  fontWeight?: string;
  width?: number;
  height?: number;
  borderRadius?: number;
  borderWidth?: number;
  padding?: number;
  metadata?: Record<string, any>;
  validation?: NodeValidation;
  actions?: NodeAction[];
}

interface EdgeData {
  label?: string;
  condition?: string;
  probability?: number;
  color?: string;
  strokeWidth?: number;
  strokeDasharray?: string;
  animated?: boolean;
  metadata?: Record<string, any>;
}

interface NodeStyle {
  background?: string;
  color?: string;
  border?: string;
  borderRadius?: string;
  width?: number;
  height?: number;
  fontSize?: string;
  fontWeight?: string;
  padding?: string;
  boxShadow?: string;
}

interface EdgeStyle {
  stroke?: string;
  strokeWidth?: number;
  strokeDasharray?: string;
}

interface EdgeMarker {
  type: 'arrow' | 'arrowclosed' | 'circle';
  color?: string;
  width?: number;
  height?: number;
}

interface PathOptions {
  offset?: number;
  borderRadius?: number;
}

interface Viewport {
  x: number;
  y: number;
  zoom: number;
}

interface FlowchartSettings {
  snapToGrid: boolean;
  gridSize: number;
  showGrid: boolean;
  showMiniMap: boolean;
  showControls: boolean;
  panOnDrag: boolean;
  zoomOnScroll: boolean;
  zoomOnPinch: boolean;
  zoomOnDoubleClick: boolean;
  preventScrolling: boolean;
  nodesDraggable: boolean;
  nodesConnectable: boolean;
  nodesFocusable: boolean;
  edgesFocusable: boolean;
  elementsSelectable: boolean;
  selectNodesOnDrag: boolean;
  multiSelectionKeyCode: string;
  deleteKeyCode: string;
  connectionMode: 'strict' | 'loose';
  connectionLineType: EdgeType;
  connectionLineStyle?: EdgeStyle;
  defaultEdgeOptions?: Partial<FlowEdge>;
  defaultNodeOptions?: Partial<FlowNode>;
}

interface NodeValidation {
  required: boolean;
  minConnections?: number;
  maxConnections?: number;
  allowedConnections?: string[];
  customRules?: ValidationRule[];
}

interface ValidationRule {
  id: string;
  message: string;
  validator: (node: FlowNode, flowchart: Flowchart) => boolean;
}

interface NodeAction {
  id: string;
  label: string;
  icon?: string;
  handler: (node: FlowNode) => void;
  condition?: (node: FlowNode) => boolean;
}

interface FlowchartTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  thumbnail: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
  settings: FlowchartSettings;
  tags: string[];
  isPublic: boolean;
  createdBy: string;
  createdAt: string;
  usageCount: number;
}

interface ExportOptions {
  format: 'png' | 'jpg' | 'svg' | 'pdf' | 'json';
  quality?: number;
  width?: number;
  height?: number;
  backgroundColor?: string;
  includeMetadata?: boolean;
  compression?: boolean;
}

interface ShareOptions {
  isPublic: boolean;
  allowComments: boolean;
  allowCopy: boolean;
  allowEdit: boolean;
  expiresAt?: string;
  password?: string;
  collaborators: string[];
}
```

## 3. Estrutura de Arquivos

```
src/
├── pages/
│   ├── FlowchartEditorPage.tsx
│   ├── FlowchartLibraryPage.tsx
│   └── FlowchartViewerPage.tsx
├── components/
│   └── flowchart/
│       ├── index.ts
│       ├── editor/
│       │   ├── FlowchartEditor.tsx
│       │   ├── FlowCanvas.tsx
│       │   ├── NodeEditor.tsx
│       │   ├── EdgeEditor.tsx
│       │   ├── FlowToolbar.tsx
│       │   └── MiniMap.tsx
│       ├── nodes/
│       │   ├── index.ts
│       │   ├── StartNode.tsx
│       │   ├── ProcessNode.tsx
│       │   ├── DecisionNode.tsx
│       │   ├── EndNode.tsx
│       │   ├── ConnectorNode.tsx
│       │   ├── DocumentNode.tsx
│       │   ├── DataNode.tsx
│       │   └── CustomNode.tsx
│       ├── panels/
│       │   ├── NodeLibrary.tsx
│       │   ├── PropertiesPanel.tsx
│       │   ├── LayersPanel.tsx
│       │   └── TemplatesPanel.tsx
│       ├── templates/
│       │   ├── TemplateManager.tsx
│       │   ├── TemplatePreview.tsx
│       │   └── TemplateSelector.tsx
│       └── export/
│           ├── ExportDialog.tsx
│           ├── ShareDialog.tsx
│           └── EmbedDialog.tsx
├── hooks/
│   ├── useFlowchart.ts
│   ├── useFlowNodes.ts
│   ├── useFlowEdges.ts
│   ├── useFlowTemplates.ts
│   ├── useFlowExport.ts
│   └── useFlowValidation.ts
├── services/
│   ├── FlowchartService.ts
│   ├── TemplateService.ts
│   ├── ExportService.ts
│   └── ValidationService.ts
├── utils/
│   ├── flowUtils.ts
│   ├── nodeUtils.ts
│   ├── edgeUtils.ts
│   └── exportUtils.ts
└── types/
    └── flowchart.ts
```

## 4. Implementação dos Componentes

### 4.1 FlowchartEditorPage.tsx

```typescript
import React, { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ReactFlowProvider } from 'reactflow';
import { FlowchartEditor } from '@/components/flowchart';
import { NodeLibrary, PropertiesPanel, TemplatesPanel } from '@/components/flowchart/panels';
import { ExportDialog, ShareDialog } from '@/components/flowchart/export';
import { useFlowchart } from '@/hooks/useFlowchart';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Save, 
  Share, 
  Download, 
  Eye, 
  Settings, 
  Layers, 
  Library,
  Template,
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  Maximize
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

export default function FlowchartEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [activeLeftTab, setActiveLeftTab] = useState('library');
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  
  const {
    flowchart,
    loading,
    error,
    updateFlowchart,
    saveFlowchart,
    publishFlowchart,
    undo,
    redo,
    canUndo,
    canRedo
  } = useFlowchart(id);

  const handleSave = useCallback(async () => {
    try {
      await saveFlowchart();
      toast({
        title: "Fluxograma salvo",
        description: "Suas alterações foram salvas com sucesso."
      });
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar o fluxograma.",
        variant: "destructive"
      });
    }
  }, [saveFlowchart]);

  const handlePublish = useCallback(async () => {
    try {
      await publishFlowchart();
      toast({
        title: "Fluxograma publicado",
        description: "O fluxograma está agora disponível para visualização."
      });
    } catch (error) {
      toast({
        title: "Erro ao publicar",
        description: "Não foi possível publicar o fluxograma.",
        variant: "destructive"
      });
    }
  }, [publishFlowchart]);

  const handlePreview = useCallback(() => {
    window.open(`/flowcharts/${id}/preview`, '_blank');
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Carregando fluxograma...</div>
      </div>
    );
  }

  if (error || !flowchart) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Fluxograma não encontrado</h2>
          <Button onClick={() => navigate('/flowcharts')}>Voltar à biblioteca</Button>
        </div>
      </div>
    );
  }

  return (
    <ReactFlowProvider>
      <div className="flex h-screen bg-gray-50">
        {/* Left Panel */}
        {leftPanelOpen && (
          <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <Tabs value={activeLeftTab} onValueChange={setActiveLeftTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="library" className="flex items-center gap-2">
                    <Library className="h-4 w-4" />
                    Biblioteca
                  </TabsTrigger>
                  <TabsTrigger value="templates" className="flex items-center gap-2">
                    <Template className="h-4 w-4" />
                    Templates
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="library" className="mt-4">
                  <NodeLibrary />
                </TabsContent>
                
                <TabsContent value="templates" className="mt-4">
                  <TemplatesPanel onSelectTemplate={(template) => {
                    updateFlowchart({
                      nodes: template.nodes,
                      edges: template.edges,
                      settings: template.settings
                    });
                  }} />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        )}

        {/* Main Editor */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {!leftPanelOpen && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setLeftPanelOpen(true)}
                  >
                    <Library className="h-4 w-4" />
                  </Button>
                )}
                
                <Input
                  value={flowchart.title}
                  onChange={(e) => updateFlowchart({ title: e.target.value })}
                  className="text-xl font-semibold border-none p-0 h-auto bg-transparent"
                  placeholder="Título do fluxograma"
                />
              </div>

              <div className="flex items-center space-x-2">
                {/* Undo/Redo */}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={undo}
                  disabled={!canUndo}
                >
                  <Undo className="h-4 w-4" />
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={redo}
                  disabled={!canRedo}
                >
                  <Redo className="h-4 w-4" />
                </Button>
                
                <div className="w-px h-6 bg-gray-300 mx-2" />
                
                {/* Actions */}
                <Button variant="outline" size="sm" onClick={handlePreview}>
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowExportDialog(true)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowShareDialog(true)}
                >
                  <Share className="h-4 w-4 mr-2" />
                  Compartilhar
                </Button>
                
                <Button size="sm" onClick={handleSave}>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar
                </Button>
                
                <Button 
                  size="sm" 
                  onClick={handlePublish}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Publicar
                </Button>
              </div>
            </div>
          </div>

          {/* Editor Content */}
          <div className="flex-1 relative">
            <FlowchartEditor 
              flowchart={flowchart}
              onUpdate={updateFlowchart}
            />
          </div>
        </div>

        {/* Right Panel */}
        {rightPanelOpen && (
          <div className="w-80 bg-white border-l border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Propriedades</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setRightPanelOpen(false)}
                >
                  <Maximize className="h-4 w-4" />
                </Button>
              </div>
              
              <PropertiesPanel 
                flowchart={flowchart}
                onUpdate={updateFlowchart}
              />
            </div>
          </div>
        )}

        {/* Dialogs */}
        <ExportDialog 
          open={showExportDialog}
          onClose={() => setShowExportDialog(false)}
          flowchart={flowchart}
        />
        
        <ShareDialog 
          open={showShareDialog}
          onClose={() => setShowShareDialog(false)}
          flowchart={flowchart}
        />
      </div>
    </ReactFlowProvider>
  );
}
```

### 4.2 FlowchartEditor.tsx

```typescript
import React, { useCallback, useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  ReactFlowInstance,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  NodeTypes,
  EdgeTypes
} from 'reactflow';
import 'reactflow/dist/style.css';

import {
  StartNode,
  ProcessNode,
  DecisionNode,
  EndNode,
  ConnectorNode,
  DocumentNode,
  DataNode,
  CustomNode
} from '../nodes';
import { FlowToolbar } from './FlowToolbar';
import { Flowchart } from '@/types/flowchart';
import { useFlowValidation } from '@/hooks/useFlowValidation';

interface FlowchartEditorProps {
  flowchart: Flowchart;
  onUpdate: (updates: Partial<Flowchart>) => void;
}

export function FlowchartEditor({ flowchart, onUpdate }: FlowchartEditorProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(flowchart.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(flowchart.edges);
  const [reactFlowInstance, setReactFlowInstance] = React.useState<ReactFlowInstance | null>(null);
  
  const { validateFlowchart, getValidationErrors } = useFlowValidation();

  // Tipos de nós customizados
  const nodeTypes: NodeTypes = useMemo(() => ({
    start: StartNode,
    process: ProcessNode,
    decision: DecisionNode,
    end: EndNode,
    connector: ConnectorNode,
    document: DocumentNode,
    data: DataNode,
    custom: CustomNode
  }), []);

  // Tipos de arestas customizadas
  const edgeTypes: EdgeTypes = useMemo(() => ({
    // Adicionar tipos customizados se necessário
  }), []);

  const onConnect: OnConnect = useCallback(
    (params: Connection | Edge) => {
      const newEdge = {
        ...params,
        id: `edge-${params.source}-${params.target}`,
        type: 'default',
        animated: false,
        data: {
          label: '',
          condition: ''
        }
      };
      
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges]
  );

  const handleNodesChange: OnNodesChange = useCallback(
    (changes) => {
      onNodesChange(changes);
      // Atualizar flowchart quando nós mudarem
      setNodes((nds) => {
        onUpdate({ nodes: nds });
        return nds;
      });
    },
    [onNodesChange, onUpdate, setNodes]
  );

  const handleEdgesChange: OnEdgesChange = useCallback(
    (changes) => {
      onEdgesChange(changes);
      // Atualizar flowchart quando arestas mudarem
      setEdges((eds) => {
        onUpdate({ edges: eds });
        return eds;
      });
    },
    [onEdgesChange, onUpdate, setEdges]
  );

  const onInit = useCallback((instance: ReactFlowInstance) => {
    setReactFlowInstance(instance);
  }, []);

  const onNodeDragStop = useCallback(
    (event: React.MouseEvent, node: Node) => {
      // Atualizar posição do nó
      const updatedNodes = nodes.map((n) => 
        n.id === node.id ? { ...n, position: node.position } : n
      );
      onUpdate({ nodes: updatedNodes });
    },
    [nodes, onUpdate]
  );

  const addNode = useCallback(
    (type: string, position: { x: number; y: number }) => {
      const newNode: Node = {
        id: `node-${Date.now()}`,
        type,
        position,
        data: {
          label: `Novo ${type}`,
          description: '',
          color: '#ffffff',
          backgroundColor: getNodeDefaultColor(type),
          borderColor: '#d1d5db'
        },
        draggable: true,
        selectable: true,
        deletable: true,
        connectable: true
      };
      
      setNodes((nds) => [...nds, newNode]);
      onUpdate({ nodes: [...nodes, newNode] });
    },
    [nodes, onUpdate, setNodes]
  );

  const deleteSelectedElements = useCallback(() => {
    const selectedNodes = nodes.filter((node) => node.selected);
    const selectedEdges = edges.filter((edge) => edge.selected);
    
    if (selectedNodes.length > 0 || selectedEdges.length > 0) {
      const remainingNodes = nodes.filter((node) => !node.selected);
      const remainingEdges = edges.filter((edge) => !edge.selected);
      
      setNodes(remainingNodes);
      setEdges(remainingEdges);
      onUpdate({ nodes: remainingNodes, edges: remainingEdges });
    }
  }, [nodes, edges, onUpdate, setNodes, setEdges]);

  const duplicateSelectedNodes = useCallback(() => {
    const selectedNodes = nodes.filter((node) => node.selected);
    
    if (selectedNodes.length > 0) {
      const duplicatedNodes = selectedNodes.map((node) => ({
        ...node,
        id: `node-${Date.now()}-${Math.random()}`,
        position: {
          x: node.position.x + 50,
          y: node.position.y + 50
        },
        selected: false
      }));
      
      const newNodes = [...nodes, ...duplicatedNodes];
      setNodes(newNodes);
      onUpdate({ nodes: newNodes });
    }
  }, [nodes, onUpdate, setNodes]);

  const fitView = useCallback(() => {
    if (reactFlowInstance) {
      reactFlowInstance.fitView({ padding: 0.2 });
    }
  }, [reactFlowInstance]);

  const zoomIn = useCallback(() => {
    if (reactFlowInstance) {
      reactFlowInstance.zoomIn();
    }
  }, [reactFlowInstance]);

  const zoomOut = useCallback(() => {
    if (reactFlowInstance) {
      reactFlowInstance.zoomOut();
    }
  }, [reactFlowInstance]);

  // Validação em tempo real
  const validationErrors = useMemo(() => {
    return getValidationErrors(flowchart);
  }, [flowchart, getValidationErrors]);

  // Configurações do ReactFlow
  const flowSettings = flowchart.settings || {
    snapToGrid: true,
    gridSize: 15,
    showGrid: true,
    showMiniMap: true,
    showControls: true,
    panOnDrag: true,
    zoomOnScroll: true,
    nodesDraggable: true,
    nodesConnectable: true,
    elementsSelectable: true
  };

  return (
    <div className="w-full h-full relative">
      {/* Toolbar */}
      <FlowToolbar
        onAddNode={addNode}
        onDeleteSelected={deleteSelectedElements}
        onDuplicateSelected={duplicateSelectedNodes}
        onFitView={fitView}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        validationErrors={validationErrors}
      />
      
      {/* React Flow */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
        onInit={onInit}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        snapToGrid={flowSettings.snapToGrid}
        snapGrid={[flowSettings.gridSize, flowSettings.gridSize]}
        panOnDrag={flowSettings.panOnDrag}
        zoomOnScroll={flowSettings.zoomOnScroll}
        nodesDraggable={flowSettings.nodesDraggable}
        nodesConnectable={flowSettings.nodesConnectable}
        elementsSelectable={flowSettings.elementsSelectable}
        deleteKeyCode="Delete"
        multiSelectionKeyCode="Control"
        connectionLineType="bezier"
        connectionLineStyle={{
          strokeWidth: 2,
          stroke: '#3b82f6'
        }}
        defaultEdgeOptions={{
          type: 'bezier',
          animated: false,
          style: {
            strokeWidth: 2,
            stroke: '#6b7280'
          }
        }}
      >
        {/* Background */}
        {flowSettings.showGrid && (
          <Background 
            variant="dots" 
            gap={flowSettings.gridSize} 
            size={1}
            color="#d1d5db"
          />
        )}
        
        {/* Controls */}
        {flowSettings.showControls && (
          <Controls 
            position="bottom-left"
            showZoom={true}
            showFitView={true}
            showInteractive={true}
          />
        )}
        
        {/* MiniMap */}
        {flowSettings.showMiniMap && (
          <MiniMap 
            position="bottom-right"
            zoomable
            pannable
            nodeColor={(node) => {
              return node.data?.backgroundColor || '#f3f4f6';
            }}
            nodeStrokeWidth={2}
            nodeStrokeColor="#374151"
            maskColor="rgba(0, 0, 0, 0.1)"
          />
        )}
      </ReactFlow>
      
      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="absolute top-4 right-4 bg-red-50 border border-red-200 rounded-lg p-3 max-w-sm">
          <h4 className="text-sm font-medium text-red-800 mb-2">Erros de Validação:</h4>
          <ul className="text-xs text-red-700 space-y-1">
            {validationErrors.map((error, index) => (
              <li key={index}>• {error.message}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// Função auxiliar para cores padrão dos nós
function getNodeDefaultColor(type: string): string {
  const colors: Record<string, string> = {
    start: '#10b981',
    process: '#3b82f6',
    decision: '#f59e0b',
    end: '#ef4444',
    connector: '#6b7280',
    document: '#8b5cf6',
    data: '#06b6d4'
  };
  
  return colors[type] || '#6b7280';
}
```

### 4.3 ProcessNode.tsx

```typescript
import React, { memo, useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { NodeData } from '@/types/flowchart';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Edit, Check, X } from 'lucide-react';

interface ProcessNodeData extends NodeData {
  label: string;
  description?: string;
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
}

interface ProcessNodeProps extends NodeProps {
  data: ProcessNodeData;
}

export const ProcessNode = memo(({ data, selected }: ProcessNodeProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [label, setLabel] = useState(data.label);
  const [description, setDescription] = useState(data.description || '');

  const handleSave = () => {
    // Atualizar dados do nó
    data.label = label;
    data.description = description;
    setIsEditing(false);
  };

  const handleCancel = () => {
    setLabel(data.label);
    setDescription(data.description || '');
    setIsEditing(false);
  };

  return (
    <div
      className={`
        relative min-w-[150px] min-h-[80px] rounded-lg border-2 transition-all
        ${selected ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}
      `}
      style={{
        backgroundColor: data.backgroundColor || '#3b82f6',
        borderColor: data.borderColor || '#1e40af',
        color: data.textColor || '#ffffff'
      }}
    >
      {/* Handles de conexão */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-gray-400 !border-2 !border-white"
      />
      
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-gray-400 !border-2 !border-white"
      />
      
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 !bg-gray-400 !border-2 !border-white"
      />
      
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 !bg-gray-400 !border-2 !border-white"
      />

      {/* Conteúdo do nó */}
      <div className="p-3">
        {isEditing ? (
          <div className="space-y-2">
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="text-sm bg-white text-gray-900"
              placeholder="Título do processo"
            />
            
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="text-xs bg-white text-gray-900 resize-none"
              placeholder="Descrição (opcional)"
              rows={2}
            />
            
            <div className="flex justify-end space-x-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCancel}
                className="h-6 w-6 p-0 text-white hover:bg-white/20"
              >
                <X className="h-3 w-3" />
              </Button>
              
              <Button
                size="sm"
                variant="ghost"
                onClick={handleSave}
                className="h-6 w-6 p-0 text-white hover:bg-white/20"
              >
                <Check className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="relative group">
            <div className="text-sm font-medium text-center mb-1">
              {data.label}
            </div>
            
            {data.description && (
              <div className="text-xs opacity-80 text-center">
                {data.description}
              </div>
            )}
            
            {/* Botão de edição */}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsEditing(true)}
              className="absolute -top-1 -right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-white hover:bg-white/20"
            >
              <Edit className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
});

ProcessNode.displayName = 'ProcessNode';
```

### 4.4 DecisionNode.tsx

```typescript
import React, { memo, useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { NodeData } from '@/types/flowchart';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Edit, Check, X } from 'lucide-react';

interface DecisionNodeData extends NodeData {
  label: string;
  condition?: string;
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
}

interface DecisionNodeProps extends NodeProps {
  data: DecisionNodeData;
}

export const DecisionNode = memo(({ data, selected }: DecisionNodeProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [label, setLabel] = useState(data.label);
  const [condition, setCondition] = useState(data.condition || '');

  const handleSave = () => {
    data.label = label;
    data.condition = condition;
    setIsEditing(false);
  };

  const handleCancel = () => {
    setLabel(data.label);
    setCondition(data.condition || '');
    setIsEditing(false);
  };

  return (
    <div
      className={`
        relative min-w-[120px] min-h-[120px] transform rotate-45 transition-all
        ${selected ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}
      `}
      style={{
        backgroundColor: data.backgroundColor || '#f59e0b',
        borderWidth: '2px',
        borderStyle: 'solid',
        borderColor: data.borderColor || '#d97706'
      }}
    >
      {/* Handles de conexão */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-gray-400 !border-2 !border-white transform -rotate-45"
        style={{ top: '-6px', left: '50%', transform: 'translateX(-50%) rotate(-45deg)' }}
      />
      
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-gray-400 !border-2 !border-white transform -rotate-45"
        style={{ bottom: '-6px', left: '50%', transform: 'translateX(-50%) rotate(-45deg)' }}
      />
      
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 !bg-gray-400 !border-2 !border-white transform -rotate-45"
        style={{ right: '-6px', top: '50%', transform: 'translateY(-50%) rotate(-45deg)' }}
      />
      
      <Handle
        type="source"
        position={Position.Left}
        className="w-3 h-3 !bg-gray-400 !border-2 !border-white transform -rotate-45"
        style={{ left: '-6px', top: '50%', transform: 'translateY(-50%) rotate(-45deg)' }}
      />

      {/* Conteúdo do nó */}
      <div 
        className="absolute inset-0 flex items-center justify-center p-3 transform -rotate-45"
        style={{ color: data.textColor || '#ffffff' }}
      >
        {isEditing ? (
          <div className="space-y-2 w-full">
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="text-xs bg-white text-gray-900 h-6"
              placeholder="Pergunta/Condição"
            />
            
            <div className="flex justify-center space-x-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCancel}
                className="h-5 w-5 p-0 text-white hover:bg-white/20"
              >
                <X className="h-3 w-3" />
              </Button>
              
              <Button
                size="sm"
                variant="ghost"
                onClick={handleSave}
                className="h-5 w-5 p-0 text-white hover:bg-white/20"
              >
                <Check className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="relative group text-center">
            <div className="text-xs font-medium">
              {data.label}
            </div>
            
            {/* Botão de edição */}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsEditing(true)}
              className="absolute -top-2 -right-2 h-4 w-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-white hover:bg-white/20"
            >
              <Edit className="h-2 w-2" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
});

DecisionNode.displayName = 'DecisionNode';
```

## 5. Hooks Customizados

### 5.1 useFlowchart.ts

```typescript
import { useState, useEffect, useCallback } from 'react';
import { FlowchartService } from '@/services/FlowchartService';
import { Flowchart } from '@/types/flowchart';
import { useAuth } from '@/hooks/useAuth';
import { useDebounce } from '@/hooks/useDebounce';
import { useUndoRedo } from '@/hooks/useUndoRedo';

export function useFlowchart(flowchartId?: string) {
  const [flowchart, setFlowchart] = useState<Flowchart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const { user } = useAuth();
  
  // Sistema de undo/redo
  const {
    state: flowchartHistory,
    setState: setFlowchartHistory,
    undo,
    redo,
    canUndo,
    canRedo,
    clearHistory
  } = useUndoRedo<Flowchart | null>(null);

  // Debounce para auto-save
  const debouncedFlowchart = useDebounce(flowchart, 3000);

  const fetchFlowchart = useCallback(async () => {
    if (!flowchartId || !user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const data = await FlowchartService.getFlowchart(flowchartId);
      setFlowchart(data);
      setFlowchartHistory(data);
      clearHistory();
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [flowchartId, user, setFlowchartHistory, clearHistory]);

  const createFlowchart = useCallback(async (title: string) => {
    if (!user) return;
    
    try {
      const newFlowchart = await FlowchartService.createFlowchart({
        title,
        companyId: user.company_id,
        createdBy: user.id
      });
      
      setFlowchart(newFlowchart);
      setFlowchartHistory(newFlowchart);
      return newFlowchart;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [user, setFlowchartHistory]);

  const updateFlowchart = useCallback((updates: Partial<Flowchart>) => {
    if (!flowchart) return;
    
    const updatedFlowchart = {
      ...flowchart,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    setFlowchart(updatedFlowchart);
    setFlowchartHistory(updatedFlowchart);
    setHasUnsavedChanges(true);
  }, [flowchart, setFlowchartHistory]);

  const saveFlowchart = useCallback(async () => {
    if (!flowchart || !hasUnsavedChanges) return;
    
    try {
      const savedFlowchart = await FlowchartService.updateFlowchart(flowchart.id, flowchart);
      setFlowchart(savedFlowchart);
      setHasUnsavedChanges(false);
      return savedFlowchart;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [flowchart, hasUnsavedChanges]);

  const publishFlowchart = useCallback(async () => {
    if (!flowchart) return;
    
    try {
      const publishedFlowchart = await FlowchartService.publishFlowchart(flowchart.id);
      setFlowchart(publishedFlowchart);
      return publishedFlowchart;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [flowchart]);

  const handleUndo = useCallback(() => {
    const previousState = undo();
    if (previousState) {
      setFlowchart(previousState);
      setHasUnsavedChanges(true);
    }
  }, [undo]);

  const handleRedo = useCallback(() => {
    const nextState = redo();
    if (nextState) {
      setFlowchart(nextState);
      setHasUnsavedChanges(true);
    }
  }, [redo]);

  // Auto-save quando o flowchart é alterado
  useEffect(() => {
    if (debouncedFlowchart && hasUnsavedChanges) {
      saveFlowchart().catch(console.error);
    }
  }, [debouncedFlowchart, hasUnsavedChanges, saveFlowchart]);

  // Carregar flowchart inicial
  useEffect(() => {
    fetchFlowchart();
  }, [fetchFlowchart]);

  // Prevenir saída sem salvar
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'Você tem alterações não salvas. Deseja sair mesmo assim?';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  return {
    flowchart,
    loading,
    error,
    hasUnsavedChanges,
    createFlowchart,
    updateFlowchart,
    saveFlowchart,
    publishFlowchart,
    undo: handleUndo,
    redo: handleRedo,
    canUndo,
    canRedo,
    refetch: fetchFlowchart
  };
}
```

## 6. Serviços de API

### 6.1 FlowchartService.ts

```typescript
import { supabase } from '@/lib/supabase';
import { Flowchart, FlowchartTemplate, ExportOptions } from '@/types/flowchart';

export class FlowchartService {
  static async getFlowchart(id: string): Promise<Flowchart> {
    const { data, error } = await supabase
      .from('flowcharts')
      .select(`
        *,
        profiles!created_by(id, name, avatar_url),
        companies(id, name)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return this.transformFromDatabase(data);
  }

  static async createFlowchart(flowchart: Partial<Flowchart>): Promise<Flowchart> {
    const { data, error } = await supabase
      .from('flowcharts')
      .insert({
        title: flowchart.title,
        description: flowchart.description,
        nodes: flowchart.nodes || [],
        edges: flowchart.edges || [],
        viewport: flowchart.viewport || { x: 0, y: 0, zoom: 1 },
        settings: flowchart.settings || this.getDefaultSettings(),
        company_id: flowchart.companyId,
        created_by: flowchart.createdBy,
        is_published: false,
        tags: flowchart.tags || []
      })
      .select()
      .single();

    if (error) throw error;
    return this.transformFromDatabase(data);
  }

  static async updateFlowchart(id: string, updates: Partial<Flowchart>): Promise<Flowchart> {
    const { data, error } = await supabase
      .from('flowcharts')
      .update({
        title: updates.title,
        description: updates.description,
        nodes: updates.nodes,
        edges: updates.edges,
        viewport: updates.viewport,
        settings: updates.settings,
        tags: updates.tags,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return this.transformFromDatabase(data);
  }

  static async publishFlowchart(id: string): Promise<Flowchart> {
    const { data, error } = await supabase
      .from('flowcharts')
      .update({
        is_published: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return this.transformFromDatabase(data);
  }

  static async deleteFlowchart(id: string): Promise<void> {
    const { error } = await supabase
      .from('flowcharts')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  static async getTemplates(): Promise<FlowchartTemplate[]> {
    const { data, error } = await supabase
      .from('flowchart_templates')
      .select('*')
      .eq('is_public', true)
      .order('usage_count', { ascending: false });

    if (error) throw error;
    return data.map(this.transformTemplateFromDatabase);
  }

  static async createTemplate(template: Partial<FlowchartTemplate>): Promise<FlowchartTemplate> {
    const { data, error } = await supabase
      .from('flowchart_templates')
      .insert({
        name: template.name,
        description: template.description,
        category: template.category,
        thumbnail: template.thumbnail,
        nodes: template.nodes,
        edges: template.edges,
        settings: template.settings,
        tags: template.tags,
        is_public: template.isPublic,
        created_by: template.createdBy
      })
      .select()
      .single();

    if (error) throw error;
    return this.transformTemplateFromDatabase(data);
  }

  static async exportFlowchart(id: string, options: ExportOptions): Promise<Blob> {
    // Implementar exportação baseada no formato
    switch (options.format) {
      case 'png':
      case 'jpg':
        return this.exportAsImage(id, options);
      case 'svg':
        return this.exportAsSVG(id, options);
      case 'pdf':
        return this.exportAsPDF(id, options);
      case 'json':
        return this.exportAsJSON(id, options);
      default:
        throw new Error(`Formato não suportado: ${options.format}`);
    }
  }

  private static async exportAsImage(id: string, options: ExportOptions): Promise<Blob> {
    // Implementar captura de tela do canvas
    // Usar html2canvas ou similar
    throw new Error('Exportação de imagem não implementada');
  }

  private static async exportAsSVG(id: string, options: ExportOptions): Promise<Blob> {
    // Implementar exportação SVG
    throw new Error('Exportação SVG não implementada');
  }

  private static async exportAsPDF(id: string, options: ExportOptions): Promise<Blob> {
    // Implementar exportação PDF usando jsPDF
    throw new Error('Exportação PDF não implementada');
  }

  private static async exportAsJSON(id: string, options: ExportOptions): Promise<Blob> {
    const flowchart = await this.getFlowchart(id);
    const jsonData = JSON.stringify(flowchart, null, 2);
    return new Blob([jsonData], { type: 'application/json' });
  }

  private static transformFromDatabase(data: any): Flowchart {
    return {
      id: data.id,
      title: data.title,
      description: data.description,
      nodes: data.nodes || [],
      edges: data.edges || [],
      viewport: data.viewport || { x: 0, y: 0, zoom: 1 },
      settings: data.settings || this.getDefaultSettings(),
      companyId: data.company_id,
      createdBy: data.created_by,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      isPublished: data.is_published,
      tags: data.tags || [],
      category: data.category,
      templateId: data.template_id
    };
  }

  private static transformTemplateFromDatabase(data: any): FlowchartTemplate {
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      category: data.category,
      thumbnail: data.thumbnail,
      nodes: data.nodes || [],
      edges: data.edges || [],
      settings: data.settings || this.getDefaultSettings(),
      tags: data.tags || [],
      isPublic: data.is_public,
      createdBy: data.created_by,
      createdAt: data.created_at,
      usageCount: data.usage_count || 0
    };
  }

  private static getDefaultSettings() {
    return {
      snapToGrid: true,
      gridSize: 15,
      showGrid: true,
      showMiniMap: true,
      showControls: true,
      panOnDrag: true,
      zoomOnScroll: true,
      zoomOnPinch: true,
      zoomOnDoubleClick: true,
      preventScrolling: false,
      nodesDraggable: true,
      nodesConnectable: true,
      nodesFocusable: true,
      edgesFocusable: true,
      elementsSelectable: true,
      selectNodesOnDrag: false,
      multiSelectionKeyCode: 'Control',
      deleteKeyCode: 'Delete',
      connectionMode: 'strict' as const,
      connectionLineType: 'bezier' as const
    };
  }
}
```

## 7. Integração com Banco de Dados

### 7.1 Estrutura das Tabelas

```sql
-- Tabela de fluxogramas
CREATE TABLE flowcharts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    nodes JSONB DEFAULT '[]'::jsonb,
    edges JSONB DEFAULT '[]'::jsonb,
    viewport JSONB DEFAULT '{"x": 0, "y": 0, "zoom": 1}'::jsonb,
    settings JSONB DEFAULT '{}'::jsonb,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    created_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_published BOOLEAN DEFAULT false,
    tags TEXT[] DEFAULT '{}',
    category VARCHAR(100),
    template_id UUID REFERENCES flowchart_templates(id)
);

-- Tabela de templates de fluxogramas
CREATE TABLE flowchart_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    thumbnail TEXT,
    nodes JSONB DEFAULT '[]'::jsonb,
    edges JSONB DEFAULT '[]'::jsonb,
    settings JSONB DEFAULT '{}'::jsonb,
    tags TEXT[] DEFAULT '{}',
    is_public BOOLEAN DEFAULT false,
    created_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    usage_count INTEGER DEFAULT 0
);

-- Índices para performance
CREATE INDEX idx_flowcharts_company_id ON flowcharts(company_id);
CREATE INDEX idx_flowcharts_created_by ON flowcharts(created_by);
CREATE INDEX idx_flowcharts_is_published ON flowcharts(is_published);
CREATE INDEX idx_flowcharts_tags ON flowcharts USING GIN(tags);
CREATE INDEX idx_flowchart_templates_category ON flowchart_templates(category);
CREATE INDEX idx_flowchart_templates_is_public ON flowchart_templates(is_public);

-- Triggers para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_flowcharts_updated_at
    BEFORE UPDATE ON flowcharts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

### 7.2 Políticas RLS (Row Level Security)

```sql
-- Habilitar RLS
ALTER TABLE flowcharts ENABLE ROW LEVEL SECURITY;
ALTER TABLE flowchart_templates ENABLE ROW LEVEL SECURITY;

-- Políticas para flowcharts
CREATE POLICY "Users can view flowcharts from their company" ON flowcharts
    FOR SELECT USING (
        company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
    );

CREATE POLICY "Users can create flowcharts for their company" ON flowcharts
    FOR INSERT WITH CHECK (
        company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
        AND created_by = auth.uid()
    );

CREATE POLICY "Users can update their own flowcharts" ON flowcharts
    FOR UPDATE USING (
        created_by = auth.uid()
        OR company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
    );

CREATE POLICY "Users can delete their own flowcharts" ON flowcharts
    FOR DELETE USING (created_by = auth.uid());

-- Políticas para templates
CREATE POLICY "Users can view public templates" ON flowchart_templates
    FOR SELECT USING (is_public = true);

CREATE POLICY "Users can view their own templates" ON flowchart_templates
    FOR SELECT USING (created_by = auth.uid());

CREATE POLICY "Users can create templates" ON flowchart_templates
    FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own templates" ON flowchart_templates
    FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Users can delete their own templates" ON flowchart_templates
    FOR DELETE USING (created_by = auth.uid());
```

## 8. Roteamento e Navegação

### 8.1 Atualização do App.tsx

```typescript
// Adicionar rotas para fluxogramas
<Route path="/flowcharts" element={<FlowchartLibraryPage />} />
<Route path="/flowcharts/new" element={<FlowchartEditorPage />} />
<Route path="/flowcharts/:id" element={<FlowchartEditorPage />} />
<Route path="/flowcharts/:id/preview" element={<FlowchartViewerPage />} />
```

### 8.2 Atualização do MainMenu

```typescript
// Adicionar item de menu para fluxogramas
{
  title: "Fluxogramas",
  description: "Criar e gerenciar fluxogramas de processo",
  icon: <Workflow className="h-8 w-8" />,
  href: "/flowcharts",
  color: "bg-purple-500"
}
```

## 9. Responsividade e Design

### 9.1 Diretrizes de Design

- **Cores primárias**: Azul (#3b82f6) para elementos principais
- **Cores secundárias**: Cinza (#6b7280) para elementos neutros
- **Cores de status**: Verde (#10b981), Amarelo (#f59e0b), Vermelho (#ef4444)
- **Tipografia**: Inter ou system fonts
- **Espaçamento**: Sistema baseado em múltiplos de 4px
- **Bordas**: Raio de 8px para elementos principais
- **Sombras**: Sutis para elevação de elementos

### 9.2 Adaptação Mobile

- **Breakpoints**: sm (640px), md (768px), lg (1024px), xl (1280px)
- **Layout mobile**: Painéis colapsáveis, toolbar simplificada
- **Touch interactions**: Gestos de pinça para zoom, toque longo para seleção
- **Performance**: Lazy loading de componentes, virtualização de listas

## 10. Performance e Otimização

### 10.1 Estratégias de Performance

- **Memoização**: React.memo para componentes de nós
- **Virtualização**: Para listas grandes de templates
- **Debounce**: Para auto-save e busca
- **Code splitting**: Lazy loading de páginas
- **Caching**: React Query para cache de dados

### 10.2 Otimizações do React Flow

- **Node optimization**: Usar nodeExtent para limitar área de renderização
- **Edge optimization**: Simplificar cálculos de path
- **Viewport optimization**: Limitar zoom e pan
- **Memory management**: Cleanup de event listeners

## 11. Testes e Validação

### 11.1 Testes Unitários

- Componentes de nós individuais
- Hooks customizados
- Serviços de API
- Utilitários de validação

### 11.2 Testes de Integração

- Fluxo completo de criação de fluxograma
- Colaboração em tempo real
- Exportação e compartilhamento
- Responsividade em diferentes dispositivos

### 11.3 Testes de Performance

- Renderização de fluxogramas grandes (>100 nós)
- Tempo de carregamento inicial
- Responsividade de interações
- Uso de memória

## 12. Cronograma de Implementação

### Fase 1 - Estrutura Base (4 dias)
- ✅ Configuração do React Flow
- ✅ Tipos TypeScript básicos
- ✅ Componentes de nós fundamentais (Start, Process, Decision, End)
- ✅ Editor principal com canvas
- ✅ Sistema básico de drag-and-drop

### Fase 2 - Funcionalidades Avançadas (5 dias)
- ✅ Nós especializados (Document, Data, Connector)
- ✅ Sistema de propriedades e edição inline
- ✅ Toolbar e controles de zoom
- ✅ Validação de fluxograma
- ✅ Sistema de undo/redo

### Fase 3 - Templates e Biblioteca (3 dias)
- ✅ Sistema de templates
- ✅ Biblioteca de nós
- ✅ Painel de propriedades
- ✅ Categorização e busca

### Fase 4 - Exportação e Compartilhamento (3 dias)
- ✅ Exportação em múltiplos formatos
- ✅ Sistema de compartilhamento
- ✅ Visualizador público
- ✅ Embed de fluxogramas

### Fase 5 - Integração e Testes (3 dias)
- ✅ Integração com sistema existente
- ✅ Testes de performance
- ✅ Otimizações finais
- ✅ Documentação de usuário

**Total: 18 dias de desenvolvimento**

## 13. Considerações Futuras

### 13.1 Funcionalidades Avançadas

- **Colaboração em tempo real**: Cursores de usuários, edição simultânea
- **Versionamento**: Histórico de alterações, branches
- **Automação**: Execução de fluxogramas, integração com APIs
- **IA**: Sugestões automáticas, otimização de fluxos
- **Analytics**: Métricas de uso, performance de processos

### 13.2 Integrações

- **Sistemas externos**: CRM, ERP, ferramentas de projeto
- **APIs**: Webhooks, REST, GraphQL
- **Notificações**: Email, Slack, Teams
- **Relatórios**: PDF, Excel, dashboards

### 13.3 Escalabilidade

- **Microserviços**: Separação de responsabilidades
- **CDN**: Distribuição de assets
- **Cache**: Redis, Memcached
- **Load balancing**: Distribuição de carga
- **Monitoring**: Logs, métricas, alertas

---

*Esta documentação fornece uma base sólida para implementação do Editor de Fluxogramas, com foco em usabilidade, performance e escalabilidade. A arquitetura modular permite extensões futuras e integração com outras funcionalidades da plataforma.*
