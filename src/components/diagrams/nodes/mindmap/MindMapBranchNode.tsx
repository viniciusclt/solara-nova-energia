import React from 'react';
import { Handle, Position } from 'reactflow';
import { GitBranch } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MindMapBranchNodeProps {
  data: {
    label?: string;
    isSelected?: boolean;
    color?: string;
  };
  selected?: boolean;
}

export const MindMapBranchNode: React.FC<MindMapBranchNodeProps> = ({ data, selected }) => {
  const bgColor = data.color || 'bg-gradient-to-br from-green-500 to-emerald-500';
  
  return (
    <div
      className={cn(
        "relative text-white border-2 rounded-md p-3 min-w-[80px] min-h-[50px] flex flex-col items-center justify-center shadow-sm transition-all duration-200",
        bgColor,
        selected || data.isSelected
          ? "border-white shadow-md scale-105"
          : "border-green-300 hover:scale-102"
      )}
    >
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-2 h-2 bg-white border-2 border-green-500"
      />
      
      {/* Branch Icon */}
      <div className="flex items-center justify-center mb-1">
        <GitBranch className="w-4 h-4 text-white" />
      </div>
      
      {/* Label */}
      <div className="text-xs text-center font-medium">
        {data.label || 'Branch'}
      </div>
      
      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="w-2 h-2 bg-white border-2 border-green-500"
      />
    </div>
  );
};

export default MindMapBranchNode;