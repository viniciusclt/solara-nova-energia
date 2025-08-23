// ============================================================================
// Properties Panel - Painel de propriedades unificado
// ============================================================================
// Painel lateral para edição de propriedades de nós e arestas
// ============================================================================

import React, { memo, useState, useCallback, useEffect } from 'react';
import {
  Settings,
  Palette,
  Type,
  Layers,
  Link,
  Tag,
  Hash,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  RotateCw,
  Move,
  Maximize2,
  ChevronDown,
  ChevronRight,
  X,
  Plus,
  Minus,
  Copy,
  Trash2,
  Info,
  AlertTriangle,
  CheckCircle,
  Circle,
  Square,
  Triangle,
  Diamond,
  Hexagon,
  Star,
  Heart,
  Zap,
  Target,
  Flag,
  Bookmark,
  Crown,
  Shield,
  Users,
  User,
  Building,
  Briefcase,
  Brain,
  Lightbulb
} from 'lucide-react';
import { UnifiedNodeData, UnifiedEdgeData, DiagramType } from '../../../types/unified-diagram';

// ============================================================================
// INTERFACES
// ============================================================================

interface PropertiesPanelProps {
  selectedNodes: any[];
  selectedEdges: any[];
  diagramType: DiagramType;
  onNodeUpdate: (nodeId: string, updates: Partial<UnifiedNodeData>) => void;
  onEdgeUpdate: (edgeId: string, updates: Partial<UnifiedEdgeData>) => void;
  onClose?: () => void;
  className?: string;
}

interface PropertySectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  collapsible?: boolean;
}

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  label?: string;
  presets?: string[];
}

interface SelectFieldProps {
  label: string;
  value: string;
  options: { value: string; label: string; icon?: React.ReactNode }[];
  onChange: (value: string) => void;
  disabled?: boolean;
}

interface NumberFieldProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  disabled?: boolean;
}

interface TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  disabled?: boolean;
}

