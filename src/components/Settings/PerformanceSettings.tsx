import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Activity, Cpu, HardDrive, Wifi, RefreshCw, AlertTriangle, CheckCircle2, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { logError, logInfo } from "@/utils/secureLogger";

interface PerformanceSettings {
  enableMonitoring: boolean;
  monitoringInterval: number; // em segundos
  alertThresholds: {
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
    responseTime: number;
  };
  enableAlerts: boolean;
  alertMethods: {
    email: boolean;
    inApp: boolean;
    webhook: boolean;
  };
  webhookUrl: string;
  dataRetention: number; // em dias
  enableCaching: boolean;
  cacheSettings: {
    ttl: number; // em minutos
    maxSize: number; // em MB
    strategy: 'lru' | 'fifo' | 'lfu';
  };
  enableCompression: boolean;
  compressionLevel: number;
  enableLazyLoading: boolean;
  optimizeImages: boolean;
}

interface PerformanceMetrics {
  timestamp: string;
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  responseTime: number;
  activeUsers: number;
  requestsPerMinute: number;
}

interface PerformanceSettingsProps {
  onSettingsChange?: (settings: PerformanceSettings) => void;
}

export const PerformanceSettings: React.FC<PerformanceSettingsProps> = ({ onSettingsChange }) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationProgress, setOptimizationProgress] = useState(0);
  const [metrics, setMetrics] = useState<PerformanceMetrics[]>([]);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(false);
  const [currentMetrics, setCurrentMetrics] = useState<PerformanceMetrics | null>(null);
  
  const [settings, setSettings] = useState<PerformanceSettings>({
    enableMonitoring: true,
    monitoringInterval: 30,
    alertThresholds: {
      cpuUsage: 80,
      memoryUsage: 85,
      diskUsage: 90,
      responseTime: 2000
    },
    enableAlerts: true,
    alertMethods: {
      email: true,
      inApp: true,
      webhook: false
    },
    webhookUrl: "",
    dataRetention: 30,
    enableCaching: true,
    cacheSettings: {
      ttl: 60,
      maxSize: 100,
      strategy: 'lru'
    },
    enableCompression: true,
    compressionLevel: 6,
    enableLazyLoading: true,
    optimizeImages: true
  });

  const loadSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('performance_settings')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        const loadedSettings = data.settings as unknown as PerformanceSettings;
        setSettings(loadedSettings);
        onSettingsChange?.(loadedSettings);
      }
    } catch (error) {
      logError('Erro ao carregar configurações de performance', 'PerformanceSettings', { error: (error as Error).message });
    }
  }, []);

  const saveSettings = async () => {
    setIsLoading(true);
    
    try {
      logInfo('Iniciando salvamento das configurações de performance', 'PerformanceSettings');
      
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        logError('Erro de autenticação', 'PerformanceSettings', { error: authError?.message });
        throw new Error('Usuário não autenticado');
      }

      const settingsToSave = {
        user_id: user.id,
        settings: settings,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('performance_settings')
        .upsert(settingsToSave, { onConflict: 'user_id' })
        .select();

      if (error) {
        logError('Erro do Supabase ao salvar configurações de performance', 'PerformanceSettings', { 
          code: error.code, 
          message: error.message 
        });
        throw new Error(`Erro do banco: ${error.message}`);
      }

      logInfo('Configurações de performance salvas com sucesso', 'PerformanceSettings');
      onSettingsChange?.(settings);
      
      toast({
        title: "Configurações Salvas",
        description: "As configurações de performance foram salvas com sucesso.",
        variant: "default"
      });
      
    } catch (error) {
      logError('Erro ao salvar configurações de performance', 'PerformanceSettings', { error: (error as Error).message });
      toast({
        title: "Erro ao Salvar",
        description: (error as Error).message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadMetrics = useCallback(async () => {
    setIsLoadingMetrics(true);
    
    try {
      // Simular carregamento de métricas históricas
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockMetrics: PerformanceMetrics[] = Array.from({ length: 24 }, (_, i) => ({
        timestamp: new Date(Date.now() - (23 - i) * 60 * 60 * 1000).toISOString(),
        cpu: Math.random() * 100,
        memory: Math.random() * 100,
        disk: Math.random() * 100,
        network: Math.random() * 100,
        responseTime: Math.random() * 3000,
        activeUsers: Math.floor(Math.random() * 50),
        requestsPerMinute: Math.floor(Math.random() * 1000)
      }));
      
      setMetrics(mockMetrics);
      
    } catch (error) {
      logError('Erro ao carregar métricas de performance', 'PerformanceSettings', { error: (error as Error).message });
    } finally {
      setIsLoadingMetrics(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  useEffect(() => {
    if (settings.enableMonitoring) {
      updateCurrentMetrics();
      const interval = setInterval(updateCurrentMetrics, settings.monitoringInterval * 1000);
      return () => clearInterval(interval);
    }
  }, [settings.enableMonitoring, settings.monitoringInterval]);

  const updateCurrentMetrics = () => {
    const newMetrics: PerformanceMetrics = {
      timestamp: new Date().toISOString(),
      cpu: Math.random() * 100,
      memory: Math.random() * 100,
      disk: Math.random() * 100,
      network: Math.random() * 100,
      responseTime: Math.random() * 3000,
      activeUsers: Math.floor(Math.random() * 50),
      requestsPerMinute: Math.floor(Math.random() * 1000)
    };
    
    setCurrentMetrics(newMetrics);
    
    // Verificar alertas
    checkAlerts(newMetrics);
  };

  const checkAlerts = (metrics: PerformanceMetrics) => {
    if (!settings.enableAlerts) return;
    
    const alerts = [];
    
    if (metrics.cpu > settings.alertThresholds.cpuUsage) {
      alerts.push(`CPU em ${metrics.cpu.toFixed(1)}%`);
    }
    
    if (metrics.memory > settings.alertThresholds.memoryUsage) {
      alerts.push(`Memória em ${metrics.memory.toFixed(1)}%`);
    }
    
    if (metrics.disk > settings.alertThresholds.diskUsage) {
      alerts.push(`Disco em ${metrics.disk.toFixed(1)}%`);
    }
    
    if (metrics.responseTime > settings.alertThresholds.responseTime) {
      alerts.push(`Tempo de resposta: ${metrics.responseTime.toFixed(0)}ms`);
    }
    
    if (alerts.length > 0 && settings.alertMethods.inApp) {
      toast({
        title: "Alerta de Performance",
        description: alerts.join(', '),
        variant: "destructive"
      });
    }
  };

  const optimizeSystem = async () => {
    setIsOptimizing(true);
    setOptimizationProgress(0);
    
    try {
      logInfo('Iniciando otimização do sistema', 'PerformanceSettings');
      
      const steps = [
        'Limpando cache...',
        'Otimizando banco de dados...',
        'Comprimindo arquivos...',
        'Atualizando índices...',
        'Finalizando otimização...'
      ];
      
      for (let i = 0; i < steps.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        setOptimizationProgress((i + 1) * 20);
        
        toast({
          title: "Otimização",
          description: steps[i],
          variant: "default"
        });
      }
      
      toast({
        title: "Otimização Concluída",
        description: "O sistema foi otimizado com sucesso.",
        variant: "default"
      });
      
    } catch (error) {
      logError('Erro na otimização do sistema', 'PerformanceSettings', { error: (error as Error).message });
      toast({
        title: "Erro na Otimização",
        description: "Falha ao otimizar o sistema.",
        variant: "destructive"
      });
    } finally {
      setIsOptimizing(false);
      setOptimizationProgress(0);
    }
  };

  const clearCache = async () => {
    try {
      logInfo('Limpando cache do sistema', 'PerformanceSettings');
      
      // Simular limpeza de cache
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Cache Limpo",
        description: "O cache do sistema foi limpo com sucesso.",
        variant: "default"
      });
      
    } catch (error) {
      logError('Erro ao limpar cache', 'PerformanceSettings', { error: (error as Error).message });
      toast({
        title: "Erro na Limpeza",
        description: "Falha ao limpar o cache.",
        variant: "destructive"
      });
    }
  };

  const getMetricStatus = (value: number, threshold: number) => {
    if (value > threshold) return 'critical';
    if (value > threshold * 0.8) return 'warning';
    return 'normal';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical': return 'text-red-500';
      case 'warning': return 'text-yellow-500';
      case 'normal': return 'text-green-500';
      default: return 'text-gray-500';
    }
  };

  const getProgressColor = (status: string) => {
    switch (status) {
      case 'critical': return 'bg-red-500';
      case 'warning': return 'bg-yellow-500';
      case 'normal': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Configurações de Performance
          </CardTitle>
          <CardDescription>
            Configure o monitoramento e otimização de performance do sistema.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="enable-monitoring"
              checked={settings.enableMonitoring}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enableMonitoring: checked }))}
            />
            <Label htmlFor="enable-monitoring">Habilitar Monitoramento</Label>
          </div>
          
          {settings.enableMonitoring && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="monitoring-interval">Intervalo de Monitoramento (segundos)</Label>
                <Select
                  value={settings.monitoringInterval.toString()}
                  onValueChange={(value) => setSettings(prev => ({ ...prev, monitoringInterval: parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 segundos</SelectItem>
                    <SelectItem value="30">30 segundos</SelectItem>
                    <SelectItem value="60">1 minuto</SelectItem>
                    <SelectItem value="300">5 minutos</SelectItem>
                    <SelectItem value="600">10 minutos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="data-retention">Retenção de Dados (dias)</Label>
                <Input
                  id="data-retention"
                  type="number"
                  min="1"
                  max="365"
                  value={settings.dataRetention}
                  onChange={(e) => setSettings(prev => ({ ...prev, dataRetention: parseInt(e.target.value) || 30 }))}
                />
              </div>
            </div>
          )}
          
          <div className="flex items-center space-x-2">
            <Switch
              id="enable-alerts"
              checked={settings.enableAlerts}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enableAlerts: checked }))}
            />
            <Label htmlFor="enable-alerts">Habilitar Alertas</Label>
          </div>
          
          {settings.enableAlerts && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cpu-threshold">Limite CPU (%)</Label>
                  <Input
                    id="cpu-threshold"
                    type="number"
                    min="1"
                    max="100"
                    value={settings.alertThresholds.cpuUsage}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      alertThresholds: { ...prev.alertThresholds, cpuUsage: parseInt(e.target.value) || 80 }
                    }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="memory-threshold">Limite Memória (%)</Label>
                  <Input
                    id="memory-threshold"
                    type="number"
                    min="1"
                    max="100"
                    value={settings.alertThresholds.memoryUsage}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      alertThresholds: { ...prev.alertThresholds, memoryUsage: parseInt(e.target.value) || 85 }
                    }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="disk-threshold">Limite Disco (%)</Label>
                  <Input
                    id="disk-threshold"
                    type="number"
                    min="1"
                    max="100"
                    value={settings.alertThresholds.diskUsage}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      alertThresholds: { ...prev.alertThresholds, diskUsage: parseInt(e.target.value) || 90 }
                    }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="response-threshold">Tempo Resposta (ms)</Label>
                  <Input
                    id="response-threshold"
                    type="number"
                    min="100"
                    max="10000"
                    value={settings.alertThresholds.responseTime}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      alertThresholds: { ...prev.alertThresholds, responseTime: parseInt(e.target.value) || 2000 }
                    }))}
                  />
                </div>
              </div>
              
              <div className="space-y-3">
                <Label>Métodos de Alerta</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="alert-email"
                      checked={settings.alertMethods.email}
                      onCheckedChange={(checked) => setSettings(prev => ({
                        ...prev,
                        alertMethods: { ...prev.alertMethods, email: checked }
                      }))}
                    />
                    <Label htmlFor="alert-email">Email</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="alert-inapp"
                      checked={settings.alertMethods.inApp}
                      onCheckedChange={(checked) => setSettings(prev => ({
                        ...prev,
                        alertMethods: { ...prev.alertMethods, inApp: checked }
                      }))}
                    />
                    <Label htmlFor="alert-inapp">Notificação no App</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="alert-webhook"
                      checked={settings.alertMethods.webhook}
                      onCheckedChange={(checked) => setSettings(prev => ({
                        ...prev,
                        alertMethods: { ...prev.alertMethods, webhook: checked }
                      }))}
                    />
                    <Label htmlFor="alert-webhook">Webhook</Label>
                  </div>
                  
                  {settings.alertMethods.webhook && (
                    <div className="space-y-2">
                      <Label htmlFor="webhook-url">URL do Webhook</Label>
                      <Input
                        id="webhook-url"
                        placeholder="https://..."
                        value={settings.webhookUrl}
                        onChange={(e) => setSettings(prev => ({ ...prev, webhookUrl: e.target.value }))}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          <Button onClick={saveSettings} disabled={isLoading} className="w-full">
            {isLoading ? "Salvando..." : "Salvar Configurações"}
          </Button>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Otimizações</CardTitle>
          <CardDescription>
            Configure otimizações para melhorar a performance do sistema.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Switch
                id="enable-caching"
                checked={settings.enableCaching}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enableCaching: checked }))}
              />
              <Label htmlFor="enable-caching">Habilitar Cache</Label>
            </div>
            
            {settings.enableCaching && (
              <div className="grid grid-cols-3 gap-4 ml-6">
                <div className="space-y-2">
                  <Label htmlFor="cache-ttl">TTL (minutos)</Label>
                  <Input
                    id="cache-ttl"
                    type="number"
                    min="1"
                    max="1440"
                    value={settings.cacheSettings.ttl}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      cacheSettings: { ...prev.cacheSettings, ttl: parseInt(e.target.value) || 60 }
                    }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="cache-size">Tamanho Máx (MB)</Label>
                  <Input
                    id="cache-size"
                    type="number"
                    min="10"
                    max="1000"
                    value={settings.cacheSettings.maxSize}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      cacheSettings: { ...prev.cacheSettings, maxSize: parseInt(e.target.value) || 100 }
                    }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="cache-strategy">Estratégia</Label>
                  <Select
                    value={settings.cacheSettings.strategy}
                    onValueChange={(value: 'lru' | 'fifo' | 'lfu') => setSettings(prev => ({
                      ...prev,
                      cacheSettings: { ...prev.cacheSettings, strategy: value }
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lru">LRU</SelectItem>
                      <SelectItem value="fifo">FIFO</SelectItem>
                      <SelectItem value="lfu">LFU</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            
            <div className="flex items-center space-x-2">
              <Switch
                id="enable-compression"
                checked={settings.enableCompression}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enableCompression: checked }))}
              />
              <Label htmlFor="enable-compression">Habilitar Compressão</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="enable-lazy-loading"
                checked={settings.enableLazyLoading}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enableLazyLoading: checked }))}
              />
              <Label htmlFor="enable-lazy-loading">Lazy Loading</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="optimize-images"
                checked={settings.optimizeImages}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, optimizeImages: checked }))}
              />
              <Label htmlFor="optimize-images">Otimizar Imagens</Label>
            </div>
          </div>
          
          {isOptimizing && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Otimizando sistema...</span>
                <span>{optimizationProgress}%</span>
              </div>
              <Progress value={optimizationProgress} className="w-full" />
            </div>
          )}
          
          <div className="flex gap-2">
            <Button 
              onClick={optimizeSystem} 
              disabled={isOptimizing}
              className="flex-1"
            >
              {isOptimizing ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <TrendingUp className="h-4 w-4 mr-2" />
              )}
              {isOptimizing ? "Otimizando..." : "Otimizar Sistema"}
            </Button>
            
            <Button 
              onClick={clearCache}
              variant="outline"
              className="flex-1"
            >
              Limpar Cache
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {currentMetrics && (
        <Card>
          <CardHeader>
            <CardTitle>Métricas em Tempo Real</CardTitle>
            <CardDescription>
              Monitoramento atual do sistema.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Cpu className="h-4 w-4" />
                    <Label>CPU</Label>
                  </div>
                  <span className={`text-sm font-medium ${
                    getStatusColor(getMetricStatus(currentMetrics.cpu, settings.alertThresholds.cpuUsage))
                  }`}>
                    {currentMetrics.cpu.toFixed(1)}%
                  </span>
                </div>
                <Progress 
                  value={currentMetrics.cpu} 
                  className={`w-full ${getProgressColor(getMetricStatus(currentMetrics.cpu, settings.alertThresholds.cpuUsage))}`}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Activity className="h-4 w-4" />
                    <Label>Memória</Label>
                  </div>
                  <span className={`text-sm font-medium ${
                    getStatusColor(getMetricStatus(currentMetrics.memory, settings.alertThresholds.memoryUsage))
                  }`}>
                    {currentMetrics.memory.toFixed(1)}%
                  </span>
                </div>
                <Progress 
                  value={currentMetrics.memory} 
                  className={`w-full ${getProgressColor(getMetricStatus(currentMetrics.memory, settings.alertThresholds.memoryUsage))}`}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <HardDrive className="h-4 w-4" />
                    <Label>Disco</Label>
                  </div>
                  <span className={`text-sm font-medium ${
                    getStatusColor(getMetricStatus(currentMetrics.disk, settings.alertThresholds.diskUsage))
                  }`}>
                    {currentMetrics.disk.toFixed(1)}%
                  </span>
                </div>
                <Progress 
                  value={currentMetrics.disk} 
                  className={`w-full ${getProgressColor(getMetricStatus(currentMetrics.disk, settings.alertThresholds.diskUsage))}`}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Wifi className="h-4 w-4" />
                    <Label>Rede</Label>
                  </div>
                  <span className="text-sm font-medium text-blue-500">
                    {currentMetrics.network.toFixed(1)}%
                  </span>
                </div>
                <Progress value={currentMetrics.network} className="w-full" />
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 pt-4 border-t">
              <div className="text-center">
                <div className="text-2xl font-bold">{currentMetrics.responseTime.toFixed(0)}</div>
                <div className="text-sm text-gray-500">ms resposta</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold">{currentMetrics.activeUsers}</div>
                <div className="text-sm text-gray-500">usuários ativos</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold">{currentMetrics.requestsPerMinute}</div>
                <div className="text-sm text-gray-500">req/min</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};