// ============================================================================
// Diagram Utils - Utilitários para o sistema de diagramas
// ============================================================================

import { Node, Edge, Position, XYPosition } from 'reactflow';
import { DiagramType, NodeData, EdgeData, DiagramNodeData, MindMapNodeData } from '../types';
import { secureLogger } from '@/utils/secureLogger';

// ============================================================================
// Constantes
// ============================================================================

export const DIAGRAM_CONSTANTS = {
  // Dimensões padrão
  DEFAULT_NODE_WIDTH: 150,
  DEFAULT_NODE_HEIGHT: 80,
  
  // Espaçamentos
  GRID_SIZE: 20,
  SNAP_GRID: 15,
  
  // Layout
  LAYOUT_SPACING: {
    horizontal: 200,
    vertical: 150
  },
  
  // Zoom
  MIN_ZOOM: 0.1,
  MAX_ZOOM: 4,
  DEFAULT_ZOOM: 1,
  
  // Cores padrão
  DEFAULT_COLORS: {
    flowchart: '#3b82f6',
    mindmap: '#8b5cf6',
    organogram: '#10b981'
  },
  
  // Tipos de conexão
  CONNECTION_TYPES: {
    straight: 'straight',
    smoothstep: 'smoothstep',
    step: 'step',
    bezier: 'default'
  }
};

// ============================================================================
// Utilitários de Posicionamento
// ============================================================================

/**
 * Calcula a posição central de um conjunto de nós
 */
export const calculateCenterPosition = (nodes: Node[]): XYPosition => {
  if (nodes.length === 0) return { x: 0, y: 0 };
  
  const bounds = nodes.reduce(
    (acc, node) => {
      const x = node.position.x;
      const y = node.position.y;
      const width = node.width || DIAGRAM_CONSTANTS.DEFAULT_NODE_WIDTH;
      const height = node.height || DIAGRAM_CONSTANTS.DEFAULT_NODE_HEIGHT;
      
      return {
        minX: Math.min(acc.minX, x),
        maxX: Math.max(acc.maxX, x + width),
        minY: Math.min(acc.minY, y),
        maxY: Math.max(acc.maxY, y + height)
      };
    },
    { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity }
  );
  
  return {
    x: (bounds.minX + bounds.maxX) / 2,
    y: (bounds.minY + bounds.maxY) / 2
  };
};

/**
 * Ajusta posição para a grade
 */
export const snapToGrid = (position: XYPosition, gridSize = DIAGRAM_CONSTANTS.SNAP_GRID): XYPosition => {
  return {
    x: Math.round(position.x / gridSize) * gridSize,
    y: Math.round(position.y / gridSize) * gridSize
  };
};

/**
 * Calcula posição livre próxima a uma posição de referência
 */
export const findFreePosition = (
  referencePosition: XYPosition,
  existingNodes: Node[],
  nodeWidth = DIAGRAM_CONSTANTS.DEFAULT_NODE_WIDTH,
  nodeHeight = DIAGRAM_CONSTANTS.DEFAULT_NODE_HEIGHT
): XYPosition => {
  const spacing = 50;
  const maxAttempts = 100;
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const angle = (attempt * 45) % 360; // Tenta em diferentes ângulos
    const distance = Math.floor(attempt / 8) * spacing + spacing;
    
    const x = referencePosition.x + Math.cos(angle * Math.PI / 180) * distance;
    const y = referencePosition.y + Math.sin(angle * Math.PI / 180) * distance;
    
    const newPosition = snapToGrid({ x, y });
    
    // Verifica se a posição está livre
    const isOccupied = existingNodes.some(node => {
      const nodeX = node.position.x;
      const nodeY = node.position.y;
      const nodeW = node.width || DIAGRAM_CONSTANTS.DEFAULT_NODE_WIDTH;
      const nodeH = node.height || DIAGRAM_CONSTANTS.DEFAULT_NODE_HEIGHT;
      
      return (
        newPosition.x < nodeX + nodeW + spacing &&
        newPosition.x + nodeWidth + spacing > nodeX &&
        newPosition.y < nodeY + nodeH + spacing &&
        newPosition.y + nodeHeight + spacing > nodeY
      );
    });
    
    if (!isOccupied) {
      return newPosition;
    }
  }
  
  // Se não encontrar posição livre, retorna uma posição aleatória
  return snapToGrid({
    x: referencePosition.x + Math.random() * 400 - 200,
    y: referencePosition.y + Math.random() * 400 - 200
  });
};

