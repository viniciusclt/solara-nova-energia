// =====================================================
// CENTRO DE NOTIFICAÇÕES
// Sistema de Treinamentos Corporativos - Solara Nova Energia
// Versão: 1.0
// Data: 2024-12-12
// =====================================================

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  BellRing,
  X,
  Check,
  Clock,
  AlertCircle,
  Info,
  CheckCircle,
  XCircle,
  Calendar,
  BookOpen,
  Trophy,
  Target,
  Users,
  Zap,
  Mail,
  MessageSquare,
  Settings,
  Filter,
  MoreVertical,
  Eye,
  EyeOff,
  Trash2,
  Archive,
  Star,
  StarOff,
  Volume2,
  VolumeX,
  Smartphone,
  Monitor,
  Globe,
  ChevronDown,
  ChevronRight,
  Dot,
  Circle,
  Play,
  Pause,
  RotateCcw,
  Send,
  Download,
  Share2,
  ExternalLink
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Switch } from '../../../components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Separator } from '../../../components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../../components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '../../../components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../../components/ui/tooltip';
import { ScrollArea } from '../../../components/ui/scroll-area';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import { Checkbox } from '../../../components/ui/checkbox';
import { useAuth } from '../../../contexts/AuthContext';
import type { TrainingNotification } from '../types';

// =====================================================
// INTERFACES
// =====================================================

interface NotificationCenterProps {
  compactMode?: boolean;
  showBadge?: boolean;
  maxHeight?: string;
}

interface NotificationFilter {
  type?: 'all' | 'reminder' | 'achievement' | 'deadline' | 'system';
  status?: 'all' | 'unread' | 'read';
  priority?: 'all' | 'low' | 'medium' | 'high' | 'urgent';
  dateRange?: 'all' | 'today' | 'week' | 'month';
}

interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  inAppNotifications: boolean;
  soundEnabled: boolean;
  reminderFrequency: 'never' | 'daily' | 'weekly' | 'monthly';
  achievementNotifications: boolean;
  deadlineReminders: boolean;
  systemUpdates: boolean;
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
}

// =====================================================
// DADOS MOCK
// =====================================================

const MOCK_NOTIFICATIONS: TrainingNotification[] = [
  {
    id: '1',
    user_id: 'user1',
    type: 'reminder',
    title: 'Lembrete de Treinamento',
    message: 'Você tem um módulo pendente: "Fundamentos de Energia Solar"',
    priority: 'medium',
    read: false,
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 horas atrás
    data: {
      module_id: 'mod1',
      module_title: 'Fundamentos de Energia Solar',
      action_url: '/training/modules/mod1'
    }
  },
  {
    id: '2',
    user_id: 'user1',
    type: 'achievement',
    title: 'Nova Conquista!',
    message: 'Parabéns! Você conquistou o badge "Primeiro Passo"',
    priority: 'high',
    read: false,
    created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 horas atrás
    data: {
      badge_id: 'badge1',
      badge_name: 'Primeiro Passo',
      points_earned: 50
    }
  },
  {
    id: '3',
    user_id: 'user1',
    type: 'deadline',
    title: 'Prazo se Aproximando',
    message: 'O treinamento obrigatório "Segurança no Trabalho" vence em 2 dias',
    priority: 'urgent',
    read: true,
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 dia atrás
    data: {
      module_id: 'mod2',
      module_title: 'Segurança no Trabalho',
      deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      action_url: '/training/modules/mod2'
    }
  },
  {
    id: '4',
    user_id: 'user1',
    type: 'system',
    title: 'Atualização do Sistema',
    message: 'Novos recursos foram adicionados ao módulo de treinamentos',
    priority: 'low',
    read: true,
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 dias atrás
    data: {
      version: '2.1.0',
      features: ['Editor de conteúdo aprimorado', 'Novos tipos de avaliação']
    }
  },
  {
    id: '5',
    user_id: 'user1',
    type: 'reminder',
    title: 'Sequência em Risco',
    message: 'Você não acessa os treinamentos há 3 dias. Mantenha sua sequência!',
    priority: 'medium',
    read: false,
    created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 horas atrás
    data: {
      streak_days: 7,
      last_activity: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    }
  }
];

