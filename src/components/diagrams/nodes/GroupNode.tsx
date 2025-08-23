import React from 'react';
import { Handle, Position } from 'reactflow';
import { Folder } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GroupNodeProps {
  data: {
    label?: string;
    isSelected?: boolean;
  };
  selected?: boolean;
}

export const GroupNode: React.FC<GroupNodeProps> = ({ data, selected }) => {
  return (
    <div
      className={cn(
        "relative bg-gray-50 border-2 border-dashed rounded-lg p-6 min-w-[200px] min-h-[150px] flex flex-col items-center justify-center shadow-sm transition-all duration-200",
        selected || data.isSelected
          ? "border-blue-500 bg-blue-50 shadow-lg"
          : "border-gray-400 hover:border-gray-500"
      )}
    >
      {/* Group Icon */}
      <div className="flex items-center justify-center mb-2">
        <Folder className="w-6 h-6 text-gray-600" />
      </div>
      
      {/* Label */}
      <div className="text-sm text-center text-gray-700 font-medium">
        {data.label || 'Group'}
      </div>
      
      {/* Note: Groups typically don't have handles as they contain other elements */}
    </div>
  );
};

export default GroupNode;