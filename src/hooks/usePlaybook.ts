// ============================================================================
// Playbook Hooks - Hooks customizados para gerenciamento de playbooks
// ============================================================================

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  PlaybookDocument,
  PlaybookBlock,
  PlaybookTemplate,
  PlaybookComment,
  PlaybookHistoryEntry,
  PlaybookFilters,
  PlaybookEditorState,
  UsePlaybookReturn,
  UsePlaybookEditorReturn,
  UsePlaybookTemplatesReturn,
  PlaybookBlockType,
  PlaybookStatus,
  PlaybookCategory
} from '@/types/playbook';
import { getPlaybookService } from '@/services/PlaybookService';

// ============================================================================
// Main Playbook Hook
// ============================================================================

/**
 * Hook principal para gerenciamento de playbooks
 */
export const usePlaybook = (playbookId?: string): UsePlaybookReturn => {
  const queryClient = useQueryClient();
  const playbookService = getPlaybookService();

  // Queries
  const {
    data: playbook,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['playbook', playbookId],
    queryFn: () => playbookService.getPlaybook(playbookId!),
    enabled: !!playbookId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30 // 30 minutes
  });

  const {
    data: blocks = [],
    isLoading: isLoadingBlocks
  } = useQuery({
    queryKey: ['playbook-blocks', playbookId],
    queryFn: () => playbookService.getBlocks(playbookId!),
    enabled: !!playbookId,
    staleTime: 1000 * 60 * 2 // 2 minutes
  });

  const {
    data: comments = [],
    isLoading: isLoadingComments
  } = useQuery({
    queryKey: ['playbook-comments', playbookId],
    queryFn: () => playbookService.getComments(playbookId!),
    enabled: !!playbookId,
    staleTime: 1000 * 30 // 30 seconds
  });

  const {
    data: history = [],
    isLoading: isLoadingHistory
  } = useQuery({
    queryKey: ['playbook-history', playbookId],
    queryFn: () => playbookService.getHistory(playbookId!),
    enabled: !!playbookId,
    staleTime: 1000 * 60 * 10 // 10 minutes
  });

  const {
    data: collaborators = [],
    isLoading: isLoadingCollaborators
  } = useQuery({
    queryKey: ['playbook-collaborators', playbookId],
    queryFn: () => playbookService.getCollaborators(playbookId!),
    enabled: !!playbookId,
    staleTime: 1000 * 60 * 5 // 5 minutes
  });

  // Mutations
  const updateMutation = useMutation({
    mutationFn: (data: Partial<PlaybookDocument>) => 
      playbookService.updatePlaybook(playbookId!, data),
    onSuccess: (updatedPlaybook) => {
      queryClient.setQueryData(['playbook', playbookId], updatedPlaybook);
      queryClient.invalidateQueries({ queryKey: ['playbooks'] });
      toast.success('Playbook atualizado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar playbook: ${error.message}`);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: () => playbookService.deletePlaybook(playbookId!),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ['playbook', playbookId] });
      queryClient.invalidateQueries({ queryKey: ['playbooks'] });
      toast.success('Playbook deletado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao deletar playbook: ${error.message}`);
    }
  });

  const publishMutation = useMutation({
    mutationFn: () => playbookService.publishPlaybook(playbookId!),
    onSuccess: (publishedPlaybook) => {
      queryClient.setQueryData(['playbook', playbookId], publishedPlaybook);
      queryClient.invalidateQueries({ queryKey: ['playbooks'] });
      toast.success('Playbook publicado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao publicar playbook: ${error.message}`);
    }
  });

  const unpublishMutation = useMutation({
    mutationFn: () => playbookService.unpublishPlaybook(playbookId!),
    onSuccess: (unpublishedPlaybook) => {
      queryClient.setQueryData(['playbook', playbookId], unpublishedPlaybook);
      queryClient.invalidateQueries({ queryKey: ['playbooks'] });
      toast.success('Playbook despublicado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao despublicar playbook: ${error.message}`);
    }
  });

  // Analytics tracking
  const trackView = useCallback(async () => {
    if (playbookId) {
      try {
        await playbookService.trackView(playbookId);
      } catch (error) {
        console.error('Erro ao rastrear visualização:', error);
      }
    }
  }, [playbookId, playbookService]);

  // Auto-track view on mount
  useEffect(() => {
    if (playbook && !isLoading) {
      trackView();
    }
  }, [playbook, isLoading, trackView]);

  return {
    // Data
    playbook,
    blocks,
    comments,
    history,
    collaborators,
    
    // Loading states
    isLoading: isLoading || isLoadingBlocks,
    isLoadingComments,
    isLoadingHistory,
    isLoadingCollaborators,
    
    // Error state
    error,
    
    // Actions
    update: updateMutation.mutate,
    delete: deleteMutation.mutate,
    publish: publishMutation.mutate,
    unpublish: unpublishMutation.mutate,
    refetch,
    trackView,
    
    // Mutation states
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isPublishing: publishMutation.isPending,
    isUnpublishing: unpublishMutation.isPending
  };
};

// ============================================================================
// Playbook Library Hook
// ============================================================================

/**
 * Hook para gerenciar biblioteca de playbooks
 */
export const usePlaybookLibrary = (filters: PlaybookFilters = {}) => {
  const queryClient = useQueryClient();
  const playbookService = getPlaybookService();
  const [localFilters, setLocalFilters] = useState<PlaybookFilters>(filters);

  // Query for playbooks
  const {
    data: playbooks = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['playbooks', localFilters],
    queryFn: () => playbookService.getPlaybooks(localFilters),
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 10 // 10 minutes
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: Partial<PlaybookDocument>) => 
      playbookService.createPlaybook(data),
    onSuccess: (newPlaybook) => {
      queryClient.invalidateQueries({ queryKey: ['playbooks'] });
      toast.success('Playbook criado com sucesso!');
      return newPlaybook;
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar playbook: ${error.message}`);
    }
  });

  // Bulk operations
  const bulkDeleteMutation = useMutation({
    mutationFn: async (playbookIds: string[]) => {
      await Promise.all(
        playbookIds.map(id => playbookService.deletePlaybook(id))
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playbooks'] });
      toast.success('Playbooks deletados com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao deletar playbooks: ${error.message}`);
    }
  });

  // Filter helpers
  const updateFilters = useCallback((newFilters: Partial<PlaybookFilters>) => {
    setLocalFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const clearFilters = useCallback(() => {
    setLocalFilters({});
  }, []);

  // Statistics
  const stats = useMemo(() => {
    const total = playbooks.length;
    const published = playbooks.filter(p => p.status === 'published').length;
    const drafts = playbooks.filter(p => p.status === 'draft').length;
    const templates = playbooks.filter(p => p.isTemplate).length;
    
    return { total, published, drafts, templates };
  }, [playbooks]);

  return {
    // Data
    playbooks,
    stats,
    filters: localFilters,
    
    // Loading states
    isLoading,
    error,
    
    // Actions
    create: createMutation.mutate,
    bulkDelete: bulkDeleteMutation.mutate,
    updateFilters,
    clearFilters,
    refetch,
    
    // Mutation states
    isCreating: createMutation.isPending,
    isBulkDeleting: bulkDeleteMutation.isPending
  };
};

// ============================================================================
// Playbook Editor Hook
// ============================================================================

/**
 * Hook para editor de playbooks
 */
export const usePlaybookEditor = (playbookId?: string): UsePlaybookEditorReturn => {
  const queryClient = useQueryClient();
  const playbookService = getPlaybookService();
  
  // Editor state
  const [editorState, setEditorState] = useState<PlaybookEditorState>({
    selectedBlockId: null,
    isEditing: false,
    isDirty: false,
    showComments: false,
    showHistory: false,
    collaborationMode: 'edit'
  });

  // Auto-save state
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Get playbook data
  const { playbook, blocks, isLoading } = usePlaybook(playbookId);

  // Block mutations
  const createBlockMutation = useMutation({
    mutationFn: ({ playbookId, block }: { playbookId: string; block: Partial<PlaybookBlock> }) =>
      playbookService.createBlock(playbookId, block),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playbook-blocks', playbookId] });
      setEditorState(prev => ({ ...prev, isDirty: true }));
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar bloco: ${error.message}`);
    }
  });

  const updateBlockMutation = useMutation({
    mutationFn: ({ blockId, data }: { blockId: string; data: Partial<PlaybookBlock> }) =>
      playbookService.updateBlock(blockId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playbook-blocks', playbookId] });
      setEditorState(prev => ({ ...prev, isDirty: true }));
      setLastSaved(new Date());
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar bloco: ${error.message}`);
    }
  });

  const deleteBlockMutation = useMutation({
    mutationFn: (blockId: string) => playbookService.deleteBlock(blockId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playbook-blocks', playbookId] });
      setEditorState(prev => ({ ...prev, isDirty: true, selectedBlockId: null }));
    },
    onError: (error: Error) => {
      toast.error(`Erro ao deletar bloco: ${error.message}`);
    }
  });

  const moveBlockMutation = useMutation({
    mutationFn: ({ blockId, targetId, position }: { 
      blockId: string; 
      targetId: string; 
      position: 'before' | 'after' | 'inside' 
    }) => playbookService.moveBlock(blockId, targetId, position),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playbook-blocks', playbookId] });
      setEditorState(prev => ({ ...prev, isDirty: true }));
    },
    onError: (error: Error) => {
      toast.error(`Erro ao mover bloco: ${error.message}`);
    }
  });

  // Editor actions
  const selectBlock = useCallback((blockId: string | null) => {
    setEditorState(prev => ({ ...prev, selectedBlockId: blockId }));
  }, []);

  const startEditing = useCallback(() => {
    setEditorState(prev => ({ ...prev, isEditing: true }));
  }, []);

  const stopEditing = useCallback(() => {
    setEditorState(prev => ({ ...prev, isEditing: false }));
  }, []);

  const toggleComments = useCallback(() => {
    setEditorState(prev => ({ ...prev, showComments: !prev.showComments }));
  }, []);

  const toggleHistory = useCallback(() => {
    setEditorState(prev => ({ ...prev, showHistory: !prev.showHistory }));
  }, []);

  // Block operations
  const createBlock = useCallback((type: PlaybookBlockType, position?: number) => {
    if (!playbookId) return;
    
    const newBlock: Partial<PlaybookBlock> = {
      type,
      properties: getDefaultBlockProperties(type),
      hasChildren: false,
      archived: false
    };
    
    createBlockMutation.mutate({ playbookId, block: newBlock });
  }, [playbookId, createBlockMutation]);

  const updateBlock = useCallback((blockId: string, data: Partial<PlaybookBlock>) => {
    updateBlockMutation.mutate({ blockId, data });
  }, [updateBlockMutation]);

  const deleteBlock = useCallback((blockId: string) => {
    deleteBlockMutation.mutate(blockId);
  }, [deleteBlockMutation]);

  const moveBlock = useCallback((blockId: string, targetId: string, position: 'before' | 'after' | 'inside') => {
    moveBlockMutation.mutate({ blockId, targetId, position });
  }, [moveBlockMutation]);

  const duplicateBlock = useCallback((blockId: string) => {
    const block = blocks.find(b => b.id === blockId);
    if (!block || !playbookId) return;
    
    const duplicatedBlock: Partial<PlaybookBlock> = {
      type: block.type,
      properties: { ...block.properties },
      hasChildren: false,
      archived: false
    };
    
    createBlockMutation.mutate({ playbookId, block: duplicatedBlock });
  }, [blocks, playbookId, createBlockMutation]);

  // Auto-save effect
  useEffect(() => {
    if (!autoSaveEnabled || !editorState.isDirty || !playbookId) return;
    
    const autoSaveTimer = setTimeout(() => {
      // Auto-save logic here
      setEditorState(prev => ({ ...prev, isDirty: false }));
      setLastSaved(new Date());
    }, 2000); // Auto-save after 2 seconds of inactivity
    
    return () => clearTimeout(autoSaveTimer);
  }, [editorState.isDirty, autoSaveEnabled, playbookId]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!editorState.isEditing) return;
      
      // Ctrl/Cmd + S for save
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        // Trigger save
        setEditorState(prev => ({ ...prev, isDirty: false }));
        setLastSaved(new Date());
      }
      
      // Ctrl/Cmd + Z for undo
      if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
        event.preventDefault();
        // Trigger undo
      }
      
      // Ctrl/Cmd + Shift + Z for redo
      if ((event.ctrlKey || event.metaKey) && event.key === 'z' && event.shiftKey) {
        event.preventDefault();
        // Trigger redo
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [editorState.isEditing]);

  return {
    // Data
    playbook,
    blocks,
    editorState,
    autoSaveEnabled,
    lastSaved,
    
    // Loading states
    isLoading,
    
    // Block operations
    createBlock,
    updateBlock,
    deleteBlock,
    moveBlock,
    duplicateBlock,
    
    // Editor actions
    selectBlock,
    startEditing,
    stopEditing,
    toggleComments,
    toggleHistory,
    setAutoSaveEnabled,
    
    // Mutation states
    isCreatingBlock: createBlockMutation.isPending,
    isUpdatingBlock: updateBlockMutation.isPending,
    isDeletingBlock: deleteBlockMutation.isPending,
    isMovingBlock: moveBlockMutation.isPending
  };
};

