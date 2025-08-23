/**
 * Paleta de Elementos para Editor Moderno
 * Componente drag-and-drop inspirado no DrawIO e MindMeister
 */

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  Square,
  Circle,
  Diamond,
  Triangle,
  Hexagon,
  Star,
  Heart,
  User,
  Users,
  Building,
  Lightbulb,
  Target,
  Zap,
  Search,
  Plus,
  Palette
} from 'lucide-react';

interface ElementDefinition {
  id: string;
  name: string;
  icon: React.ReactNode;
  category: string;
  nodeType: string;
  defaultData: any;
  description?: string;
  tags?: string[];
}

interface ElementPaletteProps {
  onElementDrag: (element: ElementDefinition) => void;
  diagramType: 'flowchart' | 'mindmap' | 'orgchart';
}

const ElementPalette: React.FC<ElementPaletteProps> = ({ onElementDrag, diagramType }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('basic');

  // Definições de elementos por tipo de diagrama
  const flowchartElements: ElementDefinition[] = [
    {
      id: 'process',
      name: 'Processo',
      icon: <Square className="w-4 h-4" />,
      category: 'basic',
      nodeType: 'flowchart',
      defaultData: {
        label: 'Processo',
        shape: 'rectangle',
        color: '#3b82f6'
      },
      description: 'Representa uma ação ou processo',
      tags: ['processo', 'ação', 'tarefa']
    },
    {
      id: 'decision',
      name: 'Decisão',
      icon: <Diamond className="w-4 h-4" />,
      category: 'basic',
      nodeType: 'flowchart',
      defaultData: {
        label: 'Decisão?',
        shape: 'diamond',
        color: '#f59e0b'
      },
      description: 'Ponto de decisão no fluxo',
      tags: ['decisão', 'escolha', 'condição']
    },
    {
      id: 'start-end',
      name: 'Início/Fim',
      icon: <Circle className="w-4 h-4" />,
      category: 'basic',
      nodeType: 'flowchart',
      defaultData: {
        label: 'Início',
        shape: 'ellipse',
        color: '#10b981'
      },
      description: 'Marca início ou fim do processo',
      tags: ['início', 'fim', 'terminal']
    },
    {
      id: 'data',
      name: 'Dados',
      icon: <Hexagon className="w-4 h-4" />,
      category: 'basic',
      nodeType: 'flowchart',
      defaultData: {
        label: 'Dados',
        shape: 'parallelogram',
        color: '#8b5cf6'
      },
      description: 'Entrada ou saída de dados',
      tags: ['dados', 'input', 'output']
    }
  ];

  const mindmapElements: ElementDefinition[] = [
    {
      id: 'central-topic',
      name: 'Tópico Central',
      icon: <Target className="w-4 h-4" />,
      category: 'basic',
      nodeType: 'mindmap',
      defaultData: {
        label: 'Ideia Principal',
        level: 0,
        color: '#3b82f6',
        emoji: '🎯'
      },
      description: 'Ideia central do mapa mental',
      tags: ['central', 'principal', 'core']
    },
    {
      id: 'main-branch',
      name: 'Ramo Principal',
      icon: <Lightbulb className="w-4 h-4" />,
      category: 'basic',
      nodeType: 'mindmap',
      defaultData: {
        label: 'Ramo',
        level: 1,
        color: '#10b981',
        emoji: '💡'
      },
      description: 'Ramo principal da ideia central',
      tags: ['ramo', 'branch', 'categoria']
    },
    {
      id: 'sub-topic',
      name: 'Subtópico',
      icon: <Star className="w-4 h-4" />,
      category: 'basic',
      nodeType: 'mindmap',
      defaultData: {
        label: 'Subtópico',
        level: 2,
        color: '#f59e0b',
        emoji: '⭐'
      },
      description: 'Subtópico ou detalhe',
      tags: ['subtópico', 'detalhe', 'sub']
    },
    {
      id: 'note',
      name: 'Nota',
      icon: <Heart className="w-4 h-4" />,
      category: 'basic',
      nodeType: 'mindmap',
      defaultData: {
        label: 'Nota',
        level: 3,
        color: '#ef4444',
        emoji: '📝'
      },
      description: 'Nota ou observação',
      tags: ['nota', 'observação', 'lembrete']
    }
  ];

  const orgchartElements: ElementDefinition[] = [
    {
      id: 'executive',
      name: 'Executivo',
      icon: <User className="w-4 h-4" />,
      category: 'basic',
      nodeType: 'orgchart',
      defaultData: {
        name: 'CEO',
        position: 'Chief Executive Officer',
        level: 0,
        color: '#3b82f6'
      },
      description: 'Cargo executivo (CEO, CTO, etc.)',
      tags: ['executivo', 'ceo', 'diretor']
    },
    {
      id: 'manager',
      name: 'Gerente',
      icon: <Users className="w-4 h-4" />,
      category: 'basic',
      nodeType: 'orgchart',
      defaultData: {
        name: 'Gerente',
        position: 'Gerente de Departamento',
        level: 1,
        color: '#10b981'
      },
      description: 'Cargo de gerência',
      tags: ['gerente', 'manager', 'supervisor']
    },
    {
      id: 'employee',
      name: 'Funcionário',
      icon: <Building className="w-4 h-4" />,
      category: 'basic',
      nodeType: 'orgchart',
      defaultData: {
        name: 'Funcionário',
        position: 'Analista',
        level: 2,
        color: '#f59e0b'
      },
      description: 'Funcionário padrão',
      tags: ['funcionário', 'analista', 'colaborador']
    }
  ];

  const getCurrentElements = () => {
    switch (diagramType) {
      case 'flowchart': return flowchartElements;
      case 'mindmap': return mindmapElements;
      case 'orgchart': return orgchartElements;
      default: return flowchartElements;
    }
  };

  const filteredElements = getCurrentElements().filter(element => {
    const matchesSearch = searchTerm === '' || 
      element.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      element.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      element.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || element.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const categories = [
    { id: 'all', name: 'Todos', icon: <Palette className="w-4 h-4" /> },
    { id: 'basic', name: 'Básicos', icon: <Square className="w-4 h-4" /> },
    { id: 'advanced', name: 'Avançados', icon: <Zap className="w-4 h-4" /> }
  ];

  const handleDragStart = (event: React.DragEvent, element: ElementDefinition) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify(element));
    event.dataTransfer.effectAllowed = 'move';
    onElementDrag(element);
  };

  return (
    <Card className="w-80 h-full flex flex-col bg-white shadow-lg">
      {/* Header */}
      <div className="p-4 border-b">
        <h3 className="font-semibold text-gray-900 mb-3">Elementos</h3>
        
        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Buscar elementos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        {/* Categories */}
        <div className="flex gap-1">
          {categories.map(category => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category.id)}
              className="flex items-center gap-1"
            >
              {category.icon}
              <span className="hidden sm:inline">{category.name}</span>
            </Button>
          ))}
        </div>
      </div>
      
      {/* Elements Grid */}
      <ScrollArea className="flex-1 p-4">
        <div className="grid grid-cols-2 gap-3">
          {filteredElements.map(element => (
            <div
              key={element.id}
              draggable
              onDragStart={(e) => handleDragStart(e, element)}
              className="group cursor-grab active:cursor-grabbing"
            >
              <Card className="p-3 hover:shadow-md transition-all duration-200 border-2 border-dashed border-transparent hover:border-blue-300 bg-gray-50 hover:bg-white">
                <div className="flex flex-col items-center text-center space-y-2">
                  <div className="p-2 rounded-lg bg-white shadow-sm group-hover:shadow-md transition-shadow">
                    {element.icon}
                  </div>
                  <div>
                    <div className="font-medium text-xs text-gray-900">
                      {element.name}
                    </div>
                    {element.description && (
                      <div className="text-xs text-gray-500 mt-1 leading-tight">
                        {element.description}
                      </div>
                    )}
                  </div>
                  {element.tags && element.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 justify-center">
                      {element.tags.slice(0, 2).map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs px-1 py-0">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            </div>
          ))}
        </div>
        
        {filteredElements.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhum elemento encontrado</p>
            <p className="text-xs mt-1">Tente ajustar sua busca</p>
          </div>
        )}
      </ScrollArea>
      
      {/* Footer */}
      <div className="p-4 border-t bg-gray-50">
        <div className="text-xs text-gray-600 text-center">
          Arraste os elementos para o canvas
        </div>
      </div>
    </Card>
  );
};

export default ElementPalette;
export { ElementPalette };
export type { ElementDefinition };