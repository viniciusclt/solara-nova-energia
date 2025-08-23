// ============================================================================
// MindMapNode - Componente especializado para nós de mapa mental
// ============================================================================

import React, { memo, useCallback, useState } from 'react';
import { Handle, Position } from 'reactflow';
import { BaseNode, BaseNodeProps } from './BaseNode';
import { MindMapNodeData, DiagramNode } from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Brain, 
  Lightbulb, 
  Star, 
  Zap, 
  Target, 
  Plus, 
  Edit3,
  ChevronDown,
  ChevronUp,
  Hash,
  Link
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDiagramStore } from '../stores/useDiagramStore';

// ============================================================================
// Types
// ============================================================================

export interface MindMapNodeProps extends Omit<BaseNodeProps, 'data'> {
  data: MindMapNodeData;
}

type MindMapLevel = 0 | 1 | 2 | 3 | 4;

// ============================================================================
// Utilitários
// ============================================================================

const getLevelStyles = (level: MindMapLevel): string => {
  const styles = {
    0: 'bg-gradient-to-br from-purple-500 to-pink-500 text-white border-purple-600 min-w-[200px] min-h-[80px]', // Central
    1: 'bg-gradient-to-br from-blue-400 to-cyan-400 text-white border-blue-500 min-w-[160px] min-h-[60px]',   // Principal
    2: 'bg-gradient-to-br from-green-400 to-emerald-400 text-white border-green-500 min-w-[140px] min-h-[50px]', // Secundário
    3: 'bg-gradient-to-br from-yellow-400 to-orange-400 text-gray-800 border-yellow-500 min-w-[120px] min-h-[40px]', // Terciário
    4: 'bg-gradient-to-br from-gray-300 to-gray-400 text-gray-800 border-gray-500 min-w-[100px] min-h-[35px]'  // Folha
  };
  return styles[level] || styles[4];
};

const getLevelIcon = (level: MindMapLevel) => {
  const icons = {
    0: <Brain className="w-5 h-5" />,
    1: <Lightbulb className="w-4 h-4" />,
    2: <Star className="w-4 h-4" />,
    3: <Zap className="w-3 h-3" />,
    4: <Target className="w-3 h-3" />
  };
  return icons[level] || icons[4];
};

const getLevelName = (level: MindMapLevel): string => {
  const names = {
    0: 'Central',
    1: 'Principal',
    2: 'Secundário',
    3: 'Terciário',
    4: 'Folha'
  };
  return names[level] || 'Folha';
};

const getShapeClass = (level: MindMapLevel): string => {
  const shapes = {
    0: 'rounded-full', // Central - círculo
    1: 'rounded-2xl',  // Principal - retângulo arredondado
    2: 'rounded-xl',   // Secundário - retângulo menos arredondado
    3: 'rounded-lg',   // Terciário - retângulo pouco arredondado
    4: 'rounded-md'    // Folha - retângulo básico
  };
  return shapes[level] || shapes[4];
};

// ============================================================================
// Componente Principal
// ============================================================================