// ============================================================================
// Playbook Templates Hook
// ============================================================================

/**
 * Hook para gerenciar templates de playbooks
 */
export const usePlaybookTemplates = (filters: PlaybookFilters = {}): UsePlaybookTemplatesReturn => {
  const queryClient = useQueryClient();
  const playbookService = getPlaybookService();

  // Query for templates
  const {
    data: templates = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['playbook-templates', filters],
    queryFn: () => playbookService.getTemplates(filters),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30 // 30 minutes
  });

  // Create from template mutation
  const createFromTemplateMutation = useMutation({
    mutationFn: ({ templateId, data }: { templateId: string; data: Partial<PlaybookDocument> }) =>
      playbookService.createFromTemplate(templateId, data),
    onSuccess: (newPlaybook) => {
      queryClient.invalidateQueries({ queryKey: ['playbooks'] });
      toast.success('Playbook criado a partir do template!');
      return newPlaybook;
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar playbook: ${error.message}`);
    }
  });

  // Save as template mutation
  const saveAsTemplateMutation = useMutation({
    mutationFn: ({ playbookId, templateData }: { playbookId: string; templateData: Partial<PlaybookTemplate> }) =>
      playbookService.saveAsTemplate(playbookId, templateData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playbook-templates'] });
      toast.success('Template salvo com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao salvar template: ${error.message}`);
    }
  });

  // Template categories
  const categories = useMemo(() => {
    const categoryMap = new Map<PlaybookCategory, number>();
    templates.forEach(template => {
      const count = categoryMap.get(template.category) || 0;
      categoryMap.set(template.category, count + 1);
    });
    return Array.from(categoryMap.entries()).map(([category, count]) => ({
      category,
      count
    }));
  }, [templates]);

  // Popular templates
  const popularTemplates = useMemo(() => {
    return [...templates]
      .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
      .slice(0, 6);
  }, [templates]);

  // Recent templates
  const recentTemplates = useMemo(() => {
    return [...templates]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 6);
  }, [templates]);

  return {
    // Data
    templates,
    categories,
    popularTemplates,
    recentTemplates,
    
    // Loading states
    isLoading,
    error,
    
    // Actions
    createFromTemplate: createFromTemplateMutation.mutate,
    saveAsTemplate: saveAsTemplateMutation.mutate,
    refetch,
    
    // Mutation states
    isCreatingFromTemplate: createFromTemplateMutation.isPending,
    isSavingAsTemplate: saveAsTemplateMutation.isPending
  };
};

