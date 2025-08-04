import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { connectivityService } from '@/services/connectivityService';
import { logError, logInfo, logWarn } from '@/utils/secureLogger';
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
    if (!profile?.id) {
      logInfo('Perfil não carregado, aguardando', {
        service: 'useNotifications'
      });
      return;
    }

    logInfo('Carregando notificações', {
      service: 'useNotifications',
      profileId: profile.id
    });
    setIsLoading(true);

    try {
      // Verificar se a tabela notifications existe
      const { data: result, error } = await supabase
        .from('notifications')
        .select('*')
        .or(`user_id.eq.${profile.id},company_id.eq.${profile.company_id}`)
        .order('created_at', { ascending: false })
        .limit(100);

      // Se a tabela não existir, retornar array vazio
      if (error && error.code === 'PGRST116') {
        logWarn('Tabela notifications não existe ainda. Sistema de notificações desabilitado temporariamente', {
          service: 'useNotifications',
          errorCode: error.code
        });
        setNotifications([]);
        setIsLoading(false);
        return;
      }

      if (error) {
        logError('Erro na query de notificações', {
          error: error.message,
          service: 'useNotifications',
          code: error.code
        });
        throw error;
      }

      const notifications = result || [];
      logInfo('Notificações carregadas com sucesso', {
        service: 'useNotifications',
        quantidade: notifications.length
      });
      setNotifications(notifications);
      
      // Salvar no cache local para fallback
      try {
        const cacheData = {
          notifications: notifications,
          timestamp: Date.now(),
          profileId: profile.id
        };
        localStorage.setItem('notifications_cache', JSON.stringify(cacheData));
        logInfo('Notificações salvas no cache local', {
          service: 'useNotifications'
        });
      } catch (cacheError) {
        logWarn('Erro ao salvar cache de notificações', {
          error: cacheError instanceof Error ? cacheError.message : 'Erro desconhecido',
          service: 'useNotifications'
        });
      }
      
      // Calcular estatísticas
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      const newStats: NotificationStats = {
        total: notifications.length,
        unread: notifications.filter(n => !n.read).length,
        urgent: notifications.filter(n => n.priority === 'urgent' || n.priority === 'high').length,
        byType: {
          info: notifications.filter(n => n.type === 'info').length,
          success: notifications.filter(n => n.type === 'success').length,
          warning: notifications.filter(n => n.type === 'warning').length,
          error: notifications.filter(n => n.type === 'error').length,
          system: notifications.filter(n => n.type === 'system').length
        },
        byPriority: {
          low: notifications.filter(n => n.priority === 'low').length,
          medium: notifications.filter(n => n.priority === 'medium').length,
          high: notifications.filter(n => n.priority === 'high').length,
          urgent: notifications.filter(n => n.priority === 'urgent').length
        },
        todayCount: notifications.filter(n => new Date(n.created_at) >= today).length,
        weekCount: notifications.filter(n => new Date(n.created_at) >= weekAgo).length
      };
      setStats(newStats);

    } catch (error) {
      logError('Erro ao carregar notificações após tentativas', {
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        service: 'useNotifications'
      });
      
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
        logInfo('Nenhuma notificação em cache', {
          service: 'useNotifications'
        });
        return { success: false, data: [], isStale: false };
      }

      const parsed = JSON.parse(cachedData);
      
      // Verificar se o cache é do usuário atual
      if (parsed.profileId !== profile?.id) {
        logInfo('Cache de usuário diferente, ignorando', {
          service: 'useNotifications'
        });
        return { success: false, data: [], isStale: false };
      }

      const notifications = parsed.notifications || [];
      const cacheAge = Date.now() - (parsed.timestamp || 0);
      const isStale = cacheAge > 5 * 60 * 1000; // 5 minutos
      
      logInfo('Carregando notificações do cache local', {
        service: 'useNotifications',
        quantidade: notifications.length,
        idadeCache: Math.round(cacheAge / 1000)
      });
      
      return {
        success: true,
        data: notifications,
        isStale
      };
    } catch (cacheError) {
      logError('Erro ao carregar cache de notificações', {
        error: cacheError instanceof Error ? cacheError.message : 'Erro desconhecido',
        service: 'useNotifications'
      });
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
      logWarn('Este navegador não suporta notificações push', {
        service: 'useNotifications'
      });
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
      logError('Erro ao enviar notificação push', 'useNotifications', {
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
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

      const { data: newNotification, error } = await supabase
        .from('notifications')
        .insert(notificationData)
        .select()
        .single();

      // Se a tabela não existir, retornar sem erro
      if (error && error.code === 'PGRST116') {
        logWarn('Tabela notifications não existe - notificação não será salva', {
          service: 'useNotifications',
          errorCode: error.code
        });
        return null;
      }

      if (error) throw error;

      // Atualizar lista local
      setNotifications(prev => [newNotification, ...prev]);
      
      // Atualizar estatísticas
      setStats(prev => ({
        ...prev,
        total: prev.total + 1,
        unread: prev.unread + 1,
        byType: {
          ...prev.byType,
          [newNotification.type]: prev.byType[newNotification.type as NotificationType] + 1
        },
        byPriority: {
          ...prev.byPriority,
          [newNotification.priority]: prev.byPriority[newNotification.priority as NotificationPriority] + 1
        }
      }));

      // Enviar notificação push para notificações urgentes ou de erro
      if (newNotification.priority === 'urgent' || newNotification.priority === 'high' || newNotification.type === 'error') {
        await sendPushNotification(newNotification);
      }

      return newNotification;
    } catch (error) {
      logError('Erro ao criar notificação', {
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        service: 'useNotifications'
      });
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

      // Se a tabela não existir, apenas atualizar localmente
      if (error && error.code === 'PGRST116') {
        logWarn('Tabela notifications não existe - marcando como lida apenas localmente', {
          service: 'useNotifications',
          notificationId,
          errorCode: error.code
        });
        setNotifications(prev =>
          prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
        );
        return;
      }

      if (error) throw error;

      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      
      setStats(prev => ({
        ...prev,
        unread: Math.max(0, prev.unread - 1)
      }));

    } catch (error) {
      logError('Erro ao marcar como lida', {
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        service: 'useNotifications',
        notificationId
      });
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

      // Se a tabela não existir, apenas atualizar localmente
      if (error && error.code === 'PGRST116') {
        logWarn('Tabela notifications não existe - marcando como não lida apenas localmente', {
          service: 'useNotifications',
          notificationId,
          errorCode: error.code
        });
        setNotifications(prev =>
          prev.map(n => n.id === notificationId ? { ...n, read: false } : n)
        );
        return;
      }

      if (error) throw error;

      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: false } : n)
      );
      
      setStats(prev => ({
        ...prev,
        unread: prev.unread + 1
      }));

    } catch (error) {
      logError('Erro ao marcar como não lida', {
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        service: 'useNotifications',
        notificationId
      });
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

      // Se a tabela não existir, apenas remover localmente
      if (error && error.code === 'PGRST116') {
        logWarn('Tabela notifications não existe - removendo apenas localmente', {
          service: 'useNotifications',
          notificationId,
          errorCode: error.code
        });
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
        return;
      }

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
      logError('Erro ao deletar notificação', {
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        service: 'useNotifications',
        notificationId
      });
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

      // Se a tabela não existir, apenas atualizar localmente
      if (error && error.code === 'PGRST116') {
        logWarn('Tabela notifications não existe - marcando todas como lidas apenas localmente', {
          service: 'useNotifications',
          errorCode: error.code
        });
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setStats(prev => ({ ...prev, unread: 0 }));
        
        toast({
          title: 'Sucesso',
          description: 'Todas as notificações foram marcadas como lidas'
        });
        return;
      }

      if (error) throw error;

      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setStats(prev => ({ ...prev, unread: 0 }));
      
      toast({
        title: 'Sucesso',
        description: 'Todas as notificações foram marcadas como lidas'
      });

    } catch (error) {
      logError('Erro ao marcar todas como lidas', {
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        service: 'useNotifications'
      });
      toast({
        title: 'Erro',
        description: 'Não foi possível marcar todas as notificações como lidas',
        variant: 'destructive'
      });
    }
  }, [profile, toast]);

  // Limpar notificações expiradas
  const clearExpiredNotifications = useCallback(async () => {
    if (!profile?.id) {
      logInfo('Perfil não carregado, ignorando limpeza de notificações expiradas', {
        service: 'useNotifications'
      });
      return;
    }

    try {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from('notifications')
        .delete()
        .or(`user_id.eq.${profile.id},company_id.eq.${profile.company_id}`)
        .lt('expires_at', now);

      // Se a tabela não existir, ignorar silenciosamente
      if (error && error.code === 'PGRST116') {
        logWarn('Tabela notifications não existe - ignorando limpeza de notificações expiradas', {
          service: 'useNotifications',
          errorCode: error.code
        });
        return;
      }

      if (error) throw error;

      // Recarregar notificações apenas se o profile ainda estiver válido
      if (profile?.id) {
        await loadNotifications();
      }

    } catch (error) {
      logError('Erro ao limpar notificações expiradas', {
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        service: 'useNotifications',
        profileId: profile?.id
      });
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
          logInfo('Notificação em tempo real recebida', {
            service: 'useNotifications',
            event: payload.eventType
          });
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
    if (profile?.id) {
      loadNotifications();
      // Aguardar um pouco antes de limpar notificações expiradas para evitar conflitos
      const timeoutId = setTimeout(() => {
        clearExpiredNotifications();
      }, 1000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [profile?.id, loadNotifications]);

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