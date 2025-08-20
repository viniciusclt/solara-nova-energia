/**
 * Componente Input do Design System
 * Implementa validação e estados visuais consistentes
 */

import React, { forwardRef, useState } from 'react';
import { Eye, EyeOff, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { useDesignTokens } from '../useDesignTokens';
import { cn } from '../../utils/cn';

// =====================================================================================
// TIPOS E INTERFACES
// =====================================================================================

type InputVariant = 'default' | 'error' | 'success' | 'disabled';
type InputSize = 'sm' | 'md' | 'lg';
type InputType = 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  variant?: InputVariant;
  size?: InputSize;
  label?: string;
  helperText?: string;
  errorMessage?: string;
  successMessage?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  loading?: boolean;
  required?: boolean;
  showPasswordToggle?: boolean;
}

// =====================================================================================
// ESTILOS BASE
// =====================================================================================

const getInputStyles = (
  variant: InputVariant,
  size: InputSize,
  hasLeftIcon: boolean,
  hasRightIcon: boolean,
  tokens: ReturnType<typeof useDesignTokens>
) => {
  const variantStyles = tokens.variants.input[variant];
  
  // Estilos base
  const baseStyles = [
    'w-full transition-all duration-200',
    'border rounded-lg',
    'focus:outline-none focus:ring-2 focus:ring-offset-1',
    'placeholder:text-gray-400'
  ];

  // Estilos de tamanho
  const sizeStyles = {
    sm: [
      'text-sm py-2',
      hasLeftIcon ? 'pl-9' : 'pl-3',
      hasRightIcon ? 'pr-9' : 'pr-3'
    ],
    md: [
      'text-base py-2.5',
      hasLeftIcon ? 'pl-10' : 'pl-3',
      hasRightIcon ? 'pr-10' : 'pr-3'
    ],
    lg: [
      'text-lg py-3',
      hasLeftIcon ? 'pl-12' : 'pl-4',
      hasRightIcon ? 'pr-12' : 'pr-4'
    ]
  };

  // Estilos de variante
  const variantClasses = {
    default: [
      `bg-[${variantStyles.background}] text-[${variantStyles.text}]`,
      `border-[${variantStyles.border}]`,
      `hover:border-[${variantStyles.hover}]`,
      `focus:border-[${variantStyles.active}] focus:ring-[${variantStyles.active}]/20`
    ],
    error: [
      `bg-[${variantStyles.background}] text-[${variantStyles.text}]`,
      `border-[${variantStyles.border}]`,
      `focus:border-[${variantStyles.active}] focus:ring-[${variantStyles.active}]/20`
    ],
    success: [
      `bg-[${variantStyles.background}] text-[${variantStyles.text}]`,
      `border-[${variantStyles.border}]`,
      `focus:border-[${variantStyles.active}] focus:ring-[${variantStyles.active}]/20`
    ],
    disabled: [
      `bg-[${variantStyles.background}] text-[${variantStyles.text}]`,
      `border-[${variantStyles.border}]`,
      'cursor-not-allowed'
    ]
  };

  return cn(
    ...baseStyles,
    ...sizeStyles[size],
    ...variantClasses[variant]
  );
};

const getIconStyles = (size: InputSize, position: 'left' | 'right') => {
  const sizeMap = {
    sm: { size: 16, position: position === 'left' ? 'left-3' : 'right-3' },
    md: { size: 18, position: position === 'left' ? 'left-3' : 'right-3' },
    lg: { size: 20, position: position === 'left' ? 'left-4' : 'right-4' }
  };

  return {
    size: sizeMap[size].size,
    className: cn(
      'absolute top-1/2 transform -translate-y-1/2 text-gray-400',
      sizeMap[size].position
    )
  };
};

// =====================================================================================
// COMPONENTE PRINCIPAL
// =====================================================================================

