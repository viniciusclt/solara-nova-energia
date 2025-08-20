// ============================================================================
// NodeEditor - Componente para edição de propriedades dos nós
// ============================================================================

import React, { useState, useCallback, useEffect } from 'react';
import {
  FlowchartNode,
  FlowchartNodeType,
  FlowchartNodeData,
  FlowchartNodeStyle,
  FLOWCHART_NODE_TYPES
} from '@/types/flowchart';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  Palette,
  Type,
  Move,
  Resize,
  RotateCw,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Copy,
  Trash2,
  Settings,
  Code,
  MessageSquare,
  Link,
  Tag,
  Hash,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline
} from 'lucide-react';
import { toast } from 'sonner';

// ============================================================================
// Interfaces
// ============================================================================

export interface NodeEditorProps {
  node: FlowchartNode | null;
  onUpdate: (nodeId: string, updates: Partial<FlowchartNode>) => void;
  onDelete: (nodeId: string) => void;
  onDuplicate: (nodeId: string) => void;
  onClose?: () => void;
  readOnly?: boolean;
  className?: string;
}

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  label: string;
}

interface StyleEditorProps {
  style: FlowchartNodeStyle;
  onChange: (style: FlowchartNodeStyle) => void;
}

interface DataEditorProps {
  data: FlowchartNodeData;
  onChange: (data: FlowchartNodeData) => void;
}

// ============================================================================
// Componentes Auxiliares
// ============================================================================

/**
 * Seletor de cores
 */
