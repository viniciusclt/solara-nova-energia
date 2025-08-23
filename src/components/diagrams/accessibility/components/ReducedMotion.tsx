// ============================================================================
// ReducedMotion Component - Gerenciador de movimento reduzido
// ============================================================================

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { ReducedMotionProps } from '../types';
import { REDUCED_MOTION_DURATIONS } from '../constants';
import { prefersReducedMotion, applyReducedMotion, removeReducedMotion } from '../utils';
import { useAccessibility } from './AccessibilityProvider';

// ============================================================================
// Component
// ============================================================================

export function ReducedMotion({
  enabled = false,
  respectSystemPreference = true,
  customDurations,
  onToggle,
  className = ''
}: ReducedMotionProps) {
  const [isActive, setIsActive] = useState(enabled);
  const [systemPreference, setSystemPreference] = useState(false);
  const [appliedDurations, setAppliedDurations] = useState<Record<string, string>>({});
  const styleElementRef = useRef<HTMLStyleElement | null>(null);
  const mediaQueryRef = useRef<MediaQueryList | null>(null);
  const { screenReader, config } = useAccessibility();

  // ============================================================================
  // Detecção de preferência do sistema
  // ============================================================================

  const detectSystemPreference = useCallback(() => {
    const prefersReduced = prefersReducedMotion();
    setSystemPreference(prefersReduced);
    
    if (respectSystemPreference && prefersReduced !== isActive) {
      setIsActive(prefersReduced);
      
      if (prefersReduced) {
        screenReader.announce(
          'Movimento reduzido detectado nas preferências do sistema',
          'polite'
        );
      }
    }
  }, [respectSystemPreference, isActive, screenReader]);

  // ============================================================================
  // Aplicação de movimento reduzido
  // ============================================================================

  const applyReducedMotionStyles = useCallback(() => {
    const durations = { ...REDUCED_MOTION_DURATIONS, ...customDurations };
    const rootElement = document.documentElement;
    
    // Remove estilos anteriores
    if (styleElementRef.current) {
      styleElementRef.current.remove();
    }
    
    // Cria novo elemento de estilo
    const styleElement = document.createElement('style');
    styleElement.id = 'reduced-motion-styles';
    
    const cssRules = `
      /* Reduced Motion Styles */
      .reduced-motion,
      .reduced-motion *,
      .reduced-motion *::before,
      .reduced-motion *::after {
        animation-duration: ${durations.animation} !important;
        animation-iteration-count: 1 !important;
        transition-duration: ${durations.transition} !important;
        scroll-behavior: auto !important;
      }
      
      /* Desabilita animações específicas */
      .reduced-motion .animate-spin,
      .reduced-motion .animate-pulse,
      .reduced-motion .animate-bounce {
        animation: none !important;
      }
      
      /* Reduz movimento em transformações */
      .reduced-motion [data-animate="true"] {
        transform: none !important;
      }
      
      /* Elementos específicos do diagrama */
      .reduced-motion .react-flow__node {
        transition: all ${durations.transition} !important;
      }
      
      .reduced-motion .react-flow__edge {
        transition: all ${durations.transition} !important;
      }
      
      .reduced-motion .react-flow__handle {
        transition: all ${durations.transition} !important;
      }
      
      /* Reduz movimento em zoom e pan */
      .reduced-motion .react-flow__viewport {
        transition: transform ${durations.viewport} !important;
      }
      
      /* Tooltips e popovers */
      .reduced-motion .tooltip,
      .reduced-motion .popover {
        transition: opacity ${durations.tooltip} !important;
        animation: none !important;
      }
      
      /* Modais e overlays */
      .reduced-motion .modal,
      .reduced-motion .overlay {
        transition: opacity ${durations.modal} !important;
        animation: none !important;
      }
      
      /* Carregamento e spinners */
      .reduced-motion .loading-spinner {
        animation: none !important;
      }
      
      .reduced-motion .loading-spinner::after {
        content: "⏳";
        display: inline-block;
      }
      
      /* Indicadores de progresso */
      .reduced-motion .progress-bar {
        transition: width ${durations.progress} !important;
      }
      
      /* Notificações e alertas */
      .reduced-motion .notification,
      .reduced-motion .alert {
        transition: all ${durations.notification} !important;
        animation: none !important;
      }
      
      /* Elementos de navegação */
      .reduced-motion .nav-item,
      .reduced-motion .menu-item {
        transition: all ${durations.navigation} !important;
      }
      
      /* Botões e controles */
      .reduced-motion button,
      .reduced-motion .button {
        transition: all ${durations.button} !important;
      }
      
      /* Formulários */
      .reduced-motion input,
      .reduced-motion textarea,
      .reduced-motion select {
        transition: all ${durations.form} !important;
      }
      
      /* Parallax e efeitos de scroll */
      .reduced-motion [data-parallax] {
        transform: none !important;
      }
      
      /* Carrosséis e sliders */
      .reduced-motion .carousel,
      .reduced-motion .slider {
        scroll-behavior: auto !important;
      }
      
      .reduced-motion .carousel-item {
        transition: transform ${durations.carousel} !important;
      }
      
      /* Efeitos de hover reduzidos */
      .reduced-motion *:hover {
        transition: all ${durations.hover} !important;
      }
      
      /* Animações de entrada/saída */
      .reduced-motion .fade-in,
      .reduced-motion .slide-in,
      .reduced-motion .zoom-in {
        animation: none !important;
        opacity: 1 !important;
        transform: none !important;
      }
      
      /* Elementos de foco */
      .reduced-motion *:focus {
        transition: outline ${durations.focus} !important;
      }
      
      /* Gráficos e visualizações */
      .reduced-motion svg,
      .reduced-motion canvas {
        animation: none !important;
      }
      
      .reduced-motion .chart-animation {
        animation-duration: ${durations.chart} !important;
      }
    `;
    
    styleElement.textContent = cssRules;
    document.head.appendChild(styleElement);
    styleElementRef.current = styleElement;
    
    // Aplica classe ao root
    rootElement.classList.add('reduced-motion');
    applyReducedMotion(rootElement);
    
    setAppliedDurations(durations);
  }, [customDurations]);

  // ============================================================================
  // Remoção de movimento reduzido
  // ============================================================================

  const removeReducedMotionStyles = useCallback(() => {
    if (styleElementRef.current) {
      styleElementRef.current.remove();
      styleElementRef.current = null;
    }
    
    const rootElement = document.documentElement;
    rootElement.classList.remove('reduced-motion');
    removeReducedMotion(rootElement);
    
    setAppliedDurations({});
  }, []);

  // ============================================================================
  // Toggle do modo
  // ============================================================================

  const toggleReducedMotion = useCallback(() => {
    const newState = !isActive;
    setIsActive(newState);
    
    if (newState) {
      applyReducedMotionStyles();
      screenReader.announce('Movimento reduzido ativado', 'assertive');
    } else {
      removeReducedMotionStyles();
      screenReader.announce('Movimento reduzido desativado', 'assertive');
    }
    
    onToggle?.(newState);
  }, [isActive, applyReducedMotionStyles, removeReducedMotionStyles, screenReader, onToggle]);

  // ============================================================================
  // Configuração personalizada de durações
  // ============================================================================

  const updateDurations = useCallback((newDurations: Record<string, string>) => {
    if (isActive) {
      // Reaplica com novas durações
      const durations = { ...REDUCED_MOTION_DURATIONS, ...newDurations };
      
      if (styleElementRef.current) {
        // Atualiza CSS existente
        const cssVars = Object.entries(durations)
          .map(([key, value]) => `--reduced-motion-${key}: ${value};`)
          .join('\n');
        
        document.documentElement.style.cssText += cssVars;
      }
      
      setAppliedDurations(durations);
      screenReader.announce('Durações de animação atualizadas', 'polite');
    }
  }, [isActive, screenReader]);

  // ============================================================================
  // Efeitos
  // ============================================================================

  // Detecção inicial e listener para mudanças
  useEffect(() => {
    detectSystemPreference();
    
    if (respectSystemPreference) {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      mediaQueryRef.current = mediaQuery;
      
      const handleChange = () => {
        detectSystemPreference();
      };
      
      mediaQuery.addEventListener('change', handleChange);
      
      return () => {
        mediaQuery.removeEventListener('change', handleChange);
      };
    }
  }, [detectSystemPreference, respectSystemPreference]);

  // Aplicação/remoção baseada no estado
  useEffect(() => {
    if (isActive) {
      applyReducedMotionStyles();
    } else {
      removeReducedMotionStyles();
    }
  }, [isActive, applyReducedMotionStyles, removeReducedMotionStyles]);

  // Sincronização com prop enabled
  useEffect(() => {
    if (enabled !== isActive && !respectSystemPreference) {
      setIsActive(enabled);
    }
  }, [enabled, isActive, respectSystemPreference]);

  // Limpeza na desmontagem
  useEffect(() => {
    return () => {
      removeReducedMotionStyles();
    };
  }, [removeReducedMotionStyles]);

  // ============================================================================
  // Interface de controle
  // ============================================================================

  const renderControls = () => {
    if (!config.reducedMotion) return null;
    
    return (
      <div className="reduced-motion-controls">
        <button
          onClick={toggleReducedMotion}
          aria-pressed={isActive}
          aria-label={`${isActive ? 'Desativar' : 'Ativar'} movimento reduzido`}
          className="reduced-motion-toggle"
          disabled={respectSystemPreference && systemPreference}
        >
          {isActive ? '🐌' : '🏃'} Movimento Reduzido
        </button>
        
        {systemPreference && respectSystemPreference && (
          <span className="system-preference-indicator">
            📱 Detectado nas preferências do sistema
          </span>
        )}
        
        {isActive && (
          <div className="duration-info">
            <small>
              Animações: {appliedDurations.animation || '0.01ms'} |
              Transições: {appliedDurations.transition || '0.01ms'}
            </small>
          </div>
        )}
      </div>
    );
  };

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className={`reduced-motion-component ${className}`}>
      {renderControls()}
      
      {/* Estilos para os controles */}
      <style jsx>{`
        .reduced-motion-controls {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 8px;
          background: rgba(0, 0, 0, 0.05);
          border-radius: 4px;
          border: 1px solid #ddd;
        }
        
        .reduced-motion-toggle {
          padding: 6px 12px;
          background: #6c757d;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: background-color 0.2s;
        }
        
        .reduced-motion-toggle:hover:not(:disabled) {
          background: #5a6268;
        }
        
        .reduced-motion-toggle[aria-pressed="true"] {
          background: #28a745;
        }
        
        .reduced-motion-toggle:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        .system-preference-indicator {
          font-size: 12px;
          color: #6c757d;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        
        .duration-info {
          font-size: 11px;
          color: #6c757d;
          padding: 4px;
          background: rgba(0, 0, 0, 0.05);
          border-radius: 2px;
        }
        
        /* Estilos para movimento reduzido aplicados aos controles */
        .reduced-motion .reduced-motion-toggle {
          transition: none !important;
        }
        
        /* Estilos para modo de alto contraste */
        .high-contrast-mode .reduced-motion-controls {
          background: var(--hc-secondary) !important;
          border-color: var(--hc-border) !important;
        }
        
        .high-contrast-mode .reduced-motion-toggle {
          background: var(--hc-primary) !important;
          color: var(--hc-background) !important;
          border: 2px solid var(--hc-border) !important;
        }
        
        .high-contrast-mode .system-preference-indicator,
        .high-contrast-mode .duration-info {
          color: var(--hc-foreground) !important;
          background: var(--hc-background) !important;
        }
      `}</style>
    </div>
  );
}

