// ============================================================================
// ParallelNode - Nó de gateway paralelo BPMN
// ============================================================================

import React from 'react';
import { Handle, Position } from 'reactflow';
import { Plus } from 'lucide-react';
import { BaseNodeProps } from './types';
import { cn } from '@/lib/utils';

export const ParallelNode: React.FC<BaseNodeProps> = ({
  data,
  isSelected = false,
  isConnectable = true,
}) => {
  const nodeStyle = {
    backgroundColor: data.backgroundColor || '#8b5cf6',
    borderColor: data.borderColor || '#7c3aed',
    color: data.textColor || '#ffffff',
    width: data.width || 80,
    height: data.height || 80,
    borderRadius: data.borderRadius || 0,
    borderWidth: data.borderWidth || 2,
    fontSize: data.fontSize || 12,
    fontWeight: data.fontWeight || '600',
    transform: 'rotate(45deg)',
  };

  const contentStyle = {
    transform: 'rotate(-45deg)',
  };

  return (
    <div
      className={cn(
        'flex items-center justify-center border-2 transition-all duration-200 shadow-md hover:shadow-lg relative group',
        isSelected && 'ring-2 ring-blue-500 ring-offset-2'
      )}
      style={nodeStyle}
    >
      {/* Handle de entrada */}
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        className="w-3 h-3 bg-white border-2 border-gray-400"
        style={{ transform: 'rotate(-45deg)' }}
      />
      
      {/* Handle de saída */}
      <Handle
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
        className="w-3 h-3 bg-white border-2 border-gray-400"
        style={{ transform: 'rotate(-45deg)' }}
      />
      
      {/* Handle superior */}
      <Handle
        type="source"
        position={Position.Top}
        isConnectable={isConnectable}
        className="w-3 h-3 bg-white border-2 border-gray-400"
        style={{ transform: 'rotate(-45deg)' }}
      />
      
      {/* Handle inferior */}
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
        className="w-3 h-3 bg-white border-2 border-gray-400"
        style={{ transform: 'rotate(-45deg)' }}
      />
      
      {/* Conteúdo do nó */}
      <div className="flex flex-col items-center justify-center text-center" style={contentStyle}>
        {data.icon ? (
          <span className="text-lg">{data.icon}</span>
        ) : (
          <Plus className="w-6 h-6" strokeWidth={3} />
        )}
        <span className="font-bold text-xs mt-1 truncate max-w-full">
          {data.label || 'Paralelo'}
        </span>
      </div>
      
      {/* Tooltip com descrição */}
      {data.description && (
        <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10" style={{ transform: 'rotate(-45deg)' }}>
          {data.description}
        </div>
      )}
    </div>
  );
};

export default ParallelNode;