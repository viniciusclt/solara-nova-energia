// ============================================================================
// Process Node - Nó de processo/tarefa para diagramas BPMN
// ============================================================================

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Settings } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface ProcessNodeData {
  label?: string;
  description?: string;
  type?: 'task' | 'subprocess' | 'service';
}

export const ProcessNode: React.FC<NodeProps<ProcessNodeData>> = memo(({ 
  data, 
  selected,
  id 
}) => {
  const getIcon = () => {
    switch (data?.type) {
      case 'service':
        return <Settings size={16} className="text-blue-700" />;
      default:
        return null;
    }
  };

  return (
    <div className={cn(
      "relative bg-blue-50 border-2 border-blue-400 rounded-lg",
      "min-w-24 min-h-16 px-3 py-2 flex flex-col items-center justify-center",
      "hover:bg-blue-100 transition-colors",
      selected && "ring-2 ring-blue-500 ring-offset-2"
    )}>
      {/* Ícone do tipo de processo */}
      {getIcon() && (
        <div className="absolute top-1 right-1">
          {getIcon()}
        </div>
      )}
      
      {/* Conteúdo principal */}
      <div className="text-center">
        {data?.label && (
          <div className="text-sm font-medium text-gray-800 mb-1">
            {data.label}
          </div>
        )}
        {data?.description && (
          <div className="text-xs text-gray-600">
            {data.description}
          </div>
        )}
      </div>
      
      {/* Handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-blue-500 border-2 border-white"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-blue-500 border-2 border-white"
      />
    </div>
  );
});

ProcessNode.displayName = 'ProcessNode';

export default ProcessNode;