// ============================================================================
// Hook para gerenciar movimento reduzido
// ============================================================================

export function useReducedMotion() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [systemPreference, setSystemPreference] = useState(false);
  const { screenReader } = useAccessibility();

  useEffect(() => {
    const checkSystemPreference = () => {
      const prefersReduced = prefersReducedMotion();
      setSystemPreference(prefersReduced);
      setIsEnabled(prefersReduced);
    };
    
    checkSystemPreference();
    
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    mediaQuery.addEventListener('change', checkSystemPreference);
    
    return () => {
      mediaQuery.removeEventListener('change', checkSystemPreference);
    };
  }, []);

  const toggle = useCallback(() => {
    const newState = !isEnabled;
    setIsEnabled(newState);
    
    screenReader.announce(
      `Movimento reduzido ${newState ? 'ativado' : 'desativado'}`,
      'assertive'
    );
  }, [isEnabled, screenReader]);

  const shouldReduceMotion = isEnabled || systemPreference;

  return {
    isEnabled,
    systemPreference,
    shouldReduceMotion,
    toggle,
    enable: () => setIsEnabled(true),
    disable: () => setIsEnabled(false)
  };
}

// ============================================================================
// Hook para aplicar movimento reduzido condicionalmente
// ============================================================================

export function useConditionalAnimation(animation: string, fallback: string = 'none') {
  const { shouldReduceMotion } = useReducedMotion();
  return shouldReduceMotion ? fallback : animation;
}

// ============================================================================
// Hook para durações condicionais
// ============================================================================

export function useConditionalDuration(duration: string, reducedDuration: string = '0.01ms') {
  const { shouldReduceMotion } = useReducedMotion();
  return shouldReduceMotion ? reducedDuration : duration;
}