export const MindMapNode: React.FC<MindMapNodeProps> = memo(({
  id,
  data,
  selected,
  ...props
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const { addNode, updateNode } = useDiagramStore();

  const handleAddChild = useCallback(async () => {
    const newNode: Omit<DiagramNode, 'id' | 'createdAt' | 'updatedAt' | 'version'> = {
      type: 'mindmap',
      position: { x: 0, y: 0 }, // Será ajustado pelo layout radial
      data: {
        category: 'mindmap' as const,
        label: 'Nova Ideia',
        level: Math.min(data.level + 1, 4) as MindMapLevel,
        color: data.color,
        keywords: [],
        connections: []
      },
      category: 'mindmap' as const
    };
    
    await addNode(newNode);
    
    // Atualizar o nó atual para incluir a nova conexão
    const updatedConnections = [...(data.connections || []), `new-node-${Date.now()}`];
    await updateNode(id, {
      data: {
        ...data,
        connections: updatedConnections
      }
    });
  }, [addNode, updateNode, id, data]);

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

  const level = data.level as MindMapLevel;
  const levelStyles = getLevelStyles(level);
  const levelIcon = getLevelIcon(level);
  const levelName = getLevelName(level);
  const shapeClass = getShapeClass(level);
  const connectionCount = data.connections?.length || 0;
  const keywordCount = data.keywords?.length || 0;

  // Determinar posições dos handles baseado no nível
  const isRootNode = level === 0;
  const canHaveChildren = level < 4;

  return (
    <BaseNode
      id={id}
      data={data}
      selected={selected}
      className={cn(
        'transition-all duration-300 transform hover:scale-105',
        selected && 'ring-4 ring-white ring-opacity-50 shadow-2xl'
      )}
      handles={{
        top: !isRootNode || canHaveChildren ? 'both' : false,
        bottom: !isRootNode || canHaveChildren ? 'both' : false,
        left: !isRootNode || canHaveChildren ? 'both' : false,
        right: !isRootNode || canHaveChildren ? 'both' : false
      }}
      {...props}
    >
      {/* Handles radiais para conexões múltiplas */}
      {(canHaveChildren || !isRootNode) && (
        <>
          <Handle
            type="source"
            position={Position.Top}
            id="top"
            className="w-2 h-2 bg-white border border-gray-300 opacity-70 hover:opacity-100"
          />
          <Handle
            type="source"
            position={Position.Right}
            id="right"
            className="w-2 h-2 bg-white border border-gray-300 opacity-70 hover:opacity-100"
          />
          <Handle
            type="source"
            position={Position.Bottom}
            id="bottom"
            className="w-2 h-2 bg-white border border-gray-300 opacity-70 hover:opacity-100"
          />
          <Handle
            type="source"
            position={Position.Left}
            id="left"
            className="w-2 h-2 bg-white border border-gray-300 opacity-70 hover:opacity-100"
          />
        </>
      )}

      {/* Handles para conexão com nó pai */}
      {!isRootNode && (
        <>
          <Handle
            type="target"
            position={Position.Top}
            id="target-top"
            className="w-2 h-2 bg-white border border-gray-300 opacity-70"
          />
          <Handle
            type="target"
            position={Position.Right}
            id="target-right"
            className="w-2 h-2 bg-white border border-gray-300 opacity-70"
          />
          <Handle
            type="target"
            position={Position.Bottom}
            id="target-bottom"
            className="w-2 h-2 bg-white border border-gray-300 opacity-70"
          />
          <Handle
            type="target"
            position={Position.Left}
            id="target-left"
            className="w-2 h-2 bg-white border border-gray-300 opacity-70"
          />
        </>
      )}

      {/* Conteúdo do nó */}
      <div className={cn(
        levelStyles,
        shapeClass,
        'border-2 shadow-lg hover:shadow-xl',
        'flex flex-col items-center justify-center p-3',
        'relative overflow-hidden'
      )}>
        {/* Efeito de brilho para nó central */}
        {isRootNode && (
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
        )}

        {/* Header com ícone e controles */}
        <div className="flex items-center justify-between w-full mb-2">
          <div className="flex items-center space-x-2">
            {levelIcon}
            <Badge 
              variant="secondary" 
              className={cn(
                'text-xs px-2 py-0.5',
                level <= 2 ? 'bg-white/30 text-white' : 'bg-white/70 text-gray-800'
              )}
            >
              {levelName}
            </Badge>
          </div>
          
          <div className="flex space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleEdit}
              className={cn(
                'h-6 w-6 p-0',
                level <= 2 ? 'hover:bg-white/20 text-white' : 'hover:bg-white/50 text-gray-800'
              )}
            >
              <Edit3 className="w-3 h-3" />
            </Button>
            
            {canHaveChildren && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleAddChild}
                className={cn(
                  'h-6 w-6 p-0',
                  level <= 2 ? 'hover:bg-white/20 text-white' : 'hover:bg-white/50 text-gray-800'
                )}
                title="Adicionar ideia"
              >
                <Plus className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Texto principal */}
        <div className="flex-1 flex items-center justify-center w-full text-center">
          {isEditing ? (
            <Input
              defaultValue={data.label}
              className={cn(
                'text-sm font-bold text-center border-0 bg-transparent',
                'focus:ring-2 focus:ring-white/50 p-1',
                level <= 2 ? 'text-white placeholder-white/70' : 'text-gray-800'
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
            <h3 className={cn(
              'font-bold leading-tight break-words',
              level === 0 ? 'text-lg' : level === 1 ? 'text-base' : 'text-sm'
            )}>
              {data.label}
            </h3>
          )}
        </div>

        {/* Descrição (se houver) */}
        {data.description && (
          <div className={cn(
            'mt-2 text-xs text-center opacity-90',
            level <= 2 ? 'text-white' : 'text-gray-700'
          )}>
            {data.description}
          </div>
        )}

        {/* Keywords */}
        {keywordCount > 0 && (
          <div className="mt-2 w-full">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className={cn(
                'flex items-center space-x-1 text-xs font-medium mb-1',
                level <= 2 ? 'text-white hover:text-white/80' : 'text-gray-700 hover:text-gray-600'
              )}
            >
              {isExpanded ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
              <Hash className="w-3 h-3" />
              <span>{keywordCount} palavra{keywordCount !== 1 ? 's' : ''}-chave</span>
            </button>
            
            {isExpanded && (
              <div className="flex flex-wrap gap-1">
                {data.keywords?.slice(0, 4).map((keyword, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className={cn(
                      'text-xs px-1.5 py-0.5',
                      level <= 2 
                        ? 'bg-white/20 text-white border-white/30' 
                        : 'bg-white/70 text-gray-800 border-gray-300'
                    )}
                  >
                    {keyword}
                  </Badge>
                ))}
                {keywordCount > 4 && (
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-xs px-1.5 py-0.5',
                      level <= 2 
                        ? 'bg-white/20 text-white border-white/30' 
                        : 'bg-white/70 text-gray-800 border-gray-300'
                    )}
                  >
                    +{keywordCount - 4}
                  </Badge>
                )}
              </div>
            )}
          </div>
        )}

        {/* Contador de conexões */}
        <div className={cn(
          'mt-2 flex items-center space-x-1 text-xs',
          level <= 2 ? 'text-white/90' : 'text-gray-600'
        )}>
          <Link className="w-3 h-3" />
          <span>
            {connectionCount} conexõe{connectionCount !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Indicador de cor personalizada */}
        {data.color && (
          <div 
            className="absolute top-1 left-1 w-3 h-3 rounded-full border border-white/50"
            style={{ backgroundColor: data.color }}
            title={`Cor: ${data.color}`}
          />
        )}

        {/* Indicador de prioridade (se houver) */}
        {data.priority && (
          <div className="absolute top-1 right-1">
            <Star 
              className={cn(
                'w-3 h-3',
                data.priority === 'high' ? 'text-yellow-300 fill-yellow-300' :
                data.priority === 'medium' ? 'text-yellow-400' :
                'text-gray-400'
              )}
            />
          </div>
        )}
      </div>
    </BaseNode>
  );
});

MindMapNode.displayName = 'MindMapNode';

export default MindMapNode;