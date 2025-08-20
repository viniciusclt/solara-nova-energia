// =====================================================
// PÁGINA DE LISTA DE MÓDULOS
// Sistema de Treinamentos Corporativos - Solara Nova Energia
// Versão: 1.0
// Data: 2024-12-12
// =====================================================

import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  Grid3X3,
  List,
  Plus,
  Clock,
  Users,
  Star,
  BookOpen,
  Play,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Calendar,
  Tag,
  SortAsc,
  SortDesc,
  Eye,
  Edit,
  Trash2,
  MoreVertical,
  Download,
  Share2,
  Bookmark,
  BookmarkCheck,
  Target,
  Award,
  Zap,
  FileText,
  Video,
  HelpCircle,
  ChevronDown,
  X,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Badge } from '../../../components/ui/badge';
import { Progress } from '../../../components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '../../../components/ui/popover';
import { Checkbox } from '../../../components/ui/checkbox';
import { Separator } from '../../../components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../../components/ui/tooltip';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../../components/ui/dialog';
import { ScrollArea } from '../../../components/ui/scroll-area';
import { useAuth } from '../../../contexts/AuthContext';
import { useTrainingModules, useUserProgress, useTrainingFilters } from '../hooks/useTraining';
import { SidebarToggle } from '../../../core/components/layout/SidebarToggle';
import type { TrainingModule } from '../types';

// =====================================================
// TIPOS E INTERFACES
// =====================================================

type ViewMode = 'grid' | 'list';
type SortField = 'title' | 'created_at' | 'estimated_duration' | 'difficulty';
type SortOrder = 'asc' | 'desc';

interface FilterState {
  categories: string[];
  difficulties: string[];
  status: string[];
  tags: string[];
  dateRange: {
    start: string;
    end: string;
  };
}

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

