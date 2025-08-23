// ============================================================================
// Node Factory - Fábrica para criação dinâmica de nós
// ============================================================================

import { ComponentType } from 'react';
import { NodeProps } from 'reactflow';
import { 
  DiagramNode, 
  NodeType, 
  DiagramType,
  FlowchartNodeData,
  OrganogramNodeData,
  MindMapNodeData,
  BaseDiagramNodeData,
  DiagramNodeData
} from '../types';

// Importações lazy dos componentes de nó
import { lazy } from 'react';

const BaseNode = lazy(() => import('../nodes/BaseNode'));
const FlowchartNode = lazy(() => import('../nodes/FlowchartNode'));
const OrganogramNode = lazy(() => import('../nodes/OrganogramNode'));
const MindMapNode = lazy(() => import('../nodes/MindMapNode'));

// ============================================================================
// Types
// ============================================================================

export interface NodeFactoryConfig {
  type: NodeType;
  component: ComponentType<NodeProps>;
  defaultData: Partial<BaseDiagramNodeData>;
  category: DiagramType;
  displayName: string;
  description: string;
  icon?: string;
}

export interface CreateNodeOptions {
  type: NodeType;
  position: { x: number; y: number };
  data?: Partial<BaseDiagramNodeData>;
  id?: string;
}

// ============================================================================
// Configurações dos Tipos de Nó
// ============================================================================

