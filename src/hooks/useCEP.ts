import { useState, useCallback } from 'react';
import { cepService, AddressData } from '@/services/cepService';
import { useToast } from '@/hooks/use-toast';

interface UseCEPReturn {
  searchCEP: (cep: string) => Promise<AddressData | null>;
  isLoading: boolean;
  error: string | null;
  lastSearchedCEP: string | null;
  clearError: () => void;
}

/**
 * Hook para busca de endereços por CEP
 * Fornece funcionalidades de busca, loading, error handling e cache básico
 */
export function useCEP(): UseCEPReturn {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSearchedCEP, setLastSearchedCEP] = useState<string | null>(null);

  const searchCEP = useCallback(async (cep: string): Promise<AddressData | null> => {
    // Limpar erro anterior
    setError(null);
    
    // Validar CEP básico
    if (!cep || cep.length < 8) {
      const errorMsg = 'CEP deve ter pelo menos 8 dígitos';
      setError(errorMsg);
      return null;
    }

    setIsLoading(true);
    setLastSearchedCEP(cep);

    try {
      const result = await cepService.searchByCEP(cep);
      
      if (!result) {
        const errorMsg = 'CEP não encontrado';
        setError(errorMsg);
        toast({
          title: "CEP não encontrado",
          description: "Verifique se o CEP está correto e tente novamente.",
          variant: "destructive"
        });
        return null;
      }

      // Verificar se o endereço está completo
      if (!cepService.isCompleteAddress(result)) {
        const errorMsg = 'Endereço incompleto encontrado';
        setError(errorMsg);
        toast({
          title: "Endereço incompleto",
          description: "O CEP foi encontrado, mas algumas informações estão faltando.",
          variant: "default"
        });
      } else {
        toast({
          title: "CEP encontrado",
          description: `Endereço preenchido automaticamente: ${result.city}, ${result.state}`,
          variant: "default"
        });
      }

      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erro ao buscar CEP';
      setError(errorMsg);
      
      toast({
        title: "Erro na busca",
        description: errorMsg,
        variant: "destructive"
      });
      
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    searchCEP,
    isLoading,
    error,
    lastSearchedCEP,
    clearError
  };
}

/**
 * Hook para busca automática de CEP com debounce
 * Útil para campos que fazem busca automática conforme o usuário digita
 */
export function useCEPAutoSearch(
  onAddressFound: (address: AddressData) => void,
  debounceMs: number = 500
) {
  const { searchCEP, isLoading, error } = useCEP();
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  const autoSearchCEP = useCallback((cep: string) => {
    // Limpar timeout anterior
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Validar se CEP tem 8 dígitos (completo)
    const cleanCEP = cep.replace(/\D/g, '');
    if (cleanCEP.length !== 8) {
      return;
    }

    // Configurar novo timeout
    const timeout = setTimeout(async () => {
      const result = await searchCEP(cep);
      if (result) {
        onAddressFound(result);
      }
    }, debounceMs);

    setSearchTimeout(timeout);
  }, [searchCEP, onAddressFound, debounceMs, searchTimeout]);

  // Cleanup do timeout
  const cleanup = useCallback(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
      setSearchTimeout(null);
    }
  }, [searchTimeout]);

  return {
    autoSearchCEP,
    isLoading,
    error,
    cleanup
  };
}