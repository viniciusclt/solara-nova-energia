// ============================================================================
// Enhanced Navigation - Navegação aprimorada para diagramas
// Componentes de navegação inspirados no MindMeister com controles avançados
// ============================================================================

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize, 
  Minimize, 
  RotateCcw,
  RotateCw,
  Move,
  MousePointer,
  Hand,
  Square,
  Circle,
  Triangle,
  Type,
  ArrowRight,
  Grid,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Layers,
  Map,
  Navigation,
  Compass,
  Target,
  Home,
  Bookmark,
  History,
  Undo,
  Redo
} from 'lucide-react';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

export interface EnhancedMiniMapProps {
  nodes: any[];
  edges: any[];
  viewport: {
    x: number;
    y: number;
    zoom: number;
  };
  onViewportChange: (viewport: { x: number; y: number; zoom: number }) => void;
  className?: string;
}

export interface ZoomControlsProps {
  zoom: number;
  minZoom?: number;
  maxZoom?: number;
  onZoomChange: (zoom: number) => void;
  onFitView: () => void;
  onCenter: () => void;
  className?: string;
}

export interface ViewportControlsProps {
  viewport: {
    x: number;
    y: number;
    zoom: number;
  };
  onViewportChange: (viewport: { x: number; y: number; zoom: number }) => void;
  onFitView: () => void;
  onCenter: () => void;
  onReset: () => void;
  className?: string;
}

export interface LayerControlsProps {
  layers: Layer[];
  onLayerToggle: (layerId: string) => void;
  onLayerLock: (layerId: string) => void;
  onLayerReorder: (fromIndex: number, toIndex: number) => void;
  className?: string;
}

export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  opacity: number;
  nodeCount: number;
}

export interface NavigationHistoryProps {
  history: ViewportState[];
  currentIndex: number;
  onNavigate: (index: number) => void;
  onBookmark: (name: string) => void;
  bookmarks: Bookmark[];
  className?: string;
}

export interface ViewportState {
  x: number;
  y: number;
  zoom: number;
  timestamp: number;
  name?: string;
}

export interface Bookmark {
  id: string;
  name: string;
  viewport: ViewportState;
  createdAt: number;
}

// ============================================================================
// ENHANCED MINI MAP - Mini-mapa aprimorado
// ============================================================================