const NODE_CONFIGS: Record<NodeType, NodeFactoryConfig> = {
  // Flowchart Nodes - BPMN Standard
  'flowchart-start': {
    type: 'flowchart-start',
    component: FlowchartNode,
    category: 'flowchart',
    displayName: 'Evento de Início',
    description: 'Evento que inicia o processo (círculo)',
    icon: 'Play',
    defaultData: {
      category: 'flowchart',
      label: 'Início',
      shape: 'circle',
      flowchartType: 'start',
      color: '#10B981',
      backgroundColor: '#ECFDF5',
      borderColor: '#10B981'
    } as Partial<FlowchartNodeData>
  },
  'flowchart-process': {
    type: 'flowchart-process',
    component: FlowchartNode,
    category: 'flowchart',
    displayName: 'Tarefa/Processo',
    description: 'Atividade ou tarefa do processo (retângulo)',
    icon: 'Square',
    defaultData: {
      category: 'flowchart',
      label: 'Processo',
      shape: 'rectangle',
      flowchartType: 'process',
      color: '#3B82F6',
      backgroundColor: '#EFF6FF',
      borderColor: '#3B82F6'
    } as Partial<FlowchartNodeData>
  },
  'flowchart-decision': {
    type: 'flowchart-decision',
    component: FlowchartNode,
    category: 'flowchart',
    displayName: 'Gateway/Decisão',
    description: 'Ponto de decisão no processo (losango)',
    icon: 'Diamond',
    defaultData: {
      category: 'flowchart',
      label: 'Decisão?',
      shape: 'diamond',
      flowchartType: 'decision',
      color: '#F59E0B',
      backgroundColor: '#FFFBEB',
      borderColor: '#F59E0B',
      conditions: { yes: 'Sim', no: 'Não' }
    } as Partial<FlowchartNodeData>
  },
  'flowchart-data': {
    type: 'flowchart-data',
    component: FlowchartNode,
    category: 'flowchart',
    displayName: 'Objeto de Dados',
    description: 'Dados ou documentos (paralelogramo)',
    icon: 'Database',
    defaultData: {
      category: 'flowchart',
      label: 'Dados',
      shape: 'parallelogram',
      flowchartType: 'data',
      color: '#8B5CF6',
      backgroundColor: '#F3E8FF',
      borderColor: '#8B5CF6'
    } as Partial<FlowchartNodeData>
  },
  'flowchart-end': {
    type: 'flowchart-end',
    component: FlowchartNode,
    category: 'flowchart',
    displayName: 'Evento de Fim',
    description: 'Evento que termina o processo (círculo)',
    icon: 'CheckCircle',
    defaultData: {
      category: 'flowchart',
      label: 'Fim',
      shape: 'circle',
      flowchartType: 'end',
      color: '#EF4444',
      backgroundColor: '#FEF2F2',
      borderColor: '#EF4444'
    } as Partial<FlowchartNodeData>
  },
  'flowchart-document': {
    type: 'flowchart-document',
    component: FlowchartNode,
    category: 'flowchart',
    displayName: 'Documento',
    description: 'Documento ou relatório',
    icon: 'FileText',
    defaultData: {
      category: 'flowchart',
      label: 'Documento',
      shape: 'rectangle',
      flowchartType: 'document',
      color: '#6B7280',
      backgroundColor: '#F9FAFB',
      borderColor: '#6B7280'
    } as Partial<FlowchartNodeData>
  },
  'flowchart-subprocess': {
    type: 'flowchart-subprocess',
    component: FlowchartNode,
    category: 'flowchart',
    displayName: 'Subprocesso',
    description: 'Subprocesso ou tarefa composta',
    icon: 'Hexagon',
    defaultData: {
      category: 'flowchart',
      label: 'Subprocesso',
      shape: 'rectangle',
      flowchartType: 'subprocess',
      color: '#059669',
      backgroundColor: '#ECFDF5',
      borderColor: '#059669'
    } as Partial<FlowchartNodeData>
  },
  'flowchart-connector': {
    type: 'flowchart-connector',
    component: FlowchartNode,
    category: 'flowchart',
    displayName: 'Conector',
    description: 'Conector ou referência',
    icon: 'Circle',
    defaultData: {
      category: 'flowchart',
      label: 'Conector',
      shape: 'circle',
      flowchartType: 'connector',
      color: '#6B7280',
      backgroundColor: '#F9FAFB',
      borderColor: '#6B7280'
    } as Partial<FlowchartNodeData>
  },
  'flowchart-annotation': {
    type: 'flowchart-annotation',
    component: FlowchartNode,
    category: 'flowchart',
    displayName: 'Anotação',
    description: 'Anotação ou comentário',
    icon: 'MessageSquare',
    defaultData: {
      category: 'flowchart',
      label: 'Anotação',
      shape: 'rectangle',
      flowchartType: 'annotation',
      color: '#6B7280',
      backgroundColor: '#F9FAFB',
      borderColor: '#6B7280'
    } as Partial<FlowchartNodeData>
  },
  'flowchart-parallel': {
    type: 'flowchart-parallel',
    component: FlowchartNode,
    category: 'flowchart',
    displayName: 'Gateway Paralelo',
    description: 'Gateway para execução paralela',
    icon: 'GitBranch',
    defaultData: {
      category: 'flowchart',
      label: '+',
      shape: 'diamond',
      flowchartType: 'parallel',
      color: '#7C3AED',
      backgroundColor: '#F3E8FF',
      borderColor: '#7C3AED'
    } as Partial<FlowchartNodeData>
  },
  'flowchart-inclusive': {
    type: 'flowchart-inclusive',
    component: FlowchartNode,
    category: 'flowchart',
    displayName: 'Gateway Inclusivo',
    description: 'Gateway para múltiplas condições',
    icon: 'Merge',
    defaultData: {
      category: 'flowchart',
      label: 'O',
      shape: 'diamond',
      flowchartType: 'inclusive',
      color: '#DC2626',
      backgroundColor: '#FEF2F2',
      borderColor: '#DC2626'
    } as Partial<FlowchartNodeData>
  },

  // Organogram Nodes
  'organogram-ceo': {
    type: 'organogram-ceo',
    component: OrganogramNode,
    category: 'organogram',
    displayName: 'CEO',
    description: 'Nó de CEO do organograma',
    icon: 'Crown',
    defaultData: {
      category: 'organogram',
      label: 'CEO',
      position: 'Chief Executive Officer',
      level: 0,
      department: 'Executivo',
      skills: ['Liderança', 'Estratégia', 'Visão'],
      reports: []
    } as Partial<OrganogramNodeData>
  },
  'organogram-director': {
    type: 'organogram-director',
    component: OrganogramNode,
    category: 'organogram',
    displayName: 'Diretor',
    description: 'Nó de diretor do organograma',
    icon: 'Building',
    defaultData: {
      category: 'organogram',
      label: 'Diretor',
      position: 'Diretor',
      level: 1,
      department: 'Diretoria',
      skills: ['Gestão', 'Planejamento'],
      reports: []
    } as Partial<OrganogramNodeData>
  },
  'organogram-manager': {
    type: 'organogram-manager',
    component: OrganogramNode,
    category: 'organogram',
    displayName: 'Gerente',
    description: 'Nó de gerente do organograma',
    icon: 'Users',
    defaultData: {
      category: 'organogram',
      label: 'Gerente',
      position: 'Gerente',
      level: 2,
      department: 'Gerência',
      skills: ['Coordenação', 'Supervisão'],
      reports: []
    } as Partial<OrganogramNodeData>
  },
  'organogram-employee': {
    type: 'organogram-employee',
    component: OrganogramNode,
    category: 'organogram',
    displayName: 'Funcionário',
    description: 'Nó de funcionário do organograma',
    icon: 'User',
    defaultData: {
      category: 'organogram',
      label: 'Funcionário',
      position: 'Funcionário',
      level: 4,
      department: 'Operacional',
      skills: [],
      reports: []
    } as Partial<OrganogramNodeData>
  },

  // MindMap Nodes
  'mindmap-central': {
    type: 'mindmap-central',
    component: MindMapNode,
    category: 'mindmap',
    displayName: 'Ideia Central',
    description: 'Nó central do mapa mental',
    icon: 'Brain',
    defaultData: {
      category: 'mindmap',
      label: 'Ideia Central',
      level: 0,
      keywords: [],
      connections: [],
      priority: 'high',
      color: '#8B5CF6'
    } as Partial<MindMapNodeData>
  },
  'mindmap-main': {
    type: 'mindmap-main',
    component: MindMapNode,
    category: 'mindmap',
    displayName: 'Ideia Principal',
    description: 'Nó principal do mapa mental',
    icon: 'Lightbulb',
    defaultData: {
      category: 'mindmap',
      label: 'Ideia Principal',
      level: 1,
      keywords: [],
      connections: [],
      priority: 'medium',
      color: '#3B82F6'
    } as Partial<MindMapNodeData>
  },
  'mindmap-secondary': {
    type: 'mindmap-secondary',
    component: MindMapNode,
    category: 'mindmap',
    displayName: 'Ideia Secundária',
    description: 'Nó secundário do mapa mental',
    icon: 'Star',
    defaultData: {
      category: 'mindmap',
      label: 'Ideia Secundária',
      level: 2,
      keywords: [],
      connections: [],
      priority: 'medium',
      color: '#10B981'
    } as Partial<MindMapNodeData>
  },
  'mindmap-leaf': {
    type: 'mindmap-leaf',
    component: MindMapNode,
    category: 'mindmap',
    displayName: 'Ideia Específica',
    description: 'Nó folha do mapa mental',
    icon: 'Target',
    defaultData: {
      category: 'mindmap',
      label: 'Ideia Específica',
      level: 3,
      keywords: [],
      connections: [],
      priority: 'low',
      color: '#F59E0B'
    } as Partial<MindMapNodeData>
  }
};

