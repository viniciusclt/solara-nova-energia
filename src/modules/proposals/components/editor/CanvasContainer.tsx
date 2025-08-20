import React, { useRef, useCallback, useState, useEffect } from 'react';
import { useDrop } from 'react-dnd';
import { Position, Size, DocumentFormat, DocumentDimensions, DragItem, DropResult } from '@/types/proposal';
import { cn } from '@/lib/utils';

interface CanvasContainerProps {
  format: DocumentFormat;
  zoom: number;
  pan: Position;
  showGrid: boolean;
  snapToGrid: boolean;
  gridSize: number;
  showRulers: boolean;
  children: React.ReactNode;
  onDrop: (item: DragItem, position: Position) => void;
  onPanChange: (pan: Position) => void;
  onCanvasClick: (position: Position) => void;
  className?: string;
}

const DOCUMENT_DIMENSIONS: Record<DocumentFormat, DocumentDimensions> = {
  'A4': { width: 794, height: 1123 }, // 210x297mm at 96 DPI
  '16:9': { width: 1920, height: 1080 },
  'A3': { width: 1123, height: 1587 }, // 297x420mm at 96 DPI
  'Letter': { width: 816, height: 1056 }, // 8.5x11 inches at 96 DPI
  'Custom': { width: 800, height: 600 }
};

const CanvasContainer: React.FC<CanvasContainerProps> = ({
  format,
  zoom,
  pan,
  showGrid,
  snapToGrid,
  gridSize,
  showRulers,
  children,
  onDrop,
  onPanChange,
  onCanvasClick,
  className
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPosition, setLastPanPosition] = useState<Position>({ x: 0, y: 0 });

  const dimensions = DOCUMENT_DIMENSIONS[format];
  const scaledWidth = dimensions.width * (zoom / 100);
  const scaledHeight = dimensions.height * (zoom / 100);

  // Snap position to grid
  const snapPositionToGrid = useCallback((position: Position): Position => {
    if (!snapToGrid) return position;
    
    const snappedX = Math.round(position.x / gridSize) * gridSize;
    const snappedY = Math.round(position.y / gridSize) * gridSize;
    
    return { x: snappedX, y: snappedY };
  }, [snapToGrid, gridSize]);

  // Convert screen coordinates to canvas coordinates
  const screenToCanvas = useCallback((screenX: number, screenY: number): Position => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (screenX - rect.left - pan.x) / (zoom / 100);
    const y = (screenY - rect.top - pan.y) / (zoom / 100);
    
    return { x, y };
  }, [zoom, pan]);

  // Drop functionality
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: 'ELEMENT',
    drop: (item: DragItem, monitor) => {
      const offset = monitor.getClientOffset();
      if (!offset) return;
      
      const canvasPosition = screenToCanvas(offset.x, offset.y);
      const snappedPosition = snapPositionToGrid(canvasPosition);
      
      onDrop(item, snappedPosition);
      
      return { position: snappedPosition, canvasId: 'main-canvas' } as DropResult;
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop()
    })
  });

  // Pan functionality
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) { // Middle mouse or Alt+Left mouse
      e.preventDefault();
      setIsPanning(true);
      setLastPanPosition({ x: e.clientX, y: e.clientY });
    }
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isPanning) return;
    
    const deltaX = e.clientX - lastPanPosition.x;
    const deltaY = e.clientY - lastPanPosition.y;
    
    onPanChange({
      x: pan.x + deltaX,
      y: pan.y + deltaY
    });
    
    setLastPanPosition({ x: e.clientX, y: e.clientY });
  }, [isPanning, lastPanPosition, pan, onPanChange]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (e.target === canvasRef.current) {
      const position = screenToCanvas(e.clientX, e.clientY);
      onCanvasClick(position);
    }
  }, [screenToCanvas, onCanvasClick]);

  // Mouse event listeners
  useEffect(() => {
    if (isPanning) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'grabbing';
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = 'default';
      };
    }
  }, [isPanning, handleMouseMove, handleMouseUp]);

  // Grid pattern
  const gridPattern = showGrid ? {
    backgroundImage: `
      linear-gradient(to right, #e5e7eb 1px, transparent 1px),
      linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
    `,
    backgroundSize: `${gridSize * (zoom / 100)}px ${gridSize * (zoom / 100)}px`,
    backgroundPosition: `${pan.x}px ${pan.y}px`
  } : {};

  return (
    <div
      ref={containerRef}
      className={cn(
        "flex-1 overflow-hidden bg-gray-100 relative",
        className
      )}
      style={gridPattern}
    >
      {/* Rulers */}
      {showRulers && (
        <>
          {/* Horizontal Ruler */}
          <div className="absolute top-0 left-8 right-0 h-8 bg-gray-200 border-b border-gray-300 z-10">
            <div 
              className="relative h-full"
              style={{
                transform: `translateX(${pan.x}px)`,
                width: scaledWidth
              }}
            >
              {Array.from({ length: Math.ceil(dimensions.width / 50) + 1 }, (_, i) => (
                <div
                  key={i}
                  className="absolute top-0 h-full border-l border-gray-400"
                  style={{
                    left: i * 50 * (zoom / 100),
                    fontSize: '10px'
                  }}
                >
                  <span className="absolute top-1 left-1 text-xs text-gray-600">
                    {i * 50}
                  </span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Vertical Ruler */}
          <div className="absolute top-8 left-0 bottom-0 w-8 bg-gray-200 border-r border-gray-300 z-10">
            <div 
              className="relative w-full"
              style={{
                transform: `translateY(${pan.y}px)`,
                height: scaledHeight
              }}
            >
              {Array.from({ length: Math.ceil(dimensions.height / 50) + 1 }, (_, i) => (
                <div
                  key={i}
                  className="absolute left-0 w-full border-t border-gray-400"
                  style={{
                    top: i * 50 * (zoom / 100),
                    fontSize: '10px'
                  }}
                >
                  <span 
                    className="absolute top-1 left-1 text-xs text-gray-600 transform -rotate-90 origin-top-left"
                    style={{ width: '20px' }}
                  >
                    {i * 50}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
      
      {/* Canvas Area */}
      <div
        className={cn(
          "absolute inset-0 overflow-auto",
          showRulers && "top-8 left-8"
        )}
        style={{
          cursor: isPanning ? 'grabbing' : 'default'
        }}
      >
        <div
          className="relative min-w-full min-h-full flex items-center justify-center p-16"
          onMouseDown={handleMouseDown}
        >
          {/* Document Canvas */}
          <div
            ref={(node) => {
              canvasRef.current = node;
              drop(node);
            }}
            className={cn(
              "bg-white shadow-2xl relative border border-gray-300",
              isOver && canDrop && "ring-2 ring-blue-400 ring-opacity-50",
              isOver && !canDrop && "ring-2 ring-red-400 ring-opacity-50"
            )}
            style={{
              width: scaledWidth,
              height: scaledHeight,
              transform: `translate(${pan.x}px, ${pan.y}px)`
            }}
            onClick={handleCanvasClick}
          >
            {children}
            
            {/* Drop indicator */}
            {isOver && canDrop && (
              <div className="absolute inset-0 bg-blue-200 bg-opacity-20 border-2 border-blue-400 border-dashed pointer-events-none" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CanvasContainer;