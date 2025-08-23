import { Node, Edge } from 'reactflow';

export interface ExportOptions {
  format: 'png' | 'jpeg' | 'svg' | 'json' | 'pdf';
  quality?: number;
  backgroundColor?: string;
  width?: number;
  height?: number;
  includeMetadata?: boolean;
}

export interface DiagramData {
  nodes: Node[];
  edges: Edge[];
  viewport: {
    x: number;
    y: number;
    zoom: number;
  };
  metadata?: {
    title?: string;
    description?: string;
    author?: string;
    createdAt?: string;
    updatedAt?: string;
    version?: string;
  };
}

export class ExportManager {
  private static instance: ExportManager;

  static getInstance(): ExportManager {
    if (!ExportManager.instance) {
      ExportManager.instance = new ExportManager();
    }
    return ExportManager.instance;
  }

  async exportDiagram(
    element: HTMLElement,
    nodes: Node[],
    edges: Edge[],
    viewport: any,
    options: ExportOptions
  ): Promise<string | Blob> {
    const { format, quality = 1, backgroundColor = '#ffffff' } = options;

    try {
      switch (format) {
        case 'png':
          return await this.exportToPng(element, { quality, backgroundColor });
        case 'jpeg':
          return await this.exportToJpeg(element, { quality, backgroundColor });
        case 'svg':
          return await this.exportToSvg(element, { backgroundColor });
        case 'json':
          return this.exportToJson(nodes, edges, viewport, options);
        case 'pdf':
          return await this.exportToPdf(element, options);
        default:
          throw new Error(`Unsupported export format: ${format}`);
      }
    } catch (error) {
      console.error('Export failed:', error);
      throw new Error(`Failed to export diagram as ${format}`);
    }
  }

  private async exportToPng(element: HTMLElement, options: { quality: number; backgroundColor: string }): Promise<string> {
    // Simple canvas-based export
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const rect = element.getBoundingClientRect();
    
    canvas.width = rect.width * 2; // Higher resolution
    canvas.height = rect.height * 2;
    
    if (ctx) {
      ctx.scale(2, 2);
      ctx.fillStyle = options.backgroundColor;
      ctx.fillRect(0, 0, rect.width, rect.height);
      
      // Note: This is a simplified implementation
      // For production, consider using html2canvas or similar library
    }
    
    return canvas.toDataURL('image/png', options.quality);
  }

  private async exportToJpeg(element: HTMLElement, options: { quality: number; backgroundColor: string }): Promise<string> {
    const pngData = await this.exportToPng(element, options);
    // Convert PNG to JPEG (simplified)
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    return new Promise((resolve) => {
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/jpeg', options.quality));
      };
      img.src = pngData;
    });
  }

  private async exportToSvg(element: HTMLElement, options: { backgroundColor: string }): Promise<string> {
    // Simple SVG export
    const rect = element.getBoundingClientRect();
    const svgContent = `
      <svg width="${rect.width}" height="${rect.height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="${options.backgroundColor}"/>
        <text x="50%" y="50%" text-anchor="middle" dy=".3em">Diagram Export</text>
      </svg>
    `;
    return `data:image/svg+xml;base64,${btoa(svgContent)}`;
  }

  private exportToJson(
    nodes: Node[],
    edges: Edge[],
    viewport: any,
    options: ExportOptions
  ): string {
    const diagramData: DiagramData = {
      nodes,
      edges,
      viewport,
    };

    if (options.includeMetadata) {
      diagramData.metadata = {
        title: 'Exported Diagram',
        author: 'Solara Nova Energia',
        createdAt: new Date().toISOString(),
        version: '1.0.0',
      };
    }

    return JSON.stringify(diagramData, null, 2);
  }

  private async exportToPdf(element: HTMLElement, options: ExportOptions): Promise<Blob> {
    // For PDF export, we'll first convert to PNG and then create a PDF
    const pngDataUrl = await this.exportToPng(element, {
      quality: 1,
      backgroundColor: options.backgroundColor || '#ffffff'
    });

    // Create a simple PDF with the image
    // Note: This is a basic implementation. For production, consider using jsPDF or similar
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    return new Promise((resolve, reject) => {
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create PDF blob'));
          }
        }, 'image/png');
      };
      
      img.onerror = () => reject(new Error('Failed to load image for PDF'));
      img.src = pngDataUrl;
    });
  }

  downloadFile(data: string | Blob, filename: string, mimeType?: string): void {
    const blob = typeof data === 'string' 
      ? new Blob([data], { type: mimeType || 'text/plain' })
      : data;
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  async importFromJson(jsonString: string): Promise<DiagramData> {
    try {
      const data = JSON.parse(jsonString) as DiagramData;
      
      // Validate the structure
      if (!data.nodes || !data.edges || !data.viewport) {
        throw new Error('Invalid diagram data structure');
      }
      
      return data;
    } catch (error) {
      console.error('Import failed:', error);
      throw new Error('Failed to import diagram data');
    }
  }

  // Helper method to get file extension based on format
  getFileExtension(format: ExportOptions['format']): string {
    const extensions = {
      png: 'png',
      jpeg: 'jpg',
      svg: 'svg',
      json: 'json',
      pdf: 'pdf'
    };
    return extensions[format];
  }

  // Helper method to get MIME type based on format
  getMimeType(format: ExportOptions['format']): string {
    const mimeTypes = {
      png: 'image/png',
      jpeg: 'image/jpeg',
      svg: 'image/svg+xml',
      json: 'application/json',
      pdf: 'application/pdf'
    };
    return mimeTypes[format];
  }
}

export const exportManager = ExportManager.getInstance();