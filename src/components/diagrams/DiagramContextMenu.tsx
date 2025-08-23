// ============================================================================
// Componente Context Menu para Diagramas
// ============================================================================

import React, { memo, useCallback, useEffect, useState } from 'react';
import { useReactFlow } from 'reactflow';
import {
  Copy,
  Cut,
  Paste,
  Trash2,
  Edit3,
  Move,
  RotateCw,
  Layers,
  Link,
  Unlink,
  ZoomIn,
  ZoomOut,
  Download,
  Upload,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { secureLogger } from '@/utils/secureLogger';
import { useDiagramStore } from './stores/useDiagramStore';
import { useDiagramExport } from './hooks/useDiagramExport';
import { useDiagramImport } from './hooks/useDiagramImport';
import type { DiagramNode, DiagramEdge } from './types';

interface ContextMenuPosition {
  x: number;
  y: number;
}

interface ContextMenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  action: () => void;
  disabled?: boolean;
  separator?: boolean;
  shortcut?: string;
}

interface DiagramContextMenuProps {
  className?: string;
}

export const DiagramContextMenu = memo<DiagramContextMenuProps>({
  displayName: 'DiagramContextMenu',
  
  component: ({ className }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [position, setPosition] = useState<ContextMenuPosition>({ x: 0, y: 0 });
    const [contextTarget, setContextTarget] = useState<{
      type: 'canvas' | 'node' | 'edge';
      data?: DiagramNode | DiagramEdge;
    } | null>(null);

    const { getNodes, getEdges, screenToFlowPosition } = useReactFlow();
    const { exportDiagram } = useDiagramExport();
    const { importDiagram } = useDiagramImport();
    
    const {
      selectedNodes,
      selectedEdges,
      clipboard,
      addNode,
      deleteNode,
      deleteEdge,
      duplicateNode,
      copyToClipboard,
      pasteFromClipboard,
      undo,
      redo,
      zoomIn,
      zoomOut,
      fitView
    } = useDiagramStore();

    // Fechar menu ao clicar fora
    useEffect(() => {
      const handleClickOutside = () => {
        setIsVisible(false);
      };

      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setIsVisible(false);
        }
      };

      if (isVisible) {
        document.addEventListener('click', handleClickOutside);
        document.addEventListener('keydown', handleEscape);
      }

      return () => {
        document.removeEventListener('click', handleClickOutside);
        document.removeEventListener('keydown', handleEscape);
      };
    }, [isVisible]);

    // Handler para context menu
    const handleContextMenu = useCallback((event: React.MouseEvent) => {
      event.preventDefault();
      
      const target = event.target as HTMLElement;
      const nodeElement = target.closest('[data-id]');
      const edgeElement = target.closest('.react-flow__edge');
      
      let contextType: 'canvas' | 'node' | 'edge' = 'canvas';
      let contextData: DiagramNode | DiagramEdge | undefined;

      if (nodeElement) {
        const nodeId = nodeElement.getAttribute('data-id');
        const node = getNodes().find(n => n.id === nodeId);
        if (node) {
          contextType = 'node';
          contextData = node as DiagramNode;
        }
      } else if (edgeElement) {
        const edgeId = edgeElement.getAttribute('data-id');
        const edge = getEdges().find(e => e.id === edgeId);
        if (edge) {
          contextType = 'edge';
          contextData = edge as DiagramEdge;
        }
      }

      setContextTarget({ type: contextType, data: contextData });
      setPosition({ x: event.clientX, y: event.clientY });
      setIsVisible(true);

      secureLogger.info('Context menu aberto', { type: contextType, hasData: !!contextData });
    }, [getNodes, getEdges]);

    // Ações do menu
    const actions = {
      copy: () => {
        if (selectedNodes.length > 0 || selectedEdges.length > 0) {
          copyToClipboard();
          secureLogger.info('Elementos copiados para clipboard');
        }
      },
      
      paste: () => {
        if (clipboard.nodes.length > 0 || clipboard.edges.length > 0) {
          const flowPosition = screenToFlowPosition({ x: position.x, y: position.y });
          pasteFromClipboard(flowPosition);
          secureLogger.info('Elementos colados do clipboard');
        }
      },
      
      duplicate: () => {
        if (contextTarget?.type === 'node' && contextTarget.data) {
          duplicateNode(contextTarget.data.id);
          secureLogger.info('Nó duplicado', { nodeId: contextTarget.data.id });
        }
      },
      
      delete: async () => {
        if (contextTarget?.type === 'node' && contextTarget.data) {
          await deleteNode(contextTarget.data.id);
          secureLogger.info('Nó deletado', { nodeId: contextTarget.data.id });
        } else if (contextTarget?.type === 'edge' && contextTarget.data) {
          await deleteEdge(contextTarget.data.id);
          secureLogger.info('Aresta deletada', { edgeId: contextTarget.data.id });
        }
      },
      
      export: () => {
        exportDiagram('json');
        secureLogger.info('Export iniciado via context menu');
      },
      
      zoomIn: () => {
        zoomIn();
      },
      
      zoomOut: () => {
        zoomOut();
      },
      
      fitView: () => {
        fitView();
      }
    };

    // Gerar itens do menu baseado no contexto
    const getMenuItems = (): ContextMenuItem[] => {
      const items: ContextMenuItem[] = [];

      if (contextTarget?.type === 'node') {
        items.push(
          {
            id: 'edit',
            label: 'Editar',
            icon: <Edit3 size={16} />,
            action: () => console.log('Edit node'),
            shortcut: 'F2'
          },
          {
            id: 'duplicate',
            label: 'Duplicar',
            icon: <Copy size={16} />,
            action: actions.duplicate,
            shortcut: 'Ctrl+D'
          },
          {
            id: 'delete',
            label: 'Deletar',
            icon: <Trash2 size={16} />,
            action: actions.delete,
            shortcut: 'Delete'
          },
          {
            id: 'separator1',
            label: '',
            icon: null,
            action: () => {},
            separator: true
          }
        );
      }

      if (contextTarget?.type === 'edge') {
        items.push(
          {
            id: 'edit-edge',
            label: 'Editar Aresta',
            icon: <Edit3 size={16} />,
            action: () => console.log('Edit edge')
          },
          {
            id: 'delete-edge',
            label: 'Deletar Aresta',
            icon: <Trash2 size={16} />,
            action: actions.delete,
            shortcut: 'Delete'
          },
          {
            id: 'separator2',
            label: '',
            icon: null,
            action: () => {},
            separator: true
          }
        );
      }

      // Ações gerais
      items.push(
        {
          id: 'copy',
          label: 'Copiar',
          icon: <Copy size={16} />,
          action: actions.copy,
          disabled: selectedNodes.length === 0 && selectedEdges.length === 0,
          shortcut: 'Ctrl+C'
        },
        {
          id: 'paste',
          label: 'Colar',
          icon: <Paste size={16} />,
          action: actions.paste,
          disabled: clipboard.nodes.length === 0 && clipboard.edges.length === 0,
          shortcut: 'Ctrl+V'
        },
        {
          id: 'separator3',
          label: '',
          icon: null,
          action: () => {},
          separator: true
        },
        {
          id: 'zoom-in',
          label: 'Zoom In',
          icon: <ZoomIn size={16} />,
          action: actions.zoomIn,
          shortcut: 'Ctrl++'
        },
        {
          id: 'zoom-out',
          label: 'Zoom Out',
          icon: <ZoomOut size={16} />,
          action: actions.zoomOut,
          shortcut: 'Ctrl+-'
        },
        {
          id: 'fit-view',
          label: 'Ajustar Visualização',
          icon: <Move size={16} />,
          action: actions.fitView,
          shortcut: 'Ctrl+0'
        },
        {
          id: 'separator4',
          label: '',
          icon: null,
          action: () => {},
          separator: true
        },
        {
          id: 'export',
          label: 'Exportar',
          icon: <Download size={16} />,
          action: actions.export,
          shortcut: 'Ctrl+E'
        }
      );

      return items;
    };

    const handleItemClick = (item: ContextMenuItem) => {
      if (!item.disabled) {
        item.action();
        setIsVisible(false);
      }
    };

    if (!isVisible) {
      return null;
    }

    const menuItems = getMenuItems();

    return (
      <>
        {/* Overlay para capturar cliques */}
        <div 
          className="fixed inset-0 z-40"
          onContextMenu={handleContextMenu}
        />
        
        {/* Menu */}
        <div
          className={cn(
            'fixed z-50 min-w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1',
            'dark:bg-gray-800 dark:border-gray-700',
            className
          )}
          style={{
            left: position.x,
            top: position.y,
            transform: 'translate(-50%, 0)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {menuItems.map((item) => {
            if (item.separator) {
              return (
                <div
                  key={item.id}
                  className="h-px bg-gray-200 dark:bg-gray-600 my-1"
                />
              );
            }

            return (
              <button
                key={item.id}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 text-sm text-left',
                  'hover:bg-gray-100 dark:hover:bg-gray-700',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  'transition-colors duration-150'
                )}
                onClick={() => handleItemClick(item)}
                disabled={item.disabled}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                <span className="flex-1">{item.label}</span>
                {item.shortcut && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {item.shortcut}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </>
    );
  }
});

// Hook para usar o context menu
export const useDiagramContextMenu = () => {
  const [isVisible, setIsVisible] = useState(false);
  
  const show = useCallback((position: ContextMenuPosition) => {
    setIsVisible(true);
  }, []);
  
  const hide = useCallback(() => {
    setIsVisible(false);
  }, []);
  
  return {
    isVisible,
    show,
    hide
  };
};

export default DiagramContextMenu;