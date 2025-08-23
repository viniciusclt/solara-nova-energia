// ============================================================================
// Diagram Export Types - Tipos para exportação de diagramas
// ============================================================================
// Definições de tipos para exportação em múltiplos formatos
// ============================================================================

import { Node, Edge } from 'reactflow';

// ============================================================================
// FORMATOS DE EXPORTAÇÃO
// ============================================================================

export type ExportFormat = 'png' | 'svg' | 'pdf' | 'json' | 'jpeg' | 'webp' | 'html' | 'markdown';

export type ExportQuality = 'low' | 'medium' | 'high' | 'ultra';

export type PaperSize = 'a4' | 'a3' | 'a5' | 'letter' | 'legal' | 'custom';

export type PaperOrientation = 'portrait' | 'landscape';

// ============================================================================
// CONFIGURAÇÕES DE EXPORTAÇÃO
// ============================================================================

export interface BaseExportConfig {
  format: ExportFormat;
  filename?: string;
  includeBackground?: boolean;
  backgroundColor?: string;
  padding?: number;
  scale?: number;
  quality?: ExportQuality;
  watermark?: {
    text: string;
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
    opacity?: number;
    fontSize?: number;
    color?: string;
  };
}

export interface ImageExportConfig extends BaseExportConfig {
  format: 'png' | 'jpeg' | 'webp';
  width?: number;
  height?: number;
  dpi?: number;
  compression?: number; // 0-100 para JPEG/WebP
  transparent?: boolean; // apenas para PNG
}

export interface SVGExportConfig extends BaseExportConfig {
  format: 'svg';
  embedFonts?: boolean;
  optimized?: boolean;
  includeCSS?: boolean;
  viewBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface PDFExportConfig extends BaseExportConfig {
  format: 'pdf';
  paperSize: PaperSize;
  orientation: PaperOrientation;
  customSize?: {
    width: number;
    height: number;
    unit: 'mm' | 'in' | 'pt';
  };
  margins?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  fitToPage?: boolean;
  multiPage?: boolean;
  header?: {
    text: string;
    fontSize?: number;
    alignment?: 'left' | 'center' | 'right';
  };
  footer?: {
    text: string;
    fontSize?: number;
    alignment?: 'left' | 'center' | 'right';
    includePageNumber?: boolean;
  };
}

export interface JSONExportConfig extends BaseExportConfig {
  format: 'json';
  includeMetadata?: boolean;
  includeStyles?: boolean;
  includePositions?: boolean;
  minified?: boolean;
  version?: string;
  schema?: 'reactflow' | 'custom' | 'bpmn' | 'standard';
}

export interface HTMLExportConfig extends BaseExportConfig {
  format: 'html';
  includeCSS?: boolean;
  includeJS?: boolean;
  template?: 'basic' | 'interactive' | 'standalone';
  embedImages?: boolean;
  responsive?: boolean;
  title?: string;
  description?: string;
  customCSS?: string;
  customJS?: string;
}

export interface MarkdownExportConfig extends BaseExportConfig {
  format: 'markdown';
  includeMetadata?: boolean;
  includeImages?: boolean;
  imageFormat?: 'png' | 'svg';
  linkImages?: boolean;
  tableFormat?: 'github' | 'standard';
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
  includeNodeDetails?: boolean;
  includeEdgeDetails?: boolean;
}

export type ExportConfig = 
  | ImageExportConfig 
  | SVGExportConfig 
  | PDFExportConfig 
  | JSONExportConfig
  | HTMLExportConfig
  | MarkdownExportConfig;

// ============================================================================
// DADOS DE EXPORTAÇÃO
// ============================================================================

export interface DiagramExportData {
  nodes: Node[];
  edges: Edge[];
  viewport?: {
    x: number;
    y: number;
    zoom: number;
  };
  metadata?: {
    title?: string;
    description?: string;
    author?: string;
    created?: string;
    modified?: string;
    version?: string;
    tags?: string[];
    diagramType?: string;
  };
  styles?: {
    theme?: string;
    customCSS?: string;
    nodeStyles?: Record<string, any>;
    edgeStyles?: Record<string, any>;
  };
}

// ============================================================================
// RESULTADO DA EXPORTAÇÃO
// ============================================================================

export interface ExportResult {
  success: boolean;
  data?: Blob | string;
  filename?: string;
  format: ExportFormat;
  size?: {
    width: number;
    height: number;
  };
  fileSize?: number;
  error?: string;
  warnings?: string[];
  metadata?: {
    exportedAt: string;
    processingTime: number;
    nodeCount: number;
    edgeCount: number;
  };
}

// ============================================================================
// CONFIGURAÇÕES PREDEFINIDAS
// ============================================================================

export interface ExportPreset {
  id: string;
  name: string;
  description: string;
  config: ExportConfig;
  category: 'web' | 'print' | 'presentation' | 'development' | 'custom';
  icon?: string;
}

// ============================================================================
// INTERFACE DO SERVIÇO DE EXPORTAÇÃO
// ============================================================================

export interface DiagramExportService {
  // Exportação principal
  exportDiagram(data: DiagramExportData, config: ExportConfig): Promise<ExportResult>;
  
