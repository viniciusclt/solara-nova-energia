import React, { memo, useState } from 'react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { DiagramCanvas } from '../canvas/DiagramCanvas';
import { DiagramToolbar } from '../toolbar/DiagramToolbar';
import { DiagramPalette } from '../palette/DiagramPalette';
import { AdvancedNodePalette } from '../palette/AdvancedNodePalette';
import { AdvancedNodeToolbar } from '../toolbar/AdvancedNodeToolbar';
import { DiagramMinimap } from '../DiagramMinimap';
import { DiagramContextMenu } from '../DiagramContextMenu';
import { DiagramAdvancedControls } from '../DiagramAdvancedControls';
import { PropertiesPanel } from '../panels/PropertiesPanel';
import { DiagramStatusBar } from './DiagramStatusBar';
// Enhanced UI Components
import {
  FloatingToolbar,
  SmartPalette,
  EnhancedMiniMap,
  ZoomControls,
  LayerControls,
  NavigationHistory,
  EnhancedStatusBar,
  ThemeCustomizer,
  DEFAULT_UI_CONFIG,
  useEnhancedUI,
  type EnhancedUIConfig
} from '../ui';

export interface DiagramLayoutProps {
  className?: string;
  readOnly?: boolean;
  showToolbar?: boolean;
  showPalette?: boolean;
  useAdvancedComponents?: boolean;
  useEnhancedUI?: boolean;
  enhancedUIConfig?: Partial<EnhancedUIConfig>;
  toolbarProps?: {
    onSave: () => void;
    onUndo: () => void;
    onRedo: () => void;
    onExport: (format: 'png' | 'svg' | 'pdf' | 'json') => void;
    onImport: (file: File) => void;
    canUndo: boolean;
    canRedo: boolean;
    hasUnsavedChanges: boolean;
  };
  paletteProps?: {
    diagramType: string;
    onAddNode: (nodeType: string, position?: { x: number; y: number }) => void;
  };
  advancedToolbarProps?: {
    orientation?: 'horizontal' | 'vertical';
    showLabels?: boolean;
    compactMode?: boolean;
    onNodeCreate?: (nodeType: string) => void;
  };
  advancedPaletteProps?: {
    showTemplateInfo?: boolean;
    enableQuickActions?: boolean;
    compactMode?: boolean;
    onNodeCreate?: (nodeType: string) => void;
  };
}

/**
 * Layout principal do editor de diagramas
 * Gerencia a disposição dos componentes: toolbar, palette, canvas e properties panel
 */
