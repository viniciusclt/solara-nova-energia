// ============================================================================
// BaseNode - Componente base para todos os tipos de nós de diagrama
// ============================================================================

import React, { useCallback, useState, memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Edit3, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDiagramStore } from '../stores/useDiagramStore';
import { secureLogger } from '@/utils/secureLogger';
import { NodeData } from '../types';
import { AccessibleNode } from '../accessibility';

// ============================================================================
// Types
// ============================================================================

export interface BaseNodeProps {
  id: string;
  data: NodeData;
  selected: boolean;
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  handles?: {
    top?: boolean | 'target' | 'source';
    right?: boolean | 'target' | 'source';
    bottom?: boolean | 'target' | 'source';
    left?: boolean | 'target' | 'source';
  };
  shape?: 'rectangle' | 'diamond' | 'circle' | 'hexagon' | 'ellipse' | 'rounded';
  size?: 'small' | 'medium' | 'large' | 'auto';
  variant?: 'default' | 'outlined' | 'filled' | 'minimal';
  editable?: boolean;
  deletable?: boolean;
  showToolbar?: boolean;
  onEdit?: (id: string, data: NodeData) => void;
  onDelete?: (id: string) => void;
  onDoubleClick?: (id: string) => void;
}

// ============================================================================
// Utilitários
// ============================================================================

const getSizeClasses = (size: BaseNodeProps['size']) => {
  switch (size) {
    case 'small':
      return 'min-w-[80px] min-h-[40px] text-xs';
    case 'medium':
      return 'min-w-[120px] min-h-[60px] text-sm';
    case 'large':
      return 'min-w-[160px] min-h-[80px] text-base';
    case 'auto':
      return 'w-auto h-auto';
    default:
      return 'min-w-[120px] min-h-[60px] text-sm';
  }
};

const getShapeClasses = (shape: BaseNodeProps['shape']) => {
  switch (shape) {
    case 'diamond':
      return 'transform rotate-45';
    case 'circle':
      return 'rounded-full aspect-square';
    case 'ellipse':
      return 'rounded-full';
    case 'hexagon':
      return 'clip-path-hexagon';
    case 'rounded':
      return 'rounded-xl';
    default:
      return 'rounded-lg';
  }
};

const getVariantClasses = (variant: BaseNodeProps['variant'], selected: boolean) => {
  const baseClasses = 'border-2 transition-all duration-200';
  
  switch (variant) {
    case 'outlined':
      return cn(
        baseClasses,
        'bg-transparent border-gray-400',
        'hover:border-blue-400',
        selected && 'border-blue-500 shadow-lg'
      );
    case 'filled':
      return cn(
        baseClasses,
        'bg-gray-100 border-gray-300',
        'hover:bg-gray-50 hover:border-blue-400',
        selected && 'border-blue-500 shadow-lg bg-blue-50'
      );
    case 'minimal':
      return cn(
        'border border-gray-200',
        'hover:border-gray-300',
        selected && 'border-blue-400 shadow-md'
      );
    default:
      return cn(
        baseClasses,
        'bg-white border-gray-300',
        'hover:border-blue-400',
        selected && 'border-blue-500 shadow-lg'
      );
  }
};

const getHandleType = (handleConfig: boolean | 'target' | 'source'): 'target' | 'source' => {
  if (typeof handleConfig === 'string') {
    return handleConfig;
  }
  return 'target'; // default
};

// ============================================================================
// Componente Principal
// ============================================================================

