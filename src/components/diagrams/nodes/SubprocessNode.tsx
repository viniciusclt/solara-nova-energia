// ============================================================================
// Subprocess Node - Nó de subprocesso para diagramas BPMN
// ============================================================================

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Layers } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface SubprocessNodeData {
  label?: string;
  description?: string;
  collapsed?: boolean;
}

export const SubprocessNode: React.FC<NodeProps<SubprocessNodeData>> = memo(({ 
  data, 
  selected,
  id 
}) => {
  return (
    <div className={cn(
      "relative bg-blue-50 border-2 border-blue-400 rounded-lg",
      "min-w-[120px] min-h-[80px] p-3",
      "hover:bg-blue-100 transition-colors",
      selected && "ring-2 ring-blue-500 ring-offset-2"
    )}>
      {/* Handle de entrada */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-blue-400 border-2 border-white"
      />
      
      {/* Conteúdo do nó */}
      <div className="flex items-center gap-2">
        <Layers size={16} className="text-blue-600" />
        <span className="text-sm font-medium text-blue-800">
          {data?.label || 'Subprocesso'}
        </span>
      </div>
      
      {/* Descrição opcional */}
      {data?.description && (
        <div className="mt-2 text-xs text-blue-600">
          {data.description}
        </div>
      )}
      
      {/* Indicador de colapso */}
      {data?.collapsed && (
        <div className="absolute bottom-1 right-1">
          <div className="w-2 h-2 bg-blue-400 rounded-full" />
        </div>
      )}
      
      {/* Handle de saída */}
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-blue-400 border-2 border-white"
      />
    </div>
  );
});

SubprocessNode.displayName = 'SubprocessNode';

export default SubprocessNode;