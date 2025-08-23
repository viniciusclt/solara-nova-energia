// ============================================================================
// Diagram Template Service - Serviço de Templates de Diagramas
// ============================================================================
// Gerenciamento centralizado de templates predefinidos para diferentes tipos de diagramas
// Suporte para Flowchart, MindMap e Organogram com layouts otimizados
// ============================================================================

import { DiagramType, DiagramData, DiagramNode, DiagramEdge } from '../types';

// ============================================================================
// INTERFACES
// ============================================================================

export interface DiagramTemplate {
  id: string;
  name: string;
  description: string;
  type: DiagramType;
  category: TemplateCategory;
  preview: string; // Emoji ou URL da imagem
  thumbnail?: string;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number; // em minutos
  data: DiagramData;
  metadata: {
    author: string;
    version: string;
    createdAt: string;
    updatedAt: string;
    downloads: number;
    rating: number;
    isPopular: boolean;
    isFeatured: boolean;
  };
}

export type TemplateCategory = 
  | 'basic'
  | 'business'
  | 'process'
  | 'decision'
  | 'planning'
  | 'creative'
  | 'corporate'
  | 'department'
  | 'technical'
  | 'educational';

export interface TemplateFilter {
  type?: DiagramType;
  category?: TemplateCategory;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  tags?: string[];
  search?: string;
}

// ============================================================================
// TEMPLATES PREDEFINIDOS
// ============================================================================

const FLOWCHART_TEMPLATES: DiagramTemplate[] = [
  {
    id: 'flowchart-basic',
    name: 'Fluxograma Básico',
    description: 'Template simples para processos lineares',
    type: 'flowchart',
    category: 'basic',
    preview: '🔄',
    tags: ['básico', 'processo', 'linear'],
    difficulty: 'beginner',
    estimatedTime: 10,
    data: {
      title: 'Novo Fluxograma',
      type: 'flowchart',
      nodes: [
        {
          id: 'start-1',
          type: 'flowchart-start',
          position: { x: 250, y: 50 },
          data: { 
            label: 'Início', 
            color: '#10b981', 
            backgroundColor: '#d1fae5',
            description: 'Ponto de início do processo'
          }
        },
        {
          id: 'process-1',
          type: 'flowchart-process',
          position: { x: 250, y: 150 },
          data: { 
            label: 'Processo Principal', 
            color: '#3b82f6', 
            backgroundColor: '#dbeafe',
            description: 'Etapa principal do processo'
          }
        },
        {
          id: 'decision-1',
          type: 'flowchart-decision',
          position: { x: 250, y: 250 },
          data: { 
            label: 'Decisão?', 
            color: '#f59e0b', 
            backgroundColor: '#fef3c7',
            description: 'Ponto de decisão'
          }
        },
        {
          id: 'end-1',
          type: 'flowchart-end',
          position: { x: 250, y: 350 },
          data: { 
            label: 'Fim', 
            color: '#ef4444', 
            backgroundColor: '#fee2e2',
            description: 'Fim do processo'
          }
        }
      ],
      edges: [
        { id: 'e1', source: 'start-1', target: 'process-1', type: 'straight', label: '' },
        { id: 'e2', source: 'process-1', target: 'decision-1', type: 'straight', label: '' },
        { id: 'e3', source: 'decision-1', target: 'end-1', type: 'straight', label: 'Sim' }
      ]
    },
    metadata: {
      author: 'Sistema',
      version: '1.0',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      downloads: 0,
      rating: 5.0,
      isPopular: true,
      isFeatured: true
    }
  },
  {
    id: 'flowchart-approval',
    name: 'Processo de Aprovação',
    description: 'Fluxo completo de aprovação com múltiplas decisões',
    type: 'flowchart',
    category: 'business',
    preview: '✅',
    tags: ['aprovação', 'negócio', 'decisão', 'workflow'],
    difficulty: 'intermediate',
    estimatedTime: 20,
    data: {
      title: 'Processo de Aprovação',
      type: 'flowchart',
      nodes: [
        {
          id: 'start-2',
          type: 'flowchart-start',
          position: { x: 250, y: 50 },
          data: { label: 'Solicitação', color: '#10b981', backgroundColor: '#d1fae5' }
        },
        {
          id: 'review-1',
          type: 'flowchart-process',
          position: { x: 250, y: 150 },
          data: { label: 'Análise Inicial', color: '#3b82f6', backgroundColor: '#dbeafe' }
        },
        {
          id: 'decision-2',
          type: 'flowchart-decision',
          position: { x: 250, y: 250 },
          data: { label: 'Aprovado?', color: '#f59e0b', backgroundColor: '#fef3c7' }
        },
        {
          id: 'approved',
          type: 'flowchart-end',
          position: { x: 150, y: 350 },
          data: { label: 'Aprovado', color: '#10b981', backgroundColor: '#d1fae5' }
        },
        {
          id: 'rejected',
          type: 'flowchart-end',
          position: { x: 350, y: 350 },
          data: { label: 'Rejeitado', color: '#ef4444', backgroundColor: '#fee2e2' }
        }
      ],
      edges: [
        { id: 'e1', source: 'start-2', target: 'review-1', type: 'straight' },
        { id: 'e2', source: 'review-1', target: 'decision-2', type: 'straight' },
        { id: 'e3', source: 'decision-2', target: 'approved', type: 'straight', label: 'Sim' },
        { id: 'e4', source: 'decision-2', target: 'rejected', type: 'straight', label: 'Não' }
      ]
    },
    metadata: {
      author: 'Sistema',
      version: '1.0',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      downloads: 0,
      rating: 4.8,
      isPopular: true,
      isFeatured: false
    }
  }
];