export const BaseNode: React.FC<BaseNodeProps> = memo(({
  id,
  data,
  selected,
  children,
  className,
  style,
  handles = { top: true, right: true, bottom: true, left: true },
  shape = 'rectangle',
  size = 'medium',
  variant = 'default',
  editable = true,
  deletable = true,
  showToolbar = true,
  onEdit,
  onDelete,
  onDoubleClick
}) => {
  const { updateNode, deleteNode } = useDiagramStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(data.label || '');

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleLabelEdit = useCallback(() => {
    if (!editable) return;
    setIsEditing(true);
    setEditValue(data.label || '');
  }, [data.label, editable]);

  const handleLabelSave = useCallback(async () => {
    const updatedData = { ...data, label: editValue };
    
    if (onEdit) {
      onEdit(id, updatedData);
    } else {
      await updateNode(id, { data: updatedData });
    }
    
    setIsEditing(false);
    secureLogger.info('Label do nó atualizado', { nodeId: id, newLabel: editValue });
  }, [id, data, editValue, updateNode, onEdit]);

  const handleLabelCancel = useCallback(() => {
    setEditValue(data.label || '');
    setIsEditing(false);
  }, [data.label]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLabelSave();
    } else if (e.key === 'Escape') {
      handleLabelCancel();
    }
  }, [handleLabelSave, handleLabelCancel]);

  const handleDelete = useCallback(async () => {
    if (!deletable) return;
    
    if (onDelete) {
      onDelete(id);
    } else {
      await deleteNode(id);
    }
    
    secureLogger.info('Nó deletado', { nodeId: id });
  }, [id, deleteNode, onDelete, deletable]);

  const handleNodeDoubleClick = useCallback(() => {
    if (onDoubleClick) {
      onDoubleClick(id);
    } else {
      handleLabelEdit();
    }
  }, [id, onDoubleClick, handleLabelEdit]);

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <AccessibleNode
      id={id}
      data={data}
      selected={selected}
      onEdit={onEdit}
      onDelete={onDelete}
      onDoubleClick={onDoubleClick}
      editable={editable}
      deletable={deletable}
    >
      <div
        className={cn(
          'relative group',
          getSizeClasses(size),
          getShapeClasses(shape),
          getVariantClasses(variant, selected),
          className
        )}
        style={{
          backgroundColor: data.color,
          borderColor: data.borderColor,
          color: data.textColor,
          ...style
        }}
        onDoubleClick={handleNodeDoubleClick}
      >
      {/* Handles */}
      {handles.top && (
        <Handle
          type={getHandleType(handles.top)}
          position={Position.Top}
          className="w-3 h-3 bg-blue-500 border-2 border-white hover:bg-blue-600 transition-colors"
        />
      )}
      {handles.right && (
        <Handle
          type={getHandleType(handles.right)}
          position={Position.Right}
          className="w-3 h-3 bg-blue-500 border-2 border-white hover:bg-blue-600 transition-colors"
        />
      )}
      {handles.bottom && (
        <Handle
          type={getHandleType(handles.bottom)}
          position={Position.Bottom}
          className="w-3 h-3 bg-blue-500 border-2 border-white hover:bg-blue-600 transition-colors"
        />
      )}
      {handles.left && (
        <Handle
          type={getHandleType(handles.left)}
          position={Position.Left}
          className="w-3 h-3 bg-blue-500 border-2 border-white hover:bg-blue-600 transition-colors"
        />
      )}

      {/* Conteúdo */}
      <div className="p-3 flex items-center justify-center h-full w-full">
        <div className="flex items-center gap-2 w-full">
          {children && (
            <div className="flex-shrink-0">
              {children}
            </div>
          )}
          <div className="flex-1 text-center min-w-0">
            {isEditing ? (
              <Input
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={handleLabelSave}
                onKeyDown={handleKeyDown}
                className="h-6 text-xs text-center border-none p-0 focus:ring-0 bg-transparent"
                autoFocus
              />
            ) : (
              <span
                className={cn(
                  'font-medium cursor-pointer hover:text-blue-600 transition-colors',
                  'block truncate',
                  editable && 'hover:underline'
                )}
                title={data.description || data.label}
              >
                {data.label || 'Sem título'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Toolbar de Ações (visível no hover) */}
      {showToolbar && selected && (editable || deletable) && (
        <div className="absolute -top-8 right-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          {editable && (
            <Button
              size="sm"
              variant="outline"
              className="h-6 w-6 p-0 bg-white shadow-sm"
              onClick={handleLabelEdit}
              title="Editar"
            >
              <Edit3 className="h-3 w-3" />
            </Button>
          )}
          {deletable && (
            <Button
              size="sm"
              variant="outline"
              className="h-6 w-6 p-0 text-red-600 hover:text-red-700 bg-white shadow-sm"
              onClick={handleDelete}
              title="Deletar"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      )}
      </div>
    </AccessibleNode>
  );
});

// ============================================================================
// Wrapper para compatibilidade com ReactFlow
// ============================================================================

export const createNodeComponent = <T extends NodeData>(
  Component: React.ComponentType<BaseNodeProps & { data: T }>
) => {
  return React.memo<NodeProps<T>>((props) => {
    return (
      <Component
        id={props.id}
        data={props.data}
        selected={props.selected || false}
        {...props}
      />
    );
  });
};

export default BaseNode;