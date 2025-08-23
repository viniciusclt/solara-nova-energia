// ============================================================================
// Diagram Export Service - Serviço de exportação de diagramas
// ============================================================================
// Implementação completa para exportação em múltiplos formatos
// ============================================================================

import { toPng, toJpeg, toSvg } from 'html-to-image';
import jsPDF from 'jspdf';
import {
  DiagramExportService,
  DiagramExportData,
  ExportConfig,
  ExportResult,
  ExportPreset,
  ImageExportConfig,
  SVGExportConfig,
  PDFExportConfig,
  JSONExportConfig,
  HTMLExportConfig,
  MarkdownExportConfig,
  DEFAULT_PRESETS,
  ExportFormat,
  QUALITY_SETTINGS,
  PAPER_SIZES
} from '../types/diagramExport';

// ============================================================================
// IMPLEMENTAÇÃO DO SERVIÇO
// ============================================================================

class DiagramExportServiceImpl implements DiagramExportService {
  private presets: ExportPreset[] = [...DEFAULT_PRESETS];
  private readonly STORAGE_KEY = 'diagram-export-presets';

  constructor() {
    this.loadPresets();
  }

  // ========================================================================
  // EXPORTAÇÃO PRINCIPAL
  // ========================================================================

  async exportDiagram(data: DiagramExportData, config: ExportConfig): Promise<ExportResult> {
    const startTime = performance.now();
    
    try {
      // Validar configuração
      const validation = this.validateConfig(config);
      if (!validation.valid) {
        return {
          success: false,
          format: config.format,
          error: `Configuração inválida: ${validation.errors.join(', ')}`
        };
      }

      // Obter elemento do diagrama
      const diagramElement = this.getDiagramElement();
      if (!diagramElement) {
        return {
          success: false,
          format: config.format,
          error: 'Elemento do diagrama não encontrado'
        };
      }

      let result: ExportResult;

      // Exportar baseado no formato
      switch (config.format) {
        case 'png':
        case 'jpeg':
        case 'webp':
          result = await this.exportImage(diagramElement, data, config as ImageExportConfig);
          break;
        case 'svg':
          result = await this.exportSVG(diagramElement, data, config as SVGExportConfig);
          break;
        case 'pdf':
          result = await this.exportPDF(diagramElement, data, config as PDFExportConfig);
          break;
        case 'json':
          result = await this.exportJSON(data, config as JSONExportConfig);
          break;
        case 'html':
          result = await this.exportHTML(data, config as HTMLExportConfig);
          break;
        case 'markdown':
          result = await this.exportMarkdown(data, config as MarkdownExportConfig);
          break;
        default:
          return {
            success: false,
            format: config.format,
            error: `Formato não suportado: ${config.format}`
          };
      }

      // Adicionar metadados
      const processingTime = performance.now() - startTime;
      result.metadata = {
        exportedAt: new Date().toISOString(),
        processingTime,
        nodeCount: data.nodes.length,
        edgeCount: data.edges.length
      };

      return result;

    } catch (error) {
      return {
        success: false,
        format: config.format,
        error: error instanceof Error ? error.message : 'Erro desconhecido na exportação'
      };
    }
  }

  // ========================================================================
  // EXPORTAÇÃO EM LOTE
  // ========================================================================

  async exportMultiple(exports: Array<{ data: DiagramExportData; config: ExportConfig }>): Promise<ExportResult[]> {
    const results: ExportResult[] = [];
    
    for (const exportItem of exports) {
      const result = await this.exportDiagram(exportItem.data, exportItem.config);
      results.push(result);
    }
    
    return results;
  }

  // ========================================================================
  // EXPORTAÇÃO DE IMAGEM
  // ========================================================================

