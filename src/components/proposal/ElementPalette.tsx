import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Type,
  Image,
  Square,
  Circle,
  Triangle,
  BarChart3,
  Table,
  Video,
  MousePointer,
  Hand,
  ZoomIn,
  Palette,
  Layers,
  Settings,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
} from 'lucide-react';
import { useProposalEditor } from '../../hooks/useProposalEditor';
import { 
  Tool, 
  PaletteElement, 
  ElementType, 
  TextElement, 
  ImageElement, 
  ShapeElement,
  ELEMENT_DEFAULTS 
} from '../../types/proposal';
import { cn } from '../../utils/cn';

// =====================================================================================
// ELEMENTOS DA PALETA
// =====================================================================================

const PALETTE_ELEMENTS: PaletteElement[] = [
  {
    id: 'text',
    type: 'text',
    name: 'Texto',
    icon: 'Type',
    preview: 'Aa',
    category: 'basic',
    defaultProps: {
      type: 'text',
      transform: {
        position: { x: 100, y: 100 },
        size: { width: 200, height: 40 },
        rotation: 0,
        scale: 1,
      },
      zIndex: 1,
      visible: true,
      locked: false,
      opacity: 1,
      content: 'Novo texto',
      fontSize: ELEMENT_DEFAULTS.TEXT.fontSize,
      fontFamily: ELEMENT_DEFAULTS.TEXT.fontFamily,
      color: ELEMENT_DEFAULTS.TEXT.color,
      fontWeight: ELEMENT_DEFAULTS.TEXT.fontWeight,
      textAlign: ELEMENT_DEFAULTS.TEXT.textAlign,
      lineHeight: ELEMENT_DEFAULTS.TEXT.lineHeight,
      letterSpacing: ELEMENT_DEFAULTS.TEXT.letterSpacing,
      textDecoration: 'none',
    } as Partial<TextElement>,
  },
  {
    id: 'image',
    type: 'image',
    name: 'Imagem',
    icon: 'Image',
    preview: '🖼️',
    category: 'media',
    defaultProps: {
      type: 'image',
      transform: {
        position: { x: 100, y: 100 },
        size: { width: 300, height: 200 },
        rotation: 0,
        scale: 1,
      },
      zIndex: 1,
      visible: true,
      locked: false,
      opacity: 1,
      src: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=placeholder%20image%20solar%20panel&image_size=landscape_4_3',
      alt: 'Imagem',
      fit: ELEMENT_DEFAULTS.IMAGE.fit,
      borderRadius: ELEMENT_DEFAULTS.IMAGE.borderRadius,
    } as Partial<ImageElement>,
  },
  {
    id: 'rectangle',
    type: 'shape',
    name: 'Retângulo',
    icon: 'Square',
    preview: '▭',
    category: 'basic',
    defaultProps: {
      type: 'shape',
      transform: {
        position: { x: 100, y: 100 },
        size: { width: 200, height: 100 },
        rotation: 0,
        scale: 1,
      },
      zIndex: 1,
      visible: true,
      locked: false,
      opacity: 1,
      shapeType: 'rectangle',
      fill: ELEMENT_DEFAULTS.SHAPE.fill,
      stroke: ELEMENT_DEFAULTS.SHAPE.stroke,
    } as Partial<ShapeElement>,
  },
  {
    id: 'circle',
    type: 'shape',
    name: 'Círculo',
    icon: 'Circle',
    preview: '●',
    category: 'basic',
    defaultProps: {
      type: 'shape',
      transform: {
        position: { x: 100, y: 100 },
        size: { width: 150, height: 150 },
        rotation: 0,
        scale: 1,
      },
      zIndex: 1,
      visible: true,
      locked: false,
      opacity: 1,
      shapeType: 'circle',
      fill: '#10B981',
      stroke: { color: '#059669', width: 2, style: 'solid' },
    } as Partial<ShapeElement>,
  },
  {
    id: 'triangle',
    type: 'shape',
    name: 'Triângulo',
    icon: 'Triangle',
    preview: '▲',
    category: 'basic',
    defaultProps: {
      type: 'shape',
      transform: {
        position: { x: 100, y: 100 },
        size: { width: 150, height: 130 },
        rotation: 0,
        scale: 1,
      },
      zIndex: 1,
      visible: true,
      locked: false,
      opacity: 1,
      shapeType: 'triangle',
      fill: '#F59E0B',
      stroke: { color: '#D97706', width: 2, style: 'solid' },
    } as Partial<ShapeElement>,
  },
  {
    id: 'chart',
    type: 'chart',
    name: 'Gráfico',
    icon: 'BarChart3',
    preview: '📊',
    category: 'data',
    defaultProps: {
      type: 'chart',
      transform: {
        position: { x: 100, y: 100 },
        size: { width: 400, height: 300 },
        rotation: 0,
        scale: 1,
      },
      zIndex: 1,
      visible: true,
      locked: false,
      opacity: 1,
      chartType: 'bar',
      data: [
        { label: 'Jan', value: 100, color: '#3B82F6' },
        { label: 'Fev', value: 150, color: '#10B981' },
        { label: 'Mar', value: 120, color: '#F59E0B' },
        { label: 'Abr', value: 180, color: '#EF4444' },
      ],
      title: 'Gráfico de Exemplo',
      showLegend: true,
      showGrid: true,
      colors: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'],
    },
  },
  {
    id: 'table',
    type: 'table',
    name: 'Tabela',
    icon: 'Table',
    preview: '⊞',
    category: 'data',
    defaultProps: {
      type: 'table',
      transform: {
        position: { x: 100, y: 100 },
        size: { width: 400, height: 200 },
        rotation: 0,
        scale: 1,
      },
      zIndex: 1,
      visible: true,
      locked: false,
      opacity: 1,
      rows: 3,
      columns: 3,
      data: [
        ['Cabeçalho 1', 'Cabeçalho 2', 'Cabeçalho 3'],
        ['Linha 1, Col 1', 'Linha 1, Col 2', 'Linha 1, Col 3'],
        ['Linha 2, Col 1', 'Linha 2, Col 2', 'Linha 2, Col 3'],
      ],
      headerStyle: {
        backgroundColor: '#F3F4F6',
        textColor: '#1F2937',
        fontWeight: 'bold',
      },
      cellStyle: {
        borderColor: '#D1D5DB',
        borderWidth: 1,
        padding: 8,
      },
    },
  },
];

