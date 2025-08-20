// ============================================================================
// AnnotationNode - Nó de anotação BPMN
// ============================================================================

import React from 'react';
import { Handle, Position } from 'reactflow';
import { MessageSquare } from 'lucide-react';
import { BaseNodeProps } from './types';
import { cn } from '@/lib/utils';

export const AnnotationNode: React.FC<BaseNodeProps> = ({
  data,
  isSelected = false,
  isConnectable = true,
}) => {
  const nodeStyle = {
    backgroundColor: data.backgroundColor || '#f3f4f6',
    borderColor: data.borderColor || '#9ca3af',
    color: data.textColor || '#374151',
    width: data.width || 120,
    height: data.height || 80,
    borderRadius: data.borderRadius || 4,
    borderWidth: data.borderWidth || 1,
    fontSize: data.fontSize || 12,
    fontWeight: data.fontWeight || '400',
    borderStyle: 'dashed',
  };

  return (
    <div
      className={cn(
        'flex items-center justify-center transition-all duration-200 shadow-sm hover:shadow-md relative group',
        isSelected && 'ring-2 ring-blue-500 ring-offset-2'
      )}
      style={{
        ...nodeStyle,
        border: `${nodeStyle.borderWidth}px dashed ${nodeStyle.borderColor}`,
      }}
    >
      {/* Handle de entrada (opcional para anotações) */}
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        className="w-2 h-2 bg-gray-400 border border-gray-500 opacity-50"
      />
      
      {/* Conteúdo do nó */}
      <div className="flex items-start space-x-2 px-3 py-2 w-full h-full">
        {data.icon ? (
          <span className="text-sm mt-1 flex-shrink-0">{data.icon}</span>
        ) : (
          <MessageSquare className="w-3 h-3 mt-1 flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <div className="font-medium text-xs truncate mb-1">
            {data.label || 'Anotação'}
          </div>
          {data.description && (
            <div className="text-xs text-gray-600 leading-tight break-words">
              {data.description}
            </div>
          )}
        </div>
      </div>
      
      {/* Tooltip com descrição completa */}
      {data.description && data.description.length > 50 && (
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10 max-w-xs">
          {data.description}
        </div>
      )}
    </div>
  );
};

export default AnnotationNode;