const MINDMAP_TEMPLATES: DiagramTemplate[] = [
  {
    id: 'mindmap-basic',
    name: 'Mapa Mental Básico',
    description: 'Template simples para brainstorming e organização de ideias',
    type: 'mindmap',
    category: 'basic',
    preview: '🧠',
    tags: ['básico', 'brainstorming', 'ideias'],
    difficulty: 'beginner',
    estimatedTime: 15,
    data: {
      title: 'Novo Mapa Mental',
      type: 'mindmap',
      nodes: [
        {
          id: 'root-1',
          type: 'mindmap-central',
          position: { x: 400, y: 200 },
          data: { 
            label: 'Ideia Central', 
            color: '#8b5cf6', 
            backgroundColor: '#f3e8ff',
            fontSize: 18,
            fontWeight: 'bold'
          }
        },
        {
          id: 'branch-1',
          type: 'mindmap-main',
          position: { x: 200, y: 100 },
          data: { label: 'Tópico 1', color: '#06b6d4', backgroundColor: '#cffafe' }
        },
        {
          id: 'branch-2',
          type: 'mindmap-main',
          position: { x: 600, y: 100 },
          data: { label: 'Tópico 2', color: '#84cc16', backgroundColor: '#ecfccb' }
        },
        {
          id: 'branch-3',
          type: 'mindmap-main',
          position: { x: 200, y: 300 },
          data: { label: 'Tópico 3', color: '#f97316', backgroundColor: '#fed7aa' }
        },
        {
          id: 'branch-4',
          type: 'mindmap-main',
          position: { x: 600, y: 300 },
          data: { label: 'Tópico 4', color: '#ef4444', backgroundColor: '#fee2e2' }
        }
      ],
      edges: [
        { id: 'e1', source: 'root-1', target: 'branch-1', type: 'mindmap-curve' },
        { id: 'e2', source: 'root-1', target: 'branch-2', type: 'mindmap-curve' },
        { id: 'e3', source: 'root-1', target: 'branch-3', type: 'mindmap-curve' },
        { id: 'e4', source: 'root-1', target: 'branch-4', type: 'mindmap-curve' }
      ]
    },
    metadata: {
      author: 'Sistema',
      version: '1.0',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      downloads: 0,
      rating: 4.9,
      isPopular: true,
      isFeatured: true
    }
  },
  {
    id: 'mindmap-project',
    name: 'Planejamento de Projeto',
    description: 'Template estruturado para planejamento e gestão de projetos',
    type: 'mindmap',
    category: 'planning',
    preview: '📋',
    tags: ['projeto', 'planejamento', 'gestão', 'organização'],
    difficulty: 'intermediate',
    estimatedTime: 25,
    data: {
      title: 'Planejamento de Projeto',
      type: 'mindmap',
      nodes: [
        {
          id: 'project-root',
          type: 'mindmap-central',
          position: { x: 400, y: 250 },
          data: { 
            label: 'Projeto', 
            color: '#8b5cf6', 
            backgroundColor: '#f3e8ff',
            fontSize: 20,
            fontWeight: 'bold'
          }
        },
        {
          id: 'objectives',
          type: 'mindmap-main',
          position: { x: 200, y: 150 },
          data: { label: 'Objetivos', color: '#10b981', backgroundColor: '#d1fae5' }
        },
        {
          id: 'resources',
          type: 'mindmap-main',
          position: { x: 600, y: 150 },
          data: { label: 'Recursos', color: '#f59e0b', backgroundColor: '#fef3c7' }
        },
        {
          id: 'timeline',
          type: 'mindmap-main',
          position: { x: 200, y: 350 },
          data: { label: 'Cronograma', color: '#3b82f6', backgroundColor: '#dbeafe' }
        },
        {
          id: 'risks',
          type: 'mindmap-main',
          position: { x: 600, y: 350 },
          data: { label: 'Riscos', color: '#ef4444', backgroundColor: '#fee2e2' }
        }
      ],
      edges: [
        { id: 'e1', source: 'project-root', target: 'objectives', type: 'mindmap-curve' },
        { id: 'e2', source: 'project-root', target: 'resources', type: 'mindmap-curve' },
        { id: 'e3', source: 'project-root', target: 'timeline', type: 'mindmap-curve' },
        { id: 'e4', source: 'project-root', target: 'risks', type: 'mindmap-curve' }
      ]
    },
    metadata: {
      author: 'Sistema',
      version: '1.0',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      downloads: 0,
      rating: 4.7,
      isPopular: false,
      isFeatured: true
    }
  }
];

