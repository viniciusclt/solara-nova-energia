import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logInfo, logError, logWarn } from '@/utils/secureLogger';

type EquipmentType = 'modules' | 'inverters';

interface UseEquipmentWithRetryReturn {
  data: Record<string, unknown>[];
  isLoading: boolean;
  error: Error | null;
  reload: () => void;
}

export function useEquipmentWithRetry(type: EquipmentType): UseEquipmentWithRetryReturn {
  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  const loadData = useCallback(async (retryCount = 0) => {
    try {
      logInfo(`Carregando ${type}`, {
        service: 'useEquipmentWithRetry',
        type: type,
        attempt: retryCount + 1
      });
      setIsLoading(true);
      setError(null);
      
      const tableName = type === 'modules' ? 'solar_modules' : 'inverters';
      const { data: result, error: queryError } = await supabase
        .from(tableName)
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });
      
      if (queryError) {
        logError(`Erro na query ${type}`, {
        service: 'useEquipmentWithRetry',
        type: type,
        error: queryError.message || 'Erro desconhecido'
      });
        throw queryError;
      }
      
      logInfo(`${type} carregados com sucesso`, {
        service: 'useEquipmentWithRetry',
        type: type,
        itemCount: result?.length || 0
      });
      setData(result || []);
      setError(null);
      
      // Salvar no cache local para fallback
      try {
        localStorage.setItem(`${type}_cache`, JSON.stringify(result || []));
        logInfo(`${type} salvos no cache local`, {
          service: 'useEquipmentWithRetry',
          type: type
        });
      } catch (cacheError) {
        logWarn(`Erro ao salvar cache de ${type}`, {
          service: 'useEquipmentWithRetry',
          type: type,
          error: (cacheError as Error).message || 'Erro desconhecido'
        });
      }
      
    } catch (err) {
      logError(`Erro ao carregar ${type}`, {
        service: 'useEquipmentWithRetry',
        type: type,
        error: (err as Error).message || 'Erro desconhecido',
        attempt: retryCount + 1
      });
      
      // Retry automático até 2 tentativas
      if (retryCount < 2) {
        logInfo(`Tentando novamente carregar ${type}`, {
          service: 'useEquipmentWithRetry',
          type: type,
          nextAttempt: retryCount + 2,
          maxAttempts: 3
        });
        setTimeout(() => loadData(retryCount + 1), 2000);
        return;
      }
      
      // Fallback: tentar carregar do cache local
      try {
        const cachedData = localStorage.getItem(`${type}_cache`);
        if (cachedData) {
          const parsed = JSON.parse(cachedData);
          logInfo(`Carregando ${type} do cache local`, {
            service: 'useEquipmentWithRetry',
            type: type,
            itemCount: parsed.length
          });
          setData(parsed);
          
          toast({
            title: 'Modo Offline',
            description: `Exibindo ${type === 'modules' ? 'módulos' : 'inversores'} em cache. Alguns dados podem estar desatualizados.`,
            variant: 'default'
          });
        } else {
          logInfo(`Nenhum ${type} em cache`, {
            service: 'useEquipmentWithRetry',
            type: type
          });
          setData([]);
        }
      } catch (cacheError) {
        logError(`Erro ao carregar cache de ${type}`, {
          service: 'useEquipmentWithRetry',
          type: type,
          error: (cacheError as Error).message || 'Erro desconhecido'
        });
        setData([]);
      }
      
      setError(err as Error);
      toast({
        title: 'Erro de Conexão',
        description: `Não foi possível carregar ${type === 'modules' ? 'módulos' : 'inversores'}. Verifique sua conexão.`,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [type, toast]);

  const reload = useCallback(() => {
    loadData(0);
  }, [loadData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return { data, isLoading, error, reload };
}

export default useEquipmentWithRetry;