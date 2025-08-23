import React from 'react';
import { Handle, Position } from 'reactflow';
import { UserCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OrgManagerNodeProps {
  data: {
    label?: string;
    name?: string;
    isSelected?: boolean;
  };
  selected?: boolean;
}

export const OrgManagerNode: React.FC<OrgManagerNodeProps> = ({ data, selected }) => {
  return (
    <div
      className={cn(
        "relative bg-gradient-to-br from-blue-600 to-cyan-600 text-white border-2 rounded-lg p-3 min-w-[120px] min-h-[70px] flex flex-col items-center justify-center shadow-md transition-all duration-200",
        selected || data.isSelected
          ? "border-white shadow-lg scale-105"
          : "border-blue-300 hover:scale-102"
      )}
    >
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-white border-2 border-blue-500"
      />
      
      {/* Manager Icon */}
      <div className="flex items-center justify-center mb-2">
        <UserCheck className="w-5 h-5 text-white" />
      </div>
      
      {/* Position Label */}
      <div className="text-xs text-center font-semibold mb-1">
        {data.label || 'Manager'}
      </div>
      
      {/* Name */}
      {data.name && (
        <div className="text-xs text-center text-blue-100">
          {data.name}
        </div>
      )}
      
      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-white border-2 border-blue-500"
      />
    </div>
  );
};

export default OrgManagerNode;