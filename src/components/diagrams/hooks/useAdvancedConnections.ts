// ============================================================================
// useAdvancedConnections Hook - Hook para ferramentas avançadas de conexão
// ============================================================================

import { useState, useCallback, useRef, useEffect } from 'react';
import { Connection, Edge, Node } from 'reactflow';
import { useDiagramStore } from '../stores/useDiagramStore';
import { useAutoRouting } from './useAutoRouting';
import { DiagramNode, DiagramEdge } from '../types';
import { secureLogger } from '@/utils/secureLogger';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

export type ConnectionType = 'straight' | 'curved' | 'stepped' | 'orthogonal' | 'bezier';
export type ConnectionMode = 'manual' | 'auto' | 'smart';

export interface ConnectionStyle {
  strokeWidth: number;
  strokeColor: string;
  strokeDasharray?: string;
  animated: boolean;
  showArrows: boolean;
  showLabels: boolean;
  markerEnd?: {
    type: string;
    width: number;
    height: number;
  };
}

export interface ConnectionPreview {
  isVisible: boolean;
  sourceId: string | null;
  targetId: string | null;
  mousePosition: { x: number; y: number } | null;
  style: ConnectionStyle;
}

export interface ConnectionValidation {
  isValid: boolean;
  reason?: string;
  suggestions?: string[];
}

export interface UseAdvancedConnectionsOptions {
  enablePreview: boolean;
  enableValidation: boolean;
  enableAutoRouting: boolean;
  defaultConnectionType: ConnectionType;
  defaultStyle: ConnectionStyle;
}

export interface UseAdvancedConnectionsReturn {
  // Estado
  connectionMode: ConnectionMode;
  connectionType: ConnectionType;
  connectionStyle: ConnectionStyle;
  isConnecting: boolean;
  connectionStart: string | null;
  preview: ConnectionPreview;
  
  // Configurações
  setConnectionMode: (mode: ConnectionMode) => void;
  setConnectionType: (type: ConnectionType) => void;
  updateConnectionStyle: (updates: Partial<ConnectionStyle>) => void;
  
  // Ações de conexão
  startConnection: (nodeId: string) => void;
  completeConnection: (targetNodeId: string) => void;
  cancelConnection: () => void;
  
  // Operações em conexões existentes
  updateConnection: (connectionId: string, updates: Partial<DiagramEdge>) => void;
  deleteConnection: (connectionId: string) => void;
  duplicateConnection: (connectionId: string) => void;
  
  // Operações em lote
  optimizeAllConnections: () => Promise<void>;
  deleteAllConnections: () => void;
  selectConnectedNodes: (nodeId: string) => void;
  
  // Validação
  validateConnection: (sourceId: string, targetId: string) => ConnectionValidation;
  canConnect: (sourceId: string, targetId: string) => boolean;
  
  // Estatísticas
  getConnectionStats: () => {
    total: number;
    byType: Record<ConnectionType, number>;
    autoRouted: number;
    optimized: number;
  };
  
  // Eventos
  onMouseMove: (event: React.MouseEvent) => void;
  onNodeClick: (nodeId: string) => void;
  onConnectionClick: (connectionId: string) => void;
}

// ============================================================================
// CONSTANTES
// ============================================================================

const DEFAULT_CONNECTION_STYLE: ConnectionStyle = {
  strokeWidth: 2,
  strokeColor: '#6b7280',
  animated: false,
  showArrows: true,
  showLabels: false,
  markerEnd: {
    type: 'arrowclosed',
    width: 20,
    height: 20
  }
};

const DEFAULT_OPTIONS: UseAdvancedConnectionsOptions = {
  enablePreview: true,
  enableValidation: true,
  enableAutoRouting: true,
  defaultConnectionType: 'straight',
  defaultStyle: DEFAULT_CONNECTION_STYLE
};

// ============================================================================
// HOOK PRINCIPAL
// ============================================================================