const ORGANOGRAM_TEMPLATES: DiagramTemplate[] = [
  {
    id: 'organogram-basic',
    name: 'Organograma Básico',
    description: 'Estrutura organizacional simples com hierarquia básica',
    type: 'organogram',
    category: 'basic',
    preview: '👥',
    tags: ['básico', 'hierarquia', 'organização'],
    difficulty: 'beginner',
    estimatedTime: 15,
    data: {
      title: 'Organograma Básico',
      type: 'organogram',
      nodes: [
        {
          id: 'ceo-1',
          type: 'org-ceo',
          position: { x: 400, y: 50 },
          data: { 
            label: 'CEO', 
            color: '#8b5cf6', 
            backgroundColor: '#f3e8ff',
            subtitle: 'Diretor Executivo'
          }
        },
        {
          id: 'manager-1',
          type: 'org-manager',
          position: { x: 250, y: 200 },
          data: { 
            label: 'Gerente A', 
            color: '#3b82f6', 
            backgroundColor: '#dbeafe',
            subtitle: 'Departamento A'
          }
        },
        {
          id: 'manager-2',
          type: 'org-manager',
          position: { x: 550, y: 200 },
          data: { 
            label: 'Gerente B', 
            color: '#3b82f6', 
            backgroundColor: '#dbeafe',
            subtitle: 'Departamento B'
          }
        },
        {
          id: 'employee-1',
          type: 'org-employee',
          position: { x: 150, y: 350 },
          data: { 
            label: 'Funcionário 1', 
            color: '#10b981', 
            backgroundColor: '#d1fae5'
          }
        },
        {
          id: 'employee-2',
          type: 'org-employee',
          position: { x: 350, y: 350 },
          data: { 
            label: 'Funcionário 2', 
            color: '#10b981', 
            backgroundColor: '#d1fae5'
          }
        },
        {
          id: 'employee-3',
          type: 'org-employee',
          position: { x: 450, y: 350 },
          data: { 
            label: 'Funcionário 3', 
            color: '#10b981', 
            backgroundColor: '#d1fae5'
          }
        },
        {
          id: 'employee-4',
          type: 'org-employee',
          position: { x: 650, y: 350 },
          data: { 
            label: 'Funcionário 4', 
            color: '#10b981', 
            backgroundColor: '#d1fae5'
          }
        }
      ],
      edges: [
        { id: 'e1', source: 'ceo-1', target: 'manager-1', type: 'org-hierarchy' },
        { id: 'e2', source: 'ceo-1', target: 'manager-2', type: 'org-hierarchy' },
        { id: 'e3', source: 'manager-1', target: 'employee-1', type: 'org-hierarchy' },
        { id: 'e4', source: 'manager-1', target: 'employee-2', type: 'org-hierarchy' },
        { id: 'e5', source: 'manager-2', target: 'employee-3', type: 'org-hierarchy' },
        { id: 'e6', source: 'manager-2', target: 'employee-4', type: 'org-hierarchy' }
      ]
    },
    metadata: {
      author: 'Sistema',
      version: '1.0',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      downloads: 0,
      rating: 4.6,
      isPopular: true,
      isFeatured: true
    }
  },
  {
    id: 'organogram-corporate',
    name: 'Organograma Corporativo',
    description: 'Estrutura organizacional completa para empresas médias e grandes',
    type: 'organogram',
    category: 'corporate',
    preview: '🏢',
    tags: ['corporativo', 'empresa', 'estrutura', 'departamentos'],
    difficulty: 'advanced',
    estimatedTime: 35,
    data: {
      title: 'Organograma Corporativo',
      type: 'organogram',
      nodes: [
        {
          id: 'board',
          type: 'org-ceo',
          position: { x: 400, y: 50 },
          data: { 
            label: 'Conselho', 
            color: '#8b5cf6', 
            backgroundColor: '#f3e8ff',
            subtitle: 'Conselho Administrativo'
          }
        },
        {
          id: 'ceo-2',
          type: 'org-ceo',
          position: { x: 400, y: 150 },
          data: { 
            label: 'CEO', 
            color: '#7c3aed', 
            backgroundColor: '#ede9fe',
            subtitle: 'Diretor Executivo'
          }
        },
        {
          id: 'cto',
          type: 'org-director',
          position: { x: 200, y: 250 },
          data: { 
            label: 'CTO', 
            color: '#3b82f6', 
            backgroundColor: '#dbeafe',
            subtitle: 'Diretor de Tecnologia'
          }
        },
        {
          id: 'cfo',
          type: 'org-director',
          position: { x: 400, y: 250 },
          data: { 
            label: 'CFO', 
            color: '#f59e0b', 
            backgroundColor: '#fef3c7',
            subtitle: 'Diretor Financeiro'
          }
        },
        {
          id: 'cmo',
          type: 'org-director',
          position: { x: 600, y: 250 },
          data: { 
            label: 'CMO', 
            color: '#10b981', 
            backgroundColor: '#d1fae5',
            subtitle: 'Diretor de Marketing'
          }
        }
      ],
      edges: [
        { id: 'e1', source: 'board', target: 'ceo-2', type: 'org-hierarchy' },
        { id: 'e2', source: 'ceo-2', target: 'cto', type: 'org-hierarchy' },
        { id: 'e3', source: 'ceo-2', target: 'cfo', type: 'org-hierarchy' },
        { id: 'e4', source: 'ceo-2', target: 'cmo', type: 'org-hierarchy' }
      ]
    },
    metadata: {
      author: 'Sistema',
      version: '1.0',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      downloads: 0,
      rating: 4.8,
      isPopular: false,
      isFeatured: true
    }
  }
];

