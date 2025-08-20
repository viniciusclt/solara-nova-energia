import { useState, useCallback, useRef, useEffect } from 'react';
import { useToast } from './use-toast';

// =====================================================
// HOOK PARA GERENCIAR MICRO-INTERAÇÕES E FEEDBACK
// =====================================================

interface InteractionState {
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  message?: string;
}

interface UseInteractionsOptions {
  successMessage?: string;
  errorMessage?: string;
  autoReset?: boolean;
  resetDelay?: number;
}

export const useInteractions = (options: UseInteractionsOptions = {}) => {
  const {
    successMessage = 'Operação realizada com sucesso!',
    errorMessage = 'Ocorreu um erro. Tente novamente.',
    autoReset = true,
    resetDelay = 3000
  } = options;

  const { toast } = useToast();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const [state, setState] = useState<InteractionState>({
    isLoading: false,
    isSuccess: false,
    isError: false
  });

  const reset = useCallback(() => {
    setState({
      isLoading: false,
      isSuccess: false,
      isError: false,
      message: undefined
    });
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, isLoading: loading }));
  }, []);

  const setSuccess = useCallback((message?: string) => {
    setState({
      isLoading: false,
      isSuccess: true,
      isError: false,
      message: message || successMessage
    });

    toast({
      title: 'Sucesso',
      description: message || successMessage,
      variant: 'default'
    });

    if (autoReset) {
      timeoutRef.current = setTimeout(reset, resetDelay);
    }
  }, [successMessage, autoReset, resetDelay, reset, toast]);

  const setError = useCallback((message?: string) => {
    setState({
      isLoading: false,
      isSuccess: false,
      isError: true,
      message: message || errorMessage
    });

    toast({
      title: 'Erro',
      description: message || errorMessage,
      variant: 'destructive'
    });

    if (autoReset) {
      timeoutRef.current = setTimeout(reset, resetDelay);
    }
  }, [errorMessage, autoReset, resetDelay, reset, toast]);

  const executeAsync = useCallback(async <T>(
    asyncFunction: () => Promise<T>,
    options?: {
      successMessage?: string;
      errorMessage?: string;
      onSuccess?: (result: T) => void;
      onError?: (error: Error) => void;
    }
  ): Promise<T | null> => {
    try {
      setLoading(true);
      const result = await asyncFunction();
      setSuccess(options?.successMessage);
      options?.onSuccess?.(result);
      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
      setError(options?.errorMessage || errorMsg);
      options?.onError?.(error as Error);
      return null;
    }
  }, [setLoading, setSuccess, setError]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    ...state,
    setLoading,
    setSuccess,
    setError,
    reset,
    executeAsync
  };
};

// Hook para gerenciar hover states
export const useHover = () => {
  const [isHovered, setIsHovered] = useState(false);

  const hoverProps = {
    onMouseEnter: () => setIsHovered(true),
    onMouseLeave: () => setIsHovered(false)
  };

  return { isHovered, hoverProps };
};

// Hook para gerenciar focus states
export const useFocus = () => {
  const [isFocused, setIsFocused] = useState(false);

  const focusProps = {
    onFocus: () => setIsFocused(true),
    onBlur: () => setIsFocused(false)
  };

  return { isFocused, focusProps };
};

// Hook para debounce de interações
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Hook para throttle de interações
export const useThrottle = <T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number
): T => {
  const lastRun = useRef(Date.now());

  return useCallback(
    ((...args) => {
      if (Date.now() - lastRun.current >= delay) {
        callback(...args);
        lastRun.current = Date.now();
      }
    }) as T,
    [callback, delay]
  );
};

// Hook para gerenciar estados de formulário com feedback
export const useFormInteractions = () => {
  const [fieldStates, setFieldStates] = useState<Record<string, {
    isValid: boolean;
    isTouched: boolean;
    error?: string;
  }>>({});

  const setFieldState = useCallback((fieldName: string, state: {
    isValid?: boolean;
    isTouched?: boolean;
    error?: string;
  }) => {
    setFieldStates(prev => ({
      ...prev,
      [fieldName]: { ...prev[fieldName], ...state }
    }));
  }, []);

  const validateField = useCallback((fieldName: string, value: unknown, validator: (value: unknown) => string | null) => {
    const error = validator(value);
    const isValid = !error;
    
    setFieldState(fieldName, {
      isValid,
      isTouched: true,
      error: error || undefined
    });

    return isValid;
  }, [setFieldState]);

  const resetField = useCallback((fieldName: string) => {
    setFieldStates(prev => {
      const newState = { ...prev };
      delete newState[fieldName];
      return newState;
    });
  }, []);

  const resetAllFields = useCallback(() => {
    setFieldStates({});
  }, []);

  const getFieldProps = useCallback((fieldName: string) => {
    const fieldState = fieldStates[fieldName];
    return {
      error: fieldState?.isTouched && !fieldState?.isValid,
      success: fieldState?.isTouched && fieldState?.isValid,
      errorMessage: fieldState?.error
    };
  }, [fieldStates]);

  return {
    fieldStates,
    setFieldState,
    validateField,
    resetField,
    resetAllFields,
    getFieldProps
  };
};

// Hook para animações de lista
export const useListAnimations = () => {
  const [animatingItems, setAnimatingItems] = useState<Set<string>>(new Set());

  const addItem = useCallback((id: string) => {
    setAnimatingItems(prev => new Set([...prev, id]));
    
    // Remove da lista de animação após um tempo
    setTimeout(() => {
      setAnimatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }, 500);
  }, []);

  const removeItem = useCallback((id: string) => {
    setAnimatingItems(prev => new Set([...prev, `removing-${id}`]));
    
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        setAnimatingItems(prev => {
          const newSet = new Set(prev);
          newSet.delete(`removing-${id}`);
          return newSet;
        });
        resolve();
      }, 300);
    });
  }, []);

  const isAnimating = useCallback((id: string) => {
    return animatingItems.has(id) || animatingItems.has(`removing-${id}`);
  }, [animatingItems]);

  const isRemoving = useCallback((id: string) => {
    return animatingItems.has(`removing-${id}`);
  }, [animatingItems]);

  return {
    addItem,
    removeItem,
    isAnimating,
    isRemoving
  };
};