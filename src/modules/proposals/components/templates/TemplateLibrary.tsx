import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Grid, 
  List, 
  Download, 
  Eye, 
  Edit, 
  Trash2, 
  Star, 
  Clock, 
  User, 
  Tag,
  FileText,
  MoreVertical,
  Plus
} from 'lucide-react';
import { Button } from '../../../../shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../shared/ui/card';
import { Input } from '../../../../shared/ui/input';
import { Badge } from '../../../../shared/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../shared/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../../shared/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../../../shared/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../../../shared/ui/dialog';
import { Checkbox } from '../../../../shared/ui/checkbox';
import { Separator } from '../../../../shared/ui/separator';
import { 
  Template, 
  TemplateCategory, 
  TemplateFilter, 
  TemplateSearchResult,
  SupportedFileFormat
} from '../../types/template';
import { logInfo } from '../../../../core/utils/logger';

interface TemplateLibraryProps {
  onSelectTemplate?: (template: Template) => void;
  onEditTemplate?: (template: Template) => void;
  onDeleteTemplate?: (templateId: string) => void;
  onCreateNew?: () => void;
  showActions?: boolean;
  selectionMode?: 'single' | 'multiple' | 'none';
  selectedTemplates?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
  className?: string;
}

type ViewMode = 'grid' | 'list';
type SortBy = 'name' | 'created' | 'updated' | 'usage' | 'category';
type SortOrder = 'asc' | 'desc';

const TEMPLATE_CATEGORIES: Record<TemplateCategory, { label: string; icon: string; color: string }> = {
  commercial: { label: 'Comercial', icon: '💼', color: 'bg-blue-100 text-blue-800' },
  technical: { label: 'Técnico', icon: '⚙️', color: 'bg-green-100 text-green-800' },
  financial: { label: 'Financeiro', icon: '💰', color: 'bg-yellow-100 text-yellow-800' },
  presentation: { label: 'Apresentação', icon: '📊', color: 'bg-purple-100 text-purple-800' },
  report: { label: 'Relatório', icon: '📋', color: 'bg-orange-100 text-orange-800' },
  custom: { label: 'Personalizado', icon: '🎨', color: 'bg-gray-100 text-gray-800' }
};

const FORMAT_ICONS: Record<SupportedFileFormat, string> = {
  doc: '📄',
  docx: '📄',
  pdf: '📕',
  ppt: '📊',
  pptx: '📊',
  xls: '📈',
  xlsx: '📈'
};

// Mock data - em produção viria de uma API
const mockTemplates: Template[] = [
  {
    id: '1',
    metadata: {
      id: '1',
      name: 'Proposta Comercial Solar',
      description: 'Template completo para propostas de sistemas fotovoltaicos residenciais',
      category: 'commercial',
      originalFormat: 'docx',
      fileSize: 2048000,
      uploadedAt: new Date('2024-01-15'),
      uploadedBy: 'João Silva',
      tags: ['solar', 'residencial', 'proposta'],
      usageCount: 45,
      isPublic: true,
      thumbnailUrl: '/api/templates/1/thumbnail'
    },
    structure: {} as Record<string, unknown>,
    proposalElements: [],
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-20')
  },
  {
    id: '2',
    metadata: {
      id: '2',
      name: 'Relatório Técnico',
      description: 'Template para relatórios de análise técnica e viabilidade',
      category: 'technical',
      originalFormat: 'pdf',
      fileSize: 1536000,
      uploadedAt: new Date('2024-01-10'),
      uploadedBy: 'Maria Santos',
      tags: ['técnico', 'análise', 'viabilidade'],
      usageCount: 23,
      isPublic: true,
      thumbnailUrl: '/api/templates/2/thumbnail'
    },
    structure: {} as Record<string, unknown>,
    proposalElements: [],
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-18')
  },
  {
    id: '3',
    metadata: {
      id: '3',
      name: 'Apresentação Executiva',
      description: 'Template para apresentações executivas e pitch de vendas',
      category: 'presentation',
      originalFormat: 'pptx',
      fileSize: 3072000,
      uploadedAt: new Date('2024-01-05'),
      uploadedBy: 'Carlos Oliveira',
      tags: ['apresentação', 'vendas', 'executivo'],
      usageCount: 67,
      isPublic: false,
      thumbnailUrl: '/api/templates/3/thumbnail'
    },
    structure: {} as Record<string, unknown>,
    proposalElements: [],
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-22')
  }
];

