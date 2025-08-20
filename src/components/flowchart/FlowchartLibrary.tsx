// ============================================================================
// FlowchartLibrary - Componente para gerenciar biblioteca de fluxogramas
// ============================================================================

import React, { useState, useCallback, useMemo } from 'react';
import {
  FlowchartDocument,
  FlowchartFilters,
  FlowchartCategory,
  FlowchartStatus,
  FlowchartAccessLevel,
  FLOWCHART_CATEGORIES,
  FLOWCHART_STATUS_OPTIONS,
  FLOWCHART_ACCESS_LEVELS
} from '@/types/flowchart';
import { useFlowchartLibrary } from '@/hooks/useflowchart';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Search,
  Filter,
  Plus,
  MoreVertical,
  Edit,
  Copy,
  Trash2,
  Star,
  StarOff,
  Archive,
  ArchiveRestore,
  Share2,
  Download,
  Eye,
  Calendar,
  User,
  Users,
  Lock,
  Unlock,
  Grid,
  List,
  SortAsc,
  SortDesc,
  RefreshCw,
  FileText,
  Folder,
  FolderOpen
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// ============================================================================
// Interfaces
// ============================================================================

export interface FlowchartLibraryProps {
  onSelect?: (flowchart: FlowchartDocument) => void;
  onEdit?: (flowchart: FlowchartDocument) => void;
  onNew?: () => void;
  selectionMode?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  readOnly?: boolean;
  className?: string;
}

interface FlowchartCardProps {
  flowchart: FlowchartDocument;
  onSelect?: (flowchart: FlowchartDocument) => void;
  onEdit?: (flowchart: FlowchartDocument) => void;
  onDuplicate?: (id: string) => void;
  onDelete?: (id: string) => void;
  onToggleFavorite?: (id: string) => void;
  onToggleArchive?: (id: string) => void;
  onShare?: (flowchart: FlowchartDocument) => void;
  onExport?: (flowchart: FlowchartDocument) => void;
  isSelected?: boolean;
  onSelectionChange?: (selected: boolean) => void;
  selectionMode?: boolean;
  readOnly?: boolean;
}

interface FilterPanelProps {
  filters: FlowchartFilters;
  onFiltersChange: (filters: FlowchartFilters) => void;
  onReset: () => void;
}

type SortField = 'title' | 'createdAt' | 'updatedAt' | 'category' | 'status';
type SortOrder = 'asc' | 'desc';
type ViewMode = 'grid' | 'list';

// ============================================================================
// Componentes Auxiliares
// ============================================================================

/**
 * Card individual do fluxograma
 */
