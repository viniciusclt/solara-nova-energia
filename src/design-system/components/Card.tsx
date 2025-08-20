/**
 * Componente Card do Design System
 * Implementa variações específicas para diferentes contextos
 */

import React, { forwardRef } from 'react';
import { useDesignTokens } from '../useDesignTokens';
import { cn } from '../../utils/cn';

// =====================================================================================
// TIPOS E INTERFACES
// =====================================================================================

type CardVariant = 'default' | 'financial' | 'video' | 'proposal';
type CardSize = 'sm' | 'md' | 'lg' | 'xl';
type CardElevation = 'none' | 'sm' | 'md' | 'lg' | 'xl';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  size?: CardSize;
  elevation?: CardElevation;
  hoverable?: boolean;
  loading?: boolean;
  children: React.ReactNode;
}

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

interface CardBodyProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

// =====================================================================================
// ESTILOS BASE
// =====================================================================================

const getCardStyles = (
  variant: CardVariant,
  size: CardSize,
  elevation: CardElevation,
  hoverable: boolean,
  loading: boolean,
  tokens: ReturnType<typeof useDesignTokens>
) => {
  const variantStyles = tokens.variants.card[variant];
  
  // Estilos base
  const baseStyles = [
    'relative overflow-hidden transition-all duration-300',
    'border rounded-xl'
  ];

  // Estilos de tamanho (padding)
  const sizeStyles = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
    xl: 'p-8'
  };

  // Estilos de elevação
  const elevationStyles = {
    none: 'shadow-none',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl'
  };

  // Estilos específicos por variante
  const variantClasses = {
    default: [
      `bg-[${variantStyles.background}] text-[${variantStyles.text}]`,
      `border-[${variantStyles.border}]`,
      hoverable ? `hover:bg-[${variantStyles.hover}] hover:shadow-lg` : ''
    ],
    financial: [
      `bg-[${variantStyles.background}] text-[${variantStyles.text}]`,
      `border-[${variantStyles.border}]`,
      'shadow-financial',
      hoverable ? `hover:bg-[${variantStyles.hover}] hover:shadow-lg` : ''
    ],
    video: [
      `bg-[${variantStyles.background}] text-[${variantStyles.text}]`,
      `border-[${variantStyles.border}]`,
      'shadow-media-player',
      hoverable ? `hover:bg-[${variantStyles.hover}]` : ''
    ],
    proposal: [
      `bg-[${variantStyles.background}] text-[${variantStyles.text}]`,
      `border-[${variantStyles.border}]`,
      hoverable ? `hover:bg-[${variantStyles.hover}] hover:shadow-lg` : ''
    ]
  };

  return cn(
    ...baseStyles,
    sizeStyles[size],
    elevationStyles[elevation],
    ...variantClasses[variant],
    hoverable ? 'cursor-pointer' : '',
    loading ? 'animate-pulse' : ''
  );
};

// =====================================================================================
// COMPONENTE PRINCIPAL
// =====================================================================================

export const Card = forwardRef<HTMLDivElement, CardProps>((
  {
    variant = 'default',
    size = 'md',
    elevation = 'md',
    hoverable = false,
    loading = false,
    children,
    className,
    ...props
  },
  ref
) => {
  const tokens = useDesignTokens();
  
  const cardStyles = getCardStyles(
    variant,
    size,
    elevation,
    hoverable,
    loading,
    tokens
  );

  return (
    <div
      ref={ref}
      className={cn(cardStyles, className)}
      {...props}
    >
      {loading ? (
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
          <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
        </div>
      ) : (
        children
      )}
    </div>
  );
});

Card.displayName = 'Card';

// =====================================================================================
// COMPONENTES DE ESTRUTURA
// =====================================================================================

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>((
  { children, className, ...props },
  ref
) => (
  <div
    ref={ref}
    className={cn('flex items-center justify-between mb-4', className)}
    {...props}
  >
    {children}
  </div>
));

CardHeader.displayName = 'CardHeader';

export const CardBody = forwardRef<HTMLDivElement, CardBodyProps>((
  { children, className, ...props },
  ref
) => (
  <div
    ref={ref}
    className={cn('flex-1', className)}
    {...props}
  >
    {children}
  </div>
));

CardBody.displayName = 'CardBody';

export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>((
  { children, className, ...props },
  ref
) => (
  <div
    ref={ref}
    className={cn('flex items-center justify-end gap-2 mt-4 pt-4 border-t border-gray-200', className)}
    {...props}
  >
    {children}
  </div>
));

CardFooter.displayName = 'CardFooter';

// =====================================================================================
// COMPONENTES ESPECIALIZADOS
// =====================================================================================

// Card para resultados financeiros
export const FinancialCard = forwardRef<HTMLDivElement, Omit<CardProps, 'variant'>>((
  { elevation = 'lg', ...props },
  ref
) => (
  <Card
    ref={ref}
    variant="financial"
    elevation={elevation}
    {...props}
  />
));

FinancialCard.displayName = 'FinancialCard';

// Card para player de vídeo
export const VideoCard = forwardRef<HTMLDivElement, Omit<CardProps, 'variant'>>((
  { size = 'lg', elevation = 'xl', ...props },
  ref
) => (
  <Card
    ref={ref}
    variant="video"
    size={size}
    elevation={elevation}
    {...props}
  />
));

VideoCard.displayName = 'VideoCard';

// Card para propostas
export const ProposalCard = forwardRef<HTMLDivElement, Omit<CardProps, 'variant'>>((
  { hoverable = true, ...props },
  ref
) => (
  <Card
    ref={ref}
    variant="proposal"
    hoverable={hoverable}
    {...props}
  />
));

ProposalCard.displayName = 'ProposalCard';

// Card para métricas/estatísticas
export const MetricCard = forwardRef<HTMLDivElement, CardProps>((
  { children, className, ...props },
  ref
) => {
  const tokens = useDesignTokens();
  
  return (
    <Card
      ref={ref}
      variant="default"
      size="md"
      elevation="md"
      hoverable
      className={cn('text-center', className)}
      {...props}
    >
      {children}
    </Card>
  );
});

MetricCard.displayName = 'MetricCard';

// Card para upload de arquivos
export const UploadCard = forwardRef<HTMLDivElement, CardProps>((
  { children, className, ...props },
  ref
) => (
  <Card
    ref={ref}
    variant="default"
    size="lg"
    elevation="md"
    className={cn(
      'border-dashed border-2 text-center',
      'hover:border-primary-500 hover:bg-primary-50',
      'transition-colors duration-200',
      className
    )}
    {...props}
  >
    {children}
  </Card>
));

UploadCard.displayName = 'UploadCard';

export default Card;