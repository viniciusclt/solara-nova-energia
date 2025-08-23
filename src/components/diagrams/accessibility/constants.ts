// ============================================================================
// Accessibility Constants - Constantes para sistema de acessibilidade
// ============================================================================

import { AccessibilityConfig, NavigationDirection } from './types';

// ============================================================================
// WCAG 2.1 Compliance Constants
// ============================================================================

export const WCAG_CONTRAST_RATIOS = {
  AA_NORMAL: 4.5,
  AA_LARGE: 3,
  AAA_NORMAL: 7,
  AAA_LARGE: 4.5
} as const;

export const WCAG_FONT_SIZES = {
  SMALL: '12px',
  NORMAL: '14px',
  LARGE: '18px',
  EXTRA_LARGE: '24px'
} as const;

export const WCAG_TOUCH_TARGETS = {
  MINIMUM: 44, // pixels
  RECOMMENDED: 48 // pixels
} as const;

// ============================================================================
// Keyboard Navigation Constants
// ============================================================================

export const KEYBOARD_KEYS = {
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  ENTER: 'Enter',
  SPACE: ' ',
  ESCAPE: 'Escape',
  TAB: 'Tab',
  DELETE: 'Delete',
  BACKSPACE: 'Backspace',
  HOME: 'Home',
  END: 'End',
  PAGE_UP: 'PageUp',
  PAGE_DOWN: 'PageDown',
  F1: 'F1',
  F2: 'F2',
  F3: 'F3',
  F4: 'F4',
  F5: 'F5',
  F6: 'F6',
  F7: 'F7',
  F8: 'F8',
  F9: 'F9',
  F10: 'F10',
  F11: 'F11',
  F12: 'F12'
} as const;

export const NAVIGATION_DIRECTIONS: NavigationDirection = {
  up: ['ArrowUp', 'k'],
  down: ['ArrowDown', 'j'],
  left: ['ArrowLeft', 'h'],
  right: ['ArrowRight', 'l'],
  select: ['Enter', ' '],
  escape: ['Escape'],
  delete: ['Delete', 'Backspace'],
  edit: ['F2', 'e'],
  copy: ['c'],
  paste: ['v'],
  undo: ['z'],
  redo: ['y']
};

// ============================================================================
// Default Keyboard Shortcuts
// ============================================================================

export const DEFAULT_SHORTCUTS = {
  // Navigation
  FOCUS_NEXT: ['Tab'],
  FOCUS_PREVIOUS: ['Shift+Tab'],
  MOVE_UP: ['ArrowUp'],
  MOVE_DOWN: ['ArrowDown'],
  MOVE_LEFT: ['ArrowLeft'],
  MOVE_RIGHT: ['ArrowRight'],
  
  // Selection
  SELECT_ALL: ['Ctrl+a', 'Cmd+a'],
  SELECT_NONE: ['Escape'],
  SELECT_MULTIPLE: ['Ctrl+Click', 'Cmd+Click'],
  
  // Editing
  EDIT_NODE: ['F2', 'Enter'],
  DELETE_SELECTED: ['Delete', 'Backspace'],
  DUPLICATE: ['Ctrl+d', 'Cmd+d'],
  
  // Clipboard
  COPY: ['Ctrl+c', 'Cmd+c'],
  CUT: ['Ctrl+x', 'Cmd+x'],
  PASTE: ['Ctrl+v', 'Cmd+v'],
  
  // History
  UNDO: ['Ctrl+z', 'Cmd+z'],
  REDO: ['Ctrl+y', 'Cmd+y', 'Ctrl+Shift+z', 'Cmd+Shift+z'],
  
  // View
  ZOOM_IN: ['Ctrl+=', 'Cmd+=', '+'],
  ZOOM_OUT: ['Ctrl+-', 'Cmd+-', '-'],
  ZOOM_FIT: ['Ctrl+0', 'Cmd+0'],
  ZOOM_RESET: ['Ctrl+1', 'Cmd+1'],
  
  // Tools
  TOGGLE_PALETTE: ['p'],
  TOGGLE_MINIMAP: ['m'],
  TOGGLE_GRID: ['g'],
  SAVE: ['Ctrl+s', 'Cmd+s'],
  
  // Accessibility
  TOGGLE_HIGH_CONTRAST: ['Ctrl+Shift+h', 'Cmd+Shift+h'],
  TOGGLE_REDUCED_MOTION: ['Ctrl+Shift+m', 'Cmd+Shift+m'],
  INCREASE_FONT_SIZE: ['Ctrl+Shift+=', 'Cmd+Shift+='],
  DECREASE_FONT_SIZE: ['Ctrl+Shift+-', 'Cmd+Shift+-'],
  SHOW_SHORTCUTS: ['?', 'F1']
} as const;

// ============================================================================
// ARIA Roles and Properties
// ============================================================================

export const ARIA_ROLES = {
  DIAGRAM: 'img',
  NODE: 'button',
  EDGE: 'presentation',
  TOOLBAR: 'toolbar',
  PALETTE: 'listbox',
  PALETTE_ITEM: 'option',
  MINIMAP: 'img',
  CONTROLS: 'group',
  MENU: 'menu',
  MENUITEM: 'menuitem',
  DIALOG: 'dialog',
  ALERT: 'alert',
  STATUS: 'status',
  LOG: 'log',
  REGION: 'region',
  LANDMARK: 'landmark'
} as const;