// ============================================================================
// Playbook Comments Hook
// ============================================================================

/**
 * Hook para gerenciar comentários de playbooks
 */
export const usePlaybookComments = (playbookId: string) => {
  const queryClient = useQueryClient();
  const playbookService = getPlaybookService();

  // Query for comments
  const {
    data: comments = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['playbook-comments', playbookId],
    queryFn: () => playbookService.getComments(playbookId),
    enabled: !!playbookId,
    staleTime: 1000 * 30 // 30 seconds
  });

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: ({ blockId, content }: { blockId: string; content: string }) =>
      playbookService.addComment(playbookId, blockId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playbook-comments', playbookId] });
      toast.success('Comentário adicionado!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao adicionar comentário: ${error.message}`);
    }
  });

  // Update comment mutation
  const updateCommentMutation = useMutation({
    mutationFn: ({ commentId, content }: { commentId: string; content: string }) =>
      playbookService.updateComment(commentId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playbook-comments', playbookId] });
      toast.success('Comentário atualizado!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar comentário: ${error.message}`);
    }
  });

  // Delete comment mutation
  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: string) => playbookService.deleteComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playbook-comments', playbookId] });
      toast.success('Comentário deletado!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao deletar comentário: ${error.message}`);
    }
  });

  // Resolve comment mutation
  const resolveCommentMutation = useMutation({
    mutationFn: (commentId: string) => playbookService.resolveComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playbook-comments', playbookId] });
      toast.success('Comentário resolvido!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao resolver comentário: ${error.message}`);
    }
  });

  // Comments by block
  const commentsByBlock = useMemo(() => {
    const map = new Map<string, PlaybookComment[]>();
    comments.forEach(comment => {
      const blockComments = map.get(comment.blockId) || [];
      blockComments.push(comment);
      map.set(comment.blockId, blockComments);
    });
    return map;
  }, [comments]);

  // Unresolved comments count
  const unresolvedCount = useMemo(() => {
    return comments.filter(comment => !comment.isResolved).length;
  }, [comments]);

  return {
    // Data
    comments,
    commentsByBlock,
    unresolvedCount,
    
    // Loading states
    isLoading,
    error,
    
    // Actions
    addComment: addCommentMutation.mutate,
    updateComment: updateCommentMutation.mutate,
    deleteComment: deleteCommentMutation.mutate,
    resolveComment: resolveCommentMutation.mutate,
    refetch,
    
    // Mutation states
    isAddingComment: addCommentMutation.isPending,
    isUpdatingComment: updateCommentMutation.isPending,
    isDeletingComment: deleteCommentMutation.isPending,
    isResolvingComment: resolveCommentMutation.isPending
  };
};

