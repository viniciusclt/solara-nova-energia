// ============================================================================
// Enhanced Status Bar - Barra de status avançada para diagramas
// Componente de status inspirado no MindMeister com informações detalhadas
// ============================================================================

import React, { useState, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Activity,
  Clock,
  Users,
  FileText,
  Link,
  Zap,
  CheckCircle,
  AlertCircle,
  XCircle,
  Info,
  Wifi,
  WifiOff,
  Save,
  Cloud,
  CloudOff,
  Download,
  Upload,
  RefreshCw,
  Settings,
  HelpCircle,
  Maximize2,
  Minimize2,
  Monitor,
  Smartphone,
  Tablet,
  MousePointer,
  Move,
  Square,
  Circle,
  Type,
  ArrowRight,
  Layers,
  Eye,
  Lock,
  Grid,
  Ruler,
  Crosshair,
  Target,
  Compass,
  Navigation
} from 'lucide-react';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

export interface DiagramStats {
  nodeCount: number;
  edgeCount: number;
  selectedNodes: number;
  selectedEdges: number;
  totalElements: number;
  layerCount: number;
  visibleLayers: number;
}

export interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  fps: number;
  nodeRenderCount: number;
  edgeRenderCount: number;
}

export interface ConnectionStatus {
  isOnline: boolean;
  lastSync: Date | null;
  syncStatus: 'idle' | 'syncing' | 'error' | 'success';
  pendingChanges: number;
}

export interface ViewportInfo {
  x: number;
  y: number;
  zoom: number;
  bounds: {
    width: number;
    height: number;
  };
  visibleArea: {
    width: number;
    height: number;
  };
}

export interface ToolInfo {
  activeTool: string;
  mode: 'select' | 'pan' | 'draw' | 'text' | 'connect';
  snapToGrid: boolean;
  showGrid: boolean;
  showRulers: boolean;
  showGuides: boolean;
}

export interface EnhancedStatusBarProps {
  diagramStats: DiagramStats;
  performanceMetrics?: PerformanceMetrics;
  connectionStatus?: ConnectionStatus;
  viewportInfo: ViewportInfo;
  toolInfo: ToolInfo;
  onToolChange?: (tool: string) => void;
  onModeChange?: (mode: ToolInfo['mode']) => void;
  onToggleGrid?: () => void;
  onToggleRulers?: () => void;
  onToggleGuides?: () => void;
  onToggleSnap?: () => void;
  className?: string;
  compact?: boolean;
}

export interface StatusSection {
  id: string;
  title: string;
  content: React.ReactNode;
  priority: 'high' | 'medium' | 'low';
  visible: boolean;
}

// ============================================================================
// ENHANCED STATUS BAR - Barra de status principal
// ============================================================================

