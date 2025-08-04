import { useState, useCallback, useRef, useEffect } from 'react';
import { TemplateComponent, EditorState, TemplateData, ComponentProperties } from '../types';
import { logError, logInfo } from '@/utils/secureLogger';

const MAX_HISTORY_SIZE = 50;

export function useTemplateEditor(templateId?: string) {
  const [state, setState] = useState<EditorState>({
    components: [],
    selectedComponentId: null,
    history: [[]],
    historyIndex: 0,
    zoom: 1,
    showGrid: true,
    showRulers: true,
    snapToGrid: true,
    gridSize: 20
  });

  const stateRef = useRef(state);
  stateRef.current = state;

  // Load template if templateId is provided
  useEffect(() => {
    if (templateId) {
      loadTemplate(templateId);
    }
  }, [templateId]);

  const addToHistory = useCallback((components: TemplateComponent[]) => {
    setState(prev => {
      const newHistory = prev.history.slice(0, prev.historyIndex + 1);
      newHistory.push([...components]);
      
      // Limit history size
      if (newHistory.length > MAX_HISTORY_SIZE) {
        newHistory.shift();
      }
      
      return {
        ...prev,
        history: newHistory,
        historyIndex: newHistory.length - 1
      };
    });
  }, []);

  const addComponent = useCallback((component: TemplateComponent) => {
    setState(prev => {
      const newComponents = [...prev.components, component];
      addToHistory(newComponents);
      return {
        ...prev,
        components: newComponents,
        selectedComponentId: component.id
      };
    });
  }, [addToHistory]);

  const updateComponent = useCallback((id: string, updates: Partial<TemplateComponent>) => {
    setState(prev => {
      const newComponents = prev.components.map(comp => 
        comp.id === id ? { ...comp, ...updates } : comp
      );
      
      // Only add to history if it's a significant change (not just selection)
      if (Object.keys(updates).some(key => key !== 'selected')) {
        addToHistory(newComponents);
      }
      
      return {
        ...prev,
        components: newComponents
      };
    });
  }, [addToHistory]);

  const updateComponentProperties = useCallback((id: string, properties: Partial<ComponentProperties>) => {
    updateComponent(id, { properties: { ...getComponentById(id)?.properties, ...properties } });
  }, [updateComponent]);

  const deleteComponent = useCallback((id: string) => {
    setState(prev => {
      const newComponents = prev.components.filter(comp => comp.id !== id);
      addToHistory(newComponents);
      return {
        ...prev,
        components: newComponents,
        selectedComponentId: prev.selectedComponentId === id ? null : prev.selectedComponentId
      };
    });
  }, [addToHistory]);

  const duplicateComponent = useCallback((id: string) => {
    const component = getComponentById(id);
    if (component) {
      const newComponent: TemplateComponent = {
        ...component,
        id: `component-${Date.now()}`,
        position: {
          x: component.position.x + 20,
          y: component.position.y + 20
        },
        zIndex: Math.max(...state.components.map(c => c.zIndex)) + 1
      };
      addComponent(newComponent);
    }
  }, [state.components, addComponent]);

  const selectComponent = useCallback((id: string | null) => {
    setState(prev => ({
      ...prev,
      selectedComponentId: id
    }));
  }, []);

  const moveComponent = useCallback((id: string, deltaX: number, deltaY: number) => {
    const component = getComponentById(id);
    if (component) {
      updateComponent(id, {
        position: {
          x: Math.max(0, component.position.x + deltaX),
          y: Math.max(0, component.position.y + deltaY)
        }
      });
    }
  }, [updateComponent]);

  const resizeComponent = useCallback((id: string, width: number, height: number) => {
    updateComponent(id, {
      size: {
        width: Math.max(10, width),
        height: Math.max(10, height)
      }
    });
  }, [updateComponent]);

  const bringToFront = useCallback((id: string) => {
    const maxZIndex = Math.max(...state.components.map(c => c.zIndex));
    updateComponent(id, { zIndex: maxZIndex + 1 });
  }, [state.components, updateComponent]);

  const sendToBack = useCallback((id: string) => {
    const minZIndex = Math.min(...state.components.map(c => c.zIndex));
    updateComponent(id, { zIndex: minZIndex - 1 });
  }, [state.components, updateComponent]);

  const undo = useCallback(() => {
    setState(prev => {
      if (prev.historyIndex > 0) {
        const newIndex = prev.historyIndex - 1;
        return {
          ...prev,
          components: [...prev.history[newIndex]],
          historyIndex: newIndex,
          selectedComponentId: null
        };
      }
      return prev;
    });
  }, []);

  const redo = useCallback(() => {
    setState(prev => {
      if (prev.historyIndex < prev.history.length - 1) {
        const newIndex = prev.historyIndex + 1;
        return {
          ...prev,
          components: [...prev.history[newIndex]],
          historyIndex: newIndex,
          selectedComponentId: null
        };
      }
      return prev;
    });
  }, []);

  const setZoom = useCallback((zoom: number) => {
    setState(prev => ({
      ...prev,
      zoom: Math.max(0.1, Math.min(5, zoom))
    }));
  }, []);

  const toggleGrid = useCallback(() => {
    setState(prev => ({
      ...prev,
      showGrid: !prev.showGrid
    }));
  }, []);

  const toggleRulers = useCallback(() => {
    setState(prev => ({
      ...prev,
      showRulers: !prev.showRulers
    }));
  }, []);

  const toggleSnapToGrid = useCallback(() => {
    setState(prev => ({
      ...prev,
      snapToGrid: !prev.snapToGrid
    }));
  }, []);

  const clearSelection = useCallback(() => {
    selectComponent(null);
  }, [selectComponent]);

  const selectAll = useCallback(() => {
    // Implementation for selecting all components
    logInfo('Selecionando todos os componentes do template', {
      service: 'TemplateEditor',
      componentCount: stateRef.current.components.length,
      action: 'selectAll'
    });
  }, []);

  const deleteSelected = useCallback(() => {
    if (state.selectedComponentId) {
      deleteComponent(state.selectedComponentId);
    }
  }, [state.selectedComponentId, deleteComponent]);

  const getComponentById = useCallback((id: string): TemplateComponent | undefined => {
    return stateRef.current.components.find(comp => comp.id === id);
  }, []);

  const getSelectedComponent = useCallback((): TemplateComponent | null => {
    return state.selectedComponentId ? getComponentById(state.selectedComponentId) || null : null;
  }, [state.selectedComponentId, getComponentById]);

  const saveTemplate = useCallback((): TemplateData => {
    const template: TemplateData = {
      id: templateId || `template-${Date.now()}`,
      name: 'Novo Template',
      category: 'custom',
      components: state.components,
      pageSize: 'A4',
      orientation: 'portrait',
      margins: {
        top: 20,
        right: 20,
        bottom: 20,
        left: 20
      },
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: '1.0.0'
      }
    };
    
    // Save to localStorage or send to server
    localStorage.setItem(`template-${template.id}`, JSON.stringify(template));
    
    return template;
  }, [templateId, state.components]);

  const loadTemplate = useCallback((id: string) => {
    try {
      const saved = localStorage.getItem(`template-${id}`);
      if (saved) {
        const template: TemplateData = JSON.parse(saved);
        setState(prev => ({
          ...prev,
          components: template.components,
          history: [template.components],
          historyIndex: 0,
          selectedComponentId: null
        }));
      }
    } catch (error) {
      logError('Erro ao carregar template', {
        service: 'TemplateEditor',
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        templateId: id,
        action: 'loadTemplate'
      });
    }
  }, []);

  const previewTemplate = useCallback(() => {
    return {
      components: state.components,
      zoom: state.zoom
    };
  }, [state.components, state.zoom]);

  const exportTemplate = useCallback((format: 'json' | 'pdf' | 'png') => {
    const template = saveTemplate();
    
    switch (format) {
      case 'json': {
        const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${template.name}.json`;
        a.click();
        URL.revokeObjectURL(url);
        break;
      }
      case 'pdf':
        // Implementation for PDF export
        logInfo('Exportação PDF ainda não implementada', {
          service: 'TemplateEditor',
          templateId: template.id,
          format: 'pdf',
          action: 'exportTemplate'
        });
        break;
      case 'png':
        // Implementation for PNG export
        logInfo('Exportação PNG ainda não implementada', {
          service: 'TemplateEditor',
          templateId: template.id,
          format: 'png',
          action: 'exportTemplate'
        });
        break;
    }
  }, [saveTemplate]);

  return {
    // State
    components: state.components,
    selectedComponent: getSelectedComponent(),
    selectedComponentId: state.selectedComponentId,
    canUndo: state.historyIndex > 0,
    canRedo: state.historyIndex < state.history.length - 1,
    zoom: state.zoom,
    showGrid: state.showGrid,
    showRulers: state.showRulers,
    snapToGrid: state.snapToGrid,
    gridSize: state.gridSize,
    
    // Actions
    addComponent,
    updateComponent,
    updateComponentProperties,
    deleteComponent,
    duplicateComponent,
    selectComponent,
    moveComponent,
    resizeComponent,
    bringToFront,
    sendToBack,
    undo,
    redo,
    setZoom,
    toggleGrid,
    toggleRulers,
    toggleSnapToGrid,
    clearSelection,
    selectAll,
    deleteSelected,
    
    // Utilities
    getComponentById,
    getSelectedComponent,
    saveTemplate,
    loadTemplate,
    previewTemplate,
    exportTemplate
  };
}