// hooks/useEditor.ts
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Block,
  BlockType,
  EditorState,
  EditorSelection,
  EditorEvent,
  Playbook,
  RichText,
} from '../types/editor';
import { EditorService } from '../services/editorService';
import { toast } from 'sonner';

interface UseEditorOptions {
  initialBlocks?: Record<string, Block>;
  enableAutoSave?: boolean;
  enableCollaboration?: boolean;
  collaborationUrl?: string;
  onSave?: (playbook: Playbook) => Promise<void>;
  onError?: (error: Error) => void;
}

interface UseEditorReturn {
  // State
  blocks: Record<string, Block>;
  selection: EditorSelection | undefined;
  isLoading: boolean;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  
  // Block operations
  createBlock: (type: BlockType, data?: Partial<Block>, parentId?: string) => Block;
  updateBlock: (id: string, changes: Partial<Block>) => void;
  deleteBlock: (id: string) => void;
  duplicateBlock: (id: string) => Block;
  moveBlock: (blockId: string, newParentId?: string, newIndex?: number) => void;
  
  // Block queries
  getBlock: (id: string) => Block | undefined;
  getBlocksByParent: (parentId?: string) => Block[];
  getRootBlocks: () => Block[];
  searchBlocks: (query: string) => Block[];
  
  // Selection
  setSelection: (selection: EditorSelection) => void;
  clearSelection: () => void;
  
  // History
  undo: () => boolean;
  redo: () => boolean;
  canUndo: boolean;
  canRedo: boolean;
  
  // Content operations
  insertText: (blockId: string, text: string, offset: number) => void;
  deleteText: (blockId: string, offset: number, length: number) => void;
  formatText: (blockId: string, offset: number, length: number, style: Record<string, unknown>) => void;
  
  // Import/Export
  exportToJSON: () => string;
  exportToMarkdown: () => string;
  importFromJSON: (json: string) => void;
  
  // Templates
  saveAsTemplate: (name: string, description?: string) => void;
  loadTemplate: (templateId: string) => boolean;
  getTemplates: () => Array<{ id: string; name: string; description?: string; blocks: Record<string, unknown>; createdAt: Date }>;
  
  // Playbook operations
  savePlaybook: (metadata?: Partial<Playbook>) => Promise<void>;
  loadPlaybook: (playbookId: string) => Promise<void>;
  
  // Settings
  settings: EditorState['settings'];
  updateSettings: (settings: Partial<EditorState['settings']>) => void;
  
  // Statistics
  getWordCount: () => number;
  getBlockCount: () => number;
  getReadingTime: () => number;
  
  // Collaboration (if enabled)
  collaborationUsers?: Array<{ id: string; name: string; avatar?: string; cursor?: { blockId: string; offset: number } }>;
  isCollaborationEnabled: boolean;
}

