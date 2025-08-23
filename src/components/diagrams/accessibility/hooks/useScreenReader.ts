// ============================================================================
// useScreenReader Hook - Gerenciamento de anúncios para leitores de tela
// ============================================================================

import { useState, useCallback, useEffect, useRef } from 'react';
import { ScreenReaderAnnouncement, ScreenReaderConfig } from '../types';
import { SCREEN_READER_MESSAGES } from '../constants';
import { createAnnouncement, cleanupAnnouncements, debounce } from '../utils';

interface UseScreenReaderProps {
  config?: ScreenReaderConfig;
  onAnnouncement?: (announcement: ScreenReaderAnnouncement) => void;
}

interface UseScreenReaderReturn {
  announcements: ScreenReaderAnnouncement[];
  announce: (message: string, priority?: 'polite' | 'assertive', category?: string) => void;
  announceAction: (action: string, target?: string, result?: string) => void;
  announceNavigation: (from: string, to: string, direction?: string) => void;
  announceSelection: (items: string[], type: 'single' | 'multiple') => void;
  announceError: (error: string, context?: string) => void;
  announceSuccess: (message: string, context?: string) => void;
  announceProgress: (current: number, total: number, operation?: string) => void;
  clearAnnouncements: () => void;
  isEnabled: boolean;
  setEnabled: (enabled: boolean) => void;
}

const DEFAULT_CONFIG: ScreenReaderConfig = {
  enabled: true,
  announceNavigation: true,
  announceActions: true,
  announceChanges: true,
  debounceTime: 300,
  maxAnnouncements: 10,
  announcementTimeout: 5000
};

export function useScreenReader({
  config = DEFAULT_CONFIG,
  onAnnouncement
}: UseScreenReaderProps = {}): UseScreenReaderReturn {
  const [announcements, setAnnouncements] = useState<ScreenReaderAnnouncement[]>([]);
  const [isEnabled, setIsEnabled] = useState(config.enabled ?? true);
  
  const configRef = useRef({ ...DEFAULT_CONFIG, ...config });
  const lastAnnouncementRef = useRef<{ message: string; timestamp: number } | null>(null);
  const cleanupTimeoutRef = useRef<NodeJS.Timeout>();

  // ============================================================================
  // Função principal de anúncio
  // ============================================================================

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite', category: string = 'general') => {
    if (!isEnabled || !message.trim()) return;

    // Evita anúncios duplicados em sequência
    const now = Date.now();
    if (lastAnnouncementRef.current && 
        lastAnnouncementRef.current.message === message &&
        now - lastAnnouncementRef.current.timestamp < (configRef.current.debounceTime || 300)) {
      return;
    }

    const announcement = createAnnouncement(message, priority, category);
    
    setAnnouncements(prev => {
      const updated = [announcement, ...prev];
      return updated.slice(0, configRef.current.maxAnnouncements || 10);
    });

    lastAnnouncementRef.current = { message, timestamp: now };

    if (onAnnouncement) {
      onAnnouncement(announcement);
    }
  }, [isEnabled, onAnnouncement]);

  // ============================================================================
  // Anúncios especializados
  // ============================================================================

  const announceAction = useCallback((action: string, target?: string, result?: string) => {
    if (!configRef.current.announceActions) return;

    let message = SCREEN_READER_MESSAGES.ACTIONS[action as keyof typeof SCREEN_READER_MESSAGES.ACTIONS] || action;
    
    if (target) {
      message += ` em ${target}`;
    }
    
    if (result) {
      message += `. ${result}`;
    }

    announce(message, 'assertive', 'action');
  }, [announce]);

  const announceNavigation = useCallback((from: string, to: string, direction?: string) => {
    if (!configRef.current.announceNavigation) return;

    let message = `Navegando de ${from} para ${to}`;
    
    if (direction) {
      message = `Navegando ${direction}: ${to}`;
    }

    announce(message, 'polite', 'navigation');
  }, [announce]);

  const announceSelection = useCallback((items: string[], type: 'single' | 'multiple') => {
    if (!configRef.current.announceChanges) return;

    let message: string;
    
    if (items.length === 0) {
      message = 'Seleção removida';
    } else if (type === 'single' || items.length === 1) {
      message = `${items[0]} selecionado`;
    } else {
      message = `${items.length} itens selecionados: ${items.slice(0, 3).join(', ')}`;
      if (items.length > 3) {
        message += ` e mais ${items.length - 3}`;
      }
    }

    announce(message, 'polite', 'selection');
  }, [announce]);

  const announceError = useCallback((error: string, context?: string) => {
    let message = `Erro: ${error}`;
    
    if (context) {
      message += ` em ${context}`;
    }

    announce(message, 'assertive', 'error');
  }, [announce]);

  const announceSuccess = useCallback((message: string, context?: string) => {
    let fullMessage = message;
    
    if (context) {
      fullMessage += ` em ${context}`;
    }

    announce(fullMessage, 'polite', 'success');
  }, [announce]);

  const announceProgress = useCallback((current: number, total: number, operation?: string) => {
    const percentage = Math.round((current / total) * 100);
    let message = `Progresso: ${percentage}% (${current} de ${total})`;
    
    if (operation) {
      message = `${operation}: ${message}`;
    }

    announce(message, 'polite', 'progress');
  }, [announce]);

  // ============================================================================
  // Anúncios específicos para diagramas
  // ============================================================================

  const announceNodeCreation = useCallback((nodeType: string, nodeId: string) => {
    announceAction('create', `nó ${nodeType}`, `Nó ${nodeId} criado`);
  }, [announceAction]);

  const announceNodeDeletion = useCallback((nodeType: string, nodeId: string) => {
    announceAction('delete', `nó ${nodeType}`, `Nó ${nodeId} removido`);
  }, [announceAction]);

  const announceEdgeCreation = useCallback((sourceId: string, targetId: string) => {
    announceAction('connect', `${sourceId} e ${targetId}`, 'Conexão criada');
  }, [announceAction]);

  const announceEdgeDeletion = useCallback((sourceId: string, targetId: string) => {
    announceAction('disconnect', `${sourceId} e ${targetId}`, 'Conexão removida');
  }, [announceAction]);

  const announceNodeMove = useCallback((nodeId: string, newPosition: { x: number; y: number }) => {
    const message = `${nodeId} movido para posição x: ${Math.round(newPosition.x)}, y: ${Math.round(newPosition.y)}`;
    announce(message, 'polite', 'movement');
  }, [announce]);

  const announceZoomChange = useCallback((zoomLevel: number) => {
    const percentage = Math.round(zoomLevel * 100);
    announce(`Zoom alterado para ${percentage}%`, 'polite', 'viewport');
  }, [announce]);

  const announcePanChange = useCallback((direction: string) => {
    announce(`Visualização movida para ${direction}`, 'polite', 'viewport');
  }, [announce]);

  // ============================================================================
  // Utilitários
  // ============================================================================

  const clearAnnouncements = useCallback(() => {
    setAnnouncements([]);
    lastAnnouncementRef.current = null;
  }, []);

  // Debounced announce para evitar spam
  const debouncedAnnounce = useCallback(
    debounce((message: string, priority: 'polite' | 'assertive' = 'polite', category: string = 'general') => {
      announce(message, priority, category);
    }, configRef.current.debounceTime || 300),
    [announce]
  );

  // ============================================================================
  // Efeitos
  // ============================================================================

  // Limpeza automática de anúncios antigos
  useEffect(() => {
    if (cleanupTimeoutRef.current) {
      clearTimeout(cleanupTimeoutRef.current);
    }

    cleanupTimeoutRef.current = setTimeout(() => {
      setAnnouncements(prev => 
        cleanupAnnouncements(
          prev, 
          configRef.current.announcementTimeout || 5000,
          configRef.current.maxAnnouncements || 10
        )
      );
    }, 1000);

    return () => {
      if (cleanupTimeoutRef.current) {
        clearTimeout(cleanupTimeoutRef.current);
      }
    };
  }, [announcements]);

  // Detecta mudanças na configuração
  useEffect(() => {
    configRef.current = { ...DEFAULT_CONFIG, ...config };
    setIsEnabled(config.enabled ?? true);
  }, [config]);

  // Detecta preferências do sistema para leitores de tela
  useEffect(() => {
    // Verifica se há um leitor de tela ativo
    const hasScreenReader = window.navigator.userAgent.includes('NVDA') ||
                           window.navigator.userAgent.includes('JAWS') ||
                           window.speechSynthesis?.getVoices().length > 0;

    if (hasScreenReader && !isEnabled) {
      console.info('Leitor de tela detectado. Considere habilitar anúncios de acessibilidade.');
    }
  }, [isEnabled]);

  // ============================================================================
  // Return
  // ============================================================================

  return {
    announcements,
    announce: debouncedAnnounce,
    announceAction,
    announceNavigation,
    announceSelection,
    announceError,
    announceSuccess,
    announceProgress,
    clearAnnouncements,
    isEnabled,
    setEnabled: setIsEnabled,
    
    // Métodos específicos para diagramas (não expostos na interface principal)
    ...(process.env.NODE_ENV === 'development' && {
      announceNodeCreation,
      announceNodeDeletion,
      announceEdgeCreation,
      announceEdgeDeletion,
      announceNodeMove,
      announceZoomChange,
      announcePanChange
    })
  };
}

