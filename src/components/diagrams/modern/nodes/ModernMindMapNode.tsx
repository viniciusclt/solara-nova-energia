/**
 * Nó Moderno para Mapas Mentais
 * Componente inspirado no MindMeister com design orgânico
 */

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface MindMapNodeData {
  label: string;
  level: number; // 0 = central, 1 = main branch, 2+ = sub-branches
  color?: string;
  icon?: string;
  emoji?: string;
  tags?: string[];
  notes?: string;
  isExpanded?: boolean;
  childCount?: number;
}

const ModernMindMapNode: React.FC<NodeProps<MindMapNodeData>> = ({ data, selected }) => {
  const {
    label,
    level,
    color = '#3b82f6',
    icon,
    emoji,
    tags = [],
    notes,
    isExpanded = true,
    childCount = 0
  } = data;

  const getNodeStyles = () => {
    const baseStyles = 'relative flex items-center justify-center text-center transition-all duration-300 hover:scale-105';
    
    // Estilos baseados no nível hierárquico
    const levelStyles = {
      0: 'min-w-[140px] min-h-[80px] text-lg font-bold rounded-full shadow-2xl', // Central
      1: 'min-w-[120px] min-h-[60px] text-base font-semibold rounded-2xl shadow-lg', // Main branches
      2: 'min-w-[100px] min-h-[50px] text-sm font-medium rounded-xl shadow-md', // Sub-branches
      3: 'min-w-[80px] min-h-[40px] text-xs rounded-lg shadow-sm' // Leaf nodes
    };
    
    const currentLevel = Math.min(level, 3);
    
    return cn(
      baseStyles,
      levelStyles[currentLevel as keyof typeof levelStyles],
      selected && 'ring-4 ring-blue-400 ring-opacity-50'
    );
  };

  const getBackgroundGradient = () => {
    const opacity = Math.max(0.1, 1 - (level * 0.2));
    return {
      background: `linear-gradient(135deg, ${color}${Math.round(opacity * 255).toString(16).padStart(2, '0')}, ${color}${Math.round(opacity * 128).toString(16).padStart(2, '0')})`
    };
  };

  const getBorderColor = () => {
    return {
      borderColor: color,
      borderWidth: level === 0 ? '3px' : level === 1 ? '2px' : '1px'
    };
  };

  const renderHandles = () => {
    const handleStyle = "w-2 h-2 border border-white opacity-0 group-hover:opacity-100 transition-opacity";
    
    if (level === 0) {
      // Nó central - handles em todas as direções
      return (
        <>
          <Handle type="source" position={Position.Top} className={handleStyle} />
          <Handle type="source" position={Position.Right} className={handleStyle} />
          <Handle type="source" position={Position.Bottom} className={handleStyle} />
          <Handle type="source" position={Position.Left} className={handleStyle} />
        </>
      );
    } else {
      // Nós de branch - handle de entrada e saída
      return (
        <>
          <Handle type="target" position={Position.Left} className={handleStyle} />
          <Handle type="source" position={Position.Right} className={handleStyle} />
        </>
      );
    }
  };

  return (
    <div className="group relative">
      {renderHandles()}
      
      {/* Nó Principal */}
      <Card 
        className={cn(
          getNodeStyles(),
          'border cursor-pointer overflow-hidden'
        )}
        style={{
          ...getBackgroundGradient(),
          ...getBorderColor()
        }}
      >
        <div className="flex flex-col items-center justify-center p-3 w-full h-full">
          {/* Ícone/Emoji */}
          {(emoji || icon) && (
            <div className="mb-2 text-xl">
              {emoji || icon}
            </div>
          )}
          
          {/* Label Principal */}
          <div 
            className="text-gray-900 leading-tight text-center break-words"
            style={{ color: level === 0 ? 'white' : 'inherit' }}
          >
            {label}
          </div>
          
          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2 justify-center">
              {tags.slice(0, 2).map((tag, index) => (
                <Badge 
                  key={index}
                  variant="secondary" 
                  className="text-xs px-1 py-0"
                >
                  {tag}
                </Badge>
              ))}
              {tags.length > 2 && (
                <Badge variant="outline" className="text-xs px-1 py-0">
                  +{tags.length - 2}
                </Badge>
              )}
            </div>
          )}
          
          {/* Indicador de Filhos */}
          {childCount > 0 && (
            <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {childCount}
            </div>
          )}
          
          {/* Indicador de Expansão */}
          {!isExpanded && childCount > 0 && (
            <div className="absolute inset-0 bg-black bg-opacity-20 rounded-full flex items-center justify-center">
              <div className="text-white text-sm font-bold">+</div>
            </div>
          )}
        </div>
        
        {/* Efeito de Brilho para Nó Central */}
        {level === 0 && (
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white to-transparent opacity-20 animate-pulse" />
        )}
      </Card>
      
      {/* Tooltip com Notas */}
      {notes && (
        <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20 max-w-xs">
          {notes}
        </div>
      )}
      
      {/* Conexão Visual para Branches */}
      {level > 0 && (
        <div 
          className="absolute top-1/2 -left-4 w-4 h-0.5 transform -translate-y-1/2"
          style={{ backgroundColor: color }}
        />
      )}
    </div>
  );
};

export default memo(ModernMindMapNode);
export { ModernMindMapNode };