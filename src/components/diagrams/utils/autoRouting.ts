// ============================================================================
// Auto-Routing System - Sistema de roteamento automático para conexões
// ============================================================================

import { Node, Edge, XYPosition } from 'reactflow';
import { DIAGRAM_CONSTANTS } from './index';
import { secureLogger } from '@/utils/secureLogger';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

export interface PathPoint {
  x: number;
  y: number;
}

export interface PathSegment {
  start: PathPoint;
  end: PathPoint;
  type: 'horizontal' | 'vertical' | 'diagonal';
}

export interface RoutingOptions {
  avoidNodes: boolean;
  preferOrthogonal: boolean;
  smoothCurves: boolean;
  minDistance: number;
  gridSize: number;
  cornerRadius: number;
}

export interface NodeBounds {
  x: number;
  y: number;
  width: number;
  height: number;
  padding: number;
}

export interface RoutingResult {
  path: PathPoint[];
  pathString: string;
  segments: PathSegment[];
  totalLength: number;
  hasObstacles: boolean;
}

// ============================================================================
// CONSTANTES
// ============================================================================

const DEFAULT_ROUTING_OPTIONS: RoutingOptions = {
  avoidNodes: true,
  preferOrthogonal: true,
  smoothCurves: true,
  minDistance: 20,
  gridSize: DIAGRAM_CONSTANTS.SNAP_GRID,
  cornerRadius: 8
};

const PATHFINDING_CONSTANTS = {
  MAX_ITERATIONS: 1000,
  HEURISTIC_WEIGHT: 1.2,
  DIAGONAL_COST: 1.414, // sqrt(2)
  STRAIGHT_COST: 1.0,
  OBSTACLE_PENALTY: 10,
  GRID_RESOLUTION: 10
};

// ============================================================================
// ALGORITMO A* PARA PATHFINDING
// ============================================================================

class AStarNode {
  constructor(
    public x: number,
    public y: number,
    public g: number = 0, // Custo do início até este nó
    public h: number = 0, // Heurística (estimativa até o destino)
    public parent: AStarNode | null = null
  ) {}

  get f(): number {
    return this.g + this.h;
  }

  get key(): string {
    return `${this.x},${this.y}`;
  }

  equals(other: AStarNode): boolean {
    return this.x === other.x && this.y === other.y;
  }
}

/**
 * Calcula distância Manhattan entre dois pontos
 */
function manhattanDistance(a: PathPoint, b: PathPoint): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

/**
 * Calcula distância Euclidiana entre dois pontos
 */
function euclideanDistance(a: PathPoint, b: PathPoint): number {
  return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
}

/**
 * Verifica se um ponto está dentro de um obstáculo
 */
function isPointInObstacle(point: PathPoint, obstacles: NodeBounds[]): boolean {
  return obstacles.some(obstacle => {
    return (
      point.x >= obstacle.x - obstacle.padding &&
      point.x <= obstacle.x + obstacle.width + obstacle.padding &&
      point.y >= obstacle.y - obstacle.padding &&
      point.y <= obstacle.y + obstacle.height + obstacle.padding
    );
  });
}

/**
 * Obtém vizinhos válidos de um nó no grid
 */
function getNeighbors(
  node: AStarNode,
  obstacles: NodeBounds[],
  gridSize: number,
  bounds: { minX: number; maxX: number; minY: number; maxY: number }
): AStarNode[] {
  const neighbors: AStarNode[] = [];
  const directions = [
    { x: 0, y: -gridSize }, // Norte
    { x: gridSize, y: 0 },  // Leste
    { x: 0, y: gridSize },  // Sul
    { x: -gridSize, y: 0 }, // Oeste
    { x: gridSize, y: -gridSize }, // Nordeste
    { x: gridSize, y: gridSize },  // Sudeste
    { x: -gridSize, y: gridSize }, // Sudoeste
    { x: -gridSize, y: -gridSize } // Noroeste
  ];

  for (const dir of directions) {
    const newX = node.x + dir.x;
    const newY = node.y + dir.y;

    // Verifica limites
    if (newX < bounds.minX || newX > bounds.maxX || newY < bounds.minY || newY > bounds.maxY) {
      continue;
    }

    const newPoint = { x: newX, y: newY };
    
    // Verifica obstáculos
    if (!isPointInObstacle(newPoint, obstacles)) {
      const cost = (dir.x !== 0 && dir.y !== 0) ? PATHFINDING_CONSTANTS.DIAGONAL_COST : PATHFINDING_CONSTANTS.STRAIGHT_COST;
      neighbors.push(new AStarNode(newX, newY, node.g + cost));
    }
  }

  return neighbors;
}