const DEFAULT_SETTINGS: NotificationSettings = {
  emailNotifications: true,
  pushNotifications: true,
  inAppNotifications: true,
  soundEnabled: true,
  reminderFrequency: 'daily',
  achievementNotifications: true,
  deadlineReminders: true,
  systemUpdates: false,
  quietHours: {
    enabled: false,
    start: '22:00',
    end: '08:00'
  }
};

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

export function NotificationCenter({ 
  compactMode = false, 
  showBadge = true, 
  maxHeight = '600px' 
}: NotificationCenterProps) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<TrainingNotification[]>(MOCK_NOTIFICATIONS);
  const [filter, setFilter] = useState<NotificationFilter>({ type: 'all', status: 'all', priority: 'all', dateRange: 'all' });
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  
  // Contadores
  const unreadCount = notifications.filter(n => !n.read).length;
  const urgentCount = notifications.filter(n => n.priority === 'urgent' && !n.read).length;
  
  // Filtrar notificações
  const filteredNotifications = notifications.filter(notification => {
    if (filter.type !== 'all' && notification.type !== filter.type) return false;
    if (filter.status !== 'all') {
      if (filter.status === 'read' && !notification.read) return false;
      if (filter.status === 'unread' && notification.read) return false;
    }
    if (filter.priority !== 'all' && notification.priority !== filter.priority) return false;
    
    if (filter.dateRange !== 'all') {
      const notificationDate = new Date(notification.created_at);
      const now = new Date();
      const diffTime = now.getTime() - notificationDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (filter.dateRange === 'today' && diffDays > 1) return false;
      if (filter.dateRange === 'week' && diffDays > 7) return false;
      if (filter.dateRange === 'month' && diffDays > 30) return false;
    }
    
    return true;
  });
  
  // Handlers
  const handleMarkAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
  };
  
  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };
  
  const handleDeleteNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };
  
  const handleBulkAction = (action: 'read' | 'delete' | 'archive') => {
    if (action === 'read') {
      setNotifications(prev => 
        prev.map(n => selectedNotifications.includes(n.id) ? { ...n, read: true } : n)
      );
    } else if (action === 'delete') {
      setNotifications(prev => 
        prev.filter(n => !selectedNotifications.includes(n.id))
      );
    }
    setSelectedNotifications([]);
  };
  
  const handleNotificationClick = (notification: TrainingNotification) => {
    if (!notification.read) {
      handleMarkAsRead(notification.id);
    }
    
    // Navegar para a ação se disponível
    if (notification.data?.action_url) {
      // Implementar navegação
      console.log('Navigate to:', notification.data.action_url);
    }
  };
  
  if (compactMode) {
    return (
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-5 w-5" />
            {showBadge && unreadCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="end">
          <CompactNotificationList 
            notifications={filteredNotifications.slice(0, 5)}
            onNotificationClick={handleNotificationClick}
            onMarkAsRead={handleMarkAsRead}
            onViewAll={() => setIsOpen(false)}
          />
        </PopoverContent>
      </Popover>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Bell className="h-6 w-6 text-gray-700" />
            {unreadCount > 0 && (
              <div className="absolute -top-2 -right-2 h-5 w-5 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-xs text-white font-medium">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              </div>
            )}
          </div>
          
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Notificações</h2>
            <p className="text-gray-600">
              {unreadCount > 0 ? `${unreadCount} não lidas` : 'Todas as notificações lidas'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
              <Check className="h-4 w-4 mr-2" />
              Marcar todas como lidas
            </Button>
          )}
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowSettings(true)}
          >
            <Settings className="h-4 w-4 mr-2" />
            Configurações
          </Button>
        </div>
      </div>
      
      {/* Filters */}
      <NotificationFilters filter={filter} onFilterChange={setFilter} />
      
      {/* Bulk Actions */}
      {selectedNotifications.length > 0 && (
        <BulkActionsBar 
          selectedCount={selectedNotifications.length}
          onBulkAction={handleBulkAction}
          onClearSelection={() => setSelectedNotifications([])}
        />
      )}
      
      {/* Notifications List */}
      <Card>
        <CardContent className="p-0">
          <ScrollArea className={`w-full`} style={{ maxHeight }}>
            <NotificationsList 
              notifications={filteredNotifications}
              selectedNotifications={selectedNotifications}
              onNotificationClick={handleNotificationClick}
              onMarkAsRead={handleMarkAsRead}
              onDeleteNotification={handleDeleteNotification}
              onSelectionChange={setSelectedNotifications}
            />
          </ScrollArea>
        </CardContent>
      </Card>
      
      {/* Settings Modal */}
      <NotificationSettingsModal 
        open={showSettings}
        onOpenChange={setShowSettings}
        settings={settings}
        onSettingsChange={setSettings}
      />
    </div>
  );
}

