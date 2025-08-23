// ============================================================================
// FlowchartNode - Componente especializado para nós de fluxograma
// ============================================================================

import React, { memo, useCallback, useState } from 'react';
import { Handle, Position } from 'reactflow';
import { BaseNode, BaseNodeProps } from './BaseNode';
import { FlowchartNodeData } from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Square, 
  Diamond, 
  Circle, 
  Hexagon, 
  Edit3,
  ArrowRight,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
  Database,
  MessageSquare,
  GitBranch,
  Merge
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDiagramStore } from '../stores/useDiagramStore';
import '../styles/shapes.css';

// ============================================================================
// Types
// ============================================================================

export interface FlowchartNodeProps extends Omit<BaseNodeProps, 'data'> {
  data: FlowchartNodeData;
}

type FlowchartShape = 'rectangle' | 'diamond' | 'circle' | 'hexagon' | 'parallelogram';

// ============================================================================
// Utilitários
// ============================================================================

const getShapeStyles = (shape: FlowchartShape, backgroundColor?: string, borderColor?: string): string => {
  const baseStyles = 'relative flex items-center justify-center min-h-[60px] transition-all duration-200 border-2 shape-hover';
  
  // Aplicar cores customizadas via CSS variables se fornecidas
  const customStyles = {
    ...(backgroundColor && { '--bg-color': backgroundColor }),
    ...(borderColor && { '--border-color': borderColor })
  };
  
  switch (shape) {
    case 'rectangle':
      return cn(baseStyles, 'rectangle-rounded');
    case 'diamond':
      return cn(baseStyles, 'diamond');
    case 'circle':
      return cn(baseStyles, 'circle-perfect');
    case 'hexagon':
      return cn(baseStyles, 'hexagon-modern shape-md');
    case 'parallelogram':
      return cn(baseStyles, 'parallelogram-modern');
    default:
      return cn(baseStyles, 'rectangle-rounded');
  }
};

const getShapeIcon = (shape: FlowchartShape) => {
  switch (shape) {
    case 'rectangle': return <Square className="w-4 h-4" />;
    case 'diamond': return <Diamond className="w-4 h-4" />;
    case 'circle': return <Circle className="w-4 h-4" />;
    case 'hexagon': return <Hexagon className="w-4 h-4" />;
    case 'parallelogram': return <Square className="w-4 h-4 transform skew-x-12" />;
    default: return <Square className="w-4 h-4" />;
  }
};

const getTypeColor = (type: string): string => {
  switch (type) {
    case 'flowchart-start': return 'border-green-500 bg-green-50';
    case 'flowchart-process': return 'border-blue-500 bg-blue-50';
    case 'flowchart-decision': return 'border-yellow-500 bg-yellow-50';
    case 'flowchart-end': return 'border-red-500 bg-red-50';
    case 'flowchart-data': return 'border-purple-500 bg-purple-50';
    case 'flowchart-document': return 'border-indigo-500 bg-indigo-50';
    case 'flowchart-subprocess': return 'border-cyan-500 bg-cyan-50';
    case 'flowchart-connector': return 'border-gray-500 bg-gray-50';
    case 'flowchart-annotation': return 'border-orange-500 bg-orange-50';
    case 'flowchart-parallel': return 'border-teal-500 bg-teal-50';
    case 'flowchart-inclusive': return 'border-pink-500 bg-pink-50';
    // Legacy support
    case 'start': return 'border-green-500 bg-green-50';
    case 'process': return 'border-blue-500 bg-blue-50';
    case 'decision': return 'border-yellow-500 bg-yellow-50';
    case 'end': return 'border-red-500 bg-red-50';
    case 'data': return 'border-purple-500 bg-purple-50';
    case 'connector': return 'border-gray-500 bg-gray-50';
    default: return 'border-gray-300 bg-white';
  }
};

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'flowchart-start': return <Play className="w-4 h-4" />;
    case 'flowchart-process': return <Square className="w-4 h-4" />;
    case 'flowchart-decision': return <Diamond className="w-4 h-4" />;
    case 'flowchart-end': return <CheckCircle className="w-4 h-4" />;
    case 'flowchart-data': return <Database className="w-4 h-4" />;
    case 'flowchart-document': return <FileText className="w-4 h-4" />;
    case 'flowchart-subprocess': return <Hexagon className="w-4 h-4" />;
    case 'flowchart-connector': return <Circle className="w-4 h-4" />;
    case 'flowchart-annotation': return <MessageSquare className="w-4 h-4" />;
    case 'flowchart-parallel': return <GitBranch className="w-4 h-4" />;
    case 'flowchart-inclusive': return <Merge className="w-4 h-4" />;
    // Legacy support
    case 'start': return <Play className="w-4 h-4" />;
    case 'process': return <Square className="w-4 h-4" />;
    case 'decision': return <Diamond className="w-4 h-4" />;
    case 'end': return <CheckCircle className="w-4 h-4" />;
    case 'data': return <Database className="w-4 h-4" />;
    case 'document': return <FileText className="w-4 h-4" />;
    case 'subprocess': return <Hexagon className="w-4 h-4" />;
    case 'connector': return <Circle className="w-4 h-4" />;
    case 'annotation': return <MessageSquare className="w-4 h-4" />;
    case 'parallel': return <GitBranch className="w-4 h-4" />;
    case 'inclusive': return <Merge className="w-4 h-4" />;
    default: return <Square className="w-4 h-4" />;
  }
};

