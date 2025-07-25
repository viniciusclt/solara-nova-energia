export { SimpleOCR, default } from './SimpleOCR';

// Tipos relacionados ao OCR
export interface ExtractedData {
  cliente?: string;
  valor?: string;
  potencia?: string;
  endereco?: string;
  telefone?: string;
  email?: string;
  dataVencimento?: string;
  observacoes?: string;
}

export interface OCRResult {
  id: string;
  fileName: string;
  fileSize: number;
  extractedText: string;
  extractedData: ExtractedData;
  confidence: number;
  processedAt: string;
  status: 'processing' | 'completed' | 'error';
}

export interface SimpleOCRProps {
  onDataExtracted?: (data: ExtractedData) => void;
  className?: string;
}