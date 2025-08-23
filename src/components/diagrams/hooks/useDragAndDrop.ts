import { useCallback, useRef, useState } from 'react';
import { XYPosition } from 'reactflow';
import { NodeCategory } from '../types';
import { useDiagramState } from './useDiagramState';

interface DragItem {
  type: NodeCategory;
  data?: Record<string, unknown>;
}

interface DragState {
  isDragging: boolean;
  dragItem: DragItem | null;
  dragPosition: XYPosition | null;
}

/**
 * Hook customizado para gerenciar operações de drag and drop
 * Facilita a criação de nós através de arrastar e soltar
 */
export const useDragAndDrop = () => {
  const { createNode } = useDiagramState();
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    dragItem: null,
    dragPosition: null
  });
  
  const dragRef = useRef<HTMLElement | null>(null);
  const reactFlowWrapper = useRef<HTMLDivElement | null>(null);
  const reactFlowInstance = useRef<unknown>(null);

  // Iniciar drag
  const onDragStart = useCallback((event: React.DragEvent, nodeType: NodeCategory, data?: Record<string, unknown>) => {
    const dragItem: DragItem = { type: nodeType, data };
    
    setDragState({
      isDragging: true,
      dragItem,
      dragPosition: null
    });
    
    // Configurar dados do drag
    event.dataTransfer.setData('application/reactflow', JSON.stringify(dragItem));
    event.dataTransfer.effectAllowed = 'move';
  }, []);

  // Drag over (permitir drop)
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    
    // Atualizar posição do drag
    if (dragState.isDragging) {
      setDragState(prev => ({
        ...prev,
        dragPosition: { x: event.clientX, y: event.clientY }
      }));
    }
  }, [dragState.isDragging]);

  // Drop - criar nó
  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    
    const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
    if (!reactFlowBounds || !reactFlowInstance.current) {
      console.warn('ReactFlow wrapper ou instância não encontrada');
      return;
    }

    try {
      // Recuperar dados do drag
      const dragData = event.dataTransfer.getData('application/reactflow');
      if (!dragData) return;
      
      const dragItem: DragItem = JSON.parse(dragData);
      
      // Calcular posição no canvas
      const position = {
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      };
      
      // Converter para coordenadas do ReactFlow se necessário
      // const flowPosition = reactFlowInstance.current.project ? 
      //   reactFlowInstance.current.project(position) : position;
      
      // Criar novo nó
      createNode(dragItem.type, position, dragItem.data);
      
    } catch (error) {
      console.error('Erro ao processar drop:', error);
    } finally {
      // Limpar estado do drag
      setDragState({
        isDragging: false,
        dragItem: null,
        dragPosition: null
      });
    }
  }, [createNode]);

  // Cancelar drag
  const onDragEnd = useCallback(() => {
    setDragState({
      isDragging: false,
      dragItem: null,
      dragPosition: null
    });
  }, []);

  // Configurar referências
  const setReactFlowWrapper = useCallback((element: HTMLDivElement | null) => {
    reactFlowWrapper.current = element;
  }, []);

  const setReactFlowInstance = useCallback((instance: unknown) => {
    reactFlowInstance.current = instance;
  }, []);

  // Verificar se um tipo de nó pode ser dropado
  const canDrop = useCallback((nodeType: NodeCategory): boolean => {
    // Aqui você pode adicionar lógica para verificar se um tipo específico
    // pode ser dropado baseado no contexto atual
    return ['flowchart', 'mindmap', 'organogram'].includes(nodeType);
  }, []);

  // Obter preview do item sendo arrastado
  const getDragPreview = useCallback(() => {
    if (!dragState.isDragging || !dragState.dragItem) return null;
    
    return {
      type: dragState.dragItem.type,
      position: dragState.dragPosition,
      data: dragState.dragItem.data
    };
  }, [dragState]);

  return {
    // Estado
    isDragging: dragState.isDragging,
    dragItem: dragState.dragItem,
    dragPosition: dragState.dragPosition,
    
    // Manipuladores de eventos
    onDragStart,
    onDragOver,
    onDrop,
    onDragEnd,
    
    // Configuração
    setReactFlowWrapper,
    setReactFlowInstance,
    
    // Utilitários
    canDrop,
    getDragPreview,
    
    // Refs
    dragRef,
    reactFlowWrapper
  };
};

export default useDragAndDrop;