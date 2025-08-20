import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  FileText, 
  Users, 
  Target,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { DashboardMetrics, LoadingState } from '@/types/dashboard';
import { cn } from '@/lib/utils';

interface MetricsGridProps {
  metrics: DashboardMetrics | null;
  loading: LoadingState;
  className?: string;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
  loading?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  icon,
  color,
  loading = false
}) => {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-50 border-blue-200',
    green: 'text-green-600 bg-green-50 border-green-200',
    yellow: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    red: 'text-red-600 bg-red-50 border-red-200',
    purple: 'text-purple-600 bg-purple-50 border-purple-200'
  };

  if (loading) {
    return (
      <Card className="h-32">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-8 rounded" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-16 mb-2" />
          <Skeleton className="h-3 w-20" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('transition-all duration-200 hover:shadow-md', colorClasses[color])}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">
          {title}
        </CardTitle>
        <div className={cn('p-2 rounded-lg', colorClasses[color])}>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gray-900">
          {typeof value === 'number' ? value.toLocaleString('pt-BR') : value}
        </div>
        {subtitle && (
          <p className="text-xs text-gray-500 mt-1">
            {subtitle}
          </p>
        )}
        {trend && (
          <div className="flex items-center mt-2">
            {trend.isPositive ? (
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
            )}
            <span className={cn(
              'text-sm font-medium',
              trend.isPositive ? 'text-green-600' : 'text-red-600'
            )}>
              {trend.isPositive ? '+' : ''}{trend.value.toFixed(1)}%
            </span>
            <span className="text-xs text-gray-500 ml-1">
              vs. mês anterior
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const MetricsGrid: React.FC<MetricsGridProps> = ({ 
  metrics, 
  loading, 
  className 
}) => {
  const isLoading = loading === 'loading';
  const hasError = loading === 'error';

  if (hasError) {
    return (
      <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6', className)}>
        <Card className="col-span-full">
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Erro ao carregar métricas
              </h3>
              <p className="text-gray-500">
                Não foi possível carregar as métricas do dashboard.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6', className)}>
      {/* Métricas de Propostas */}
      <MetricCard
        title="Total de Propostas"
        value={metrics?.proposals.total || 0}
        subtitle="Este mês"
        icon={<FileText className="h-5 w-5" />}
        color="blue"
        loading={isLoading}
      />
      
      <MetricCard
        title="Taxa de Conversão"
        value={`${metrics?.proposals.conversionRate || 0}%`}
        subtitle={`${metrics?.proposals.approved || 0} aprovadas`}
        trend={metrics ? {
          value: metrics.proposals.conversionRate - 65, // Assumindo meta de 65%
          isPositive: metrics.proposals.conversionRate > 65
        } : undefined}
        icon={<Target className="h-5 w-5" />}
        color="green"
        loading={isLoading}
      />
      
      <MetricCard
        title="Propostas Pendentes"
        value={metrics?.proposals.pending || 0}
        subtitle="Aguardando aprovação"
        icon={<Users className="h-5 w-5" />}
        color="yellow"
        loading={isLoading}
      />
      
      <MetricCard
        title="Receita do Mês"
        value={`R$ ${(metrics?.revenue.thisMonth || 0).toLocaleString('pt-BR')}`}
        subtitle={`Meta: R$ ${(metrics?.revenue.target || 0).toLocaleString('pt-BR')}`}
        trend={metrics ? {
          value: metrics.revenue.growth,
          isPositive: metrics.revenue.growth > 0
        } : undefined}
        icon={<DollarSign className="h-5 w-5" />}
        color="purple"
        loading={isLoading}
      />
      
      {/* Métricas de Performance */}
      <MetricCard
        title="Tempo de Resposta"
        value={`${metrics?.performance.avgResponseTime || 0}h`}
        subtitle="Média de resposta"
        icon={<CheckCircle className="h-5 w-5" />}
        color="blue"
        loading={isLoading}
      />
      
      <MetricCard
        title="Satisfação do Cliente"
        value={`${metrics?.performance.customerSatisfaction || 0}/5`}
        subtitle="Avaliação média"
        trend={metrics ? {
          value: 5.2, // Simulado
          isPositive: true
        } : undefined}
        icon={<TrendingUp className="h-5 w-5" />}
        color="green"
        loading={isLoading}
      />
      
      <MetricCard
        title="Eficiência da Equipe"
        value={`${metrics?.performance.teamEfficiency || 0}%`}
        subtitle="Performance geral"
        icon={<Users className="h-5 w-5" />}
        color="purple"
        loading={isLoading}
      />
      
      <MetricCard
        title="Conclusão de Metas"
        value={`${metrics?.performance.goalCompletion || 0}%`}
        subtitle="Objetivos atingidos"
        trend={metrics ? {
          value: metrics.performance.goalCompletion - 85, // Meta de 85%
          isPositive: metrics.performance.goalCompletion > 85
        } : undefined}
        icon={<Target className="h-5 w-5" />}
        color="green"
        loading={isLoading}
      />
    </div>
  );
};

export default MetricsGrid;
export { MetricCard };