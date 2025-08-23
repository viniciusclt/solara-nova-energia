// ============================================================================
// Templates Module - Índice de exportações
// ============================================================================
// Centraliza todas as exportações relacionadas a templates de diagramas
// Facilita importações e mantém organização modular
// ============================================================================

// ============================================================================
// SERVIÇOS
// ============================================================================

export {
  diagramTemplateService,
  type DiagramTemplate,
  type TemplateCategory,
  type TemplateFilter,
  type TemplateDifficulty,
  type TemplateMetadata
} from '../services/DiagramTemplateService';

// ============================================================================
// HOOKS
// ============================================================================

export {
  useTemplates,
  type UseTemplatesOptions,
  type UseTemplatesReturn
} from '../hooks/useTemplates';

// ============================================================================
// COMPONENTES
// ============================================================================

export {
  TemplateGallery,
  type TemplateGalleryProps
} from '../components/TemplateGallery';

export {
  TemplateGalleryModal,
  type TemplateGalleryModalProps
} from '../components/TemplateGalleryModal';

// ============================================================================
// UTILITÁRIOS
// ============================================================================

/**
 * Função utilitária para criar um template básico
 */
export const createBasicTemplate = (
  name: string,
  type: 'flowchart' | 'mindmap' | 'organogram',
  description?: string
): Omit<DiagramTemplate, 'id' | 'metadata'> => {
  const baseNodes = {
    flowchart: [
      {
        id: 'start',
        type: 'bpmnStart',
        position: { x: 250, y: 50 },
        data: { label: 'Início' }
      },
      {
        id: 'process',
        type: 'bpmnTask',
        position: { x: 250, y: 150 },
        data: { label: 'Processo' }
      },
      {
        id: 'end',
        type: 'bpmnEnd',
        position: { x: 250, y: 250 },
        data: { label: 'Fim' }
      }
    ],
    mindmap: [
      {
        id: 'central',
        type: 'mindmapCentral',
        position: { x: 250, y: 150 },
        data: { label: 'Ideia Central' }
      },
      {
        id: 'branch1',
        type: 'mindmapBranch',
        position: { x: 100, y: 100 },
        data: { label: 'Ramo 1' }
      },
      {
        id: 'branch2',
        type: 'mindmapBranch',
        position: { x: 400, y: 100 },
        data: { label: 'Ramo 2' }
      }
    ],
    organogram: [
      {
        id: 'ceo',
        type: 'orgChartExecutive',
        position: { x: 250, y: 50 },
        data: { label: 'CEO', subtitle: 'Diretor Executivo' }
      },
      {
        id: 'manager1',
        type: 'orgChartManager',
        position: { x: 150, y: 150 },
        data: { label: 'Gerente 1', subtitle: 'Departamento A' }
      },
      {
        id: 'manager2',
        type: 'orgChartManager',
        position: { x: 350, y: 150 },
        data: { label: 'Gerente 2', subtitle: 'Departamento B' }
      }
    ]
  };

  const baseEdges = {
    flowchart: [
      {
        id: 'e1',
        source: 'start',
        target: 'process',
        type: 'smoothstep'
      },
      {
        id: 'e2',
        source: 'process',
        target: 'end',
        type: 'smoothstep'
      }
    ],
    mindmap: [
      {
        id: 'e1',
        source: 'central',
        target: 'branch1',
        type: 'mindmapEdge'
      },
      {
        id: 'e2',
        source: 'central',
        target: 'branch2',
        type: 'mindmapEdge'
      }
    ],
    organogram: [
      {
        id: 'e1',
        source: 'ceo',
        target: 'manager1',
        type: 'orgChartEdge'
      },
      {
        id: 'e2',
        source: 'ceo',
        target: 'manager2',
        type: 'orgChartEdge'
      }
    ]
  };

  return {
    name,
    description: description || `Template básico de ${type}`,
    type: type as any,
    category: 'basic',
    difficulty: 'beginner',
    tags: ['básico', type],
    thumbnail: '',
    data: {
      nodes: baseNodes[type],
      edges: baseEdges[type],
      viewport: { x: 0, y: 0, zoom: 1 }
    }
  };
};

/**
 * Função utilitária para validar um template
 */
export const validateTemplate = (template: DiagramTemplate): boolean => {
  try {
    // Validações básicas
    if (!template.id || !template.name || !template.type) {
      return false;
    }

    // Validar dados do diagrama
    if (!template.data || !Array.isArray(template.data.nodes) || !Array.isArray(template.data.edges)) {
      return false;
    }

    // Validar nós
    for (const node of template.data.nodes) {
      if (!node.id || !node.type || !node.position || !node.data) {
        return false;
      }
    }

    // Validar arestas
    for (const edge of template.data.edges) {
      if (!edge.id || !edge.source || !edge.target) {
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Erro ao validar template:', error);
    return false;
  }
};

/**
 * Função utilitária para clonar um template
 */
export const cloneTemplate = (template: DiagramTemplate, newName?: string): DiagramTemplate => {
  const cloned = JSON.parse(JSON.stringify(template));
  
  // Gerar novo ID
  cloned.id = `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Atualizar nome se fornecido
  if (newName) {
    cloned.name = newName;
  } else {
    cloned.name = `${template.name} (Cópia)`;
  }
  
  // Atualizar metadados
  cloned.metadata = {
    ...cloned.metadata,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    downloads: 0,
    rating: 0,
    ratingCount: 0,
    isFeatured: false,
    isPopular: false
  };
  
  return cloned;
};

// ============================================================================
// CONSTANTES
// ============================================================================

export const TEMPLATE_CATEGORIES = [
  'basic',
  'business',
  'education',
  'technology',
  'healthcare',
  'finance',
  'marketing',
  'project-management'
] as const;

export const TEMPLATE_DIFFICULTIES = [
  'beginner',
  'intermediate',
  'advanced'
] as const;

export const TEMPLATE_TYPES = [
  'flowchart',
  'mindmap',
  'organogram'
] as const;