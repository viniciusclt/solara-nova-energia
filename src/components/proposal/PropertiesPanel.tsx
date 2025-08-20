import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings,
  Type,
  Palette,
  Move,
  RotateCw,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Trash2,
  Copy,
  ChevronDown,
  ChevronRight,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline,
  Image,
  Square,
} from 'lucide-react';
import { useProposalEditor } from '../../hooks/useProposalEditor';
import { 
  CanvasElement, 
  TextElement, 
  ImageElement, 
  ShapeElement, 
  ChartElement, 
  TableElement 
} from '../../types/proposal';
import { cn } from '../../utils/cn';

// =====================================================================================
// COMPONENTE DO PAINEL DE PROPRIEDADES
// =====================================================================================

interface PropertiesPanelProps {
  className?: string;
  selectedElementId?: string | null;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  className,
  selectedElementId,
}) => {
  const {
    canvasState,
    updateElement,
    deleteElement,
    duplicateElement,
    getElementById,
  } = useProposalEditor();

  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['transform', 'style']));
  const [colorPickerOpen, setColorPickerOpen] = useState<string | null>(null);

  const selectedElement = selectedElementId ? getElementById(selectedElementId) : null;

  // =====================================================================================
  // HANDLERS GERAIS
  // =====================================================================================

  const toggleSection = useCallback((section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  }, []);

  const updateElementProperty = useCallback((property: string, value: unknown) => {
    if (!selectedElement) return;
    
    const updates: Partial<CanvasElement> = {};
    const keys = property.split('.');
    
    if (keys.length === 1) {
      updates[keys[0]] = value;
    } else if (keys.length === 2) {
      updates[keys[0]] = {
        ...selectedElement[keys[0] as keyof CanvasElement],
        [keys[1]]: value,
      };
    } else if (keys.length === 3) {
      const parentKey = keys[0] as keyof CanvasElement;
      const childKey = keys[1];
      const grandChildKey = keys[2];
      
      updates[parentKey] = {
        ...selectedElement[parentKey],
        [childKey]: {
          ...(selectedElement[parentKey] as Record<string, unknown>)[childKey] as Record<string, unknown>,
          [grandChildKey]: value,
        },
      };
    }
    
    updateElement(selectedElement.id, updates);
  }, [selectedElement, updateElement]);

  // =====================================================================================
  // COMPONENTES DE INPUT
  // =====================================================================================

  const NumberInput: React.FC<{
    label: string;
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    step?: number;
    unit?: string;
  }> = ({ label, value, onChange, min, max, step = 1, unit }) => (
    <div className="space-y-1">
      <label className="text-xs font-medium text-gray-700">{label}</label>
      <div className="flex items-center space-x-2">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          min={min}
          max={max}
          step={step}
          className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
        />
        {unit && <span className="text-xs text-gray-500">{unit}</span>}
      </div>
    </div>
  );

  const ColorInput: React.FC<{
    label: string;
    value: string;
    onChange: (value: string) => void;
  }> = ({ label, value, onChange }) => (
    <div className="space-y-1">
      <label className="text-xs font-medium text-gray-700">{label}</label>
      <div className="flex items-center space-x-2">
        <div
          className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
          style={{ backgroundColor: value }}
          onClick={() => setColorPickerOpen(colorPickerOpen === label ? null : label)}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent font-mono"
          placeholder="#000000"
        />
      </div>
      {colorPickerOpen === label && (
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-8 border border-gray-300 rounded cursor-pointer"
        />
      )}
    </div>
  );

  const SelectInput: React.FC<{
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: Array<{ value: string; label: string }>;
  }> = ({ label, value, onChange, options }) => (
    <div className="space-y-1">
      <label className="text-xs font-medium text-gray-700">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );

  const TextInput: React.FC<{
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    multiline?: boolean;
  }> = ({ label, value, onChange, placeholder, multiline }) => (
    <div className="space-y-1">
      <label className="text-xs font-medium text-gray-700">{label}</label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent resize-none"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
        />
      )}
    </div>
  );

  // =====================================================================================
  // SEÇÕES DE PROPRIEDADES
  // =====================================================================================

  const renderTransformSection = () => {
    if (!selectedElement) return null;

    const { transform } = selectedElement;

    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <NumberInput
            label="X"
            value={transform.position.x}
            onChange={(value) => updateElementProperty('transform.position.x', value)}
            unit="px"
          />
          <NumberInput
            label="Y"
            value={transform.position.y}
            onChange={(value) => updateElementProperty('transform.position.y', value)}
            unit="px"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <NumberInput
            label="Largura"
            value={transform.size.width}
            onChange={(value) => updateElementProperty('transform.size.width', value)}
            min={1}
            unit="px"
          />
          <NumberInput
            label="Altura"
            value={transform.size.height}
            onChange={(value) => updateElementProperty('transform.size.height', value)}
            min={1}
            unit="px"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <NumberInput
            label="Rotação"
            value={transform.rotation}
            onChange={(value) => updateElementProperty('transform.rotation', value)}
            min={-360}
            max={360}
            unit="°"
          />
          <NumberInput
            label="Escala"
            value={transform.scale}
            onChange={(value) => updateElementProperty('transform.scale', value)}
            min={0.1}
            max={5}
            step={0.1}
          />
        </div>
      </div>
    );
  };

  const renderAppearanceSection = () => {
    if (!selectedElement) return null;

    return (
      <div className="space-y-3">
        <NumberInput
          label="Opacidade"
          value={selectedElement.opacity * 100}
          onChange={(value) => updateElementProperty('opacity', value / 100)}
          min={0}
          max={100}
          unit="%"
        />
        
        <NumberInput
          label="Z-Index"
          value={selectedElement.zIndex}
          onChange={(value) => updateElementProperty('zIndex', value)}
          min={0}
        />
        
        <div className="flex items-center space-x-4">
          <button
            onClick={() => updateElementProperty('visible', !selectedElement.visible)}
            className={cn(
              "flex items-center space-x-2 px-3 py-1 rounded text-xs font-medium transition-colors",
              selectedElement.visible
                ? "bg-green-100 text-green-700 hover:bg-green-200"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            )}
          >
            {selectedElement.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            <span>{selectedElement.visible ? 'Visível' : 'Oculto'}</span>
          </button>
          
          <button
            onClick={() => updateElementProperty('locked', !selectedElement.locked)}
            className={cn(
              "flex items-center space-x-2 px-3 py-1 rounded text-xs font-medium transition-colors",
              selectedElement.locked
                ? "bg-red-100 text-red-700 hover:bg-red-200"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            )}
          >
            {selectedElement.locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
            <span>{selectedElement.locked ? 'Bloqueado' : 'Desbloqueado'}</span>
          </button>
        </div>
      </div>
    );
  };

  const renderTextProperties = () => {
    if (!selectedElement || selectedElement.type !== 'text') return null;
    
    const textElement = selectedElement as TextElement;

    return (
      <div className="space-y-3">
        <TextInput
          label="Conteúdo"
          value={textElement.content}
          onChange={(value) => updateElementProperty('content', value)}
          multiline
        />
        
        <div className="grid grid-cols-2 gap-2">
          <NumberInput
            label="Tamanho"
            value={textElement.fontSize}
            onChange={(value) => updateElementProperty('fontSize', value)}
            min={8}
            max={200}
            unit="px"
          />
          
          <SelectInput
            label="Família"
            value={textElement.fontFamily}
            onChange={(value) => updateElementProperty('fontFamily', value)}
            options={[
              { value: 'Inter', label: 'Inter' },
              { value: 'Arial', label: 'Arial' },
              { value: 'Helvetica', label: 'Helvetica' },
              { value: 'Georgia', label: 'Georgia' },
              { value: 'Times New Roman', label: 'Times' },
            ]}
          />
        </div>
        
        <ColorInput
          label="Cor do Texto"
          value={textElement.color}
          onChange={(value) => updateElementProperty('color', value)}
        />
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => updateElementProperty('fontWeight', textElement.fontWeight === 'bold' ? 'normal' : 'bold')}
            className={cn(
              "p-2 rounded border transition-colors",
              textElement.fontWeight === 'bold'
                ? "bg-blue-100 border-blue-300 text-blue-700"
                : "bg-white border-gray-300 hover:bg-gray-50"
            )}
          >
            <Bold className="w-3 h-3" />
          </button>
          
          <button
            onClick={() => updateElementProperty('textDecoration', textElement.textDecoration === 'underline' ? 'none' : 'underline')}
            className={cn(
              "p-2 rounded border transition-colors",
              textElement.textDecoration === 'underline'
                ? "bg-blue-100 border-blue-300 text-blue-700"
                : "bg-white border-gray-300 hover:bg-gray-50"
            )}
          >
            <Underline className="w-3 h-3" />
          </button>
        </div>
        
        <div className="flex items-center space-x-1">
          {['left', 'center', 'right'].map((align) => {
            const Icon = align === 'left' ? AlignLeft : align === 'center' ? AlignCenter : AlignRight;
            return (
              <button
                key={align}
                onClick={() => updateElementProperty('textAlign', align)}
                className={cn(
                  "p-2 rounded border transition-colors",
                  textElement.textAlign === align
                    ? "bg-blue-100 border-blue-300 text-blue-700"
                    : "bg-white border-gray-300 hover:bg-gray-50"
                )}
              >
                <Icon className="w-3 h-3" />
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const renderImageProperties = () => {
    if (!selectedElement || selectedElement.type !== 'image') return null;
    
    const imageElement = selectedElement as ImageElement;

    return (
      <div className="space-y-3">
        <TextInput
          label="URL da Imagem"
          value={imageElement.src}
          onChange={(value) => updateElementProperty('src', value)}
          placeholder="https://..."
        />
        
        <TextInput
          label="Texto Alternativo"
          value={imageElement.alt}
          onChange={(value) => updateElementProperty('alt', value)}
          placeholder="Descrição da imagem"
        />
        
        <SelectInput
          label="Ajuste"
          value={imageElement.fit}
          onChange={(value) => updateElementProperty('fit', value)}
          options={[
            { value: 'cover', label: 'Cobrir' },
            { value: 'contain', label: 'Conter' },
            { value: 'fill', label: 'Preencher' },
            { value: 'scale-down', label: 'Reduzir' },
          ]}
        />
        
        <NumberInput
          label="Borda Arredondada"
          value={imageElement.borderRadius || 0}
          onChange={(value) => updateElementProperty('borderRadius', value)}
          min={0}
          unit="px"
        />
      </div>
    );
  };

  const renderShapeProperties = () => {
    if (!selectedElement || selectedElement.type !== 'shape') return null;
    
    const shapeElement = selectedElement as ShapeElement;

    return (
      <div className="space-y-3">
        <SelectInput
          label="Tipo de Forma"
          value={shapeElement.shapeType}
          onChange={(value) => updateElementProperty('shapeType', value)}
          options={[
            { value: 'rectangle', label: 'Retângulo' },
            { value: 'circle', label: 'Círculo' },
            { value: 'triangle', label: 'Triângulo' },
            { value: 'arrow', label: 'Seta' },
            { value: 'star', label: 'Estrela' },
          ]}
        />
        
        <ColorInput
          label="Cor de Preenchimento"
          value={shapeElement.fill}
          onChange={(value) => updateElementProperty('fill', value)}
        />
        
        {shapeElement.stroke && (
          <>
            <ColorInput
              label="Cor da Borda"
              value={shapeElement.stroke.color}
              onChange={(value) => updateElementProperty('stroke.color', value)}
            />
            
            <NumberInput
              label="Espessura da Borda"
              value={shapeElement.stroke.width}
              onChange={(value) => updateElementProperty('stroke.width', value)}
              min={0}
              unit="px"
            />
          </>
        )}
        
        {shapeElement.shapeType === 'rectangle' && (
          <NumberInput
            label="Borda Arredondada"
            value={shapeElement.borderRadius || 0}
            onChange={(value) => updateElementProperty('borderRadius', value)}
            min={0}
            unit="px"
          />
        )}
      </div>
    );
  };

  // =====================================================================================
  // SEÇÃO PRINCIPAL
  // =====================================================================================

  const renderSection = (id: string, title: string, icon: React.ComponentType<{ className?: string }>, content: React.ReactNode) => {
    const isExpanded = expandedSections.has(id);
    const IconComponent = icon;

    return (
      <div className="border border-gray-200 rounded-lg">
        <button
          onClick={() => toggleSection(id)}
          className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center space-x-2">
            <IconComponent className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-900">{title}</span>
          </div>
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-400" />
          )}
        </button>
        
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="p-3 border-t border-gray-200 bg-gray-50">
                {content}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  // =====================================================================================
  // RENDER PRINCIPAL
  // =====================================================================================

  if (!selectedElement) {
    return (
      <div className={cn("w-80 bg-white border-l border-gray-200 flex flex-col", className)}>
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900 flex items-center">
            <Settings className="w-4 h-4 mr-2" />
            Propriedades
          </h3>
        </div>
        
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center text-gray-500">
            <Settings className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Selecione um elemento</p>
            <p className="text-xs mt-1">para editar suas propriedades</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("w-80 bg-white border-l border-gray-200 flex flex-col", className)}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900 flex items-center">
            <Settings className="w-4 h-4 mr-2" />
            Propriedades
          </h3>
          
          <div className="flex items-center space-x-1">
            <button
              onClick={() => duplicateElement(selectedElement.id)}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              title="Duplicar"
            >
              <Copy className="w-4 h-4 text-gray-600" />
            </button>
            
            <button
              onClick={() => deleteElement(selectedElement.id)}
              className="p-1 hover:bg-red-100 text-red-600 rounded transition-colors"
              title="Excluir"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 text-xs text-gray-600">
          <div className="flex items-center space-x-1">
            {selectedElement.type === 'text' && <Type className="w-3 h-3" />}
            {selectedElement.type === 'image' && <Image className="w-3 h-3" />}
            {selectedElement.type === 'shape' && <Square className="w-3 h-3" />}
            <span className="capitalize">{selectedElement.type}</span>
          </div>
          <span>•</span>
          <span>ID: {selectedElement.id.slice(-8)}</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {renderSection('transform', 'Transformação', Move, renderTransformSection())}
        {renderSection('appearance', 'Aparência', Eye, renderAppearanceSection())}
        
        {selectedElement.type === 'text' && 
          renderSection('text', 'Texto', Type, renderTextProperties())
        }
        
        {selectedElement.type === 'image' && 
          renderSection('image', 'Imagem', Image, renderImageProperties())
        }
        
        {selectedElement.type === 'shape' && 
          renderSection('shape', 'Forma', Square, renderShapeProperties())
        }
      </div>
    </div>
  );
};

export default PropertiesPanel;