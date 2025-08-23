// ============================================================================
// HighContrastMode Component - Gerenciador de modo de alto contraste
// ============================================================================

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { HighContrastModeProps } from '../types';
import { HIGH_CONTRAST_COLORS, COLORBLIND_FILTERS } from '../constants';
import { applyHighContrastColors, removeHighContrastColors, calculateContrast, hexToRgb } from '../utils';
import { useAccessibility } from './AccessibilityProvider';

// ============================================================================
// Component
// ============================================================================

export function HighContrastMode({
  enabled = false,
  colorScheme = 'dark',
  customColors,
  colorBlindSupport = false,
  colorBlindType = 'protanopia',
  onToggle,
  className = ''
}: HighContrastModeProps) {
  const [isActive, setIsActive] = useState(enabled);
  const [currentScheme, setCurrentScheme] = useState(colorScheme);
  const [appliedColors, setAppliedColors] = useState<Record<string, string>>({});
  const styleElementRef = useRef<HTMLStyleElement | null>(null);
  const { screenReader, config } = useAccessibility();

  // ============================================================================
  // Esquemas de cores predefinidos
  // ============================================================================

  const getColorScheme = useCallback((scheme: string) => {
    const baseColors = HIGH_CONTRAST_COLORS[scheme as keyof typeof HIGH_CONTRAST_COLORS] || HIGH_CONTRAST_COLORS.dark;
    
    if (customColors) {
      return { ...baseColors, ...customColors };
    }
    
    return baseColors;
  }, [customColors]);

  // ============================================================================
  // Aplicação de cores
  // ============================================================================

  const applyColorScheme = useCallback((scheme: string) => {
    const colors = getColorScheme(scheme);
    const rootElement = document.documentElement;
    
    // Remove cores anteriores
    if (styleElementRef.current) {
      styleElementRef.current.remove();
    }
    
    // Cria novo elemento de estilo
    const styleElement = document.createElement('style');
    styleElement.id = 'high-contrast-mode';
    
    let cssRules = `
      /* High Contrast Mode - ${scheme} */
      .high-contrast-mode {
        --hc-background: ${colors.background};
        --hc-foreground: ${colors.foreground};
        --hc-primary: ${colors.primary};
        --hc-secondary: ${colors.secondary};
        --hc-accent: ${colors.accent};
        --hc-border: ${colors.border};
        --hc-focus: ${colors.focus};
        --hc-error: ${colors.error};
        --hc-warning: ${colors.warning};
        --hc-success: ${colors.success};
        --hc-info: ${colors.info};
      }
      
      .high-contrast-mode,
      .high-contrast-mode * {
        background-color: var(--hc-background) !important;
        color: var(--hc-foreground) !important;
        border-color: var(--hc-border) !important;
      }
      
      .high-contrast-mode a,
      .high-contrast-mode button,
      .high-contrast-mode [role="button"] {
        color: var(--hc-primary) !important;
        text-decoration: underline !important;
      }
      
      .high-contrast-mode a:hover,
      .high-contrast-mode button:hover,
      .high-contrast-mode [role="button"]:hover {
        color: var(--hc-accent) !important;
        background-color: var(--hc-secondary) !important;
      }
      
      .high-contrast-mode *:focus,
      .high-contrast-mode *:focus-visible {
        outline: 3px solid var(--hc-focus) !important;
        outline-offset: 2px !important;
        background-color: var(--hc-secondary) !important;
      }
      
      .high-contrast-mode input,
      .high-contrast-mode textarea,
      .high-contrast-mode select {
        background-color: var(--hc-background) !important;
        color: var(--hc-foreground) !important;
        border: 2px solid var(--hc-border) !important;
      }
      
      .high-contrast-mode input:focus,
      .high-contrast-mode textarea:focus,
      .high-contrast-mode select:focus {
        border-color: var(--hc-focus) !important;
        box-shadow: 0 0 0 2px var(--hc-focus) !important;
      }
      
      /* Elementos específicos do diagrama */
      .high-contrast-mode .react-flow__node {
        background-color: var(--hc-secondary) !important;
        border: 2px solid var(--hc-border) !important;
        color: var(--hc-foreground) !important;
      }
      
      .high-contrast-mode .react-flow__node.selected {
        border-color: var(--hc-focus) !important;
        box-shadow: 0 0 0 2px var(--hc-focus) !important;
      }
      
      .high-contrast-mode .react-flow__edge path {
        stroke: var(--hc-border) !important;
        stroke-width: 2px !important;
      }
      
      .high-contrast-mode .react-flow__edge.selected path {
        stroke: var(--hc-focus) !important;
        stroke-width: 3px !important;
      }
      
      .high-contrast-mode .react-flow__handle {
        background-color: var(--hc-primary) !important;
        border: 2px solid var(--hc-border) !important;
      }
      
      /* Estados de erro, aviso, sucesso e info */
      .high-contrast-mode .error,
      .high-contrast-mode [data-state="error"] {
        color: var(--hc-error) !important;
        border-color: var(--hc-error) !important;
      }
      
      .high-contrast-mode .warning,
      .high-contrast-mode [data-state="warning"] {
        color: var(--hc-warning) !important;
        border-color: var(--hc-warning) !important;
      }
      
      .high-contrast-mode .success,
      .high-contrast-mode [data-state="success"] {
        color: var(--hc-success) !important;
        border-color: var(--hc-success) !important;
      }
      
      .high-contrast-mode .info,
      .high-contrast-mode [data-state="info"] {
        color: var(--hc-info) !important;
        border-color: var(--hc-info) !important;
      }
      
      /* Imagens e ícones */
      .high-contrast-mode img,
      .high-contrast-mode svg {
        filter: contrast(150%) brightness(1.2) !important;
      }
      
      .high-contrast-mode .icon {
        filter: invert(1) contrast(150%) !important;
      }
    `;
    
    // Adiciona filtros para daltonismo se habilitado
    if (colorBlindSupport && colorBlindType) {
      const filter = COLORBLIND_FILTERS[colorBlindType];
      if (filter) {
        cssRules += `
          .high-contrast-mode.colorblind-${colorBlindType} {
            filter: ${filter};
          }
        `;
      }
    }
    
    styleElement.textContent = cssRules;
    document.head.appendChild(styleElement);
    styleElementRef.current = styleElement;
    
    setAppliedColors(colors);
  }, [getColorScheme, colorBlindSupport, colorBlindType]);

  // ============================================================================
  // Remoção de cores
  // ============================================================================

  const removeColorScheme = useCallback(() => {
    if (styleElementRef.current) {
      styleElementRef.current.remove();
      styleElementRef.current = null;
    }
    
    const rootElement = document.documentElement;
    rootElement.classList.remove('high-contrast-mode');
    
    // Remove classes de daltonismo
    Object.keys(COLORBLIND_FILTERS).forEach(type => {
      rootElement.classList.remove(`colorblind-${type}`);
    });
    
    setAppliedColors({});
  }, []);

  // ============================================================================
  // Toggle do modo
  // ============================================================================

  const toggleHighContrast = useCallback(() => {
    const newState = !isActive;
    setIsActive(newState);
    
    if (newState) {
      applyColorScheme(currentScheme);
      document.documentElement.classList.add('high-contrast-mode');
      
      if (colorBlindSupport && colorBlindType) {
        document.documentElement.classList.add(`colorblind-${colorBlindType}`);
      }
      
      screenReader.announce('Modo de alto contraste ativado', 'assertive');
    } else {
      removeColorScheme();
      screenReader.announce('Modo de alto contraste desativado', 'assertive');
    }
    
    onToggle?.(newState);
  }, [isActive, currentScheme, applyColorScheme, removeColorScheme, colorBlindSupport, colorBlindType, screenReader, onToggle]);

  // ============================================================================
  // Mudança de esquema
  // ============================================================================

  const changeColorScheme = useCallback((scheme: string) => {
    setCurrentScheme(scheme);
    
    if (isActive) {
      applyColorScheme(scheme);
      screenReader.announce(`Esquema de cores alterado para ${scheme}`, 'polite');
    }
  }, [isActive, applyColorScheme, screenReader]);

  // ============================================================================
  // Validação de contraste
  // ============================================================================

  const validateContrast = useCallback(() => {
    const colors = getColorScheme(currentScheme);
    const issues: string[] = [];
    
    // Verifica contraste entre foreground e background
    const bgRgb = hexToRgb(colors.background);
    const fgRgb = hexToRgb(colors.foreground);
    
    if (bgRgb && fgRgb) {
      const contrast = calculateContrast(bgRgb, fgRgb);
      if (contrast < 7) { // WCAG AAA
        issues.push(`Contraste insuficiente entre texto e fundo: ${contrast.toFixed(2)}:1`);
      }
    }
    
    // Verifica outros pares importantes
    const pairs = [
      { bg: colors.background, fg: colors.primary, name: 'primário' },
      { bg: colors.background, fg: colors.error, name: 'erro' },
      { bg: colors.background, fg: colors.warning, name: 'aviso' },
      { bg: colors.background, fg: colors.success, name: 'sucesso' }
    ];
    
    pairs.forEach(({ bg, fg, name }) => {
      const bgRgb = hexToRgb(bg);
      const fgRgb = hexToRgb(fg);
      
      if (bgRgb && fgRgb) {
        const contrast = calculateContrast(bgRgb, fgRgb);
        if (contrast < 4.5) { // WCAG AA
          issues.push(`Contraste insuficiente para ${name}: ${contrast.toFixed(2)}:1`);
        }
      }
    });
    
    return issues;
  }, [getColorScheme, currentScheme]);

  // ============================================================================
  // Efeitos
  // ============================================================================

  // Sincronização com prop enabled
  useEffect(() => {
    if (enabled !== isActive) {
      toggleHighContrast();
    }
  }, [enabled]); // Não incluir toggleHighContrast para evitar loop

  // Sincronização com prop colorScheme
  useEffect(() => {
    if (colorScheme !== currentScheme) {
      changeColorScheme(colorScheme);
    }
  }, [colorScheme]); // Não incluir changeColorScheme para evitar loop

  // Limpeza na desmontagem
  useEffect(() => {
    return () => {
      removeColorScheme();
    };
  }, [removeColorScheme]);

  // Validação de contraste em desenvolvimento
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && isActive) {
      const issues = validateContrast();
      if (issues.length > 0) {
        console.warn('Problemas de contraste detectados:', issues);
      }
    }
  }, [isActive, currentScheme, validateContrast]);

  // ============================================================================
  // Interface de controle
  // ============================================================================

  const renderControls = () => {
    if (!config.highContrast) return null;
    
    return (
      <div className="high-contrast-controls">
        <button
          onClick={toggleHighContrast}
          aria-pressed={isActive}
          aria-label={`${isActive ? 'Desativar' : 'Ativar'} modo de alto contraste`}
          className="high-contrast-toggle"
        >
          {isActive ? '🌙' : '☀️'} Alto Contraste
        </button>
        
        {isActive && (
          <select
            value={currentScheme}
            onChange={(e) => changeColorScheme(e.target.value)}
            aria-label="Esquema de cores"
            className="color-scheme-selector"
          >
            <option value="dark">Escuro</option>
            <option value="light">Claro</option>
            <option value="blue">Azul</option>
            <option value="yellow">Amarelo</option>
          </select>
        )}
        
        {isActive && colorBlindSupport && (
          <select
            value={colorBlindType}
            onChange={(e) => {
              const newType = e.target.value as 'protanopia' | 'deuteranopia' | 'tritanopia' | 'achromatopsia';
              document.documentElement.classList.remove(`colorblind-${colorBlindType}`);
              document.documentElement.classList.add(`colorblind-${newType}`);
            }}
            aria-label="Tipo de daltonismo"
            className="colorblind-selector"
          >
            <option value="protanopia">Protanopia</option>
            <option value="deuteranopia">Deuteranopia</option>
            <option value="tritanopia">Tritanopia</option>
            <option value="achromatopsia">Acromatopsia</option>
          </select>
        )}
      </div>
    );
  };

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className={`high-contrast-mode-component ${className}`}>
      {renderControls()}
      
      {/* Estilos para os controles */}
      <style jsx>{`
        .high-contrast-controls {
          display: flex;
          gap: 8px;
          align-items: center;
          padding: 8px;
          background: rgba(0, 0, 0, 0.05);
          border-radius: 4px;
          border: 1px solid #ddd;
        }
        
        .high-contrast-toggle {
          padding: 6px 12px;
          background: #007acc;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        
        .high-contrast-toggle:hover {
          background: #005a9e;
        }
        
        .high-contrast-toggle[aria-pressed="true"] {
          background: #28a745;
        }
        
        .color-scheme-selector,
        .colorblind-selector {
          padding: 4px 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          background: white;
          font-size: 12px;
        }
        
        /* Estilos para modo de alto contraste */
        .high-contrast-mode .high-contrast-controls {
          background: var(--hc-secondary) !important;
          border-color: var(--hc-border) !important;
        }
        
        .high-contrast-mode .high-contrast-toggle {
          background: var(--hc-primary) !important;
          color: var(--hc-background) !important;
          border: 2px solid var(--hc-border) !important;
        }
        
        .high-contrast-mode .color-scheme-selector,
        .high-contrast-mode .colorblind-selector {
          background: var(--hc-background) !important;
          color: var(--hc-foreground) !important;
          border-color: var(--hc-border) !important;
        }
      `}</style>
    </div>
  );
}

// ============================================================================
// Hook para gerenciar alto contraste
// ============================================================================

export function useHighContrastMode() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [scheme, setScheme] = useState('dark');
  const { screenReader } = useAccessibility();

  const toggle = useCallback(() => {
    const newState = !isEnabled;
    setIsEnabled(newState);
    
    screenReader.announce(
      `Alto contraste ${newState ? 'ativado' : 'desativado'}`,
      'assertive'
    );
  }, [isEnabled, screenReader]);

  const changeScheme = useCallback((newScheme: string) => {
    setScheme(newScheme);
    screenReader.announce(`Esquema alterado para ${newScheme}`, 'polite');
  }, [screenReader]);

  return {
    isEnabled,
    scheme,
    toggle,
    changeScheme,
    enable: () => setIsEnabled(true),
    disable: () => setIsEnabled(false)
  };
}