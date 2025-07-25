import React, { CSSProperties } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import { useDragDrop } from './DragDropProvider';
import { DragDropItemData } from './types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  GripVertical, 
  Eye, 
  EyeOff, 
  Lock, 
  Unlock, 
  Copy, 
  Trash2,
  MoreVertical
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface DragDropItemProps {
  item: DragDropItemData;
  containerId: string;
  sortable?: boolean;
  style?: CSSProperties;
  className?: string;
  showControls?: boolean;
  onEdit?: (item: DragDropItemData) => void;
  onDelete?: (itemId: string) => void;
  onDuplicate?: (item: DragDropItemData) => void;
}

export const DragDropItem: React.FC<DragDropItemProps> = ({
  item,
  containerId,
  sortable = false,
  style,
  className,
  showControls = true,
  onEdit,
  onDelete,
  onDuplicate
}) => {
  const {
    selectedItems,
    selectItem,
    toggleItemSelection,
    updateItem,
    duplicateItem,
    deleteItem,
    snapToGrid,
    gridSize
  } = useDragDrop();

  const isSelected = selectedItems.includes(item.id);
  const isVisible = item.visible !== false;
  const isLocked = item.locked === true;

  // Use sortable for grid/list layouts, draggable for free positioning
  const sortableProps = useSortable({
    id: item.id,
    disabled: isLocked || !sortable,
    data: {
      type: 'item',
      item,
      containerId
    }
  });

  const draggableProps = useDraggable({
    id: item.id,
    disabled: isLocked || sortable,
    data: {
      type: 'item',
      item,
      containerId
    }
  });

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = sortable ? sortableProps : draggableProps;

  const transformStyle = CSS.Transform.toString(transform);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (e.ctrlKey || e.metaKey) {
      toggleItemSelection(item.id);
    } else {
      selectItem(item.id);
    }
  };

  const handleToggleVisibility = () => {
    updateItem(item.id, { visible: !isVisible });
  };

  const handleToggleLock = () => {
    updateItem(item.id, { locked: !isLocked });
  };

  const handleDuplicate = () => {
    if (onDuplicate) {
      onDuplicate(item);
    } else {
      duplicateItem(item.id);
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(item.id);
    } else {
      deleteItem(item.id);
    }
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(item);
    }
  };

  const combinedStyle: CSSProperties = {
    ...style,
    transform: transformStyle,
    transition,
    opacity: isDragging ? 0.5 : isVisible ? 1 : 0.3,
    zIndex: isDragging ? 1000 : item.zIndex || 1
  };

  // Snap to grid for free positioning
  if (!sortable && snapToGrid && item.position) {
    const snappedX = Math.round(item.position.x / gridSize) * gridSize;
    const snappedY = Math.round(item.position.y / gridSize) * gridSize;
    
    if (combinedStyle.left !== undefined) {
      combinedStyle.left = snappedX;
    }
    if (combinedStyle.top !== undefined) {
      combinedStyle.top = snappedY;
    }
  }

  const renderContent = () => {
    switch (item.type) {
      case 'text':
        return (
          <div className="p-3">
            <p className="text-sm font-medium">{item.content?.title || 'Texto'}</p>
            {item.content?.description && (
              <p className="text-xs text-muted-foreground mt-1">
                {item.content.description}
              </p>
            )}
          </div>
        );
      
      case 'image':
        return (
          <div className="p-3">
            <div className="w-full h-20 bg-gray-100 rounded flex items-center justify-center mb-2">
              {item.content?.url ? (
                <img 
                  src={item.content.url} 
                  alt={item.content.alt || 'Imagem'}
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <span className="text-xs text-gray-500">Imagem</span>
              )}
            </div>
            <p className="text-xs text-center">
              {item.content?.title || 'Imagem'}
            </p>
          </div>
        );
      
      case 'button':
        return (
          <div className="p-3">
            <Button 
              variant={item.content?.variant as any || 'default'}
              size="sm"
              className="w-full"
              disabled
            >
              {item.content?.title || 'Botão'}
            </Button>
          </div>
        );
      
      case 'card':
        return (
          <div className="p-3">
            <div className="border rounded p-2">
              <h4 className="text-sm font-medium">
                {item.content?.title || 'Card'}
              </h4>
              {item.content?.description && (
                <p className="text-xs text-muted-foreground mt-1">
                  {item.content.description}
                </p>
              )}
            </div>
          </div>
        );
      
      default:
        return (
          <div className="p-3">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-300 rounded" />
              <span className="text-sm">{item.type}</span>
            </div>
            {item.content?.title && (
              <p className="text-xs text-muted-foreground mt-1">
                {item.content.title}
              </p>
            )}
          </div>
        );
    }
  };

  return (
    <Card
      ref={setNodeRef}
      style={combinedStyle}
      className={cn(
        'relative cursor-pointer transition-all duration-200 group',
        'hover:shadow-md',
        isSelected && 'ring-2 ring-blue-500 ring-opacity-50 shadow-lg',
        isDragging && 'shadow-xl rotate-2',
        isLocked && 'cursor-not-allowed',
        !isVisible && 'opacity-30',
        sortable ? 'w-full' : 'w-32 min-w-32',
        className
      )}
      onClick={handleClick}
      {...attributes}
    >
      {/* Drag Handle */}
      {!isLocked && (
        <div
          className={cn(
            'absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity',
            'cursor-grab active:cursor-grabbing z-10'
          )}
          {...listeners}
        >
          <GripVertical className="h-4 w-4 text-gray-400" />
        </div>
      )}

      {/* Item Type Badge */}
      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <Badge variant="secondary" className="text-xs px-1 py-0">
          {item.type}
        </Badge>
      </div>

      {/* Status Indicators */}
      <div className="absolute bottom-1 left-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        {isLocked && (
          <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
            <Lock className="h-2 w-2 text-white" />
          </div>
        )}
        {!isVisible && (
          <div className="w-4 h-4 bg-gray-500 rounded-full flex items-center justify-center">
            <EyeOff className="h-2 w-2 text-white" />
          </div>
        )}
      </div>

      {/* Controls Menu */}
      {showControls && (
        <div className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 bg-white shadow-sm"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {onEdit && (
                <DropdownMenuItem onClick={handleEdit}>
                  Editar
                </DropdownMenuItem>
              )}
              
              <DropdownMenuItem onClick={handleDuplicate}>
                <Copy className="h-4 w-4 mr-2" />
                Duplicar
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem onClick={handleToggleVisibility}>
                {isVisible ? (
                  <>
                    <EyeOff className="h-4 w-4 mr-2" />
                    Ocultar
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    Mostrar
                  </>
                )}
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={handleToggleLock}>
                {isLocked ? (
                  <>
                    <Unlock className="h-4 w-4 mr-2" />
                    Desbloquear
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4 mr-2" />
                    Bloquear
                  </>
                )}
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem 
                onClick={handleDelete}
                className="text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      <CardContent className="p-0">
        {renderContent()}
      </CardContent>

      {/* Selection Indicator */}
      {isSelected && (
        <div className="absolute inset-0 border-2 border-blue-500 rounded pointer-events-none" />
      )}
    </Card>
  );
};