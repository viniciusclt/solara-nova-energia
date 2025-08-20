/**
 * Componente de Loading Boundary para Lazy Loading
 * 
 * Fornece fallback de loading e tratamento de erros para componentes lazy.
 */

import React, { Component, ReactNode, Suspense } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';

interface LoadingBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode | string;
  errorMessage?: string;
  showProgress?: boolean;
  className?: string;
}

interface LoadingBoundaryState {
  hasError: boolean;
  error?: Error;
}

// Error Boundary para capturar erros de lazy loading
class ErrorBoundary extends Component<LoadingBoundaryProps, LoadingBoundaryState> {
  constructor(props: LoadingBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): LoadingBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('LoadingBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className={`flex flex-col items-center justify-center p-8 text-center ${this.props.className || ''}`}>
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Erro ao carregar componente
          </h3>
          <p className="text-gray-600 mb-4">
            {this.props.errorMessage || 'Ocorreu um erro inesperado. Tente recarregar a página.'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: undefined })}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Componente de Loading padrão
function DefaultLoadingFallback({ message, showProgress }: { message?: string; showProgress?: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="relative">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        {showProgress && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
          </div>
        )}
      </div>
      <p className="mt-4 text-gray-600">
        {typeof message === 'string' ? message : 'Carregando...'}
      </p>
    </div>
  );
}

// Componente principal LoadingBoundary
export function LoadingBoundary({
  children,
  fallback,
  errorMessage,
  showProgress = false,
  className
}: LoadingBoundaryProps) {
  const loadingFallback = React.useMemo(() => {
    if (React.isValidElement(fallback)) {
      return fallback;
    }
    
    return (
      <DefaultLoadingFallback 
        message={typeof fallback === 'string' ? fallback : undefined}
        showProgress={showProgress}
      />
    );
  }, [fallback, showProgress]);

  return (
    <ErrorBoundary errorMessage={errorMessage} className={className}>
      <Suspense fallback={loadingFallback}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
}

// Hook para lazy loading com retry
export function useLazyComponent<T extends React.ComponentType<Record<string, unknown>>>(
  importFn: () => Promise<{ default: T }>,
  retryCount: number = 3
) {
  const [retries, setRetries] = React.useState(0);
  
  const LazyComponent = React.useMemo(() => {
    return React.lazy(async () => {
      try {
        return await importFn();
      } catch (error) {
        if (retries < retryCount) {
          setRetries(prev => prev + 1);
          // Aguardar um pouco antes de tentar novamente
          await new Promise(resolve => setTimeout(resolve, 1000 * (retries + 1)));
          return await importFn();
        }
        throw error;
      }
    });
  }, [importFn, retries, retryCount]);
  
  return LazyComponent;
}

// Componente de Skeleton Loading genérico
export function SkeletonLoader({ 
  lines = 3, 
  showAvatar = false, 
  showButton = false,
  className = ''
}: {
  lines?: number;
  showAvatar?: boolean;
  showButton?: boolean;
  className?: string;
}) {
  return (
    <div className={`animate-pulse ${className}`}>
      {showAvatar && (
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/6"></div>
          </div>
        </div>
      )}
      
      <div className="space-y-3">
        {Array.from({ length: lines }).map((_, index) => (
          <div key={index} className="space-y-2">
            <div className="h-4 bg-gray-200 rounded"></div>
            {index === lines - 1 && (
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            )}
          </div>
        ))}
      </div>
      
      {showButton && (
        <div className="mt-6">
          <div className="h-10 bg-gray-200 rounded w-32"></div>
        </div>
      )}
    </div>
  );
}

// Skeleton específico para cards financeiros
export function FinancialCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-6 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="h-5 bg-gray-200 rounded w-1/3"></div>
        <div className="w-8 h-8 bg-gray-200 rounded"></div>
      </div>
      <div className="h-8 bg-gray-200 rounded w-2/3 mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
    </div>
  );
}

// Skeleton para gráficos
export function ChartSkeleton({ height = 300 }: { height?: number }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-6 animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-1/4 mb-6"></div>
      <div 
        className="bg-gray-200 rounded"
        style={{ height: `${height}px` }}
      >
        <div className="flex items-end justify-between h-full p-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="bg-gray-300 rounded-t"
              style={{
                height: `${Math.random() * 80 + 20}%`,
                width: '10%'
              }}
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Skeleton para tabelas
export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden animate-pulse">
      {/* Header */}
      <div className="bg-gray-50 px-6 py-3 border-b">
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, index) => (
            <div key={index} className="h-4 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="px-6 py-4 border-b border-gray-100">
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
            {Array.from({ length: columns }).map((_, colIndex) => (
              <div key={colIndex} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}