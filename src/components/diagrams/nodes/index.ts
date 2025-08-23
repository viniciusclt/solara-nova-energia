// ============================================================================
// Diagram Nodes - Centralized node exports and configuration with Lazy Loading
// ============================================================================

import { lazy, Suspense } from 'react';
import { NodeTypes } from 'reactflow';

// Import basic flowchart nodes (always loaded for performance)
import {
  StartNode as FlowchartStartNode,
  ProcessNode as FlowchartProcessNode,
  DecisionNode as FlowchartDecisionNode,
  EndNode as FlowchartEndNode,
  FlowchartNodesEnhanced
} from './flowchart';

// Lazy load specialized node families for better performance
const LazyFlowchartNode = lazy(() => import('./FlowchartNode').then(m => ({ default: m.default })));
const LazyMindMapNode = lazy(() => import('./MindMapNode').then(m => ({ default: m.default })));
const LazyOrganogramNode = lazy(() => import('./OrganogramNode').then(m => ({ default: m.default })));

// Legacy lazy imports for backward compatibility
const LazyFlowchartDocumentNode = lazy(() => import('./flowchart').then(m => ({ default: m.DocumentNode })));
const LazyFlowchartDataNode = lazy(() => import('./flowchart').then(m => ({ default: m.DataNode })));
const LazyFlowchartConnectorNode = lazy(() => import('./flowchart').then(m => ({ default: m.ConnectorNode })));
const LazyFlowchartSubprocessNode = lazy(() => import('./flowchart').then(m => ({ default: m.SubprocessNode })));

const LazyMindMapRootNode = lazy(() => import('./mindmap').then(m => ({ default: m.RootNode })));
const LazyMindMapBranchNode = lazy(() => import('./mindmap').then(m => ({ default: m.BranchNode })));
const LazyMindMapLeafNode = lazy(() => import('./mindmap').then(m => ({ default: m.LeafNode })));
const LazyMindMapIdeaNode = lazy(() => import('./mindmap').then(m => ({ default: m.IdeaNode })));

const LazyOrganogramCEONode = lazy(() => import('./organogram').then(m => ({ default: m.CEONode })));
const LazyOrganogramDirectorNode = lazy(() => import('./organogram').then(m => ({ default: m.DirectorNode })));
const LazyOrganogramManagerNode = lazy(() => import('./organogram').then(m => ({ default: m.ManagerNode })));
const LazyOrganogramTeamLeadNode = lazy(() => import('./organogram').then(m => ({ default: m.TeamLeadNode })));
const LazyOrganogramEmployeeNode = lazy(() => import('./organogram').then(m => ({ default: m.EmployeeNode })));
const LazyOrganogramDepartmentNode = lazy(() => import('./organogram').then(m => ({ default: m.DepartmentNode })));

// Wrapper component for lazy-loaded nodes with loading fallback
const createLazyNodeWrapper = (LazyComponent: React.LazyExoticComponent<React.ComponentType<unknown>>) => {
  return (props: unknown) => (
    <Suspense fallback={<div className="animate-pulse bg-gray-200 rounded-lg w-32 h-16 flex items-center justify-center text-xs text-gray-500">Carregando...</div>}>
      <LazyComponent {...props} />
    </Suspense>
  );
};

// Import legacy components for backward compatibility
import { nodeTypes as legacyFlowchartNodeTypes } from '../../flowchart/nodes';

// ============================================================================
// Node Types Mapping for ReactFlow
// ============================================================================

