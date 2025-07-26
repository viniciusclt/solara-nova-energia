import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  Activity,
  Cpu,
  HardDrive,
  Wifi,
  Clock,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Monitor,
  Database,
  Globe,
  Zap,
  BarChart3,
  PieChart as PieChartIcon,
  Settings
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PerformanceMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  status: 'good' | 'warning' | 'critical';
  threshold: {
    warning: number;
    critical: number;
  };
  trend: 'up' | 'down' | 'stable';
  change: number;
}

interface SystemHealth {
  overall_status: 'healthy' | 'warning' | 'critical';
  uptime: number;
  last_check: string;
  metrics: PerformanceMetric[];
}

interface PerformanceData {
  timestamp: string;
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  network_latency: number;
  active_users: number;
  database_connections: number;
  response_time: number;
}

interface ErrorLog {
  id: string;
  timestamp: string;
  level: 'error' | 'warning' | 'info';
  message: string;
  component: string;
  user_id?: string;
  stack_trace?: string;
}

export function PerformanceMonitor() {
  const { user, profile, hasPermission } = useAuth();
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30); // segundos
  const [timeRange, setTimeRange] = useState('1h');

  // Gerar dados mock para demonstração
  const generateMockData = useCallback(() => {
    const now = new Date();
    const data: PerformanceData[] = [];
    const hours = timeRange === '1h' ? 1 : timeRange === '6h' ? 6 : 24;
    const points = hours * 12; // 1 ponto a cada 5 minutos

    for (let i = points; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * 5 * 60 * 1000);
      data.push({
        timestamp: timestamp.toISOString(),
        cpu_usage: Math.random() * 80 + 10,
        memory_usage: Math.random() * 70 + 20,
        disk_usage: Math.random() * 60 + 30,
        network_latency: Math.random() * 100 + 50,
        active_users: Math.floor(Math.random() * 50 + 10),
        database_connections: Math.floor(Math.random() * 20 + 5),
        response_time: Math.random() * 500 + 100
      });
    }

    return data;
  }, [timeRange]);

  const generateMockHealth = useCallback((): SystemHealth => {
    const metrics: PerformanceMetric[] = [
      {
        id: 'cpu',
        name: 'CPU Usage',
        value: Math.random() * 80 + 10,
        unit: '%',
        status: 'good',
        threshold: { warning: 70, critical: 90 },
        trend: 'stable',
        change: Math.random() * 10 - 5
      },
      {
        id: 'memory',
        name: 'Memory Usage',
        value: Math.random() * 70 + 20,
        unit: '%',
        status: 'good',
        threshold: { warning: 80, critical: 95 },
        trend: 'up',
        change: Math.random() * 5
      },
      {
        id: 'disk',
        name: 'Disk Usage',
        value: Math.random() * 60 + 30,
        unit: '%',
        status: 'good',
        threshold: { warning: 85, critical: 95 },
        trend: 'down',
        change: -Math.random() * 3
      },
      {
        id: 'response_time',
        name: 'Response Time',
        value: Math.random() * 500 + 100,
        unit: 'ms',
        status: 'good',
        threshold: { warning: 1000, critical: 2000 },
        trend: 'stable',
        change: Math.random() * 50 - 25
      },
      {
        id: 'active_users',
        name: 'Active Users',
        value: Math.floor(Math.random() * 50 + 10),
        unit: 'users',
        status: 'good',
        threshold: { warning: 100, critical: 150 },
        trend: 'up',
        change: Math.random() * 10
      },
      {
        id: 'db_connections',
        name: 'DB Connections',
        value: Math.floor(Math.random() * 20 + 5),
        unit: 'conn',
        status: 'good',
        threshold: { warning: 50, critical: 80 },
        trend: 'stable',
        change: Math.random() * 5 - 2.5
      }
    ];

    // Determinar status baseado nos valores
    metrics.forEach(metric => {
      if (metric.value >= metric.threshold.critical) {
        metric.status = 'critical';
      } else if (metric.value >= metric.threshold.warning) {
        metric.status = 'warning';
      }
    });

    const criticalCount = metrics.filter(m => m.status === 'critical').length;
    const warningCount = metrics.filter(m => m.status === 'warning').length;

    return {
      overall_status: criticalCount > 0 ? 'critical' : warningCount > 0 ? 'warning' : 'healthy',
      uptime: Math.random() * 30 + 95, // 95-99.9%
      last_check: new Date().toISOString(),
      metrics
    };
  }, []);

  const generateMockErrors = useCallback((): ErrorLog[] => {
    const errors: ErrorLog[] = [];
    const errorTypes = [
      { level: 'error' as const, message: 'Database connection timeout', component: 'Database' },
      { level: 'warning' as const, message: 'High memory usage detected', component: 'System' },
      { level: 'error' as const, message: 'Failed to load user profile', component: 'Auth' },
      { level: 'warning' as const, message: 'Slow API response time', component: 'API' },
      { level: 'info' as const, message: 'System backup completed', component: 'Backup' }
    ];

    for (let i = 0; i < 10; i++) {
      const errorType = errorTypes[Math.floor(Math.random() * errorTypes.length)];
      errors.push({
        id: `error_${i}`,
        timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString(),
        ...errorType,
        user_id: Math.random() > 0.5 ? 'user_123' : undefined
      });
    }

    return errors.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, []);

  // Carregar dados
  const loadData = useCallback(async () => {
    if (!user || !profile?.company_id) return;

    try {
      setLoading(true);

      // Simular carregamento de dados (implementar com APIs reais)
      await new Promise(resolve => setTimeout(resolve, 1000));

      setSystemHealth(generateMockHealth());
      setPerformanceData(generateMockData());
      setErrorLogs(generateMockErrors());
    } catch (error) {
      console.error('Erro ao carregar dados de performance:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados de performance',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user, profile, generateMockHealth, generateMockData, generateMockErrors]);

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadData();
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, loadData]);

  // Carregar dados iniciais
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Cores para os gráficos
  const colors = {
    primary: '#3b82f6',
    secondary: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#6366f1'
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'good': return 'default';
      case 'warning': return 'secondary';
      case 'critical': return 'destructive';
      default: return 'outline';
    }
  };

  const formatValue = (value: number, unit: string) => {
    if (unit === '%') {
      return `${value.toFixed(1)}%`;
    } else if (unit === 'ms') {
      return `${value.toFixed(0)}ms`;
    } else {
      return `${value.toFixed(0)} ${unit}`;
    }
  };

  // Verificar permissões
  if (!hasPermission('admin') && !hasPermission('monitor_system')) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <Monitor className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Acesso Restrito</h3>
            <p className="text-muted-foreground">
              Você não tem permissão para acessar o monitor de performance.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com controles */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Monitor de Performance</h2>
          <p className="text-muted-foreground">
            Monitoramento em tempo real do sistema
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">1 hora</SelectItem>
              <SelectItem value="6h">6 horas</SelectItem>
              <SelectItem value="24h">24 horas</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            {autoRefresh ? 'Auto' : 'Manual'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Status Geral */}
      {systemHealth && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${
                  systemHealth.overall_status === 'healthy' ? 'bg-green-100 text-green-600' :
                  systemHealth.overall_status === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                  'bg-red-100 text-red-600'
                }`}>
                  {systemHealth.overall_status === 'healthy' ? <CheckCircle className="h-6 w-6" /> :
                   systemHealth.overall_status === 'warning' ? <AlertTriangle className="h-6 w-6" /> :
                   <AlertTriangle className="h-6 w-6" />}
                </div>
                <div>
                  <h3 className="text-lg font-semibold">
                    Sistema {systemHealth.overall_status === 'healthy' ? 'Saudável' :
                            systemHealth.overall_status === 'warning' ? 'Com Alertas' : 'Crítico'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Uptime: {systemHealth.uptime.toFixed(2)}% • Última verificação: {format(new Date(systemHealth.last_check), 'HH:mm:ss', { locale: ptBR })}
                  </p>
                </div>
              </div>
              <Badge variant={getStatusBadgeVariant(systemHealth.overall_status)}>
                {systemHealth.overall_status === 'healthy' ? 'Operacional' :
                 systemHealth.overall_status === 'warning' ? 'Atenção' : 'Crítico'}
              </Badge>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {systemHealth.metrics.map((metric) => (
                <div key={metric.id} className="text-center">
                  <div className={`text-2xl font-bold ${getStatusColor(metric.status)}`}>
                    {formatValue(metric.value, metric.unit)}
                  </div>
                  <div className="text-sm text-muted-foreground">{metric.name}</div>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    {metric.trend === 'up' ? <TrendingUp className="h-3 w-3 text-green-500" /> :
                     metric.trend === 'down' ? <TrendingDown className="h-3 w-3 text-red-500" /> :
                     <div className="h-3 w-3" />}
                    <span className={`text-xs ${
                      metric.change > 0 ? 'text-green-600' :
                      metric.change < 0 ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {metric.change > 0 ? '+' : ''}{metric.change.toFixed(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="errors">Logs de Erro</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
        </TabsList>

        {/* Visão Geral */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Gráfico de CPU e Memória */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cpu className="h-5 w-5" />
                  CPU e Memória
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="timestamp" 
                      tickFormatter={(value) => format(new Date(value), 'HH:mm')}
                    />
                    <YAxis domain={[0, 100]} />
                    <Tooltip 
                      labelFormatter={(value) => format(new Date(value), 'dd/MM HH:mm')}
                      formatter={(value: number, name: string) => [
                        `${value.toFixed(1)}%`,
                        name === 'cpu_usage' ? 'CPU' : 'Memória'
                      ]}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="cpu_usage" 
                      stroke={colors.primary} 
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="memory_usage" 
                      stroke={colors.secondary} 
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Gráfico de Usuários Ativos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Usuários Ativos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="timestamp" 
                      tickFormatter={(value) => format(new Date(value), 'HH:mm')}
                    />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(value) => format(new Date(value), 'dd/MM HH:mm')}
                      formatter={(value: number) => [`${value} usuários`, 'Ativos']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="active_users" 
                      stroke={colors.info} 
                      fill={colors.info}
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Performance Detalhada */}
        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Tempo de Resposta */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Tempo de Resposta
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="timestamp" 
                      tickFormatter={(value) => format(new Date(value), 'HH:mm')}
                    />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(value) => format(new Date(value), 'dd/MM HH:mm')}
                      formatter={(value: number) => [`${value.toFixed(0)}ms`, 'Tempo de Resposta']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="response_time" 
                      stroke={colors.warning} 
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Conexões do Banco */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Conexões do Banco
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={performanceData.slice(-20)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="timestamp" 
                      tickFormatter={(value) => format(new Date(value), 'HH:mm')}
                    />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(value) => format(new Date(value), 'dd/MM HH:mm')}
                      formatter={(value: number) => [`${value} conexões`, 'Ativas']}
                    />
                    <Bar 
                      dataKey="database_connections" 
                      fill={colors.secondary}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Logs de Erro */}
        <TabsContent value="errors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Logs de Erro Recentes
              </CardTitle>
              <CardDescription>
                Últimos erros e avisos do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {errorLogs.map((error) => (
                  <div key={error.id} className="flex items-start gap-3 p-3 border rounded-lg">
                    <div className={`p-1 rounded-full ${
                      error.level === 'error' ? 'bg-red-100 text-red-600' :
                      error.level === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                      'bg-blue-100 text-blue-600'
                    }`}>
                      <AlertTriangle className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={error.level === 'error' ? 'destructive' : error.level === 'warning' ? 'secondary' : 'default'}>
                          {error.level.toUpperCase()}
                        </Badge>
                        <span className="text-sm text-muted-foreground">{error.component}</span>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(error.timestamp), 'dd/MM HH:mm:ss', { locale: ptBR })}
                        </span>
                      </div>
                      <p className="text-sm">{error.message}</p>
                      {error.user_id && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Usuário: {error.user_id}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configurações */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configurações de Monitoramento
              </CardTitle>
              <CardDescription>
                Configure as opções de monitoramento e alertas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Intervalo de Atualização</label>
                  <Select value={refreshInterval.toString()} onValueChange={(value) => setRefreshInterval(parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10 segundos</SelectItem>
                      <SelectItem value="30">30 segundos</SelectItem>
                      <SelectItem value="60">1 minuto</SelectItem>
                      <SelectItem value="300">5 minutos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  As configurações avançadas de monitoramento estão em desenvolvimento.
                  Por enquanto, apenas o monitoramento básico está disponível.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}