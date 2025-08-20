import React from 'react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { FileText, Monitor, Ruler, Palette } from 'lucide-react';
import type { TemplateFormat, CanvasData } from '../../types/proposal-editor';
import { FORMAT_DIMENSIONS } from '../../types/proposal-editor';

interface FormatSelectorProps {
  selectedFormat: TemplateFormat;
  canvasData: CanvasData;
  onFormatChange: (format: TemplateFormat) => void;
  onCanvasDataChange: (canvasData: CanvasData) => void;
  className?: string;
}

// Predefinições de formatos
const formatPresets = {
  'A4': {
    label: 'A4 (Documento)',
    description: 'Ideal para propostas, relatórios e documentos',
    icon: FileText,
    dimensions: FORMAT_DIMENSIONS['A4'],
    aspectRatio: '√2:1',
    useCases: ['Propostas comerciais', 'Relatórios', 'Documentos oficiais']
  },
  '16:9': {
    label: '16:9 (Apresentação)',
    description: 'Perfeito para slides e apresentações',
    icon: Monitor,
    dimensions: FORMAT_DIMENSIONS['16:9'],
    aspectRatio: '16:9',
    useCases: ['Apresentações', 'Slides', 'Dashboards']
  }
};

// Temas predefinidos
const backgroundPresets = [
  {
    id: 'white',
    label: 'Branco',
    value: '#ffffff',
    preview: 'bg-white border-2 border-gray-200'
  },
  {
    id: 'light-gray',
    label: 'Cinza Claro',
    value: '#f8fafc',
    preview: 'bg-slate-50 border-2 border-gray-200'
  },
  {
    id: 'blue-gradient',
    label: 'Azul Gradiente',
    value: 'linear-gradient(135deg, #0EA5E9, #3B82F6)',
    preview: 'bg-gradient-to-br from-sky-500 to-blue-600'
  },
  {
    id: 'green-gradient',
    label: 'Verde Gradiente',
    value: 'linear-gradient(135deg, #10B981, #059669)',
    preview: 'bg-gradient-to-br from-emerald-500 to-emerald-600'
  },
  {
    id: 'purple-gradient',
    label: 'Roxo Gradiente',
    value: 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
    preview: 'bg-gradient-to-br from-violet-500 to-violet-600'
  },
  {
    id: 'solar-theme',
    label: 'Tema Solar',
    value: 'linear-gradient(135deg, #F59E0B, #EAB308)',
    preview: 'bg-gradient-to-br from-amber-500 to-yellow-500'
  }
];

interface FormatCardProps {
  format: TemplateFormat;
  isSelected: boolean;
  onSelect: (format: TemplateFormat) => void;
}

