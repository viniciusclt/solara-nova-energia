// ============================================================================
// Keyboard Shortcuts Manager - Gerenciador de atalhos de teclado
// ============================================================================
// Sistema unificado de atalhos para o editor de diagramas
// ============================================================================

import { useEffect, useCallback, useRef } from 'react';
import { UnifiedNodeType } from '../types/unified-diagram';

// ============================================================================
// INTERFACES
// ============================================================================

interface KeyboardShortcut {
  id: string;
  keys: string[];
  description: string;
  category: 'editing' | 'navigation' | 'selection' | 'view' | 'file' | 'node';
  action: () => void;
  enabled?: boolean;
  preventDefault?: boolean;
  stopPropagation?: boolean;
}

interface ShortcutGroup {
  category: string;
  title: string;
  shortcuts: KeyboardShortcut[];
}

interface KeyboardShortcutActions {
  // File operations
  onSave?: () => void;
  onSaveAs?: () => void;
  onOpen?: () => void;
  onNew?: () => void;
  onExport?: () => void;
  onImport?: () => void;
  
  // Edit operations
  onUndo?: () => void;
  onRedo?: () => void;
  onCopy?: () => void;
  onCut?: () => void;
  onPaste?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onSelectAll?: () => void;
  
  // View operations
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onZoomToFit?: () => void;
  onZoomToSelection?: () => void;
  onResetView?: () => void;
  onToggleGrid?: () => void;
  onToggleMinimap?: () => void;
  
  // Node operations
  onAddNode?: (type: UnifiedNodeType) => void;
  onAlignLeft?: () => void;
  onAlignRight?: () => void;
  onAlignTop?: () => void;
  onAlignBottom?: () => void;
  onAlignCenter?: () => void;
  onAlignMiddle?: () => void;
  onDistributeHorizontally?: () => void;
  onDistributeVertically?: () => void;
  
  // Navigation
  onFocusSearch?: () => void;
  onToggleProperties?: () => void;
  onTogglePalette?: () => void;
  onToggleOutline?: () => void;
}

interface UseKeyboardShortcutsOptions {
  enabled?: boolean;
  preventDefault?: boolean;
  stopPropagation?: boolean;
  target?: HTMLElement | null;
}

// ============================================================================
// UTILITÁRIOS DE TECLADO
// ============================================================================

/**
 * Normaliza uma combinação de teclas
 */
const normalizeKeys = (keys: string): string => {
  return keys
    .toLowerCase()
    .split('+')
    .map(key => key.trim())
    .sort((a, b) => {
      // Ordem: ctrl, alt, shift, meta, outras teclas
      const order = ['ctrl', 'alt', 'shift', 'meta'];
      const aIndex = order.indexOf(a);
      const bIndex = order.indexOf(b);
      
      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex;
      }
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
      return a.localeCompare(b);
    })
    .join('+');
};

/**
 * Converte evento de teclado para string de teclas
 */
const eventToKeyString = (event: KeyboardEvent): string => {
  const keys: string[] = [];
  
  if (event.ctrlKey || event.metaKey) keys.push('ctrl');
  if (event.altKey) keys.push('alt');
  if (event.shiftKey) keys.push('shift');
  
  // Mapear teclas especiais
  const keyMap: Record<string, string> = {
    ' ': 'space',
    'ArrowUp': 'up',
    'ArrowDown': 'down',
    'ArrowLeft': 'left',
    'ArrowRight': 'right',
    'Escape': 'escape',
    'Enter': 'enter',
    'Tab': 'tab',
    'Backspace': 'backspace',
    'Delete': 'delete',
    'Home': 'home',
    'End': 'end',
    'PageUp': 'pageup',
    'PageDown': 'pagedown'
  };
  
  const key = keyMap[event.key] || event.key.toLowerCase();
  keys.push(key);
  
  return normalizeKeys(keys.join('+'));
};

/**
 * Verifica se um elemento é editável
 */
const isEditableElement = (element: Element): boolean => {
  const tagName = element.tagName.toLowerCase();
  const isInput = tagName === 'input' || tagName === 'textarea';
  const isContentEditable = element.getAttribute('contenteditable') === 'true';
  
  return isInput || isContentEditable;
};

// ============================================================================
// DEFINIÇÕES DE ATALHOS
// ============================================================================

/**
 * Cria atalhos de arquivo
 */
