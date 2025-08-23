// ============================================================================
// AccessibilityAnnouncer Component - Anunciador para leitores de tela
// ============================================================================

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { AccessibilityAnnouncerProps, ScreenReaderAnnouncement } from '../types';
import { createScreenReaderAnnouncement, cleanupScreenReaderAnnouncement } from '../utils';

// ============================================================================
// Component
// ============================================================================

export function AccessibilityAnnouncer({
  announcements = [],
  clearDelay = 5000,
  maxAnnouncements = 5,
  className = '',
  'aria-live': ariaLive = 'polite',
  'aria-atomic': ariaAtomic = true
}: AccessibilityAnnouncerProps) {
  const [activeAnnouncements, setActiveAnnouncements] = useState<ScreenReaderAnnouncement[]>([]);
  const announcerRef = useRef<HTMLDivElement>(null);
  const timeoutRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const announcementQueue = useRef<ScreenReaderAnnouncement[]>([]);
  const isProcessing = useRef(false);

  // ============================================================================
  // Processamento da fila de anúncios
  // ============================================================================

  const processAnnouncementQueue = useCallback(() => {
    if (isProcessing.current || announcementQueue.current.length === 0) {
      return;
    }

    isProcessing.current = true;
    const announcement = announcementQueue.current.shift()!;

    setActiveAnnouncements(prev => {
      // Remove anúncios antigos se exceder o limite
      const filtered = prev.slice(-(maxAnnouncements - 1));
      return [...filtered, announcement];
    });

    // Agenda a remoção do anúncio
    const timeoutId = setTimeout(() => {
      setActiveAnnouncements(prev => 
        prev.filter(a => a.id !== announcement.id)
      );
      timeoutRefs.current.delete(announcement.id);
      
      // Processa próximo anúncio na fila
      isProcessing.current = false;
      processAnnouncementQueue();
    }, clearDelay);

    timeoutRefs.current.set(announcement.id, timeoutId);
    
    // Pequeno delay antes de processar próximo para evitar sobreposição
    setTimeout(() => {
      isProcessing.current = false;
      processAnnouncementQueue();
    }, 100);
  }, [clearDelay, maxAnnouncements]);

  // ============================================================================
  // Adição de novos anúncios
  // ============================================================================

  const addAnnouncement = useCallback((announcement: ScreenReaderAnnouncement) => {
    // Verifica se já existe um anúncio idêntico recente
    const isDuplicate = activeAnnouncements.some(a => 
      a.message === announcement.message && 
      Date.now() - a.timestamp < 1000 // 1 segundo
    );

    if (isDuplicate) {
      return;
    }

    // Anúncios assertivos têm prioridade
    if (announcement.priority === 'assertive') {
      // Limpa anúncios polite da fila
      announcementQueue.current = announcementQueue.current.filter(
        a => a.priority === 'assertive'
      );
      
      // Adiciona no início da fila
      announcementQueue.current.unshift(announcement);
    } else {
      // Adiciona no final da fila
      announcementQueue.current.push(announcement);
    }

    processAnnouncementQueue();
  }, [activeAnnouncements, processAnnouncementQueue]);

  // ============================================================================
  // Limpeza de anúncios
  // ============================================================================

  const clearAnnouncements = useCallback(() => {
    // Limpa todos os timeouts
    timeoutRefs.current.forEach(timeoutId => {
      clearTimeout(timeoutId);
    });
    timeoutRefs.current.clear();
    
    // Limpa estados
    setActiveAnnouncements([]);
    announcementQueue.current = [];
    isProcessing.current = false;
  }, []);

  const removeAnnouncement = useCallback((id: string) => {
    const timeoutId = timeoutRefs.current.get(id);
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutRefs.current.delete(id);
    }

    setActiveAnnouncements(prev => prev.filter(a => a.id !== id));
    
    // Remove da fila também
    announcementQueue.current = announcementQueue.current.filter(a => a.id !== id);
  }, []);

  // ============================================================================
  // Efeitos
  // ============================================================================

  // Processa novos anúncios externos
  useEffect(() => {
    announcements.forEach(announcement => {
      const fullAnnouncement = createScreenReaderAnnouncement(
        announcement.message,
        announcement.priority,
        announcement.category
      );
      addAnnouncement(fullAnnouncement);
    });
  }, [announcements, addAnnouncement]);

  // Limpeza na desmontagem
  useEffect(() => {
    return () => {
      clearAnnouncements();
    };
  }, [clearAnnouncements]);

  // ============================================================================
  // Renderização de anúncios
  // ============================================================================

  const renderAnnouncements = () => {
    if (activeAnnouncements.length === 0) {
      return null;
    }

    // Agrupa por prioridade
    const assertiveAnnouncements = activeAnnouncements.filter(a => a.priority === 'assertive');
    const politeAnnouncements = activeAnnouncements.filter(a => a.priority === 'polite');

    return (
      <>
        {/* Anúncios assertivos */}
        {assertiveAnnouncements.length > 0 && (
          <div
            aria-live="assertive"
            aria-atomic={ariaAtomic}
            className="sr-only"
            role="status"
          >
            {assertiveAnnouncements.map(announcement => (
              <div key={announcement.id}>
                {announcement.message}
              </div>
            ))}
          </div>
        )}

        {/* Anúncios polite */}
        {politeAnnouncements.length > 0 && (
          <div
            aria-live="polite"
            aria-atomic={ariaAtomic}
            className="sr-only"
            role="status"
          >
            {politeAnnouncements.map(announcement => (
              <div key={announcement.id}>
                {announcement.message}
              </div>
            ))}
          </div>
        )}
      </>
    );
  };

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div 
      ref={announcerRef}
      className={`accessibility-announcer ${className}`}
      data-testid="accessibility-announcer"
    >
      {renderAnnouncements()}
      
      {/* Região de status para anúncios gerais */}
      <div
        aria-live={ariaLive}
        aria-atomic={ariaAtomic}
        className="sr-only"
        role="status"
        aria-label="Anúncios de acessibilidade"
      />
      
      {/* Região para anúncios de erro */}
      <div
        aria-live="assertive"
        aria-atomic={true}
        className="sr-only"
        role="alert"
        aria-label="Alertas de erro"
      />
      
      {/* Região para anúncios de progresso */}
      <div
        aria-live="polite"
        aria-atomic={false}
        className="sr-only"
        role="progressbar"
        aria-label="Progresso de operações"
      />
    </div>
  );
}