// ============================================================================
// Node Factory Class
// ============================================================================

export class NodeFactory {
  private static instance: NodeFactory;
  private nodeConfigs: Record<NodeType, NodeFactoryConfig>;

  private constructor() {
    this.nodeConfigs = NODE_CONFIGS;
  }

  public static getInstance(): NodeFactory {
    if (!NodeFactory.instance) {
      NodeFactory.instance = new NodeFactory();
    }
    return NodeFactory.instance;
  }

  /**
   * Cria um novo nó baseado no tipo especificado
   */
  public createNode(options: CreateNodeOptions): DiagramNode {
    const config = this.getNodeConfig(options.type);
    if (!config) {
      throw new Error(`Tipo de nó não suportado: ${options.type}`);
    }

    const nodeId = options.id || this.generateNodeId(options.type);
    const now = new Date().toISOString();

    return {
      id: nodeId,
      type: options.type,
      position: options.position,
      data: {
        ...config.defaultData,
        ...options.data,
        category: config.category
      } as BaseDiagramNodeData,
      category: config.category,
      createdAt: now,
      updatedAt: now,
      version: 1
    };
  }

  /**
   * Obtém a configuração de um tipo de nó
   */
  public getNodeConfig(type: NodeType): NodeFactoryConfig | null {
    return this.nodeConfigs[type] || null;
  }

  /**
   * Obtém o componente React para um tipo de nó
   */
  public getNodeComponent(type: NodeType): ComponentType<NodeProps> | null {
    const config = this.getNodeConfig(type);
    return config?.component || null;
  }

  /**
   * Obtém todos os tipos de nó disponíveis
   */
  public getAvailableNodeTypes(): NodeType[] {
    return Object.keys(this.nodeConfigs) as NodeType[];
  }