const createFileShortcuts = (actions: KeyboardShortcutActions): KeyboardShortcut[] => [
  {
    id: 'file-new',
    keys: ['ctrl+n'],
    description: 'Novo diagrama',
    category: 'file',
    action: () => actions.onNew?.(),
    enabled: !!actions.onNew
  },
  {
    id: 'file-open',
    keys: ['ctrl+o'],
    description: 'Abrir diagrama',
    category: 'file',
    action: () => actions.onOpen?.(),
    enabled: !!actions.onOpen
  },
  {
    id: 'file-save',
    keys: ['ctrl+s'],
    description: 'Salvar diagrama',
    category: 'file',
    action: () => actions.onSave?.(),
    enabled: !!actions.onSave
  },
  {
    id: 'file-save-as',
    keys: ['ctrl+shift+s'],
    description: 'Salvar como...',
    category: 'file',
    action: () => actions.onSaveAs?.(),
    enabled: !!actions.onSaveAs
  },
  {
    id: 'file-export',
    keys: ['ctrl+e'],
    description: 'Exportar diagrama',
    category: 'file',
    action: () => actions.onExport?.(),
    enabled: !!actions.onExport
  },
  {
    id: 'file-import',
    keys: ['ctrl+i'],
    description: 'Importar diagrama',
    category: 'file',
    action: () => actions.onImport?.(),
    enabled: !!actions.onImport
  }
];

/**
 * Cria atalhos de edição
 */
const createEditShortcuts = (actions: KeyboardShortcutActions): KeyboardShortcut[] => [
  {
    id: 'edit-undo',
    keys: ['ctrl+z'],
    description: 'Desfazer',
    category: 'editing',
    action: () => actions.onUndo?.(),
    enabled: !!actions.onUndo
  },
  {
    id: 'edit-redo',
    keys: ['ctrl+y', 'ctrl+shift+z'],
    description: 'Refazer',
    category: 'editing',
    action: () => actions.onRedo?.(),
    enabled: !!actions.onRedo
  },
  {
    id: 'edit-copy',
    keys: ['ctrl+c'],
    description: 'Copiar seleção',
    category: 'editing',
    action: () => actions.onCopy?.(),
    enabled: !!actions.onCopy
  },
  {
    id: 'edit-cut',
    keys: ['ctrl+x'],
    description: 'Recortar seleção',
    category: 'editing',
    action: () => actions.onCut?.(),
    enabled: !!actions.onCut
  },
  {
    id: 'edit-paste',
    keys: ['ctrl+v'],
    description: 'Colar',
    category: 'editing',
    action: () => actions.onPaste?.(),
    enabled: !!actions.onPaste
  },
  {
    id: 'edit-delete',
    keys: ['delete', 'backspace'],
    description: 'Deletar seleção',
    category: 'editing',
    action: () => actions.onDelete?.(),
    enabled: !!actions.onDelete
  },
  {
    id: 'edit-duplicate',
    keys: ['ctrl+d'],
    description: 'Duplicar seleção',
    category: 'editing',
    action: () => actions.onDuplicate?.(),
    enabled: !!actions.onDuplicate
  },
  {
    id: 'edit-select-all',
    keys: ['ctrl+a'],
    description: 'Selecionar tudo',
    category: 'selection',
    action: () => actions.onSelectAll?.(),
    enabled: !!actions.onSelectAll
  }
];

/**
 * Cria atalhos de visualização
 */
const createViewShortcuts = (actions: KeyboardShortcutActions): KeyboardShortcut[] => [
  {
    id: 'view-zoom-in',
    keys: ['ctrl+=', 'ctrl+plus'],
    description: 'Aumentar zoom',
    category: 'view',
    action: () => actions.onZoomIn?.(),
    enabled: !!actions.onZoomIn
  },
  {
    id: 'view-zoom-out',
    keys: ['ctrl+-', 'ctrl+minus'],
    description: 'Diminuir zoom',
    category: 'view',
    action: () => actions.onZoomOut?.(),
    enabled: !!actions.onZoomOut
  },
  {
    id: 'view-zoom-fit',
    keys: ['ctrl+0'],
    description: 'Ajustar à tela',
    category: 'view',
    action: () => actions.onZoomToFit?.(),
    enabled: !!actions.onZoomToFit
  },
  {
    id: 'view-zoom-selection',
    keys: ['ctrl+shift+0'],
    description: 'Ajustar à seleção',
    category: 'view',
    action: () => actions.onZoomToSelection?.(),
    enabled: !!actions.onZoomToSelection
  },
  {
    id: 'view-reset',
    keys: ['ctrl+shift+r'],
    description: 'Resetar visualização',
    category: 'view',
    action: () => actions.onResetView?.(),
    enabled: !!actions.onResetView
  },
  {
    id: 'view-toggle-grid',
    keys: ['ctrl+g'],
    description: 'Alternar grade',
    category: 'view',
    action: () => actions.onToggleGrid?.(),
    enabled: !!actions.onToggleGrid
  },
  {
    id: 'view-toggle-minimap',
    keys: ['ctrl+m'],
    description: 'Alternar minimapa',
    category: 'view',
    action: () => actions.onToggleMinimap?.(),
    enabled: !!actions.onToggleMinimap
  }
];

