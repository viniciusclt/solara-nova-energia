// ============================================================================
// StartNode - Nó de início do fluxograma
// ============================================================================

import React from 'react';
import { NodeProps } from 'reactflow';
import { FlowchartNode } from '@/types/flowchart';
import { EnhancedNodeWrapper } from './EnhancedNodeWrapper';
import { EditableLabel } from './EditableLabel';
import { Play } from 'lucide-react';

export const StartNode: React.FC<NodeProps<FlowchartNode['data']>> = ({ id, data, selected, xPos, yPos }) => {
  const [isHovered, setIsHovered] = React.useState(false);
  const nodeStyle = {
    background: data.style?.backgroundColor || 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
    color: data.style?.color || '#FFFFFF',
    border: `3px solid ${selected ? '#047857' : data.style?.borderColor || '#065F46'}`,
    borderRadius: '50%',
    width: '90px',
    height: '90px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: '700',
    boxShadow: selected 
      ? '0 12px 30px rgba(16, 185, 129, 0.4), 0 6px 15px rgba(16, 185, 129, 0.25)' 
      : '0 8px 20px rgba(16, 185, 129, 0.25), 0 4px 10px rgba(16, 185, 129, 0.15)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    transform: selected ? 'translateY(-3px) scale(1.05)' : 'translateY(0) scale(1)',
    position: 'relative' as const,
  };

  return (
    <EnhancedNodeWrapper
      nodeId={id}
      isSelected={selected}
      isHovered={isHovered}
      position={{ x: xPos, y: yPos }}
      onAddNode={data?.onAddNode}
      onAddEdge={data?.onAddEdge}
    >
      <div 
        style={nodeStyle} 
        className="start-node"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Efeito de brilho interno */}
        <div className="absolute inset-2 rounded-full bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
        
        <div className="flex flex-col items-center relative z-10">
          <div className="p-2 bg-white/20 rounded-full mb-1">
            <Play size={22} className="text-white fill-white" />
          </div>
          <EditableLabel
            value={data.label || 'INÍCIO'}
            onSave={(newLabel) => data.onUpdateNode?.(id, { data: { ...data, label: newLabel } })}
            className="text-xs font-bold tracking-wide text-center"
          />
        </div>
        
        {/* Animação de pulso quando selecionado */}
        {selected && (
          <div className="absolute inset-0 rounded-full border-2 border-white/50 animate-ping" />
        )}
      </div>
    </EnhancedNodeWrapper>
  );
};

export default StartNode;