export const DiagramLayout: React.FC<DiagramLayoutProps> = memo(({
  className,
  readOnly = false,
  showToolbar = true,
  showPalette = true,
  useAdvancedComponents = false,
  useEnhancedUI = false,
  enhancedUIConfig,
  toolbarProps,
  paletteProps,
  advancedToolbarProps,
  advancedPaletteProps
}) => {
  // Enhanced UI State
  const [showThemeCustomizer, setShowThemeCustomizer] = useState(false);
  const uiConfig = { ...DEFAULT_UI_CONFIG, ...enhancedUIConfig };
  const { state, callbacks } = useEnhancedUI(uiConfig);
  return (
    <div className={cn(
      'flex flex-col h-full bg-background',
      className
    )}>
      {/* Toolbar */}
      {showToolbar && (
        <>
          {useAdvancedComponents && advancedToolbarProps ? (
            <div className="p-2 border-b">
              <AdvancedNodeToolbar
                {...advancedToolbarProps}
                className="mb-2"
              />
              {toolbarProps && (
                <DiagramToolbar
                  {...toolbarProps}
                  className=""
                />
              )}
            </div>
          ) : (
            toolbarProps && (
              <DiagramToolbar
                {...toolbarProps}
                className="border-b"
              />
            )
          )}
          <Separator />
        </>
      )}

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Palette */}
        {showPalette && !readOnly && (
          <>
            <Card className={cn(
              'm-2 flex flex-col',
              useEnhancedUI ? 'w-96' : useAdvancedComponents ? 'w-80' : 'w-64'
            )}>
              {useEnhancedUI && uiConfig.palette.enabled ? (
                <SmartPalette
                  categories={uiConfig.palette.categories}
                  mode={uiConfig.palette.mode}
                  onElementSelect={callbacks.onElementCreate}
                  searchEnabled={true}
                  filterEnabled={true}
                  className="flex-1"
                />
              ) : useAdvancedComponents && advancedPaletteProps ? (
                <AdvancedNodePalette
                  {...advancedPaletteProps}
                  className="flex-1"
                />
              ) : (
                paletteProps && (
                  <DiagramPalette
                    {...paletteProps}
                    className="flex-1"
                  />
                )
              )}
            </Card>
            <Separator orientation="vertical" />
          </>
        )}

        {/* Canvas */}
        <div className="flex-1 relative">
          <DiagramCanvas
            readOnly={readOnly}
            className="h-full"
          />
          
          {/* Enhanced UI Components */}
          {useEnhancedUI ? (
            <>
              {/* Enhanced Minimap */}
              {uiConfig.miniMap.enabled && (
                <EnhancedMiniMap
                  position={uiConfig.miniMap.position}
                  size={uiConfig.miniMap.size}
                  viewport={state.viewport}
                  onViewportChange={callbacks.onViewportChange}
                  className="absolute z-10"
                />
              )}
              
              {/* Floating Toolbar */}
              {uiConfig.toolbar.enabled && uiConfig.toolbar.position === 'floating' && (
                <FloatingToolbar
                  actions={uiConfig.toolbar.actions}
                  onActionClick={callbacks.onToolSelect}
                  className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20"
                />
              )}
              
              {/* Zoom Controls */}
              <ZoomControls
                viewport={state.viewport}
                onViewportChange={callbacks.onViewportChange}
                className="absolute bottom-4 right-4 z-10"
              />
              
              {/* Layer Controls */}
              {uiConfig.navigation.layers && (
                <LayerControls
                  layers={state.layers}
                  onLayerToggle={callbacks.onLayerToggle}
                  className="absolute top-4 right-4 z-10"
                />
              )}
              
              {/* Navigation History */}
              {uiConfig.navigation.history && (
                <NavigationHistory
                  onNavigate={callbacks.onHistoryNavigate}
                  onBookmarkCreate={callbacks.onBookmarkCreate}
                  className="absolute top-16 right-4 z-10"
                />
              )}
            </>
          ) : (
            <>
              {/* Traditional Minimap */}
              <DiagramMinimap />
              
              {/* Context Menu */}
              <DiagramContextMenu />
              
              {/* Advanced Controls */}
              {!readOnly && (
                <DiagramAdvancedControls />
              )}
            </>
          )}
        </div>
        
        {/* Properties Panel */}
        {!readOnly && (
          <>
            <Separator orientation="vertical" />
            <Card className="w-80 m-2 flex flex-col">
              <PropertiesPanel className="flex-1" />
            </Card>
          </>
        )}
      </div>

      {/* Status Bar */}
      {useEnhancedUI && uiConfig.statusBar.enabled ? (
        <EnhancedStatusBar
          diagramStats={{
            nodeCount: 0,
            edgeCount: 0,
            selectedCount: state.selectedElements.length,
            layerCount: state.layers.length
          }}
          performanceMetrics={state.performance}
          connectionStatus={state.connection}
          viewportInfo={state.viewport}
          toolInfo={{
            activeTool: state.activeTools[0] || 'select',
            shortcuts: ['V: Select', 'H: Pan', 'R: Rectangle', 'C: Circle']
          }}
          compact={uiConfig.statusBar.compact}
          sections={uiConfig.statusBar.sections}
          className="border-t"
        />
      ) : (
        <DiagramStatusBar readOnly={readOnly} />
      )}
      
      {/* Theme Customizer Modal */}
      {showThemeCustomizer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg shadow-lg max-w-4xl max-h-[80vh] overflow-auto">
            <ThemeCustomizer
              currentTheme={state.theme}
              onThemeChange={callbacks.onThemeChange}
              onClose={() => setShowThemeCustomizer(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
});

DiagramLayout.displayName = 'DiagramLayout';