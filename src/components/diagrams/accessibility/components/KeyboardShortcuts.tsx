// ============================================================================
// KeyboardShortcuts Component - Gerenciador de atalhos de teclado
// ============================================================================

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { KeyboardShortcutsProps, KeyboardShortcut } from '../types';
import { DEFAULT_KEYBOARD_SHORTCUTS, KEYBOARD_KEYS } from '../constants';
import { normalizeKeyCombo, isNavigationKey, isActionKey } from '../utils';
import { useAccessibility } from './AccessibilityProvider';

// ============================================================================
// Component
// ============================================================================

export function KeyboardShortcuts({
  shortcuts = DEFAULT_KEYBOARD_SHORTCUTS,
  onShortcut,
  showHelp = false,
  onToggleHelp,
  className = '',
  disabled = false
}: KeyboardShortcutsProps) {
  const [isHelpVisible, setIsHelpVisible] = useState(showHelp);
  const [activeKeys, setActiveKeys] = useState<Set<string>>(new Set());
  const [lastTriggered, setLastTriggered] = useState<string | null>(null);
  const helpRef = useRef<HTMLDivElement>(null);
  const { screenReader, config } = useAccessibility();

  // ============================================================================
  // Gerenciamento de estado das teclas
  // ============================================================================

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (disabled || !config.keyboard?.enabled) return;

    const key = event.key.toLowerCase();
    setActiveKeys(prev => new Set([...prev, key]));

    // Verifica se é o atalho para mostrar ajuda (F1 ou Ctrl+?)
    if (key === 'f1' || (event.ctrlKey && key === '/')) {
      event.preventDefault();
      const newHelpState = !isHelpVisible;
      setIsHelpVisible(newHelpState);
      onToggleHelp?.(newHelpState);
      
      screenReader.announce(
        `Ajuda de atalhos ${newHelpState ? 'aberta' : 'fechada'}`,
        'assertive'
      );
      return;
    }

    // Verifica atalhos personalizados
    const currentCombo = normalizeKeyCombo({
      key: event.key,
      ctrlKey: event.ctrlKey,
      altKey: event.altKey,
      shiftKey: event.shiftKey,
      metaKey: event.metaKey
    });

    const matchedShortcut = shortcuts.find(shortcut => 
      shortcut.combo === currentCombo && shortcut.enabled !== false
    );

    if (matchedShortcut) {
      event.preventDefault();
      event.stopPropagation();
      
      setLastTriggered(matchedShortcut.id);
      onShortcut?.(matchedShortcut);
      
      // Anúncio para leitor de tela
      screenReader.announce(
        `Atalho ativado: ${matchedShortcut.description}`,
        'assertive'
      );
      
      // Remove destaque após um tempo
      setTimeout(() => {
        setLastTriggered(null);
      }, 1000);
    }
  }, [disabled, config.keyboard?.enabled, isHelpVisible, shortcuts, onShortcut, onToggleHelp, screenReader]);

  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    if (disabled) return;
    
    const key = event.key.toLowerCase();
    setActiveKeys(prev => {
      const newSet = new Set(prev);
      newSet.delete(key);
      return newSet;
    });
  }, [disabled]);

  // ============================================================================
  // Efeitos
  // ============================================================================

  useEffect(() => {
    if (disabled || !config.keyboard?.enabled) return;

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp, disabled, config.keyboard?.enabled]);

  // Sincroniza estado interno com prop externa
  useEffect(() => {
    setIsHelpVisible(showHelp);
  }, [showHelp]);

  // Foco na ajuda quando aberta
  useEffect(() => {
    if (isHelpVisible && helpRef.current) {
      helpRef.current.focus();
    }
  }, [isHelpVisible]);

  // ============================================================================
  // Renderização da ajuda
  // ============================================================================

  const renderShortcutHelp = () => {
    if (!isHelpVisible) return null;

    const groupedShortcuts = shortcuts.reduce((groups, shortcut) => {
      const category = shortcut.category || 'Geral';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(shortcut);
      return groups;
    }, {} as Record<string, KeyboardShortcut[]>);

    return (
      <div
        ref={helpRef}
        className="keyboard-shortcuts-help"
        role="dialog"
        aria-labelledby="shortcuts-title"
        aria-describedby="shortcuts-description"
        tabIndex={-1}
      >
        <div className="shortcuts-overlay" onClick={() => setIsHelpVisible(false)} />
        
        <div className="shortcuts-modal">
          <header className="shortcuts-header">
            <h2 id="shortcuts-title">Atalhos de Teclado</h2>
            <p id="shortcuts-description">
              Use estes atalhos para navegar e interagir com o diagrama de forma mais eficiente.
            </p>
            
            <button
              className="shortcuts-close"
              onClick={() => setIsHelpVisible(false)}
              aria-label="Fechar ajuda de atalhos"
            >
              ×
            </button>
          </header>
          
          <div className="shortcuts-content">
            {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
              <section key={category} className="shortcuts-category">
                <h3>{category}</h3>
                
                <dl className="shortcuts-list">
                  {categoryShortcuts
                    .filter(shortcut => shortcut.enabled !== false)
                    .map(shortcut => (
                      <div 
                        key={shortcut.id} 
                        className={`shortcut-item ${
                          lastTriggered === shortcut.id ? 'shortcut-item--highlighted' : ''
                        }`}
                      >
                        <dt className="shortcut-combo">
                          <kbd>{shortcut.combo}</kbd>
                        </dt>
                        <dd className="shortcut-description">
                          {shortcut.description}
                        </dd>
                      </div>
                    ))
                  }
                </dl>
              </section>
            ))}
          </div>
          
          <footer className="shortcuts-footer">
            <p>
              <kbd>F1</kbd> ou <kbd>Ctrl+/</kbd> para mostrar/ocultar esta ajuda
            </p>
            <p>
              <kbd>Esc</kbd> para fechar
            </p>
          </footer>
        </div>
      </div>
    );
  };

  // ============================================================================
  // Indicador visual de teclas ativas
  // ============================================================================

  const renderActiveKeys = () => {
    if (activeKeys.size === 0 || !config.keyboard?.showActiveKeys) {
      return null;
    }

    return (
      <div className="active-keys-indicator" aria-live="polite">
        <span className="sr-only">
          Teclas ativas: {Array.from(activeKeys).join(', ')}
        </span>
        
        <div className="active-keys-visual">
          {Array.from(activeKeys).map(key => (
            <kbd key={key} className="active-key">
              {key.toUpperCase()}
            </kbd>
          ))}
        </div>
      </div>
    );
  };

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className={`keyboard-shortcuts ${className}`}>
      {renderActiveKeys()}
      {renderShortcutHelp()}
      
      {/* Estilos CSS */}
      <style jsx>{`
        .keyboard-shortcuts {
          position: relative;
        }
        
        .active-keys-indicator {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 9999;
          pointer-events: none;
        }
        
        .active-keys-visual {
          display: flex;
          gap: 4px;
          padding: 8px;
          background: rgba(0, 0, 0, 0.8);
          border-radius: 4px;
          backdrop-filter: blur(4px);
        }
        
        .active-key {
          padding: 4px 8px;
          background: #fff;
          color: #000;
          border-radius: 2px;
          font-size: 12px;
          font-weight: bold;
          min-width: 24px;
          text-align: center;
        }
        
        .keyboard-shortcuts-help {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 10000;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .shortcuts-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(2px);
        }
        
        .shortcuts-modal {
          position: relative;
          background: white;
          border-radius: 8px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
          max-width: 600px;
          max-height: 80vh;
          width: 90vw;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        
        .shortcuts-header {
          padding: 24px;
          border-bottom: 1px solid #e5e5e5;
          position: relative;
        }
        
        .shortcuts-header h2 {
          margin: 0 0 8px 0;
          font-size: 24px;
          font-weight: 600;
        }
        
        .shortcuts-header p {
          margin: 0;
          color: #666;
          font-size: 14px;
        }
        
        .shortcuts-close {
          position: absolute;
          top: 16px;
          right: 16px;
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          padding: 8px;
          border-radius: 4px;
          color: #666;
        }
        
        .shortcuts-close:hover {
          background: #f5f5f5;
          color: #000;
        }
        
        .shortcuts-content {
          flex: 1;
          overflow-y: auto;
          padding: 0 24px;
        }
        
        .shortcuts-category {
          margin: 24px 0;
        }
        
        .shortcuts-category h3 {
          margin: 0 0 16px 0;
          font-size: 18px;
          font-weight: 600;
          color: #333;
          border-bottom: 2px solid #e5e5e5;
          padding-bottom: 8px;
        }
        
        .shortcuts-list {
          margin: 0;
          display: grid;
          gap: 12px;
        }
        
        .shortcut-item {
          display: grid;
          grid-template-columns: 1fr 2fr;
          gap: 16px;
          align-items: center;
          padding: 12px;
          border-radius: 4px;
          transition: background-color 0.2s;
        }
        
        .shortcut-item:hover {
          background: #f8f9fa;
        }
        
        .shortcut-item--highlighted {
          background: #e3f2fd;
          border: 1px solid #2196f3;
        }
        
        .shortcut-combo {
          margin: 0;
          font-weight: normal;
        }
        
        .shortcut-combo kbd {
          display: inline-block;
          padding: 4px 8px;
          background: #f5f5f5;
          border: 1px solid #ddd;
          border-radius: 3px;
          font-size: 12px;
          font-family: monospace;
          margin: 0 2px;
        }
        
        .shortcut-description {
          margin: 0;
          color: #555;
          font-size: 14px;
        }
        
        .shortcuts-footer {
          padding: 16px 24px;
          border-top: 1px solid #e5e5e5;
          background: #f8f9fa;
          text-align: center;
        }
        
        .shortcuts-footer p {
          margin: 4px 0;
          font-size: 12px;
          color: #666;
        }
        
        .shortcuts-footer kbd {
          padding: 2px 6px;
          background: #fff;
          border: 1px solid #ddd;
          border-radius: 2px;
          font-size: 11px;
        }
        
        /* Modo escuro */
        .high-contrast .shortcuts-modal {
          background: #1a1a1a;
          color: #fff;
        }
        
        .high-contrast .shortcuts-header {
          border-bottom-color: #444;
        }
        
        .high-contrast .shortcuts-close {
          color: #ccc;
        }
        
        .high-contrast .shortcuts-close:hover {
          background: #333;
          color: #fff;
        }
        
        .high-contrast .shortcut-item:hover {
          background: #2a2a2a;
        }
        
        .high-contrast .shortcut-combo kbd {
          background: #333;
          border-color: #555;
          color: #fff;
        }
        
        .high-contrast .shortcuts-footer {
          background: #2a2a2a;
          border-top-color: #444;
        }
        
        .high-contrast .shortcuts-footer kbd {
          background: #1a1a1a;
          border-color: #555;
          color: #fff;
        }
      `}</style>
    </div>
  );
}

