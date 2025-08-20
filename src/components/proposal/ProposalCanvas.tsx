import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ZoomIn, 
  ZoomOut, 
  Move, 
  Grid3X3, 
  Maximize2, 
  RotateCcw, 
  RotateCw,
  Copy,
  Trash2,
  Lock,
  Unlock,
  Eye,
  EyeOff
} from 'lucide-react';
import { useProposalEditor } from '../../hooks/useProposalEditor';
import { CanvasElement, Position, Tool } from '../../types/proposal';
import { cn } from '../../utils/cn';

// =====================================================================================
// COMPONENTE PRINCIPAL DO CANVAS
// =====================================================================================

interface ProposalCanvasProps {
  className?: string;
  onElementSelect?: (elementId: string | null) => void;
  onElementUpdate?: (elementId: string, element: CanvasElement) => void;
}

export const ProposalCanvas: React.FC<ProposalCanvasProps> = ({
  className,
  onElementSelect,
  onElementUpdate,
}) => {
  const {
    canvasState,
    toolConfig,
    canvasRef,
    selectElement,
    clearSelection,
    moveElement,
    updateElement,
    deleteElement,
    duplicateElement,
    setZoom,
    panViewport,
    centerViewport,
    fitToScreen,
    undo,
    redo,
    canUndo,
    canRedo,
    copySelected,
    paste,
    canPaste,
    updateCanvasConfig,
    getSelectedElements,
    setIsDragging,
    setDragOffset,
  } = useProposalEditor();

  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<Position>({ x: 0, y: 0 });
  const [draggedElement, setDraggedElement] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState<Position>({ x: 0, y: 0 });

  // =====================================================================================
  // HANDLERS DE MOUSE E TECLADO
  // =====================================================================================

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = (e.clientX - rect.left - canvasState.viewport.x) / canvasState.viewport.zoom;
    const y = (e.clientY - rect.top - canvasState.viewport.y) / canvasState.viewport.zoom;

    if (toolConfig.activeTool === 'pan' || e.button === 1) {
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
      return;
    }

    // Verificar se clicou em um elemento
    const clickedElement = canvasState.elements
      .slice()
      .reverse()
      .find(element => {
        const { position, size } = element.transform;
        return (
          x >= position.x &&
          x <= position.x + size.width &&
          y >= position.y &&
          y <= position.y + size.height &&
          element.visible &&
          !element.locked
        );
      });

    if (clickedElement) {
      if (!canvasState.selectedElementIds.includes(clickedElement.id)) {
        selectElement(clickedElement.id, e.ctrlKey || e.metaKey);
      }
      
      if (toolConfig.activeTool === 'select') {
        setDraggedElement(clickedElement.id);
        setDragStart({ x, y });
        setIsDragging(true);
        setDragOffset({
          x: x - clickedElement.transform.position.x,
          y: y - clickedElement.transform.position.y,
        });
      }
      
      onElementSelect?.(clickedElement.id);
    } else {
      clearSelection();
      onElementSelect?.(null);
    }
  }, [canvasState, toolConfig.activeTool, canvasRef, selectElement, clearSelection, onElementSelect, setIsDragging, setDragOffset]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      const deltaX = e.clientX - panStart.x;
      const deltaY = e.clientY - panStart.y;
      panViewport(deltaX, deltaY);
      setPanStart({ x: e.clientX, y: e.clientY });
      return;
    }

    if (draggedElement && toolConfig.activeTool === 'select') {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = (e.clientX - rect.left - canvasState.viewport.x) / canvasState.viewport.zoom;
      const y = (e.clientY - rect.top - canvasState.viewport.y) / canvasState.viewport.zoom;

      const newPosition = {
        x: x - (dragStart.x - canvasState.elements.find(el => el.id === draggedElement)!.transform.position.x),
        y: y - (dragStart.y - canvasState.elements.find(el => el.id === draggedElement)!.transform.position.y),
      };

      moveElement(draggedElement, newPosition);
    }
  }, [isPanning, panStart, draggedElement, toolConfig.activeTool, canvasRef, canvasState, panViewport, moveElement, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
    setDraggedElement(null);
    setIsDragging(false);
  }, [setIsDragging]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    
    if (e.ctrlKey || e.metaKey) {
      // Zoom
      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = canvasState.viewport.zoom * zoomFactor;
      setZoom(newZoom);
    } else {
      // Pan
      panViewport(-e.deltaX, -e.deltaY);
    }
  }, [canvasState.viewport.zoom, setZoom, panViewport]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.target !== document.body && !(e.target as HTMLElement).closest('.canvas-container')) {
      return;
    }

    switch (e.key) {
      case 'Delete':
      case 'Backspace':
        getSelectedElements().forEach(element => deleteElement(element.id));
        break;
      case 'c':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          copySelected();
        }
        break;
      case 'v':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          paste();
        }
        break;
      case 'd':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          getSelectedElements().forEach(element => duplicateElement(element.id));
        }
        break;
      case 'z':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          if (e.shiftKey) {
            redo();
          } else {
            undo();
          }
        }
        break;
      case 'a':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          // selectAll(); // Implementar se necessário
        }
        break;
    }
  }, [getSelectedElements, deleteElement, copySelected, paste, duplicateElement, undo, redo]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // =====================================================================================
  // RENDERIZAÇÃO DE ELEMENTOS
  // =====================================================================================

  const renderElement = useCallback((element: CanvasElement) => {
    const isSelected = canvasState.selectedElementIds.includes(element.id);
    const { position, size, rotation, scale } = element.transform;

    const elementStyle = {
      position: 'absolute' as const,
      left: position.x,
      top: position.y,
      width: size.width,
      height: size.height,
      transform: `rotate(${rotation}deg) scale(${scale})`,
      opacity: element.opacity,
      zIndex: element.zIndex,
      visibility: element.visible ? 'visible' as const : 'hidden' as const,
      pointerEvents: element.locked ? 'none' as const : 'auto' as const,
    };

    let content;
    switch (element.type) {
      case 'text':
        const textElement = element as CanvasElement & { content?: string; fontSize?: number; fontFamily?: string; fontWeight?: string; color?: string; textAlign?: string; lineHeight?: number; letterSpacing?: number; textDecoration?: string; backgroundColor?: string; borderRadius?: number; padding?: { top: number; right: number; bottom: number; left: number } };
        content = (
          <div
            style={{
              fontSize: textElement.fontSize,
              fontFamily: textElement.fontFamily,
              fontWeight: textElement.fontWeight,
              color: textElement.color,
              textAlign: textElement.textAlign,
              lineHeight: textElement.lineHeight,
              letterSpacing: textElement.letterSpacing,
              textDecoration: textElement.textDecoration,
              backgroundColor: textElement.backgroundColor,
              borderRadius: textElement.borderRadius,
              padding: textElement.padding ? 
                `${textElement.padding.top}px ${textElement.padding.right}px ${textElement.padding.bottom}px ${textElement.padding.left}px` : 
                undefined,
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: textElement.textAlign === 'center' ? 'center' : 
                            textElement.textAlign === 'right' ? 'flex-end' : 'flex-start',
            }}
          >
            {textElement.content}
          </div>
        );
        break;

      case 'image':
        const imageElement = element as CanvasElement & { src?: string; alt?: string; fit?: string; borderRadius?: number; border?: { width: number; style: string; color: string }; shadow?: { offsetX: number; offsetY: number; blur: number; color: string } };
        content = (
          <img
            src={imageElement.src}
            alt={imageElement.alt}
            style={{
              width: '100%',
              height: '100%',
              objectFit: imageElement.fit,
              borderRadius: imageElement.borderRadius,
              border: imageElement.border ? 
                `${imageElement.border.width}px ${imageElement.border.style} ${imageElement.border.color}` : 
                undefined,
              boxShadow: imageElement.shadow ? 
                `${imageElement.shadow.offsetX}px ${imageElement.shadow.offsetY}px ${imageElement.shadow.blur}px ${imageElement.shadow.color}` : 
                undefined,
            }}
          />
        );
        break;

      case 'shape':
        const shapeElement = element as CanvasElement & { fill?: string; stroke?: { width: number; style: string; color: string }; shapeType?: string; borderRadius?: number; gradient?: { angle?: number; colors: Array<{ color: string; stop: number }> } };
        content = (
          <div
            style={{
              width: '100%',
              height: '100%',
              backgroundColor: shapeElement.fill,
              border: shapeElement.stroke ? 
                `${shapeElement.stroke.width}px ${shapeElement.stroke.style} ${shapeElement.stroke.color}` : 
                undefined,
              borderRadius: shapeElement.shapeType === 'circle' ? '50%' : shapeElement.borderRadius,
              background: shapeElement.gradient ? 
                `linear-gradient(${shapeElement.gradient.angle || 0}deg, ${shapeElement.gradient.colors.map(c => `${c.color} ${c.stop}%`).join(', ')})` : 
                shapeElement.fill,
            }}
          />
        );
        break;

      default:
        content = (
          <div
            style={{
              width: '100%',
              height: '100%',
              backgroundColor: '#f3f4f6',
              border: '2px dashed #d1d5db',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              color: '#6b7280',
            }}
          >
            {element.type}
          </div>
        );
    }

    return (
      <motion.div
        key={element.id}
        style={elementStyle}
        className={cn(
          'cursor-move select-none',
          isSelected && 'ring-2 ring-blue-500 ring-offset-2',
          element.locked && 'cursor-not-allowed opacity-50'
        )}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: element.opacity, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.2 }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {content}
        
        {/* Handles de redimensionamento para elementos selecionados */}
        {isSelected && !element.locked && (
          <>
            {/* Handles de canto */}
            <div className="absolute -top-1 -left-1 w-3 h-3 bg-blue-500 border border-white rounded-full cursor-nw-resize" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 border border-white rounded-full cursor-ne-resize" />
            <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-500 border border-white rounded-full cursor-sw-resize" />
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 border border-white rounded-full cursor-se-resize" />
            
            {/* Handles de lado */}
            <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-blue-500 border border-white rounded-full cursor-n-resize" />
            <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-blue-500 border border-white rounded-full cursor-s-resize" />
            <div className="absolute -left-1 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-blue-500 border border-white rounded-full cursor-w-resize" />
            <div className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-blue-500 border border-white rounded-full cursor-e-resize" />
            
            {/* Handle de rotação */}
            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-green-500 border border-white rounded-full cursor-grab" />
          </>
        )}
      </motion.div>
    );
  }, [canvasState.selectedElementIds]);

  // =====================================================================================
  // GRID E BACKGROUND
  // =====================================================================================

  const renderGrid = useCallback(() => {
    if (!canvasState.config.showGrid) return null;

    const { gridSize } = canvasState.config;
    const { zoom } = canvasState.viewport;
    const scaledGridSize = gridSize * zoom;

    // Só renderizar grid se for visível (não muito pequeno)
    if (scaledGridSize < 5) return null;

    return (
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, #e5e7eb 1px, transparent 1px),
            linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
          `,
          backgroundSize: `${scaledGridSize}px ${scaledGridSize}px`,
          backgroundPosition: `${canvasState.viewport.x % scaledGridSize}px ${canvasState.viewport.y % scaledGridSize}px`,
        }}
      />
    );
  }, [canvasState.config.showGrid, canvasState.config.gridSize, canvasState.viewport]);

  // =====================================================================================
  // TOOLBAR DE CONTROLES
  // =====================================================================================

  const renderToolbar = () => (
    <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg border p-2 flex items-center gap-2 z-50">
      {/* Controles de Zoom */}
      <button
        onClick={() => setZoom(canvasState.viewport.zoom * 1.2)}
        className="p-2 hover:bg-gray-100 rounded transition-colors"
        title="Zoom In"
      >
        <ZoomIn className="w-4 h-4" />
      </button>
      
      <button
        onClick={() => setZoom(canvasState.viewport.zoom * 0.8)}
        className="p-2 hover:bg-gray-100 rounded transition-colors"
        title="Zoom Out"
      >
        <ZoomOut className="w-4 h-4" />
      </button>
      
      <button
        onClick={fitToScreen}
        className="p-2 hover:bg-gray-100 rounded transition-colors"
        title="Fit to Screen"
      >
        <Maximize2 className="w-4 h-4" />
      </button>
      
      <button
        onClick={centerViewport}
        className="p-2 hover:bg-gray-100 rounded transition-colors"
        title="Center View"
      >
        <Move className="w-4 h-4" />
      </button>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      {/* Grid Toggle */}
      <button
        onClick={() => updateCanvasConfig({ showGrid: !canvasState.config.showGrid })}
        className={cn(
          "p-2 rounded transition-colors",
          canvasState.config.showGrid ? "bg-blue-100 text-blue-600" : "hover:bg-gray-100"
        )}
        title="Toggle Grid"
      >
        <Grid3X3 className="w-4 h-4" />
      </button>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      {/* Undo/Redo */}
      <button
        onClick={undo}
        disabled={!canUndo}
        className="p-2 hover:bg-gray-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="Undo"
      >
        <RotateCcw className="w-4 h-4" />
      </button>
      
      <button
        onClick={redo}
        disabled={!canRedo}
        className="p-2 hover:bg-gray-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="Redo"
      >
        <RotateCw className="w-4 h-4" />
      </button>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      {/* Copy/Paste */}
      <button
        onClick={copySelected}
        disabled={getSelectedElements().length === 0}
        className="p-2 hover:bg-gray-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="Copy"
      >
        <Copy className="w-4 h-4" />
      </button>
      
      <button
        onClick={paste}
        disabled={!canPaste}
        className="p-2 hover:bg-gray-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="Paste"
      >
        <div className="w-4 h-4 text-xs font-bold">V</div>
      </button>

      {/* Delete */}
      <button
        onClick={() => getSelectedElements().forEach(el => deleteElement(el.id))}
        disabled={getSelectedElements().length === 0}
        className="p-2 hover:bg-red-100 text-red-600 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="Delete"
      >
        <Trash2 className="w-4 h-4" />
      </button>

      {/* Zoom Level Display */}
      <div className="ml-2 px-2 py-1 bg-gray-100 rounded text-xs font-mono">
        {Math.round(canvasState.viewport.zoom * 100)}%
      </div>
    </div>
  );

  // =====================================================================================
  // RENDER PRINCIPAL
  // =====================================================================================

  return (
    <div className={cn("relative w-full h-full overflow-hidden bg-gray-50", className)}>
      {/* Toolbar */}
      {renderToolbar()}

      {/* Canvas Container */}
      <div
        ref={canvasRef}
        className="canvas-container w-full h-full cursor-crosshair"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        style={{
          cursor: toolConfig.activeTool === 'pan' || isPanning ? 'grab' : 
                 draggedElement ? 'grabbing' : 'default'
        }}
      >
        {/* Grid */}
        {renderGrid()}

        {/* Canvas Area */}
        <div
          className="absolute bg-white shadow-lg"
          style={{
            left: canvasState.viewport.x,
            top: canvasState.viewport.y,
            width: canvasState.config.width * canvasState.viewport.zoom,
            height: canvasState.config.height * canvasState.viewport.zoom,
            transform: `scale(${canvasState.viewport.zoom})`,
            transformOrigin: '0 0',
          }}
        >
          {/* Elementos do Canvas */}
          <AnimatePresence>
            {canvasState.elements.map(renderElement)}
          </AnimatePresence>
        </div>
      </div>

      {/* Status Bar */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg border px-3 py-2 text-xs text-gray-600">
        <span>Elementos: {canvasState.elements.length}</span>
        {getSelectedElements().length > 0 && (
          <span className="ml-3">Selecionados: {getSelectedElements().length}</span>
        )}
      </div>
    </div>
  );
};

export default ProposalCanvas;