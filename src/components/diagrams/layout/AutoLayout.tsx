// ============================================================================
// Auto Layout - Sistema de layout automático unificado
// ============================================================================
// Algoritmos de layout automático para diferentes tipos de diagramas
// ============================================================================

import { Node, Edge, Position } from 'reactflow';
import { DiagramType } from '../../../types/unified-diagram';

// ============================================================================
// INTERFACES
// ============================================================================

interface LayoutOptions {
  direction?: 'TB' | 'BT' | 'LR' | 'RL';
  spacing?: {
    node?: number;
    rank?: number;
  };
  alignment?: 'start' | 'center' | 'end';
  animate?: boolean;
}

interface LayoutResult {
  nodes: Node[];
  edges: Edge[];
}

interface Point {
  x: number;
  y: number;
}

interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_NODE_SIZE = {
  width: 150,
  height: 50
};

const DEFAULT_SPACING = {
  node: 50,
  rank: 100
};

const LAYOUT_CONFIGS = {
  bpmn: {
    direction: 'LR' as const,
    spacing: { node: 80, rank: 120 },
    alignment: 'center' as const
  },
  mindmap: {
    direction: 'TB' as const,
    spacing: { node: 60, rank: 100 },
    alignment: 'center' as const
  },
  organogram: {
    direction: 'TB' as const,
    spacing: { node: 100, rank: 150 },
    alignment: 'center' as const
  }
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const getNodeSize = (node: Node): { width: number; height: number } => {
  return {
    width: node.data?.width || DEFAULT_NODE_SIZE.width,
    height: node.data?.height || DEFAULT_NODE_SIZE.height
  };
};

const calculateBounds = (nodes: Node[]): Bounds => {
  if (nodes.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  nodes.forEach(node => {
    const size = getNodeSize(node);
    const x = node.position.x;
    const y = node.position.y;

    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x + size.width);
    maxY = Math.max(maxY, y + size.height);
  });

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  };
};

const centerLayout = (nodes: Node[], containerWidth = 800, containerHeight = 600): Node[] => {
  const bounds = calculateBounds(nodes);
  const offsetX = (containerWidth - bounds.width) / 2 - bounds.x;
  const offsetY = (containerHeight - bounds.height) / 2 - bounds.y;

  return nodes.map(node => ({
    ...node,
    position: {
      x: node.position.x + offsetX,
      y: node.position.y + offsetY
    }
  }));
};

// ============================================================================
// LAYOUT ALGORITHMS
// ============================================================================

/**
 * Layout hierárquico usando algoritmo de Sugiyama simplificado
 */
