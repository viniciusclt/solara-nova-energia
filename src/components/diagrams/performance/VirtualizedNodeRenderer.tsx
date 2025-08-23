// ============================================================================
// Virtualized Node Renderer - Renderização virtualizada de nós
// ============================================================================
// Componente para otimizar a renderização de diagramas grandes usando
// técnicas de virtualização e viewport culling
// ============================================================================

import React, { useMemo, useCallback } from 'react';
import { Node, Edge, Viewport } from 'reactflow';
import { UnifiedNode, UnifiedEdge } from '../../../types/unified-diagram';

// ============================================================================
// INTERFACES
// ============================================================================

interface VirtualizedNodeRendererProps {
  nodes: UnifiedNode[];
  edges: UnifiedEdge[];
  viewport: Viewport;
  containerBounds: DOMRect;
  enableVirtualization: boolean;
  enableLevelOfDetail: boolean;
  performanceThreshold: number;
  onNodesFiltered?: (filteredNodes: UnifiedNode[]) => void;
  onEdgesFiltered?: (filteredEdges: UnifiedEdge[]) => void;
}

interface ViewportBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  padding: number;
}

interface NodeBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

// ============================================================================
// CONSTANTES
// ============================================================================

const DEFAULT_NODE_SIZE = { width: 150, height: 80 };
const VIEWPORT_PADDING = 200; // Padding extra para pre-loading
const LOD_ZOOM_THRESHOLD = 0.5; // Threshold para Level of Detail
const EDGE_CULLING_THRESHOLD = 0.3; // Threshold para culling de arestas

// ============================================================================
// FUNÇÕES UTILITÁRIAS
// ============================================================================

/**
 * Calcula os bounds do viewport com padding
 */
const calculateViewportBounds = (
  viewport: Viewport,
  containerBounds: DOMRect,
  padding: number = VIEWPORT_PADDING
): ViewportBounds => {
  const { x, y, zoom } = viewport;
  const { width, height } = containerBounds;
  
  // Converte coordenadas do viewport para coordenadas do mundo
  const worldWidth = width / zoom;
  const worldHeight = height / zoom;
  const worldX = -x / zoom;
  const worldY = -y / zoom;
  
  return {
    minX: worldX - padding,
    maxX: worldX + worldWidth + padding,
    minY: worldY - padding,
    maxY: worldY + worldHeight + padding,
    padding
  };
};

/**
 * Calcula os bounds de um nó
 */
const getNodeBounds = (node: UnifiedNode): NodeBounds => {
  const width = node.width || DEFAULT_NODE_SIZE.width;
  const height = node.height || DEFAULT_NODE_SIZE.height;
  
  return {
    x: node.position.x,
    y: node.position.y,
    width,
    height
  };
};

/**
 * Verifica se um nó está visível no viewport
 */
const isNodeVisible = (nodeBounds: NodeBounds, viewportBounds: ViewportBounds): boolean => {
  return !(
    nodeBounds.x + nodeBounds.width < viewportBounds.minX ||
    nodeBounds.x > viewportBounds.maxX ||
    nodeBounds.y + nodeBounds.height < viewportBounds.minY ||
    nodeBounds.y > viewportBounds.maxY
  );
};

/**
 * Verifica se uma aresta deve ser renderizada
 */
const shouldRenderEdge = (
  edge: UnifiedEdge,
  visibleNodeIds: Set<string>,
  zoom: number
): boolean => {
  // Se o zoom está muito baixo, não renderizar arestas
  if (zoom < EDGE_CULLING_THRESHOLD) {
    return false;
  }
  
  // Renderizar apenas se pelo menos um dos nós está visível
  return visibleNodeIds.has(edge.source) || visibleNodeIds.has(edge.target);
};

/**
 * Aplica Level of Detail baseado no zoom
 */
