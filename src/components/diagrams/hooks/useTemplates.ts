// ============================================================================
// useTemplates Hook - Hook para gerenciamento de templates
// ============================================================================
// Hook customizado para facilitar o uso do DiagramTemplateService
// Fornece funcionalidades de busca, filtro e seleção de templates
// ============================================================================

import { useState, useMemo, useCallback } from 'react';
import { 
  diagramTemplateService, 
  DiagramTemplate, 
  TemplateFilter 
} from '../services/DiagramTemplateService';
import { DiagramType } from '../types';
import { toast } from 'sonner';

// ============================================================================
// INTERFACES
// ============================================================================

export interface UseTemplatesOptions {
  defaultType?: DiagramType;
  autoLoad?: boolean;
}

export interface UseTemplatesReturn {
  // Estado
  templates: DiagramTemplate[];
  filteredTemplates: DiagramTemplate[];
  featuredTemplates: DiagramTemplate[];
  popularTemplates: DiagramTemplate[];
  categories: string[];
  tags: string[];
  isLoading: boolean;
  
  // Filtros
  filter: TemplateFilter;
  setFilter: (filter: Partial<TemplateFilter>) => void;
  clearFilters: () => void;
  
  // Ações
  getTemplate: (id: string) => DiagramTemplate | undefined;
  searchTemplates: (query: string) => DiagramTemplate[];
  getTemplatesByType: (type: DiagramType) => DiagramTemplate[];
  getTemplatesByCategory: (category: string) => DiagramTemplate[];
  getTemplatesByTag: (tag: string) => DiagramTemplate[];
  createFromTemplate: (templateId: string) => any | null;
  addTemplate: (template: Omit<DiagramTemplate, 'id' | 'metadata'>) => string;
  updateTemplate: (id: string, updates: Partial<DiagramTemplate>) => boolean;
  removeTemplate: (id: string) => boolean;
  
  // Utilitários
  refreshTemplates: () => void;
}

// ============================================================================
// HOOK PRINCIPAL
// ============================================================================

