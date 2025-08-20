import { useState, useEffect, useCallback } from 'react';
import { toast } from './use-toast';
import { logError } from '@/utils/secureLogger';

export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'system';
export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  persistent?: boolean;
  actionLabel?: string;
  actionCallback?: () => void;
  category: 'system' | 'calculation' | 'proposal' | 'api' | 'user';
  priority?: NotificationPriority;
  created_at?: string;
  expires_at?: string;
  action_url?: string;
  action_label?: string;
  user_id?: string;
  company_id?: string;
  metadata?: Record<string, string | number | boolean>;
}

export interface NotificationSettings {
  enabled: boolean;
  categories: {
    system: boolean;
    calculation: boolean;
    proposal: boolean;
    api: boolean;
    user: boolean;
  };
  sound: boolean;
  desktop: boolean;
  email: boolean;
}

// Hook para gerenciar notificações
export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState<Record<string, string | boolean | NotificationType[] | NotificationPriority[]>>({});
  const [settings, setSettings] = useState<NotificationSettings>({
    enabled: true,
    categories: {
      system: true,
      calculation: true,
      proposal: true,
      api: true,
      user: true
    },
    sound: true,
    desktop: true,
    email: false
  });

  // Calcular estatísticas
  const stats = {
    total: notifications.length,
    unread: notifications.filter(n => !n.read).length,
    urgent: notifications.filter(n => n.category === 'system').length,
    todayCount: notifications.filter(n => {
      const today = new Date();
      const notificationDate = new Date(n.timestamp);
      return notificationDate.toDateString() === today.toDateString();
    }).length
  };

  // Agrupar notificações por tipo
  const groupedNotifications = notifications.reduce((groups: Array<{type: string; count: number; notifications: Notification[]}>, notification) => {
    const existingGroup = groups.find(g => g.type === notification.type);
    if (existingGroup) {
      existingGroup.notifications.push(notification);
      existingGroup.count++;
    } else {
      groups.push({
        type: notification.type,
        count: 1,
        notifications: [notification]
      });
    }
    return groups;
  }, []);

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    if (!settings.enabled || !settings.categories[notification.category]) {
      return;
    }

    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      read: false
    };

    setNotifications(prev => [newNotification, ...prev]);

    // Show toast for immediate feedback
    toast({
      title: notification.title,
      description: notification.message,
      variant: notification.type === 'error' ? 'destructive' : 'default'
    });

    // Play sound if enabled
    if (settings.sound) {
      // You can implement sound playing here
      // For example: new Audio('/notification-sound.mp3').play();
    }

    return newNotification.id;
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAsUnread = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: false } : n)
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const applyFilters = useCallback((newFilters: Record<string, string | boolean | NotificationType[] | NotificationPriority[]>) => {
    setFilters(newFilters);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  }, []);

  const updateSettings = (newSettings: NotificationSettings) => {
    setSettings(newSettings);
    // Save to localStorage
    localStorage.setItem('notification-settings', JSON.stringify(newSettings));
  };

  // Load settings from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('notification-settings');
    if (saved) {
      try {
        setSettings(JSON.parse(saved));
      } catch (error) {
        logError('Failed to load notification settings', 'NotificationSystem', { error: error instanceof Error ? error.message : String(error) });
      }
    }
  }, []);

  return {
    notifications,
    stats,
    isLoading,
    filters,
    groupedNotifications,
    settings,
    addNotification,
    markAsRead,
    markAsUnread,
    deleteNotification,
    dismissNotification,
    markAllAsRead,
    clearAll,
    applyFilters,
    clearFilters,
    requestNotificationPermission,
    updateSettings
  };
}