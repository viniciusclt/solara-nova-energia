// ============================================================================
// Accessibility Utils - Utilitários para sistema de acessibilidade
// ============================================================================

import { WCAG_CONTRAST_RATIOS, KEYBOARD_KEYS, HIGH_CONTRAST_COLORS } from './constants';
import { FocusableElement, ScreenReaderAnnouncement } from './types';

// ============================================================================
// Color Contrast Utilities
// ============================================================================

/**
 * Converte cor hex para RGB
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

/**
 * Calcula a luminância relativa de uma cor
 */
export function getRelativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calcula a razão de contraste entre duas cores
 */
export function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  if (!rgb1 || !rgb2) return 1;
  
  const lum1 = getRelativeLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getRelativeLuminance(rgb2.r, rgb2.g, rgb2.b);
  
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  
  return (brightest + 0.05) / (darkest + 0.05);
}

/**
 * Verifica se uma combinação de cores atende aos padrões WCAG
 */
export function meetsWCAGContrast(
  foreground: string,
  background: string,
  level: 'AA' | 'AAA' = 'AA',
  size: 'normal' | 'large' = 'normal'
): boolean {
  const ratio = getContrastRatio(foreground, background);
  const required = level === 'AA' 
    ? (size === 'large' ? WCAG_CONTRAST_RATIOS.AA_LARGE : WCAG_CONTRAST_RATIOS.AA_NORMAL)
    : (size === 'large' ? WCAG_CONTRAST_RATIOS.AAA_LARGE : WCAG_CONTRAST_RATIOS.AAA_NORMAL);
  
  return ratio >= required;
}

/**
 * Gera uma cor com contraste adequado
 */
export function generateAccessibleColor(
  backgroundColor: string,
  preferredColor?: string,
  level: 'AA' | 'AAA' = 'AA'
): string {
  if (preferredColor && meetsWCAGContrast(preferredColor, backgroundColor, level)) {
    return preferredColor;
  }
  
  // Se não atende, retorna branco ou preto baseado na luminância do fundo
  const bgRgb = hexToRgb(backgroundColor);
  if (!bgRgb) return '#000000';
  
  const luminance = getRelativeLuminance(bgRgb.r, bgRgb.g, bgRgb.b);
  return luminance > 0.5 ? '#000000' : '#ffffff';
}

// ============================================================================
// Keyboard Navigation Utilities
// ============================================================================

/**
 * Verifica se uma tecla é uma tecla de navegação
 */
export function isNavigationKey(key: string): boolean {
  return [
    KEYBOARD_KEYS.ARROW_UP,
    KEYBOARD_KEYS.ARROW_DOWN,
    KEYBOARD_KEYS.ARROW_LEFT,
    KEYBOARD_KEYS.ARROW_RIGHT,
    KEYBOARD_KEYS.TAB,
    KEYBOARD_KEYS.HOME,
    KEYBOARD_KEYS.END,
    KEYBOARD_KEYS.PAGE_UP,
    KEYBOARD_KEYS.PAGE_DOWN
  ].includes(key);
}

/**
 * Verifica se uma tecla é uma tecla de ação
 */
export function isActionKey(key: string): boolean {
  return [
    KEYBOARD_KEYS.ENTER,
    KEYBOARD_KEYS.SPACE,
    KEYBOARD_KEYS.DELETE,
    KEYBOARD_KEYS.BACKSPACE,
    KEYBOARD_KEYS.ESCAPE
  ].includes(key);
}

/**
 * Normaliza uma combinação de teclas para comparação
 */
export function normalizeKeyCombo(keys: string[]): string {
  return keys
    .map(key => key.toLowerCase())
    .sort()
    .join('+');
}

/**
 * Verifica se um evento de teclado corresponde a uma combinação de teclas
 */
