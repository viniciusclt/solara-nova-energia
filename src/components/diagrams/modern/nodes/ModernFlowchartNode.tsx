/**
 * Nó Moderno para Fluxogramas
 * Componente avançado com múltiplas formas e estilos
 */

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface FlowchartNodeData {
  label: string;
  description?: string;
  color?: string;
  shape?: 'rectangle' | 'ellipse' | 'diamond' | 'parallelogram' | 'hexagon' | 'circle';
  icon?: string;
  status?: 'active' | 'completed' | 'pending' | 'error';
  size?: 'sm' | 'md' | 'lg';
}

const ModernFlowchartNode: React.FC<NodeProps<FlowchartNodeData>> = ({ data, selected }) => {
  const {
    label,
    description,
    color = '#3b82f6',
    shape = 'rectangle',
    icon,
    status,
    size = 'md'
  } = data;

  const getShapeStyles = () => {
    const baseStyles = 'relative flex items-center justify-center text-center transition-all duration-200';
    const sizeStyles = {
      sm: 'min-w-[80px] min-h-[40px] text-xs',
      md: 'min-w-[120px] min-h-[60px] text-sm',
      lg: 'min-w-[160px] min-h-[80px] text-base'
    };
    
    const shapeStyles = {
      rectangle: 'rounded-lg',
      ellipse: 'rounded-full',
      diamond: 'transform rotate-45',
      parallelogram: 'transform skew-x-12',
      hexagon: 'clip-path-hexagon',
      circle: 'rounded-full aspect-square'
    };
    
    return cn(
      baseStyles,
      sizeStyles[size],
      shapeStyles[shape],
      selected && 'ring-2 ring-blue-500 ring-offset-2'
    );
  };

  const getStatusColor = () => {
    switch (status) {
      case 'active': return 'border-blue-500 bg-blue-50';
      case 'completed': return 'border-green-500 bg-green-50';
      case 'pending': return 'border-yellow-500 bg-yellow-50';
      case 'error': return 'border-red-500 bg-red-50';
      default: return 'border-gray-300 bg-white';
    }
  };

  const renderContent = () => {
    const content = (
      <div className="flex flex-col items-center justify-center p-2 h-full">
        {icon && (
          <div className="mb-1 text-lg">
            {icon}
          </div>
        )}
        <div className="font-medium text-gray-900 leading-tight">
          {label}
        </div>
        {description && (
          <div className="text-xs text-gray-600 mt-1 leading-tight">
            {description}
          </div>
        )}
        {status && (
          <Badge 
            variant="outline" 
            className="mt-1 text-xs"
          >
            {status}
          </Badge>
        )}
      </div>
    );

    // Para formas que precisam de rotação, envolvemos o conteúdo para contra-rotacionar
    if (shape === 'diamond' || shape === 'parallelogram') {
      return (
        <div className={cn(
          'transform',
          shape === 'diamond' && '-rotate-45',
          shape === 'parallelogram' && '-skew-x-12'
        )}>
          {content}
        </div>
      );
    }

    return content;
  };

  return (
    <div className="group">
      {/* Handles de Conexão */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 border-2 border-white bg-gray-400 hover:bg-blue-500 transition-colors"
      />
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 border-2 border-white bg-gray-400 hover:bg-blue-500 transition-colors"
      />
      
      {/* Nó Principal */}
      <Card 
        className={cn(
          getShapeStyles(),
          getStatusColor(),
          'border-2 shadow-lg hover:shadow-xl cursor-pointer',
          'group-hover:scale-105'
        )}
        style={{
          borderColor: color,
          backgroundColor: selected ? `${color}20` : undefined
        }}
      >
        {renderContent()}
        
        {/* Indicador de Seleção */}
        {selected && (
          <div 
            className="absolute -inset-1 rounded-lg border-2 border-dashed opacity-50"
            style={{ borderColor: color }}
          />
        )}
      </Card>
      
      {/* Handles de Saída */}
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 border-2 border-white bg-gray-400 hover:bg-blue-500 transition-colors"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 border-2 border-white bg-gray-400 hover:bg-blue-500 transition-colors"
      />
      
      {/* Tooltip de Informações */}
      {description && (
        <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
          {description}
        </div>
      )}
    </div>
  );
};

export default memo(ModernFlowchartNode);
export { ModernFlowchartNode };