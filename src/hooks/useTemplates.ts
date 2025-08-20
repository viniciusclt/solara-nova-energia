import { useState, useCallback, useEffect } from 'react';
import { TemplateService } from '../services/TemplateService';
import type {
  ProposalTemplate,
  TemplateFormat,
  CanvasData,
  TemplateLibraryItem,
  TemplateCategory
} from '../types/proposal-editor';

interface UseTemplatesProps {
  companyId?: string;
  autoLoad?: boolean;
  onError?: (error: string) => void;
}

interface UseTemplatesReturn {
  // Estado
  templates: ProposalTemplate[];
  publicTemplates: ProposalTemplate[];
  currentTemplate: ProposalTemplate | null;
  loading: boolean;
  error: string | null;
  
  // CRUD operations
  createTemplate: (data: Partial<ProposalTemplate>) => Promise<ProposalTemplate | null>;
  updateTemplate: (templateId: string, updates: Partial<ProposalTemplate>) => Promise<boolean>;
  deleteTemplate: (templateId: string) => Promise<boolean>;
  duplicateTemplate: (templateId: string, newName?: string) => Promise<ProposalTemplate | null>;
  
  // Busca e filtros
  getTemplateById: (templateId: string) => ProposalTemplate | undefined;
  getTemplatesByFormat: (format: TemplateFormat) => ProposalTemplate[];
  getTemplatesByCategory: (category: TemplateCategory) => ProposalTemplate[];
  searchTemplates: (query: string) => ProposalTemplate[];
  
  // Template atual
  loadTemplate: (templateId: string) => Promise<boolean>;
  saveTemplate: (templateData?: Partial<ProposalTemplate>) => Promise<boolean>;
  clearCurrentTemplate: () => void;
  
  // Biblioteca de templates
  loadPublicTemplates: () => Promise<void>;
  loadCompanyTemplates: () => Promise<void>;
  
  // Thumbnail e preview
  generateThumbnail: (templateId: string, canvasData: CanvasData) => Promise<string | null>;
  updateThumbnail: (templateId: string, thumbnailUrl: string) => Promise<boolean>;
  
  // Importação e exportação
  exportTemplate: (templateId: string) => Promise<string | null>;
  importTemplate: (templateData: string) => Promise<ProposalTemplate | null>;
  
  // Validação
  validateTemplate: (template: Partial<ProposalTemplate>) => { isValid: boolean; errors: string[] };
  
  // Utilitários
  refreshTemplates: () => Promise<void>;
  getTemplateStats: () => {
    total: number;
    byFormat: Record<TemplateFormat, number>;
    byCategory: Record<string, number>;
    public: number;
    private: number;
  };
}

const TEMPLATE_CATEGORIES: TemplateCategory[] = [
  'business',
  'marketing',
  'technical',
  'financial',
  'presentation',
  'report',
  'other'
];

