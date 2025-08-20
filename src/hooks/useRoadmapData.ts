/**
 * Hook para gerenciar dados do roadmap
 * 
 * Fornece funcionalidades para buscar, filtrar e gerenciar
 * funcionalidades do roadmap com cache e otimizações
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { roadmapService } from '@/services/RoadmapService';
import { logError, logInfo } from '@/utils/secureLogger';
import type {
  RoadmapFeature,
  RoadmapFeatureWithDetails,
  RoadmapFilters,
  PaginatedResponse,
  RoadmapStats,
  FeatureCategory,
  FeatureStatus,
  FeaturePriority,
  CreateFeatureRequest,
  UpdateFeatureRequest
} from '@/types/roadmap';

export interface UseRoadmapDataOptions {
  autoFetch?: boolean;
  cacheTime?: number;
  refetchInterval?: number;
  initialFilters?: RoadmapFilters;
}

export interface UseRoadmapDataReturn {
  // Data
  features: RoadmapFeatureWithDetails[];
  stats: RoadmapStats | null;
  currentFeature: RoadmapFeatureWithDetails | null;
  
  // State
  isLoading: boolean;
  isLoadingStats: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  error: string | null;
  
  // Pagination
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
    currentPage: number;
    totalPages: number;
  };
  
  // Filters
  filters: RoadmapFilters;
  
  // Actions
  fetchFeatures: (filters?: RoadmapFilters) => Promise<void>;
  fetchFeatureById: (id: string) => Promise<void>;
  fetchStats: () => Promise<void>;
  createFeature: (request: CreateFeatureRequest) => Promise<RoadmapFeature | null>;
  updateFeature: (id: string, request: UpdateFeatureRequest) => Promise<RoadmapFeature | null>;
  deleteFeature: (id: string) => Promise<boolean>;
  
  // Filter actions
  setFilters: (filters: RoadmapFilters) => void;
  clearFilters: () => void;
  addFilter: (key: keyof RoadmapFilters, value: unknown) => void;
  removeFilter: (key: keyof RoadmapFilters) => void;
  
  // Pagination actions
  nextPage: () => void;
  prevPage: () => void;
  goToPage: (page: number) => void;
  setPageSize: (size: number) => void;
  
  // Utility actions
  refresh: () => Promise<void>;
  clearError: () => void;
  resetData: () => void;
}

const DEFAULT_FILTERS: RoadmapFilters = {
  limit: 20,
  offset: 0,
  sort_by: 'created_at',
  sort_order: 'desc'
};

const DEFAULT_OPTIONS: UseRoadmapDataOptions = {
  autoFetch: true,
  cacheTime: 5 * 60 * 1000, // 5 minutos
  refetchInterval: 0, // Sem refetch automático
  initialFilters: DEFAULT_FILTERS
};

export function useRoadmapData(options: UseRoadmapDataOptions = {}): UseRoadmapDataReturn {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // State
  const [features, setFeatures] = useState<RoadmapFeatureWithDetails[]>([]);
  const [stats, setStats] = useState<RoadmapStats | null>(null);
  const [currentFeature, setCurrentFeature] = useState<RoadmapFeatureWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFiltersState] = useState<RoadmapFilters>(opts.initialFilters || DEFAULT_FILTERS);
  const [paginationData, setPaginationData] = useState({
    total: 0,
    limit: opts.initialFilters?.limit || 20,
    offset: opts.initialFilters?.offset || 0,
    hasMore: false
  });
  
  // Cache
  const [lastFetch, setLastFetch] = useState<number>(0);
  
  // Computed pagination
  const pagination = useMemo(() => {
    const currentPage = Math.floor(paginationData.offset / paginationData.limit) + 1;
    const totalPages = Math.ceil(paginationData.total / paginationData.limit);
    
    return {
      ...paginationData,
      currentPage,
      totalPages
    };
  }, [paginationData]);
  
  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);
  
  // Fetch features
  const fetchFeatures = useCallback(async (newFilters?: RoadmapFilters) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const filtersToUse = newFilters || filters;
      
      logInfo('Buscando funcionalidades do roadmap', {
        hook: 'useRoadmapData',
        method: 'fetchFeatures',
        filters: filtersToUse
      });
      
      const response: PaginatedResponse<RoadmapFeatureWithDetails> = await roadmapService.getFeatures(filtersToUse);
      
      setFeatures(response.data);
      setPaginationData({
        total: response.total,
        limit: response.limit,
        offset: response.offset,
        hasMore: response.has_more
      });
      
      setLastFetch(Date.now());
      
      logInfo('Funcionalidades carregadas com sucesso', {
        hook: 'useRoadmapData',
        method: 'fetchFeatures',
        count: response.data.length,
        total: response.total
      });
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao buscar funcionalidades';
      setError(errorMessage);
      logError('Erro ao buscar funcionalidades', {
        hook: 'useRoadmapData',
        method: 'fetchFeatures',
        error: errorMessage
      });
    } finally {
      setIsLoading(false);
    }
  }, [filters]);
  
  // Fetch feature by ID
  const fetchFeatureById = useCallback(async (id: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      logInfo('Buscando funcionalidade por ID', {
        hook: 'useRoadmapData',
        method: 'fetchFeatureById',
        featureId: id
      });
      
      const feature = await roadmapService.getFeatureById(id);
      setCurrentFeature(feature);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao buscar funcionalidade';
      setError(errorMessage);
      logError('Erro ao buscar funcionalidade por ID', {
        hook: 'useRoadmapData',
        method: 'fetchFeatureById',
        featureId: id,
        error: errorMessage
      });
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      setIsLoadingStats(true);
      setError(null);
      
      logInfo('Buscando estatísticas do roadmap', {
        hook: 'useRoadmapData',
        method: 'fetchStats'
      });
      
      const statsData = await roadmapService.getStats();
      setStats(statsData);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao buscar estatísticas';
      setError(errorMessage);
      logError('Erro ao buscar estatísticas', {
        hook: 'useRoadmapData',
        method: 'fetchStats',
        error: errorMessage
      });
    } finally {
      setIsLoadingStats(false);
    }
  }, []);
  
  // Create feature
  const createFeature = useCallback(async (request: CreateFeatureRequest): Promise<RoadmapFeature | null> => {
    try {
      setIsCreating(true);
      setError(null);
      
      logInfo('Criando nova funcionalidade', {
        hook: 'useRoadmapData',
        method: 'createFeature',
        title: request.title
      });
      
      const newFeature = await roadmapService.createFeature(request);
      
      // Refresh data after creation
      await fetchFeatures();
      await fetchStats();
      
      return newFeature;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao criar funcionalidade';
      setError(errorMessage);
      logError('Erro ao criar funcionalidade', {
        hook: 'useRoadmapData',
        method: 'createFeature',
        error: errorMessage
      });
      return null;
    } finally {
      setIsCreating(false);
    }
  }, [fetchFeatures, fetchStats]);
  
  // Update feature
  const updateFeature = useCallback(async (id: string, request: UpdateFeatureRequest): Promise<RoadmapFeature | null> => {
    try {
      setIsUpdating(true);
      setError(null);
      
      logInfo('Atualizando funcionalidade', {
        hook: 'useRoadmapData',
        method: 'updateFeature',
        featureId: id
      });
      
      const updatedFeature = await roadmapService.updateFeature(id, request);
      
      // Update local state
      setFeatures(prev => prev.map(f => f.id === id ? { ...f, ...updatedFeature } : f));
      
      if (currentFeature?.id === id) {
        setCurrentFeature(prev => prev ? { ...prev, ...updatedFeature } : null);
      }
      
      // Refresh stats if status changed
      if (request.status) {
        await fetchStats();
      }
      
      return updatedFeature;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao atualizar funcionalidade';
      setError(errorMessage);
      logError('Erro ao atualizar funcionalidade', {
        hook: 'useRoadmapData',
        method: 'updateFeature',
        featureId: id,
        error: errorMessage
      });
      return null;
    } finally {
      setIsUpdating(false);
    }
  }, [currentFeature, fetchStats]);
  
  // Delete feature
  const deleteFeature = useCallback(async (id: string): Promise<boolean> => {
    try {
      setIsDeleting(true);
      setError(null);
      
      logInfo('Deletando funcionalidade', {
        hook: 'useRoadmapData',
        method: 'deleteFeature',
        featureId: id
      });
      
      await roadmapService.deleteFeature(id);
      
      // Remove from local state
      setFeatures(prev => prev.filter(f => f.id !== id));
      
      if (currentFeature?.id === id) {
        setCurrentFeature(null);
      }
      
      // Refresh stats
      await fetchStats();
      
      return true;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao deletar funcionalidade';
      setError(errorMessage);
      logError('Erro ao deletar funcionalidade', {
        hook: 'useRoadmapData',
        method: 'deleteFeature',
        featureId: id,
        error: errorMessage
      });
      return false;
    } finally {
      setIsDeleting(false);
    }
  }, [currentFeature, fetchStats]);
  
  // Filter actions
  const setFilters = useCallback((newFilters: RoadmapFilters) => {
    setFiltersState(newFilters);
  }, []);
  
  const clearFilters = useCallback(() => {
    setFiltersState(DEFAULT_FILTERS);
  }, []);
  
  const addFilter = useCallback((key: keyof RoadmapFilters, value: RoadmapFilters[keyof RoadmapFilters]) => {
    setFiltersState(prev => ({ ...prev, [key]: value }));
  }, []);
  
  const removeFilter = useCallback((key: keyof RoadmapFilters) => {
    setFiltersState(prev => {
      const newFilters = { ...prev };
      delete newFilters[key];
      return newFilters;
    });
  }, []);
  
  // Pagination actions
  const nextPage = useCallback(() => {
    if (pagination.hasMore) {
      const newOffset = paginationData.offset + paginationData.limit;
      setFiltersState(prev => ({ ...prev, offset: newOffset }));
    }
  }, [pagination.hasMore, paginationData]);
  
  const prevPage = useCallback(() => {
    if (pagination.currentPage > 1) {
      const newOffset = Math.max(0, paginationData.offset - paginationData.limit);
      setFiltersState(prev => ({ ...prev, offset: newOffset }));
    }
  }, [pagination.currentPage, paginationData]);
  
  const goToPage = useCallback((page: number) => {
    const newOffset = (page - 1) * paginationData.limit;
    setFiltersState(prev => ({ ...prev, offset: newOffset }));
  }, [paginationData.limit]);
  
  const setPageSize = useCallback((size: number) => {
    setFiltersState(prev => ({ ...prev, limit: size, offset: 0 }));
  }, []);
  
  // Utility actions
  const refresh = useCallback(async () => {
    await Promise.all([
      fetchFeatures(),
      fetchStats()
    ]);
  }, [fetchFeatures, fetchStats]);
  
  const resetData = useCallback(() => {
    setFeatures([]);
    setStats(null);
    setCurrentFeature(null);
    setError(null);
    setFiltersState(DEFAULT_FILTERS);
    setPaginationData({
      total: 0,
      limit: 20,
      offset: 0,
      hasMore: false
    });
  }, []);
  
  // Auto fetch on mount
  useEffect(() => {
    if (opts.autoFetch) {
      fetchFeatures();
      fetchStats();
    }
  }, []);
  
  // Fetch when filters change
  useEffect(() => {
    if (opts.autoFetch) {
      fetchFeatures(filters);
    }
  }, [filters, fetchFeatures]);
  
  // Auto refetch interval
  useEffect(() => {
    if (opts.refetchInterval && opts.refetchInterval > 0) {
      const interval = setInterval(() => {
        if (Date.now() - lastFetch > opts.cacheTime!) {
          refresh();
        }
      }, opts.refetchInterval);
      
      return () => clearInterval(interval);
    }
  }, [opts.refetchInterval, opts.cacheTime, lastFetch, refresh]);
  
  return {
    // Data
    features,
    stats,
    currentFeature,
    
    // State
    isLoading,
    isLoadingStats,
    isCreating,
    isUpdating,
    isDeleting,
    error,
    
    // Pagination
    pagination,
    
    // Filters
    filters,
    
    // Actions
    fetchFeatures,
    fetchFeatureById,
    fetchStats,
    createFeature,
    updateFeature,
    deleteFeature,
    
    // Filter actions
    setFilters,
    clearFilters,
    addFilter,
    removeFilter,
    
    // Pagination actions
    nextPage,
    prevPage,
    goToPage,
    setPageSize,
    
    // Utility actions
    refresh,
    clearError,
    resetData
  };
}