// ============================================================================
// Hook para gerenciar atalhos
// ============================================================================

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  const [registeredShortcuts, setRegisteredShortcuts] = useState<KeyboardShortcut[]>(shortcuts);
  const { screenReader } = useAccessibility();

  const registerShortcut = useCallback((shortcut: KeyboardShortcut) => {
    setRegisteredShortcuts(prev => {
      const existing = prev.find(s => s.id === shortcut.id);
      if (existing) {
        return prev.map(s => s.id === shortcut.id ? shortcut : s);
      }
      return [...prev, shortcut];
    });
    
    screenReader.announce(
      `Atalho registrado: ${shortcut.combo} - ${shortcut.description}`,
      'polite'
    );
  }, [screenReader]);

  const unregisterShortcut = useCallback((id: string) => {
    setRegisteredShortcuts(prev => prev.filter(s => s.id !== id));
  }, []);

  const enableShortcut = useCallback((id: string) => {
    setRegisteredShortcuts(prev => 
      prev.map(s => s.id === id ? { ...s, enabled: true } : s)
    );
  }, []);

  const disableShortcut = useCallback((id: string) => {
    setRegisteredShortcuts(prev => 
      prev.map(s => s.id === id ? { ...s, enabled: false } : s)
    );
  }, []);

  return {
    shortcuts: registeredShortcuts,
    registerShortcut,
    unregisterShortcut,
    enableShortcut,
    disableShortcut
  };
}