export const nodeTypes: NodeTypes = {
  // New specialized nodes (lazy loaded)
  'flowchart-node': createLazyNodeWrapper(LazyFlowchartNode),
  'mindmap-node': createLazyNodeWrapper(LazyMindMapNode),
  'organogram-node': createLazyNodeWrapper(LazyOrganogramNode),
  
  // Basic flowchart nodes (always loaded)
  'flowchart-start': FlowchartStartNode,
  'flowchart-process': FlowchartProcessNode,
  'flowchart-decision': FlowchartDecisionNode,
  'flowchart-end': FlowchartEndNode,
  
  // Advanced flowchart nodes (lazy loaded)
  'flowchart-document': createLazyNodeWrapper(LazyFlowchartDocumentNode),
  'flowchart-data': createLazyNodeWrapper(LazyFlowchartDataNode),
  'flowchart-connector': createLazyNodeWrapper(LazyFlowchartConnectorNode),
  'flowchart-subprocess': createLazyNodeWrapper(LazyFlowchartSubprocessNode),

  // Legacy flowchart nodes (for backward compatibility)
  ...legacyFlowchartNodeTypes,

  // MindMap nodes (lazy loaded)
  'mindmap-root': createLazyNodeWrapper(LazyMindMapRootNode),
  'mindmap-branch': createLazyNodeWrapper(LazyMindMapBranchNode),
  'mindmap-leaf': createLazyNodeWrapper(LazyMindMapLeafNode),
  'mindmap-idea': createLazyNodeWrapper(LazyMindMapIdeaNode),

  // Organogram nodes (lazy loaded)
  'organogram-ceo': createLazyNodeWrapper(LazyOrganogramCEONode),
  'organogram-director': createLazyNodeWrapper(LazyOrganogramDirectorNode),
  'organogram-manager': createLazyNodeWrapper(LazyOrganogramManagerNode),
  'organogram-teamlead': createLazyNodeWrapper(LazyOrganogramTeamLeadNode),
  'organogram-employee': createLazyNodeWrapper(LazyOrganogramEmployeeNode),
  'organogram-department': createLazyNodeWrapper(LazyOrganogramDepartmentNode)
};

// Enhanced node types for new architecture with lazy loading
export const enhancedNodeTypes: NodeTypes = {
  // Enhanced flowchart nodes (basic ones always loaded)
  'flowchart-start': FlowchartNodesEnhanced.StartNode,
  'flowchart-process': FlowchartNodesEnhanced.ProcessNode,
  'flowchart-decision': FlowchartNodesEnhanced.DecisionNode,
  'flowchart-end': FlowchartNodesEnhanced.EndNode,
  
  // Enhanced flowchart nodes (advanced ones lazy loaded)
  'flowchart-document': createLazyNodeWrapper(lazy(() => import('./flowchart').then(m => ({ default: m.FlowchartNodesEnhanced.DocumentNode })))),
  'flowchart-data': createLazyNodeWrapper(lazy(() => import('./flowchart').then(m => ({ default: m.FlowchartNodesEnhanced.DataNode })))),
  'flowchart-connector': createLazyNodeWrapper(lazy(() => import('./flowchart').then(m => ({ default: m.FlowchartNodesEnhanced.ConnectorNode })))),
  'flowchart-subprocess': createLazyNodeWrapper(lazy(() => import('./flowchart').then(m => ({ default: m.FlowchartNodesEnhanced.SubprocessNode })))),

  // MindMap nodes (lazy loaded)
  'mindmap-root': createLazyNodeWrapper(LazyMindMapRootNode),
  'mindmap-branch': createLazyNodeWrapper(LazyMindMapBranchNode),
  'mindmap-leaf': createLazyNodeWrapper(LazyMindMapLeafNode),
  'mindmap-idea': createLazyNodeWrapper(LazyMindMapIdeaNode),

  // Organogram nodes (lazy loaded)
  'organogram-ceo': createLazyNodeWrapper(LazyOrganogramCEONode),
  'organogram-director': createLazyNodeWrapper(LazyOrganogramDirectorNode),
  'organogram-manager': createLazyNodeWrapper(LazyOrganogramManagerNode),
  'organogram-teamlead': createLazyNodeWrapper(LazyOrganogramTeamLeadNode),
  'organogram-employee': createLazyNodeWrapper(LazyOrganogramEmployeeNode),
  'organogram-department': createLazyNodeWrapper(LazyOrganogramDepartmentNode)
};

// ============================================================================
// Individual Node Exports (with lazy loading optimization)
// ============================================================================

