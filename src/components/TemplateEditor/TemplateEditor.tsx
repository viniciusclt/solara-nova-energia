import React, { useState, useCallback, useEffect, useMemo, memo } from 'react';
import { DndContext, DragEndEvent, DragStartEvent, DragOverlay } from '@dnd-kit/core';
import { Card } from '@/components/ui/card';
import { useTemplateEditor } from './hooks/useTemplateEditor';
import { ComponentLibrary } from './ComponentLibrary';
import { EditorCanvas } from './EditorCanvas';
import { PropertiesPanel } from './PropertiesPanel';
import { Toolbar } from './Toolbar';
import { TemplateRenderer } from './TemplateRenderer';
import { logError } from '@/utils/secureLogger';
export interface TemplateComponent {
  id: string;
  type: ComponentType;
  position: { x: number; y: number };
  properties: Record<string, unknown>;
  zIndex?: number;
  locked?: boolean;
}

export type ComponentType = 'text' | 'image' | 'shape' | 'container';

export interface DragData {
  componentType: ComponentType;
}

interface TemplateEditorProps {
  initialTemplate?: {
    id: string;
    name: string;
    components: TemplateComponent[];
  };
  onSave?: (template: unknown) => void;
  onExport?: (template: unknown) => void;
}

export const TemplateEditor = memo(function TemplateEditor({ initialTemplate, onSave, onExport }: TemplateEditorProps) {
  const [draggedComponent, setDraggedComponent] = useState<ComponentType | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  
  const {
    editorState,
    addComponent,
    updateComponent,
    deleteComponent,
    duplicateComponent,
    selectComponent,
    clearSelection,
    undo,
    redo,
    canUndo,
    canRedo,
    setZoom,
    toggleGrid,
    toggleRulers,
    saveTemplate,
    loadTemplate,
    exportTemplate,
    previewTemplate
  } = useTemplateEditor(initialTemplate?.id);

  const selectedComponent = useMemo(() => 
    editorState.components.find(
      comp => comp.id === editorState.selectedComponentId
    ), [editorState.components, editorState.selectedComponentId]
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setIsDragging(true);
    const dragData = event.active.data.current as DragData;
    if (dragData?.componentType) {
      setDraggedComponent(dragData.componentType);
    }
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setIsDragging(false);
    setDraggedComponent(null);
    
    if (event.over && event.active.data.current?.componentType) {
      const componentType = event.active.data.current.componentType as ComponentType;
      const canvasRect = event.over.rect;
      
      if (canvasRect) {
        // Calculate position relative to canvas
        const position = {
          x: Math.max(0, event.delta.x),
          y: Math.max(0, event.delta.y)
        };
        
addComponent({ type: componentType as ComponentType, position });
      }
    }
  }, [addComponent]);

  const handleSave = useCallback(async () => {
    try {
      const template = await saveTemplate();
      onSave?.(template);
    } catch (error) {
      logError({
        service: 'TemplateEditor',
        action: 'saveTemplate',
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        details: {
          templateId: initialTemplate?.id,
          componentCount: editorState.components.length
        }
      });
    }
  }, [saveTemplate, onSave]);

  const handleExport = useCallback(async () => {
    try {
      const exportData = await exportTemplate(editorState);
      onExport?.(exportData);
    } catch (error) {
      logError({
        service: 'TemplateEditor',
        action: 'exportTemplate',
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        details: {
          templateId: initialTemplate?.id,
          componentCount: editorState.components.length
        }
      });
    }
  }, [exportTemplate, onExport]);

  const handlePreview = useCallback(() => {
    setIsPreviewMode(!isPreviewMode);
  }, [isPreviewMode]);

  const handleCopy = useCallback(() => {
    if (selectedComponent) {
      duplicateComponent(selectedComponent.id);
    }
  }, [selectedComponent, duplicateComponent]);

  const handleDelete = useCallback(() => {
    if (selectedComponent) {
      deleteComponent(selectedComponent.id);
    }
  }, [selectedComponent, deleteComponent]);

  const handleAlign = useCallback((alignment: 'left' | 'center' | 'right' | 'justify') => {
    if (selectedComponent) {
      updateComponent(selectedComponent.id, {
        properties: {
          ...selectedComponent.properties,
          textAlign: alignment
        }
      });
    }
  }, [selectedComponent, updateComponent]);

  const handleLayerMove = useCallback((direction: 'up' | 'down') => {
    if (selectedComponent) {
      const newZIndex = direction === 'up' 
        ? (selectedComponent.zIndex || 0) + 1
        : Math.max(0, (selectedComponent.zIndex || 0) - 1);
      
      updateComponent(selectedComponent.id, { zIndex: newZIndex });
    }
  }, [selectedComponent, updateComponent]);

  const handleLockToggle = useCallback(() => {
    if (selectedComponent) {
      updateComponent(selectedComponent.id, {
        locked: !selectedComponent.locked
      });
    }
  }, [selectedComponent, updateComponent]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'z':
            e.preventDefault();
            if (e.shiftKey) {
              redo();
            } else {
              undo();
            }
            break;
          case 'y':
            e.preventDefault();
            redo();
            break;
          case 's':
            e.preventDefault();
            handleSave();
            break;
          case 'd':
            e.preventDefault();
            handleCopy();
            break;
        }
      } else {
        switch (e.key) {
          case 'Delete':
          case 'Backspace':
            if (selectedComponent && !selectedComponent.locked) {
              e.preventDefault();
              handleDelete();
            }
            break;
          case 'Escape':
            clearSelection();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, handleSave, handleCopy, handleDelete, selectedComponent, clearSelection]);

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="h-screen flex flex-col bg-gray-50">
        {/* Toolbar */}
        <Toolbar
          editorState={editorState}
          onUndo={undo}
          onRedo={redo}
          onSave={handleSave}
          onExport={handleExport}
          onPreview={handlePreview}
          onZoomChange={setZoom}
          onGridToggle={toggleGrid}
          onRulerToggle={toggleRulers}
          onCopy={handleCopy}
          onDelete={handleDelete}
          onAlign={handleAlign}
          onLayerMove={handleLayerMove}
          onLockToggle={handleLockToggle}
          canUndo={canUndo}
          canRedo={canRedo}
          hasSelection={!!selectedComponent}
          isLocked={selectedComponent?.locked || false}
        />

        <div className="flex-1 flex overflow-hidden">
          {/* Component Library */}
          {!isPreviewMode && (
            <div className="w-64 bg-white border-r border-gray-200">
              <Card className="h-full rounded-none border-0">
                <ComponentLibrary />
              </Card>
            </div>
          )}

          {/* Canvas Area */}
          <div className="flex-1 flex flex-col">
            <EditorCanvas
              editorState={editorState}
              onComponentSelect={selectComponent}
              onComponentUpdate={updateComponent}
              onCanvasClick={clearSelection}
              isPreviewMode={isPreviewMode}
            />
          </div>

          {/* Properties Panel */}
          {!isPreviewMode && (
            <div className="w-80 bg-white border-l border-gray-200">
              <Card className="h-full rounded-none border-0">
                <PropertiesPanel
                  selectedComponent={selectedComponent || null}
                  onComponentUpdate={updateComponent}
                />
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {isDragging && draggedComponent && (
          <div className="bg-blue-100 border-2 border-blue-300 rounded p-2 text-sm font-medium">
            {draggedComponent}
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
});