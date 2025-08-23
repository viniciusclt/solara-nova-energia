import React from 'react';
import { Handle, Position } from 'reactflow';
import { Brain } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MindMapRootNodeProps {
  data: {
    label?: string;
    isSelected?: boolean;
  };
  selected?: boolean;
}

export const MindMapRootNode: React.FC<MindMapRootNodeProps> = ({ data, selected }) => {
  return (
    <div
      className={cn(
        "relative bg-gradient-to-br from-purple-500 to-pink-500 text-white border-2 rounded-full p-6 min-w-[120px] min-h-[120px] flex flex-col items-center justify-center shadow-lg transition-all duration-200",
        selected || data.isSelected
          ? "border-white shadow-xl scale-105"
          : "border-purple-300 hover:scale-102"
      )}
    >
      {/* Root Icon */}
      <div className="flex items-center justify-center mb-2">
        <Brain className="w-8 h-8 text-white" />
      </div>
      
      {/* Label */}
      <div className="text-sm text-center font-bold">
        {data.label || 'Central Idea'}
      </div>
      
      {/* Output Handles - Multiple directions for branches */}
      <Handle
        type="source"
        position={Position.Top}
        className="w-3 h-3 bg-white border-2 border-purple-500"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-white border-2 border-purple-500"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-white border-2 border-purple-500"
      />
      <Handle
        type="source"
        position={Position.Left}
        className="w-3 h-3 bg-white border-2 border-purple-500"
      />
    </div>
  );
};

export default MindMapRootNode;