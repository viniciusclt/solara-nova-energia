import { Node, Edge } from 'reactflow';

// Categorias de templates
export type DiagramTemplateCategory = 
  | 'organizational' 
  | 'process' 
  | 'flowchart' 
  | 'network' 
  | 'mindmap' 
  | 'custom';

// Estrutura de um template
export interface DiagramTemplate {
  id: string;
  name: string;
  description: string;
  category: DiagramTemplateCategory;
  thumbnail: string; // Base64 ou URL da imagem de preview
  nodes: Node[];
  edges: Edge[];
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    author?: string;
    tags: string[];
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    estimatedTime: number; // em minutos
  };
  isPublic: boolean;
  isDefault: boolean; // Templates padrão do sistema
}

// Dados para criar um novo template
export interface CreateTemplateData {
  name: string;
  description: string;
  category: DiagramTemplateCategory;
  nodes: Node[];
  edges: Edge[];
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number;
  isPublic: boolean;
}

// Filtros para busca de templates
export interface TemplateFilters {
  category?: DiagramTemplateCategory;
  tags?: string[];
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  author?: string;
  isPublic?: boolean;
  searchTerm?: string;
}

// Resultado de busca paginada
export interface TemplateSearchResult {
  templates: DiagramTemplate[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// Estatísticas de uso de template
export interface TemplateUsageStats {
  templateId: string;
  usageCount: number;
  lastUsed: Date;
  averageRating: number;
  totalRatings: number;
}

// Interface para o serviço de templates
export interface DiagramTemplateService {
  // CRUD básico
  createTemplate(data: CreateTemplateData): Promise<DiagramTemplate>;
  getTemplate(id: string): Promise<DiagramTemplate | null>;
  updateTemplate(id: string, data: Partial<CreateTemplateData>): Promise<DiagramTemplate>;
  deleteTemplate(id: string): Promise<void>;
  
  // Busca e listagem
  searchTemplates(filters: TemplateFilters, page?: number, pageSize?: number): Promise<TemplateSearchResult>;
  getTemplatesByCategory(category: DiagramTemplateCategory): Promise<DiagramTemplate[]>;
  getDefaultTemplates(): Promise<DiagramTemplate[]>;
  getUserTemplates(userId: string): Promise<DiagramTemplate[]>;
  
  // Funcionalidades avançadas
  duplicateTemplate(id: string, newName: string): Promise<DiagramTemplate>;
  generateThumbnail(nodes: Node[], edges: Edge[]): Promise<string>;
  rateTemplate(templateId: string, rating: number): Promise<void>;
  getTemplateStats(templateId: string): Promise<TemplateUsageStats>;
  
  // Import/Export
  exportTemplate(id: string): Promise<string>; // JSON string
  importTemplate(templateData: string): Promise<DiagramTemplate>;
}

// Configurações de preview
export interface TemplatePreviewConfig {
  width: number;
  height: number;
  showGrid: boolean;
  backgroundColor: string;
  nodeStyle: 'default' | 'minimal' | 'detailed';
}

// Dados para aplicar um template
export interface ApplyTemplateData {
  templateId: string;
  position?: { x: number; y: number };
  scale?: number;
  replaceExisting?: boolean;
}