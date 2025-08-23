// ============================================================================
// End Node - Nó de fim para diagramas BPMN
// ============================================================================

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Square } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface EndNodeData {
  label?: string;
  description?: string;
}

export const EndNode: React.FC<NodeProps<EndNodeData>> = memo(({ 
  data, 
  selected,
  id 
}) => {
  return (
    <div className={cn(
      "relative bg-red-100 border-4 border-red-500 rounded-full",
      "w-12 h-12 flex items-center justify-center",
      "hover:bg-red-200 transition-colors",
      selected && "ring-2 ring-blue-500 ring-offset-2"
    )}>
      <Square size={16} className="text-red-700 fill-red-700" />
      
      {/* Handle de entrada */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-red-500 border-2 border-white"
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

EndNode.displayName = 'EndNode';

export default EndNode;