// =====================================================
// COMPONENTE: FILTROS
// =====================================================

function NotificationFilters({ 
  filter, 
  onFilterChange 
}: {
  filter: NotificationFilter;
  onFilterChange: (filter: NotificationFilter) => void;
}) {
  return (
    <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
      <div className="flex items-center space-x-2">
        <Filter className="h-4 w-4 text-gray-600" />
        <span className="text-sm font-medium text-gray-700">Filtros:</span>
      </div>
      
      <Select 
        value={filter.type} 
        onValueChange={(value: any) => onFilterChange({ ...filter, type: value })}
      >
        <SelectTrigger className="w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os tipos</SelectItem>
          <SelectItem value="reminder">Lembretes</SelectItem>
          <SelectItem value="achievement">Conquistas</SelectItem>
          <SelectItem value="deadline">Prazos</SelectItem>
          <SelectItem value="system">Sistema</SelectItem>
        </SelectContent>
      </Select>
      
      <Select 
        value={filter.status} 
        onValueChange={(value: any) => onFilterChange({ ...filter, status: value })}
      >
        <SelectTrigger className="w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          <SelectItem value="unread">Não lidas</SelectItem>
          <SelectItem value="read">Lidas</SelectItem>
        </SelectContent>
      </Select>
      
      <Select 
        value={filter.priority} 
        onValueChange={(value: any) => onFilterChange({ ...filter, priority: value })}
      >
        <SelectTrigger className="w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas prioridades</SelectItem>
          <SelectItem value="urgent">Urgente</SelectItem>
          <SelectItem value="high">Alta</SelectItem>
          <SelectItem value="medium">Média</SelectItem>
          <SelectItem value="low">Baixa</SelectItem>
        </SelectContent>
      </Select>
      
      <Select 
        value={filter.dateRange} 
        onValueChange={(value: any) => onFilterChange({ ...filter, dateRange: value })}
      >
        <SelectTrigger className="w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os períodos</SelectItem>
          <SelectItem value="today">Hoje</SelectItem>
          <SelectItem value="week">Esta semana</SelectItem>
          <SelectItem value="month">Este mês</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

// =====================================================
// COMPONENTE: BARRA DE AÇÕES EM LOTE
// =====================================================

function BulkActionsBar({ 
  selectedCount, 
  onBulkAction, 
  onClearSelection 
}: {
  selectedCount: number;
  onBulkAction: (action: 'read' | 'delete' | 'archive') => void;
  onClearSelection: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg"
    >
      <div className="flex items-center space-x-2">
        <CheckCircle className="h-4 w-4 text-blue-600" />
        <span className="text-sm font-medium text-blue-900">
          {selectedCount} notificação{selectedCount > 1 ? 'ões' : ''} selecionada{selectedCount > 1 ? 's' : ''}
        </span>
      </div>
      
      <div className="flex items-center space-x-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => onBulkAction('read')}
        >
          <Check className="h-4 w-4 mr-1" />
          Marcar como lidas
        </Button>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => onBulkAction('archive')}
        >
          <Archive className="h-4 w-4 mr-1" />
          Arquivar
        </Button>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => onBulkAction('delete')}
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Excluir
        </Button>
        
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onClearSelection}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );
}