  private async exportImage(
    element: HTMLElement, 
    data: DiagramExportData, 
    config: ImageExportConfig
  ): Promise<ExportResult> {
    const qualitySettings = QUALITY_SETTINGS[config.quality || 'medium'];
    
    const options = {
      backgroundColor: config.includeBackground ? (config.backgroundColor || '#ffffff') : 'transparent',
      width: config.width,
      height: config.height,
      pixelRatio: config.scale || qualitySettings.scale,
      quality: config.compression ? config.compression / 100 : qualitySettings.compression / 100,
      style: {
        padding: `${config.padding || 20}px`
      }
    };

    let dataUrl: string;
    
    try {
      switch (config.format) {
        case 'png':
          dataUrl = await toPng(element, options);
          break;
        case 'jpeg':
          dataUrl = await toJpeg(element, {
            ...options,
            backgroundColor: config.backgroundColor || '#ffffff' // JPEG não suporta transparência
          });
          break;
        case 'webp':
          // WebP através de canvas
          const pngDataUrl = await toPng(element, options);
          dataUrl = await this.convertToWebP(pngDataUrl, config.compression || qualitySettings.compression);
          break;
        default:
          throw new Error(`Formato de imagem não suportado: ${config.format}`);
      }

      // Converter para Blob
      const blob = await this.dataUrlToBlob(dataUrl);
      
      // Adicionar marca d'água se especificada
      const finalBlob = config.watermark ? 
        await this.addWatermark(blob, config.watermark, config.format) : blob;

      return {
        success: true,
        data: finalBlob,
        filename: config.filename || `diagram.${config.format}`,
        format: config.format,
        fileSize: finalBlob.size,
        size: {
          width: config.width || element.offsetWidth,
          height: config.height || element.offsetHeight
        }
      };

    } catch (error) {
      return {
        success: false,
        format: config.format,
        error: error instanceof Error ? error.message : 'Erro na exportação de imagem'
      };
    }
  }

  // ========================================================================
  // EXPORTAÇÃO SVG
  // ========================================================================

  private async exportSVG(
    element: HTMLElement, 
    data: DiagramExportData, 
    config: SVGExportConfig
  ): Promise<ExportResult> {
    try {
      const options = {
        backgroundColor: config.includeBackground ? (config.backgroundColor || '#ffffff') : 'transparent',
        width: element.offsetWidth,
        height: element.offsetHeight,
        style: {
          padding: `${config.padding || 20}px`
        }
      };

      let svgString = await toSvg(element, options);

      // Processar SVG baseado nas configurações
      if (config.embedFonts) {
        svgString = await this.embedFontsInSVG(svgString);
      }

      if (config.optimized) {
        svgString = this.optimizeSVG(svgString);
      }

      if (config.viewBox) {
        svgString = this.setSVGViewBox(svgString, config.viewBox);
      }

      // Adicionar CSS se especificado
      if (config.includeCSS && data.styles?.customCSS) {
        svgString = this.addCSSToSVG(svgString, data.styles.customCSS);
      }

      const blob = new Blob([svgString], { type: 'image/svg+xml' });

      return {
        success: true,
        data: blob,
        filename: config.filename || 'diagram.svg',
        format: config.format,
        fileSize: blob.size,
        size: {
          width: element.offsetWidth,
          height: element.offsetHeight
        }
      };

    } catch (error) {
      return {
        success: false,
        format: config.format,
        error: error instanceof Error ? error.message : 'Erro na exportação SVG'
      };
    }
  }

  // ========================================================================
  // EXPORTAÇÃO PDF
  // ========================================================================

