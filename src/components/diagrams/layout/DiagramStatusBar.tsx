import React, { memo } from 'react';
import { useDiagramStore } from '../stores/useDiagramStore';

export interface DiagramStatusBarProps {
  readOnly?: boolean;
}

/**
 * Barra de status do editor de diagramas
 * Mostra informações como número de nós, conexões, zoom e estado do documento
 */
export const DiagramStatusBar: React.FC<DiagramStatusBarProps> = memo(({
  readOnly = false
}) => {
  const { document, ui } = useDiagramStore();

  return (
    <div className="border-t px-4 py-2 bg-muted/50">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center space-x-4">
          <span>
            Nós: {document?.nodes.length || 0}
          </span>
          <span>
            Conexões: {document?.edges.length || 0}
          </span>
          <span>
            Zoom: {Math.round((ui.zoom || 1) * 100)}%
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          {ui.hasUnsavedChanges && (
            <span className="text-amber-600">• Não salvo</span>
          )}
          
          {readOnly && (
            <span className="text-blue-600">• Somente leitura</span>
          )}
          
          <span>
            {document?.config.type || 'flowchart'}
          </span>
        </div>
      </div>
    </div>
  );
});

DiagramStatusBar.displayName = 'DiagramStatusBar';