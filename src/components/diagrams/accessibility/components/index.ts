// ============================================================================
// Accessibility Components - Exportações centralizadas
// ============================================================================

// Componentes principais
export { AccessibleNode } from './AccessibleNode';
export { AccessibilityProvider, useAccessibility } from './AccessibilityProvider';
export { AccessibilityAnnouncer, useAnnouncer, QuickAnnouncer } from './AccessibilityAnnouncer';
export { KeyboardShortcuts, useKeyboardShortcuts } from './KeyboardShortcuts';
export { FocusIndicator, useFocusIndicators, useAutoFocusIndicator, MultiFocusIndicator } from './FocusIndicator';
export { HighContrastMode, useHighContrast } from './HighContrastMode';
export { ReducedMotion, useReducedMotion, useConditionalAnimation, useConditionalDuration } from './ReducedMotion';

// Re-exportar tipos relacionados
export type {
  AccessibleNodeProps,
  AccessibilityProviderProps,
  AccessibilityAnnouncerProps,
  KeyboardShortcutsProps,
  FocusIndicatorProps,
  HighContrastModeProps,
  ReducedMotionProps
} from '../types';