  private async exportPDF(
    element: HTMLElement, 
    data: DiagramExportData, 
    config: PDFExportConfig
  ): Promise<ExportResult> {
    try {
      // Obter dimensões do papel
      const paperSize = config.paperSize === 'custom' && config.customSize ? 
        config.customSize : PAPER_SIZES[config.paperSize];
      
      const isLandscape = config.orientation === 'landscape';
      const pageWidth = isLandscape ? paperSize.height : paperSize.width;
      const pageHeight = isLandscape ? paperSize.width : paperSize.height;

      // Criar PDF
      const pdf = new jsPDF({
        orientation: config.orientation,
        unit: 'mm',
        format: config.paperSize === 'custom' ? [pageWidth, pageHeight] : config.paperSize
      });

      // Adicionar margens
      const margins = config.margins || { top: 20, right: 20, bottom: 20, left: 20 };
      const contentWidth = pageWidth - margins.left - margins.right;
      const contentHeight = pageHeight - margins.top - margins.bottom;

      // Converter diagrama para imagem
      const imageDataUrl = await toPng(element, {
        backgroundColor: config.includeBackground ? (config.backgroundColor || '#ffffff') : '#ffffff',
        pixelRatio: QUALITY_SETTINGS[config.quality || 'high'].scale
      });

      // Calcular dimensões da imagem no PDF
      const imgWidth = element.offsetWidth;
      const imgHeight = element.offsetHeight;
      const aspectRatio = imgWidth / imgHeight;

      let finalWidth = contentWidth;
      let finalHeight = contentWidth / aspectRatio;

      // Ajustar se não couber na página
      if (config.fitToPage && finalHeight > contentHeight) {
        finalHeight = contentHeight;
        finalWidth = contentHeight * aspectRatio;
      }

      // Adicionar cabeçalho
      if (config.header) {
        pdf.setFontSize(config.header.fontSize || 12);
        const headerY = margins.top / 2;
        
        switch (config.header.alignment || 'center') {
          case 'left':
            pdf.text(config.header.text, margins.left, headerY);
            break;
          case 'right':
            pdf.text(config.header.text, pageWidth - margins.right, headerY, { align: 'right' });
            break;
          default:
            pdf.text(config.header.text, pageWidth / 2, headerY, { align: 'center' });
        }
      }

      // Adicionar imagem
      const x = margins.left + (contentWidth - finalWidth) / 2;
      const y = margins.top + (contentHeight - finalHeight) / 2;
      
      pdf.addImage(imageDataUrl, 'PNG', x, y, finalWidth, finalHeight);

      // Adicionar rodapé
      if (config.footer) {
        pdf.setFontSize(config.footer.fontSize || 10);
        const footerY = pageHeight - margins.bottom / 2;
        
        let footerText = config.footer.text;
        if (config.footer.includePageNumber) {
          footerText += ` - Página ${pdf.getCurrentPageInfo().pageNumber}`;
        }
        
        switch (config.footer.alignment || 'center') {
          case 'left':
            pdf.text(footerText, margins.left, footerY);
            break;
          case 'right':
            pdf.text(footerText, pageWidth - margins.right, footerY, { align: 'right' });
            break;
          default:
            pdf.text(footerText, pageWidth / 2, footerY, { align: 'center' });
        }
      }

      // Gerar blob
      const pdfBlob = pdf.output('blob');

      return {
        success: true,
        data: pdfBlob,
        filename: config.filename || 'diagram.pdf',
        format: config.format,
        fileSize: pdfBlob.size,
        size: {
          width: finalWidth,
          height: finalHeight
        }
      };

    } catch (error) {
      return {
        success: false,
        format: config.format,
        error: error instanceof Error ? error.message : 'Erro na exportação PDF'
      };
    }
  }

  // ========================================================================
  // EXPORTAÇÃO JSON
  // ========================================================================

  private async exportJSON(
    data: DiagramExportData, 
    config: JSONExportConfig
  ): Promise<ExportResult> {
    try {
      const exportData: any = {
        version: config.version || '1.0.0',
        schema: config.schema || 'reactflow',
        exportedAt: new Date().toISOString()
      };

      // Adicionar nós e arestas
      exportData.nodes = data.nodes;
      exportData.edges = data.edges;

      // Adicionar viewport se especificado
      if (config.includePositions && data.viewport) {
        exportData.viewport = data.viewport;
      }

      // Adicionar metadados se especificado
      if (config.includeMetadata && data.metadata) {
        exportData.metadata = data.metadata;
      }

      // Adicionar estilos se especificado
      if (config.includeStyles && data.styles) {
        exportData.styles = data.styles;
      }

      // Serializar JSON
      const jsonString = config.minified ? 
        JSON.stringify(exportData) : 
        JSON.stringify(exportData, null, 2);

      const blob = new Blob([jsonString], { type: 'application/json' });

      return {
        success: true,
        data: blob,
        filename: config.filename || 'diagram.json',
        format: config.format,
        fileSize: blob.size
      };

    } catch (error) {
      return {
        success: false,
        format: config.format,
        error: error instanceof Error ? error.message : 'Erro na exportação JSON'
      };
    }
  }

