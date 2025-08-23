import { useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { secureLogger } from '@/utils/secureLogger';
import { useDiagramStore } from '../stores/useDiagramStore';
import { DiagramDocument } from '../types';

export interface UseDiagramEditorProps {
  documentId?: string;
  initialDocument?: DiagramDocument;
  readOnly?: boolean;
  onSave?: (document: DiagramDocument) => void;
  onClose?: () => void;
}

export interface UseDiagramEditorReturn {
  // Estado
  document: DiagramDocument | null;
  isLoading: boolean;
  hasUnsavedChanges: boolean;
  
  // Handlers
  handleSave: () => Promise<void>;
  handleUndo: () => void;
  handleRedo: () => void;
  handleExport: (format: 'png' | 'svg' | 'pdf' | 'json') => void;
  handleImport: (file: File) => void;
  handleAddNode: (nodeType: string, position?: { x: number; y: number }) => void;
  handleClose: () => void;
  
  // Props para componentes
  toolbarProps: {
    onSave: () => Promise<void>;
    onUndo: () => void;
    onRedo: () => void;
    onExport: (format: 'png' | 'svg' | 'pdf' | 'json') => void;
    onImport: (file: File) => void;
    canUndo: boolean;
    canRedo: boolean;
    hasUnsavedChanges: boolean;
  };
  
  paletteProps: {
    diagramType: string;
    onAddNode: (nodeType: string, position?: { x: number; y: number }) => void;
  };
}

/**
 * Hook customizado para gerenciar operações do DiagramEditor
 * Centraliza toda a lógica de handlers, efeitos e estado do editor
 */
export const useDiagramEditor = ({
  documentId,
  initialDocument,
  readOnly = false,
  onSave,
  onClose
}: UseDiagramEditorProps): UseDiagramEditorReturn => {
  const {
    document,
    ui,
    history,
    loadDocument,
    createNewDocument,
    saveDocument,
    addNode,
    undo,
    redo,
    clearSelection
  } = useDiagramStore();

  // ============================================================================
  // Efeitos
  // ============================================================================

  // Carrega documento inicial
  useEffect(() => {
    if (initialDocument) {
      secureLogger.info('Carregando documento inicial', { documentId: initialDocument.id });
      loadDocument(initialDocument);
    } else if (documentId) {
      secureLogger.info('Carregando documento por ID', { documentId });
      // Aqui seria a chamada para carregar o documento da API
      // loadDocumentById(documentId);
    } else {
      secureLogger.info('Criando novo documento padrão');
      createNewDocument('flowchart', 'Novo Diagrama');
    }
  }, [documentId, initialDocument, loadDocument, createNewDocument]);

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      clearSelection();
      secureLogger.info('DiagramEditor desmontado');
    };
  }, [clearSelection]);

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleSave = useCallback(async () => {
    if (!document) {
      toast.error('Nenhum documento para salvar');
      return;
    }

    try {
      await saveDocument();
      
      if (onSave) {
        onSave(document);
      }
      
      toast.success('Diagrama salvo com sucesso!');
      secureLogger.info('Documento salvo via DiagramEditor', { documentId: document.id });
    } catch (error) {
      toast.error('Erro ao salvar diagrama');
      secureLogger.error('Erro ao salvar documento via DiagramEditor', { error, documentId: document.id });
    }
  }, [document, saveDocument, onSave]);

  const handleUndo = useCallback(() => {
    if (history.past.length > 0) {
      undo();
      toast.success('Ação desfeita');
      secureLogger.info('Undo executado via DiagramEditor');
    }
  }, [undo, history.past.length]);

  const handleRedo = useCallback(() => {
    if (history.future.length > 0) {
      redo();
      toast.success('Ação refeita');
      secureLogger.info('Redo executado via DiagramEditor');
    }
  }, [redo, history.future.length]);

  const handleExport = useCallback((format: 'png' | 'svg' | 'pdf' | 'json') => {
    if (!document) {
      toast.error('Nenhum documento para exportar');
      return;
    }

    secureLogger.info('Exportando diagrama', { format, documentId: document.id });
    
    try {
      // Aqui seria a implementação da exportação
      // await exportDiagram(document, format);
      toast.success(`Diagrama exportado como ${format.toUpperCase()}`);
    } catch (error) {
      toast.error('Erro ao exportar diagrama');
      secureLogger.error('Erro ao exportar diagrama', { error, format, documentId: document.id });
    }
  }, [document]);

  const handleImport = useCallback((file: File) => {
    secureLogger.info('Importando arquivo de diagrama', { fileName: file.name, fileSize: file.size });
    
    try {
      // Aqui seria a implementação da importação
      // await importDiagram(file);
      toast.success('Diagrama importado com sucesso!');
    } catch (error) {
      toast.error('Erro ao importar diagrama');
      secureLogger.error('Erro ao importar diagrama', { error, fileName: file.name });
    }
  }, []);

  const handleAddNode = useCallback(async (nodeType: string, position?: { x: number; y: number }) => {
    if (!document || readOnly) return;

    const defaultPosition = position || { x: 100, y: 100 };
    
    await addNode({
      type: nodeType,
      position: defaultPosition,
      data: {
        label: `Novo ${nodeType}`,
        category: 'basic'
      }
    });

    secureLogger.info('Nó adicionado via DiagramEditor', { nodeType, position: defaultPosition });
  }, [document, readOnly, addNode]);

  const handleClose = useCallback(() => {
    if (ui.hasUnsavedChanges) {
      const confirmClose = window.confirm(
        'Você tem alterações não salvas. Deseja realmente fechar?'
      );
      
      if (!confirmClose) {
        return;
      }
    }

    if (onClose) {
      onClose();
    }
    
    secureLogger.info('DiagramEditor fechado');
  }, [ui.hasUnsavedChanges, onClose]);

  // ============================================================================
  // Memoizações
  // ============================================================================

  const toolbarProps = useMemo(() => ({
    onSave: handleSave,
    onUndo: handleUndo,
    onRedo: handleRedo,
    onExport: handleExport,
    onImport: handleImport,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    hasUnsavedChanges: ui.hasUnsavedChanges
  }), [
    handleSave,
    handleUndo,
    handleRedo,
    handleExport,
    handleImport,
    history.past.length,
    history.future.length,
    ui.hasUnsavedChanges
  ]);

  const paletteProps = useMemo(() => ({
    diagramType: document?.config.type || 'flowchart',
    onAddNode: handleAddNode
  }), [document?.config.type, handleAddNode]);

  const advancedToolbarProps = useMemo(() => ({
    orientation: 'horizontal' as const,
    showLabels: true,
    compactMode: false,
    onNodeCreate: handleAddNode
  }), [handleAddNode]);

  const advancedPaletteProps = useMemo(() => ({
    showTemplateInfo: true,
    enableQuickActions: true,
    compactMode: false,
    onNodeCreate: handleAddNode
  }), [handleAddNode]);

  return {
    // Estado
    document,
    isLoading: ui.isLoading,
    hasUnsavedChanges: ui.hasUnsavedChanges,
    
    // Handlers
    handleSave,
    handleUndo,
    handleRedo,
    handleExport,
    handleImport,
    handleAddNode,
    handleClose,
    
    // Props para componentes
    toolbarProps,
    paletteProps,
    advancedToolbarProps,
    advancedPaletteProps
  };
};