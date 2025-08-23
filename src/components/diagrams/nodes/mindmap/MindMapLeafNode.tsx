import React from 'react';
import { Handle, Position } from 'reactflow';
import { Leaf } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MindMapLeafNodeProps {
  data: {
    label?: string;
    isSelected?: boolean;
    color?: string;
  };
  selected?: boolean;
}

export const MindMapLeafNode: React.FC<MindMapLeafNodeProps> = ({ data, selected }) => {
  const bgColor = data.color || 'bg-gradient-to-br from-yellow-500 to-orange-500';
  
  return (
    <div
      className={cn(
        "relative text-white border-2 rounded-full p-2 min-w-[60px] min-h-[40px] flex flex-col items-center justify-center shadow-sm transition-all duration-200",
        bgColor,
        selected || data.isSelected
          ? "border-white shadow-md scale-105"
          : "border-yellow-300 hover:scale-102"
      )}
    >
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-2 h-2 bg-white border-2 border-yellow-500"
      />
      
      {/* Leaf Icon */}
      <div className="flex items-center justify-center mb-1">
        <Leaf className="w-3 h-3 text-white" />
      </div>
      
      {/* Label */}
      <div className="text-xs text-center font-medium">
        {data.label || 'Leaf'}
      </div>
    </div>
  );
};

export default MindMapLeafNode;