// ============================================================================
// Utilitários de Layout Automático
// ============================================================================

/**
 * Aplica layout hierárquico (top-down)
 */
export const applyHierarchicalLayout = (nodes: Node[], edges: Edge[]): Node[] => {
  const nodeMap = new Map(nodes.map(node => [node.id, node]));
  const levels = new Map<string, number>();
  const children = new Map<string, string[]>();
  const parents = new Map<string, string>();
  
  // Constrói grafo de dependências
  edges.forEach(edge => {
    const parentId = edge.source;
    const childId = edge.target;
    
    if (!children.has(parentId)) children.set(parentId, []);
    children.get(parentId)!.push(childId);
    parents.set(childId, parentId);
  });
  
  // Encontra nós raiz (sem pais)
  const rootNodes = nodes.filter(node => !parents.has(node.id));
  
  // Calcula níveis
  const calculateLevel = (nodeId: string, level = 0): void => {
    if (levels.has(nodeId)) return;
    levels.set(nodeId, level);
    
    const nodeChildren = children.get(nodeId) || [];
    nodeChildren.forEach(childId => calculateLevel(childId, level + 1));
  };
  
  rootNodes.forEach(node => calculateLevel(node.id));
  
  // Agrupa nós por nível
  const nodesByLevel = new Map<number, Node[]>();
  nodes.forEach(node => {
    const level = levels.get(node.id) || 0;
    if (!nodesByLevel.has(level)) nodesByLevel.set(level, []);
    nodesByLevel.get(level)!.push(node);
  });
  
  // Posiciona nós
  const updatedNodes: Node[] = [];
  const { horizontal, vertical } = DIAGRAM_CONSTANTS.LAYOUT_SPACING;
  
  Array.from(nodesByLevel.entries())
    .sort(([a], [b]) => a - b)
    .forEach(([level, levelNodes]) => {
      const y = level * vertical;
      const totalWidth = (levelNodes.length - 1) * horizontal;
      const startX = -totalWidth / 2;
      
      levelNodes.forEach((node, index) => {
        const x = startX + index * horizontal;
        updatedNodes.push({
          ...node,
          position: snapToGrid({ x, y })
        });
      });
    });
  
  secureLogger.info('Layout hierárquico aplicado', { 
    nodeCount: nodes.length, 
    levels: nodesByLevel.size 
  });
  
  return updatedNodes;
};

/**
 * Aplica layout circular
 */
export const applyCircularLayout = (nodes: Node[], centerPosition?: XYPosition): Node[] => {
  if (nodes.length === 0) return nodes;
  
  const center = centerPosition || { x: 0, y: 0 };
  const radius = Math.max(200, nodes.length * 30);
  const angleStep = (2 * Math.PI) / nodes.length;
  
  return nodes.map((node, index) => {
    const angle = index * angleStep;
    const x = center.x + Math.cos(angle) * radius;
    const y = center.y + Math.sin(angle) * radius;
    
    return {
      ...node,
      position: snapToGrid({ x, y })
    };
  });
};

/**
 * Aplica layout em grade
 */
export const applyGridLayout = (
  nodes: Node[], 
  columns?: number,
  startPosition: XYPosition = { x: 0, y: 0 }
): Node[] => {
  if (nodes.length === 0) return nodes;
  
  const cols = columns || Math.ceil(Math.sqrt(nodes.length));
  const { horizontal, vertical } = DIAGRAM_CONSTANTS.LAYOUT_SPACING;
  
  return nodes.map((node, index) => {
    const row = Math.floor(index / cols);
    const col = index % cols;
    
    const x = startPosition.x + col * horizontal;
    const y = startPosition.y + row * vertical;
    
    return {
      ...node,
      position: snapToGrid({ x, y })
    };
  });
};

// ============================================================================
// Utilitários de Alinhamento
// ============================================================================

/**
 * Alinha nós horizontalmente
 */
export const alignNodesHorizontally = (nodes: Node[], alignment: 'top' | 'center' | 'bottom' = 'center'): Node[] => {
  if (nodes.length < 2) return nodes;
  
  let referenceY: number;
  
  switch (alignment) {
    case 'top':
      referenceY = Math.min(...nodes.map(n => n.position.y));
      break;
    case 'bottom':
      referenceY = Math.max(...nodes.map(n => n.position.y + (n.height || DIAGRAM_CONSTANTS.DEFAULT_NODE_HEIGHT)));
      break;
    default: // center
      const avgY = nodes.reduce((sum, n) => sum + n.position.y + (n.height || DIAGRAM_CONSTANTS.DEFAULT_NODE_HEIGHT) / 2, 0) / nodes.length;
      referenceY = avgY;
  }
  
  return nodes.map(node => ({
    ...node,
    position: snapToGrid({
      x: node.position.x,
      y: alignment === 'center' 
        ? referenceY - (node.height || DIAGRAM_CONSTANTS.DEFAULT_NODE_HEIGHT) / 2
        : referenceY
    })
  }));
};

