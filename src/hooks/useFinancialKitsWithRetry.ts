import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logInfo, logError, logWarn } from '@/utils/secureLogger';

interface FinancialKit {
  id: string;
  nome: string;
  potencia: number;
  preco: number;
  preco_wp: number;
  fabricante?: string;
  categoria?: string;
  descricao?: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

interface UseFinancialKitsWithRetryReturn {
  kits: FinancialKit[];
  isLoading: boolean;
  error: Error | null;
  reload: () => void;
  createKit: (kit: Omit<FinancialKit, 'id' | 'created_at' | 'updated_at'>) => Promise<FinancialKit | null>;
  updateKit: (id: string, updates: Partial<FinancialKit>) => Promise<boolean>;
  deleteKit: (id: string) => Promise<boolean>;
}

export function useFinancialKitsWithRetry(): UseFinancialKitsWithRetryReturn {
  const [kits, setKits] = useState<FinancialKit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  const loadKits = useCallback(async (retryCount = 0) => {
    try {
      logInfo('Carregando kits financeiros', {
        service: 'useFinancialKitsWithRetry',
        tentativa: retryCount + 1
      });
      setIsLoading(true);
      setError(null);
      
      const { data: result, error: queryError } = await supabase
        .from('financial_kits')
        .select('*')
        .eq('ativo', true)
        .order('potencia', { ascending: true });
      
      if (queryError) {
        logError('Erro na query financial_kits', {
          error: queryError.message,
          service: 'useFinancialKitsWithRetry',
          code: queryError.code
        });
        throw queryError;
      }
      
      logInfo('Kits financeiros carregados com sucesso', {
        service: 'useFinancialKitsWithRetry',
        quantidade: result?.length || 0
      });
      setKits(result || []);
      setError(null);
      
      // Salvar no cache local para fallback
      try {
        localStorage.setItem('financial_kits_cache', JSON.stringify(result || []));
        logInfo('Kits financeiros salvos no cache local', {
          service: 'useFinancialKitsWithRetry'
        });
      } catch (cacheError) {
        logWarn('Erro ao salvar cache de kits financeiros', {
          error: cacheError instanceof Error ? cacheError.message : 'Erro desconhecido',
          service: 'useFinancialKitsWithRetry'
        });
      }
      
    } catch (err) {
      logError('Erro ao carregar kits financeiros', {
        error: err instanceof Error ? err.message : 'Erro desconhecido',
        service: 'useFinancialKitsWithRetry',
        tentativa: retryCount + 1
      });
      
      // Retry automático até 2 tentativas
      if (retryCount < 2) {
        logInfo('Tentando novamente carregar kits financeiros', {
          service: 'useFinancialKitsWithRetry',
          proximaTentativa: retryCount + 2,
          totalTentativas: 3
        });
        setTimeout(() => loadKits(retryCount + 1), 2000);
        return;
      }
      
      // Fallback: tentar carregar do cache local
      try {
        const cachedData = localStorage.getItem('financial_kits_cache');
        if (cachedData) {
          const parsed = JSON.parse(cachedData);
          logInfo('Carregando kits financeiros do cache local', {
            service: 'useFinancialKitsWithRetry',
            quantidade: parsed.length
          });
          setKits(parsed);
          
          toast({
            title: 'Modo Offline',
            description: 'Exibindo kits financeiros em cache. Alguns dados podem estar desatualizados.',
            variant: 'default'
          });
        } else {
          logInfo('Nenhum kit financeiro em cache, exibindo lista vazia', {
            service: 'useFinancialKitsWithRetry'
          });
          setKits([]);
        }
      } catch (cacheError) {
        logError('Erro ao carregar cache de kits financeiros', {
          error: cacheError instanceof Error ? cacheError.message : 'Erro desconhecido',
          service: 'useFinancialKitsWithRetry'
        });
        setKits([]);
      }
      
      setError(err as Error);
      toast({
        title: 'Erro de Conexão',
        description: 'Não foi possível carregar kits financeiros. Verifique sua conexão.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const createKit = useCallback(async (kitData: Omit<FinancialKit, 'id' | 'created_at' | 'updated_at'>): Promise<FinancialKit | null> => {
    try {
      const { data, error } = await supabase
        .from('financial_kits')
        .insert(kitData)
        .select()
        .single();
      
      if (error) throw error;
      
      setKits(prev => [...prev, data]);
      toast({
        title: 'Sucesso',
        description: 'Kit financeiro criado com sucesso',
        variant: 'default'
      });
      
      return data;
    } catch (error) {
      logError('Erro ao criar kit financeiro', {
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        service: 'useFinancialKitsWithRetry'
      });
      toast({
        title: 'Erro',
        description: 'Não foi possível criar o kit financeiro',
        variant: 'destructive'
      });
      return null;
    }
  }, [toast]);

  const updateKit = useCallback(async (id: string, updates: Partial<FinancialKit>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('financial_kits')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
      
      setKits(prev => prev.map(kit => kit.id === id ? { ...kit, ...updates } : kit));
      toast({
        title: 'Sucesso',
        description: 'Kit financeiro atualizado com sucesso',
        variant: 'default'
      });
      
      return true;
    } catch (error) {
      logError('Erro ao atualizar kit financeiro', {
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        service: 'useFinancialKitsWithRetry',
        kitId: id
      });
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o kit financeiro',
        variant: 'destructive'
      });
      return false;
    }
  }, [toast]);

  const deleteKit = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('financial_kits')
        .update({ ativo: false })
        .eq('id', id);
      
      if (error) throw error;
      
      setKits(prev => prev.filter(kit => kit.id !== id));
      toast({
        title: 'Sucesso',
        description: 'Kit financeiro removido com sucesso',
        variant: 'default'
      });
      
      return true;
    } catch (error) {
      logError('Erro ao remover kit financeiro', {
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        service: 'useFinancialKitsWithRetry',
        kitId: id
      });
      toast({
        title: 'Erro',
        description: 'Não foi possível remover o kit financeiro',
        variant: 'destructive'
      });
      return false;
    }
  }, [toast]);

  const reload = useCallback(() => {
    loadKits(0);
  }, [loadKits]);

  useEffect(() => {
    loadKits();
  }, [loadKits]);

  return { kits, isLoading, error, reload, createKit, updateKit, deleteKit };
}

export default useFinancialKitsWithRetry;