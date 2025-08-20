import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  Mail,
  Search,
  Filter,
  Group,
  Settings
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNotifications, type Notification, type NotificationType, type NotificationPriority } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const { toast } = useToast();
  const {
    notifications,
    stats,
    isLoading,
    filters,
    groupedNotifications,
    markAsRead,
    markAsUnread,
    deleteNotification,
    markAllAsRead,
    applyFilters,
    clearFilters,
    requestNotificationPermission
  } = useNotifications();
  
  const [activeTab, setActiveTab] = useState('all');
  const [viewMode, setViewMode] = useState<'list' | 'grouped'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Aplicar filtros quando os valores mudarem
  useEffect(() => {
    const newFilters: Record<string, string | boolean | NotificationType[] | NotificationPriority[]> = {};
    
    if (searchTerm) {
      newFilters.searchTerm = searchTerm;
    }
    
    if (selectedType !== 'all') {
      newFilters.type = [selectedType as NotificationType];
    }
    
    if (selectedPriority !== 'all') {
      newFilters.priority = [selectedPriority as NotificationPriority];
    }
    
    if (activeTab === 'unread') {
      newFilters.read = false;
    } else if (activeTab === 'read') {
      newFilters.read = true;
    } else if (activeTab === 'urgent') {
      newFilters.priority = ['urgent', 'high'];
    }
    
    applyFilters(newFilters);
  }, [searchTerm, selectedType, selectedPriority, activeTab, applyFilters]);

  // Solicitar permissão para notificações push na primeira abertura
  useEffect(() => {
    if (isOpen) {
      requestNotificationPermission();
    }
  }, [isOpen, requestNotificationPermission]);

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedType('all');
    setSelectedPriority('all');
    setActiveTab('all');
    clearFilters();
  };

  const renderNotificationGroup = (group: { type: string; count: number; notifications: Notification[] }) => {
    return (
      <div key={group.type} className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          {getNotificationIcon(group.type)}
          <h3 className="font-medium capitalize">{group.type}</h3>
          <Badge variant="secondary">{group.count}</Badge>
        </div>
        <div className="space-y-2 ml-6">
          {group.notifications.slice(0, 3).map((notification: Notification) => (
            renderNotificationItem(notification, true)
          ))}
          {group.count > 3 && (
            <Button variant="ghost" size="sm" className="w-full">
              Ver mais {group.count - 3} notificações
            </Button>
          )}
        </div>
      </div>
    );
  };

  const renderNotificationItem = (notification: Notification, isGrouped = false) => {
    return (
      <div key={notification.id} className={`p-4 rounded-lg border transition-colors ${
        notification.read ? 'bg-muted/30' : 'bg-background border-primary/20'
      } ${isGrouped ? 'ml-0' : ''}`}>
        <div className="flex items-start gap-3">
          {!isGrouped && (
            <div className="flex-shrink-0 mt-1">
              {getNotificationIcon(notification.type)}
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className={`text-sm font-medium ${
                    notification.read ? 'text-muted-foreground' : 'text-foreground'
                  }`}>
                    {notification.title}
                  </h4>
                  {notification.priority && (
                    <div className={`w-2 h-2 rounded-full ${getPriorityColor(notification.priority)}`} />
                  )}
                </div>
                <p className={`text-sm ${
                  notification.read ? 'text-muted-foreground' : 'text-muted-foreground'
                }`}>
                  {notification.message}
                </p>
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(new Date(notification.created_at || notification.timestamp), {
                      addSuffix: true,
                      locale: ptBR
                    })}
                  </span>
                  {(notification.action_url || notification.actionLabel) && (notification.action_label || notification.actionLabel) && (
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto p-0 text-xs"
                      onClick={() => {
                        markAsRead(notification.id);
                        if (notification.actionCallback) {
                          notification.actionCallback();
                        }
                      }}
                    >
                      {notification.action_label || notification.actionLabel}
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
    );
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

  // Usar notificações filtradas do hook ou notificações agrupadas
  const displayNotifications = viewMode === 'grouped' ? groupedNotifications : notifications;
  const unreadCount = stats.unread;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[80vh] flex flex-col">
        <CardHeader className="space-y-4 pb-4">
          <div className="flex flex-row items-center justify-between space-y-0">
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
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode(viewMode === 'list' ? 'grouped' : 'list')}
              >
                <Group className="h-4 w-4" />
              </Button>
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
          </div>
          
          {/* Filtros */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar notificações..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="info">Informação</SelectItem>
                  <SelectItem value="success">Sucesso</SelectItem>
                  <SelectItem value="warning">Aviso</SelectItem>
                  <SelectItem value="error">Erro</SelectItem>
                  <SelectItem value="system">Sistema</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                <SelectTrigger>
                  <SelectValue placeholder="Prioridade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as prioridades</SelectItem>
                  <SelectItem value="low">Baixa</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="urgent">Urgente</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="md:col-span-3 flex justify-end">
                <Button variant="outline" size="sm" onClick={handleClearFilters}>
                  Limpar filtros
                </Button>
              </div>
            </div>
          )}
          
          {/* Estatísticas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="font-semibold">{stats.total}</div>
              <div className="text-muted-foreground">Total</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-red-500">{stats.unread}</div>
              <div className="text-muted-foreground">Não lidas</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-orange-500">{stats.urgent}</div>
              <div className="text-muted-foreground">Urgentes</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-blue-500">{stats.todayCount}</div>
              <div className="text-muted-foreground">Hoje</div>
            </div>
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
                ) : displayNotifications.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma notificação encontrada</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {viewMode === 'grouped' ? (
                      // Visualização agrupada
                      groupedNotifications.map((group) => renderNotificationGroup(group))
                    ) : (
                      // Visualização em lista
                      notifications.map((notification, index) => (
                        <div key={notification.id}>
                          {renderNotificationItem(notification)}
                          {index < notifications.length - 1 && <Separator className="my-2" />}
                        </div>
                      ))
                    )}
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