  // ========================================================================
  // EXPORTAÇÃO HTML
  // ========================================================================

  private async exportHTML(
    data: DiagramExportData,
    config: HTMLExportConfig
  ): Promise<ExportResult> {
    try {
      const title = config.title || data.metadata?.title || 'Diagrama';
      const description = config.description || data.metadata?.description || '';
      
      // Gerar SVG do diagrama para embed
      const diagramElement = this.getDiagramElement();
      if (!diagramElement) {
        throw new Error('Elemento do diagrama não encontrado');
      }

      const svgData = await toSvg(diagramElement, {
        backgroundColor: config.backgroundColor || 'white',
        width: diagramElement.offsetWidth,
        height: diagramElement.offsetHeight
      });

      // Template HTML baseado na configuração
      let htmlContent = '';
      
      switch (config.template) {
        case 'interactive':
          htmlContent = this.generateInteractiveHTML(data, config, svgData, title, description);
          break;
        case 'standalone':
          htmlContent = this.generateStandaloneHTML(data, config, svgData, title, description);
          break;
        default: // 'basic'
          htmlContent = this.generateBasicHTML(data, config, svgData, title, description);
      }

      const blob = new Blob([htmlContent], { type: 'text/html' });

      return {
        success: true,
        data: blob,
        filename: config.filename || 'diagram.html',
        format: config.format,
        fileSize: blob.size
      };

    } catch (error) {
      return {
        success: false,
        format: config.format,
        error: error instanceof Error ? error.message : 'Erro na exportação HTML'
      };
    }
  }

  // ========================================================================
  // EXPORTAÇÃO MARKDOWN
  // ========================================================================

