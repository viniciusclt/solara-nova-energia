import { useState, useCallback, useEffect } from 'react';
import { ProposalElementService } from '../services/ProposalElementService';
import type {
  ProposalElement,
  ElementType,
  Position,
  TextProperties,
  ImageProperties,
  ChartProperties,
  TableProperties,
  ShapeProperties
} from '../types/proposal-editor';

interface UseElementsProps {
  templateId?: string;
  autoSave?: boolean;
  onError?: (error: string) => void;
}

interface UseElementsReturn {
  // Estado
  elements: ProposalElement[];
  loading: boolean;
  error: string | null;
  
  // CRUD operations
  createElement: (type: ElementType, position: Position, properties?: Record<string, unknown>) => Promise<ProposalElement | null>;
  updateElement: (elementId: string, updates: Partial<ProposalElement>) => Promise<boolean>;
  deleteElement: (elementId: string) => Promise<boolean>;
  duplicateElement: (elementId: string, offset?: { x: number; y: number }) => Promise<ProposalElement | null>;
  
  // Busca e filtros
  getElementById: (elementId: string) => ProposalElement | undefined;
  getElementsByType: (type: ElementType) => ProposalElement[];
  getElementsByZIndex: (ascending?: boolean) => ProposalElement[];
  
  // Operações em lote
  updateMultipleElements: (updates: Array<{ id: string; updates: Partial<ProposalElement> }>) => Promise<boolean>;
  deleteMultipleElements: (elementIds: string[]) => Promise<boolean>;
  reorderElements: (elementIds: string[]) => Promise<boolean>;
  
  // Posicionamento e layout
  updateElementPosition: (elementId: string, position: Position) => Promise<boolean>;
  updateElementZIndex: (elementId: string, zIndex: number) => Promise<boolean>;
  moveElementToFront: (elementId: string) => Promise<boolean>;
  moveElementToBack: (elementId: string) => Promise<boolean>;
  