const ColorPicker: React.FC<ColorPickerProps> = ({ color, onChange, label }) => {
  const presetColors = [
    '#ffffff', '#f3f4f6', '#e5e7eb', '#d1d5db',
    '#ef4444', '#f97316', '#eab308', '#22c55e',
    '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4'
  ];

  return (
    <div className="space-y-2">
      <Label className="text-xs">{label}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full h-8 p-1"
          >
            <div
              className="w-full h-full rounded border"
              style={{ backgroundColor: color }}
            />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64">
          <div className="space-y-3">
            <div className="grid grid-cols-4 gap-2">
              {presetColors.map((presetColor) => (
                <button
                  key={presetColor}
                  className="w-8 h-8 rounded border-2 border-gray-200 hover:border-gray-400"
                  style={{ backgroundColor: presetColor }}
                  onClick={() => onChange(presetColor)}
                />
              ))}
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Cor personalizada</Label>
              <Input
                type="color"
                value={color}
                onChange={(e) => onChange(e.target.value)}
                className="h-8"
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

/**
 * Editor de estilos do nó
 */
const StyleEditor: React.FC<StyleEditorProps> = ({ style, onChange }) => {
  const updateStyle = (updates: Partial<FlowchartNodeStyle>) => {
    onChange({ ...style, ...updates });
  };

  return (
    <div className="space-y-4">
      {/* Cores */}
      <div className="grid grid-cols-2 gap-3">
        <ColorPicker
          color={style.backgroundColor || '#ffffff'}
          onChange={(color) => updateStyle({ backgroundColor: color })}
          label="Fundo"
        />
        <ColorPicker
          color={style.borderColor || '#d1d5db'}
          onChange={(color) => updateStyle({ borderColor: color })}
          label="Borda"
        />
      </div>

      {/* Texto */}
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <ColorPicker
            color={style.textColor || '#000000'}
            onChange={(color) => updateStyle({ textColor: color })}
            label="Texto"
          />
          <div className="space-y-2">
            <Label className="text-xs">Tamanho</Label>
            <Select
              value={style.fontSize?.toString() || '14'}
              onValueChange={(value) => updateStyle({ fontSize: parseInt(value) })}
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10px</SelectItem>
                <SelectItem value="12">12px</SelectItem>
                <SelectItem value="14">14px</SelectItem>
                <SelectItem value="16">16px</SelectItem>
                <SelectItem value="18">18px</SelectItem>
                <SelectItem value="20">20px</SelectItem>
                <SelectItem value="24">24px</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Formatação de texto */}
        <div className="flex items-center space-x-2">
          <Button
            variant={style.fontWeight === 'bold' ? 'default' : 'outline'}
            size="sm"
            onClick={() => updateStyle({ 
              fontWeight: style.fontWeight === 'bold' ? 'normal' : 'bold' 
            })}
          >
            <Bold className="h-3 w-3" />
          </Button>
          <Button
            variant={style.fontStyle === 'italic' ? 'default' : 'outline'}
            size="sm"
            onClick={() => updateStyle({ 
              fontStyle: style.fontStyle === 'italic' ? 'normal' : 'italic' 
            })}
          >
            <Italic className="h-3 w-3" />
          </Button>
          <Button
            variant={style.textDecoration === 'underline' ? 'default' : 'outline'}
            size="sm"
            onClick={() => updateStyle({ 
              textDecoration: style.textDecoration === 'underline' ? 'none' : 'underline' 
            })}
          >
            <Underline className="h-3 w-3" />
          </Button>
        </div>

        {/* Alinhamento */}
        <div className="space-y-2">
          <Label className="text-xs">Alinhamento</Label>
          <div className="flex items-center space-x-1">
            <Button
              variant={style.textAlign === 'left' ? 'default' : 'outline'}
              size="sm"
              onClick={() => updateStyle({ textAlign: 'left' })}
            >
              <AlignLeft className="h-3 w-3" />
            </Button>
            <Button
              variant={style.textAlign === 'center' ? 'default' : 'outline'}
              size="sm"
              onClick={() => updateStyle({ textAlign: 'center' })}
            >
              <AlignCenter className="h-3 w-3" />
            </Button>
            <Button
              variant={style.textAlign === 'right' ? 'default' : 'outline'}
              size="sm"
              onClick={() => updateStyle({ textAlign: 'right' })}
            >
              <AlignRight className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>

      {/* Borda */}
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label className="text-xs">Espessura da borda</Label>
            <Slider
              value={[style.borderWidth || 1]}
              onValueChange={([value]) => updateStyle({ borderWidth: value })}
              max={10}
              min={0}
              step={1}
              className="w-full"
            />
            <span className="text-xs text-muted-foreground">
              {style.borderWidth || 1}px
            </span>
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Estilo da borda</Label>
            <Select
              value={style.borderStyle || 'solid'}
              onValueChange={(value) => updateStyle({ borderStyle: value as 'solid' | 'dashed' | 'dotted' | 'none' })}
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="solid">Sólida</SelectItem>
                <SelectItem value="dashed">Tracejada</SelectItem>
                <SelectItem value="dotted">Pontilhada</SelectItem>
                <SelectItem value="none">Nenhuma</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs">Raio da borda</Label>
          <Slider
            value={[style.borderRadius || 0]}
            onValueChange={([value]) => updateStyle({ borderRadius: value })}
            max={50}
            min={0}
            step={1}
            className="w-full"
          />
          <span className="text-xs text-muted-foreground">
            {style.borderRadius || 0}px
          </span>
        </div>
      </div>

      {/* Sombra */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-xs">Sombra</Label>
          <Switch
            checked={!!style.boxShadow}
            onCheckedChange={(checked) => 
              updateStyle({ 
                boxShadow: checked ? '0 2px 4px rgba(0,0,0,0.1)' : undefined 
              })
            }
          />
        </div>
      </div>

      {/* Opacidade */}
      <div className="space-y-2">
        <Label className="text-xs">Opacidade</Label>
        <Slider
          value={[style.opacity || 1]}
          onValueChange={([value]) => updateStyle({ opacity: value })}
          max={1}
          min={0}
          step={0.1}
          className="w-full"
        />
        <span className="text-xs text-muted-foreground">
          {Math.round((style.opacity || 1) * 100)}%
        </span>
      </div>
    </div>
  );
};

/**
 * Editor de dados do nó
 */
const DataEditor: React.FC<DataEditorProps> = ({ data, onChange }) => {
  const updateData = (updates: Partial<FlowchartNodeData>) => {
    onChange({ ...data, ...updates });
  };

  return (
    <div className="space-y-4">
      {/* Texto principal */}
      <div className="space-y-2">
        <Label className="text-sm">Texto</Label>
        <Textarea
          value={data.text || ''}
          onChange={(e) => updateData({ text: e.target.value })}
          placeholder="Digite o texto do nó..."
          className="min-h-[80px]"
        />
      </div>

      {/* Descrição */}
      <div className="space-y-2">
        <Label className="text-sm">Descrição</Label>
        <Textarea
          value={data.description || ''}
          onChange={(e) => updateData({ description: e.target.value })}
          placeholder="Descrição opcional..."
          className="min-h-[60px]"
        />
      </div>

      {/* Propriedades customizadas */}
      <div className="space-y-3">
        <Label className="text-sm">Propriedades customizadas</Label>
        {data.properties && Object.entries(data.properties).map(([key, value]) => (
          <div key={key} className="flex items-center space-x-2">
            <Input
              value={key}
              onChange={(e) => {
                const newProperties = { ...data.properties };
                delete newProperties[key];
                newProperties[e.target.value] = value;
                updateData({ properties: newProperties });
              }}
              placeholder="Chave"
              className="flex-1"
            />
            <Input
              value={value as string}
              onChange={(e) => {
                updateData({
                  properties: {
                    ...data.properties,
                    [key]: e.target.value
                  }
                });
              }}
              placeholder="Valor"
              className="flex-1"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const newProperties = { ...data.properties };
                delete newProperties[key];
                updateData({ properties: newProperties });
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            updateData({
              properties: {
                ...data.properties,
                [`propriedade_${Date.now()}`]: ''
              }
            });
          }}
        >
          <Tag className="h-4 w-4 mr-1" />
          Adicionar propriedade
        </Button>
      </div>

      {/* Configurações */}
      <div className="space-y-3">
        <Label className="text-sm">Configurações</Label>
        
        <div className="flex items-center justify-between">
          <Label className="text-xs">Redimensionável</Label>
          <Switch
            checked={data.resizable !== false}
            onCheckedChange={(checked) => updateData({ resizable: checked })}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label className="text-xs">Selecionável</Label>
          <Switch
            checked={data.selectable !== false}
            onCheckedChange={(checked) => updateData({ selectable: checked })}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label className="text-xs">Conectável</Label>
          <Switch
            checked={data.connectable !== false}
            onCheckedChange={(checked) => updateData({ connectable: checked })}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label className="text-xs">Deletável</Label>
          <Switch
            checked={data.deletable !== false}
            onCheckedChange={(checked) => updateData({ deletable: checked })}
          />
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// Componente Principal
// ============================================================================

/**
 * Editor de propriedades dos nós
 */
export const NodeEditor: React.FC<NodeEditorProps> = ({
  node,
  onUpdate,
  onDelete,
  onDuplicate,
  onClose,
  readOnly = false,
  className = ''
}) => {
  const [localNode, setLocalNode] = useState<FlowchartNode | null>(node);
  const [hasChanges, setHasChanges] = useState(false);

  // Sincronizar com prop node
  useEffect(() => {
    setLocalNode(node);
    setHasChanges(false);
  }, [node]);

  // Handlers para atualização
  const handleUpdate = useCallback((updates: Partial<FlowchartNode>) => {
    if (!localNode) return;

    const updatedNode = { ...localNode, ...updates };
    setLocalNode(updatedNode);
    setHasChanges(true);
  }, [localNode]);

  const handleSave = useCallback(() => {
    if (!localNode || !hasChanges) return;

    onUpdate(localNode.id, localNode);
    setHasChanges(false);
    toast.success('Nó atualizado com sucesso!');
  }, [localNode, hasChanges, onUpdate]);

  const handleReset = useCallback(() => {
    setLocalNode(node);
    setHasChanges(false);
  }, [node]);

  const handleDelete = useCallback(() => {
    if (!localNode) return;

    onDelete(localNode.id);
    onClose?.();
    toast.success('Nó deletado com sucesso!');
  }, [localNode, onDelete, onClose]);

  const handleDuplicate = useCallback(() => {
    if (!localNode) return;

    onDuplicate(localNode.id);
    toast.success('Nó duplicado com sucesso!');
  }, [localNode, onDuplicate]);

  // Renderizar se não há nó selecionado
  if (!localNode) {
    return (
      <div className={`w-80 border-l bg-background p-4 ${className}`}>
        <div className="flex items-center justify-center h-32 text-center">
          <div>
            <Settings className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Selecione um nó para editar suas propriedades
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-80 border-l bg-background flex flex-col ${className}`}>
      {/* Cabeçalho */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium">Propriedades do Nó</h3>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              ×
            </Button>
          )}
        </div>
        
        <div className="flex items-center space-x-2 mb-3">
          <Badge variant="secondary" className="text-xs">
            {FLOWCHART_NODE_TYPES.find(t => t.value === localNode.type)?.label || localNode.type}
          </Badge>
          <Badge variant="outline" className="text-xs">
            ID: {localNode.id.slice(0, 8)}...
          </Badge>
        </div>

        {/* Ações */}
        {!readOnly && (
          <div className="flex items-center space-x-1">
            <Button
              variant={hasChanges ? 'default' : 'outline'}
              size="sm"
              onClick={handleSave}
              disabled={!hasChanges}
            >
              Salvar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              disabled={!hasChanges}
            >
              Resetar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDuplicate}
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Conteúdo */}
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="data" className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-3 mx-4 mt-4">
            <TabsTrigger value="data" className="text-xs">
              <MessageSquare className="h-3 w-3 mr-1" />
              Dados
            </TabsTrigger>
            <TabsTrigger value="style" className="text-xs">
              <Palette className="h-3 w-3 mr-1" />
              Estilo
            </TabsTrigger>
            <TabsTrigger value="position" className="text-xs">
              <Move className="h-3 w-3 mr-1" />
              Posição
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-auto p-4">
            <TabsContent value="data" className="mt-0">
              <DataEditor
                data={localNode.data}
                onChange={(data) => handleUpdate({ data })}
              />
            </TabsContent>

            <TabsContent value="style" className="mt-0">
              <StyleEditor
                style={localNode.style || {}}
                onChange={(style) => handleUpdate({ style })}
              />
            </TabsContent>

            <TabsContent value="position" className="mt-0">
              <div className="space-y-4">
                {/* Posição */}
                <div className="space-y-3">
                  <Label className="text-sm">Posição</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">X</Label>
                      <Input
                        type="number"
                        value={localNode.position.x}
                        onChange={(e) => handleUpdate({
                          position: {
                            ...localNode.position,
                            x: parseFloat(e.target.value) || 0
                          }
                        })}
                        className="h-8"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Y</Label>
                      <Input
                        type="number"
                        value={localNode.position.y}
                        onChange={(e) => handleUpdate({
                          position: {
                            ...localNode.position,
                            y: parseFloat(e.target.value) || 0
                          }
                        })}
                        className="h-8"
                      />
                    </div>
                  </div>
                </div>

                {/* Dimensões */}
                <div className="space-y-3">
                  <Label className="text-sm">Dimensões</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Largura</Label>
                      <Input
                        type="number"
                        value={localNode.dimensions?.width || 150}
                        onChange={(e) => handleUpdate({
                          dimensions: {
                            ...localNode.dimensions,
                            width: parseFloat(e.target.value) || 150
                          }
                        })}
                        className="h-8"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Altura</Label>
                      <Input
                        type="number"
                        value={localNode.dimensions?.height || 80}
                        onChange={(e) => handleUpdate({
                          dimensions: {
                            ...localNode.dimensions,
                            height: parseFloat(e.target.value) || 80
                          }
                        })}
                        className="h-8"
                      />
                    </div>
                  </div>
                </div>

                {/* Rotação */}
                <div className="space-y-2">
                  <Label className="text-sm">Rotação</Label>
                  <div className="flex items-center space-x-2">
                    <Slider
                      value={[localNode.style?.transform?.rotate || 0]}
                      onValueChange={([value]) => handleUpdate({
                        style: {
                          ...localNode.style,
                          transform: {
                            ...localNode.style?.transform,
                            rotate: value
                          }
                        }
                      })}
                      max={360}
                      min={0}
                      step={1}
                      className="flex-1"
                    />
                    <span className="text-xs text-muted-foreground w-12">
                      {localNode.style?.transform?.rotate || 0}°
                    </span>
                  </div>
                </div>

                {/* Z-Index */}
                <div className="space-y-2">
                  <Label className="text-sm">Camada (Z-Index)</Label>
                  <Input
                    type="number"
                    value={localNode.style?.zIndex || 0}
                    onChange={(e) => handleUpdate({
                      style: {
                        ...localNode.style,
                        zIndex: parseInt(e.target.value) || 0
                      }
                    })}
                    className="h-8"
                  />
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Status */}
      {hasChanges && (
        <div className="border-t bg-muted/50 p-2">
          <p className="text-xs text-muted-foreground text-center">
            Alterações não salvas
          </p>
        </div>
      )}
    </div>
  );
};

export default NodeEditor;