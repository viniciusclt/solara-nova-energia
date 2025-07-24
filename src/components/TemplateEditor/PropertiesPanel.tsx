import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Palette,
  Type,
  Layout,
  Image,
  Settings,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline
} from 'lucide-react';
import { TemplateComponent, ComponentProperties } from './types';

interface PropertiesPanelProps {
  selectedComponent: TemplateComponent | null;
  onComponentUpdate: (id: string, updates: Partial<TemplateComponent>) => void;
}

export function PropertiesPanel({ selectedComponent, onComponentUpdate }: PropertiesPanelProps) {
  const [colorPickerOpen, setColorPickerOpen] = useState(false);

  const updateProperty = useCallback((property: keyof ComponentProperties, value: any) => {
    if (!selectedComponent) return;
    
    const newProperties = {
      ...selectedComponent.properties,
      [property]: value
    };
    
    onComponentUpdate(selectedComponent.id, { properties: newProperties });
  }, [selectedComponent, onComponentUpdate]);

  const updateNestedProperty = useCallback((parentProperty: keyof ComponentProperties, childProperty: string, value: any) => {
    if (!selectedComponent) return;
    
    const currentValue = selectedComponent.properties[parentProperty] as any;
    const newValue = {
      ...currentValue,
      [childProperty]: value
    };
    
    updateProperty(parentProperty, newValue);
  }, [selectedComponent, updateProperty]);

  const updatePosition = useCallback((axis: 'x' | 'y', value: number) => {
    if (!selectedComponent) return;
    
    const newPosition = {
      ...selectedComponent.position,
      [axis]: Math.max(0, value)
    };
    
    onComponentUpdate(selectedComponent.id, { position: newPosition });
  }, [selectedComponent, onComponentUpdate]);

  const updateSize = useCallback((dimension: 'width' | 'height', value: number) => {
    if (!selectedComponent) return;
    
    const newSize = {
      ...selectedComponent.size,
      [dimension]: Math.max(10, value)
    };
    
    onComponentUpdate(selectedComponent.id, { size: newSize });
  }, [selectedComponent, onComponentUpdate]);

  if (!selectedComponent) {
    return (
      <div className="h-full flex flex-col">
        <CardHeader>
          <CardTitle className="text-lg">Propriedades</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Selecione um componente para editar suas propriedades</p>
          </div>
        </CardContent>
      </div>
    );
  }

  const renderTextProperties = () => (
    <div className="space-y-4">
      {/* Text Content */}
      {(selectedComponent.type === 'text' || selectedComponent.type === 'heading' || selectedComponent.type === 'placeholder') && (
        <div className="space-y-2">
          <Label>Texto</Label>
          {selectedComponent.type === 'placeholder' ? (
            <div className="space-y-2">
              <Input
                value={selectedComponent.properties.placeholderKey || ''}
                onChange={(e) => updateProperty('placeholderKey', e.target.value)}
                placeholder="ex: lead.name"
              />
              <Select
                value={selectedComponent.properties.placeholderType || 'text'}
                onValueChange={(value) => updateProperty('placeholderType', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Texto</SelectItem>
                  <SelectItem value="number">Número</SelectItem>
                  <SelectItem value="currency">Moeda</SelectItem>
                  <SelectItem value="date">Data</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ) : (
            <Textarea
              value={selectedComponent.properties.text || ''}
              onChange={(e) => updateProperty('text', e.target.value)}
              placeholder="Digite o texto..."
              rows={3}
            />
          )}
        </div>
      )}

      {/* Font Size */}
      <div className="space-y-2">
        <Label>Tamanho da Fonte</Label>
        <div className="flex items-center space-x-2">
          <Slider
            value={[selectedComponent.properties.fontSize || 14]}
            onValueChange={([value]) => updateProperty('fontSize', value)}
            min={8}
            max={72}
            step={1}
            className="flex-1"
          />
          <span className="text-sm text-gray-500 w-12">
            {selectedComponent.properties.fontSize || 14}px
          </span>
        </div>
      </div>

      {/* Font Weight */}
      <div className="space-y-2">
        <Label>Peso da Fonte</Label>
        <Select
          value={selectedComponent.properties.fontWeight || 'normal'}
          onValueChange={(value) => updateProperty('fontWeight', value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="semibold">Semi-negrito</SelectItem>
            <SelectItem value="bold">Negrito</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Text Alignment */}
      <div className="space-y-2">
        <Label>Alinhamento</Label>
        <div className="flex space-x-1">
          {[
            { value: 'left', icon: AlignLeft },
            { value: 'center', icon: AlignCenter },
            { value: 'right', icon: AlignRight }
          ].map(({ value, icon: Icon }) => (
            <Button
              key={value}
              variant={selectedComponent.properties.textAlign === value ? 'default' : 'outline'}
              size="sm"
              onClick={() => updateProperty('textAlign', value)}
            >
              <Icon className="h-4 w-4" />
            </Button>
          ))}
        </div>
      </div>

      {/* Text Color */}
      <div className="space-y-2">
        <Label>Cor do Texto</Label>
        <div className="flex items-center space-x-2">
          <Input
            type="color"
            value={selectedComponent.properties.color || '#000000'}
            onChange={(e) => updateProperty('color', e.target.value)}
            className="w-12 h-8 p-1 border rounded"
          />
          <Input
            value={selectedComponent.properties.color || '#000000'}
            onChange={(e) => updateProperty('color', e.target.value)}
            placeholder="#000000"
            className="flex-1"
          />
        </div>
      </div>
    </div>
  );

  const renderLayoutProperties = () => (
    <div className="space-y-4">
      {/* Position */}
      <div className="space-y-2">
        <Label>Posição</Label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs text-gray-500">X</Label>
            <Input
              type="number"
              value={selectedComponent.position.x}
              onChange={(e) => updatePosition('x', parseInt(e.target.value) || 0)}
            />
          </div>
          <div>
            <Label className="text-xs text-gray-500">Y</Label>
            <Input
              type="number"
              value={selectedComponent.position.y}
              onChange={(e) => updatePosition('y', parseInt(e.target.value) || 0)}
            />
          </div>
        </div>
      </div>

      {/* Size */}
      <div className="space-y-2">
        <Label>Tamanho</Label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs text-gray-500">Largura</Label>
            <Input
              type="number"
              value={selectedComponent.size.width}
              onChange={(e) => updateSize('width', parseInt(e.target.value) || 10)}
            />
          </div>
          <div>
            <Label className="text-xs text-gray-500">Altura</Label>
            <Input
              type="number"
              value={selectedComponent.size.height}
              onChange={(e) => updateSize('height', parseInt(e.target.value) || 10)}
            />
          </div>
        </div>
      </div>

      {/* Z-Index */}
      <div className="space-y-2">
        <Label>Camada (Z-Index)</Label>
        <Input
          type="number"
          value={selectedComponent.zIndex}
          onChange={(e) => onComponentUpdate(selectedComponent.id, { zIndex: parseInt(e.target.value) || 0 })}
        />
      </div>

      {/* Padding */}
      <div className="space-y-2">
        <Label>Espaçamento Interno</Label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs text-gray-500">Superior</Label>
            <Input
              type="number"
              value={selectedComponent.properties.padding?.top || 0}
              onChange={(e) => updateNestedProperty('padding', 'top', parseInt(e.target.value) || 0)}
            />
          </div>
          <div>
            <Label className="text-xs text-gray-500">Direita</Label>
            <Input
              type="number"
              value={selectedComponent.properties.padding?.right || 0}
              onChange={(e) => updateNestedProperty('padding', 'right', parseInt(e.target.value) || 0)}
            />
          </div>
          <div>
            <Label className="text-xs text-gray-500">Inferior</Label>
            <Input
              type="number"
              value={selectedComponent.properties.padding?.bottom || 0}
              onChange={(e) => updateNestedProperty('padding', 'bottom', parseInt(e.target.value) || 0)}
            />
          </div>
          <div>
            <Label className="text-xs text-gray-500">Esquerda</Label>
            <Input
              type="number"
              value={selectedComponent.properties.padding?.left || 0}
              onChange={(e) => updateNestedProperty('padding', 'left', parseInt(e.target.value) || 0)}
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderStyleProperties = () => (
    <div className="space-y-4">
      {/* Background Color */}
      <div className="space-y-2">
        <Label>Cor de Fundo</Label>
        <div className="flex items-center space-x-2">
          <Input
            type="color"
            value={selectedComponent.properties.backgroundColor || '#ffffff'}
            onChange={(e) => updateProperty('backgroundColor', e.target.value)}
            className="w-12 h-8 p-1 border rounded"
          />
          <Input
            value={selectedComponent.properties.backgroundColor || '#ffffff'}
            onChange={(e) => updateProperty('backgroundColor', e.target.value)}
            placeholder="#ffffff"
            className="flex-1"
          />
        </div>
      </div>

      {/* Border */}
      <div className="space-y-2">
        <Label>Borda</Label>
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs text-gray-500">Largura</Label>
              <Input
                type="number"
                value={selectedComponent.properties.borderWidth || 0}
                onChange={(e) => updateProperty('borderWidth', parseInt(e.target.value) || 0)}
              />
            </div>
            <div>
              <Label className="text-xs text-gray-500">Estilo</Label>
              <Select
                value={selectedComponent.properties.borderStyle || 'solid'}
                onValueChange={(value) => updateProperty('borderStyle', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="solid">Sólida</SelectItem>
                  <SelectItem value="dashed">Tracejada</SelectItem>
                  <SelectItem value="dotted">Pontilhada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Input
              type="color"
              value={selectedComponent.properties.borderColor || '#000000'}
              onChange={(e) => updateProperty('borderColor', e.target.value)}
              className="w-12 h-8 p-1 border rounded"
            />
            <Input
              value={selectedComponent.properties.borderColor || '#000000'}
              onChange={(e) => updateProperty('borderColor', e.target.value)}
              placeholder="#000000"
              className="flex-1"
            />
          </div>
        </div>
      </div>

      {/* Border Radius */}
      <div className="space-y-2">
        <Label>Arredondamento</Label>
        <div className="flex items-center space-x-2">
          <Slider
            value={[selectedComponent.properties.borderRadius || 0]}
            onValueChange={([value]) => updateProperty('borderRadius', value)}
            min={0}
            max={50}
            step={1}
            className="flex-1"
          />
          <span className="text-sm text-gray-500 w-12">
            {selectedComponent.properties.borderRadius || 0}px
          </span>
        </div>
      </div>
    </div>
  );

  const renderImageProperties = () => (
    <div className="space-y-4">
      {/* Image Source */}
      <div className="space-y-2">
        <Label>URL da Imagem</Label>
        <Input
          value={selectedComponent.properties.src || ''}
          onChange={(e) => updateProperty('src', e.target.value)}
          placeholder="https://exemplo.com/imagem.jpg"
        />
      </div>

      {/* Alt Text */}
      <div className="space-y-2">
        <Label>Texto Alternativo</Label>
        <Input
          value={selectedComponent.properties.alt || ''}
          onChange={(e) => updateProperty('alt', e.target.value)}
          placeholder="Descrição da imagem"
        />
      </div>

      {/* Object Fit */}
      <div className="space-y-2">
        <Label>Ajuste da Imagem</Label>
        <Select
          value={selectedComponent.properties.objectFit || 'cover'}
          onValueChange={(value) => updateProperty('objectFit', value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="cover">Cobrir</SelectItem>
            <SelectItem value="contain">Conter</SelectItem>
            <SelectItem value="fill">Preencher</SelectItem>
            <SelectItem value="scale-down">Reduzir</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Propriedades</CardTitle>
        <div className="text-sm text-gray-500">
          {selectedComponent.type} • {selectedComponent.id}
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden">
        <Tabs defaultValue="style" className="h-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="style" className="text-xs">
              <Palette className="h-3 w-3 mr-1" />
              Estilo
            </TabsTrigger>
            <TabsTrigger value="layout" className="text-xs">
              <Layout className="h-3 w-3 mr-1" />
              Layout
            </TabsTrigger>
            <TabsTrigger value="content" className="text-xs">
              <Type className="h-3 w-3 mr-1" />
              Conteúdo
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[calc(100%-60px)] mt-4">
            <TabsContent value="style" className="mt-0">
              {renderStyleProperties()}
            </TabsContent>

            <TabsContent value="layout" className="mt-0">
              {renderLayoutProperties()}
            </TabsContent>

            <TabsContent value="content" className="mt-0">
              {(selectedComponent.type === 'text' || selectedComponent.type === 'heading' || selectedComponent.type === 'placeholder') && renderTextProperties()}
              {(selectedComponent.type === 'image' || selectedComponent.type === 'logo') && renderImageProperties()}
              {selectedComponent.type === 'button' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Texto do Botão</Label>
                    <Input
                      value={selectedComponent.properties.buttonText || ''}
                      onChange={(e) => updateProperty('buttonText', e.target.value)}
                      placeholder="Clique aqui"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Estilo do Botão</Label>
                    <Select
                      value={selectedComponent.properties.buttonStyle || 'primary'}
                      onValueChange={(value) => updateProperty('buttonStyle', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="primary">Primário</SelectItem>
                        <SelectItem value="secondary">Secundário</SelectItem>
                        <SelectItem value="outline">Contorno</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </CardContent>
    </div>
  );
}