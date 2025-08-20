/**
 * Componentes Animados - Design System
 * Componentes wrapper que aplicam micro-interações automaticamente
 */

import React, { forwardRef, ReactNode, HTMLAttributes } from 'react';
import { useMicroInteractions, useEntranceAnimation, useHoverEffect } from './useMicroInteractions';
import { useDesignTokens } from '../useDesignTokens';

// =====================================================================================
// TIPOS E INTERFACES
// =====================================================================================

interface BaseAnimatedProps {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  animate?: boolean;
}

interface AnimatedButtonProps extends BaseAnimatedProps, Omit<HTMLAttributes<HTMLButtonElement>, 'children'> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  hoverEffect?: 'scale' | 'lift' | 'glow';
  intensity?: 'subtle' | 'normal' | 'strong';
}

interface AnimatedCardProps extends BaseAnimatedProps, Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  variant?: 'default' | 'financial' | 'interactive';
  elevation?: 'none' | 'sm' | 'md' | 'lg';
  hoverEffect?: boolean;
  entranceAnimation?: 'fade' | 'slide' | 'scale';
  entranceDelay?: number;
}

interface AnimatedInputProps extends BaseAnimatedProps, Omit<HTMLAttributes<HTMLInputElement>, 'children'> {
  state?: 'default' | 'error' | 'success';
  focusEffect?: boolean;
}

interface AnimatedContainerProps extends BaseAnimatedProps, Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  entranceType?: 'fade' | 'slide' | 'scale' | 'bounce';
  entranceDirection?: 'up' | 'down' | 'left' | 'right';
  entranceDelay?: number;
  hoverEffect?: 'scale' | 'lift' | 'glow' | 'rotate';
  hoverIntensity?: 'subtle' | 'normal' | 'strong';
}

// =====================================================================================
// ANIMATED BUTTON
// =====================================================================================

export const AnimatedButton = forwardRef<HTMLButtonElement, AnimatedButtonProps>((
  {
    children,
    className = '',
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    animate = true,
    hoverEffect = 'scale',
    intensity = 'normal',
    ...props
  },
  ref
) => {
  const { getButtonClasses, combineClasses } = useMicroInteractions();
  const { getButtonVariant, getButtonSize } = useDesignTokens();
  
  const buttonClasses = getButtonClasses(variant);
  const variantClasses = getButtonVariant(variant);
  const sizeClasses = getButtonSize(size);
  
  const finalClassName = combineClasses(
    buttonClasses.base,
    variantClasses,
    sizeClasses,
    animate && !disabled && buttonClasses.hover,
    animate && !disabled && buttonClasses.focus,
    animate && !disabled && buttonClasses.active,
    loading && 'cursor-wait opacity-75',
    disabled && 'cursor-not-allowed opacity-50',
    className
  );

  return (
    <button
      ref={ref}
      className={finalClassName}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          {children}
        </div>
      ) : (
        children
      )}
    </button>
  );
});

AnimatedButton.displayName = 'AnimatedButton';

// =====================================================================================
// ANIMATED CARD
// =====================================================================================

export const AnimatedCard = forwardRef<HTMLDivElement, AnimatedCardProps>((
  {
    children,
    className = '',
    variant = 'default',
    elevation = 'md',
    hoverEffect = true,
    entranceAnimation = 'fade',
    entranceDelay = 0,
    animate = true,
    ...props
  },
  ref
) => {
  const { getCardClasses, combineClasses } = useMicroInteractions();
  const { getCardVariant, getElevation } = useDesignTokens();
  
  const { isVisible, className: entranceClass } = useEntranceAnimation(
    entranceAnimation,
    undefined,
    entranceDelay
  );
  
  const cardClasses = getCardClasses(variant);
  const variantClasses = getCardVariant(variant);
  const elevationClasses = getElevation(elevation);
  
  const finalClassName = combineClasses(
    cardClasses.base,
    variantClasses,
    elevationClasses,
    animate && hoverEffect && cardClasses.hover,
    animate && entranceClass,
    className
  );

  return (
    <div
      ref={ref}
      className={finalClassName}
      style={{ opacity: animate && !isVisible ? 0 : 1 }}
      {...props}
    >
      {children}
    </div>
  );
});

AnimatedCard.displayName = 'AnimatedCard';

// =====================================================================================
// ANIMATED INPUT
// =====================================================================================

export const AnimatedInput = forwardRef<HTMLInputElement, AnimatedInputProps>((
  {
    className = '',
    state = 'default',
    focusEffect = true,
    animate = true,
    disabled = false,
    ...props
  },
  ref
) => {
  const { getInputClasses, combineClasses } = useMicroInteractions();
  const { getInputVariant } = useDesignTokens();
  
  const inputClasses = getInputClasses(state);
  const variantClasses = getInputVariant(state);
  
  const finalClassName = combineClasses(
    inputClasses.base,
    variantClasses,
    animate && focusEffect && inputClasses.focus,
    state === 'error' && inputClasses.error,
    state === 'success' && inputClasses.success,
    disabled && 'cursor-not-allowed opacity-50',
    className
  );

  return (
    <input
      ref={ref}
      className={finalClassName}
      disabled={disabled}
      {...props}
    />
  );
});

AnimatedInput.displayName = 'AnimatedInput';

// =====================================================================================
// ANIMATED CONTAINER
// =====================================================================================

