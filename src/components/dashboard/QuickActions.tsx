import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  FileText,
  Upload,
  Users,
  Calendar,
  Settings,
  BookOpen,
  Workflow,
  BarChart3,
  MessageSquare,
  Download,
  Share2,
  Bell,
  Search
} from 'lucide-react';
import { QuickActionProps } from '@/types/dashboard';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface QuickActionsProps extends QuickActionProps {
  className?: string;
  variant?: 'grid' | 'list';
  showNotifications?: boolean;
}

interface ActionItem {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'gray';
  action: () => void;
  badge?: {
    text: string;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
  };
  disabled?: boolean;
  shortcut?: string;
}

const QuickActions: React.FC<QuickActionsProps> = ({
  className,
  variant = 'grid',
  showNotifications = true,
  showHeader = true
}) => {
  const navigate = useNavigate();

  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-200',
    green: 'bg-green-50 text-green-600 hover:bg-green-100 border-green-200',
    purple: 'bg-purple-50 text-purple-600 hover:bg-purple-100 border-purple-200',
    orange: 'bg-orange-50 text-orange-600 hover:bg-orange-100 border-orange-200',
    red: 'bg-red-50 text-red-600 hover:bg-red-100 border-red-200',
    gray: 'bg-gray-50 text-gray-600 hover:bg-gray-100 border-gray-200'
  };

  const actions: ActionItem[] = [
    {
      id: 'new-proposal',
      title: 'Nova Proposta',
      description: 'Criar uma nova proposta comercial',
      icon: <FileText className="h-5 w-5" />,
      color: 'blue',
      action: () => navigate('/fv'),
      shortcut: 'Ctrl+N'
    },
    {
      id: 'upload-video',
      title: 'Upload de Vídeo',
      description: 'Fazer upload de novo vídeo de treinamento',
      icon: <Upload className="h-5 w-5" />,
      color: 'green',
      action: () => navigate('/videos/upload'),
      badge: {
        text: 'Novo',
        variant: 'default'
      }
    },
    {
      id: 'new-playbook',
      title: 'Criar Playbook',
      description: 'Desenvolver novo playbook de vendas',
      icon: <BookOpen className="h-5 w-5" />,
      color: 'purple',
      action: () => navigate('/playbooks/editor'),
      badge: {
        text: 'Beta',
        variant: 'secondary'
      }
    },
    {
      id: 'new-flowchart',
      title: 'Novo Fluxograma',
      description: 'Criar fluxograma de processo',
      icon: <Workflow className="h-5 w-5" />,
      color: 'orange',
      action: () => navigate('/flowcharts/editor'),
      badge: {
        text: 'Beta',
        variant: 'secondary'
      }
    },
    {
      id: 'team-management',
      title: 'Gerenciar Equipe',
      description: 'Adicionar ou editar membros da equipe',
      icon: <Users className="h-5 w-5" />,
      color: 'blue',
      action: () => navigate('/team')
    },
    {
      id: 'schedule-meeting',
      title: 'Agendar Reunião',
      description: 'Marcar reunião com cliente ou equipe',
      icon: <Calendar className="h-5 w-5" />,
      color: 'green',
      action: () => navigate('/calendar')
    },
    {
      id: 'view-reports',
      title: 'Relatórios',
      description: 'Visualizar relatórios e análises',
      icon: <BarChart3 className="h-5 w-5" />,
      color: 'purple',
      action: () => navigate('/reports')
    },
    {
      id: 'roadmap',
      title: 'Roadmap',
      description: 'Ver roadmap de funcionalidades',
      icon: <MessageSquare className="h-5 w-5" />,
      color: 'orange',
      action: () => navigate('/roadmap')
    }
  ];

  const quickLinks = [
    {
      id: 'export-data',
      title: 'Exportar Dados',
      icon: <Download className="h-4 w-4" />,
      action: () => console.log('Exportar dados')
    },
    {
      id: 'share-dashboard',
      title: 'Compartilhar',
      icon: <Share2 className="h-4 w-4" />,
      action: () => console.log('Compartilhar dashboard')
    },
    {
      id: 'notifications',
      title: 'Notificações',
      icon: <Bell className="h-4 w-4" />,
      action: () => navigate('/notifications'),
      badge: showNotifications ? '3' : undefined
    },
    {
      id: 'search',
      title: 'Buscar',
      icon: <Search className="h-4 w-4" />,
      action: () => console.log('Abrir busca'),
      shortcut: 'Ctrl+K'
    },
    {
      id: 'settings',
      title: 'Configurações',
      icon: <Settings className="h-4 w-4" />,
      action: () => navigate('/settings')
    }
  ];

  const ActionButton: React.FC<{ action: ActionItem; variant: 'grid' | 'list' }> = ({ 
    action, 
    variant 
  }) => {
    const handleClick = () => {
      if (!action.disabled) {
        action.action();
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleClick();
      }
    };

    if (variant === 'list') {
      return (
        <Button
          variant="ghost"
          onClick={handleClick}
          disabled={action.disabled}
          className="w-full justify-start h-auto p-3 text-left"
          onKeyDown={handleKeyDown}
        >
          <div className={cn(
            'p-2 rounded-lg mr-3',
            colorClasses[action.color]
          )}>
            {action.icon}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="font-medium">{action.title}</span>
              {action.badge && (
                <Badge variant={action.badge.variant} className="ml-2">
                  {action.badge.text}
                </Badge>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {action.description}
            </p>
            {action.shortcut && (
              <p className="text-xs text-gray-400 mt-1">
                {action.shortcut}
              </p>
            )}
          </div>
        </Button>
      );
    }

    return (
      <Button
        variant="outline"
        onClick={handleClick}
        disabled={action.disabled}
        className={cn(
          'h-auto p-4 flex flex-col items-center space-y-2 relative transition-all duration-200',
          'hover:shadow-md hover:scale-105 overflow-visible',
          colorClasses[action.color]
        )}
        onKeyDown={handleKeyDown}
      >
        {action.badge && (
          <Badge 
            variant={action.badge.variant} 
            className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center z-10"
          >
            {action.badge.text}
          </Badge>
        )}
        
        <div className="flex items-center justify-center">
          {action.icon}
        </div>
        
        <div className="text-center">
          <div className="font-medium text-sm">
            {action.title}
          </div>
          <div className="text-xs text-gray-500 mt-1 line-clamp-2">
            {action.description}
          </div>
          {action.shortcut && (
            <div className="text-xs text-gray-400 mt-1">
              {action.shortcut}
            </div>
          )}
        </div>
      </Button>
    );
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Ações Principais */}
      <Card>
        {showHeader && (
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Plus className="h-5 w-5" />
              <span>Ações Rápidas</span>
            </CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className={cn(
            variant === 'grid' 
              ? 'grid grid-cols-2 md:grid-cols-4 gap-4'
              : 'space-y-2',
            'relative'
          )}>
            {actions.map((action) => (
              <ActionButton 
                key={action.id} 
                action={action} 
                variant={variant}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Links Rápidos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Links Rápidos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {quickLinks.map((link) => (
              <Button
                key={link.id}
                variant="ghost"
                size="sm"
                onClick={link.action}
                className="relative"
              >
                {link.icon}
                <span className="ml-2">{link.title}</span>
                {link.badge && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center"
                  >
                    {link.badge}
                  </Badge>
                )}
                {link.shortcut && (
                  <span className="ml-2 text-xs text-gray-400">
                    {link.shortcut}
                  </span>
                )}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuickActions;