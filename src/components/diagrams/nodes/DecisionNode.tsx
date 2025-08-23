// ============================================================================
// Decision Node - Nó de decisão/gateway para diagramas BPMN
// ============================================================================

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { GitBranch } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface DecisionNodeData {
  label?: string;
  description?: string;
  type?: 'exclusive' | 'inclusive' | 'parallel';
}

export const DecisionNode: React.FC<NodeProps<DecisionNodeData>> = memo(({ 
  data, 
  selected,
  id 
}) => {
  const getGatewayStyle = () => {
    switch (data?.type) {
      case 'parallel':
        return 'bg-orange-100 border-orange-500';
      case 'inclusive':
        return 'bg-purple-100 border-purple-500';
      default: // exclusive
        return 'bg-yellow-100 border-yellow-500';
    }
  };

  const getIconColor = () => {
    switch (data?.type) {
      case 'parallel':
        return 'text-orange-700';
      case 'inclusive':
        return 'text-purple-700';
      default:
        return 'text-yellow-700';
    }
  };

  return (
    <div className={cn(
      "relative border-2 transform rotate-45",
      "w-12 h-12 flex items-center justify-center",
      "hover:opacity-80 transition-opacity",
      getGatewayStyle(),
      selected && "ring-2 ring-blue-500 ring-offset-2"
    )}>
      {/* Ícone centralizado */}
      <div className="transform -rotate-45">
        <GitBranch size={16} className={getIconColor()} />
      </div>
      
      {/* Handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-gray-500 border-2 border-white transform -rotate-45"
        style={{ left: '-6px', top: '50%', transform: 'translateY(-50%) rotate(-45deg)' }}
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-gray-500 border-2 border-white transform -rotate-45"
        style={{ right: '-6px', top: '50%', transform: 'translateY(-50%) rotate(-45deg)' }}
      />
      <Handle
        type="source"
        position={Position.Top}
        className="w-3 h-3 bg-gray-500 border-2 border-white transform -rotate-45"
        style={{ top: '-6px', left: '50%', transform: 'translateX(-50%) rotate(-45deg)' }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-gray-500 border-2 border-white transform -rotate-45"
        style={{ bottom: '-6px', left: '50%', transform: 'translateX(-50%) rotate(-45deg)' }}
      />
      
      {/* Label opcional */}
      {data?.label && (
        <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 -rotate-45">
          <span className="text-xs text-gray-600 whitespace-nowrap">
            {data.label}
          </span>
        </div>
      )}
    </div>
  );
});

DecisionNode.displayName = 'DecisionNode';

export default DecisionNode;