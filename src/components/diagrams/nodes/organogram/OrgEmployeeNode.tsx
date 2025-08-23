import React from 'react';
import { Handle, Position } from 'reactflow';
import { User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OrgEmployeeNodeProps {
  data: {
    label?: string;
    name?: string;
    isSelected?: boolean;
  };
  selected?: boolean;
}

export const OrgEmployeeNode: React.FC<OrgEmployeeNodeProps> = ({ data, selected }) => {
  return (
    <div
      className={cn(
        "relative bg-gradient-to-br from-green-500 to-emerald-500 text-white border-2 rounded-lg p-3 min-w-[100px] min-h-[60px] flex flex-col items-center justify-center shadow-sm transition-all duration-200",
        selected || data.isSelected
          ? "border-white shadow-md scale-105"
          : "border-green-300 hover:scale-102"
      )}
    >
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-white border-2 border-green-500"
      />
      
      {/* Employee Icon */}
      <div className="flex items-center justify-center mb-1">
        <User className="w-4 h-4 text-white" />
      </div>
      
      {/* Position Label */}
      <div className="text-xs text-center font-medium mb-1">
        {data.label || 'Employee'}
      </div>
      
      {/* Name */}
      {data.name && (
        <div className="text-xs text-center text-green-100">
          {data.name}
        </div>
      )}
    </div>
  );
};

export default OrgEmployeeNode;