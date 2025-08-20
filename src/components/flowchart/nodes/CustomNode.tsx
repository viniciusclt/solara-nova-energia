import React from 'react';
import { Handle, Position } from 'reactflow';
import { Workflow, Settings } from 'lucide-react';
import { BaseNodeProps } from './types';
import { EnhancedNodeWrapper } from './EnhancedNodeWrapper';
import { cn } from '@/lib/utils';

interface CustomNodeProps extends BaseNodeProps {
  id: string;
  position: { x: number; y: number };
  onAddNode?: (type: string, position: { x: number; y: number }) => void;
  onAddEdge?: (edge: any) => void;
}

export const CustomNode: React.FC<CustomNodeProps> = ({
  id,
  position,
  data,
  isSelected = false,
  isConnectable = true,
  onAddNode,
  onAddEdge
}) => {
  const nodeStyle = {
    backgroundColor: data.backgroundColor || '#6b7280',
    borderColor: data.borderColor || '#4b5563',
    color: data.textColor || '#ffffff',
    width: data.width || 140,
    height: data.height || 80,
    borderRadius: data.borderRadius || 8,
  };

  const nodeContent = (
    <div
      className={cn(
        'relative flex items-center justify-center transition-all duration-300 group',
        'border-3 shadow-lg hover:shadow-xl',
        'overflow-hidden',
        isSelected && 'ring-4 ring-blue-500 ring-opacity-50 scale-105'
      )}
      style={{
        ...nodeStyle,
        background: data.backgroundColor ? 
          `linear-gradient(135deg, ${data.backgroundColor}, ${data.backgroundColor}dd)` :
          'linear-gradient(135deg, #6b7280, #4b5563)',
        filter: isSelected ? 'drop-shadow(0 8px 16px rgba(0, 0, 0, 0.3))' : 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1))'
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        className="w-4 h-4 bg-white border-3 border-gray-700 shadow-md hover:scale-110 transition-transform"
      />
      
      <Handle
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
        className="w-4 h-4 bg-white border-3 border-gray-700 shadow-md hover:scale-110 transition-transform"
      />
      
      <div className="flex items-center space-x-3 px-4 py-2">
        {data.icon ? (
          <span className="text-xl">{data.icon}</span>
        ) : (
          <Settings className="w-5 h-5 drop-shadow-sm" style={{ color: data.textColor || '#ffffff' }} />
        )}
        <span 
          className="text-sm font-bold drop-shadow-sm truncate"
          style={{ color: data.textColor || '#ffffff' }}
        >
          {data.label || 'Customizado'}
        </span>
        {data.status && (
          <div className="w-2 h-2 rounded-full bg-white opacity-80 animate-pulse" />
        )}
      </div>
      
      {/* Efeito de brilho quando selecionado */}
      {isSelected && (
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent animate-pulse" style={{ borderRadius: nodeStyle.borderRadius }} />
      )}
      
      {/* Efeito de customização */}
      <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-white/40" />
      <div className="absolute bottom-1 left-1 w-1 h-1 rounded-full bg-white/30" />
      <div className="absolute bottom-1 right-1 w-1 h-1 rounded-full bg-white/30" />
    </div>
  );

  return (
    <EnhancedNodeWrapper
      id={id}
      position={position}
      onAddNode={onAddNode}
      onAddEdge={onAddEdge}
      nodeType="custom"
      isSelected={isSelected}
    >
      {nodeContent}
    </EnhancedNodeWrapper>
  );
};

export default CustomNode;