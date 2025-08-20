import React, { useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { cn } from '../../../lib/utils';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../../ui/popover';
import {
  Square,
  Circle,
  Triangle,
  Minus,
  Settings,
  Trash2
} from 'lucide-react';
import type { ProposalElement, ShapeProperties, ShapeType } from '../../../types/proposal-editor';

interface ShapeElementData {
  element: ProposalElement;
  isSelected: boolean;
  onUpdate: (updates: Partial<ProposalElement>) => void;
  onDelete: () => void;
  onSelect: () => void;
}

export const ShapeElementNode: React.FC<NodeProps<ShapeElementData>> = ({
  data
}) => {
  const { element, isSelected, onUpdate, onDelete, onSelect } = data;
  const properties = element.properties as ShapeProperties;

  const updateProperty = (key: keyof ShapeProperties, value: string | number | boolean) => {
    onUpdate({
      properties: {
        ...properties,
        [key]: value
      }
    });
  };

  const getShapeIcon = (type: ShapeType) => {
    switch (type) {
      case 'circle': return <Circle className="h-4 w-4" />;
      case 'triangle': return <Triangle className="h-4 w-4" />;
      case 'line': return <Minus className="h-4 w-4" />;
      default: return <Square className="h-4 w-4" />;
    }
  };

  const renderShape = () => {
    const { width, height } = element.position;
    const {
      shapeType = 'rectangle',
      fillColor = '#3b82f6',
      strokeColor = '#1e40af',
      strokeWidth = 2,
      opacity = 1,
      borderRadius = 0
    } = properties;

    const commonStyle = {
      fill: fillColor,
      stroke: strokeColor,
      strokeWidth,
      opacity
    };

    switch (shapeType) {
      case 'circle':
        const radius = Math.min(width, height) / 2 - strokeWidth;
        return (
          <svg width={width} height={height} className="w-full h-full">
            <circle
              cx={width / 2}
              cy={height / 2}
              r={radius}
              {...commonStyle}
            />
          </svg>
        );
      
      case 'triangle':
        const points = `${width / 2},${strokeWidth} ${width - strokeWidth},${height - strokeWidth} ${strokeWidth},${height - strokeWidth}`;
        return (
          <svg width={width} height={height} className="w-full h-full">
            <polygon
              points={points}
              {...commonStyle}
            />
          </svg>
        );
      
      case 'line':
        return (
          <svg width={width} height={height} className="w-full h-full">
            <line
              x1={strokeWidth}
              y1={height / 2}
              x2={width - strokeWidth}
              y2={height / 2}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              opacity={opacity}
            />
          </svg>
        );
      
      default: // rectangle
        return (
          <div
            className="w-full h-full"
            style={{
              backgroundColor: fillColor,
              border: `${strokeWidth}px solid ${strokeColor}`,
              borderRadius: `${borderRadius}px`,
              opacity
            }}
          />
        );
    }
  };

  return (
    <div
      className={cn(
        'relative border-2 border-transparent rounded-lg overflow-hidden',
        'hover:border-blue-300 transition-colors',
        isSelected && 'border-blue-500 shadow-lg',
        'group cursor-pointer'
      )}
      onClick={onSelect}
      style={{
        width: element.position.width,
        height: element.position.height
      }}
    >
      {/* Handles para conexões */}
      <Handle
        type="target"
        position={Position.Top}
        className="opacity-0 group-hover:opacity-100"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="opacity-0 group-hover:opacity-100"
      />

      {/* Conteúdo da forma */}
      <div className="w-full h-full">
        {renderShape()}
      </div>

      {/* Toolbar de edição */}
      {isSelected && (
        <div className="absolute -top-12 left-0 flex items-center space-x-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-1 z-10">
          {/* Tipo de forma */}
          <Select
            value={properties.shapeType || 'rectangle'}
            onValueChange={(value: ShapeType) => updateProperty('shapeType', value)}
          >
            <SelectTrigger className="h-8 w-20 text-xs">
              {getShapeIcon(properties.shapeType || 'rectangle')}
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rectangle">
                <div className="flex items-center space-x-2">
                  <Square className="h-4 w-4" />
                  <span>Retângulo</span>
                </div>
              </SelectItem>
              <SelectItem value="circle">
                <div className="flex items-center space-x-2">
                  <Circle className="h-4 w-4" />
                  <span>Círculo</span>
                </div>
              </SelectItem>
              <SelectItem value="triangle">
                <div className="flex items-center space-x-2">
                  <Triangle className="h-4 w-4" />
                  <span>Triângulo</span>
                </div>
              </SelectItem>
              <SelectItem value="line">
                <div className="flex items-center space-x-2">
                  <Minus className="h-4 w-4" />
                  <span>Linha</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Cor de preenchimento */}
          <div className="flex items-center space-x-1">
            <input
              type="color"
              value={properties.fillColor || '#3b82f6'}
              onChange={(e) => updateProperty('fillColor', e.target.value)}
              className="w-8 h-8 rounded border cursor-pointer"
              title="Cor de preenchimento"
            />
          </div>

          {/* Cor da borda */}
          <div className="flex items-center space-x-1">
            <input
              type="color"
              value={properties.strokeColor || '#1e40af'}
              onChange={(e) => updateProperty('strokeColor', e.target.value)}
              className="w-8 h-8 rounded border cursor-pointer"
              title="Cor da borda"
            />
          </div>

          {/* Configurações avançadas */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Settings className="h-3 w-3" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3">
              <div className="space-y-3">
                <h4 className="font-medium text-sm">Configurações da Forma</h4>
                
                <div>
                  <Label className="text-xs font-medium">Tipo de forma</Label>
                  <Select
                    value={properties.shapeType || 'rectangle'}
                    onValueChange={(value: ShapeType) => updateProperty('shapeType', value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rectangle">
                        <div className="flex items-center space-x-2">
                          <Square className="h-4 w-4" />
                          <span>Retângulo</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="circle">
                        <div className="flex items-center space-x-2">
                          <Circle className="h-4 w-4" />
                          <span>Círculo</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="triangle">
                        <div className="flex items-center space-x-2">
                          <Triangle className="h-4 w-4" />
                          <span>Triângulo</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="line">
                        <div className="flex items-center space-x-2">
                          <Minus className="h-4 w-4" />
                          <span>Linha</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label className="text-xs font-medium">Cor de preenchimento</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <input
                      type="color"
                      value={properties.fillColor || '#3b82f6'}
                      onChange={(e) => updateProperty('fillColor', e.target.value)}
                      className="w-8 h-8 rounded border"
                    />
                    <Input
                      value={properties.fillColor || '#3b82f6'}
                      onChange={(e) => updateProperty('fillColor', e.target.value)}
                      className="flex-1 text-xs"
                    />
                  </div>
                </div>
                
                <div>
                  <Label className="text-xs font-medium">Cor da borda</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <input
                      type="color"
                      value={properties.strokeColor || '#1e40af'}
                      onChange={(e) => updateProperty('strokeColor', e.target.value)}
                      className="w-8 h-8 rounded border"
                    />
                    <Input
                      value={properties.strokeColor || '#1e40af'}
                      onChange={(e) => updateProperty('strokeColor', e.target.value)}
                      className="flex-1 text-xs"
                    />
                  </div>
                </div>
                
                <div>
                  <Label className="text-xs font-medium">Largura da borda (px)</Label>
                  <Input
                    type="number"
                    value={properties.strokeWidth || 2}
                    onChange={(e) => updateProperty('strokeWidth', parseInt(e.target.value))}
                    min="0"
                    max="20"
                    className="mt-1"
                  />
                </div>
                
                {properties.shapeType === 'rectangle' && (
                  <div>
                    <Label className="text-xs font-medium">Borda arredondada (px)</Label>
                    <Input
                      type="number"
                      value={properties.borderRadius || 0}
                      onChange={(e) => updateProperty('borderRadius', parseInt(e.target.value))}
                      min="0"
                      max="50"
                      className="mt-1"
                    />
                  </div>
                )}
                
                <div>
                  <Label className="text-xs font-medium">Opacidade</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={properties.opacity || 1}
                      onChange={(e) => updateProperty('opacity', parseFloat(e.target.value))}
                      className="flex-1"
                    />
                    <span className="text-xs w-8 text-right">
                      {Math.round((properties.opacity || 1) * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Deletar */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Indicador de seleção */}
      {isSelected && (
        <div className="absolute inset-0 border-2 border-blue-500 rounded-lg pointer-events-none" />
      )}

      {/* Resize handles */}
      {isSelected && (
        <>
          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 rounded-full cursor-se-resize" />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full cursor-ne-resize" />
          <div className="absolute -top-1 -left-1 w-3 h-3 bg-blue-500 rounded-full cursor-nw-resize" />
          <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-500 rounded-full cursor-sw-resize" />
        </>
      )}
    </div>
  );
};

export default ShapeElementNode;