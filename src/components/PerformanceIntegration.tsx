import React, { useEffect, useState } from 'react';
import { performanceMonitor, usePerformanceMonitor } from '../services/PerformanceMonitor';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { AlertTriangle, CheckCircle, Activity, TrendingUp } from 'lucide-react';

interface PerformanceIntegrationProps {
  showDashboard?: boolean;
  autoStart?: boolean;
  alertThreshold?: {
    responseTime?: number;
    memoryUsage?: number;
    errorRate?: number;
  };
}

export const PerformanceIntegration: React.FC<PerformanceIntegrationProps> = ({
  showDashboard = false,
  autoStart = true,
  alertThreshold = {
    responseTime: 1000,
    memoryUsage: 100 * 1024 * 1024, // 100MB
    errorRate: 0.05 // 5%
  }
}) => {
  const { metrics, alerts, isMonitoring } = usePerformanceMonitor();
  const [showAlerts, setShowAlerts] = useState(false);

  useEffect(() => {
    if (autoStart && !isMonitoring) {
      performanceMonitor.startMonitoring();
    }

    return () => {
      if (autoStart) {
        performanceMonitor.stopMonitoring();
      }
    };
  }, [autoStart, isMonitoring]);

  // Verificar alertas críticos
  const criticalAlerts = alerts.filter(alert => alert.severity === 'critical');
  const hasAlerts = alerts.length > 0;

  const handleToggleMonitoring = () => {
    if (isMonitoring) {
      performanceMonitor.stopMonitoring();
    } else {
      performanceMonitor.startMonitoring();
    }
  };

  const handleExportMetrics = () => {
    const data = performanceMonitor.exportMetrics();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-metrics-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!showDashboard && !hasAlerts) {
    return null;
  }

  return (
    <div className="performance-integration">
      {/* Indicador de Status */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
         <div className="flex items-center gap-2">
           {/* Status do Monitoramento */}
           <Badge 
             variant={isMonitoring ? 'default' : 'secondary'}
             className="flex items-center gap-1"
           >
             <Activity className="h-3 w-3" />
             {isMonitoring ? 'Monitorando' : 'Parado'}
           </Badge>

           {/* Alertas */}
           {hasAlerts && (
             <Badge 
               variant={criticalAlerts.length > 0 ? 'destructive' : 'secondary'}
               className="flex items-center gap-1 cursor-pointer"
               onClick={() => setShowAlerts(!showAlerts)}
             >
               <AlertTriangle className="h-3 w-3" />
               {alerts.length} alerta{alerts.length !== 1 ? 's' : ''}
             </Badge>
           )}

           {/* Performance Score */}
           {metrics.general && (
             <Badge 
               variant="outline"
               className="flex items-center gap-1"
             >
               <TrendingUp className="h-3 w-3" />
               Score: {Math.round((metrics.cache.hitRate || 0) * 100)}%
             </Badge>
           )}
         </div>
       </div>

      {/* Painel de Alertas */}
      {showAlerts && hasAlerts && (
        <div className="fixed top-16 right-4 z-50 w-80">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Alertas de Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {alerts.slice(0, 5).map((alert, index) => (
                <div 
                  key={index}
                  className={`p-2 rounded text-xs ${
                    alert.severity === 'critical' 
                      ? 'bg-red-50 text-red-700 border border-red-200'
                      : alert.severity === 'warning'
                      ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                      : 'bg-blue-50 text-blue-700 border border-blue-200'
                  }`}
                >
                  <div className="font-medium">{alert.message}</div>
                  <div className="text-xs opacity-75 mt-1">
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))}
              
              {alerts.length > 5 && (
                <div className="text-xs text-gray-500 text-center pt-2">
                  +{alerts.length - 5} alertas adicionais
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Dashboard Completo */}
      {showDashboard && (
        <div className="fixed inset-4 z-40 bg-white rounded-lg shadow-lg border overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold">Dashboard de Performance</h2>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportMetrics}
              >
                Exportar Métricas
              </Button>
              <Button
                variant={isMonitoring ? 'destructive' : 'default'}
                size="sm"
                onClick={handleToggleMonitoring}
              >
                {isMonitoring ? 'Parar' : 'Iniciar'} Monitoramento
              </Button>
            </div>
          </div>
          
          <div className="p-4 h-full overflow-auto">
            {/* Métricas Rápidas */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">Cache Hit Rate</span>
                  </div>
                  <div className="text-2xl font-bold mt-2">
                    {Math.round((metrics.cache.hitRate || 0) * 100)}%
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">Workers Ativos</span>
                  </div>
                  <div className="text-2xl font-bold mt-2">
                    {metrics.workers.totalCalculations || 0}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-purple-500" />
                    <span className="text-sm font-medium">Tempo Médio</span>
                  </div>
                  <div className="text-2xl font-bold mt-2">
                    {Math.round(metrics.cache.responseTime || 0)}ms
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    <span className="text-sm font-medium">Alertas</span>
                  </div>
                  <div className="text-2xl font-bold mt-2">
                    {alerts.length}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Aqui seria integrado o PerformanceDashboard completo */}
            <div className="text-center text-gray-500 py-8">
              Dashboard detalhado será carregado aqui...
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceIntegration;

// Hook para integração fácil em qualquer componente
export const usePerformanceIntegration = (options: {
  trackComponent?: string;
  trackRenders?: boolean;
  trackErrors?: boolean;
} = {}) => {
  const { trackComponent, trackRenders = true, trackErrors = true } = options;
  
  useEffect(() => {
    if (!trackComponent) return;
    
    const startTime = performance.now();
    
    return () => {
      if (trackRenders) {
        const renderTime = performance.now() - startTime;
        performanceMonitor.trackComponentRender(trackComponent, renderTime);
      }
    };
  }, [trackComponent, trackRenders]);
  
  const trackError = React.useCallback((error: Error, context?: string) => {
    if (trackErrors) {
      console.error(`[${trackComponent || 'Component'}] Error:`, error);
      // Aqui poderia integrar com um sistema de tracking de erros
    }
  }, [trackComponent, trackErrors]);
  
  const trackCustomMetric = React.useCallback((metricName: string, value: number) => {
    // Permite tracking de métricas customizadas
    if (trackComponent) {
      performanceMonitor.trackComponentRender(`${trackComponent}_${metricName}`, value);
    }
  }, [trackComponent]);
  
  return {
    trackError,
    trackCustomMetric
  };
};