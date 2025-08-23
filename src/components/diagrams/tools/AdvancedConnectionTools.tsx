// ============================================================================
// AdvancedConnectionTools - Ferramentas avançadas de conexão
// ============================================================================

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { 
  Link, 
  Unlink, 
  Route, 
  Zap, 
  Settings, 
  RefreshCw,
  ChevronDown,
  ArrowRight,
  CornerDownRight,
  Waves,
  Minus,
  Target,
  Grid3X3,
  Maximize2,
  Eye,
  EyeOff
} from 'lucide-react';
import { useDiagramStore } from '../stores/useDiagramStore';
import { useAutoRouting } from '../hooks/useAutoRouting';
import { DiagramNode, DiagramEdge } from '../types';
import { secureLogger } from '@/utils/secureLogger';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

interface AdvancedConnectionToolsProps {
  className?: string;
  orientation?: 'horizontal' | 'vertical';
  compactMode?: boolean;
  showLabels?: boolean;
  onConnectionCreate?: (sourceId: string, targetId: string, type: ConnectionType) => void;
  onConnectionUpdate?: (connectionId: string, updates: Partial<DiagramEdge>) => void;
}

type ConnectionType = 'straight' | 'curved' | 'stepped' | 'orthogonal' | 'bezier';

interface ConnectionStyle {
  type: ConnectionType;
  label: string;
  icon: React.ReactNode;
  description: string;
  strokeDasharray?: string;
  markerEnd?: string;
}

interface ConnectionMode {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
  active: boolean;
}

// ============================================================================
// CONSTANTES
// ============================================================================

