// ============================================================================
// ConnectorNode - Nó conector do fluxograma
// ============================================================================

import React from 'react';
import { Handle, Position } from 'reactflow';
import { Circle } from 'lucide-react';
import { BaseNodeProps } from './types';
import { cn } from '@/lib/utils';

export const ConnectorNode: React.FC<BaseNodeProps> = ({
  data,
  isSelected = false,
  isConnectable = true,
}) => {
  return (
    <div
      className={cn(
        'w-4 h-4 bg-gray-400 border-2 border-gray-600 rounded-full transition-all duration-200',
        isSelected && 'ring-2 ring-blue-500 ring-offset-2'
      )}
    >
      <Handle type="target" position={Position.Left} isConnectable={isConnectable} className="opacity-0" />
      <Handle type="source" position={Position.Right} isConnectable={isConnectable} className="opacity-0" />
      <Handle type="target" position={Position.Top} isConnectable={isConnectable} className="opacity-0" />
      <Handle type="source" position={Position.Bottom} isConnectable={isConnectable} className="opacity-0" />
    </div>
  );
};

export default ConnectorNode;