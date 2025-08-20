import React, { useState } from 'react';
import { useDrag } from 'react-dnd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Type,
  Image,
  Table,
  BarChart3,
  Square,
  Circle,
  Triangle,
  Star,
  Heart,
  Zap,
  Leaf,
  Shield,
  Award,
  TrendingUp,
  DollarSign,
  Clock,
  MapPin,
  Phone,
  Mail,
  Globe,
  QrCode,
  Signature,
  Video,
  Music,
  FileText,
  Search
} from 'lucide-react';
import { ElementType } from '@/types/proposal';
import { cn } from '@/lib/utils';

interface ElementItem {
  type: ElementType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  category: string;
  description: string;
  tags: string[];
}

interface DraggableElementProps {
  element: ElementItem;
  onDoubleClick?: (type: ElementType) => void;
}

const DraggableElement: React.FC<DraggableElementProps> = ({ element, onDoubleClick }) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'ELEMENT',
    item: { type: element.type },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  });

  const Icon = element.icon;

  return (
    <div
      ref={drag}
      className={cn(
        "p-3 border border-gray-200 rounded-lg cursor-grab hover:border-blue-300 hover:bg-blue-50 transition-colors",
        "flex flex-col items-center gap-2 text-center",
        isDragging && "opacity-50"
      )}
      onDoubleClick={() => onDoubleClick?.(element.type)}
      title={element.description}
    >
      <Icon className="w-6 h-6 text-gray-600" />
      <span className="text-xs font-medium text-gray-700">{element.label}</span>
    </div>
  );
};

interface ElementToolboxProps {
  onElementAdd?: (type: ElementType) => void;
  className?: string;
}

const ELEMENT_LIBRARY: ElementItem[] = [
  // Text Elements
  {
    type: 'text',
    label: 'Texto',
    icon: Type,
    category: 'text',
    description: 'Adicionar bloco de texto editável',
    tags: ['texto', 'paragrafo', 'conteudo']
  },
  
  // Media Elements
  {
    type: 'image',
    label: 'Imagem',
    icon: Image,
    category: 'media',
    description: 'Inserir imagem ou foto',
    tags: ['imagem', 'foto', 'visual']
  },
  {
    type: 'video',
    label: 'Vídeo',
    icon: Video,
    category: 'media',
    description: 'Incorporar vídeo',
    tags: ['video', 'multimedia']
  },
  {
    type: 'audio',
    label: 'Áudio',
    icon: Music,
    category: 'media',
    description: 'Adicionar arquivo de áudio',
    tags: ['audio', 'som', 'musica']
  },
  
  // Data Elements
  {
    type: 'table',
    label: 'Tabela',
    icon: Table,
    category: 'data',
    description: 'Criar tabela de dados',
    tags: ['tabela', 'dados', 'planilha']
  },
  {
    type: 'chart',
    label: 'Gráfico',
    icon: BarChart3,
    category: 'data',
    description: 'Inserir gráfico ou chart',
    tags: ['grafico', 'chart', 'dados']
  },
  
  // Shapes
  {
    type: 'shape',
    label: 'Retângulo',
    icon: Square,
    category: 'shapes',
    description: 'Forma retangular',
    tags: ['forma', 'retangulo', 'quadrado']
  },
  {
    type: 'shape',
    label: 'Círculo',
    icon: Circle,
    category: 'shapes',
    description: 'Forma circular',
    tags: ['forma', 'circulo', 'redondo']
  },
  {
    type: 'shape',
    label: 'Triângulo',
    icon: Triangle,
    category: 'shapes',
    description: 'Forma triangular',
    tags: ['forma', 'triangulo']
  },
  {
    type: 'shape',
    label: 'Estrela',
    icon: Star,
    category: 'shapes',
    description: 'Forma de estrela',
    tags: ['forma', 'estrela']
  },
  
  // Business Elements
  {
    type: 'logo',
    label: 'Logo',
    icon: Award,
    category: 'business',
    description: 'Logo da empresa',
    tags: ['logo', 'marca', 'empresa']
  },
  {
    type: 'signature',
    label: 'Assinatura',
    icon: Signature,
    category: 'business',
    description: 'Campo de assinatura',
    tags: ['assinatura', 'documento']
  },
  {
    type: 'qrcode',
    label: 'QR Code',
    icon: QrCode,
    category: 'business',
    description: 'Código QR',
    tags: ['qr', 'codigo', 'link']
  },
  {
    type: 'barcode',
    label: 'Código de Barras',
    icon: FileText,
    category: 'business',
    description: 'Código de barras',
    tags: ['codigo', 'barras']
  },
  
  // Embed
  {
    type: 'embed',
    label: 'Incorporar',
    icon: Globe,
    category: 'embed',
    description: 'Incorporar conteúdo externo',
    tags: ['embed', 'iframe', 'externo']
  }
];

const CATEGORIES = [
  { id: 'all', label: 'Todos', icon: null },
  { id: 'text', label: 'Texto', icon: Type },
  { id: 'media', label: 'Mídia', icon: Image },
  { id: 'data', label: 'Dados', icon: Table },
  { id: 'shapes', label: 'Formas', icon: Square },
  { id: 'business', label: 'Negócios', icon: Award },
  { id: 'embed', label: 'Incorporar', icon: Globe }
];

const ElementToolbox: React.FC<ElementToolboxProps> = ({ onElementAdd, className }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredElements = ELEMENT_LIBRARY.filter(element => {
    const matchesSearch = searchTerm === '' || 
      element.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      element.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || element.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const handleElementDoubleClick = (type: ElementType) => {
    onElementAdd?.(type);
  };

  return (
    <Card className={cn("w-80 h-full flex flex-col", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Elementos</CardTitle>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Buscar elementos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0">
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="flex-1 flex flex-col">
          {/* Category Tabs */}
          <div className="px-4 pb-3">
            <TabsList className="grid grid-cols-4 gap-1 h-auto p-1">
              {CATEGORIES.slice(0, 4).map(category => {
                const Icon = category.icon;
                return (
                  <TabsTrigger
                    key={category.id}
                    value={category.id}
                    className="flex flex-col gap-1 h-auto py-2 text-xs"
                  >
                    {Icon && <Icon className="w-4 h-4" />}
                    <span>{category.label}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
            
            <TabsList className="grid grid-cols-3 gap-1 h-auto p-1 mt-1">
              {CATEGORIES.slice(4).map(category => {
                const Icon = category.icon;
                return (
                  <TabsTrigger
                    key={category.id}
                    value={category.id}
                    className="flex flex-col gap-1 h-auto py-2 text-xs"
                  >
                    {Icon && <Icon className="w-4 h-4" />}
                    <span>{category.label}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>
          
          {/* Elements Grid */}
          <div className="flex-1 px-4 pb-4">
            <ScrollArea className="h-full">
              <div className="grid grid-cols-2 gap-3">
                {filteredElements.map((element, index) => (
                  <DraggableElement
                    key={`${element.type}-${index}`}
                    element={element}
                    onDoubleClick={handleElementDoubleClick}
                  />
                ))}
              </div>
              
              {filteredElements.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhum elemento encontrado</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Tente ajustar sua busca ou categoria
                  </p>
                </div>
              )}
            </ScrollArea>
          </div>
        </Tabs>
        
        {/* Usage Hint */}
        <div className="px-4 py-3 bg-gray-50 border-t">
          <p className="text-xs text-gray-600 text-center">
            <strong>Dica:</strong> Arraste elementos para o canvas ou clique duas vezes para adicionar
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ElementToolbox;