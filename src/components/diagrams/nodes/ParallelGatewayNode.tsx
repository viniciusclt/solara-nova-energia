// ============================================================================
// Parallel Gateway Node - Gateway paralelo para diagramas BPMN
// ============================================================================

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Plus } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface ParallelGatewayNodeData {
  label?: string;
  description?: string;
  gatewayType?: 'fork' | 'join';
}

export const ParallelGatewayNode: React.FC<NodeProps<ParallelGatewayNodeData>> = memo(({ 
  data, 
  selected,
  id 
}) => {
  return (
    <div className={cn(
      "relative bg-yellow-100 border-2 border-yellow-500",
      "w-12 h-12 flex items-center justify-center",
      "transform rotate-45", // Forma de losango
      "hover:bg-yellow-200 transition-colors",
      selected && "ring-2 ring-blue-500 ring-offset-2"
    )}>
      {/* Símbolo + rotacionado de volta */}
      <div className="transform -rotate-45">
        <Plus size={20} className="text-yellow-700 stroke-2" />
      </div>
      
      {/* Handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-yellow-500 border-2 border-white"
        style={{ left: -6, top: '50%', transform: 'translateY(-50%)' }}
      />
      
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-yellow-500 border-2 border-white"
        style={{ right: -6, top: '50%', transform: 'translateY(-50%)' }}
      />
      
      <Handle
        type="source"
        position={Position.Top}
        className="w-3 h-3 bg-yellow-500 border-2 border-white"
        style={{ top: -6, left: '50%', transform: 'translateX(-50%)' }}
      />
      
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-yellow-500 border-2 border-white"
        style={{ bottom: -6, left: '50%', transform: 'translateX(-50%)' }}
      />
      
      {/* Label opcional */}
      {data?.label && (
        <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2">
          <span className="text-xs text-gray-600 whitespace-nowrap">
            {data.label}
          </span>
        </div>
      )}
    </div>
  );
});

ParallelGatewayNode.displayName = 'ParallelGatewayNode';

export default ParallelGatewayNode;