/**
 * Implementação do algoritmo A* para pathfinding
 */
function findPathAStar(
  start: PathPoint,
  end: PathPoint,
  obstacles: NodeBounds[],
  options: RoutingOptions
): PathPoint[] {
  const gridSize = options.gridSize;
  
  // Ajusta pontos para o grid
  const startGrid = {
    x: Math.round(start.x / gridSize) * gridSize,
    y: Math.round(start.y / gridSize) * gridSize
  };
  
  const endGrid = {
    x: Math.round(end.x / gridSize) * gridSize,
    y: Math.round(end.y / gridSize) * gridSize
  };

  // Calcula limites do grid
  const allPoints = [start, end, ...obstacles.flatMap(o => [
    { x: o.x, y: o.y },
    { x: o.x + o.width, y: o.y + o.height }
  ])];
  
  const bounds = {
    minX: Math.min(...allPoints.map(p => p.x)) - 200,
    maxX: Math.max(...allPoints.map(p => p.x)) + 200,
    minY: Math.min(...allPoints.map(p => p.y)) - 200,
    maxY: Math.max(...allPoints.map(p => p.y)) + 200
  };

  const openSet = new Map<string, AStarNode>();
  const closedSet = new Set<string>();
  
  const startNode = new AStarNode(
    startGrid.x,
    startGrid.y,
    0,
    manhattanDistance(startGrid, endGrid) * PATHFINDING_CONSTANTS.HEURISTIC_WEIGHT
  );
  
  openSet.set(startNode.key, startNode);
  
  let iterations = 0;
  
  while (openSet.size > 0 && iterations < PATHFINDING_CONSTANTS.MAX_ITERATIONS) {
    iterations++;
    
    // Encontra nó com menor f
    let current = Array.from(openSet.values()).reduce((min, node) => 
      node.f < min.f ? node : min
    );
    
    // Chegou ao destino
    if (Math.abs(current.x - endGrid.x) < gridSize && Math.abs(current.y - endGrid.y) < gridSize) {
      const path: PathPoint[] = [];
      let node: AStarNode | null = current;
      
      while (node) {
        path.unshift({ x: node.x, y: node.y });
        node = node.parent;
      }
      
      // Adiciona pontos originais
      if (path.length > 0) {
        path[0] = start;
        path[path.length - 1] = end;
      }
      
      secureLogger.info('Caminho encontrado com A*', { 
        iterations, 
        pathLength: path.length,
        totalDistance: euclideanDistance(start, end)
      });
      
      return path;
    }
    
    openSet.delete(current.key);
    closedSet.add(current.key);
    
    // Explora vizinhos
    const neighbors = getNeighbors(current, obstacles, gridSize, bounds);
    
    for (const neighbor of neighbors) {
      if (closedSet.has(neighbor.key)) continue;
      
      neighbor.parent = current;
      neighbor.h = manhattanDistance({ x: neighbor.x, y: neighbor.y }, endGrid) * PATHFINDING_CONSTANTS.HEURISTIC_WEIGHT;
      
      const existingNode = openSet.get(neighbor.key);
      if (!existingNode || neighbor.g < existingNode.g) {
        openSet.set(neighbor.key, neighbor);
      }
    }
  }
  
  secureLogger.warn('Caminho A* não encontrado, usando linha reta', { iterations });
  return [start, end]; // Fallback para linha reta
}

// ============================================================================
// SUAVIZAÇÃO DE CAMINHOS
// ============================================================================

/**
 * Suaviza um caminho usando curvas Bézier
 */
