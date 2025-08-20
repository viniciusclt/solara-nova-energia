import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  Grid,
  List,
  Download,
  Eye,
  Star,
  StarOff,
  Tag,
  Calendar,
  User,
  Trash2,
  Edit,
  Copy,
  Share2,
  Plus,
  X,
  ChevronDown,
  SortAsc,
  SortDesc,
  FileText,
  Image,
  Presentation,
  Layers,
} from 'lucide-react';
import { useProposalEditor } from '../../hooks/useProposalEditor';
import { Template, TemplateCategory } from '../../types/proposal';
import { cn } from '../../utils/cn';
import { toast } from 'sonner';

// =====================================================================================
// INTERFACES
// =====================================================================================

interface TemplateLibraryProps {
  className?: string;
  onTemplateSelect?: (template: Template) => void;
  onTemplateLoad?: (elements: ProposalElement[]) => void;
  showFavorites?: boolean;
  allowManagement?: boolean;
}

interface TemplateFilters {
  category: TemplateCategory | 'all';
  search: string;
  tags: string[];
  favorites: boolean;
  sortBy: 'name' | 'date' | 'usage' | 'rating';
  sortOrder: 'asc' | 'desc';
}

// =====================================================================================
// DADOS MOCK
// =====================================================================================

const mockTemplates: Template[] = [
  {
    id: 'template_1',
    name: 'Proposta Solar Residencial',
    description: 'Template completo para propostas de energia solar residencial',
    category: 'solar',
    thumbnail: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=solar%20panels%20on%20house%20roof%20professional%20presentation%20template&image_size=landscape_4_3',
    preview: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=solar%20energy%20proposal%20presentation%20slides%20professional%20layout&image_size=landscape_16_9',
    elements: [],
    tags: ['solar', 'residencial', 'economia', 'sustentabilidade'],
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-16T14:30:00Z',
    author: 'Sistema',
    version: '1.0',
    downloads: 245,
    rating: 4.8,
    isFavorite: true,
    isPublic: true,
  },
  {
    id: 'template_2',
    name: 'Apresentação Comercial',
    description: 'Template para apresentações comerciais e vendas',
    category: 'business',
    thumbnail: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=business%20presentation%20template%20professional%20corporate%20design&image_size=landscape_4_3',
    preview: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=corporate%20business%20presentation%20slides%20modern%20design&image_size=landscape_16_9',
    elements: [],
    tags: ['negócios', 'vendas', 'corporativo', 'apresentação'],
    createdAt: '2024-01-10T09:00:00Z',
    updatedAt: '2024-01-12T16:45:00Z',
    author: 'João Silva',
    version: '2.1',
    downloads: 189,
    rating: 4.6,
    isFavorite: false,
    isPublic: true,
  },
  {
    id: 'template_3',
    name: 'Relatório Técnico',
    description: 'Template para relatórios técnicos e documentação',
    category: 'technical',
    thumbnail: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=technical%20report%20document%20template%20engineering%20professional&image_size=landscape_4_3',
    preview: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=technical%20documentation%20report%20layout%20engineering%20charts&image_size=landscape_16_9',
    elements: [],
    tags: ['técnico', 'relatório', 'documentação', 'engenharia'],
    createdAt: '2024-01-08T14:20:00Z',
    updatedAt: '2024-01-09T11:15:00Z',
    author: 'Maria Santos',
    version: '1.5',
    downloads: 156,
    rating: 4.9,
    isFavorite: true,
    isPublic: true,
  },
  {
    id: 'template_4',
    name: 'Proposta de Marketing',
    description: 'Template para propostas de marketing e publicidade',
    category: 'marketing',
    thumbnail: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=marketing%20proposal%20template%20creative%20advertising%20design&image_size=landscape_4_3',
    preview: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=marketing%20advertising%20proposal%20presentation%20creative%20layout&image_size=landscape_16_9',
    elements: [],
    tags: ['marketing', 'publicidade', 'criativo', 'estratégia'],
    createdAt: '2024-01-05T16:30:00Z',
    updatedAt: '2024-01-07T13:20:00Z',
    author: 'Pedro Costa',
    version: '1.2',
    downloads: 203,
    rating: 4.4,
    isFavorite: false,
    isPublic: true,
  },
  {
    id: 'template_5',
    name: 'Projeto Educacional',
    description: 'Template para projetos e apresentações educacionais',
    category: 'education',
    thumbnail: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=educational%20project%20template%20school%20learning%20presentation&image_size=landscape_4_3',
    preview: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=education%20learning%20presentation%20slides%20academic%20layout&image_size=landscape_16_9',
    elements: [],
    tags: ['educação', 'ensino', 'projeto', 'acadêmico'],
    createdAt: '2024-01-03T10:45:00Z',
    updatedAt: '2024-01-04T15:30:00Z',
    author: 'Ana Oliveira',
    version: '1.0',
    downloads: 134,
    rating: 4.7,
    isFavorite: false,
    isPublic: true,
  },
];

