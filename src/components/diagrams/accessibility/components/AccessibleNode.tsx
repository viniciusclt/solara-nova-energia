// ============================================================================
// AccessibleNode Component - Wrapper acessível para nós de diagrama
// ============================================================================

import React, { useEffect, useRef, useCallback, forwardRef } from 'react';
import { AccessibleNodeProps } from '../types';
import { ARIA_ROLES, ARIA_PROPERTIES } from '../constants';
import { generateNodeDescription, validateAccessibility } from '../utils';
import { useFocusManagement } from '../hooks/useFocusManagement';
import { useScreenReader } from '../hooks/useScreenReader';

const AccessibleNode = forwardRef<HTMLDivElement, AccessibleNodeProps>((
  {
    id,
    type,
    label,
    description,
    selected = false,
    disabled = false,
    draggable = true,
    deletable = true,
    editable = true,
    position,
    connections = { incoming: 0, outgoing: 0 },
    children,
    onSelect,
    onEdit,
    onDelete,
    onMove,
    onKeyDown,
    className = '',
    style = {},
    'aria-label': ariaLabel,
    'aria-describedby': ariaDescribedBy,
    ...props
  },
  ref
) => {
  const nodeRef = useRef<HTMLDivElement>(null);
  const { announce } = useScreenReader();
  const { registerFocusableElement, unregisterFocusableElement } = useFocusManagement({
    container: null // Will be set by parent
  });

  // ============================================================================
  // Geração de descrições acessíveis
  // ============================================================================

  const generateAriaLabel = useCallback(() => {
    if (ariaLabel) return ariaLabel;
    
    return generateNodeDescription(
      type,
      label,
      connections,
      selected,
      position
    );
  }, [ariaLabel, type, label, connections, selected, position]);

  const generateAriaDescription = useCallback(() => {
    if (description) return description;
    
    const actions: string[] = [];
    if (editable) actions.push('editar com Enter');
    if (deletable) actions.push('excluir com Delete');
    if (draggable) actions.push('mover com setas');
    
    return actions.length > 0 
      ? `Ações disponíveis: ${actions.join(', ')}`
      : undefined;
  }, [description, editable, deletable, draggable]);

  // ============================================================================
  // Event Handlers
  // ============================================================================

  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
    // Previne propagação para evitar conflitos com navegação global
    event.stopPropagation();

    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (!disabled) {
          if (event.key === 'Enter' && editable && onEdit) {
            onEdit(id);
            announce(`Editando ${label}`, 'assertive');
          } else if (onSelect) {
            onSelect(id, !selected);
            announce(`${label} ${selected ? 'desmarcado' : 'selecionado'}`, 'polite');
          }
        }
        break;
        
      case 'Delete':
      case 'Backspace':
        event.preventDefault();
        if (!disabled && deletable && onDelete) {
          onDelete(id);
          announce(`${label} excluído`, 'assertive');
        }
        break;
        
      case 'ArrowUp':
      case 'ArrowDown':
      case 'ArrowLeft':
      case 'ArrowRight':
        if (draggable && onMove && !disabled) {
          event.preventDefault();
          const moveDistance = event.shiftKey ? 10 : 1;
          const currentPos = position || { x: 0, y: 0 };
          
          let newPosition = { ...currentPos };
          
          switch (event.key) {
            case 'ArrowUp':
              newPosition.y -= moveDistance;
              break;
            case 'ArrowDown':
              newPosition.y += moveDistance;
              break;
            case 'ArrowLeft':
              newPosition.x -= moveDistance;
              break;
            case 'ArrowRight':
              newPosition.x += moveDistance;
              break;
          }
          
          onMove(id, newPosition);
          
          // Anuncia movimento apenas a cada 5 movimentos para evitar spam
          if (Math.abs(newPosition.x - currentPos.x) % 5 === 0 || 
              Math.abs(newPosition.y - currentPos.y) % 5 === 0) {
            announce(
              `${label} movido para x: ${Math.round(newPosition.x)}, y: ${Math.round(newPosition.y)}`,
              'polite'
            );
          }
        }
        break;
        
      case 'Escape':
        event.preventDefault();
        if (selected && onSelect) {
          onSelect(id, false);
          announce(`${label} desmarcado`, 'polite');
        }
        break;
    }

    // Chama handler personalizado se fornecido
    if (onKeyDown) {
      onKeyDown(event);
    }
  }, [id, label, selected, disabled, editable, deletable, draggable, position, onSelect, onEdit, onDelete, onMove, onKeyDown, announce]);

  const handleFocus = useCallback(() => {
    if (!disabled) {
      announce(`Focado em ${generateAriaLabel()}`, 'polite');
    }
  }, [disabled, generateAriaLabel, announce]);

  const handleClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (!disabled && onSelect) {
      onSelect(id, !selected);
    }
  }, [disabled, id, selected, onSelect]);

  const handleDoubleClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (!disabled && editable && onEdit) {
      onEdit(id);
    }
  }, [disabled, editable, id, onEdit]);

  // ============================================================================
  // Efeitos
  // ============================================================================

  // Registra elemento como focável
  useEffect(() => {
    const element = nodeRef.current;
    if (element && !disabled) {
      registerFocusableElement(id, element, selected ? 1 : 2);
      
      return () => {
        unregisterFocusableElement(id);
      };
    }
  }, [id, disabled, selected, registerFocusableElement, unregisterFocusableElement]);

  // Validação de acessibilidade em desenvolvimento
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const element = nodeRef.current;
      if (element) {
        const validation = validateAccessibility(element);
        if (!validation.valid) {
          console.warn(`Problemas de acessibilidade no nó ${id}:`, validation.issues);
        }
      }
    }
  }, [id]);

  // ============================================================================
  // Render
  // ============================================================================

  const ariaDescribedByValue = ariaDescribedBy || `${id}-description`;
  const nodeDescription = generateAriaDescription();

  return (
    <>
      <div
        ref={(element) => {
          nodeRef.current = element;
          if (ref) {
            if (typeof ref === 'function') {
              ref(element);
            } else {
              ref.current = element;
            }
          }
        }}
        id={id}
        role={ARIA_ROLES.BUTTON}
        tabIndex={disabled ? -1 : 0}
        aria-label={generateAriaLabel()}
        aria-describedby={nodeDescription ? ariaDescribedByValue : undefined}
        aria-selected={selected}
        aria-disabled={disabled}
        aria-grabbed={draggable && !disabled ? 'false' : undefined}
        data-node-id={id}
        data-node-type={type}
        data-testid={`accessible-node-${id}`}
        className={`
          accessible-node
          ${selected ? 'accessible-node--selected' : ''}
          ${disabled ? 'accessible-node--disabled' : ''}
          ${draggable ? 'accessible-node--draggable' : ''}
          ${className}
        `.trim()}
        style={{
          outline: 'none',
          cursor: disabled ? 'not-allowed' : 'pointer',
          ...style
        }}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        {...props}
      >
        {children}
      </div>
      
      {/* Descrição oculta para leitores de tela */}
      {nodeDescription && (
        <div
          id={ariaDescribedByValue}
          className="sr-only"
          style={{
            position: 'absolute',
            width: '1px',
            height: '1px',
            padding: '0',
            margin: '-1px',
            overflow: 'hidden',
            clip: 'rect(0, 0, 0, 0)',
            whiteSpace: 'nowrap',
            border: '0'
          }}
        >
          {nodeDescription}
        </div>
      )}
    </>
  );
});

AccessibleNode.displayName = 'AccessibleNode';

export { AccessibleNode };