// =====================================================
// COMPONENTE: LISTA DE NOTIFICAÇÕES
// =====================================================

function NotificationsList({ 
  notifications, 
  selectedNotifications, 
  onNotificationClick, 
  onMarkAsRead, 
  onDeleteNotification, 
  onSelectionChange 
}: {
  notifications: TrainingNotification[];
  selectedNotifications: string[];
  onNotificationClick: (notification: TrainingNotification) => void;
  onMarkAsRead: (id: string) => void;
  onDeleteNotification: (id: string) => void;
  onSelectionChange: (ids: string[]) => void;
}) {
  const handleSelectionToggle = (notificationId: string) => {
    if (selectedNotifications.includes(notificationId)) {
      onSelectionChange(selectedNotifications.filter(id => id !== notificationId));
    } else {
      onSelectionChange([...selectedNotifications, notificationId]);
    }
  };
  
  if (notifications.length === 0) {
    return (
      <div className="text-center py-12">
        <Bell className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Nenhuma notificação encontrada
        </h3>
        <p className="text-gray-600">
          Não há notificações que correspondam aos filtros selecionados.
        </p>
      </div>
    );
  }
  
  return (
    <div className="divide-y divide-gray-200">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          isSelected={selectedNotifications.includes(notification.id)}
          onNotificationClick={onNotificationClick}
          onMarkAsRead={onMarkAsRead}
          onDeleteNotification={onDeleteNotification}
          onSelectionToggle={handleSelectionToggle}
        />
      ))}
    </div>
  );
}

// =====================================================
// COMPONENTE: ITEM DE NOTIFICAÇÃO
// =====================================================