const hierarchicalLayout = (
  nodes: Node[],
  edges: Edge[],
  options: LayoutOptions
): LayoutResult => {
  const { direction = 'TB', spacing = DEFAULT_SPACING } = options;
  
  // Construir grafo de adjacência
  const adjacencyList = new Map<string, string[]>();
  const inDegree = new Map<string, number>();
  
  nodes.forEach(node => {
    adjacencyList.set(node.id, []);
    inDegree.set(node.id, 0);
  });
  
  edges.forEach(edge => {
    const source = edge.source;
    const target = edge.target;
    
    adjacencyList.get(source)?.push(target);
    inDegree.set(target, (inDegree.get(target) || 0) + 1);
  });
  
  // Ordenação topológica para determinar níveis
  const levels: string[][] = [];
  const queue: string[] = [];
  const nodeLevel = new Map<string, number>();
  
  // Encontrar nós raiz (grau de entrada = 0)
  nodes.forEach(node => {
    if (inDegree.get(node.id) === 0) {
      queue.push(node.id);
      nodeLevel.set(node.id, 0);
    }
  });
  
  // Se não há nós raiz, começar com o primeiro nó
  if (queue.length === 0 && nodes.length > 0) {
    queue.push(nodes[0].id);
    nodeLevel.set(nodes[0].id, 0);
  }
  
  while (queue.length > 0) {
    const currentLevel: string[] = [];
    const nextQueue: string[] = [];
    
    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      currentLevel.push(nodeId);
      
      adjacencyList.get(nodeId)?.forEach(neighbor => {
        const newDegree = (inDegree.get(neighbor) || 0) - 1;
        inDegree.set(neighbor, newDegree);
        
        if (newDegree === 0) {
          const currentNodeLevel = nodeLevel.get(nodeId) || 0;
          const existingLevel = nodeLevel.get(neighbor);
          
          if (existingLevel === undefined || existingLevel < currentNodeLevel + 1) {
            nodeLevel.set(neighbor, currentNodeLevel + 1);
            nextQueue.push(neighbor);
          }
        }
      });
    }
    
    if (currentLevel.length > 0) {
      levels.push(currentLevel);
    }
    
    queue.push(...nextQueue);
  }
  
  // Adicionar nós não conectados
  const processedNodes = new Set(levels.flat());
  const unconnectedNodes = nodes.filter(node => !processedNodes.has(node.id));
  
  if (unconnectedNodes.length > 0) {
    levels.push(unconnectedNodes.map(node => node.id));
  }
  
  // Calcular posições
  const layoutNodes = nodes.map(node => {
    const level = nodeLevel.get(node.id) || levels.length - 1;
    const levelNodes = levels[level] || [];
    const indexInLevel = levelNodes.indexOf(node.id);
    const size = getNodeSize(node);
    
    let x: number, y: number;
    
    if (direction === 'TB' || direction === 'BT') {
      // Layout vertical
      y = level * (size.height + spacing.rank);
      x = indexInLevel * (size.width + spacing.node);
      
      // Centralizar nível
      const levelWidth = levelNodes.length * size.width + (levelNodes.length - 1) * spacing.node;
      x -= levelWidth / 2 - size.width / 2;
      
      if (direction === 'BT') {
        y = (levels.length - 1 - level) * (size.height + spacing.rank);
      }
    } else {
      // Layout horizontal
      x = level * (size.width + spacing.rank);
      y = indexInLevel * (size.height + spacing.node);
      
      // Centralizar nível
      const levelHeight = levelNodes.length * size.height + (levelNodes.length - 1) * spacing.node;
      y -= levelHeight / 2 - size.height / 2;
      
      if (direction === 'RL') {
        x = (levels.length - 1 - level) * (size.width + spacing.rank);
      }
    }
    
    return {
      ...node,
      position: { x, y }
    };
  });
  
  return {
    nodes: centerLayout(layoutNodes),
    edges
  };
};

/**
 * Layout radial para mapas mentais
 */
const radialLayout = (
  nodes: Node[],
  edges: Edge[],
  options: LayoutOptions
): LayoutResult => {
  const { spacing = DEFAULT_SPACING } = options;
  
  if (nodes.length === 0) {
    return { nodes, edges };
  }
  
  // Encontrar nó central (maior número de conexões ou primeiro nó)
  const connectionCount = new Map<string, number>();
  
  edges.forEach(edge => {
    connectionCount.set(edge.source, (connectionCount.get(edge.source) || 0) + 1);
    connectionCount.set(edge.target, (connectionCount.get(edge.target) || 0) + 1);
  });
  
  const centralNode = nodes.reduce((max, node) => {
    const count = connectionCount.get(node.id) || 0;
    const maxCount = connectionCount.get(max.id) || 0;
    return count > maxCount ? node : max;
  });
  
  // Construir árvore a partir do nó central
  const visited = new Set<string>();
  const levels = new Map<string, number>();
  const children = new Map<string, string[]>();
  
  const buildTree = (nodeId: string, level: number) => {
    if (visited.has(nodeId)) return;
    
    visited.add(nodeId);
    levels.set(nodeId, level);
    
    const nodeChildren: string[] = [];
    
    edges.forEach(edge => {
      if (edge.source === nodeId && !visited.has(edge.target)) {
        nodeChildren.push(edge.target);
        buildTree(edge.target, level + 1);
      } else if (edge.target === nodeId && !visited.has(edge.source)) {
        nodeChildren.push(edge.source);
        buildTree(edge.source, level + 1);
      }
    });
    
    children.set(nodeId, nodeChildren);
  };
  
  buildTree(centralNode.id, 0);
  
  // Posicionar nós
  const layoutNodes = nodes.map(node => {
    const level = levels.get(node.id) || 0;
    const size = getNodeSize(node);
    
    if (level === 0) {
      // Nó central
      return {
        ...node,
        position: { x: 0, y: 0 }
      };
    }
    
    // Calcular posição radial
    const radius = level * (spacing.rank + size.width);
    const siblingsAtLevel = Array.from(levels.entries())
      .filter(([_, l]) => l === level)
      .map(([id]) => id);
    
    const angleStep = (2 * Math.PI) / Math.max(siblingsAtLevel.length, 1);
    const nodeIndex = siblingsAtLevel.indexOf(node.id);
    const angle = nodeIndex * angleStep;
    
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    
    return {
      ...node,
      position: { x, y }
    };
  });
  
  return {
    nodes: centerLayout(layoutNodes),
    edges
  };
};

