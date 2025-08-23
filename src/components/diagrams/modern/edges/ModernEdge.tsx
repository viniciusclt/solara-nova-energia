/**
 * Componente de Aresta Moderna para Diagramas
 * Suporte a diferentes estilos e animações
 */

import React from 'react';
import {
  EdgeProps,
  getBezierPath,
  EdgeLabelRenderer,
  BaseEdge,
  Edge,
  MarkerType
} from '@xyflow/react';
import { Button } from '@/components/ui/button';
import { X, Edit3 } from 'lucide-react';

interface ModernEdgeData {
  label?: string;
  color?: string;
  strokeWidth?: number;
  animated?: boolean;
  dashed?: boolean;
  showLabel?: boolean;
  editable?: boolean;
  onEdit?: (edgeId: string) => void;
  onDelete?: (edgeId: string) => void;
}

interface ModernEdgeProps extends EdgeProps {
  data?: ModernEdgeData;
}

const ModernEdge: React.FC<ModernEdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data = {},
  markerEnd,
  selected
}) => {
  const {
    label = '',
    color = '#6b7280',
    strokeWidth = 2,
    animated = false,
    dashed = false,
    showLabel = true,
    editable = true,
    onEdit,
    onDelete
  } = data;

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const edgeStyle = {
    ...style,
    stroke: color,
    strokeWidth: selected ? strokeWidth + 1 : strokeWidth,
    strokeDasharray: dashed ? '5,5' : 'none',
  };

  const handleEdit = (event: React.MouseEvent) => {
    event.stopPropagation();
    onEdit?.(id);
  };

  const handleDelete = (event: React.MouseEvent) => {
    event.stopPropagation();
    onDelete?.(id);
  };

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd || MarkerType.ArrowClosed}
        style={edgeStyle}
        className={animated ? 'animated' : ''}
      />
      
      {showLabel && (label || selected) && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              fontSize: 12,
              pointerEvents: 'all',
            }}
            className="nodrag nopan"
          >
            <div className="flex items-center space-x-1 bg-white border border-gray-200 rounded-md px-2 py-1 shadow-sm">
              {label && (
                <span className="text-gray-700 font-medium">
                  {label}
                </span>
              )}
              
              {selected && editable && (
                <div className="flex items-center space-x-1 ml-2">
                  {onEdit && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 hover:bg-blue-100"
                      onClick={handleEdit}
                    >
                      <Edit3 className="h-3 w-3 text-blue-600" />
                    </Button>
                  )}
                  
                  {onDelete && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 hover:bg-red-100"
                      onClick={handleDelete}
                    >
                      <X className="h-3 w-3 text-red-600" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};

export { ModernEdge };
export type { ModernEdgeData, ModernEdgeProps };