// ============================================================================
// EndNode - Nó de fim do fluxograma
// ============================================================================

import React from 'react';
import { Handle, Position } from 'reactflow';
import { Square, StopCircle } from 'lucide-react';
import { BaseNodeProps } from './types';
import { EnhancedNodeWrapper } from './EnhancedNodeWrapper';
import { EditableLabel } from './EditableLabel';
import { cn } from '@/lib/utils';

interface EndNodeProps extends BaseNodeProps {
  id: string;
  position: { x: number; y: number };
  onAddNode?: (type: string, position: { x: number; y: number }) => void;
  onAddEdge?: (edge: any) => void;
}

export const EndNode: React.FC<EndNodeProps> = ({
  id,
  position,
  data,
  isSelected = false,
  isConnectable = true,
  onAddNode,
  onAddEdge
}) => {
  const [isHovered, setIsHovered] = React.useState(false);
  const nodeContent = (
    <div
      className={cn(
        'relative flex items-center justify-center transition-all duration-300 group',
        'bg-gradient-to-br from-red-500 via-red-600 to-red-700',
        'border-3 border-red-700 shadow-lg hover:shadow-xl',
        'rounded-full overflow-hidden',
        isSelected && 'ring-4 ring-blue-500 ring-opacity-50 scale-105'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        width: data.width || 120,
        height: data.height || 60,
        filter: isSelected ? 'drop-shadow(0 8px 16px rgba(239, 68, 68, 0.4))' : 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1))'
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        className="w-4 h-4 bg-white border-3 border-red-700 shadow-md hover:scale-110 transition-transform"
      />
      
      <div className="flex items-center space-x-2 px-4 py-2">
        {data.icon ? (
          <span className="text-xl">{data.icon}</span>
        ) : (
          <StopCircle className="w-5 h-5 text-white drop-shadow-sm" />
        )}
        <EditableLabel
          value={data.label || 'Fim'}
          onSave={(newLabel) => data.onUpdateNode?.(id, { data: { ...data, label: newLabel } })}
          className="font-bold text-sm text-white drop-shadow-sm truncate text-center"
        />
        {data.status && (
          <div className="w-2 h-2 rounded-full bg-white opacity-80 animate-pulse" />
        )}
      </div>
      
      {/* Efeito de brilho quando selecionado */}
      {isSelected && (
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent animate-pulse rounded-full" />
      )}
      
      {/* Animação de finalização */}
      <div className="absolute inset-0 rounded-full border-2 border-white/30 animate-ping" />
    </div>
  );

  return (
    <EnhancedNodeWrapper
      nodeId={id}
      position={position}
      onAddNode={onAddNode}
      onAddEdge={onAddEdge}
      isSelected={isSelected}
      isHovered={isHovered}
    >
      {nodeContent}
    </EnhancedNodeWrapper>
  );
};

export default EndNode;