/**
 * Layout em grade simples
 */
const gridLayout = (
  nodes: Node[],
  edges: Edge[],
  options: LayoutOptions
): LayoutResult => {
  const { spacing = DEFAULT_SPACING } = options;
  
  const cols = Math.ceil(Math.sqrt(nodes.length));
  
  const layoutNodes = nodes.map((node, index) => {
    const size = getNodeSize(node);
    const row = Math.floor(index / cols);
    const col = index % cols;
    
    const x = col * (size.width + spacing.node);
    const y = row * (size.height + spacing.rank);
    
    return {
      ...node,
      position: { x, y }
    };
  });
  
  return {
    nodes: centerLayout(layoutNodes),
    edges
  };
};

/**
 * Layout circular
 */
const circularLayout = (
  nodes: Node[],
  edges: Edge[],
  options: LayoutOptions
): LayoutResult => {
  const { spacing = DEFAULT_SPACING } = options;
  
  if (nodes.length === 0) {
    return { nodes, edges };
  }
  
  if (nodes.length === 1) {
    return {
      nodes: [{ ...nodes[0], position: { x: 0, y: 0 } }],
      edges
    };
  }
  
  const radius = Math.max(
    (nodes.length * spacing.node) / (2 * Math.PI),
    100
  );
  
  const layoutNodes = nodes.map((node, index) => {
    const angle = (2 * Math.PI * index) / nodes.length;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    
    return {
      ...node,
      position: { x, y }
    };
  });
  
  return {
    nodes: centerLayout(layoutNodes),
    edges
  };
};

// ============================================================================
// MAIN LAYOUT FUNCTION
// ============================================================================

export const applyAutoLayout = (
  nodes: Node[],
  edges: Edge[],
  diagramType: DiagramType,
  layoutType?: 'hierarchical' | 'radial' | 'grid' | 'circular',
  customOptions?: Partial<LayoutOptions>
): LayoutResult => {
  // Usar configuração padrão baseada no tipo de diagrama
  const defaultConfig = LAYOUT_CONFIGS[diagramType];
  const options: LayoutOptions = {
    ...defaultConfig,
    ...customOptions
  };
  
  // Determinar algoritmo de layout
  let algorithm: typeof hierarchicalLayout;
  
  if (layoutType) {
    switch (layoutType) {
      case 'hierarchical':
        algorithm = hierarchicalLayout;
        break;
      case 'radial':
        algorithm = radialLayout;
        break;
      case 'grid':
        algorithm = gridLayout;
        break;
      case 'circular':
        algorithm = circularLayout;
        break;
      default:
        algorithm = hierarchicalLayout;
    }
  } else {
    // Algoritmo padrão baseado no tipo de diagrama
    switch (diagramType) {
      case 'bpmn':
        algorithm = hierarchicalLayout;
        break;
      case 'mindmap':
        algorithm = radialLayout;
        break;
      case 'organogram':
        algorithm = hierarchicalLayout;
        break;
      default:
        algorithm = hierarchicalLayout;
    }
  }
  
  return algorithm(nodes, edges, options);
};

