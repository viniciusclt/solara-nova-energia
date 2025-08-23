// ============================================================================
// NodeTransformTools - Ferramentas de transformação de nós
// ============================================================================

import React, { useState, useCallback, useMemo } from 'react';
import {
  RotateCw,
  RotateCcw,
  Move,
  Maximize2,
  Minimize2,
  FlipHorizontal,
  FlipVertical,
  Lock,
  Unlock,
  Grid3X3,
  Crosshair,
  MousePointer,
  Settings,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  Square,
  Circle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
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
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { useDiagramStore } from '../store/useDiagramStore';
import { useNodeOperations } from '../hooks/useNodeOperations';
import { cn } from '@/lib/utils';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

export interface NodeTransformToolsProps {
  className?: string;
  position?: 'floating' | 'sidebar' | 'toolbar';
  compact?: boolean;
  showAdvanced?: boolean;
}

interface TransformState {
  rotation: number;
  scaleX: number;
  scaleY: number;
  x: number;
  y: number;
  width: number;
  height: number;
  locked: boolean;
  maintainAspectRatio: boolean;
}

interface TransformPreset {
  name: string;
  label: string;
  description: string;
  transform: Partial<TransformState>;
  icon: React.ReactNode;
}

// ============================================================================
// CONSTANTES
// ============================================================================

const TRANSFORM_PRESETS: TransformPreset[] = [
  {
    name: 'reset',
    label: 'Resetar',
    description: 'Voltar ao estado original',
    transform: { rotation: 0, scaleX: 1, scaleY: 1 },
    icon: <RefreshCw className="h-4 w-4" />
  },
  {
    name: 'rotate90',
    label: 'Rotação 90°',
    description: 'Rotacionar 90 graus',
    transform: { rotation: 90 },
    icon: <RotateCw className="h-4 w-4" />
  },
  {
    name: 'rotate180',
    label: 'Rotação 180°',
    description: 'Rotacionar 180 graus',
    transform: { rotation: 180 },
    icon: <RotateCw className="h-4 w-4" />
  },
  {
    name: 'flipH',
    label: 'Espelhar H',
    description: 'Espelhar horizontalmente',
    transform: { scaleX: -1 },
    icon: <FlipHorizontal className="h-4 w-4" />
  },
  {
    name: 'flipV',
    label: 'Espelhar V',
    description: 'Espelhar verticalmente',
    transform: { scaleY: -1 },
    icon: <FlipVertical className="h-4 w-4" />
  },
  {
    name: 'scale2x',
    label: 'Escala 2x',
    description: 'Dobrar o tamanho',
    transform: { scaleX: 2, scaleY: 2 },
    icon: <ZoomIn className="h-4 w-4" />
  },
  {
    name: 'scale05x',
    label: 'Escala 0.5x',
    description: 'Reduzir pela metade',
    transform: { scaleX: 0.5, scaleY: 0.5 },
    icon: <ZoomOut className="h-4 w-4" />
  }
];

const SNAP_MODES = [
  { value: 'none', label: 'Nenhum', icon: <MousePointer className="h-4 w-4" /> },
  { value: 'grid', label: 'Grade', icon: <Grid3X3 className="h-4 w-4" /> },
  { value: 'nodes', label: 'Nós', icon: <Square className="h-4 w-4" /> },
  { value: 'guides', label: 'Guias', icon: <Crosshair className="h-4 w-4" /> }
];

// ============================================================================
// COMPONENTES AUXILIARES
// ============================================================================

const TransformInput: React.FC<{
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  disabled?: boolean;
}> = ({ label, value, onChange, min, max, step = 1, suffix = '', disabled = false }) => {
  return (
    <div className="space-y-1">
      <Label className="text-xs font-medium">{label}</Label>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          className="h-8 text-xs"
        />
        {suffix && (
          <span className="text-xs text-muted-foreground">{suffix}</span>
        )}
      </div>
    </div>
  );
};

const TransformSlider: React.FC<{
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  disabled?: boolean;
}> = ({ label, value, onChange, min, max, step = 1, disabled = false }) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-medium">{label}</Label>
        <span className="text-xs text-muted-foreground">{value}</span>
      </div>
      <Slider
        value={[value]}
        onValueChange={([newValue]) => onChange(newValue)}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        className="w-full"
      />
    </div>
  );
};

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export const NodeTransformTools: React.FC<NodeTransformToolsProps> = ({
  className = '',
  position = 'floating',
  compact = false,
  showAdvanced = true
}) => {
  const { selectedNodes, updateNode } = useDiagramStore();
  const { moveNodeTo } = useNodeOperations();
  
  const [snapMode, setSnapMode] = useState<string>('grid');
  const [gridSize, setGridSize] = useState(20);
  const [showGrid, setShowGrid] = useState(true);
  const [lockAspectRatio, setLockAspectRatio] = useState(false);
  
  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================
  
  const selectedNode = useMemo(() => {
    return selectedNodes.length === 1 ? selectedNodes[0] : null;
  }, [selectedNodes]);
  
  const currentTransform = useMemo((): TransformState => {
    if (!selectedNode) {
      return {
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        locked: false,
        maintainAspectRatio: false
      };
    }
    
    return {
      rotation: selectedNode.data?.transform?.rotation || 0,
      scaleX: selectedNode.data?.transform?.scaleX || 1,
      scaleY: selectedNode.data?.transform?.scaleY || 1,
      x: selectedNode.position.x,
      y: selectedNode.position.y,
      width: selectedNode.width || 100,
      height: selectedNode.height || 100,
      locked: selectedNode.data?.locked || false,
      maintainAspectRatio: selectedNode.data?.maintainAspectRatio || false
    };
  }, [selectedNode]);
  
  const hasSelection = selectedNodes.length > 0;
  const multipleSelection = selectedNodes.length > 1;
  
  // ============================================================================
  // HANDLERS
  // ============================================================================
  
  const updateTransform = useCallback(async (updates: Partial<TransformState>) => {
    if (!selectedNode) return;
    
    const newData = {
      ...selectedNode.data,
      transform: {
        ...selectedNode.data?.transform,
        ...updates
      }
    };
    
    // Atualizar posição se necessário
    const newPosition = {
      x: updates.x !== undefined ? updates.x : selectedNode.position.x,
      y: updates.y !== undefined ? updates.y : selectedNode.position.y
    };
    
    // Atualizar dimensões se necessário
    const newDimensions = {
      width: updates.width !== undefined ? updates.width : selectedNode.width,
      height: updates.height !== undefined ? updates.height : selectedNode.height
    };
    
    await updateNode(selectedNode.id, {
      data: newData,
      position: newPosition,
      ...newDimensions
    });
  }, [selectedNode, updateNode]);
  
  const handleRotation = useCallback((rotation: number) => {
    updateTransform({ rotation });
  }, [updateTransform]);
  
  const handleScale = useCallback((scaleX: number, scaleY?: number) => {
    const finalScaleY = scaleY !== undefined ? scaleY : (lockAspectRatio ? scaleX : currentTransform.scaleY);
    updateTransform({ scaleX, scaleY: finalScaleY });
  }, [updateTransform, lockAspectRatio, currentTransform.scaleY]);
  
  const handlePosition = useCallback((x: number, y: number) => {
    if (snapMode === 'grid') {
      x = Math.round(x / gridSize) * gridSize;
      y = Math.round(y / gridSize) * gridSize;
    }
    updateTransform({ x, y });
  }, [updateTransform, snapMode, gridSize]);
  
  const handleDimensions = useCallback((width: number, height?: number) => {
    const finalHeight = height !== undefined ? height : (lockAspectRatio ? (width * currentTransform.height) / currentTransform.width : currentTransform.height);
    updateTransform({ width, height: finalHeight });
  }, [updateTransform, lockAspectRatio, currentTransform]);
  
  const applyPreset = useCallback((preset: TransformPreset) => {
    updateTransform(preset.transform);
  }, [updateTransform]);
  
  const handleLock = useCallback(() => {
    updateTransform({ locked: !currentTransform.locked });
  }, [updateTransform, currentTransform.locked]);
  
  const resetTransform = useCallback(() => {
    updateTransform({
      rotation: 0,
      scaleX: 1,
      scaleY: 1
    });
  }, [updateTransform]);
  
  // ============================================================================
  // RENDER
  // ============================================================================
  
  if (!hasSelection) {
    return (
      <Card className={cn('w-80', className)}>
        <CardContent className="p-4">
          <div className="text-center text-muted-foreground">
            <Settings className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Selecione um nó para transformar</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (multipleSelection) {
    return (
      <Card className={cn('w-80', className)}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Transformação
            <Badge variant="secondary">{selectedNodes.length} selecionados</Badge>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="text-center text-muted-foreground">
            <p className="text-sm">Transformação em lote em desenvolvimento</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className={cn('w-80', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Transformação
          {currentTransform.locked && (
            <Lock className="h-3 w-3 text-orange-500" />
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Presets rápidos */}
        <div className="space-y-2">
          <Label className="text-xs font-medium">Presets</Label>
          <div className="grid grid-cols-4 gap-1">
            {TRANSFORM_PRESETS.slice(0, compact ? 4 : 8).map((preset) => (
              <TooltipProvider key={preset.name}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => applyPreset(preset)}
                      disabled={currentTransform.locked}
                      className="h-8 w-8 p-0"
                    >
                      {preset.icon}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div>
                      <div className="font-medium">{preset.label}</div>
                      <div className="text-xs text-muted-foreground">
                        {preset.description}
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
        </div>
        
        <Separator />
        
        {/* Controles de rotação */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium">Rotação</Label>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRotation(currentTransform.rotation - 90)}
                disabled={currentTransform.locked}
                className="h-6 w-6 p-0"
              >
                <RotateCcw className="h-3 w-3" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRotation(currentTransform.rotation + 90)}
                disabled={currentTransform.locked}
                className="h-6 w-6 p-0"
              >
                <RotateCw className="h-3 w-3" />
              </Button>
            </div>
          </div>
          
          <TransformSlider
            label="Ângulo"
            value={currentTransform.rotation}
            onChange={handleRotation}
            min={-180}
            max={180}
            step={1}
            disabled={currentTransform.locked}
          />
        </div>
        
        <Separator />
        
        {/* Controles de escala */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium">Escala</Label>
            <div className="flex items-center gap-2">
              <Switch
                checked={lockAspectRatio}
                onCheckedChange={setLockAspectRatio}
                size="sm"
              />
              <Label className="text-xs">Proporção</Label>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <TransformInput
              label="Largura"
              value={currentTransform.scaleX}
              onChange={(value) => handleScale(value)}
              min={0.1}
              max={5}
              step={0.1}
              suffix="x"
              disabled={currentTransform.locked}
            />
            <TransformInput
              label="Altura"
              value={currentTransform.scaleY}
              onChange={(value) => handleScale(currentTransform.scaleX, value)}
              min={0.1}
              max={5}
              step={0.1}
              suffix="x"
              disabled={currentTransform.locked || lockAspectRatio}
            />
          </div>
        </div>
        
        {showAdvanced && (
          <>
            <Separator />
            
            {/* Controles de posição */}
            <div className="space-y-3">
              <Label className="text-xs font-medium">Posição</Label>
              <div className="grid grid-cols-2 gap-3">
                <TransformInput
                  label="X"
                  value={currentTransform.x}
                  onChange={(value) => handlePosition(value, currentTransform.y)}
                  suffix="px"
                  disabled={currentTransform.locked}
                />
                <TransformInput
                  label="Y"
                  value={currentTransform.y}
                  onChange={(value) => handlePosition(currentTransform.x, value)}
                  suffix="px"
                  disabled={currentTransform.locked}
                />
              </div>
            </div>
            
            <Separator />
            
            {/* Controles de dimensões */}
            <div className="space-y-3">
              <Label className="text-xs font-medium">Dimensões</Label>
              <div className="grid grid-cols-2 gap-3">
                <TransformInput
                  label="Largura"
                  value={currentTransform.width}
                  onChange={(value) => handleDimensions(value)}
                  min={10}
                  suffix="px"
                  disabled={currentTransform.locked}
                />
                <TransformInput
                  label="Altura"
                  value={currentTransform.height}
                  onChange={(value) => handleDimensions(currentTransform.width, value)}
                  min={10}
                  suffix="px"
                  disabled={currentTransform.locked || lockAspectRatio}
                />
              </div>
            </div>
            
            <Separator />
            
            {/* Configurações de snap */}
            <div className="space-y-3">
              <Label className="text-xs font-medium">Snap</Label>
              <Select value={snapMode} onValueChange={setSnapMode}>
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SNAP_MODES.map((mode) => (
                    <SelectItem key={mode.value} value={mode.value}>
                      <div className="flex items-center gap-2">
                        {mode.icon}
                        {mode.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {snapMode === 'grid' && (
                <TransformInput
                  label="Tamanho da grade"
                  value={gridSize}
                  onChange={setGridSize}
                  min={5}
                  max={100}
                  step={5}
                  suffix="px"
                />
              )}
            </div>
          </>
        )}
        
        <Separator />
        
        {/* Ações */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={handleLock}
            className="flex items-center gap-2"
          >
            {currentTransform.locked ? (
              <><Unlock className="h-3 w-3" /> Desbloquear</>
            ) : (
              <><Lock className="h-3 w-3" /> Bloquear</>
            )}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={resetTransform}
            disabled={currentTransform.locked}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-3 w-3" />
            Resetar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default NodeTransformTools;