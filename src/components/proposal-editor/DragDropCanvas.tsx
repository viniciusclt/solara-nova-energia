import React, { useCallback, useRef, useState, useEffect } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  Connection,
  NodeChange,
  EdgeChange,
  ReactFlowProvider,
  useReactFlow,
  Panel
} from 'reactflow';
import 'reactflow/dist/style.css';
import { cn } from '../../lib/utils';
import type {
  ProposalTemplate,
  ProposalElement,
  TemplateFormat,
  Position,
  GridConfig,
  CanvasData
} from '../../types/proposal-editor';
import { FORMAT_DIMENSIONS } from '../../types/proposal-editor';
import { Button } from '../ui/button';
import { ZoomIn, ZoomOut, RotateCcw, Grid3X3, Eye, EyeOff } from 'lucide-react';

// Componentes customizados para diferentes tipos de elementos
import { TextElementNode } from './elements/TextElementNode';
import { ImageElementNode } from './elements/ImageElementNode';
import { ChartElementNode } from './elements/ChartElementNode';
import { TableElementNode } from './elements/TableElementNode';
import { ShapeElementNode } from './elements/ShapeElementNode';

// Tipos de nós customizados
const nodeTypes = {
  textElement: TextElementNode,
  imageElement: ImageElementNode,
  chartElement: ChartElementNode,
  tableElement: TableElementNode,
  shapeElement: ShapeElementNode
};

interface DragDropCanvasProps {
  template: ProposalTemplate | null;
  elements: ProposalElement[];
  selectedElementId: string | null;
  onElementSelect: (elementId: string | null) => void;
  onElementUpdate: (elementId: string, updates: Partial<ProposalElement>) => void;
  onElementDelete: (elementId: string) => void;
  onElementAdd: (element: Omit<ProposalElement, 'id' | 'created_at'>) => void;
  gridConfig: GridConfig;
  zoom: number;
  pan: { x: number; y: number };
  onViewportChange: (viewport: { zoom: number; pan: { x: number; y: number } }) => void;
  className?: string;
}

const CanvasContent: React.FC<DragDropCanvasProps> = ({
  template,
  elements,
  selectedElementId,
  onElementSelect,
  onElementUpdate,
  onElementDelete,
  onElementAdd,
  gridConfig,
  zoom,
  pan,
  onViewportChange,
  className
}) => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { setViewport, getViewport, fitView } = useReactFlow();
  const [showGrid, setShowGrid] = useState(gridConfig.visible);
  
  // Converter elementos para nós do React Flow
  const convertElementsToNodes = useCallback((elements: ProposalElement[]): Node[] => {
    return elements.map(element => ({
      id: element.id,
      type: `${element.element_type}Element`,
      position: { x: element.position.x, y: element.position.y },
      data: {
        element,
        isSelected: element.id === selectedElementId,
        onUpdate: (updates: Partial<ProposalElement>) => onElementUpdate(element.id, updates),
        onDelete: () => onElementDelete(element.id),
        onSelect: () => onElementSelect(element.id)
      },
      selected: element.id === selectedElementId,
      draggable: true,
      selectable: true,
      style: {
        width: element.position.width,
        height: element.position.height,
        zIndex: element.z_index
      }
    }));
  }, [selectedElementId, onElementUpdate, onElementDelete, onElementSelect]);

  const [nodes, setNodes, onNodesChange] = useNodesState(convertElementsToNodes(elements));
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Atualizar nós quando elementos mudarem
  useEffect(() => {
    setNodes(convertElementsToNodes(elements));
  }, [elements, convertElementsToNodes, setNodes]);

  // Configurar viewport inicial
  useEffect(() => {
    if (template) {
      setViewport({ x: pan.x, y: pan.y, zoom }, { duration: 300 });
    }
  }, [template, setViewport, zoom, pan]);

  // Manipular mudanças nos nós
  const handleNodesChange = useCallback((changes: NodeChange[]) => {
    onNodesChange(changes);
    
    // Atualizar posições dos elementos quando nós são movidos
    changes.forEach(change => {
      if (change.type === 'position' && change.position && change.id) {
        const element = elements.find(el => el.id === change.id);
        if (element) {
          onElementUpdate(change.id, {
            position: {
              ...element.position,
              x: change.position.x,
              y: change.position.y
            }
          });
        }
      }
    });
  }, [onNodesChange, elements, onElementUpdate]);

  // Manipular seleção de nós
  const handleNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    event.stopPropagation();
    onElementSelect(node.id);
  }, [onElementSelect]);

  // Manipular clique no canvas (desselecionar)
  const handlePaneClick = useCallback(() => {
    onElementSelect(null);
  }, [onElementSelect]);

  // Manipular mudanças no viewport
  const handleViewportChange = useCallback((viewport: { x: number; y: number; zoom: number }) => {
    onViewportChange({
      zoom: viewport.zoom,
      pan: { x: viewport.x, y: viewport.y }
    });
  }, [onViewportChange]);

  // Manipular drop de elementos
  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();

    const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
    if (!reactFlowBounds || !template) return;

    const type = event.dataTransfer.getData('application/reactflow');
    if (!type) return;

    const viewport = getViewport();
    const position = {
      x: (event.clientX - reactFlowBounds.left - viewport.x) / viewport.zoom,
      y: (event.clientY - reactFlowBounds.top - viewport.y) / viewport.zoom
    };

    // Snap to grid se habilitado
    if (gridConfig.snapToGrid) {
      position.x = Math.round(position.x / gridConfig.size) * gridConfig.size;
      position.y = Math.round(position.y / gridConfig.size) * gridConfig.size;
    }

    // Criar elemento baseado no tipo
    const newElement = createElementFromType(type, position, template.id);
    if (newElement) {
      onElementAdd(newElement);
    }
  }, [template, getViewport, gridConfig, onElementAdd]);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // Funções de controle do canvas
  const handleZoomIn = useCallback(() => {
    const viewport = getViewport();
    setViewport({ ...viewport, zoom: Math.min(viewport.zoom * 1.2, 3) }, { duration: 200 });
  }, [getViewport, setViewport]);

  const handleZoomOut = useCallback(() => {
    const viewport = getViewport();
    setViewport({ ...viewport, zoom: Math.max(viewport.zoom / 1.2, 0.1) }, { duration: 200 });
  }, [getViewport, setViewport]);

  const handleResetView = useCallback(() => {
    fitView({ duration: 500, padding: 0.1 });
  }, [fitView]);

  const toggleGrid = useCallback(() => {
    setShowGrid(prev => !prev);
  }, []);

  // Obter dimensões do canvas baseado no formato
  const getCanvasDimensions = () => {
    if (!template) return { width: 800, height: 600 };
    
    const dimensions = FORMAT_DIMENSIONS[template.format];
    return {
      width: dimensions.width,
      height: dimensions.height
    };
  };

  const canvasDimensions = getCanvasDimensions();

  return (
    <div 
      ref={reactFlowWrapper}
      className={cn(
        'relative w-full h-full bg-gray-50 dark:bg-gray-900',
        className
      )}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        onPaneClick={handlePaneClick}
        onViewportChange={handleViewportChange}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-left"
        className="bg-white dark:bg-gray-800"
        style={{
          background: template?.canvas_data.background || '#ffffff'
        }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={gridConfig.size}
          size={1}
          color={showGrid ? '#e5e7eb' : 'transparent'}
        />
        
        {/* Canvas bounds indicator */}
        {template && (
          <div
            className="absolute border-2 border-dashed border-gray-300 dark:border-gray-600 pointer-events-none"
            style={{
              width: canvasDimensions.width,
              height: canvasDimensions.height,
              left: 0,
              top: 0,
              zIndex: -1
            }}
          />
        )}

        <Controls 
          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg"
        />
        
        <MiniMap 
          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
          nodeColor="#3b82f6"
          maskColor="rgba(0, 0, 0, 0.1)"
        />

        {/* Custom controls panel */}
        <Panel position="top-right" className="space-y-2">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2 shadow-lg">
            <div className="flex flex-col space-y-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleZoomIn}
                className="h-8 w-8 p-0"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleZoomOut}
                className="h-8 w-8 p-0"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetView}
                className="h-8 w-8 p-0"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleGrid}
                className={cn(
                  "h-8 w-8 p-0",
                  showGrid && "bg-blue-100 dark:bg-blue-900"
                )}
              >
                {showGrid ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </Panel>

        {/* Format indicator */}
        {template && (
          <Panel position="bottom-right">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1 shadow-lg">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                {template.format} ({canvasDimensions.width} × {canvasDimensions.height})
              </span>
            </div>
          </Panel>
        )}
      </ReactFlow>
    </div>
  );
};

