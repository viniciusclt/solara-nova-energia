/**
 * Hook para Micro-interações - Design System
 * Gerencia animações e transições de forma eficiente
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { microInteractions, createAnimation, performanceOptimizations } from './microInteractions';

// =====================================================================================
// TIPOS E INTERFACES
// =====================================================================================

type AnimationType = 'entrance' | 'exit' | 'hover' | 'focus' | 'loading';
type ComponentType = 'button' | 'card' | 'input' | 'modal' | 'notification' | 'tooltip';
type AnimationState = 'idle' | 'animating' | 'completed';

interface AnimationConfig {
  type: AnimationType;
  component: ComponentType;
  variant?: string;
  duration?: number;
  delay?: number;
  easing?: string;
  respectReducedMotion?: boolean;
}

interface MicroInteractionOptions {
  enableGPU?: boolean;
  respectReducedMotion?: boolean;
  performanceMode?: 'auto' | 'high' | 'low';
  debugMode?: boolean;
}

// =====================================================================================
// HOOK PRINCIPAL
// =====================================================================================

export const useMicroInteractions = (options: MicroInteractionOptions = {}) => {
  const {
    enableGPU = true,
    respectReducedMotion = true,
    performanceMode = 'auto',
    debugMode = false
  } = options;

  const [animationState, setAnimationState] = useState<AnimationState>('idle');
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const animationRef = useRef<HTMLElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Detectar preferência de movimento reduzido
  useEffect(() => {
    if (respectReducedMotion && typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mediaQuery.matches);
      
      const handleChange = (e: MediaQueryListEvent) => {
        setPrefersReducedMotion(e.matches);
      };
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [respectReducedMotion]);

  // Limpar timeouts ao desmontar
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // =====================================================================================
  // FUNÇÕES DE ANIMAÇÃO
  // =====================================================================================

  const animate = useCallback(async (config: AnimationConfig): Promise<void> => {
    if (prefersReducedMotion && config.respectReducedMotion !== false) {
      if (debugMode) console.log('Animation skipped due to reduced motion preference');
      return Promise.resolve();
    }

    setAnimationState('animating');

    return new Promise((resolve) => {
      const duration = config.duration || 300;
      
      if (debugMode) {
        console.log('Starting animation:', config);
      }

      timeoutRef.current = setTimeout(() => {
        setAnimationState('completed');
        resolve();
        
        // Reset para idle após um pequeno delay
        setTimeout(() => setAnimationState('idle'), 50);
      }, duration);
    });
  }, [prefersReducedMotion, debugMode]);

  // =====================================================================================
  // GETTERS DE CLASSES CSS
  // =====================================================================================

  const getButtonClasses = useCallback((variant: 'primary' | 'secondary' | 'ghost' = 'primary') => {
    const baseClasses = microInteractions.button[variant];
    const gpuClasses = enableGPU ? 'transform-gpu' : '';
    
    return {
      base: `${baseClasses.base} ${gpuClasses}`,
      hover: baseClasses.hover,
      focus: baseClasses.focus,
      active: baseClasses.active || ''
    };
  }, [enableGPU]);

  const getCardClasses = useCallback((variant: 'default' | 'financial' | 'interactive' = 'default') => {
    const baseClasses = microInteractions.card[variant];
    const gpuClasses = enableGPU ? 'transform-gpu' : '';
    
    return {
      base: `${baseClasses.base} ${gpuClasses}`,
      hover: baseClasses.hover,
      entrance: baseClasses.entrance
    };
  }, [enableGPU]);

  const getInputClasses = useCallback((state: 'default' | 'focus' | 'error' | 'success' = 'default') => {
    const baseClasses = microInteractions.input;
    
    return {
      base: baseClasses.base,
      focus: baseClasses.focus,
      error: baseClasses.error,
      success: baseClasses.success,
      current: state !== 'default' ? baseClasses[state] : ''
    };
  }, []);

  const getModalClasses = useCallback(() => {
    return {
      backdrop: microInteractions.modal.backdrop,
      content: microInteractions.modal.content
    };
  }, []);

  // =====================================================================================
  // FUNÇÕES DE HOVER E FOCUS
  // =====================================================================================

  const createHoverEffect = useCallback((
    type: 'scale' | 'lift' | 'glow' | 'rotate',
    intensity: 'subtle' | 'normal' | 'strong' = 'normal'
  ) => {
    return createAnimation.hover(type, intensity);
  }, []);

  const createEntranceAnimation = useCallback((
    type: 'fade' | 'slide' | 'scale' | 'bounce',
    direction?: 'up' | 'down' | 'left' | 'right'
  ) => {
    return createAnimation.entrance(type, direction);
  }, []);

  // =====================================================================================
  // FUNÇÕES DE LOADING
  // =====================================================================================

  const getLoadingClasses = useCallback((type: 'shimmer' | 'pulse' | 'dots' | 'progress') => {
    return createAnimation.loading(type);
  }, []);

  const getSkeletonClasses = useCallback((variant: 'base' | 'shimmer' = 'base') => {
    return microInteractions.skeleton[variant];
  }, []);

  // =====================================================================================
  // FUNÇÕES DE PERFORMANCE
  // =====================================================================================

  const optimizeForPerformance = useCallback((element: HTMLElement | null) => {
    if (!element || !enableGPU) return;

    // Aplicar otimizações de GPU
    Object.assign(element.style, performanceOptimizations.gpu.enable);
    
    // Configurar will-change baseado no modo de performance
    if (performanceMode === 'high') {
      Object.assign(element.style, performanceOptimizations.willChange.transform);
    }
  }, [enableGPU, performanceMode]);

  const resetPerformanceOptimizations = useCallback((element: HTMLElement | null) => {
    if (!element) return;

    Object.assign(element.style, {
      ...performanceOptimizations.gpu.disable,
      ...performanceOptimizations.willChange.auto
    });
  }, []);

  // =====================================================================================
  // HANDLERS DE EVENTOS
  // =====================================================================================

  const handleMouseEnter = useCallback((callback?: () => void) => {
    return (e: React.MouseEvent<HTMLElement>) => {
      optimizeForPerformance(e.currentTarget);
      callback?.();
    };
  }, [optimizeForPerformance]);

  const handleMouseLeave = useCallback((callback?: () => void) => {
    return (e: React.MouseEvent<HTMLElement>) => {
      resetPerformanceOptimizations(e.currentTarget);
      callback?.();
    };
  }, [resetPerformanceOptimizations]);

  const handleFocus = useCallback((callback?: () => void) => {
    return (e: React.FocusEvent<HTMLElement>) => {
      optimizeForPerformance(e.currentTarget);
      callback?.();
    };
  }, [optimizeForPerformance]);

  const handleBlur = useCallback((callback?: () => void) => {
    return (e: React.FocusEvent<HTMLElement>) => {
      resetPerformanceOptimizations(e.currentTarget);
      callback?.();
    };
  }, [resetPerformanceOptimizations]);

  // =====================================================================================
  // FUNÇÕES DE UTILIDADE
  // =====================================================================================

  const combineClasses = useCallback((...classes: (string | undefined | false)[]): string => {
    return classes.filter(Boolean).join(' ');
  }, []);

  const createTransition = useCallback((
    property: string,
    duration: number = 300,
    easing: string = 'ease-in-out'
  ) => {
    return {
      transition: `${property} ${duration}ms ${easing}`
    };
  }, []);

  // =====================================================================================
  // RETURN DO HOOK
  // =====================================================================================

  return {
    // Estado
    animationState,
    prefersReducedMotion,
    
    // Funções de animação
    animate,
    
    // Getters de classes
    getButtonClasses,
    getCardClasses,
    getInputClasses,
    getModalClasses,
    getLoadingClasses,
    getSkeletonClasses,
    
    // Criadores de efeitos
    createHoverEffect,
    createEntranceAnimation,
    createTransition,
    
    // Handlers de eventos
    handleMouseEnter,
    handleMouseLeave,
    handleFocus,
    handleBlur,
    
    // Utilitários
    combineClasses,
    optimizeForPerformance,
    resetPerformanceOptimizations,
    
    // Ref para elemento
    animationRef
  };
};

// =====================================================================================
// HOOKS ESPECIALIZADOS
// =====================================================================================

// Hook para animações de entrada
export const useEntranceAnimation = (
  type: 'fade' | 'slide' | 'scale' | 'bounce' = 'fade',
  direction?: 'up' | 'down' | 'left' | 'right',
  delay: number = 0
) => {
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  const animationStyle = createAnimation.entrance(type, direction);

  return {
    ref: elementRef,
    isVisible,
    style: isVisible ? animationStyle : { opacity: 0 },
    className: isVisible ? 'animate-in' : 'opacity-0'
  };
};

// Hook para hover effects
export const useHoverEffect = (
  type: 'scale' | 'lift' | 'glow' | 'rotate' = 'scale',
  intensity: 'subtle' | 'normal' | 'strong' = 'normal'
) => {
  const [isHovered, setIsHovered] = useState(false);
  const hoverStyle = createAnimation.hover(type, intensity);

  return {
    isHovered,
    style: isHovered ? hoverStyle : {},
    handlers: {
      onMouseEnter: () => setIsHovered(true),
      onMouseLeave: () => setIsHovered(false)
    }
  };
};

// Hook para loading states
export const useLoadingAnimation = (
  type: 'shimmer' | 'pulse' | 'dots' | 'progress' = 'pulse'
) => {
  const [isLoading, setIsLoading] = useState(false);
  const loadingStyle = createAnimation.loading(type);

  return {
    isLoading,
    setIsLoading,
    style: isLoading ? loadingStyle : {},
    className: isLoading ? 'animate-pulse' : ''
  };
};

export default useMicroInteractions;