function smoothPath(path: PathPoint[], cornerRadius: number): PathPoint[] {
  if (path.length < 3) return path;
  
  const smoothed: PathPoint[] = [path[0]];
  
  for (let i = 1; i < path.length - 1; i++) {
    const prev = path[i - 1];
    const current = path[i];
    const next = path[i + 1];
    
    // Calcula vetores
    const v1 = { x: current.x - prev.x, y: current.y - prev.y };
    const v2 = { x: next.x - current.x, y: next.y - current.y };
    
    // Normaliza vetores
    const len1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
    const len2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
    
    if (len1 > 0 && len2 > 0) {
      v1.x /= len1; v1.y /= len1;
      v2.x /= len2; v2.y /= len2;
      
      const radius = Math.min(cornerRadius, len1 / 2, len2 / 2);
      
      // Pontos de controle para a curva
      const cp1 = {
        x: current.x - v1.x * radius,
        y: current.y - v1.y * radius
      };
      
      const cp2 = {
        x: current.x + v2.x * radius,
        y: current.y + v2.y * radius
      };
      
      smoothed.push(cp1, current, cp2);
    } else {
      smoothed.push(current);
    }
  }
  
  smoothed.push(path[path.length - 1]);
  return smoothed;
}

/**
 * Simplifica um caminho removendo pontos redundantes
 */
function simplifyPath(path: PathPoint[], tolerance: number = 2): PathPoint[] {
  if (path.length < 3) return path;
  
  const simplified: PathPoint[] = [path[0]];
  
  for (let i = 1; i < path.length - 1; i++) {
    const prev = simplified[simplified.length - 1];
    const current = path[i];
    const next = path[i + 1];
    
    // Calcula distância do ponto atual à linha entre prev e next
    const A = next.y - prev.y;
    const B = prev.x - next.x;
    const C = next.x * prev.y - prev.x * next.y;
    
    const distance = Math.abs(A * current.x + B * current.y + C) / Math.sqrt(A * A + B * B);
    
    if (distance > tolerance) {
      simplified.push(current);
    }
  }
  
  simplified.push(path[path.length - 1]);
  return simplified;
}

// ============================================================================
// FUNÇÕES PRINCIPAIS
// ============================================================================

/**
 * Converte nós em obstáculos para pathfinding
 */
export function nodesToObstacles(nodes: Node[], excludeIds: string[] = []): NodeBounds[] {
  return nodes
    .filter(node => !excludeIds.includes(node.id))
    .map(node => ({
      x: node.position.x,
      y: node.position.y,
      width: node.width || DIAGRAM_CONSTANTS.DEFAULT_NODE_WIDTH,
      height: node.height || DIAGRAM_CONSTANTS.DEFAULT_NODE_HEIGHT,
      padding: 20 // Espaço extra ao redor do nó
    }));
}

/**
 * Calcula pontos de conexão otimizados para um nó
 */
export function getNodeConnectionPoints(node: Node): PathPoint[] {
  const width = node.width || DIAGRAM_CONSTANTS.DEFAULT_NODE_WIDTH;
  const height = node.height || DIAGRAM_CONSTANTS.DEFAULT_NODE_HEIGHT;
  const { x, y } = node.position;
  
  return [
    { x: x + width / 2, y }, // Topo
    { x: x + width, y: y + height / 2 }, // Direita
    { x: x + width / 2, y: y + height }, // Baixo
    { x, y: y + height / 2 } // Esquerda
  ];
}

/**
 * Encontra o melhor ponto de conexão entre dois nós
 */
export function findBestConnectionPoints(
  sourceNode: Node,
  targetNode: Node
): { source: PathPoint; target: PathPoint } {
  const sourcePoints = getNodeConnectionPoints(sourceNode);
  const targetPoints = getNodeConnectionPoints(targetNode);
  
  let bestDistance = Infinity;
  let bestSource = sourcePoints[0];
  let bestTarget = targetPoints[0];
  
  for (const sourcePoint of sourcePoints) {
    for (const targetPoint of targetPoints) {
      const distance = euclideanDistance(sourcePoint, targetPoint);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestSource = sourcePoint;
        bestTarget = targetPoint;
      }
    }
  }
  
  return { source: bestSource, target: bestTarget };
}

/**
 * Gera caminho automático entre dois pontos
 */
