import React from 'react';
import { Handle, Position } from 'reactflow';
import { Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MindMapMainNodeProps {
  data: {
    label?: string;
    isSelected?: boolean;
    color?: string;
  };
  selected?: boolean;
}

export const MindMapMainNode: React.FC<MindMapMainNodeProps> = ({ data, selected }) => {
  const bgColor = data.color || 'bg-gradient-to-br from-blue-500 to-cyan-500';
  
  return (
    <div
      className={cn(
        "relative text-white border-2 rounded-lg p-4 min-w-[100px] min-h-[60px] flex flex-col items-center justify-center shadow-md transition-all duration-200",
        bgColor,
        selected || data.isSelected
          ? "border-white shadow-lg scale-105"
          : "border-blue-300 hover:scale-102"
      )}
    >
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-white border-2 border-blue-500"
      />
      
      {/* Main Topic Icon */}
      <div className="flex items-center justify-center mb-1">
        <Lightbulb className="w-5 h-5 text-white" />
      </div>
      
      {/* Label */}
      <div className="text-sm text-center font-semibold">
        {data.label || 'Main Topic'}
      </div>
      
      {/* Output Handles */}
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-white border-2 border-blue-500"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-white border-2 border-blue-500"
      />
    </div>
  );
};

export default MindMapMainNode;