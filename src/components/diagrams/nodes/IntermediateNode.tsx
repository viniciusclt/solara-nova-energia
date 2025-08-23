// ============================================================================
// Intermediate Node - Nó de evento intermediário para diagramas BPMN
// ============================================================================

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Clock } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface IntermediateNodeData {
  label?: string;
  description?: string;
  eventType?: 'timer' | 'message' | 'signal' | 'conditional' | 'link';
}

export const IntermediateNode: React.FC<NodeProps<IntermediateNodeData>> = memo(({ 
  data, 
  selected,
  id 
}) => {
  const getEventIcon = () => {
    switch (data?.eventType) {
      case 'timer':
        return <Clock size={16} className="text-orange-700" />;
      case 'message':
        return <div className="w-4 h-4 bg-orange-700 rounded-sm" />;
      case 'signal':
        return <div className="w-0 h-0 border-l-2 border-r-2 border-b-4 border-transparent border-b-orange-700" />;
      default:
        return <Clock size={16} className="text-orange-700" />;
    }
  };

  return (
    <div className={cn(
      "relative bg-orange-100 border-4 border-orange-500 rounded-full",
      "w-14 h-14 flex items-center justify-center",
      "hover:bg-orange-200 transition-colors",
      selected && "ring-2 ring-blue-500 ring-offset-2"
    )}>
      {/* Círculo interno para evento intermediário */}
      <div className="w-8 h-8 border-2 border-orange-500 rounded-full flex items-center justify-center bg-white">
        {getEventIcon()}
      </div>
      
      {/* Handle de entrada */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-orange-500 border-2 border-white"
      />
      
      {/* Handle de saída */}
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-orange-500 border-2 border-white"
      />
      
      {/* Label opcional */}
      {data?.label && (
        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
          <span className="text-xs text-gray-600 whitespace-nowrap">
            {data.label}
          </span>
        </div>
      )}
    </div>
  );
});

IntermediateNode.displayName = 'IntermediateNode';

export default IntermediateNode;