export const useTemplates = ({
  companyId,
  autoLoad = true,
  onError
}: UseTemplatesProps = {}): UseTemplatesReturn => {
  const [templates, setTemplates] = useState<ProposalTemplate[]>([]);
  const [publicTemplates, setPublicTemplates] = useState<ProposalTemplate[]>([]);
  const [currentTemplate, setCurrentTemplate] = useState<ProposalTemplate | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carregar templates da empresa
  const loadCompanyTemplates = useCallback(async () => {
    if (!companyId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const companyTemplates = await TemplateService.getCompanyTemplates(companyId);
      setTemplates(companyTemplates);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar templates da empresa';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [companyId, onError]);

  // Carregar templates públicos
  const loadPublicTemplates = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const publicTemplatesList = await TemplateService.getPublicTemplates();
      setPublicTemplates(publicTemplatesList);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar templates públicos';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [onError]);

  // Carregar templates automaticamente
  useEffect(() => {
    if (autoLoad) {
      loadCompanyTemplates();
      loadPublicTemplates();
    }
  }, [autoLoad, loadCompanyTemplates, loadPublicTemplates]);

  // Criar template
  const createTemplate = useCallback(async (
    data: Partial<ProposalTemplate>
  ): Promise<ProposalTemplate | null> => {
    if (!companyId) {
      const errorMessage = 'Company ID é obrigatório para criar templates';
      setError(errorMessage);
      onError?.(errorMessage);
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const templateData = {
        name: data.name || 'Novo Template',
        format: data.format || 'a4',
        canvas_data: data.canvas_data || { format: 'a4', elements: [], settings: {} },
        is_public: data.is_public || false,
        company_id: companyId,
        ...data
      };

      const newTemplate = await TemplateService.createTemplate(templateData);
      setTemplates(prev => [...prev, newTemplate]);
      return newTemplate;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar template';
      setError(errorMessage);
      onError?.(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [companyId, onError]);

  // Atualizar template
  const updateTemplate = useCallback(async (
    templateId: string,
    updates: Partial<ProposalTemplate>
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const updatedTemplate = await TemplateService.updateTemplate(templateId, updates);
      
      setTemplates(prev => prev.map(t => t.id === templateId ? updatedTemplate : t));
      
      if (currentTemplate?.id === templateId) {
        setCurrentTemplate(updatedTemplate);
      }
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar template';
      setError(errorMessage);
      onError?.(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [currentTemplate, onError]);

  // Deletar template
  const deleteTemplate = useCallback(async (templateId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      await TemplateService.deleteTemplate(templateId);
      
      setTemplates(prev => prev.filter(t => t.id !== templateId));
      
      if (currentTemplate?.id === templateId) {
        setCurrentTemplate(null);
      }
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao deletar template';
      setError(errorMessage);
      onError?.(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [currentTemplate, onError]);

  // Duplicar template
  const duplicateTemplate = useCallback(async (
    templateId: string,
    newName?: string
  ): Promise<ProposalTemplate | null> => {
    setLoading(true);
    setError(null);

    try {
      const duplicatedTemplate = await TemplateService.duplicateTemplate(templateId, newName);
      setTemplates(prev => [...prev, duplicatedTemplate]);
      return duplicatedTemplate;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao duplicar template';
      setError(errorMessage);
      onError?.(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [onError]);

  // Buscar template por ID
  const getTemplateById = useCallback((templateId: string): ProposalTemplate | undefined => {
    return templates.find(t => t.id === templateId) || publicTemplates.find(t => t.id === templateId);
  }, [templates, publicTemplates]);

  // Buscar templates por formato
  const getTemplatesByFormat = useCallback((format: TemplateFormat): ProposalTemplate[] => {
    return templates.filter(t => t.format === format);
  }, [templates]);

  // Buscar templates por categoria
  const getTemplatesByCategory = useCallback((category: TemplateCategory): ProposalTemplate[] => {
    return templates.filter(t => t.category === category);
  }, [templates]);

  // Pesquisar templates
  const searchTemplates = useCallback((query: string): ProposalTemplate[] => {
    const lowercaseQuery = query.toLowerCase();
    const allTemplates = [...templates, ...publicTemplates];
    
    return allTemplates.filter(template => 
      template.name.toLowerCase().includes(lowercaseQuery) ||
      template.description?.toLowerCase().includes(lowercaseQuery) ||
      template.category?.toLowerCase().includes(lowercaseQuery)
    );
  }, [templates, publicTemplates]);

  // Carregar template atual
  const loadTemplate = useCallback(async (templateId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const template = await TemplateService.getTemplateById(templateId);
      setCurrentTemplate(template);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar template';
      setError(errorMessage);
      onError?.(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [onError]);

  // Salvar template atual
  const saveTemplate = useCallback(async (templateData?: Partial<ProposalTemplate>): Promise<boolean> => {
    if (!currentTemplate) {
      const errorMessage = 'Nenhum template carregado para salvar';
      setError(errorMessage);
      onError?.(errorMessage);
      return false;
    }

    const updates = templateData || {};
    return updateTemplate(currentTemplate.id, updates);
  }, [currentTemplate, updateTemplate, onError]);

  // Limpar template atual
  const clearCurrentTemplate = useCallback(() => {
    setCurrentTemplate(null);
    setError(null);
  }, []);

  // Gerar thumbnail
  const generateThumbnail = useCallback(async (
    templateId: string,
    canvasData: CanvasData
  ): Promise<string | null> => {
    setLoading(true);
    setError(null);

    try {
      const thumbnailUrl = await TemplateService.generateThumbnail(templateId, canvasData);
      return thumbnailUrl;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao gerar thumbnail';
      setError(errorMessage);
      onError?.(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [onError]);

  // Atualizar thumbnail
  const updateThumbnail = useCallback(async (
    templateId: string,
    thumbnailUrl: string
  ): Promise<boolean> => {
    return updateTemplate(templateId, { thumbnail_url: thumbnailUrl });
  }, [updateTemplate]);

  // Exportar template
  const exportTemplate = useCallback(async (templateId: string): Promise<string | null> => {
    setLoading(true);
    setError(null);

    try {
      const template = await TemplateService.getTemplateById(templateId);
      const exportData = {
        template,
        exportedAt: new Date().toISOString(),
        version: '1.0'
      };
      
      return JSON.stringify(exportData, null, 2);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao exportar template';
      setError(errorMessage);
      onError?.(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [onError]);

  // Importar template
  const importTemplate = useCallback(async (templateData: string): Promise<ProposalTemplate | null> => {
    if (!companyId) {
      const errorMessage = 'Company ID é obrigatório para importar templates';
      setError(errorMessage);
      onError?.(errorMessage);
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const importData = JSON.parse(templateData);
      const template = importData.template;
      
      if (!template || !template.name) {
        throw new Error('Dados de template inválidos');
      }

      // Criar novo template baseado nos dados importados
      const newTemplateData = {
        name: `${template.name} (Importado)`,
        format: template.format,
        canvas_data: template.canvas_data,
        description: template.description,
        category: template.category,
        is_public: false, // Templates importados são sempre privados
        company_id: companyId
      };

      const newTemplate = await createTemplate(newTemplateData);
      return newTemplate;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao importar template';
      setError(errorMessage);
      onError?.(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [companyId, createTemplate, onError]);

  // Validar template
  const validateTemplate = useCallback((template: Partial<ProposalTemplate>): { isValid: boolean; errors: string[] } => {
    return TemplateService.validateTemplate(template);
  }, []);

  // Atualizar templates
  const refreshTemplates = useCallback(async (): Promise<void> => {
    await Promise.all([
      loadCompanyTemplates(),
      loadPublicTemplates()
    ]);
  }, [loadCompanyTemplates, loadPublicTemplates]);

  // Obter estatísticas dos templates
  const getTemplateStats = useCallback(() => {
    const allTemplates = [...templates, ...publicTemplates];
    
    const byFormat: Record<TemplateFormat, number> = {
      a4: 0,
      '16:9': 0
    };
    
    const byCategory: Record<string, number> = {};
    
    allTemplates.forEach(template => {
      // Contar por formato
      byFormat[template.format] = (byFormat[template.format] || 0) + 1;
      
      // Contar por categoria
      const category = template.category || 'other';
      byCategory[category] = (byCategory[category] || 0) + 1;
    });
    
    return {
      total: allTemplates.length,
      byFormat,
      byCategory,
      public: publicTemplates.length,
      private: templates.length
    };
  }, [templates, publicTemplates]);

  return {
    // Estado
    templates,
    publicTemplates,
    currentTemplate,
    loading,
    error,
    
    // CRUD operations
    createTemplate,
    updateTemplate,
    deleteTemplate,
    duplicateTemplate,
    
    // Busca e filtros
    getTemplateById,
    getTemplatesByFormat,
    getTemplatesByCategory,
    searchTemplates,
    
    // Template atual
    loadTemplate,
    saveTemplate,
    clearCurrentTemplate,
    
    // Biblioteca de templates
    loadPublicTemplates,
    loadCompanyTemplates,
    
    // Thumbnail e preview
    generateThumbnail,
    updateThumbnail,
    
    // Importação e exportação
    exportTemplate,
    importTemplate,
    
    // Validação
    validateTemplate,
    
    // Utilitários
    refreshTemplates,
    getTemplateStats
  };
};