export function generateAutoRoute(
  start: PathPoint,
  end: PathPoint,
  obstacles: NodeBounds[],
  options: Partial<RoutingOptions> = {}
): RoutingResult {
  const opts = { ...DEFAULT_ROUTING_OPTIONS, ...options };
  
  let path: PathPoint[];
  
  if (opts.avoidNodes && obstacles.length > 0) {
    // Usa A* para evitar obstáculos
    path = findPathAStar(start, end, obstacles, opts);
  } else {
    // Linha reta simples
    path = [start, end];
  }
  
  // Simplifica o caminho
  path = simplifyPath(path);
  
  // Suaviza se solicitado
  if (opts.smoothCurves && path.length > 2) {
    path = smoothPath(path, opts.cornerRadius);
  }
  
  // Calcula segmentos
  const segments: PathSegment[] = [];
  for (let i = 0; i < path.length - 1; i++) {
    const start = path[i];
    const end = path[i + 1];
    
    let type: 'horizontal' | 'vertical' | 'diagonal';
    if (Math.abs(start.x - end.x) < 1) {
      type = 'vertical';
    } else if (Math.abs(start.y - end.y) < 1) {
      type = 'horizontal';
    } else {
      type = 'diagonal';
    }
    
    segments.push({ start, end, type });
  }
  
  // Gera string do caminho SVG
  const pathString = generateSVGPath(path, opts);
  
  // Calcula comprimento total
  const totalLength = segments.reduce((sum, segment) => 
    sum + euclideanDistance(segment.start, segment.end), 0
  );
  
  return {
    path,
    pathString,
    segments,
    totalLength,
    hasObstacles: obstacles.length > 0
  };
}

/**
 * Gera string SVG para o caminho
 */
function generateSVGPath(path: PathPoint[], options: RoutingOptions): string {
  if (path.length < 2) return '';
  
  let pathString = `M ${path[0].x} ${path[0].y}`;
  
  if (options.smoothCurves && path.length > 2) {
    // Usa curvas suaves
    for (let i = 1; i < path.length; i++) {
      const point = path[i];
      if (i === path.length - 1) {
        pathString += ` L ${point.x} ${point.y}`;
      } else {
        const nextPoint = path[i + 1];
        const controlX = (point.x + nextPoint.x) / 2;
        const controlY = (point.y + nextPoint.y) / 2;
        pathString += ` Q ${point.x} ${point.y} ${controlX} ${controlY}`;
      }
    }
  } else {
    // Linhas retas
    for (let i = 1; i < path.length; i++) {
      pathString += ` L ${path[i].x} ${path[i].y}`;
    }
  }
  
  return pathString;
}

/**
 * Gera rota automática entre dois nós
 */
export function generateNodeAutoRoute(
  sourceNode: Node,
  targetNode: Node,
  allNodes: Node[],
  options: Partial<RoutingOptions> = {}
): RoutingResult {
  // Encontra melhores pontos de conexão
  const { source, target } = findBestConnectionPoints(sourceNode, targetNode);
  
  // Converte outros nós em obstáculos
  const obstacles = nodesToObstacles(allNodes, [sourceNode.id, targetNode.id]);
  
  // Gera rota
  return generateAutoRoute(source, target, obstacles, options);
}

// ============================================================================
// UTILITÁRIOS DE VALIDAÇÃO
// ============================================================================

/**
 * Valida se uma conexão é possível
 */
export function validateConnection(
  sourceNode: Node,
  targetNode: Node,
  allNodes: Node[]
): { isValid: boolean; reason?: string } {
  // Não pode conectar nó a si mesmo
  if (sourceNode.id === targetNode.id) {
    return { isValid: false, reason: 'Não é possível conectar um nó a si mesmo' };
  }
  
  // Verifica se já existe conexão
  // Esta validação seria feita no componente pai com as edges
  
  return { isValid: true };
}

/**
 * Otimiza todas as conexões de um diagrama
 */
export function optimizeAllConnections(
  nodes: Node[],
  edges: Edge[],
  options: Partial<RoutingOptions> = {}
): Edge[] {
  const obstacles = nodesToObstacles(nodes);
  
  return edges.map(edge => {
    const sourceNode = nodes.find(n => n.id === edge.source);
    const targetNode = nodes.find(n => n.id === edge.target);
    
    if (!sourceNode || !targetNode) return edge;
    
    const routing = generateNodeAutoRoute(sourceNode, targetNode, nodes, options);
    
    return {
      ...edge,
      data: {
        ...edge.data,
        pathString: routing.pathString,
        autoRouted: true,
        routingInfo: {
          totalLength: routing.totalLength,
          hasObstacles: routing.hasObstacles,
          segments: routing.segments.length
        }
      }
    };
  });
}