// ============================================================================
// Accessibility System - Exportações principais
// ============================================================================

// Hooks
export {
  useAccessibleDiagram,
  useKeyboardNavigation,
  useFocusManagement,
  useScreenReader,
  useDiagramScreenReader
} from './hooks';

// Componentes
export {
  AccessibleNode,
  AccessibilityProvider,
  useAccessibility,
  AccessibilityAnnouncer,
  useAnnouncer,
  QuickAnnouncer,
  KeyboardShortcuts,
  useKeyboardShortcuts,
  FocusIndicator,
  useFocusIndicators,
  useAutoFocusIndicator,
  MultiFocusIndicator,
  HighContrastMode,
  useHighContrast,
  ReducedMotion,
  useReducedMotion,
  useConditionalAnimation,
  useConditionalDuration
} from './components';

// Utilitários
export * from './utils';

// Tipos
export * from './types';

// Constantes
export * from './constants';