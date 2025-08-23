// ============================================================================
// Componente Minimap para Diagramas
// ============================================================================

import React, { memo } from 'react';
import { MiniMap, Node, Edge } from 'reactflow';
import { cn } from '@/lib/utils';
import { useDiagramStore } from './stores/useDiagramStore';
import type { DiagramNode } from './types';

interface DiagramMinimapProps {
  className?: string;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  width?: number;
  height?: number;
  pannable?: boolean;
  zoomable?: boolean;
  ariaLabel?: string;
}

// Cores dos nós no minimap baseadas no tipo
const getNodeColor = (node: Node): string => {
  const diagramNode = node as DiagramNode;
  
  switch (diagramNode.type) {
    // Flowchart nodes
    case 'start':
    case 'startNode':
      return '#10b981'; // green-500
    case 'end':
    case 'endNode':
      return '#ef4444'; // red-500
    case 'process':
    case 'processNode':
      return '#3b82f6'; // blue-500
    case 'decision':
    case 'decisionNode':
      return '#f59e0b'; // amber-500
    case 'input':
    case 'inputNode':
      return '#8b5cf6'; // violet-500
    case 'output':
    case 'outputNode':
      return '#06b6d4'; // cyan-500
    case 'connector':
    case 'connectorNode':
      return '#6b7280'; // gray-500
    
    // MindMap nodes
    case 'mindMapRoot':
      return '#dc2626'; // red-600
    case 'mindMapBranch':
      return '#2563eb'; // blue-600
    case 'mindMapLeaf':
      return '#16a34a'; // green-600
    case 'mindMapIdea':
      return '#ca8a04'; // yellow-600
    
    // Organogram nodes
    case 'ceo':
    case 'ceoNode':
      return '#7c3aed'; // violet-600
    case 'director':
    case 'directorNode':
      return '#2563eb'; // blue-600
    case 'manager':
    case 'managerNode':
      return '#059669'; // emerald-600
    case 'teamLead':
    case 'teamLeadNode':
      return '#d97706'; // amber-600
    case 'employee':
    case 'employeeNode':
      return '#4b5563'; // gray-600
    case 'department':
    case 'departmentNode':
      return '#7c2d12'; // orange-800
    
    // Default
    default:
      return '#6b7280'; // gray-500
  }
};

// Cor das bordas dos nós selecionados
const getNodeBorderColor = (node: Node): string => {
  return node.selected ? '#1d4ed8' : 'transparent'; // blue-700
};

export const DiagramMinimap = memo<DiagramMinimapProps>({
  displayName: 'DiagramMinimap',
  
  component: ({
    className,
    position = 'bottom-right',
    width = 200,
    height = 150,
    pannable = true,
    zoomable = true,
    ariaLabel = 'Minimap do diagrama'
  }) => {
    const isMinimapVisible = useDiagramStore((state) => state.ui.showMinimap);
    
    if (!isMinimapVisible) {
      return null;
    }

    const positionClasses = {
      'top-left': 'top-4 left-4',
      'top-right': 'top-4 right-4',
      'bottom-left': 'bottom-4 left-4',
      'bottom-right': 'bottom-4 right-4'
    };

    return (
      <div
        className={cn(
          'absolute z-10 border border-gray-200 rounded-lg shadow-lg bg-white overflow-hidden',
          'dark:border-gray-700 dark:bg-gray-800',
          positionClasses[position],
          className
        )}
        style={{ width, height }}
        role="img"
        aria-label={ariaLabel}
      >
        <MiniMap
          nodeColor={getNodeColor}
          nodeStrokeColor={getNodeBorderColor}
          nodeStrokeWidth={2}
          nodeBorderRadius={4}
          maskColor="rgba(0, 0, 0, 0.1)"
          maskStrokeColor="#1d4ed8"
          maskStrokeWidth={2}
          pannable={pannable}
          zoomable={zoomable}
          style={{
            backgroundColor: 'transparent',
            width: '100%',
            height: '100%'
          }}
        />
        
        {/* Header opcional com título */}
        <div className="absolute top-0 left-0 right-0 bg-gray-50 dark:bg-gray-700 px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-600">
          Minimap
        </div>
      </div>
    );
  }
});

// Hook para controlar o minimap
export const useDiagramMinimap = () => {
  const { showMinimap, toggleMinimap } = useDiagramStore((state) => ({
    showMinimap: state.ui.showMinimap,
    toggleMinimap: state.toggleMinimap
  }));

  return {
    isVisible: showMinimap,
    toggle: toggleMinimap,
    show: () => useDiagramStore.getState().setMinimapVisible(true),
    hide: () => useDiagramStore.getState().setMinimapVisible(false)
  };
};

export default DiagramMinimap;