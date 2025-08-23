// ============================================================================
// Unified Properties Panel - Painel de propriedades unificado
// ============================================================================
// Painel para editar propriedades de nós e arestas do diagrama
// ============================================================================

import React, { memo, useState, useCallback, useMemo, useEffect } from 'react';
import {
  Settings,
  X,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Copy,
  Trash2,
  RotateCcw,
  Palette,
  Type,
  Move,
  Layers,
  Link,
  Tag,
  FileText,
  Image,
  Code,
  ChevronDown,
  ChevronRight,
  Plus,
  Minus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { DiagramType, NodeType, EdgeType } from '@/types/unified-diagram';

// ============================================================================
// INTERFACES
// ============================================================================

export interface NodeProperties {
  id: string;
  type: NodeType;
  label: string;
  description?: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  style: {
    backgroundColor: string;
    borderColor: string;
    borderWidth: number;
    borderStyle: 'solid' | 'dashed' | 'dotted';
    borderRadius: number;
    textColor: string;
    fontSize: number;
    fontWeight: 'normal' | 'bold';
    fontStyle: 'normal' | 'italic';
    textAlign: 'left' | 'center' | 'right';
    opacity: number;
    shadow: boolean;
    shadowColor: string;
    shadowBlur: number;
    shadowOffset: { x: number; y: number };
  };
  data: Record<string, any>;
  locked: boolean;
  visible: boolean;
  layer: number;
  tags: string[];
  metadata: Record<string, any>;
}

export interface EdgeProperties {
  id: string;
  type: EdgeType;
  label?: string;
  source: string;
  target: string;
  style: {
    strokeColor: string;
    strokeWidth: number;
    strokeStyle: 'solid' | 'dashed' | 'dotted';
    opacity: number;
    animated: boolean;
    markerStart?: string;
    markerEnd?: string;
  };
  data: Record<string, any>;
  locked: boolean;
  visible: boolean;
  layer: number;
  tags: string[];
  metadata: Record<string, any>;
}

interface UnifiedPropertiesPanelProps {
  diagramType: DiagramType;
  selectedElement?: {
    type: 'node' | 'edge';
    properties: NodeProperties | EdgeProperties;
  };
  onClose: () => void;
  onUpdateProperties: (properties: Partial<NodeProperties | EdgeProperties>) => void;
  onDeleteElement?: () => void;
  onDuplicateElement?: () => void;
  onResetProperties?: () => void;
  className?: string;
}

type PropertySection = 'general' | 'style' | 'position' | 'data' | 'advanced';

// ============================================================================
// UTILITÁRIOS
// ============================================================================

const getNodeTypeLabel = (type: NodeType) => {
  const labels: Record<NodeType, string> = {
    'start': 'Início',
    'end': 'Fim',
    'process': 'Processo',
    'decision': 'Decisão',
    'subprocess': 'Subprocesso',
    'gateway': 'Gateway',
    'event': 'Evento',
    'task': 'Tarefa',
    'user-task': 'Tarefa do Usuário',
    'service-task': 'Tarefa de Serviço',
    'script-task': 'Tarefa de Script',
    'manual-task': 'Tarefa Manual',
    'business-rule': 'Regra de Negócio',
    'receive-task': 'Tarefa de Recebimento',
    'send-task': 'Tarefa de Envio',
    'call-activity': 'Atividade de Chamada',
    'data-object': 'Objeto de Dados',
    'data-store': 'Armazenamento de Dados',
    'message': 'Mensagem',
    'timer': 'Timer',
    'conditional': 'Condicional',
    'signal': 'Sinal',
    'escalation': 'Escalação',
    'error': 'Erro',
    'compensation': 'Compensação',
    'multiple': 'Múltiplo',
    'parallel-multiple': 'Múltiplo Paralelo',
    'terminate': 'Terminar',
    'cancel': 'Cancelar',
    'link': 'Link',
    'annotation': 'Anotação',
    'group': 'Grupo',
    'text': 'Texto',
    'lane': 'Raia',
    'pool': 'Pool',
    'participant': 'Participante'
  };
  return labels[type] || type;
};

const getEdgeTypeLabel = (type: EdgeType) => {
  const labels: Record<EdgeType, string> = {
    'sequence': 'Fluxo de Sequência',
    'message': 'Fluxo de Mensagem',
    'association': 'Associação',
    'data-association': 'Associação de Dados',
    'conditional': 'Fluxo Condicional',
    'default': 'Fluxo Padrão',
    'compensation': 'Fluxo de Compensação'
  };
  return labels[type] || type;
};

const colorPresets = [
  '#ffffff', '#f8f9fa', '#e9ecef', '#dee2e6', '#ced4da', '#adb5bd',
  '#6c757d', '#495057', '#343a40', '#212529', '#000000',
  '#fff3cd', '#ffeaa7', '#fdcb6e', '#e17055', '#d63031',
  '#fd79a8', '#e84393', '#a29bfe', '#6c5ce7', '#74b9ff',
  '#0984e3', '#00b894', '#00cec9', '#55a3ff', '#81ecec'
];

// ============================================================================
// COMPONENTES
// ============================================================================

const ColorPicker: React.FC<{
  value: string;
  onChange: (color: string) => void;
  label: string;
}> = memo(({ value, onChange, label }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customColor, setCustomColor] = useState(value);

  return (
    <div className="space-y-2">
      <Label className="text-sm">{label}</Label>
      <div className="flex items-center space-x-2">
        <div
          className="w-8 h-8 rounded border-2 border-gray-300 cursor-pointer"
          style={{ backgroundColor: value }}
          onClick={() => setIsOpen(!isOpen)}
        />
        <Input
          value={customColor}
          onChange={(e) => {
            setCustomColor(e.target.value);
            onChange(e.target.value);
          }}
          className="h-8 text-xs font-mono"
          placeholder="#000000"
        />
      </div>
      {isOpen && (
        <div className="grid grid-cols-6 gap-1 p-2 border rounded">
          {colorPresets.map((color) => (
            <div
              key={color}
              className="w-6 h-6 rounded cursor-pointer border border-gray-300 hover:scale-110 transition-transform"
              style={{ backgroundColor: color }}
              onClick={() => {
                onChange(color);
                setCustomColor(color);
                setIsOpen(false);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
});

const PropertyGroup: React.FC<{
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}> = memo(({ title, icon, children, defaultOpen = true }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="w-full justify-start p-2 h-auto">
          {isOpen ? (
            <ChevronDown className="h-4 w-4 mr-2" />
          ) : (
            <ChevronRight className="h-4 w-4 mr-2" />
          )}
          {icon}
          <span className="ml-2 font-medium">{title}</span>
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-3 p-3">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
});

const TagsEditor: React.FC<{
  tags: string[];
  onChange: (tags: string[]) => void;
}> = memo(({ tags, onChange }) => {
  const [newTag, setNewTag] = useState('');

  const addTag = useCallback(() => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      onChange([...tags, newTag.trim()]);
      setNewTag('');
    }
  }, [newTag, tags, onChange]);

  const removeTag = useCallback((tagToRemove: string) => {
    onChange(tags.filter(tag => tag !== tagToRemove));
  }, [tags, onChange]);

  return (
    <div className="space-y-2">
      <Label className="text-sm">Tags</Label>
      <div className="flex flex-wrap gap-1 mb-2">
        {tags.map((tag) => (
          <Badge key={tag} variant="secondary" className="text-xs">
            {tag}
            <Button
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0 ml-1 hover:bg-destructive hover:text-destructive-foreground"
              onClick={() => removeTag(tag)}
            >
              <X className="h-2 w-2" />
            </Button>
          </Badge>
        ))}
      </div>
      <div className="flex items-center space-x-2">
        <Input
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          placeholder="Nova tag"
          className="h-8 text-sm"
          onKeyPress={(e) => e.key === 'Enter' && addTag()}
        />
        <Button size="sm" onClick={addTag} disabled={!newTag.trim()}>
          <Plus className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
});

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export const UnifiedPropertiesPanel: React.FC<UnifiedPropertiesPanelProps> = memo(({
  diagramType,
  selectedElement,
  onClose,
  onUpdateProperties,
  onDeleteElement,
  onDuplicateElement,
  onResetProperties,
  className = ''
}) => {
  const [activeSection, setActiveSection] = useState<PropertySection>('general');

  const isNode = selectedElement?.type === 'node';
  const isEdge = selectedElement?.type === 'edge';
  const properties = selectedElement?.properties;

  const updateProperty = useCallback((path: string, value: any) => {
    if (!properties) return;

    const keys = path.split('.');
    const updatedProperties = { ...properties };
    let current: any = updatedProperties;

    for (let i = 0; i < keys.length - 1; i++) {
      if (!(keys[i] in current)) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }

    current[keys[keys.length - 1]] = value;
    onUpdateProperties(updatedProperties);
  }, [properties, onUpdateProperties]);

  const nodeProps = isNode ? properties as NodeProperties : null;
  const edgeProps = isEdge ? properties as EdgeProperties : null;

  if (!selectedElement || !properties) {
    return (
      <div className={cn('properties-panel w-80 h-full bg-background border-l flex flex-col', className)}>
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold text-lg">Propriedades</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Selecione um elemento para editar suas propriedades
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('properties-panel w-80 h-full bg-background border-l flex flex-col', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-2">
          <Settings className="h-5 w-5" />
          <h2 className="font-semibold text-lg">Propriedades</h2>
        </div>
        
        <div className="flex items-center space-x-2">
          {onDuplicateElement && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="sm" variant="outline" onClick={onDuplicateElement}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Duplicar elemento</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          
          {onResetProperties && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="sm" variant="outline" onClick={onResetProperties}>
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Resetar propriedades</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          
          {onDeleteElement && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="sm" variant="outline" onClick={onDeleteElement}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Excluir elemento</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Element Info */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Badge variant="outline">
              {isNode ? getNodeTypeLabel(nodeProps!.type) : getEdgeTypeLabel(edgeProps!.type)}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {properties.id}
            </Badge>
          </div>
          
          <div className="flex items-center space-x-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => updateProperty('visible', !properties.visible)}
                  >
                    {properties.visible ? (
                      <Eye className="h-4 w-4" />
                    ) : (
                      <EyeOff className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{properties.visible ? 'Ocultar' : 'Mostrar'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => updateProperty('locked', !properties.locked)}
                  >
                    {properties.locked ? (
                      <Lock className="h-4 w-4" />
                    ) : (
                      <Unlock className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{properties.locked ? 'Desbloquear' : 'Bloquear'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>

      {/* Properties Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* General Properties */}
          <PropertyGroup title="Geral" icon={<FileText className="h-4 w-4" />}>
            <div className="space-y-3">
              <div>
                <Label className="text-sm">Rótulo</Label>
                <Input
                  value={isNode ? nodeProps!.label : edgeProps!.label || ''}
                  onChange={(e) => updateProperty('label', e.target.value)}
                  className="h-8 text-sm"
                  placeholder="Digite o rótulo"
                />
              </div>
              
              {isNode && (
                <div>
                  <Label className="text-sm">Descrição</Label>
                  <Textarea
                    value={nodeProps!.description || ''}
                    onChange={(e) => updateProperty('description', e.target.value)}
                    className="min-h-[60px] text-sm"
                    placeholder="Digite a descrição"
                  />
                </div>
              )}
              
              <div>
                <Label className="text-sm">Camada</Label>
                <Input
                  type="number"
                  value={properties.layer}
                  onChange={(e) => updateProperty('layer', parseInt(e.target.value) || 0)}
                  className="h-8 text-sm"
                  min="0"
                  max="100"
                />
              </div>
              
              <TagsEditor
                tags={properties.tags}
                onChange={(tags) => updateProperty('tags', tags)}
              />
            </div>
          </PropertyGroup>

          {/* Style Properties */}
          <PropertyGroup title="Estilo" icon={<Palette className="h-4 w-4" />}>
            <div className="space-y-3">
              {isNode && (
                <>
                  <ColorPicker
                    value={nodeProps!.style.backgroundColor}
                    onChange={(color) => updateProperty('style.backgroundColor', color)}
                    label="Cor de Fundo"
                  />
                  
                  <ColorPicker
                    value={nodeProps!.style.borderColor}
                    onChange={(color) => updateProperty('style.borderColor', color)}
                    label="Cor da Borda"
                  />
                  
                  <div>
                    <Label className="text-sm">Largura da Borda</Label>
                    <Slider
                      value={[nodeProps!.style.borderWidth]}
                      onValueChange={([value]) => updateProperty('style.borderWidth', value)}
                      max={10}
                      min={0}
                      step={1}
                      className="mt-2"
                    />
                    <div className="text-xs text-muted-foreground mt-1">
                      {nodeProps!.style.borderWidth}px
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm">Estilo da Borda</Label>
                    <Select
                      value={nodeProps!.style.borderStyle}
                      onValueChange={(value) => updateProperty('style.borderStyle', value)}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="solid">Sólida</SelectItem>
                        <SelectItem value="dashed">Tracejada</SelectItem>
                        <SelectItem value="dotted">Pontilhada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label className="text-sm">Raio da Borda</Label>
                    <Slider
                      value={[nodeProps!.style.borderRadius]}
                      onValueChange={([value]) => updateProperty('style.borderRadius', value)}
                      max={50}
                      min={0}
                      step={1}
                      className="mt-2"
                    />
                    <div className="text-xs text-muted-foreground mt-1">
                      {nodeProps!.style.borderRadius}px
                    </div>
                  </div>
                  
                  <ColorPicker
                    value={nodeProps!.style.textColor}
                    onChange={(color) => updateProperty('style.textColor', color)}
                    label="Cor do Texto"
                  />
                  
                  <div>
                    <Label className="text-sm">Tamanho da Fonte</Label>
                    <Slider
                      value={[nodeProps!.style.fontSize]}
                      onValueChange={([value]) => updateProperty('style.fontSize', value)}
                      max={48}
                      min={8}
                      step={1}
                      className="mt-2"
                    />
                    <div className="text-xs text-muted-foreground mt-1">
                      {nodeProps!.style.fontSize}px
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={nodeProps!.style.fontWeight === 'bold'}
                        onCheckedChange={(checked) => 
                          updateProperty('style.fontWeight', checked ? 'bold' : 'normal')
                        }
                      />
                      <Label className="text-sm">Negrito</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={nodeProps!.style.fontStyle === 'italic'}
                        onCheckedChange={(checked) => 
                          updateProperty('style.fontStyle', checked ? 'italic' : 'normal')
                        }
                      />
                      <Label className="text-sm">Itálico</Label>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm">Alinhamento do Texto</Label>
                    <Select
                      value={nodeProps!.style.textAlign}
                      onValueChange={(value) => updateProperty('style.textAlign', value)}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="left">Esquerda</SelectItem>
                        <SelectItem value="center">Centro</SelectItem>
                        <SelectItem value="right">Direita</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
              
              {isEdge && (
                <>
                  <ColorPicker
                    value={edgeProps!.style.strokeColor}
                    onChange={(color) => updateProperty('style.strokeColor', color)}
                    label="Cor da Linha"
                  />
                  
                  <div>
                    <Label className="text-sm">Largura da Linha</Label>
                    <Slider
                      value={[edgeProps!.style.strokeWidth]}
                      onValueChange={([value]) => updateProperty('style.strokeWidth', value)}
                      max={10}
                      min={1}
                      step={1}
                      className="mt-2"
                    />
                    <div className="text-xs text-muted-foreground mt-1">
                      {edgeProps!.style.strokeWidth}px
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm">Estilo da Linha</Label>
                    <Select
                      value={edgeProps!.style.strokeStyle}
                      onValueChange={(value) => updateProperty('style.strokeStyle', value)}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="solid">Sólida</SelectItem>
                        <SelectItem value="dashed">Tracejada</SelectItem>
                        <SelectItem value="dotted">Pontilhada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={edgeProps!.style.animated}
                      onCheckedChange={(checked) => updateProperty('style.animated', checked)}
                    />
                    <Label className="text-sm">Animada</Label>
                  </div>
                </>
              )}
              
              <div>
                <Label className="text-sm">Opacidade</Label>
                <Slider
                  value={[isNode ? nodeProps!.style.opacity : edgeProps!.style.opacity]}
                  onValueChange={([value]) => updateProperty('style.opacity', value)}
                  max={1}
                  min={0}
                  step={0.1}
                  className="mt-2"
                />
                <div className="text-xs text-muted-foreground mt-1">
                  {Math.round((isNode ? nodeProps!.style.opacity : edgeProps!.style.opacity) * 100)}%
                </div>
              </div>
            </div>
          </PropertyGroup>

          {/* Position & Size (Node only) */}
          {isNode && (
            <PropertyGroup title="Posição e Tamanho" icon={<Move className="h-4 w-4" />}>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-sm">X</Label>
                    <Input
                      type="number"
                      value={nodeProps!.position.x}
                      onChange={(e) => updateProperty('position.x', parseFloat(e.target.value) || 0)}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Y</Label>
                    <Input
                      type="number"
                      value={nodeProps!.position.y}
                      onChange={(e) => updateProperty('position.y', parseFloat(e.target.value) || 0)}
                      className="h-8 text-sm"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-sm">Largura</Label>
                    <Input
                      type="number"
                      value={nodeProps!.size.width}
                      onChange={(e) => updateProperty('size.width', parseFloat(e.target.value) || 0)}
                      className="h-8 text-sm"
                      min="10"
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Altura</Label>
                    <Input
                      type="number"
                      value={nodeProps!.size.height}
                      onChange={(e) => updateProperty('size.height', parseFloat(e.target.value) || 0)}
                      className="h-8 text-sm"
                      min="10"
                    />
                  </div>
                </div>
              </div>
            </PropertyGroup>
          )}

          {/* Data Properties */}
          <PropertyGroup title="Dados Customizados" icon={<Code className="h-4 w-4" />}>
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">
                Dados customizados em formato JSON
              </div>
              <Textarea
                value={JSON.stringify(properties.data, null, 2)}
                onChange={(e) => {
                  try {
                    const data = JSON.parse(e.target.value);
                    updateProperty('data', data);
                  } catch {
                    // Ignore invalid JSON
                  }
                }}
                className="min-h-[100px] text-xs font-mono"
                placeholder="{}"
              />
            </div>
          </PropertyGroup>
        </div>
      </ScrollArea>
    </div>
  );
});

UnifiedPropertiesPanel.displayName = 'UnifiedPropertiesPanel';

export default UnifiedPropertiesPanel;