export function matchesKeyCombo(event: KeyboardEvent, combo: string[]): boolean {
  const eventKeys: string[] = [];
  
  if (event.ctrlKey) eventKeys.push('ctrl');
  if (event.altKey) eventKeys.push('alt');
  if (event.shiftKey) eventKeys.push('shift');
  if (event.metaKey) eventKeys.push('cmd');
  
  eventKeys.push(event.key.toLowerCase());
  
  return normalizeKeyCombo(eventKeys) === normalizeKeyCombo(combo);
}

// ============================================================================
// Focus Management Utilities
// ============================================================================

/**
 * Verifica se um elemento é focável
 */
export function isFocusable(element: HTMLElement): boolean {
  if (element.tabIndex < 0) return false;
  if (element.hasAttribute('disabled')) return false;
  if (element.getAttribute('aria-hidden') === 'true') return false;
  
  const style = window.getComputedStyle(element);
  if (style.display === 'none' || style.visibility === 'hidden') return false;
  
  return true;
}

/**
 * Encontra todos os elementos focáveis dentro de um container
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const focusableSelectors = [
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'a[href]',
    '[tabindex]:not([tabindex="-1"])',
    '[role="button"]:not([aria-disabled="true"])',
    '[role="menuitem"]:not([aria-disabled="true"])',
    '[role="option"]:not([aria-disabled="true"])'
  ].join(', ');
  
  const elements = Array.from(container.querySelectorAll(focusableSelectors)) as HTMLElement[];
  return elements.filter(isFocusable);
}

/**
 * Calcula a ordem de foco baseada na posição dos elementos
 */
export function calculateFocusOrder(elements: FocusableElement[]): string[] {
  return elements
    .sort((a, b) => {
      // Primeiro por prioridade
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      
      // Depois por tabIndex
      if (a.tabIndex !== b.tabIndex) {
        return a.tabIndex - b.tabIndex;
      }
      
      // Por último, por posição no DOM
      const aRect = a.element.getBoundingClientRect();
      const bRect = b.element.getBoundingClientRect();
      
      if (Math.abs(aRect.top - bRect.top) > 5) {
        return aRect.top - bRect.top;
      }
      
      return aRect.left - bRect.left;
    })
    .map(element => element.id);
}

/**
 * Move o foco para o próximo elemento na ordem
 */
export function moveFocusToNext(
  currentId: string,
  focusOrder: string[],
  focusableElements: Map<string, FocusableElement>
): string | null {
  const currentIndex = focusOrder.indexOf(currentId);
  if (currentIndex === -1) return null;
  
  const nextIndex = (currentIndex + 1) % focusOrder.length;
  const nextId = focusOrder[nextIndex];
  const nextElement = focusableElements.get(nextId);
  
  if (nextElement && isFocusable(nextElement.element)) {
    nextElement.element.focus();
    return nextId;
  }
  
  return null;
}

/**
 * Move o foco para o elemento anterior na ordem
 */
export function moveFocusToPrevious(
  currentId: string,
  focusOrder: string[],
  focusableElements: Map<string, FocusableElement>
): string | null {
  const currentIndex = focusOrder.indexOf(currentId);
  if (currentIndex === -1) return null;
  
  const prevIndex = currentIndex === 0 ? focusOrder.length - 1 : currentIndex - 1;
  const prevId = focusOrder[prevIndex];
  const prevElement = focusableElements.get(prevId);
  
  if (prevElement && isFocusable(prevElement.element)) {
    prevElement.element.focus();
    return prevId;
  }
  
  return null;
}

// ============================================================================
// Screen Reader Utilities
// ============================================================================

/**
 * Cria um anúncio para screen reader
 */
