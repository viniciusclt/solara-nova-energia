import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  FileText,
  GraduationCap,
  Users,
  Settings,
  MessageSquare,
  Calendar,
  Clock,
  ExternalLink,
  RefreshCw,
  Filter
} from 'lucide-react';
import { ActivityItem, ActivityProps } from '@/types/dashboard';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ActivityFeedProps extends ActivityProps {
  activities: ActivityItem[];
  loading?: boolean;
  onRefresh?: () => void;
  onFilter?: (type?: string) => void;
  onViewAll?: () => void;
  className?: string;
  maxHeight?: number;
}

interface ActivityItemComponentProps {
  activity: ActivityItem;
  onClick?: (activity: ActivityItem) => void;
}

const getActivityIcon = (type: ActivityItem['type']) => {
  switch (type) {
    case 'proposal':
      return <FileText className="h-4 w-4" />;
    case 'training':
      return <GraduationCap className="h-4 w-4" />;
    case 'user':
      return <Users className="h-4 w-4" />;
    case 'system':
      return <Settings className="h-4 w-4" />;
    case 'comment':
      return <MessageSquare className="h-4 w-4" />;
    case 'meeting':
      return <Calendar className="h-4 w-4" />;
    default:
      return <Clock className="h-4 w-4" />;
  }
};

const getActivityColor = (type: ActivityItem['type']) => {
  switch (type) {
    case 'proposal':
      return 'bg-blue-100 text-blue-600 border-blue-200';
    case 'training':
      return 'bg-green-100 text-green-600 border-green-200';
    case 'user':
      return 'bg-purple-100 text-purple-600 border-purple-200';
    case 'system':
      return 'bg-gray-100 text-gray-600 border-gray-200';
    case 'comment':
      return 'bg-yellow-100 text-yellow-600 border-yellow-200';
    case 'meeting':
      return 'bg-indigo-100 text-indigo-600 border-indigo-200';
    default:
      return 'bg-gray-100 text-gray-600 border-gray-200';
  }
};

const getActivityTypeLabel = (type: ActivityItem['type']) => {
  switch (type) {
    case 'proposal':
      return 'Proposta';
    case 'training':
      return 'Treinamento';
    case 'user':
      return 'Usuário';
    case 'system':
      return 'Sistema';
    case 'comment':
      return 'Comentário';
    case 'meeting':
      return 'Reunião';
    default:
      return 'Atividade';
  }
};

const ActivityItemComponent: React.FC<ActivityItemComponentProps> = ({ 
  activity, 
  onClick 
}) => {
  const timeAgo = formatDistanceToNow(new Date(activity.timestamp), {
    addSuffix: true,
    locale: ptBR
  });

  const handleClick = () => {
    if (onClick) {
      onClick(activity);
    }
  };

  return (
    <div 
      className={cn(
        'flex items-start space-x-3 p-3 rounded-lg transition-colors',
        onClick && 'cursor-pointer hover:bg-gray-50'
      )}
      onClick={handleClick}
    >
      {/* Avatar do usuário */}
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarImage src={activity.user.avatar} alt={activity.user.name} />
        <AvatarFallback className="text-xs">
          {activity.user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
        </AvatarFallback>
      </Avatar>

      {/* Conteúdo da atividade */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-900">
              {activity.user.name}
            </span>
            <Badge 
              variant="outline" 
              className={cn('text-xs', getActivityColor(activity.type))}
            >
              <div className="flex items-center space-x-1">
                {getActivityIcon(activity.type)}
                <span>{getActivityTypeLabel(activity.type)}</span>
              </div>
            </Badge>
          </div>
          <time className="text-xs text-gray-500 flex-shrink-0">
            {timeAgo}
          </time>
        </div>
        
        <h4 className="text-sm font-medium text-gray-900 mb-1">
          {activity.title}
        </h4>
        
        <p className="text-sm text-gray-600 line-clamp-2">
          {activity.description}
        </p>
        
        {/* Metadados adicionais */}
        {activity.metadata && (
          <div className="mt-2 flex items-center space-x-2">
            {activity.metadata.status && (
              <Badge 
                variant={activity.metadata.status === 'approved' ? 'default' : 'secondary'}
                className="text-xs"
              >
                {activity.metadata.status === 'approved' ? 'Aprovado' :
                 activity.metadata.status === 'pending' ? 'Pendente' :
                 activity.metadata.status === 'rejected' ? 'Rejeitado' :
                 activity.metadata.status}
              </Badge>
            )}
            {onClick && (
              <ExternalLink className="h-3 w-3 text-gray-400" />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const ActivitySkeleton = () => (
  <div className="flex items-start space-x-3 p-3">
    <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
    <div className="flex-1 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-5 w-16" />
        </div>
        <Skeleton className="h-3 w-12" />
      </div>
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-full" />
    </div>
  </div>
);

const ActivityFeed: React.FC<ActivityFeedProps> = ({
  activities,
  loading = false,
  onRefresh,
  onFilter,
  onViewAll,
  className,
  maxHeight = 400,
  showHeader = true,
  showFilters = true
}) => {
  const handleActivityClick = (activity: ActivityItem) => {
    // Navegar para a atividade específica baseado no tipo
    switch (activity.type) {
      case 'proposal':
        if (activity.metadata?.proposalId) {
          window.open(`/proposals/editor/${activity.metadata.proposalId}`, '_blank');
        }
        break;
      case 'training':
        if (activity.metadata?.trainingId) {
          window.open(`/training/${activity.metadata.trainingId}`, '_blank');
        }
        break;
      default:
        console.log('Atividade clicada:', activity);
    }
  };

  return (
    <Card className={cn('w-full', className)}>
      {showHeader && (
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg font-semibold">
            Atividades Recentes
          </CardTitle>
          
          <div className="flex items-center space-x-2">
            {showFilters && onFilter && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onFilter()}
                className="h-8 w-8 p-0"
              >
                <Filter className="h-4 w-4" />
              </Button>
            )}
            
            {onRefresh && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRefresh}
                disabled={loading}
                className="h-8 w-8 p-0"
              >
                <RefreshCw className={cn(
                  'h-4 w-4',
                  loading && 'animate-spin'
                )} />
              </Button>
            )}
          </div>
        </CardHeader>
      )}
      
      <CardContent className="p-0">
        <ScrollArea className={`h-[${maxHeight}px]`}>
          {loading ? (
            <div className="space-y-1">
              {Array.from({ length: 5 }).map((_, index) => (
                <ActivitySkeleton key={index} />
              ))}
            </div>
          ) : activities.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-center">
              <div>
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhuma atividade recente
                </h3>
                <p className="text-gray-500">
                  As atividades da sua equipe aparecerão aqui.
                </p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {activities.map((activity) => (
                <ActivityItemComponent
                  key={activity.id}
                  activity={activity}
                  onClick={handleActivityClick}
                />
              ))}
            </div>
          )}
        </ScrollArea>
        
        {!loading && activities.length > 0 && onViewAll && (
          <div className="p-4 border-t border-gray-100">
            <Button
              variant="ghost"
              onClick={onViewAll}
              className="w-full text-sm"
            >
              Ver todas as atividades
              <ExternalLink className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ActivityFeed;
export { ActivityItemComponent };