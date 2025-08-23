// ============================================================================
// useFocusManagement Hook - Gerenciamento de foco para diagramas
// ============================================================================

import { useState, useCallback, useEffect, useRef } from 'react';
import { FocusableElement, FocusState } from '../types';
import { FOCUS_PRIORITY_ORDER } from '../constants';
import { 
  isFocusable, 
  getFocusableElements, 
  calculateFocusOrder, 
  moveFocusToNext, 
  moveFocusToPrevious,
  debounce
} from '../utils';

interface UseFocusManagementProps {
  container: HTMLElement | null;
  onFocusChange?: (elementId: string | null, element: HTMLElement | null) => void;
  onFocusLost?: () => void;
  autoFocus?: boolean;
  restoreFocus?: boolean;
}

interface UseFocusManagementReturn {
  focusState: FocusState;
  focusableElements: Map<string, FocusableElement>;
  focusOrder: string[];
  focusElement: (id: string) => boolean;
  focusNext: () => boolean;
  focusPrevious: () => boolean;
  focusFirst: () => boolean;
  focusLast: () => boolean;
  registerFocusableElement: (id: string, element: HTMLElement, priority?: number, tabIndex?: number) => void;
  unregisterFocusableElement: (id: string) => void;
  updateElementPriority: (id: string, priority: number) => void;
  clearFocus: () => void;
  restorePreviousFocus: () => boolean;
  isFocusWithin: boolean;
}

