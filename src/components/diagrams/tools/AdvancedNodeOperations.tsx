// ============================================================================
// AdvancedNodeOperations - Ferramentas avançadas para operações de nós
// ============================================================================

import React, { useState, useCallback, useMemo } from 'react';
import {
  Copy,
  Scissors,
  Clipboard,
  RotateCw,
  RotateCcw,
  Move,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignVerticalJustifyCenter,
  AlignHorizontalJustifyCenter,
  AlignVerticalSpaceAround,
  AlignHorizontalSpaceAround,
  Group,
  Ungroup,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
  Square,
  Circle,
  Triangle,
  Settings,
  Layers,
  Grid3X3,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Plus,
  Minus,
  MoreHorizontal
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger
} from '@/components/ui/dropdown-menu';
import { useDiagramStore } from '../stores/useDiagramStore';
import { useNodeOperations } from '../hooks/useNodeOperations';
import { DiagramNode } from '../types';
import { secureLogger } from '@/utils/secureLogger';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

export interface AdvancedNodeOperationsProps {
  className?: string;
  position?: 'floating' | 'sidebar' | 'toolbar';
  compact?: boolean;
  showLabels?: boolean;
}

interface NodeAlignment {
  type: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom';
  axis: 'horizontal' | 'vertical';
}

interface NodeDistribution {
  type: 'horizontal' | 'vertical';
  spacing: 'equal' | 'custom';
  customSpacing?: number;
}