// ============================================================================
// Componente Principal
// ============================================================================

export const FlowchartNode: React.FC<FlowchartNodeProps> = memo(({
  id,
  data,
  selected,
  ...props
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const { updateNode } = useDiagramStore();

  const handleEdit = useCallback(() => {
    setIsEditing(!isEditing);
  }, [isEditing]);

  const handleSave = useCallback(async (field: string, value: string) => {
    await updateNode(id, {
      data: {
        ...data,
        [field]: value
      }
    });
    setIsEditing(false);
  }, [updateNode, id, data]);

  const shape = data.shape || 'rectangle';
  const flowchartType = data.flowchartType || 'process';
  const typeColorClass = getTypeColor(flowchartType);
  const shapeStyles = getShapeStyles(shape, data.backgroundColor, data.borderColor);
  const shapeClasses = cn(shapeStyles, typeColorClass);
  
  // Estilos customizados para cores
  const customStyle = {
    ...(data.backgroundColor && { backgroundColor: data.backgroundColor }),
    ...(data.borderColor && { borderColor: data.borderColor })
  };
  const typeIcon = getTypeIcon(flowchartType);
  const shapeIcon = getShapeIcon(shape);

  // Determinar posições dos handles baseado no tipo
  const shouldShowHandles = (type: string): boolean => {
    return !['annotation', 'flowchart-annotation'].includes(type);
  };
  
  const shouldShowTopHandle = flowchartType !== 'start' && flowchartType !== 'flowchart-start' && shouldShowHandles(flowchartType);
  const shouldShowBottomHandle = flowchartType !== 'end' && flowchartType !== 'flowchart-end' && shouldShowHandles(flowchartType);
  const shouldShowSideHandles = (flowchartType === 'decision' || flowchartType === 'flowchart-decision') && shouldShowHandles(flowchartType);

  return (
    <BaseNode
      id={id}
      data={data}
      selected={selected}
      className={cn(
        'min-w-[120px] max-w-[250px]',
        'transition-all duration-200',
        selected && 'ring-2 ring-blue-500 ring-offset-2'
      )}
      handles={{
        top: shouldShowTopHandle ? 'target' : false,
        bottom: shouldShowBottomHandle ? 'source' : false,
        left: shouldShowSideHandles ? 'source' : false,
        right: shouldShowSideHandles ? 'source' : false
      }}
      {...props}
    >
      {/* Handle superior */}
      {shouldShowTopHandle && (
        <Handle
          type="target"
          position={Position.Top}
          className="w-3 h-3 bg-blue-500 border-2 border-white"
        />
      )}

      {/* Handle esquerdo (para decisões) */}
      {shouldShowSideHandles && (
        <Handle
          type="source"
          position={Position.Left}
          id="left"
          className="w-3 h-3 bg-red-500 border-2 border-white"
        />
      )}

      {/* Handle direito (para decisões) */}
      {shouldShowSideHandles && (
        <Handle
          type="source"
          position={Position.Right}
          id="right"
          className="w-3 h-3 bg-green-500 border-2 border-white"
        />
      )}

      {/* Conteúdo do nó */}
      <div className={cn(shapeClasses, 'w-full')} style={customStyle}>
        {/* Conteúdo interno (ajustado para formas especiais) */}
        <div className={cn(
          'flex flex-col items-center justify-center p-3 w-full h-full',
          shape === 'diamond' && 'transform -rotate-45',
          'text-center'
        )}>
          {/* Header com ícone e tipo */}
          <div className="flex items-center space-x-2 mb-2">
            {typeIcon}
            <Badge 
              variant="secondary" 
              className="text-xs px-2 py-0.5 bg-white/70"
            >
              {flowchartType}
            </Badge>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleEdit}
              className="h-5 w-5 p-0 hover:bg-white/50"
            >
              <Edit3 className="w-3 h-3" />
            </Button>
          </div>

          {/* Texto principal */}
          <div className="flex-1 flex items-center justify-center w-full">
            {isEditing ? (
              <Input
                defaultValue={data.label}
                className={cn(
                  'text-sm font-medium text-center border-0 bg-transparent',
                  'focus:ring-1 focus:ring-white/50 p-1'
                )}
                onBlur={(e) => handleSave('label', e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSave('label', e.currentTarget.value);
                  }
                }}
                autoFocus
              />
            ) : (
              <span className="text-sm font-medium leading-tight break-words">
                {data.label}
              </span>
            )}
          </div>

          {/* Descrição (se houver) */}
          {data.description && (
            <div className="mt-2 text-xs opacity-75 text-center">
              {data.description}
            </div>
          )}

          {/* Condições para nós de decisão */}
          {flowchartType === 'decision' && data.conditions && (
            <div className="mt-2 flex justify-between w-full text-xs">
              <span className="text-red-600 font-medium">Não</span>
              <span className="text-green-600 font-medium">Sim</span>
            </div>
          )}

          {/* Status (se houver) */}
          {data.status && (
            <div className="mt-2 flex items-center space-x-1">
              {data.status === 'completed' && <CheckCircle className="w-3 h-3 text-green-600" />}
              {data.status === 'error' && <XCircle className="w-3 h-3 text-red-600" />}
              {data.status === 'warning' && <AlertTriangle className="w-3 h-3 text-yellow-600" />}
              <span className="text-xs font-medium">
                {data.status === 'completed' && 'Concluído'}
                {data.status === 'error' && 'Erro'}
                {data.status === 'warning' && 'Atenção'}
                {data.status === 'pending' && 'Pendente'}
              </span>
            </div>
          )}
        </div>

        {/* Indicador de forma no canto */}
        <div className="absolute top-1 right-1 opacity-50">
          {shapeIcon}
        </div>
      </div>

      {/* Handle inferior */}
      {shouldShowBottomHandle && (
        <Handle
          type="source"
          position={Position.Bottom}
          className="w-3 h-3 bg-blue-500 border-2 border-white"
        />
      )}

      {/* Labels para handles de decisão */}
      {shouldShowSideHandles && (
        <>
          <div className="absolute -left-8 top-1/2 transform -translate-y-1/2 text-xs font-medium text-red-600 bg-white px-1 rounded shadow">
            Não
          </div>
          <div className="absolute -right-8 top-1/2 transform -translate-y-1/2 text-xs font-medium text-green-600 bg-white px-1 rounded shadow">
            Sim
          </div>
        </>
      )}
    </BaseNode>
  );
});

FlowchartNode.displayName = 'FlowchartNode';

export default FlowchartNode;

// ============================================================================
// Estilos CSS customizados (adicionar ao arquivo CSS global)
// ============================================================================

/*
.hexagon {
  clip-path: polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%);
}

.parallelogram {
  transform: skewX(-20deg);
}

.parallelogram > * {
  transform: skewX(20deg);
}
*/