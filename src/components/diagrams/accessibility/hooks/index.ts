// ============================================================================
// Accessibility Hooks - Índice de hooks para acessibilidade
// ============================================================================

export { useAccessibleDiagram } from './useAccessibleDiagram';
export { useKeyboardNavigation } from './useKeyboardNavigation';
export { useFocusManagement } from './useFocusManagement';
export { useScreenReader, useDiagramScreenReader } from './useScreenReader';

// Re-export types for convenience
export type {
  UseAccessibleDiagramProps,
  UseAccessibleDiagramReturn
} from './useAccessibleDiagram';

export type {
  UseKeyboardNavigationProps,
  UseKeyboardNavigationReturn
} from './useKeyboardNavigation';

export type {
  UseFocusManagementProps,
  UseFocusManagementReturn
} from './useFocusManagement';

export type {
  UseScreenReaderProps,
  UseScreenReaderReturn
} from './useScreenReader';