/**
 * Componente Button do Design System
 * Implementa todas as variações e estados conforme PRD
 */

import React, { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { useDesignTokens } from '../useDesignTokens';
import { cn } from '../../utils/cn';

// =====================================================================================
// TIPOS E INTERFACES
// =====================================================================================

type ButtonVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';
type ButtonRadius = 'none' | 'sm' | 'md' | 'lg' | 'full';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  radius?: ButtonRadius;
  loading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  children: React.ReactNode;
}

// =====================================================================================
// ESTILOS BASE
// =====================================================================================

const getButtonStyles = (
  variant: ButtonVariant,
  size: ButtonSize,
  radius: ButtonRadius,
  fullWidth: boolean,
  disabled: boolean,
  loading: boolean,
  tokens: ReturnType<typeof useDesignTokens>
) => {
  const variantStyles = tokens.variants.button[variant];
  
  // Estilos base
  const baseStyles = [
    'inline-flex items-center justify-center',
    'font-medium transition-all duration-300',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'active:scale-95 transform',
    'select-none cursor-pointer'
  ];

  // Estilos de tamanho
  const sizeStyles = {
    sm: ['text-sm px-3 py-1.5 gap-1.5', 'min-h-[32px]'],
    md: ['text-sm px-4 py-2 gap-2', 'min-h-[40px]'],
    lg: ['text-base px-6 py-3 gap-2.5', 'min-h-[48px]'],
    xl: ['text-lg px-8 py-4 gap-3', 'min-h-[56px]']
  };

  // Estilos de raio
  const radiusStyles = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    full: 'rounded-full'
  };

  // Estilos de variante
  const variantClasses = {
    primary: [
      `bg-[${variantStyles.background}] text-[${variantStyles.text}]`,
      `border border-[${variantStyles.border}]`,
      `hover:bg-[${variantStyles.hover}] hover:border-[${variantStyles.hover}]`,
      `focus:ring-[${variantStyles.primary}]/20`,
      disabled || loading ? `bg-[${variantStyles.disabled}] border-[${variantStyles.disabled}] cursor-not-allowed` : ''
    ],
    secondary: [
      `bg-[${variantStyles.background}] text-[${variantStyles.text}]`,
      `border border-[${variantStyles.border}]`,
      `hover:bg-[${variantStyles.hover}] hover:border-[${variantStyles.hover}]`,
      `focus:ring-[${variantStyles.primary}]/20`,
      disabled || loading ? `bg-[${variantStyles.disabled}] border-[${variantStyles.disabled}] cursor-not-allowed` : ''
    ],
    success: [
      `bg-[${variantStyles.background}] text-[${variantStyles.text}]`,
      `border border-[${variantStyles.border}]`,
      `hover:bg-[${variantStyles.hover}] hover:border-[${variantStyles.hover}]`,
      `focus:ring-[${variantStyles.primary}]/20`,
      disabled || loading ? `bg-[${variantStyles.disabled}] border-[${variantStyles.disabled}] cursor-not-allowed` : ''
    ],
    warning: [
      `bg-[${variantStyles.background}] text-[${variantStyles.text}]`,
      `border border-[${variantStyles.border}]`,
      `hover:bg-[${variantStyles.hover}] hover:border-[${variantStyles.hover}]`,
      `focus:ring-[${variantStyles.primary}]/20`,
      disabled || loading ? `bg-[${variantStyles.disabled}] border-[${variantStyles.disabled}] cursor-not-allowed` : ''
    ],
    error: [
      `bg-[${variantStyles.background}] text-[${variantStyles.text}]`,
      `border border-[${variantStyles.border}]`,
      `hover:bg-[${variantStyles.hover}] hover:border-[${variantStyles.hover}]`,
      `focus:ring-[${variantStyles.primary}]/20`,
      disabled || loading ? `bg-[${variantStyles.disabled}] border-[${variantStyles.disabled}] cursor-not-allowed` : ''
    ],
    ghost: [
      `bg-[${variantStyles.background}] text-[${variantStyles.text}]`,
      `border border-[${variantStyles.border}]`,
      `hover:bg-[${variantStyles.hover}] hover:border-[${variantStyles.border}]`,
      `focus:ring-[${variantStyles.text}]/20`,
      disabled || loading ? `text-[${variantStyles.disabled}] border-[${variantStyles.disabled}] cursor-not-allowed` : ''
    ]
  };

  return cn(
    ...baseStyles,
    ...sizeStyles[size],
    radiusStyles[radius],
    ...variantClasses[variant],
    fullWidth ? 'w-full' : '',
    disabled || loading ? 'pointer-events-none' : ''
  );
};

// =====================================================================================
// COMPONENTE PRINCIPAL
// =====================================================================================

export const Button = forwardRef<HTMLButtonElement, ButtonProps>((
  {
    variant = 'primary',
    size = 'md',
    radius = 'md',
    loading = false,
    loadingText,
    leftIcon,
    rightIcon,
    fullWidth = false,
    disabled = false,
    children,
    className,
    ...props
  },
  ref
) => {
  const tokens = useDesignTokens();
  
  const buttonStyles = getButtonStyles(
    variant,
    size,
    radius,
    fullWidth,
    disabled,
    loading,
    tokens
  );

  const iconSize = {
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20
  }[size];

  const renderContent = () => {
    if (loading) {
      return (
        <>
          <Loader2 size={iconSize} className="animate-spin" />
          {loadingText || children}
        </>
      );
    }

    return (
      <>
        {leftIcon && (
          <span className="flex-shrink-0" style={{ fontSize: iconSize }}>
            {leftIcon}
          </span>
        )}
        <span className="flex-1">{children}</span>
        {rightIcon && (
          <span className="flex-shrink-0" style={{ fontSize: iconSize }}>
            {rightIcon}
          </span>
        )}
      </>
    );
  };

  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(buttonStyles, className)}
      {...props}
    >
      {renderContent()}
    </button>
  );
});

Button.displayName = 'Button';

// =====================================================================================
// COMPONENTES ESPECIALIZADOS
// =====================================================================================

// Botão para cálculos financeiros
export const FinancialButton = forwardRef<HTMLButtonElement, Omit<ButtonProps, 'variant'>>((
  props,
  ref
) => (
  <Button
    ref={ref}
    variant="primary"
    radius="lg"
    {...props}
  />
));

FinancialButton.displayName = 'FinancialButton';

// Botão para upload de vídeos
export const VideoUploadButton = forwardRef<HTMLButtonElement, Omit<ButtonProps, 'variant'>>((
  props,
  ref
) => (
  <Button
    ref={ref}
    variant="secondary"
    radius="md"
    {...props}
  />
));

VideoUploadButton.displayName = 'VideoUploadButton';

// Botão para propostas
export const ProposalButton = forwardRef<HTMLButtonElement, Omit<ButtonProps, 'variant'>>((
  props,
  ref
) => (
  <Button
    ref={ref}
    variant="success"
    radius="lg"
    {...props}
  />
));

ProposalButton.displayName = 'ProposalButton';

export default Button;