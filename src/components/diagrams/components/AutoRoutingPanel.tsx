// ============================================================================
// AutoRoutingPanel - Painel de configuração do auto-routing
// ============================================================================

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { 
  Settings, 
  Zap, 
  Route, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle,
  Info,
  Maximize2
} from 'lucide-react';
import { useAutoRouting, UseAutoRoutingOptions } from '../hooks/useAutoRouting';
import { useDiagramStore } from '../stores/useDiagramStore';
import { secureLogger } from '@/utils/secureLogger';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

interface AutoRoutingPanelProps {
  className?: string;
  showAdvanced?: boolean;
  onSettingsChange?: (options: UseAutoRoutingOptions) => void;
}

interface RoutingStats {
  totalConnections: number;
  autoRoutedConnections: number;
  optimizedConnections: number;
  averageLength: number;
  hasObstacles: number;
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export const AutoRoutingPanel: React.FC<AutoRoutingPanelProps> = ({
  className = '',
  showAdvanced = false,
  onSettingsChange
}) => {
  const { edges } = useDiagramStore();
  const {
    isEnabled,
    options,
    updateOptions,
    toggleEnabled,
    optimizeAllConnections,
    resetToDefaults
  } = useAutoRouting();

  const [isOptimizing, setIsOptimizing] = useState(false);
  const [showStats, setShowStats] = useState(false);

  // ============================================================================
  // ESTATÍSTICAS
  // ============================================================================

  const getRoutingStats = useCallback((): RoutingStats => {
    const totalConnections = edges.length;
    const autoRoutedConnections = edges.filter(edge => 
      edge.data?.routingInfo?.autoRouted
    ).length;
    const optimizedConnections = edges.filter(edge => 
      edge.data?.routingInfo?.optimizedAt
    ).length;
    
    const totalLengths = edges
      .filter(edge => edge.data?.routingInfo?.totalLength)
      .map(edge => edge.data.routingInfo.totalLength);
    
    const averageLength = totalLengths.length > 0 
      ? totalLengths.reduce((sum, length) => sum + length, 0) / totalLengths.length
      : 0;
    
    const hasObstacles = edges.filter(edge => 
      edge.data?.routingInfo?.hasObstacles
    ).length;

    return {
      totalConnections,
      autoRoutedConnections,
      optimizedConnections,
      averageLength: Math.round(averageLength),
      hasObstacles
    };
  }, [edges]);

  const stats = getRoutingStats();

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleToggleEnabled = useCallback(() => {
    toggleEnabled();
    onSettingsChange?.(options);
    secureLogger.info('Auto-routing toggled', { enabled: !isEnabled });
  }, [toggleEnabled, onSettingsChange, options, isEnabled]);

  const handleOptionChange = useCallback(
    (key: keyof UseAutoRoutingOptions, value: any) => {
      const newOptions = { [key]: value };
      updateOptions(newOptions);
      onSettingsChange?.({ ...options, ...newOptions });
      secureLogger.info('Auto-routing option changed', { key, value });
    },
    [updateOptions, onSettingsChange, options]
  );

  const handleOptimizeAll = useCallback(async () => {
    if (isOptimizing) return;
    
    setIsOptimizing(true);
    try {
      optimizeAllConnections();
      secureLogger.info('Todas as conexões otimizadas via painel');
    } catch (error) {
      secureLogger.error('Erro ao otimizar conexões via painel', { error });
    } finally {
      setIsOptimizing(false);
    }
  }, [optimizeAllConnections, isOptimizing]);

  const handleResetDefaults = useCallback(() => {
    resetToDefaults();
    onSettingsChange?.(options);
    secureLogger.info('Auto-routing resetado para padrões');
  }, [resetToDefaults, onSettingsChange, options]);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Route className="h-4 w-4" />
          Auto-Routing
          <Badge variant={isEnabled ? 'default' : 'secondary'} className="ml-auto">
            {isEnabled ? 'Ativo' : 'Inativo'}
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Toggle Principal */}
        <div className="flex items-center justify-between">
          <Label htmlFor="auto-routing-enabled" className="text-sm font-medium">
            Habilitar Auto-Routing
          </Label>
          <Switch
            id="auto-routing-enabled"
            checked={isEnabled}
            onCheckedChange={handleToggleEnabled}
          />
        </div>