const CONNECTION_STYLES: ConnectionStyle[] = [
  {
    type: 'straight',
    label: 'Reta',
    icon: <Minus className="h-4 w-4" />,
    description: 'Linha reta direta entre nós'
  },
  {
    type: 'curved',
    label: 'Curva',
    icon: <Waves className="h-4 w-4" />,
    description: 'Linha curva suave'
  },
  {
    type: 'stepped',
    label: 'Escalonada',
    icon: <CornerDownRight className="h-4 w-4" />,
    description: 'Linha com ângulos retos'
  },
  {
    type: 'orthogonal',
    label: 'Ortogonal',
    icon: <Grid3X3 className="h-4 w-4" />,
    description: 'Linha ortogonal automática'
  },
  {
    type: 'bezier',
    label: 'Bézier',
    icon: <Route className="h-4 w-4" />,
    description: 'Curva Bézier personalizada'
  }
];

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export const AdvancedConnectionTools: React.FC<AdvancedConnectionToolsProps> = ({
  className = '',
  orientation = 'horizontal',
  compactMode = false,
  showLabels = true,
  onConnectionCreate,
  onConnectionUpdate
}) => {
  const { 
    nodes, 
    edges, 
    selectedNodeId, 
    selectedEdgeId,
    setSelectedEdgeId,
    updateEdge,
    deleteEdge,
    addEdge
  } = useDiagramStore();
  
  const {
    isEnabled: autoRoutingEnabled,
    options: autoRoutingOptions,
    updateOptions: updateAutoRoutingOptions,
    optimizeAllConnections,
    validateConnection
  } = useAutoRouting();

  // ============================================================================
  // ESTADO LOCAL
  // ============================================================================

  const [connectionMode, setConnectionMode] = useState<'manual' | 'auto' | 'smart'>('manual');
  const [selectedConnectionType, setSelectedConnectionType] = useState<ConnectionType>('straight');
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStart, setConnectionStart] = useState<string | null>(null);
  const [showConnectionPreview, setShowConnectionPreview] = useState(true);
  const [connectionSettings, setConnectionSettings] = useState({
    strokeWidth: 2,
    strokeColor: '#6b7280',
    animated: false,
    showArrows: true,
    showLabels: false
  });

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleStartConnection = useCallback((nodeId: string) => {
    setIsConnecting(true);
    setConnectionStart(nodeId);
    secureLogger.info('Iniciando conexão', { nodeId, mode: connectionMode });
  }, [connectionMode]);

  const handleCompleteConnection = useCallback(async (targetNodeId: string) => {
    if (!connectionStart || connectionStart === targetNodeId) {
      setIsConnecting(false);
      setConnectionStart(null);
      return;
    }

    // Validar conexão
    const validation = validateConnection(connectionStart, targetNodeId);
    if (!validation.isValid) {
      secureLogger.warn('Conexão inválida', { 
        source: connectionStart, 
        target: targetNodeId, 
        reason: validation.reason 
      });
      setIsConnecting(false);
      setConnectionStart(null);
      return;
    }

    // Criar conexão
    const newEdge: Partial<DiagramEdge> = {
      id: `edge-${Date.now()}`,
      source: connectionStart,
      target: targetNodeId,
      type: selectedConnectionType,
      style: {
        strokeWidth: connectionSettings.strokeWidth,
        stroke: connectionSettings.strokeColor
      },
      animated: connectionSettings.animated,
      markerEnd: connectionSettings.showArrows ? {
        type: 'arrowclosed',
        width: 20,
        height: 20
      } : undefined,
      data: {
        routingInfo: {
          autoRouted: connectionMode === 'auto',
          createdAt: new Date().toISOString()
        }
      }
    };

    await addEdge(newEdge as DiagramEdge);
    onConnectionCreate?.(connectionStart, targetNodeId, selectedConnectionType);
    
    setIsConnecting(false);
    setConnectionStart(null);
    
    secureLogger.info('Conexão criada', { 
      edgeId: newEdge.id, 
      source: connectionStart, 
      target: targetNodeId 
    });
  }, [connectionStart, selectedConnectionType, connectionSettings, connectionMode, validateConnection, addEdge, onConnectionCreate]);

  const handleCancelConnection = useCallback(() => {
    setIsConnecting(false);
    setConnectionStart(null);
  }, []);

  const handleDeleteSelectedConnection = useCallback(async () => {
    if (selectedEdgeId) {
      await deleteEdge(selectedEdgeId);
      setSelectedEdgeId(null);
    }
  }, [selectedEdgeId, deleteEdge, setSelectedEdgeId]);

  const handleOptimizeConnections = useCallback(async () => {
    try {
      await optimizeAllConnections();
      secureLogger.info('Conexões otimizadas com sucesso');
    } catch (error) {
      secureLogger.error('Erro ao otimizar conexões', error);
    }
  }, [optimizeAllConnections]);

  const handleConnectionStyleChange = useCallback(async (style: ConnectionType) => {
    setSelectedConnectionType(style);
    
    // Aplicar ao edge selecionado se houver
    if (selectedEdgeId) {
      await updateEdge(selectedEdgeId, { type: style });
      onConnectionUpdate?.(selectedEdgeId, { type: style });
    }
  }, [selectedEdgeId, updateEdge, onConnectionUpdate]);

  // ============================================================================
  // COMPUTAÇÕES
  // ============================================================================

  const connectionModes: ConnectionMode[] = [
    {
      id: 'manual',
      label: 'Manual',
      icon: <Target className="h-4 w-4" />,
      description: 'Conexão manual ponto a ponto',
      active: connectionMode === 'manual'
    },
    {
      id: 'auto',
      label: 'Automática',
      icon: <Zap className="h-4 w-4" />,
      description: 'Roteamento automático inteligente',
      active: connectionMode === 'auto'
    },
    {
      id: 'smart',
      label: 'Inteligente',
      icon: <Route className="h-4 w-4" />,
      description: 'Combinação de manual e automático',
      active: connectionMode === 'smart'
    }
  ];

  const selectedEdge = selectedEdgeId ? edges.find(e => e.id === selectedEdgeId) : null;
  const connectionStats = {
    total: edges.length,
    autoRouted: edges.filter(e => e.data?.routingInfo?.autoRouted).length,
    optimized: edges.filter(e => e.data?.routingInfo?.optimizedAt).length
  };

  // ============================================================================
  // COMPONENTES INTERNOS
  // ============================================================================

  const ConnectionModeSelector = () => (
    <div className="flex gap-1">
      {connectionModes.map((mode) => (
        <TooltipProvider key={mode.id}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={mode.active ? 'default' : 'outline'}
                size={compactMode ? 'sm' : 'default'}
                onClick={() => setConnectionMode(mode.id as any)}
                className={cn(
                  'flex items-center gap-2',
                  !showLabels && 'px-2'
                )}
              >
                {mode.icon}
                {showLabels && !compactMode && (
                  <span className="text-xs">{mode.label}</span>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-center">
                <div className="font-medium">{mode.label}</div>
                <div className="text-xs text-muted-foreground">{mode.description}</div>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ))}
    </div>
  );

  const ConnectionStyleSelector = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size={compactMode ? 'sm' : 'default'}>
          {CONNECTION_STYLES.find(s => s.type === selectedConnectionType)?.icon}
          {showLabels && !compactMode && (
            <span className="ml-2">
              {CONNECTION_STYLES.find(s => s.type === selectedConnectionType)?.label}
            </span>
          )}
          <ChevronDown className="h-3 w-3 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>Estilos de Conexão</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {CONNECTION_STYLES.map((style) => (
          <DropdownMenuItem
            key={style.type}
            onClick={() => handleConnectionStyleChange(style.type)}
            className="flex items-center gap-3"
          >
            <div className="flex items-center gap-2">
              {style.icon}
              <span>{style.label}</span>
            </div>
            {selectedConnectionType === style.type && (
              <Badge variant="secondary" className="ml-auto">Ativo</Badge>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const ConnectionActions = () => (
    <div className="flex gap-1">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size={compactMode ? 'sm' : 'default'}
              onClick={handleOptimizeConnections}
              disabled={edges.length === 0}
            >
              <RefreshCw className="h-4 w-4" />
              {showLabels && !compactMode && <span className="ml-2">Otimizar</span>}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-center">
              <div className="font-medium">Otimizar Conexões</div>
              <div className="text-xs text-muted-foreground">Melhora o roteamento de todas as conexões</div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {selectedEdge && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size={compactMode ? 'sm' : 'default'}
                onClick={handleDeleteSelectedConnection}
              >
                <Unlink className="h-4 w-4" />
                {showLabels && !compactMode && <span className="ml-2">Remover</span>}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-center">
                <div className="font-medium">Remover Conexão</div>
                <div className="text-xs text-muted-foreground">Remove a conexão selecionada</div>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size={compactMode ? 'sm' : 'default'}
              onClick={() => setShowConnectionPreview(!showConnectionPreview)}
            >
              {showConnectionPreview ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              {showLabels && !compactMode && (
                <span className="ml-2">{showConnectionPreview ? 'Ocultar' : 'Mostrar'}</span>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-center">
              <div className="font-medium">Preview de Conexões</div>
              <div className="text-xs text-muted-foreground">Mostra/oculta preview durante criação</div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );

  const ConnectionStats = () => (
    <div className="flex gap-2">
      <Badge variant="outline" className="text-xs">
        Total: {connectionStats.total}
      </Badge>
      <Badge variant="secondary" className="text-xs">
        Auto: {connectionStats.autoRouted}
      </Badge>
      <Badge variant="default" className="text-xs">
        Otimizadas: {connectionStats.optimized}
      </Badge>
    </div>
  );

  // ============================================================================
  // RENDER
  // ============================================================================

  if (compactMode) {
    return (
      <div className={cn(
        'flex items-center gap-2 p-2 bg-background border rounded-lg',
        orientation === 'vertical' && 'flex-col',
        className
      )}>
        <ConnectionModeSelector />
        <Separator orientation={orientation === 'vertical' ? 'horizontal' : 'vertical'} />
        <ConnectionStyleSelector />
        <Separator orientation={orientation === 'vertical' ? 'horizontal' : 'vertical'} />
        <ConnectionActions />
        {showLabels && <ConnectionStats />}
      </div>
    );
  }

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Link className="h-5 w-5" />
            Ferramentas de Conexão
          </CardTitle>
          <ConnectionStats />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Modo de Conexão */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Modo de Conexão</Label>
          <ConnectionModeSelector />
        </div>

        <Separator />

        {/* Estilo de Conexão */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Estilo de Conexão</Label>
          <ConnectionStyleSelector />
        </div>

        <Separator />

        {/* Configurações de Conexão */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Configurações</Label>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="stroke-width" className="text-sm">Espessura da Linha</Label>
              <div className="flex items-center gap-2">
                <Slider
                  id="stroke-width"
                  min={1}
                  max={8}
                  step={1}
                  value={[connectionSettings.strokeWidth]}
                  onValueChange={([value]) => 
                    setConnectionSettings(prev => ({ ...prev, strokeWidth: value }))
                  }
                  className="w-20"
                />
                <span className="text-xs text-muted-foreground w-6">
                  {connectionSettings.strokeWidth}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="animated" className="text-sm">Animação</Label>
              <Switch
                id="animated"
                checked={connectionSettings.animated}
                onCheckedChange={(checked) => 
                  setConnectionSettings(prev => ({ ...prev, animated: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="show-arrows" className="text-sm">Mostrar Setas</Label>
              <Switch
                id="show-arrows"
                checked={connectionSettings.showArrows}
                onCheckedChange={(checked) => 
                  setConnectionSettings(prev => ({ ...prev, showArrows: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="show-labels" className="text-sm">Mostrar Rótulos</Label>
              <Switch
                id="show-labels"
                checked={connectionSettings.showLabels}
                onCheckedChange={(checked) => 
                  setConnectionSettings(prev => ({ ...prev, showLabels: checked }))
                }
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Ações */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Ações</Label>
          <ConnectionActions />
        </div>

        {/* Status da Conexão */}
        {isConnecting && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 text-blue-700">
              <Link className="h-4 w-4" />
              <span className="text-sm font-medium">Criando conexão...</span>
            </div>
            <p className="text-xs text-blue-600 mt-1">
              Clique no nó de destino para completar a conexão
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancelConnection}
              className="mt-2"
            >
              Cancelar
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdvancedConnectionTools;