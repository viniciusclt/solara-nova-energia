import React, { useState, useMemo } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Type,
  Heading1,
  Image,
  Table,
  BarChart3,
  Minus,
  Square,
  Container,
  MousePointer,
  FileImage,
  PenTool,
  Search,
  Layout,
  FileText,
  Camera,
  Database,
  Zap
} from 'lucide-react';
import { ComponentLibraryItem, ComponentType, ComponentCategory } from './types';

const COMPONENT_LIBRARY: ComponentLibraryItem[] = [
  // Layout Components
  {
    type: 'container',
    name: 'Container',
    description: 'Contêiner flexível para agrupar elementos',
    icon: 'Container',
    category: 'layout',
    defaultProperties: {
      backgroundColor: 'transparent',
      padding: { top: 10, right: 10, bottom: 10, left: 10 },
      flexDirection: 'column',
      justifyContent: 'flex-start',
      alignItems: 'flex-start',
      gap: 10
    },
    defaultSize: { width: 300, height: 200 }
  },
  {
    type: 'spacer',
    name: 'Espaçador',
    description: 'Espaço em branco para layout',
    icon: 'Square',
    category: 'layout',
    defaultProperties: {
      backgroundColor: 'transparent'
    },
    defaultSize: { width: 100, height: 50 }
  },
  {
    type: 'divider',
    name: 'Divisor',
    description: 'Linha divisória horizontal ou vertical',
    icon: 'Minus',
    category: 'layout',
    defaultProperties: {
      borderWidth: 1,
      borderColor: '#e5e7eb',
      borderStyle: 'solid'
    },
    defaultSize: { width: 300, height: 1 }
  },

  // Content Components
  {
    type: 'text',
    name: 'Texto',
    description: 'Texto simples editável',
    icon: 'Type',
    category: 'content',
    defaultProperties: {
      text: 'Digite seu texto aqui',
      fontSize: 14,
      fontWeight: 'normal',
      color: '#000000',
      textAlign: 'left',
      lineHeight: 1.5
    },
    defaultSize: { width: 200, height: 40 }
  },
  {
    type: 'heading',
    name: 'Título',
    description: 'Título ou cabeçalho',
    icon: 'Heading1',
    category: 'content',
    defaultProperties: {
      text: 'Título',
      fontSize: 24,
      fontWeight: 'bold',
      color: '#000000',
      textAlign: 'left',
      lineHeight: 1.2
    },
    defaultSize: { width: 200, height: 60 }
  },
  {
    type: 'placeholder',
    name: 'Placeholder',
    description: 'Campo dinâmico de dados',
    icon: 'PenTool',
    category: 'content',
    defaultProperties: {
      placeholderKey: 'lead.name',
      placeholderType: 'text',
      text: '{{lead.name}}',
      fontSize: 14,
      color: '#000000'
    },
    defaultSize: { width: 150, height: 30 }
  },

  // Media Components
  {
    type: 'image',
    name: 'Imagem',
    description: 'Imagem ou foto',
    icon: 'Image',
    category: 'media',
    defaultProperties: {
      src: '',
      alt: 'Imagem',
      objectFit: 'cover'
    },
    defaultSize: { width: 200, height: 150 }
  },
  {
    type: 'logo',
    name: 'Logo',
    description: 'Logo da empresa',
    icon: 'FileImage',
    category: 'media',
    defaultProperties: {
      src: '',
      alt: 'Logo da empresa',
      objectFit: 'contain'
    },
    defaultSize: { width: 120, height: 60 }
  },
  {
    type: 'signature',
    name: 'Assinatura',
    description: 'Campo para assinatura',
    icon: 'PenTool',
    category: 'media',
    defaultProperties: {
      borderWidth: 1,
      borderColor: '#000000',
      borderStyle: 'solid'
    },
    defaultSize: { width: 200, height: 80 }
  },

  // Data Components
  {
    type: 'table',
    name: 'Tabela',
    description: 'Tabela de dados',
    icon: 'Table',
    category: 'data',
    defaultProperties: {
      columns: [
        { id: 'col1', header: 'Coluna 1', width: 100 },
        { id: 'col2', header: 'Coluna 2', width: 100 }
      ],
      rows: [
        { id: 'row1', cells: { col1: 'Dados 1', col2: 'Dados 2' } }
      ]
    },
    defaultSize: { width: 300, height: 150 }
  },
  {
    type: 'chart',
    name: 'Gráfico',
    description: 'Gráfico de dados',
    icon: 'BarChart3',
    category: 'data',
    defaultProperties: {
      chartType: 'bar',
      chartData: [
        { name: 'Jan', value: 100 },
        { name: 'Fev', value: 200 },
        { name: 'Mar', value: 150 }
      ]
    },
    defaultSize: { width: 300, height: 200 }
  },

  // Interactive Components
  {
    type: 'button',
    name: 'Botão',
    description: 'Botão interativo',
    icon: 'MousePointer',
    category: 'interactive',
    defaultProperties: {
      buttonText: 'Clique aqui',
      buttonStyle: 'primary',
      backgroundColor: '#3b82f6',
      color: '#ffffff',
      borderRadius: 6,
      padding: { top: 8, right: 16, bottom: 8, left: 16 }
    },
    defaultSize: { width: 120, height: 40 }
  }
];