export const Input = forwardRef<HTMLInputElement, InputProps>((
  {
    variant = 'default',
    size = 'md',
    type = 'text',
    label,
    helperText,
    errorMessage,
    successMessage,
    leftIcon,
    rightIcon,
    loading = false,
    required = false,
    showPasswordToggle = false,
    disabled = false,
    className,
    ...props
  },
  ref
) => {
  const tokens = useDesignTokens();
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  
  // Determina a variante baseada no estado
  const currentVariant = disabled ? 'disabled' : 
                        errorMessage ? 'error' : 
                        successMessage ? 'success' : 
                        variant;
  
  const inputType = type === 'password' && showPassword ? 'text' : type;
  const hasLeftIcon = !!leftIcon;
  const hasRightIcon = !!rightIcon || showPasswordToggle || loading;
  
  const inputStyles = getInputStyles(
    currentVariant,
    size,
    hasLeftIcon,
    hasRightIcon,
    tokens
  );

  const leftIconProps = hasLeftIcon ? getIconStyles(size, 'left') : null;
  const rightIconProps = hasRightIcon ? getIconStyles(size, 'right') : null;

  const renderStatusIcon = () => {
    if (loading) {
      return (
        <div className={rightIconProps?.className}>
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-primary-500" />
        </div>
      );
    }
    
    if (errorMessage) {
      return (
        <AlertCircle 
          size={rightIconProps?.size} 
          className={cn(rightIconProps?.className, 'text-red-500')} 
        />
      );
    }
    
    if (successMessage) {
      return (
        <CheckCircle 
          size={rightIconProps?.size} 
          className={cn(rightIconProps?.className, 'text-green-500')} 
        />
      );
    }
    
    if (showPasswordToggle && type === 'password') {
      const PasswordIcon = showPassword ? EyeOff : Eye;
      return (
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className={cn(rightIconProps?.className, 'hover:text-gray-600 cursor-pointer')}
          tabIndex={-1}
        >
          <PasswordIcon size={rightIconProps?.size} />
        </button>
      );
    }
    
    if (rightIcon) {
      return (
        <span className={rightIconProps?.className}>
          {rightIcon}
        </span>
      );
    }
    
    return null;
  };

  const renderMessage = () => {
    if (errorMessage) {
      return (
        <div className="flex items-center gap-1 mt-1 text-sm text-red-600">
          <AlertCircle size={14} />
          {errorMessage}
        </div>
      );
    }
    
    if (successMessage) {
      return (
        <div className="flex items-center gap-1 mt-1 text-sm text-green-600">
          <CheckCircle size={14} />
          {successMessage}
        </div>
      );
    }
    
    if (helperText) {
      return (
        <div className="flex items-center gap-1 mt-1 text-sm text-gray-500">
          <Info size={14} />
          {helperText}
        </div>
      );
    }
    
    return null;
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {hasLeftIcon && leftIcon && (
          <span className={leftIconProps?.className}>
            {leftIcon}
          </span>
        )}
        
        <input
          ref={ref}
          type={inputType}
          disabled={disabled || loading}
          className={cn(inputStyles, className)}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          {...props}
        />
        
        {renderStatusIcon()}
      </div>
      
      {renderMessage()}
    </div>
  );
});

Input.displayName = 'Input';

// =====================================================================================
// COMPONENTES ESPECIALIZADOS
// =====================================================================================

// Input para valores financeiros
export const FinancialInput = forwardRef<HTMLInputElement, Omit<InputProps, 'type'>>((
  { ...props },
  ref
) => (
  <Input
    ref={ref}
    type="number"
    leftIcon={<span className="text-gray-500">R$</span>}
    {...props}
  />
));

FinancialInput.displayName = 'FinancialInput';

// Input para busca
export const SearchInput = forwardRef<HTMLInputElement, Omit<InputProps, 'type'>>((
  { placeholder = 'Buscar...', ...props },
  ref
) => (
  <Input
    ref={ref}
    type="search"
    placeholder={placeholder}
    {...props}
  />
));

SearchInput.displayName = 'SearchInput';

// Input para email
export const EmailInput = forwardRef<HTMLInputElement, Omit<InputProps, 'type'>>((
  { ...props },
  ref
) => (
  <Input
    ref={ref}
    type="email"
    {...props}
  />
));

EmailInput.displayName = 'EmailInput';

// Input para senha
export const PasswordInput = forwardRef<HTMLInputElement, Omit<InputProps, 'type' | 'showPasswordToggle'>>((
  { ...props },
  ref
) => (
  <Input
    ref={ref}
    type="password"
    showPasswordToggle
    {...props}
  />
));

PasswordInput.displayName = 'PasswordInput';

export default Input;