export function createAnnouncement(
  message: string,
  priority: 'polite' | 'assertive' = 'polite',
  category: string = 'general'
): ScreenReaderAnnouncement {
  return {
    id: `announcement-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    message,
    priority,
    timestamp: Date.now(),
    category
  };
}

/**
 * Limpa anúncios antigos
 */
export function cleanupAnnouncements(
  announcements: ScreenReaderAnnouncement[],
  maxAge: number = 5000,
  maxCount: number = 10
): ScreenReaderAnnouncement[] {
  const now = Date.now();
  return announcements
    .filter(announcement => now - announcement.timestamp < maxAge)
    .slice(-maxCount);
}

/**
 * Gera descrição acessível para um nó
 */
export function generateNodeDescription(
  type: string,
  label: string,
  connections: { incoming: number; outgoing: number },
  selected: boolean = false,
  position?: { x: number; y: number }
): string {
  let description = `Nó ${type} com rótulo "${label}"`;
  
  if (connections.incoming > 0 || connections.outgoing > 0) {
    description += `. ${connections.incoming} conexões de entrada, ${connections.outgoing} conexões de saída`;
  }
  
  if (selected) {
    description += '. Selecionado';
  }
  
  if (position) {
    description += `. Posição: x ${Math.round(position.x)}, y ${Math.round(position.y)}`;
  }
  
  return description;
}

// ============================================================================
// High Contrast Utilities
// ============================================================================

/**
 * Aplica cores de alto contraste a um elemento
 */
export function applyHighContrastColors(element: HTMLElement, role: string): void {
  const colors = HIGH_CONTRAST_COLORS;
  
  element.style.backgroundColor = colors.BACKGROUND;
  element.style.color = colors.FOREGROUND;
  element.style.borderColor = colors.BORDER;
  
  if (role === 'button' || role === 'menuitem') {
    element.style.setProperty('--focus-color', colors.FOCUS);
    element.style.setProperty('--selected-color', colors.SELECTED);
  }
}

/**
 * Remove cores de alto contraste de um elemento
 */
export function removeHighContrastColors(element: HTMLElement): void {
  element.style.removeProperty('background-color');
  element.style.removeProperty('color');
  element.style.removeProperty('border-color');
  element.style.removeProperty('--focus-color');
  element.style.removeProperty('--selected-color');
}

// ============================================================================
// Reduced Motion Utilities
// ============================================================================

/**
 * Verifica se o usuário prefere movimento reduzido
 */
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Aplica configurações de movimento reduzido
 */
export function applyReducedMotion(element: HTMLElement): void {
  element.style.setProperty('--animation-duration', '0s');
  element.style.setProperty('--transition-duration', '0s');
  element.classList.add('reduced-motion');
}

/**
 * Remove configurações de movimento reduzido
 */
export function removeReducedMotion(element: HTMLElement): void {
  element.style.removeProperty('--animation-duration');
  element.style.removeProperty('--transition-duration');
  element.classList.remove('reduced-motion');
}

// ============================================================================
// Validation Utilities
// ============================================================================

/**
 * Valida se um elemento tem atributos de acessibilidade adequados
 */
export function validateAccessibility(element: HTMLElement): {
  valid: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  
  // Verifica aria-label ou aria-labelledby
  if (!element.getAttribute('aria-label') && !element.getAttribute('aria-labelledby')) {
    issues.push('Elemento não possui aria-label ou aria-labelledby');
  }
  
  // Verifica role
  if (!element.getAttribute('role') && !['button', 'input', 'select', 'textarea', 'a'].includes(element.tagName.toLowerCase())) {
    issues.push('Elemento não possui role definido');
  }
  
  // Verifica tabindex para elementos interativos
  const isInteractive = element.getAttribute('role') === 'button' || 
                       ['button', 'input', 'select', 'textarea', 'a'].includes(element.tagName.toLowerCase());
  
  if (isInteractive && element.tabIndex < 0) {
    issues.push('Elemento interativo não é focável (tabindex < 0)');
  }
  
  // Verifica contraste de cores
  const style = window.getComputedStyle(element);
  const color = style.color;
  const backgroundColor = style.backgroundColor;
  
  if (color && backgroundColor && color !== 'rgba(0, 0, 0, 0)' && backgroundColor !== 'rgba(0, 0, 0, 0)') {
    if (!meetsWCAGContrast(color, backgroundColor)) {
      issues.push('Contraste de cores insuficiente');
    }
  }
  
  return {
    valid: issues.length === 0,
    issues
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Debounce function para otimizar performance
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle function para otimizar performance
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}