  // Exportação em lote
  exportMultiple(exports: Array<{ data: DiagramExportData; config: ExportConfig }>): Promise<ExportResult[]>;
  
  // Presets
  getPresets(): ExportPreset[];
  createPreset(preset: Omit<ExportPreset, 'id'>): Promise<ExportPreset>;
  updatePreset(id: string, preset: Partial<ExportPreset>): Promise<ExportPreset>;
  deletePreset(id: string): Promise<void>;
  
  // Validação
  validateConfig(config: ExportConfig): { valid: boolean; errors: string[] };
  
  // Preview
  generatePreview(data: DiagramExportData, config: ExportConfig): Promise<string>;
  
  // Utilitários
  getSupportedFormats(): ExportFormat[];
  getDefaultConfig(format: ExportFormat): ExportConfig;
  estimateFileSize(data: DiagramExportData, config: ExportConfig): Promise<number>;
}

// ============================================================================
// CONFIGURAÇÕES DE QUALIDADE
// ============================================================================

export const QUALITY_SETTINGS: Record<ExportQuality, {
  scale: number;
  dpi: number;
  compression: number;
  description: string;
}> = {
  low: {
    scale: 1,
    dpi: 72,
    compression: 60,
    description: 'Baixa qualidade, arquivo pequeno'
  },
  medium: {
    scale: 2,
    dpi: 150,
    compression: 80,
    description: 'Qualidade média, bom equilíbrio'
  },
  high: {
    scale: 3,
    dpi: 300,
    compression: 90,
    description: 'Alta qualidade, arquivo maior'
  },
  ultra: {
    scale: 4,
    dpi: 600,
    compression: 95,
    description: 'Qualidade máxima, arquivo muito grande'
  }
};

// ============================================================================
// TAMANHOS DE PAPEL
// ============================================================================

export const PAPER_SIZES: Record<PaperSize, {
  width: number;
  height: number;
  unit: 'mm';
  description: string;
}> = {
  a4: {
    width: 210,
    height: 297,
    unit: 'mm',
    description: 'A4 (210 × 297 mm)'
  },
  a3: {
    width: 297,
    height: 420,
    unit: 'mm',
    description: 'A3 (297 × 420 mm)'
  },
  a5: {
    width: 148,
    height: 210,
    unit: 'mm',
    description: 'A5 (148 × 210 mm)'
  },
  letter: {
    width: 216,
    height: 279,
    unit: 'mm',
    description: 'Letter (8.5 × 11 in)'
  },
  legal: {
    width: 216,
    height: 356,
    unit: 'mm',
    description: 'Legal (8.5 × 14 in)'
  },
  custom: {
    width: 0,
    height: 0,
    unit: 'mm',
    description: 'Tamanho personalizado'
  }
};

// ============================================================================
// PRESETS PADRÃO
// ============================================================================

export const DEFAULT_PRESETS: ExportPreset[] = [
  {
    id: 'web-png',
    name: 'Web PNG',
    description: 'PNG otimizado para web',
    category: 'web',
    config: {
      format: 'png',
      quality: 'medium',
      transparent: true,
      scale: 2,
      includeBackground: false
    } as ImageExportConfig
  },
  {
    id: 'print-pdf',
    name: 'Impressão PDF',
    description: 'PDF para impressão em A4',
    category: 'print',
    config: {
      format: 'pdf',
      paperSize: 'a4',
      orientation: 'portrait',
      fitToPage: true,
      quality: 'high',
      includeBackground: true
    } as PDFExportConfig
  },
  {
    id: 'interactive-html',
    name: 'HTML Interativo',
    description: 'HTML com interatividade completa',
    category: 'web',
    config: {
      format: 'html',
      template: 'interactive',
      includeCSS: true,
      includeJS: true,
      responsive: true,
      embedImages: true
    } as HTMLExportConfig
  },
  {
    id: 'documentation-markdown',
    name: 'Documentação Markdown',
    description: 'Markdown para documentação',
    category: 'documentation',
    config: {
      format: 'markdown',
      includeMetadata: true,
      includeImages: true,
      imageFormat: 'png',
      tableFormat: 'github',
      headingLevel: 2,
      includeNodeDetails: true,
      includeEdgeDetails: true
    } as MarkdownExportConfig
  },
  {
    id: 'presentation-svg',
    name: 'Apresentação SVG',
    description: 'SVG escalável para apresentações',
    category: 'presentation',
    config: {
      format: 'svg',
      embedFonts: true,
      optimized: true,
      includeCSS: true,
      quality: 'high'
    } as SVGExportConfig
  },
  {
    id: 'backup-json',
    name: 'Backup JSON',
    description: 'Backup completo em JSON',
    category: 'development',
    config: {
      format: 'json',
      includeMetadata: true,
      includeStyles: true,
      includePositions: true,
      schema: 'reactflow'
    } as JSONExportConfig
  }
];