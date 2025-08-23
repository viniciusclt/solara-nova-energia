// ============================================================================
// useAutoRouting Hook - Hook para sistema de roteamento automático
// ============================================================================

import { useCallback, useMemo, useRef } from 'react';
import { Node, Edge, Connection } from 'reactflow';
import { useDiagramStore } from '../stores/useDiagramStore';
import {
  generateNodeAutoRoute,
  generateAutoRoute,
  optimizeAllConnections,
  validateConnection,
  findBestConnectionPoints,
  nodesToObstacles,
  RoutingOptions,
  RoutingResult,
  PathPoint
} from '../utils/autoRouting';
import { secureLogger } from '@/utils/secureLogger';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

export interface UseAutoRoutingOptions {
  enabled: boolean;
  avoidNodes: boolean;
  preferOrthogonal: boolean;
  smoothCurves: boolean;
  minDistance: number;
  cornerRadius: number;
  autoOptimize: boolean;
  debounceMs: number;
}

export interface UseAutoRoutingReturn {
  // Estado
  isEnabled: boolean;
  options: UseAutoRoutingOptions;
  
  // Funções principais
  generateRoute: (sourceNode: Node, targetNode: Node) => RoutingResult;
  generateCustomRoute: (start: PathPoint, end: PathPoint, obstacles?: Node[]) => RoutingResult;
  optimizeConnection: (edge: Edge) => Edge | null;
  optimizeAllConnections: () => void;
  
  // Validação
  validateConnection: (sourceId: string, targetId: string) => { isValid: boolean; reason?: string };
  canConnect: (connection: Connection) => boolean;
  
  // Utilitários
  getBestConnectionPoints: (sourceId: string, targetId: string) => { source: PathPoint; target: PathPoint } | null;
  getConnectionPreview: (sourceId: string, targetId: string) => RoutingResult | null;
  
  // Configuração
  updateOptions: (newOptions: Partial<UseAutoRoutingOptions>) => void;
  toggleEnabled: () => void;
  resetToDefaults: () => void;
}

// ============================================================================
// CONFIGURAÇÕES PADRÃO
// ============================================================================

const DEFAULT_OPTIONS: UseAutoRoutingOptions = {
  enabled: true,
  avoidNodes: true,
  preferOrthogonal: true,
  smoothCurves: true,
  minDistance: 20,
  cornerRadius: 8,
  autoOptimize: false,
  debounceMs: 300
};

// ============================================================================
// HOOK PRINCIPAL
// ============================================================================