  private async exportMarkdown(
    data: DiagramExportData,
    config: MarkdownExportConfig
  ): Promise<ExportResult> {
    try {
      let markdown = '';
      const title = data.metadata?.title || 'Diagrama';
      const headingPrefix = '#'.repeat(config.headingLevel || 2);
      
      // Cabeçalho
      markdown += `${headingPrefix} ${title}\n\n`;
      
      // Metadados se solicitado
      if (config.includeMetadata && data.metadata) {
        markdown += `${headingPrefix}# Metadados\n\n`;
        if (data.metadata.description) {
          markdown += `**Descrição:** ${data.metadata.description}\n\n`;
        }
        if (data.metadata.author) {
          markdown += `**Autor:** ${data.metadata.author}\n\n`;
        }
        if (data.metadata.created) {
          markdown += `**Criado em:** ${data.metadata.created}\n\n`;
        }
        if (data.metadata.tags && data.metadata.tags.length > 0) {
          markdown += `**Tags:** ${data.metadata.tags.join(', ')}\n\n`;
        }
      }
      
      // Imagem do diagrama se solicitado
      if (config.includeImages) {
        const imageFilename = config.filename?.replace('.md', '') || 'diagram';
        const imageExt = config.imageFormat || 'png';
        markdown += `${headingPrefix}# Diagrama\n\n`;
        markdown += `![${title}](${imageFilename}.${imageExt})\n\n`;
      }
      
      // Detalhes dos nós se solicitado
      if (config.includeNodeDetails && data.nodes.length > 0) {
        markdown += `${headingPrefix}# Nós\n\n`;
        
        const tableFormat = config.tableFormat || 'github';
        if (tableFormat === 'github') {
          markdown += '| ID | Tipo | Label | Posição |\n';
          markdown += '|---|---|---|---|\n';
          
          data.nodes.forEach(node => {
            const label = node.data?.label || node.id;
            const type = node.type || 'default';
            const position = `(${Math.round(node.position.x)}, ${Math.round(node.position.y)})`;
            markdown += `| ${node.id} | ${type} | ${label} | ${position} |\n`;
          });
        } else {
          data.nodes.forEach(node => {
            markdown += `- **${node.id}**: ${node.data?.label || node.id}\n`;
          });
        }
        markdown += '\n';
      }
      
      // Detalhes das arestas se solicitado
      if (config.includeEdgeDetails && data.edges.length > 0) {
        markdown += `${headingPrefix}# Conexões\n\n`;
        
        const tableFormat = config.tableFormat || 'github';
        if (tableFormat === 'github') {
          markdown += '| ID | Origem | Destino | Label |\n';
          markdown += '|---|---|---|---|\n';
          
          data.edges.forEach(edge => {
            const label = edge.label || '-';
            markdown += `| ${edge.id} | ${edge.source} | ${edge.target} | ${label} |\n`;
          });
        } else {
          data.edges.forEach(edge => {
            const label = edge.label ? ` (${edge.label})` : '';
            markdown += `- ${edge.source} → ${edge.target}${label}\n`;
          });
        }
        markdown += '\n';
      }
      
      // Estatísticas
      markdown += `${headingPrefix}# Estatísticas\n\n`;
      markdown += `- **Nós:** ${data.nodes.length}\n`;
      markdown += `- **Conexões:** ${data.edges.length}\n`;
      markdown += `- **Exportado em:** ${new Date().toLocaleString('pt-BR')}\n\n`;

      const blob = new Blob([markdown], { type: 'text/markdown' });

      return {
        success: true,
        data: blob,
        filename: config.filename || 'diagram.md',
        format: config.format,
        fileSize: blob.size
      };

    } catch (error) {
      return {
        success: false,
        format: config.format,
        error: error instanceof Error ? error.message : 'Erro na exportação Markdown'
      };
    }
  }

  // ========================================================================
  // MÉTODOS AUXILIARES PARA HTML
  // ========================================================================

  private generateBasicHTML(
    data: DiagramExportData,
    config: HTMLExportConfig,
    svgData: string,
    title: string,
    description: string
  ): string {
    const css = config.includeCSS ? this.getBasicCSS(config) : '';
    
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  ${css ? `<style>${css}</style>` : ''}
  ${config.customCSS ? `<style>${config.customCSS}</style>` : ''}
</head>
<body>
  <div class="diagram-container">
    <h1>${title}</h1>
    ${description ? `<p class="description">${description}</p>` : ''}
    <div class="diagram">
      ${config.embedImages ? svgData : `<img src="diagram.svg" alt="${title}" />`}
    </div>
    <div class="metadata">
      <p><strong>Nós:</strong> ${data.nodes.length}</p>
      <p><strong>Conexões:</strong> ${data.edges.length}</p>
      <p><strong>Exportado em:</strong> ${new Date().toLocaleString('pt-BR')}</p>
    </div>
  </div>
</body>
</html>`;
  }

  private generateInteractiveHTML(
    data: DiagramExportData,
    config: HTMLExportConfig,
    svgData: string,
    title: string,
    description: string
  ): string {
    const css = config.includeCSS ? this.getInteractiveCSS(config) : '';
    const js = config.includeJS ? this.getInteractiveJS(data) : '';
    
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  ${css ? `<style>${css}</style>` : ''}
  ${config.customCSS ? `<style>${config.customCSS}</style>` : ''}
</head>
<body>
  <div class="app-container">
    <header>
      <h1>${title}</h1>
      ${description ? `<p class="description">${description}</p>` : ''}
    </header>
    
    <main>
      <div class="diagram-panel">
        <div class="diagram-container">
          ${config.embedImages ? svgData : `<img src="diagram.svg" alt="${title}" />`}
        </div>
      </div>
      
      <aside class="info-panel">
        <div class="stats">
          <h3>Estatísticas</h3>
          <p><strong>Nós:</strong> <span id="node-count">${data.nodes.length}</span></p>
          <p><strong>Conexões:</strong> <span id="edge-count">${data.edges.length}</span></p>
        </div>
        
        <div class="node-list">
          <h3>Nós</h3>
          <ul id="nodes">
            ${data.nodes.map(node => `<li data-id="${node.id}">${node.data?.label || node.id}</li>`).join('')}
          </ul>
        </div>
      </aside>
    </main>
  </div>
  
  ${js ? `<script>${js}</script>` : ''}
  ${config.customJS ? `<script>${config.customJS}</script>` : ''}
</body>
</html>`;
  }

