// ============================================================================
// SubprocessNode - Nó de subprocesso BPMN
// ============================================================================

import React from 'react';
import { Handle, Position } from 'reactflow';
import { Layers } from 'lucide-react';
import { BaseNodeProps } from './types';
import { cn } from '@/lib/utils';

export const SubprocessNode: React.FC<BaseNodeProps> = ({
  data,
  isSelected = false,
  isConnectable = true,
}) => {
  const nodeStyle = {
    backgroundColor: data.backgroundColor || '#3b82f6',
    borderColor: data.borderColor || '#2563eb',
    color: data.textColor || '#ffffff',
    width: data.width || 140,
    height: data.height || 80,
    borderRadius: data.borderRadius || 8,
    borderWidth: data.borderWidth || 2,
    fontSize: data.fontSize || 13,
    fontWeight: data.fontWeight || '500',
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
      />
      
      {/* Handle de saída */}
      <Handle
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
        className="w-3 h-3 bg-white border-2 border-gray-400"
      />
      
      {/* Conteúdo do nó */}
      <div className="flex items-center space-x-2 px-3">
        {data.icon ? (
          <span className="text-lg">{data.icon}</span>
        ) : (
          <Layers className="w-4 h-4" />
        )}
        <span className="font-medium text-sm truncate">
          {data.label || 'Subprocesso'}
        </span>
      </div>
      
      {/* Indicador de subprocesso (pequeno quadrado no centro inferior) */}
      <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-3 h-3 border border-white bg-transparent rounded-sm flex items-center justify-center">
        <div className="w-1 h-1 bg-white rounded-full"></div>
      </div>
      
      {/* Tooltip com descrição */}
      {data.description && (
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
          {data.description}
        </div>
      )}
    </div>
  );
};

export default SubprocessNode;