/**
 * Cria atalhos de nós
 */
const createNodeShortcuts = (actions: KeyboardShortcutActions): KeyboardShortcut[] => [
  {
    id: 'node-add-task',
    keys: ['t'],
    description: 'Adicionar tarefa',
    category: 'node',
    action: () => actions.onAddNode?.('task'),
    enabled: !!actions.onAddNode
  },
  {
    id: 'node-add-decision',
    keys: ['d'],
    description: 'Adicionar decisão',
    category: 'node',
    action: () => actions.onAddNode?.('decision'),
    enabled: !!actions.onAddNode
  },
  {
    id: 'node-add-start',
    keys: ['s'],
    description: 'Adicionar início',
    category: 'node',
    action: () => actions.onAddNode?.('start'),
    enabled: !!actions.onAddNode
  },
  {
    id: 'node-add-end',
    keys: ['e'],
    description: 'Adicionar fim',
    category: 'node',
    action: () => actions.onAddNode?.('end'),
    enabled: !!actions.onAddNode
  },
  {
    id: 'align-left',
    keys: ['ctrl+shift+left'],
    description: 'Alinhar à esquerda',
    category: 'node',
    action: () => actions.onAlignLeft?.(),
    enabled: !!actions.onAlignLeft
  },
  {
    id: 'align-right',
    keys: ['ctrl+shift+right'],
    description: 'Alinhar à direita',
    category: 'node',
    action: () => actions.onAlignRight?.(),
    enabled: !!actions.onAlignRight
  },
  {
    id: 'align-top',
    keys: ['ctrl+shift+up'],
    description: 'Alinhar ao topo',
    category: 'node',
    action: () => actions.onAlignTop?.(),
    enabled: !!actions.onAlignTop
  },
  {
    id: 'align-bottom',
    keys: ['ctrl+shift+down'],
    description: 'Alinhar à base',
    category: 'node',
    action: () => actions.onAlignBottom?.(),
    enabled: !!actions.onAlignBottom
  },
  {
    id: 'distribute-horizontal',
    keys: ['ctrl+shift+h'],
    description: 'Distribuir horizontalmente',
    category: 'node',
    action: () => actions.onDistributeHorizontally?.(),
    enabled: !!actions.onDistributeHorizontally
  },
  {
    id: 'distribute-vertical',
    keys: ['ctrl+shift+v'],
    description: 'Distribuir verticalmente',
    category: 'node',
    action: () => actions.onDistributeVertically?.(),
    enabled: !!actions.onDistributeVertically
  }
];

/**
 * Cria atalhos de navegação
 */
const createNavigationShortcuts = (actions: KeyboardShortcutActions): KeyboardShortcut[] => [
  {
    id: 'nav-search',
    keys: ['ctrl+f'],
    description: 'Buscar',
    category: 'navigation',
    action: () => actions.onFocusSearch?.(),
    enabled: !!actions.onFocusSearch
  },
  {
    id: 'nav-properties',
    keys: ['ctrl+p'],
    description: 'Alternar propriedades',
    category: 'navigation',
    action: () => actions.onToggleProperties?.(),
    enabled: !!actions.onToggleProperties
  },
  {
    id: 'nav-palette',
    keys: ['ctrl+shift+p'],
    description: 'Alternar paleta',
    category: 'navigation',
    action: () => actions.onTogglePalette?.(),
    enabled: !!actions.onTogglePalette
  },
  {
    id: 'nav-outline',
    keys: ['ctrl+shift+o'],
    description: 'Alternar outline',
    category: 'navigation',
    action: () => actions.onToggleOutline?.(),
    enabled: !!actions.onToggleOutline
  }
];

// ============================================================================
// HOOK PRINCIPAL
// ============================================================================

/**
 * Hook para gerenciar atalhos de teclado
 */
