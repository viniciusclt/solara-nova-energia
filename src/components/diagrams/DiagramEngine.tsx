/**
 * Engine Moderno de Diagramas
 * Baseado em React Flow com suporte a fluxogramas, organogramas e mindmaps
 * Inspirado em MindMeister e Draw.io
 */

import React, { useCallback, useState, useRef, useEffect } from 'react';
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
  NodeTypes,
  EdgeTypes,
  Panel,
  ReactFlowProvider,
  useReactFlow,
  MarkerType
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Separator } from '../ui/separator';
import {
  Plus,
  Square,
  Circle,
  Diamond,
  Triangle,
  Hexagon,
  Save,
  Download,
  Upload,
  Trash2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Move,
  MousePointer,
  Type,
  Palette
} from 'lucide-react';

// Tipos de nós personalizados
const CustomNode = ({ data, selected }: any) => {
  return (
    <div
      className={`px-4 py-2 shadow-md rounded-md bg-white border-2 transition-all duration-200 ${
        selected ? 'border-blue-500 shadow-lg' : 'border-gray-300'
      }`}
      style={{
        backgroundColor: data.backgroundColor || '#ffffff',
        color: data.textColor || '#000000',
        borderRadius: data.borderRadius || '6px',
        minWidth: '120px',
        textAlign: 'center'
      }}
    >
      <div className="font-medium">{data.label}</div>
      {data.subtitle && (
        <div className="text-sm text-gray-600 mt-1">{data.subtitle}</div>
      )}
    </div>
  );
};

const ProcessNode = ({ data, selected }: any) => {
  return (
    <div
      className={`px-4 py-2 shadow-md bg-blue-100 border-2 transition-all duration-200 ${
        selected ? 'border-blue-500 shadow-lg' : 'border-blue-300'
      }`}
      style={{
        backgroundColor: data.backgroundColor || '#dbeafe',
        color: data.textColor || '#1e40af',
        borderRadius: '20px',
        minWidth: '140px',
        textAlign: 'center'
      }}
    >
      <div className="font-medium">{data.label}</div>
    </div>
  );
};

const DecisionNode = ({ data, selected }: any) => {
  return (
    <div
      className={`px-4 py-2 shadow-md bg-yellow-100 border-2 transition-all duration-200 ${
        selected ? 'border-yellow-500 shadow-lg' : 'border-yellow-300'
      }`}
      style={{
        backgroundColor: data.backgroundColor || '#fef3c7',
        color: data.textColor || '#92400e',
        clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
        minWidth: '120px',
        minHeight: '80px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center'
      }}
    >
      <div className="font-medium">{data.label}</div>
    </div>
  );
};

const StartEndNode = ({ data, selected }: any) => {
  return (
    <div
      className={`px-4 py-2 shadow-md bg-green-100 border-2 transition-all duration-200 ${
        selected ? 'border-green-500 shadow-lg' : 'border-green-300'
      }`}
      style={{
        backgroundColor: data.backgroundColor || '#dcfce7',
        color: data.textColor || '#166534',
        borderRadius: '50px',
        minWidth: '120px',
        textAlign: 'center'
      }}
    >
      <div className="font-medium">{data.label}</div>
    </div>
  );
};

const MindMapNode = ({ data, selected }: any) => {
  return (
    <div
      className={`px-3 py-2 shadow-md rounded-lg border-2 transition-all duration-200 ${
        selected ? 'border-purple-500 shadow-lg' : 'border-purple-300'
      }`}
      style={{
        backgroundColor: data.backgroundColor || '#f3e8ff',
        color: data.textColor || '#7c3aed',
        borderRadius: '12px',
        minWidth: data.isRoot ? '160px' : '100px',
        textAlign: 'center',
        fontSize: data.isRoot ? '16px' : '14px',
        fontWeight: data.isRoot ? 'bold' : 'normal'
      }}
    >
      <div>{data.label}</div>
    </div>
  );
};

// Tipos de nós disponíveis
const nodeTypes: NodeTypes = {
  custom: CustomNode,
  process: ProcessNode,
  decision: DecisionNode,
  startEnd: StartEndNode,
  mindMap: MindMapNode
};

