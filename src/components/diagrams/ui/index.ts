// ============================================================================
// Enhanced UI Components - Índice dos componentes de UI aprimorados
// Exportações centralizadas dos componentes de interface inspirados no MindMeister
// ============================================================================

// Enhanced UI Components
export {
  FloatingToolbar,
  SmartPalette,
  ContextMenu,
  QuickActions,
  type FloatingToolbarProps,
  type SmartPaletteProps,
  type ContextMenuProps,
  type QuickActionsProps,
  type ToolbarAction,
  type PaletteElement,
  type PaletteCategory,
  type ContextMenuItem,
  type QuickAction
} from './EnhancedUI';

// Enhanced Navigation Components
export {
  EnhancedMiniMap,
  ZoomControls,
  LayerControls,
  NavigationHistory,
  type EnhancedMiniMapProps,
  type ZoomControlsProps,
  type ViewportControlsProps,
  type LayerControlsProps,
  type NavigationHistoryProps,
  type Layer,
  type ViewportState,
  type Bookmark
} from './EnhancedNavigation';

// Enhanced Status Bar
export {
  EnhancedStatusBar,
  type EnhancedStatusBarProps,
  type DiagramStats,
  type PerformanceMetrics,
  type ConnectionStatus,
  type ViewportInfo,
  type ToolInfo,
  type StatusSection
} from './EnhancedStatusBar';

// Theme Customizer
export {
  ThemeCustomizer,
  ColorPalette,
  DEFAULT_THEMES,
  COLOR_PALETTES,
  type ThemeCustomizerProps,
  type ColorPaletteProps,
  type StylePresetProps,
  type DiagramTheme,
  type ThemeColors,
  type NodeStyle,
  type EdgeStyle,
  type GridStyle
} from './ThemeCustomizer';

// ============================================================================
// COMPONENTES COMBINADOS
// ============================================================================

// Exportação padrão com todos os componentes
const EnhancedDiagramUI = {
  // Toolbar e Paleta
  FloatingToolbar,
  SmartPalette,
  ContextMenu,
  QuickActions,
  
  // Navegação
  EnhancedMiniMap,
  ZoomControls,
  LayerControls,
  NavigationHistory,
  
  // Status e Informações
  EnhancedStatusBar,
  
  // Personalização
  ThemeCustomizer,
  ColorPalette,
  
  // Constantes
  DEFAULT_THEMES,
  COLOR_PALETTES
};

export default EnhancedDiagramUI;

// ============================================================================
// TIPOS UTILITÁRIOS
// ============================================================================

// Tipo para configuração completa da UI
export interface EnhancedUIConfig {
  toolbar: {
    enabled: boolean;
    position: 'top' | 'bottom' | 'left' | 'right' | 'floating';
    actions: ToolbarAction[];
  };
  palette: {
    enabled: boolean;
    position: 'left' | 'right';
    mode: 'compact' | 'expanded' | 'auto';
    categories: PaletteCategory[];
  };
  miniMap: {
    enabled: boolean;
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    size: 'small' | 'medium' | 'large';
  };
  statusBar: {
    enabled: boolean;
    compact: boolean;
    sections: string[];
  };
  theme: {
    current: string;
    customizable: boolean;
    presets: DiagramTheme[];
  };
  navigation: {
    history: boolean;
    bookmarks: boolean;
    layers: boolean;
  };
}

// Tipo para estado da UI
export interface EnhancedUIState {
  activeTools: string[];
  selectedElements: string[];
  viewport: ViewportInfo;
  layers: Layer[];
  theme: DiagramTheme;
  performance: PerformanceMetrics;
  connection: ConnectionStatus;
}

// Tipo para callbacks da UI
export interface EnhancedUICallbacks {
  onToolSelect: (tool: string) => void;
  onElementCreate: (type: string, position: { x: number; y: number }) => void;
  onElementSelect: (ids: string[]) => void;
  onElementDelete: (ids: string[]) => void;
  onViewportChange: (viewport: ViewportInfo) => void;
  onThemeChange: (theme: DiagramTheme) => void;
  onLayerToggle: (layerId: string) => void;
  onBookmarkCreate: (name: string) => void;
  onHistoryNavigate: (index: number) => void;
}

// ============================================================================
// HOOKS UTILITÁRIOS
// ============================================================================

