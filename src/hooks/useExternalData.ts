import { useState, useEffect, useCallback } from 'react';
import { ExternalAPIService, WeatherData, EquipmentPrice } from '../services/ExternalAPIService';
import { logError } from '@/utils/secureLogger';

interface UseExternalDataState {
  weatherData: WeatherData | null;
  equipmentPrices: EquipmentPrice[];
  connectivity: {
    weather: boolean;
    equipment: boolean;
    aneel: boolean;
  };
  loading: {
    weather: boolean;
    equipment: boolean;
    connectivity: boolean;
  };
  errors: {
    weather: string | null;
    equipment: string | null;
    connectivity: string | null;
  };
}

interface UseExternalDataActions {
  fetchWeatherData: (latitude: number, longitude: number) => Promise<void>;
  fetchEquipmentPrices: (tipo: string, potencia?: number) => Promise<void>;
  checkConnectivity: () => Promise<void>;
  updateANEELTariffs: () => Promise<void>;
  clearCache: () => void;
  retry: (action: 'weather' | 'equipment' | 'connectivity') => Promise<void>;
}

export function useExternalData(): UseExternalDataState & UseExternalDataActions {
  const [state, setState] = useState<UseExternalDataState>({
    weatherData: null,
    equipmentPrices: [],
    connectivity: {
      weather: false,
      equipment: false,
      aneel: false
    },
    loading: {
      weather: false,
      equipment: false,
      connectivity: false
    },
    errors: {
      weather: null,
      equipment: null,
      connectivity: null
    }
  });

  const externalAPIService = ExternalAPIService.getInstance();

  const updateState = useCallback((updates: Partial<UseExternalDataState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const updateLoading = useCallback((key: keyof UseExternalDataState['loading'], value: boolean) => {
    setState(prev => ({
      ...prev,
      loading: { ...prev.loading, [key]: value }
    }));
  }, []);

  const updateError = useCallback((key: keyof UseExternalDataState['errors'], value: string | null) => {
    setState(prev => ({
      ...prev,
      errors: { ...prev.errors, [key]: value }
    }));
  }, []);

  const fetchWeatherData = useCallback(async (latitude: number, longitude: number) => {
    updateLoading('weather', true);
    updateError('weather', null);

    try {
      const weatherData = await externalAPIService.getWeatherData(latitude, longitude);
      updateState({ weatherData });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao buscar dados meteorológicos';
      updateError('weather', errorMessage);
      logError('Erro ao buscar dados meteorológicos', 'useExternalData', { error: error instanceof Error ? error.message : String(error) });
    } finally {
      updateLoading('weather', false);
    }
  }, [externalAPIService, updateState, updateLoading, updateError]);

  const fetchEquipmentPrices = useCallback(async (tipo: string, potencia?: number) => {
    updateLoading('equipment', true);
    updateError('equipment', null);

    try {
      const equipmentPrices = await externalAPIService.getEquipmentPrices(tipo, potencia);
      updateState({ equipmentPrices });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao buscar preços de equipamentos';
      updateError('equipment', errorMessage);
      logError('Erro ao buscar preços de equipamentos', 'useExternalData', { error: error instanceof Error ? error.message : String(error) });
    } finally {
      updateLoading('equipment', false);
    }
  }, [externalAPIService, updateState, updateLoading, updateError]);

  const checkConnectivity = useCallback(async () => {
    updateLoading('connectivity', true);
    updateError('connectivity', null);

    try {
      const connectivity = await externalAPIService.verificarConectividade();
      updateState({ connectivity });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao verificar conectividade';
      updateError('connectivity', errorMessage);
      logError('Erro ao verificar conectividade', 'useExternalData', { error: error instanceof Error ? error.message : String(error) });
    } finally {
      updateLoading('connectivity', false);
    }
  }, [externalAPIService, updateState, updateLoading, updateError]);

  const updateANEELTariffs = useCallback(async () => {
    try {
      await externalAPIService.atualizarTarifasANEEL();
      // Atualizar conectividade após sucesso
      await checkConnectivity();
    } catch (error) {
      logError('Erro ao atualizar tarifas ANEEL', 'useExternalData', { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }, [externalAPIService, checkConnectivity]);

  const clearCache = useCallback(() => {
    externalAPIService.limparCache();
    // Resetar estado para forçar nova busca
    updateState({
      weatherData: null,
      equipmentPrices: [],
      connectivity: {
        weather: false,
        equipment: false,
        aneel: false
      }
    });
  }, [externalAPIService, updateState]);

  const retry = useCallback(async (action: 'weather' | 'equipment' | 'connectivity') => {
    switch (action) {
      case 'weather':
        if (state.weatherData) {
          await fetchWeatherData(state.weatherData.latitude, state.weatherData.longitude);
        }
        break;
      case 'equipment':
        await fetchEquipmentPrices('modulo'); // Retry com módulos por padrão
        break;
      case 'connectivity':
        await checkConnectivity();
        break;
    }
  }, [state.weatherData, fetchWeatherData, fetchEquipmentPrices, checkConnectivity]);

  // Verificar conectividade na inicialização
  useEffect(() => {
    checkConnectivity();
  }, [checkConnectivity]);

  return {
    ...state,
    fetchWeatherData,
    fetchEquipmentPrices,
    checkConnectivity,
    updateANEELTariffs,
    clearCache,
    retry
  };
}

// Hook específico para dados meteorológicos
export function useWeatherData(latitude?: number, longitude?: number) {
  const { weatherData, loading, errors, fetchWeatherData } = useExternalData();

  useEffect(() => {
    if (latitude !== undefined && longitude !== undefined) {
      fetchWeatherData(latitude, longitude);
    }
  }, [latitude, longitude, fetchWeatherData]);

  return {
    weatherData,
    loading: loading.weather,
    error: errors.weather,
    refetch: () => {
      if (latitude !== undefined && longitude !== undefined) {
        fetchWeatherData(latitude, longitude);
      }
    }
  };
}

// Hook específico para preços de equipamentos
export function useEquipmentPrices(tipo: string, potencia?: number) {
  const { equipmentPrices, loading, errors, fetchEquipmentPrices } = useExternalData();

  useEffect(() => {
    fetchEquipmentPrices(tipo, potencia);
  }, [tipo, potencia, fetchEquipmentPrices]);

  return {
    equipmentPrices,
    loading: loading.equipment,
    error: errors.equipment,
    refetch: () => fetchEquipmentPrices(tipo, potencia)
  };
}

// Hook para monitoramento de conectividade
export function useConnectivityMonitor() {
  const { connectivity, loading, errors, checkConnectivity } = useExternalData();
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  const recheckConnectivity = useCallback(async () => {
    await checkConnectivity();
    setLastCheck(new Date());
  }, [checkConnectivity]);

  // Verificar conectividade a cada 5 minutos
  useEffect(() => {
    const interval = setInterval(recheckConnectivity, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [recheckConnectivity]);

  return {
    connectivity,
    loading: loading.connectivity,
    error: errors.connectivity,
    lastCheck,
    recheck: recheckConnectivity,
    isOnline: connectivity.weather || connectivity.equipment || connectivity.aneel
  };
}