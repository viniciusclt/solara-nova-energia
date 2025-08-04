export interface ExcelFile {
  id: string;
  file: File;
  sheets: string[];
  selectedSheet: string;
  data: unknown[][];
  headers: string[];
  status: 'pending' | 'loaded' | 'mapped' | 'validated' | 'error';
  error?: string;
}

export interface ColumnMapping {
  [key: string]: string | number; // nome da coluna ou índice
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  validRows: number;
  totalRows: number;
}

export interface ProcessedProduct {
  id: string;
  nome: string;
  potencia: string;
  preco: string;
  fabricante: string;
  categoria: string;
  descricao: string;
  rowIndex: number;
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ExcelImporterProps {
  onProductsImported?: (products: ProcessedProduct[]) => void;
  maxFiles?: number;
  maxFileSize?: number;
}

export interface ImportSettings {
  previewRows: number;
  skipRows: number;
  autoDetectHeaders: boolean;
  requiredFields: string[];
  categorias: string[];
}

export interface ValidationError {
  row: number;
  column: string;
  message: string;
  severity: 'error' | 'warning';
  value?: unknown;
}