/**
 * Alinha nós verticalmente
 */
export const alignNodesVertically = (nodes: Node[], alignment: 'left' | 'center' | 'right' = 'center'): Node[] => {
  if (nodes.length < 2) return nodes;
  
  let referenceX: number;
  
  switch (alignment) {
    case 'left':
      referenceX = Math.min(...nodes.map(n => n.position.x));
      break;
    case 'right':
      referenceX = Math.max(...nodes.map(n => n.position.x + (n.width || DIAGRAM_CONSTANTS.DEFAULT_NODE_WIDTH)));
      break;
    default: // center
      const avgX = nodes.reduce((sum, n) => sum + n.position.x + (n.width || DIAGRAM_CONSTANTS.DEFAULT_NODE_WIDTH) / 2, 0) / nodes.length;
      referenceX = avgX;
  }
  
  return nodes.map(node => ({
    ...node,
    position: snapToGrid({
      x: alignment === 'center' 
        ? referenceX - (node.width || DIAGRAM_CONSTANTS.DEFAULT_NODE_WIDTH) / 2
        : referenceX,
      y: node.position.y
    })
  }));
};

/**
 * Distribui nós uniformemente
 */
export const distributeNodes = (nodes: Node[], direction: 'horizontal' | 'vertical' = 'horizontal'): Node[] => {
  if (nodes.length < 3) return nodes;
  
  const sortedNodes = [...nodes].sort((a, b) => 
    direction === 'horizontal' 
      ? a.position.x - b.position.x
      : a.position.y - b.position.y
  );
  
  const first = sortedNodes[0];
  const last = sortedNodes[sortedNodes.length - 1];
  
  const totalDistance = direction === 'horizontal'
    ? last.position.x - first.position.x
    : last.position.y - first.position.y;
    
  const step = totalDistance / (sortedNodes.length - 1);
  
  return sortedNodes.map((node, index) => {
    if (index === 0 || index === sortedNodes.length - 1) {
      return node; // Mantém primeiro e último no lugar
    }
    
    const newPosition = direction === 'horizontal'
      ? { x: first.position.x + step * index, y: node.position.y }
      : { x: node.position.x, y: first.position.y + step * index };
    
    return {
      ...node,
      position: snapToGrid(newPosition)
    };
  });
};

// ============================================================================
// Utilitários de Validação
// ============================================================================

/**
 * Valida estrutura de diagrama
 */
export const validateDiagram = (nodes: Node[], edges: Edge[], diagramType: DiagramType) => {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Validações gerais
  if (nodes.length === 0) {
    errors.push('Diagrama deve ter pelo menos um nó');
  }
  
  // Verifica nós órfãos (sem conexões)
  const connectedNodeIds = new Set([
    ...edges.map(e => e.source),
    ...edges.map(e => e.target)
  ]);
  
  const orphanNodes = nodes.filter(node => !connectedNodeIds.has(node.id));
  if (orphanNodes.length > 1) {
    warnings.push(`${orphanNodes.length} nós sem conexões encontrados`);
  }
  
  // Validações específicas por tipo
  switch (diagramType) {
    case 'flowchart':
      validateFlowchart(nodes, edges, errors, warnings);
      break;
    case 'mindmap':
      validateMindMap(nodes, edges, errors, warnings);
      break;
    case 'organogram':
      validateOrganogram(nodes, edges, errors, warnings);
      break;
  }
  
  return { errors, warnings, isValid: errors.length === 0 };
};

const validateFlowchart = (nodes: Node[], edges: Edge[], errors: string[], warnings: string[]) => {
  const startNodes = nodes.filter(n => n.type === 'flowchart-start');
  const endNodes = nodes.filter(n => n.type === 'flowchart-end');
  
  if (startNodes.length === 0) {
    warnings.push('Fluxograma deveria ter pelo menos um nó de início');
  }
  
  if (endNodes.length === 0) {
    warnings.push('Fluxograma deveria ter pelo menos um nó de fim');
  }
  
  if (startNodes.length > 1) {
    warnings.push('Múltiplos nós de início encontrados');
  }
};