  private generateStandaloneHTML(
    data: DiagramExportData,
    config: HTMLExportConfig,
    svgData: string,
    title: string,
    description: string
  ): string {
    const css = config.includeCSS ? this.getStandaloneCSS(config) : '';
    
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  ${css ? `<style>${css}</style>` : ''}
  ${config.customCSS ? `<style>${config.customCSS}</style>` : ''}
</head>
<body>
  <div class="standalone-container">
    <div class="diagram-wrapper">
      ${config.embedImages ? svgData : `<img src="diagram.svg" alt="${title}" />`}
    </div>
  </div>
</body>
</html>`;
  }

  private getBasicCSS(config: HTMLExportConfig): string {
    return `
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        margin: 0;
        padding: 20px;
        background-color: #f5f5f5;
      }
      
      .diagram-container {
        max-width: 1200px;
        margin: 0 auto;
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        padding: 30px;
      }
      
      h1 {
        color: #333;
        margin-bottom: 10px;
      }
      
      .description {
        color: #666;
        margin-bottom: 30px;
        font-size: 16px;
      }
      
      .diagram {
        text-align: center;
        margin: 30px 0;
      }
      
      .diagram svg, .diagram img {
        max-width: 100%;
        height: auto;
        border: 1px solid #ddd;
        border-radius: 4px;
      }
      
      .metadata {
        border-top: 1px solid #eee;
        padding-top: 20px;
        margin-top: 30px;
        color: #666;
        font-size: 14px;
      }
      
