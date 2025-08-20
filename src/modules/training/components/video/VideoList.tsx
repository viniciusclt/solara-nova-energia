// components/video/VideoList.tsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Filter,
  SortAsc,
  SortDesc,
  Grid,
  List,
  Play,
  Clock,
  Eye,
  Star,
  Download,
  Share2,
  MoreVertical,
  Trash2,
  Edit,
  Copy,
  BookOpen,
  Users,
  Calendar,
  Tag,
  TrendingUp,
  Award,
} from 'lucide-react';
import {
  VideoMetadata,
  VideoCategory,
  VideoStatus,
  VideoVisibility,
  VideoSearchSortBy,
  VideoSearchOrder,
  formatVideoDuration,
  formatFileSize,
} from '../../types/video';
import { cn } from '@/lib/utils';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/ui/tooltip';
import { Progress } from '@/shared/ui/progress';
import { Separator } from '@/shared/ui/separator';
import { toast } from 'sonner';

interface VideoListProps {
  videos: VideoMetadata[];
  loading?: boolean;
  error?: string | null;
  className?: string;
  viewMode?: 'grid' | 'list';
  showFilters?: boolean;
  showSearch?: boolean;
  showSort?: boolean;
  allowSelection?: boolean;
  selectedVideos?: string[];
  onVideoSelect?: (videoId: string) => void;
  onVideoPlay?: (video: VideoMetadata) => void;
  onVideoEdit?: (video: VideoMetadata) => void;
  onVideoDelete?: (video: VideoMetadata) => void;
  onVideoShare?: (video: VideoMetadata) => void;
  onVideoDownload?: (video: VideoMetadata) => void;
  onSelectionChange?: (selectedIds: string[]) => void;
  itemsPerPage?: number;
  enablePagination?: boolean;
}

interface VideoFilters {
  category?: VideoCategory;
  status?: VideoStatus;
  visibility?: VideoVisibility;
  duration?: { min?: number; max?: number };
  uploadDate?: { start?: Date; end?: Date };
  tags?: string[];
  instructor?: string;
}

interface VideoSort {
  field: VideoSearchSortBy;
  order: VideoSearchOrder;
}

interface VideoCardProps {
  video: VideoMetadata;
  viewMode: 'grid' | 'list';
  isSelected?: boolean;
  allowSelection?: boolean;
  onSelect?: () => void;
  onPlay?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onShare?: () => void;
  onDownload?: () => void;
}

interface VideoStatsProps {
  videos: VideoMetadata[];
}

