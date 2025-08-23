import React from 'react';
import { Handle, Position } from 'reactflow';
import { Building } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OrgDepartmentNodeProps {
  data: {
    label?: string;
    isSelected?: boolean;
  };
  selected?: boolean;
}

export const OrgDepartmentNode: React.FC<OrgDepartmentNodeProps> = ({ data, selected }) => {
  return (
    <div
      className={cn(
        "relative bg-gradient-to-br from-orange-500 to-red-500 text-white border-2 border-dashed rounded-lg p-4 min-w-[150px] min-h-[80px] flex flex-col items-center justify-center shadow-md transition-all duration-200",
        selected || data.isSelected
          ? "border-white shadow-lg scale-105"
          : "border-orange-300 hover:scale-102"
      )}
    >
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-white border-2 border-orange-500"
      />
      
      {/* Department Icon */}
      <div className="flex items-center justify-center mb-2">
        <Building className="w-6 h-6 text-white" />
      </div>
      
      {/* Department Label */}
      <div className="text-sm text-center font-semibold">
        {data.label || 'Department'}
      </div>
      
      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-white border-2 border-orange-500"
      />
    </div>
  );
};

export default OrgDepartmentNode;