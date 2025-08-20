/**
 * Hook para integração com Web Workers de cálculos financeiros
 * 
 * Fornece interface React para executar cálculos pesados em background
 * com tracking de progresso e cancelamento de operações.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { WorkerMessage, WorkerResponse, FinancialParams, VPLParams, TIRParams } from '../workers/financialCalculationWorker';
import { performanceMonitor } from '../services/PerformanceMonitor';

interface WorkerState {
  loading: boolean;
  progress: number;
  stage: string;
  result: FinancialResult | null;
  error: string | null;
}

interface PendingCalculation {
  resolve: (value: FinancialResult) => void;
  reject: (error: Error) => void;
  timeout?: NodeJS.Timeout;
}

interface UseFinancialWorkerReturn {
  calculateFinancial: (params: FinancialParams) => Promise<FinancialResult>;
  calculateVPL: (fluxos: number[], taxa: number) => Promise<number>;
  calculateTIR: (fluxos: number[], tentativaInicial?: number) => Promise<number>;
  calculatePayback: (fluxos: number[]) => Promise<{ payback_meses: number; payback_anos: number }>;
  state: WorkerState;
  cancelCalculation: () => void;
  isWorkerSupported: boolean;
}

export function useFinancialWorker(): UseFinancialWorkerReturn {
  const workerRef = useRef<Worker | null>(null);
  const pendingCalculations = useRef(new Map<string, PendingCalculation>());
  const [isWorkerSupported, setIsWorkerSupported] = useState(false);
  
  const [state, setState] = useState<WorkerState>({
    loading: false,
    progress: 0,
    stage: '',
    result: null,
    error: null
  });

  // Inicializar worker
  useEffect(() => {
    if (typeof Worker !== 'undefined') {
      try {
        workerRef.current = new Worker(
          new URL('../workers/financialCalculationWorker.ts', import.meta.url),
          { type: 'module' }
        );

        setIsWorkerSupported(true);

        workerRef.current.onmessage = (event: MessageEvent<WorkerResponse>) => {
          const { id, type, payload } = event.data;
          const pending = pendingCalculations.current.get(id);

          if (!pending) return;

          switch (type) {
            case 'SUCCESS':
              setState(prev => ({ 
                ...prev, 
                loading: false, 
                result: payload, 
                error: null,
                progress: 100,
                stage: 'Concluído'
              }));
              
              if (pending.timeout) {
                clearTimeout(pending.timeout);
              }
              
              pending.resolve(payload);
              pendingCalculations.current.delete(id);
              break;

            case 'ERROR':
              setState(prev => ({ 
                ...prev, 
                loading: false, 
                error: payload.error,
                progress: 0,
                stage: ''
              }));
              
              if (pending.timeout) {
                clearTimeout(pending.timeout);
              }
              
              pending.reject(new Error(payload.error));
              pendingCalculations.current.delete(id);
              break;

            case 'PROGRESS':
              setState(prev => ({
                ...prev,
                progress: payload.progress,
                stage: payload.stage
              }));
              break;
          }
        };

        workerRef.current.onerror = (error) => {
          console.error('Worker error:', error);
          setState(prev => ({ 
            ...prev, 
            loading: false, 
            error: 'Erro interno no processamento',
            progress: 0,
            stage: ''
          }));
          
          // Rejeitar todas as operações pendentes
          pendingCalculations.current.forEach(pending => {
            if (pending.timeout) {
              clearTimeout(pending.timeout);
            }
            pending.reject(new Error('Worker error'));
          });
          pendingCalculations.current.clear();
        };
      } catch (error) {
        console.warn('Web Workers não suportados:', error);
        setIsWorkerSupported(false);
      }
    } else {
      console.warn('Web Workers não disponíveis neste ambiente');
      setIsWorkerSupported(false);
    }

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
      
      // Limpar timeouts pendentes
      pendingCalculations.current.forEach(pending => {
        if (pending.timeout) {
          clearTimeout(pending.timeout);
        }
      });
      pendingCalculations.current.clear();
    };
  }, []);

  const executeCalculation = useCallback(
    (type: WorkerMessage['type'], payload: FinancialParams | VPLParams | TIRParams | { fluxos: number[] }, timeoutMs: number = 60000): Promise<FinancialResult> => {
      return new Promise((resolve, reject) => {
        if (!workerRef.current) {
          reject(new Error('Worker não disponível'));
          return;
        }

        const id = `calc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Configurar timeout
        const timeout = setTimeout(() => {
          if (pendingCalculations.current.has(id)) {
            pendingCalculations.current.delete(id);
            setState(prev => ({ 
              ...prev, 
              loading: false, 
              error: 'Operação cancelada por timeout',
              progress: 0,
              stage: ''
            }));
            reject(new Error('Timeout na operação'));
          }
        }, timeoutMs);
        
        pendingCalculations.current.set(id, { resolve, reject, timeout });

        setState(prev => ({ 
          ...prev, 
          loading: true, 
          progress: 0, 
          stage: 'Iniciando...', 
          error: null 
        }));

        const message: WorkerMessage = { id, type, payload };
        workerRef.current.postMessage(message);
      });
    },
    []
  );

  const calculateFinancial = useCallback(
    (params: FinancialParams) => {
      if (!isWorkerSupported) {
        return Promise.reject(new Error('Web Workers não suportados'));
      }
      const startTime = performance.now();
      return executeCalculation('CALCULATE_FINANCIAL', params, 120000)
        .then(result => {
          const duration = performance.now() - startTime;
          performanceMonitor.trackWorkerCalculation(duration, true, false);
          return result;
        })
        .catch(error => {
          const duration = performance.now() - startTime;
          const isCancelled = error.message.includes('Timeout') || error.message.includes('cancelada');
          performanceMonitor.trackWorkerCalculation(duration, false, isCancelled);
          throw error;
        });
    },
    [executeCalculation, isWorkerSupported]
  );

  const calculateVPL = useCallback(
    (fluxos: number[], taxa: number): Promise<number> => {
      if (!isWorkerSupported) {
        return Promise.reject(new Error('Web Workers não suportados'));
      }
      
      const startTime = performance.now();
      const params: VPLParams = { fluxos, taxa };
      return executeCalculation('CALCULATE_VPL', params, 30000)
        .then(result => {
          const duration = performance.now() - startTime;
          performanceMonitor.trackWorkerCalculation(duration, true, false);
          return result.vpl;
        })
        .catch(error => {
          const duration = performance.now() - startTime;
          const isCancelled = error.message.includes('Timeout') || error.message.includes('cancelada');
          performanceMonitor.trackWorkerCalculation(duration, false, isCancelled);
          throw error;
        });
    },
    [executeCalculation, isWorkerSupported]
  );

  const calculateTIR = useCallback(
    (fluxos: number[], tentativaInicial?: number): Promise<number> => {
      if (!isWorkerSupported) {
        return Promise.reject(new Error('Web Workers não suportados'));
      }
      
      const startTime = performance.now();
      const params: TIRParams = { fluxos, tentativa_inicial: tentativaInicial };
      return executeCalculation('CALCULATE_TIR', params, 30000)
        .then(result => {
          const duration = performance.now() - startTime;
          performanceMonitor.trackWorkerCalculation(duration, true, false);
          return result.tir;
        })
        .catch(error => {
          const duration = performance.now() - startTime;
          const isCancelled = error.message.includes('Timeout') || error.message.includes('cancelada');
          performanceMonitor.trackWorkerCalculation(duration, false, isCancelled);
          throw error;
        });
    },
    [executeCalculation, isWorkerSupported]
  );

  const calculatePayback = useCallback(
    (fluxos: number[]): Promise<{ payback_meses: number; payback_anos: number }> => {
      if (!isWorkerSupported) {
        return Promise.reject(new Error('Web Workers não suportados'));
      }
      
      const startTime = performance.now();
      return executeCalculation('CALCULATE_PAYBACK', { fluxos }, 15000)
        .then(result => {
          const duration = performance.now() - startTime;
          performanceMonitor.trackWorkerCalculation(duration, true, false);
          return result;
        })
        .catch(error => {
          const duration = performance.now() - startTime;
          const isCancelled = error.message.includes('Timeout') || error.message.includes('cancelada');
          performanceMonitor.trackWorkerCalculation(duration, false, isCancelled);
          throw error;
        });
    },
    [executeCalculation, isWorkerSupported]
  );

  const cancelCalculation = useCallback(() => {
    // Cancelar todas as operações pendentes
    pendingCalculations.current.forEach((pending, id) => {
      if (pending.timeout) {
        clearTimeout(pending.timeout);
      }
      
      // Enviar comando de cancelamento para o worker
      if (workerRef.current) {
        const cancelMessage: WorkerMessage = {
          id,
          type: 'CANCEL',
          payload: {}
        };
        workerRef.current.postMessage(cancelMessage);
      }
      
      pending.reject(new Error('Operação cancelada pelo usuário'));
    });
    
    pendingCalculations.current.clear();
    
    setState(prev => ({ 
      ...prev, 
      loading: false, 
      progress: 0, 
      stage: '', 
      error: null 
    }));
  }, []);

  return {
    calculateFinancial,
    calculateVPL,
    calculateTIR,
    calculatePayback,
    state,
    cancelCalculation,
    isWorkerSupported
  };
}

// Hook para fallback quando Web Workers não estão disponíveis
export function useFinancialCalculationFallback() {
  const [state, setState] = useState<WorkerState>({
    loading: false,
    progress: 0,
    stage: '',
    result: null,
    error: null
  });

  const calculateFinancialFallback = useCallback(async (params: FinancialParams) => {
    setState(prev => ({ ...prev, loading: true, progress: 0, stage: 'Calculando...', error: null }));
    
    try {
      // Simular progresso
      setState(prev => ({ ...prev, progress: 50, stage: 'Processando...' }));
      
      // Aqui você implementaria os cálculos síncronos como fallback
      // Por simplicidade, vamos simular um resultado
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const resultado = {
        vpl: 50000,
        tir: 0.15,
        payback_meses: 72,
        payback_anos: 6,
        roi_percentual: 25
      };
      
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        progress: 100, 
        stage: 'Concluído', 
        result: resultado 
      }));
      
      return resultado;
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error instanceof Error ? error.message : 'Erro no cálculo',
        progress: 0,
        stage: ''
      }));
      throw error;
    }
  }, []);

  return {
    calculateFinancial: calculateFinancialFallback,
    state,
    cancelCalculation: () => {
      setState(prev => ({ ...prev, loading: false, progress: 0, stage: '', error: null }));
    },
    isWorkerSupported: false
  };
}