import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type EquipmentType = 'modules' | 'inverters';

interface UseEquipmentWithRetryReturn {
  data: any[];
  isLoading: boolean;
  error: Error | null;
  reload: () => void;
}

export function useEquipmentWithRetry(type: EquipmentType): UseEquipmentWithRetryReturn {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  const loadData = useCallback(async (retryCount = 0) => {
    try {
      console.log(`🔄 Carregando ${type}, tentativa ${retryCount + 1}`);
      setIsLoading(true);
      setError(null);
      
      const tableName = type === 'modules' ? 'solar_modules' : 'inverters';
      const { data: result, error: queryError } = await supabase
        .from(tableName)
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });
      
      if (queryError) {
        console.error(`❌ Erro na query ${type}:`, queryError);
        throw queryError;
      }
      
      console.log(`✅ ${type} carregados: ${result?.length || 0} itens`);
      setData(result || []);
      setError(null);
      
      // Salvar no cache local para fallback
      try {
        localStorage.setItem(`${type}_cache`, JSON.stringify(result || []));
        console.log(`💾 ${type} salvos no cache local`);
      } catch (cacheError) {
        console.warn(`⚠️ Erro ao salvar cache de ${type}:`, cacheError);
      }
      
    } catch (err) {
      console.error(`❌ Erro ao carregar ${type}:`, err);
      
      // Retry automático até 2 tentativas
      if (retryCount < 2) {
        console.log(`🔄 Tentando novamente em 2s... (tentativa ${retryCount + 2}/3)`);
        setTimeout(() => loadData(retryCount + 1), 2000);
        return;
      }
      
      // Fallback: tentar carregar do cache local
      try {
        const cachedData = localStorage.getItem(`${type}_cache`);
        if (cachedData) {
          const parsed = JSON.parse(cachedData);
          console.log(`📦 Carregando ${type} do cache local: ${parsed.length} itens`);
          setData(parsed);
          
          toast({
            title: 'Modo Offline',
            description: `Exibindo ${type === 'modules' ? 'módulos' : 'inversores'} em cache. Alguns dados podem estar desatualizados.`,
            variant: 'default'
          });
        } else {
          console.log(`📭 Nenhum ${type} em cache, exibindo lista vazia`);
          setData([]);
        }
      } catch (cacheError) {
        console.error(`❌ Erro ao carregar cache de ${type}:`, cacheError);
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