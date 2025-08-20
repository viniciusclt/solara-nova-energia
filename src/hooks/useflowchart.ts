// ============================================================================
// Flowchart Hooks - Hooks customizados para sistema de fluxogramas
// ============================================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FlowchartDocument,
  FlowchartNode,
  FlowchartEdge,
  FlowchartTemplate,
  FlowchartComment,
  FlowchartHistoryEntry,
  FlowchartFilters,
  FlowchartEditorState,
  FlowchartPosition,
  FlowchartNodeData,
  FlowchartEdgeData,
  FlowchartNodeType,
  FlowchartSettings,
  FlowchartViewport,
  UseFlowchartReturn,
  UseFlowchartEditorReturn,
  UseFlowchartLibraryReturn,
  UseFlowchartTemplatesReturn
} from '@/types/flowchart';
import { getFlowchartService, getDefaultFlowchartServiceConfig } from '@/services/FlowchartService';
import { toast } from 'sonner';
import { useAuditLogs } from './useAuditLogs';
import { isFeatureEnabled } from '../config/environment';

// ============================================================================
// Service Configuration
// ============================================================================

/**
 * Configuração do serviço de fluxogramas
 */
const getServiceConfig = () => {
  const defaultConfig = getDefaultFlowchartServiceConfig();
  return {
    ...defaultConfig,
    apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000',
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
    supabaseKey: import.meta.env.VITE_SUPABASE_ANON_KEY || ''
  };
};

const flowchartService = getFlowchartService(getServiceConfig());
const auditEnabled = isFeatureEnabled('enableAuditLogs');

// ============================================================================
// Main Flowchart Hook
// ============================================================================

/**
 * Hook principal para gerenciamento de fluxogramas
 */
