// ============================================================================
// DiagramPropertiesPanel - Painel de propriedades para edição de elementos
// ============================================================================

import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Palette, 
  Type, 
  Move, 
  Layers, 
  Link, 
  Tag, 
  FileText, 
  Eye, 
  EyeOff, 
  Lock, 
  Unlock,
  MoreHorizontal,
  Trash2,
  Copy,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { DiagramType, NodeType, EdgeType } from '@/hooks/useDiagramIntegration';

// ============================================================================
// Types
// ============================================================================

interface DiagramNode {
  id: string;
  type: NodeType;
  position: { x: number; y: number };
  data: {
    label: string;
    description?: string;
    color?: string;
    backgroundColor?: string;
    borderColor?: string;
    icon?: string;
    metadata?: Record<string, any>;
  };
  style?: React.CSSProperties;
}

interface DiagramEdge {
  id: string;
  source: string;
  target: string;
  type: EdgeType;
  data?: {
    label?: string;
    color?: string;
    animated?: boolean;
  };
  style?: React.CSSProperties;
}

interface DiagramPropertiesPanelProps {
  diagramType: DiagramType;
  selectedNodes: DiagramNode[];
  selectedEdges: DiagramEdge[];
  allNodes: DiagramNode[];
  allEdges: DiagramEdge[];
  onNodeUpdate: (nodeId: string, updates: Partial<DiagramNode>) => void;
  onEdgeUpdate: (edgeId: string, updates: Partial<DiagramEdge>) => void;
  onNodeDelete: (nodeId: string) => void;
  onEdgeDelete: (edgeId: string) => void;
  onNodeDuplicate: (nodeId: string) => void;
  onNodeLayerChange: (nodeId: string, direction: 'up' | 'down') => void;
  className?: string;
}

// ============================================================================
// Color Presets
// ============================================================================

const COLOR_PRESETS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
  '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
  '#ec4899', '#f43f5e', '#64748b', '#6b7280', '#374151'
];

const EDGE_TYPES: { value: EdgeType; label: string }[] = [
  { value: 'straight', label: 'Reta' },
  { value: 'curved', label: 'Curva' },
  { value: 'stepped', label: 'Escalonada' },
  { value: 'bezier', label: 'Bézier' }
];

// ============================================================================
// Component
// ============================================================================

