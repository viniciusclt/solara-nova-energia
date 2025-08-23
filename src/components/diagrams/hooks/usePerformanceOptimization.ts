import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Node, Edge, useReactFlow, Viewport } from 'reactflow';
import { debounce } from 'lodash';
import { UnifiedNode, UnifiedEdge } from '../../../types/unified-diagram';
import { useVirtualizedRendering } from '../performance/VirtualizedNodeRenderer';

// ============================================================================
// INTERFACES
// ============================================================================

export interface PerformanceConfig {
  // Virtualização
  enableVirtualization: boolean;
  viewportBuffer: number; // Pixels extras ao redor do viewport
  maxVisibleNodes: number; // Máximo de nós visíveis simultaneamente
  
  // Lazy Loading
  enableLazyLoading: boolean;
  chunkSize: number; // Tamanho dos chunks para carregamento
  loadDelay: number; // Delay entre carregamentos (ms)
  
  // Otimizações de renderização
  enableLevelOfDetail: boolean; // Simplificar nós distantes
  lodThreshold: number; // Zoom threshold para LOD
  
  // Debounce
  debounceDelay: number;
  
  // Limites de performance
  performanceThreshold: number; // Número de nós para ativar otimizações
}

export interface PerformanceMetrics {
  totalNodes: number;
  visibleNodes: number;
  renderTime: number;
  memoryUsage: number;
  fps: number;
}

export interface UsePerformanceOptimizationProps {
  nodes: Node[];
  edges: Edge[];
  config?: Partial<PerformanceConfig>;
  onMetricsUpdate?: (metrics: PerformanceMetrics) => void;
}

export interface UsePerformanceOptimizationReturn {
  // Nós e arestas otimizados
  optimizedNodes: Node[];
  optimizedEdges: Edge[];
  
  // Estado de carregamento
  isLoading: boolean;
  loadingProgress: number;
  
  // Métricas
  metrics: PerformanceMetrics;
  
  // Controles
  forceUpdate: () => void;
  setConfig: (config: Partial<PerformanceConfig>) => void;
}

// ============================================================================
// CONFIGURAÇÃO PADRÃO
// ============================================================================

const DEFAULT_CONFIG: PerformanceConfig = {
  enableVirtualization: true,
  viewportBuffer: 200,
  maxVisibleNodes: 500,
  
  enableLazyLoading: true,
  chunkSize: 50,
  loadDelay: 100,
  
  enableLevelOfDetail: true,
  lodThreshold: 0.5,
  
  debounceDelay: 150,
  
  performanceThreshold: 100
};

// ============================================================================
// UTILITÁRIOS
// ============================================================================

/**
 * Calcula se um nó está visível no viewport
 */
function isNodeVisible(
  node: Node,
  viewport: Viewport,
  buffer: number,
  canvasWidth: number,
  canvasHeight: number
): boolean {
  const nodeX = node.position.x * viewport.zoom + viewport.x;
  const nodeY = node.position.y * viewport.zoom + viewport.y;
  const nodeWidth = (node.width || 150) * viewport.zoom;
  const nodeHeight = (node.height || 50) * viewport.zoom;
  
  return (
    nodeX + nodeWidth >= -buffer &&
    nodeX <= canvasWidth + buffer &&
    nodeY + nodeHeight >= -buffer &&
    nodeY <= canvasHeight + buffer
  );
}

/**
 * Simplifica um nó para Level of Detail
 */
function simplifyNodeForLOD(node: Node, zoomLevel: number): Node {
  if (zoomLevel > 0.5) return node;
  
  return {
    ...node,
    data: {
      ...node.data,
      // Simplificar dados para zoom baixo
      label: node.data.label?.length > 20 ? 
        node.data.label.substring(0, 17) + '...' : 
        node.data.label,
      // Remover detalhes visuais complexos
      showDetails: false,
      simplified: true
    }
  };
}

/**
 * Calcula métricas de performance
 */
function calculateMetrics(
  totalNodes: number,
  visibleNodes: number,
  renderStartTime: number
): PerformanceMetrics {
  const renderTime = performance.now() - renderStartTime;
  
  return {
    totalNodes,
    visibleNodes,
    renderTime,
    memoryUsage: (performance as any).memory?.usedJSHeapSize || 0,
    fps: Math.round(1000 / renderTime)
  };
}

// ============================================================================
// HOOK PRINCIPAL
// ============================================================================

