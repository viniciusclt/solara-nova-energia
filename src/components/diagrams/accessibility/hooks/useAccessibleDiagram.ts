// ============================================================================
// useAccessibleDiagram Hook - Hook principal para acessibilidade de diagramas
// ============================================================================

import { useCallback, useEffect, useRef } from 'react';
import { useKeyboardNavigation } from './useKeyboardNavigation';
import { useFocusManagement } from './useFocusManagement';
import { useScreenReader } from './useScreenReader';
import { AccessibilityConfig } from '../types';
import { DEFAULT_ACCESSIBILITY_CONFIG } from '../constants';
import { validateAccessibility } from '../utils';

interface UseAccessibleDiagramProps {
  config?: Partial<AccessibilityConfig>;
  onAccessibilityViolation?: (element: HTMLElement, issues: string[]) => void;
}

interface UseAccessibleDiagramReturn {
  // Refs
  diagramRef: React.RefObject<HTMLDivElement>;
  
  // Navigation
  focusedElementId: string | null;
  navigateToNext: () => void;
  navigateToPrevious: () => void;
  navigateToFirst: () => void;
  navigateToLast: () => void;
  
  // Focus management
  focusElement: (id: string) => void;
  registerFocusableElement: (id: string, element: HTMLElement, priority?: number) => void;
  unregisterFocusableElement: (id: string) => void;
  
  // Screen reader
  announce: (message: string, priority?: 'polite' | 'assertive') => void;
  announceNodeSelection: (nodeId: string, nodeType: string, nodeLabel: string) => void;
  announceEdgeCreation: (sourceId: string, targetId: string) => void;
  announceNodeDeletion: (nodeId: string, nodeType: string) => void;
  
  // Validation
  validateDiagramAccessibility: () => { valid: boolean; issues: Array<{ element: HTMLElement; issues: string[] }> };
  
  // Configuration
  updateConfig: (newConfig: Partial<AccessibilityConfig>) => void;
  isHighContrast: boolean;
  isReducedMotion: boolean;
}

