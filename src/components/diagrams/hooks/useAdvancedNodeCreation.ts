import { useCallback, useMemo } from 'react';
import { XYPosition } from 'reactflow';
import { useDiagramStore } from '../stores/useDiagramStore';
import { DiagramNode, NodeCategory, NodeType } from '../types';
import { secureLogger } from '@/utils/secureLogger';
import { toast } from 'sonner';

// ============================================================================
// Tipos e Interfaces
// ============================================================================

export interface NodeTemplate {
  type: NodeType;
  label: string;
  description?: string;
  category: NodeCategory;
  defaultData: Record<string, any>;
  icon?: React.ReactNode;
  color?: string;
  size?: { width: number; height: number };
  constraints?: {
    maxConnections?: number;
    allowedParents?: NodeType[];
    allowedChildren?: NodeType[];
  };
}

export interface NodeCreationOptions {
  position?: XYPosition;
  parentId?: string;
  autoConnect?: boolean;
  autoLayout?: boolean;
  snapToGrid?: boolean;
  validatePlacement?: boolean;
  customData?: Record<string, any>;
}

export interface NodeValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// ============================================================================
// Templates de Nós Predefinidos
// ============================================================================

const NODE_TEMPLATES: Record<NodeType, NodeTemplate> = {
  // Flowchart/BPMN
  'start-event': {
    type: 'start-event',
    label: 'Evento de Início',
    description: 'Marca o início de um processo',
    category: 'flowchart',
    defaultData: {
      label: 'Início',
      shape: 'circle-perfect',
      color: '#22c55e',
      backgroundColor: '#dcfce7',
      borderColor: '#22c55e'
    },
    size: { width: 80, height: 80 },
    constraints: {
      maxConnections: 1,
      allowedChildren: ['task', 'gateway', 'end-event']
    }
  },
  'end-event': {
    type: 'end-event',
    label: 'Evento de Fim',
    description: 'Marca o fim de um processo',
    category: 'flowchart',
    defaultData: {
      label: 'Fim',
      shape: 'circle-perfect',
      color: '#ef4444',
      backgroundColor: '#fef2f2',
      borderColor: '#ef4444'
    },
    size: { width: 80, height: 80 },
    constraints: {
      maxConnections: 0,
      allowedParents: ['task', 'gateway', 'start-event']
    }
  },
  'task': {
    type: 'task',
    label: 'Tarefa',
    description: 'Uma atividade ou tarefa a ser executada',
    category: 'flowchart',
    defaultData: {
      label: 'Nova Tarefa',
      shape: 'rectangle-rounded',
      color: '#3b82f6',
      backgroundColor: '#eff6ff',
      borderColor: '#3b82f6'
    },
    size: { width: 120, height: 80 },
    constraints: {
      allowedParents: ['start-event', 'gateway', 'task'],
      allowedChildren: ['gateway', 'end-event', 'task']
    }
  },
  'gateway': {
    type: 'gateway',
    label: 'Gateway/Decisão',
    description: 'Ponto de decisão no fluxo',
    category: 'flowchart',
    defaultData: {
      label: 'Decisão',
      shape: 'diamond',
      color: '#f59e0b',
      backgroundColor: '#fefbeb',
      borderColor: '#f59e0b'
    },
    size: { width: 100, height: 100 },
    constraints: {
      allowedParents: ['start-event', 'task'],
      allowedChildren: ['task', 'end-event']
    }
  },
  'subprocess': {
    type: 'subprocess',
    label: 'Subprocesso',
    description: 'Um processo aninhado',
    category: 'flowchart',
    defaultData: {
      label: 'Subprocesso',
      shape: 'rectangle-rounded',
      color: '#8b5cf6',
      backgroundColor: '#f3f4f6',
      borderColor: '#8b5cf6'
    },
    size: { width: 140, height: 100 },
    constraints: {
      allowedParents: ['task', 'gateway'],
      allowedChildren: ['task', 'gateway', 'end-event']
    }
  },
  
  // Mind Map
  'central-topic': {
    type: 'central-topic',
    label: 'Tópico Central',
    description: 'O tema principal do mapa mental',
    category: 'mindmap',
    defaultData: {
      label: 'Tópico Central',
      shape: 'circle-perfect',
      color: '#6366f1',
      backgroundColor: '#eef2ff',
      borderColor: '#6366f1'
    },
    size: { width: 120, height: 120 },
    constraints: {
      maxConnections: 8,
      allowedChildren: ['main-topic', 'subtopic']
    }
  },
  'main-topic': {
    type: 'main-topic',
    label: 'Tópico Principal',
    description: 'Um tema principal derivado do central',
    category: 'mindmap',
    defaultData: {
      label: 'Tópico Principal',
      shape: 'rectangle-rounded',
      color: '#10b981',
      backgroundColor: '#ecfdf5',
      borderColor: '#10b981'
    },
    size: { width: 100, height: 60 },
    constraints: {
      allowedParents: ['central-topic'],
      allowedChildren: ['subtopic']
    }
  },
  'subtopic': {
    type: 'subtopic',
    label: 'Subtópico',
    description: 'Um subtema ou detalhe',
    category: 'mindmap',
    defaultData: {
      label: 'Subtópico',
      shape: 'rectangle-rounded',
      color: '#f59e0b',
      backgroundColor: '#fefbeb',
      borderColor: '#f59e0b'
    },
    size: { width: 80, height: 40 },
    constraints: {
      allowedParents: ['central-topic', 'main-topic', 'subtopic'],
      allowedChildren: ['subtopic']
    }
  },
  
  // Organogram
  'ceo': {
    type: 'ceo',
    label: 'CEO/Diretor',
    description: 'Cargo de liderança máxima',
    category: 'organogram',
    defaultData: {
      label: 'CEO',
      shape: 'rectangle-rounded',
      color: '#dc2626',
      backgroundColor: '#fef2f2',
      borderColor: '#dc2626'
    },
    size: { width: 120, height: 80 },
    constraints: {
      maxConnections: 6,
      allowedChildren: ['manager', 'director']
    }
  },
  'director': {
    type: 'director',
    label: 'Diretor',
    description: 'Cargo de direção',
    category: 'organogram',
    defaultData: {
      label: 'Diretor',
      shape: 'rectangle-rounded',
      color: '#ea580c',
      backgroundColor: '#fff7ed',
      borderColor: '#ea580c'
    },
    size: { width: 100, height: 70 },
    constraints: {
      allowedParents: ['ceo'],
      allowedChildren: ['manager', 'employee']
    }
  },
  'manager': {
    type: 'manager',
    label: 'Gerente',
    description: 'Cargo de gerência',
    category: 'organogram',
    defaultData: {
      label: 'Gerente',
      shape: 'rectangle-rounded',
      color: '#2563eb',
      backgroundColor: '#eff6ff',
      borderColor: '#2563eb'
    },
    size: { width: 90, height: 60 },
    constraints: {
      allowedParents: ['ceo', 'director'],
      allowedChildren: ['employee']
    }
  },
  'employee': {
    type: 'employee',
    label: 'Funcionário',
    description: 'Funcionário da organização',
    category: 'organogram',
    defaultData: {
      label: 'Funcionário',
      shape: 'rectangle-rounded',
      color: '#059669',
      backgroundColor: '#ecfdf5',
      borderColor: '#059669'
    },
    size: { width: 80, height: 50 },
    constraints: {
      allowedParents: ['director', 'manager']
    }
  }
};