const CATEGORY_ICONS: Record<ComponentCategory, React.ComponentType<{ className?: string }>> = {
  layout: Layout,
  content: FileText,
  media: Camera,
  data: Database,
  interactive: Zap
};

const COMPONENT_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Type,
  Heading1,
  Image,
  Table,
  BarChart3,
  Minus,
  Square,
  Container,
  MousePointer,
  FileImage,
  PenTool
};

interface DraggableComponentProps {
  item: ComponentLibraryItem;
}

const DraggableComponent = React.memo(function DraggableComponent({ item }: DraggableComponentProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `library-${item.type}`,
    data: {
      componentType: item.type,
      isFromLibrary: true
    }
  });

  const IconComponent = COMPONENT_ICONS[item.icon] || Square;

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    opacity: isDragging ? 0.5 : 1
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 cursor-grab active:cursor-grabbing transition-colors group"
    >
      <div className="flex items-center space-x-3">
        <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-md flex items-center justify-center group-hover:bg-blue-100">
          <IconComponent className="h-4 w-4 text-gray-600 group-hover:text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {item.name}
          </p>
          <p className="text-xs text-gray-500 truncate">
            {item.description}
          </p>
        </div>
      </div>
    </div>
  );
});

export function ComponentLibrary() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ComponentCategory | 'all'>('all');

  const filteredComponents = useMemo(() => {
    return COMPONENT_LIBRARY.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, selectedCategory]);

  const componentsByCategory = useMemo(() => {
    return filteredComponents.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    }, {} as Record<ComponentCategory, ComponentLibraryItem[]>);
  }, [filteredComponents]);

  return (
    <div className="h-full flex flex-col">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Componentes</CardTitle>
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar componentes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden">
        <Tabs value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as ComponentCategory | 'all')}>
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="all" className="text-xs">Todos</TabsTrigger>
            <TabsTrigger value="layout" className="text-xs">Layout</TabsTrigger>
            <TabsTrigger value="content" className="text-xs">Conteúdo</TabsTrigger>
          </TabsList>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="media" className="text-xs">Mídia</TabsTrigger>
            <TabsTrigger value="data" className="text-xs">Dados</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[calc(100vh-300px)]">
            <TabsContent value="all" className="mt-0">
              <div className="space-y-4">
                {Object.entries(componentsByCategory).map(([category, items]) => {
                  const CategoryIcon = CATEGORY_ICONS[category as ComponentCategory];
                  return (
                    <div key={category}>
                      <div className="flex items-center space-x-2 mb-2">
                        <CategoryIcon className="h-4 w-4 text-gray-500" />
                        <h3 className="text-sm font-medium text-gray-700 capitalize">
                          {category === 'layout' ? 'Layout' :
                           category === 'content' ? 'Conteúdo' :
                           category === 'media' ? 'Mídia' :
                           category === 'data' ? 'Dados' :
                           category === 'interactive' ? 'Interativo' : category}
                        </h3>
                        <Badge variant="secondary" className="text-xs">
                          {items.length}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        {items.map((item) => (
                          <DraggableComponent key={item.type} item={item} />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </TabsContent>

            {(['layout', 'content', 'media', 'data', 'interactive'] as ComponentCategory[]).map((category) => (
              <TabsContent key={category} value={category} className="mt-0">
                <div className="space-y-2">
                  {(componentsByCategory[category] || []).map((item) => (
                    <DraggableComponent key={item.type} item={item} />
                  ))}
                </div>
              </TabsContent>
            ))}
          </ScrollArea>
        </Tabs>
      </CardContent>
    </div>
  );
}