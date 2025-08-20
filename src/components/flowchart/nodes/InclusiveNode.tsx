// ============================================================================
// InclusiveNode - Nó de gateway inclusivo BPMN
// ============================================================================

import React from 'react';
import { Handle, Position } from 'reactflow';
import { Circle, GitMerge, Merge } from 'lucide-react';
import { BaseNodeProps } from './types';
import { EnhancedNodeWrapper } from './EnhancedNodeWrapper';
import { EditableLabel } from './EditableLabel';
import { cn } from '@/lib/utils';

interface InclusiveNodeProps extends BaseNodeProps {
  id: string;
  position: { x: number; y: number };
  onAddNode?: (type: string, position: { x: number; y: number }) => void;
  onAddEdge?: (edge: any) => void;
}

export const InclusiveNode: React.FC<InclusiveNodeProps> = ({
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
        'bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600',
        'border-4 border-teal-700 shadow-xl hover:shadow-2xl',
        'overflow-hidden',
        isSelected && 'ring-4 ring-blue-500 ring-opacity-60 scale-110'
      )}
      style={{
        width: data.width || 90,
        height: data.height || 90,
        transform: 'rotate(45deg)',
        clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
        filter: isSelected ? 'drop-shadow(0 12px 24px rgba(6, 182, 212, 0.5))' : 'drop-shadow(0 6px 12px rgba(0, 0, 0, 0.15))'
      }}
    >
      {/* Handles com posicionamento melhorado */}
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        className="w-5 h-5 bg-white border-3 border-teal-700 shadow-lg hover:scale-125 transition-all duration-200"
        style={{ transform: 'rotate(-45deg)', left: '-10px' }}
      />
      
      <Handle
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
        className="w-5 h-5 bg-white border-3 border-teal-700 shadow-lg hover:scale-125 transition-all duration-200"
        style={{ transform: 'rotate(-45deg)', right: '-10px' }}
      />
      
      <Handle
        type="source"
        position={Position.Top}
        isConnectable={isConnectable}
        className="w-5 h-5 bg-white border-3 border-teal-700 shadow-lg hover:scale-125 transition-all duration-200"
        style={{ transform: 'rotate(-45deg)', top: '-10px' }}
      />
      
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
        className="w-5 h-5 bg-white border-3 border-teal-700 shadow-lg hover:scale-125 transition-all duration-200"
        style={{ transform: 'rotate(-45deg)', bottom: '-10px' }}
      />
      
      {/* Conteúdo do nó com design melhorado */}
      <div 
        className="flex flex-col items-center justify-center text-center p-2"
        style={{ transform: 'rotate(-45deg)' }}
      >
        {data.icon ? (
          <span className="text-2xl mb-1">{data.icon}</span>
        ) : (
          <Merge className="w-7 h-7 text-white drop-shadow-lg mb-1" strokeWidth={2.5} />
        )}
        <EditableLabel
          value={data.label || 'Gateway'}
          onSave={(newLabel) => data.onUpdateNode?.(id, { data: { ...data, label: newLabel } })}
          className="font-bold text-xs text-white drop-shadow-lg text-center max-w-16 leading-tight"
        />
        {data.status && (
          <div className="w-2 h-2 rounded-full bg-white opacity-90 animate-pulse mt-1" />
        )}
      </div>
      
      {/* Efeito de brilho quando selecionado */}
      {isSelected && (
        <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent animate-pulse" 
             style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }} />
      )}
      
      {/* Símbolo interno BPMN - círculo inclusivo */}
      <div className="absolute inset-4 rounded-full border-3 border-white/50" 
           style={{ transform: 'rotate(-45deg)' }} />
      
      {/* Efeito de pulsação suave */}
      <div className="absolute inset-0 border-2 border-white/30 animate-pulse" 
           style={{ 
             clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
             animationDuration: '3s' 
           }} />
    </div>
  );

  return (
    <EnhancedNodeWrapper
      id={id}
      position={position}
      onAddNode={onAddNode}
      onAddEdge={onAddEdge}
      nodeType="inclusive"
      isSelected={isSelected}
    >
      {nodeContent}
    </EnhancedNodeWrapper>
  );
};

export default InclusiveNode;