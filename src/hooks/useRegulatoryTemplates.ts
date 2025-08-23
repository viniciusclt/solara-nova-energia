import { useState, useCallback, useEffect } from 'react';
import {
  RegulatoryTemplateService,
  regulatoryTemplateService,
  type DocumentTemplate,
  type GeneratedDocument,
  type DadosProjeto,
  type CalculosEnergeticos
} from '@/services/RegulatoryTemplateService';
import {
  logInfo,
  logWarn,
  logError
} from '@/utils/secureLogger';

// ===== INTERFACES =====

export interface TemplateGenerationOptions {
  templateId: string;
  projectData: DadosProjeto;
  calculosEnergeticos?: CalculosEnergeticos;
  additionalData?: Record<string, any>;
  autoDownload?: boolean;
  format?: 'html' | 'pdf' | 'docx';
}

export interface DocumentExportOptions {
  format: 'html' | 'pdf' | 'docx';
  filename?: string;
  includeMetadata?: boolean;
}

export interface TemplateValidationResult {
  isValid: boolean;
  missingFields: string[];
  warnings: string[];
  score: number;
}

export interface UseRegulatoryTemplatesState {
  // Templates
  templates: DocumentTemplate[];
  selectedTemplate: DocumentTemplate | null;
  
  // Documentos gerados
  generatedDocuments: GeneratedDocument[];
  currentDocument: GeneratedDocument | null;
  
  // Estados de carregamento
  isLoading: boolean;
  isGenerating: boolean;
  isExporting: boolean;
  
  // Validação
  validationResult: TemplateValidationResult | null;
  
  // Erros
  error: string | null;
  
  // Estatísticas
  stats: {
    totalGenerated: number;
    averageComplianceScore: number;
    lastGenerated: Date | null;
  };
}

export interface UseRegulatoryTemplatesActions {
  // Gestão de templates
  loadTemplates: () => Promise<void>;
  selectTemplate: (templateId: string) => void;
  getTemplatesByType: (type: DocumentTemplate['type']) => DocumentTemplate[];
  
  // Geração de documentos
  generateDocument: (options: TemplateGenerationOptions) => Promise<GeneratedDocument | null>;
  generateMultipleDocuments: (optionsList: TemplateGenerationOptions[]) => Promise<GeneratedDocument[]>;
  
  // Validação
  validateProjectData: (templateId: string, projectData: DadosProjeto) => TemplateValidationResult;
  previewDocument: (options: TemplateGenerationOptions) => Promise<string | null>;
  
  // Exportação
  exportDocument: (documentId: string, options: DocumentExportOptions) => Promise<boolean>;
  exportMultipleDocuments: (documentIds: string[], options: DocumentExportOptions) => Promise<boolean>;
  
  // Gestão de documentos
  getDocument: (documentId: string) => GeneratedDocument | null;
  deleteDocument: (documentId: string) => void;
  clearDocuments: () => void;
  
  // Utilitários
  downloadDocument: (document: GeneratedDocument, format?: 'html' | 'pdf') => void;
  copyDocumentToClipboard: (documentId: string) => Promise<boolean>;
  
  // Estado
  clearError: () => void;
  resetState: () => void;
}

export type UseRegulatoryTemplatesReturn = UseRegulatoryTemplatesState & UseRegulatoryTemplatesActions;

// ===== HOOK =====

