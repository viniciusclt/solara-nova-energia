// ============================================================================
// FocusIndicator Component - Indicador visual de foco aprimorado
// ============================================================================

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { FocusIndicatorProps } from '../types';
import { useAccessibility } from './AccessibilityProvider';

// ============================================================================
// Component
// ============================================================================

export function FocusIndicator({
  target,
  visible = true,
  style = 'outline',
  color = '#005fcc',
  width = 2,
  offset = 2,
  animated = true,
  showLabel = false,
  label,
  className = ''
}: FocusIndicatorProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0, height: 0 });
  const [targetElement, setTargetElement] = useState<Element | null>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const { config, isEnhancedFocus } = useAccessibility();
  const animationFrameRef = useRef<number>();

  // ============================================================================
  // Resolução do elemento alvo
  // ============================================================================

  const resolveTarget = useCallback(() => {
    if (!target) return null;
    
    if (typeof target === 'string') {
      return document.querySelector(target);
    }
    
    if (target instanceof Element) {
      return target;
    }
    
    if ('current' in target && target.current) {
      return target.current;
    }
    
    return null;
  }, [target]);

  // ============================================================================
  // Cálculo de posição
  // ============================================================================

  const updatePosition = useCallback(() => {
    const element = resolveTarget();
    if (!element) {
      setIsVisible(false);
      return;
    }

    const rect = element.getBoundingClientRect();
    const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;

    setPosition({
      top: rect.top + scrollY - offset,
      left: rect.left + scrollX - offset,
      width: rect.width + (offset * 2),
      height: rect.height + (offset * 2)
    });

    setTargetElement(element);
    setIsVisible(visible && document.activeElement === element);
  }, [target, visible, offset, resolveTarget]);

  // ============================================================================
  // Observadores e listeners
  // ============================================================================

  const handleFocusIn = useCallback((event: FocusEvent) => {
    const element = resolveTarget();
    if (element && event.target === element) {
      updatePosition();
    }
  }, [resolveTarget, updatePosition]);

  const handleFocusOut = useCallback((event: FocusEvent) => {
    const element = resolveTarget();
    if (element && event.target === element) {
      setIsVisible(false);
    }
  }, [resolveTarget]);

  const handleResize = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    animationFrameRef.current = requestAnimationFrame(updatePosition);
  }, [updatePosition]);

  const handleScroll = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    animationFrameRef.current = requestAnimationFrame(updatePosition);
  }, [updatePosition]);

  // ============================================================================
  // Efeitos
  // ============================================================================

  // Setup inicial e cleanup
  useEffect(() => {
    updatePosition();
    
    const element = resolveTarget();
    if (!element) return;

    // Event listeners para foco
    element.addEventListener('focusin', handleFocusIn);
    element.addEventListener('focusout', handleFocusOut);
    
    // Event listeners para mudanças de layout
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll, true);
    
    // Observer para mudanças no DOM
    const observer = new MutationObserver(handleResize);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class']
    });

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      element.removeEventListener('focusin', handleFocusIn);
      element.removeEventListener('focusout', handleFocusOut);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll, true);
      observer.disconnect();
    };
  }, [target, handleFocusIn, handleFocusOut, handleResize, handleScroll, updatePosition, resolveTarget]);

  // Atualização quando propriedades mudam
  useEffect(() => {
    updatePosition();
  }, [visible, offset, updatePosition]);

  // ============================================================================
  // Renderização condicional
  // ============================================================================

  if (!isVisible || !targetElement || !isEnhancedFocus) {
    return null;
  }

  // ============================================================================
  // Estilos dinâmicos
  // ============================================================================

  const getIndicatorStyles = () => {
    const baseStyles: React.CSSProperties = {
      position: 'absolute',
      top: position.top,
      left: position.left,
      width: position.width,
      height: position.height,
      pointerEvents: 'none',
      zIndex: 9999,
      borderRadius: '4px'
    };

    switch (style) {
      case 'outline':
        return {
          ...baseStyles,
          border: `${width}px solid ${color}`,
          background: 'transparent'
        };
      
      case 'glow':
        return {
          ...baseStyles,
          border: `${width}px solid ${color}`,
          boxShadow: `0 0 ${width * 4}px ${color}40`,
          background: 'transparent'
        };
      
      case 'fill':
        return {
          ...baseStyles,
          border: `${width}px solid ${color}`,
          background: `${color}20`
        };
      
      case 'dashed':
        return {
          ...baseStyles,
          border: `${width}px dashed ${color}`,
          background: 'transparent'
        };
      
      default:
        return baseStyles;
    }
  };

  const getLabelStyles = (): React.CSSProperties => ({
    position: 'absolute',
    top: -24,
    left: 0,
    background: color,
    color: 'white',
    padding: '2px 8px',
    borderRadius: '2px',
    fontSize: '12px',
    fontWeight: 'bold',
    whiteSpace: 'nowrap',
    zIndex: 10000
  });

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div
      ref={indicatorRef}
      className={`focus-indicator focus-indicator--${style} ${animated ? 'focus-indicator--animated' : ''} ${className}`}
      style={getIndicatorStyles()}
      role="presentation"
      aria-hidden="true"
      data-testid="focus-indicator"
    >
      {showLabel && label && (
        <div 
          className="focus-indicator__label"
          style={getLabelStyles()}
        >
          {label}
        </div>
      )}
      
      {/* CSS para animações */}
      <style jsx>{`
        .focus-indicator {
          transition: all 0.15s ease-in-out;
        }
        
        .focus-indicator--animated {
          animation: focusPulse 2s infinite;
        }
        
        .focus-indicator--glow {
          animation: focusGlow 1.5s ease-in-out infinite alternate;
        }
        
        @keyframes focusPulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.7;
            transform: scale(1.02);
          }
        }
        
        @keyframes focusGlow {
          0% {
            box-shadow: 0 0 ${width * 4}px ${color}40;
          }
          100% {
            box-shadow: 0 0 ${width * 8}px ${color}60;
          }
        }
        
        .focus-indicator__label {
          animation: labelSlideIn 0.2s ease-out;
        }
        
        @keyframes labelSlideIn {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        /* Desabilita animações se movimento reduzido estiver ativo */
        .reduced-motion .focus-indicator,
        .reduced-motion .focus-indicator--animated,
        .reduced-motion .focus-indicator--glow,
        .reduced-motion .focus-indicator__label {
          animation: none !important;
          transition: none !important;
        }
      `}</style>
    </div>
  );
}

