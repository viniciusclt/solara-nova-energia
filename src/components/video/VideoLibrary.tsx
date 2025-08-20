// ============================================================================
// VideoLibrary - Componente para biblioteca de vídeos
// ============================================================================

import React, { useState, useCallback } from 'react';
import {
  Search,
  Filter,
  Grid3X3,
  List,
  Upload,
  Play,
  Eye,
  Clock,
  Calendar,
  Tag,
  MoreVertical,
  Edit,
  Trash2,
  Share2,
  Download,
  Star,
  Lock,
  Globe,
  Users,
  Building
} from 'lucide-react';
import {
  VideoLibraryProps,
  VideoUpload,
  VideoFilters,
  VideoContentType,
  VideoPrivacyLevel,
  UploadStatus
} from '@/types/video';
import { useVideoLibrary, useVideoSearch } from '@/hooks/useVideo';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { VideoUploader } from './VideoUploader';
import { VideoCard } from './VideoCard';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

/**
 * Componente de biblioteca de vídeos
 */
export function VideoLibrary({
  filters: initialFilters,
  onVideoSelect,
  onVideoDelete,
  onVideoEdit,
  showUploader = true,
  showFilters = true,
  showSearch = true,
  viewMode: initialViewMode = 'grid',
  className
}: VideoLibraryProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(initialViewMode);
  const [showUploaderDialog, setShowUploaderDialog] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<VideoUpload | null>(null);
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  
  const {
    searchTerm,
    setSearchTerm,
    filters,
    updateFilters,
    clearFilters,
    searchResults,
    isLoading: isSearching
  } = useVideoSearch();
  
  const {
    videos: libraryVideos,
    isLoading: isLoadingLibrary,
    error,
    deleteVideo,
    updateVideo,
    isDeleting,
    isUpdating
  } = useVideoLibrary(initialFilters);
  
  // Use search results if searching, otherwise use library videos
  const videos = searchTerm || Object.keys(filters).length > 0 ? searchResults : libraryVideos;
  const isLoading = isSearching || isLoadingLibrary;

  // Event handlers
  const handleVideoSelect = useCallback((video: VideoUpload) => {
    setSelectedVideo(video);
    onVideoSelect?.(video);
  }, [onVideoSelect]);

  const handleVideoEdit = useCallback((video: VideoUpload) => {
    onVideoEdit?.(video);
  }, [onVideoEdit]);

  const handleVideoDelete = useCallback((video: VideoUpload) => {
    if (window.confirm(`Tem certeza que deseja deletar o vídeo "${video.title}"?`)) {
      deleteVideo(video.id);
      onVideoDelete?.(video);
    }
  }, [deleteVideo, onVideoDelete]);

  const handleVideoShare = useCallback((video: VideoUpload) => {
    const shareUrl = `${window.location.origin}/videos/${video.id}`;
    
    if (navigator.share) {
      navigator.share({
        title: video.title,
        text: video.description,
        url: shareUrl
      });
    } else {
      navigator.clipboard.writeText(shareUrl);
      toast.success('Link do vídeo copiado para a área de transferência');
    }
  }, []);

  const handleFilterChange = useCallback((key: keyof VideoFilters, value: string | undefined) => {
    updateFilters({ [key]: value });
  }, [updateFilters]);

  // Format functions
  const formatDuration = useCallback((seconds: number): string => {
    if (!seconds) return '0:00';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  const getPrivacyIcon = useCallback((privacy: VideoPrivacyLevel) => {
    switch (privacy) {
      case 'public':
        return <Globe className="h-4 w-4" />;
      case 'company_only':
        return <Building className="h-4 w-4" />;
      case 'team_only':
        return <Users className="h-4 w-4" />;
      case 'private':
      case 'unlisted':
      default:
        return <Lock className="h-4 w-4" />;
    }
  }, []);

  const getStatusColor = useCallback((status: UploadStatus) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'processing':
        return 'bg-blue-500';
      case 'uploading':
        return 'bg-yellow-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  }, []);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Biblioteca de Vídeos</h2>
          <p className="text-gray-600">
            {videos.length} vídeo{videos.length !== 1 ? 's' : ''} encontrado{videos.length !== 1 ? 's' : ''}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center border rounded-lg">
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
          
          {/* Upload Button */}
          {showUploader && (
            <Dialog open={showUploaderDialog} onOpenChange={setShowUploaderDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Upload de Vídeos</DialogTitle>
                </DialogHeader>
                <VideoUploader
                  onUploadComplete={() => {
                    setShowUploaderDialog(false);
                    toast.success('Upload concluído com sucesso!');
                  }}
                />
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
      
      {/* Search and Filters */}
      {(showSearch || showFilters) && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              {/* Search */}
              {showSearch && (
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Buscar vídeos..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              )}
              
              {/* Filters */}
              {showFilters && (
                <Popover open={showFiltersPanel} onOpenChange={setShowFiltersPanel}>
                  <PopoverTrigger asChild>
                    <Button variant="outline">
                      <Filter className="h-4 w-4 mr-2" />
                      Filtros
                      {Object.keys(filters).length > 0 && (
                        <Badge variant="secondary" className="ml-2">
                          {Object.keys(filters).length}
                        </Badge>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Filtros</h4>
                        <Button variant="ghost" size="sm" onClick={clearFilters}>
                          Limpar
                        </Button>
                      </div>
                      
                      <Separator />
                      
                      {/* Content Type Filter */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Tipo de Conteúdo</label>
                        <Select
                          value={filters.contentType || ''}
                          onValueChange={(value: VideoContentType) => 
                            handleFilterChange('contentType', value || undefined)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Todos os tipos" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Todos os tipos</SelectItem>
                            <SelectItem value="training">Treinamento</SelectItem>
                            <SelectItem value="presentation">Apresentação</SelectItem>
                            <SelectItem value="demo">Demonstração</SelectItem>
                            <SelectItem value="tutorial">Tutorial</SelectItem>
                            <SelectItem value="meeting">Reunião</SelectItem>
                            <SelectItem value="webinar">Webinar</SelectItem>
                            <SelectItem value="other">Outro</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {/* Privacy Filter */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Privacidade</label>
                        <Select
                          value={filters.privacy || ''}
                          onValueChange={(value: VideoPrivacyLevel) => 
                            handleFilterChange('privacy', value || undefined)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Todas as privacidades" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Todas as privacidades</SelectItem>
                            <SelectItem value="public">Público</SelectItem>
                            <SelectItem value="company_only">Apenas Empresa</SelectItem>
                            <SelectItem value="team_only">Apenas Equipe</SelectItem>
                            <SelectItem value="unlisted">Não Listado</SelectItem>
                            <SelectItem value="private">Privado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {/* Status Filter */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Status</label>
                        <Select
                          value={filters.status || ''}
                          onValueChange={(value: UploadStatus) => 
                            handleFilterChange('status', value || undefined)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Todos os status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Todos os status</SelectItem>
                            <SelectItem value="completed">Concluído</SelectItem>
                            <SelectItem value="processing">Processando</SelectItem>
                            <SelectItem value="uploading">Enviando</SelectItem>
                            <SelectItem value="error">Erro</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {/* Sort By */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Ordenar por</label>
                        <Select
                          value={filters.sortBy || 'createdAt'}
                          onValueChange={(value) => handleFilterChange('sortBy', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="createdAt">Data de Criação</SelectItem>
                            <SelectItem value="updatedAt">Última Atualização</SelectItem>
                            <SelectItem value="title">Título</SelectItem>
                            <SelectItem value="views">Visualizações</SelectItem>
                            <SelectItem value="duration">Duração</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Error State */}
      {error && (
        <Card>
          <CardContent className="flex items-center justify-center h-32">
            <div className="text-center">
              <p className="text-red-600 mb-2">Erro ao carregar vídeos</p>
              <p className="text-sm text-gray-500">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Loading State */}
      {isLoading && (
        <div className={cn(
          'grid gap-4',
          viewMode === 'grid' 
            ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
            : 'grid-cols-1'
        )}>
          {Array.from({ length: 8 }).map((_, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <Skeleton className="w-full h-48 mb-4" />
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {/* Videos Grid/List */}
      {!isLoading && !error && (
        <div className={cn(
          'grid gap-4',
          viewMode === 'grid' 
            ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
            : 'grid-cols-1'
        )}>
          {videos.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              onClick={handleVideoSelect}
              onEdit={handleVideoEdit}
              onDelete={handleVideoDelete}
              onShare={handleVideoShare}
              showActions
              showAnalytics
              className={viewMode === 'list' ? 'flex-row' : ''}
            />
          ))}
        </div>
      )}
      
      {/* Empty State */}
      {!isLoading && !error && videos.length === 0 && (
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <Play className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold mb-2">Nenhum vídeo encontrado</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || Object.keys(filters).length > 0
                  ? 'Tente ajustar os filtros ou termo de busca'
                  : 'Comece fazendo upload do seu primeiro vídeo'
                }
              </p>
              {showUploader && !searchTerm && Object.keys(filters).length === 0 && (
                <Button onClick={() => setShowUploaderDialog(true)}>
                  <Upload className="h-4 w-4 mr-2" />
                  Fazer Upload
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default VideoLibrary;