export const DiagramPropertiesPanel: React.FC<DiagramPropertiesPanelProps> = ({
  diagramType,
  selectedNodes,
  selectedEdges,
  allNodes,
  allEdges,
  onNodeUpdate,
  onEdgeUpdate,
  onNodeDelete,
  onEdgeDelete,
  onNodeDuplicate,
  onNodeLayerChange,
  className
}) => {
  
  // ============================================================================
  // State
  // ============================================================================
  
  const [activeTab, setActiveTab] = useState('properties');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    basic: true,
    style: false,
    advanced: false
  });
  
  const hasSelection = selectedNodes.length > 0 || selectedEdges.length > 0;
  const isMultiSelection = selectedNodes.length + selectedEdges.length > 1;
  const selectedNode = selectedNodes.length === 1 ? selectedNodes[0] : null;
  const selectedEdge = selectedEdges.length === 1 ? selectedEdges[0] : null;
  
  // ============================================================================
  // Handlers
  // ============================================================================
  
  const handleNodePropertyChange = (property: string, value: any) => {
    if (!selectedNode) return;
    
    const updates: Partial<DiagramNode> = {};
    
    if (property.startsWith('data.')) {
      const dataProperty = property.replace('data.', '');
      updates.data = {
        ...selectedNode.data,
        [dataProperty]: value
      };
    } else if (property.startsWith('position.')) {
      const positionProperty = property.replace('position.', '') as 'x' | 'y';
      updates.position = {
        ...selectedNode.position,
        [positionProperty]: value
      };
    } else {
      (updates as any)[property] = value;
    }
    
    onNodeUpdate(selectedNode.id, updates);
  };
  
  const handleEdgePropertyChange = (property: string, value: any) => {
    if (!selectedEdge) return;
    
    const updates: Partial<DiagramEdge> = {};
    
    if (property.startsWith('data.')) {
      const dataProperty = property.replace('data.', '');
      updates.data = {
        ...selectedEdge.data,
        [dataProperty]: value
      };
    } else {
      (updates as any)[property] = value;
    }
    
    onEdgeUpdate(selectedEdge.id, updates);
  };
  
  const handleBulkColorChange = (color: string) => {
    selectedNodes.forEach(node => {
      onNodeUpdate(node.id, {
        data: {
          ...node.data,
          color,
          borderColor: color,
          backgroundColor: `${color}20`
        }
      });
    });
    
    selectedEdges.forEach(edge => {
      onEdgeUpdate(edge.id, {
        data: {
          ...edge.data,
          color
        }
      });
    });
  };
  
  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };
  
  // ============================================================================
  // Render Color Picker
  // ============================================================================
  
  const renderColorPicker = (currentColor: string, onChange: (color: string) => void) => (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div 
          className="w-6 h-6 rounded border border-border cursor-pointer"
          style={{ backgroundColor: currentColor }}
        />
        <Input
          type="text"
          value={currentColor}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
          className="flex-1 font-mono text-sm"
        />
      </div>
      <div className="grid grid-cols-5 gap-1">
        {COLOR_PRESETS.map(color => (
          <button
            key={color}
            className={cn(
              'w-8 h-8 rounded border-2 cursor-pointer transition-all',
              currentColor === color ? 'border-primary scale-110' : 'border-transparent hover:scale-105'
            )}
            style={{ backgroundColor: color }}
            onClick={() => onChange(color)}
          />
        ))}
      </div>
    </div>
  );
  
  // ============================================================================
  // Render Node Properties
  // ============================================================================
  
  const renderNodeProperties = () => {
    if (!selectedNode) return null;
    
    return (
      <div className="space-y-4">
        {/* Basic Properties */}
        <Collapsible 
          open={expandedSections.basic} 
          onOpenChange={() => toggleSection('basic')}
        >
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-2">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <span className="font-medium">Propriedades Básicas</span>
              </div>
              <Badge variant="secondary">{selectedNode.type}</Badge>
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 pt-2">
            <div className="space-y-2">
              <Label htmlFor="node-label">Rótulo</Label>
              <Input
                id="node-label"
                value={selectedNode.data.label}
                onChange={(e) => handleNodePropertyChange('data.label', e.target.value)}
                placeholder="Digite o rótulo..."
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="node-description">Descrição</Label>
              <Textarea
                id="node-description"
                value={selectedNode.data.description || ''}
                onChange={(e) => handleNodePropertyChange('data.description', e.target.value)}
                placeholder="Digite a descrição..."
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label htmlFor="node-x">Posição X</Label>
                <Input
                  id="node-x"
                  type="number"
                  value={selectedNode.position.x}
                  onChange={(e) => handleNodePropertyChange('position.x', Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="node-y">Posição Y</Label>
                <Input
                  id="node-y"
                  type="number"
                  value={selectedNode.position.y}
                  onChange={(e) => handleNodePropertyChange('position.y', Number(e.target.value))}
                />
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
        
        {/* Style Properties */}
        <Collapsible 
          open={expandedSections.style} 
          onOpenChange={() => toggleSection('style')}
        >
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-2">
              <div className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                <span className="font-medium">Estilo</span>
              </div>
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 pt-2">
            <div className="space-y-2">
              <Label>Cor Principal</Label>
              {renderColorPicker(
                selectedNode.data.color || '#64748b',
                (color) => handleNodePropertyChange('data.color', color)
              )}
            </div>
            
            <div className="space-y-2">
              <Label>Cor de Fundo</Label>
              {renderColorPicker(
                selectedNode.data.backgroundColor || '#f8fafc',
                (color) => handleNodePropertyChange('data.backgroundColor', color)
              )}
            </div>
            
            <div className="space-y-2">
              <Label>Cor da Borda</Label>
              {renderColorPicker(
                selectedNode.data.borderColor || '#e2e8f0',
                (color) => handleNodePropertyChange('data.borderColor', color)
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
        
        {/* Advanced Properties */}
        <Collapsible 
          open={expandedSections.advanced} 
          onOpenChange={() => toggleSection('advanced')}
        >
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-2">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4" />
                <span className="font-medium">Avançado</span>
              </div>
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 pt-2">
            <div className="space-y-2">
              <Label htmlFor="node-icon">Ícone</Label>
              <Input
                id="node-icon"
                value={selectedNode.data.icon || ''}
                onChange={(e) => handleNodePropertyChange('data.icon', e.target.value)}
                placeholder="Nome do ícone..."
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label>Camadas</Label>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onNodeLayerChange(selectedNode.id, 'up')}
                >
                  <ArrowUp className="h-3 w-3" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onNodeLayerChange(selectedNode.id, 'down')}
                >
                  <ArrowDown className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    );
  };
  
  // ============================================================================
  // Render Edge Properties
  // ============================================================================
  
  const renderEdgeProperties = () => {
    if (!selectedEdge) return null;
    
    const sourceNode = allNodes.find(node => node.id === selectedEdge.source);
    const targetNode = allNodes.find(node => node.id === selectedEdge.target);
    
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Link className="h-4 w-4" />
              Conexão
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label>Origem</Label>
              <div className="p-2 bg-muted rounded text-sm">
                {sourceNode?.data.label || selectedEdge.source}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Destino</Label>
              <div className="p-2 bg-muted rounded text-sm">
                {targetNode?.data.label || selectedEdge.target}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edge-label">Rótulo</Label>
              <Input
                id="edge-label"
                value={selectedEdge.data?.label || ''}
                onChange={(e) => handleEdgePropertyChange('data.label', e.target.value)}
                placeholder="Digite o rótulo..."
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edge-type">Tipo</Label>
              <Select
                value={selectedEdge.type}
                onValueChange={(value) => handleEdgePropertyChange('type', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EDGE_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Cor</Label>
              {renderColorPicker(
                selectedEdge.data?.color || '#64748b',
                (color) => handleEdgePropertyChange('data.color', color)
              )}
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="edge-animated">Animada</Label>
              <Switch
                id="edge-animated"
                checked={selectedEdge.data?.animated || false}
                onCheckedChange={(checked) => handleEdgePropertyChange('data.animated', checked)}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };
  
  // ============================================================================
  // Render Multi Selection
  // ============================================================================
  
  const renderMultiSelection = () => (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Seleção Múltipla
            <Badge variant="secondary">
              {selectedNodes.length + selectedEdges.length} itens
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {selectedNodes.length > 0 && (
            <div className="space-y-2">
              <Label>Nós Selecionados</Label>
              <div className="space-y-1">
                {selectedNodes.map(node => (
                  <div key={node.id} className="flex items-center gap-2 p-2 bg-muted rounded text-sm">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: node.data.color }}
                    />
                    <span className="flex-1">{node.data.label}</span>
                    <Badge variant="outline" className="text-xs">
                      {node.type}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {selectedEdges.length > 0 && (
            <div className="space-y-2">
              <Label>Conexões Selecionadas</Label>
              <div className="space-y-1">
                {selectedEdges.map(edge => {
                  const sourceNode = allNodes.find(node => node.id === edge.source);
                  const targetNode = allNodes.find(node => node.id === edge.target);
                  
                  return (
                    <div key={edge.id} className="p-2 bg-muted rounded text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {sourceNode?.data.label} → {targetNode?.data.label}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {edge.type}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          <Separator />
          
          <div className="space-y-2">
            <Label>Aplicar Cor a Todos</Label>
            <div className="grid grid-cols-5 gap-1">
              {COLOR_PRESETS.slice(0, 10).map(color => (
                <button
                  key={color}
                  className="w-8 h-8 rounded border border-border cursor-pointer hover:scale-105 transition-transform"
                  style={{ backgroundColor: color }}
                  onClick={() => handleBulkColorChange(color)}
                />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
  
  // ============================================================================
  // Render Actions
  // ============================================================================
  
  const renderActions = () => {
    if (!hasSelection) return null;
    
    return (
      <div className="space-y-2">
        <Label>Ações</Label>
        <div className="flex flex-col gap-2">
          {selectedNode && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNodeDuplicate(selectedNode.id)}
              className="justify-start"
            >
              <Copy className="h-4 w-4 mr-2" />
              Duplicar
            </Button>
          )}
          
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              selectedNodes.forEach(node => onNodeDelete(node.id));
              selectedEdges.forEach(edge => onEdgeDelete(edge.id));
            }}
            className="justify-start"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Excluir {isMultiSelection ? 'Selecionados' : ''}
          </Button>
        </div>
      </div>
    );
  };
  
  // ============================================================================
  // Render Empty State
  // ============================================================================
  
  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center h-64 text-center p-4">
      <Settings className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="font-medium text-lg mb-2">Nenhum elemento selecionado</h3>
      <p className="text-sm text-muted-foreground">
        Selecione um elemento no diagrama para editar suas propriedades.
      </p>
    </div>
  );
  
  // ============================================================================
  // Render
  // ============================================================================
  
  return (
    <div className={cn(
      'flex flex-col h-full bg-background border-l border-border min-w-[300px] max-w-[400px]',
      className
    )}>
      {hasSelection ? (
        <>
          <div className="p-4 border-b border-border">
            <h2 className="font-semibold text-lg flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Propriedades
              {isMultiSelection && (
                <Badge variant="secondary">
                  {selectedNodes.length + selectedEdges.length}
                </Badge>
              )}
            </h2>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
              <TabsList className="grid w-full grid-cols-2 m-4 mb-0">
                <TabsTrigger value="properties">Propriedades</TabsTrigger>
                <TabsTrigger value="actions">Ações</TabsTrigger>
              </TabsList>
              
              <TabsContent value="properties" className="p-4 pt-2 space-y-4">
                {isMultiSelection ? renderMultiSelection() : (
                  selectedNode ? renderNodeProperties() : renderEdgeProperties()
                )}
              </TabsContent>
              
              <TabsContent value="actions" className="p-4 pt-2">
                {renderActions()}
              </TabsContent>
            </Tabs>
          </div>
        </>
      ) : (
        renderEmptyState()
      )}
    </div>
  );
};

export default DiagramPropertiesPanel;