// ============================================================================
// Hook para gerenciar múltiplos indicadores
// ============================================================================

interface FocusIndicatorManager {
  indicators: Map<string, FocusIndicatorProps>;
  addIndicator: (id: string, props: FocusIndicatorProps) => void;
  removeIndicator: (id: string) => void;
  updateIndicator: (id: string, props: Partial<FocusIndicatorProps>) => void;
  clearAll: () => void;
}

export function useFocusIndicators(): FocusIndicatorManager {
  const [indicators, setIndicators] = useState<Map<string, FocusIndicatorProps>>(new Map());

  const addIndicator = useCallback((id: string, props: FocusIndicatorProps) => {
    setIndicators(prev => new Map(prev.set(id, props)));
  }, []);

  const removeIndicator = useCallback((id: string) => {
    setIndicators(prev => {
      const newMap = new Map(prev);
      newMap.delete(id);
      return newMap;
    });
  }, []);

  const updateIndicator = useCallback((id: string, props: Partial<FocusIndicatorProps>) => {
    setIndicators(prev => {
      const existing = prev.get(id);
      if (!existing) return prev;
      
      const newMap = new Map(prev);
      newMap.set(id, { ...existing, ...props });
      return newMap;
    });
  }, []);

  const clearAll = useCallback(() => {
    setIndicators(new Map());
  }, []);

  return {
    indicators,
    addIndicator,
    removeIndicator,
    updateIndicator,
    clearAll
  };
}

// ============================================================================
// Componente para renderizar múltiplos indicadores
// ============================================================================

interface MultiFocusIndicatorProps {
  indicators: Map<string, FocusIndicatorProps>;
  className?: string;
}

export function MultiFocusIndicator({ indicators, className = '' }: MultiFocusIndicatorProps) {
  return (
    <div className={`multi-focus-indicator ${className}`}>
      {Array.from(indicators.entries()).map(([id, props]) => (
        <FocusIndicator
          key={id}
          {...props}
          className={`${props.className || ''} focus-indicator--${id}`}
        />
      ))}
    </div>
  );
}

// ============================================================================
// Hook para indicador automático baseado em foco
// ============================================================================

interface AutoFocusIndicatorOptions {
  enabled?: boolean;
  style?: FocusIndicatorProps['style'];
  color?: string;
  width?: number;
  offset?: number;
  animated?: boolean;
  showLabel?: boolean;
  labelSelector?: (element: Element) => string;
}

export function useAutoFocusIndicator(options: AutoFocusIndicatorOptions = {}) {
  const {
    enabled = true,
    style = 'outline',
    color = '#005fcc',
    width = 2,
    offset = 2,
    animated = true,
    showLabel = false,
    labelSelector
  } = options;

  const [currentTarget, setCurrentTarget] = useState<Element | null>(null);
  const [label, setLabel] = useState<string>('');

  useEffect(() => {
    if (!enabled) return;

    const handleFocusIn = (event: FocusEvent) => {
      const target = event.target as Element;
      setCurrentTarget(target);
      
      if (showLabel && labelSelector) {
        setLabel(labelSelector(target));
      } else if (showLabel) {
        const ariaLabel = target.getAttribute('aria-label');
        const title = target.getAttribute('title');
        const textContent = target.textContent?.trim();
        setLabel(ariaLabel || title || textContent || 'Elemento focado');
      }
    };

    const handleFocusOut = () => {
      setCurrentTarget(null);
      setLabel('');
    };

    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);

    return () => {
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
    };
  }, [enabled, showLabel, labelSelector]);

  if (!enabled || !currentTarget) {
    return null;
  }

  return (
    <FocusIndicator
      target={currentTarget}
      style={style}
      color={color}
      width={width}
      offset={offset}
      animated={animated}
      showLabel={showLabel}
      label={label}
    />
  );
}