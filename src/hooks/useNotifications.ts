import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { connectivityService } from '@/services/connectivityService';
import type { Notification, NotificationType, NotificationPriority } from '@/components/NotificationCenter';

interface CreateNotificationParams {
  title: string;
  message: string;
  type?: NotificationType;
  priority?: NotificationPriority;
  userId?: string;
  companyId?: string;
  actionUrl?: string;
  actionLabel?: string;
  expiresAt?: Date;
  metadata?: Record<string, unknown>;
}

interface NotificationStats {
  total: number;
  unread: number;
  urgent: number;
  byType: Record<NotificationType, number>;
  byPriority: Record<NotificationPriority, number>;
  todayCount: number;
  weekCount: number;
}

interface NotificationGroup {
  type: NotificationType;
  count: number;
  latestNotification: Notification;
  notifications: Notification[];
}

interface NotificationFilters {
  type?: NotificationType[];
  priority?: NotificationPriority[];
  read?: boolean;
  dateRange?: { start: Date; end: Date };
  searchTerm?: string;
}

export function useNotifications() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Referência para markAsRead para uso em callbacks
  const markAsReadRef = useRef<((id: string) => Promise<void>) | null>(null);
  const [stats, setStats] = useState<NotificationStats>({
    total: 0,
    unread: 0,
    urgent: 0,
    byType: {
      info: 0,
      success: 0,
      warning: 0,
      error: 0,
      system: 0
    },
    byPriority: {
      low: 0,
      medium: 0,
      high: 0,
      urgent: 0
    },
    todayCount: 0,
    weekCount: 0
  });
  const [filters, setFilters] = useState<NotificationFilters>({});
  const [groupedNotifications, setGroupedNotifications] = useState<NotificationGroup[]>([]);

  // Carregar notificações com retry automático e fallback melhorado
  const loadNotifications = useCallback(async () => {
    if (!profile) return;

    setIsLoading(true);
    console.log('🔄 Carregando notificações...');

    try {
      // Usar o serviço de conectividade com retry automático
      const result = await connectivityService.withRetry(async () => {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .or(`user_id.eq.${profile.id},company_id.eq.${profile.company_id}`)
          .order('created_at', { ascending: false })
          .limit(100);

        if (error) {
          console.error('❌ Erro na query de notificações:', error);
          throw error;
        }

        return data || [];
      }, {
        maxRetries: 2,
        baseDelay: 1000
      });

      console.log(`✅ Notificações carregadas: ${result.length}`);
      setNotifications(result);
      
      // Salvar no cache local para fallback
      try {
        const cacheData = {
          notifications: result,
          timestamp: Date.now(),
          profileId: profile.id
        };
        localStorage.setItem('notifications_cache', JSON.stringify(cacheData));
        console.log('💾 Notificações salvas no cache local');
      } catch (cacheError) {
        console.warn('⚠️ Erro ao salvar cache:', cacheError);
      }
      
      // Calcular estatísticas
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      const newStats: NotificationStats = {
        total: notificationData.length,
        unread: notificationData.filter(n => !n.read).length,
        urgent: notificationData.filter(n => n.priority === 'urgent' || n.priority === 'high').length,
        byType: {
          info: notificationData.filter(n => n.type === 'info').length,
          success: notificationData.filter(n => n.type === 'success').length,
          warning: notificationData.filter(n => n.type === 'warning').length,
          error: notificationData.filter(n => n.type === 'error').length,
          system: notificationData.filter(n => n.type === 'system').length
        },
        byPriority: {
          low: notificationData.filter(n => n.priority === 'low').length,
          medium: notificationData.filter(n => n.priority === 'medium').length,
          high: notificationData.filter(n => n.priority === 'high').length,
          urgent: notificationData.filter(n => n.priority === 'urgent').length
        },
        todayCount: notificationData.filter(n => new Date(n.created_at) >= today).length,
        weekCount: notificationData.filter(n => new Date(n.created_at) >= weekAgo).length
      };
      setStats(newStats);

    } catch (error) {
      console.error('❌ Erro ao carregar notificações após tentativas:', error);
      
      // Verificar se deve usar fallback
      const shouldFallback = connectivityService.shouldUseFallback(error);
      
      if (shouldFallback) {
        // Tentar carregar do cache local melhorado
        const fallbackResult = await loadFromCache();
        
        if (fallbackResult.success) {
          setNotifications(fallbackResult.data);
          
          const connectivityStatus = connectivityService.getStatus();
          const isStale = fallbackResult.isStale;
          
          toast({
            title: connectivityStatus.isOnline ? 'Dados em Cache' : 'Modo Offline',
            description: isStale 
              ? 'Exibindo notificações em cache. Dados podem estar desatualizados.'
              : 'Exibindo notificações em cache.',
            variant: 'default'
          });
          return;
        }
      }
      
      // Se chegou aqui, não conseguiu carregar nem do cache
      setNotifications([]);
      
      // Determinar mensagem de erro específica
      const errorMessage = getErrorMessage(error);
      
      toast({
        title: 'Erro de Conexão',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [profile, toast]);

  // Função auxiliar para carregar do cache
  const loadFromCache = useCallback(async (): Promise<{
    success: boolean;
    data: Notification[];
    isStale: boolean;
  }> => {
    try {
      const cachedData = localStorage.getItem('notifications_cache');
      if (!cachedData) {
        console.log('📭 Nenhuma notificação em cache');
        return { success: false, data: [], isStale: false };
      }

      const parsed = JSON.parse(cachedData);
      
      // Verificar se o cache é do usuário atual
      if (parsed.profileId !== profile?.id) {
        console.log('🔄 Cache de usuário diferente, ignorando');
        return { success: false, data: [], isStale: false };
      }

      const notifications = parsed.notifications || [];
      const cacheAge = Date.now() - (parsed.timestamp || 0);
      const isStale = cacheAge > 5 * 60 * 1000; // 5 minutos
      
      console.log(`📦 Carregando ${notifications.length} notificações do cache (${Math.round(cacheAge / 1000)}s atrás)`);
      
      return {
        success: true,
        data: notifications,
        isStale
      };
    } catch (cacheError) {
      console.error('❌ Erro ao carregar cache:', cacheError);
      return { success: false, data: [], isStale: false };
    }
  }, [profile?.id]);

  // Função auxiliar para determinar mensagem de erro
  const getErrorMessage = useCallback((error: unknown): string => {
    if (!error || typeof error !== 'object') {
      return 'Erro desconhecido ao carregar notificações.';
    }

    const errorObj = error as { code?: string; message?: string };
    
    switch (errorObj.code) {
      case 'PGRST116':
        return 'Tabela de notificações não encontrada. Entre em contato com o suporte.';
      case '42501':
        return 'Permissão negada para acessar notificações. Faça login novamente.';
      case 'PGRST301':
        return 'Erro de autenticação. Faça login novamente.';
      default:
        if (errorObj.message?.includes('connection') || errorObj.message?.includes('network')) {
          return 'Erro de conexão com o servidor. Verifique sua internet.';
        }
        return 'Não foi possível carregar as notificações. Tente novamente.';
    }
  }, []);

  // Solicitar permissão para notificações push
  const requestNotificationPermission = useCallback(async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      console.warn('Este navegador não suporta notificações push');
      return false;
    }
    
    if (Notification.permission === 'granted') {
      return true;
    }
    
    if (Notification.permission === 'denied') {
      return false;
    }
    
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }, []);

  // Enviar notificação push
  const sendPushNotification = useCallback(async (notification: Notification) => {
    const hasPermission = await requestNotificationPermission();
    
    if (!hasPermission) {
      return;
    }
    
    try {
      const pushNotification = new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: notification.id,
        requireInteraction: notification.priority === 'urgent',
        silent: notification.priority === 'low'
      });
      
      pushNotification.onclick = () => {
         window.focus();
         // markAsRead será definido mais tarde, então vamos usar uma referência
         if (markAsReadRef.current) {
           markAsReadRef.current(notification.id);
         }
         pushNotification.close();
       };
      
      // Auto-fechar após 5 segundos para notificações não urgentes
      if (notification.priority !== 'urgent') {
        setTimeout(() => {
          pushNotification.close();
        }, 5000);
      }
      
    } catch (error) {
      console.error('Erro ao enviar notificação push:', error);
    }
  }, [requestNotificationPermission]);

  // Criar nova notificação
  const createNotification = useCallback(async (params: CreateNotificationParams) => {
    if (!profile) return null;

    try {
      const notificationData = {
        title: params.title,
        message: params.message,
        type: params.type || 'info',
        priority: params.priority || 'medium',
        user_id: params.userId || profile.id,
        company_id: params.companyId || profile.company_id,
        action_url: params.actionUrl,
        action_label: params.actionLabel,
        expires_at: params.expiresAt?.toISOString(),
        metadata: params.metadata,
        read: false
      };

      const { data, error } = await supabase
        .from('notifications')
        .insert(notificationData)
        .select()
        .single();

      if (error) throw error;

      // Atualizar lista local
      setNotifications(prev => [data, ...prev]);
      
      // Atualizar estatísticas
      setStats(prev => ({
        ...prev,
        total: prev.total + 1,
        unread: prev.unread + 1,
        byType: {
          ...prev.byType,
          [data.type]: prev.byType[data.type as NotificationType] + 1
        },
        byPriority: {
          ...prev.byPriority,
          [data.priority]: prev.byPriority[data.priority as NotificationPriority] + 1
        }
      }));

      // Enviar notificação push para notificações urgentes ou de erro
      if (data.priority === 'urgent' || data.priority === 'high' || data.type === 'error') {
        await sendPushNotification(data);
      }

      return data;
    } catch (error) {
      console.error('Erro ao criar notificação:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível criar a notificação',
        variant: 'destructive'
      });
      return null;
    }
  }, [profile, toast, sendPushNotification]);

  // Marcar como lida
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      
      setStats(prev => ({
        ...prev,
        unread: Math.max(0, prev.unread - 1)
      }));

    } catch (error) {
      console.error('Erro ao marcar como lida:', error);
    }
  }, []);
  
  // Atualizar referência para markAsRead
  useEffect(() => {
    markAsReadRef.current = markAsRead;
  }, [markAsRead]);

  // Marcar como não lida
  const markAsUnread = useCallback(async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: false })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: false } : n)
      );
      
      setStats(prev => ({
        ...prev,
        unread: prev.unread + 1
      }));

    } catch (error) {
      console.error('Erro ao marcar como não lida:', error);
    }
  }, []);

  // Deletar notificação
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const notification = notifications.find(n => n.id === notificationId);
      if (!notification) return;

      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      setStats(prev => ({
        ...prev,
        total: Math.max(0, prev.total - 1),
        unread: notification.read ? prev.unread : Math.max(0, prev.unread - 1),
        urgent: (notification.priority === 'urgent' || notification.priority === 'high') 
          ? Math.max(0, prev.urgent - 1) 
          : prev.urgent,
        byType: {
          ...prev.byType,
          [notification.type]: Math.max(0, prev.byType[notification.type] - 1)
        }
      }));

      toast({
        title: 'Sucesso',
        description: 'Notificação removida'
      });

    } catch (error) {
      console.error('Erro ao deletar notificação:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível remover a notificação',
        variant: 'destructive'
      });
    }
  }, [notifications, toast]);

  // Marcar todas como lidas
  const markAllAsRead = useCallback(async () => {
    if (!profile) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .or(`user_id.eq.${profile.id},company_id.eq.${profile.company_id}`)
        .eq('read', false);

      if (error) throw error;

      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setStats(prev => ({ ...prev, unread: 0 }));
      
      toast({
        title: 'Sucesso',
        description: 'Todas as notificações foram marcadas como lidas'
      });

    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível marcar todas as notificações como lidas',
        variant: 'destructive'
      });
    }
  }, [profile, toast]);

  // Limpar notificações expiradas
  const clearExpiredNotifications = useCallback(async () => {
    if (!profile) return;

    try {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from('notifications')
        .delete()
        .or(`user_id.eq.${profile.id},company_id.eq.${profile.company_id}`)
        .lt('expires_at', now);

      if (error) throw error;

      // Recarregar notificações
      await loadNotifications();

    } catch (error) {
      console.error('Erro ao limpar notificações expiradas:', error);
    }
  }, [profile, loadNotifications]);

  // Configurar real-time subscriptions
  useEffect(() => {
    if (!profile) return;

    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${profile.id}`
        },
        (payload) => {
          console.log('Notificação em tempo real:', payload);
          loadNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile, loadNotifications]);

  // Filtrar notificações
  const filterNotifications = useCallback((notifications: Notification[], filters: NotificationFilters): Notification[] => {
    return notifications.filter(notification => {
      // Filtro por tipo
      if (filters.type && filters.type.length > 0 && !filters.type.includes(notification.type)) {
        return false;
      }
      
      // Filtro por prioridade
      if (filters.priority && filters.priority.length > 0 && !filters.priority.includes(notification.priority)) {
        return false;
      }
      
      // Filtro por status de leitura
      if (filters.read !== undefined && notification.read !== filters.read) {
        return false;
      }
      
      // Filtro por data
      if (filters.dateRange) {
        const notificationDate = new Date(notification.created_at);
        if (notificationDate < filters.dateRange.start || notificationDate > filters.dateRange.end) {
          return false;
        }
      }
      
      // Filtro por termo de busca
      if (filters.searchTerm) {
        const searchTerm = filters.searchTerm.toLowerCase();
        const searchableText = `${notification.title} ${notification.message}`.toLowerCase();
        if (!searchableText.includes(searchTerm)) {
          return false;
        }
      }
      
      return true;
    });
  }, []);

  // Agrupar notificações por tipo
  const groupNotificationsByType = useCallback((notifications: Notification[]): NotificationGroup[] => {
    const groups: Record<NotificationType, NotificationGroup> = {} as Record<NotificationType, NotificationGroup>;
    
    notifications.forEach(notification => {
      if (!groups[notification.type]) {
        groups[notification.type] = {
          type: notification.type,
          count: 0,
          latestNotification: notification,
          notifications: []
        };
      }
      
      groups[notification.type].count++;
      groups[notification.type].notifications.push(notification);
      
      // Manter a notificação mais recente como latest
      if (new Date(notification.created_at) > new Date(groups[notification.type].latestNotification.created_at)) {
        groups[notification.type].latestNotification = notification;
      }
    });
    
    return Object.values(groups).sort((a, b) => 
      new Date(b.latestNotification.created_at).getTime() - new Date(a.latestNotification.created_at).getTime()
    );
  }, []);

  // Aplicar filtros e atualizar notificações agrupadas
  const applyFilters = useCallback((newFilters: NotificationFilters) => {
    setFilters(newFilters);
    const filtered = filterNotifications(notifications, newFilters);
    const grouped = groupNotificationsByType(filtered);
    setGroupedNotifications(grouped);
  }, [notifications, filterNotifications, groupNotificationsByType]);

  // Limpar filtros
  const clearFilters = useCallback(() => {
    setFilters({});
    const grouped = groupNotificationsByType(notifications);
    setGroupedNotifications(grouped);
  }, [notifications, groupNotificationsByType]);



  // Atualizar agrupamentos quando as notificações mudarem
  useEffect(() => {
    const filtered = filterNotifications(notifications, filters);
    const grouped = groupNotificationsByType(filtered);
    setGroupedNotifications(grouped);
  }, [notifications, filters, filterNotifications, groupNotificationsByType]);

  // Carregar notificações na inicialização
  useEffect(() => {
    if (profile) {
      loadNotifications();
      clearExpiredNotifications();
    }
  }, [profile, loadNotifications, clearExpiredNotifications]);

  // Métodos de conveniência para criar notificações específicas
  const notifySuccess = useCallback((title: string, message: string, options?: Partial<CreateNotificationParams>) => {
    return createNotification({
      title,
      message,
      type: 'success',
      priority: 'medium',
      ...options
    });
  }, [createNotification]);

  const notifyError = useCallback((title: string, message: string, options?: Partial<CreateNotificationParams>) => {
    return createNotification({
      title,
      message,
      type: 'error',
      priority: 'high',
      ...options
    });
  }, [createNotification]);

  const notifyWarning = useCallback((title: string, message: string, options?: Partial<CreateNotificationParams>) => {
    return createNotification({
      title,
      message,
      type: 'warning',
      priority: 'medium',
      ...options
    });
  }, [createNotification]);

  const notifyInfo = useCallback((title: string, message: string, options?: Partial<CreateNotificationParams>) => {
    return createNotification({
      title,
      message,
      type: 'info',
      priority: 'low',
      ...options
    });
  }, [createNotification]);

  const notifySystem = useCallback((title: string, message: string, options?: Partial<CreateNotificationParams>) => {
    return createNotification({
      title,
      message,
      type: 'system',
      priority: 'medium',
      ...options
    });
  }, [createNotification]);

  return {
    notifications,
    stats,
    isLoading,
    filters,
    groupedNotifications,
    loadNotifications,
    createNotification,
    markAsRead,
    markAsUnread,
    deleteNotification,
    markAllAsRead,
    clearExpiredNotifications,
    // Filtros e agrupamento
    filterNotifications,
    groupNotificationsByType,
    applyFilters,
    clearFilters,
    // Notificações push
    requestNotificationPermission,
    sendPushNotification,
    // Métodos de conveniência
    notifySuccess,
    notifyError,
    notifyWarning,
    notifyInfo,
    notifySystem
  };
}

export default useNotifications;