  /**
   * Obtém tipos de nó por categoria
   */
  public getNodeTypesByCategory(category: DiagramType): NodeType[] {
    return Object.entries(this.nodeConfigs)
      .filter(([_, config]) => config.category === category)
      .map(([type]) => type as NodeType);
  }

  /**
   * Obtém configurações de nó por categoria
   */
  public getNodeConfigsByCategory(category: DiagramType): NodeFactoryConfig[] {
    return Object.values(this.nodeConfigs)
      .filter(config => config.category === category);
  }

  /**
   * Registra um novo tipo de nó
   */
  public registerNodeType(type: NodeType, config: NodeFactoryConfig): void {
    this.nodeConfigs[type] = config;
  }

  /**
   * Remove um tipo de nó registrado
   */
  public unregisterNodeType(type: NodeType): void {
    delete this.nodeConfigs[type];
  }

  /**
   * Verifica se um tipo de nó é suportado
   */
  public isNodeTypeSupported(type: string): type is NodeType {
    return type in this.nodeConfigs;
  }

  /**
   * Clona um nó existente com nova posição
   */
  public cloneNode(node: DiagramNode, newPosition: { x: number; y: number }): DiagramNode {
    const newId = this.generateNodeId(node.type);
    const now = new Date().toISOString();

    return {
      ...node,
      id: newId,
      position: newPosition,
      data: {
        ...node.data,
        label: `${node.data.label} (Cópia)`
      },
      createdAt: now,
      updatedAt: now,
      version: 1
    };
  }

  /**
   * Gera um ID único para um nó
   */
  private generateNodeId(type: NodeType): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `${type}-${timestamp}-${random}`;
  }

  /**
   * Valida os dados de um nó
   */
  public validateNodeData(type: NodeType, data: Partial<DiagramNodeData>): boolean {
    const config = this.getNodeConfig(type);
    if (!config) return false;

    // Validações básicas
    if (!data.label || typeof data.label !== 'string') return false;
    if (!data.category || data.category !== config.category) return false;

    // Validações específicas por categoria
    switch (config.category) {
      case 'flowchart':
        return this.validateFlowchartData(data as FlowchartNodeData);
      case 'organogram':
        return this.validateOrganogramData(data as OrganogramNodeData);
      case 'mindmap':
        return this.validateMindMapData(data as MindMapNodeData);
      default:
        return true;
    }
  }

  private validateFlowchartData(data: FlowchartNodeData): boolean {
    const validShapes = ['rectangle', 'diamond', 'circle', 'hexagon', 'parallelogram'];
    const validTypes = ['start', 'process', 'decision', 'data', 'end'];
    
    return (
      (!data.shape || validShapes.includes(data.shape)) &&
      (!data.flowchartType || validTypes.includes(data.flowchartType))
    );
  }

  private validateOrganogramData(data: OrganogramNodeData): boolean {
    return (
      (!data.level || (typeof data.level === 'number' && data.level >= 0 && data.level <= 4)) &&
      (!data.skills || Array.isArray(data.skills)) &&
      (!data.reports || Array.isArray(data.reports))
    );
  }

  private validateMindMapData(data: MindMapNodeData): boolean {
    const validPriorities = ['low', 'medium', 'high'];
    
    return (
      (!data.level || (typeof data.level === 'number' && data.level >= 0 && data.level <= 4)) &&
      (!data.keywords || Array.isArray(data.keywords)) &&
      (!data.connections || Array.isArray(data.connections)) &&
      (!data.priority || validPriorities.includes(data.priority))
    );
  }
}

// ============================================================================
// Instância singleton e funções utilitárias
// ============================================================================

export const nodeFactory = NodeFactory.getInstance();

/**
 * Função utilitária para criar um nó
 */
export const createNode = (options: CreateNodeOptions): DiagramNode => {
  return nodeFactory.createNode(options);
};

/**
 * Função utilitária para obter componente de nó
 */
export const getNodeComponent = (type: NodeType): ComponentType<NodeProps> | null => {
  return nodeFactory.getNodeComponent(type);
};

/**
 * Função utilitária para obter tipos de nó por categoria
 */
export const getNodeTypesByCategory = (category: DiagramType): NodeType[] => {
  return nodeFactory.getNodeTypesByCategory(category);
};

/**
 * Função utilitária para validar dados de nó
 */
export const validateNodeData = (type: NodeType, data: Partial<DiagramNodeData>): boolean => {
  return nodeFactory.validateNodeData(type, data);
};

export default nodeFactory;