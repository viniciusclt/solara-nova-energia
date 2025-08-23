// ============================================================================
// MindMap Nodes - Componentes de nós para mapas mentais
// ============================================================================

import React, { memo, useCallback } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import {
  Brain,
  GitBranch,
  Leaf,
  Edit3,
  Trash2,
  Plus,
  Lightbulb
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { secureLogger } from '@/utils/secureLogger';
import { useDiagramStore } from '../../stores/useDiagramStore';
import { BaseNode, createNodeComponent } from '../BaseNode';

// ============================================================================
// Tipos e Interfaces
// ============================================================================

interface MindMapNodeData {
  label: string;
  level: number; // 0 = root, 1 = branch, 2+ = leaf
  color?: string;
  description?: string;
  editable?: boolean;
  collapsed?: boolean;
  tags?: string[];
  priority?: 'low' | 'medium' | 'high';
}

interface MindMapNodeProps extends NodeProps {
  data: MindMapNodeData;
}

// ============================================================================
// Configurações de Cores por Nível
// ============================================================================

const LEVEL_COLORS = {
  0: { bg: 'bg-gradient-to-br from-purple-400 to-purple-600', text: 'text-white', border: 'border-purple-500' },
  1: { bg: 'bg-gradient-to-br from-blue-300 to-blue-500', text: 'text-white', border: 'border-blue-400' },
  2: { bg: 'bg-gradient-to-br from-green-300 to-green-500', text: 'text-white', border: 'border-green-400' },
  3: { bg: 'bg-gradient-to-br from-yellow-300 to-yellow-500', text: 'text-gray-800', border: 'border-yellow-400' },
  default: { bg: 'bg-gradient-to-br from-gray-300 to-gray-500', text: 'text-white', border: 'border-gray-400' }
};

const PRIORITY_COLORS = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-red-100 text-red-800'
};

// ============================================================================
// Componente Base para Nós de Mapa Mental
// ============================================================================

interface MindMapNodeProps {
  id: string;
  data: MindMapNodeData;
  selected: boolean;
  children: React.ReactNode;
  className?: string;
  size?: 'small' | 'medium' | 'large';
}

const MindMapNode: React.FC<MindMapNodeProps> = memo(({
  id,
  data,
  selected,
  children,
  className,
  level = 0
}) => {
  const levelColors = LEVEL_COLORS[level as keyof typeof LEVEL_COLORS] || LEVEL_COLORS.default;
  
  const getHandles = () => {
    if (level === 0) {
      // Nó raiz - handles em todas as direções
      return {
        top: 'source' as const,
        right: 'source' as const,
        bottom: 'source' as const,
        left: 'source' as const
      };
    } else {
      // Nós filhos - handle de entrada e saída
      return {
        left: 'target' as const,
        right: 'source' as const
      };
    }
  };

  const getSize = () => {
    if (level === 0) return 'large';
    if (level === 1) return 'medium';
    return 'small';
  };

  return (
    <BaseNode
      id={id}
      data={data}
      selected={selected}
      handles={getHandles()}
      shape="circle"
      size={getSize()}
      className={cn(
        levelColors.bg,
        levelColors.border,
        'hover:scale-105 transition-transform',
        className
      )}
      style={{ backgroundColor: data.color }}
      editable
      deletable={level > 0}
    >
      <div className="flex items-center gap-2">
        {children}
        <div className="flex-1 text-center">
          <span className={cn('font-medium', levelColors.text)}>
            {data.label}
          </span>
          
          {/* Tags */}
          {data.tags && data.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 justify-center mt-1">
              {data.tags.slice(0, 2).map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs px-1 py-0">
                  {tag}
                </Badge>
              ))}
              {data.tags.length > 2 && (
                <Badge variant="secondary" className="text-xs px-1 py-0">
                  +{data.tags.length - 2}
                </Badge>
              )}
            </div>
          )}
          
          {/* Prioridade */}
          {data.priority && (
            <Badge 
              variant="outline" 
              className={cn('text-xs mt-1', PRIORITY_COLORS[data.priority])}
            >
              {data.priority}
            </Badge>
          )}
        </div>
      </div>
    </BaseNode>
  );
});

MindMapNode.displayName = 'MindMapNode';

// ============================================================================
// Nó Raiz do Mapa Mental
// ============================================================================

const RootNode: React.FC<MindMapNodeProps> = memo(({ id, data, selected }) => {
  return (
    <MindMapNode
      id={id}
      data={data}
      selected={selected}
      level={0}
    >
      <Brain className="h-6 w-6 text-white" />
    </MindMapNode>
  );
});

RootNode.displayName = 'MindMapRootNode';

// ============================================================================
// Nó de Ramo do Mapa Mental
// ============================================================================

const BranchNode: React.FC<MindMapNodeProps> = memo(({ id, data, selected }) => {
  return (
    <MindMapNode
      id={id}
      data={data}
      selected={selected}
      level={1}
    >
      <GitBranch className="h-4 w-4 text-white" />
    </MindMapNode>
  );
});

BranchNode.displayName = 'MindMapBranchNode';

// ============================================================================
// Nó Folha do Mapa Mental
// ============================================================================

const LeafNode: React.FC<MindMapNodeProps> = memo(({ id, data, selected }) => {
  return (
    <MindMapNode
      id={id}
      data={data}
      selected={selected}
      level={2}
    >
      <Leaf className="h-3 w-3 text-white" />
    </MindMapNode>
  );
});

LeafNode.displayName = 'MindMapLeafNode';

// ============================================================================
// Nó de Ideia (Variação do Leaf)
// ============================================================================

const IdeaNode: React.FC<MindMapNodeProps> = memo(({ id, data, selected }) => {
  return (
    <MindMapNode
      id={id}
      data={data}
      selected={selected}
      level={2}
      className="border-dashed"
    >
      <Lightbulb className="h-3 w-3 text-yellow-300" />
    </MindMapNode>
  );
});

IdeaNode.displayName = 'MindMapIdeaNode';

// ============================================================================
// Exports
// ============================================================================

export const MindMapNodes = {
  RootNode,
  BranchNode,
  LeafNode,
  IdeaNode
};

export {
  RootNode,
  BranchNode,
  LeafNode,
  IdeaNode
};

export type {
  MindMapNodeData,
  MindMapNodeProps
};