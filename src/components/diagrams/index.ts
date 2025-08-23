// ============================================================================
// DIAGRAMS MODULE - MAIN EXPORTS
// ============================================================================
// Módulo principal de diagramas com arquitetura unificada
// Suporte para Flowchart, MindMap e Organogram
// ============================================================================

// Core Components
export { DiagramEditor } from './DiagramEditor';
export { DiagramCanvas } from './DiagramCanvas';
export { DiagramToolbar } from './DiagramToolbar';
export { DiagramPalette } from './DiagramPalette';
export { DiagramMinimap } from './DiagramMinimap';
export { DiagramContextMenu } from './DiagramContextMenu';
export { DiagramAdvancedControls } from './DiagramAdvancedControls';

// Node Components - Nova Arquitetura
export * from './nodes';

// Edge Components
export * from './edges';

// Migration Components
export * from './migration';

// Demo Components
export * from './demo';

// Store
export { useDiagramStore } from './stores/useDiagramStore';

// Hooks
export { useDiagramEditor } from './hooks/useDiagramEditor';
export { useDiagramCanvas } from './hooks/useDiagramCanvas';
export { useDiagramNodes } from './hooks/useDiagramNodes';
export { useDiagramHistory } from './hooks/useDiagramHistory';
export { useDiagramValidation } from './hooks/useDiagramValidation';
export { useDiagramExport } from './hooks/useDiagramExport';
export { useDiagramImport } from './hooks/useDiagramImport';
export { useDiagramLayout } from './hooks/useDiagramLayout';
export { useDiagramKeyboard } from './hooks/useDiagramKeyboard';
export { useDiagramAccessibility } from './hooks/useDiagramAccessibility';

// Types
export type {
  DiagramType,
  DiagramNode,
  DiagramEdge,
  DiagramPosition,
  DiagramDocument,
  NodeType,
  EdgeType,
  DiagramConfig,
  DiagramState,
  DiagramAction,
  NodeCategory,
  DiagramTheme,
  ExportFormat,
  ImportFormat,
  ValidationResult,
  DiagramMetrics,
  LayoutOptions,
  ZoomOptions,
  GridOptions,
  MinimapOptions,
  ContextMenuOptions,
  KeyboardShortcuts,
  AccessibilityOptions
} from './types';

// Utilities
export {
  diagramValidation,
  diagramExport,
  diagramImport,
  diagramUtils,
  validateDiagram,
  exportDiagram,
  importDiagram,
  layoutDiagram,
  calculateDiagramMetrics,
  optimizeDiagramPerformance,
  generateDiagramId,
  cloneDiagram,
  mergeDiagrams,
  searchDiagram,
  filterDiagram,
  sortDiagram
} from './utils';

// Constants
export {
  DIAGRAM_TYPES,
  NODE_CATEGORIES,
  EDGE_TYPES,
  DIAGRAM_THEMES,
  EXPORT_FORMATS,
  IMPORT_FORMATS,
  DEFAULT_DIAGRAM_CONFIG,
  KEYBOARD_SHORTCUTS,
  ACCESSIBILITY_LABELS
} from './types/constants';

// ============================================================================
// LEGACY COMPATIBILITY
// ============================================================================
// Mantém compatibilidade com componentes antigos durante migração

// Legacy Flowchart Components (deprecated - use DiagramEditor instead)
// FlowchartEditor removido - usar UnifiedDiagramEditor

// Legacy Node Types (deprecated - use enhanced nodes instead)
export { legacyFlowchartNodeTypes } from './nodes';

// Migration Wrapper for gradual transition
export { DiagramMigrationWrapper as MigrationWrapper } from './migration';

// ============================================================================
// VERSION INFO
// ============================================================================
export const DIAGRAMS_MODULE_VERSION = '2.0.0';
export const MIGRATION_STATUS = 'in-progress';
export const COMPATIBILITY_MODE = true;

// ============================================================================
// DEVELOPMENT UTILITIES
// ============================================================================
// Utilitários para desenvolvimento e debug (removidos em produção)

if (process.env.NODE_ENV === 'development') {
  // Debug utilities
  (window as Record<string, unknown>).__DIAGRAMS_DEBUG__ = {
    version: DIAGRAMS_MODULE_VERSION,
    migrationStatus: MIGRATION_STATUS,
    compatibilityMode: COMPATIBILITY_MODE,
    nodeTypes: () => import('./nodes').then(m => Object.keys(m.nodeTypes)),
    edgeTypes: () => import('./edges').then(m => Object.keys(m.edgeTypes)),
    utils: () => import('./utils').then(m => Object.keys(m))
  };
}