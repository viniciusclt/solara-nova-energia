import React from 'react';
import { Handle, Position } from 'reactflow';
import { Database, HardDrive } from 'lucide-react';
import { BaseNodeProps } from './types';
import { EnhancedNodeWrapper } from './EnhancedNodeWrapper';
import { EditableLabel } from './EditableLabel';
import { cn } from '@/lib/utils';

interface DataNodeProps extends BaseNodeProps {
  id: string;
  position: { x: number; y: number };
  onAddNode?: (type: string, position: { x: number; y: number }) => void;
  onAddEdge?: (edge: any) => void;
}

export const DataNode: React.FC<DataNodeProps> = ({
  id,
  position,
  data,
  isSelected = false,
  isConnectable = true,
  onAddNode,
  onAddEdge
}) => {
  const nodeContent = (
    <div
      className={cn(
        'relative flex items-center justify-center transition-all duration-300 group',
        'bg-gradient-to-br from-indigo-500 via-indigo-600 to-indigo-700',
        'border-3 border-indigo-700 shadow-lg hover:shadow-xl',
        'rounded-lg overflow-hidden',
        isSelected && 'ring-4 ring-blue-500 ring-opacity-50 scale-105'
      )}
      style={{
        width: data.width || 140,
        height: data.height || 70,
        filter: isSelected ? 'drop-shadow(0 8px 16px rgba(99, 102, 241, 0.4))' : 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1))'
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        className="w-4 h-4 bg-white border-3 border-indigo-700 shadow-md hover:scale-110 transition-transform"
      />
      
      <Handle
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
        className="w-4 h-4 bg-white border-3 border-indigo-700 shadow-md hover:scale-110 transition-transform"
      />
      
      <div className="flex items-center space-x-3 px-4 py-2">
        {data.icon ? (
          <span className="text-xl">{data.icon}</span>
        ) : (
          <HardDrive className="w-5 h-5 text-white drop-shadow-sm" />
        )}
        <EditableLabel
          value={data.label || 'Dados'}
          onSave={(newLabel) => data.onUpdateNode?.(id, { data: { ...data, label: newLabel } })}
          className="text-sm font-bold text-white drop-shadow-sm truncate text-center"
        />
        {data.status && (
          <div className="w-2 h-2 rounded-full bg-white opacity-80 animate-pulse" />
        )}
      </div>
      
      {/* Efeito de brilho quando selecionado */}
      {isSelected && (
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent animate-pulse rounded-lg" />
      )}
      
      {/* Efeito de dados/storage */}
      <div className="absolute bottom-1 left-1 right-1 h-1 bg-white/20 rounded-full" />
      <div className="absolute bottom-2 left-2 right-2 h-0.5 bg-white/30 rounded-full" />
      <div className="absolute inset-1 border border-white/30 rounded-md" />
    </div>
  );

  return (
    <EnhancedNodeWrapper
      id={id}
      position={position}
      onAddNode={onAddNode}
      onAddEdge={onAddEdge}
      nodeType="data"
      isSelected={isSelected}
    >
      {nodeContent}
    </EnhancedNodeWrapper>
  );
};

export default DataNode;