export function usePerformanceOptimization({
  nodes,
  edges,
  config: userConfig = {},
  onMetricsUpdate
}: UsePerformanceOptimizationProps): UsePerformanceOptimizationReturn {
  
  // ============================================================================
  // ESTADO
  // ============================================================================
  
  const reactFlow = useReactFlow();
  const [config, setConfigState] = useState<PerformanceConfig>({
    ...DEFAULT_CONFIG,
    ...userConfig
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    totalNodes: 0,
    visibleNodes: 0,
    renderTime: 0,
    memoryUsage: 0,
    fps: 60
  });
  
  const [forceUpdateCounter, setForceUpdateCounter] = useState(0);
  const [containerBounds, setContainerBounds] = useState<DOMRect | null>(null);
  const renderStartTimeRef = useRef<number>(0);
  const loadedChunksRef = useRef<Set<number>>(new Set());
  const containerRef = useRef<HTMLDivElement | null>(null);
  
  // ============================================================================
  // VIRTUALIZAÇÃO E OTIMIZAÇÃO
  // ============================================================================
  
  // Obter bounds do container
  useEffect(() => {
    const updateContainerBounds = () => {
      if (containerRef.current) {
        setContainerBounds(containerRef.current.getBoundingClientRect());
      }
    };
    
    updateContainerBounds();
    window.addEventListener('resize', updateContainerBounds);
    
    return () => {
      window.removeEventListener('resize', updateContainerBounds);
    };
  }, []);
  
  // Hook de renderização virtualizada
  const virtualizationResult = useVirtualizedRendering({
    nodes: nodes as UnifiedNode[],
    edges: edges as UnifiedEdge[],
    viewport: reactFlow.getViewport(),
    containerBounds: containerBounds || new DOMRect(),
    enableVirtualization: config.enableVirtualization,
    enableLevelOfDetail: config.enableLevelOfDetail,
    performanceThreshold: config.performanceThreshold,
    onNodesFiltered: useCallback((filteredNodes: UnifiedNode[]) => {
      setMetrics(prev => ({
        ...prev,
        visibleNodes: filteredNodes.length
      }));
    }, []),
    onEdgesFiltered: useCallback((filteredEdges: UnifiedEdge[]) => {
      setMetrics(prev => ({
        ...prev,
        visibleEdges: filteredEdges.length
      }));
    }, [])
  });
  
  const optimizedNodes = useMemo(() => {
    renderStartTimeRef.current = performance.now();
    
    let processedNodes = virtualizationResult.nodes as Node[];
    
    // Aplicar lazy loading se habilitado
    if (config.enableLazyLoading) {
      processedNodes = processedNodes.map(node => {
        if (node.data && typeof node.data === 'object') {
          return {
            ...node,
            data: {
              ...node.data,
              lazyLoaded: true
            }
          };
        }
        return node;
      });
    }
    
    return processedNodes;
  }, [virtualizationResult.nodes, config.enableLazyLoading]);
  
  // ============================================================================
  // OTIMIZAÇÃO DE ARESTAS
  // ============================================================================
  
  const optimizedEdges = useMemo(() => {
    return virtualizationResult.edges as Edge[];
  }, [virtualizationResult.edges]);
  
  // ============================================================================
  // LAZY LOADING
  // ============================================================================
  
  const loadNodesInChunks = useCallback(async () => {
    if (!config.enableLazyLoading || nodes.length < config.performanceThreshold) {
      return;
    }
    
    setIsLoading(true);
    setLoadingProgress(0);
    
    const totalChunks = Math.ceil(nodes.length / config.chunkSize);
    
    for (let i = 0; i < totalChunks; i++) {
      if (loadedChunksRef.current.has(i)) continue;
      
      await new Promise(resolve => setTimeout(resolve, config.loadDelay));
      
      loadedChunksRef.current.add(i);
      setLoadingProgress((i + 1) / totalChunks * 100);
      
      // Forçar re-render
      setForceUpdateCounter(prev => prev + 1);
    }
    
    setIsLoading(false);
  }, [nodes, config]);
  
  // ============================================================================
  // MÉTRICAS E MONITORAMENTO
  // ============================================================================
  
  const updateMetrics = useCallback(
    debounce(() => {
      const newMetrics = calculateMetrics(
        nodes.length,
        optimizedNodes.length,
        renderStartTimeRef.current
      );
      
      setMetrics(newMetrics);
      onMetricsUpdate?.(newMetrics);
    }, config.debounceDelay),
    [nodes.length, optimizedNodes.length, config.debounceDelay, onMetricsUpdate]
  );
  
  // ============================================================================
  // EFEITOS
  // ============================================================================
  
  // Atualizar métricas quando nós mudarem
  useEffect(() => {
    updateMetrics();
  }, [updateMetrics]);
  
  // Carregar nós em chunks quando necessário
  useEffect(() => {
    if (config.enableLazyLoading && nodes.length >= config.performanceThreshold) {
      loadNodesInChunks();
    }
  }, [loadNodesInChunks, config.enableLazyLoading, nodes.length, config.performanceThreshold]);
  
  // Limpar chunks carregados quando nós mudarem
  useEffect(() => {
    loadedChunksRef.current.clear();
  }, [nodes]);
  
  // ============================================================================
  // HANDLERS
  // ============================================================================
  
  const forceUpdate = useCallback(() => {
    setForceUpdateCounter(prev => prev + 1);
  }, []);
  
  const setConfig = useCallback((newConfig: Partial<PerformanceConfig>) => {
    setConfigState(prev => ({ ...prev, ...newConfig }));
  }, []);
  
  // ============================================================================
  // RETORNO
  // ============================================================================
  
  return {
    optimizedNodes,
    optimizedEdges,
    isLoading,
    loadingProgress,
    metrics,
    forceUpdate,
    setConfig,
    containerRef,
    virtualizationStats: virtualizationResult.stats
  };
}

export default usePerformanceOptimization;