const FlowchartCard: React.FC<FlowchartCardProps> = ({
  flowchart,
  onSelect,
  onEdit,
  onDuplicate,
  onDelete,
  onToggleFavorite,
  onToggleArchive,
  onShare,
  onExport,
  isSelected = false,
  onSelectionChange,
  selectionMode = false,
  readOnly = false
}) => {
  const handleCardClick = () => {
    if (selectionMode) {
      onSelectionChange?.(!isSelected);
    } else {
      onSelect?.(flowchart);
    }
  };

  const getStatusColor = (status: FlowchartStatus) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-700';
      case 'published': return 'bg-green-100 text-green-700';
      case 'archived': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getCategoryColor = (category: FlowchartCategory) => {
    switch (category) {
      case 'process': return 'bg-blue-100 text-blue-700';
      case 'workflow': return 'bg-purple-100 text-purple-700';
      case 'system': return 'bg-orange-100 text-orange-700';
      case 'business': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-md ${
        isSelected ? 'ring-2 ring-primary' : ''
      }`}
      onClick={handleCardClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            {selectionMode && (
              <div className="mb-2">
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={onSelectionChange}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}
            <CardTitle className="text-sm font-medium truncate">
              {flowchart.title}
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {flowchart.description || 'Sem descrição'}
            </p>
          </div>
          
          {!readOnly && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit?.(flowchart)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDuplicate?.(flowchart.id)}>
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onToggleFavorite?.(flowchart.id)}>
                  {flowchart.isFavorite ? (
                    <StarOff className="h-4 w-4 mr-2" />
                  ) : (
                    <Star className="h-4 w-4 mr-2" />
                  )}
                  {flowchart.isFavorite ? 'Remover favorito' : 'Favoritar'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onToggleArchive?.(flowchart.id)}>
                  {flowchart.status === 'archived' ? (
                    <ArchiveRestore className="h-4 w-4 mr-2" />
                  ) : (
                    <Archive className="h-4 w-4 mr-2" />
                  )}
                  {flowchart.status === 'archived' ? 'Desarquivar' : 'Arquivar'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onShare?.(flowchart)}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Compartilhar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onExport?.(flowchart)}>
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => onDelete?.(flowchart.id)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Deletar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {/* Badges */}
        <div className="flex items-center gap-2 mb-3">
          <Badge 
            variant="secondary" 
            className={`text-xs ${getStatusColor(flowchart.status)}`}
          >
            {FLOWCHART_STATUS_OPTIONS.find(s => s.value === flowchart.status)?.label}
          </Badge>
          <Badge 
            variant="outline" 
            className={`text-xs ${getCategoryColor(flowchart.category)}`}
          >
            {FLOWCHART_CATEGORIES.find(c => c.value === flowchart.category)?.label}
          </Badge>
          {flowchart.isFavorite && (
            <Star className="h-3 w-3 text-yellow-500 fill-current" />
          )}
        </div>

        {/* Estatísticas */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center space-x-3">
            <span>{flowchart.nodes?.length || 0} nós</span>
            <span>{flowchart.edges?.length || 0} conexões</span>
          </div>
          <div className="flex items-center space-x-1">
            {flowchart.accessLevel === 'private' ? (
              <Lock className="h-3 w-3" />
            ) : (
              <Users className="h-3 w-3" />
            )}
          </div>
        </div>

        {/* Metadados */}
        <div className="mt-2 pt-2 border-t">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Criado {formatDistanceToNow(new Date(flowchart.createdAt), { 
                addSuffix: true, 
                locale: ptBR 
              })}
            </span>
            <span>
              por {flowchart.createdBy}
            </span>
          </div>
          {flowchart.updatedAt !== flowchart.createdAt && (
            <div className="text-xs text-muted-foreground mt-1">
              Atualizado {formatDistanceToNow(new Date(flowchart.updatedAt), { 
                addSuffix: true, 
                locale: ptBR 
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Painel de filtros
 */
const FilterPanel: React.FC<FilterPanelProps> = ({ filters, onFiltersChange, onReset }) => {
  const updateFilter = (key: keyof FlowchartFilters, value: string | boolean | undefined) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Filtros</h3>
        <Button variant="ghost" size="sm" onClick={onReset}>
          Limpar
        </Button>
      </div>

      {/* Busca */}
      <div className="space-y-2">
        <Label className="text-xs">Buscar</Label>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Título, descrição..."
            value={filters.search || ''}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* Categoria */}
      <div className="space-y-2">
        <Label className="text-xs">Categoria</Label>
        <Select
          value={filters.category || ''}
          onValueChange={(value) => updateFilter('category', value || undefined)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Todas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todas</SelectItem>
            {FLOWCHART_CATEGORIES.map((category) => (
              <SelectItem key={category.value} value={category.value}>
                {category.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Status */}
      <div className="space-y-2">
        <Label className="text-xs">Status</Label>
        <Select
          value={filters.status || ''}
          onValueChange={(value) => updateFilter('status', value || undefined)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos</SelectItem>
            {FLOWCHART_STATUS_OPTIONS.map((status) => (
              <SelectItem key={status.value} value={status.value}>
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Nível de acesso */}
      <div className="space-y-2">
        <Label className="text-xs">Acesso</Label>
        <Select
          value={filters.accessLevel || ''}
          onValueChange={(value) => updateFilter('accessLevel', value || undefined)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos</SelectItem>
            {FLOWCHART_ACCESS_LEVELS.map((level) => (
              <SelectItem key={level.value} value={level.value}>
                {level.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Favoritos */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="favorites"
          checked={filters.isFavorite || false}
          onCheckedChange={(checked) => updateFilter('isFavorite', checked)}
        />
        <Label htmlFor="favorites" className="text-xs">
          Apenas favoritos
        </Label>
      </div>

      {/* Criado por mim */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="myFlowcharts"
          checked={filters.createdByMe || false}
          onCheckedChange={(checked) => updateFilter('createdByMe', checked)}
        />
        <Label htmlFor="myFlowcharts" className="text-xs">
          Criados por mim
        </Label>
      </div>
    </div>
  );
};

// ============================================================================
// Componente Principal
// ============================================================================

/**
 * Biblioteca de fluxogramas
 */
export const FlowchartLibrary: React.FC<FlowchartLibraryProps> = ({
  onSelect,
  onEdit,
  onNew,
  selectionMode = false,
  selectedIds = [],
  onSelectionChange,
  readOnly = false,
  className = ''
}) => {
  const [filters, setFilters] = useState<FlowchartFilters>({});
  const [sortField, setSortField] = useState<SortField>('updatedAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showFilters, setShowFilters] = useState(false);

  const {
    flowcharts,
    isLoading,
    createFlowchart,
    deleteFlowchart,
    duplicateFlowchart,
    toggleFavorite,
    toggleArchive,
    bulkDelete,
    refetch
  } = useFlowchartLibrary(filters);

  // Filtrar e ordenar fluxogramas
  const sortedFlowcharts = useMemo(() => {
    if (!flowcharts) return [];

    return [...flowcharts].sort((a, b) => {
      let aValue: string | Date;
      let bValue: string | Date;

      switch (sortField) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        case 'updatedAt':
          aValue = new Date(a.updatedAt);
          bValue = new Date(b.updatedAt);
          break;
        case 'category':
          aValue = a.category;
          bValue = b.category;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [flowcharts, sortField, sortOrder]);

  // Handlers
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleResetFilters = () => {
    setFilters({});
  };

  const handleSelectAll = () => {
    if (selectedIds.length === sortedFlowcharts.length) {
      onSelectionChange?.([]);
    } else {
      onSelectionChange?.(sortedFlowcharts.map(f => f.id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;

    try {
      await bulkDelete(selectedIds);
      onSelectionChange?.([]);
      toast.success(`${selectedIds.length} fluxograma(s) deletado(s)`);
    } catch (error) {
      toast.error('Erro ao deletar fluxogramas');
    }
  };

  const handleShare = (flowchart: FlowchartDocument) => {
    // Implementar compartilhamento
    toast.info('Funcionalidade de compartilhamento em desenvolvimento');
  };

  const handleExport = (flowchart: FlowchartDocument) => {
    // Implementar exportação
    toast.info('Funcionalidade de exportação em desenvolvimento');
  };

  return (
    <div className={`flex h-full bg-background ${className}`}>
      {/* Painel de filtros */}
      {showFilters && (
        <div className="w-64 border-r p-4">
          <FilterPanel
            filters={filters}
            onFiltersChange={setFilters}
            onReset={handleResetFilters}
          />
        </div>
      )}

      {/* Conteúdo principal */}
      <div className="flex-1 flex flex-col">
        {/* Cabeçalho */}
        <div className="border-b p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold">Biblioteca de Fluxogramas</h2>
              <p className="text-sm text-muted-foreground">
                {sortedFlowcharts.length} fluxograma(s) encontrado(s)
              </p>
            </div>
            
            <div className="flex items-center space-x-2">
              {!readOnly && onNew && (
                <Button onClick={onNew}>
                  <Plus className="h-4 w-4 mr-1" />
                  Novo Fluxograma
                </Button>
              )}
            </div>
          </div>

          {/* Controles */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {/* Busca rápida */}
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar fluxogramas..."
                  value={filters.search || ''}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="pl-8 w-64"
                />
              </div>

              {/* Filtros */}
              <Button
                variant={showFilters ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-1" />
                Filtros
              </Button>

              {/* Atualizar */}
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center space-x-2">
              {/* Seleção em massa */}
              {selectionMode && (
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAll}
                  >
                    {selectedIds.length === sortedFlowcharts.length ? 'Desmarcar todos' : 'Selecionar todos'}
                  </Button>
                  {selectedIds.length > 0 && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleBulkDelete}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Deletar ({selectedIds.length})
                    </Button>
                  )}
                </div>
              )}

              {/* Ordenação */}
              <Select
                value={`${sortField}-${sortOrder}`}
                onValueChange={(value) => {
                  const [field, order] = value.split('-') as [SortField, SortOrder];
                  setSortField(field);
                  setSortOrder(order);
                }}
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="updatedAt-desc">Mais recentes</SelectItem>
                  <SelectItem value="updatedAt-asc">Mais antigos</SelectItem>
                  <SelectItem value="title-asc">Título A-Z</SelectItem>
                  <SelectItem value="title-desc">Título Z-A</SelectItem>
                  <SelectItem value="createdAt-desc">Criação mais recente</SelectItem>
                  <SelectItem value="createdAt-asc">Criação mais antiga</SelectItem>
                </SelectContent>
              </Select>

              {/* Modo de visualização */}
              <div className="flex items-center border rounded-md">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-r-none"
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-l-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de fluxogramas */}
        <div className="flex-1 overflow-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">Carregando fluxogramas...</p>
              </div>
            </div>
          ) : sortedFlowcharts.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">Nenhum fluxograma encontrado</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {Object.keys(filters).length > 0
                    ? 'Tente ajustar os filtros ou criar um novo fluxograma'
                    : 'Comece criando seu primeiro fluxograma'
                  }
                </p>
                {!readOnly && onNew && (
                  <Button onClick={onNew}>
                    <Plus className="h-4 w-4 mr-1" />
                    Criar Fluxograma
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className={viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
              : 'space-y-2'
            }>
              {sortedFlowcharts.map((flowchart) => (
                <FlowchartCard
                  key={flowchart.id}
                  flowchart={flowchart}
                  onSelect={onSelect}
                  onEdit={onEdit}
                  onDuplicate={duplicateFlowchart}
                  onDelete={deleteFlowchart}
                  onToggleFavorite={toggleFavorite}
                  onToggleArchive={toggleArchive}
                  onShare={handleShare}
                  onExport={handleExport}
                  isSelected={selectedIds.includes(flowchart.id)}
                  onSelectionChange={(selected) => {
                    if (selected) {
                      onSelectionChange?.([...selectedIds, flowchart.id]);
                    } else {
                      onSelectionChange?.(selectedIds.filter(id => id !== flowchart.id));
                    }
                  }}
                  selectionMode={selectionMode}
                  readOnly={readOnly}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FlowchartLibrary;