// ============================================================================
// Playbook Components - Exportações centralizadas (barrel)
// ============================================================================

// Componentes (todos exportados como default nos respectivos arquivos)
export { default as PlaybookEditor } from './PlaybookEditor';
export { default as BlockEditor } from './BlockEditor';
export { default as TemplateSelector } from './TemplateSelector';
export { default as PlaybookLibrary } from './PlaybookLibrary';
export { default as CommentPanel } from './CommentPanel';
export { default as HistoryPanel } from './HistoryPanel';
export { default as CollaborationPanel } from './CollaborationPanel';

// Tipos relacionados ao domínio de Playbooks
export type {
  PlaybookDocument,
  PlaybookBlock,
  PlaybookTemplate,
  PlaybookComment,
  PlaybookHistoryEntry,
  PlaybookBlockType,
  PlaybookStatus,
  PlaybookCategory,
  PlaybookAccessLevel,
  PlaybookRichText,
  PlaybookBlockProperties,
  PlaybookEditorState,
  PlaybookServiceConfig,
  PlaybookFilters,
  PlaybookAPI,
  UsePlaybookReturn,
  UsePlaybookEditorReturn,
  UsePlaybookTemplatesReturn,
  PlaybookEditorProps,
  BlockEditorProps,
  TemplateSelectorProps,
  PlaybookLibraryProps
} from '@/types/playbook';

// Constantes relacionadas
export {
  PLAYBOOK_BLOCK_TYPES,
  PLAYBOOK_CATEGORIES,
  PLAYBOOK_STATUSES,
  PLAYBOOK_ACCESS_LEVELS
} from '@/types/playbook';