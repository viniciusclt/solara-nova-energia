import { useCallback } from 'react';
import { XYPosition } from 'reactflow';
import { useDiagramStore } from '../stores/useDiagramStore';
import { DiagramNode, NodeCategory, FlowchartNodeData, OrganogramNodeData, MindMapNodeData } from '../types';

interface NodeOperationOptions {
  position?: XYPosition;
  parentId?: string;
  autoLayout?: boolean;
}

/**
 * Hook customizado para operações avançadas de nós
 * Inclui criação especializada, clonagem, e operações em lote
 */
export const useNodeOperations = () => {
  const {
    nodes,
    edges,
    addNode,
    updateNode,
    deleteNode,
    addEdge,
    deleteEdge,
    selectedNodeId
  } = useDiagramStore();

  // Criar nó com dados específicos do tipo
  const createTypedNode = useCallback(
    async (type: NodeCategory, position: XYPosition, options: NodeOperationOptions = {}) => {
      let nodeData: FlowchartNodeData | OrganogramNodeData | MindMapNodeData;

      switch (type) {
        case 'flowchart':
          nodeData = {
            category: 'flowchart',
            label: 'Novo Processo',
            color: '#3B82F6',
            shape: 'rectangle',
            flowchartType: 'process',
            description: '',
            priority: 'medium'
          } as FlowchartNodeData;
          break;

        case 'organogram':
          nodeData = {
            category: 'organogram',
            label: 'Nova Posição',
            color: '#10B981',
            person: {
              name: '',
              role: '',
              department: '',
              email: '',
              phone: ''
            },
            level: 4,
            responsibilities: [],
            skills: []
          } as OrganogramNodeData;
          break;

        case 'mindmap':
          nodeData = {
            category: 'mindmap',
            label: 'Nova Ideia',
            color: '#8B5CF6',
            level: 1,
            keywords: [],
            connections: []
          } as MindMapNodeData;
          break;

        default:
          throw new Error(`Tipo de nó não suportado: ${type}`);
      }

      const newNode: Omit<DiagramNode, 'id' | 'createdAt' | 'updatedAt' | 'version'> = {
        type,
        position,
        data: nodeData
      };

      const createdNode = await addNode(newNode);

      // Conectar ao nó pai se especificado
      if (options.parentId && createdNode) {
        const newEdge: Parameters<typeof addEdge>[0] = {
          source: options.parentId,
          target: createdNode.id,
          type: 'default',
          data: {
            label: '',
            style: {},
            animated: false
          }
        };
        await addEdge(newEdge);
      }

      return createdNode;
    },
    [addNode, addEdge]
  );

  // Clonar nó existente
  const cloneNode = useCallback(
    async (nodeId: string, offset: XYPosition = { x: 50, y: 50 }) => {
      const sourceNode = nodes.find(node => node.id === nodeId);
      if (!sourceNode) {
        console.warn(`Nó com ID ${nodeId} não encontrado`);
        return null;
      }

      const newPosition = {
        x: sourceNode.position.x + offset.x,
        y: sourceNode.position.y + offset.y
      };

      const clonedData = {
        ...sourceNode.data,
        label: `${sourceNode.data.label} (Cópia)`
      };

      const clonedNode: Omit<DiagramNode, 'id' | 'createdAt' | 'updatedAt' | 'version'> = {
        type: sourceNode.type,
        position: newPosition,
        data: clonedData
      };

      return await addNode(clonedNode);
    },
    [nodes, addNode]
  );

  // Duplicar nó selecionado
  const duplicateSelectedNode = useCallback(async () => {
    if (!selectedNodeId) {
      console.warn('Nenhum nó selecionado para duplicar');
      return null;
    }
    return await cloneNode(selectedNodeId);
  }, [selectedNodeId, cloneNode]);

  // Deletar nó e suas conexões
  const deleteNodeWithConnections = useCallback(
    async (nodeId: string) => {
      // Encontrar e deletar todas as arestas conectadas
      const connectedEdges = edges.filter(
        edge => edge.source === nodeId || edge.target === nodeId
      );

      for (const edge of connectedEdges) {
        await deleteEdge(edge.id);
      }

      // Deletar o nó
      await deleteNode(nodeId);
    },
    [edges, deleteEdge, deleteNode]
  );

  // Mover nó para posição específica
  const moveNodeTo = useCallback(
    async (nodeId: string, position: XYPosition) => {
      const node = nodes.find(n => n.id === nodeId);
      if (!node) return;

      await updateNode(nodeId, {
        position
      });
    },
    [nodes, updateNode]
  );

  // Agrupar nós selecionados
  const groupNodes = useCallback(
    (nodeIds: string[], groupPosition?: XYPosition) => {
      if (nodeIds.length < 2) {
        console.warn('Pelo menos 2 nós são necessários para agrupar');
        return null;
      }

      const selectedNodes = nodes.filter(node => nodeIds.includes(node.id));
      if (selectedNodes.length !== nodeIds.length) {
        console.warn('Alguns nós não foram encontrados');
        return null;
      }

      // Calcular posição central se não fornecida
      const centerPosition = groupPosition || {
        x: selectedNodes.reduce((sum, node) => sum + node.position.x, 0) / selectedNodes.length,
        y: selectedNodes.reduce((sum, node) => sum + node.position.y, 0) / selectedNodes.length
      };

      // Criar nó de grupo
      const groupNode = createTypedNode('flowchart', centerPosition);
      if (!groupNode) return null;

      // Conectar nós ao grupo
      selectedNodes.forEach(node => {
        const newEdge: Parameters<typeof addEdge>[0] = {
          source: groupNode.id,
          target: node.id,
          type: 'default',
          data: {
            label: '',
            style: { strokeDasharray: '5,5' },
            animated: false
          }
        };
        addEdge(newEdge);
      });

      return groupNode;
    },
    [nodes, createTypedNode, addEdge]
  );

  // Obter nós conectados
  const getConnectedNodes = useCallback(
    (nodeId: string, direction: 'incoming' | 'outgoing' | 'both' = 'both') => {
      const connectedEdges = edges.filter(edge => {
        switch (direction) {
          case 'incoming':
            return edge.target === nodeId;
          case 'outgoing':
            return edge.source === nodeId;
          case 'both':
          default:
            return edge.source === nodeId || edge.target === nodeId;
        }
      });

      const connectedNodeIds = new Set<string>();
      connectedEdges.forEach(edge => {
        if (edge.source !== nodeId) connectedNodeIds.add(edge.source);
        if (edge.target !== nodeId) connectedNodeIds.add(edge.target);
      });

      return nodes.filter(node => connectedNodeIds.has(node.id));
    },
    [edges, nodes]
  );

  // Verificar se nó pode ser deletado
  const canDeleteNode = useCallback(
    (nodeId: string) => {
      // Aqui você pode adicionar regras de negócio
      // Por exemplo, não permitir deletar nó raiz em organogramas
      const node = nodes.find(n => n.id === nodeId);
      if (!node) return false;

      if (node.type === 'organogram' && node.data.level === 0) {
        return false; // Não deletar CEO
      }

      return true;
    },
    [nodes]
  );

  return {
    // Criação e clonagem
    createTypedNode,
    cloneNode,
    duplicateSelectedNode,
    
    // Operações de nó
    deleteNodeWithConnections,
    moveNodeTo,
    groupNodes,
    
    // Consultas
    getConnectedNodes,
    canDeleteNode,
    
    // Estado
    selectedNodeId
  };
};

export default useNodeOperations;