const validateMindMap = (nodes: Node[], edges: Edge[], errors: string[], warnings: string[]) => {
  const rootNodes = nodes.filter(n => n.type === 'mindmap-root');
  
  if (rootNodes.length === 0) {
    errors.push('Mapa mental deve ter um nó raiz');
  }
  
  if (rootNodes.length > 1) {
    errors.push('Mapa mental deve ter apenas um nó raiz');
  }
};

const validateOrganogram = (nodes: Node[], edges: Edge[], errors: string[], warnings: string[]) => {
  const ceoNodes = nodes.filter(n => n.type === 'organogram-ceo');
  
  if (ceoNodes.length === 0) {
    warnings.push('Organograma deveria ter um CEO/Presidente');
  }
  
  if (ceoNodes.length > 1) {
    warnings.push('Múltiplos CEOs encontrados');
  }
};

// ============================================================================
// Utilitários de Exportação/Importação
// ============================================================================

/**
 * Converte diagrama para formato de exportação
 */
export const exportDiagram = (nodes: Node[], edges: Edge[], metadata: Record<string, unknown>) => {
  return {
    version: '1.0',
    timestamp: new Date().toISOString(),
    metadata,
    nodes: nodes.map(node => ({
      id: node.id,
      type: node.type,
      position: node.position,
      data: node.data,
      width: node.width,
      height: node.height
    })),
    edges: edges.map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: edge.type,
      data: edge.data,
      sourceHandle: edge.sourceHandle,
      targetHandle: edge.targetHandle
    }))
  };
};

/**
 * Importa diagrama de formato externo
 */
export const importDiagram = (data: { nodes: unknown[]; edges: unknown[]; metadata?: Record<string, unknown> }) => {
  try {
    const { nodes, edges, metadata } = data;
    
    // Validação básica
    if (!Array.isArray(nodes) || !Array.isArray(edges)) {
      throw new Error('Formato de arquivo inválido');
    }
    
    return {
      nodes: nodes.map((node: Record<string, unknown>) => ({
        id: node.id || `node-${Date.now()}-${Math.random()}`,
        type: node.type || 'default',
        position: node.position || { x: 0, y: 0 },
        data: node.data || {},
        width: node.width,
        height: node.height
      })),
      edges: edges.map((edge: Record<string, unknown>) => ({
        id: edge.id || `edge-${Date.now()}-${Math.random()}`,
        source: edge.source,
        target: edge.target,
        type: edge.type,
        data: edge.data || {},
        sourceHandle: edge.sourceHandle,
        targetHandle: edge.targetHandle
      })),
      metadata: metadata || {}
    };
  } catch (error) {
    secureLogger.error('Erro ao importar diagrama', { error });
    throw new Error('Falha ao importar diagrama: formato inválido');
  }
};

// ============================================================================
// Utilitários de Busca
// ============================================================================

/**
 * Busca nós por texto
 */
export const searchNodes = (nodes: Node[], searchTerm: string): Node[] => {
  if (!searchTerm.trim()) return nodes;
  
  const term = searchTerm.toLowerCase();
  
  return nodes.filter(node => {
    const data = node.data as NodeData;
    
    // Busca no label/name
    if (data.label?.toLowerCase().includes(term)) return true;
    if ('name' in data && typeof data.name === 'string' && data.name.toLowerCase().includes(term)) return true;
    
    // Busca na descrição
    if (data.description?.toLowerCase().includes(term)) return true;
    
    // Busca em tags (para mindmaps)
    const mindMapData = data as MindMapNodeData;
    if (mindMapData.tags?.some((tag: string) => tag.toLowerCase().includes(term))) return true;
    
    // Busca no tipo de nó
    if (node.type?.toLowerCase().includes(term)) return true;
    
    return false;
  });
};

/**
 * Obtém estatísticas do diagrama
 */
export const getDiagramStats = (nodes: Node[], edges: Edge[]) => {
  const nodeTypes = nodes.reduce((acc, node) => {
    acc[node.type || 'unknown'] = (acc[node.type || 'unknown'] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const edgeTypes = edges.reduce((acc, edge) => {
    acc[edge.type || 'default'] = (acc[edge.type || 'default'] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  return {
    totalNodes: nodes.length,
    totalEdges: edges.length,
    nodeTypes,
    edgeTypes,
    orphanNodes: nodes.filter(node => {
      const connectedNodeIds = new Set([
        ...edges.map(e => e.source),
        ...edges.map(e => e.target)
      ]);
      return !connectedNodeIds.has(node.id);
    }).length
  };
};