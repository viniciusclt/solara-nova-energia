import React from 'react';
import { Handle, Position } from 'reactflow';
import { Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ServiceTaskNodeProps {
  data: {
    label?: string;
    isSelected?: boolean;
  };
  selected?: boolean;
}

export const ServiceTaskNode: React.FC<ServiceTaskNodeProps> = ({ data, selected }) => {
  return (
    <div
      className={cn(
        "relative bg-white border-2 rounded-lg p-4 min-w-[120px] min-h-[80px] flex flex-col items-center justify-center shadow-sm transition-all duration-200",
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
      
      {/* Task Icon */}
      <div className="flex items-center justify-center mb-2">
        <Settings className="w-5 h-5 text-green-600" />
      </div>
      
      {/* Label */}
      <div className="text-sm text-center text-gray-700 font-medium">
        {data.label || 'Service Task'}
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

export default ServiceTaskNode;