const TOOLS: Array<{ id: Tool; name: string; icon: React.ComponentType; description: string }> = [
  { id: 'select', name: 'Selecionar', icon: MousePointer, description: 'Selecionar e mover elementos' },
  { id: 'pan', name: 'Mover Canvas', icon: Hand, description: 'Mover a visualização do canvas' },
  { id: 'zoom', name: 'Zoom', icon: ZoomIn, description: 'Ferramenta de zoom' },
];

// =====================================================================================
// COMPONENTE DA PALETA
// =====================================================================================

interface ElementPaletteProps {
  className?: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const ElementPalette: React.FC<ElementPaletteProps> = ({
  className,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const { toolConfig, setActiveTool, addElement } = useProposalEditor();
  const [activeCategory, setActiveCategory] = useState<'tools' | 'basic' | 'media' | 'data'>('tools');
  const [searchTerm, setSearchTerm] = useState('');
  const [draggedElement, setDraggedElement] = useState<PaletteElement | null>(null);

  // =====================================================================================
  // HANDLERS
  // =====================================================================================

  const handleToolSelect = useCallback((tool: Tool) => {
    setActiveTool(tool);
  }, [setActiveTool]);

  const handleElementDragStart = useCallback((element: PaletteElement, e: React.DragEvent) => {
    setDraggedElement(element);
    e.dataTransfer.setData('application/json', JSON.stringify(element));
    e.dataTransfer.effectAllowed = 'copy';
  }, []);

  const handleElementClick = useCallback((element: PaletteElement) => {
    // Adicionar elemento diretamente no centro do canvas
    const elementData = {
      ...element.defaultProps,
      transform: {
        ...element.defaultProps.transform!,
        position: {
          x: Math.random() * 200 + 100, // Posição aleatória para evitar sobreposição
          y: Math.random() * 200 + 100,
        },
      },
    };
    
    addElement(elementData);
  }, [addElement]);

  // =====================================================================================
  // FILTROS E CATEGORIAS
  // =====================================================================================

  const filteredElements = PALETTE_ELEMENTS.filter(element => {
    const matchesCategory = activeCategory === 'tools' ? false : element.category === activeCategory;
    const matchesSearch = element.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const categories = [
    { id: 'tools' as const, name: 'Ferramentas', icon: MousePointer },
    { id: 'basic' as const, name: 'Básico', icon: Square },
    { id: 'media' as const, name: 'Mídia', icon: Image },
    { id: 'data' as const, name: 'Dados', icon: BarChart3 },
  ];

  // =====================================================================================
  // RENDERIZAÇÃO
  // =====================================================================================

  const renderIcon = (iconName: string, className: string = 'w-4 h-4') => {
    const icons: Record<string, React.ComponentType<{ className?: string }>> = {
      Type,
      Image,
      Square,
      Circle,
      Triangle,
      BarChart3,
      Table,
      Video,
    };
    
    const IconComponent = icons[iconName];
    return IconComponent ? <IconComponent className={className} /> : <Square className={className} />;
  };

  if (isCollapsed) {
    return (
      <div className={cn("w-12 bg-white border-r border-gray-200 flex flex-col", className)}>
        <button
          onClick={onToggleCollapse}
          className="p-3 hover:bg-gray-100 border-b border-gray-200"
          title="Expandir Paleta"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
        
        <div className="flex-1 flex flex-col items-center py-2 space-y-2">
          <Palette className="w-5 h-5 text-gray-400" />
          <Layers className="w-5 h-5 text-gray-400" />
          <Settings className="w-5 h-5 text-gray-400" />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("w-80 bg-white border-r border-gray-200 flex flex-col", className)}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900">Elementos</h3>
          <button
            onClick={onToggleCollapse}
            className="p-1 hover:bg-gray-100 rounded"
            title="Recolher Paleta"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar elementos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="border-b border-gray-200">
        <div className="flex">
          {categories.map((category) => {
            const IconComponent = category.icon;
            return (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={cn(
                  "flex-1 flex flex-col items-center py-3 px-2 text-xs font-medium transition-colors",
                  activeCategory === category.id
                    ? "bg-blue-50 text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-600 hover:bg-gray-50"
                )}
              >
                <IconComponent className="w-4 h-4 mb-1" />
                {category.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeCategory === 'tools' ? (
          /* Ferramentas */
          <div className="p-4 space-y-2">
            {TOOLS.map((tool) => {
              const IconComponent = tool.icon;
              return (
                <button
                  key={tool.id}
                  onClick={() => handleToolSelect(tool.id)}
                  className={cn(
                    "w-full flex items-center p-3 rounded-lg border transition-all",
                    toolConfig.activeTool === tool.id
                      ? "bg-blue-50 border-blue-200 text-blue-700"
                      : "bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  )}
                >
                  <IconComponent className="w-5 h-5 mr-3" />
                  <div className="text-left">
                    <div className="font-medium text-sm">{tool.name}</div>
                    <div className="text-xs text-gray-500">{tool.description}</div>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          /* Elementos */
          <div className="p-4">
            <div className="grid grid-cols-2 gap-3">
              {filteredElements.map((element) => (
                <motion.div
                  key={element.id}
                  className="group relative"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div
                    draggable
                    onDragStart={(e) => handleElementDragStart(element, e)}
                    onClick={() => handleElementClick(element)}
                    className="w-full aspect-square bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all group-hover:shadow-md"
                  >
                    <div className="text-2xl mb-2">
                      {element.preview.length === 1 ? (
                        <span>{element.preview}</span>
                      ) : (
                        renderIcon(element.icon, 'w-8 h-8 text-gray-600 group-hover:text-blue-600')
                      )}
                    </div>
                    <span className="text-xs font-medium text-gray-700 group-hover:text-blue-700">
                      {element.name}
                    </span>
                  </div>
                  
                  {/* Quick Add Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleElementClick(element);
                    }}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-blue-600"
                    title="Adicionar ao Canvas"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </motion.div>
              ))}
            </div>
            
            {filteredElements.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhum elemento encontrado</p>
                <p className="text-xs mt-1">Tente ajustar sua busca</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="text-xs text-gray-500 text-center">
          <p>💡 Dica: Arraste elementos para o canvas</p>
          <p className="mt-1">ou clique para adicionar</p>
        </div>
      </div>
    </div>
  );
};

export default ElementPalette;