// ============================================================================
// LAYOUT UTILITIES
// ============================================================================

export const alignNodes = (
  nodes: Node[],
  alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom'
): Node[] => {
  if (nodes.length === 0) return nodes;
  
  const bounds = calculateBounds(nodes);
  
  return nodes.map(node => {
    const size = getNodeSize(node);
    let newPosition = { ...node.position };
    
    switch (alignment) {
      case 'left':
        newPosition.x = bounds.x;
        break;
      case 'center':
        newPosition.x = bounds.x + (bounds.width - size.width) / 2;
        break;
      case 'right':
        newPosition.x = bounds.x + bounds.width - size.width;
        break;
      case 'top':
        newPosition.y = bounds.y;
        break;
      case 'middle':
        newPosition.y = bounds.y + (bounds.height - size.height) / 2;
        break;
      case 'bottom':
        newPosition.y = bounds.y + bounds.height - size.height;
        break;
    }
    
    return {
      ...node,
      position: newPosition
    };
  });
};

export const distributeNodes = (
  nodes: Node[],
  direction: 'horizontal' | 'vertical',
  spacing?: number
): Node[] => {
  if (nodes.length < 2) return nodes;
  
  const sortedNodes = [...nodes].sort((a, b) => {
    return direction === 'horizontal'
      ? a.position.x - b.position.x
      : a.position.y - b.position.y;
  });
  
  const bounds = calculateBounds(sortedNodes);
  const totalSize = direction === 'horizontal' ? bounds.width : bounds.height;
  const nodeSpacing = spacing || DEFAULT_SPACING.node;
  
  let currentPosition = direction === 'horizontal' ? bounds.x : bounds.y;
  
  return sortedNodes.map(node => {
    const size = getNodeSize(node);
    const newPosition = { ...node.position };
    
    if (direction === 'horizontal') {
      newPosition.x = currentPosition;
      currentPosition += size.width + nodeSpacing;
    } else {
      newPosition.y = currentPosition;
      currentPosition += size.height + nodeSpacing;
    }
    
    return {
      ...node,
      position: newPosition
    };
  });
};

export const fitToView = (
  nodes: Node[],
  viewportWidth: number,
  viewportHeight: number,
  padding = 50
): { nodes: Node[]; zoom: number; center: Point } => {
  if (nodes.length === 0) {
    return {
      nodes,
      zoom: 1,
      center: { x: viewportWidth / 2, y: viewportHeight / 2 }
    };
  }
  
  const bounds = calculateBounds(nodes);
  const availableWidth = viewportWidth - 2 * padding;
  const availableHeight = viewportHeight - 2 * padding;
  
  const scaleX = availableWidth / bounds.width;
  const scaleY = availableHeight / bounds.height;
  const zoom = Math.min(scaleX, scaleY, 1); // Não fazer zoom in além de 100%
  
  const scaledWidth = bounds.width * zoom;
  const scaledHeight = bounds.height * zoom;
  
  const centerX = (viewportWidth - scaledWidth) / 2;
  const centerY = (viewportHeight - scaledHeight) / 2;
  
  const offsetX = centerX - bounds.x * zoom;
  const offsetY = centerY - bounds.y * zoom;
  
  const centeredNodes = nodes.map(node => ({
    ...node,
    position: {
      x: node.position.x * zoom + offsetX / zoom,
      y: node.position.y * zoom + offsetY / zoom
    }
  }));
  
  return {
    nodes: centeredNodes,
    zoom,
    center: {
      x: viewportWidth / 2,
      y: viewportHeight / 2
    }
  };
};

export default {
  applyAutoLayout,
  alignNodes,
  distributeNodes,
  fitToView
};