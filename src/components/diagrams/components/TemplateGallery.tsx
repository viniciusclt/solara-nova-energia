// ============================================================================
// Template Gallery - Galeria de Templates de Diagramas
// ============================================================================
// Componente para exibir, filtrar e selecionar templates de diagramas
// Integração com DiagramTemplateService
// ============================================================================

import React, { useState, useMemo, useCallback } from 'react';
import { 
  Search, 
  Filter, 
  Star, 
  Download, 
  Clock, 
  Tag, 
  Grid3X3, 
  List, 
  ChevronDown,
  Sparkles,
  TrendingUp,
  Brain,
  Workflow,
  Users,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { DiagramTemplate } from '../services/DiagramTemplateService';
import { DiagramType } from '../types';
import { useTemplates } from '../hooks/useTemplates';
import { TemplateCard } from './TemplateCard';

// ============================================================================
// INTERFACES
// ============================================================================

export interface TemplateGalleryProps {
  onTemplateSelect: (template: DiagramTemplate) => void;
  selectedType?: DiagramType;
  className?: string;
  showHeader?: boolean;
  showFilters?: boolean;
  maxItems?: number;
  layout?: 'grid' | 'list';
}

interface TemplateCardProps {
  template: DiagramTemplate;
  onSelect: (template: DiagramTemplate) => void;
  layout: 'grid' | 'list';
}

// ============================================================================
// COMPONENTES AUXILIARES
// ============================================================================



// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export const TemplateGallery: React.FC<TemplateGalleryProps> = ({
  onTemplateSelect,
  selectedType,
  className = '',
  showHeader = true,
  showFilters = true,
  maxItems,
  layout: initialLayout = 'grid'
}) => {
  // ============================================================================
  // HOOKS
  // ============================================================================
  
  const {
    filteredTemplates,
    featuredTemplates,
    popularTemplates,
    categories,
    allTags,
    filter,
    setFilter,
    clearFilters,
    isLoading
  } = useTemplates({ defaultType: selectedType });

  // ============================================================================
  // ESTADO
  // ============================================================================
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [layout, setLayout] = useState<'grid' | 'list'>(initialLayout);
  const [activeTab, setActiveTab] = useState<string>(selectedType || 'all');

  // ============================================================================
  // DADOS PROCESSADOS
  // ============================================================================
  
  const processedTemplates = useMemo(() => {
    let templates = filteredTemplates;
    
    if (maxItems) {
      templates = templates.slice(0, maxItems);
    }
    
    return templates;
  }, [filteredTemplates, maxItems]);

  // ============================================================================
  // HANDLERS
  // ============================================================================
  
  const handleTemplateSelect = useCallback((template: DiagramTemplate) => {
    onTemplateSelect(template);
  }, [onTemplateSelect]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    setFilter({ search: value || undefined });
  }, [setFilter]);

  const handleCategoryChange = useCallback((value: string) => {
    setSelectedCategory(value);
    setFilter({ category: value === 'all' ? undefined : value as any });
  }, [setFilter]);

  const handleDifficultyChange = useCallback((value: string) => {
    setSelectedDifficulty(value);
    setFilter({ difficulty: value === 'all' ? undefined : value as any });
  }, [setFilter]);

  const handleTagToggle = useCallback((tag: string) => {
    const newTags = selectedTags.includes(tag) 
      ? selectedTags.filter(t => t !== tag)
      : [...selectedTags, tag];
    
    setSelectedTags(newTags);
    setFilter({ tags: newTags.length > 0 ? newTags : undefined });
  }, [selectedTags, setFilter]);

  const handleClearFilters = useCallback(() => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedDifficulty('all');
    setSelectedTags([]);
    clearFilters();
  }, [clearFilters]);

  // ============================================================================
  // RENDER
  // ============================================================================
  
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      {showHeader && (
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Templates de Diagramas</h2>
            <p className="text-muted-foreground">
              Escolha um template para começar rapidamente
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant={layout === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setLayout('grid')}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={layout === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setLayout('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Filtros */}
      {showFilters && (
        <div className="space-y-4">
          {/* Barra de busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar templates..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filtros avançados */}
          <div className="flex flex-wrap items-center gap-4">
            <Select value={selectedCategory} onValueChange={handleCategoryChange}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedDifficulty} onValueChange={handleDifficultyChange}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Dificuldade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as dificuldades</SelectItem>
                <SelectItem value="beginner">Iniciante</SelectItem>
                <SelectItem value="intermediate">Intermediário</SelectItem>
                <SelectItem value="advanced">Avançado</SelectItem>
              </SelectContent>
            </Select>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Tag className="h-4 w-4 mr-2" />
                  Tags {selectedTags.length > 0 && `(${selectedTags.length})`}
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 max-h-64 overflow-y-auto">
                <DropdownMenuLabel>Filtrar por tags</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {allTags.map(tag => (
                  <DropdownMenuItem
                    key={tag}
                    onClick={() => handleTagToggle(tag)}
                    className="flex items-center justify-between"
                  >
                    <span>{tag}</span>
                    {selectedTags.includes(tag) && (
                      <Badge variant="secondary" className="text-xs">✓</Badge>
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {(searchTerm || selectedCategory !== 'all' || selectedDifficulty !== 'all' || selectedTags.length > 0) && (
              <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                <X className="h-4 w-4 mr-2" />
                Limpar filtros
              </Button>
            )}
          </div>

          {/* Tags selecionadas */}
          {selectedTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedTags.map(tag => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                  <button
                    onClick={() => handleTagToggle(tag)}
                    className="ml-2 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tabs por tipo */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="flowchart">Fluxogramas</TabsTrigger>
          <TabsTrigger value="mindmap">Mapas Mentais</TabsTrigger>
          <TabsTrigger value="organogram">Organogramas</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          {/* Templates em destaque */}
          {featuredTemplates.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Sparkles className="h-5 w-5 mr-2 text-yellow-500" />
                Em Destaque
              </h3>
              <div className={`grid gap-4 ${
                layout === 'grid' 
                  ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
                  : 'grid-cols-1'
              }`}>
                {featuredTemplates.map(template => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    layout={layout}
                    onClick={handleTemplateSelect}
                    showActions={true}
                    showMetadata={true}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Templates populares */}
          {popularTemplates.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-blue-500" />
                Populares
              </h3>
              <div className={`grid gap-4 ${
                layout === 'grid' 
                  ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
                  : 'grid-cols-1'
              }`}>
                {popularTemplates.map(template => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    layout={layout}
                    onClick={handleTemplateSelect}
                    showActions={true}
                    showMetadata={true}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Todos os templates */}
          <div>
            <h3 className="text-lg font-semibold mb-4">
              Todos os Templates ({processedTemplates.length})
            </h3>
            {processedTemplates.length > 0 ? (
              <div className={`grid gap-4 ${
                layout === 'grid' 
                  ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
                  : 'grid-cols-1'
              }`}>
                {processedTemplates.map(template => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    layout={layout}
                    onClick={handleTemplateSelect}
                    showActions={true}
                    showMetadata={true}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Filter className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum template encontrado</h3>
                <p className="text-muted-foreground mb-4">
                  Tente ajustar os filtros ou buscar por outros termos.
                </p>
                <Button variant="outline" onClick={handleClearFilters}>
                  Limpar filtros
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Tabs específicas por tipo */}
        {(['flowchart', 'mindmap', 'organogram'] as DiagramType[]).map(type => (
          <TabsContent key={type} value={type}>
            <div className={`grid gap-4 ${
              layout === 'grid' 
                ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
                : 'grid-cols-1'
            }`}>
              {processedTemplates.map(template => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  layout={layout}
                  onClick={handleTemplateSelect}
                  showActions={true}
                  showMetadata={true}
                />
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default TemplateGallery;