// ============================================================================
// Playbook Collaboration Hook
// ============================================================================

/**
 * Hook para gerenciar colaboração em playbooks
 */
export const usePlaybookCollaboration = (playbookId: string) => {
  const queryClient = useQueryClient();
  const playbookService = getPlaybookService();

  // Query for collaborators
  const {
    data: collaborators = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['playbook-collaborators', playbookId],
    queryFn: () => playbookService.getCollaborators(playbookId),
    enabled: !!playbookId,
    staleTime: 1000 * 60 * 5 // 5 minutes
  });

  // Add collaborator mutation
  const addCollaboratorMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      playbookService.addCollaborator(playbookId, userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playbook-collaborators', playbookId] });
      toast.success('Colaborador adicionado!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao adicionar colaborador: ${error.message}`);
    }
  });

  // Remove collaborator mutation
  const removeCollaboratorMutation = useMutation({
    mutationFn: (userId: string) => playbookService.removeCollaborator(playbookId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playbook-collaborators', playbookId] });
      toast.success('Colaborador removido!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao remover colaborador: ${error.message}`);
    }
  });

  // Update collaborator role mutation
  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      playbookService.updateCollaboratorRole(playbookId, userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playbook-collaborators', playbookId] });
      toast.success('Papel do colaborador atualizado!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar papel: ${error.message}`);
    }
  });

  return {
    // Data
    collaborators,
    
    // Loading states
    isLoading,
    error,
    
    // Actions
    addCollaborator: addCollaboratorMutation.mutate,
    removeCollaborator: removeCollaboratorMutation.mutate,
    updateRole: updateRoleMutation.mutate,
    refetch,
    
    // Mutation states
    isAddingCollaborator: addCollaboratorMutation.isPending,
    isRemovingCollaborator: removeCollaboratorMutation.isPending,
    isUpdatingRole: updateRoleMutation.isPending
  };
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Retorna propriedades padrão para um tipo de bloco
 */
