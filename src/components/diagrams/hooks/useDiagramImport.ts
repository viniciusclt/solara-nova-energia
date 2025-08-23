// ============================================================================
// Hook para Import de Diagramas
// ============================================================================

import { useCallback, useState } from 'react';
import { useReactFlow } from 'reactflow';
import { secureLogger } from '@/utils/secureLogger';
import { useDiagramStore } from '../stores/useDiagramStore';
import type { DiagramDocument, ImportFormat, ImportOptions, DiagramNode, DiagramEdge } from '../types';

export interface ImportResult {
  success: boolean;
  document?: DiagramDocument;
  error?: string;
  warnings?: string[];
}

export const useDiagramImport = () => {
  const { setNodes, setEdges, fitView } = useReactFlow();
  const [isImporting, setIsImporting] = useState(false);
  const { loadDocument, addNode, addEdge } = useDiagramStore();

  // Validar estrutura do documento
  const validateDocument = useCallback((data: unknown): { isValid: boolean; warnings: string[] } => {
    const warnings: string[] = [];
    
    if (!data || typeof data !== 'object') {
      return { isValid: false, warnings: ['Arquivo não contém dados válidos'] };
    }

    // Verificar campos obrigatórios
    if (!data.id) {
      warnings.push('ID do documento não encontrado, será gerado automaticamente');
    }

    if (!data.title) {
      warnings.push('Título do documento não encontrado');
    }

    if (!Array.isArray(data.nodes)) {
      return { isValid: false, warnings: ['Nós do diagrama não encontrados ou inválidos'] };
    }

    if (!Array.isArray(data.edges)) {
      warnings.push('Arestas do diagrama não encontradas, será criado diagrama apenas com nós');
    }

    // Validar nós
    const invalidNodes = data.nodes.filter((node: Record<string, unknown>) => 
      !node.id || !node.type || !node.position
    );
    
    if (invalidNodes.length > 0) {
      warnings.push(`${invalidNodes.length} nós com estrutura inválida serão ignorados`);
    }

    // Validar arestas
    if (data.edges && Array.isArray(data.edges)) {
      const invalidEdges = data.edges.filter((edge: Record<string, unknown>) => 
        !edge.id || !edge.source || !edge.target
      );
      
      if (invalidEdges.length > 0) {
        warnings.push(`${invalidEdges.length} arestas com estrutura inválida serão ignoradas`);
      }
    }

    return { isValid: true, warnings };
  }, []);

  // Sanitizar e corrigir dados
  const sanitizeDocument = useCallback((data: Record<string, unknown>): DiagramDocument => {
    const sanitized: DiagramDocument = {
      id: data.id || `imported-${Date.now()}`,
      title: data.title || 'Diagrama Importado',
      description: data.description || '',
      type: data.type || 'flowchart',
      nodes: [],
      edges: [],
      metadata: {
        ...data.metadata,
        importedAt: new Date().toISOString(),
        originalVersion: data.version || 'unknown'
      },
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Sanitizar nós
    if (Array.isArray(data.nodes)) {
      sanitized.nodes = data.nodes
        .filter((node: Record<string, unknown>) => node.id && node.type && node.position)
        .map((node: Record<string, unknown>): DiagramNode => ({
          id: String(node.id),
          type: node.type,
          position: {
            x: Number(node.position.x) || 0,
            y: Number(node.position.y) || 0
          },
          data: {
            label: node.data?.label || node.label || 'Nó Importado',
            ...node.data
          },
          width: node.width,
          height: node.height,
          selected: false,
          dragging: false,
          deletable: node.deletable !== false,
          selectable: node.selectable !== false
        }));
    }

    // Sanitizar arestas
    if (Array.isArray(data.edges)) {
      sanitized.edges = data.edges
        .filter((edge: Record<string, unknown>) => edge.id && edge.source && edge.target)
        .map((edge: Record<string, unknown>): DiagramEdge => ({
          id: String(edge.id),
          source: String(edge.source),
          target: String(edge.target),
          sourceHandle: edge.sourceHandle,
          targetHandle: edge.targetHandle,
          type: edge.type || 'default',
          data: edge.data || {},
          label: edge.label,
          animated: edge.animated || false,
          selected: false,
          deletable: edge.deletable !== false,
          selectable: edge.selectable !== false
        }));
    }

    return sanitized;
  }, []);

  // Import de arquivo JSON
  const importFromJSON = useCallback(async (file: File): Promise<ImportResult> => {
    try {
      setIsImporting(true);
      secureLogger.info('Iniciando import de arquivo JSON', { filename: file.name });

      const text = await file.text();
      const data = JSON.parse(text);

      const validation = validateDocument(data);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.warnings.join(', ')
        };
      }

      const document = sanitizeDocument(data);
      
      secureLogger.info('Import JSON concluído com sucesso', {
        filename: file.name,
        nodesCount: document.nodes.length,
        edgesCount: document.edges.length
      });

      return {
        success: true,
        document,
        warnings: validation.warnings
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      secureLogger.error('Erro no import JSON:', { error: errorMessage, filename: file.name });
      return {
        success: false,
        error: `Erro ao processar arquivo JSON: ${errorMessage}`
      };
    } finally {
      setIsImporting(false);
    }
  }, [validateDocument, sanitizeDocument]);

  // Import de texto/dados
  const importFromData = useCallback(async (data: string | object): Promise<ImportResult> => {
    try {
      setIsImporting(true);
      secureLogger.info('Iniciando import de dados');

      let parsedData: unknown;
      if (typeof data === 'string') {
        parsedData = JSON.parse(data);
      } else {
        parsedData = data;
      }

      const validation = validateDocument(parsedData);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.warnings.join(', ')
        };
      }

      const document = sanitizeDocument(parsedData);
      
      secureLogger.info('Import de dados concluído com sucesso', {
        nodesCount: document.nodes.length,
        edgesCount: document.edges.length
      });

      return {
        success: true,
        document,
        warnings: validation.warnings
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      secureLogger.error('Erro no import de dados:', { error: errorMessage });
      return {
        success: false,
        error: `Erro ao processar dados: ${errorMessage}`
      };
    } finally {
      setIsImporting(false);
    }
  }, [validateDocument, sanitizeDocument]);

  // Aplicar documento importado
  const applyImportedDocument = useCallback(async (
    document: DiagramDocument,
    options: ImportOptions = {}
  ) => {
    try {
      secureLogger.info('Aplicando documento importado', {
        documentId: document.id,
        merge: options.merge
      });

      if (options.merge) {
        // Modo merge: adicionar nós e arestas ao diagrama atual
        for (const node of document.nodes) {
          await addNode(node);
        }
        for (const edge of document.edges) {
          await addEdge(edge);
        }
      } else {
        // Modo replace: substituir diagrama atual
        loadDocument(document);
        setNodes(document.nodes);
        setEdges(document.edges);
      }

      // Ajustar visualização
      if (options.fitView !== false) {
        setTimeout(() => fitView({ duration: 800 }), 100);
      }

      secureLogger.info('Documento aplicado com sucesso');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      secureLogger.error('Erro ao aplicar documento:', { error: errorMessage });
      throw error;
    }
  }, [loadDocument, setNodes, setEdges, addNode, addEdge, fitView]);

  // Import completo
  const importDiagram = useCallback(async (
    source: File | string | object,
    options: ImportOptions = {}
  ): Promise<ImportResult> => {
    try {
      let result: ImportResult;

      if (source instanceof File) {
        result = await importFromJSON(source);
      } else {
        result = await importFromData(source);
      }

      if (result.success && result.document) {
        await applyImportedDocument(result.document, options);
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      secureLogger.error('Erro no import do diagrama:', { error: errorMessage });
      return {
        success: false,
        error: errorMessage
      };
    }
  }, [importFromJSON, importFromData, applyImportedDocument]);

  return {
    isImporting,
    importFromJSON,
    importFromData,
    importDiagram,
    applyImportedDocument,
    validateDocument
  };
};