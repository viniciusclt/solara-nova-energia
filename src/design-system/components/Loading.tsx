/**
 * Componente Loading do Design System
 * Implementa skeleton loading e estados de carregamento
 */

import React from 'react';
import { Loader2 } from 'lucide-react';
import { useDesignTokens } from '../useDesignTokens';
import { cn } from '../../utils/cn';

// =====================================================================================
// TIPOS E INTERFACES
// =====================================================================================

type LoadingVariant = 'spinner' | 'skeleton' | 'pulse' | 'dots';
type LoadingSize = 'sm' | 'md' | 'lg' | 'xl';

interface LoadingProps {
  variant?: LoadingVariant;
  size?: LoadingSize;
  text?: string;
  className?: string;
}

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  className?: string;
  rounded?: boolean;
  animate?: boolean;
}

interface SkeletonTextProps {
  lines?: number;
  className?: string;
}

interface SkeletonCardProps {
  showAvatar?: boolean;
  showImage?: boolean;
  lines?: number;
  className?: string;
}

// =====================================================================================
// COMPONENTE SPINNER
// =====================================================================================

export const Spinner: React.FC<LoadingProps> = ({
  size = 'md',
  text,
  className
}) => {
  const sizeMap = {
    sm: 16,
    md: 24,
    lg: 32,
    xl: 48
  };

  return (
    <div className={cn('flex flex-col items-center justify-center gap-2', className)}>
      <Loader2 size={sizeMap[size]} className="animate-spin text-primary-500" />
      {text && (
        <span className="text-sm text-gray-600 animate-pulse">{text}</span>
      )}
    </div>
  );
};

// =====================================================================================
// COMPONENTE DOTS
// =====================================================================================

export const DotsLoading: React.FC<LoadingProps> = ({
  size = 'md',
  className
}) => {
  const sizeClasses = {
    sm: 'w-1 h-1',
    md: 'w-2 h-2',
    lg: 'w-3 h-3',
    xl: 'w-4 h-4'
  };

  return (
    <div className={cn('flex items-center justify-center gap-1', className)}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={cn(
            'bg-primary-500 rounded-full animate-pulse',
            sizeClasses[size]
          )}
          style={{
            animationDelay: `${i * 0.2}s`,
            animationDuration: '1s'
          }}
        />
      ))}
    </div>
  );
};

// =====================================================================================
// COMPONENTE SKELETON
// =====================================================================================

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = '1rem',
  className,
  rounded = false,
  animate = true
}) => {
  const style = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height
  };

  return (
    <div
      className={cn(
        'bg-gray-200',
        rounded ? 'rounded-full' : 'rounded',
        animate ? 'animate-pulse' : '',
        className
      )}
      style={style}
    />
  );
};

// =====================================================================================
// SKELETON TEXT
// =====================================================================================

export const SkeletonText: React.FC<SkeletonTextProps> = ({
  lines = 3,
  className
}) => {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height="1rem"
          width={i === lines - 1 ? '75%' : '100%'}
        />
      ))}
    </div>
  );
};

// =====================================================================================
// SKELETON CARD
// =====================================================================================

export const SkeletonCard: React.FC<SkeletonCardProps> = ({
  showAvatar = false,
  showImage = false,
  lines = 3,
  className
}) => {
  return (
    <div className={cn('p-4 border rounded-lg bg-white', className)}>
      {/* Header com avatar */}
      {showAvatar && (
        <div className="flex items-center gap-3 mb-4">
          <Skeleton width={40} height={40} rounded />
          <div className="flex-1">
            <Skeleton height="1rem" width="60%" className="mb-2" />
            <Skeleton height="0.75rem" width="40%" />
          </div>
        </div>
      )}
      
      {/* Imagem */}
      {showImage && (
        <Skeleton height={200} className="mb-4" />
      )}
      
      {/* Texto */}
      <SkeletonText lines={lines} />
    </div>
  );
};

// =====================================================================================
// SKELETON ESPECÍFICOS
// =====================================================================================

// Skeleton para tabela
export const SkeletonTable: React.FC<{ rows?: number; cols?: number; className?: string }> = ({
  rows = 5,
  cols = 4,
  className
}) => {
  return (
    <div className={cn('space-y-3', className)}>
      {/* Header */}
      <div className="flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} height="2rem" className="flex-1" />
        ))}
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4">
          {Array.from({ length: cols }).map((_, colIndex) => (
            <Skeleton key={colIndex} height="1.5rem" className="flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
};

// Skeleton para gráfico
export const SkeletonChart: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn('space-y-4', className)}>
      {/* Título */}
      <Skeleton height="1.5rem" width="40%" />
      
      {/* Gráfico */}
      <div className="relative">
        <Skeleton height={300} />
        
        {/* Barras simuladas */}
        <div className="absolute inset-4 flex items-end justify-around">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton
              key={i}
              width={20}
              height={Math.random() * 200 + 50}
              className="bg-gray-300"
            />
          ))}
        </div>
      </div>
      
      {/* Legenda */}
      <div className="flex justify-center gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton width={12} height={12} />
            <Skeleton width={60} height="1rem" />
          </div>
        ))}
      </div>
    </div>
  );
};

// Skeleton para player de vídeo
export const SkeletonVideoPlayer: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn('space-y-4', className)}>
      {/* Player */}
      <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
        <Skeleton height="100%" className="bg-gray-800" />
        
        {/* Play button */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Skeleton width={60} height={60} rounded className="bg-gray-700" />
        </div>
        
        {/* Controls */}
        <div className="absolute bottom-4 left-4 right-4 flex items-center gap-2">
          <Skeleton width={30} height={30} rounded className="bg-gray-700" />
          <Skeleton height={4} className="flex-1 bg-gray-700" />
          <Skeleton width={60} height="1rem" className="bg-gray-700" />
        </div>
      </div>
      
      {/* Título e descrição */}
      <div className="space-y-2">
        <Skeleton height="1.5rem" width="80%" />
        <SkeletonText lines={2} />
      </div>
    </div>
  );
};

// Skeleton para dashboard financeiro
export const SkeletonFinancialDashboard: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn('space-y-6', className)}>
      {/* Métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="p-4 border rounded-lg">
            <Skeleton height="1rem" width="60%" className="mb-2" />
            <Skeleton height="2rem" width="80%" className="mb-1" />
            <Skeleton height="0.75rem" width="40%" />
          </div>
        ))}
      </div>
      
      {/* Gráfico principal */}
      <SkeletonChart />
      
      {/* Tabela de resultados */}
      <SkeletonTable rows={5} cols={4} />
    </div>
  );
};

// =====================================================================================
// COMPONENTE PRINCIPAL
// =====================================================================================

export const Loading: React.FC<LoadingProps> = ({
  variant = 'spinner',
  size = 'md',
  text,
  className
}) => {
  switch (variant) {
    case 'dots':
      return <DotsLoading size={size} className={className} />;
    case 'skeleton':
      return <SkeletonCard className={className} />;
    case 'pulse':
      return (
        <div className={cn('animate-pulse bg-gray-200 rounded', className)} />
      );
    default:
      return <Spinner size={size} text={text} className={className} />;
  }
};

export default Loading;