export const ARIA_PROPERTIES = {
  LABEL: 'aria-label',
  LABELLEDBY: 'aria-labelledby',
  DESCRIBEDBY: 'aria-describedby',
  EXPANDED: 'aria-expanded',
  SELECTED: 'aria-selected',
  DISABLED: 'aria-disabled',
  HIDDEN: 'aria-hidden',
  LIVE: 'aria-live',
  ATOMIC: 'aria-atomic',
  RELEVANT: 'aria-relevant',
  BUSY: 'aria-busy',
  CONTROLS: 'aria-controls',
  OWNS: 'aria-owns',
  ACTIVEDESCENDANT: 'aria-activedescendant',
  LEVEL: 'aria-level',
  SETSIZE: 'aria-setsize',
  POSINSET: 'aria-posinset'
} as const;

// ============================================================================
// Screen Reader Messages
// ============================================================================

export const SCREEN_READER_MESSAGES = {
  // Navigation
  NODE_FOCUSED: (label: string, type: string) => `Nó ${type} "${label}" focado`,
  NODE_SELECTED: (label: string) => `Nó "${label}" selecionado`,
  NODE_DESELECTED: (label: string) => `Nó "${label}" desselecionado`,
  MULTIPLE_SELECTED: (count: number) => `${count} elementos selecionados`,
  
  // Editing
  NODE_CREATED: (type: string) => `Novo nó ${type} criado`,
  NODE_DELETED: (label: string) => `Nó "${label}" excluído`,
  NODE_DUPLICATED: (label: string) => `Nó "${label}" duplicado`,
  NODE_EDITED: (label: string) => `Nó "${label}" editado`,
  
  // Connections
  EDGE_CREATED: (from: string, to: string) => `Conexão criada de "${from}" para "${to}"`,
  EDGE_DELETED: (from: string, to: string) => `Conexão removida de "${from}" para "${to}"`,
  
  // View
  ZOOM_CHANGED: (level: number) => `Zoom alterado para ${Math.round(level * 100)}%`,
  VIEW_FITTED: () => 'Visualização ajustada ao conteúdo',
  
  // History
  UNDO_PERFORMED: () => 'Ação desfeita',
  REDO_PERFORMED: () => 'Ação refeita',
  
  // Import/Export
  DIAGRAM_IMPORTED: () => 'Diagrama importado com sucesso',
  DIAGRAM_EXPORTED: (format: string) => `Diagrama exportado como ${format}`,
  
  // Errors
  INVALID_CONNECTION: () => 'Conexão inválida',
  OPERATION_FAILED: (operation: string) => `Falha na operação: ${operation}`,
  
  // Status
  DIAGRAM_SAVED: () => 'Diagrama salvo',
  DIAGRAM_LOADED: () => 'Diagrama carregado',
  READONLY_MODE: () => 'Modo somente leitura ativo'
} as const;

// ============================================================================
// High Contrast Colors
// ============================================================================

export const HIGH_CONTRAST_COLORS = {
  BACKGROUND: '#000000',
  FOREGROUND: '#ffffff',
  ACCENT: '#ffff00',
  BORDER: '#ffffff',
  FOCUS: '#00ffff',
  SELECTED: '#ffff00',
  DISABLED: '#808080',
  ERROR: '#ff0000',
  SUCCESS: '#00ff00',
  WARNING: '#ffff00',
  INFO: '#00ffff'
} as const;

// ============================================================================
// Color Blindness Filters
// ============================================================================

export const COLOR_BLINDNESS_FILTERS = {
  PROTANOPIA: 'url(#protanopia-filter)',
  DEUTERANOPIA: 'url(#deuteranopia-filter)',
  TRITANOPIA: 'url(#tritanopia-filter)',
  ACHROMATOPSIA: 'url(#achromatopsia-filter)'
} as const;

// ============================================================================
// Default Accessibility Configuration
// ============================================================================

export const DEFAULT_ACCESSIBILITY_CONFIG: AccessibilityConfig = {
  keyboard: {
    enabled: true,
    focusOnMount: true,
    trapFocus: false,
    returnFocusOnUnmount: true,
    skipLinks: true,
    customShortcuts: {}
  },
  screenReader: {
    enabled: true,
    announceActions: true,
    announceNavigation: true,
    announceChanges: true,
    announceErrors: true,
    verbosity: 'normal',
    language: 'pt-BR'
  },
  highContrast: false,
  reducedMotion: false,
  fontSize: 'normal',
  colorBlindness: {
    enabled: false,
    type: 'protanopia'
  },
  skipLinks: true,
  focusIndicators: {
    enabled: true,
    style: 'outline',
    color: '#0066cc',
    width: 2
  }
};

// ============================================================================
// Focus Order Priority
// ============================================================================

export const FOCUS_PRIORITY = {
  SKIP_LINKS: 0,
  TOOLBAR: 10,
  PALETTE: 20,
  CANVAS: 30,
  NODES: 40,
  EDGES: 50,
  CONTROLS: 60,
  MINIMAP: 70,
  CONTEXT_MENU: 80,
  DIALOGS: 90
} as const;

// ============================================================================
// Animation Durations (for reduced motion)
// ============================================================================

export const ANIMATION_DURATIONS = {
  NORMAL: {
    FAST: 150,
    MEDIUM: 300,
    SLOW: 500
  },
  REDUCED: {
    FAST: 0,
    MEDIUM: 0,
    SLOW: 0
  }
} as const;