export function ModuleListPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [bookmarkedModules, setBookmarkedModules] = useState<Set<string>>(new Set());
  
  // Filtros
  const {
    filters,
    updateFilters,
    clearFilters,
    hasActiveFilters
  } = useTrainingFilters();
  
  // Dados - Memoizar parâmetros para evitar re-renders
  const moduleParams = useMemo(() => ({
    search: searchQuery,
    category: filters.categories,
    difficulty: filters.difficulties,
    tags: filters.tags
  }), [searchQuery, filters.categories, filters.difficulties, filters.tags]);
  
  const { 
    data: modules, 
    isLoading, 
    error, 
    refetch 
  } = useTrainingModules(moduleParams);
  
  const { data: userProgress } = useUserProgress();
  
  // Módulos filtrados e ordenados - Otimizar dependências
  const filteredAndSortedModules = useMemo(() => {
    if (!modules) return [];
    
    const filtered = modules.filter(module => {
      // Filtro de busca
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = module.title.toLowerCase().includes(query);
        const matchesDescription = module.description?.toLowerCase().includes(query);
        const matchesTags = module.tags?.some(tag => tag.toLowerCase().includes(query));
        
        if (!matchesTitle && !matchesDescription && !matchesTags) {
          return false;
        }
      }
      
      // Filtros avançados
      if (filters.categories?.length > 0 && !filters.categories.includes(module.category)) {
        return false;
      }
      
      if (filters.difficulties?.length > 0 && !filters.difficulties.includes(module.difficulty)) {
        return false;
      }
      
      if (filters.status?.length > 0) {
        const moduleProgress = userProgress?.find(p => p.module_id === module.id);
        const status = moduleProgress?.completed ? 'completed' : 
                     moduleProgress ? 'in_progress' : 'not_started';
        
        if (!filters.status.includes(status)) {
          return false;
        }
      }
      
      return true;
    });
    
    // Ordenação
    filtered.sort((a, b) => {
      let aValue: string | number | Date, bValue: string | number | Date;
      
      switch (sortField) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'created_at':
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
          break;
        case 'estimated_duration':
          aValue = a.estimated_duration || 0;
          bValue = b.estimated_duration || 0;
          break;
        case 'difficulty': {
          const difficultyOrder = { beginner: 1, intermediate: 2, advanced: 3 };
          aValue = difficultyOrder[a.difficulty as keyof typeof difficultyOrder] || 0;
          bValue = difficultyOrder[b.difficulty as keyof typeof difficultyOrder] || 0;
          break;
        }
        default:
          return 0;
      }
      
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    
    return filtered;
  }, [modules, searchQuery, filters.categories, filters.difficulties, filters.status, sortField, sortOrder, userProgress]);
  
  // Handlers - Otimizar com useCallback
  const handleBookmarkToggle = useCallback((moduleId: string) => {
    setBookmarkedModules(prev => {
      const newBookmarks = new Set(prev);
      if (newBookmarks.has(moduleId)) {
        newBookmarks.delete(moduleId);
      } else {
        newBookmarks.add(moduleId);
      }
      return newBookmarks;
    });
    // Implementar salvamento no backend
  }, []);
  
  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  }, [sortField]);
  
  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Erro ao carregar módulos
        </h2>
        <p className="text-gray-600 mb-4">
          Ocorreu um erro ao carregar os módulos de treinamento.
        </p>
        <Button onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Tentar novamente
        </Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <SidebarToggle />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Módulos de Treinamento</h1>
            <p className="text-gray-600 mt-1">
              {filteredAndSortedModules.length} módulo{filteredAndSortedModules.length !== 1 ? 's' : ''} disponível{filteredAndSortedModules.length !== 1 ? 'eis' : ''}
            </p>
          </div>
        </div>
        
        {user?.role === 'admin' && (
          <Button onClick={() => navigate('/training/modules/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Módulo
          </Button>
        )}
      </div>
      
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar módulos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        {/* Sort */}
        <Select value={`${sortField}-${sortOrder}`} onValueChange={(value) => {
          const [field, order] = value.split('-') as [SortField, SortOrder];
          setSortField(field);
          setSortOrder(order);
        }}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Ordenar por" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="title-asc">Título (A-Z)</SelectItem>
            <SelectItem value="title-desc">Título (Z-A)</SelectItem>
            <SelectItem value="created_at-desc">Mais recentes</SelectItem>
            <SelectItem value="created_at-asc">Mais antigos</SelectItem>
            <SelectItem value="estimated_duration-asc">Menor duração</SelectItem>
            <SelectItem value="estimated_duration-desc">Maior duração</SelectItem>
            <SelectItem value="difficulty-asc">Dificuldade crescente</SelectItem>
            <SelectItem value="difficulty-desc">Dificuldade decrescente</SelectItem>
          </SelectContent>
        </Select>
        
        {/* Filters */}
        <Popover open={showFilters} onOpenChange={setShowFilters}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="relative">
              <Filter className="h-4 w-4 mr-2" />
              Filtros
              {hasActiveFilters && (
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-600 rounded-full" />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <FilterPanel 
              filters={filters}
              onFiltersChange={updateFilters}
              onClearFilters={clearFilters}
            />
          </PopoverContent>
        </Popover>
        
        {/* View Mode */}
        <div className="flex border rounded-lg">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('grid')}
            className="rounded-r-none"
          >
            <Grid3X3 className="h-4 w-4" />
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
      
      {/* Active Filters */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-600">Filtros ativos:</span>
          {filters.categories.map(category => (
            <Badge key={category} variant="secondary" className="gap-1">
              {category}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => updateFilters({
                  categories: filters.categories.filter(c => c !== category)
                })}
              />
            </Badge>
          ))}
          {filters.difficulties.map(difficulty => (
            <Badge key={difficulty} variant="secondary" className="gap-1">
              {difficulty === 'beginner' ? 'Iniciante' :
               difficulty === 'intermediate' ? 'Intermediário' : 'Avançado'}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => updateFilters({
                  difficulties: filters.difficulties.filter(d => d !== difficulty)
                })}
              />
            </Badge>
          ))}
          {filters.status.map(status => (
            <Badge key={status} variant="secondary" className="gap-1">
              {status === 'completed' ? 'Concluído' :
               status === 'in_progress' ? 'Em andamento' : 'Não iniciado'}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => updateFilters({
                  status: filters.status.filter(s => s !== status)
                })}
              />
            </Badge>
          ))}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearFilters}
            className="h-6 px-2 text-xs"
          >
            Limpar todos
          </Button>
        </div>
      )}
      
      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-full" />
                <div className="h-3 bg-gray-200 rounded w-2/3" />
              </CardHeader>
              <CardContent>
                <div className="h-32 bg-gray-200 rounded mb-4" />
                <div className="flex gap-2 mb-4">
                  <div className="h-6 bg-gray-200 rounded w-16" />
                  <div className="h-6 bg-gray-200 rounded w-20" />
                </div>
                <div className="h-8 bg-gray-200 rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredAndSortedModules.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Nenhum módulo encontrado
          </h2>
          <p className="text-gray-600 mb-4">
            {searchQuery || hasActiveFilters 
              ? 'Tente ajustar os filtros ou termo de busca.'
              : 'Ainda não há módulos de treinamento disponíveis.'}
          </p>
          {(searchQuery || hasActiveFilters) && (
            <Button variant="outline" onClick={() => {
              setSearchQuery('');
              clearFilters();
            }}>
              Limpar filtros
            </Button>
          )}
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {viewMode === 'grid' ? (
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filteredAndSortedModules.map((module) => (
                <ModuleCard
                  key={module.id}
                  module={module}
                  userProgress={userProgress}
                  isBookmarked={bookmarkedModules.has(module.id)}
                  onBookmarkToggle={() => handleBookmarkToggle(module.id)}
                  onView={() => navigate(`/training/modules/${module.id}`)}
                  onEdit={user?.role === 'admin' ? () => navigate(`/training/modules/${module.id}/edit`) : undefined}
                />
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {filteredAndSortedModules.map((module) => (
                <ModuleListItem
                  key={module.id}
                  module={module}
                  userProgress={userProgress}
                  isBookmarked={bookmarkedModules.has(module.id)}
                  onBookmarkToggle={() => handleBookmarkToggle(module.id)}
                  onView={() => navigate(`/training/modules/${module.id}`)}
                  onEdit={user?.role === 'admin' ? () => navigate(`/training/modules/${module.id}/edit`) : undefined}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}

// =====================================================
// COMPONENTE: CARD DO MÓDULO
// =====================================================

function ModuleCard({ 
  module, 
  userProgress, 
  isBookmarked, 
  onBookmarkToggle, 
  onView, 
  onEdit 
}: {
  module: TrainingModule;
  userProgress: { module_id: string; progress_percentage: number; completed: boolean }[] | undefined;
  isBookmarked: boolean;
  onBookmarkToggle: () => void;
  onView: () => void;
  onEdit?: () => void;
}) {
  const moduleProgress = userProgress?.find(p => p.module_id === module.id);
  const progressPercentage = moduleProgress?.progress_percentage || 0;
  const isCompleted = moduleProgress?.completed || false;
  
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="h-full cursor-pointer group" onClick={onView}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg line-clamp-2 group-hover:text-blue-600 transition-colors">
                {module.title}
              </CardTitle>
              <CardDescription className="line-clamp-2 mt-1">
                {module.description}
              </CardDescription>
            </div>
            
            <div className="flex items-center space-x-1 ml-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={(e) => {
                        e.stopPropagation();
                        onBookmarkToggle();
                      }}
                    >
                      {isBookmarked ? (
                        <BookmarkCheck className="h-4 w-4 text-blue-600" />
                      ) : (
                        <Bookmark className="h-4 w-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{isBookmarked ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              {onEdit && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-48" align="end">
                    <div className="space-y-1">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-full justify-start"
                        onClick={(e) => {
                          e.stopPropagation();
                          onView();
                        }}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Visualizar
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-full justify-start"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit();
                        }}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-full justify-start"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Share2 className="h-4 w-4 mr-2" />
                        Compartilhar
                      </Button>
                      <Separator />
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-full justify-start text-red-600 hover:text-red-700"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Thumbnail */}
          <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
            {module.thumbnail_url ? (
              <img 
                src={module.thumbnail_url} 
                alt={module.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <BookOpen className="h-12 w-12 text-gray-400" />
              </div>
            )}
          </div>
          
          {/* Progress */}
          {moduleProgress && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Progresso</span>
                <span className="font-medium">
                  {Math.round(progressPercentage)}%
                </span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
              {isCompleted && (
                <div className="flex items-center text-green-600 text-sm">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Concluído
                </div>
              )}
            </div>
          )}
          
          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{module.category}</Badge>
            <Badge 
              variant={module.difficulty === 'beginner' ? 'default' : 
                      module.difficulty === 'intermediate' ? 'secondary' : 'destructive'}
            >
              {module.difficulty === 'beginner' ? 'Iniciante' :
               module.difficulty === 'intermediate' ? 'Intermediário' : 'Avançado'}
            </Badge>
          </div>
          
          {/* Stats */}
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              {module.estimated_duration} min
            </div>
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-1" />
              45 {/* Mock data */}
            </div>
            <div className="flex items-center">
              <Star className="h-4 w-4 mr-1 text-yellow-500" />
              4.8 {/* Mock data */}
            </div>
          </div>
          
          {/* Action Button */}
          <Button className="w-full" onClick={(e) => {
            e.stopPropagation();
            onView();
          }}>
            <Play className="h-4 w-4 mr-2" />
            {progressPercentage > 0 ? 'Continuar' : 'Iniciar'}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// =====================================================
// COMPONENTE: ITEM DA LISTA
// =====================================================

function ModuleListItem({ 
  module, 
  userProgress, 
  isBookmarked, 
  onBookmarkToggle, 
  onView, 
  onEdit 
}: {
  module: TrainingModule;
  userProgress: { module_id: string; progress_percentage: number; completed: boolean }[] | undefined;
  isBookmarked: boolean;
  onBookmarkToggle: () => void;
  onView: () => void;
  onEdit?: () => void;
}) {
  const moduleProgress = userProgress?.find(p => p.module_id === module.id);
  const progressPercentage = moduleProgress?.progress_percentage || 0;
  const isCompleted = moduleProgress?.completed || false;
  
  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onView}>
      <CardContent className="p-6">
        <div className="flex items-center space-x-4">
          {/* Thumbnail */}
          <div className="w-24 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
            {module.thumbnail_url ? (
              <img 
                src={module.thumbnail_url} 
                alt={module.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-gray-400" />
              </div>
            )}
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 truncate hover:text-blue-600 transition-colors">
                  {module.title}
                </h3>
                <p className="text-gray-600 text-sm line-clamp-2 mt-1">
                  {module.description}
                </p>
                
                {/* Badges */}
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge variant="outline" className="text-xs">{module.category}</Badge>
                  <Badge 
                    variant={module.difficulty === 'beginner' ? 'default' : 
                            module.difficulty === 'intermediate' ? 'secondary' : 'destructive'}
                    className="text-xs"
                  >
                    {module.difficulty === 'beginner' ? 'Iniciante' :
                     module.difficulty === 'intermediate' ? 'Intermediário' : 'Avançado'}
                  </Badge>
                  {isCompleted && (
                    <Badge variant="default" className="text-xs bg-green-600">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Concluído
                    </Badge>
                  )}
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex items-center space-x-2 ml-4">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={(e) => {
                    e.stopPropagation();
                    onBookmarkToggle();
                  }}
                >
                  {isBookmarked ? (
                    <BookmarkCheck className="h-4 w-4 text-blue-600" />
                  ) : (
                    <Bookmark className="h-4 w-4" />
                  )}
                </Button>
                
                <Button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onView();
                  }}
                >
                  <Play className="h-4 w-4 mr-2" />
                  {progressPercentage > 0 ? 'Continuar' : 'Iniciar'}
                </Button>
                
                {onEdit && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-48" align="end">
                      <div className="space-y-1">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="w-full justify-start"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit();
                          }}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="w-full justify-start"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Share2 className="h-4 w-4 mr-2" />
                          Compartilhar
                        </Button>
                        <Separator />
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="w-full justify-start text-red-600 hover:text-red-700"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
              </div>
            </div>
            
            {/* Progress */}
            {moduleProgress && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-600">Progresso</span>
                  <span className="font-medium">{Math.round(progressPercentage)}%</span>
                </div>
                <Progress value={progressPercentage} className="h-2" />
              </div>
            )}
            
            {/* Stats */}
            <div className="flex items-center space-x-4 mt-3 text-sm text-gray-600">
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                {module.estimated_duration} min
              </div>
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-1" />
                45 participantes
              </div>
              <div className="flex items-center">
                <Star className="h-4 w-4 mr-1 text-yellow-500" />
                4.8/5
              </div>
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                {new Date(module.created_at).toLocaleDateString('pt-BR')}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// =====================================================
// COMPONENTE: PAINEL DE FILTROS
// =====================================================

