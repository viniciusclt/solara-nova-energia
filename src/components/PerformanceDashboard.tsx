/**
 * Dashboard de Performance - Solara Nova Energia
 * 
 * Visualiza métricas de cache, Web Workers e performance geral
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Activity,
  Database,
  Cpu,
  Zap,
  AlertTriangle,
  CheckCircle,
  Download,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Clock,
  MemoryStick
} from 'lucide-react';
import { usePerformanceMonitor, PerformanceMetrics, PerformanceAlert } from '@/services/PerformanceMonitor';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface PerformanceDashboardProps {
  className?: string;
}

export const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({ className }) => {
  const { metrics, alerts, clearAlerts, exportMetrics } = usePerformanceMonitor();
  const [activeTab, setActiveTab] = useState('overview');

  const handleExportMetrics = () => {
    const data = exportMetrics();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `performance-metrics-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const getAlertIcon = (type: PerformanceAlert['type']) => {
    switch (type) {
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      default:
        return <CheckCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getAlertVariant = (type: PerformanceAlert['type']) => {
    switch (type) {
      case 'error':
        return 'destructive';
      case 'warning':
        return 'default';
      case 'info':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  if (!metrics) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
            <p className="text-muted-foreground">Coletando métricas de performance...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Dashboard de Performance</h2>
          <p className="text-muted-foreground">
            Monitoramento em tempo real do sistema
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={clearAlerts}>
            Limpar Alertas
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportMetrics}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Alertas */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Alertas Ativos ({alerts.length})</h3>
          <div className="grid gap-2">
            {alerts.slice(0, 3).map((alert) => (
              <Alert key={alert.id} variant={getAlertVariant(alert.type)}>
                {getAlertIcon(alert.type)}
                <AlertTitle className="capitalize">{alert.category}</AlertTitle>
                <AlertDescription>{alert.message}</AlertDescription>
              </Alert>
            ))}
            {alerts.length > 3 && (
              <p className="text-sm text-muted-foreground">
                +{alerts.length - 3} alertas adicionais
              </p>
            )}
          </div>
        </div>
      )}

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Cache Hit Rate */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cache Hit Rate</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.cache.hitRate.toFixed(1)}%</div>
            <Progress value={metrics.cache.hitRate} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.cache.totalHits} hits de {metrics.cache.totalRequests} requests
            </p>
          </CardContent>
        </Card>

        {/* Worker Success Rate */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Worker Success</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.workers.successRate.toFixed(1)}%</div>
            <Progress value={metrics.workers.successRate} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.workers.totalCalculations} cálculos realizados
            </p>
          </CardContent>
        </Card>

        {/* Memory Usage */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uso de Memória</CardTitle>
            <MemoryStick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.performance.memoryUsage.percentage}%</div>
            <Progress value={metrics.performance.memoryUsage.percentage} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.performance.memoryUsage.used}MB de {metrics.performance.memoryUsage.total}MB
            </p>
          </CardContent>
        </Card>

        {/* Page Load Time */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo de Carregamento</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatDuration(metrics.performance.pageLoadTime)}
            </div>
            <div className="flex items-center space-x-2 mt-2">
              <Badge variant="outline" className="text-xs">
                FCP: {formatDuration(metrics.performance.firstContentfulPaint)}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Detalhadas */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="cache">Cache</TabsTrigger>
          <TabsTrigger value="workers">Workers</TabsTrigger>
          <TabsTrigger value="components">Componentes</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Web Vitals */}
            <Card>
              <CardHeader>
                <CardTitle>Web Vitals</CardTitle>
                <CardDescription>Métricas de experiência do usuário</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">First Contentful Paint</span>
                  <Badge variant={metrics.performance.firstContentfulPaint < 1500 ? 'default' : 'destructive'}>
                    {formatDuration(metrics.performance.firstContentfulPaint)}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Largest Contentful Paint</span>
                  <Badge variant={metrics.performance.largestContentfulPaint < 2500 ? 'default' : 'destructive'}>
                    {formatDuration(metrics.performance.largestContentfulPaint)}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Cumulative Layout Shift</span>
                  <Badge variant={metrics.performance.cumulativeLayoutShift < 0.1 ? 'default' : 'destructive'}>
                    {metrics.performance.cumulativeLayoutShift.toFixed(3)}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">First Input Delay</span>
                  <Badge variant={metrics.performance.firstInputDelay < 100 ? 'default' : 'destructive'}>
                    {formatDuration(metrics.performance.firstInputDelay)}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* System Status */}
            <Card>
              <CardHeader>
                <CardTitle>Status do Sistema</CardTitle>
                <CardDescription>Estado atual dos componentes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Web Workers</span>
                  <Badge variant={metrics.workers.workerSupported ? 'default' : 'destructive'}>
                    {metrics.workers.workerSupported ? 'Suportado' : 'Não Suportado'}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Cache Ativo</span>
                  <Badge variant={metrics.cache.totalRequests > 0 ? 'default' : 'secondary'}>
                    {metrics.cache.totalRequests > 0 ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Componentes Lazy</span>
                  <Badge variant="outline">
                    {metrics.components.lazyLoadedComponents} carregados
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Última Atualização</span>
                  <span className="text-sm text-muted-foreground">
                    {new Date(metrics.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="cache" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Estatísticas de Cache</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total de Requests</p>
                    <p className="text-2xl font-bold">{metrics.cache.totalRequests}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Hits</p>
                    <p className="text-2xl font-bold text-green-600">{metrics.cache.totalHits}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Misses</p>
                    <p className="text-2xl font-bold text-red-600">{metrics.cache.totalMisses}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Tempo Médio</p>
                    <p className="text-2xl font-bold">{formatDuration(metrics.cache.averageResponseTime)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Uso de Armazenamento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm">Cache em Memória</span>
                    <span className="text-sm font-medium">{formatBytes(metrics.cache.memoryUsage)}</span>
                  </div>
                  <Progress value={(metrics.cache.memoryUsage / (50 * 1024 * 1024)) * 100} />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm">IndexedDB</span>
                    <span className="text-sm font-medium">{formatBytes(metrics.cache.indexedDBUsage)}</span>
                  </div>
                  <Progress value={(metrics.cache.indexedDBUsage / (100 * 1024 * 1024)) * 100} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Missed Keys */}
          {metrics.cache.topMissedKeys.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Chaves Mais Perdidas</CardTitle>
                <CardDescription>Chaves que mais causaram cache miss</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {metrics.cache.topMissedKeys.slice(0, 5).map((key, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                      <code className="text-sm">{key}</code>
                      <Badge variant="outline">#{index + 1}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="workers" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Estatísticas de Workers</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total de Cálculos</p>
                    <p className="text-2xl font-bold">{metrics.workers.totalCalculations}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Tempo Médio</p>
                    <p className="text-2xl font-bold">{formatDuration(metrics.workers.averageCalculationTime)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Taxa de Sucesso</p>
                    <p className="text-2xl font-bold text-green-600">{metrics.workers.successRate.toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Cancelamentos</p>
                    <p className="text-2xl font-bold text-yellow-600">{metrics.workers.cancelledCalculations}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance dos Workers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm">Taxa de Sucesso</span>
                      <span className="text-sm font-medium">{metrics.workers.successRate.toFixed(1)}%</span>
                    </div>
                    <Progress value={metrics.workers.successRate} />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm">Taxa de Erro</span>
                      <span className="text-sm font-medium">{metrics.workers.errorRate.toFixed(1)}%</span>
                    </div>
                    <Progress value={metrics.workers.errorRate} className="[&>div]:bg-red-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="components" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Lazy Loading</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Componentes Carregados</p>
                    <p className="text-2xl font-bold">{metrics.components.lazyLoadedComponents}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Tempo Médio</p>
                    <p className="text-2xl font-bold">{formatDuration(metrics.components.averageLazyLoadTime)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Falhas</p>
                    <p className="text-2xl font-bold text-red-600">{metrics.components.failedLazyLoads}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Taxa de Sucesso</p>
                    <p className="text-2xl font-bold text-green-600">
                      {metrics.components.lazyLoadedComponents > 0 
                        ? ((metrics.components.lazyLoadedComponents / (metrics.components.lazyLoadedComponents + metrics.components.failedLazyLoads)) * 100).toFixed(1)
                        : 100
                      }%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Renderização</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total de Renders</p>
                    <p className="text-2xl font-bold">{metrics.components.totalRenders}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Tempo Médio</p>
                    <p className="text-2xl font-bold">{formatDuration(metrics.components.averageRenderTime)}</p>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm">Performance de Render</span>
                    <Badge variant={metrics.components.averageRenderTime < 16 ? 'default' : 'destructive'}>
                      {metrics.components.averageRenderTime < 16 ? '60+ FPS' : '< 60 FPS'}
                    </Badge>
                  </div>
                  <Progress value={Math.min((16 / Math.max(metrics.components.averageRenderTime, 1)) * 100, 100)} />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PerformanceDashboard;