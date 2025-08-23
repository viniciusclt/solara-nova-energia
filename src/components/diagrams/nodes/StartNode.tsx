// ============================================================================
// Start Node - Nó de início para diagramas BPMN
// ============================================================================

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Play } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface StartNodeData {
  label?: string;
  description?: string;
}

export const StartNode: React.FC<NodeProps<StartNodeData>> = memo(({ 
  data, 
  selected,
  id 
}) => {
  return (
    <div className={cn(
      "relative bg-green-100 border-2 border-green-500 rounded-full",
      "w-12 h-12 flex items-center justify-center",
      "hover:bg-green-200 transition-colors",
      selected && "ring-2 ring-blue-500 ring-offset-2"
    )}>
      <Play size={20} className="text-green-700 fill-green-700" />
      
      {/* Handle de saída */}
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-green-500 border-2 border-white"
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

StartNode.displayName = 'StartNode';

export default StartNode;