export const EnhancedMiniMap: React.FC<EnhancedMiniMapProps> = ({
  nodes,
  edges,
  viewport,
  onViewportChange,
  className
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const miniMapRef = useRef<HTMLDivElement>(null);

  // Calcular bounds do diagrama
  const bounds = React.useMemo(() => {
    if (nodes.length === 0) {
      return { minX: 0, minY: 0, maxX: 400, maxY: 300 };
    }

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    nodes.forEach(node => {
      const x = node.position?.x || 0;
      const y = node.position?.y || 0;
      const width = node.width || 100;
      const height = node.height || 50;
      
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x + width);
      maxY = Math.max(maxY, y + height);
    });

    // Adicionar padding
    const padding = 50;
    return {
      minX: minX - padding,
      minY: minY - padding,
      maxX: maxX + padding,
      maxY: maxY + padding
    };
  }, [nodes]);

  const diagramWidth = bounds.maxX - bounds.minX;
  const diagramHeight = bounds.maxY - bounds.minY;
  const miniMapSize = isExpanded ? 200 : 120;
  const scale = Math.min(miniMapSize / diagramWidth, miniMapSize / diagramHeight);

  const handleMiniMapClick = useCallback((event: React.MouseEvent) => {
    if (!miniMapRef.current) return;

    const rect = miniMapRef.current.getBoundingClientRect();
    const x = (event.clientX - rect.left) / scale + bounds.minX;
    const y = (event.clientY - rect.top) / scale + bounds.minY;

    onViewportChange({
      x: -x + window.innerWidth / 2,
      y: -y + window.innerHeight / 2,
      zoom: viewport.zoom
    });
  }, [scale, bounds, viewport.zoom, onViewportChange]);

  return (
    <Card className={cn("fixed bottom-4 right-4 z-40 transition-all duration-300", className)}>
      <CardContent className="p-2">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1">
            <Map className="w-4 h-4 text-primary" />
            <span className="text-xs font-medium">Mapa</span>
          </div>
          <div className="flex items-center gap-1">
            <Badge variant="secondary" className="text-xs px-1 py-0">
              {Math.round(viewport.zoom * 100)}%
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-6 w-6 p-0"
            >
              {isExpanded ? <Minimize className="w-3 h-3" /> : <Maximize className="w-3 h-3" />}
            </Button>
          </div>
        </div>
        
        <div
          ref={miniMapRef}
          className="relative bg-gray-50 border border-gray-200 rounded cursor-pointer overflow-hidden"
          style={{ width: miniMapSize, height: miniMapSize }}
          onClick={handleMiniMapClick}
        >
          {/* Renderizar nós */}
          {nodes.map(node => {
            const x = (node.position?.x - bounds.minX) * scale;
            const y = (node.position?.y - bounds.minY) * scale;
            const width = (node.width || 100) * scale;
            const height = (node.height || 50) * scale;
            
            return (
              <div
                key={node.id}
                className="absolute bg-primary/60 rounded-sm"
                style={{
                  left: x,
                  top: y,
                  width: Math.max(width, 2),
                  height: Math.max(height, 2)
                }}
              />
            );
          })}
          
          {/* Renderizar conexões */}
          {edges.map(edge => {
            const sourceNode = nodes.find(n => n.id === edge.source);
            const targetNode = nodes.find(n => n.id === edge.target);
            
            if (!sourceNode || !targetNode) return null;
            
            const x1 = (sourceNode.position?.x - bounds.minX) * scale;
            const y1 = (sourceNode.position?.y - bounds.minY) * scale;
            const x2 = (targetNode.position?.x - bounds.minX) * scale;
            const y2 = (targetNode.position?.y - bounds.minY) * scale;
            
            const length = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
            const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
            
            return (
              <div
                key={edge.id}
                className="absolute bg-gray-400 h-px origin-left"
                style={{
                  left: x1,
                  top: y1,
                  width: length,
                  transform: `rotate(${angle}deg)`
                }}
              />
            );
          })}
          
          {/* Viewport indicator */}
          <div
            className="absolute border-2 border-primary bg-primary/10 pointer-events-none"
            style={{
              left: (-viewport.x - bounds.minX) * scale,
              top: (-viewport.y - bounds.minY) * scale,
              width: (window.innerWidth / viewport.zoom) * scale,
              height: (window.innerHeight / viewport.zoom) * scale
            }}
          />
        </div>
        
        {isExpanded && (
          <div className="mt-2 space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Nós: {nodes.length}</span>
              <span>Conexões: {edges.length}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>X: {Math.round(viewport.x)}</span>
              <span>Y: {Math.round(viewport.y)}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// ============================================================================
// ZOOM CONTROLS - Controles de zoom avançados
// ============================================================================

export const ZoomControls: React.FC<ZoomControlsProps> = ({
  zoom,
  minZoom = 0.1,
  maxZoom = 3,
  onZoomChange,
  onFitView,
  onCenter,
  className
}) => {
  const [showSlider, setShowSlider] = useState(false);

  const zoomIn = () => {
    const newZoom = Math.min(zoom * 1.2, maxZoom);
    onZoomChange(newZoom);
  };

  const zoomOut = () => {
    const newZoom = Math.max(zoom / 1.2, minZoom);
    onZoomChange(newZoom);
  };

  const resetZoom = () => {
    onZoomChange(1);
  };

  return (
    <Card className={cn("fixed top-4 right-4 z-40", className)}>
      <CardContent className="p-2">
        <div className="flex flex-col gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={zoomIn}
                  disabled={zoom >= maxZoom}
                  className="h-8 w-8 p-0"
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                <span>Ampliar (Ctrl + +)</span>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSlider(!showSlider)}
                  className="h-8 w-8 p-0 relative"
                >
                  <Badge 
                    variant="secondary" 
                    className="absolute -top-1 -right-1 text-xs px-1 py-0 min-w-0 h-4"
                  >
                    {Math.round(zoom * 100)}
                  </Badge>
                  <Target className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                <span>Controle de zoom</span>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          {showSlider && (
            <div className="absolute right-full mr-2 top-0 bg-white border border-gray-200 rounded-lg p-3 shadow-lg">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {Math.round(minZoom * 100)}%
                </span>
                <Slider
                  value={[zoom]}
                  onValueChange={([value]) => onZoomChange(value)}
                  min={minZoom}
                  max={maxZoom}
                  step={0.1}
                  className="w-24"
                />
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {Math.round(maxZoom * 100)}%
                </span>
              </div>
            </div>
          )}
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={zoomOut}
                  disabled={zoom <= minZoom}
                  className="h-8 w-8 p-0"
                >
                  <ZoomOut className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                <span>Reduzir (Ctrl + -)</span>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <div className="h-px bg-gray-200 my-1" />
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onFitView}
                  className="h-8 w-8 p-0"
                >
                  <Maximize className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                <span>Ajustar à tela (Ctrl + 0)</span>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onCenter}
                  className="h-8 w-8 p-0"
                >
                  <Home className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                <span>Centralizar</span>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetZoom}
                  className="h-8 w-8 p-0"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                <span>Zoom 100%</span>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardContent>
    </Card>
  );
};

