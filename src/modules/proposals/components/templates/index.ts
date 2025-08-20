// Template Components
export { TemplateUploader } from './TemplateUploader';
export { TemplateLibrary } from './TemplateLibrary';

// Re-export types for convenience
export type {
  Template,
  TemplateMetadata,
  TemplateCategory,
  TemplateFilter,
  TemplateSearchResult,
  SupportedFileFormat,
  ConversionStatus,
  DocumentStructure,
  DocumentPage,
  DocumentElement,
  DocumentStyle,
  ExtractedImage,
  ExtractedTable,
  TableRow,
  TableCell,
  UploadProgress,
  ConversionOptions,
  ConversionResult,
  FileValidationResult
} from '../../types/template';

// Re-export service for convenience
export { FileConverterService } from '../../services/fileConverter';