export const AnimatedContainer = forwardRef<HTMLDivElement, AnimatedContainerProps>((
  {
    children,
    className = '',
    entranceType = 'fade',
    entranceDirection,
    entranceDelay = 0,
    hoverEffect,
    hoverIntensity = 'normal',
    animate = true,
    ...props
  },
  ref
) => {
  const { combineClasses } = useMicroInteractions();
  
  const { isVisible, className: entranceClass } = useEntranceAnimation(
    entranceType,
    entranceDirection,
    entranceDelay
  );
  
  const { isHovered, handlers } = useHoverEffect(
    hoverEffect || 'scale',
    hoverIntensity
  );
  
  const finalClassName = combineClasses(
    'transition-all duration-300 ease-in-out',
    animate && entranceClass,
    className
  );

  const containerProps = {
    ...props,
    ...(hoverEffect && animate ? handlers : {})
  };

  return (
    <div
      ref={ref}
      className={finalClassName}
      style={{ 
        opacity: animate && !isVisible ? 0 : 1,
        transform: hoverEffect && isHovered ? 'scale(1.02)' : 'scale(1)'
      }}
      {...containerProps}
    >
      {children}
    </div>
  );
});

AnimatedContainer.displayName = 'AnimatedContainer';

// =====================================================================================
// ANIMATED LIST
// =====================================================================================

interface AnimatedListProps extends BaseAnimatedProps {
  items: ReactNode[];
  staggerDelay?: number;
  entranceType?: 'fade' | 'slide' | 'scale';
  direction?: 'up' | 'down' | 'left' | 'right';
  as?: keyof JSX.IntrinsicElements;
}

export const AnimatedList: React.FC<AnimatedListProps> = ({
  items,
  staggerDelay = 100,
  entranceType = 'slide',
  direction = 'up',
  animate = true,
  className = '',
  as: Component = 'div'
}) => {
  return (
    <Component className={className}>
      {items.map((item, index) => (
        <AnimatedContainer
          key={index}
          entranceType={entranceType}
          entranceDirection={direction}
          entranceDelay={animate ? index * staggerDelay : 0}
          animate={animate}
        >
          {item}
        </AnimatedContainer>
      ))}
    </Component>
  );
};

// =====================================================================================
// ANIMATED MODAL
// =====================================================================================

interface AnimatedModalProps extends BaseAnimatedProps {
  isOpen: boolean;
  onClose: () => void;
  backdrop?: boolean;
  closeOnBackdropClick?: boolean;
}

export const AnimatedModal: React.FC<AnimatedModalProps> = ({
  children,
  isOpen,
  onClose,
  backdrop = true,
  closeOnBackdropClick = true,
  animate = true,
  className = ''
}) => {
  const { getModalClasses } = useMicroInteractions();
  const modalClasses = getModalClasses();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      {backdrop && (
        <div
          className={`absolute inset-0 bg-black/50 ${animate ? modalClasses.backdrop.enter : ''}`}
          onClick={closeOnBackdropClick ? onClose : undefined}
        />
      )}
      
      {/* Content */}
      <div
        className={`relative z-10 ${animate ? modalClasses.content.enter : ''} ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};

// =====================================================================================
// ANIMATED NOTIFICATION
// =====================================================================================

interface AnimatedNotificationProps extends BaseAnimatedProps {
  type?: 'success' | 'error' | 'warning' | 'info';
  autoClose?: boolean;
  duration?: number;
  onClose?: () => void;
}

export const AnimatedNotification: React.FC<AnimatedNotificationProps> = ({
  children,
  type = 'info',
  autoClose = true,
  duration = 5000,
  onClose,
  animate = true,
  className = ''
}) => {
  const [isVisible, setIsVisible] = React.useState(true);
  const { getNotificationVariant } = useDesignTokens();
  
  React.useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onClose?.(), 200);
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [autoClose, duration, onClose]);

  const typeClasses = getNotificationVariant(type);
  const animationClasses = animate ? (
    isVisible 
      ? 'animate-in slide-in-from-right-full duration-300'
      : 'animate-out slide-out-to-right-full duration-200'
  ) : '';

  return (
    <div
      className={`${typeClasses} ${animationClasses} ${className}`}
    >
      {children}
      {onClose && (
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(() => onClose(), 200);
          }}
          className="ml-auto p-1 hover:bg-black/10 rounded transition-colors"
        >
          ×
        </button>
      )}
    </div>
  );
};

// =====================================================================================
// ANIMATED PROGRESS
// =====================================================================================

interface AnimatedProgressProps {
  value: number;
  max?: number;
  variant?: 'default' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  animate?: boolean;
  className?: string;
}

export const AnimatedProgress: React.FC<AnimatedProgressProps> = ({
  value,
  max = 100,
  variant = 'default',
  size = 'md',
  showLabel = false,
  animate = true,
  className = ''
}) => {
  const percentage = Math.min((value / max) * 100, 100);
  const { getProgressVariant, getProgressSize } = useDesignTokens();
  
  const variantClasses = getProgressVariant(variant);
  const sizeClasses = getProgressSize(size);
  
  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between text-sm mb-1">
          <span>Progress</span>
          <span>{Math.round(percentage)}%</span>
        </div>
      )}
      
      <div className={`bg-gray-200 rounded-full overflow-hidden ${sizeClasses}`}>
        <div
          className={`h-full ${variantClasses} ${animate ? 'transition-all duration-500 ease-out' : ''}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

// =====================================================================================
// EXPORTS
// =====================================================================================

export default {
  AnimatedButton,
  AnimatedCard,
  AnimatedInput,
  AnimatedContainer,
  AnimatedList,
  AnimatedModal,
  AnimatedNotification,
  AnimatedProgress
};