// Basic flowchart nodes (always loaded)
export {
  FlowchartStartNode as StartNode,
  FlowchartProcessNode as ProcessNode,
  FlowchartDecisionNode as DecisionNode,
  FlowchartEndNode as EndNode,
  FlowchartNodesEnhanced as FlowchartNodes
};

// Advanced flowchart nodes (lazy loaded)
export const DocumentNode = createLazyNodeWrapper(LazyFlowchartDocumentNode);
export const DataNode = createLazyNodeWrapper(LazyFlowchartDataNode);
export const ConnectorNode = createLazyNodeWrapper(LazyFlowchartConnectorNode);
export const SubprocessNode = createLazyNodeWrapper(LazyFlowchartSubprocessNode);

export type {
  FlowchartNodeData,
  FlowchartNodeProps
} from './flowchart';

// MindMap nodes (lazy loaded)
export const RootNode = createLazyNodeWrapper(LazyMindMapRootNode);
export const BranchNode = createLazyNodeWrapper(LazyMindMapBranchNode);
export const LeafNode = createLazyNodeWrapper(LazyMindMapLeafNode);
export const IdeaNode = createLazyNodeWrapper(LazyMindMapIdeaNode);

export type {
  MindMapNodeData,
  MindMapNodeProps
} from './mindmap';

// Organogram nodes (lazy loaded)
export const CEONode = createLazyNodeWrapper(LazyOrganogramCEONode);
export const DirectorNode = createLazyNodeWrapper(LazyOrganogramDirectorNode);
export const ManagerNode = createLazyNodeWrapper(LazyOrganogramManagerNode);
export const TeamLeadNode = createLazyNodeWrapper(LazyOrganogramTeamLeadNode);
export const EmployeeNode = createLazyNodeWrapper(LazyOrganogramEmployeeNode);
export const DepartmentNode = createLazyNodeWrapper(LazyOrganogramDepartmentNode);

export type {
  OrganogramNodeData,
  OrganogramNodeProps
} from './organogram';

// New specialized components
export const FlowchartNode = createLazyNodeWrapper(LazyFlowchartNode);
export const MindMapNode = createLazyNodeWrapper(LazyMindMapNode);
export const OrganogramNode = createLazyNodeWrapper(LazyOrganogramNode);

// ============================================================================
// Configurações de Nós por Categoria
// ============================================================================