// Função auxiliar para criar elementos baseado no tipo
function createElementFromType(
  type: string,
  position: { x: number; y: number },
  templateId: string
): Omit<ProposalElement, 'id' | 'created_at'> | null {
  const baseElement = {
    template_id: templateId,
    position: {
      x: position.x,
      y: position.y,
      width: 200,
      height: 100
    },
    z_index: 1
  };

  switch (type) {
    case 'text':
      return {
        ...baseElement,
        element_type: 'text',
        properties: {
          content: 'Novo texto',
          fontSize: 16,
          color: '#000000',
          textAlign: 'left'
        }
      };

    case 'image':
      return {
        ...baseElement,
        element_type: 'image',
        position: { ...baseElement.position, width: 300, height: 200 },
        properties: {
          src: 'https://via.placeholder.com/300x200',
          alt: 'Nova imagem',
          objectFit: 'cover'
        }
      };

    case 'chart':
      return {
        ...baseElement,
        element_type: 'chart',
        position: { ...baseElement.position, width: 400, height: 300 },
        properties: {
          type: 'bar',
          data: [
            { name: 'A', value: 10 },
            { name: 'B', value: 20 },
            { name: 'C', value: 15 }
          ],
          config: {
            title: 'Novo Gráfico',
            showLegend: true
          }
        }
      };

    case 'table':
      return {
        ...baseElement,
        element_type: 'table',
        position: { ...baseElement.position, width: 350, height: 200 },
        properties: {
          headers: ['Coluna 1', 'Coluna 2'],
          rows: [['Linha 1', 'Dados 1'], ['Linha 2', 'Dados 2']],
          styling: {
            headerBg: '#f3f4f6',
            headerColor: '#1f2937',
            fontSize: 14
          }
        }
      };

    case 'shape':
      return {
        ...baseElement,
        element_type: 'shape',
        position: { ...baseElement.position, width: 150, height: 150 },
        properties: {
          type: 'rectangle',
          fill: '#3b82f6',
          opacity: 0.8
        }
      };

    default:
      return null;
  }
}

// Componente principal com Provider
export const DragDropCanvas: React.FC<DragDropCanvasProps> = (props) => {
  return (
    <ReactFlowProvider>
      <CanvasContent {...props} />
    </ReactFlowProvider>
  );
};

export default DragDropCanvas;