export const useTemplates = (options: UseTemplatesOptions = {}): UseTemplatesReturn => {
  const { defaultType, autoLoad = true } = options;
  
  // ============================================================================
  // ESTADO
  // ============================================================================
  
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilterState] = useState<TemplateFilter>({
    type: defaultType
  });
  
  // ============================================================================
  // DADOS COMPUTADOS
  // ============================================================================
  
  const templates = useMemo(() => {
    try {
      return diagramTemplateService.getAllTemplates();
    } catch (error) {
      console.error('Erro ao carregar templates:', error);
      toast.error('Erro ao carregar templates');
      return [];
    }
  }, []);
  
  const filteredTemplates = useMemo(() => {
    try {
      return diagramTemplateService.getTemplates(filter);
    } catch (error) {
      console.error('Erro ao filtrar templates:', error);
      return templates;
    }
  }, [templates, filter]);
  
  const featuredTemplates = useMemo(() => {
    try {
      return diagramTemplateService.getFeaturedTemplates();
    } catch (error) {
      console.error('Erro ao carregar templates em destaque:', error);
      return [];
    }
  }, []);
  
  const popularTemplates = useMemo(() => {
    try {
      return diagramTemplateService.getPopularTemplates();
    } catch (error) {
      console.error('Erro ao carregar templates populares:', error);
      return [];
    }
  }, []);
  
  const categories = useMemo(() => {
    try {
      return diagramTemplateService.getCategories();
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
      return [];
    }
  }, []);
  
  const tags = useMemo(() => {
    try {
      return diagramTemplateService.getTags();
    } catch (error) {
      console.error('Erro ao carregar tags:', error);
      return [];
    }
  }, []);
  
  // ============================================================================
  // AÇÕES DE FILTRO
  // ============================================================================
  
  const setFilter = useCallback((newFilter: Partial<TemplateFilter>) => {
    setFilterState(prev => ({ ...prev, ...newFilter }));
  }, []);
  
  const clearFilters = useCallback(() => {
    setFilterState({ type: defaultType });
  }, [defaultType]);
  
  // ============================================================================
  // AÇÕES DE BUSCA
  // ============================================================================
  
  const getTemplate = useCallback((id: string) => {
    try {
      return diagramTemplateService.getTemplate(id);
    } catch (error) {
      console.error('Erro ao buscar template:', error);
      toast.error('Template não encontrado');
      return undefined;
    }
  }, []);
  
  const searchTemplates = useCallback((query: string) => {
    try {
      return diagramTemplateService.getTemplates({ search: query });
    } catch (error) {
      console.error('Erro ao buscar templates:', error);
      return [];
    }
  }, []);
  
  const getTemplatesByType = useCallback((type: DiagramType) => {
    try {
      return diagramTemplateService.getTemplates({ type });
    } catch (error) {
      console.error('Erro ao buscar templates por tipo:', error);
      return [];
    }
  }, []);
  
  const getTemplatesByCategory = useCallback((category: string) => {
    try {
      return diagramTemplateService.getTemplates({ category: category as any });
    } catch (error) {
      console.error('Erro ao buscar templates por categoria:', error);
      return [];
    }
  }, []);
  
  const getTemplatesByTag = useCallback((tag: string) => {
    try {
      return diagramTemplateService.getTemplates({ tags: [tag] });
    } catch (error) {
      console.error('Erro ao buscar templates por tag:', error);
      return [];
    }
  }, []);
  
  // ============================================================================
  // AÇÕES DE GERENCIAMENTO
  // ============================================================================
  
  const createFromTemplate = useCallback((templateId: string) => {
    try {
      setIsLoading(true);
      const diagram = diagramTemplateService.createDiagramFromTemplate(templateId);
      
      if (diagram) {
        const template = getTemplate(templateId);
        if (template) {
          toast.success(`Diagrama criado a partir do template "${template.name}"`);
        }
      } else {
        toast.error('Erro ao criar diagrama a partir do template');
      }
      
      return diagram;
    } catch (error) {
      console.error('Erro ao criar diagrama a partir do template:', error);
      toast.error('Erro ao criar diagrama');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [getTemplate]);
  
  const addTemplate = useCallback((template: Omit<DiagramTemplate, 'id' | 'metadata'>) => {
    try {
      const id = diagramTemplateService.addTemplate({
        ...template,
        id: '', // Will be generated
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          author: 'User',
          version: '1.0.0',
          downloads: 0,
          rating: 0,
          ratingCount: 0,
          isFeatured: false,
          isPopular: false
        }
      });
      
      toast.success('Template adicionado com sucesso');
      return id;
    } catch (error) {
      console.error('Erro ao adicionar template:', error);
      toast.error('Erro ao adicionar template');
      return '';
    }
  }, []);
  
  const updateTemplate = useCallback((id: string, updates: Partial<DiagramTemplate>) => {
    try {
      const success = diagramTemplateService.updateTemplate(id, updates);
      
      if (success) {
        toast.success('Template atualizado com sucesso');
      } else {
        toast.error('Template não encontrado');
      }
      
      return success;
    } catch (error) {
      console.error('Erro ao atualizar template:', error);
      toast.error('Erro ao atualizar template');
      return false;
    }
  }, []);
  
  const removeTemplate = useCallback((id: string) => {
    try {
      const success = diagramTemplateService.removeTemplate(id);
      
      if (success) {
        toast.success('Template removido com sucesso');
      } else {
        toast.error('Template não encontrado');
      }
      
      return success;
    } catch (error) {
      console.error('Erro ao remover template:', error);
      toast.error('Erro ao remover template');
      return false;
    }
  }, []);
  
  // ============================================================================
  // UTILITÁRIOS
  // ============================================================================
  
  const refreshTemplates = useCallback(() => {
    // Force re-render by updating a dependency
    setFilterState(prev => ({ ...prev }));
  }, []);
  
  // ============================================================================
  // RETORNO
  // ============================================================================
  
  return {
    // Estado
    templates,
    filteredTemplates,
    featuredTemplates,
    popularTemplates,
    categories,
    tags,
    isLoading,
    
    // Filtros
    filter,
    setFilter,
    clearFilters,
    
    // Ações
    getTemplate,
    searchTemplates,
    getTemplatesByType,
    getTemplatesByCategory,
    getTemplatesByTag,
    createFromTemplate,
    addTemplate,
    updateTemplate,
    removeTemplate,
    
    // Utilitários
    refreshTemplates
  };
};

export default useTemplates;