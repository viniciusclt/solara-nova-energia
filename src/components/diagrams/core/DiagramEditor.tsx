// ============================================================================
// DiagramEditor - Componente principal do sistema de diagramas
// ============================================================================

import React, { memo } from 'react';
import { ReactFlowProvider } from 'reactflow';
import { cn } from '@/lib/utils';
import { DiagramEditorProps } from '../types';
import { useDiagramEditor } from '../hooks';
import { DiagramLayout } from '../layout';
import { 
  AccessibilityProvider, 
  AccessibilityAnnouncer,
  KeyboardShortcuts,
  FocusIndicator,
  HighContrastMode,
  ReducedMotion
} from '../accessibility';
import { AdvancedConnectionTools } from '../tools/AdvancedConnectionTools';
import { AdvancedNodeOperations } from '../tools/AdvancedNodeOperations';
import { NodeTransformTools } from '../tools/NodeTransformTools';
import { ConnectionPreview } from '../ui/ConnectionPreview';
import { KeyboardShortcutsPanel } from '../ui/KeyboardShortcutsPanel';
import { useAdvancedConnections } from '../hooks/useAdvancedConnections';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

// ============================================================================
// Componente Principal
// ============================================================================

export const DiagramEditor: React.FC<DiagramEditorProps> = memo(({
  documentId,
  initialDocument,
  readOnly = false,
  showToolbar = true,
  showPalette = true,
  useAdvancedComponents = false,
  useEnhancedUI = false,
  enhancedUIConfig,
  className,
  onSave,
  onClose,
  ...props
}) => {
  // ============================================================================
  // Hook customizado para gerenciar toda a lógica do editor
  // ============================================================================

  const {
    isLoading,
    toolbarProps,
    paletteProps,
    advancedToolbarProps,
    advancedPaletteProps
  } = useDiagramEditor({
    documentId,
    initialDocument,
    readOnly,
    onSave,
    onClose
  });

  const { preview, onMouseMove, onNodeClick, onConnectionClick } = useAdvancedConnections();
  
  // Ativar atalhos de teclado
  useKeyboardShortcuts();

  // ============================================================================
  // Loading State
  // ============================================================================

  if (isLoading) {
    return (
      <div className={cn(
        'flex items-center justify-center h-96 bg-background',
        className
      )}>
        <div className="text-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Carregando diagrama...</p>
        </div>
      </div>
    );
  }

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <AccessibilityProvider>
      <ReactFlowProvider>
        <div 
           className="diagram-editor-container" 
           style={{ width: '100%', height: '100%' }}
           onMouseMove={onMouseMove}
         >
           <DiagramLayout
             className={className}
             readOnly={readOnly}
             showToolbar={showToolbar}
             showPalette={showPalette}
             useAdvancedComponents={useAdvancedComponents}
             useEnhancedUI={useEnhancedUI}
             enhancedUIConfig={enhancedUIConfig}
             toolbarProps={toolbarProps}
             paletteProps={paletteProps}
             advancedToolbarProps={advancedToolbarProps}
             advancedPaletteProps={advancedPaletteProps}
           />
           
           {/* Enhanced UI Components */}
           {useEnhancedUI && (
          <>
            <EnhancedMiniMap />
            <FloatingToolbar />
            <SmartPalette />
            <AdvancedNodeToolbar />
            <AutoRoutingPanel />
            <AdvancedConnectionTools />
            <AdvancedNodeOperations position="floating" />
             <NodeTransformTools position="floating" compact />
             <KeyboardShortcutsPanel position="floating" compact />
            {preview && (
              <ConnectionPreview
                preview={preview}
                onMouseMove={onMouseMove}
                onNodeClick={onNodeClick}
                onConnectionClick={onConnectionClick}
              />
            )}
          </>
        )}
         </div>
        
        {/* Accessibility Components */}
        <AccessibilityAnnouncer />
        <KeyboardShortcuts />
        <FocusIndicator />
        <HighContrastMode />
        <ReducedMotion />
      </ReactFlowProvider>
    </AccessibilityProvider>
  );
});

// ============================================================================
// Componente com Error Boundary
// ============================================================================

interface DiagramEditorWrapperProps extends DiagramEditorProps {
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
}

class DiagramErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ComponentType<{ error: Error; resetError: () => void }> },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: unknown) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    secureLogger.error('Erro no DiagramEditor', { error, errorInfo });
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback;
      
      if (FallbackComponent) {
        return <FallbackComponent error={this.state.error} resetError={this.resetError} />;
      }

      return (
        <div className="flex items-center justify-center h-96 bg-background">
          <div className="text-center space-y-4 max-w-md">
            <h3 className="text-lg font-semibold text-destructive">
              Erro no Editor de Diagramas
            </h3>
            <p className="text-sm text-muted-foreground">
              Ocorreu um erro inesperado. Tente recarregar a página.
            </p>
            <button
              onClick={this.resetError}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Tentar Novamente
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export const DiagramEditorWithErrorBoundary: React.FC<DiagramEditorWrapperProps> = memo(({
  fallback,
  ...props
}) => {
  return (
    <DiagramErrorBoundary fallback={fallback}>
      <DiagramEditor {...props} />
    </DiagramErrorBoundary>
  );
});

export default memo(DiagramEditor);