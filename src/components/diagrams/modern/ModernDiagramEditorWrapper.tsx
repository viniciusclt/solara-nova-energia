/**
 * Wrapper para o Editor de Diagramas Moderno
 * Fornece uma interface simplificada e gerenciamento de estado
 */

import React, { useState, useCallback, useMemo } from 'react';
import { ModernDiagramEditor } from './ModernDiagramEditor';
import { Node, Edge, NodeTypes } from '@xyflow/react';
import { ModernFlowchartNode } from './nodes/ModernFlowchartNode';
import { ModernMindMapNode } from './nodes/ModernMindMapNode';
import { ModernOrgChartNode } from './nodes/ModernOrgChartNode';

type DiagramType = 'flowchart' | 'mindmap' | 'orgchart';

interface DiagramData {
  nodes: Node[];
  edges: Edge[];
}

interface ModernDiagramEditorWrapperProps {
  initialType?: DiagramType;
  initialData?: DiagramData;
  onSave?: (data: DiagramData) => void;
  onLoad?: () => DiagramData | null;
  className?: string;
}

const ModernDiagramEditorWrapper: React.FC<ModernDiagramEditorWrapperProps> = ({
  initialType = 'flowchart',
  initialData,
  onSave,
  onLoad,
  className
}) => {
  const [diagramType, setDiagramType] = useState<DiagramType>(initialType);
  const [nodes, setNodes] = useState<Node[]>(initialData?.nodes || []);
  const [edges, setEdges] = useState<Edge[]>(initialData?.edges || []);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Tipos de nós personalizados
  const nodeTypes: NodeTypes = useMemo(() => ({
    flowchartNode: ModernFlowchartNode,
    mindmapNode: ModernMindMapNode,
    orgchartNode: ModernOrgChartNode,
  }), []);

  // Dados padrão para cada tipo de diagrama
  const getDefaultData = useCallback((type: DiagramType): DiagramData => {
    switch (type) {
      case 'flowchart':
        return {
          nodes: [
            {
              id: 'start',
              type: 'flowchartNode',
              position: { x: 250, y: 50 },
              data: {
                label: 'Início',
                shape: 'ellipse',
                color: '#10b981',
                status: 'active'
              }
            }
          ],
          edges: []
        };
      
      case 'mindmap':
        return {
          nodes: [
            {
              id: 'central',
              type: 'mindmapNode',
              position: { x: 300, y: 200 },
              data: {
                label: 'Ideia Central',
                level: 0,
                color: '#3b82f6',
                emoji: '💡'
              }
            }
          ],
          edges: []
        };
      
      case 'orgchart':
        return {
          nodes: [
            {
              id: 'ceo',
              type: 'orgchartNode',
              position: { x: 300, y: 50 },
              data: {
                name: 'CEO',
                position: 'Chief Executive Officer',
                department: 'Executivo',
                level: 'executive',
                email: 'ceo@empresa.com',
                color: '#3b82f6'
              }
            }
          ],
          edges: []
        };
      
      default:
        return { nodes: [], edges: [] };
    }
  }, []);

  // Manipuladores de eventos
  const handleSave = useCallback(() => {
    const data = { nodes, edges };
    onSave?.(data);
  }, [nodes, edges, onSave]);

  const handleLoad = useCallback(() => {
    setIsLoading(true);
    try {
      const data = onLoad?.();
      if (data) {
        setNodes(data.nodes);
        setEdges(data.edges);
      }
    } catch (error) {
      console.error('Erro ao carregar diagrama:', error);
    } finally {
      setIsLoading(false);
    }
  }, [onLoad]);

  const handleClear = useCallback(() => {
    const defaultData = getDefaultData(diagramType);
    setNodes(defaultData.nodes);
    setEdges(defaultData.edges);
    setSelectedNodeId(null);
  }, [diagramType, getDefaultData]);

  const handleTypeChange = useCallback((newType: DiagramType) => {
    setDiagramType(newType);
    const defaultData = getDefaultData(newType);
    setNodes(defaultData.nodes);
    setEdges(defaultData.edges);
    setSelectedNodeId(null);
  }, [getDefaultData]);

  const handleNodesChange = useCallback((changes: any) => {
    setNodes((nds) => {
      // Aplicar mudanças nos nós
      return nds.map((node) => {
        const change = changes.find((c: any) => c.id === node.id);
        if (change) {
          switch (change.type) {
            case 'position':
              return { ...node, position: change.position };
            case 'select':
              setSelectedNodeId(change.selected ? node.id : null);
              return { ...node, selected: change.selected };
            case 'remove':
              return null;
            default:
              return node;
          }
        }
        return node;
      }).filter(Boolean) as Node[];
    });
  }, []);

  const handleEdgesChange = useCallback((changes: any) => {
    setEdges((eds) => {
      // Aplicar mudanças nas arestas
      return eds.map((edge) => {
        const change = changes.find((c: any) => c.id === edge.id);
        if (change) {
          switch (change.type) {
            case 'remove':
              return null;
            default:
              return edge;
          }
        }
        return edge;
      }).filter(Boolean) as Edge[];
    });
  }, []);

  const handleConnect = useCallback((connection: any) => {
    const newEdge: Edge = {
      id: `e${connection.source}-${connection.target}`,
      source: connection.source,
      target: connection.target,
      type: 'smoothstep',
      animated: diagramType === 'flowchart'
    };
    setEdges((eds) => [...eds, newEdge]);
  }, [diagramType]);

  const handleAddNode = useCallback((type: string, position: { x: number; y: number }) => {
    const nodeId = `node_${Date.now()}`;
    let nodeData: any = {};
    let nodeType = 'flowchartNode';

    switch (diagramType) {
      case 'flowchart':
        nodeType = 'flowchartNode';
        nodeData = {
          label: 'Novo Processo',
          shape: 'rectangle',
          color: '#3b82f6'
        };
        break;
      
      case 'mindmap':
        nodeType = 'mindmapNode';
        nodeData = {
          label: 'Nova Ideia',
          level: 1,
          color: '#10b981',
          emoji: '💭'
        };
        break;
      
      case 'orgchart':
        nodeType = 'orgchartNode';
        nodeData = {
          name: 'Novo Funcionário',
          position: 'Cargo',
          department: 'Departamento',
          level: 'employee',
          email: 'email@empresa.com',
          color: '#f59e0b'
        };
        break;
    }

    const newNode: Node = {
      id: nodeId,
      type: nodeType,
      position,
      data: nodeData
    };

    setNodes((nds) => [...nds, newNode]);
    setSelectedNodeId(nodeId);
  }, [diagramType]);

  const handleUpdateNode = useCallback((nodeId: string, newData: any) => {
    setNodes((nds) => 
      nds.map((node) => 
        node.id === nodeId 
          ? { ...node, data: { ...node.data, ...newData } }
          : node
      )
    );
  }, []);

  const handleDeleteNode = useCallback((nodeId: string) => {
    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
    if (selectedNodeId === nodeId) {
      setSelectedNodeId(null);
    }
  }, [selectedNodeId]);

  return (
    <ModernDiagramEditor
      diagramType={diagramType}
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      selectedNodeId={selectedNodeId}
      isLoading={isLoading}
      onTypeChange={handleTypeChange}
      onNodesChange={handleNodesChange}
      onEdgesChange={handleEdgesChange}
      onConnect={handleConnect}
      onAddNode={handleAddNode}
      onUpdateNode={handleUpdateNode}
      onDeleteNode={handleDeleteNode}
      onSave={handleSave}
      onLoad={handleLoad}
      onClear={handleClear}
      className={className}
    />
  );
};

export { ModernDiagramEditorWrapper };
export type { DiagramType, DiagramData };