import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Activity,
  Settings,
  Zap,
  Eye,
  Clock,
  MemoryStick,
  Gauge,
  RefreshCw
} from 'lucide-react';
import { PerformanceMetrics, PerformanceConfig } from '../hooks/usePerformanceOptimization';

// ============================================================================
// INTERFACES
// ============================================================================

export interface PerformanceMonitorProps {
  metrics: PerformanceMetrics;
  config: PerformanceConfig;
  onConfigChange: (config: Partial<PerformanceConfig>) => void;
  onForceUpdate: () => void;
  isLoading?: boolean;
  loadingProgress?: number;
  virtualizationStats?: {
    totalNodes: number;
    visibleNodes: number;
    nodeReduction: number;
    totalEdges: number;
    visibleEdges: number;
    edgeReduction: number;
  };
}

// ============================================================================
// UTILITÁRIOS
// ============================================================================

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getPerformanceColor(value: number, thresholds: { good: number; warning: number }): string {
  if (value <= thresholds.good) return 'text-green-600';
  if (value <= thresholds.warning) return 'text-yellow-600';
  return 'text-red-600';
}

function getPerformanceBadgeVariant(value: number, thresholds: { good: number; warning: number }) {
  if (value <= thresholds.good) return 'default';
  if (value <= thresholds.warning) return 'secondary';
  return 'destructive';
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export function PerformanceMonitor({
  metrics,
  config,
  onConfigChange,
  onForceUpdate,
  isLoading = false,
  loadingProgress = 0,
  virtualizationStats
}: PerformanceMonitorProps) {
  const [showSettings, setShowSettings] = useState(false);
  
  // ============================================================================
  // HANDLERS
  // ============================================================================
  
  const handleConfigChange = (key: keyof PerformanceConfig, value: any) => {
    onConfigChange({ [key]: value });
  };
  
  // ============================================================================
  // MÉTRICAS FORMATADAS
  // ============================================================================
  
  const formattedMetrics = {
    renderTime: `${metrics.renderTime.toFixed(1)}ms`,
    memoryUsage: formatBytes(metrics.memoryUsage),
    fps: `${metrics.fps} FPS`,
    efficiency: `${((metrics.visibleNodes / metrics.totalNodes) * 100).toFixed(1)}%`
  };
  
  const performanceThresholds = {
    renderTime: { good: 16, warning: 33 }, // 60fps = 16ms, 30fps = 33ms
    fps: { good: 45, warning: 25 },
    memoryUsage: { good: 50 * 1024 * 1024, warning: 100 * 1024 * 1024 } // 50MB, 100MB
  };
  
  // ============================================================================
  // RENDER
  // ============================================================================
  
  return (
    <TooltipProvider>
      <Card className="w-80">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Performance Monitor
            </CardTitle>
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onForceUpdate}
                    disabled={isLoading}
                  >
                    <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Forçar atualização</p>
                </TooltipContent>
              </Tooltip>
              
              <Dialog open={showSettings} onOpenChange={setShowSettings}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Settings className="h-3 w-3" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Configurações de Performance</DialogTitle>
                  </DialogHeader>
                  <PerformanceSettings
                    config={config}
                    onConfigChange={handleConfigChange}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Loading Progress */}
          {isLoading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span>Carregando...</span>
                <span>{loadingProgress.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div 
                  className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${loadingProgress}%` }}
                />
              </div>
            </div>
          )}
          
          {/* Métricas Principais */}
          <div className="grid grid-cols-2 gap-3">
            <MetricCard
              icon={<Clock className="h-3 w-3" />}
              label="Render"
              value={formattedMetrics.renderTime}
              variant={getPerformanceBadgeVariant(metrics.renderTime, performanceThresholds.renderTime)}
              tooltip="Tempo de renderização por frame"
            />
            
            <MetricCard
              icon={<Gauge className="h-3 w-3" />}
              label="FPS"
              value={formattedMetrics.fps}
              variant={getPerformanceBadgeVariant(60 - metrics.fps, { good: 15, warning: 35 })}
              tooltip="Frames por segundo"
            />
            
            <MetricCard
              icon={<MemoryStick className="h-3 w-3" />}
              label="Memória"
              value={formattedMetrics.memoryUsage}
              variant={getPerformanceBadgeVariant(metrics.memoryUsage, performanceThresholds.memoryUsage)}
              tooltip="Uso de memória JavaScript"
            />
            
            <MetricCard
              icon={<Eye className="h-3 w-3" />}
              label="Eficiência"
              value={formattedMetrics.efficiency}
              variant="default"
              tooltip="Porcentagem de nós visíveis"
            />
          </div>
          
          <Separator />
          
          {/* Estatísticas Detalhadas */}
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total de nós:</span>
              <span className="font-medium">
                {virtualizationStats ? 
                  virtualizationStats.totalNodes.toLocaleString() :
                  metrics.totalNodes.toLocaleString()
                }
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Nós visíveis:</span>
              <span className="font-medium">
                {virtualizationStats ? 
                  virtualizationStats.visibleNodes.toLocaleString() :
                  metrics.visibleNodes.toLocaleString()
                }
              </span>
            </div>
            {virtualizationStats && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Arestas visíveis:</span>
                <span className="font-medium">
                  {virtualizationStats.visibleEdges.toLocaleString()} / {virtualizationStats.totalEdges.toLocaleString()}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Otimizações:</span>
              <div className="flex gap-1">
                {config.enableVirtualization && (
                  <Badge variant="outline" className="text-xs px-1 py-0">Virtual</Badge>
                )}
                {config.enableLazyLoading && (
                  <Badge variant="outline" className="text-xs px-1 py-0">Lazy</Badge>
                )}
                {config.enableLevelOfDetail && (
                  <Badge variant="outline" className="text-xs px-1 py-0">LOD</Badge>
                )}
              </div>
            </div>
            {virtualizationStats && (virtualizationStats.nodeReduction > 0 || virtualizationStats.edgeReduction > 0) && (
              <div className="mt-2 p-2 bg-green-50 rounded border">
                <div className="text-xs font-medium text-green-800 mb-1">Otimização Ativa</div>
                <div className="text-xs text-green-600 space-y-1">
                  {virtualizationStats.nodeReduction > 0 && (
                    <div>Nós reduzidos: {virtualizationStats.nodeReduction.toFixed(1)}%</div>
                  )}
                  {virtualizationStats.edgeReduction > 0 && (
                    <div>Arestas reduzidas: {virtualizationStats.edgeReduction.toFixed(1)}%</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}

// ============================================================================
// COMPONENTE DE MÉTRICA
// ============================================================================

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  variant: 'default' | 'secondary' | 'destructive';
  tooltip: string;
}

function MetricCard({ icon, label, value, variant, tooltip }: MetricCardProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            {icon}
            <span>{label}</span>
          </div>
          <Badge variant={variant} className="text-xs font-mono">
            {value}
          </Badge>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p>{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  );
}

// ============================================================================
// CONFIGURAÇÕES DE PERFORMANCE
// ============================================================================

interface PerformanceSettingsProps {
  config: PerformanceConfig;
  onConfigChange: (key: keyof PerformanceConfig, value: any) => void;
}

function PerformanceSettings({ config, onConfigChange }: PerformanceSettingsProps) {
  return (
    <div className="space-y-6">
      {/* Virtualização */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label htmlFor="virtualization" className="text-sm font-medium">
            Virtualização
          </Label>
          <Switch
            id="virtualization"
            checked={config.enableVirtualization}
            onCheckedChange={(checked) => onConfigChange('enableVirtualization', checked)}
          />
        </div>
        
        {config.enableVirtualization && (
          <div className="space-y-3 pl-4 border-l-2 border-gray-200">
            <div className="space-y-2">
              <Label className="text-xs">Buffer do Viewport: {config.viewportBuffer}px</Label>
              <Slider
                value={[config.viewportBuffer]}
                onValueChange={([value]) => onConfigChange('viewportBuffer', value)}
                max={500}
                min={50}
                step={25}
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs">Máx. Nós Visíveis: {config.maxVisibleNodes}</Label>
              <Slider
                value={[config.maxVisibleNodes]}
                onValueChange={([value]) => onConfigChange('maxVisibleNodes', value)}
                max={1000}
                min={100}
                step={50}
                className="w-full"
              />
            </div>
          </div>
        )}
      </div>
      
      <Separator />
      
      {/* Lazy Loading */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label htmlFor="lazy-loading" className="text-sm font-medium">
            Lazy Loading
          </Label>
          <Switch
            id="lazy-loading"
            checked={config.enableLazyLoading}
            onCheckedChange={(checked) => onConfigChange('enableLazyLoading', checked)}
          />
        </div>
        
        {config.enableLazyLoading && (
          <div className="space-y-3 pl-4 border-l-2 border-gray-200">
            <div className="space-y-2">
              <Label className="text-xs">Tamanho do Chunk: {config.chunkSize}</Label>
              <Slider
                value={[config.chunkSize]}
                onValueChange={([value]) => onConfigChange('chunkSize', value)}
                max={200}
                min={10}
                step={10}
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs">Delay de Carregamento: {config.loadDelay}ms</Label>
              <Slider
                value={[config.loadDelay]}
                onValueChange={([value]) => onConfigChange('loadDelay', value)}
                max={500}
                min={0}
                step={25}
                className="w-full"
              />
            </div>
          </div>
        )}
      </div>
      
      <Separator />
      
      {/* Level of Detail */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label htmlFor="lod" className="text-sm font-medium">
            Level of Detail
          </Label>
          <Switch
            id="lod"
            checked={config.enableLevelOfDetail}
            onCheckedChange={(checked) => onConfigChange('enableLevelOfDetail', checked)}
          />
        </div>
        
        {config.enableLevelOfDetail && (
          <div className="space-y-2 pl-4 border-l-2 border-gray-200">
            <Label className="text-xs">Threshold de Zoom: {config.lodThreshold}</Label>
            <Slider
              value={[config.lodThreshold]}
              onValueChange={([value]) => onConfigChange('lodThreshold', value)}
              max={1}
              min={0.1}
              step={0.1}
              className="w-full"
            />
          </div>
        )}
      </div>
      
      <Separator />
      
      {/* Configurações Gerais */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Configurações Gerais</Label>
        
        <div className="space-y-2">
          <Label className="text-xs">Threshold de Performance: {config.performanceThreshold}</Label>
          <Slider
            value={[config.performanceThreshold]}
            onValueChange={([value]) => onConfigChange('performanceThreshold', value)}
            max={500}
            min={50}
            step={25}
            className="w-full"
          />
        </div>
        
        <div className="space-y-2">
          <Label className="text-xs">Delay de Debounce: {config.debounceDelay}ms</Label>
          <Slider
            value={[config.debounceDelay]}
            onValueChange={([value]) => onConfigChange('debounceDelay', value)}
            max={500}
            min={50}
            step={25}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}

export default PerformanceMonitor;