// ============================================================================
// LAYER CONTROLS - Controles de camadas
// ============================================================================

export const LayerControls: React.FC<LayerControlsProps> = ({
  layers,
  onLayerToggle,
  onLayerLock,
  onLayerReorder,
  className
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [draggedLayer, setDraggedLayer] = useState<string | null>(null);

  return (
    <Card className={cn("fixed top-4 left-4 z-40", className)}>
      <CardContent className="p-2">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1">
            <Layers className="w-4 h-4 text-primary" />
            <span className="text-xs font-medium">Camadas</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-6 w-6 p-0"
          >
            {isExpanded ? <Minimize className="w-3 h-3" /> : <Maximize className="w-3 h-3" />}
          </Button>
        </div>
        
        {isExpanded && (
          <div className="space-y-1 min-w-48">
            {layers.map((layer, index) => (
              <div
                key={layer.id}
                className={cn(
                  "flex items-center gap-2 p-2 rounded border transition-colors",
                  draggedLayer === layer.id ? "bg-primary/10 border-primary" : "bg-gray-50 border-gray-200"
                )}
                draggable
                onDragStart={() => setDraggedLayer(layer.id)}
                onDragEnd={() => setDraggedLayer(null)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (draggedLayer && draggedLayer !== layer.id) {
                    const fromIndex = layers.findIndex(l => l.id === draggedLayer);
                    onLayerReorder(fromIndex, index);
                  }
                }}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onLayerToggle(layer.id)}
                  className="h-6 w-6 p-0"
                >
                  {layer.visible ? (
                    <Eye className="w-3 h-3" />
                  ) : (
                    <EyeOff className="w-3 h-3 text-muted-foreground" />
                  )}
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onLayerLock(layer.id)}
                  className="h-6 w-6 p-0"
                >
                  {layer.locked ? (
                    <Lock className="w-3 h-3 text-orange-500" />
                  ) : (
                    <Unlock className="w-3 h-3" />
                  )}
                </Button>
                
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium truncate">{layer.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {layer.nodeCount} nó{layer.nodeCount !== 1 ? 's' : ''}
                  </div>
                </div>
                
                <Badge variant="secondary" className="text-xs px-1 py-0">
                  {Math.round(layer.opacity * 100)}%
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// ============================================================================
// NAVIGATION HISTORY - Histórico de navegação
// ============================================================================

export const NavigationHistory: React.FC<NavigationHistoryProps> = ({
  history,
  currentIndex,
  onNavigate,
  onBookmark,
  bookmarks,
  className
}) => {
  const [showHistory, setShowHistory] = useState(false);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [bookmarkName, setBookmarkName] = useState('');

  const canGoBack = currentIndex > 0;
  const canGoForward = currentIndex < history.length - 1;

  const goBack = () => {
    if (canGoBack) {
      onNavigate(currentIndex - 1);
    }
  };

  const goForward = () => {
    if (canGoForward) {
      onNavigate(currentIndex + 1);
    }
  };

  const handleBookmark = () => {
    if (bookmarkName.trim()) {
      onBookmark(bookmarkName.trim());
      setBookmarkName('');
    }
  };

  return (
    <Card className={cn("fixed bottom-4 left-4 z-40", className)}>
      <CardContent className="p-2">
        <div className="flex items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={goBack}
                  disabled={!canGoBack}
                  className="h-8 w-8 p-0"
                >
                  <Undo className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <span>Voltar (Alt + ←)</span>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={goForward}
                  disabled={!canGoForward}
                  className="h-8 w-8 p-0"
                >
                  <Redo className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <span>Avançar (Alt + →)</span>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <div className="h-4 w-px bg-gray-200 mx-1" />
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowHistory(!showHistory)}
                  className="h-8 w-8 p-0"
                >
                  <History className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <span>Histórico de navegação</span>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowBookmarks(!showBookmarks)}
                  className="h-8 w-8 p-0"
                >
                  <Bookmark className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <span>Favoritos</span>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        {/* Histórico */}
        {showHistory && (
          <div className="absolute bottom-full mb-2 left-0 bg-white border border-gray-200 rounded-lg shadow-lg p-3 min-w-64">
            <div className="text-sm font-medium mb-2">Histórico de Navegação</div>
            <div className="space-y-1 max-h-48 overflow-auto">
              {history.map((state, index) => (
                <button
                  key={index}
                  onClick={() => onNavigate(index)}
                  className={cn(
                    "w-full text-left p-2 rounded text-xs transition-colors",
                    index === currentIndex ? "bg-primary text-primary-foreground" : "hover:bg-gray-50"
                  )}
                >
                  <div className="font-medium">
                    {state.name || `Posição ${index + 1}`}
                  </div>
                  <div className="text-muted-foreground">
                    X: {Math.round(state.x)}, Y: {Math.round(state.y)}, Zoom: {Math.round(state.zoom * 100)}%
                  </div>
                  <div className="text-muted-foreground">
                    {new Date(state.timestamp).toLocaleTimeString()}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Favoritos */}
        {showBookmarks && (
          <div className="absolute bottom-full mb-2 left-0 bg-white border border-gray-200 rounded-lg shadow-lg p-3 min-w-64">
            <div className="text-sm font-medium mb-2">Favoritos</div>
            
            {/* Adicionar favorito */}
            <div className="flex gap-1 mb-2">
              <input
                type="text"
                placeholder="Nome do favorito"
                value={bookmarkName}
                onChange={(e) => setBookmarkName(e.target.value)}
                className="flex-1 px-2 py-1 text-xs border border-gray-200 rounded"
                onKeyPress={(e) => e.key === 'Enter' && handleBookmark()}
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBookmark}
                disabled={!bookmarkName.trim()}
                className="h-6 w-6 p-0"
              >
                <Plus className="w-3 h-3" />
              </Button>
            </div>
            
            {/* Lista de favoritos */}
            <div className="space-y-1 max-h-48 overflow-auto">
              {bookmarks.map((bookmark) => (
                <button
                  key={bookmark.id}
                  onClick={() => onNavigate(history.findIndex(h => h.timestamp === bookmark.viewport.timestamp))}
                  className="w-full text-left p-2 rounded text-xs hover:bg-gray-50 transition-colors"
                >
                  <div className="font-medium">{bookmark.name}</div>
                  <div className="text-muted-foreground">
                    X: {Math.round(bookmark.viewport.x)}, Y: {Math.round(bookmark.viewport.y)}, Zoom: {Math.round(bookmark.viewport.zoom * 100)}%
                  </div>
                  <div className="text-muted-foreground">
                    {new Date(bookmark.createdAt).toLocaleDateString()}
                  </div>
                </button>
              ))}
              {bookmarks.length === 0 && (
                <div className="text-xs text-muted-foreground text-center py-2">
                  Nenhum favorito salvo
                </div>
              )}
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

export default {
  EnhancedMiniMap,
  ZoomControls,
  LayerControls,
  NavigationHistory
};