// ============================================================================
// Hook para usar o anunciador
// ============================================================================

export function useAnnouncer() {
  const [announcements, setAnnouncements] = useState<ScreenReaderAnnouncement[]>([]);

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite', category?: string) => {
    const announcement = createScreenReaderAnnouncement(message, priority, category);
    setAnnouncements(prev => [...prev, announcement]);
    
    // Remove o anúncio após um tempo
    setTimeout(() => {
      setAnnouncements(prev => prev.filter(a => a.id !== announcement.id));
    }, 5000);
  }, []);

  const clear = useCallback(() => {
    setAnnouncements([]);
  }, []);

  return {
    announcements,
    announce,
    clear
  };
}

// ============================================================================
// Componente de conveniência para anúncios rápidos
// ============================================================================

interface QuickAnnouncerProps {
  message?: string;
  priority?: 'polite' | 'assertive';
  category?: string;
  onAnnounce?: (message: string) => void;
}

export function QuickAnnouncer({ 
  message, 
  priority = 'polite', 
  category,
  onAnnounce 
}: QuickAnnouncerProps) {
  const { announcements, announce } = useAnnouncer();

  useEffect(() => {
    if (message) {
      announce(message, priority, category);
      onAnnounce?.(message);
    }
  }, [message, priority, category, announce, onAnnounce]);

  return <AccessibilityAnnouncer announcements={announcements} />;
}