  // Alinhamento
  alignElements: (elementIds: string[], alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => Promise<boolean>;
  distributeElements: (elementIds: string[], direction: 'horizontal' | 'vertical') => Promise<boolean>;
  
  // Validação
  validateElement: (element: ProposalElement) => { isValid: boolean; errors: string[] };
  
  // Utilitários
  refreshElements: () => Promise<void>;
  clearElements: () => void;
  getElementBounds: (elementId: string) => { x: number; y: number; width: number; height: number } | null;
  checkElementCollision: (elementId: string, otherElementId: string) => boolean;
}

export const useElements = ({
  templateId,
  autoSave = true,
  onError
}: UseElementsProps = {}): UseElementsReturn => {
  const [elements, setElements] = useState<ProposalElement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carregar elementos do template
  const loadElements = useCallback(async () => {
    if (!templateId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const templateElements = await ProposalElementService.getElementsByTemplate(templateId);
      setElements(templateElements);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar elementos';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [templateId, onError]);

  // Carregar elementos quando o templateId mudar
  useEffect(() => {
    loadElements();
  }, [loadElements]);

  // Criar elemento
  const createElement = useCallback(async (
    type: ElementType,
    position: Position,
    properties?: Record<string, unknown>
  ): Promise<ProposalElement | null> => {
    if (!templateId) {
      const errorMessage = 'Template ID é obrigatório para criar elementos';
      setError(errorMessage);
      onError?.(errorMessage);
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const elementData = {
        template_id: templateId,
        type,
        position,
        properties: properties || ProposalElementService.getDefaultProperties(type)
      };

      const newElement = await ProposalElementService.createElement(elementData);
      setElements(prev => [...prev, newElement]);
      return newElement;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar elemento';
      setError(errorMessage);
      onError?.(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [templateId, onError]);

  // Atualizar elemento
  const updateElement = useCallback(async (
    elementId: string,
    updates: Partial<ProposalElement>
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const updatedElement = await ProposalElementService.updateElement(elementId, updates);
      setElements(prev => prev.map(el => el.id === elementId ? updatedElement : el));
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar elemento';
      setError(errorMessage);
      onError?.(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [onError]);

  // Deletar elemento
  const deleteElement = useCallback(async (elementId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      await ProposalElementService.deleteElement(elementId);
      setElements(prev => prev.filter(el => el.id !== elementId));
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao deletar elemento';
      setError(errorMessage);
      onError?.(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [onError]);

  // Duplicar elemento
  const duplicateElement = useCallback(async (
    elementId: string,
    offset = { x: 20, y: 20 }
  ): Promise<ProposalElement | null> => {
    setLoading(true);
    setError(null);

    try {
      const duplicatedElement = await ProposalElementService.duplicateElement(elementId, offset);
      setElements(prev => [...prev, duplicatedElement]);
      return duplicatedElement;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao duplicar elemento';
      setError(errorMessage);
      onError?.(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [onError]);

  // Buscar elemento por ID
  const getElementById = useCallback((elementId: string): ProposalElement | undefined => {
    return elements.find(el => el.id === elementId);
  }, [elements]);

  // Buscar elementos por tipo
  const getElementsByType = useCallback((type: ElementType): ProposalElement[] => {
    return elements.filter(el => el.type === type);
  }, [elements]);

  // Buscar elementos ordenados por z-index
  const getElementsByZIndex = useCallback((ascending = true): ProposalElement[] => {
    return [...elements].sort((a, b) => {
      const aIndex = a.z_index || 0;
      const bIndex = b.z_index || 0;
      return ascending ? aIndex - bIndex : bIndex - aIndex;
    });
  }, [elements]);

  // Atualizar múltiplos elementos
  const updateMultipleElements = useCallback(async (
    updates: Array<{ id: string; updates: Partial<ProposalElement> }>
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const promises = updates.map(({ id, updates: elementUpdates }) =>
        ProposalElementService.updateElement(id, elementUpdates)
      );
      
      const updatedElements = await Promise.all(promises);
      
      setElements(prev => {
        const newElements = [...prev];
        updatedElements.forEach(updated => {
          const index = newElements.findIndex(el => el.id === updated.id);
          if (index !== -1) {
            newElements[index] = updated;
          }
        });
        return newElements;
      });
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar elementos';
      setError(errorMessage);
      onError?.(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [onError]);

  // Deletar múltiplos elementos
  const deleteMultipleElements = useCallback(async (elementIds: string[]): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const promises = elementIds.map(id => ProposalElementService.deleteElement(id));
      await Promise.all(promises);
      
      setElements(prev => prev.filter(el => !elementIds.includes(el.id)));
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao deletar elementos';
      setError(errorMessage);
      onError?.(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [onError]);

  // Reordenar elementos
  const reorderElements = useCallback(async (elementIds: string[]): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      await ProposalElementService.reorderElements(elementIds);
      
      // Atualizar z-index local
      setElements(prev => {
        const newElements = [...prev];
        elementIds.forEach((id, index) => {
          const element = newElements.find(el => el.id === id);
          if (element) {
            element.z_index = index + 1;
          }
        });
        return newElements;
      });
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao reordenar elementos';
      setError(errorMessage);
      onError?.(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [onError]);

  // Atualizar posição do elemento
  const updateElementPosition = useCallback(async (
    elementId: string,
    position: Position
  ): Promise<boolean> => {
    return updateElement(elementId, { position });
  }, [updateElement]);

  // Atualizar z-index do elemento
  const updateElementZIndex = useCallback(async (
    elementId: string,
    zIndex: number
  ): Promise<boolean> => {
    return updateElement(elementId, { z_index: zIndex });
  }, [updateElement]);

  // Mover elemento para frente
  const moveElementToFront = useCallback(async (elementId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      await ProposalElementService.moveToFront(elementId);
      
      // Atualizar z-index local
      const maxZIndex = Math.max(...elements.map(el => el.z_index || 0));
      setElements(prev => prev.map(el => 
        el.id === elementId ? { ...el, z_index: maxZIndex + 1 } : el
      ));
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao mover elemento para frente';
      setError(errorMessage);
      onError?.(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [elements, onError]);

  // Mover elemento para trás
  const moveElementToBack = useCallback(async (elementId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      await ProposalElementService.moveToBack(elementId);
      
      // Atualizar z-index local
      const minZIndex = Math.min(...elements.map(el => el.z_index || 0));
      setElements(prev => prev.map(el => 
        el.id === elementId ? { ...el, z_index: minZIndex - 1 } : el
      ));
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao mover elemento para trás';
      setError(errorMessage);
      onError?.(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [elements, onError]);

  // Alinhar elementos
  const alignElements = useCallback(async (
    elementIds: string[],
    alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom'
  ): Promise<boolean> => {
    if (elementIds.length < 2) return false;

    setLoading(true);
    setError(null);

    try {
      await ProposalElementService.alignElements(elementIds, alignment);
      await refreshElements();
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao alinhar elementos';
      setError(errorMessage);
      onError?.(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [onError]);

  // Distribuir elementos
  const distributeElements = useCallback(async (
    elementIds: string[],
    direction: 'horizontal' | 'vertical'
  ): Promise<boolean> => {
    if (elementIds.length < 3) return false;

    const elementsToDistribute = elementIds
      .map(id => elements.find(el => el.id === id))
      .filter(Boolean) as ProposalElement[];

    if (elementsToDistribute.length < 3) return false;

    // Calcular distribuição
    const updates: Array<{ id: string; updates: Partial<ProposalElement> }> = [];

    if (direction === 'horizontal') {
      elementsToDistribute.sort((a, b) => a.position.x - b.position.x);
      const totalWidth = elementsToDistribute[elementsToDistribute.length - 1].position.x - elementsToDistribute[0].position.x;
      const spacing = totalWidth / (elementsToDistribute.length - 1);

      elementsToDistribute.forEach((element, index) => {
        if (index > 0 && index < elementsToDistribute.length - 1) {
          const newX = elementsToDistribute[0].position.x + (spacing * index);
          updates.push({
            id: element.id,
            updates: {
              position: { ...element.position, x: newX }
            }
          });
        }
      });
    } else {
      elementsToDistribute.sort((a, b) => a.position.y - b.position.y);
      const totalHeight = elementsToDistribute[elementsToDistribute.length - 1].position.y - elementsToDistribute[0].position.y;
      const spacing = totalHeight / (elementsToDistribute.length - 1);

      elementsToDistribute.forEach((element, index) => {
        if (index > 0 && index < elementsToDistribute.length - 1) {
          const newY = elementsToDistribute[0].position.y + (spacing * index);
          updates.push({
            id: element.id,
            updates: {
              position: { ...element.position, y: newY }
            }
          });
        }
      });
    }

    return updateMultipleElements(updates);
  }, [elements, updateMultipleElements]);

  // Validar elemento
  const validateElement = useCallback((element: ProposalElement): { isValid: boolean; errors: string[] } => {
    return ProposalElementService.validateElement(element);
  }, []);

  // Atualizar elementos
  const refreshElements = useCallback(async (): Promise<void> => {
    await loadElements();
  }, [loadElements]);

  // Limpar elementos
  const clearElements = useCallback(() => {
    setElements([]);
    setError(null);
  }, []);

  // Obter bounds do elemento
  const getElementBounds = useCallback((elementId: string) => {
    const element = getElementById(elementId);
    if (!element) return null;

    return {
      x: element.position.x,
      y: element.position.y,
      width: element.position.width,
      height: element.position.height
    };
  }, [getElementById]);

  // Verificar colisão entre elementos
  const checkElementCollision = useCallback((elementId: string, otherElementId: string): boolean => {
    const element1 = getElementById(elementId);
    const element2 = getElementById(otherElementId);

    if (!element1 || !element2) return false;

    return ProposalElementService.checkCollision(element1, element2);
  }, [getElementById]);

  return {
    // Estado
    elements,
    loading,
    error,
    
    // CRUD operations
    createElement,
    updateElement,
    deleteElement,
    duplicateElement,
    
    // Busca e filtros
    getElementById,
    getElementsByType,
    getElementsByZIndex,
    
    // Operações em lote
    updateMultipleElements,
    deleteMultipleElements,
    reorderElements,
    
    // Posicionamento e layout
    updateElementPosition,
    updateElementZIndex,
    moveElementToFront,
    moveElementToBack,
    
    // Alinhamento
    alignElements,
    distributeElements,
    
    // Validação
    validateElement,
    
    // Utilitários
    refreshElements,
    clearElements,
    getElementBounds,
    checkElementCollision
  };
};