// ============================================================================
// DecisionNode - Nó de decisão do fluxograma
// ============================================================================

import React from 'react';
import { Handle, Position } from 'reactflow';
import { Diamond, HelpCircle } from 'lucide-react';
import { BaseNodeProps } from './types';
import { EnhancedNodeWrapper } from './EnhancedNodeWrapper';
import { EditableLabel } from './EditableLabel';
import { cn } from '@/lib/utils';

interface DecisionNodeProps extends BaseNodeProps {
  id: string;
  position: { x: number; y: number };
  onAddNode?: (type: string, position: { x: number; y: number }) => void;
  onAddEdge?: (edge: any) => void;
}

export const DecisionNode: React.FC<DecisionNodeProps> = ({
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
        'bg-gradient-to-br from-amber-400 via-orange-500 to-amber-600',
        'border-3 border-amber-600 shadow-lg hover:shadow-xl',
        'transform rotate-45',
        isSelected && 'ring-4 ring-blue-500 ring-opacity-50 scale-105'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        width: data.width || 120,
        height: data.height || 120,
        clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
        filter: isSelected ? 'drop-shadow(0 8px 16px rgba(245, 158, 11, 0.4))' : 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1))'
      }}
    >
      {/* Handle de entrada */}
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        className="w-4 h-4 bg-white border-3 border-amber-600 shadow-md hover:scale-110 transition-transform"
        style={{ transform: 'rotate(-45deg)', left: '-8px' }}
      />
      
      {/* Handle de saída - Sim */}
      <Handle
        type="source"
        position={Position.Top}
        id="yes"
        isConnectable={isConnectable}
        className="w-4 h-4 bg-green-500 border-3 border-green-600 shadow-md hover:scale-110 transition-transform"
        style={{ transform: 'rotate(-45deg)', top: '-8px' }}
      />
      
      {/* Handle de saída - Não */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="no"
        isConnectable={isConnectable}
        className="w-4 h-4 bg-red-500 border-3 border-red-600 shadow-md hover:scale-110 transition-transform"
        style={{ transform: 'rotate(-45deg)', bottom: '-8px' }}
      />
      
      {/* Conteúdo do nó */}
      <div 
        className="flex flex-col items-center space-y-1 px-3 py-2 text-center"
        style={{ transform: 'rotate(-45deg)' }}
      >
        {data.icon ? (
          <span className="text-lg">{data.icon}</span>
        ) : (
          <HelpCircle className="w-5 h-5 text-white drop-shadow-sm" />
        )}
        <EditableLabel
          value={data.label || 'Decisão'}
          onSave={(newLabel) => data.onUpdateNode?.(id, { data: { ...data, label: newLabel } })}
          className="font-bold text-xs leading-tight max-w-20 text-white drop-shadow-sm text-center"
        />
        {data.status && (
          <div className="w-2 h-2 rounded-full bg-white opacity-80 animate-pulse" />
        )}
      </div>
      
      {/* Labels para Sim/Não */}
      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-xs font-bold text-green-600 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-white px-2 py-1 rounded-full shadow-md">
        ✓ Sim
      </div>
      <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs font-bold text-red-600 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-white px-2 py-1 rounded-full shadow-md">
        ✗ Não
      </div>
      
      {/* Efeito de brilho quando selecionado */}
      {isSelected && (
        <div 
          className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent animate-pulse"
          style={{
            clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)'
          }}
        />
      )}
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

export default DecisionNode;