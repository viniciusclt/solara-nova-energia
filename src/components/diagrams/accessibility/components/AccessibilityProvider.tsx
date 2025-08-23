// ============================================================================
// AccessibilityProvider Component - Provedor de contexto de acessibilidade
// ============================================================================

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { AccessibilityProviderProps, AccessibilityContextValue, AccessibilityConfig } from '../types';
import { DEFAULT_ACCESSIBILITY_CONFIG } from '../constants';
import { useScreenReader } from '../hooks/useScreenReader';
import { prefersReducedMotion, applyReducedMotion, removeReducedMotion } from '../utils';

// ============================================================================
// Context
// ============================================================================

const AccessibilityContext = createContext<AccessibilityContextValue | null>(null);

// ============================================================================
// Hook para usar o contexto
// ============================================================================

export function useAccessibility(): AccessibilityContextValue {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility deve ser usado dentro de um AccessibilityProvider');
  }
  return context;
}

// ============================================================================
// Provider Component
// ============================================================================

export function AccessibilityProvider({
  children,
  config: initialConfig = {},
  onConfigChange,
  enableAutoDetection = true
}: AccessibilityProviderProps) {
  const [config, setConfig] = useState<AccessibilityConfig>({
    ...DEFAULT_ACCESSIBILITY_CONFIG,
    ...initialConfig
  });

  const [preferences, setPreferences] = useState({
    highContrast: false,
    reducedMotion: false,
    largeText: false,
    screenReaderActive: false
  });

  const screenReader = useScreenReader({ config: config.screenReader });

  // ============================================================================
  // Detecção automática de preferências
  // ============================================================================

  const detectSystemPreferences = useCallback(() => {
    if (!enableAutoDetection) return;

    const newPreferences = {
      highContrast: window.matchMedia('(prefers-contrast: high)').matches,
      reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      largeText: window.matchMedia('(min-resolution: 120dpi)').matches,
      screenReaderActive: !!window.navigator.userAgent.match(/(NVDA|JAWS|VoiceOver|TalkBack)/i)
    };

    setPreferences(prev => {
      const changed = Object.keys(newPreferences).some(
        key => prev[key as keyof typeof prev] !== newPreferences[key as keyof typeof newPreferences]
      );

      if (changed) {
        screenReader.announce('Preferências de acessibilidade atualizadas', 'polite');
      }

      return newPreferences;
    });
  }, [enableAutoDetection, screenReader]);

  // ============================================================================
  // Aplicação de configurações
  // ============================================================================

  const applyAccessibilitySettings = useCallback(() => {
    const rootElement = document.documentElement;

    // Alto contraste
    if (preferences.highContrast || config.highContrast) {
      rootElement.classList.add('high-contrast');
      rootElement.style.setProperty('--accessibility-high-contrast', 'true');
    } else {
      rootElement.classList.remove('high-contrast');
      rootElement.style.removeProperty('--accessibility-high-contrast');
    }

    // Movimento reduzido
    if (preferences.reducedMotion || config.reducedMotion) {
      rootElement.classList.add('reduced-motion');
      applyReducedMotion(rootElement);
    } else {
      rootElement.classList.remove('reduced-motion');
      removeReducedMotion(rootElement);
    }

    // Texto grande
    if (preferences.largeText || config.largeText) {
      rootElement.classList.add('large-text');
      rootElement.style.setProperty('--accessibility-font-scale', '1.2');
    } else {
      rootElement.classList.remove('large-text');
      rootElement.style.removeProperty('--accessibility-font-scale');
    }

    // Indicadores de foco aprimorados
    if (config.enhancedFocus) {
      rootElement.classList.add('enhanced-focus');
      rootElement.style.setProperty('--accessibility-focus-width', '3px');
      rootElement.style.setProperty('--accessibility-focus-style', 'solid');
    } else {
      rootElement.classList.remove('enhanced-focus');
      rootElement.style.removeProperty('--accessibility-focus-width');
      rootElement.style.removeProperty('--accessibility-focus-style');
    }
  }, [preferences, config]);

  // ============================================================================
  // Funções de configuração
  // ============================================================================

  const updateConfig = useCallback((newConfig: Partial<AccessibilityConfig>) => {
    setConfig(prev => {
      const updated = { ...prev, ...newConfig };
      
      if (onConfigChange) {
        onConfigChange(updated);
      }
      
      return updated;
    });
  }, [onConfigChange]);

  const toggleHighContrast = useCallback(() => {
    updateConfig({ highContrast: !config.highContrast });
    screenReader.announce(
      `Alto contraste ${!config.highContrast ? 'ativado' : 'desativado'}`,
      'assertive'
    );
  }, [config.highContrast, updateConfig, screenReader]);

  const toggleReducedMotion = useCallback(() => {
    updateConfig({ reducedMotion: !config.reducedMotion });
    screenReader.announce(
      `Movimento reduzido ${!config.reducedMotion ? 'ativado' : 'desativado'}`,
      'assertive'
    );
  }, [config.reducedMotion, updateConfig, screenReader]);

  const toggleLargeText = useCallback(() => {
    updateConfig({ largeText: !config.largeText });
    screenReader.announce(
      `Texto grande ${!config.largeText ? 'ativado' : 'desativado'}`,
      'assertive'
    );
  }, [config.largeText, updateConfig, screenReader]);

  const toggleEnhancedFocus = useCallback(() => {
    updateConfig({ enhancedFocus: !config.enhancedFocus });
    screenReader.announce(
      `Foco aprimorado ${!config.enhancedFocus ? 'ativado' : 'desativado'}`,
      'assertive'
    );
  }, [config.enhancedFocus, updateConfig, screenReader]);

  // ============================================================================
  // Atalhos de teclado globais
  // ============================================================================

  const handleGlobalKeyDown = useCallback((event: KeyboardEvent) => {
    // Ctrl + Alt + H: Toggle high contrast
    if (event.ctrlKey && event.altKey && event.key === 'h') {
      event.preventDefault();
      toggleHighContrast();
    }
    
    // Ctrl + Alt + M: Toggle reduced motion
    if (event.ctrlKey && event.altKey && event.key === 'm') {
      event.preventDefault();
      toggleReducedMotion();
    }
    
    // Ctrl + Alt + T: Toggle large text
    if (event.ctrlKey && event.altKey && event.key === 't') {
      event.preventDefault();
      toggleLargeText();
    }
    
    // Ctrl + Alt + F: Toggle enhanced focus
    if (event.ctrlKey && event.altKey && event.key === 'f') {
      event.preventDefault();
      toggleEnhancedFocus();
    }
  }, [toggleHighContrast, toggleReducedMotion, toggleLargeText, toggleEnhancedFocus]);

  // ============================================================================
  // Efeitos
  // ============================================================================

  // Detecção inicial e listeners para mudanças
  useEffect(() => {
    detectSystemPreferences();

    if (!enableAutoDetection) return;

    const mediaQueries = [
      window.matchMedia('(prefers-contrast: high)'),
      window.matchMedia('(prefers-reduced-motion: reduce)'),
      window.matchMedia('(min-resolution: 120dpi)')
    ];

    const handleMediaChange = () => {
      detectSystemPreferences();
    };

    mediaQueries.forEach(mq => {
      mq.addEventListener('change', handleMediaChange);
    });

    return () => {
      mediaQueries.forEach(mq => {
        mq.removeEventListener('change', handleMediaChange);
      });
    };
  }, [detectSystemPreferences, enableAutoDetection]);

  // Aplicação de configurações quando mudam
  useEffect(() => {
    applyAccessibilitySettings();
  }, [applyAccessibilitySettings]);

  // Atalhos de teclado globais
  useEffect(() => {
    if (config.keyboard?.enabled) {
      document.addEventListener('keydown', handleGlobalKeyDown);
      
      return () => {
        document.removeEventListener('keydown', handleGlobalKeyDown);
      };
    }
  }, [config.keyboard?.enabled, handleGlobalKeyDown]);

  // Anúncio inicial
  useEffect(() => {
    if (config.screenReader?.enabled) {
      screenReader.announce('Sistema de acessibilidade carregado', 'polite');
    }
  }, [config.screenReader?.enabled, screenReader]);

  // ============================================================================
  // Context Value
  // ============================================================================

  const contextValue: AccessibilityContextValue = {
    config,
    preferences,
    updateConfig,
    toggleHighContrast,
    toggleReducedMotion,
    toggleLargeText,
    toggleEnhancedFocus,
    screenReader,
    
    // Estados derivados
    isHighContrast: preferences.highContrast || config.highContrast,
    isReducedMotion: preferences.reducedMotion || config.reducedMotion,
    isLargeText: preferences.largeText || config.largeText,
    isEnhancedFocus: config.enhancedFocus,
    isScreenReaderActive: preferences.screenReaderActive
  };

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <AccessibilityContext.Provider value={contextValue}>
      {children}
      
      {/* CSS customizado para acessibilidade */}
      <style jsx global>{`
        .high-contrast {
          filter: contrast(150%);
        }
        
        .reduced-motion *,
        .reduced-motion *::before,
        .reduced-motion *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
          scroll-behavior: auto !important;
        }
        
        .large-text {
          font-size: 120% !important;
        }
        
        .enhanced-focus *:focus {
          outline: 3px solid #005fcc !important;
          outline-offset: 2px !important;
        }
        
        .sr-only {
          position: absolute !important;
          width: 1px !important;
          height: 1px !important;
          padding: 0 !important;
          margin: -1px !important;
          overflow: hidden !important;
          clip: rect(0, 0, 0, 0) !important;
          white-space: nowrap !important;
          border: 0 !important;
        }
        
        .accessible-node {
          position: relative;
        }
        
        .accessible-node:focus {
          z-index: 1000;
        }
        
        .accessible-node--selected {
          outline: 2px solid #005fcc;
          outline-offset: 1px;
        }
        
        .accessible-node--disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        .accessible-node--draggable:focus {
          cursor: move;
        }
      `}</style>
    </AccessibilityContext.Provider>
  );
}