// Tipos de arestas personalizadas
const edgeTypes: EdgeTypes = {};

// Nós iniciais
const initialNodes: Node[] = [
  {
    id: '1',
    type: 'startEnd',
    position: { x: 250, y: 25 },
    data: { label: 'Início' }
  }
];

const initialEdges: Edge[] = [];

// Componente principal do engine
const DiagramEngineCore = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedTool, setSelectedTool] = useState<string>('select');
  const [diagramType, setDiagramType] = useState<'flowchart' | 'orgchart' | 'mindmap'>('flowchart');
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { project, getViewport } = useReactFlow();
  const [nodeId, setNodeId] = useState(2);

  const onConnect = useCallback(
    (params: Connection) => {
      const edge = {
        ...params,
        animated: diagramType === 'mindmap',
        style: {
          stroke: diagramType === 'mindmap' ? '#8b5cf6' : '#374151',
          strokeWidth: diagramType === 'mindmap' ? 3 : 2
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: diagramType === 'mindmap' ? '#8b5cf6' : '#374151'
        }
      };
      setEdges((eds) => addEdge(edge, eds));
    },
    [setEdges, diagramType]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      if (!reactFlowWrapper.current) return;

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const type = event.dataTransfer.getData('application/reactflow');

      if (!type) return;

      const position = project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top
      });

      const newNode: Node = {
        id: `node_${nodeId}`,
        type,
        position,
        data: {
          label: `${type === 'decision' ? 'Decisão' : type === 'process' ? 'Processo' : type === 'startEnd' ? 'Fim' : type === 'mindMap' ? 'Ideia' : 'Novo Nó'} ${nodeId}`,
          isRoot: type === 'mindMap' && nodes.filter(n => n.type === 'mindMap').length === 0
        }
      };

      setNodes((nds) => nds.concat(newNode));
      setNodeId((id) => id + 1);
    },
    [project, nodeId, setNodes, nodes]
  );

  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  const addNode = (type: string) => {
    const viewport = getViewport();
    const newNode: Node = {
      id: `node_${nodeId}`,
      type,
      position: {
        x: Math.random() * 400 + 100,
        y: Math.random() * 400 + 100
      },
      data: {
        label: `${type === 'decision' ? 'Decisão' : type === 'process' ? 'Processo' : type === 'startEnd' ? 'Fim' : type === 'mindMap' ? 'Ideia' : 'Novo Nó'} ${nodeId}`,
        isRoot: type === 'mindMap' && nodes.filter(n => n.type === 'mindMap').length === 0
      }
    };

    setNodes((nds) => nds.concat(newNode));
    setNodeId((id) => id + 1);
  };

  const clearDiagram = () => {
    setNodes([]);
    setEdges([]);
    setNodeId(1);
  };

  const saveDiagram = () => {
    const diagramData = {
      nodes,
      edges,
      viewport: getViewport(),
      type: diagramType
    };
    
    const dataStr = JSON.stringify(diagramData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `diagram_${diagramType}_${new Date().toISOString().slice(0,10)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const loadDiagram = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const diagramData = JSON.parse(e.target?.result as string);
        setNodes(diagramData.nodes || []);
        setEdges(diagramData.edges || []);
        setDiagramType(diagramData.type || 'flowchart');
      } catch (error) {
        console.error('Erro ao carregar diagrama:', error);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="w-full h-screen flex">
      {/* Toolbar lateral */}
      <div className="w-64 bg-gray-50 border-r border-gray-200 p-4 overflow-y-auto">
        <div className="space-y-4">
          {/* Tipo de diagrama */}
          <Card className="p-3">
            <h3 className="font-semibold mb-2">Tipo de Diagrama</h3>
            <div className="space-y-2">
              <Button
                variant={diagramType === 'flowchart' ? 'default' : 'outline'}
                size="sm"
                className="w-full justify-start"
                onClick={() => setDiagramType('flowchart')}
              >
                Fluxograma
              </Button>
              <Button
                variant={diagramType === 'orgchart' ? 'default' : 'outline'}
                size="sm"
                className="w-full justify-start"
                onClick={() => setDiagramType('orgchart')}
              >
                Organograma
              </Button>
              <Button
                variant={diagramType === 'mindmap' ? 'default' : 'outline'}
                size="sm"
                className="w-full justify-start"
                onClick={() => setDiagramType('mindmap')}
              >
                Mapa Mental
              </Button>
            </div>
          </Card>

          {/* Ferramentas */}
          <Card className="p-3">
            <h3 className="font-semibold mb-2">Ferramentas</h3>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={selectedTool === 'select' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedTool('select')}
              >
                <MousePointer className="w-4 h-4" />
              </Button>
              <Button
                variant={selectedTool === 'move' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedTool('move')}
              >
                <Move className="w-4 h-4" />
              </Button>
            </div>
          </Card>

          {/* Elementos */}
          <Card className="p-3">
            <h3 className="font-semibold mb-2">Elementos</h3>
            <div className="space-y-2">
              {diagramType === 'flowchart' && (
                <>
                  <div
                    className="flex items-center p-2 bg-white border rounded cursor-move hover:bg-gray-50"
                    draggable
                    onDragStart={(e) => onDragStart(e, 'startEnd')}
                  >
                    <Circle className="w-4 h-4 mr-2" />
                    Início/Fim
                  </div>
                  <div
                    className="flex items-center p-2 bg-white border rounded cursor-move hover:bg-gray-50"
                    draggable
                    onDragStart={(e) => onDragStart(e, 'process')}
                  >
                    <Square className="w-4 h-4 mr-2" />
                    Processo
                  </div>
                  <div
                    className="flex items-center p-2 bg-white border rounded cursor-move hover:bg-gray-50"
                    draggable
                    onDragStart={(e) => onDragStart(e, 'decision')}
                  >
                    <Diamond className="w-4 h-4 mr-2" />
                    Decisão
                  </div>
                </>
              )}
              
              {diagramType === 'orgchart' && (
                <>
                  <div
                    className="flex items-center p-2 bg-white border rounded cursor-move hover:bg-gray-50"
                    draggable
                    onDragStart={(e) => onDragStart(e, 'custom')}
                  >
                    <Square className="w-4 h-4 mr-2" />
                    Cargo
                  </div>
                </>
              )}
              
              {diagramType === 'mindmap' && (
                <>
                  <div
                    className="flex items-center p-2 bg-white border rounded cursor-move hover:bg-gray-50"
                    draggable
                    onDragStart={(e) => onDragStart(e, 'mindMap')}
                  >
                    <Hexagon className="w-4 h-4 mr-2" />
                    Ideia
                  </div>
                </>
              )}
            </div>
          </Card>

          {/* Ações */}
          <Card className="p-3">
            <h3 className="font-semibold mb-2">Ações</h3>
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={saveDiagram}
              >
                <Save className="w-4 h-4 mr-2" />
                Salvar
              </Button>
              <label className="block">
                <input
                  type="file"
                  accept=".json"
                  onChange={loadDiagram}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  as="span"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Carregar
                </Button>
              </label>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={clearDiagram}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Limpar
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Área do diagrama */}
      <div className="flex-1" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDrop={onDrop}
          onDragOver={onDragOver}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          attributionPosition="bottom-left"
        >
          <Controls />
          <MiniMap />
          <Background variant="dots" gap={12} size={1} />
          
          <Panel position="top-right">
            <div className="bg-white p-2 rounded shadow-lg border">
              <div className="text-sm font-medium text-gray-700">
                {diagramType === 'flowchart' && 'Fluxograma'}
                {diagramType === 'orgchart' && 'Organograma'}
                {diagramType === 'mindmap' && 'Mapa Mental'}
              </div>
              <div className="text-xs text-gray-500">
                {nodes.length} elementos
              </div>
            </div>
          </Panel>
        </ReactFlow>
      </div>
    </div>
  );
};

// Wrapper com provider
export const DiagramEngine = () => {
  return (
    <ReactFlowProvider>
      <DiagramEngineCore />
    </ReactFlowProvider>
  );
};

export default DiagramEngine;