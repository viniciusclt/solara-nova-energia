import React, { useState, useEffect } from 'react';
import { Bell, X, Check, AlertTriangle, Info, AlertCircle, Settings } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import type { Notification, NotificationSettings } from '@/hooks/useNotifications';

interface NotificationSystemProps {
  notifications: Notification[];
  settings: NotificationSettings;
  onNotificationRead: (id: string) => void;
  onNotificationDismiss: (id: string) => void;
  onSettingsChange: (settings: NotificationSettings) => void;
  onClearAll: () => void;
}

const getNotificationIcon = (type: Notification['type']) => {
  switch (type) {
    case 'success':
      return <Check className="h-4 w-4 text-green-500" />;
    case 'warning':
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    case 'error':
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    default:
      return <Info className="h-4 w-4 text-blue-500" />;
  }
};

const getNotificationBadgeVariant = (type: Notification['type']) => {
  switch (type) {
    case 'success':
      return 'default';
    case 'warning':
      return 'secondary';
    case 'error':
      return 'destructive';
    default:
      return 'outline';
  }
};

const getCategoryLabel = (category: Notification['category']) => {
  switch (category) {
    case 'system':
      return 'Sistema';
    case 'calculation':
      return 'Cálculos';
    case 'proposal':
      return 'Propostas';
    case 'api':
      return 'APIs';
    case 'user':
      return 'Usuário';
    default:
      return 'Geral';
  }
};

const formatTimestamp = (timestamp: Date) => {
  const now = new Date();
  const diff = now.getTime() - timestamp.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Agora';
  if (minutes < 60) return `${minutes}m atrás`;
  if (hours < 24) return `${hours}h atrás`;
  if (days < 7) return `${days}d atrás`;
  
  return timestamp.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit'
  });
};

export function NotificationSystem({
  notifications,
  settings,
  onNotificationRead,
  onNotificationDismiss,
  onSettingsChange,
  onClearAll
}: NotificationSystemProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [filter, setFilter] = useState<'all' | Notification['category']>('all');

  const unreadCount = notifications.filter(n => !n.read).length;
  const filteredNotifications = notifications.filter(n => 
    filter === 'all' || n.category === filter
  );

  // Request notification permission on mount
  useEffect(() => {
    if (settings.desktop && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [settings.desktop]);

  // Show desktop notifications for new notifications
  useEffect(() => {
    if (!settings.enabled || !settings.desktop) return;
    if ('Notification' in window && Notification.permission === 'granted') {
      const newNotifications = notifications.filter(n => 
        !n.read && 
        settings.categories[n.category] &&
        Date.now() - n.timestamp.getTime() < 5000 // Only show for notifications from last 5 seconds
      );

      newNotifications.forEach(notification => {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/favicon.ico',
          tag: notification.id
        });
      });
    }
  }, [notifications, settings]);

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      onNotificationRead(notification.id);
    }
    
    if (notification.actionCallback) {
      notification.actionCallback();
    }
  };

  const handleSettingsUpdate = (key: keyof NotificationSettings, value: boolean) => {
    onSettingsChange({
      ...settings,
      [key]: value
    });
  };

  const handleCategoryToggle = (category: keyof NotificationSettings['categories']) => {
    onSettingsChange({
      ...settings,
      categories: {
        ...settings.categories,
        [category]: !settings.categories[category]
      }
    });
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-96 p-0" align="end">
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Notificações</CardTitle>
                <CardDescription>
                  {unreadCount > 0 ? `${unreadCount} não lidas` : 'Todas lidas'}
                </CardDescription>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSettings(!showSettings)}
                >
                  <Settings className="h-4 w-4" />
                </Button>
                {notifications.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClearAll}
                  >
                    Limpar
                  </Button>
                )}
              </div>
            </div>

            {showSettings && (
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Notificações ativas</Label>
                  <Switch
                    checked={settings.enabled}
                    onCheckedChange={(checked) => handleSettingsUpdate('enabled', checked)}
                  />
                </div>

                {settings.enabled && (
                  <>
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-muted-foreground">Categorias</Label>
                      {Object.entries(settings.categories).map(([category, enabled]) => (
                        <div key={category} className="flex items-center justify-between">
                          <Label className="text-sm">
                            {getCategoryLabel(category as Notification['category'])}
                          </Label>
                          <Switch
                            checked={enabled}
                            onCheckedChange={() => handleCategoryToggle(category as keyof NotificationSettings['categories'])}
                            size="sm"
                          />
                        </div>
                      ))}
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-muted-foreground">Opções</Label>
                      <div className="flex items-center justify-between">
                        <Label className="text-sm">Som</Label>
                        <Switch
                          checked={settings.sound}
                          onCheckedChange={(checked) => handleSettingsUpdate('sound', checked)}
                          size="sm"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label className="text-sm">Desktop</Label>
                        <Switch
                          checked={settings.desktop}
                          onCheckedChange={(checked) => handleSettingsUpdate('desktop', checked)}
                          size="sm"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label className="text-sm">Email</Label>
                        <Switch
                          checked={settings.email}
                          onCheckedChange={(checked) => handleSettingsUpdate('email', checked)}
                          size="sm"
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {!showSettings && (
              <div className="flex gap-1 pt-2">
                <Button
                  variant={filter === 'all' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setFilter('all')}
                >
                  Todas
                </Button>
                {(['system', 'calculation', 'proposal', 'api', 'user'] as const).map(category => {
                  const count = notifications.filter(n => n.category === category && !n.read).length;
                  return (
                    <Button
                      key={category}
                      variant={filter === category ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setFilter(category)}
                      className="relative"
                    >
                      {getCategoryLabel(category)}
                      {count > 0 && (
                        <Badge variant="secondary" className="ml-1 h-4 w-4 rounded-full p-0 text-xs">
                          {count}
                        </Badge>
                      )}
                    </Button>
                  );
                })}
              </div>
            )}
          </CardHeader>

          <CardContent className="p-0">
            <ScrollArea className="h-96">
              {filteredNotifications.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhuma notificação</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 border-b cursor-pointer hover:bg-muted/50 transition-colors ${
                        !notification.read ? 'bg-muted/30' : ''
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          {getNotificationIcon(notification.type)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-medium truncate">
                              {notification.title}
                            </p>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                            )}
                          </div>
                          
                          <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                            {notification.message}
                          </p>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge 
                                variant={getNotificationBadgeVariant(notification.type)}
                                className="text-xs"
                              >
                                {getCategoryLabel(notification.category)}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {formatTimestamp(notification.timestamp)}
                              </span>
                            </div>
                            
                            {notification.actionLabel && (
                              <Button variant="ghost" size="sm" className="text-xs h-6">
                                {notification.actionLabel}
                              </Button>
                            )}
                          </div>
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex-shrink-0 h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            onNotificationDismiss(notification.id);
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
}