      ${config.responsive ? `
      @media (max-width: 768px) {
        body { padding: 10px; }
        .diagram-container { padding: 20px; }
      }
      ` : ''}
    `;
  }

  private getInteractiveCSS(config: HTMLExportConfig): string {
    return `
      * { box-sizing: border-box; }
      
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        margin: 0;
        padding: 0;
        background-color: #f8f9fa;
      }
      
      .app-container {
        display: flex;
        flex-direction: column;
        height: 100vh;
      }
      
      header {
        background: white;
        padding: 20px;
        border-bottom: 1px solid #e9ecef;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }
      
      header h1 {
        margin: 0 0 5px 0;
        color: #212529;
      }
      
      .description {
        margin: 0;
        color: #6c757d;
      }
      
      main {
        display: flex;
        flex: 1;
        overflow: hidden;
      }
      
      .diagram-panel {
        flex: 1;
        padding: 20px;
        overflow: auto;
      }
      
      .diagram-container {
        background: white;
        border-radius: 8px;
        padding: 20px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        text-align: center;
      }
      
      .diagram-container svg, .diagram-container img {
        max-width: 100%;
        height: auto;
      }
      
      .info-panel {
        width: 300px;
        background: white;
        border-left: 1px solid #e9ecef;
        padding: 20px;
        overflow-y: auto;
      }
      
      .info-panel h3 {
        margin: 0 0 15px 0;
        color: #495057;
        font-size: 16px;
      }
      
      .stats {
        margin-bottom: 30px;
      }
      
      .stats p {
        margin: 8px 0;
        color: #6c757d;
      }
      
      .node-list ul {
        list-style: none;
        padding: 0;
        margin: 0;
      }
      
      .node-list li {
        padding: 8px 12px;
        margin: 4px 0;
        background: #f8f9fa;
        border-radius: 4px;
        cursor: pointer;
        transition: background-color 0.2s;
      }
      
      .node-list li:hover {
        background: #e9ecef;
      }
      
      ${config.responsive ? `
      @media (max-width: 768px) {
        main { flex-direction: column; }
        .info-panel { width: 100%; border-left: none; border-top: 1px solid #e9ecef; }
      }
      ` : ''}
    `;
  }

  private getStandaloneCSS(config: HTMLExportConfig): string {
    return `
      body {
        margin: 0;
        padding: 0;
        background: white;
      }
      
      .standalone-container {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
        padding: 20px;
      }
      
      .diagram-wrapper {
        text-align: center;
      }
      
      .diagram-wrapper svg, .diagram-wrapper img {
        max-width: 100%;
        height: auto;
      }
    `;
  }

  private getInteractiveJS(data: DiagramExportData): string {
    return `
      document.addEventListener('DOMContentLoaded', function() {
        // Adicionar interatividade aos nós
        const nodeItems = document.querySelectorAll('#nodes li');
        
        nodeItems.forEach(item => {
          item.addEventListener('click', function() {
            const nodeId = this.getAttribute('data-id');
            console.log('Nó selecionado:', nodeId);
            
            // Remover seleção anterior
            nodeItems.forEach(n => n.classList.remove('selected'));
            
            // Adicionar seleção atual
            this.classList.add('selected');
          });
        });
        
        // Adicionar estilo para nó selecionado
        const style = document.createElement('style');
        style.textContent = '.node-list li.selected { background: #007bff; color: white; }';
        document.head.appendChild(style);
      });
    `;
  }

  // ========================================================================
  // GERENCIAMENTO DE PRESETS
  // ========================================================================

  getPresets(): ExportPreset[] {
    return [...this.presets];
  }

  async createPreset(preset: Omit<ExportPreset, 'id'>): Promise<ExportPreset> {
    const newPreset: ExportPreset = {
      ...preset,
      id: `preset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
    
    this.presets.push(newPreset);
    this.savePresets();
    
    return newPreset;
  }

  async updatePreset(id: string, preset: Partial<ExportPreset>): Promise<ExportPreset> {
    const index = this.presets.findIndex(p => p.id === id);
    if (index === -1) {
      throw new Error(`Preset não encontrado: ${id}`);
    }
    
    this.presets[index] = { ...this.presets[index], ...preset };
    this.savePresets();
    
    return this.presets[index];
  }

  async deletePreset(id: string): Promise<void> {
    const index = this.presets.findIndex(p => p.id === id);
    if (index === -1) {
      throw new Error(`Preset não encontrado: ${id}`);
    }
    
    this.presets.splice(index, 1);
    this.savePresets();
  }

  // ========================================================================
  // VALIDAÇÃO E UTILITÁRIOS
  // ========================================================================

  validateConfig(config: ExportConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validações básicas
    if (!config.format) {
      errors.push('Formato é obrigatório');
    }

    if (!this.getSupportedFormats().includes(config.format)) {
      errors.push(`Formato não suportado: ${config.format}`);
    }

    // Validações específicas por formato
    if (config.format === 'pdf') {
      const pdfConfig = config as PDFExportConfig;
      if (pdfConfig.paperSize === 'custom' && !pdfConfig.customSize) {
        errors.push('Tamanho personalizado requer customSize');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  async generatePreview(data: DiagramExportData, config: ExportConfig): Promise<string> {
    // Gerar preview em baixa qualidade
    const previewConfig = {
      ...config,
      quality: 'low' as const,
      scale: 1
    };

    const result = await this.exportDiagram(data, previewConfig);
    
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Erro ao gerar preview');
    }

    // Converter blob para data URL
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(result.data as Blob);
    });
  }

  getSupportedFormats(): ExportFormat[] {
    return ['png', 'jpeg', 'webp', 'svg', 'pdf', 'json'];
  }

  getDefaultConfig(format: ExportFormat): ExportConfig {
    const preset = DEFAULT_PRESETS.find(p => p.config.format === format);
    return preset ? preset.config : { format } as ExportConfig;
  }

  async estimateFileSize(data: DiagramExportData, config: ExportConfig): Promise<number> {
    // Estimativa baseada no formato e configurações
    const nodeCount = data.nodes.length;
    const edgeCount = data.edges.length;
    const complexity = nodeCount + edgeCount;
    
    const qualityMultiplier = QUALITY_SETTINGS[config.quality || 'medium'].scale;
    
    switch (config.format) {
      case 'png':
      case 'jpeg':
      case 'webp':
        return complexity * 50 * qualityMultiplier; // ~50KB por elemento
      case 'svg':
        return complexity * 10 * qualityMultiplier; // ~10KB por elemento
      case 'pdf':
        return complexity * 100 * qualityMultiplier; // ~100KB por elemento
      case 'json':
        return complexity * 5; // ~5KB por elemento
      default:
        return 0;
    }
  }

  // ========================================================================
  // MÉTODOS AUXILIARES
  // ========================================================================

  private getDiagramElement(): HTMLElement | null {
    // Buscar elemento do ReactFlow
    return document.querySelector('.react-flow') as HTMLElement ||
           document.querySelector('[data-testid="rf__wrapper"]') as HTMLElement ||
           document.querySelector('.unified-diagram-editor') as HTMLElement;
  }

  private async dataUrlToBlob(dataUrl: string): Promise<Blob> {
    const response = await fetch(dataUrl);
    return response.blob();
  }

  private async convertToWebP(dataUrl: string, quality: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        
        try {
          const webpDataUrl = canvas.toDataURL('image/webp', quality / 100);
          resolve(webpDataUrl);
        } catch (error) {
          reject(error);
        }
      };
      
      img.onerror = reject;
      img.src = dataUrl;
    });
  }

  private async addWatermark(
    blob: Blob, 
    watermark: NonNullable<ExportConfig['watermark']>, 
    format: string
  ): Promise<Blob> {
    // Implementação simplificada de marca d'água
    // Em produção, seria mais robusta
    return blob;
  }

  private async embedFontsInSVG(svgString: string): Promise<string> {
    // Implementação simplificada
    // Em produção, carregaria e incorporaria fontes
    return svgString;
  }

  private optimizeSVG(svgString: string): string {
    // Otimizações básicas de SVG
    return svgString
      .replace(/\s+/g, ' ')
      .replace(/> </g, '><')
      .trim();
  }

  private setSVGViewBox(svgString: string, viewBox: { x: number; y: number; width: number; height: number }): string {
    return svgString.replace(
      /<svg[^>]*>/,
      `<svg viewBox="${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}">`
    );
  }

  private addCSSToSVG(svgString: string, css: string): string {
    const styleTag = `<style><![CDATA[${css}]]></style>`;
    return svgString.replace('<svg', `<svg>${styleTag}`);
  }

  private loadPresets(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const customPresets = JSON.parse(stored);
        this.presets = [...DEFAULT_PRESETS, ...customPresets];
      }
    } catch (error) {
      console.warn('Erro ao carregar presets de exportação:', error);
    }
  }

  private savePresets(): void {
    try {
      const customPresets = this.presets.filter(
        preset => !DEFAULT_PRESETS.some(defaultPreset => defaultPreset.id === preset.id)
      );
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(customPresets));
    } catch (error) {
      console.warn('Erro ao salvar presets de exportação:', error);
    }
  }
}

// ============================================================================
// INSTÂNCIA SINGLETON
// ============================================================================

const diagramExportService = new DiagramExportServiceImpl();

export default diagramExportService;
export { DiagramExportServiceImpl };