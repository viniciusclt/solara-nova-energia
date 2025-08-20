// ============================================================================
// IntermediateNode - Nó de evento intermediário BPMN
// ============================================================================

import React from 'react';
import { Handle, Position } from 'reactflow';
import { Circle, Clock } from 'lucide-react';
import { BaseNodeProps } from './types';
import { EnhancedNodeWrapper } from './EnhancedNodeWrapper';
import { cn } from '@/lib/utils';

interface IntermediateNodeProps extends BaseNodeProps {
  id: string;
  position: { x: number; y: number };
  onAddNode?: (type: string, position: { x: number; y: number }) => void;
  onAddEdge?: (edge: any) => void;
}

export const IntermediateNode: React.FC<IntermediateNodeProps> = ({
  id,
  position,
  data,
  isSelected = false,
  isConnectable = true,
  onAddNode,
  onAddEdge
}) => {
  const nodeContent = (
    <div
      className={cn(
        'relative flex items-center justify-center transition-all duration-300 group',
        'bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600',
        'border-4 border-amber-700 shadow-lg hover:shadow-xl',
        'rounded-full overflow-hidden',
        isSelected && 'ring-4 ring-blue-500 ring-opacity-50 scale-110'
      )}
      style={{
        width: data.width || 80,
        height: data.height || 80,
        filter: isSelected ? 'drop-shadow(0 8px 16px rgba(245, 158, 11, 0.4))' : 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1))'
      }}
    >
      {/* Handle de entrada */}
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        className="w-4 h-4 bg-white border-3 border-amber-700 shadow-md hover:scale-110 transition-transform"
      />
      
      {/* Handle de saída */}
      <Handle
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
        className="w-4 h-4 bg-white border-3 border-amber-700 shadow-md hover:scale-110 transition-transform"
      />
      
      {/* Conteúdo do nó */}
      <div className="flex flex-col items-center justify-center text-center px-2">
        {data.icon ? (
          <span className="text-xl mb-1">{data.icon}</span>
        ) : (
          <Clock className="w-6 h-6 mb-1 text-white drop-shadow-sm" />
        )}
        <span className="font-bold text-xs text-white drop-shadow-sm truncate max-w-full">
          {data.label || 'Intermediário'}
        </span>
        {data.status && (
          <div className="w-1.5 h-1.5 rounded-full bg-white opacity-80 animate-pulse mt-1" />
        )}
      </div>
      
      {/* Efeito de brilho quando selecionado */}
      {isSelected && (
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent animate-pulse rounded-full" />
      )}
      
      {/* Anel interno para efeito BPMN */}
      <div className="absolute inset-2 rounded-full border-2 border-white/40" />
      
      {/* Animação de processamento */}
      <div className="absolute inset-0 rounded-full border-2 border-white/20 animate-spin" style={{ animationDuration: '3s' }} />
    </div>
  );

  return (
    <EnhancedNodeWrapper
      id={id}
      position={position}
      onAddNode={onAddNode}
      onAddEdge={onAddEdge}
      nodeType="intermediate"
      isSelected={isSelected}
    >
      {nodeContent}
    </EnhancedNodeWrapper>
  );
};

export default IntermediateNode;