export function useFocusManagement({
  container,
  onFocusChange,
  onFocusLost,
  autoFocus = false,
  restoreFocus = true
}: UseFocusManagementProps): UseFocusManagementReturn {
  const [focusState, setFocusState] = useState<FocusState>({
    currentFocusId: null,
    previousFocusId: null,
    focusHistory: [],
    isFocusWithin: false
  });
  
  const [focusableElements, setFocusableElements] = useState<Map<string, FocusableElement>>(new Map());
  const [focusOrder, setFocusOrder] = useState<string[]>([]);
  const [isFocusWithin, setIsFocusWithin] = useState(false);
  
  const previousActiveElementRef = useRef<HTMLElement | null>(null);
  const focusTimeoutRef = useRef<NodeJS.Timeout>();

  // ============================================================================
  // Utilitários de foco
  // ============================================================================

  const updateFocusOrder = useCallback(() => {
    const elements = Array.from(focusableElements.values());
    const newOrder = calculateFocusOrder(elements);
    setFocusOrder(newOrder);
  }, [focusableElements]);

  const updateFocusState = useCallback((newFocusId: string | null, element: HTMLElement | null) => {
    setFocusState(prevState => {
      const newState: FocusState = {
        currentFocusId: newFocusId,
        previousFocusId: prevState.currentFocusId,
        focusHistory: newFocusId 
          ? [newFocusId, ...prevState.focusHistory.filter(id => id !== newFocusId)].slice(0, 10)
          : prevState.focusHistory,
        isFocusWithin: newFocusId !== null
      };
      
      setIsFocusWithin(newState.isFocusWithin);
      
      if (onFocusChange) {
        onFocusChange(newFocusId, element);
      }
      
      return newState;
    });
  }, [onFocusChange]);

  // ============================================================================
  // Registro de elementos focáveis
  // ============================================================================

  const registerFocusableElement = useCallback((
    id: string, 
    element: HTMLElement, 
    priority: number = FOCUS_PRIORITY_ORDER.NORMAL,
    tabIndex: number = 0
  ) => {
    if (!isFocusable(element)) {
      console.warn(`Elemento ${id} não é focável:`, element);
      return;
    }

    const focusableElement: FocusableElement = {
      id,
      element,
      priority,
      tabIndex,
      isVisible: true,
      isEnabled: !element.hasAttribute('disabled')
    };

    setFocusableElements(prev => {
      const newMap = new Map(prev);
      newMap.set(id, focusableElement);
      return newMap;
    });

    // Configura atributos de acessibilidade se necessário
    if (!element.id) {
      element.id = id;
    }
    
    if (element.tabIndex < 0 && tabIndex >= 0) {
      element.tabIndex = tabIndex;
    }
  }, []);

  const unregisterFocusableElement = useCallback((id: string) => {
    setFocusableElements(prev => {
      const newMap = new Map(prev);
      newMap.delete(id);
      return newMap;
    });

    // Se o elemento removido estava focado, move o foco
    if (focusState.currentFocusId === id) {
      const remainingElements = Array.from(focusableElements.keys()).filter(elementId => elementId !== id);
      if (remainingElements.length > 0) {
        focusElement(remainingElements[0]);
      } else {
        clearFocus();
      }
    }
  }, [focusState.currentFocusId, focusableElements]);

  const updateElementPriority = useCallback((id: string, priority: number) => {
    setFocusableElements(prev => {
      const element = prev.get(id);
      if (!element) return prev;
      
      const newMap = new Map(prev);
      newMap.set(id, { ...element, priority });
      return newMap;
    });
  }, []);

  // ============================================================================
  // Funções de navegação
  // ============================================================================

  const focusElement = useCallback((id: string): boolean => {
    const focusableElement = focusableElements.get(id);
    if (!focusableElement || !focusableElement.isEnabled || !focusableElement.isVisible) {
      return false;
    }

    try {
      focusableElement.element.focus();
      updateFocusState(id, focusableElement.element);
      return true;
    } catch (error) {
      console.warn(`Erro ao focar elemento ${id}:`, error);
      return false;
    }
  }, [focusableElements, updateFocusState]);

  const focusNext = useCallback((): boolean => {
    const currentId = focusState.currentFocusId;
    if (!currentId) {
      return focusFirst();
    }

    const nextId = moveFocusToNext(currentId, focusOrder, focusableElements);
    return nextId ? focusElement(nextId) : false;
  }, [focusState.currentFocusId, focusOrder, focusableElements, focusElement]);

  const focusPrevious = useCallback((): boolean => {
    const currentId = focusState.currentFocusId;
    if (!currentId) {
      return focusLast();
    }

    const prevId = moveFocusToPrevious(currentId, focusOrder, focusableElements);
    return prevId ? focusElement(prevId) : false;
  }, [focusState.currentFocusId, focusOrder, focusableElements, focusElement]);

  const focusFirst = useCallback((): boolean => {
    if (focusOrder.length === 0) return false;
    return focusElement(focusOrder[0]);
  }, [focusOrder, focusElement]);

  const focusLast = useCallback((): boolean => {
    if (focusOrder.length === 0) return false;
    return focusElement(focusOrder[focusOrder.length - 1]);
  }, [focusOrder, focusElement]);

  const clearFocus = useCallback(() => {
    if (document.activeElement && document.activeElement !== document.body) {
      (document.activeElement as HTMLElement).blur();
    }
    updateFocusState(null, null);
  }, [updateFocusState]);

  const restorePreviousFocus = useCallback((): boolean => {
    if (previousActiveElementRef.current && document.contains(previousActiveElementRef.current)) {
      try {
        previousActiveElementRef.current.focus();
        return true;
      } catch (error) {
        console.warn('Erro ao restaurar foco anterior:', error);
      }
    }
    return false;
  }, []);

  // ============================================================================
  // Event Listeners
  // ============================================================================

  const handleFocusIn = useCallback((event: FocusEvent) => {
    const target = event.target as HTMLElement;
    if (!container?.contains(target)) return;

    // Encontra o elemento focável correspondente
    let focusableId: string | null = null;
    for (const [id, focusableElement] of focusableElements) {
      if (focusableElement.element === target || focusableElement.element.contains(target)) {
        focusableId = id;
        break;
      }
    }

    if (focusableId) {
      updateFocusState(focusableId, target);
    }
  }, [container, focusableElements, updateFocusState]);

  const handleFocusOut = useCallback(debounce((event: FocusEvent) => {
    const relatedTarget = event.relatedTarget as HTMLElement;
    
    // Se o foco saiu completamente do container
    if (!relatedTarget || !container?.contains(relatedTarget)) {
      updateFocusState(null, null);
      
      if (onFocusLost) {
        onFocusLost();
      }
    }
  }, 10), [container, updateFocusState, onFocusLost]);

  // ============================================================================
  // Auto-descoberta de elementos focáveis
  // ============================================================================

  const discoverFocusableElements = useCallback(() => {
    if (!container) return;

    const elements = getFocusableElements(container);
    const newFocusableElements = new Map<string, FocusableElement>();

    elements.forEach((element, index) => {
      const id = element.getAttribute('data-node-id') ||
                element.getAttribute('data-edge-id') ||
                element.id ||
                `auto-focus-${index}`;

      if (!element.id) {
        element.id = id;
      }

      const priority = element.hasAttribute('data-focus-priority')
        ? parseInt(element.getAttribute('data-focus-priority')!, 10)
        : FOCUS_PRIORITY_ORDER.NORMAL;

      const focusableElement: FocusableElement = {
        id,
        element,
        priority,
        tabIndex: element.tabIndex,
        isVisible: true,
        isEnabled: !element.hasAttribute('disabled')
      };

      newFocusableElements.set(id, focusableElement);
    });

    setFocusableElements(newFocusableElements);
  }, [container]);

  // ============================================================================
  // Efeitos
  // ============================================================================

  // Salva o elemento ativo anterior quando o componente monta
  useEffect(() => {
    if (restoreFocus) {
      previousActiveElementRef.current = document.activeElement as HTMLElement;
    }

    return () => {
      if (focusTimeoutRef.current) {
        clearTimeout(focusTimeoutRef.current);
      }
    };
  }, [restoreFocus]);

  // Configura event listeners
  useEffect(() => {
    if (!container) return;

    container.addEventListener('focusin', handleFocusIn);
    container.addEventListener('focusout', handleFocusOut);

    return () => {
      container.removeEventListener('focusin', handleFocusIn);
      container.removeEventListener('focusout', handleFocusOut);
    };
  }, [container, handleFocusIn, handleFocusOut]);

  // Auto-descoberta de elementos focáveis
  useEffect(() => {
    discoverFocusableElements();

    if (!container) return;

    const observer = new MutationObserver(() => {
      discoverFocusableElements();
    });

    observer.observe(container, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['disabled', 'tabindex', 'aria-hidden']
    });

    return () => {
      observer.disconnect();
    };
  }, [container, discoverFocusableElements]);

  // Atualiza ordem de foco quando elementos mudam
  useEffect(() => {
    updateFocusOrder();
  }, [focusableElements, updateFocusOrder]);

  // Auto-foco no primeiro elemento
  useEffect(() => {
    if (autoFocus && focusOrder.length > 0 && !focusState.currentFocusId) {
      focusTimeoutRef.current = setTimeout(() => {
        focusFirst();
      }, 100);
    }
  }, [autoFocus, focusOrder, focusState.currentFocusId, focusFirst]);

  // ============================================================================
  // Return
  // ============================================================================

  return {
    focusState,
    focusableElements,
    focusOrder,
    focusElement,
    focusNext,
    focusPrevious,
    focusFirst,
    focusLast,
    registerFocusableElement,
    unregisterFocusableElement,
    updateElementPriority,
    clearFocus,
    restorePreviousFocus,
    isFocusWithin
  };
}