// Hook para gerenciar estado da UI aprimorada
export const useEnhancedUI = (config: EnhancedUIConfig) => {
  const [state, setState] = React.useState<EnhancedUIState>({
    activeTools: [],
    selectedElements: [],
    viewport: {
      x: 0,
      y: 0,
      zoom: 1,
      bounds: { width: 0, height: 0 },
      visibleArea: { width: 0, height: 0 }
    },
    layers: [],
    theme: DEFAULT_THEMES[0],
    performance: {
      renderTime: 0,
      memoryUsage: 0,
      fps: 60,
      nodeRenderCount: 0,
      edgeRenderCount: 0
    },
    connection: {
      isOnline: true,
      lastSync: null,
      syncStatus: 'idle',
      pendingChanges: 0
    }
  });

  const updateState = React.useCallback((updates: Partial<EnhancedUIState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const callbacks: EnhancedUICallbacks = React.useMemo(() => ({
    onToolSelect: (tool: string) => {
      updateState({ activeTools: [tool] });
    },
    onElementCreate: (type: string, position: { x: number; y: number }) => {
      // Implementar criação de elemento
      console.log('Creating element:', type, position);
    },
    onElementSelect: (ids: string[]) => {
      updateState({ selectedElements: ids });
    },
    onElementDelete: (ids: string[]) => {
      // Implementar exclusão de elementos
      console.log('Deleting elements:', ids);
    },
    onViewportChange: (viewport: ViewportInfo) => {
      updateState({ viewport });
    },
    onThemeChange: (theme: DiagramTheme) => {
      updateState({ theme });
    },
    onLayerToggle: (layerId: string) => {
      updateState({
        layers: state.layers.map(layer => 
          layer.id === layerId 
            ? { ...layer, visible: !layer.visible }
            : layer
        )
      });
    },
    onBookmarkCreate: (name: string) => {
      // Implementar criação de bookmark
      console.log('Creating bookmark:', name);
    },
    onHistoryNavigate: (index: number) => {
      // Implementar navegação no histórico
      console.log('Navigating to history index:', index);
    }
  }), [updateState, state.layers]);

  return {
    state,
    updateState,
    callbacks,
    config
  };
};

// ============================================================================
// CONSTANTES DE CONFIGURAÇÃO
// ============================================================================

// Configuração padrão da UI aprimorada
export const DEFAULT_UI_CONFIG: EnhancedUIConfig = {
  toolbar: {
    enabled: true,
    position: 'floating',
    actions: [
      { id: 'select', label: 'Selecionar', icon: 'MousePointer', shortcut: 'V' },
      { id: 'pan', label: 'Mover', icon: 'Move', shortcut: 'H' },
      { id: 'rectangle', label: 'Retângulo', icon: 'Square', shortcut: 'R' },
      { id: 'circle', label: 'Círculo', icon: 'Circle', shortcut: 'C' },
      { id: 'text', label: 'Texto', icon: 'Type', shortcut: 'T' },
      { id: 'arrow', label: 'Seta', icon: 'ArrowRight', shortcut: 'A' }
    ]
  },
  palette: {
    enabled: true,
    position: 'left',
    mode: 'auto',
    categories: [
      {
        id: 'basic',
        name: 'Básico',
        elements: [
          { id: 'rectangle', name: 'Retângulo', icon: 'Square', category: 'basic' },
          { id: 'circle', name: 'Círculo', icon: 'Circle', category: 'basic' },
          { id: 'triangle', name: 'Triângulo', icon: 'Triangle', category: 'basic' }
        ]
      },
      {
        id: 'flowchart',
        name: 'Fluxograma',
        elements: [
          { id: 'process', name: 'Processo', icon: 'Square', category: 'flowchart' },
          { id: 'decision', name: 'Decisão', icon: 'Diamond', category: 'flowchart' },
          { id: 'start-end', name: 'Início/Fim', icon: 'Circle', category: 'flowchart' }
        ]
      }
    ]
  },
  miniMap: {
    enabled: true,
    position: 'bottom-right',
    size: 'medium'
  },
  statusBar: {
    enabled: true,
    compact: false,
    sections: ['diagram-stats', 'viewport-info', 'tool-info', 'connection-status']
  },
  theme: {
    current: 'light',
    customizable: true,
    presets: DEFAULT_THEMES
  },
  navigation: {
    history: true,
    bookmarks: true,
    layers: true
  }
};