// ============================================================================
// Hook Principal
// ============================================================================

export const useAdvancedNodeCreation = () => {
  const { 
    nodes, 
    edges, 
    addNode, 
    document,
    editor 
  } = useDiagramStore();

  // ============================================================================
  // Validação de Nós
  // ============================================================================

  const validateNodePlacement = useCallback((
    nodeType: NodeType,
    position: XYPosition,
    parentId?: string
  ): NodeValidationResult => {
    const template = NODE_TEMPLATES[nodeType];
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!template) {
      errors.push(`Template não encontrado para o tipo: ${nodeType}`);
      return { isValid: false, errors, warnings };
    }

    // Validar posição
    if (position.x < 0 || position.y < 0) {
      errors.push('Posição deve ser positiva');
    }

    // Validar sobreposição
    const overlapping = nodes.find(node => {
      const distance = Math.sqrt(
        Math.pow(node.position.x - position.x, 2) + 
        Math.pow(node.position.y - position.y, 2)
      );
      return distance < 50; // Distância mínima
    });

    if (overlapping) {
      warnings.push('Nó muito próximo de outro nó existente');
    }

    // Validar hierarquia (se parentId fornecido)
    if (parentId && template.constraints?.allowedParents) {
      const parent = nodes.find(n => n.id === parentId);
      if (parent && !template.constraints.allowedParents.includes(parent.type as NodeType)) {
        errors.push(`Tipo ${nodeType} não pode ser filho de ${parent.type}`);
      }
    }

    // Validar limites de conexão
    if (parentId && template.constraints?.maxConnections) {
      const parentConnections = edges.filter(e => e.source === parentId).length;
      if (parentConnections >= template.constraints.maxConnections) {
        errors.push('Nó pai atingiu o limite máximo de conexões');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }, [nodes, edges]);

  // ============================================================================
  // Criação Avançada de Nós
  // ============================================================================

  const createNode = useCallback(async (
    nodeType: NodeType,
    options: NodeCreationOptions = {}
  ) => {
    const template = NODE_TEMPLATES[nodeType];
    
    if (!template) {
      toast.error(`Template não encontrado para: ${nodeType}`);
      secureLogger.error('Template de nó não encontrado', { nodeType });
      return null;
    }

    // Determinar posição
    let position = options.position || { x: 200, y: 200 };
    
    // Auto-posicionamento se não especificado
    if (!options.position) {
      const existingNodes = nodes.filter(n => n.type === nodeType);
      position = {
        x: 200 + (existingNodes.length * 150),
        y: 200 + (existingNodes.length * 100)
      };
    }

    // Snap to grid se habilitado
    if (options.snapToGrid !== false && editor.snapToGrid) {
      position = {
        x: Math.round(position.x / editor.gridSize) * editor.gridSize,
        y: Math.round(position.y / editor.gridSize) * editor.gridSize
      };
    }

    // Validar posicionamento
    if (options.validatePlacement !== false) {
      const validation = validateNodePlacement(nodeType, position, options.parentId);
      
      if (!validation.isValid) {
        toast.error(`Erro na criação: ${validation.errors.join(', ')}`);
        return null;
      }
      
      if (validation.warnings.length > 0) {
        toast.warning(`Aviso: ${validation.warnings.join(', ')}`);
      }
    }

    // Criar dados do nó
    const nodeData: Omit<DiagramNode, 'id' | 'createdAt' | 'updatedAt' | 'version'> = {
      type: nodeType,
      position,
      data: {
        ...template.defaultData,
        ...options.customData
      },
      category: template.category
    };

    // Adicionar nó
    await addNode(nodeData);

    secureLogger.info('Nó criado com template avançado', {
      nodeType,
      position,
      template: template.label,
      options
    });

    toast.success(`${template.label} adicionado com sucesso!`);
    
    return nodeData;
  }, [nodes, editor, validateNodePlacement, addNode]);

  // ============================================================================
  // Criação em Lote
  // ============================================================================

  const createNodeSequence = useCallback((
    nodeTypes: NodeType[],
    startPosition: XYPosition = { x: 200, y: 200 },
    spacing: number = 150
  ) => {
    const createdNodes: DiagramNode[] = [];
    
    nodeTypes.forEach((nodeType, index) => {
      const position = {
        x: startPosition.x + (index * spacing),
        y: startPosition.y
      };
      
      const node = createNode(nodeType, { 
        position,
        validatePlacement: false // Evitar validação em sequência
      });
      
      if (node) {
        createdNodes.push(node as DiagramNode);
      }
    });
    
    toast.success(`Sequência de ${createdNodes.length} nós criada!`);
    return createdNodes;
  }, [createNode]);

  // ============================================================================
  // Templates Disponíveis
  // ============================================================================

  const getAvailableTemplates = useCallback((category?: NodeCategory) => {
    const templates = Object.values(NODE_TEMPLATES);
    return category ? templates.filter(t => t.category === category) : templates;
  }, []);

  const getTemplateByType = useCallback((nodeType: NodeType) => {
    return NODE_TEMPLATES[nodeType] || null;
  }, []);

  // ============================================================================
  // Memoizações
  // ============================================================================

  const templatesByCategory = useMemo(() => {
    const grouped: Record<NodeCategory, NodeTemplate[]> = {
      flowchart: [],
      mindmap: [],
      organogram: []
    };
    
    Object.values(NODE_TEMPLATES).forEach(template => {
      grouped[template.category].push(template);
    });
    
    return grouped;
  }, []);

  return {
    // Criação
    createNode,
    createNodeSequence,
    
    // Validação
    validateNodePlacement,
    
    // Templates
    getAvailableTemplates,
    getTemplateByType,
    templatesByCategory,
    
    // Dados
    nodeTemplates: NODE_TEMPLATES
  };
};

export default useAdvancedNodeCreation;