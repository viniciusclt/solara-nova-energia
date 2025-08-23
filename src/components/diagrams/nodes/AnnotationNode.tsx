// ============================================================================
// Annotation Node - Nó de anotação para diagramas BPMN
// ============================================================================

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { MessageSquare } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface AnnotationNodeData {
  label?: string;
  description?: string;
  text?: string;
}

export const AnnotationNode: React.FC<NodeProps<AnnotationNodeData>> = memo(({ 
  data, 
  selected,
  id 
}) => {
  return (
    <div className={cn(
      "relative bg-yellow-50 border-2 border-yellow-300 rounded-lg",
      "min-w-[100px] min-h-[60px] p-2",
      "hover:bg-yellow-100 transition-colors",
      "border-dashed",
      selected && "ring-2 ring-blue-500 ring-offset-2"
    )}>
      {/* Ícone de anotação */}
      <div className="flex items-start gap-2">
        <MessageSquare size={14} className="text-yellow-600 mt-0.5 flex-shrink-0" />
        
        {/* Conteúdo da anotação */}
        <div className="flex-1">
          {data?.label && (
            <div className="text-xs font-medium text-yellow-800 mb-1">
              {data.label}
            </div>
          )}
          
          <div className="text-xs text-yellow-700">
            {data?.text || data?.description || 'Anotação'}
          </div>
        </div>
      </div>
      
      {/* Handle opcional para conexão */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-2 h-2 bg-yellow-400 border border-yellow-600 opacity-50"
        style={{ left: -4 }}
      />
    </div>
  );
});

AnnotationNode.displayName = 'AnnotationNode';

export default AnnotationNode;