const FormatCard: React.FC<FormatCardProps> = ({ format, isSelected, onSelect }) => {
  const preset = formatPresets[format];
  const IconComponent = preset.icon;

  return (
    <Card 
      className={cn(
        'cursor-pointer transition-all duration-200 hover:shadow-md',
        isSelected 
          ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950' 
          : 'hover:bg-gray-50 dark:hover:bg-gray-800'
      )}
      onClick={() => onSelect(format)}
    >
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <div className={cn(
            'p-2 rounded-lg',
            isSelected 
              ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
          )}>
            <IconComponent className="h-5 w-5" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                {preset.label}
              </h3>
              {isSelected && (
                <Badge variant="default" className="text-xs">
                  Selecionado
                </Badge>
              )}
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              {preset.description}
            </p>
            
            <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-500">
              <span className="flex items-center">
                <Ruler className="h-3 w-3 mr-1" />
                {preset.dimensions.width} × {preset.dimensions.height}
              </span>
              <span>{preset.aspectRatio}</span>
            </div>
            
            <div className="mt-2">
              <p className="text-xs text-gray-500 dark:text-gray-500 mb-1">Ideal para:</p>
              <div className="flex flex-wrap gap-1">
                {preset.useCases.map((useCase, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {useCase}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface BackgroundSelectorProps {
  selectedBackground: string;
  onBackgroundChange: (background: string) => void;
}

const BackgroundSelector: React.FC<BackgroundSelectorProps> = ({
  selectedBackground,
  onBackgroundChange
}) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-2">
        <Palette className="h-4 w-4 text-gray-600 dark:text-gray-400" />
        <h4 className="font-medium text-gray-900 dark:text-gray-100">
          Fundo do Canvas
        </h4>
      </div>
      
      <div className="grid grid-cols-3 gap-2">
        {backgroundPresets.map((preset) => (
          <button
            key={preset.id}
            onClick={() => onBackgroundChange(preset.value)}
            className={cn(
              'relative p-3 rounded-lg border-2 transition-all duration-200',
              'hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500',
              selectedBackground === preset.value
                ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
            )}
            title={preset.label}
          >
            <div className={cn(
              'w-full h-8 rounded',
              preset.preview
            )} />
            <span className="text-xs text-gray-600 dark:text-gray-400 mt-1 block truncate">
              {preset.label}
            </span>
            
            {selectedBackground === preset.value && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full" />
            )}
          </button>
        ))}
      </div>
      
      {/* Custom color input */}
      <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Cor personalizada:
        </label>
        <div className="flex space-x-2">
          <input
            type="color"
            value={selectedBackground.startsWith('#') ? selectedBackground : '#ffffff'}
            onChange={(e) => onBackgroundChange(e.target.value)}
            className="w-12 h-8 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
          />
          <input
            type="text"
            value={selectedBackground}
            onChange={(e) => onBackgroundChange(e.target.value)}
            placeholder="#ffffff ou gradient..."
            className="flex-1 px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800"
          />
        </div>
      </div>
    </div>
  );
};

export const FormatSelector: React.FC<FormatSelectorProps> = ({
  selectedFormat,
  canvasData,
  onFormatChange,
  onCanvasDataChange,
  className
}) => {
  const handleFormatChange = (format: TemplateFormat) => {
    onFormatChange(format);
    
    // Atualizar dimensões do canvas baseado no formato
    const dimensions = FORMAT_DIMENSIONS[format];
    onCanvasDataChange({
      ...canvasData,
      width: dimensions.width,
      height: dimensions.height
    });
  };

  const handleBackgroundChange = (background: string) => {
    onCanvasDataChange({
      ...canvasData,
      background
    });
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Format Selection */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Formato do Template
        </h3>
        
        <div className="space-y-3">
          {Object.entries(formatPresets).map(([format, preset]) => (
            <FormatCard
              key={format}
              format={format as TemplateFormat}
              isSelected={selectedFormat === format}
              onSelect={handleFormatChange}
            />
          ))}
        </div>
      </div>

      {/* Background Selection */}
      <div className="space-y-4">
        <BackgroundSelector
          selectedBackground={canvasData.background}
          onBackgroundChange={handleBackgroundChange}
        />
      </div>

      {/* Canvas Settings */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900 dark:text-gray-100">
          Configurações do Canvas
        </h4>
        
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tamanho da Grade
            </label>
            <Select
              value={canvasData.gridSize?.toString() || '10'}
              onValueChange={(value) => onCanvasDataChange({
                ...canvasData,
                gridSize: parseInt(value)
              })}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5px</SelectItem>
                <SelectItem value="10">10px</SelectItem>
                <SelectItem value="20">20px</SelectItem>
                <SelectItem value="25">25px</SelectItem>
                <SelectItem value="50">50px</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Mostrar Grade
            </label>
            <Button
              variant={canvasData.showGrid ? "default" : "outline"}
              size="sm"
              onClick={() => onCanvasDataChange({
                ...canvasData,
                showGrid: !canvasData.showGrid
              })}
            >
              {canvasData.showGrid ? 'Visível' : 'Oculta'}
            </Button>
          </div>
        </div>
      </div>

      {/* Format Info */}
      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
          Informações do Formato
        </h5>
        <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <p><strong>Formato:</strong> {formatPresets[selectedFormat].label}</p>
          <p><strong>Dimensões:</strong> {canvasData.width} × {canvasData.height}px</p>
          <p><strong>Proporção:</strong> {formatPresets[selectedFormat].aspectRatio}</p>
          <p><strong>DPI:</strong> {formatPresets[selectedFormat].dimensions.dpi}</p>
        </div>
      </div>
    </div>
  );
};

export default FormatSelector;