function FilterPanel({ 
  filters, 
  onFiltersChange, 
  onClearFilters 
}: {
  filters: FilterState;
  onFiltersChange: (filters: Partial<FilterState>) => void;
  onClearFilters: () => void;
}) {
  const categories = ['Energia Solar', 'Segurança', 'Técnico', 'Vendas', 'Gestão'];
  const difficulties = ['beginner', 'intermediate', 'advanced'];
  const statuses = ['not_started', 'in_progress', 'completed'];
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Filtros</h3>
        <Button variant="ghost" size="sm" onClick={onClearFilters}>
          Limpar
        </Button>
      </div>
      
      <Separator />
      
      {/* Categorias */}
      <div>
        <h4 className="font-medium mb-2">Categorias</h4>
        <div className="space-y-2">
          {categories.map(category => (
            <div key={category} className="flex items-center space-x-2">
              <Checkbox 
                id={`category-${category}`}
                checked={filters.categories.includes(category)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    onFiltersChange({
                      categories: [...filters.categories, category]
                    });
                  } else {
                    onFiltersChange({
                      categories: filters.categories.filter(c => c !== category)
                    });
                  }
                }}
              />
              <label 
                htmlFor={`category-${category}`} 
                className="text-sm cursor-pointer"
              >
                {category}
              </label>
            </div>
          ))}
        </div>
      </div>
      
      <Separator />
      
      {/* Dificuldade */}
      <div>
        <h4 className="font-medium mb-2">Dificuldade</h4>
        <div className="space-y-2">
          {difficulties.map(difficulty => (
            <div key={difficulty} className="flex items-center space-x-2">
              <Checkbox 
                id={`difficulty-${difficulty}`}
                checked={filters.difficulties.includes(difficulty)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    onFiltersChange({
                      difficulties: [...filters.difficulties, difficulty]
                    });
                  } else {
                    onFiltersChange({
                      difficulties: filters.difficulties.filter(d => d !== difficulty)
                    });
                  }
                }}
              />
              <label 
                htmlFor={`difficulty-${difficulty}`} 
                className="text-sm cursor-pointer"
              >
                {difficulty === 'beginner' ? 'Iniciante' :
                 difficulty === 'intermediate' ? 'Intermediário' : 'Avançado'}
              </label>
            </div>
          ))}
        </div>
      </div>
      
      <Separator />
      
      {/* Status */}
      <div>
        <h4 className="font-medium mb-2">Status</h4>
        <div className="space-y-2">
          {statuses.map(status => (
            <div key={status} className="flex items-center space-x-2">
              <Checkbox 
                id={`status-${status}`}
                checked={filters.status.includes(status)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    onFiltersChange({
                      status: [...filters.status, status]
                    });
                  } else {
                    onFiltersChange({
                      status: filters.status.filter(s => s !== status)
                    });
                  }
                }}
              />
              <label 
                htmlFor={`status-${status}`} 
                className="text-sm cursor-pointer"
              >
                {status === 'not_started' ? 'Não iniciado' :
                 status === 'in_progress' ? 'Em andamento' : 'Concluído'}
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ModuleListPage;