// ============================================================================
// SERVIÇO PRINCIPAL
// ============================================================================

export class DiagramTemplateService {
  private static instance: DiagramTemplateService;
  private templates: DiagramTemplate[];

  private constructor() {
    this.templates = [
      ...FLOWCHART_TEMPLATES,
      ...MINDMAP_TEMPLATES,
      ...ORGANOGRAM_TEMPLATES
    ];
  }

  public static getInstance(): DiagramTemplateService {
    if (!DiagramTemplateService.instance) {
      DiagramTemplateService.instance = new DiagramTemplateService();
    }
    return DiagramTemplateService.instance;
  }

  // ============================================================================
  // MÉTODOS PÚBLICOS
  // ============================================================================

  /**
   * Retorna todos os templates disponíveis
   */
  public getAllTemplates(): DiagramTemplate[] {
    return [...this.templates];
  }

  /**
   * Retorna templates filtrados
   */
  public getTemplates(filter?: TemplateFilter): DiagramTemplate[] {
    let filtered = [...this.templates];

    if (filter?.type) {
      filtered = filtered.filter(t => t.type === filter.type);
    }

    if (filter?.category) {
      filtered = filtered.filter(t => t.category === filter.category);
    }

    if (filter?.difficulty) {
      filtered = filtered.filter(t => t.difficulty === filter.difficulty);
    }

    if (filter?.tags && filter.tags.length > 0) {
      filtered = filtered.filter(t => 
        filter.tags!.some(tag => t.tags.includes(tag))
      );
    }

    if (filter?.search) {
      const search = filter.search.toLowerCase();
      filtered = filtered.filter(t => 
        t.name.toLowerCase().includes(search) ||
        t.description.toLowerCase().includes(search) ||
        t.tags.some(tag => tag.toLowerCase().includes(search))
      );
    }

    return filtered;
  }

