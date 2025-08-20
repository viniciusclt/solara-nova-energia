import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, RefreshCw, Calendar, TrendingUp, Users, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDashboard, useQuickStats, useRecentActivity, useDashboardFilters } from '@/hooks/useDashboard';
import { MetricsGrid, ChartWidget, ActivityFeed, QuickActions } from '@/components/dashboard';

export default function DashboardHome() {
  const { user } = useAuth();
  const { filters, updateFilters } = useDashboardFilters();
  const { data: quickStats } = useQuickStats();
  const { data: recentActivity } = useRecentActivity();
  
  const {
    data: dashboardData,
    loading: dashboardLoading,
    error: dashboardError,
    refresh: refreshDashboard,
    refreshState: refreshStatus,
    exportData
  } = useDashboard(filters);

  const handleExport = async () => {
    try {
      await exportData('xlsx');
    } catch (error) {
      console.error('Erro ao exportar dados:', error);
    }
  };

  const handleRefresh = async () => {
    try {
      await refreshDashboard();
    } catch (error) {
      console.error('Erro ao atualizar dados:', error);
    }
  };

  const handleDateFilter = (days: number) => {
    const now = new Date();
    const start = new Date();
    start.setDate(now.getDate() - days);
    
    updateFilters({
      dateRange: {
        start: start.toISOString(),
        end: now.toISOString()
      }
    });
  };

  const getWelcomeMessage = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {getWelcomeMessage()}, {user?.name || 'Usuário'}!
          </h1>
          <p className="text-gray-600 mt-1">
            Aqui está um resumo das suas atividades e métricas.
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Exportar</span>
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshStatus === 'refreshing'}
            className="flex items-center space-x-2"
          >
            <RefreshCw className={cn(
              "h-4 w-4",
              refreshStatus === 'refreshing' && "animate-spin"
            )} />
            <span>Atualizar</span>
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-gray-700">Período:</span>
        <Button
          variant={filters?.dateRange ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleDateFilter(7)}
        >
          7 dias
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleDateFilter(30)}
        >
          30 dias
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleDateFilter(90)}
        >
          90 dias
        </Button>
      </div>

      {dashboardError && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600">Erro ao carregar dados: {dashboardError.message}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{quickStats?.totalLeads || 0}</div>
            <p className="text-xs text-muted-foreground">
              +{quickStats?.newLeadsThisMonth || 0} este mês
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Propostas Ativas</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{quickStats?.activeProposals || 0}</div>
            <p className="text-xs text-muted-foreground">
              {quickStats?.proposalConversionRate || 0}% taxa de conversão
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Potência Instalada</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{quickStats?.totalPower || 0} kWp</div>
            <p className="text-xs text-muted-foreground">
              +{quickStats?.powerThisMonth || 0} kWp este mês
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Estimada</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {quickStats?.estimatedRevenue?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">
              +{quickStats?.revenueGrowth || 0}% vs mês anterior
            </p>
          </CardContent>
        </Card>
      </div>

      {dashboardData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MetricsGrid data={dashboardData.metrics} loading={dashboardLoading} />
          <div className="space-y-6">
            {dashboardData.charts && dashboardData.charts.length > 0 ? (
              dashboardData.charts.map((chart) => (
                <ChartWidget 
                  key={chart.id} 
                  data={chart} 
                  loading={dashboardLoading} 
                />
              ))
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                <p>Nenhum gráfico disponível</p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ActivityFeed activities={recentActivity} loading={dashboardLoading} />
        </div>
        <div>
          <QuickActions onRefresh={handleRefresh} onExport={handleExport} />
        </div>
      </div>
    </div>
  );
}