        {isEnabled && (
          <>
            <Separator />

            {/* Configurações Básicas */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Evitar Nós</Label>
                <Switch
                  checked={options.avoidNodes}
                  onCheckedChange={(value) => handleOptionChange('avoidNodes', value)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-sm">Preferir Linhas Ortogonais</Label>
                <Switch
                  checked={options.preferOrthogonal}
                  onCheckedChange={(value) => handleOptionChange('preferOrthogonal', value)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-sm">Curvas Suaves</Label>
                <Switch
                  checked={options.smoothCurves}
                  onCheckedChange={(value) => handleOptionChange('smoothCurves', value)}
                />
              </div>

              {showAdvanced && (
                <>
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Otimização Automática</Label>
                    <Switch
                      checked={options.autoOptimize}
                      onCheckedChange={(value) => handleOptionChange('autoOptimize', value)}
                    />
                  </div>

                  {/* Sliders para configurações avançadas */}
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm">Distância Mínima: {options.minDistance}px</Label>
                      <Slider
                        value={[options.minDistance]}
                        onValueChange={([value]) => handleOptionChange('minDistance', value)}
                        min={10}
                        max={50}
                        step={5}
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label className="text-sm">Raio das Curvas: {options.cornerRadius}px</Label>
                      <Slider
                        value={[options.cornerRadius]}
                        onValueChange={([value]) => handleOptionChange('cornerRadius', value)}
                        min={0}
                        max={20}
                        step={2}
                        className="mt-2"
                      />
                    </div>

                    {options.autoOptimize && (
                      <div>
                        <Label className="text-sm">Debounce: {options.debounceMs}ms</Label>
                        <Slider
                          value={[options.debounceMs]}
                          onValueChange={([value]) => handleOptionChange('debounceMs', value)}
                          min={100}
                          max={1000}
                          step={100}
                          className="mt-2"
                        />
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            <Separator />

            {/* Ações */}
            <div className="space-y-2">
              <Button
                onClick={handleOptimizeAll}
                disabled={isOptimizing || stats.totalConnections === 0}
                className="w-full"
                variant="outline"
                size="sm"
              >
                {isOptimizing ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Zap className="h-4 w-4 mr-2" />
                )}
                {isOptimizing ? 'Otimizando...' : 'Otimizar Todas as Conexões'}
              </Button>

              <Button
                onClick={handleResetDefaults}
                variant="ghost"
                size="sm"
                className="w-full"
              >
                <Settings className="h-4 w-4 mr-2" />
                Restaurar Padrões
              </Button>
            </div>

            {/* Estatísticas */}
            <Separator />
            
            <div className="space-y-2">
              <Button
                onClick={() => setShowStats(!showStats)}
                variant="ghost"
                size="sm"
                className="w-full justify-between"
              >
                <span className="flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Estatísticas
                </span>
                <Maximize2 className={`h-4 w-4 transition-transform ${showStats ? 'rotate-180' : ''}`} />
              </Button>

              {showStats && (
                <div className="bg-muted/50 rounded-lg p-3 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span>Total de Conexões:</span>
                    <Badge variant="outline">{stats.totalConnections}</Badge>
                  </div>
                  
                  <div className="flex justify-between">
                    <span>Auto-Roteadas:</span>
                    <Badge variant={stats.autoRoutedConnections > 0 ? 'default' : 'secondary'}>
                      {stats.autoRoutedConnections}
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between">
                    <span>Otimizadas:</span>
                    <Badge variant={stats.optimizedConnections > 0 ? 'default' : 'secondary'}>
                      {stats.optimizedConnections}
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between">
                    <span>Comprimento Médio:</span>
                    <Badge variant="outline">{stats.averageLength}px</Badge>
                  </div>
                  
                  <div className="flex justify-between">
                    <span>Com Obstáculos:</span>
                    <Badge variant={stats.hasObstacles > 0 ? 'destructive' : 'default'}>
                      {stats.hasObstacles}
                    </Badge>
                  </div>
                  
                  {stats.totalConnections > 0 && (
                    <div className="pt-2 border-t">
                      <div className="flex items-center gap-2">
                        {stats.autoRoutedConnections === stats.totalConnections ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-yellow-500" />
                        )}
                        <span className="text-xs">
                          {Math.round((stats.autoRoutedConnections / stats.totalConnections) * 100)}% auto-roteadas
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

// ============================================================================
// COMPONENTE SIMPLIFICADO
// ============================================================================

export const SimpleAutoRoutingPanel: React.FC<{ className?: string }> = ({ className }) => {
  const { isEnabled, toggleEnabled } = useAutoRouting();

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Route className="h-4 w-4" />
      <Label className="text-sm">Auto-Routing</Label>
      <Switch
        checked={isEnabled}
        onCheckedChange={toggleEnabled}
      />
    </div>
  );
};

export default AutoRoutingPanel;