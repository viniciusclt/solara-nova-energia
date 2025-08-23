// ============================================================================
// Hook useNLPDiagram - Interface React para geração de diagramas via NLP
// ============================================================================

import { useState, useCallback } from 'react';
import { Node, Edge } from 'reactflow';
import { nlpDiagramService, NLPProcessingResult } from '../services/NLPDiagramService';
import { DiagramType } from '../types/diagrams';
import { toast } from 'sonner';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

export interface NLPDiagramState {
  isProcessing: boolean;
  result: NLPProcessingResult | null;
  error: string | null;
  history: NLPProcessingResult[];
}

export interface UseNLPDiagramReturn {
  // Estado
  state: NLPDiagramState;
  
  // Ações
  processText: (text: string, preferredType?: DiagramType) => Promise<void>;
  clearResult: () => void;
  clearHistory: () => void;
  retryLastProcessing: () => Promise<void>;
  
  // Utilitários
  applyToDiagram: (onApply: (nodes: Node[], edges: Edge[]) => void) => void;
  exportResult: () => string | null;
  getConfidenceLevel: () => 'low' | 'medium' | 'high' | null;
  getSuggestions: () => string[];
}

// ============================================================================
// HOOK PRINCIPAL
// ============================================================================

export function useNLPDiagram(): UseNLPDiagramReturn {
  // ============================================================================
  // ESTADO
  // ============================================================================
  
  const [state, setState] = useState<NLPDiagramState>({
    isProcessing: false,
    result: null,
    error: null,
    history: []
  });
  
  const [lastProcessingParams, setLastProcessingParams] = useState<{
    text: string;
    preferredType?: DiagramType;
  } | null>(null);
  
  // ============================================================================
  // PROCESSAMENTO DE TEXTO
  // ============================================================================
  
  const processText = useCallback(async (text: string, preferredType?: DiagramType) => {
    if (!text.trim()) {
      toast.error('Por favor, insira um texto para processar');
      return;
    }
    
    // Salvar parâmetros para retry
    setLastProcessingParams({ text, preferredType });
    
    setState(prev => ({
      ...prev,
      isProcessing: true,
      error: null
    }));
    
    try {
      toast.info('Processando texto com IA...', {
        description: 'Analisando e gerando diagrama'
      });
      
      const result = await nlpDiagramService.processText(text, preferredType);
      
      setState(prev => ({
        ...prev,
        isProcessing: false,
        result,
        history: [result, ...prev.history.slice(0, 9)] // Manter últimos 10
      }));
      
      if (result.success) {
        toast.success('Diagrama gerado com sucesso!', {
          description: `Tipo: ${getDiagramTypeLabel(result.diagramType)} | Confiança: ${Math.round(result.confidence * 100)}%`
        });
        
        // Mostrar sugestões se houver
        if (result.suggestions && result.suggestions.length > 0) {
          setTimeout(() => {
            toast.info('Sugestões de melhoria:', {
              description: result.suggestions?.[0]
            });
          }, 2000);
        }
      } else {
        toast.error('Erro ao processar texto', {
          description: result.errors?.[0] || 'Erro desconhecido'
        });
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      setState(prev => ({
        ...prev,
        isProcessing: false,
        error: errorMessage
      }));
      
      toast.error('Erro no processamento NLP', {
        description: errorMessage
      });
      
      console.error('Erro no processamento NLP:', error);
    }
  }, []);
  
  // ============================================================================
  // RETRY DO ÚLTIMO PROCESSAMENTO
  // ============================================================================
  
  const retryLastProcessing = useCallback(async () => {
    if (!lastProcessingParams) {
      toast.error('Nenhum processamento anterior para repetir');
      return;
    }
    
    await processText(lastProcessingParams.text, lastProcessingParams.preferredType);
  }, [lastProcessingParams, processText]);
  
  // ============================================================================
  // LIMPEZA DE DADOS
  // ============================================================================
  
  const clearResult = useCallback(() => {
    setState(prev => ({
      ...prev,
      result: null,
      error: null
    }));
  }, []);
  
  const clearHistory = useCallback(() => {
    setState(prev => ({
      ...prev,
      history: []
    }));
    
    toast.success('Histórico limpo');
  }, []);
  
  // ============================================================================
  // APLICAÇÃO AO DIAGRAMA
  // ============================================================================
  
  const applyToDiagram = useCallback((onApply: (nodes: Node[], edges: Edge[]) => void) => {
    if (!state.result || !state.result.success) {
      toast.error('Nenhum resultado válido para aplicar');
      return;
    }
    
    try {
      onApply(state.result.nodes, state.result.edges);
      
      toast.success('Diagrama aplicado com sucesso!', {
        description: `${state.result.nodes.length} nós e ${state.result.edges.length} conexões adicionados`
      });
      
    } catch (error) {
      toast.error('Erro ao aplicar diagrama', {
        description: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }, [state.result]);
  
  // ============================================================================
  // EXPORTAÇÃO
  // ============================================================================
  
  const exportResult = useCallback((): string | null => {
    if (!state.result || !state.result.success) {
      toast.error('Nenhum resultado para exportar');
      return null;
    }
    
    try {
      const exportData = {
        title: state.result.title,
        description: state.result.description,
        diagramType: state.result.diagramType,
        confidence: state.result.confidence,
        nodes: state.result.nodes,
        edges: state.result.edges,
        suggestions: state.result.suggestions,
        generatedAt: new Date().toISOString()
      };
      
      const jsonString = JSON.stringify(exportData, null, 2);
      
      // Criar e baixar arquivo
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `diagrama-nlp-${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('Resultado exportado com sucesso!');
      
      return jsonString;
      
    } catch (error) {
      toast.error('Erro ao exportar resultado');
      return null;
    }
  }, [state.result]);
  
  // ============================================================================
  // UTILITÁRIOS
  // ============================================================================
  
  const getConfidenceLevel = useCallback((): 'low' | 'medium' | 'high' | null => {
    if (!state.result) return null;
    
    const confidence = state.result.confidence;
    if (confidence >= 0.7) return 'high';
    if (confidence >= 0.5) return 'medium';
    return 'low';
  }, [state.result]);
  
  const getSuggestions = useCallback((): string[] => {
    return state.result?.suggestions || [];
  }, [state.result]);
  
  // ============================================================================
  // RETORNO DO HOOK
  // ============================================================================
  
  return {
    state,
    processText,
    clearResult,
    clearHistory,
    retryLastProcessing,
    applyToDiagram,
    exportResult,
    getConfidenceLevel,
    getSuggestions
  };
}

// ============================================================================
// UTILITÁRIOS AUXILIARES
// ============================================================================

function getDiagramTypeLabel(type: DiagramType): string {
  const labels = {
    flowchart: 'Fluxograma',
    bpmn: 'BPMN',
    mindmap: 'Mapa Mental',
    orgchart: 'Organograma'
  };
  
  return labels[type] || type;
}

// ============================================================================
// HOOK PARA HISTÓRICO
// ============================================================================

export function useNLPHistory() {
  const { state, clearHistory } = useNLPDiagram();
  
  const getHistoryStats = useCallback(() => {
    const history = state.history;
    const totalProcessed = history.length;
    const successfulProcessed = history.filter(r => r.success).length;
    const averageConfidence = history.length > 0 
      ? history.reduce((sum, r) => sum + r.confidence, 0) / history.length 
      : 0;
    
    const typeDistribution = history.reduce((acc, r) => {
      acc[r.diagramType] = (acc[r.diagramType] || 0) + 1;
      return acc;
    }, {} as Record<DiagramType, number>);
    
    return {
      totalProcessed,
      successfulProcessed,
      successRate: totalProcessed > 0 ? successfulProcessed / totalProcessed : 0,
      averageConfidence,
      typeDistribution
    };
  }, [state.history]);
  
  return {
    history: state.history,
    clearHistory,
    getHistoryStats
  };
}

export default useNLPDiagram;