export const useEditor = (options: UseEditorOptions = {}): UseEditorReturn => {
  const {
    initialBlocks = {},
    enableAutoSave = true,
    enableCollaboration = false,
    collaborationUrl,
    onSave,
    onError,
  } = options;

  // Service instance
  const editorServiceRef = useRef<EditorService | null>(null);
  
  // State
  const [blocks, setBlocks] = useState<Record<string, Block>>(initialBlocks);
  const [selection, setSelectionState] = useState<EditorSelection | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [settings, setSettings] = useState<EditorState['settings']>({
    theme: 'light',
    fontSize: 16,
    fontFamily: 'Inter, sans-serif',
    lineHeight: 1.6,
    showBlockHandles: true,
    showLineNumbers: false,
    enableSpellCheck: true,
    enableAutoSave: enableAutoSave,
    autoSaveInterval: 30000,
    enableCollaboration: enableCollaboration,
    enableComments: true,
    enableVersionHistory: true,
    maxFileSize: 10 * 1024 * 1024,
    allowedFileTypes: ['image/*', 'video/*', 'audio/*', '.pdf', '.doc', '.docx'],
  });
  const [collaborationUsers, setCollaborationUsers] = useState<Array<{ id: string; name: string; avatar?: string; cursor?: { blockId: string; offset: number } }>>([]);

  // Initialize editor service
  useEffect(() => {
    if (!editorServiceRef.current) {
      editorServiceRef.current = new EditorService({
        blocks: initialBlocks,
        settings,
      });

      // Set up event listeners
      const service = editorServiceRef.current;
      
      service.addEventListener('block-created', (event) => {
        setBlocks(service.getBlocks());
        setHasUnsavedChanges(true);
        setCanUndo(service.canUndo());
        setCanRedo(service.canRedo());
      });
      
      service.addEventListener('block-updated', (event) => {
        setBlocks(service.getBlocks());
        setHasUnsavedChanges(true);
        setCanUndo(service.canUndo());
        setCanRedo(service.canRedo());
      });
      
      service.addEventListener('block-deleted', (event) => {
        setBlocks(service.getBlocks());
        setHasUnsavedChanges(true);
        setCanUndo(service.canUndo());
        setCanRedo(service.canRedo());
      });
      
      service.addEventListener('block-moved', (event) => {
        setBlocks(service.getBlocks());
        setHasUnsavedChanges(true);
        setCanUndo(service.canUndo());
        setCanRedo(service.canRedo());
      });
      
      service.addEventListener('selection-changed', (event) => {
        setSelectionState(event.selection);
      });
      
      service.addEventListener('collaboration-user-joined', (event) => {
        setCollaborationUsers(prev => [...prev, event.user]);
      });
      
      service.addEventListener('collaboration-user-left', (event) => {
        setCollaborationUsers(prev => prev.filter(user => user.id !== event.userId));
      });
      
      service.addEventListener('error', (event) => {
        if (onError) {
          onError(new Error(event.error));
        } else {
          toast.error(event.error);
        }
      });

      // Load auto-save if available
      if (enableAutoSave && Object.keys(initialBlocks).length === 0) {
        const loaded = service.loadAutoSave();
        if (loaded) {
          setBlocks(service.getBlocks());
          toast.info('Rascunho carregado automaticamente');
        }
      }

      // Enable collaboration if requested
      if (enableCollaboration && collaborationUrl) {
        service.enableCollaboration(collaborationUrl);
      }
    }

    return () => {
      if (editorServiceRef.current) {
        editorServiceRef.current.destroy();
      }
    };
  }, [initialBlocks, enableAutoSave, enableCollaboration, collaborationUrl, onError]);

  // Block operations
  const createBlock = useCallback((type: BlockType, data?: Partial<Block>, parentId?: string): Block => {
    if (!editorServiceRef.current) {
      throw new Error('Editor service not initialized');
    }
    return editorServiceRef.current.createBlock(type, data, parentId);
  }, []);

  const updateBlock = useCallback((id: string, changes: Partial<Block>): void => {
    if (!editorServiceRef.current) {
      throw new Error('Editor service not initialized');
    }
    editorServiceRef.current.updateBlock(id, changes);
  }, []);

  const deleteBlock = useCallback((id: string): void => {
    if (!editorServiceRef.current) {
      throw new Error('Editor service not initialized');
    }
    editorServiceRef.current.deleteBlock(id);
  }, []);

  const duplicateBlock = useCallback((id: string): Block => {
    if (!editorServiceRef.current) {
      throw new Error('Editor service not initialized');
    }
    return editorServiceRef.current.duplicateBlock(id);
  }, []);

  const moveBlock = useCallback((blockId: string, newParentId?: string, newIndex?: number): void => {
    if (!editorServiceRef.current) {
      throw new Error('Editor service not initialized');
    }
    editorServiceRef.current.moveBlock(blockId, newParentId, newIndex);
  }, []);

  // Block queries
  const getBlock = useCallback((id: string): Block | undefined => {
    if (!editorServiceRef.current) {
      return undefined;
    }
    return editorServiceRef.current.getBlock(id);
  }, []);

  const getBlocksByParent = useCallback((parentId?: string): Block[] => {
    if (!editorServiceRef.current) {
      return [];
    }
    return editorServiceRef.current.getBlocksByParent(parentId);
  }, []);

  const getRootBlocks = useCallback((): Block[] => {
    if (!editorServiceRef.current) {
      return [];
    }
    return editorServiceRef.current.getRootBlocks();
  }, []);

  const searchBlocks = useCallback((query: string): Block[] => {
    if (!editorServiceRef.current) {
      return [];
    }
    return editorServiceRef.current.searchBlocks(query);
  }, []);

  // Selection
  const setSelection = useCallback((selection: EditorSelection): void => {
    if (!editorServiceRef.current) {
      return;
    }
    editorServiceRef.current.setSelection(selection);
  }, []);

  const clearSelection = useCallback((): void => {
    if (!editorServiceRef.current) {
      return;
    }
    editorServiceRef.current.clearSelection();
  }, []);

  // History
  const undo = useCallback((): boolean => {
    if (!editorServiceRef.current) {
      return false;
    }
    const result = editorServiceRef.current.undo();
    if (result) {
      setBlocks(editorServiceRef.current.getBlocks());
      setCanUndo(editorServiceRef.current.canUndo());
      setCanRedo(editorServiceRef.current.canRedo());
    }
    return result;
  }, []);

  const redo = useCallback((): boolean => {
    if (!editorServiceRef.current) {
      return false;
    }
    const result = editorServiceRef.current.redo();
    if (result) {
      setBlocks(editorServiceRef.current.getBlocks());
      setCanUndo(editorServiceRef.current.canUndo());
      setCanRedo(editorServiceRef.current.canRedo());
    }
    return result;
  }, []);

  // Content operations
  const insertText = useCallback((blockId: string, text: string, offset: number): void => {
    const block = getBlock(blockId);
    if (!block || !('content' in block)) {
      return;
    }

    const content = (block.content as RichText) || [];
    
    // Find the annotation at the offset
    let currentOffset = 0;
    let targetAnnotationIndex = 0;
    let targetOffset = offset;

    for (let i = 0; i < content.length; i++) {
      const annotation = content[i];
      const annotationLength = annotation.text.length;
      
      if (currentOffset + annotationLength >= offset) {
        targetAnnotationIndex = i;
        targetOffset = offset - currentOffset;
        break;
      }
      
      currentOffset += annotationLength;
      targetAnnotationIndex = i + 1;
    }

    // Insert text into the annotation
    const newContent = [...content];
    if (targetAnnotationIndex < newContent.length) {
      const annotation = newContent[targetAnnotationIndex];
      newContent[targetAnnotationIndex] = {
        ...annotation,
        text: annotation.text.slice(0, targetOffset) + text + annotation.text.slice(targetOffset),
      };
    } else {
      // Add new annotation
      newContent.push({
        type: 'text',
        text,
      });
    }

    updateBlock(blockId, { content: newContent });
  }, [getBlock, updateBlock]);

  const deleteText = useCallback((blockId: string, offset: number, length: number): void => {
    const block = getBlock(blockId);
    if (!block || !('content' in block)) {
      return;
    }

    const content = (block.content as RichText) || [];
    const newContent = [...content];
    
    // Implementation for deleting text across annotations
    // This is a simplified version - a full implementation would handle
    // deletion across multiple annotations
    
    let currentOffset = 0;
    for (let i = 0; i < newContent.length; i++) {
      const annotation = newContent[i];
      const annotationLength = annotation.text.length;
      
      if (currentOffset <= offset && offset < currentOffset + annotationLength) {
        const startInAnnotation = offset - currentOffset;
        const endInAnnotation = Math.min(startInAnnotation + length, annotationLength);
        
        newContent[i] = {
          ...annotation,
          text: annotation.text.slice(0, startInAnnotation) + 
                annotation.text.slice(endInAnnotation),
        };
        break;
      }
      
      currentOffset += annotationLength;
    }

    updateBlock(blockId, { content: newContent.filter(annotation => annotation.text.length > 0) });
  }, [getBlock, updateBlock]);

  const formatText = useCallback((blockId: string, offset: number, length: number, style: Record<string, unknown>): void => {
    const block = getBlock(blockId);
    if (!block || !('content' in block)) {
      return;
    }

    const content = (block.content as RichText) || [];
    const newContent = [...content];
    
    // Implementation for applying formatting to text
    // This is a simplified version - a full implementation would handle
    // formatting across multiple annotations
    
    let currentOffset = 0;
    for (let i = 0; i < newContent.length; i++) {
      const annotation = newContent[i];
      const annotationLength = annotation.text.length;
      
      if (currentOffset <= offset && offset < currentOffset + annotationLength) {
        newContent[i] = {
          ...annotation,
          style: { ...annotation.style, ...style },
        };
        break;
      }
      
      currentOffset += annotationLength;
    }

    updateBlock(blockId, { content: newContent });
  }, [getBlock, updateBlock]);

  // Import/Export
  const exportToJSON = useCallback((): string => {
    if (!editorServiceRef.current) {
      return '{}';
    }
    return editorServiceRef.current.exportToJSON();
  }, []);

  const exportToMarkdown = useCallback((): string => {
    if (!editorServiceRef.current) {
      return '';
    }
    return editorServiceRef.current.exportToMarkdown();
  }, []);

  const importFromJSON = useCallback((json: string): void => {
    if (!editorServiceRef.current) {
      return;
    }
    try {
      editorServiceRef.current.importFromJSON(json);
      setBlocks(editorServiceRef.current.getBlocks());
      setHasUnsavedChanges(true);
      toast.success('Playbook importado com sucesso!');
    } catch (error) {
      toast.error('Erro ao importar playbook');
      throw error;
    }
  }, []);

  // Templates
  const saveAsTemplate = useCallback((name: string, description?: string): void => {
    if (!editorServiceRef.current) {
      return;
    }
    editorServiceRef.current.saveAsTemplate(name, description);
    toast.success('Template salvo com sucesso!');
  }, []);

  const loadTemplate = useCallback((templateId: string): boolean => {
    if (!editorServiceRef.current) {
      return false;
    }
    const result = editorServiceRef.current.loadTemplate(templateId);
    if (result) {
      setBlocks(editorServiceRef.current.getBlocks());
      setHasUnsavedChanges(true);
      toast.success('Template carregado com sucesso!');
    }
    return result;
  }, []);

  const getTemplates = useCallback((): Array<{ id: string; name: string; description?: string; blocks: Record<string, unknown>; createdAt: Date }> => {
    if (!editorServiceRef.current) {
      return [];
    }
    return editorServiceRef.current.getTemplates();
  }, []);

  // Playbook operations
  const savePlaybook = useCallback(async (metadata?: Partial<Playbook>): Promise<void> => {
    if (!editorServiceRef.current || !onSave) {
      return;
    }

    setIsSaving(true);
    try {
      const playbook: Playbook = {
        id: metadata?.id || 'new-playbook',
        title: metadata?.title || 'Novo Playbook',
        description: metadata?.description,
        icon: metadata?.icon,
        cover: metadata?.cover,
        blocks: Object.keys(blocks),
        tags: metadata?.tags || [],
        category: metadata?.category || 'geral',
        visibility: metadata?.visibility || 'private',
        template: metadata?.template || false,
        version: metadata?.version || 1,
        createdAt: metadata?.createdAt || new Date(),
        updatedAt: new Date(),
        createdBy: metadata?.createdBy || 'current-user',
        lastEditedBy: 'current-user',
        collaborators: metadata?.collaborators || [],
        settings: {
          allowComments: true,
          allowSuggestions: true,
          allowCopy: true,
          allowExport: true,
          requireApproval: false,
          enableVersioning: true,
          enableAnalytics: true,
        },
        metadata: {
          wordCount: editorServiceRef.current.getWordCount(),
          readingTime: editorServiceRef.current.getReadingTime(),
          viewCount: 0,
          shareCount: 0,
          copyCount: 0,
          exportCount: 0,
          commentCount: 0,
          suggestionCount: 0,
          collaboratorCount: 0,
          blockCount: editorServiceRef.current.getBlockCount(),
          imageCount: 0,
          videoCount: 0,
          fileCount: 0,
        },
      };

      await onSave(playbook);
      setHasUnsavedChanges(false);
      editorServiceRef.current.clearAutoSave();
      toast.success('Playbook salvo com sucesso!');
    } catch (error) {
      toast.error('Erro ao salvar playbook');
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [blocks, onSave]);

  const loadPlaybook = useCallback(async (playbookId: string): Promise<void> => {
    setIsLoading(true);
    try {
      // In a real implementation, this would fetch from an API
      // For now, we'll just show a placeholder
      toast.info('Carregamento de playbook não implementado ainda');
    } catch (error) {
      toast.error('Erro ao carregar playbook');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Settings
  const updateSettings = useCallback((newSettings: Partial<EditorState['settings']>): void => {
    if (!editorServiceRef.current) {
      return;
    }
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    editorServiceRef.current.updateSettings(updatedSettings);
  }, [settings]);

  // Statistics
  const getWordCount = useCallback((): number => {
    if (!editorServiceRef.current) {
      return 0;
    }
    return editorServiceRef.current.getWordCount();
  }, []);

  const getBlockCount = useCallback((): number => {
    if (!editorServiceRef.current) {
      return 0;
    }
    return editorServiceRef.current.getBlockCount();
  }, []);

  const getReadingTime = useCallback((): number => {
    if (!editorServiceRef.current) {
      return 0;
    }
    return editorServiceRef.current.getReadingTime();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 'z':
            if (event.shiftKey) {
              event.preventDefault();
              redo();
            } else {
              event.preventDefault();
              undo();
            }
            break;
          case 'y':
            event.preventDefault();
            redo();
            break;
          case 's':
            event.preventDefault();
            if (onSave) {
              savePlaybook();
            }
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, savePlaybook, onSave]);

  return {
    // State
    blocks,
    selection,
    isLoading,
    isSaving,
    hasUnsavedChanges,
    
    // Block operations
    createBlock,
    updateBlock,
    deleteBlock,
    duplicateBlock,
    moveBlock,
    
    // Block queries
    getBlock,
    getBlocksByParent,
    getRootBlocks,
    searchBlocks,
    
    // Selection
    setSelection,
    clearSelection,
    
    // History
    undo,
    redo,
    canUndo,
    canRedo,
    
    // Content operations
    insertText,
    deleteText,
    formatText,
    
    // Import/Export
    exportToJSON,
    exportToMarkdown,
    importFromJSON,
    
    // Templates
    saveAsTemplate,
    loadTemplate,
    getTemplates,
    
    // Playbook operations
    savePlaybook,
    loadPlaybook,
    
    // Settings
    settings,
    updateSettings,
    
    // Statistics
    getWordCount,
    getBlockCount,
    getReadingTime,
    
    // Collaboration
    collaborationUsers,
    isCollaborationEnabled: enableCollaboration,
  };
};

export default useEditor;