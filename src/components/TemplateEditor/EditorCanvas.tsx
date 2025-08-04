import React, { useRef, useCallback, useState, useEffect } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { motion } from 'framer-motion';
import { TemplateComponent, Position, EditorState } from './types';
import { TemplateRenderer } from './TemplateRenderer';
import { logInfo } from '@/utils/secureLogger';
// Removed SelectionBox and ResizeHandles imports - functionality will be implemented inline

interface EditorCanvasProps {
  editorState: EditorState;
  onComponentSelect: (id: string | null) => void;
  onComponentUpdate: (id: string, updates: Partial<TemplateComponent>) => void;
  onCanvasClick: () => void;
  isPreviewMode: boolean;
}

export function EditorCanvas({
  editorState,
  onComponentSelect,
  onComponentUpdate,
  onCanvasClick,
  isPreviewMode
}: EditorCanvasProps) {
  const { components, selectedComponentId, zoom, showGrid } = editorState;
  const selectedComponent = components.find(c => c.id === selectedComponentId) || null;
  const canvasRef = useRef<HTMLDivElement>(null);

  const [canvasSize] = useState({ width: 794, height: 1123 }); // A4 size in pixels at 96 DPI

  const { setNodeRef, isOver } = useDroppable({
    id: 'canvas',
    data: {
      rect: canvasRef.current?.getBoundingClientRect()
    }
  });

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onCanvasClick();
    }
  }, [onCanvasClick]);





  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!selectedComponent) return;

    switch (e.key) {
      case 'Delete':
      case 'Backspace':
        // Delete functionality handled by parent component
        break;
      case 'ArrowUp':
        e.preventDefault();
        onComponentUpdate(selectedComponent.id, {
          position: {
            ...selectedComponent.position,
            y: Math.max(0, selectedComponent.position.y - (e.shiftKey ? 10 : 1))
          }
        });
        break;
      case 'ArrowDown':
        e.preventDefault();
        onComponentUpdate(selectedComponent.id, {
          position: {
            ...selectedComponent.position,
            y: Math.min(canvasSize.height - selectedComponent.size.height, selectedComponent.position.y + (e.shiftKey ? 10 : 1))
          }
        });
        break;
      case 'ArrowLeft':
        e.preventDefault();
        onComponentUpdate(selectedComponent.id, {
          position: {
            ...selectedComponent.position,
            x: Math.max(0, selectedComponent.position.x - (e.shiftKey ? 10 : 1))
          }
        });
        break;
      case 'ArrowRight':
        e.preventDefault();
        onComponentUpdate(selectedComponent.id, {
          position: {
            ...selectedComponent.position,
            x: Math.min(canvasSize.width - selectedComponent.size.width, selectedComponent.position.x + (e.shiftKey ? 10 : 1))
          }
        });
        break;
    }
  }, [selectedComponent, onComponentUpdate, canvasSize]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);



  const gridPattern = showGrid ? (
    <defs>
      <pattern
        id="grid"
        width={20 * zoom}
        height={20 * zoom}
        patternUnits="userSpaceOnUse"
      >
        <path
          d={`M ${20 * zoom} 0 L 0 0 0 ${20 * zoom}`}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="1"
        />
      </pattern>
    </defs>
  ) : null;

  return (
    <div className="flex-1 overflow-auto bg-gray-100 p-8">
      <div className="flex justify-center">
        <motion.div
          ref={(node) => {
            setNodeRef(node);
            canvasRef.current = node;
          }}
          className={`bg-white shadow-lg relative cursor-default ${
            isOver ? 'ring-2 ring-blue-400' : ''
          }`}
          style={
            {
              width: canvasSize.width * zoom,
              height: canvasSize.height * zoom,
              transform: `scale(${zoom})`,
              transformOrigin: 'top left'
            } as React.CSSProperties
          }
          onClick={handleCanvasClick}
        >
          {/* Grid */}
          {showGrid && (
            <svg
              className="absolute inset-0 pointer-events-none"
              width="100%"
              height="100%"
            >
              {gridPattern}
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          )}

          {/* Rulers */}
          <div className="absolute -top-6 left-0 right-0 h-6 bg-gray-50 border-b border-gray-200 text-xs text-gray-500 flex items-end">
            {Array.from({ length: Math.ceil(canvasSize.width / 50) }, (_, i) => (
              <div
                key={i}
                className="absolute border-l border-gray-300"
                style={{ left: i * 50 * zoom }}
              >
                <span className="ml-1">{i * 50}</span>
              </div>
            ))}
          </div>
          
          <div className="absolute -left-6 top-0 bottom-0 w-6 bg-gray-50 border-r border-gray-200 text-xs text-gray-500">
            {Array.from({ length: Math.ceil(canvasSize.height / 50) }, (_, i) => (
              <div
                key={i}
                className="absolute border-t border-gray-300 flex items-center justify-center"
                style={{ top: i * 50 * zoom, height: '20px' }}
              >
                <span className="transform -rotate-90 text-xs">{i * 50}</span>
              </div>
            ))}
          </div>

          {/* Components */}
          {components
            .sort((a, b) => a.zIndex - b.zIndex)
            .map((component) => (
              <TemplateRenderer
                key={component.id}
                component={component}
                isSelected={selectedComponent?.id === component.id}
                isPreview={isPreviewMode}
                onSelect={onComponentSelect}
                onDoubleClick={(id) => {
                  // Handle double click for editing
                  logInfo({
                    service: 'EditorCanvas',
                    action: 'componentDoubleClick',
                    message: 'Componente clicado duas vezes para edição',
                    details: { componentId: id }
                  });
                }}
                scale={zoom}
              />
            ))}
        </motion.div>
      </div>
    </div>
  );
}