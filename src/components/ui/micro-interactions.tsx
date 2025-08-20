import React from 'react';
import { motion, MotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

// =====================================================
// MICRO-INTERAÇÕES PARA MELHOR UX
// =====================================================

interface MicroInteractionProps extends MotionProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'hover' | 'tap' | 'focus' | 'loading' | 'success' | 'error';
  disabled?: boolean;
}

// Componente base para micro-interações
export const MicroInteraction: React.FC<MicroInteractionProps> = ({
  children,
  className,
  variant = 'hover',
  disabled = false,
  ...motionProps
}) => {
  const getVariantProps = () => {
    if (disabled) return {};
    
    switch (variant) {
      case 'hover':
        return {
          whileHover: { scale: 1.02, transition: { duration: 0.2 } },
          whileTap: { scale: 0.98 }
        };
      case 'tap':
        return {
          whileTap: { scale: 0.95, transition: { duration: 0.1 } }
        };
      case 'focus':
        return {
          whileFocus: { 
            boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.3)',
            transition: { duration: 0.2 }
          }
        };
      case 'loading':
        return {
          animate: {
            opacity: [1, 0.7, 1],
            transition: {
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut'
            }
          }
        };
      case 'success':
        return {
          animate: {
            scale: [1, 1.05, 1],
            transition: { duration: 0.3 }
          }
        };
      case 'error':
        return {
          animate: {
            x: [0, -10, 10, -10, 10, 0],
            transition: { duration: 0.5 }
          }
        };
      default:
        return {};
    }
  };

  return (
    <motion.div
      className={cn(className, disabled && 'opacity-50 cursor-not-allowed')}
      {...getVariantProps()}
      {...motionProps}
    >
      {children}
    </motion.div>
  );
};

// Botão com micro-interações aprimoradas
export const InteractiveButton: React.FC<{
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
}> = ({ children, className, onClick, disabled, loading, variant = 'primary' }) => {
  const baseClasses = 'px-4 py-2 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
    outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-blue-500',
    ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-500'
  };

  return (
    <MicroInteraction
      variant={loading ? 'loading' : 'hover'}
      disabled={disabled || loading}
      className={cn(baseClasses, variantClasses[variant], className)}
      onClick={onClick}
      role="button"
      tabIndex={0}
    >
      {loading ? (
        <div className="flex items-center space-x-2">
          <motion.div
            className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
          <span>Carregando...</span>
        </div>
      ) : (
        children
      )}
    </MicroInteraction>
  );
};

// Card com efeitos de hover aprimorados
export const InteractiveCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}> = ({ children, className, onClick, hoverable = true }) => {
  return (
    <motion.div
      className={cn(
        'bg-white rounded-lg border shadow-sm',
        hoverable && 'cursor-pointer',
        className
      )}
      whileHover={hoverable ? {
        y: -2,
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
        transition: { duration: 0.2 }
      } : {}}
      whileTap={onClick ? { scale: 0.98 } : {}}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
};

// Input com feedback visual aprimorado
export const InteractiveInput: React.FC<{
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
  error?: boolean;
  success?: boolean;
}> = ({ placeholder, value, onChange, className, error, success }) => {
  const [isFocused, setIsFocused] = React.useState(false);

  const getBorderColor = () => {
    if (error) return 'border-red-500 focus:ring-red-500';
    if (success) return 'border-green-500 focus:ring-green-500';
    return 'border-gray-300 focus:ring-blue-500';
  };

  return (
    <motion.div className="relative">
      <motion.input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={cn(
          'w-full px-3 py-2 border rounded-md transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-offset-1',
          getBorderColor(),
          className
        )}
        animate={{
          scale: isFocused ? 1.02 : 1,
          transition: { duration: 0.2 }
        }}
      />
      
      {/* Indicador de status */}
      <AnimatePresence>
        {(error || success) && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className={cn(
              'absolute right-3 top-1/2 transform -translate-y-1/2',
              'w-2 h-2 rounded-full',
              error ? 'bg-red-500' : 'bg-green-500'
            )}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Badge com animação de entrada
export const AnimatedBadge: React.FC<{
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'success' | 'warning' | 'error';
}> = ({ children, className, variant = 'default' }) => {
  const variantClasses = {
    default: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800'
  };

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        variantClasses[variant],
        className
      )}
    >
      {children}
    </motion.span>
  );
};

// Tooltip com animação suave
export const AnimatedTooltip: React.FC<{
  children: React.ReactNode;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}> = ({ children, content, position = 'top' }) => {
  const [isVisible, setIsVisible] = React.useState(false);

  const getPositionClasses = () => {
    switch (position) {
      case 'top':
        return 'bottom-full left-1/2 transform -translate-x-1/2 mb-2';
      case 'bottom':
        return 'top-full left-1/2 transform -translate-x-1/2 mt-2';
      case 'left':
        return 'right-full top-1/2 transform -translate-y-1/2 mr-2';
      case 'right':
        return 'left-full top-1/2 transform -translate-y-1/2 ml-2';
      default:
        return 'bottom-full left-1/2 transform -translate-x-1/2 mb-2';
    }
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: position === 'top' ? 10 : -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: position === 'top' ? 10 : -10 }}
            transition={{ duration: 0.2 }}
            className={cn(
              'absolute z-50 px-2 py-1 text-sm text-white bg-gray-900 rounded whitespace-nowrap',
              getPositionClasses()
            )}
          >
            {content}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Progress bar com animação
export const AnimatedProgress: React.FC<{
  value: number;
  max?: number;
  className?: string;
  showLabel?: boolean;
}> = ({ value, max = 100, className, showLabel = false }) => {
  const percentage = Math.min((value / max) * 100, 100);

  return (
    <div className={cn('w-full', className)}>
      {showLabel && (
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>Progresso</span>
          <span>{Math.round(percentage)}%</span>
        </div>
      )}
      
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <motion.div
          className="h-full bg-blue-600 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
};

// Loading spinner com micro-interações
export const LoadingSpinner: React.FC<{
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}> = ({ size = 'md', className }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <motion.div
      className={cn(
        'border-2 border-gray-300 border-t-blue-600 rounded-full',
        sizeClasses[size],
        className
      )}
      animate={{ rotate: 360 }}
      transition={{
        duration: 1,
        repeat: Infinity,
        ease: 'linear'
      }}
    />
  );
};