function NotificationItem({ 
  notification, 
  isSelected, 
  onNotificationClick, 
  onMarkAsRead, 
  onDeleteNotification, 
  onSelectionToggle 
}: {
  notification: TrainingNotification;
  isSelected: boolean;
  onNotificationClick: (notification: TrainingNotification) => void;
  onMarkAsRead: (id: string) => void;
  onDeleteNotification: (id: string) => void;
  onSelectionToggle: (id: string) => void;
}) {
  const getNotificationIcon = () => {
    switch (notification.type) {
      case 'reminder':
        return <Clock className="h-5 w-5 text-blue-600" />;
      case 'achievement':
        return <Trophy className="h-5 w-5 text-yellow-600" />;
      case 'deadline':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case 'system':
        return <Info className="h-5 w-5 text-gray-600" />;
      default:
        return <Bell className="h-5 w-5 text-gray-600" />;
    }
  };
  
  const getPriorityColor = () => {
    switch (notification.priority) {
      case 'urgent':
        return 'border-l-red-500 bg-red-50';
      case 'high':
        return 'border-l-orange-500 bg-orange-50';
      case 'medium':
        return 'border-l-blue-500 bg-blue-50';
      case 'low':
        return 'border-l-gray-500 bg-gray-50';
      default:
        return 'border-l-gray-300';
    }
  };
  
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffMinutes < 60) {
      return `${diffMinutes}m atrás`;
    } else if (diffHours < 24) {
      return `${diffHours}h atrás`;
    } else {
      return `${diffDays}d atrás`;
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`p-4 border-l-4 hover:bg-gray-50 transition-colors ${
        !notification.read ? 'bg-blue-50/50' : ''
      } ${getPriorityColor()} ${isSelected ? 'bg-blue-100' : ''}`}
    >
      <div className="flex items-start space-x-3">
        {/* Checkbox */}
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onSelectionToggle(notification.id)}
          className="mt-1"
        />
        
        {/* Icon */}
        <div className="flex-shrink-0 mt-1">
          {getNotificationIcon()}
        </div>
        
        {/* Content */}
        <div 
          className="flex-1 cursor-pointer" 
          onClick={() => onNotificationClick(notification)}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h4 className={`text-sm font-medium ${
                  !notification.read ? 'text-gray-900' : 'text-gray-700'
                }`}>
                  {notification.title}
                </h4>
                
                {!notification.read && (
                  <div className="w-2 h-2 bg-blue-600 rounded-full" />
                )}
                
                <Badge 
                  variant="outline" 
                  className={`text-xs ${
                    notification.priority === 'urgent' ? 'border-red-500 text-red-700' :
                    notification.priority === 'high' ? 'border-orange-500 text-orange-700' :
                    notification.priority === 'medium' ? 'border-blue-500 text-blue-700' :
                    'border-gray-500 text-gray-700'
                  }`}
                >
                  {notification.priority === 'urgent' ? 'Urgente' :
                   notification.priority === 'high' ? 'Alta' :
                   notification.priority === 'medium' ? 'Média' : 'Baixa'}
                </Badge>
              </div>
              
              <p className={`text-sm mt-1 ${
                !notification.read ? 'text-gray-800' : 'text-gray-600'
              }`}>
                {notification.message}
              </p>
              
              <div className="flex items-center space-x-4 mt-2">
                <span className="text-xs text-gray-500">
                  {formatTimeAgo(notification.created_at)}
                </span>
                
                {notification.data?.action_url && (
                  <Button variant="link" size="sm" className="h-auto p-0 text-xs">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Ver detalhes
                  </Button>
                )}
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex items-center space-x-1 ml-4">
              {!notification.read && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onMarkAsRead(notification.id);
                        }}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Marcar como lida</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48" align="end">
                  <div className="space-y-1">
                    {!notification.read ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => onMarkAsRead(notification.id)}
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Marcar como lida
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => {
                          // Implementar marcar como não lida
                        }}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Marcar como não lida
                      </Button>
                    )}
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => {
                        // Implementar arquivar
                      }}
                    >
                      <Archive className="h-4 w-4 mr-2" />
                      Arquivar
                    </Button>
                    
                    <Separator />
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-red-600 hover:text-red-700"
                      onClick={() => onDeleteNotification(notification.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// =====================================================
// COMPONENTE: LISTA COMPACTA
// =====================================================

function CompactNotificationList({ 
  notifications, 
  onNotificationClick, 
  onMarkAsRead, 
  onViewAll 
}: {
  notifications: TrainingNotification[];
  onNotificationClick: (notification: TrainingNotification) => void;
  onMarkAsRead: (id: string) => void;
  onViewAll: () => void;
}) {
  if (notifications.length === 0) {
    return (
      <div className="p-4 text-center">
        <Bell className="h-8 w-8 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-600">Nenhuma notificação</p>
      </div>
    );
  }
  
  return (
    <div>
      <div className="p-3 border-b">
        <h3 className="font-medium text-gray-900">Notificações</h3>
      </div>
      
      <div className="max-h-80 overflow-y-auto">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`p-3 border-b hover:bg-gray-50 cursor-pointer ${
              !notification.read ? 'bg-blue-50/50' : ''
            }`}
            onClick={() => onNotificationClick(notification)}
          >
            <div className="flex items-start space-x-2">
              <div className="flex-shrink-0 mt-1">
                {notification.type === 'achievement' && <Trophy className="h-4 w-4 text-yellow-600" />}
                {notification.type === 'reminder' && <Clock className="h-4 w-4 text-blue-600" />}
                {notification.type === 'deadline' && <AlertCircle className="h-4 w-4 text-red-600" />}
                {notification.type === 'system' && <Info className="h-4 w-4 text-gray-600" />}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-1">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {notification.title}
                  </p>
                  {!notification.read && (
                    <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0" />
                  )}
                </div>
                
                <p className="text-xs text-gray-600 truncate">
                  {notification.message}
                </p>
                
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(notification.created_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
              
              {!notification.read && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMarkAsRead(notification.id);
                  }}
                >
                  <Check className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <div className="p-3 border-t">
        <Button variant="ghost" size="sm" className="w-full" onClick={onViewAll}>
          Ver todas as notificações
        </Button>
      </div>
    </div>
  );
}

// =====================================================
// COMPONENTE: MODAL DE CONFIGURAÇÕES
// =====================================================

function NotificationSettingsModal({ 
  open, 
  onOpenChange, 
  settings, 
  onSettingsChange 
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: NotificationSettings;
  onSettingsChange: (settings: NotificationSettings) => void;
}) {
  const handleSettingChange = (key: keyof NotificationSettings, value: any) => {
    onSettingsChange({ ...settings, [key]: value });
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Configurações de Notificação</DialogTitle>
          <DialogDescription>
            Personalize como e quando você recebe notificações
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Canais de Notificação */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Canais de Notificação</h4>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-gray-600" />
                  <Label htmlFor="email">Email</Label>
                </div>
                <Switch
                  id="email"
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) => handleSettingChange('emailNotifications', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Smartphone className="h-4 w-4 text-gray-600" />
                  <Label htmlFor="push">Push (Mobile)</Label>
                </div>
                <Switch
                  id="push"
                  checked={settings.pushNotifications}
                  onCheckedChange={(checked) => handleSettingChange('pushNotifications', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Monitor className="h-4 w-4 text-gray-600" />
                  <Label htmlFor="inapp">No aplicativo</Label>
                </div>
                <Switch
                  id="inapp"
                  checked={settings.inAppNotifications}
                  onCheckedChange={(checked) => handleSettingChange('inAppNotifications', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Volume2 className="h-4 w-4 text-gray-600" />
                  <Label htmlFor="sound">Som</Label>
                </div>
                <Switch
                  id="sound"
                  checked={settings.soundEnabled}
                  onCheckedChange={(checked) => handleSettingChange('soundEnabled', checked)}
                />
              </div>
            </div>
          </div>
          
          <Separator />
          
          {/* Tipos de Notificação */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Tipos de Notificação</h4>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Trophy className="h-4 w-4 text-gray-600" />
                  <Label htmlFor="achievements">Conquistas</Label>
                </div>
                <Switch
                  id="achievements"
                  checked={settings.achievementNotifications}
                  onCheckedChange={(checked) => handleSettingChange('achievementNotifications', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 text-gray-600" />
                  <Label htmlFor="deadlines">Prazos</Label>
                </div>
                <Switch
                  id="deadlines"
                  checked={settings.deadlineReminders}
                  onCheckedChange={(checked) => handleSettingChange('deadlineReminders', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Info className="h-4 w-4 text-gray-600" />
                  <Label htmlFor="system">Atualizações do sistema</Label>
                </div>
                <Switch
                  id="system"
                  checked={settings.systemUpdates}
                  onCheckedChange={(checked) => handleSettingChange('systemUpdates', checked)}
                />
              </div>
            </div>
          </div>
          
          <Separator />
          
          {/* Frequência de Lembretes */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Frequência de Lembretes</h4>
            
            <Select 
              value={settings.reminderFrequency} 
              onValueChange={(value: any) => handleSettingChange('reminderFrequency', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="never">Nunca</SelectItem>
                <SelectItem value="daily">Diariamente</SelectItem>
                <SelectItem value="weekly">Semanalmente</SelectItem>
                <SelectItem value="monthly">Mensalmente</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Separator />
          
          {/* Horário Silencioso */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900">Horário Silencioso</h4>
              <Switch
                checked={settings.quietHours.enabled}
                onCheckedChange={(checked) => 
                  handleSettingChange('quietHours', { ...settings.quietHours, enabled: checked })
                }
              />
            </div>
            
            {settings.quietHours.enabled && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start-time">Início</Label>
                  <Input
                    id="start-time"
                    type="time"
                    value={settings.quietHours.start}
                    onChange={(e) => 
                      handleSettingChange('quietHours', { 
                        ...settings.quietHours, 
                        start: e.target.value 
                      })
                    }
                  />
                </div>
                
                <div>
                  <Label htmlFor="end-time">Fim</Label>
                  <Input
                    id="end-time"
                    type="time"
                    value={settings.quietHours.end}
                    onChange={(e) => 
                      handleSettingChange('quietHours', { 
                        ...settings.quietHours, 
                        end: e.target.value 
                      })
                    }
                  />
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={() => onOpenChange(false)}>
            Salvar Configurações
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default NotificationCenter;