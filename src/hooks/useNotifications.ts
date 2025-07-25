import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
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
  metadata?: Record<string, any>;
}

interface NotificationStats {
  total: number;
  unread: number;
  urgent: number;
  byType: Record<NotificationType, number>;
}

export function useNotifications() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
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
    }
  });

  // Carregar notificações
  const loadNotifications = useCallback(async () => {
    if (!profile) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .or(`user_id.eq.${profile.id},company_id.eq.${profile.company_id}`)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      const notificationData = data || [];
      setNotifications(notificationData);
      
      // Calcular estatísticas
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
        }
      };
      setStats(newStats);

    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as notificações',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [profile, toast]);

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
        }
      }));

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
  }, [profile, toast]);

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
    loadNotifications,
    createNotification,
    markAsRead,
    markAsUnread,
    deleteNotification,
    markAllAsRead,
    clearExpiredNotifications,
    // Métodos de conveniência
    notifySuccess,
    notifyError,
    notifyWarning,
    notifyInfo,
    notifySystem
  };
}

export default useNotifications;