export const TemplateLibrary: React.FC<TemplateLibraryProps> = ({
  onSelectTemplate,
  onEditTemplate,
  onDeleteTemplate,
  onCreateNew,
  showActions = true,
  selectionMode = 'none',
  selectedTemplates = [],
  onSelectionChange,
  className
}) => {
  const [templates, setTemplates] = useState<Template[]>(mockTemplates);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('updated');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | 'all'>('all');
  const [selectedFormat, setSelectedFormat] = useState<SupportedFileFormat | 'all'>('all');
  const [showPublicOnly, setShowPublicOnly] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);

  // Filtrar e ordenar templates
  const filteredAndSortedTemplates = useMemo(() => {
    const filtered = templates.filter(template => {
      // Filtro de busca
      const matchesSearch = !searchQuery || 
        template.metadata.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.metadata.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (template.metadata.tags && template.metadata.tags.some(tag => tag?.toLowerCase().includes(searchQuery.toLowerCase())));

      // Filtro de categoria
      const matchesCategory = selectedCategory === 'all' || template.metadata.category === selectedCategory;

      // Filtro de formato
      const matchesFormat = selectedFormat === 'all' || template.metadata.originalFormat === selectedFormat;

      // Filtro público
      const matchesPublic = !showPublicOnly || template.metadata.isPublic;

      return matchesSearch && matchesCategory && matchesFormat && matchesPublic;
    });

    // Ordenação
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'name':
          comparison = a.metadata.name.localeCompare(b.metadata.name);
          break;
        case 'created':
          comparison = a.createdAt.getTime() - b.createdAt.getTime();
          break;
        case 'updated':
          comparison = a.updatedAt.getTime() - b.updatedAt.getTime();
          break;
        case 'usage':
          comparison = a.metadata.usageCount - b.metadata.usageCount;
          break;
        case 'category':
          comparison = a.metadata.category.localeCompare(b.metadata.category);
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [templates, searchQuery, selectedCategory, selectedFormat, showPublicOnly, sortBy, sortOrder]);

  const handleTemplateSelect = useCallback((template: Template) => {
    if (selectionMode === 'none') {
      onSelectTemplate?.(template);
      return;
    }

    if (selectionMode === 'single') {
      onSelectionChange?.([template.id]);
    } else if (selectionMode === 'multiple') {
      const isSelected = selectedTemplates.includes(template.id);
      if (isSelected) {
        onSelectionChange?.(selectedTemplates.filter(id => id !== template.id));
      } else {
        onSelectionChange?.([...selectedTemplates, template.id]);
      }
    }
  }, [selectionMode, selectedTemplates, onSelectionChange, onSelectTemplate]);

  const handleSelectAll = useCallback(() => {
    if (selectedTemplates.length === filteredAndSortedTemplates.length) {
      onSelectionChange?.([]);
    } else {
      onSelectionChange?.(filteredAndSortedTemplates.map(t => t.id));
    }
  }, [selectedTemplates, filteredAndSortedTemplates, onSelectionChange]);

  const formatFileSize = (bytes: number): string => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const TemplateCard: React.FC<{ template: Template }> = ({ template }) => {
    const categoryInfo = TEMPLATE_CATEGORIES[template.metadata.category];
    const isSelected = selectedTemplates.includes(template.id);

    return (
      <Card 
        className={`
          cursor-pointer transition-all hover:shadow-md
          ${isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''}
        `}
        onClick={() => handleTemplateSelect(template)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              {selectionMode !== 'none' && (
                <Checkbox
                  checked={isSelected}
                  onChange={() => handleTemplateSelect(template)}
                  onClick={(e) => e.stopPropagation()}
                />
              )}
              <div className="flex items-center gap-2">
                <span className="text-lg">{categoryInfo.icon}</span>
                <Badge className={categoryInfo.color}>
                  {categoryInfo.label}
                </Badge>
              </div>
            </div>
            {showActions && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setPreviewTemplate(template)}>
                    <Eye className="h-4 w-4 mr-2" />
                    Visualizar
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onEditTemplate?.(template)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onSelectTemplate?.(template)}>
                    <Download className="h-4 w-4 mr-2" />
                    Usar Template
                  </DropdownMenuItem>
                  <Separator />
                  <DropdownMenuItem 
                    onClick={() => onDeleteTemplate?.(template.id)}
                    className="text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          <CardTitle className="text-lg">{template.metadata.name}</CardTitle>
          {template.metadata.description && (
            <p className="text-sm text-gray-600 line-clamp-2">
              {template.metadata.description}
            </p>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Tags */}
            {template.metadata.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {template.metadata.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {template.metadata.tags.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{template.metadata.tags.length - 3}
                  </Badge>
                )}
              </div>
            )}

            {/* Metadata */}
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <span>{FORMAT_ICONS[template.metadata.originalFormat]}</span>
                <span>{template.metadata.originalFormat.toUpperCase()}</span>
                <span>•</span>
                <span>{formatFileSize(template.metadata.fileSize)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3" />
                <span>{template.metadata.usageCount}</span>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                <span>{template.metadata.uploadedBy}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{formatDate(template.updatedAt)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const TemplateListItem: React.FC<{ template: Template }> = ({ template }) => {
    const categoryInfo = TEMPLATE_CATEGORIES[template.metadata.category];
    const isSelected = selectedTemplates.includes(template.id);

    return (
      <div 
        className={`
          flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-all hover:bg-gray-50
          ${isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''}
        `}
        onClick={() => handleTemplateSelect(template)}
      >
        {selectionMode !== 'none' && (
          <Checkbox
            checked={isSelected}
            onChange={() => handleTemplateSelect(template)}
            onClick={(e) => e.stopPropagation()}
          />
        )}
        
        <div className="flex items-center gap-2">
          <span className="text-lg">{categoryInfo.icon}</span>
          <FileText className="h-5 w-5 text-gray-400" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium truncate">{template.metadata.name}</h3>
            <Badge className={`${categoryInfo.color} text-xs`}>
              {categoryInfo.label}
            </Badge>
            {!template.metadata.isPublic && (
              <Badge variant="outline" className="text-xs">
                Privado
              </Badge>
            )}
          </div>
          {template.metadata.description && (
            <p className="text-sm text-gray-600 truncate">
              {template.metadata.description}
            </p>
          )}
          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
            <span>{FORMAT_ICONS[template.metadata.originalFormat]} {template.metadata.originalFormat.toUpperCase()}</span>
            <span>{formatFileSize(template.metadata.fileSize)}</span>
            <span>{template.metadata.usageCount} usos</span>
            <span>{template.metadata.uploadedBy}</span>
            <span>{formatDate(template.updatedAt)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {template.metadata.tags.slice(0, 2).map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
          {template.metadata.tags.length > 2 && (
            <Badge variant="outline" className="text-xs">
              +{template.metadata.tags.length - 2}
            </Badge>
          )}
        </div>

        {showActions && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setPreviewTemplate(template)}>
                <Eye className="h-4 w-4 mr-2" />
                Visualizar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEditTemplate?.(template)}>
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSelectTemplate?.(template)}>
                <Download className="h-4 w-4 mr-2" />
                Usar Template
              </DropdownMenuItem>
              <Separator />
              <DropdownMenuItem 
                onClick={() => onDeleteTemplate?.(template.id)}
                className="text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    );
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Biblioteca de Templates</h2>
          <p className="text-gray-600">
            {filteredAndSortedTemplates.length} template{filteredAndSortedTemplates.length !== 1 ? 's' : ''} encontrado{filteredAndSortedTemplates.length !== 1 ? 's' : ''}
          </p>
        </div>
        {onCreateNew && (
          <Button onClick={onCreateNew}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Template
          </Button>
        )}
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4">
              <Select value={selectedCategory} onValueChange={(value: TemplateCategory | 'all') => setSelectedCategory(value)}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  {Object.entries(TEMPLATE_CATEGORIES).map(([value, { label }]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedFormat} onValueChange={(value: SupportedFileFormat | 'all') => setSelectedFormat(value)}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Formato" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os formatos</SelectItem>
                  <SelectItem value="docx">Word (DOCX)</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="pptx">PowerPoint (PPTX)</SelectItem>
                  <SelectItem value="xlsx">Excel (XLSX)</SelectItem>
                </SelectContent>
              </Select>

              <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
                const [newSortBy, newSortOrder] = value.split('-') as [SortBy, SortOrder];
                setSortBy(newSortBy);
                setSortOrder(newSortOrder);
              }}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="updated-desc">Mais recente</SelectItem>
                  <SelectItem value="updated-asc">Mais antigo</SelectItem>
                  <SelectItem value="name-asc">Nome A-Z</SelectItem>
                  <SelectItem value="name-desc">Nome Z-A</SelectItem>
                  <SelectItem value="usage-desc">Mais usado</SelectItem>
                  <SelectItem value="usage-asc">Menos usado</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="public-only"
                  checked={showPublicOnly}
                  onCheckedChange={setShowPublicOnly}
                />
                <label htmlFor="public-only" className="text-sm">
                  Apenas públicos
                </label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* View Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {selectionMode === 'multiple' && (
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selectedTemplates.length === filteredAndSortedTemplates.length && filteredAndSortedTemplates.length > 0}
                indeterminate={selectedTemplates.length > 0 && selectedTemplates.length < filteredAndSortedTemplates.length}
                onCheckedChange={handleSelectAll}
              />
              <span className="text-sm text-gray-600">
                {selectedTemplates.length} selecionado{selectedTemplates.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Templates */}
      {filteredAndSortedTemplates.length > 0 ? (
        <div className={`
          ${viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
            : 'space-y-3'
          }
        `}>
          {filteredAndSortedTemplates.map((template) => (
            viewMode === 'grid' ? (
              <TemplateCard key={template.id} template={template} />
            ) : (
              <TemplateListItem key={template.id} template={template} />
            )
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6 text-center">
            <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">
              Nenhum template encontrado
            </h3>
            <p className="text-gray-500 mb-4">
              Tente ajustar os filtros ou criar um novo template.
            </p>
            {onCreateNew && (
              <Button onClick={onCreateNew}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Template
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Preview Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          {previewTemplate && (
            <>
              <DialogHeader>
                <DialogTitle>{previewTemplate.metadata.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Categoria:</strong> {TEMPLATE_CATEGORIES[previewTemplate.metadata.category].label}
                  </div>
                  <div>
                    <strong>Formato:</strong> {previewTemplate.metadata.originalFormat.toUpperCase()}
                  </div>
                  <div>
                    <strong>Tamanho:</strong> {formatFileSize(previewTemplate.metadata.fileSize)}
                  </div>
                  <div>
                    <strong>Usos:</strong> {previewTemplate.metadata.usageCount}
                  </div>
                  <div>
                    <strong>Criado por:</strong> {previewTemplate.metadata.uploadedBy}
                  </div>
                  <div>
                    <strong>Atualizado:</strong> {formatDate(previewTemplate.updatedAt)}
                  </div>
                </div>
                
                {previewTemplate.metadata.description && (
                  <div>
                    <strong>Descrição:</strong>
                    <p className="mt-1 text-gray-600">{previewTemplate.metadata.description}</p>
                  </div>
                )}
                
                {previewTemplate.metadata.tags.length > 0 && (
                  <div>
                    <strong>Tags:</strong>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {previewTemplate.metadata.tags.map((tag) => (
                        <Badge key={tag} variant="outline">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex gap-2">
                  <Button onClick={() => {
                    onSelectTemplate?.(previewTemplate);
                    setPreviewTemplate(null);
                  }}>
                    <Download className="h-4 w-4 mr-2" />
                    Usar Template
                  </Button>
                  {showActions && (
                    <Button variant="outline" onClick={() => {
                      onEditTemplate?.(previewTemplate);
                      setPreviewTemplate(null);
                    }}>
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TemplateLibrary;