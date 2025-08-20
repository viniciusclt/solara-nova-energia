export type SupportedFileFormat = 'doc' | 'docx' | 'pdf' | 'ppt' | 'pptx' | 'xls' | 'xlsx';

export type ConversionStatus = 'idle' | 'uploading' | 'converting' | 'completed' | 'error';

export type TemplateCategory = 'commercial' | 'technical' | 'financial' | 'presentation' | 'report' | 'custom';

export interface TemplateMetadata {
  id: string;
  name: string;
  description?: string;
  category: TemplateCategory;
  originalFormat: SupportedFileFormat;
  fileSize: number;
  uploadedAt: Date;
  uploadedBy: string;
  thumbnailUrl?: string;
  previewUrl?: string;
  tags: string[];
  usageCount: number;
  isPublic: boolean;
}

export interface DocumentStructure {
  pages: DocumentPage[];
  metadata: {
    title?: string;
    author?: string;
    subject?: string;
    keywords?: string[];
    pageCount: number;
    hasImages: boolean;
    hasTables: boolean;
    hasCharts: boolean;
  };
  styles: DocumentStyle[];
  images: ExtractedImage[];
  tables: ExtractedTable[];
}

export interface DocumentPage {
  pageNumber: number;
  content: DocumentElement[];
  dimensions: {
    width: number;
    height: number;
  };
}

export interface DocumentElement {
  id: string;
  type: 'text' | 'image' | 'table' | 'chart' | 'shape' | 'line';
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  content: string | ExtractedImage | ExtractedTable | Record<string, unknown>;
  style: DocumentStyle;
}

export interface DocumentStyle {
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: 'normal' | 'bold';
  fontStyle?: 'normal' | 'italic';
  color?: string;
  backgroundColor?: string;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  lineHeight?: number;
  margin?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  padding?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

export interface ExtractedImage {
  id: string;
  url: string;
  alt?: string;
  width: number;
  height: number;
  format: 'jpg' | 'png' | 'gif' | 'svg';
  position: {
    x: number;
    y: number;
  };
}

export interface ExtractedTable {
  id: string;
  rows: TableRow[];
  headers?: string[];
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface TableRow {
  cells: TableCell[];
}

export interface TableCell {
  content: string;
  colspan?: number;
  rowspan?: number;
  style?: DocumentStyle;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
  stage: 'uploading' | 'processing' | 'converting' | 'finalizing';
  message?: string;
}

export interface ConversionOptions {
  preserveFormatting: boolean;
  extractImages: boolean;
  extractTables: boolean;
  extractCharts: boolean;
  targetFormat: 'proposal' | 'playbook';
  quality: 'low' | 'medium' | 'high';
}

export interface Template {
  id: string;
  metadata: TemplateMetadata;
  structure: DocumentStructure;
  proposalElements: Record<string, unknown>[]; // ProposalElement[] from proposal types
  createdAt: Date;
  updatedAt: Date;
}

export interface TemplateFilter {
  category?: TemplateCategory;
  format?: SupportedFileFormat;
  tags?: string[];
  isPublic?: boolean;
  uploadedBy?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface TemplateSearchResult {
  templates: Template[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface FileValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  fileInfo: {
    name: string;
    size: number;
    type: string;
    format: SupportedFileFormat;
  };
}

export interface ConversionResult {
  success: boolean;
  template?: Template;
  error?: string;
  warnings: string[];
  processingTime: number;
  extractedElements: {
    textBlocks: number;
    images: number;
    tables: number;
    charts: number;
  };
}