// ============================================================================
// Hook auxiliar para anúncios de diagrama
// ============================================================================

export function useDiagramScreenReader(config?: ScreenReaderConfig) {
  const screenReader = useScreenReader({ config });

  const announceNodeCreation = useCallback((nodeType: string, nodeId: string) => {
    screenReader.announceAction('create', `nó ${nodeType}`, `Nó ${nodeId} criado`);
  }, [screenReader]);

  const announceNodeDeletion = useCallback((nodeType: string, nodeId: string) => {
    screenReader.announceAction('delete', `nó ${nodeType}`, `Nó ${nodeId} removido`);
  }, [screenReader]);

  const announceEdgeCreation = useCallback((sourceId: string, targetId: string) => {
    screenReader.announceAction('connect', `${sourceId} e ${targetId}`, 'Conexão criada');
  }, [screenReader]);

  const announceEdgeDeletion = useCallback((sourceId: string, targetId: string) => {
    screenReader.announceAction('disconnect', `${sourceId} e ${targetId}`, 'Conexão removida');
  }, [screenReader]);

  const announceNodeMove = useCallback((nodeId: string, newPosition: { x: number; y: number }) => {
    const message = `${nodeId} movido para posição x: ${Math.round(newPosition.x)}, y: ${Math.round(newPosition.y)}`;
    screenReader.announce(message, 'polite', 'movement');
  }, [screenReader]);

  const announceZoomChange = useCallback((zoomLevel: number) => {
    const percentage = Math.round(zoomLevel * 100);
    screenReader.announce(`Zoom alterado para ${percentage}%`, 'polite', 'viewport');
  }, [screenReader]);

  const announcePanChange = useCallback((direction: string) => {
    screenReader.announce(`Visualização movida para ${direction}`, 'polite', 'viewport');
  }, [screenReader]);

  return {
    ...screenReader,
    announceNodeCreation,
    announceNodeDeletion,
    announceEdgeCreation,
    announceEdgeDeletion,
    announceNodeMove,
    announceZoomChange,
    announcePanChange
  };
}