const applyLevelOfDetail = (
  node: UnifiedNode,
  zoom: number,
  enableLOD: boolean
): UnifiedNode => {
  if (!enableLOD || zoom >= LOD_ZOOM_THRESHOLD) {
    return node;
  }
  
  // Para zoom baixo, simplificar o nó
  return {
    ...node,
    data: {
      ...node.data,
      // Remover detalhes visuais complexos
      showDetails: false,
      simplified: true
    }
  };
};

/**
 * Calcula estatísticas de performance
 */
const calculatePerformanceStats = (
  totalNodes: number,
  visibleNodes: number,
  totalEdges: number,
  visibleEdges: number
) => {
  const nodeReduction = ((totalNodes - visibleNodes) / totalNodes) * 100;
  const edgeReduction = ((totalEdges - visibleEdges) / totalEdges) * 100;
  
  return {
    totalNodes,
    visibleNodes,
    nodeReduction: Math.round(nodeReduction),
    totalEdges,
    visibleEdges,
    edgeReduction: Math.round(edgeReduction)
  };
};

// ============================================================================
// HOOK PRINCIPAL
// ============================================================================

export const useVirtualizedRendering = ({
  nodes,
  edges,
  viewport,
  containerBounds,
  enableVirtualization,
  enableLevelOfDetail,
  performanceThreshold,
  onNodesFiltered,
  onEdgesFiltered
}: VirtualizedNodeRendererProps) => {
  
  // Calcular nós e arestas visíveis
  const { filteredNodes, filteredEdges, stats } = useMemo(() => {
    // Se virtualização está desabilitada ou há poucos nós, retornar todos
    if (!enableVirtualization || nodes.length < performanceThreshold) {
      const allNodes = enableLevelOfDetail 
        ? nodes.map(node => applyLevelOfDetail(node, viewport.zoom, true))
        : nodes;
        
      return {
        filteredNodes: allNodes,
        filteredEdges: edges,
        stats: calculatePerformanceStats(nodes.length, nodes.length, edges.length, edges.length)
      };
    }
    
    // Calcular bounds do viewport
    const viewportBounds = calculateViewportBounds(viewport, containerBounds);
    
    // Filtrar nós visíveis
    const visibleNodes: UnifiedNode[] = [];
    const visibleNodeIds = new Set<string>();
    
    for (const node of nodes) {
      const nodeBounds = getNodeBounds(node);
      
      if (isNodeVisible(nodeBounds, viewportBounds)) {
        const processedNode = enableLevelOfDetail 
          ? applyLevelOfDetail(node, viewport.zoom, true)
          : node;
          
        visibleNodes.push(processedNode);
        visibleNodeIds.add(node.id);
      }
    }
    
    // Filtrar arestas visíveis
    const visibleEdges = edges.filter(edge => 
      shouldRenderEdge(edge, visibleNodeIds, viewport.zoom)
    );
    
    const performanceStats = calculatePerformanceStats(
      nodes.length,
      visibleNodes.length,
      edges.length,
      visibleEdges.length
    );
    
    return {
      filteredNodes: visibleNodes,
      filteredEdges: visibleEdges,
      stats: performanceStats
    };
  }, [nodes, edges, viewport, containerBounds, enableVirtualization, enableLevelOfDetail, performanceThreshold]);
  
  // Notificar sobre mudanças nos nós/arestas filtrados
  React.useEffect(() => {
    onNodesFiltered?.(filteredNodes);
  }, [filteredNodes, onNodesFiltered]);
  
  React.useEffect(() => {
    onEdgesFiltered?.(filteredEdges);
  }, [filteredEdges, onEdgesFiltered]);
  
  return {
    nodes: filteredNodes,
    edges: filteredEdges,
    stats
  };
};

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export const VirtualizedNodeRenderer: React.FC<VirtualizedNodeRendererProps> = (props) => {
  const { nodes, edges, stats } = useVirtualizedRendering(props);
  
  // Este componente é principalmente um hook, mas pode ser usado para debugging
  if (process.env.NODE_ENV === 'development') {
    console.log('Virtualization Stats:', stats);
  }
  
  return null; // Este componente não renderiza nada diretamente
};

export default VirtualizedNodeRenderer;