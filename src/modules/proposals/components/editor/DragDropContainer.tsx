import React, { useRef, useEffect } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import { cn } from '@/lib/utils';
import { useDragDrop } from './DragDropProvider';
import { DragDropItem } from './DragDropItem';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Grid3X3, 
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  MoreVertical,
  Plus,
  Trash2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface DragDropContainerProps {
  containerId: string;
  title?: string;
  description?: string;
  className?: string;
  showHeader?: boolean;
  showGrid?: boolean;
  allowReorder?: boolean;
  onAddItem?: () => void;
  onRemoveContainer?: () => void;
}

export const DragDropContainer: React.FC<DragDropContainerProps> = ({
  containerId,
  title,
  description,
  className,
  showHeader = true,
  showGrid: showGridProp,
  allowReorder = true,
  onAddItem,
  onRemoveContainer
}) => {
  const {
    containers,
    selectedItems,
    showGrid: globalShowGrid,
    gridSize,
    snapToGrid,
    distributeItems,
    alignItems,
    clearSelection
  } = useDragDrop();
  
  const containerRef = useRef<HTMLDivElement>(null);
  const container = containers.find(c => c.id === containerId);
  const showGrid = showGridProp ?? globalShowGrid;
  
  const { isOver, setNodeRef } = useDroppable({
    id: containerId,
    data: {
      type: 'container',
      containerId
    }
  });

  if (!container) {
    return (
      <Card className={cn('border-dashed border-2 border-gray-300', className)}>
        <CardContent className="flex items-center justify-center h-32">
          <p className="text-gray-500">Container não encontrado</p>
        </CardContent>
      </Card>
    );
  }

  const handleDistribute = (distribution: 'horizontal' | 'vertical' | 'grid') => {
    distributeItems(containerId, distribution);
  };

  const handleAlign = (alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
    const containerItems = selectedItems.filter(itemId => 
      container.items.some(item => item.id === itemId)
    );
    if (containerItems.length > 0) {
      alignItems(containerItems, alignment);
    }
  };

  const selectedItemsInContainer = selectedItems.filter(itemId => 
    container.items.some(item => item.id === itemId)
  );

  const gridStyle = showGrid ? {
    backgroundImage: `
      linear-gradient(to right, rgba(0,0,0,0.1) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(0,0,0,0.1) 1px, transparent 1px)
    `,
    backgroundSize: `${gridSize}px ${gridSize}px`
  } : {};

  return (
    <Card 
      className={cn(
        'relative transition-all duration-200',
        isOver && 'ring-2 ring-blue-500 ring-opacity-50',
        container.layout === 'free' && 'overflow-hidden',
        className
      )}
    >
      {showHeader && (
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg">
                  {title || container.id}
                </CardTitle>
                <Badge variant="outline">
                  {container.items.length}
                  {container.maxItems && `/${container.maxItems}`}
                </Badge>
                {container.acceptedTypes && (
                  <Badge variant="secondary" className="text-xs">
                    {container.acceptedTypes.join(', ')}
                  </Badge>
                )}
              </div>
              {description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {description}
                </p>
              )}
            </div>
            
            <div className="flex items-center gap-1">
              {onAddItem && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onAddItem}
                  className="h-8 w-8 p-0"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              )}
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {container.items.length > 1 && (
                    <>
                      <DropdownMenuItem onClick={() => handleDistribute('horizontal')}>
                        Distribuir Horizontalmente
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDistribute('vertical')}>
                        Distribuir Verticalmente
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDistribute('grid')}>
                        <Grid3X3 className="h-4 w-4 mr-2" />
                        Distribuir em Grade
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  
                  {selectedItemsInContainer.length > 1 && (
                    <>
                      <DropdownMenuItem onClick={() => handleAlign('left')}>
                        <AlignLeft className="h-4 w-4 mr-2" />
                        Alinhar à Esquerda
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleAlign('center')}>
                        <AlignCenter className="h-4 w-4 mr-2" />
                        Alinhar ao Centro
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleAlign('right')}>
                        <AlignRight className="h-4 w-4 mr-2" />
                        Alinhar à Direita
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleAlign('top')}>
                        <AlignVerticalJustifyStart className="h-4 w-4 mr-2" />
                        Alinhar ao Topo
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleAlign('middle')}>
                        <AlignVerticalJustifyCenter className="h-4 w-4 mr-2" />
                        Alinhar ao Meio
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleAlign('bottom')}>
                        <AlignVerticalJustifyEnd className="h-4 w-4 mr-2" />
                        Alinhar à Base
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  
                  <DropdownMenuItem onClick={clearSelection}>
                    Limpar Seleção
                  </DropdownMenuItem>
                  
                  {onRemoveContainer && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={onRemoveContainer}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remover Container
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
      )}
      
      <CardContent 
        ref={setNodeRef}
        className={cn(
          'relative min-h-32 transition-colors duration-200',
          isOver && 'bg-blue-50',
          container.layout === 'free' && 'relative'
        )}
        style={gridStyle}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            clearSelection();
          }
        }}
      >
        {container.layout === 'free' ? (
          // Free positioning layout
          <div className="relative w-full h-full min-h-64">
            {container.items.map((item) => (
              <DragDropItem
                key={item.id}
                item={item}
                containerId={containerId}
                style={{
                  position: 'absolute',
                  left: item.position?.x || 0,
                  top: item.position?.y || 0,
                  zIndex: item.zIndex || 1
                }}
              />
            ))}
          </div>
        ) : (
          // Sortable layout
          <SortableContext 
            items={container.items.map(item => item.id)}
            strategy={rectSortingStrategy}
            disabled={!allowReorder}
          >
            <div className={cn(
              'gap-2',
              container.layout === 'horizontal' && 'flex flex-row flex-wrap',
              container.layout === 'vertical' && 'flex flex-col',
              container.layout === 'grid' && 'grid grid-cols-3'
            )}>
              {container.items.map((item) => (
                <DragDropItem
                  key={item.id}
                  item={item}
                  containerId={containerId}
                  sortable={allowReorder}
                />
              ))}
            </div>
          </SortableContext>
        )}
        
        {container.items.length === 0 && (
          <div className="flex items-center justify-center h-32 text-gray-500">
            <div className="text-center">
              <p className="text-sm">Nenhum item</p>
              <p className="text-xs text-gray-400 mt-1">
                Arraste itens para cá
              </p>
            </div>
          </div>
        )}
        
        {/* Visual feedback for constraints */}
        {isOver && container.maxItems && container.items.length >= container.maxItems && (
          <div className="absolute inset-0 bg-red-100 bg-opacity-50 flex items-center justify-center">
            <div className="bg-red-500 text-white px-3 py-1 rounded text-sm font-medium">
              Container cheio ({container.maxItems} itens máximo)
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};