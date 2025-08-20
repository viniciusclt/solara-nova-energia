import React from 'react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import {
  Type,
  Image,
  BarChart3,
  Table,
  Square,
  Circle,
  Triangle,
  Minus,
  Plus,
  Palette,
  Settings
} from 'lucide-react';
import type { ElementType, ToolbarItem } from '../../types/proposal-editor';

interface ElementToolbarProps {
  className?: string;
  onElementSelect?: (elementType: ElementType) => void;
}

// Configuração dos itens da toolbar
const toolbarItems: ToolbarItem[] = [
  {
    id: 'text',
    type: 'text' as ElementType,
    label: 'Texto',
    icon: 'Type',
    defaultProperties: {
      content: 'Novo texto',
      fontSize: 16,
      color: '#000000',
      textAlign: 'left'
    },
    defaultSize: { width: 200, height: 50 }
  },
  {
    id: 'image',
    type: 'image' as ElementType,
    label: 'Imagem',
    icon: 'Image',
    defaultProperties: {
      src: 'https://via.placeholder.com/300x200',
      alt: 'Nova imagem',
      objectFit: 'cover'
    },
    defaultSize: { width: 300, height: 200 }
  },
  {
    id: 'chart',
    type: 'chart' as ElementType,
    label: 'Gráfico',
    icon: 'BarChart3',
    defaultProperties: {
      type: 'bar',
      data: [
        { name: 'A', value: 10 },
        { name: 'B', value: 20 },
        { name: 'C', value: 15 }
      ],
      config: {
        title: 'Novo Gráfico',
        showLegend: true
      }
    },
    defaultSize: { width: 400, height: 300 }
  },
  {
    id: 'table',
    type: 'table' as ElementType,
    label: 'Tabela',
    icon: 'Table',
    defaultProperties: {
      headers: ['Coluna 1', 'Coluna 2'],
      rows: [['Linha 1', 'Dados 1'], ['Linha 2', 'Dados 2']],
      styling: {
        headerBg: '#f3f4f6',
        headerColor: '#1f2937',
        fontSize: 14
      }
    },
    defaultSize: { width: 350, height: 200 }
  }
];

// Itens de formas
const shapeItems = [
  {
    id: 'rectangle',
    type: 'shape' as ElementType,
    label: 'Retângulo',
    icon: 'Square',
    defaultProperties: {
      type: 'rectangle',
      fill: '#3b82f6',
      opacity: 0.8
    },
    defaultSize: { width: 200, height: 100 }
  },
  {
    id: 'circle',
    type: 'shape' as ElementType,
    label: 'Círculo',
    icon: 'Circle',
    defaultProperties: {
      type: 'circle',
      fill: '#10b981',
      opacity: 0.8
    },
    defaultSize: { width: 150, height: 150 }
  },
  {
    id: 'triangle',
    type: 'shape' as ElementType,
    label: 'Triângulo',
    icon: 'Triangle',
    defaultProperties: {
      type: 'triangle',
      fill: '#f59e0b',
      opacity: 0.8
    },
    defaultSize: { width: 150, height: 150 }
  },
  {
    id: 'line',
    type: 'shape' as ElementType,
    label: 'Linha',
    icon: 'Minus',
    defaultProperties: {
      type: 'line',
      fill: '#6b7280',
      strokeWidth: 2
    },
    defaultSize: { width: 200, height: 2 }
  }
];

// Mapeamento de ícones
const iconMap = {
  Type,
  Image,
  BarChart3,
  Table,
  Square,
  Circle,
  Triangle,
  Minus,
  Plus,
  Palette,
  Settings
};

interface DraggableItemProps {
  item: ToolbarItem;
  onSelect?: (elementType: ElementType) => void;
}

const DraggableItem: React.FC<DraggableItemProps> = ({ item, onSelect }) => {
  const IconComponent = iconMap[item.icon as keyof typeof iconMap];

  const handleDragStart = (event: React.DragEvent) => {
    event.dataTransfer.setData('application/reactflow', item.type);
    event.dataTransfer.setData('application/json', JSON.stringify(item));
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleClick = () => {
    onSelect?.(item.type);
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onClick={handleClick}
      className={cn(
        'flex flex-col items-center justify-center p-3 rounded-lg border-2 border-dashed border-gray-300',
        'hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950',
        'cursor-grab active:cursor-grabbing transition-colors',
        'min-h-[80px] text-center group'
      )}
    >
      <IconComponent className="h-6 w-6 text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 mb-2" />
      <span className="text-xs font-medium text-gray-700 dark:text-gray-300 group-hover:text-blue-700 dark:group-hover:text-blue-300">
        {item.label}
      </span>
    </div>
  );
};

interface ToolbarSectionProps {
  title: string;
  items: ToolbarItem[];
  onElementSelect?: (elementType: ElementType) => void;
}

const ToolbarSection: React.FC<ToolbarSectionProps> = ({ title, items, onElementSelect }) => {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 px-1">
        {title}
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {items.map((item) => (
          <DraggableItem
            key={item.id}
            item={item}
            onSelect={onElementSelect}
          />
        ))}
      </div>
    </div>
  );
};

export const ElementToolbar: React.FC<ElementToolbarProps> = ({
  className,
  onElementSelect
}) => {
  return (
    <div className={cn(
      'w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700',
      'flex flex-col h-full',
      className
    )}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Elementos
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Arraste para adicionar ao canvas
        </p>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-6">
          {/* Elementos básicos */}
          <ToolbarSection
            title="Básicos"
            items={toolbarItems}
            onElementSelect={onElementSelect}
          />

          <Separator />

          {/* Formas */}
          <ToolbarSection
            title="Formas"
            items={shapeItems}
            onElementSelect={onElementSelect}
          />

          <Separator />

          {/* Ações rápidas */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 px-1">
              Ações
            </h3>
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => {/* TODO: Implementar upload de imagem */}}
              >
                <Plus className="h-4 w-4 mr-2" />
                Upload Imagem
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => {/* TODO: Implementar paleta de cores */}}
              >
                <Palette className="h-4 w-4 mr-2" />
                Paleta de Cores
              </Button>
            </div>
          </div>
        </div>
      </ScrollArea>

      {/* Footer com dicas */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
          <p><strong>Dica:</strong> Arraste elementos para o canvas</p>
          <p><strong>Ctrl+Z:</strong> Desfazer</p>
          <p><strong>Ctrl+Y:</strong> Refazer</p>
          <p><strong>Del:</strong> Excluir selecionado</p>
        </div>
      </div>
    </div>
  );
};

export default ElementToolbar;