const categories: Array<{ value: TemplateCategory | 'all'; label: string; icon: React.ComponentType }> = [
  { value: 'all', label: 'Todos', icon: Grid },
  { value: 'solar', label: 'Solar', icon: FileText },
  { value: 'business', label: 'Negócios', icon: Presentation },
  { value: 'technical', label: 'Técnico', icon: FileText },
  { value: 'marketing', label: 'Marketing', icon: Image },
  { value: 'education', label: 'Educação', icon: FileText },
];

// =====================================================================================
// COMPONENTE PRINCIPAL
// =====================================================================================

export const TemplateLibrary: React.FC<TemplateLibraryProps> = ({
  className,
  onTemplateSelect,
  onTemplateLoad,
  showFavorites = true,
  allowManagement = false,
}) => {
  const { addElements } = useProposalEditor();

  // =====================================================================================
  // ESTADO
  // =====================================================================================

  const [templates, setTemplates] = useState<Template[]>(mockTemplates);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [filters, setFilters] = useState<TemplateFilters>({
    category: 'all',
    search: '',
    tags: [],
    favorites: false,
    sortBy: 'date',
    sortOrder: 'desc',
  });

  // =====================================================================================
  // FILTROS E ORDENAÇÃO
  // =====================================================================================

  const filteredTemplates = useMemo(() => {
    let filtered = [...templates];

    // Filtro por categoria
    if (filters.category !== 'all') {
      filtered = filtered.filter(t => t.category === filters.category);
    }

    // Filtro por busca
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(t => 
        t.name.toLowerCase().includes(searchLower) ||
        t.description.toLowerCase().includes(searchLower) ||
        t.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    // Filtro por tags
    if (filters.tags.length > 0) {
      filtered = filtered.filter(t => 
        filters.tags.every(tag => t.tags.includes(tag))
      );
    }

    // Filtro por favoritos
    if (filters.favorites) {
      filtered = filtered.filter(t => t.isFavorite);
    }

    // Ordenação
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (filters.sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'date':
          comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
          break;
        case 'usage':
          comparison = a.downloads - b.downloads;
          break;
        case 'rating':
          comparison = a.rating - b.rating;
          break;
      }
      
      return filters.sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [templates, filters]);

  // Obter todas as tags únicas
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    templates.forEach(template => {
      template.tags.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [templates]);

  // =====================================================================================
  // HANDLERS
  // =====================================================================================

  const handleTemplateSelect = useCallback((template: Template) => {
    setSelectedTemplate(template);
    onTemplateSelect?.(template);
  }, [onTemplateSelect]);

  const handleTemplateLoad = useCallback(async (template: Template) => {
    setLoading(true);
    try {
      // Simular carregamento do template
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Em uma implementação real, os elementos viriam do template
      const elements = [
        {
          id: `template_element_${Date.now()}_1`,
          type: 'text',
          content: `Elementos do template: ${template.name}`,
          fontSize: 24,
          fontFamily: 'Inter',
          fontWeight: 'bold',
          color: '#1f2937',
          textAlign: 'center',
          textDecoration: 'none',
          transform: {
            position: { x: 200, y: 100 },
            size: { width: 800, height: 60 },
            rotation: 0,
            scale: 1,
          },
          opacity: 1,
          visible: true,
          locked: false,
          zIndex: 1,
        },
      ];
      
      addElements(elements);
      onTemplateLoad?.(elements);
      
      // Atualizar contador de downloads
      setTemplates(prev => prev.map(t => 
        t.id === template.id 
          ? { ...t, downloads: t.downloads + 1 }
          : t
      ));
      
      toast.success(`Template "${template.name}" carregado com sucesso!`);
    } catch (error) {
      console.error('Erro ao carregar template:', error);
      toast.error('Erro ao carregar o template');
    } finally {
      setLoading(false);
    }
  }, [addElements, onTemplateLoad]);

  const toggleFavorite = useCallback((templateId: string) => {
    setTemplates(prev => prev.map(t => 
      t.id === templateId 
        ? { ...t, isFavorite: !t.isFavorite }
        : t
    ));
  }, []);

  const updateFilters = useCallback((updates: Partial<TemplateFilters>) => {
    setFilters(prev => ({ ...prev, ...updates }));
  }, []);

  // =====================================================================================
  // COMPONENTES
  // =====================================================================================

  const FilterPanel = () => (
    <AnimatePresence>
      {showFilters && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="border-b border-gray-200 bg-gray-50 p-4 space-y-4"
        >
          {/* Categorias */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categoria
            </label>
            <div className="flex flex-wrap gap-2">
              {categories.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => updateFilters({ category: value })}
                  className={cn(
                    "flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    filters.category === value
                      ? "bg-blue-100 text-blue-700 border border-blue-300"
                      : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags
            </label>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => {
                    const newTags = filters.tags.includes(tag)
                      ? filters.tags.filter(t => t !== tag)
                      : [...filters.tags, tag];
                    updateFilters({ tags: newTags });
                  }}
                  className={cn(
                    "flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium transition-colors",
                    filters.tags.includes(tag)
                      ? "bg-blue-100 text-blue-700"
                      : "bg-white text-gray-600 hover:bg-gray-100"
                  )}
                >
                  <Tag className="w-3 h-3" />
                  <span>{tag}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Ordenação */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ordenar por
              </label>
              <select
                value={filters.sortBy}
                onChange={(e) => updateFilters({ sortBy: e.target.value as 'date' | 'name' | 'usage' | 'rating' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="date">Data</option>
                <option value="name">Nome</option>
                <option value="usage">Downloads</option>
                <option value="rating">Avaliação</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ordem
              </label>
              <select
                value={filters.sortOrder}
                onChange={(e) => updateFilters({ sortOrder: e.target.value as 'asc' | 'desc' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="desc">Decrescente</option>
                <option value="asc">Crescente</option>
              </select>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const TemplateCard: React.FC<{ template: Template }> = ({ template }) => (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer group"
      onClick={() => handleTemplateSelect(template)}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-gray-100">
        <img
          src={template.thumbnail}
          alt={template.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          loading="lazy"
        />
        
        {/* Overlay com ações */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedTemplate(template);
                setShowPreview(true);
              }}
              className="p-2 bg-white text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
              title="Visualizar"
            >
              <Eye className="w-4 h-4" />
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleTemplateLoad(template);
              }}
              disabled={loading}
              className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 transition-colors"
              title="Usar template"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Favorito */}
        {showFavorites && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(template.id);
            }}
            className="absolute top-2 right-2 p-1 bg-white bg-opacity-80 rounded-full hover:bg-opacity-100 transition-all"
            title={template.isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
          >
            {template.isFavorite ? (
              <Star className="w-4 h-4 text-yellow-500 fill-current" />
            ) : (
              <StarOff className="w-4 h-4 text-gray-400" />
            )}
          </button>
        )}
      </div>

      {/* Conteúdo */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-gray-900 truncate flex-1">
            {template.name}
          </h3>
          
          <div className="flex items-center space-x-1 text-xs text-gray-500 ml-2">
            <Star className="w-3 h-3 text-yellow-500 fill-current" />
            <span>{template.rating}</span>
          </div>
        </div>
        
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {template.description}
        </p>
        
        {/* Tags */}
        <div className="flex flex-wrap gap-1 mb-3">
          {template.tags.slice(0, 3).map(tag => (
            <span
              key={tag}
              className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
            >
              {tag}
            </span>
          ))}
          {template.tags.length > 3 && (
            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
              +{template.tags.length - 3}
            </span>
          )}
        </div>
        
        {/* Metadados */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-1">
            <User className="w-3 h-3" />
            <span>{template.author}</span>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1">
              <Download className="w-3 h-3" />
              <span>{template.downloads}</span>
            </div>
            
            <div className="flex items-center space-x-1">
              <Calendar className="w-3 h-3" />
              <span>{new Date(template.updatedAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );

  const TemplateListItem: React.FC<{ template: Template }> = ({ template }) => (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200 cursor-pointer"
      onClick={() => handleTemplateSelect(template)}
    >
      <div className="flex items-center space-x-4">
        {/* Thumbnail */}
        <div className="w-20 h-12 bg-gray-100 rounded overflow-hidden flex-shrink-0">
          <img
            src={template.thumbnail}
            alt={template.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
        
        {/* Conteúdo */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-semibold text-gray-900 truncate">
              {template.name}
            </h3>
            
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1 text-xs text-gray-500">
                <Star className="w-3 h-3 text-yellow-500 fill-current" />
                <span>{template.rating}</span>
              </div>
              
              {showFavorites && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(template.id);
                  }}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                >
                  {template.isFavorite ? (
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  ) : (
                    <StarOff className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              )}
            </div>
          </div>
          
          <p className="text-sm text-gray-600 mb-2 line-clamp-1">
            {template.description}
          </p>
          
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap gap-1">
              {template.tags.slice(0, 2).map(tag => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
            
            <div className="flex items-center space-x-4 text-xs text-gray-500">
              <span>{template.author}</span>
              <span>{template.downloads} downloads</span>
              <span>{new Date(template.updatedAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
        
        {/* Ações */}
        <div className="flex items-center space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedTemplate(template);
              setShowPreview(true);
            }}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
            title="Visualizar"
          >
            <Eye className="w-4 h-4" />
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleTemplateLoad(template);
            }}
            disabled={loading}
            className="p-2 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 rounded transition-colors"
            title="Usar template"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );

  // =====================================================================================
  // RENDER
  // =====================================================================================

  return (
    <div className={cn("bg-white border border-gray-200 rounded-lg overflow-hidden", className)}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Layers className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Biblioteca de Templates</h2>
            <span className="text-sm text-gray-500">
              ({filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''})
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Filtros */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                showFilters
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-700 hover:bg-gray-100"
              )}
            >
              <Filter className="w-4 h-4" />
              <span>Filtros</span>
              <ChevronDown className={cn(
                "w-4 h-4 transition-transform",
                showFilters && "rotate-180"
              )} />
            </button>
            
            {/* Favoritos */}
            {showFavorites && (
              <button
                onClick={() => updateFilters({ favorites: !filters.favorites })}
                className={cn(
                  "flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  filters.favorites
                    ? "bg-yellow-100 text-yellow-700"
                    : "text-gray-700 hover:bg-gray-100"
                )}
              >
                <Star className="w-4 h-4" />
                <span>Favoritos</span>
              </button>
            )}
            
            {/* Modo de visualização */}
            <div className="flex items-center border border-gray-300 rounded-lg">
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  "p-2 transition-colors",
                  viewMode === 'grid'
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100"
                )}
                title="Visualização em grade"
              >
                <Grid className="w-4 h-4" />
              </button>
              
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  "p-2 transition-colors",
                  viewMode === 'list'
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100"
                )}
                title="Visualização em lista"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
        
        {/* Busca */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar templates..."
            value={filters.search}
            onChange={(e) => updateFilters({ search: e.target.value })}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Filtros */}
      <FilterPanel />

      {/* Conteúdo */}
      <div className="p-4">
        {filteredTemplates.length > 0 ? (
          <AnimatePresence mode="wait">
            {viewMode === 'grid' ? (
              <motion.div
                key="grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
              >
                {filteredTemplates.map(template => (
                  <TemplateCard key={template.id} template={template} />
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-3"
              >
                {filteredTemplates.map(template => (
                  <TemplateListItem key={template.id} template={template} />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        ) : (
          <div className="text-center py-12">
            <Layers className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum template encontrado
            </h3>
            <p className="text-gray-600 mb-4">
              Tente ajustar os filtros ou buscar por outros termos.
            </p>
            <button
              onClick={() => setFilters({
                category: 'all',
                search: '',
                tags: [],
                favorites: false,
                sortBy: 'date',
                sortOrder: 'desc',
              })}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Limpar Filtros
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TemplateLibrary;