export const EnhancedStatusBar: React.FC<EnhancedStatusBarProps> = ({
  diagramStats,
  performanceMetrics,
  connectionStatus,
  viewportInfo,
  toolInfo,
  onToolChange,
  onModeChange,
  onToggleGrid,
  onToggleRulers,
  onToggleGuides,
  onToggleSnap,
  className,
  compact = false
}) => {
  const [isExpanded, setIsExpanded] = useState(!compact);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [showPerformance, setShowPerformance] = useState(false);

  // Calcular estatísticas derivadas
  const derivedStats = useMemo(() => {
    const selectionPercentage = diagramStats.totalElements > 0 
      ? ((diagramStats.selectedNodes + diagramStats.selectedEdges) / diagramStats.totalElements) * 100 
      : 0;
    
    const density = diagramStats.nodeCount > 0 
      ? diagramStats.edgeCount / diagramStats.nodeCount 
      : 0;
    
    const layerUtilization = diagramStats.layerCount > 0 
      ? (diagramStats.visibleLayers / diagramStats.layerCount) * 100 
      : 100;

    return {
      selectionPercentage,
      density,
      layerUtilization
    };
  }, [diagramStats]);

  // Status de conexão
  const getConnectionStatusIcon = () => {
    if (!connectionStatus) return <Wifi className="w-4 h-4 text-gray-400" />;
    
    switch (connectionStatus.syncStatus) {
      case 'syncing':
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'error':
        return <WifiOff className="w-4 h-4 text-red-500" />;
      case 'success':
        return <Cloud className="w-4 h-4 text-green-500" />;
      default:
        return connectionStatus.isOnline 
          ? <Wifi className="w-4 h-4 text-green-500" /> 
          : <WifiOff className="w-4 h-4 text-gray-400" />;
    }
  };

  // Seções da barra de status
  const sections: StatusSection[] = [
    {
      id: 'diagram-stats',
      title: 'Estatísticas do Diagrama',
      priority: 'high',
      visible: true,
      content: (
        <div className="flex items-center gap-4">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1">
                  <Square className="w-3 h-3 text-blue-500" />
                  <span className="text-sm font-medium">{diagramStats.nodeCount}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <span>Nós no diagrama</span>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1">
                  <ArrowRight className="w-3 h-3 text-green-500" />
                  <span className="text-sm font-medium">{diagramStats.edgeCount}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <span>Conexões no diagrama</span>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          {(diagramStats.selectedNodes > 0 || diagramStats.selectedEdges > 0) && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="secondary" className="text-xs">
                    {diagramStats.selectedNodes + diagramStats.selectedEdges} selecionado{diagramStats.selectedNodes + diagramStats.selectedEdges !== 1 ? 's' : ''}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <div>
                    <div>Nós: {diagramStats.selectedNodes}</div>
                    <div>Conexões: {diagramStats.selectedEdges}</div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1">
                  <Layers className="w-3 h-3 text-purple-500" />
                  <span className="text-sm">{diagramStats.visibleLayers}/{diagramStats.layerCount}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <span>Camadas visíveis/total</span>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )
    },
    {
      id: 'viewport-info',
      title: 'Informações do Viewport',
      priority: 'medium',
      visible: isExpanded,
      content: (
        <div className="flex items-center gap-4">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1">
                  <Target className="w-3 h-3 text-orange-500" />
                  <span className="text-sm">
                    {Math.round(viewportInfo.zoom * 100)}%
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <span>Nível de zoom</span>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1">
                  <Crosshair className="w-3 h-3 text-gray-500" />
                  <span className="text-sm">
                    {Math.round(viewportInfo.x)}, {Math.round(viewportInfo.y)}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <span>Posição do viewport (X, Y)</span>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1">
                  <Monitor className="w-3 h-3 text-blue-500" />
                  <span className="text-sm">
                    {Math.round(viewportInfo.visibleArea.width)} × {Math.round(viewportInfo.visibleArea.height)}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <span>Área visível (largura × altura)</span>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )
    },
    {
      id: 'tool-info',
      title: 'Ferramentas Ativas',
      priority: 'high',
      visible: true,
      content: (
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge 
                  variant={toolInfo.mode === 'select' ? 'default' : 'secondary'}
                  className="text-xs cursor-pointer"
                  onClick={() => onModeChange?.('select')}
                >
                  <MousePointer className="w-3 h-3 mr-1" />
                  {toolInfo.mode === 'select' ? 'Seleção' : 'Sel'}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <span>Modo de seleção (V)</span>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge 
                  variant={toolInfo.mode === 'pan' ? 'default' : 'secondary'}
                  className="text-xs cursor-pointer"
                  onClick={() => onModeChange?.('pan')}
                >
                  <Move className="w-3 h-3 mr-1" />
                  {toolInfo.mode === 'pan' ? 'Mover' : 'Mov'}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <span>Modo de movimentação (H)</span>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <div className="h-4 w-px bg-gray-200" />
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={toolInfo.showGrid ? 'default' : 'ghost'}
                  size="sm"
                  onClick={onToggleGrid}
                  className="h-6 w-6 p-0"
                >
                  <Grid className="w-3 h-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <span>Alternar grade (Ctrl + G)</span>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={toolInfo.snapToGrid ? 'default' : 'ghost'}
                  size="sm"
                  onClick={onToggleSnap}
                  className="h-6 w-6 p-0"
                >
                  <Target className="w-3 h-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <span>Ajustar à grade (Ctrl + Shift + G)</span>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={toolInfo.showRulers ? 'default' : 'ghost'}
                  size="sm"
                  onClick={onToggleRulers}
                  className="h-6 w-6 p-0"
                >
                  <Ruler className="w-3 h-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <span>Alternar réguas (Ctrl + R)</span>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )
    },
    {
      id: 'connection-status',
      title: 'Status de Conexão',
      priority: 'medium',
      visible: !!connectionStatus,
      content: connectionStatus && (
        <div className="flex items-center gap-2">
          {getConnectionStatusIcon()}
          
          {connectionStatus.pendingChanges > 0 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="text-xs">
                    {connectionStatus.pendingChanges} pendente{connectionStatus.pendingChanges !== 1 ? 's' : ''}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <span>Alterações não sincronizadas</span>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          
          {connectionStatus.lastSync && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-xs text-muted-foreground">
                    {connectionStatus.lastSync.toLocaleTimeString()}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <span>Última sincronização</span>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      )
    },
    {
      id: 'performance',
      title: 'Performance',
      priority: 'low',
      visible: showPerformance && !!performanceMetrics,
      content: performanceMetrics && (
        <div className="flex items-center gap-4">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1">
                  <Activity className="w-3 h-3 text-green-500" />
                  <span className="text-sm">{Math.round(performanceMetrics.fps)} FPS</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <span>Frames por segundo</span>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-blue-500" />
                  <span className="text-sm">{performanceMetrics.renderTime}ms</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <span>Tempo de renderização</span>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1">
                  <Zap className="w-3 h-3 text-yellow-500" />
                  <span className="text-sm">{Math.round(performanceMetrics.memoryUsage)}MB</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <span>Uso de memória</span>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )
    }
  ];

  const visibleSections = sections.filter(section => section.visible);

  return (
    <Card className={cn("fixed bottom-0 left-0 right-0 z-30 rounded-none border-t border-l-0 border-r-0 border-b-0", className)}>
      <CardContent className="p-2">
        <div className="flex items-center justify-between">
          {/* Seções principais */}
          <div className="flex items-center gap-6">
            {visibleSections.map((section, index) => (
              <React.Fragment key={section.id}>
                {index > 0 && <Separator orientation="vertical" className="h-4" />}
                <div className="flex items-center gap-2">
                  {section.content}
                </div>
              </React.Fragment>
            ))}
          </div>
          
          {/* Controles da barra de status */}
          <div className="flex items-center gap-2">
            {performanceMetrics && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPerformance(!showPerformance)}
                      className="h-6 w-6 p-0"
                    >
                      <Activity className={cn("w-3 h-3", showPerformance ? "text-green-500" : "text-gray-400")} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <span>Alternar métricas de performance</span>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="h-6 w-6 p-0"
                  >
                    {isExpanded ? (
                      <Minimize2 className="w-3 h-3" />
                    ) : (
                      <Maximize2 className="w-3 h-3" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <span>{isExpanded ? 'Compactar' : 'Expandir'} barra de status</span>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        
        {/* Informações expandidas */}
        {isExpanded && (
          <div className="mt-2 pt-2 border-t border-gray-200">
            <div className="grid grid-cols-3 gap-4 text-xs text-muted-foreground">
              <div>
                <span className="font-medium">Densidade:</span> {derivedStats.density.toFixed(2)}
              </div>
              <div>
                <span className="font-medium">Seleção:</span> {derivedStats.selectionPercentage.toFixed(1)}%
              </div>
              <div>
                <span className="font-medium">Camadas:</span> {derivedStats.layerUtilization.toFixed(0)}% ativas
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// ============================================================================
// EXPORTS
// ============================================================================

export default EnhancedStatusBar;