// Componente de Estatísticas
const VideoStats: React.FC<VideoStatsProps> = ({ videos }) => {
  const stats = useMemo(() => {
    const totalVideos = videos.length;
    const totalDuration = videos.reduce((acc, video) => acc + video.duration, 0);
    const totalViews = videos.reduce((acc, video) => acc + (video.analytics?.totalViews || 0), 0);
    const totalSize = videos.reduce((acc, video) => acc + video.fileSize, 0);
    const avgRating = videos.reduce((acc, video) => acc + (video.rating || 0), 0) / totalVideos;
    
    const categoryDistribution = videos.reduce((acc, video) => {
      acc[video.category] = (acc[video.category] || 0) + 1;
      return acc;
    }, {} as Record<VideoCategory, number>);

    const statusDistribution = videos.reduce((acc, video) => {
      acc[video.status] = (acc[video.status] || 0) + 1;
      return acc;
    }, {} as Record<VideoStatus, number>);

    return {
      totalVideos,
      totalDuration,
      totalViews,
      totalSize,
      avgRating,
      categoryDistribution,
      statusDistribution,
    };
  }, [videos]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <Play className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-2xl font-bold">{stats.totalVideos}</p>
              <p className="text-sm text-muted-foreground">Vídeos</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-green-500" />
            <div>
              <p className="text-2xl font-bold">{formatVideoDuration(stats.totalDuration)}</p>
              <p className="text-sm text-muted-foreground">Duração Total</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <Eye className="h-5 w-5 text-purple-500" />
            <div>
              <p className="text-2xl font-bold">{stats.totalViews.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Visualizações</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-orange-500" />
            <div>
              <p className="text-2xl font-bold">{stats.avgRating.toFixed(1)}</p>
              <p className="text-sm text-muted-foreground">Avaliação Média</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Componente de Card de Vídeo
const VideoCard: React.FC<VideoCardProps> = ({
  video,
  viewMode,
  isSelected,
  allowSelection,
  onSelect,
  onPlay,
  onEdit,
  onDelete,
  onShare,
  onDownload,
}) => {
  const getStatusColor = (status: VideoStatus) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'archived':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: VideoCategory) => {
    switch (category) {
      case 'tutorial':
        return <BookOpen className="h-4 w-4" />;
      case 'webinar':
        return <Users className="h-4 w-4" />;
      case 'course':
        return <Award className="h-4 w-4" />;
      default:
        return <Play className="h-4 w-4" />;
    }
  };

  if (viewMode === 'list') {
    return (
      <Card className={cn('transition-all hover:shadow-md', isSelected && 'ring-2 ring-blue-500')}>
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            {allowSelection && (
              <input
                type="checkbox"
                checked={isSelected}
                onChange={onSelect}
                className="rounded border-gray-300"
              />
            )}
            
            <div className="relative flex-shrink-0">
              <img
                src={video.thumbnail}
                alt={video.title}
                className="w-24 h-16 object-cover rounded cursor-pointer"
                onClick={onPlay}
              />
              <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1 rounded">
                {formatVideoDuration(video.duration)}
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg truncate cursor-pointer hover:text-blue-600" onClick={onPlay}>
                    {video.title}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                    {video.description}
                  </p>
                  
                  <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      {getCategoryIcon(video.category)}
                      <span className="capitalize">{video.category}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Eye className="h-4 w-4" />
                      <span>{video.analytics?.totalViews || 0}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(video.uploadDate).toLocaleDateString()}</span>
                    </div>
                    {video.rating && (
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span>{video.rating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  <Badge className={getStatusColor(video.status)}>
                    {video.status}
                  </Badge>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={onPlay}>
                        <Play className="h-4 w-4 mr-2" />
                        Reproduzir
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={onEdit}>
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={onShare}>
                        <Share2 className="h-4 w-4 mr-2" />
                        Compartilhar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={onDownload}>
                        <Download className="h-4 w-4 mr-2" />
                        Baixar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={onDelete} className="text-red-600">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('transition-all hover:shadow-lg', isSelected && 'ring-2 ring-blue-500')}>
      <div className="relative">
        {allowSelection && (
          <div className="absolute top-2 left-2 z-10">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={onSelect}
              className="rounded border-gray-300"
            />
          </div>
        )}
        
        <div className="relative cursor-pointer" onClick={onPlay}>
          <img
            src={video.thumbnail}
            alt={video.title}
            className="w-full h-48 object-cover rounded-t-lg"
          />
          <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors rounded-t-lg" />
          <div className="absolute bottom-2 right-2 bg-black/70 text-white text-sm px-2 py-1 rounded">
            {formatVideoDuration(video.duration)}
          </div>
          <div className="absolute top-2 right-2">
            <Badge className={getStatusColor(video.status)}>
              {video.status}
            </Badge>
          </div>
        </div>
      </div>
      
      <CardContent className="p-4">
        <div className="space-y-3">
          <div>
            <h3 className="font-semibold text-lg line-clamp-2 cursor-pointer hover:text-blue-600" onClick={onPlay}>
              {video.title}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-3 mt-1">
              {video.description}
            </p>
          </div>
          
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center space-x-1">
              {getCategoryIcon(video.category)}
              <span className="capitalize">{video.category}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Eye className="h-4 w-4" />
              <span>{video.analytics?.totalViews || 0}</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {video.instructor && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={video.instructor.avatar} />
                        <AvatarFallback>{video.instructor.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                    </TooltipTrigger>
                    <TooltipContent>
                      {video.instructor.name}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              
              {video.rating && (
                <div className="flex items-center space-x-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm">{video.rating.toFixed(1)}</span>
                </div>
              )}
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onPlay}>
                  <Play className="h-4 w-4 mr-2" />
                  Reproduzir
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onShare}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Compartilhar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onDownload}>
                  <Download className="h-4 w-4 mr-2" />
                  Baixar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onDelete} className="text-red-600">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          <div className="text-xs text-muted-foreground">
            {new Date(video.uploadDate).toLocaleDateString()} • {formatFileSize(video.fileSize)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Componente Principal
export const VideoList: React.FC<VideoListProps> = ({
  videos,
  loading = false,
  error = null,
  className,
  viewMode: initialViewMode = 'grid',
  showFilters = true,
  showSearch = true,
  showSort = true,
  allowSelection = false,
  selectedVideos = [],
  onVideoSelect,
  onVideoPlay,
  onVideoEdit,
  onVideoDelete,
  onVideoShare,
  onVideoDownload,
  onSelectionChange,
  itemsPerPage = 12,
  enablePagination = true,
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(initialViewMode);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<VideoFilters>({});
  const [sort, setSort] = useState<VideoSort>({ field: 'uploadDate', order: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);

  // Filter and sort videos
  const filteredAndSortedVideos = useMemo(() => {
    let filtered = videos;

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        video =>
          video.title?.toLowerCase().includes(query) ||
          video.description?.toLowerCase().includes(query) ||
          (video.tags && video.tags.some(tag => tag?.toLowerCase().includes(query))) ||
          video.instructor?.name?.toLowerCase().includes(query)
      );
    }

    // Apply filters
    if (filters.category) {
      filtered = filtered.filter(video => video.category === filters.category);
    }
    if (filters.status) {
      filtered = filtered.filter(video => video.status === filters.status);
    }
    if (filters.visibility) {
      filtered = filtered.filter(video => video.visibility === filters.visibility);
    }
    if (filters.duration?.min !== undefined) {
      filtered = filtered.filter(video => video.duration >= filters.duration!.min!);
    }
    if (filters.duration?.max !== undefined) {
      filtered = filtered.filter(video => video.duration <= filters.duration!.max!);
    }
    if (filters.uploadDate?.start) {
      filtered = filtered.filter(video => new Date(video.uploadDate) >= filters.uploadDate!.start!);
    }
    if (filters.uploadDate?.end) {
      filtered = filtered.filter(video => new Date(video.uploadDate) <= filters.uploadDate!.end!);
    }
    if (filters.tags?.length) {
      filtered = filtered.filter(video =>
        video.tags && filters.tags!.some(tag => video.tags.includes(tag))
      );
    }
    if (filters.instructor) {
      filtered = filtered.filter(video => video.instructor?.name === filters.instructor);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: string | number | Date, bValue: string | number | Date;

      switch (sort.field) {
        case 'title':
          aValue = a.title;
          bValue = b.title;
          break;
        case 'uploadDate':
          aValue = new Date(a.uploadDate);
          bValue = new Date(b.uploadDate);
          break;
        case 'duration':
          aValue = a.duration;
          bValue = b.duration;
          break;
        case 'views':
          aValue = a.analytics?.totalViews || 0;
          bValue = b.analytics?.totalViews || 0;
          break;
        case 'rating':
          aValue = a.rating || 0;
          bValue = b.rating || 0;
          break;
        default:
          aValue = a.uploadDate;
          bValue = b.uploadDate;
      }

      if (aValue < bValue) return sort.order === 'asc' ? -1 : 1;
      if (aValue > bValue) return sort.order === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [videos, searchQuery, filters, sort]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedVideos.length / itemsPerPage);
  const paginatedVideos = enablePagination
    ? filteredAndSortedVideos.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
      )
    : filteredAndSortedVideos;

  // Selection handlers
  const handleVideoSelect = (videoId: string) => {
    if (!allowSelection) return;
    
    const newSelection = selectedVideos.includes(videoId)
      ? selectedVideos.filter(id => id !== videoId)
      : [...selectedVideos, videoId];
    
    onSelectionChange?.(newSelection);
    onVideoSelect?.(videoId);
  };

  const handleSelectAll = () => {
    if (!allowSelection) return;
    
    const allSelected = paginatedVideos.every(video => selectedVideos.includes(video.id));
    const newSelection = allSelected
      ? selectedVideos.filter(id => !paginatedVideos.some(video => video.id === id))
      : [...new Set([...selectedVideos, ...paginatedVideos.map(video => video.id)])];
    
    onSelectionChange?.(newSelection);
  };

  // Action handlers
  const handleVideoAction = (action: string, video: VideoMetadata) => {
    switch (action) {
      case 'play':
        onVideoPlay?.(video);
        break;
      case 'edit':
        onVideoEdit?.(video);
        break;
      case 'delete':
        onVideoDelete?.(video);
        break;
      case 'share':
        onVideoShare?.(video);
        break;
      case 'download':
        onVideoDownload?.(video);
        break;
    }
  };

  if (loading) {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="animate-pulse space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('text-center py-12', className)}>
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>
          Tentar Novamente
        </Button>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Statistics */}
      <VideoStats videos={videos} />

      {/* Search and Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        {showSearch && (
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar vídeos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        )}
        
        <div className="flex items-center space-x-2">
          {showFilters && (
            <Button
              variant="outline"
              onClick={() => setShowFiltersPanel(!showFiltersPanel)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtros
            </Button>
          )}
          
          {showSort && (
            <Select
              value={`${sort.field}-${sort.order}`}
              onValueChange={(value) => {
                const [field, order] = value.split('-') as [VideoSearchSortBy, VideoSearchOrder];
                setSort({ field, order });
              }}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="uploadDate-desc">Mais Recentes</SelectItem>
                <SelectItem value="uploadDate-asc">Mais Antigos</SelectItem>
                <SelectItem value="title-asc">Título A-Z</SelectItem>
                <SelectItem value="title-desc">Título Z-A</SelectItem>
                <SelectItem value="views-desc">Mais Visualizados</SelectItem>
                <SelectItem value="rating-desc">Melhor Avaliados</SelectItem>
                <SelectItem value="duration-asc">Menor Duração</SelectItem>
                <SelectItem value="duration-desc">Maior Duração</SelectItem>
              </SelectContent>
            </Select>
          )}
          
          <div className="flex items-center border rounded-lg">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFiltersPanel && (
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <Select
                value={filters.category || ''}
                onValueChange={(value) => setFilters(prev => ({ ...prev, category: value as VideoCategory || undefined }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas</SelectItem>
                  <SelectItem value="tutorial">Tutorial</SelectItem>
                  <SelectItem value="webinar">Webinar</SelectItem>
                  <SelectItem value="course">Curso</SelectItem>
                  <SelectItem value="demo">Demo</SelectItem>
                  <SelectItem value="presentation">Apresentação</SelectItem>
                </SelectContent>
              </Select>
              
              <Select
                value={filters.status || ''}
                onValueChange={(value) => setFilters(prev => ({ ...prev, status: value as VideoStatus || undefined }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="published">Publicado</SelectItem>
                  <SelectItem value="draft">Rascunho</SelectItem>
                  <SelectItem value="processing">Processando</SelectItem>
                  <SelectItem value="failed">Falhou</SelectItem>
                  <SelectItem value="archived">Arquivado</SelectItem>
                </SelectContent>
              </Select>
              
              <Select
                value={filters.visibility || ''}
                onValueChange={(value) => setFilters(prev => ({ ...prev, visibility: value as VideoVisibility || undefined }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Visibilidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas</SelectItem>
                  <SelectItem value="public">Público</SelectItem>
                  <SelectItem value="private">Privado</SelectItem>
                  <SelectItem value="unlisted">Não Listado</SelectItem>
                  <SelectItem value="restricted">Restrito</SelectItem>
                </SelectContent>
              </Select>
              
              <Button
                variant="outline"
                onClick={() => setFilters({})}
              >
                Limpar Filtros
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Selection Controls */}
      {allowSelection && paginatedVideos.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={paginatedVideos.every(video => selectedVideos.includes(video.id))}
              onChange={handleSelectAll}
              className="rounded border-gray-300"
            />
            <span className="text-sm text-muted-foreground">
              {selectedVideos.length} de {filteredAndSortedVideos.length} selecionados
            </span>
          </div>
          
          {selectedVideos.length > 0 && (
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Baixar Selecionados
              </Button>
              <Button variant="outline" size="sm">
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir Selecionados
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Results Info */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Mostrando {paginatedVideos.length} de {filteredAndSortedVideos.length} vídeos
        </p>
      </div>

      {/* Video Grid/List */}
      {paginatedVideos.length === 0 ? (
        <div className="text-center py-12">
          <Play className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhum vídeo encontrado</h3>
          <p className="text-muted-foreground">
            {searchQuery || Object.keys(filters).length > 0
              ? 'Tente ajustar os filtros ou termo de busca'
              : 'Nenhum vídeo foi adicionado ainda'}
          </p>
        </div>
      ) : (
        <div
          className={cn(
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
              : 'space-y-4'
          )}
        >
          {paginatedVideos.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              viewMode={viewMode}
              isSelected={selectedVideos.includes(video.id)}
              allowSelection={allowSelection}
              onSelect={() => handleVideoSelect(video.id)}
              onPlay={() => handleVideoAction('play', video)}
              onEdit={() => handleVideoAction('edit', video)}
              onDelete={() => handleVideoAction('delete', video)}
              onShare={() => handleVideoAction('share', video)}
              onDownload={() => handleVideoAction('download', video)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {enablePagination && totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Anterior
          </Button>
          
          <div className="flex items-center space-x-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = i + 1;
              return (
                <Button
                  key={page}
                  variant={currentPage === page ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </Button>
              );
            })}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Próximo
          </Button>
        </div>
      )}
    </div>
  );
};

export default VideoList;