export const useAdvancedConnections = (
  options: Partial<UseAdvancedConnectionsOptions> = {}
): UseAdvancedConnectionsReturn => {
  const config = { ...DEFAULT_OPTIONS, ...options };
  
  const {
    nodes,
    edges,
    selectedNodeId,
    selectedEdgeId,
    setSelectedNodeId,
    setSelectedEdgeId,
    addEdge,
    updateEdge,
    deleteEdge,
    setNodes,
    setEdges
  } = useDiagramStore();
  
  const {
    isEnabled: autoRoutingEnabled,
    validateConnection: validateAutoRouting,
    optimizeAllConnections: optimizeAutoRouting,
    generateRoute
  } = useAutoRouting();

  // ============================================================================
  // ESTADO LOCAL
  // ============================================================================

  const [connectionMode, setConnectionMode] = useState<ConnectionMode>('manual');
  const [connectionType, setConnectionType] = useState<ConnectionType>(config.defaultConnectionType);
  const [connectionStyle, setConnectionStyle] = useState<ConnectionStyle>(config.defaultStyle);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStart, setConnectionStart] = useState<string | null>(null);
  const [preview, setPreview] = useState<ConnectionPreview>({
    isVisible: false,
    sourceId: null,
    targetId: null,
    mousePosition: null,
    style: config.defaultStyle
  });

  const mousePositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // ============================================================================
  // VALIDAÇÃO
  // ============================================================================

  const validateConnection = useCallback((sourceId: string, targetId: string): ConnectionValidation => {
    if (!config.enableValidation) {
      return { isValid: true };
    }

    // Verificações básicas
    if (sourceId === targetId) {
      return {
        isValid: false,
        reason: 'Não é possível conectar um nó a si mesmo',
        suggestions: ['Selecione um nó diferente como destino']
      };
    }

    // Verificar se os nós existem
    const sourceNode = nodes.find(n => n.id === sourceId);
    const targetNode = nodes.find(n => n.id === targetId);
    
    if (!sourceNode || !targetNode) {
      return {
        isValid: false,
        reason: 'Um ou ambos os nós não foram encontrados',
        suggestions: ['Verifique se os nós ainda existem no diagrama']
      };
    }

    // Verificar se já existe uma conexão
    const existingConnection = edges.find(e => 
      (e.source === sourceId && e.target === targetId) ||
      (e.source === targetId && e.target === sourceId)
    );
    
    if (existingConnection) {
      return {
        isValid: false,
        reason: 'Já existe uma conexão entre esses nós',
        suggestions: [
          'Remova a conexão existente primeiro',
          'Considere usar um nó intermediário'
        ]
      };
    }

    // Validação específica do auto-routing
    if (config.enableAutoRouting && autoRoutingEnabled) {
      const autoValidation = validateAutoRouting(sourceId, targetId);
      if (!autoValidation.isValid) {
        return {
          isValid: false,
          reason: autoValidation.reason,
          suggestions: ['Tente reposicionar os nós', 'Desative o auto-routing temporariamente']
        };
      }
    }

    return { isValid: true };
  }, [config.enableValidation, config.enableAutoRouting, nodes, edges, autoRoutingEnabled, validateAutoRouting]);

  const canConnect = useCallback((sourceId: string, targetId: string): boolean => {
    return validateConnection(sourceId, targetId).isValid;
  }, [validateConnection]);

  // ============================================================================
  // AÇÕES DE CONEXÃO
  // ============================================================================

  const startConnection = useCallback((nodeId: string) => {
    setIsConnecting(true);
    setConnectionStart(nodeId);
    
    if (config.enablePreview) {
      setPreview({
        isVisible: true,
        sourceId: nodeId,
        targetId: null,
        mousePosition: mousePositionRef.current,
        style: connectionStyle
      });
    }
    
    secureLogger.info('Iniciando conexão', { nodeId, mode: connectionMode });
  }, [config.enablePreview, connectionStyle, connectionMode]);

  const completeConnection = useCallback((targetNodeId: string) => {
    if (!connectionStart || connectionStart === targetNodeId) {
      cancelConnection();
      return;
    }

    // Validar conexão
    const validation = validateConnection(connectionStart, targetNodeId);
    if (!validation.isValid) {
      secureLogger.warn('Conexão inválida', {
        source: connectionStart,
        target: targetNodeId,
        reason: validation.reason
      });
      cancelConnection();
      return;
    }

    // Criar nova conexão
    const newEdge: DiagramEdge = {
      id: `edge-${Date.now()}`,
      source: connectionStart,
      target: targetNodeId,
      type: connectionType,
      style: {
        strokeWidth: connectionStyle.strokeWidth,
        stroke: connectionStyle.strokeColor,
        strokeDasharray: connectionStyle.strokeDasharray
      },
      animated: connectionStyle.animated,
      markerEnd: connectionStyle.showArrows ? connectionStyle.markerEnd : undefined,
      label: connectionStyle.showLabels ? '' : undefined,
      data: {
        routingInfo: {
          autoRouted: connectionMode === 'auto' || connectionMode === 'smart',
          createdAt: new Date().toISOString(),
          connectionType,
          connectionMode
        }
      }
    };

    // Aplicar auto-routing se habilitado
    if ((connectionMode === 'auto' || connectionMode === 'smart') && config.enableAutoRouting) {
      const sourceNode = nodes.find(n => n.id === connectionStart);
      const targetNode = nodes.find(n => n.id === targetNodeId);
      
      if (sourceNode && targetNode) {
        const routingResult = generateRoute(sourceNode as Node, targetNode as Node);
        if (routingResult.success && routingResult.path) {
          // Aplicar rota otimizada
          newEdge.data = {
            ...newEdge.data,
            routingInfo: {
              ...newEdge.data.routingInfo,
              path: routingResult.path,
              totalLength: routingResult.totalLength,
              hasObstacles: routingResult.hasObstacles
            }
          };
        }
      }
    }

    addEdge(newEdge);
    cancelConnection();
    
    secureLogger.info('Conexão criada', {
      edgeId: newEdge.id,
      source: connectionStart,
      target: targetNodeId,
      type: connectionType,
      mode: connectionMode
    });
  }, [connectionStart, validateConnection, connectionType, connectionStyle, connectionMode, config.enableAutoRouting, nodes, generateRoute, addEdge]);

  const cancelConnection = useCallback(() => {
    setIsConnecting(false);
    setConnectionStart(null);
    setPreview({
      isVisible: false,
      sourceId: null,
      targetId: null,
      mousePosition: null,
      style: connectionStyle
    });
  }, [connectionStyle]);

  // ============================================================================
  // OPERAÇÕES EM CONEXÕES EXISTENTES
  // ============================================================================

  const updateConnection = useCallback((connectionId: string, updates: Partial<DiagramEdge>) => {
    updateEdge(connectionId, updates);
    secureLogger.info('Conexão atualizada', { connectionId, updates });
  }, [updateEdge]);

  const deleteConnection = useCallback(async (connectionId: string) => {
    await deleteEdge(connectionId);
    if (selectedEdgeId === connectionId) {
      setSelectedEdgeId(null);
    }
    secureLogger.info('Conexão removida', { connectionId });
  }, [deleteEdge, selectedEdgeId, setSelectedEdgeId]);

  const duplicateConnection = useCallback((connectionId: string) => {
    const originalEdge = edges.find(e => e.id === connectionId);
    if (!originalEdge) return;

    const duplicatedEdge: DiagramEdge = {
      ...originalEdge,
      id: `edge-${Date.now()}`,
      data: {
        ...originalEdge.data,
        routingInfo: {
          ...originalEdge.data?.routingInfo,
          createdAt: new Date().toISOString(),
          duplicatedFrom: connectionId
        }
      }
    };

    addEdge(duplicatedEdge);
    secureLogger.info('Conexão duplicada', { originalId: connectionId, newId: duplicatedEdge.id });
  }, [edges, addEdge]);

  // ============================================================================
  // OPERAÇÕES EM LOTE
  // ============================================================================

  const optimizeAllConnections = useCallback(async () => {
    if (!config.enableAutoRouting) return;
    
    try {
      await optimizeAutoRouting();
      secureLogger.info('Todas as conexões foram otimizadas');
    } catch (error) {
      secureLogger.error('Erro ao otimizar conexões', error);
      throw error;
    }
  }, [config.enableAutoRouting, optimizeAutoRouting]);

  const deleteAllConnections = useCallback(() => {
    setEdges([]);
    setSelectedEdgeId(null);
    secureLogger.info('Todas as conexões foram removidas');
  }, [setEdges, setSelectedEdgeId]);

  const selectConnectedNodes = useCallback((nodeId: string) => {
    const connectedEdges = edges.filter(e => e.source === nodeId || e.target === nodeId);
    const connectedNodeIds = new Set<string>();
    
    connectedEdges.forEach(edge => {
      connectedNodeIds.add(edge.source);
      connectedNodeIds.add(edge.target);
    });
    
    // Selecionar todos os nós conectados
    const updatedNodes = nodes.map(node => ({
      ...node,
      selected: connectedNodeIds.has(node.id)
    }));
    
    setNodes(updatedNodes);
    secureLogger.info('Nós conectados selecionados', { nodeId, connectedCount: connectedNodeIds.size });
  }, [edges, nodes, setNodes]);

  // ============================================================================
  // ESTATÍSTICAS
  // ============================================================================

  const getConnectionStats = useCallback(() => {
    const byType: Record<ConnectionType, number> = {
      straight: 0,
      curved: 0,
      stepped: 0,
      orthogonal: 0,
      bezier: 0
    };
    
    edges.forEach(edge => {
      const type = edge.type as ConnectionType || 'straight';
      byType[type]++;
    });
    
    const autoRouted = edges.filter(e => e.data?.routingInfo?.autoRouted).length;
    const optimized = edges.filter(e => e.data?.routingInfo?.optimizedAt).length;
    
    return {
      total: edges.length,
      byType,
      autoRouted,
      optimized
    };
  }, [edges]);

  // ============================================================================
  // HANDLERS DE EVENTOS
  // ============================================================================

  const onMouseMove = useCallback((event: React.MouseEvent) => {
    mousePositionRef.current = { x: event.clientX, y: event.clientY };
    
    if (isConnecting && config.enablePreview) {
      setPreview(prev => ({
        ...prev,
        mousePosition: { x: event.clientX, y: event.clientY }
      }));
    }
  }, [isConnecting, config.enablePreview]);

  const onNodeClick = useCallback((nodeId: string) => {
    if (isConnecting) {
      completeConnection(nodeId);
    } else {
      setSelectedNodeId(nodeId);
    }
  }, [isConnecting, completeConnection, setSelectedNodeId]);

  const onConnectionClick = useCallback((connectionId: string) => {
    setSelectedEdgeId(connectionId);
  }, [setSelectedEdgeId]);

  // ============================================================================
  // CONFIGURAÇÕES
  // ============================================================================

  const updateConnectionStyle = useCallback((updates: Partial<ConnectionStyle>) => {
    setConnectionStyle(prev => ({ ...prev, ...updates }));
  }, []);

  // ============================================================================
  // EFEITOS
  // ============================================================================

  // Cancelar conexão ao pressionar Escape
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isConnecting) {
        cancelConnection();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isConnecting, cancelConnection]);

  // ============================================================================
  // RETORNO
  // ============================================================================

  return {
    // Estado
    connectionMode,
    connectionType,
    connectionStyle,
    isConnecting,
    connectionStart,
    preview,
    
    // Configurações
    setConnectionMode,
    setConnectionType,
    updateConnectionStyle,
    
    // Ações de conexão
    startConnection,
    completeConnection,
    cancelConnection,
    
    // Operações em conexões existentes
    updateConnection,
    deleteConnection,
    duplicateConnection,
    
    // Operações em lote
    optimizeAllConnections,
    deleteAllConnections,
    selectConnectedNodes,
    
    // Validação
    validateConnection,
    canConnect,
    
    // Estatísticas
    getConnectionStats,
    
    // Eventos
    onMouseMove,
    onNodeClick,
    onConnectionClick
  };
};

export default useAdvancedConnections;