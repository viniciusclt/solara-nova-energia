// ============================================================================
// Hook para Export de Diagramas
// ============================================================================

import { useCallback, useState } from 'react';
import { useReactFlow, getNodesBounds, getViewportForBounds } from 'reactflow';
import { toPng, toJpeg, toSvg } from 'html-to-image';
import { secureLogger } from '@/utils/secureLogger';
import { useDiagramStore } from '../stores/useDiagramStore';
import type { DiagramDocument, ExportFormat, ExportOptions } from '../types';

export interface ExportResult {
  success: boolean;
  data?: string | Blob;
  error?: string;
}

export const useDiagramExport = () => {
  const { getNodes, getEdges } = useReactFlow();
  const [isExporting, setIsExporting] = useState(false);
  const document = useDiagramStore((state) => state.document);

  // Export como JSON
  const exportAsJSON = useCallback(async (): Promise<ExportResult> => {
    try {
      setIsExporting(true);
      secureLogger.info('Iniciando export JSON do diagrama');

      const exportData: DiagramDocument = {
        ...document,
        nodes: getNodes(),
        edges: getEdges(),
        exportedAt: new Date().toISOString(),
        version: '2.0.0'
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      
      secureLogger.info('Export JSON concluído com sucesso');
      return { success: true, data: blob };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      secureLogger.error('Erro no export JSON:', { error: errorMessage });
      return { success: false, error: errorMessage };
    } finally {
      setIsExporting(false);
    }
  }, [document, getNodes, getEdges]);

  // Export como imagem
  const exportAsImage = useCallback(async (
    format: 'png' | 'jpeg' | 'svg' = 'png',
    options: ExportOptions = {}
  ): Promise<ExportResult> => {
    try {
      setIsExporting(true);
      secureLogger.info('Iniciando export de imagem', { format });

      const nodesBounds = getNodesBounds(getNodes());
      const viewport = getViewportForBounds(
        nodesBounds,
        options.width || 1024,
        options.height || 768,
        0.5,
        2
      );

      const viewportElement = document.querySelector('.react-flow__viewport');
      if (!viewportElement) {
        throw new Error('Viewport do diagrama não encontrado');
      }

      let dataUrl: string;
      const imageOptions = {
        backgroundColor: options.backgroundColor || '#ffffff',
        width: options.width || nodesBounds.width * viewport.zoom,
        height: options.height || nodesBounds.height * viewport.zoom,
        style: {
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`
        }
      };

      switch (format) {
        case 'png':
          dataUrl = await toPng(viewportElement as HTMLElement, imageOptions);
          break;
        case 'jpeg':
          dataUrl = await toJpeg(viewportElement as HTMLElement, {
            ...imageOptions,
            quality: options.quality || 0.9
          });
          break;
        case 'svg':
          dataUrl = await toSvg(viewportElement as HTMLElement, imageOptions);
          break;
        default:
          throw new Error(`Formato de imagem não suportado: ${format}`);
      }

      secureLogger.info('Export de imagem concluído com sucesso', { format });
      return { success: true, data: dataUrl };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      secureLogger.error('Erro no export de imagem:', { error: errorMessage, format });
      return { success: false, error: errorMessage };
    } finally {
      setIsExporting(false);
    }
  }, [getNodes]);

  // Download do arquivo
  const downloadFile = useCallback((data: string | Blob, filename: string) => {
    try {
      let url: string;
      
      if (typeof data === 'string') {
        // Para data URLs (imagens)
        url = data;
      } else {
        // Para Blobs (JSON)
        url = URL.createObjectURL(data);
      }

      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      if (typeof data !== 'string') {
        URL.revokeObjectURL(url);
      }

      secureLogger.info('Download do arquivo iniciado', { filename });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      secureLogger.error('Erro no download:', { error: errorMessage, filename });
    }
  }, []);

  // Export completo com download
  const exportDiagram = useCallback(async (
    format: ExportFormat,
    filename?: string,
    options: ExportOptions = {}
  ): Promise<ExportResult> => {
    try {
      let result: ExportResult;
      let defaultFilename: string;

      switch (format) {
        case 'json':
          result = await exportAsJSON();
          defaultFilename = `diagram-${Date.now()}.json`;
          break;
        case 'png':
          result = await exportAsImage('png', options);
          defaultFilename = `diagram-${Date.now()}.png`;
          break;
        case 'jpeg':
          result = await exportAsImage('jpeg', options);
          defaultFilename = `diagram-${Date.now()}.jpg`;
          break;
        case 'svg':
          result = await exportAsImage('svg', options);
          defaultFilename = `diagram-${Date.now()}.svg`;
          break;
        default:
          throw new Error(`Formato de export não suportado: ${format}`);
      }

      if (result.success && result.data) {
        downloadFile(result.data, filename || defaultFilename);
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      secureLogger.error('Erro no export do diagrama:', { error: errorMessage, format });
      return { success: false, error: errorMessage };
    }
  }, [exportAsJSON, exportAsImage, downloadFile]);

  return {
    isExporting,
    exportAsJSON,
    exportAsImage,
    exportDiagram,
    downloadFile
  };
};