export const NODE_CATEGORIES = {
  flowchart: {
    label: 'Fluxograma',
    description: 'Nós para criação de fluxogramas e processos',
    nodes: [
      {
        type: 'flowchart-start',
        label: 'Início',
        description: 'Ponto de início do fluxo',
        icon: 'Play',
        category: 'basic'
      },
      {
        type: 'flowchart-process',
        label: 'Processo',
        description: 'Etapa de processamento',
        icon: 'Square',
        category: 'basic'
      },
      {
        type: 'flowchart-decision',
        label: 'Decisão',
        description: 'Ponto de decisão/condição',
        icon: 'Diamond',
        category: 'basic'
      },
      {
        type: 'flowchart-end',
        label: 'Fim',
        description: 'Ponto final do fluxo',
        icon: 'Square',
        category: 'basic'
      },
      {
        type: 'flowchart-document',
        label: 'Documento',
        description: 'Documento ou relatório',
        icon: 'FileText',
        category: 'advanced'
      },
      {
        type: 'flowchart-data',
        label: 'Dados',
        description: 'Entrada ou saída de dados',
        icon: 'Database',
        category: 'advanced'
      },
      {
        type: 'flowchart-connector',
        label: 'Conector',
        description: 'Conector para fluxos complexos',
        icon: 'Circle',
        category: 'advanced'
      },
      {
        type: 'flowchart-subprocess',
        label: 'Subprocesso',
        description: 'Processo aninhado',
        icon: 'Layers',
        category: 'advanced'
      }
    ]
  },
  
  mindmap: {
    label: 'Mapa Mental',
    description: 'Nós para criação de mapas mentais',
    nodes: [
      {
        type: 'mindmap-root',
        label: 'Tópico Central',
        description: 'Ideia principal do mapa mental',
        icon: 'Brain',
        category: 'basic'
      },
      {
        type: 'mindmap-branch',
        label: 'Ramo',
        description: 'Tópico secundário',
        icon: 'GitBranch',
        category: 'basic'
      },
      {
        type: 'mindmap-leaf',
        label: 'Folha',
        description: 'Subtópico ou detalhe',
        icon: 'Leaf',
        category: 'basic'
      },
      {
        type: 'mindmap-idea',
        label: 'Ideia',
        description: 'Nova ideia ou insight',
        icon: 'Lightbulb',
        category: 'advanced'
      }
    ]
  },
  
  organogram: {
    label: 'Organograma',
    description: 'Nós para estruturas organizacionais',
    nodes: [
      {
        type: 'organogram-ceo',
        label: 'CEO/Presidente',
        description: 'Cargo executivo principal',
        icon: 'Crown',
        category: 'executive'
      },
      {
        type: 'organogram-director',
        label: 'Diretor',
        description: 'Cargo de diretoria',
        icon: 'Shield',
        category: 'executive'
      },
      {
        type: 'organogram-manager',
        label: 'Gerente',
        description: 'Cargo de gerência',
        icon: 'UserCheck',
        category: 'management'
      },
      {
        type: 'organogram-teamlead',
        label: 'Líder de Equipe',
        description: 'Liderança de equipe',
        icon: 'Users',
        category: 'management'
      },
      {
        type: 'organogram-employee',
        label: 'Funcionário',
        description: 'Colaborador individual',
        icon: 'User',
        category: 'staff'
      },
      {
        type: 'organogram-department',
        label: 'Departamento',
        description: 'Unidade organizacional',
        icon: 'Building',
        category: 'structure'
      }
    ]
  }
};

// ============================================================================
// Utilitários para Nós
// ============================================================================

/**
 * Obtém a configuração de um tipo de nó
 */
export const getNodeConfig = (nodeType: string) => {
  for (const category of Object.values(NODE_CATEGORIES)) {
    const node = category.nodes.find(n => n.type === nodeType);
    if (node) {
      return {
        ...node,
        categoryLabel: category.label,
        categoryDescription: category.description
      };
    }
  }
  return null;
};

/**
 * Obtém todos os tipos de nós de uma categoria
 */
export const getNodesByCategory = (categoryKey: keyof typeof NODE_CATEGORIES) => {
  return NODE_CATEGORIES[categoryKey]?.nodes || [];
};

/**
 * Obtém todos os tipos de nós disponíveis
 */
export const getAllNodeTypes = () => {
  return Object.values(NODE_CATEGORIES).flatMap(category => category.nodes);
};

/**
 * Verifica se um tipo de nó existe
 */
export const isValidNodeType = (nodeType: string): boolean => {
  return nodeType in nodeTypes;
};

/**
 * Obtém dados padrão para um tipo de nó
 */
export const getDefaultNodeData = (nodeType: string) => {
  const config = getNodeConfig(nodeType);
  if (!config) return {};

  // Dados base comuns
  const baseData = {
    label: config.label,
    editable: true
  };

  // Dados específicos por categoria
  if (nodeType.startsWith('flowchart-')) {
    return {
      ...baseData,
      description: '',
      color: '#3b82f6'
    };
  }
  
  if (nodeType.startsWith('mindmap-')) {
    return {
      ...baseData,
      level: nodeType === 'mindmap-root' ? 0 : 1,
      tags: [],
      priority: 'medium' as const
    };
  }
  
  if (nodeType.startsWith('organogram-')) {
    const levelMap: Record<string, number> = {
      'organogram-ceo': 0,
      'organogram-director': 1,
      'organogram-manager': 2,
      'organogram-teamlead': 3,
      'organogram-employee': 4,
      'organogram-department': 0
    };
    
    return {
      name: config.label,
      position: config.label,
      level: levelMap[nodeType] || 4,
      status: 'active' as const,
      editable: true
    };
  }

  return baseData;
};