  /**
   * Retorna um template específico por ID
   */
  public getTemplateById(id: string): DiagramTemplate | null {
    return this.templates.find(t => t.id === id) || null;
  }

  /**
   * Retorna templates por tipo de diagrama
   */
  public getTemplatesByType(type: DiagramType): DiagramTemplate[] {
    return this.templates.filter(t => t.type === type);
  }

  /**
   * Retorna templates populares
   */
  public getPopularTemplates(): DiagramTemplate[] {
    return this.templates.filter(t => t.metadata.isPopular);
  }

  /**
   * Retorna templates em destaque
   */
  public getFeaturedTemplates(): DiagramTemplate[] {
    return this.templates.filter(t => t.metadata.isFeatured);
  }

  /**
   * Retorna templates por categoria
   */
  public getTemplatesByCategory(category: TemplateCategory): DiagramTemplate[] {
    return this.templates.filter(t => t.category === category);
  }

  /**
   * Retorna todas as categorias disponíveis
   */
  public getCategories(): TemplateCategory[] {
    const categories = new Set(this.templates.map(t => t.category));
    return Array.from(categories);
  }

  /**
   * Retorna todas as tags disponíveis
   */
  public getTags(): string[] {
    const tags = new Set(this.templates.flatMap(t => t.tags));
    return Array.from(tags);
  }

  /**
   * Cria um novo diagrama a partir de um template
   */
  public createDiagramFromTemplate(templateId: string, customTitle?: string): DiagramData | null {
    const template = this.getTemplateById(templateId);
    if (!template) return null;

    const diagramData = { ...template.data };
    
    if (customTitle) {
      diagramData.title = customTitle;
    }

    // Gerar novos IDs para evitar conflitos
    const nodeIdMap = new Map<string, string>();
    
    diagramData.nodes = diagramData.nodes.map(node => {
      const newId = `${node.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      nodeIdMap.set(node.id, newId);
      return {
        ...node,
        id: newId
      };
    });

    diagramData.edges = diagramData.edges.map(edge => ({
      ...edge,
      id: `edge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      source: nodeIdMap.get(edge.source) || edge.source,
      target: nodeIdMap.get(edge.target) || edge.target
    }));

    return diagramData;
  }

  /**
   * Adiciona um novo template (para templates customizados)
   */
  public addTemplate(template: Omit<DiagramTemplate, 'metadata'>): DiagramTemplate {
    const newTemplate: DiagramTemplate = {
      ...template,
      metadata: {
        author: 'Usuário',
        version: '1.0',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        downloads: 0,
        rating: 0,
        isPopular: false,
        isFeatured: false
      }
    };

    this.templates.push(newTemplate);
    return newTemplate;
  }

  /**
   * Remove um template
   */
  public removeTemplate(id: string): boolean {
    const index = this.templates.findIndex(t => t.id === id);
    if (index === -1) return false;

    this.templates.splice(index, 1);
    return true;
  }

  /**
   * Atualiza um template existente
   */
  public updateTemplate(id: string, updates: Partial<DiagramTemplate>): DiagramTemplate | null {
    const index = this.templates.findIndex(t => t.id === id);
    if (index === -1) return null;

    this.templates[index] = {
      ...this.templates[index],
      ...updates,
      metadata: {
        ...this.templates[index].metadata,
        ...updates.metadata,
        updatedAt: new Date().toISOString()
      }
    };

    return this.templates[index];
  }
}

// ============================================================================
// INSTÂNCIA SINGLETON
// ============================================================================

export const diagramTemplateService = DiagramTemplateService.getInstance();
export default diagramTemplateService;