interface ToggleFieldProps {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const COLOR_PRESETS = [
  '#3B82F6', '#10B981', '#8B5CF6', '#EC4899',
  '#F59E0B', '#EF4444', '#6B7280', '#F97316',
  '#06B6D4', '#84CC16', '#F472B6', '#A855F7'
];

const BPMN_NODE_TYPES = [
  { value: 'start-event', label: 'Evento de Início', icon: <Circle className="w-4 h-4" /> },
  { value: 'end-event', label: 'Evento de Fim', icon: <Circle className="w-4 h-4" /> },
  { value: 'task', label: 'Tarefa', icon: <Square className="w-4 h-4" /> },
  { value: 'user-task', label: 'Tarefa do Usuário', icon: <User className="w-4 h-4" /> },
  { value: 'service-task', label: 'Tarefa de Serviço', icon: <Zap className="w-4 h-4" /> },
  { value: 'exclusive-gateway', label: 'Gateway Exclusivo', icon: <Diamond className="w-4 h-4" /> },
  { value: 'parallel-gateway', label: 'Gateway Paralelo', icon: <Plus className="w-4 h-4" /> },
  { value: 'subprocess', label: 'Subprocesso', icon: <Square className="w-4 h-4" /> }
];

const MINDMAP_NODE_TYPES = [
  { value: 'root', label: 'Nó Raiz', icon: <Target className="w-4 h-4" /> },
  { value: 'branch', label: 'Ramo', icon: <Lightbulb className="w-4 h-4" /> },
  { value: 'leaf', label: 'Folha', icon: <Circle className="w-4 h-4" /> }
];

const ORG_NODE_TYPES = [
  { value: 'ceo', label: 'CEO', icon: <Crown className="w-4 h-4" /> },
  { value: 'director', label: 'Diretor', icon: <Shield className="w-4 h-4" /> },
  { value: 'manager', label: 'Gerente', icon: <Briefcase className="w-4 h-4" /> },
  { value: 'employee', label: 'Funcionário', icon: <User className="w-4 h-4" /> },
  { value: 'department', label: 'Departamento', icon: <Building className="w-4 h-4" /> },
  { value: 'team', label: 'Equipe', icon: <Users className="w-4 h-4" /> }
];

const EDGE_TYPES = {
  bpmn: [
    { value: 'sequence-flow', label: 'Fluxo de Sequência', icon: <Link className="w-4 h-4" /> },
    { value: 'message-flow', label: 'Fluxo de Mensagem', icon: <Link className="w-4 h-4" /> },
    { value: 'association', label: 'Associação', icon: <Link className="w-4 h-4" /> }
  ],
  mindmap: [
    { value: 'organic', label: 'Orgânica', icon: <Link className="w-4 h-4" /> },
    { value: 'straight', label: 'Reta', icon: <Link className="w-4 h-4" /> }
  ],
  organogram: [
    { value: 'hierarchy', label: 'Hierárquica', icon: <Link className="w-4 h-4" /> },
    { value: 'collaboration', label: 'Colaboração', icon: <Link className="w-4 h-4" /> }
  ]
};

// ============================================================================
// UTILITY COMPONENTS
// ============================================================================

const PropertySection: React.FC<PropertySectionProps> = ({
  title,
  icon,
  children,
  defaultExpanded = true,
  collapsible = true
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div className="border rounded-lg p-3 mb-3">
      <div 
        className={`flex items-center justify-between mb-2 ${collapsible ? 'cursor-pointer' : ''}`}
        onClick={() => collapsible && setExpanded(!expanded)}
      >
        <div className="flex items-center space-x-2">
          {icon}
          <span className="font-medium text-sm">{title}</span>
        </div>
        {collapsible && (
          expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
        )}
      </div>
      {expanded && (
        <div className="space-y-3">
          {children}
        </div>
      )}
    </div>
  );
};

const TextField: React.FC<TextFieldProps> = ({
  label,
  value,
  onChange,
  placeholder,
  multiline = false,
  disabled = false
}) => {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-gray-700">{label}</label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full px-2 py-1 text-sm border rounded resize-none h-20 disabled:bg-gray-50"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full px-2 py-1 text-sm border rounded disabled:bg-gray-50"
        />
      )}
    </div>
  );
};

const NumberField: React.FC<NumberFieldProps> = ({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  unit,
  disabled = false
}) => {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-gray-700">
        {label} {unit && <span className="text-gray-500">({unit})</span>}
      </label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        className="w-full px-2 py-1 text-sm border rounded disabled:bg-gray-50"
      />
    </div>
  );
};