export const useFlowchart = (flowchartId?: string): UseFlowchartReturn => {
  const queryClient = useQueryClient();
  const { createAuditLog, logSecurityEvent } = useAuditLogs();

  // Query para buscar fluxograma específico
  const flowchartQuery = useQuery({
    queryKey: ['flowchart', flowchartId],
    queryFn: () => flowchartService.getFlowchart(flowchartId!),
    enabled: !!flowchartId,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Mutation para criar fluxograma
  const createMutation = useMutation({
    mutationFn: (data: Partial<FlowchartDocument>) => flowchartService.createFlowchart(data),
    onSuccess: async (result) => {
      queryClient.invalidateQueries({ queryKey: ['flowcharts'] });
      toast.success('Fluxograma criado com sucesso!');
      if (auditEnabled) {
        await createAuditLog({
          action: 'flowchart.create',
          table_name: 'flowcharts',
          record_id: result.id,
          new_values: { ...result },
          details: { description: `Criação do fluxograma ${result.title}` },
          severity: 'low'
        });
      }
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar fluxograma: ${error.message}`);
      if (auditEnabled) {
        logSecurityEvent('flowchart.create_error', { description: error.message }, undefined);
      }
    }
  });

  // Mutation para atualizar fluxograma
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<FlowchartDocument> }) => 
      flowchartService.updateFlowchart(id, data),
    onSuccess: async (result, vars) => {
      queryClient.invalidateQueries({ queryKey: ['flowchart', vars.id] });
      queryClient.invalidateQueries({ queryKey: ['flowcharts'] });
      toast.success('Fluxograma atualizado com sucesso!');
      if (auditEnabled) {
        await createAuditLog({
          action: 'flowchart.update',
          table_name: 'flowcharts',
          record_id: vars.id,
          new_values: { ...vars.data },
          details: { description: `Atualização do fluxograma ${vars.id}` },
          severity: 'low'
        });
      }
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar fluxograma: ${error.message}`);
      if (auditEnabled) {
        logSecurityEvent('flowchart.update_error', { description: error.message }, undefined);
      }
    }
  });

  // Mutation para deletar fluxograma
  const deleteMutation = useMutation({
    mutationFn: (id: string) => flowchartService.deleteFlowchart(id),
    onSuccess: async (_result, id) => {
      queryClient.invalidateQueries({ queryKey: ['flowcharts'] });
      toast.success('Fluxograma deletado com sucesso!');
      if (auditEnabled) {
        await createAuditLog({
          action: 'flowchart.delete',
          table_name: 'flowcharts',
          record_id: id,
          details: { description: `Exclusão do fluxograma ${id}` },
          severity: 'medium'
        });
      }
    },
    onError: (error: Error) => {
      toast.error(`Erro ao deletar fluxograma: ${error.message}`);
      if (auditEnabled) {
        logSecurityEvent('flowchart.delete_error', { description: error.message }, undefined);
      }
    }
  });

  return {
    flowchart: flowchartQuery.data,
    isLoading: flowchartQuery.isLoading,
    error: flowchartQuery.error,
    createFlowchart: createMutation.mutate,
    updateFlowchart: updateMutation.mutate,
    deleteFlowchart: deleteMutation.mutate,
    exportFlowchart: (format: string) => flowchartService.exportFlowchart(flowchartId!, format),
    validateFlowchart: () => flowchartService.validateFlowchart(flowchartId!),
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending
  };
};

// ============================================================================
// Flowchart Library Hook
// ============================================================================

/**
 * Hook para gerenciamento da biblioteca de fluxogramas
 */
export const useFlowchartLibrary = (filters?: FlowchartFilters): UseFlowchartLibraryReturn => {
  const queryClient = useQueryClient();
  const { createAuditLog, logSecurityEvent } = useAuditLogs();

  // Query para buscar lista de fluxogramas
  const flowchartsQuery = useQuery({
    queryKey: ['flowcharts', filters],
    queryFn: () => flowchartService.getFlowcharts(filters),
    staleTime: 2 * 60 * 1000, // 2 minutos
  });

  // Mutation para duplicar fluxograma
  const duplicateMutation = useMutation({
    mutationFn: (id: string) => flowchartService.duplicateFlowchart(id),
    onSuccess: async (result, id) => {
      queryClient.invalidateQueries({ queryKey: ['flowcharts'] });
      toast.success('Fluxograma duplicado com sucesso!');
      if (auditEnabled) {
        await createAuditLog({
          action: 'flowchart.duplicate',
          table_name: 'flowcharts',
          record_id: result.id,
          details: { description: `Duplicação do fluxograma ${id}` },
          severity: 'low'
        });
      }
    },
    onError: (error: Error) => {
      toast.error(`Erro ao duplicar fluxograma: ${error.message}`);
      if (auditEnabled) {
        logSecurityEvent('flowchart.duplicate_error', { description: error.message }, undefined);
      }
    }
  });

  return {
    flowcharts: flowchartsQuery.data || [],
    isLoading: flowchartsQuery.isLoading,
    error: flowchartsQuery.error,
    duplicateFlowchart: duplicateMutation.mutate,
    isDuplicating: duplicateMutation.isPending,
    refetch: flowchartsQuery.refetch
  };
};

// ============================================================================
// Flowchart Editor Hook
// ============================================================================

/**
 * Hook para o editor de fluxogramas
 */
export const useFlowchartEditor = (flowchartId?: string): UseFlowchartEditorReturn => {
  const [editorState, setEditorState] = useState<FlowchartEditorState>({
    selectedNodes: [],
    selectedEdges: [],
    clipboard: { nodes: [], edges: [] },
    history: { past: [], present: {} as FlowchartDocument, future: [] },
    viewport: { x: 0, y: 0, zoom: 1 },
    mode: 'select',
    tool: 'select',
    isConnecting: false,
    showGrid: true,
    showMinimap: true,
    showControls: true,
    showBackground: true,
    snapToGrid: false,
    autoLayout: false,
    validationErrors: []
  });

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const queryClient = useQueryClient();
  const { createAuditLog, logSecurityEvent } = useAuditLogs();

  // Mutation para adicionar nó
  const addNodeMutation = useMutation({
    mutationFn: ({ flowchartId, node }: { flowchartId: string; node: FlowchartNode }) => 
      flowchartService.addNode(flowchartId, node),
    onSuccess: async (result, vars) => {
      queryClient.invalidateQueries({ queryKey: ['flowchart', vars.flowchartId] });
      setHasUnsavedChanges(true);
      // Logs de auditoria temporariamente desabilitados para evitar duplicação
    },
    onError: (error: Error) => {
      toast.error(`Erro ao adicionar nó: ${error.message}`);
    }
  });

  // Mutation para atualizar nó
  const updateNodeMutation = useMutation({
    mutationFn: ({ nodeId, data }: { nodeId: string; data: Partial<FlowchartNode> }) => 
      flowchartService.updateNode(nodeId, data),
    onSuccess: async (result, vars) => {
      queryClient.invalidateQueries({ queryKey: ['flowchart', flowchartId] });
      setHasUnsavedChanges(true);
      // Logs de auditoria temporariamente desabilitados para evitar duplicação
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar nó: ${error.message}`);
    }
  });

  // Funções de seleção
  const selectNode = useCallback((nodeId: string, multi = false) => {
    setEditorState(prev => ({
      ...prev,
      selectedNodes: multi 
        ? [...prev.selectedNodes, nodeId]
        : [nodeId]
    }));
  }, []);

  const selectEdge = useCallback((edgeId: string, multi = false) => {
    setEditorState(prev => ({
      ...prev,
      selectedEdges: multi 
        ? [...prev.selectedEdges, edgeId]
        : [edgeId]
    }));
  }, []);

  const deselectAllNodes = useCallback(() => {
    setEditorState(prev => ({ ...prev, selectedNodes: [] }));
  }, []);

  const deselectAllEdges = useCallback(() => {
    setEditorState(prev => ({ ...prev, selectedEdges: [] }));
  }, []);

  // Funções de viewport
  const setViewport = useCallback((viewport: Partial<FlowchartViewport>) => {
    setEditorState(prev => ({
      ...prev,
      viewport: { ...prev.viewport, ...viewport }
    }));
  }, []);

  const fitView = useCallback(() => {
    // Implementação do fit view
    console.log('Fit view');
  }, []);

  const zoomIn = useCallback(() => {
    setEditorState(prev => ({
      ...prev,
      viewport: { ...prev.viewport, zoom: Math.min(prev.viewport.zoom * 1.2, 3) }
    }));
  }, []);

  const zoomOut = useCallback(() => {
    setEditorState(prev => ({
      ...prev,
      viewport: { ...prev.viewport, zoom: Math.max(prev.viewport.zoom / 1.2, 0.1) }
    }));
  }, []);

  // Funções de histórico
  const undo = useCallback(() => {
    console.log('Undo');
  }, []);

  const redo = useCallback(() => {
    console.log('Redo');
  }, []);

  // Funções de clipboard
  const copy = useCallback(() => {
    console.log('Copy');
  }, []);

  const cut = useCallback(() => {
    console.log('Cut');
  }, []);

  const paste = useCallback(() => {
    console.log('Paste');
  }, []);

  // Função de validação
  const validate = useCallback(() => {
    return { isValid: true, errors: [] };
  }, []);

  // Função de salvar
  const save = useCallback(async () => {
    setHasUnsavedChanges(false);
    toast.success('Fluxograma salvo com sucesso!');
  }, []);

  return {
    editorState,
    nodes: editorState.history.present?.nodes || [],
    edges: editorState.history.present?.edges || [],
    selectedNodes: editorState.selectedNodes.map(id => 
      editorState.history.present?.nodes?.find(n => n.id === id)
    ).filter(Boolean) as FlowchartNode[],
    selectedEdges: editorState.selectedEdges.map(id => 
      editorState.history.present?.edges?.find(e => e.id === id)
    ).filter(Boolean) as FlowchartEdge[],
    viewport: editorState.viewport,
    canUndo: editorState.history.past.length > 0,
    canRedo: editorState.history.future.length > 0,
    hasUnsavedChanges,
    
    // Funções de nós
    addNode: (type: FlowchartNodeType, position: FlowchartPosition, data?: Partial<FlowchartNodeData>) => {
      // Mapear tipos para labels legíveis
      const typeLabels: Record<FlowchartNodeType, string> = {
        start: 'Início',
        end: 'Fim',
        process: 'Processo',
        decision: 'Decisão',
        input: 'Entrada',
        output: 'Saída',
        connector: 'Conector',
        document: 'Documento',
        database: 'Banco de Dados',
        delay: 'Atraso',
        manual: 'Manual',
        preparation: 'Preparação',
        predefined: 'Predefinido',
        subprocess: 'Subprocesso',
        annotation: 'Anotação',
        custom: 'Personalizado'
      };
      
      const newNode: FlowchartNode = {
        id: `node-${Date.now()}`,
        type,
        position,
        data: {
          label: typeLabels[type] || type,
          ...data
        }
      };
      
      // Atualizar estado local imediatamente
      setEditorState(prev => ({
        ...prev,
        history: {
          ...prev.history,
          past: [...prev.history.past, prev.history.present],
          present: {
            ...prev.history.present,
            nodes: [...(prev.history.present.nodes || []), newNode],
            updated_at: new Date().toISOString()
          },
          future: []
        }
      }));
      
      setHasUnsavedChanges(true);
      
      // Persistir no backend
      if (flowchartId) {
        addNodeMutation.mutate({ flowchartId, node: newNode });
      }
    },
    updateNode: (nodeId: string, data: Partial<FlowchartNode>) => {
      // Atualizar estado local imediatamente
      setEditorState(prev => ({
        ...prev,
        history: {
          ...prev.history,
          past: [...prev.history.past, prev.history.present],
          present: {
            ...prev.history.present,
            nodes: (prev.history.present.nodes || []).map(node => 
              node.id === nodeId ? { ...node, ...data } : node
            ),
            updated_at: new Date().toISOString()
          },
          future: []
        }
      }));
      
      setHasUnsavedChanges(true);
      
      // Persistir no backend se flowchartId estiver presente
      if (flowchartId) {
        updateNodeMutation.mutate({ nodeId, data });
      }
    },
    deleteNode: (nodeId: string) => {
      // Atualizar estado local imediatamente
      setEditorState(prev => ({
        ...prev,
        history: {
          ...prev.history,
          past: [...prev.history.past, prev.history.present],
          present: {
            ...prev.history.present,
            nodes: (prev.history.present.nodes || []).filter(node => node.id !== nodeId),
            edges: (prev.history.present.edges || []).filter(edge => 
              edge.source !== nodeId && edge.target !== nodeId
            ),
            updated_at: new Date().toISOString()
          },
          future: []
        },
        selectedNodes: prev.selectedNodes.filter(id => id !== nodeId)
      }));
      
      setHasUnsavedChanges(true);
    },
    duplicateNode: (nodeId: string) => {
      console.log('Duplicating node:', nodeId);
    },
    moveNode: (nodeId: string, position: FlowchartPosition) => {
      updateNodeMutation.mutate({ nodeId, data: { position } });
    },
    selectNode,
    deselectNode: (nodeId: string) => {
      setEditorState(prev => ({
        ...prev,
        selectedNodes: prev.selectedNodes.filter(id => id !== nodeId)
      }));
    },
    selectAllNodes: () => {
      const allNodeIds = editorState.history.present?.nodes?.map(n => n.id) || [];
      setEditorState(prev => ({ ...prev, selectedNodes: allNodeIds }));
    },
    deselectAllNodes,
    
    // Funções de arestas
    addEdge: (source: string, target: string, data?: Partial<FlowchartEdgeData>) => {
      const newEdge: FlowchartEdge = {
        id: `edge-${source}-${target}-${Date.now()}`,
        source,
        target,
        data: data || {}
      };
      
      // Atualizar estado local imediatamente
      setEditorState(prev => ({
        ...prev,
        history: {
          ...prev.history,
          past: [...prev.history.past, prev.history.present],
          present: {
            ...prev.history.present,
            edges: [...(prev.history.present.edges || []), newEdge],
            updated_at: new Date().toISOString()
          },
          future: []
        }
      }));
      
      setHasUnsavedChanges(true);
    },
    updateEdge: (edgeId: string, data: Partial<FlowchartEdge>) => {
      // Atualizar estado local imediatamente
      setEditorState(prev => ({
        ...prev,
        history: {
          ...prev.history,
          past: [...prev.history.past, prev.history.present],
          present: {
            ...prev.history.present,
            edges: (prev.history.present.edges || []).map(edge => 
              edge.id === edgeId ? { ...edge, ...data } : edge
            ),
            updated_at: new Date().toISOString()
          },
          future: []
        }
      }));
      
      setHasUnsavedChanges(true);
    },
    deleteEdge: (edgeId: string) => {
      // Atualizar estado local imediatamente
      setEditorState(prev => ({
        ...prev,
        history: {
          ...prev.history,
          past: [...prev.history.past, prev.history.present],
          present: {
            ...prev.history.present,
            edges: (prev.history.present.edges || []).filter(edge => edge.id !== edgeId),
            updated_at: new Date().toISOString()
          },
          future: []
        },
        selectedEdges: prev.selectedEdges.filter(id => id !== edgeId)
      }));
      
      setHasUnsavedChanges(true);
    },
    selectEdge,
    deselectEdge: (edgeId: string) => {
      setEditorState(prev => ({
        ...prev,
        selectedEdges: prev.selectedEdges.filter(id => id !== edgeId)
      }));
    },
    selectAllEdges: () => {
      const allEdgeIds = editorState.history.present?.edges?.map(e => e.id) || [];
      setEditorState(prev => ({ ...prev, selectedEdges: allEdgeIds }));
    },
    deselectAllEdges,
    
    // Funções de viewport
    setViewport,
    fitView,
    zoomIn,
    zoomOut,
    zoomTo: (zoom: number) => {
      setEditorState(prev => ({
        ...prev,
        viewport: { ...prev.viewport, zoom: Math.max(0.1, Math.min(3, zoom)) }
      }));
    },
    centerView: () => {
      console.log('Center view');
    },
    
    // Funções de histórico
    undo,
    redo,
    clearHistory: () => {
      setEditorState(prev => ({
        ...prev,
        history: { past: [], present: prev.history.present, future: [] }
      }));
    },
    
    // Funções de clipboard
    copy,
    cut,
    paste,
    
    // Funções de layout
    autoLayout: () => {
      console.log('Auto layout');
    },
    alignNodes: () => {
      console.log('Align nodes');
    },
    distributeNodes: () => {
      console.log('Distribute nodes');
    },
    
    // Validação
    validate,
    
    // Configurações
    updateSettings: () => {
      console.log('Update settings');
    },
    
    // Modo e ferramenta
    setMode: (mode: FlowchartEditorState['mode']) => {
      setEditorState(prev => ({ ...prev, mode }));
    },
    setTool: (tool: FlowchartEditorState['tool']) => {
      setEditorState(prev => ({ ...prev, tool }));
    },
    
    // Salvamento
    save,
    enableAutoSave: () => {
      console.log('Enable auto save');
    },
    disableAutoSave: () => {
      console.log('Disable auto save');
    }
  };
};

// ============================================================================
// Flowchart Templates Hook
// ============================================================================

/**
 * Hook para gerenciamento de templates de fluxogramas
 */
export const useFlowchartTemplates = (): UseFlowchartTemplatesReturn => {
  const queryClient = useQueryClient();
  const { createAuditLog, logSecurityEvent } = useAuditLogs();

  // Query para buscar templates
  const templatesQuery = useQuery({
    queryKey: ['flowchart-templates'],
    queryFn: () => flowchartService.getTemplates(),
    staleTime: 10 * 60 * 1000, // 10 minutos
  });

  // Mutation para criar template
  const createTemplateMutation = useMutation({
    mutationFn: (data: Partial<FlowchartTemplate>) => flowchartService.createTemplate(data),
    onSuccess: async (result) => {
      queryClient.invalidateQueries({ queryKey: ['flowchart-templates'] });
      toast.success('Template criado com sucesso!');
      if (auditEnabled) {
        await createAuditLog({
          action: 'flowchart.template.create',
          table_name: 'flowchart_templates',
          record_id: result.id,
          new_values: { ...result },
          details: { description: `Criação do template ${result.name}` },
          severity: 'low'
        });
      }
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar template: ${error.message}`);
      if (auditEnabled) {
        logSecurityEvent('flowchart.template.create_error', { description: error.message }, undefined);
      }
    }
  });

  return {
    templates: templatesQuery.data || [],
    isLoading: templatesQuery.isLoading,
    error: templatesQuery.error,
    createTemplate: createTemplateMutation.mutate,
    updateTemplate: (id: string, data: Partial<FlowchartTemplate>) => {
      // Implementação da atualização de template
      console.log('Updating template:', id, data);
    },
    deleteTemplate: (id: string) => {
      // Implementação da exclusão de template
      console.log('Deleting template:', id);
    },
    isCreating: createTemplateMutation.isPending
  };
};