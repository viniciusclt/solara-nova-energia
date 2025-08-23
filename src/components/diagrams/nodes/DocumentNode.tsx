// ============================================================================
// Document Node - Nó de documento para diagramas BPMN
// ============================================================================

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { FileText } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface DocumentNodeData {
  label?: string;
  description?: string;
  documentType?: string;
}

export const DocumentNode: React.FC<NodeProps<DocumentNodeData>> = memo(({ 
  data, 
  selected,
  id 
}) => {
  return (
    <div className={cn(
      "relative bg-gray-50 border-2 border-gray-400 rounded-lg",
      "min-w-[100px] min-h-[70px] p-3",
      "hover:bg-gray-100 transition-colors",
      "clip-path-document", // Forma especial de documento
      selected && "ring-2 ring-blue-500 ring-offset-2"
    )}>
      {/* Handle de entrada */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-gray-400 border-2 border-white"
      />
      
      {/* Conteúdo do nó */}
      <div className="flex items-center gap-2">
        <FileText size={16} className="text-gray-600" />
        <div className="flex-1">
          <div className="text-sm font-medium text-gray-800">
            {data?.label || 'Documento'}
          </div>
          {data?.documentType && (
            <div className="text-xs text-gray-500">
              {data.documentType}
            </div>
          )}
        </div>
      </div>
      
      {/* Descrição opcional */}
      {data?.description && (
        <div className="mt-2 text-xs text-gray-600">
          {data.description}
        </div>
      )}
      
      {/* Handle de saída */}
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-gray-400 border-2 border-white"
      />
    </div>
  );
});

DocumentNode.displayName = 'DocumentNode';

export default DocumentNode;