export function useRegulatoryTemplates(): UseRegulatoryTemplatesReturn {
  // ===== ESTADO =====
  
  const [state, setState] = useState<UseRegulatoryTemplatesState>({
    templates: [],
    selectedTemplate: null,
    generatedDocuments: [],
    currentDocument: null,
    isLoading: false,
    isGenerating: false,
    isExporting: false,
    validationResult: null,
    error: null,
    stats: {
      totalGenerated: 0,
      averageComplianceScore: 0,
      lastGenerated: null
    }
  });

  // ===== FUNÇÕES AUXILIARES =====

  const updateState = useCallback((updates: Partial<UseRegulatoryTemplatesState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const updateStats = useCallback((documents: GeneratedDocument[]) => {
    if (documents.length === 0) {
      updateState({
        stats: {
          totalGenerated: 0,
          averageComplianceScore: 0,
          lastGenerated: null
        }
      });
      return;
    }

    const totalScore = documents.reduce((sum, doc) => sum + doc.validation.compliance_score, 0);
    const averageScore = totalScore / documents.length;
    const lastGenerated = documents.reduce((latest, doc) => {
      return !latest || doc.metadata.generated_at > latest
        ? doc.metadata.generated_at
        : latest;
    }, null as Date | null);

    updateState({
      stats: {
        totalGenerated: documents.length,
        averageComplianceScore: Math.round(averageScore * 100) / 100,
        lastGenerated
      }
    });
  }, [updateState]);

  const handleError = useCallback((error: unknown, context: string) => {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    
    logError(
      `Erro no useRegulatoryTemplates: ${context}`,
      'useRegulatoryTemplates',
      { error: errorMessage }
    );
    
    updateState({ error: errorMessage });
  }, [updateState]);

  // ===== GESTÃO DE TEMPLATES =====

  const loadTemplates = useCallback(async () => {
    updateState({ isLoading: true, error: null });
    
    try {
      const templates = regulatoryTemplateService.getAllTemplates();
      
      updateState({
        templates,
        isLoading: false
      });
      
      logInfo(
        'Templates carregados com sucesso',
        'useRegulatoryTemplates',
        { templates_count: templates.length }
      );
      
    } catch (error) {
      handleError(error, 'loadTemplates');
      updateState({ isLoading: false });
    }
  }, [updateState, handleError]);

  const selectTemplate = useCallback((templateId: string) => {
    const template = regulatoryTemplateService.getTemplate(templateId);
    
    if (template) {
      updateState({ selectedTemplate: template });
      
      logInfo(
        `Template selecionado: ${template.name}`,
        'useRegulatoryTemplates',
        { template_id: templateId }
      );
    } else {
      logWarn(
        `Template não encontrado: ${templateId}`,
        'useRegulatoryTemplates'
      );
    }
  }, [updateState]);

  const getTemplatesByType = useCallback((type: DocumentTemplate['type']) => {
    return regulatoryTemplateService.getTemplatesByType(type);
  }, []);

  // ===== GERAÇÃO DE DOCUMENTOS =====

  const generateDocument = useCallback(async (
    options: TemplateGenerationOptions
  ): Promise<GeneratedDocument | null> => {
    updateState({ isGenerating: true, error: null });
    
    try {
      const document = await regulatoryTemplateService.generateDocument(
        options.templateId,
        options.projectData,
        options.calculosEnergeticos,
        options.additionalData
      );
      
      const updatedDocuments = [...state.generatedDocuments, document];
      
      updateState({
        generatedDocuments: updatedDocuments,
        currentDocument: document,
        isGenerating: false
      });
      
      updateStats(updatedDocuments);
      
      // Auto download se solicitado
      if (options.autoDownload) {
        downloadDocument(document, options.format === 'pdf' ? 'pdf' : 'html');
      }
      
      logInfo(
        'Documento gerado com sucesso',
        'useRegulatoryTemplates',
        {
          document_id: document.id,
          template_id: options.templateId,
          compliance_score: document.validation.compliance_score
        }
      );
      
      return document;
      
    } catch (error) {
      handleError(error, 'generateDocument');
      updateState({ isGenerating: false });
      return null;
    }
  }, [state.generatedDocuments, updateState, updateStats, handleError]);

  const generateMultipleDocuments = useCallback(async (
    optionsList: TemplateGenerationOptions[]
  ): Promise<GeneratedDocument[]> => {
    updateState({ isGenerating: true, error: null });
    
    const generatedDocs: GeneratedDocument[] = [];
    
    try {
      for (const options of optionsList) {
        const document = await regulatoryTemplateService.generateDocument(
          options.templateId,
          options.projectData,
          options.calculosEnergeticos,
          options.additionalData
        );
        
        generatedDocs.push(document);
      }
      
      const updatedDocuments = [...state.generatedDocuments, ...generatedDocs];
      
      updateState({
        generatedDocuments: updatedDocuments,
        isGenerating: false
      });
      
      updateStats(updatedDocuments);
      
      logInfo(
        `${generatedDocs.length} documentos gerados com sucesso`,
        'useRegulatoryTemplates',
        { documents_count: generatedDocs.length }
      );
      
      return generatedDocs;
      
    } catch (error) {
      handleError(error, 'generateMultipleDocuments');
      updateState({ isGenerating: false });
      return generatedDocs;
    }
  }, [state.generatedDocuments, updateState, updateStats, handleError]);

  // ===== VALIDAÇÃO =====

  const validateProjectData = useCallback((
    templateId: string,
    projectData: DadosProjeto
  ): TemplateValidationResult => {
    const template = regulatoryTemplateService.getTemplate(templateId);
    
    if (!template) {
      return {
        isValid: false,
        missingFields: ['Template não encontrado'],
        warnings: [],
        score: 0
      };
    }

    const missingFields: string[] = [];
    const warnings: string[] = [];
    let score = 100;

    // Verificar campos obrigatórios
    for (const [varPath, varConfig] of Object.entries(template.variables)) {
      if (varConfig.required) {
        const value = getNestedValue(projectData, varPath);
        
        if (value === undefined || value === null || value === '') {
          missingFields.push(varConfig.description);
          score -= 10;
        }
      }
    }

    // Validações específicas
    if (!projectData.responsavel_tecnico?.registro_profissional) {
      warnings.push('Registro profissional do responsável técnico não informado');
      score -= 5;
    }

    if (!projectData.sistema_fv?.potencia_modulos_wp || projectData.sistema_fv.potencia_modulos_wp <= 0) {
      warnings.push('Potência dos módulos deve ser maior que zero');
      score -= 5;
    }

    const result: TemplateValidationResult = {
      isValid: missingFields.length === 0,
      missingFields,
      warnings,
      score: Math.max(0, score)
    };

    updateState({ validationResult: result });
    
    return result;
  }, [updateState]);

  const previewDocument = useCallback(async (
    options: TemplateGenerationOptions
  ): Promise<string | null> => {
    try {
      const document = await regulatoryTemplateService.generateDocument(
        options.templateId,
        options.projectData,
        options.calculosEnergeticos,
        options.additionalData
      );
      
      return document.content;
      
    } catch (error) {
      handleError(error, 'previewDocument');
      return null;
    }
  }, [handleError]);

  // ===== EXPORTAÇÃO =====

  const exportDocument = useCallback(async (
    documentId: string,
    options: DocumentExportOptions
  ): Promise<boolean> => {
    updateState({ isExporting: true, error: null });
    
    try {
      const document = state.generatedDocuments.find(doc => doc.id === documentId);
      
      if (!document) {
        throw new Error('Documento não encontrado');
      }

      // Simular exportação (implementação real dependeria do formato)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      downloadDocument(document, options.format === 'pdf' ? 'pdf' : 'html');
      
      updateState({ isExporting: false });
      
      logInfo(
        `Documento exportado: ${options.format}`,
        'useRegulatoryTemplates',
        { document_id: documentId, format: options.format }
      );
      
      return true;
      
    } catch (error) {
      handleError(error, 'exportDocument');
      updateState({ isExporting: false });
      return false;
    }
  }, [state.generatedDocuments, updateState, handleError]);

  const exportMultipleDocuments = useCallback(async (
    documentIds: string[],
    options: DocumentExportOptions
  ): Promise<boolean> => {
    updateState({ isExporting: true, error: null });
    
    try {
      for (const documentId of documentIds) {
        await exportDocument(documentId, options);
      }
      
      updateState({ isExporting: false });
      
      logInfo(
        `${documentIds.length} documentos exportados`,
        'useRegulatoryTemplates',
        { documents_count: documentIds.length, format: options.format }
      );
      
      return true;
      
    } catch (error) {
      handleError(error, 'exportMultipleDocuments');
      updateState({ isExporting: false });
      return false;
    }
  }, [exportDocument, updateState, handleError]);

  // ===== GESTÃO DE DOCUMENTOS =====

  const getDocument = useCallback((documentId: string): GeneratedDocument | null => {
    return state.generatedDocuments.find(doc => doc.id === documentId) || null;
  }, [state.generatedDocuments]);

  const deleteDocument = useCallback((documentId: string) => {
    const updatedDocuments = state.generatedDocuments.filter(doc => doc.id !== documentId);
    
    updateState({
      generatedDocuments: updatedDocuments,
      currentDocument: state.currentDocument?.id === documentId ? null : state.currentDocument
    });
    
    updateStats(updatedDocuments);
    
    logInfo(
      'Documento removido',
      'useRegulatoryTemplates',
      { document_id: documentId }
    );
  }, [state.generatedDocuments, state.currentDocument, updateState, updateStats]);

  const clearDocuments = useCallback(() => {
    updateState({
      generatedDocuments: [],
      currentDocument: null
    });
    
    updateStats([]);
    
    logInfo(
      'Todos os documentos foram removidos',
      'useRegulatoryTemplates'
    );
  }, [updateState, updateStats]);

  // ===== UTILITÁRIOS =====

  const downloadDocument = useCallback((document: GeneratedDocument, format: 'html' | 'pdf' = 'html') => {
    try {
      const template = regulatoryTemplateService.getTemplate(document.template_id);
      const filename = `${template?.name || 'documento'}_${document.project_id}.${format}`;
      
      if (format === 'html') {
        const blob = new Blob([document.content], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
      } else {
        // Para PDF, seria necessário usar uma biblioteca como jsPDF ou Puppeteer
        logWarn(
          'Exportação para PDF não implementada',
          'useRegulatoryTemplates'
        );
      }
      
      logInfo(
        `Download iniciado: ${filename}`,
        'useRegulatoryTemplates',
        { document_id: document.id, format }
      );
      
    } catch (error) {
      handleError(error, 'downloadDocument');
    }
  }, [handleError]);

  const copyDocumentToClipboard = useCallback(async (documentId: string): Promise<boolean> => {
    try {
      const document = getDocument(documentId);
      
      if (!document) {
        throw new Error('Documento não encontrado');
      }

      await navigator.clipboard.writeText(document.content);
      
      logInfo(
        'Documento copiado para a área de transferência',
        'useRegulatoryTemplates',
        { document_id: documentId }
      );
      
      return true;
      
    } catch (error) {
      handleError(error, 'copyDocumentToClipboard');
      return false;
    }
  }, [getDocument, handleError]);

  // ===== ESTADO =====

  const clearError = useCallback(() => {
    updateState({ error: null });
  }, [updateState]);

  const resetState = useCallback(() => {
    setState({
      templates: [],
      selectedTemplate: null,
      generatedDocuments: [],
      currentDocument: null,
      isLoading: false,
      isGenerating: false,
      isExporting: false,
      validationResult: null,
      error: null,
      stats: {
        totalGenerated: 0,
        averageComplianceScore: 0,
        lastGenerated: null
      }
    });
  }, []);

  // ===== EFEITOS =====

  // Carregar templates na inicialização
  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  // ===== RETORNO =====

  return {
    // Estado
    ...state,
    
    // Ações
    loadTemplates,
    selectTemplate,
    getTemplatesByType,
    generateDocument,
    generateMultipleDocuments,
    validateProjectData,
    previewDocument,
    exportDocument,
    exportMultipleDocuments,
    getDocument,
    deleteDocument,
    clearDocuments,
    downloadDocument,
    copyDocumentToClipboard,
    clearError,
    resetState
  };
}

// ===== FUNÇÕES AUXILIARES =====

function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined;
  }, obj);
}

export default useRegulatoryTemplates;