import { useCallback, useMemo } from 'react';
import { Node, Edge, Position } from 'reactflow';
import { MindMapNodeData } from '@/components/flowchart/nodes/MindMapNode';

interface MindMapHookProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: (changes: any[]) => void;
  onEdgesChange: (changes: any[]) => void;
}

interface MindMapNode extends Node {
  data: MindMapNodeData;
}

export const useMindMap = ({ nodes, edges, onNodesChange, onEdgesChange }: MindMapHookProps) => {
  // Função para calcular posição radial baseada no nível e índice
  const calculateRadialPosition = useCallback((level: number, index: number, totalAtLevel: number, parentPosition?: { x: number; y: number }) => {
    const baseRadius = 200; // Raio base
    const radiusIncrement = 150; // Incremento por nível
    const radius = baseRadius + (level * radiusIncrement);
    
    // Ângulo baseado no índice e total de nós no nível
    const angleStep = (2 * Math.PI) / Math.max(totalAtLevel, 1);
    const angle = index * angleStep - Math.PI / 2; // Começar do topo
    
    const centerX = parentPosition?.x || 400; // Centro padrão
    const centerY = parentPosition?.y || 300;
    
    return {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle)
    };
  }, []);

  // Função para organizar nós em layout radial
  const arrangeRadialLayout = useCallback(() => {
    const mindMapNodes = nodes.filter(node => node.type === 'mindmap') as MindMapNode[];
    const rootNode = mindMapNodes.find(node => node.data.isRoot);
    
    if (!rootNode) return;

    // Agrupar nós por nível
    const nodesByLevel: { [level: number]: MindMapNode[] } = {};
    mindMapNodes.forEach(node => {
      const level = node.data.level || 0;
      if (!nodesByLevel[level]) nodesByLevel[level] = [];
      nodesByLevel[level].push(node);
    });

    const updatedNodes = [...nodes];
    
    // Posicionar nó raiz no centro
    const rootIndex = updatedNodes.findIndex(n => n.id === rootNode.id);
    if (rootIndex !== -1) {
      updatedNodes[rootIndex] = {
        ...rootNode,
        position: { x: 400, y: 300 }
      };
    }

    // Posicionar nós de outros níveis
    Object.keys(nodesByLevel).forEach(levelStr => {
      const level = parseInt(levelStr);
      if (level === 0) return; // Pular nó raiz
      
      const levelNodes = nodesByLevel[level];
      levelNodes.forEach((node, index) => {
        const position = calculateRadialPosition(level, index, levelNodes.length, { x: 400, y: 300 });
        const nodeIndex = updatedNodes.findIndex(n => n.id === node.id);
        if (nodeIndex !== -1) {
          updatedNodes[nodeIndex] = {
            ...node,
            position
          };
        }
      });
    });

    onNodesChange(updatedNodes.map(node => ({
      type: 'position',
      id: node.id,
      position: node.position
    })));
  }, [nodes, onNodesChange, calculateRadialPosition]);

  // Função para adicionar novo nó filho
  const addChildNode = useCallback((parentId: string, label: string, category?: string) => {
    const parentNode = nodes.find(n => n.id === parentId) as MindMapNode;
    if (!parentNode) return;

    const parentLevel = parentNode.data.level || 0;
    const childLevel = parentLevel + 1;
    
    // Contar filhos existentes do mesmo pai
    const siblings = edges.filter(edge => edge.source === parentId);
    const siblingIndex = siblings.length;
    
    // Calcular posição inicial
    const position = calculateRadialPosition(childLevel, siblingIndex, siblingIndex + 1, parentNode.position);
    
    const newNodeId = `mindmap-${Date.now()}`;
    
    // Criar novo nó
    const newNode: Node = {
      id: newNodeId,
      type: 'mindmap',
      position,
      data: {
        label,
        level: childLevel,
        category,
        isRoot: false
      }
    };

    // Criar nova aresta
    const newEdge: Edge = {
      id: `edge-${parentId}-${newNodeId}`,
      source: parentId,
      target: newNodeId,
      type: 'smoothstep',
      style: {
        stroke: '#8b5cf6',
        strokeWidth: 2
      },
      markerEnd: {
        type: 'arrowclosed',
        color: '#8b5cf6'
      }
    };

    // Adicionar nó e aresta
    onNodesChange([{ type: 'add', item: newNode }]);
    onEdgesChange([{ type: 'add', item: newEdge }]);
    
    // Reorganizar layout após adicionar
    setTimeout(() => arrangeRadialLayout(), 100);
  }, [nodes, edges, onNodesChange, onEdgesChange, calculateRadialPosition, arrangeRadialLayout]);

  // Função para criar mindmap inicial
  const createInitialMindMap = useCallback((centerTopic: string) => {
    const rootNode: Node = {
      id: 'mindmap-root',
      type: 'mindmap',
      position: { x: 400, y: 300 },
      data: {
        label: centerTopic,
        level: 0,
        isRoot: true
      }
    };

    onNodesChange([{ type: 'add', item: rootNode }]);
  }, [onNodesChange]);

  // Função para converter fluxograma em mindmap
  const convertToMindMap = useCallback(() => {
    const flowchartNodes = nodes.filter(node => node.type !== 'mindmap');
    if (flowchartNodes.length === 0) return;

    // Encontrar nó inicial ou criar um nó raiz
    let rootNode = flowchartNodes.find(node => node.type === 'start');
    if (!rootNode) {
      rootNode = flowchartNodes[0];
    }

    // Converter nós para mindmap
    const convertedNodes: Node[] = [];
    const processedNodes = new Set<string>();
    
    const convertNode = (node: Node, level: number, isRoot: boolean = false) => {
      if (processedNodes.has(node.id)) return;
      processedNodes.add(node.id);

      const mindMapNode: Node = {
        ...node,
        type: 'mindmap',
        data: {
          label: node.data.label || 'Sem título',
          level,
          isRoot,
          category: node.type
        }
      };
      
      convertedNodes.push(mindMapNode);
      
      // Processar nós conectados
      const connectedEdges = edges.filter(edge => edge.source === node.id);
      connectedEdges.forEach(edge => {
        const targetNode = flowchartNodes.find(n => n.id === edge.target);
        if (targetNode && !processedNodes.has(targetNode.id)) {
          convertNode(targetNode, level + 1);
        }
      });
    };

    convertNode(rootNode, 0, true);
    
    // Substituir nós existentes
    const otherNodes = nodes.filter(node => !flowchartNodes.some(fn => fn.id === node.id));
    const allNodes = [...otherNodes, ...convertedNodes];
    
    onNodesChange(allNodes.map(node => ({
      type: 'replace',
      item: node
    })));
    
    // Reorganizar layout
    setTimeout(() => arrangeRadialLayout(), 100);
  }, [nodes, edges, onNodesChange, arrangeRadialLayout]);

  // Estatísticas do mindmap
  const mindMapStats = useMemo(() => {
    const mindMapNodes = nodes.filter(node => node.type === 'mindmap');
    const levels = mindMapNodes.reduce((acc, node) => {
      const level = (node.data as MindMapNodeData).level || 0;
      acc[level] = (acc[level] || 0) + 1;
      return acc;
    }, {} as { [level: number]: number });

    return {
      totalNodes: mindMapNodes.length,
      levels: Object.keys(levels).length,
      nodesByLevel: levels,
      hasRoot: mindMapNodes.some(node => (node.data as MindMapNodeData).isRoot)
    };
  }, [nodes]);

  return {
    arrangeRadialLayout,
    addChildNode,
    createInitialMindMap,
    convertToMindMap,
    mindMapStats
  };
};