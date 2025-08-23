import React from 'react';
import { Handle, Position } from 'reactflow';
import { Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EventBasedGatewayNodeProps {
  data: {
    label?: string;
    isSelected?: boolean;
  };
  selected?: boolean;
}

export const EventBasedGatewayNode: React.FC<EventBasedGatewayNodeProps> = ({ data, selected }) => {
  return (
    <div
      className={cn(
        "relative bg-white border-2 rounded-lg p-3 min-w-[80px] min-h-[80px] flex flex-col items-center justify-center shadow-sm transition-all duration-200",
        selected || data.isSelected
          ? "border-blue-500 shadow-lg"
          : "border-gray-300 hover:border-gray-400"
      )}
    >
      {/* Input Handles */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-blue-500 border-2 border-white"
      />
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-blue-500 border-2 border-white"
      />
      
      {/* Gateway Icon */}
      <div className="flex items-center justify-center mb-1">
        <Zap className="w-6 h-6 text-yellow-600" />
      </div>
      
      {/* Label */}
      {data.label && (
        <div className="text-xs text-center text-gray-700 font-medium">
          {data.label}
        </div>
      )}
      
      {/* Output Handles */}
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-blue-500 border-2 border-white"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-blue-500 border-2 border-white"
      />
    </div>
  );
};

export default EventBasedGatewayNode;