// Componente principal refatorado
export { ExcelImporterRefactored } from './ExcelImporterRefactored';

// Componentes modulares
export { FileUpload } from './FileUpload';
export { ColumnMapping } from './ColumnMapping';
export { DataValidation } from './DataValidation';

// Hook personalizado
export { useExcelImporter } from './useExcelImporter';

// Tipos e interfaces
export type {
  ExcelFile,
  ColumnMapping as ColumnMappingType,
  ValidationResult,
  ValidationError,
  ProcessedProduct,
  ExcelImporterProps,
  ImportSettings
} from './types';

// Export padrão para compatibilidade
export { ExcelImporterRefactored as default } from './ExcelImporterRefactored';