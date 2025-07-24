// Main components
export { TemplateEditor } from './TemplateEditor';
export { EditorCanvas } from './EditorCanvas';
export { ComponentLibrary } from './ComponentLibrary';
export { PropertiesPanel } from './PropertiesPanel';
export { Toolbar } from './Toolbar';
export { TemplateRenderer, TemplateRendererList } from './TemplateRenderer';

// Hooks
export { useTemplateEditor } from './hooks/useTemplateEditor';

// Types
export type {
  TemplateComponent,
  ComponentType,
  ComponentProperties,
  Position,
  Size,
  TemplateData,
  EditorState,
  ComponentLibraryItem,
  ComponentCategory,
  DragData,
  CanvasRect,
  EditorAction,
  ValidationError,
  ExportOptions,
  TemplatePreview,
  CollaborationUser,
  Comment,
  TableColumn,
  TableRow
} from './types';

// Re-export for convenience
export { TemplateEditor as default } from './TemplateEditor';

