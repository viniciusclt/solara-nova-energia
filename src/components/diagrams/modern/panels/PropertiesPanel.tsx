/**
 * Painel de Propriedades para Editor Moderno
 * Permite editar propriedades dos elementos selecionados
 */

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import {
  Settings,
  Palette,
  Type,
  Layout,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Trash2,
  Copy,
  RotateCw,
  Move,
  Layers
} from 'lucide-react';
import { Node, Edge } from 'reactflow';

interface PropertiesPanelProps {
  selectedNode: Node | null;
  selectedEdge: Edge | null;
  onUpdateNode: (nodeId: string, updates: Partial<Node>) => void;
  onUpdateEdge: (edgeId: string, updates: Partial<Edge>) => void;
  onDeleteSelected: () => void;
}

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  selectedNode,
  selectedEdge,
  onUpdateNode,
  onUpdateEdge,
  onDeleteSelected
}) => {
  const [activeTab, setActiveTab] = useState('style');
  const [localUpdates, setLocalUpdates] = useState<Record<string, any>>({});

  const hasSelection = selectedNode !== null || selectedEdge !== null;
  const multipleSelection = false; // Não há seleção múltipla nesta versão

  // Cores predefinidas
  const colorPalette = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
    '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1',
    '#14b8a6', '#eab308', '#dc2626', '#9333ea', '#0891b2'
  ];

  // Formas disponíveis para fluxogramas
  const shapes = [
    { value: 'rectangle', label: 'Retângulo' },
    { value: 'ellipse', label: 'Elipse' },
    { value: 'diamond', label: 'Losango' },
    { value: 'parallelogram', label: 'Paralelogramo' },
    { value: 'hexagon', label: 'Hexágono' },
    { value: 'circle', label: 'Círculo' }
  ];

  // Tamanhos disponíveis
  const sizes = [
    { value: 'sm', label: 'Pequeno' },
    { value: 'md', label: 'Médio' },
    { value: 'lg', label: 'Grande' }
  ];

  // Status disponíveis
  const statusOptions = [
    { value: 'active', label: 'Ativo', color: '#10b981' },
    { value: 'completed', label: 'Concluído', color: '#3b82f6' },
    { value: 'pending', label: 'Pendente', color: '#f59e0b' },
    { value: 'error', label: 'Erro', color: '#ef4444' }
  ];

  useEffect(() => {
    // Reset local updates when selection changes
    setLocalUpdates({});
  }, [selectedNode?.id, selectedEdge?.id]);

  const updateNodeProperty = (property: string, value: any) => {
    if (!selectedNode) return;
    
    const updates = {
      data: {
        ...selectedNode.data,
        [property]: value
      }
    };
    
    setLocalUpdates(prev => ({
      ...prev,
      [selectedNode.id]: {
        ...prev[selectedNode.id],
        [property]: value
      }
    }));
    
    onUpdateNode(selectedNode.id, updates);
  };

  const updateEdgeProperty = (property: string, value: any) => {
    if (!selectedEdge) return;
    
    const updates = {
      [property]: value
    };
    
    onUpdateEdge(selectedEdge.id, updates);
  };

  const getCurrentValue = (property: string, defaultValue: any = '') => {
    if (!selectedNode) return defaultValue;
    
    const localValue = localUpdates[selectedNode.id]?.[property];
    if (localValue !== undefined) return localValue;
    
    return selectedNode.data?.[property] ?? defaultValue;
  };

  const renderNoSelection = () => (
    <div className="flex flex-col items-center justify-center h-64 text-gray-500">
      <Settings className="w-12 h-12 mb-4 opacity-50" />
      <p className="text-sm font-medium">Nenhum elemento selecionado</p>
      <p className="text-xs mt-1 text-center">
        Selecione um elemento no canvas para editar suas propriedades
      </p>
    </div>
  );

  const renderMultipleSelection = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">
          Elemento Selecionado
        </h3>
      </div>
      
      <div className="space-y-3">
        <Button
          variant="outline"
          size="sm"
          onClick={onDeleteSelected}
          className="w-full flex items-center gap-2 text-red-600 hover:text-red-700"
        >
          <Trash2 className="w-4 h-4" />
          Excluir Selecionado
        </Button>
      </div>
    </div>
  );

  const renderNodeProperties = () => {
    if (!selectedNode) return null;

    return (
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="style" className="flex items-center gap-1">
            <Palette className="w-3 h-3" />
            <span className="hidden sm:inline">Estilo</span>
          </TabsTrigger>
          <TabsTrigger value="content" className="flex items-center gap-1">
            <Type className="w-3 h-3" />
            <span className="hidden sm:inline">Conteúdo</span>
          </TabsTrigger>
          <TabsTrigger value="layout" className="flex items-center gap-1">
            <Layout className="w-3 h-3" />
            <span className="hidden sm:inline">Layout</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="style" className="space-y-4 mt-4">
          {/* Cor */}
          <div className="space-y-2">
            <Label>Cor</Label>
            <div className="grid grid-cols-5 gap-2">
              {colorPalette.map(color => (
                <button
                  key={color}
                  onClick={() => updateNodeProperty('color', color)}
                  className={cn(
                    'w-8 h-8 rounded-md border-2 transition-all',
                    getCurrentValue('color') === color
                      ? 'border-gray-900 scale-110'
                      : 'border-gray-300 hover:border-gray-400'
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Forma (para fluxogramas) */}
          {selectedNode.type === 'flowchart' && (
            <div className="space-y-2">
              <Label>Forma</Label>
              <Select
                value={getCurrentValue('shape', 'rectangle')}
                onValueChange={(value) => updateNodeProperty('shape', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {shapes.map(shape => (
                    <SelectItem key={shape.value} value={shape.value}>
                      {shape.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Tamanho */}
          <div className="space-y-2">
            <Label>Tamanho</Label>
            <Select
              value={getCurrentValue('size', 'md')}
              onValueChange={(value) => updateNodeProperty('size', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sizes.map(size => (
                  <SelectItem key={size.value} value={size.value}>
                    {size.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={getCurrentValue('status', 'active')}
              onValueChange={(value) => updateNodeProperty('status', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map(status => (
                  <SelectItem key={status.value} value={status.value}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: status.color }}
                      />
                      {status.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </TabsContent>

        <TabsContent value="content" className="space-y-4 mt-4">
          {/* Label */}
          <div className="space-y-2">
            <Label>Texto Principal</Label>
            <Input
              value={getCurrentValue('label', '')}
              onChange={(e) => updateNodeProperty('label', e.target.value)}
              placeholder="Digite o texto..."
            />
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea
              value={getCurrentValue('description', '')}
              onChange={(e) => updateNodeProperty('description', e.target.value)}
              placeholder="Descrição opcional..."
              rows={3}
            />
          </div>

          {/* Ícone/Emoji */}
          <div className="space-y-2">
            <Label>Ícone/Emoji</Label>
            <Input
              value={getCurrentValue('icon', '')}
              onChange={(e) => updateNodeProperty('icon', e.target.value)}
              placeholder="🎯 ou ícone..."
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags</Label>
            <Input
              value={getCurrentValue('tags', []).join(', ')}
              onChange={(e) => updateNodeProperty('tags', e.target.value.split(',').map(tag => tag.trim()).filter(Boolean))}
              placeholder="tag1, tag2, tag3..."
            />
            <div className="flex flex-wrap gap-1 mt-2">
              {getCurrentValue('tags', []).map((tag: string, index: number) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="layout" className="space-y-4 mt-4">
          {/* Posição */}
          <div className="space-y-2">
            <Label>Posição</Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-gray-500">X</Label>
                <Input
                  type="number"
                  value={Math.round(selectedNode.position.x)}
                  onChange={(e) => {
                    const newPosition = {
                      ...selectedNode.position,
                      x: parseFloat(e.target.value) || 0
                    };
                    onUpdateNode(selectedNode.id, { position: newPosition });
                  }}
                />
              </div>
              <div>
                <Label className="text-xs text-gray-500">Y</Label>
                <Input
                  type="number"
                  value={Math.round(selectedNode.position.y)}
                  onChange={(e) => {
                    const newPosition = {
                      ...selectedNode.position,
                      y: parseFloat(e.target.value) || 0
                    };
                    onUpdateNode(selectedNode.id, { position: newPosition });
                  }}
                />
              </div>
            </div>
          </div>

          {/* Visibilidade */}
          <div className="flex items-center justify-between">
            <Label>Visível</Label>
            <Switch
              checked={!selectedNode.hidden}
              onCheckedChange={(checked) => onUpdateNode(selectedNode.id, { hidden: !checked })}
            />
          </div>

          {/* Bloqueado */}
          <div className="flex items-center justify-between">
            <Label>Bloqueado</Label>
            <Switch
              checked={selectedNode.draggable === false}
              onCheckedChange={(checked) => onUpdateNode(selectedNode.id, { draggable: !checked })}
            />
          </div>
        </TabsContent>
      </Tabs>
    );
  };

  const renderActions = () => {
    if (!hasSelection) return null;

    return (
      <div className="space-y-2">
        <Separator />
        <div className="grid grid-cols-1 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onDeleteSelected}
            className="flex items-center gap-1 text-red-600 hover:text-red-700"
          >
            <Trash2 className="w-3 h-3" />
            Excluir
          </Button>
        </div>
      </div>
    );
  };

  return (
    <Card className="w-80 h-full flex flex-col bg-white shadow-lg">
      {/* Header */}
      <div className="p-4 border-b">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <Settings className="w-4 h-4" />
          Propriedades
        </h3>
      </div>
      
      {/* Content */}
      <ScrollArea className="flex-1 p-4">
        {!hasSelection && renderNoSelection()}
        {multipleSelection && renderMultipleSelection()}
        {selectedNode && !multipleSelection && renderNodeProperties()}
        {renderActions()}
      </ScrollArea>
    </Card>
  );
};

export default PropertiesPanel;
export { PropertiesPanel };