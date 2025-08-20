import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useDrag } from 'react-dnd';
import { ProposalElement, Position, Size } from '@/types/proposal';
import { cn } from '@/lib/utils';
import {
  RotateCw,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Copy,
  Trash2,
  Move,
  MoreHorizontal
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

interface DraggableElementProps {
  element: ProposalElement;
  isSelected: boolean;
  readOnly?: boolean;
  zoom: number;
  onSelect: (id: string, multiSelect: boolean) => void;
  onUpdate: (id: string, updates: Partial<ProposalElement>) => void;
  onMove: (id: string, delta: Position) => void;
  onResize: (id: string, newSize: Size, newPosition?: Position) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
}

type ResizeHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

interface ResizeState {
  isResizing: boolean;
  handle: ResizeHandle | null;
  startPosition: Position;
  startSize: Size;
  startElementPosition: Position;
}

const DraggableElement: React.FC<DraggableElementProps> = ({
  element,
  isSelected,
  readOnly = false,
  zoom,
  onSelect,
  onUpdate,
  onMove,
  onResize,
  onDelete,
  onDuplicate
}) => {
  const elementRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [resizeState, setResizeState] = useState<ResizeState>({
    isResizing: false,
    handle: null,
    startPosition: { x: 0, y: 0 },
    startSize: { width: 0, height: 0 },
    startElementPosition: { x: 0, y: 0 }
  });
  const [showContextMenu, setShowContextMenu] = useState(false);

  // Drag functionality
  const [{ isDragActive }, drag] = useDrag({
    type: 'ELEMENT_MOVE',
    item: { id: element.id, type: 'move' },
    canDrag: !readOnly && !element.locked,
    collect: (monitor) => ({
      isDragActive: monitor.isDragging()
    }),
    end: (item, monitor) => {
      const delta = monitor.getDifferenceFromInitialOffset();
      if (delta) {
        onMove(element.id, {
          x: delta.x / (zoom / 100),
          y: delta.y / (zoom / 100)
        });
      }
      setIsDragging(false);
    }
  });

  // Handle element selection
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(element.id, e.ctrlKey || e.metaKey);
  }, [element.id, onSelect]);

  // Handle context menu
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!readOnly) {
      setShowContextMenu(true);
    }
  }, [readOnly]);

  // Resize functionality
  const startResize = useCallback((handle: ResizeHandle, e: React.MouseEvent) => {
    if (readOnly || element.locked) return;
    
    e.stopPropagation();
    e.preventDefault();
    
    setResizeState({
      isResizing: true,
      handle,
      startPosition: { x: e.clientX, y: e.clientY },
      startSize: element.size,
      startElementPosition: element.position
    });
  }, [readOnly, element.locked, element.size, element.position]);

  const handleResize = useCallback((e: MouseEvent) => {
    if (!resizeState.isResizing || !resizeState.handle) return;
    
    const deltaX = (e.clientX - resizeState.startPosition.x) / (zoom / 100);
    const deltaY = (e.clientY - resizeState.startPosition.y) / (zoom / 100);
    
    const newSize = { ...resizeState.startSize };
    const newPosition = { ...resizeState.startElementPosition };
    
    switch (resizeState.handle) {
      case 'nw':
        newSize.width = Math.max(20, resizeState.startSize.width - deltaX);
        newSize.height = Math.max(20, resizeState.startSize.height - deltaY);
        newPosition.x = resizeState.startElementPosition.x + deltaX;
        newPosition.y = resizeState.startElementPosition.y + deltaY;
        break;
      case 'n':
        newSize.height = Math.max(20, resizeState.startSize.height - deltaY);
        newPosition.y = resizeState.startElementPosition.y + deltaY;
        break;
      case 'ne':
        newSize.width = Math.max(20, resizeState.startSize.width + deltaX);
        newSize.height = Math.max(20, resizeState.startSize.height - deltaY);
        newPosition.y = resizeState.startElementPosition.y + deltaY;
        break;
      case 'e':
        newSize.width = Math.max(20, resizeState.startSize.width + deltaX);
        break;
      case 'se':
        newSize.width = Math.max(20, resizeState.startSize.width + deltaX);
        newSize.height = Math.max(20, resizeState.startSize.height + deltaY);
        break;
      case 's':
        newSize.height = Math.max(20, resizeState.startSize.height + deltaY);
        break;
      case 'sw':
        newSize.width = Math.max(20, resizeState.startSize.width - deltaX);
        newSize.height = Math.max(20, resizeState.startSize.height + deltaY);
        newPosition.x = resizeState.startElementPosition.x + deltaX;
        break;
      case 'w':
        newSize.width = Math.max(20, resizeState.startSize.width - deltaX);
        newPosition.x = resizeState.startElementPosition.x + deltaX;
        break;
    }
    
    onResize(element.id, newSize, newPosition);
  }, [resizeState, zoom, onResize, element.id]);

  const stopResize = useCallback(() => {
    setResizeState(prev => ({ ...prev, isResizing: false, handle: null }));
  }, []);

  // Mouse event listeners for resize
  useEffect(() => {
    if (resizeState.isResizing) {
      document.addEventListener('mousemove', handleResize);
      document.addEventListener('mouseup', stopResize);
      document.body.style.cursor = 'nwse-resize';
      
      return () => {
        document.removeEventListener('mousemove', handleResize);
        document.removeEventListener('mouseup', stopResize);
        document.body.style.cursor = 'default';
      };
    }
  }, [resizeState.isResizing, handleResize, stopResize]);

  // Render element content based on type
  const renderElementContent = () => {
    switch (element.type) {
      case 'text':
        return (
          <div 
            className="w-full h-full p-2 overflow-hidden"
            style={{
              fontSize: element.style.fontSize || 14,
              fontFamily: element.style.fontFamily || 'inherit',
              fontWeight: element.style.fontWeight || 'normal',
              color: element.style.textColor || '#000',
              textAlign: element.style.textAlign || 'left',
              lineHeight: element.style.lineHeight || 1.4
            }}
          >
            {element.content.text || 'Clique para editar texto'}
          </div>
        );
      
      case 'image':
        return (
          <div className="w-full h-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
            {element.content.url ? (
              <img 
                src={element.content.url} 
                alt={element.content.alt || ''}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-gray-500 text-sm">Clique para adicionar imagem</span>
            )}
          </div>
        );
      
      case 'shape':
        return (
          <div 
            className="w-full h-full"
            style={{
              backgroundColor: element.style.backgroundColor || '#3b82f6',
              borderRadius: element.style.borderRadius || 0,
              border: element.style.borderWidth ? 
                `${element.style.borderWidth}px ${element.style.borderStyle || 'solid'} ${element.style.borderColor || '#000'}` : 
                'none'
            }}
          />
        );
      
      default:
        return (
          <div className="w-full h-full bg-gray-100 border border-gray-300 flex items-center justify-center">
            <span className="text-gray-500 text-sm capitalize">{element.type}</span>
          </div>
        );
    }
  };

  // Resize handles
  const renderResizeHandles = () => {
    if (!isSelected || readOnly || element.locked) return null;
    
    const handles: ResizeHandle[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];
    
    return (
      <>
        {handles.map(handle => {
          const getHandlePosition = (handle: ResizeHandle) => {
            switch (handle) {
              case 'nw': return 'top-0 left-0 -translate-x-1/2 -translate-y-1/2 cursor-nw-resize';
              case 'n': return 'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 cursor-n-resize';
              case 'ne': return 'top-0 right-0 translate-x-1/2 -translate-y-1/2 cursor-ne-resize';
              case 'e': return 'top-1/2 right-0 translate-x-1/2 -translate-y-1/2 cursor-e-resize';
              case 'se': return 'bottom-0 right-0 translate-x-1/2 translate-y-1/2 cursor-se-resize';
              case 's': return 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 cursor-s-resize';
              case 'sw': return 'bottom-0 left-0 -translate-x-1/2 translate-y-1/2 cursor-sw-resize';
              case 'w': return 'top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 cursor-w-resize';
            }
          };
          
          return (
            <div
              key={handle}
              className={cn(
                "absolute w-3 h-3 bg-blue-500 border border-white rounded-sm z-10",
                getHandlePosition(handle)
              )}
              onMouseDown={(e) => startResize(handle, e)}
            />
          );
        })}
      </>
    );
  };

  return (
    <div
      ref={(node) => {
        elementRef.current = node;
        if (!readOnly && !element.locked) {
          drag(node);
        }
      }}
      className={cn(
        "absolute select-none",
        isSelected && "ring-2 ring-blue-500 ring-opacity-50",
        isDragActive && "opacity-50",
        !element.visible && "opacity-30",
        element.locked && "cursor-not-allowed",
        !readOnly && !element.locked && "cursor-move"
      )}
      style={{
        left: element.position.x,
        top: element.position.y,
        width: element.size.width,
        height: element.size.height,
        zIndex: element.zIndex,
        transform: element.style.rotation ? `rotate(${element.style.rotation}deg)` : undefined,
        opacity: element.style.opacity || 1,
        filter: element.style.filter,
        boxShadow: element.style.boxShadow
      }}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
    >
      {/* Element Content */}
      {renderElementContent()}
      
      {/* Selection Outline */}
      {isSelected && (
        <div className="absolute inset-0 border-2 border-blue-500 pointer-events-none" />
      )}
      
      {/* Resize Handles */}
      {renderResizeHandles()}
      
      {/* Element Controls */}
      {isSelected && !readOnly && (
        <div className="absolute -top-8 left-0 flex items-center gap-1 bg-white border border-gray-300 rounded px-2 py-1 shadow-sm">
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0"
            onClick={() => onUpdate(element.id, { locked: !element.locked })}
            title={element.locked ? 'Desbloquear' : 'Bloquear'}
          >
            {element.locked ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
          </Button>
          
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0"
            onClick={() => onUpdate(element.id, { visible: !element.visible })}
            title={element.visible ? 'Ocultar' : 'Mostrar'}
          >
            {element.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                <MoreHorizontal className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => onDuplicate(element.id)}>
                <Copy className="w-4 h-4 mr-2" />
                Duplicar
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onUpdate(element.id, { 
                  style: { ...element.style, rotation: (element.style.rotation || 0) + 90 } 
                })}
              >
                <RotateCw className="w-4 h-4 mr-2" />
                Girar 90°
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => onDelete(element.id)}
                className="text-red-600"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
};

export default DraggableElement;