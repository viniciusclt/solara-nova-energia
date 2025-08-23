import { Node, Edge } from 'reactflow';
import {
  DiagramTemplate,
  CreateTemplateData,
  TemplateFilters,
  TemplateSearchResult,
  TemplateUsageStats,
  DiagramTemplateService as ITemplateService,
  DiagramTemplateCategory
} from '../types/diagramTemplates';
import { localDatabase } from '../db';

class DiagramTemplateService implements ITemplateService {
  private templates: Map<string, DiagramTemplate> = new Map();
  private usageStats: Map<string, TemplateUsageStats> = new Map();
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    // Carregar templates salvos
    await this.loadTemplatesFromStorage();
    
    // Adicionar templates padrão se não existirem
    await this.ensureDefaultTemplates();
    
    this.initialized = true;
  }

  private async loadTemplatesFromStorage(): Promise<void> {
    try {
      const stored = localStorage.getItem('diagram-templates');
      if (stored) {
        const templates: DiagramTemplate[] = JSON.parse(stored);
        templates.forEach(template => {
          this.templates.set(template.id, template);
        });
      }

      const statsStored = localStorage.getItem('template-usage-stats');
      if (statsStored) {
        const stats: TemplateUsageStats[] = JSON.parse(statsStored);
        stats.forEach(stat => {
          this.usageStats.set(stat.templateId, stat);
        });
      }
    } catch (error) {
      console.error('Erro ao carregar templates:', error);
    }
  }

  private async saveTemplatesToStorage(): Promise<void> {
    try {
      const templates = Array.from(this.templates.values());
      localStorage.setItem('diagram-templates', JSON.stringify(templates));
      
      const stats = Array.from(this.usageStats.values());
      localStorage.setItem('template-usage-stats', JSON.stringify(stats));
    } catch (error) {
      console.error('Erro ao salvar templates:', error);
    }
  }

  private async ensureDefaultTemplates(): Promise<void> {
    const defaultTemplates = this.getDefaultTemplateDefinitions();
    
    for (const template of defaultTemplates) {
      if (!this.templates.has(template.id)) {
        this.templates.set(template.id, template);
      }
    }
    
    await this.saveTemplatesToStorage();
  }

  private getDefaultTemplateDefinitions(): DiagramTemplate[] {
    const now = new Date();
    
    return [
      {
        id: 'org-basic',
        name: 'Organograma Básico',
        description: 'Estrutura organizacional simples com CEO, gerentes e funcionários',
        category: 'organizational',
        thumbnail: this.generateBasicThumbnail('organizational'),
        nodes: [
          {
            id: '1',
            type: 'organizationNode',
            position: { x: 250, y: 50 },
            data: { label: 'CEO', role: 'Diretor Executivo', department: 'Executivo' }
          },
          {
            id: '2',
            type: 'organizationNode',
            position: { x: 100, y: 200 },
            data: { label: 'Gerente TI', role: 'Gerente', department: 'Tecnologia' }
          },
          {
            id: '3',
            type: 'organizationNode',
            position: { x: 400, y: 200 },
            data: { label: 'Gerente RH', role: 'Gerente', department: 'Recursos Humanos' }
          }
        ],
        edges: [
          { id: 'e1-2', source: '1', target: '2', type: 'smoothstep' },
          { id: 'e1-3', source: '1', target: '3', type: 'smoothstep' }
        ],
        metadata: {
          createdAt: now,
          updatedAt: now,
          author: 'Sistema',
          tags: ['organograma', 'hierarquia', 'básico'],
          difficulty: 'beginner',
          estimatedTime: 5
        },
        isPublic: true,
        isDefault: true
      },
      {
        id: 'process-approval',
        name: 'Processo de Aprovação',
        description: 'Fluxo padrão de aprovação com etapas de revisão',
        category: 'process',
        thumbnail: this.generateBasicThumbnail('process'),
        nodes: [
          {
            id: '1',
            type: 'input',
            position: { x: 50, y: 100 },
            data: { label: 'Início' }
          },
          {
            id: '2',
            type: 'default',
            position: { x: 200, y: 100 },
            data: { label: 'Análise' }
          },
          {
            id: '3',
            type: 'default',
            position: { x: 350, y: 50 },
            data: { label: 'Aprovado' }
          },
          {
            id: '4',
            type: 'default',
            position: { x: 350, y: 150 },
            data: { label: 'Rejeitado' }
          },
          {
            id: '5',
            type: 'output',
            position: { x: 500, y: 100 },
            data: { label: 'Fim' }
          }
        ],
        edges: [
          { id: 'e1-2', source: '1', target: '2' },
          { id: 'e2-3', source: '2', target: '3', label: 'Sim' },
          { id: 'e2-4', source: '2', target: '4', label: 'Não' },
          { id: 'e3-5', source: '3', target: '5' },
          { id: 'e4-5', source: '4', target: '5' }
        ],
        metadata: {
          createdAt: now,
          updatedAt: now,
          author: 'Sistema',
          tags: ['processo', 'aprovação', 'fluxo'],
          difficulty: 'beginner',
          estimatedTime: 10
        },
        isPublic: true,
        isDefault: true
      },
      {
        id: 'mindmap-project',
        name: 'Mapa Mental - Projeto',
        description: 'Estrutura de mapa mental para planejamento de projetos',
        category: 'mindmap',
        thumbnail: this.generateBasicThumbnail('mindmap'),
        nodes: [
          {
            id: '1',
            type: 'default',
            position: { x: 250, y: 150 },
            data: { label: 'Projeto' },
            style: { backgroundColor: '#ff6b6b', color: 'white' }
          },
          {
            id: '2',
            type: 'default',
            position: { x: 100, y: 50 },
            data: { label: 'Planejamento' }
          },
          {
            id: '3',
            type: 'default',
            position: { x: 400, y: 50 },
            data: { label: 'Execução' }
          },
          {
            id: '4',
            type: 'default',
            position: { x: 100, y: 250 },
            data: { label: 'Recursos' }
          },
          {
            id: '5',
            type: 'default',
            position: { x: 400, y: 250 },
            data: { label: 'Entrega' }
          }
        ],
        edges: [
          { id: 'e1-2', source: '1', target: '2', type: 'smoothstep' },
          { id: 'e1-3', source: '1', target: '3', type: 'smoothstep' },
          { id: 'e1-4', source: '1', target: '4', type: 'smoothstep' },
          { id: 'e1-5', source: '1', target: '5', type: 'smoothstep' }
        ],
        metadata: {
          createdAt: now,
          updatedAt: now,
          author: 'Sistema',
          tags: ['mindmap', 'projeto', 'planejamento'],
          difficulty: 'intermediate',
          estimatedTime: 15
        },
        isPublic: true,
        isDefault: true
      }
    ];
  }

  private generateBasicThumbnail(category: string): string {
    // Gerar um SVG simples como thumbnail
    const svg = `
      <svg width="200" height="150" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="150" fill="#f8f9fa" stroke="#dee2e6"/>
        <text x="100" y="75" text-anchor="middle" font-family="Arial" font-size="14" fill="#495057">
          ${category}
        </text>
      </svg>
    `;
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }

  async createTemplate(data: CreateTemplateData): Promise<DiagramTemplate> {
    await this.initialize();
    
    const template: DiagramTemplate = {
      id: `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: data.name,
      description: data.description,
      category: data.category,
      thumbnail: await this.generateThumbnail(data.nodes, data.edges),
      nodes: data.nodes,
      edges: data.edges,
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: data.tags,
        difficulty: data.difficulty,
        estimatedTime: data.estimatedTime
      },
      isPublic: data.isPublic,
      isDefault: false
    };

    this.templates.set(template.id, template);
    await this.saveTemplatesToStorage();
    
    return template;
  }

  async getTemplate(id: string): Promise<DiagramTemplate | null> {
    await this.initialize();
    return this.templates.get(id) || null;
  }

  async updateTemplate(id: string, data: Partial<CreateTemplateData>): Promise<DiagramTemplate> {
    await this.initialize();
    
    const existing = this.templates.get(id);
    if (!existing) {
      throw new Error(`Template ${id} não encontrado`);
    }

    const updated: DiagramTemplate = {
      ...existing,
      ...data,
      metadata: {
        ...existing.metadata,
        updatedAt: new Date(),
        ...(data.tags && { tags: data.tags }),
        ...(data.difficulty && { difficulty: data.difficulty }),
        ...(data.estimatedTime && { estimatedTime: data.estimatedTime })
      }
    };

    if (data.nodes || data.edges) {
      updated.thumbnail = await this.generateThumbnail(
        data.nodes || existing.nodes,
        data.edges || existing.edges
      );
    }

    this.templates.set(id, updated);
    await this.saveTemplatesToStorage();
    
    return updated;
  }

  async deleteTemplate(id: string): Promise<void> {
    await this.initialize();
    
    const template = this.templates.get(id);
    if (template?.isDefault) {
      throw new Error('Não é possível deletar templates padrão do sistema');
    }

    this.templates.delete(id);
    this.usageStats.delete(id);
    await this.saveTemplatesToStorage();
  }

  async searchTemplates(
    filters: TemplateFilters,
    page = 1,
    pageSize = 20
  ): Promise<TemplateSearchResult> {
    await this.initialize();
    
    let templates = Array.from(this.templates.values());

    // Aplicar filtros
    if (filters.category) {
      templates = templates.filter(t => t.category === filters.category);
    }
    
    if (filters.difficulty) {
      templates = templates.filter(t => t.metadata.difficulty === filters.difficulty);
    }
    
    if (filters.isPublic !== undefined) {
      templates = templates.filter(t => t.isPublic === filters.isPublic);
    }
    
    if (filters.tags && filters.tags.length > 0) {
      templates = templates.filter(t => 
        filters.tags!.some(tag => t.metadata.tags.includes(tag))
      );
    }
    
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      templates = templates.filter(t => 
        t.name.toLowerCase().includes(term) ||
        t.description.toLowerCase().includes(term) ||
        t.metadata.tags.some(tag => tag.toLowerCase().includes(term))
      );
    }

    // Ordenar por popularidade (uso) e depois por data
    templates.sort((a, b) => {
      const statsA = this.usageStats.get(a.id);
      const statsB = this.usageStats.get(b.id);
      
      if (statsA && statsB) {
        return statsB.usageCount - statsA.usageCount;
      }
      
      return b.metadata.updatedAt.getTime() - a.metadata.updatedAt.getTime();
    });

    // Paginação
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedTemplates = templates.slice(startIndex, endIndex);

    return {
      templates: paginatedTemplates,
      total: templates.length,
      page,
      pageSize,
      hasMore: endIndex < templates.length
    };
  }

  async getTemplatesByCategory(category: DiagramTemplateCategory): Promise<DiagramTemplate[]> {
    const result = await this.searchTemplates({ category });
    return result.templates;
  }

  async getDefaultTemplates(): Promise<DiagramTemplate[]> {
    await this.initialize();
    return Array.from(this.templates.values()).filter(t => t.isDefault);
  }

  async getUserTemplates(userId: string): Promise<DiagramTemplate[]> {
    await this.initialize();
    return Array.from(this.templates.values()).filter(t => 
      t.metadata.author === userId && !t.isDefault
    );
  }

  async duplicateTemplate(id: string, newName: string): Promise<DiagramTemplate> {
    const original = await this.getTemplate(id);
    if (!original) {
      throw new Error(`Template ${id} não encontrado`);
    }

    const duplicateData: CreateTemplateData = {
      name: newName,
      description: `Cópia de: ${original.description}`,
      category: original.category,
      nodes: JSON.parse(JSON.stringify(original.nodes)), // Deep clone
      edges: JSON.parse(JSON.stringify(original.edges)), // Deep clone
      tags: [...original.metadata.tags, 'cópia'],
      difficulty: original.metadata.difficulty,
      estimatedTime: original.metadata.estimatedTime,
      isPublic: false
    };

    return this.createTemplate(duplicateData);
  }

  async generateThumbnail(nodes: Node[], edges: Edge[]): Promise<string> {
    // Implementação simplificada - gerar SVG baseado nos nós
    const width = 200;
    const height = 150;
    
    if (nodes.length === 0) {
      return this.generateBasicThumbnail('empty');
    }

    // Calcular bounds dos nós
    const bounds = nodes.reduce(
      (acc, node) => ({
        minX: Math.min(acc.minX, node.position.x),
        maxX: Math.max(acc.maxX, node.position.x + 100),
        minY: Math.min(acc.minY, node.position.y),
        maxY: Math.max(acc.maxY, node.position.y + 50)
      }),
      { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity }
    );

    const scaleX = width / (bounds.maxX - bounds.minX || 1);
    const scaleY = height / (bounds.maxY - bounds.minY || 1);
    const scale = Math.min(scaleX, scaleY, 1) * 0.8;

    const svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${width}" height="${height}" fill="#f8f9fa" stroke="#dee2e6"/>
        ${nodes.map(node => {
          const x = (node.position.x - bounds.minX) * scale + 10;
          const y = (node.position.y - bounds.minY) * scale + 10;
          return `<rect x="${x}" y="${y}" width="60" height="30" fill="#007bff" stroke="#0056b3" rx="4"/>`;
        }).join('')}
        ${edges.map(edge => {
          const sourceNode = nodes.find(n => n.id === edge.source);
          const targetNode = nodes.find(n => n.id === edge.target);
          if (!sourceNode || !targetNode) return '';
          
          const x1 = (sourceNode.position.x - bounds.minX) * scale + 40;
          const y1 = (sourceNode.position.y - bounds.minY) * scale + 25;
          const x2 = (targetNode.position.x - bounds.minX) * scale + 40;
          const y2 = (targetNode.position.y - bounds.minY) * scale + 25;
          
          return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#6c757d" stroke-width="2"/>`;
        }).join('')}
      </svg>
    `;

    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }

  async rateTemplate(templateId: string, rating: number): Promise<void> {
    await this.initialize();
    
    if (rating < 1 || rating > 5) {
      throw new Error('Rating deve estar entre 1 e 5');
    }

    let stats = this.usageStats.get(templateId);
    if (!stats) {
      stats = {
        templateId,
        usageCount: 0,
        lastUsed: new Date(),
        averageRating: rating,
        totalRatings: 1
      };
    } else {
      const totalScore = stats.averageRating * stats.totalRatings + rating;
      stats.totalRatings += 1;
      stats.averageRating = totalScore / stats.totalRatings;
    }

    this.usageStats.set(templateId, stats);
    await this.saveTemplatesToStorage();
  }

  async getTemplateStats(templateId: string): Promise<TemplateUsageStats> {
    await this.initialize();
    
    return this.usageStats.get(templateId) || {
      templateId,
      usageCount: 0,
      lastUsed: new Date(),
      averageRating: 0,
      totalRatings: 0
    };
  }

  async exportTemplate(id: string): Promise<string> {
    const template = await this.getTemplate(id);
    if (!template) {
      throw new Error(`Template ${id} não encontrado`);
    }

    return JSON.stringify(template, null, 2);
  }

  async importTemplate(templateData: string): Promise<DiagramTemplate> {
    try {
      const template: DiagramTemplate = JSON.parse(templateData);
      
      // Gerar novo ID para evitar conflitos
      template.id = `imported-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      template.isDefault = false;
      template.metadata.updatedAt = new Date();
      
      this.templates.set(template.id, template);
      await this.saveTemplatesToStorage();
      
      return template;
    } catch (error) {
      throw new Error('Dados de template inválidos');
    }
  }

  // Método para registrar uso de template
  async recordTemplateUsage(templateId: string): Promise<void> {
    await this.initialize();
    
    let stats = this.usageStats.get(templateId);
    if (!stats) {
      stats = {
        templateId,
        usageCount: 1,
        lastUsed: new Date(),
        averageRating: 0,
        totalRatings: 0
      };
    } else {
      stats.usageCount += 1;
      stats.lastUsed = new Date();
    }

    this.usageStats.set(templateId, stats);
    await this.saveTemplatesToStorage();
  }
}

// Singleton instance
export const diagramTemplateService = new DiagramTemplateService();
export default diagramTemplateService;