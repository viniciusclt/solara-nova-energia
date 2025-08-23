import React from 'react';
import { Handle, Position } from 'reactflow';
import { Crown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OrgCEONodeProps {
  data: {
    label?: string;
    name?: string;
    isSelected?: boolean;
  };
  selected?: boolean;
}

export const OrgCEONode: React.FC<OrgCEONodeProps> = ({ data, selected }) => {
  return (
    <div
      className={cn(
        "relative bg-gradient-to-br from-purple-600 to-indigo-600 text-white border-2 rounded-lg p-4 min-w-[140px] min-h-[80px] flex flex-col items-center justify-center shadow-lg transition-all duration-200",
        selected || data.isSelected
          ? "border-white shadow-xl scale-105"
          : "border-purple-300 hover:scale-102"
      )}
    >
      {/* CEO Icon */}
      <div className="flex items-center justify-center mb-2">
        <Crown className="w-6 h-6 text-yellow-300" />
      </div>
      
      {/* Position Label */}
      <div className="text-xs text-center font-bold mb-1">
        {data.label || 'CEO'}
      </div>
      
      {/* Name */}
      {data.name && (
        <div className="text-xs text-center text-purple-100">
          {data.name}
        </div>
      )}
      
      {/* Output Handles - CEO connects downward to managers */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-white border-2 border-purple-500"
      />
    </div>
  );
};

export default OrgCEONode;