export const useKeyboardShortcuts = (
  actions: KeyboardShortcutActions,
  options: UseKeyboardShortcutsOptions = {}
) => {
  const {
    enabled = true,
    preventDefault = true,
    stopPropagation = true,
    target = null
  } = options;
  
  const shortcutsRef = useRef<Map<string, KeyboardShortcut>>(new Map());
  const actionsRef = useRef(actions);
  
  // Atualizar referência das ações
  actionsRef.current = actions;
  
  // Criar mapa de atalhos
  const createShortcutsMap = useCallback(() => {
    const shortcuts = [
      ...createFileShortcuts(actionsRef.current),
      ...createEditShortcuts(actionsRef.current),
      ...createViewShortcuts(actionsRef.current),
      ...createNodeShortcuts(actionsRef.current),
      ...createNavigationShortcuts(actionsRef.current)
    ];
    
    const map = new Map<string, KeyboardShortcut>();
    
    shortcuts.forEach(shortcut => {
      if (shortcut.enabled !== false) {
        shortcut.keys.forEach(key => {
          const normalizedKey = normalizeKeys(key);
          map.set(normalizedKey, shortcut);
        });
      }
    });
    
    shortcutsRef.current = map;
  }, []);
  
  // Handler de eventos de teclado
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;
    
    // Ignorar se estiver em elemento editável
    if (event.target && isEditableElement(event.target as Element)) {
      return;
    }
    
    const keyString = eventToKeyString(event);
    const shortcut = shortcutsRef.current.get(keyString);
    
    if (shortcut) {
      if (preventDefault || shortcut.preventDefault !== false) {
        event.preventDefault();
      }
      
      if (stopPropagation || shortcut.stopPropagation !== false) {
        event.stopPropagation();
      }
      
      try {
        shortcut.action();
      } catch (error) {
        console.error(`Erro ao executar atalho ${shortcut.id}:`, error);
      }
    }
  }, [enabled, preventDefault, stopPropagation]);
  
  // Configurar listeners
  useEffect(() => {
    createShortcutsMap();
    
    const targetElement = target || document;
    targetElement.addEventListener('keydown', handleKeyDown);
    
    return () => {
      targetElement.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, target, createShortcutsMap]);
  
  // Retornar utilitários
  return {
    shortcuts: Array.from(shortcutsRef.current.values()),
    getShortcutsByCategory: (category: KeyboardShortcut['category']) => {
      return Array.from(shortcutsRef.current.values())
        .filter(s => s.category === category);
    },
    getShortcutGroups: (): ShortcutGroup[] => {
      const categories = {
        file: 'Arquivo',
        editing: 'Edição',
        selection: 'Seleção',
        view: 'Visualização',
        node: 'Nós',
        navigation: 'Navegação'
      };
      
      return Object.entries(categories).map(([category, title]) => ({
        category,
        title,
        shortcuts: Array.from(shortcutsRef.current.values())
          .filter(s => s.category === category)
      }));
    },
    formatShortcut: (keys: string[]) => {
      return keys
        .map(key => {
          const keyMap: Record<string, string> = {
            'ctrl': '⌘',
            'alt': '⌥',
            'shift': '⇧',
            'meta': '⌘',
            'space': 'Space',
            'enter': 'Enter',
            'escape': 'Esc',
            'backspace': '⌫',
            'delete': 'Del',
            'up': '↑',
            'down': '↓',
            'left': '←',
            'right': '→'
          };
          
          return keyMap[key] || key.toUpperCase();
        })
        .join(' + ');
    }
  };
};

// ============================================================================
// COMPONENTE DE AJUDA
// ============================================================================

/**
 * Hook para modal de ajuda de atalhos
 */
export const useShortcutHelp = () => {
  const [isOpen, setIsOpen] = useState(false);
  
  const openHelp = useCallback(() => setIsOpen(true), []);
  const closeHelp = useCallback(() => setIsOpen(false), []);
  const toggleHelp = useCallback(() => setIsOpen(prev => !prev), []);
  
  // Atalho para abrir ajuda
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'F1' || (event.ctrlKey && event.key === '/')) {
        event.preventDefault();
        toggleHelp();
      }
      
      if (event.key === 'Escape' && isOpen) {
        closeHelp();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, toggleHelp, closeHelp]);
  
  return {
    isOpen,
    openHelp,
    closeHelp,
    toggleHelp
  };
};

// ============================================================================
// UTILITÁRIOS EXPORTADOS
// ============================================================================

export {
  normalizeKeys,
  eventToKeyString,
  isEditableElement
};

export type {
  KeyboardShortcut,
  ShortcutGroup,
  KeyboardShortcutActions,
  UseKeyboardShortcutsOptions
};

export default useKeyboardShortcuts;