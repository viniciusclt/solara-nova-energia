// ============================================================================
// VideoCard - Componente para exibir informações de vídeo
// ============================================================================

import React, { useState, useCallback } from 'react';
import {
  Play,
  Pause,
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
  Building,
  Heart,
  MessageCircle,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import {
  VideoCardProps,
  VideoUpload,
  VideoPrivacyLevel,
  UploadStatus
} from '@/types/video';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

/**
 * Componente de card de vídeo
 */
export function VideoCard({
  video,
  onClick,
  onEdit,
  onDelete,
  onShare,
  onDownload,
  onToggleFavorite,
  showActions = true,
  showAnalytics = false,
  showProgress = false,
  isSelected = false,
  className
}: VideoCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

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

  const formatViews = useCallback((views: number): string => {
    if (views < 1000) return views.toString();
    if (views < 1000000) return `${(views / 1000).toFixed(1)}K`;
    return `${(views / 1000000).toFixed(1)}M`;
  }, []);

  const formatDate = useCallback((date: string): string => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }, []);

  // Get privacy icon and label
  const getPrivacyInfo = useCallback((privacy: VideoPrivacyLevel) => {
    switch (privacy) {
      case 'public':
        return { icon: <Globe className="h-3 w-3" />, label: 'Público' };
      case 'company_only':
        return { icon: <Building className="h-3 w-3" />, label: 'Empresa' };
      case 'team_only':
        return { icon: <Users className="h-3 w-3" />, label: 'Equipe' };
      case 'unlisted':
        return { icon: <Lock className="h-3 w-3" />, label: 'Não Listado' };
      case 'private':
      default:
        return { icon: <Lock className="h-3 w-3" />, label: 'Privado' };
    }
  }, []);

  // Get status info
  const getStatusInfo = useCallback((status: UploadStatus) => {
    switch (status) {
      case 'completed':
        return { 
          icon: <CheckCircle className="h-3 w-3" />, 
          label: 'Concluído', 
          color: 'text-green-600',
          bgColor: 'bg-green-100'
        };
      case 'processing':
        return { 
          icon: <Loader2 className="h-3 w-3 animate-spin" />, 
          label: 'Processando', 
          color: 'text-blue-600',
          bgColor: 'bg-blue-100'
        };
      case 'uploading':
        return { 
          icon: <TrendingUp className="h-3 w-3" />, 
          label: 'Enviando', 
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-100'
        };
      case 'error':
        return { 
          icon: <AlertCircle className="h-3 w-3" />, 
          label: 'Erro', 
          color: 'text-red-600',
          bgColor: 'bg-red-100'
        };
      default:
        return { 
          icon: <Clock className="h-3 w-3" />, 
          label: 'Pendente', 
          color: 'text-gray-600',
          bgColor: 'bg-gray-100'
        };
    }
  }, []);

  // Event handlers
  const handleClick = useCallback(() => {
    if (video.status === 'completed') {
      onClick?.(video);
    }
  }, [video, onClick]);

  const handlePlayClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (video.status === 'completed') {
      setIsPlaying(!isPlaying);
      onClick?.(video);
    }
  }, [video, isPlaying, onClick]);

  const handleEdit = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(video);
  }, [video, onEdit]);

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(video);
  }, [video, onDelete]);

  const handleShare = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onShare?.(video);
  }, [video, onShare]);

  const handleDownload = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onDownload?.(video);
  }, [video, onDownload]);

  const handleToggleFavorite = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite?.(video);
  }, [video, onToggleFavorite]);

  const privacyInfo = getPrivacyInfo(video.privacy);
  const statusInfo = getStatusInfo(video.status);
  const canPlay = video.status === 'completed';

  return (
    <TooltipProvider>
      <Card 
        className={cn(
          'group cursor-pointer transition-all duration-200 hover:shadow-lg',
          isSelected && 'ring-2 ring-blue-500',
          !canPlay && 'opacity-75 cursor-not-allowed',
          className
        )}
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <CardContent className="p-0">
          {/* Thumbnail */}
          <div className="relative aspect-video bg-gray-100 rounded-t-lg overflow-hidden">
            {/* Thumbnail Image */}
            {video.thumbnail && !imageError ? (
              <img
                src={video.thumbnail.url}
                alt={video.title}
                className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                <Play className="h-12 w-12 text-gray-400" />
              </div>
            )}
            
            {/* Overlay */}
            <div className={cn(
              'absolute inset-0 bg-black/0 transition-all duration-200',
              isHovered && canPlay && 'bg-black/20'
            )} />
            
            {/* Play Button */}
            {canPlay && (
              <Button
                size="sm"
                className={cn(
                  'absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2',
                  'opacity-0 transition-opacity duration-200',
                  isHovered && 'opacity-100'
                )}
                onClick={handlePlayClick}
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
            )}
            
            {/* Duration Badge */}
            {video.metadata?.duration && (
              <Badge 
                variant="secondary" 
                className="absolute bottom-2 right-2 bg-black/70 text-white border-0"
              >
                <Clock className="h-3 w-3 mr-1" />
                {formatDuration(video.metadata.duration)}
              </Badge>
            )}
            
            {/* Status Badge */}
            <Badge 
              className={cn(
                'absolute top-2 left-2 border-0',
                statusInfo.bgColor,
                statusInfo.color
              )}
            >
              {statusInfo.icon}
              <span className="ml-1">{statusInfo.label}</span>
            </Badge>
            
            {/* Actions Menu */}
            {showActions && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className={cn(
                      'absolute top-2 right-2 h-8 w-8 p-0 bg-black/50 hover:bg-black/70 text-white',
                      'opacity-0 transition-opacity duration-200',
                      isHovered && 'opacity-100'
                    )}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {onEdit && (
                    <DropdownMenuItem onClick={handleEdit}>
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                  )}
                  {onShare && (
                    <DropdownMenuItem onClick={handleShare}>
                      <Share2 className="h-4 w-4 mr-2" />
                      Compartilhar
                    </DropdownMenuItem>
                  )}
                  {onDownload && canPlay && (
                    <DropdownMenuItem onClick={handleDownload}>
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </DropdownMenuItem>
                  )}
                  {onToggleFavorite && (
                    <DropdownMenuItem onClick={handleToggleFavorite}>
                      <Star className={cn(
                        'h-4 w-4 mr-2',
                        video.isFavorite && 'fill-yellow-400 text-yellow-400'
                      )} />
                      {video.isFavorite ? 'Remover dos Favoritos' : 'Adicionar aos Favoritos'}
                    </DropdownMenuItem>
                  )}
                  {onDelete && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Deletar
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          
          {/* Content */}
          <div className="p-4 space-y-3">
            {/* Title */}
            <div className="space-y-1">
              <h3 className="font-semibold text-sm line-clamp-2 leading-tight">
                {video.title}
              </h3>
              {video.description && (
                <p className="text-xs text-gray-600 line-clamp-2">
                  {video.description}
                </p>
              )}
            </div>
            
            {/* Progress Bar */}
            {showProgress && video.uploadProgress && video.uploadProgress.percentage < 100 && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">
                    {video.status === 'uploading' ? 'Enviando' : 'Processando'}
                  </span>
                  <span className="text-gray-600">
                    {Math.round(video.uploadProgress.percentage)}%
                  </span>
                </div>
                <Progress value={video.uploadProgress.percentage} className="h-1" />
              </div>
            )}
            
            {/* Metadata */}
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-2">
                {/* Privacy */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1">
                      {privacyInfo.icon}
                      <span>{privacyInfo.label}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Privacidade: {privacyInfo.label}</p>
                  </TooltipContent>
                </Tooltip>
                
                {/* Content Type */}
                {video.contentType && (
                  <Badge variant="outline" className="text-xs px-1 py-0">
                    <Tag className="h-2 w-2 mr-1" />
                    {video.contentType}
                  </Badge>
                )}
              </div>
              
              {/* Date */}
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{formatDate(video.createdAt)}</span>
              </div>
            </div>
            
            {/* Analytics */}
            {showAnalytics && video.analytics && (
              <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t">
                <div className="flex items-center gap-3">
                  {/* Views */}
                  <div className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    <span>{formatViews(video.analytics.totalViews)}</span>
                  </div>
                  
                  {/* Likes */}
                  {video.analytics.totalLikes > 0 && (
                    <div className="flex items-center gap-1">
                      <Heart className="h-3 w-3" />
                      <span>{video.analytics.totalLikes}</span>
                    </div>
                  )}
                  
                  {/* Comments */}
                  {video.analytics.totalComments > 0 && (
                    <div className="flex items-center gap-1">
                      <MessageCircle className="h-3 w-3" />
                      <span>{video.analytics.totalComments}</span>
                    </div>
                  )}
                </div>
                
                {/* File Size */}
                {video.metadata?.fileSize && (
                  <span>{formatFileSize(video.metadata.fileSize)}</span>
                )}
              </div>
            )}
            
            {/* Author */}
            {video.uploadedBy && (
              <div className="flex items-center gap-2 pt-2 border-t">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={video.uploadedBy.avatar} />
                  <AvatarFallback className="text-xs">
                    {video.uploadedBy.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs text-gray-600">
                  {video.uploadedBy.name}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}

export default VideoCard;