export function useAccessibleDiagram({
  config: userConfig = {},
  onAccessibilityViolation
}: UseAccessibleDiagramProps = {}): UseAccessibleDiagramReturn {
  const diagramRef = useRef<HTMLDivElement>(null);
  const configRef = useRef<AccessibilityConfig>({
    ...DEFAULT_ACCESSIBILITY_CONFIG,
    ...userConfig
  });

  // Hooks de acessibilidade
  const {
    focusedElementId,
    navigateToNext,
    navigateToPrevious,
    navigateToFirst,
    navigateToLast,
    handleKeyDown
  } = useKeyboardNavigation({
    container: diagramRef.current,
    config: configRef.current.keyboard
  });

  const {
    focusElement,
    registerFocusableElement,
    unregisterFocusableElement,
    focusableElements
  } = useFocusManagement({
    container: diagramRef.current,
    onFocusChange: (elementId) => {
      if (elementId && configRef.current.screenReader.enabled) {
        const element = focusableElements.get(elementId);
        if (element) {
          announce(`Focado em ${element.element.getAttribute('aria-label') || 'elemento'}`);
        }
      }
    }
  });

  const {
    announce,
    announcements
  } = useScreenReader({
    config: configRef.current.screenReader
  });

  // ============================================================================
  // Anúncios específicos para diagramas
  // ============================================================================

  const announceNodeSelection = useCallback((nodeId: string, nodeType: string, nodeLabel: string) => {
    if (!configRef.current.screenReader.enabled) return;
    
    const message = `Nó ${nodeType} selecionado: ${nodeLabel}`;
    announce(message, 'polite');
  }, [announce]);

  const announceEdgeCreation = useCallback((sourceId: string, targetId: string) => {
    if (!configRef.current.screenReader.enabled) return;
    
    const message = `Nova conexão criada entre ${sourceId} e ${targetId}`;
    announce(message, 'assertive');
  }, [announce]);

  const announceNodeDeletion = useCallback((nodeId: string, nodeType: string) => {
    if (!configRef.current.screenReader.enabled) return;
    
    const message = `Nó ${nodeType} ${nodeId} removido do diagrama`;
    announce(message, 'assertive');
  }, [announce]);

  // ============================================================================
  // Validação de acessibilidade
  // ============================================================================

  const validateDiagramAccessibility = useCallback(() => {
    const issues: Array<{ element: HTMLElement; issues: string[] }> = [];
    
    if (!diagramRef.current) {
      return { valid: false, issues };
    }

    // Valida todos os elementos focáveis
    focusableElements.forEach((focusableElement) => {
      const validation = validateAccessibility(focusableElement.element);
      if (!validation.valid) {
        issues.push({
          element: focusableElement.element,
          issues: validation.issues
        });
        
        // Chama callback se fornecido
        if (onAccessibilityViolation) {
          onAccessibilityViolation(focusableElement.element, validation.issues);
        }
      }
    });

    // Valida estrutura geral do diagrama
    const diagramElement = diagramRef.current;
    if (!diagramElement.getAttribute('role')) {
      issues.push({
        element: diagramElement,
        issues: ['Diagrama não possui role definido']
      });
    }

    if (!diagramElement.getAttribute('aria-label') && !diagramElement.getAttribute('aria-labelledby')) {
      issues.push({
        element: diagramElement,
        issues: ['Diagrama não possui aria-label ou aria-labelledby']
      });
    }

    return {
      valid: issues.length === 0,
      issues
    };
  }, [focusableElements, onAccessibilityViolation]);

  // ============================================================================
  // Configuração e preferências do usuário
  // ============================================================================

  const updateConfig = useCallback((newConfig: Partial<AccessibilityConfig>) => {
    configRef.current = {
      ...configRef.current,
      ...newConfig
    };
  }, []);

  // Detecta preferências do sistema
  const isHighContrast = window.matchMedia('(prefers-contrast: high)').matches;
  const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ============================================================================
  // Event Listeners
  // ============================================================================

  useEffect(() => {
    const diagramElement = diagramRef.current;
    if (!diagramElement) return;

    // Adiciona event listener para navegação por teclado
    diagramElement.addEventListener('keydown', handleKeyDown);

    // Configura atributos básicos de acessibilidade
    if (!diagramElement.getAttribute('role')) {
      diagramElement.setAttribute('role', 'application');
    }
    
    if (!diagramElement.getAttribute('aria-label')) {
      diagramElement.setAttribute('aria-label', 'Editor de diagramas interativo');
    }

    // Torna o diagrama focável
    if (diagramElement.tabIndex < 0) {
      diagramElement.tabIndex = 0;
    }

    return () => {
      diagramElement.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // ============================================================================
  // Validação automática (desenvolvimento)
  // ============================================================================

  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && configRef.current.validateOnMount) {
      const timer = setTimeout(() => {
        const validation = validateDiagramAccessibility();
        if (!validation.valid) {
          console.warn('Problemas de acessibilidade detectados:', validation.issues);
        }
      }, 1000); // Aguarda 1 segundo para elementos serem renderizados

      return () => clearTimeout(timer);
    }
  }, [validateDiagramAccessibility]);

  // ============================================================================
  // Return
  // ============================================================================

  return {
    // Refs
    diagramRef,
    
    // Navigation
    focusedElementId,
    navigateToNext,
    navigateToPrevious,
    navigateToFirst,
    navigateToLast,
    
    // Focus management
    focusElement,
    registerFocusableElement,
    unregisterFocusableElement,
    
    // Screen reader
    announce,
    announceNodeSelection,
    announceEdgeCreation,
    announceNodeDeletion,
    
    // Validation
    validateDiagramAccessibility,
    
    // Configuration
    updateConfig,
    isHighContrast,
    isReducedMotion
  };
}