interface NodeTransform {
  rotation: number;
  scale: number;
  skew: { x: number; y: number };
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export const AdvancedNodeOperations: React.FC<AdvancedNodeOperationsProps> = ({
  className = '',
  position = 'floating',
  compact = false,
  showLabels = true
}) => {
  const {
    nodes,
    selectedNodeIds,
    updateNode,
    deleteNode,
    setSelectedNodeIds
  } = useDiagramStore();
  
  const {
    cloneNode,
    duplicateSelectedNode,
    deleteNodeWithConnections,
    moveNodeTo,
    groupNodes
  } = useNodeOperations();

  // ============================================================================
  // ESTADO LOCAL
  // ============================================================================

  const [clipboard, setClipboard] = useState<DiagramNode[]>([]);
  const [transformSettings, setTransformSettings] = useState<NodeTransform>({
    rotation: 0,
    scale: 1,
    skew: { x: 0, y: 0 }
  });
  const [distributionSpacing, setDistributionSpacing] = useState(50);
  const [gridSize, setGridSize] = useState(20);
  const [snapToGrid, setSnapToGrid] = useState(true);

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const selectedNodes = useMemo(() => {
    return nodes.filter(node => selectedNodeIds.includes(node.id));
  }, [nodes, selectedNodeIds]);

  const hasSelection = selectedNodes.length > 0;
  const hasMultipleSelection = selectedNodes.length > 1;
  const canGroup = selectedNodes.length >= 2;
  const canAlign = selectedNodes.length >= 2;
  const canDistribute = selectedNodes.length >= 3;

  // ============================================================================
  // OPERAÇÕES DE CLIPBOARD
  // ============================================================================

  const copyNodes = useCallback(() => {
    if (!hasSelection) return;
    
    setClipboard([...selectedNodes]);
    secureLogger.info('Nós copiados', { count: selectedNodes.length });
  }, [selectedNodes, hasSelection]);

  const cutNodes = useCallback(() => {
    if (!hasSelection) return;
    
    setClipboard([...selectedNodes]);
    selectedNodes.forEach(node => {
      deleteNodeWithConnections(node.id);
    });
    setSelectedNodeIds([]);
    secureLogger.info('Nós cortados', { count: selectedNodes.length });
  }, [selectedNodes, hasSelection, deleteNodeWithConnections, setSelectedNodeIds]);

  const pasteNodes = useCallback(() => {
    if (clipboard.length === 0) return;
    
    const newNodeIds: string[] = [];
    
    clipboard.forEach((node, index) => {
      const newPosition = {
        x: node.position.x + 50 + (index * 20),
        y: node.position.y + 50 + (index * 20)
      };
      
      const newNodeId = cloneNode(node.id, newPosition);
      if (newNodeId) {
        newNodeIds.push(newNodeId);
      }
    });
    
    setSelectedNodeIds(newNodeIds);
    secureLogger.info('Nós colados', { count: clipboard.length });
  }, [clipboard, cloneNode, setSelectedNodeIds]);

  // ============================================================================
  // OPERAÇÕES DE ALINHAMENTO
  // ============================================================================

  const alignNodes = useCallback(async (alignment: NodeAlignment) => {
    if (!canAlign) return;
    
    const bounds = selectedNodes.reduce((acc, node) => {
      const nodeRight = node.position.x + (node.data?.width || 150);
      const nodeBottom = node.position.y + (node.data?.height || 100);
      
      return {
        left: Math.min(acc.left, node.position.x),
        right: Math.max(acc.right, nodeRight),
        top: Math.min(acc.top, node.position.y),
        bottom: Math.max(acc.bottom, nodeBottom)
      };
    }, {
      left: Infinity,
      right: -Infinity,
      top: Infinity,
      bottom: -Infinity
    });
    
    const centerX = (bounds.left + bounds.right) / 2;
    const centerY = (bounds.top + bounds.bottom) / 2;
    
    selectedNodes.forEach(node => {
      let newPosition = { ...node.position };
      const nodeWidth = node.data?.width || 150;
      const nodeHeight = node.data?.height || 100;
      
      switch (alignment.type) {
        case 'left':
          newPosition.x = bounds.left;
          break;
        case 'center':
          newPosition.x = centerX - nodeWidth / 2;
          break;
        case 'right':
          newPosition.x = bounds.right - nodeWidth;
          break;
        case 'top':
          newPosition.y = bounds.top;
          break;
        case 'middle':
          newPosition.y = centerY - nodeHeight / 2;
          break;
        case 'bottom':
          newPosition.y = bounds.bottom - nodeHeight;
          break;
      }
      
      if (snapToGrid) {
        newPosition.x = Math.round(newPosition.x / gridSize) * gridSize;
        newPosition.y = Math.round(newPosition.y / gridSize) * gridSize;
      }
      
      await updateNode(node.id, { position: newPosition });
    });
    
    secureLogger.info('Nós alinhados', { alignment: alignment.type, count: selectedNodes.length });
  }, [selectedNodes, canAlign, snapToGrid, gridSize, updateNode]);

  // ============================================================================
  // OPERAÇÕES DE DISTRIBUIÇÃO
  // ============================================================================

  const distributeNodes = useCallback(async (distribution: NodeDistribution) => {
    if (!canDistribute) return;
    
    const sortedNodes = [...selectedNodes].sort((a, b) => {
      return distribution.type === 'horizontal' 
        ? a.position.x - b.position.x
        : a.position.y - b.position.y;
    });
    
    const firstNode = sortedNodes[0];
    const lastNode = sortedNodes[sortedNodes.length - 1];
    
    if (distribution.spacing === 'equal') {
      const totalDistance = distribution.type === 'horizontal'
        ? lastNode.position.x - firstNode.position.x
        : lastNode.position.y - firstNode.position.y;
      
      const spacing = totalDistance / (sortedNodes.length - 1);
      
      sortedNodes.forEach((node, index) => {
        if (index === 0 || index === sortedNodes.length - 1) return;
        
        let newPosition = { ...node.position };
        
        if (distribution.type === 'horizontal') {
          newPosition.x = firstNode.position.x + (spacing * index);
        } else {
          newPosition.y = firstNode.position.y + (spacing * index);
        }
        
        if (snapToGrid) {
          newPosition.x = Math.round(newPosition.x / gridSize) * gridSize;
          newPosition.y = Math.round(newPosition.y / gridSize) * gridSize;
        }
        
        await updateNode(node.id, { position: newPosition });
      });
    } else {
      // Distribuição com espaçamento customizado
      let currentPosition = distribution.type === 'horizontal'
        ? firstNode.position.x
        : firstNode.position.y;
      
      sortedNodes.forEach((node, index) => {
        if (index === 0) return;
        
        currentPosition += distribution.customSpacing || distributionSpacing;
        
        let newPosition = { ...node.position };
        
        if (distribution.type === 'horizontal') {
          newPosition.x = currentPosition;
        } else {
          newPosition.y = currentPosition;
        }
        
        if (snapToGrid) {
          newPosition.x = Math.round(newPosition.x / gridSize) * gridSize;
          newPosition.y = Math.round(newPosition.y / gridSize) * gridSize;
        }
        
        await updateNode(node.id, { position: newPosition });
      });
    }
    
    secureLogger.info('Nós distribuídos', { 
      distribution: distribution.type, 
      spacing: distribution.spacing,
      count: selectedNodes.length 
    });
  }, [selectedNodes, canDistribute, distributionSpacing, snapToGrid, gridSize, updateNode]);

  // ============================================================================
  // OPERAÇÕES DE TRANSFORMAÇÃO
  // ============================================================================

  const rotateNodes = useCallback(async (angle: number) => {
    if (!hasSelection) return;
    
    selectedNodes.forEach(node => {
      const currentRotation = node.data?.transform?.rotation || 0;
      const newRotation = (currentRotation + angle) % 360;
      
      await updateNode(node.id, {
        data: {
          ...node.data,
          transform: {
            ...node.data?.transform,
            rotation: newRotation
          }
        }
      });
    });
    
    secureLogger.info('Nós rotacionados', { angle, count: selectedNodes.length });
  }, [selectedNodes, hasSelection, updateNode]);

  const scaleNodes = useCallback(async (scale: number) => {
    if (!hasSelection) return;
    
    selectedNodes.forEach(node => {
      const currentScale = node.data?.transform?.scale || 1;
      const newScale = Math.max(0.1, Math.min(5, currentScale * scale));
      
      await updateNode(node.id, {
        data: {
          ...node.data,
          transform: {
            ...node.data?.transform,
            scale: newScale
          }
        }
      });
    });
    
    secureLogger.info('Nós redimensionados', { scale, count: selectedNodes.length });
  }, [selectedNodes, hasSelection, updateNode]);

  // ============================================================================
  // OPERAÇÕES DE CAMADAS
  // ============================================================================

  const moveToFront = useCallback(async () => {
    if (!hasSelection) return;
    
    const maxZIndex = Math.max(...nodes.map(n => n.data?.zIndex || 0));
    
    selectedNodes.forEach((node, index) => {
      await updateNode(node.id, {
        data: {
          ...node.data,
          zIndex: maxZIndex + index + 1
        }
      });
    });
    
    secureLogger.info('Nós movidos para frente', { count: selectedNodes.length });
  }, [selectedNodes, hasSelection, nodes, updateNode]);

  const moveToBack = useCallback(async () => {
    if (!hasSelection) return;
    
    const minZIndex = Math.min(...nodes.map(n => n.data?.zIndex || 0));
    
    selectedNodes.forEach((node, index) => {
      await updateNode(node.id, {
        data: {
          ...node.data,
          zIndex: minZIndex - selectedNodes.length + index
        }
      });
    });
    
    secureLogger.info('Nós movidos para trás', { count: selectedNodes.length });
  }, [selectedNodes, hasSelection, nodes, updateNode]);

  // ============================================================================
  // OPERAÇÕES DE AGRUPAMENTO
  // ============================================================================

  const createGroup = useCallback(() => {
    if (!canGroup) return;
    
    const nodeIds = selectedNodes.map(n => n.id);
    const groupId = groupNodes(nodeIds);
    
    if (groupId) {
      setSelectedNodeIds([groupId]);
      secureLogger.info('Grupo criado', { nodeIds, groupId });
    }
  }, [selectedNodes, canGroup, groupNodes, setSelectedNodeIds]);

  // ============================================================================
  // RENDER
  // ============================================================================

  const containerClasses = {
    floating: 'fixed top-4 right-4 z-50 w-80',
    sidebar: 'w-full',
    toolbar: 'flex flex-row items-center gap-2'
  };

  if (position === 'toolbar') {
    return (
      <TooltipProvider>
        <div className={`${containerClasses.toolbar} ${className}`}>
          {/* Operações básicas */}
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyNodes}
                  disabled={!hasSelection}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Copiar (Ctrl+C)</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={cutNodes}
                  disabled={!hasSelection}
                >
                  <Scissors className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Cortar (Ctrl+X)</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={pasteNodes}
                  disabled={clipboard.length === 0}
                >
                  <Clipboard className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Colar (Ctrl+V)</TooltipContent>
            </Tooltip>
          </div>
          
          <Separator orientation="vertical" className="h-6" />
          
          {/* Alinhamento */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" disabled={!canAlign}>
                <AlignCenter className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Alinhamento</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => alignNodes({ type: 'left', axis: 'horizontal' })}>
                <AlignLeft className="h-4 w-4 mr-2" />
                Alinhar à Esquerda
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => alignNodes({ type: 'center', axis: 'horizontal' })}>
                <AlignCenter className="h-4 w-4 mr-2" />
                Centralizar Horizontalmente
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => alignNodes({ type: 'right', axis: 'horizontal' })}>
                <AlignRight className="h-4 w-4 mr-2" />
                Alinhar à Direita
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => alignNodes({ type: 'top', axis: 'vertical' })}>
                <AlignVerticalJustifyCenter className="h-4 w-4 mr-2" />
                Alinhar ao Topo
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => alignNodes({ type: 'middle', axis: 'vertical' })}>
                <AlignHorizontalJustifyCenter className="h-4 w-4 mr-2" />
                Centralizar Verticalmente
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => alignNodes({ type: 'bottom', axis: 'vertical' })}>
                <AlignVerticalJustifyCenter className="h-4 w-4 mr-2" />
                Alinhar à Base
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Distribuição */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" disabled={!canDistribute}>
                <AlignHorizontalSpaceAround className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Distribuição</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => distributeNodes({ type: 'horizontal', spacing: 'equal' })}>
                <AlignHorizontalSpaceAround className="h-4 w-4 mr-2" />
                Distribuir Horizontalmente
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => distributeNodes({ type: 'vertical', spacing: 'equal' })}>
                <AlignVerticalSpaceAround className="h-4 w-4 mr-2" />
                Distribuir Verticalmente
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Separator orientation="vertical" className="h-6" />
          
          {/* Transformações */}
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => rotateNodes(-90)}
                  disabled={!hasSelection}
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Rotacionar -90°</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => rotateNodes(90)}
                  disabled={!hasSelection}
                >
                  <RotateCw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Rotacionar +90°</TooltipContent>
            </Tooltip>
          </div>
          
          <Separator orientation="vertical" className="h-6" />
          
          {/* Camadas */}
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={moveToFront}
                  disabled={!hasSelection}
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Trazer para Frente</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={moveToBack}
                  disabled={!hasSelection}
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Enviar para Trás</TooltipContent>
            </Tooltip>
          </div>
          
          {/* Agrupamento */}
          {canGroup && (
            <>
              <Separator orientation="vertical" className="h-6" />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={createGroup}
                  >
                    <Group className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Agrupar Nós</TooltipContent>
              </Tooltip>
            </>
          )}
          
          {/* Indicador de seleção */}
          {hasSelection && (
            <Badge variant="secondary" className="ml-2">
              {selectedNodes.length} selecionado{selectedNodes.length > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </TooltipProvider>
    );
  }

  return (
    <Card className={`${containerClasses[position]} ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Operações de Nós
          {hasSelection && (
            <Badge variant="secondary" className="ml-auto">
              {selectedNodes.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Operações de Clipboard */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground">CLIPBOARD</Label>
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={copyNodes}
              disabled={!hasSelection}
              className="flex flex-col items-center gap-1 h-auto py-2"
            >
              <Copy className="h-4 w-4" />
              {showLabels && <span className="text-xs">Copiar</span>}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={cutNodes}
              disabled={!hasSelection}
              className="flex flex-col items-center gap-1 h-auto py-2"
            >
              <Scissors className="h-4 w-4" />
              {showLabels && <span className="text-xs">Cortar</span>}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={pasteNodes}
              disabled={clipboard.length === 0}
              className="flex flex-col items-center gap-1 h-auto py-2"
            >
              <Clipboard className="h-4 w-4" />
              {showLabels && <span className="text-xs">Colar</span>}
            </Button>
          </div>
        </div>
        
        <Separator />
        
        {/* Alinhamento */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground">ALINHAMENTO</Label>
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => alignNodes({ type: 'left', axis: 'horizontal' })}
              disabled={!canAlign}
              className="flex flex-col items-center gap-1 h-auto py-2"
            >
              <AlignLeft className="h-4 w-4" />
              {showLabels && <span className="text-xs">Esquerda</span>}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => alignNodes({ type: 'center', axis: 'horizontal' })}
              disabled={!canAlign}
              className="flex flex-col items-center gap-1 h-auto py-2"
            >
              <AlignCenter className="h-4 w-4" />
              {showLabels && <span className="text-xs">Centro</span>}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => alignNodes({ type: 'right', axis: 'horizontal' })}
              disabled={!canAlign}
              className="flex flex-col items-center gap-1 h-auto py-2"
            >
              <AlignRight className="h-4 w-4" />
              {showLabels && <span className="text-xs">Direita</span>}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => alignNodes({ type: 'top', axis: 'vertical' })}
              disabled={!canAlign}
              className="flex flex-col items-center gap-1 h-auto py-2"
            >
              <AlignVerticalJustifyCenter className="h-4 w-4" />
              {showLabels && <span className="text-xs">Topo</span>}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => alignNodes({ type: 'middle', axis: 'vertical' })}
              disabled={!canAlign}
              className="flex flex-col items-center gap-1 h-auto py-2"
            >
              <AlignHorizontalJustifyCenter className="h-4 w-4" />
              {showLabels && <span className="text-xs">Meio</span>}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => alignNodes({ type: 'bottom', axis: 'vertical' })}
              disabled={!canAlign}
              className="flex flex-col items-center gap-1 h-auto py-2"
            >
              <AlignVerticalJustifyCenter className="h-4 w-4" />
              {showLabels && <span className="text-xs">Base</span>}
            </Button>
          </div>
        </div>
        
        <Separator />
        
        {/* Distribuição */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground">DISTRIBUIÇÃO</Label>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => distributeNodes({ type: 'horizontal', spacing: 'equal' })}
              disabled={!canDistribute}
              className="flex flex-col items-center gap-1 h-auto py-2"
            >
              <AlignHorizontalSpaceAround className="h-4 w-4" />
              {showLabels && <span className="text-xs">Horizontal</span>}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => distributeNodes({ type: 'vertical', spacing: 'equal' })}
              disabled={!canDistribute}
              className="flex flex-col items-center gap-1 h-auto py-2"
            >
              <AlignVerticalSpaceAround className="h-4 w-4" />
              {showLabels && <span className="text-xs">Vertical</span>}
            </Button>
          </div>
          
          <div className="space-y-2">
            <Label className="text-xs">Espaçamento: {distributionSpacing}px</Label>
            <Slider
              value={[distributionSpacing]}
              onValueChange={([value]) => setDistributionSpacing(value)}
              min={10}
              max={200}
              step={10}
              className="w-full"
            />
          </div>
        </div>
        
        <Separator />
        
        {/* Transformações */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground">TRANSFORMAÇÕES</Label>
          <div className="grid grid-cols-4 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => rotateNodes(-90)}
              disabled={!hasSelection}
              className="flex flex-col items-center gap-1 h-auto py-2"
            >
              <RotateCcw className="h-4 w-4" />
              {showLabels && <span className="text-xs">-90°</span>}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => rotateNodes(90)}
              disabled={!hasSelection}
              className="flex flex-col items-center gap-1 h-auto py-2"
            >
              <RotateCw className="h-4 w-4" />
              {showLabels && <span className="text-xs">+90°</span>}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => scaleNodes(1.2)}
              disabled={!hasSelection}
              className="flex flex-col items-center gap-1 h-auto py-2"
            >
              <Plus className="h-4 w-4" />
              {showLabels && <span className="text-xs">+20%</span>}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => scaleNodes(0.8)}
              disabled={!hasSelection}
              className="flex flex-col items-center gap-1 h-auto py-2"
            >
              <Minus className="h-4 w-4" />
              {showLabels && <span className="text-xs">-20%</span>}
            </Button>
          </div>
        </div>
        
        <Separator />
        
        {/* Camadas */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground">CAMADAS</Label>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={moveToFront}
              disabled={!hasSelection}
              className="flex flex-col items-center gap-1 h-auto py-2"
            >
              <ArrowUp className="h-4 w-4" />
              {showLabels && <span className="text-xs">Frente</span>}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={moveToBack}
              disabled={!hasSelection}
              className="flex flex-col items-center gap-1 h-auto py-2"
            >
              <ArrowDown className="h-4 w-4" />
              {showLabels && <span className="text-xs">Trás</span>}
            </Button>
          </div>
        </div>
        
        {/* Agrupamento */}
        {canGroup && (
          <>
            <Separator />
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">AGRUPAMENTO</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={createGroup}
                className="w-full flex items-center gap-2"
              >
                <Group className="h-4 w-4" />
                Agrupar Nós
              </Button>
            </div>
          </>
        )}
        
        <Separator />
        
        {/* Configurações */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground">CONFIGURAÇÕES</Label>
          
          <div className="flex items-center justify-between">
            <Label className="text-xs">Snap to Grid</Label>
            <Switch
              checked={snapToGrid}
              onCheckedChange={setSnapToGrid}
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-xs">Grid: {gridSize}px</Label>
            <Slider
              value={[gridSize]}
              onValueChange={([value]) => setGridSize(value)}
              min={5}
              max={50}
              step={5}
              className="w-full"
              disabled={!snapToGrid}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdvancedNodeOperations;