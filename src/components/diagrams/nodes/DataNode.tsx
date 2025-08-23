// ============================================================================
// Data Node - Nó de dados para diagramas BPMN
// ============================================================================

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Database } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface DataNodeData {
  label?: string;
  description?: string;
  dataType?: string;
}

export const DataNode: React.FC<NodeProps<DataNodeData>> = memo(({ 
  data, 
  selected,
  id 
}) => {
  return (
    <div className={cn(
      "relative bg-purple-50 border-2 border-purple-400 rounded-lg",
      "min-w-[90px] min-h-[60px] p-2",
      "hover:bg-purple-100 transition-colors",
      "transform rotate-45", // Forma de losango
      selected && "ring-2 ring-blue-500 ring-offset-2"
    )}>
      {/* Conteúdo rotacionado de volta */}
      <div className="transform -rotate-45 flex flex-col items-center justify-center h-full">
        <Database size={14} className="text-purple-600" />
        <div className="text-xs font-medium text-purple-800 mt-1 text-center">
          {data?.label || 'Dados'}
        </div>
        {data?.dataType && (
          <div className="text-xs text-purple-600">
            {data.dataType}
          </div>
        )}
      </div>
      
      {/* Handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-2 h-2 bg-purple-400 border border-white"
        style={{ left: -4, top: '50%', transform: 'translateY(-50%)' }}
      />
      
      <Handle
        type="source"
        position={Position.Right}
        className="w-2 h-2 bg-purple-400 border border-white"
        style={{ right: -4, top: '50%', transform: 'translateY(-50%)' }}
      />
    </div>
  );
});

DataNode.displayName = 'DataNode';

export default DataNode;