export const useAutoRouting = (initialOptions?: Partial<UseAutoRoutingOptions>): UseAutoRoutingReturn => {
  const { nodes, edges, updateEdge, setEdges } = useDiagramStore();
  const optionsRef = useRef<UseAutoRoutingOptions>({ ...DEFAULT_OPTIONS, ...initialOptions });
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // ============================================================================
  // FUNÇÕES DE ROTEAMENTO
  // ============================================================================

  const generateRoute = useCallback(
    (sourceNode: Node, targetNode: Node): RoutingResult => {
      try {
        const routingOptions: Partial<RoutingOptions> = {
          avoidNodes: optionsRef.current.avoidNodes,
          preferOrthogonal: optionsRef.current.preferOrthogonal,
          smoothCurves: optionsRef.current.smoothCurves,
          minDistance: optionsRef.current.minDistance,
          cornerRadius: optionsRef.current.cornerRadius
        };

        const result = generateNodeAutoRoute(sourceNode, targetNode, nodes, routingOptions);
        
        secureLogger.info('Rota gerada com sucesso', {
          sourceId: sourceNode.id,
          targetId: targetNode.id,
          pathLength: result.path.length,
          totalLength: result.totalLength,
          hasObstacles: result.hasObstacles
        });

        return result;
      } catch (error) {
        secureLogger.error('Erro ao gerar rota', { error, sourceId: sourceNode.id, targetId: targetNode.id });
        
        // Fallback para linha reta
        const { source, target } = findBestConnectionPoints(sourceNode, targetNode);
        return {
          path: [source, target],
          pathString: `M ${source.x} ${source.y} L ${target.x} ${target.y}`,
          segments: [{ start: source, end: target, type: 'diagonal' }],
          totalLength: Math.sqrt(Math.pow(target.x - source.x, 2) + Math.pow(target.y - source.y, 2)),
          hasObstacles: false
        };
      }
    },
    [nodes]
  );

  const generateCustomRoute = useCallback(
    (start: PathPoint, end: PathPoint, obstacles?: Node[]): RoutingResult => {
      try {
        const obstacleNodes = obstacles || nodes;
        const obstacleList = nodesToObstacles(obstacleNodes);
        
        const routingOptions: Partial<RoutingOptions> = {
          avoidNodes: optionsRef.current.avoidNodes,
          preferOrthogonal: optionsRef.current.preferOrthogonal,
          smoothCurves: optionsRef.current.smoothCurves,
          minDistance: optionsRef.current.minDistance,
          cornerRadius: optionsRef.current.cornerRadius
        };

        return generateAutoRoute(start, end, obstacleList, routingOptions);
      } catch (error) {
        secureLogger.error('Erro ao gerar rota customizada', { error });
        
        // Fallback
        return {
          path: [start, end],
          pathString: `M ${start.x} ${start.y} L ${target.x} ${target.y}`,
          segments: [{ start, end, type: 'diagonal' }],
          totalLength: Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)),
          hasObstacles: false
        };
      }
    },
    [nodes]
  );

  // ============================================================================
  // OTIMIZAÇÃO DE CONEXÕES
  // ============================================================================

  const optimizeConnection = useCallback(
    (edge: Edge): Edge | null => {
      if (!optionsRef.current.enabled) return edge;

      try {
        const sourceNode = nodes.find(n => n.id === edge.source);
        const targetNode = nodes.find(n => n.id === edge.target);

        if (!sourceNode || !targetNode) {
          secureLogger.warn('Nós não encontrados para otimização', { edgeId: edge.id });
          return edge;
        }

        const routing = generateRoute(sourceNode, targetNode);
        
        const optimizedEdge: Edge = {
          ...edge,
          data: {
            ...edge.data,
            pathString: routing.pathString,
            autoRouted: true,
            routingInfo: {
              totalLength: routing.totalLength,
              hasObstacles: routing.hasObstacles,
              segments: routing.segments.length,
              optimizedAt: new Date().toISOString()
            }
          }
        };

        return optimizedEdge;
      } catch (error) {
        secureLogger.error('Erro ao otimizar conexão', { error, edgeId: edge.id });
        return edge;
      }
    },
    [nodes, generateRoute]
  );

  const optimizeAllConnectionsCallback = useCallback(() => {
    if (!optionsRef.current.enabled || !optionsRef.current.autoOptimize) return;

    try {
      const routingOptions: Partial<RoutingOptions> = {
        avoidNodes: optionsRef.current.avoidNodes,
        preferOrthogonal: optionsRef.current.preferOrthogonal,
        smoothCurves: optionsRef.current.smoothCurves,
        minDistance: optionsRef.current.minDistance,
        cornerRadius: optionsRef.current.cornerRadius
      };

      const optimizedEdges = optimizeAllConnections(nodes, edges, routingOptions);
      setEdges(optimizedEdges);
      
      secureLogger.info('Todas as conexões otimizadas', { 
        edgeCount: edges.length,
        optimizedCount: optimizedEdges.length
      });
    } catch (error) {
      secureLogger.error('Erro ao otimizar todas as conexões', { error });
    }
  }, [nodes, edges, setEdges]);

  // ============================================================================
  // VALIDAÇÃO
  // ============================================================================

  const validateConnectionCallback = useCallback(
    (sourceId: string, targetId: string): { isValid: boolean; reason?: string } => {
      const sourceNode = nodes.find(n => n.id === sourceId);
      const targetNode = nodes.find(n => n.id === targetId);

      if (!sourceNode || !targetNode) {
        return { isValid: false, reason: 'Nó não encontrado' };
      }

      return validateConnection(sourceNode, targetNode, nodes);
    },
    [nodes]
  );

  const canConnect = useCallback(
    (connection: Connection): boolean => {
      if (!connection.source || !connection.target) return false;
      
      const validation = validateConnectionCallback(connection.source, connection.target);
      return validation.isValid;
    },
    [validateConnectionCallback]
  );

  // ============================================================================
  // UTILITÁRIOS
  // ============================================================================

  const getBestConnectionPoints = useCallback(
    (sourceId: string, targetId: string): { source: PathPoint; target: PathPoint } | null => {
      const sourceNode = nodes.find(n => n.id === sourceId);
      const targetNode = nodes.find(n => n.id === targetId);

      if (!sourceNode || !targetNode) return null;

      return findBestConnectionPoints(sourceNode, targetNode);
    },
    [nodes]
  );

  const getConnectionPreview = useCallback(
    (sourceId: string, targetId: string): RoutingResult | null => {
      const sourceNode = nodes.find(n => n.id === sourceId);
      const targetNode = nodes.find(n => n.id === targetId);

      if (!sourceNode || !targetNode) return null;

      try {
        return generateRoute(sourceNode, targetNode);
      } catch (error) {
        secureLogger.error('Erro ao gerar preview da conexão', { error });
        return null;
      }
    },
    [nodes, generateRoute]
  );

  // ============================================================================
  // CONFIGURAÇÃO
  // ============================================================================

  const updateOptions = useCallback((newOptions: Partial<UseAutoRoutingOptions>) => {
    optionsRef.current = { ...optionsRef.current, ...newOptions };
    
    // Debounce para otimização automática
    if (optionsRef.current.autoOptimize && optionsRef.current.debounceMs > 0) {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      
      debounceRef.current = setTimeout(() => {
        optimizeAllConnectionsCallback();
      }, optionsRef.current.debounceMs);
    }
    
    secureLogger.info('Opções de auto-routing atualizadas', newOptions);
  }, [optimizeAllConnectionsCallback]);

  const toggleEnabled = useCallback(() => {
    updateOptions({ enabled: !optionsRef.current.enabled });
  }, [updateOptions]);

  const resetToDefaults = useCallback(() => {
    optionsRef.current = { ...DEFAULT_OPTIONS };
    secureLogger.info('Opções de auto-routing resetadas para padrão');
  }, []);

  // ============================================================================
  // VALORES MEMOIZADOS
  // ============================================================================

  const memoizedReturn = useMemo((): UseAutoRoutingReturn => ({
    // Estado
    isEnabled: optionsRef.current.enabled,
    options: optionsRef.current,
    
    // Funções principais
    generateRoute,
    generateCustomRoute,
    optimizeConnection,
    optimizeAllConnections: optimizeAllConnectionsCallback,
    
    // Validação
    validateConnection: validateConnectionCallback,
    canConnect,
    
    // Utilitários
    getBestConnectionPoints,
    getConnectionPreview,
    
    // Configuração
    updateOptions,
    toggleEnabled,
    resetToDefaults
  }), [
    generateRoute,
    generateCustomRoute,
    optimizeConnection,
    optimizeAllConnectionsCallback,
    validateConnectionCallback,
    canConnect,
    getBestConnectionPoints,
    getConnectionPreview,
    updateOptions,
    toggleEnabled,
    resetToDefaults
  ]);

  return memoizedReturn;
};

// ============================================================================
// HOOK SIMPLIFICADO PARA CASOS BÁSICOS
// ============================================================================

export const useSimpleAutoRouting = () => {
  const autoRouting = useAutoRouting({
    enabled: true,
    avoidNodes: true,
    smoothCurves: true,
    autoOptimize: false
  });

  return {
    generateRoute: autoRouting.generateRoute,
    canConnect: autoRouting.canConnect,
    isEnabled: autoRouting.isEnabled,
    toggleEnabled: autoRouting.toggleEnabled
  };
};

// ============================================================================
// HOOK PARA PREVIEW DE CONEXÕES
// ============================================================================

export const useConnectionPreview = () => {
  const { getConnectionPreview, getBestConnectionPoints } = useAutoRouting({
    enabled: true,
    avoidNodes: true,
    smoothCurves: true
  });

  return {
    getPreview: getConnectionPreview,
    getConnectionPoints: getBestConnectionPoints
  };
};