import { useCallback } from 'react';
import { Node, Edge, Connection, addEdge, applyNodeChanges, applyEdgeChanges, NodeChange, EdgeChange } from 'reactflow';
import { useDiagramStore } from '../stores/useDiagramStore';
import { DiagramNode, DiagramEdge, NodeCategory } from '../types';
import { useAutoRouting } from './useAutoRouting';
import { secureLogger } from '@/utils/secureLogger';

/**
 * Hook customizado para gerenciar o estado do diagrama
 * Centraliza operações de nós e arestas com ReactFlow
 */
export const useDiagramState = () => {
  const {
    nodes,
    edges,
    setNodes,
    setEdges,
    addNode,
    updateNode,
    deleteNode,
    addEdge: addDiagramEdge,
    updateEdge,
    deleteEdge,
    selectedNodeId,
    setSelectedNodeId,
    diagramType,
    setDiagramType
  } = useDiagramStore();

  // Hook de auto-routing para conexões inteligentes
  const { generateRoute, canConnect, validateConnection, isEnabled: autoRoutingEnabled } = useAutoRouting({
    enabled: true,
    avoidNodes: true,
    preferOrthogonal: true,
    smoothCurves: true,
    autoOptimize: false
  });

  // Manipuladores de mudanças do ReactFlow
  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      const updatedNodes = applyNodeChanges(changes, nodes as Node[]);
      setNodes(updatedNodes as DiagramNode[]);
    },
    [nodes, setNodes]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      const updatedEdges = applyEdgeChanges(changes, edges as Edge[]);
      setEdges(updatedEdges as DiagramEdge[]);
    },
    [edges, setEdges]
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) {
        secureLogger.warn('Tentativa de conexão inválida - source ou target ausente', connection);
        return;
      }

      // Validar conexão antes de criar
      if (!canConnect(connection)) {
        const validation = validateConnection(connection.source, connection.target);
        secureLogger.warn('Conexão rejeitada pela validação', {
          source: connection.source,
          target: connection.target,
          reason: validation.reason
        });
        return;
      }

      try {
        // Buscar nós para auto-routing
        const sourceNode = nodes.find(n => n.id === connection.source);
        const targetNode = nodes.find(n => n.id === connection.target);

        let pathString = '';
        let routingInfo = null;

        // Aplicar auto-routing se habilitado e nós encontrados
        if (autoRoutingEnabled && sourceNode && targetNode) {
          try {
            const routing = generateRoute(sourceNode, targetNode);
            pathString = routing.pathString;
            routingInfo = {
              totalLength: routing.totalLength,
              hasObstacles: routing.hasObstacles,
              segments: routing.segments.length,
              autoRouted: true,
              generatedAt: new Date().toISOString()
            };
            
            secureLogger.info('Auto-routing aplicado à nova conexão', {
              source: connection.source,
              target: connection.target,
              pathLength: routing.path.length,
              totalLength: routing.totalLength
            });
          } catch (routingError) {
            secureLogger.error('Erro no auto-routing, usando conexão padrão', {
              error: routingError,
              source: connection.source,
              target: connection.target
            });
          }
        }

        const newEdge: Omit<DiagramEdge, 'id' | 'createdAt' | 'updatedAt' | 'version'> = {
          source: connection.source,
          target: connection.target,
          sourceHandle: connection.sourceHandle || undefined,
          targetHandle: connection.targetHandle || undefined,
          type: autoRoutingEnabled && pathString ? 'smoothstep' : 'default',
          data: {
            label: '',
            style: {},
            animated: false,
            pathString,
            routingInfo
          }
        };

        addDiagramEdge(newEdge);
        
        secureLogger.info('Nova conexão criada com sucesso', {
          source: connection.source,
          target: connection.target,
          autoRouted: !!routingInfo
        });
      } catch (error) {
        secureLogger.error('Erro ao criar conexão', {
          error,
          connection
        });
      }
    },
    [addDiagramEdge, nodes, canConnect, validateConnection, autoRoutingEnabled, generateRoute]
  );

  // Operações de nós
  const createNode = useCallback(
    async (type: NodeCategory, position: { x: number; y: number }, data?: Partial<DiagramNode['data']>) => {
      const baseData = {
        category: type,
        label: 'Novo Nó',
        color: '#3B82F6'
      };

      const nodeData = { ...baseData, ...data };

      const newNode: Omit<DiagramNode, 'id' | 'createdAt' | 'updatedAt' | 'version'> = {
        type,
        position,
        data: nodeData
      };

      return await addNode(newNode);
    },
    [addNode]
  );

  const selectNode = useCallback(
    (nodeId: string | null) => {
      setSelectedNodeId(nodeId);
    },
    [setSelectedNodeId]
  );

  const getSelectedNode = useCallback(() => {
    return selectedNodeId ? nodes.find(node => node.id === selectedNodeId) : null;
  }, [nodes, selectedNodeId]);

  // Operações de limpeza
  const clearSelection = useCallback(() => {
    setSelectedNodeId(null);
  }, [setSelectedNodeId]);

  const clearDiagram = useCallback(() => {
    setNodes([]);
    setEdges([]);
    clearSelection();
  }, [setNodes, setEdges, clearSelection]);

  // Estatísticas do diagrama
  const getDiagramStats = useCallback(() => {
    return {
      nodeCount: nodes.length,
      edgeCount: edges.length,
      selectedNode: getSelectedNode(),
      diagramType
    };
  }, [nodes.length, edges.length, getSelectedNode, diagramType]);

  return {
    // Estado
    nodes,
    edges,
    selectedNodeId,
    diagramType,
    
    // Manipuladores ReactFlow
    onNodesChange,
    onEdgesChange,
    onConnect,
    
    // Operações de nós
    createNode,
    updateNode,
    deleteNode,
    selectNode,
    getSelectedNode,
    
    // Operações de arestas
    addEdge: addDiagramEdge,
    updateEdge,
    deleteEdge,
    
    // Operações gerais
    clearSelection,
    clearDiagram,
    setDiagramType,
    getDiagramStats
  };
};

export default useDiagramState;