function getDefaultBlockProperties(type: PlaybookBlockType): Record<string, unknown> {
  switch (type) {
    case 'paragraph':
      return {
        paragraph: {
          rich_text: [{
            type: 'text',
            text: { content: '' },
            annotations: {},
            plain_text: ''
          }]
        }
      };
    
    case 'heading_1':
    case 'heading_2':
    case 'heading_3':
      return {
        [type]: {
          rich_text: [{
            type: 'text',
            text: { content: '' },
            annotations: {},
            plain_text: ''
          }]
        }
      };
    
    case 'bulleted_list_item':
    case 'numbered_list_item':
      return {
        [type]: {
          rich_text: [{
            type: 'text',
            text: { content: '' },
            annotations: {},
            plain_text: ''
          }]
        }
      };
    
    case 'to_do':
      return {
        to_do: {
          rich_text: [{
            type: 'text',
            text: { content: '' },
            annotations: {},
            plain_text: ''
          }],
          checked: false
        }
      };
    
    case 'toggle':
      return {
        toggle: {
          rich_text: [{
            type: 'text',
            text: { content: '' },
            annotations: {},
            plain_text: ''
          }]
        }
      };
    
    case 'code':
      return {
        code: {
          rich_text: [{
            type: 'text',
            text: { content: '' },
            annotations: {},
            plain_text: ''
          }],
          language: 'javascript'
        }
      };
    
    case 'quote':
      return {
        quote: {
          rich_text: [{
            type: 'text',
            text: { content: '' },
            annotations: {},
            plain_text: ''
          }]
        }
      };
    
    case 'callout':
      return {
        callout: {
          rich_text: [{
            type: 'text',
            text: { content: '' },
            annotations: {},
            plain_text: ''
          }],
          icon: { emoji: '💡' }
        }
      };
    
    case 'divider':
      return { divider: {} };
    
    case 'image':
      return {
        image: {
          type: 'external',
          external: { url: '' },
          caption: []
        }
      };
    
    case 'video':
      return {
        video: {
          type: 'external',
          external: { url: '' },
          caption: []
        }
      };
    
    case 'file':
      return {
        file: {
          type: 'external',
          external: { url: '' },
          caption: [],
          name: ''
        }
      };
    
    case 'bookmark':
      return {
        bookmark: {
          url: '',
          caption: []
        }
      };
    
    case 'embed':
      return {
        embed: {
          url: '',
          caption: []
        }
      };
    
    case 'table':
      return {
        table: {
          table_width: 2,
          has_column_header: true,
          has_row_header: false
        }
      };
    
    case 'table_row':
      return {
        table_row: {
          cells: []
        }
      };
    
    default:
      return {};
  }
}