const SelectField: React.FC<SelectFieldProps> = ({
  label,
  value,
  options,
  onChange,
  disabled = false
}) => {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-gray-700">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full px-2 py-1 text-sm border rounded disabled:bg-gray-50"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

const ToggleField: React.FC<ToggleFieldProps> = ({
  label,
  value,
  onChange,
  disabled = false
}) => {
  return (
    <div className="flex items-center justify-between">
      <label className="text-xs font-medium text-gray-700">{label}</label>
      <button
        type="button"
        onClick={() => onChange(!value)}
        disabled={disabled}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
          value ? 'bg-blue-600' : 'bg-gray-200'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <span
          className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
            value ? 'translate-x-5' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
};

const ColorPicker: React.FC<ColorPickerProps> = ({
  value,
  onChange,
  label,
  presets = COLOR_PRESETS
}) => {
  return (
    <div className="space-y-2">
      {label && <label className="text-xs font-medium text-gray-700">{label}</label>}
      <div className="flex items-center space-x-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-8 h-8 border rounded cursor-pointer"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-2 py-1 text-sm border rounded"
          placeholder="#000000"
        />
      </div>
      <div className="grid grid-cols-6 gap-1">
        {presets.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => onChange(color)}
            className={`w-6 h-6 rounded border-2 ${
              value === color ? 'border-gray-800' : 'border-gray-300'
            }`}
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const PropertiesPanel: React.FC<PropertiesPanelProps> = memo(({
  selectedNodes,
  selectedEdges,
  diagramType,
  onNodeUpdate,
  onEdgeUpdate,
  onClose,
  className = ''
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const hasSelection = selectedNodes.length > 0 || selectedEdges.length > 0;
  const isMultiSelection = selectedNodes.length + selectedEdges.length > 1;
  const selectedNode = selectedNodes[0];
  const selectedEdge = selectedEdges[0];

  const handleNodePropertyChange = useCallback((property: string, value: any) => {
    if (selectedNode) {
      onNodeUpdate(selectedNode.id, { [property]: value });
    }
  }, [selectedNode, onNodeUpdate]);

  const handleEdgePropertyChange = useCallback((property: string, value: any) => {
    if (selectedEdge) {
      onEdgeUpdate(selectedEdge.id, { [property]: value });
    }
  }, [selectedEdge, onEdgeUpdate]);

  const getNodeTypeOptions = () => {
    switch (diagramType) {
      case 'bpmn':
        return BPMN_NODE_TYPES;
      case 'mindmap':
        return MINDMAP_NODE_TYPES;
      case 'organogram':
        return ORG_NODE_TYPES;
      default:
        return [];
    }
  };

  const getEdgeTypeOptions = () => {
    return EDGE_TYPES[diagramType] || [];
  };

  if (isCollapsed) {
    return (
      <div className={`fixed top-4 right-4 z-50 ${className}`}>
        <button
          onClick={() => setIsCollapsed(false)}
          className="p-2 bg-white border rounded-lg shadow-lg hover:bg-gray-50"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <div className={`w-80 bg-white border-l border-gray-200 flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <Settings className="w-5 h-5" />
          <h3 className="font-medium">Propriedades</h3>
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setIsCollapsed(true)}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <EyeOff className="w-4 h-4" />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {!hasSelection ? (
          <div className="text-center text-gray-500 py-8">
            <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">Selecione um elemento para editar suas propriedades</p>
          </div>
        ) : isMultiSelection ? (
          <div className="text-center text-gray-500 py-8">
            <Layers className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">Múltiplos elementos selecionados</p>
            <p className="text-xs mt-2">Selecione apenas um elemento para editar</p>
          </div>
        ) : selectedNode ? (
          <div className="space-y-4">
            {/* Basic Properties */}
            <PropertySection title="Básico" icon={<Info className="w-4 h-4" />}>
              <TextField
                label="Rótulo"
                value={selectedNode.data?.label || ''}
                onChange={(value) => handleNodePropertyChange('label', value)}
                placeholder="Digite o rótulo do nó"
              />
              
              <SelectField
                label="Tipo"
                value={selectedNode.data?.type || ''}
                options={getNodeTypeOptions()}
                onChange={(value) => handleNodePropertyChange('type', value)}
              />
              
              <TextField
                label="Descrição"
                value={selectedNode.data?.description || ''}
                onChange={(value) => handleNodePropertyChange('description', value)}
                placeholder="Descrição opcional"
                multiline
              />
            </PropertySection>

            {/* Visual Properties */}
            <PropertySection title="Visual" icon={<Palette className="w-4 h-4" />}>
              <ColorPicker
                label="Cor de Fundo"
                value={selectedNode.data?.backgroundColor || '#ffffff'}
                onChange={(value) => handleNodePropertyChange('backgroundColor', value)}
              />
              
              <ColorPicker
                label="Cor da Borda"
                value={selectedNode.data?.borderColor || '#000000'}
                onChange={(value) => handleNodePropertyChange('borderColor', value)}
              />
              
              <ColorPicker
                label="Cor do Texto"
                value={selectedNode.data?.textColor || '#000000'}
                onChange={(value) => handleNodePropertyChange('textColor', value)}
              />
              
              <NumberField
                label="Largura da Borda"
                value={selectedNode.data?.borderWidth || 1}
                onChange={(value) => handleNodePropertyChange('borderWidth', value)}
                min={0}
                max={10}
                unit="px"
              />
            </PropertySection>

            {/* Size & Position */}
            <PropertySection title="Tamanho e Posição" icon={<Maximize2 className="w-4 h-4" />}>
              <div className="grid grid-cols-2 gap-2">
                <NumberField
                  label="Largura"
                  value={selectedNode.data?.width || 100}
                  onChange={(value) => handleNodePropertyChange('width', value)}
                  min={50}
                  unit="px"
                />
                <NumberField
                  label="Altura"
                  value={selectedNode.data?.height || 50}
                  onChange={(value) => handleNodePropertyChange('height', value)}
                  min={30}
                  unit="px"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <NumberField
                  label="X"
                  value={selectedNode.position?.x || 0}
                  onChange={(value) => handleNodePropertyChange('position', { ...selectedNode.position, x: value })}
                  unit="px"
                />
                <NumberField
                  label="Y"
                  value={selectedNode.position?.y || 0}
                  onChange={(value) => handleNodePropertyChange('position', { ...selectedNode.position, y: value })}
                  unit="px"
                />
              </div>
            </PropertySection>

            {/* Advanced Properties */}
            <PropertySection title="Avançado" icon={<Settings className="w-4 h-4" />}>
              <ToggleField
                label="Bloqueado"
                value={selectedNode.data?.locked || false}
                onChange={(value) => handleNodePropertyChange('locked', value)}
              />
              
              <ToggleField
                label="Visível"
                value={selectedNode.data?.visible !== false}
                onChange={(value) => handleNodePropertyChange('visible', value)}
              />
              
              <TextField
                label="ID"
                value={selectedNode.id}
                onChange={() => {}} // Read-only
                disabled
              />
            </PropertySection>
          </div>
        ) : selectedEdge ? (
          <div className="space-y-4">
            {/* Edge Properties */}
            <PropertySection title="Básico" icon={<Link className="w-4 h-4" />}>
              <TextField
                label="Rótulo"
                value={selectedEdge.data?.label || ''}
                onChange={(value) => handleEdgePropertyChange('label', value)}
                placeholder="Digite o rótulo da aresta"
              />
              
              <SelectField
                label="Tipo"
                value={selectedEdge.data?.type || ''}
                options={getEdgeTypeOptions()}
                onChange={(value) => handleEdgePropertyChange('type', value)}
              />
            </PropertySection>

            {/* Visual Properties */}
            <PropertySection title="Visual" icon={<Palette className="w-4 h-4" />}>
              <ColorPicker
                label="Cor"
                value={selectedEdge.data?.color || '#000000'}
                onChange={(value) => handleEdgePropertyChange('color', value)}
              />
              
              <NumberField
                label="Largura"
                value={selectedEdge.data?.strokeWidth || 2}
                onChange={(value) => handleEdgePropertyChange('strokeWidth', value)}
                min={1}
                max={10}
                unit="px"
              />
              
              <SelectField
                label="Estilo"
                value={selectedEdge.data?.strokeDasharray || 'solid'}
                options={[
                  { value: 'solid', label: 'Sólida' },
                  { value: '5,5', label: 'Tracejada' },
                  { value: '2,2', label: 'Pontilhada' }
                ]}
                onChange={(value) => handleEdgePropertyChange('strokeDasharray', value === 'solid' ? undefined : value)}
              />
            </PropertySection>

            {/* Advanced Properties */}
            <PropertySection title="Avançado" icon={<Settings className="w-4 h-4" />}>
              <ToggleField
                label="Animada"
                value={selectedEdge.data?.animated || false}
                onChange={(value) => handleEdgePropertyChange('animated', value)}
              />
              
              <TextField
                label="ID"
                value={selectedEdge.id}
                onChange={() => {}} // Read-only
                disabled
              />
            </PropertySection>
          </div>
        ) : null}
      </div>
    </div>
  );
});

PropertiesPanel.displayName = 'PropertiesPanel';

export default PropertiesPanel;