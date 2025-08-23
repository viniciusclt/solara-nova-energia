// ============================================================================
// useKeyboardNavigation Hook - Navegação por teclado para diagramas
// ============================================================================

import { useState, useCallback, useEffect, useRef } from 'react';
import { KeyboardNavigationConfig, NavigationDirection } from '../types';
import { KEYBOARD_KEYS, DEFAULT_KEYBOARD_SHORTCUTS } from '../constants';
import { isNavigationKey, isActionKey, matchesKeyCombo } from '../utils';

interface UseKeyboardNavigationProps {
  container: HTMLElement | null;
  config?: KeyboardNavigationConfig;
  onNavigate?: (direction: NavigationDirection, fromId: string | null, toId: string | null) => void;
  onAction?: (action: string, elementId: string | null) => void;
}

interface UseKeyboardNavigationReturn {
  focusedElementId: string | null;
  navigateToNext: () => void;
  navigateToPrevious: () => void;
  navigateToFirst: () => void;
  navigateToLast: () => void;
  navigateUp: () => void;
  navigateDown: () => void;
  navigateLeft: () => void;
  navigateRight: () => void;
  handleKeyDown: (event: KeyboardEvent) => void;
  setFocusedElement: (id: string | null) => void;
}

export function useKeyboardNavigation({
  container,
  config = {
    enabled: true,
    shortcuts: DEFAULT_KEYBOARD_SHORTCUTS,
    trapFocus: true,
    skipDisabled: true,
    announceNavigation: true
  },
  onNavigate,
  onAction
}: UseKeyboardNavigationProps): UseKeyboardNavigationReturn {
  const [focusedElementId, setFocusedElementId] = useState<string | null>(null);
  const focusableElementsRef = useRef<Map<string, HTMLElement>>(new Map());
  const focusOrderRef = useRef<string[]>([]);

  // ============================================================================
  // Utilitários de navegação
  // ============================================================================

  const updateFocusableElements = useCallback(() => {
    if (!container) return;

    const focusableSelectors = [
      '[data-node-id]',
      '[data-edge-id]',
      'button:not([disabled])',
      'input:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[role="button"]:not([aria-disabled="true"])',
      '[role="menuitem"]:not([aria-disabled="true"])'
    ].join(', ');

    const elements = Array.from(container.querySelectorAll(focusableSelectors)) as HTMLElement[];
    const newFocusableElements = new Map<string, HTMLElement>();
    const newFocusOrder: string[] = [];

    elements.forEach((element) => {
      // Verifica se o elemento é realmente focável
      if (config.skipDisabled && element.hasAttribute('disabled')) return;
      if (element.getAttribute('aria-hidden') === 'true') return;
      
      const style = window.getComputedStyle(element);
      if (style.display === 'none' || style.visibility === 'hidden') return;

      // Obtém ID do elemento
      const id = element.getAttribute('data-node-id') ||
                element.getAttribute('data-edge-id') ||
                element.id ||
                `focusable-${newFocusableElements.size}`;

      if (!element.id) {
        element.id = id;
      }

      newFocusableElements.set(id, element);
      newFocusOrder.push(id);
    });

    // Ordena elementos por posição visual
    newFocusOrder.sort((a, b) => {
      const elementA = newFocusableElements.get(a)!;
      const elementB = newFocusableElements.get(b)!;
      
      const rectA = elementA.getBoundingClientRect();
      const rectB = elementB.getBoundingClientRect();
      
      // Primeiro por linha (top)
      if (Math.abs(rectA.top - rectB.top) > 5) {
        return rectA.top - rectB.top;
      }
      
      // Depois por coluna (left)
      return rectA.left - rectB.left;
    });

    focusableElementsRef.current = newFocusableElements;
    focusOrderRef.current = newFocusOrder;
  }, [container, config.skipDisabled]);

  // ============================================================================
  // Funções de navegação
  // ============================================================================

  const navigateToIndex = useCallback((index: number) => {
    const focusOrder = focusOrderRef.current;
    if (focusOrder.length === 0) return;

    const clampedIndex = Math.max(0, Math.min(index, focusOrder.length - 1));
    const targetId = focusOrder[clampedIndex];
    const targetElement = focusableElementsRef.current.get(targetId);

    if (targetElement) {
      const previousId = focusedElementId;
      setFocusedElementId(targetId);
      targetElement.focus();
      
      if (onNavigate) {
        onNavigate('direct', previousId, targetId);
      }
    }
  }, [focusedElementId, onNavigate]);

  const navigateToNext = useCallback(() => {
    const focusOrder = focusOrderRef.current;
    const currentIndex = focusedElementId ? focusOrder.indexOf(focusedElementId) : -1;
    
    let nextIndex = currentIndex + 1;
    if (config.trapFocus && nextIndex >= focusOrder.length) {
      nextIndex = 0;
    }
    
    if (nextIndex < focusOrder.length) {
      navigateToIndex(nextIndex);
    }
  }, [focusedElementId, navigateToIndex, config.trapFocus]);

  const navigateToPrevious = useCallback(() => {
    const focusOrder = focusOrderRef.current;
    const currentIndex = focusedElementId ? focusOrder.indexOf(focusedElementId) : -1;
    
    let prevIndex = currentIndex - 1;
    if (config.trapFocus && prevIndex < 0) {
      prevIndex = focusOrder.length - 1;
    }
    
    if (prevIndex >= 0) {
      navigateToIndex(prevIndex);
    }
  }, [focusedElementId, navigateToIndex, config.trapFocus]);

  const navigateToFirst = useCallback(() => {
    navigateToIndex(0);
  }, [navigateToIndex]);

  const navigateToLast = useCallback(() => {
    const focusOrder = focusOrderRef.current;
    navigateToIndex(focusOrder.length - 1);
  }, [navigateToIndex]);

  // ============================================================================
  // Navegação direcional (para diagramas)
  // ============================================================================

  const navigateInDirection = useCallback((direction: NavigationDirection) => {
    if (!focusedElementId) {
      navigateToFirst();
      return;
    }

    const currentElement = focusableElementsRef.current.get(focusedElementId);
    if (!currentElement) return;

    const currentRect = currentElement.getBoundingClientRect();
    const candidates: Array<{ id: string; element: HTMLElement; distance: number }> = [];

    focusableElementsRef.current.forEach((element, id) => {
      if (id === focusedElementId) return;

      const rect = element.getBoundingClientRect();
      let isValidDirection = false;
      let distance = 0;

      switch (direction) {
        case 'up':
          isValidDirection = rect.bottom <= currentRect.top;
          distance = currentRect.top - rect.bottom + Math.abs(rect.left - currentRect.left) * 0.1;
          break;
        case 'down':
          isValidDirection = rect.top >= currentRect.bottom;
          distance = rect.top - currentRect.bottom + Math.abs(rect.left - currentRect.left) * 0.1;
          break;
        case 'left':
          isValidDirection = rect.right <= currentRect.left;
          distance = currentRect.left - rect.right + Math.abs(rect.top - currentRect.top) * 0.1;
          break;
        case 'right':
          isValidDirection = rect.left >= currentRect.right;
          distance = rect.left - currentRect.right + Math.abs(rect.top - currentRect.top) * 0.1;
          break;
      }

      if (isValidDirection) {
        candidates.push({ id, element, distance });
      }
    });

    if (candidates.length > 0) {
      // Encontra o candidato mais próximo
      candidates.sort((a, b) => a.distance - b.distance);
      const target = candidates[0];
      
      setFocusedElementId(target.id);
      target.element.focus();
      
      if (onNavigate) {
        onNavigate(direction, focusedElementId, target.id);
      }
    }
  }, [focusedElementId, navigateToFirst, onNavigate]);

  const navigateUp = useCallback(() => navigateInDirection('up'), [navigateInDirection]);
  const navigateDown = useCallback(() => navigateInDirection('down'), [navigateInDirection]);
  const navigateLeft = useCallback(() => navigateInDirection('left'), [navigateInDirection]);
  const navigateRight = useCallback(() => navigateInDirection('right'), [navigateInDirection]);

  // ============================================================================
  // Manipulador de eventos de teclado
  // ============================================================================

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!config.enabled) return;

    // Verifica atalhos personalizados
    for (const [action, combo] of Object.entries(config.shortcuts)) {
      if (matchesKeyCombo(event, combo)) {
        event.preventDefault();
        
        if (onAction) {
          onAction(action, focusedElementId);
        }
        
        return;
      }
    }

    // Navegação básica
    if (isNavigationKey(event.key)) {
      event.preventDefault();
      
      switch (event.key) {
        case KEYBOARD_KEYS.TAB:
          if (event.shiftKey) {
            navigateToPrevious();
          } else {
            navigateToNext();
          }
          break;
        case KEYBOARD_KEYS.ARROW_UP:
          navigateUp();
          break;
        case KEYBOARD_KEYS.ARROW_DOWN:
          navigateDown();
          break;
        case KEYBOARD_KEYS.ARROW_LEFT:
          navigateLeft();
          break;
        case KEYBOARD_KEYS.ARROW_RIGHT:
          navigateRight();
          break;
        case KEYBOARD_KEYS.HOME:
          navigateToFirst();
          break;
        case KEYBOARD_KEYS.END:
          navigateToLast();
          break;
      }
    }

    // Ações
    if (isActionKey(event.key)) {
      switch (event.key) {
        case KEYBOARD_KEYS.ENTER:
        case KEYBOARD_KEYS.SPACE:
          if (focusedElementId && onAction) {
            event.preventDefault();
            onAction('activate', focusedElementId);
          }
          break;
        case KEYBOARD_KEYS.DELETE:
        case KEYBOARD_KEYS.BACKSPACE:
          if (focusedElementId && onAction) {
            event.preventDefault();
            onAction('delete', focusedElementId);
          }
          break;
        case KEYBOARD_KEYS.ESCAPE:
          if (onAction) {
            event.preventDefault();
            onAction('escape', focusedElementId);
          }
          break;
      }
    }
  }, [config, focusedElementId, onAction, navigateToNext, navigateToPrevious, navigateUp, navigateDown, navigateLeft, navigateRight, navigateToFirst, navigateToLast]);

  // ============================================================================
  // Efeitos
  // ============================================================================

  // Atualiza elementos focáveis quando o container muda
  useEffect(() => {
    updateFocusableElements();
    
    if (!container) return;

    // Observer para mudanças no DOM
    const observer = new MutationObserver(() => {
      updateFocusableElements();
    });

    observer.observe(container, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['disabled', 'aria-hidden', 'tabindex']
    });

    return () => {
      observer.disconnect();
    };
  }, [container, updateFocusableElements]);

  // Limpa foco se o elemento focado for removido
  useEffect(() => {
    if (focusedElementId && !focusableElementsRef.current.has(focusedElementId)) {
      setFocusedElementId(null);
    }
  }, [focusedElementId]);

  // ============================================================================
  // Return
  // ============================================================================

  return {
    focusedElementId,
    navigateToNext,
    navigateToPrevious,
    navigateToFirst,
    navigateToLast,
    navigateUp,
    navigateDown,
    navigateLeft,
    navigateRight,
    handleKeyDown,
    setFocusedElement: setFocusedElementId
  };
}