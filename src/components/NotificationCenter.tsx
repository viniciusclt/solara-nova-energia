import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bell, 
  BellRing, 
  Check, 
  X, 
  AlertTriangle, 
  Info, 
  CheckCircle, 
  XCircle,
  Clock,
  Trash2,
  Mail
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'system';
export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  read: boolean;
  created_at: string;
  expires_at?: string;
  action_url?: string;
  action_label?: string;
  user_id: string;
  company_id?: string;
  metadata?: Record<string, any>;
}

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const { toast } = useToast();
  const { profile } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (isOpen && profile) {
      loadNotifications();
    }
  }, [isOpen, profile]);

  const loadNotifications = async () => {
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

      setNotifications(data || []);
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
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.error('Erro ao marcar como lida:', error);
    }
  };

  const markAsUnread = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: false })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: false } : n)
      );
    } catch (error) {
      console.error('Erro ao marcar como não lida:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
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
  };

  const markAllAsRead = async () => {
    if (!profile) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .or(`user_id.eq.${profile.id},company_id.eq.${profile.company_id}`)
        .eq('read', false);

      if (error) throw error;

      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      
      toast({
        title: 'Sucesso',
        description: 'Todas as notificações foram marcadas como lidas'
      });
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
    }
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'system':
        return <Bell className="h-4 w-4 text-blue-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getPriorityColor = (priority: NotificationPriority) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-500';
      case 'high':
        return 'bg-orange-500';
      case 'medium':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    switch (activeTab) {
      case 'unread':
        return !notification.read;
      case 'read':
        return notification.read;
      case 'urgent':
        return notification.priority === 'urgent' || notification.priority === 'high';
      default:
        return true;
    }
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[80vh] flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center gap-2">
            <BellRing className="h-5 w-5" />
            <CardTitle>Central de Notificações</CardTitle>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={markAllAsRead}
              >
                <Check className="h-4 w-4 mr-1" />
                Marcar todas como lidas
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">Todas</TabsTrigger>
              <TabsTrigger value="unread" className="relative">
                Não lidas
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="ml-1 h-4 w-4 p-0 text-xs">
                    {unreadCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="read">Lidas</TabsTrigger>
              <TabsTrigger value="urgent">Urgentes</TabsTrigger>
            </TabsList>

            <div className="flex-1 mt-4">
              <ScrollArea className="h-[400px]">
                {isLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : filteredNotifications.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma notificação encontrada</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredNotifications.map((notification, index) => (
                      <div key={notification.id}>
                        <div className={`p-4 rounded-lg border transition-colors ${
                          notification.read ? 'bg-muted/30' : 'bg-background border-primary/20'
                        }`}>
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 mt-1">
                              {getNotificationIcon(notification.type)}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className={`text-sm font-medium ${
                                      notification.read ? 'text-muted-foreground' : 'text-foreground'
                                    }`}>
                                      {notification.title}
                                    </h4>
                                    <div className={`w-2 h-2 rounded-full ${getPriorityColor(notification.priority)}`} />
                                  </div>
                                  <p className={`text-sm ${
                                    notification.read ? 'text-muted-foreground' : 'text-muted-foreground'
                                  }`}>
                                    {notification.message}
                                  </p>
                                  <div className="flex items-center gap-4 mt-2">
                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {formatDistanceToNow(new Date(notification.created_at), {
                                        addSuffix: true,
                                        locale: ptBR
                                      })}
                                    </span>
                                    {notification.action_url && notification.action_label && (
                                      <Button
                                        variant="link"
                                        size="sm"
                                        className="h-auto p-0 text-xs"
                                        onClick={() => {
                                          // Implementar navegação para action_url
                                          markAsRead(notification.id);
                                        }}
                                      >
                                        {notification.action_label}
                                      </Button>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-1">
                                  {notification.read ? (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => markAsUnread(notification.id)}
                                      className="h-8 w-8 p-0"
                                    >
                                      <Mail className="h-3 w-3" />
                                    </Button>
                                  ) : (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => markAsRead(notification.id)}
                                      className="h-8 w-8 p-0"
                                    >
                                      <Check className="h-3 w-3" />
                                    </Button>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => deleteNotification(notification.id)}
                                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        {index < filteredNotifications.length - 1 && <Separator className="my-2" />}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

export default NotificationCenter;