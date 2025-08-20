/**
 * Hook para gerenciar atualizações de status do roadmap
 * 
 * Fornece funcionalidades para monitorar mudanças de status,
 * histórico de alterações e notificações em tempo real
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logError, logInfo } from '@/utils/secureLogger';
import { toast } from './use-toast';
import type {
  FeatureStatusHistory,
  FeatureStatus,
  RoadmapFeature,
  StatusUpdateNotification
} from '@/types/roadmap';

export interface UseStatusUpdatesOptions {
  featureId?: string;
  enableRealTimeUpdates?: boolean;
  enableNotifications?: boolean;
  autoFetch?: boolean;
}

export interface UseStatusUpdatesReturn {
  // Status history data
  statusHistory: FeatureStatusHistory[];
  latestStatus: FeatureStatus | null;
  
  // Real-time updates
  recentUpdates: StatusUpdateNotification[];
  
  // State
  isLoading: boolean;
  isUpdatingStatus: boolean;
  error: string | null;
  
  // Actions
  fetchStatusHistory: (featureId?: string) => Promise<void>;
  updateFeatureStatus: (featureId: string, newStatus: FeatureStatus, reason?: string) => Promise<boolean>;
  
  // Real-time management
  subscribeToUpdates: (featureId?: string) => void;
  unsubscribeFromUpdates: () => void;
  
  // Notifications
  markNotificationAsRead: (notificationId: string) => void;
  clearAllNotifications: () => void;
  
  // Utility actions
  refresh: (featureId?: string) => Promise<void>;
  clearError: () => void;
  resetData: () => void;
  
  // Computed values
  hasStatusHistory: boolean;
  unreadNotificationsCount: number;
  statusChangesToday: number;
}

const DEFAULT_OPTIONS: UseStatusUpdatesOptions = {
  enableRealTimeUpdates: true,
  enableNotifications: true,
  autoFetch: true
};

export function useStatusUpdates(options: UseStatusUpdatesOptions = {}): UseStatusUpdatesReturn {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // State
  const [statusHistory, setStatusHistory] = useState<FeatureStatusHistory[]>([]);
  const [recentUpdates, setRecentUpdates] = useState<StatusUpdateNotification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<ReturnType<typeof supabase.channel> | null>(null);
  
  // Computed values
  const latestStatus = useMemo(() => {
    if (statusHistory.length === 0) return null;
    return statusHistory[0].new_status;
  }, [statusHistory]);
  
  const hasStatusHistory = useMemo(() => statusHistory.length > 0, [statusHistory]);
  
  const unreadNotificationsCount = useMemo(() => {
    return recentUpdates.filter(update => !update.read).length;
  }, [recentUpdates]);
  
  const statusChangesToday = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return statusHistory.filter(history => {
      const historyDate = new Date(history.created_at);
      historyDate.setHours(0, 0, 0, 0);
      return historyDate.getTime() === today.getTime();
    }).length;
  }, [statusHistory]);
  
  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);
  
  // Fetch status history
  const fetchStatusHistory = useCallback(async (featureId?: string) => {
    const targetFeatureId = featureId || opts.featureId;
    if (!targetFeatureId) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      logInfo('Buscando histórico de status', {
        hook: 'useStatusUpdates',
        method: 'fetchStatusHistory',
        featureId: targetFeatureId
      });
      
      const { data, error } = await supabase
        .from('feature_status_history')
        .select(`
          *,
          user:profiles!feature_status_history_changed_by_fkey(
            id,
            name,
            avatar_url
          )
        `)
        .eq('feature_id', targetFeatureId)
        .order('created_at', { ascending: false });
      
      if (error) {
        throw new Error(`Erro ao buscar histórico de status: ${error.message}`);
      }
      
      setStatusHistory(data as FeatureStatusHistory[]);
      
      logInfo('Histórico de status carregado com sucesso', {
        hook: 'useStatusUpdates',
        method: 'fetchStatusHistory',
        featureId: targetFeatureId,
        count: data.length
      });
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao buscar histórico';
      setError(errorMessage);
      logError('Erro ao buscar histórico de status', {
        hook: 'useStatusUpdates',
        method: 'fetchStatusHistory',
        featureId: targetFeatureId,
        error: errorMessage
      });
    } finally {
      setIsLoading(false);
    }
  }, [opts.featureId]);
  
  // Update feature status
  const updateFeatureStatus = useCallback(async (
    featureId: string, 
    newStatus: FeatureStatus, 
    reason?: string
  ): Promise<boolean> => {
    try {
      setIsUpdatingStatus(true);
      setError(null);
      
      logInfo('Atualizando status da funcionalidade', {
        hook: 'useStatusUpdates',
        method: 'updateFeatureStatus',
        featureId,
        newStatus,
        reason
      });
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuário não autenticado');
      }
      
      // Get current feature to check old status
      const { data: currentFeature, error: fetchError } = await supabase
        .from('roadmap_features')
        .select('status')
        .eq('id', featureId)
        .single();
      
      if (fetchError) {
        throw new Error(`Erro ao buscar funcionalidade atual: ${fetchError.message}`);
      }
      
      const oldStatus = currentFeature.status;
      
      // Update feature status
      const { error: updateError } = await supabase
        .from('roadmap_features')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', featureId);
      
      if (updateError) {
        throw new Error(`Erro ao atualizar status: ${updateError.message}`);
      }
      
      // The trigger will automatically create the status history entry
      // Refresh the status history to get the latest data
      await fetchStatusHistory(featureId);
      
      // Show success notification
      toast({
        title: 'Status atualizado',
        description: `Status alterado de "${oldStatus}" para "${newStatus}" com sucesso.`,
        variant: 'default'
      });
      
      logInfo('Status atualizado com sucesso', {
        hook: 'useStatusUpdates',
        method: 'updateFeatureStatus',
        featureId,
        oldStatus,
        newStatus
      });
      
      return true;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao atualizar status';
      setError(errorMessage);
      logError('Erro ao atualizar status', {
        hook: 'useStatusUpdates',
        method: 'updateFeatureStatus',
        featureId,
        newStatus,
        error: errorMessage
      });
      
      toast({
        title: 'Erro ao atualizar status',
        description: errorMessage,
        variant: 'destructive'
      });
      
      return false;
    } finally {
      setIsUpdatingStatus(false);
    }
  }, [fetchStatusHistory]);
  
  // Subscribe to real-time updates
  const subscribeToUpdates = useCallback((featureId?: string) => {
    if (!opts.enableRealTimeUpdates) return;
    
    const targetFeatureId = featureId || opts.featureId;
    if (!targetFeatureId) return;
    
    logInfo('Inscrevendo-se em atualizações em tempo real', {
      hook: 'useStatusUpdates',
      method: 'subscribeToUpdates',
      featureId: targetFeatureId
    });
    
    // Subscribe to status history changes
    const statusSubscription = supabase
      .channel(`status_updates_${targetFeatureId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'feature_status_history',
          filter: `feature_id=eq.${targetFeatureId}`
        },
        (payload) => {
          logInfo('Nova atualização de status recebida', {
            hook: 'useStatusUpdates',
            method: 'subscribeToUpdates',
            payload: payload.new
          });
          
          // Add to status history
          setStatusHistory(prev => [payload.new as FeatureStatusHistory, ...prev]);
          
          // Add notification if enabled
          if (opts.enableNotifications) {
            const notification: StatusUpdateNotification = {
              id: `status_${Date.now()}`,
              feature_id: targetFeatureId,
              old_status: (payload.new as Record<string, unknown>).old_status as string,
            new_status: (payload.new as Record<string, unknown>).new_status as string,
            change_reason: (payload.new as Record<string, unknown>).change_reason as string,
            changed_by: (payload.new as Record<string, unknown>).changed_by as string,
            created_at: (payload.new as Record<string, unknown>).created_at as string,
              read: false
            };
            
            setRecentUpdates(prev => [notification, ...prev.slice(0, 9)]); // Keep only 10 most recent
            
            // Show toast notification
            toast({
              title: 'Status atualizado',
              description: `Status alterado para "${notification.new_status}".`,
              variant: 'default'
            });
          }
        }
      )
      .subscribe();
    
    setSubscription(statusSubscription);
  }, [opts.enableRealTimeUpdates, opts.enableNotifications, opts.featureId]);
  
  // Unsubscribe from updates
  const unsubscribeFromUpdates = useCallback(() => {
    if (subscription) {
      logInfo('Cancelando inscrição de atualizações em tempo real', {
        hook: 'useStatusUpdates',
        method: 'unsubscribeFromUpdates'
      });
      
      supabase.removeChannel(subscription);
      setSubscription(null);
    }
  }, [subscription]);
  
  // Mark notification as read
  const markNotificationAsRead = useCallback((notificationId: string) => {
    setRecentUpdates(prev => 
      prev.map(update => 
        update.id === notificationId 
          ? { ...update, read: true }
          : update
      )
    );
  }, []);
  
  // Clear all notifications
  const clearAllNotifications = useCallback(() => {
    setRecentUpdates([]);
  }, []);
  
  // Refresh all data
  const refresh = useCallback(async (featureId?: string) => {
    const targetFeatureId = featureId || opts.featureId;
    if (!targetFeatureId) return;
    
    await fetchStatusHistory(targetFeatureId);
  }, [opts.featureId, fetchStatusHistory]);
  
  // Reset data
  const resetData = useCallback(() => {
    setStatusHistory([]);
    setRecentUpdates([]);
    setError(null);
    unsubscribeFromUpdates();
  }, [unsubscribeFromUpdates]);
  
  // Auto fetch on mount and when featureId changes
  useEffect(() => {
    if (opts.autoFetch && opts.featureId) {
      fetchStatusHistory(opts.featureId);
    }
  }, [opts.autoFetch, opts.featureId, fetchStatusHistory]);
  
  // Subscribe to real-time updates when featureId changes
  useEffect(() => {
    if (opts.enableRealTimeUpdates && opts.featureId) {
      subscribeToUpdates(opts.featureId);
    }
    
    return () => {
      unsubscribeFromUpdates();
    };
  }, [opts.enableRealTimeUpdates, opts.featureId, subscribeToUpdates, unsubscribeFromUpdates]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      unsubscribeFromUpdates();
    };
  }, [unsubscribeFromUpdates]);
  
  return {
    // Status history data
    statusHistory,
    latestStatus,
    
    // Real-time updates
    recentUpdates,
    
    // State
    isLoading,
    isUpdatingStatus,
    error,
    
    // Actions
    fetchStatusHistory,
    updateFeatureStatus,
    
    // Real-time management
    subscribeToUpdates,
    unsubscribeFromUpdates,
    
    // Notifications
    markNotificationAsRead,
    clearAllNotifications,
    
    // Utility actions
    refresh,
    clearError,
    resetData,
    
    // Computed values
    hasStatusHistory,
    unreadNotificationsCount,
    statusChangesToday
  };
}