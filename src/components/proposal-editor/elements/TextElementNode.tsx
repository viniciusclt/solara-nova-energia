import React, { useState, useRef, useEffect } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { cn } from '../../../lib/utils';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Textarea } from '../../ui/textarea';
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
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Type,
  Palette,
  Settings,
  Trash2
} from 'lucide-react';
import type { ProposalElement, TextProperties } from '../../../types/proposal-editor';

interface TextElementData {
  element: ProposalElement;
  isSelected: boolean;
  onUpdate: (updates: Partial<ProposalElement>) => void;
  onDelete: () => void;
  onSelect: () => void;
}

export const TextElementNode: React.FC<NodeProps<TextElementData>> = ({
  data,
  selected
}) => {
  const { element, isSelected, onUpdate, onDelete, onSelect } = data;
  const properties = element.properties as TextProperties;
  
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(properties.content);
  const textRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Focar no input quando entrar em modo de edição
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleDoubleClick = () => {
    setIsEditing(true);
    setEditValue(properties.content);
  };

  const handleSave = () => {
    onUpdate({
      properties: {
        ...properties,
        content: editValue
      }
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(properties.content);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const updateProperty = (key: keyof TextProperties, value: string | number) => {
    onUpdate({
      properties: {
        ...properties,
        [key]: value
      }
    });
  };

  const toggleBold = () => {
    const newWeight = properties.fontWeight === 'bold' ? 'normal' : 'bold';
    updateProperty('fontWeight', newWeight);
  };

  const textStyle = {
    fontSize: `${properties.fontSize}px`,
    fontFamily: properties.fontFamily || 'Inter, sans-serif',
    fontWeight: properties.fontWeight || 'normal',
    color: properties.color,
    textAlign: properties.textAlign,
    lineHeight: properties.lineHeight || 1.5,
    letterSpacing: properties.letterSpacing ? `${properties.letterSpacing}px` : 'normal'
  };

  return (
    <div
      className={cn(
        'relative bg-transparent border-2 border-transparent rounded-lg',
        'hover:border-blue-300 transition-colors',
        isSelected && 'border-blue-500 shadow-lg',
        'group cursor-pointer'
      )}
      onClick={onSelect}
      onDoubleClick={handleDoubleClick}
      style={{
        width: element.position.width,
        height: element.position.height
      }}
    >
      {/* Handles para conexões (ocultos por padrão) */}
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

      {/* Conteúdo do texto */}
      <div className="w-full h-full p-2 overflow-hidden">
        {isEditing ? (
          <div className="w-full h-full">
            <Textarea
              ref={inputRef}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleSave}
              className="w-full h-full resize-none border-none focus:ring-0 p-0 bg-transparent"
              style={textStyle}
            />
          </div>
        ) : (
          <div
            ref={textRef}
            className="w-full h-full overflow-hidden"
            style={textStyle}
          >
            {properties.content || 'Clique duas vezes para editar'}
          </div>
        )}
      </div>

      {/* Toolbar de edição */}
      {isSelected && !isEditing && (
        <div className="absolute -top-12 left-0 flex items-center space-x-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-1 z-10">
          {/* Formatação básica */}
          <Button
            variant={properties.fontWeight === 'bold' ? 'default' : 'ghost'}
            size="sm"
            onClick={toggleBold}
            className="h-8 w-8 p-0"
          >
            <Bold className="h-3 w-3" />
          </Button>

          {/* Alinhamento */}
          <Select
            value={properties.textAlign}
            onValueChange={(value) => updateProperty('textAlign', value)}
          >
            <SelectTrigger className="h-8 w-8 p-0 border-none">
              {properties.textAlign === 'left' && <AlignLeft className="h-3 w-3" />}
              {properties.textAlign === 'center' && <AlignCenter className="h-3 w-3" />}
              {properties.textAlign === 'right' && <AlignRight className="h-3 w-3" />}
              {properties.textAlign === 'justify' && <AlignJustify className="h-3 w-3" />}
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="left">
                <div className="flex items-center space-x-2">
                  <AlignLeft className="h-3 w-3" />
                  <span>Esquerda</span>
                </div>
              </SelectItem>
              <SelectItem value="center">
                <div className="flex items-center space-x-2">
                  <AlignCenter className="h-3 w-3" />
                  <span>Centro</span>
                </div>
              </SelectItem>
              <SelectItem value="right">
                <div className="flex items-center space-x-2">
                  <AlignRight className="h-3 w-3" />
                  <span>Direita</span>
                </div>
              </SelectItem>
              <SelectItem value="justify">
                <div className="flex items-center space-x-2">
                  <AlignJustify className="h-3 w-3" />
                  <span>Justificado</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Tamanho da fonte */}
          <Select
            value={properties.fontSize.toString()}
            onValueChange={(value) => updateProperty('fontSize', parseInt(value))}
          >
            <SelectTrigger className="h-8 w-16 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 64].map(size => (
                <SelectItem key={size} value={size.toString()}>
                  {size}px
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Cor do texto */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Palette className="h-3 w-3" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3">
              <div className="space-y-3">
                <h4 className="font-medium text-sm">Cor do Texto</h4>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={properties.color}
                    onChange={(e) => updateProperty('color', e.target.value)}
                    className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
                  />
                  <Input
                    value={properties.color}
                    onChange={(e) => updateProperty('color', e.target.value)}
                    placeholder="#000000"
                    className="flex-1 text-sm"
                  />
                </div>
                
                {/* Cores predefinidas */}
                <div className="grid grid-cols-6 gap-1">
                  {[
                    '#000000', '#374151', '#6b7280', '#9ca3af',
                    '#ef4444', '#f97316', '#eab308', '#22c55e',
                    '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899'
                  ].map(color => (
                    <button
                      key={color}
                      onClick={() => updateProperty('color', color)}
                      className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Configurações avançadas */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Settings className="h-3 w-3" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3">
              <div className="space-y-3">
                <h4 className="font-medium text-sm">Configurações Avançadas</h4>
                
                <div>
                  <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    Altura da linha
                  </label>
                  <Input
                    type="number"
                    value={properties.lineHeight || 1.5}
                    onChange={(e) => updateProperty('lineHeight', parseFloat(e.target.value))}
                    step="0.1"
                    min="0.5"
                    max="3"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    Espaçamento entre letras (px)
                  </label>
                  <Input
                    type="number"
                    value={properties.letterSpacing || 0}
                    onChange={(e) => updateProperty('letterSpacing', parseFloat(e.target.value))}
                    step="0.5"
                    min="-2"
                    max="10"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    Família da fonte
                  </label>
                  <Select
                    value={properties.fontFamily || 'Inter, sans-serif'}
                    onValueChange={(value) => updateProperty('fontFamily', value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Inter, sans-serif">Inter</SelectItem>
                      <SelectItem value="Arial, sans-serif">Arial</SelectItem>
                      <SelectItem value="Helvetica, sans-serif">Helvetica</SelectItem>
                      <SelectItem value="Georgia, serif">Georgia</SelectItem>
                      <SelectItem value="Times New Roman, serif">Times New Roman</SelectItem>
                      <SelectItem value="Courier New, monospace">Courier New</SelectItem>
                    </SelectContent>
                  </Select>
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

export default TextElementNode;