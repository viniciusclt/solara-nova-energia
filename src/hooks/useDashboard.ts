import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { DashboardService } from '@/services/DashboardService';
import { 
  DashboardData, 
  DashboardFilters, 
  DashboardError, 
  LoadingState, 
  RefreshState,
  UseDashboardReturn
} from '@/types/dashboard';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook principal para gerenciar dados do dashboard
 */
export function useDashboard(filters?: DashboardFilters): UseDashboardReturn {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [refreshState, setRefreshState] = useState<RefreshState>('idle');
  const [error, setError] = useState<DashboardError | null>(null);

  // Query para buscar dados do dashboard
  const {
    data: dashboardData,
    isLoading,
    isError,
    error: queryError,
    refetch
  } = useQuery({
    queryKey: ['dashboard', user?.id, filters],
    queryFn: () => {
      if (!user?.id) {
        throw new Error('Usuário não autenticado');
      }
      return DashboardService.getDashboardData(user.id, filters);
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutos
    cacheTime: 10 * 60 * 1000, // 10 minutos
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    onError: (err) => {
      setError({
        code: 'FETCH_ERROR',
        message: err instanceof Error ? err.message : 'Erro ao carregar dashboard',
        timestamp: new Date().toISOString(),
        context: { filters }
      });
    }
  });

  // Estado de carregamento
  const loadingState: LoadingState = useMemo(() => {
    if (isLoading) return 'loading';
    if (isError) return 'error';
    if (dashboardData) return 'success';
    return 'idle';
  }, [isLoading, isError, dashboardData]);

  // Função para atualizar dados
  const refresh = useCallback(async () => {
    try {
      setRefreshState('refreshing');
      setError(null);
      await refetch();
      setRefreshState('success');
      
      // Reset refresh state após 2 segundos
      setTimeout(() => setRefreshState('idle'), 2000);
    } catch (err) {
      setRefreshState('error');
      setError({
        code: 'REFRESH_ERROR',
        message: err instanceof Error ? err.message : 'Erro ao atualizar dashboard',
        timestamp: new Date().toISOString(),
        context: { action: 'refresh' }
      });
    }
  }, [refetch]);

  // Função para invalidar cache
  const invalidateCache = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  }, [queryClient]);

  // Função para exportar dados
  const exportData = useCallback(async (format: 'json' | 'csv' = 'json') => {
    if (!user?.id) {
      throw new Error('Usuário não autenticado');
    }

    try {
      const blob = await DashboardService.exportDashboard(user.id, { format });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `dashboard-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError({
        code: 'EXPORT_ERROR',
        message: err instanceof Error ? err.message : 'Erro ao exportar dados',
        timestamp: new Date().toISOString(),
        context: { format }
      });
      throw err;
    }
  }, [user?.id]);

  // Subscrição para atualizações em tempo real
  useEffect(() => {
    if (!user?.id) return;

    const unsubscribe = DashboardService.subscribeToUpdates(user.id, () => {
      // Invalidar cache quando houver atualizações
      invalidateCache();
    });

    return unsubscribe;
  }, [user?.id, invalidateCache]);

  // Limpar erro após um tempo
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 10000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  return {
    data: dashboardData || null,
    loading: loadingState,
    error: error || (queryError ? {
      code: 'QUERY_ERROR',
      message: queryError instanceof Error ? queryError.message : 'Erro na consulta',
      timestamp: new Date().toISOString()
    } : null),
    refreshState,
    refresh,
    invalidateCache,
    exportData
  };
}

/**
 * Hook para gerenciar métricas específicas
 */
export function useMetrics(filters?: DashboardFilters) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['dashboard-metrics', user?.id, filters],
    queryFn: () => {
      if (!user?.id) {
        throw new Error('Usuário não autenticado');
      }
      return DashboardService.getMetrics(user.id, filters);
    },
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000, // 2 minutos
    cacheTime: 5 * 60 * 1000, // 5 minutos
  });
}

/**
 * Hook para gerenciar dados de gráficos
 */
export function useCharts() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['dashboard-charts', user?.id],
    queryFn: () => {
      if (!user?.id) {
        throw new Error('Usuário não autenticado');
      }
      return DashboardService.getChartData(user.id);
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutos
    cacheTime: 10 * 60 * 1000, // 10 minutos
  });
}

/**
 * Hook para gerenciar atividades recentes
 */
export function useRecentActivity(limit: number = 10) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['dashboard-activity', user?.id, limit],
    queryFn: () => {
      if (!user?.id) {
        throw new Error('Usuário não autenticado');
      }
      return DashboardService.getRecentActivity(user.id, limit);
    },
    enabled: !!user?.id,
    staleTime: 1 * 60 * 1000, // 1 minuto
    cacheTime: 3 * 60 * 1000, // 3 minutos
    refetchInterval: 30000, // Atualizar a cada 30 segundos
  });
}

/**
 * Hook para gerenciar estatísticas rápidas
 */
export function useQuickStats() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['dashboard-quick-stats', user?.id],
    queryFn: () => {
      if (!user?.id) {
        throw new Error('Usuário não autenticado');
      }
      return DashboardService.getQuickStats(user.id);
    },
    enabled: !!user?.id,
    staleTime: 1 * 60 * 1000, // 1 minuto
    cacheTime: 3 * 60 * 1000, // 3 minutos
    refetchInterval: 60000, // Atualizar a cada minuto
  });
}

/**
 * Hook para gerenciar KPIs e metas
 */
export function useKPITargets() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['dashboard-kpi-targets', user?.id],
    queryFn: () => {
      if (!user?.id) {
        throw new Error('Usuário não autenticado');
      }
      return DashboardService.getKPITargets(user.id);
    },
    enabled: !!user?.id,
    staleTime: 10 * 60 * 1000, // 10 minutos
    cacheTime: 30 * 60 * 1000, // 30 minutos
  });
}

/**
 * Hook para gerenciar membros da equipe
 */
export function useTeamMembers() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['dashboard-team-members', user?.id],
    queryFn: () => {
      if (!user?.id) {
        throw new Error('Usuário não autenticado');
      }
      return DashboardService.getTeamMembers(user.id);
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutos
    cacheTime: 15 * 60 * 1000, // 15 minutos
  });
}

/**
 * Hook para gerenciar filtros do dashboard
 */
export function useDashboardFilters() {
  const [filters, setFilters] = useState<DashboardFilters>({});
  
  const updateFilters = useCallback((newFilters: Partial<DashboardFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);
  
  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);
  
  const resetDateRange = useCallback(() => {
    setFilters(prev => ({ ...prev, dateRange: undefined }));
  }, []);
  
  return {
    filters,
    updateFilters,
    clearFilters,
    resetDateRange
  };
}

/**
 * Hook para gerenciar preferências do dashboard
 */
export function useDashboardPreferences() {
  const [preferences, setPreferences] = useState(() => {
    const saved = localStorage.getItem('dashboard-preferences');
    return saved ? JSON.parse(saved) : {
      theme: 'light',
      autoRefresh: true,
      refreshInterval: 60000,
      defaultView: 'overview',
      widgetLayout: 'grid'
    };
  });
  
  const updatePreferences = useCallback((newPreferences: Record<string, unknown>) => {
    setPreferences((prev: Record<string, unknown>) => {
      const updated = { ...prev, ...newPreferences };
      localStorage.setItem('dashboard-preferences', JSON.stringify(updated));
      return updated;
    });
  }, []);
  
  return {
    preferences,
    updatePreferences
  };
}

export default useDashboard;