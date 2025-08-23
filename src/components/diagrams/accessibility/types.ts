// ============================================================================
// Accessibility Types - Tipos para sistema de acessibilidade
// ============================================================================

import { ReactNode } from 'react';

// ============================================================================
// Keyboard Navigation Types
// ============================================================================

export interface KeyboardNavigationConfig {
  enabled: boolean;
  focusOnMount: boolean;
  trapFocus: boolean;
  returnFocusOnUnmount: boolean;
  skipLinks: boolean;
  customShortcuts: Record<string, () => void>;
}

export interface NavigationDirection {
  up: string[];
  down: string[];
  left: string[];
  right: string[];
  select: string[];
  escape: string[];
  delete: string[];
  edit: string[];
  copy: string[];
  paste: string[];
  undo: string[];
  redo: string[];
}

// ============================================================================
// Focus Management Types
// ============================================================================

export interface FocusableElement {
  id: string;
  type: 'node' | 'edge' | 'control' | 'toolbar' | 'palette';
  element: HTMLElement;
  priority: number;
  tabIndex: number;
  ariaLabel: string;
  ariaDescription?: string;
  role: string;
}

export interface FocusState {
  currentFocus: string | null;
  focusHistory: string[];
  focusableElements: Map<string, FocusableElement>;
  focusOrder: string[];
  trapFocus: boolean;
}

// ============================================================================
// Screen Reader Types
// ============================================================================

export interface ScreenReaderAnnouncement {
  id: string;
  message: string;
  priority: 'polite' | 'assertive';
  timestamp: number;
  category: 'action' | 'status' | 'error' | 'navigation' | 'content';
}

export interface ScreenReaderConfig {
  enabled: boolean;
  announceActions: boolean;
  announceNavigation: boolean;
  announceChanges: boolean;
  announceErrors: boolean;
  verbosity: 'minimal' | 'normal' | 'verbose';
  language: string;
}

// ============================================================================
// Accessible Node Types
// ============================================================================

export interface AccessibleNodeProps {
  id: string;
  type: string;
  label: string;
  description?: string;
  role: string;
  tabIndex: number;
  ariaLabel: string;
  ariaDescription?: string;
  ariaExpanded?: boolean;
  ariaSelected?: boolean;
  ariaDisabled?: boolean;
  ariaHidden?: boolean;
  ariaLive?: 'off' | 'polite' | 'assertive';
  keyboardShortcuts?: string[];
  focusable: boolean;
  selectable: boolean;
  editable: boolean;
  deletable: boolean;
  draggable: boolean;
  onFocus?: (event: FocusEvent) => void;
  onBlur?: (event: FocusEvent) => void;
  onKeyDown?: (event: KeyboardEvent) => void;
  onSelect?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

// ============================================================================
// Accessibility Context Types
// ============================================================================

export interface AccessibilityContextValue {
  // Configuration
  config: AccessibilityConfig;
  updateConfig: (config: Partial<AccessibilityConfig>) => void;
  
  // Focus Management
  focusState: FocusState;
  setFocus: (elementId: string) => void;
  moveFocus: (direction: 'next' | 'previous' | 'up' | 'down' | 'left' | 'right') => void;
  registerFocusable: (element: FocusableElement) => void;
  unregisterFocusable: (elementId: string) => void;
  
  // Screen Reader
  announce: (message: string, priority?: 'polite' | 'assertive', category?: string) => void;
  announcements: ScreenReaderAnnouncement[];
  
  // Keyboard Navigation
  handleKeyDown: (event: KeyboardEvent) => boolean;
  registerShortcut: (keys: string[], handler: () => void, description: string) => void;
  unregisterShortcut: (keys: string[]) => void;
  
  // High Contrast
  highContrast: boolean;
  toggleHighContrast: () => void;
  
  // Reduced Motion
  reducedMotion: boolean;
  toggleReducedMotion: () => void;
  
  // Font Size
  fontSize: 'small' | 'normal' | 'large' | 'extra-large';
  setFontSize: (size: 'small' | 'normal' | 'large' | 'extra-large') => void;
}

export interface AccessibilityConfig {
  keyboard: KeyboardNavigationConfig;
  screenReader: ScreenReaderConfig;
  highContrast: boolean;
  reducedMotion: boolean;
  fontSize: 'small' | 'normal' | 'large' | 'extra-large';
  colorBlindness: {
    enabled: boolean;
    type: 'protanopia' | 'deuteranopia' | 'tritanopia' | 'achromatopsia';
  };
  skipLinks: boolean;
  focusIndicators: {
    enabled: boolean;
    style: 'outline' | 'shadow' | 'border';
    color: string;
    width: number;
  };
}

// ============================================================================
// Accessibility Provider Props
// ============================================================================

export interface AccessibilityProviderProps {
  children: ReactNode;
  config?: Partial<AccessibilityConfig>;
  onConfigChange?: (config: AccessibilityConfig) => void;
}

// ============================================================================
// Keyboard Shortcuts Types
// ============================================================================

export interface KeyboardShortcut {
  keys: string[];
  description: string;
  handler: () => void;
  category: 'navigation' | 'editing' | 'selection' | 'view' | 'general';
  enabled: boolean;
}

export interface KeyboardShortcutsProps {
  shortcuts: KeyboardShortcut[];
  onShortcut?: (shortcut: KeyboardShortcut) => void;
  className?: string;
}

// ============================================================================
// Focus Indicator Types
// ============================================================================

export interface FocusIndicatorProps {
  targetId: string;
  style?: 'outline' | 'shadow' | 'border';
  color?: string;
  width?: number;
  offset?: number;
  animated?: boolean;
  className?: string;
}

// ============================================================================
// High Contrast Mode Types
// ============================================================================

export interface HighContrastModeProps {
  enabled: boolean;
  onToggle: () => void;
  className?: string;
}

// ============================================================================
// Reduced Motion Types
// ============================================================================

export interface ReducedMotionProps {
  enabled: boolean;
  onToggle: () => void;
  className?: string;
}

// ============================================================================
// Accessibility Announcer Types
// ============================================================================

export interface AccessibilityAnnouncerProps {
  announcements: ScreenReaderAnnouncement[];
  maxAnnouncements?: number;
  className?: string;
}