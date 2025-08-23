import React from 'react';
import { Handle, Position } from 'reactflow';
import { Database } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DatabaseNodeProps {
  data: {
    label?: string;
    isSelected?: boolean;
  };
  selected?: boolean;
}

export const DatabaseNode: React.FC<DatabaseNodeProps> = ({ data, selected }) => {
  return (
    <div
      className={cn(
        "relative bg-white border-2 rounded-lg p-4 min-w-[100px] min-h-[80px] flex flex-col items-center justify-center shadow-sm transition-all duration-200",
        selected || data.isSelected
          ? "border-blue-500 shadow-lg"
          : "border-gray-300 hover:border-gray-400"
      )}
    >
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-blue-500 border-2 border-white"
      />
      
      {/* Database Icon */}
      <div className="flex items-center justify-center mb-2">
        <Database className="w-6 h-6 text-indigo-600" />
      </div>
      
      {/* Label */}
      <div className="text-sm text-center text-gray-700 font-medium">
        {data.label || 'Database'}
      </div>
      
      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-blue-500 border-2 border-white"
      />
    </div>
  );
};

export default DatabaseNode;