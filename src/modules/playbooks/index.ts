// Main components
export { PlaybookEditor } from '@/components/playbook';
// export { BlockRenderer } from './components/BlockRenderer.tsx'; // Removed: file does not exist in this module
export { EditorToolbar } from './components/EditorToolbar.tsx';
export { PlaybookSidebar } from './components/PlaybookSidebar.tsx';
export { CollaborationPanel } from './components/CollaborationPanel.tsx';
export { TemplateGallery } from './components/TemplateGallery.tsx';

// Block components
export {
  ParagraphBlock,
  HeadingBlock,
  ListBlock,
  TodoBlock,
  ImageBlock,
  QuoteBlock,
  CodeBlock,
  DividerBlock,
  BlockSelector,
  BLOCK_COMPONENTS,
  BLOCK_CONFIGS,
  BLOCK_CATEGORIES,
  getBlockComponent,
  getBlockConfig,
  getBlocksByCategory,
  getAllBlockTypes,
  createDefaultBlock,
} from './components/blocks';

// Types
export type {
  Block,
  Playbook,
  BlockType,
  // Removed non-existent types to avoid export errors
  // BlockContent,
  // BlockMetadata,
  // User,
  Comment,
  // Template,
  EditorSettings,
} from './types/editor';

// Store
export { usePlaybookStore } from './store/playbookStore';

// Hooks (if we create them later)
// export { usePlaybookEditor } from './hooks/usePlaybookEditor';
// export { useBlockDragDrop } from './hooks/useBlockDragDrop';
// export { useCollaboration } from './hooks/useCollaboration';

// Utils (if we create them later)
// export { exportPlaybook } from './utils/export';
// export { importPlaybook } from './utils/import';
// export { validatePlaybook } from './utils/validation';