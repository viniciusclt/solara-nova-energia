// components/video/VideoCard.tsx
import React, { useState, useRef } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  MoreVertical,
  Download,
  Share2,
  Edit,
  Trash2,
  Eye,
  Clock,
  Calendar,
  User,
  Tag,
  Star,
  StarOff,
  Bookmark,
  BookmarkCheck,
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  BarChart3,
  Shield,
  Lock,
  Globe,
  Users,
  CheckCircle,
  AlertCircle,
  Zap,
} from 'lucide-react';
import {
  VideoMetadata,
  VideoVisibility,
  VideoProcessingStatus,
  VideoQuality,
  formatFileSize,
  formatVideoDuration,
  getVideoQualityLabel,
} from '../../types/video';
import { cn } from '@/lib/utils';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Card, CardContent } from '@/shared/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shared/ui/tooltip';
import { Progress } from '@/shared/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { toast } from 'sonner';

interface VideoCardProps {
  video: VideoMetadata;
  variant?: 'grid' | 'list' | 'compact';
  showActions?: boolean;
  showStats?: boolean;
  showProgress?: boolean;
  isSelected?: boolean;
  className?: string;
  onPlay?: (video: VideoMetadata) => void;
  onEdit?: (video: VideoMetadata) => void;
  onDelete?: (video: VideoMetadata) => void;
  onDownload?: (video: VideoMetadata) => void;
  onShare?: (video: VideoMetadata) => void;
  onToggleFavorite?: (video: VideoMetadata) => void;
  onToggleBookmark?: (video: VideoMetadata) => void;
  onLike?: (video: VideoMetadata) => void;
  onDislike?: (video: VideoMetadata) => void;
  onSelect?: (video: VideoMetadata, selected: boolean) => void;
}

interface VideoThumbnailProps {
  video: VideoMetadata;
  variant: 'grid' | 'list' | 'compact';
  onPlay?: (video: VideoMetadata) => void;
}

interface VideoInfoProps {
  video: VideoMetadata;
  variant: 'grid' | 'list' | 'compact';
  showStats?: boolean;
  showProgress?: boolean;
}

interface VideoActionsProps {
  video: VideoMetadata;
  onEdit?: (video: VideoMetadata) => void;
  onDelete?: (video: VideoMetadata) => void;
  onDownload?: (video: VideoMetadata) => void;
  onShare?: (video: VideoMetadata) => void;
  onToggleFavorite?: (video: VideoMetadata) => void;
  onToggleBookmark?: (video: VideoMetadata) => void;
  onLike?: (video: VideoMetadata) => void;
  onDislike?: (video: VideoMetadata) => void;
}

// Componente de Thumbnail do Vídeo
const VideoThumbnail: React.FC<VideoThumbnailProps> = ({ video, variant, onPlay }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const getThumbnailSize = () => {
    switch (variant) {
      case 'grid':
        return 'w-full h-48';
      case 'list':
        return 'w-32 h-20';
      case 'compact':
        return 'w-16 h-12';
      default:
        return 'w-full h-48';
    }
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (video.previewUrl && videoRef.current) {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    onPlay?.(video);
  };

  const getVisibilityIcon = () => {
    switch (video.visibility) {
      case 'public':
        return <Globe className="h-3 w-3" />;
      case 'private':
        return <Lock className="h-3 w-3" />;
      case 'unlisted':
        return <Eye className="h-3 w-3" />;
      case 'restricted':
        return <Users className="h-3 w-3" />;
      default:
        return <Lock className="h-3 w-3" />;
    }
  };

  const getProcessingStatusIcon = () => {
    switch (video.processingStatus) {
      case 'completed':
        return <CheckCircle className="h-3 w-3 text-green-500" />;
      case 'processing':
        return <Zap className="h-3 w-3 text-yellow-500 animate-pulse" />;
      case 'failed':
        return <AlertCircle className="h-3 w-3 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg bg-gray-100 cursor-pointer group',
        getThumbnailSize()
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handlePlay}
    >
      {/* Thumbnail Image */}
      {video.thumbnailUrl ? (
        <img
          src={video.thumbnailUrl}
          alt={video.title}
          className="w-full h-full object-cover transition-transform group-hover:scale-105"
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
          <Play className="h-8 w-8 text-gray-400" />
        </div>
      )}

      {/* Preview Video */}
      {video.previewUrl && (
        <video
          ref={videoRef}
          src={video.previewUrl}
          className={cn(
            'absolute inset-0 w-full h-full object-cover transition-opacity',
            isPlaying ? 'opacity-100' : 'opacity-0'
          )}
          muted
          loop
        />
      )}

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />

      {/* Play Button */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          size="lg"
          className="rounded-full bg-white/90 text-black hover:bg-white"
          onClick={handlePlay}
        >
          <Play className="h-6 w-6 ml-1" />
        </Button>
      </div>

      {/* Duration */}
      {video.duration && (
        <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
          {formatVideoDuration(video.duration)}
        </div>
      )}

      {/* Status Badges */}
      <div className="absolute top-2 left-2 flex space-x-1">
        {/* Visibility */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Badge variant="secondary" className="h-6 w-6 p-0 flex items-center justify-center">
                {getVisibilityIcon()}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p className="capitalize">{video.visibility}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Processing Status */}
        {getProcessingStatusIcon() && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Badge variant="secondary" className="h-6 w-6 p-0 flex items-center justify-center">
                  {getProcessingStatusIcon()}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p className="capitalize">{video.processingStatus}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {/* Security */}
        {video.security?.enableDRM && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Badge variant="secondary" className="h-6 w-6 p-0 flex items-center justify-center">
                  <Shield className="h-3 w-3" />
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>Protegido por DRM</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      {/* Quality Badge */}
      {video.qualities && video.qualities.length > 0 && (
        <div className="absolute top-2 right-2">
          <Badge variant="outline" className="bg-black/70 text-white border-white/20">
            {getVideoQualityLabel(video.qualities[0])}
          </Badge>
        </div>
      )}
    </div>
  );
};

// Componente de Informações do Vídeo
const VideoInfo: React.FC<VideoInfoProps> = ({ video, variant, showStats, showProgress }) => {
  const getInfoLayout = () => {
    switch (variant) {
      case 'grid':
        return 'space-y-2';
      case 'list':
        return 'space-y-1';
      case 'compact':
        return 'space-y-0';
      default:
        return 'space-y-2';
    }
  };

  const getTitleSize = () => {
    switch (variant) {
      case 'grid':
        return 'text-sm font-medium';
      case 'list':
        return 'text-base font-medium';
      case 'compact':
        return 'text-sm font-medium';
      default:
        return 'text-sm font-medium';
    }
  };

  return (
    <div className={cn('flex-1 min-w-0', getInfoLayout())}>
      {/* Title */}
      <h3 className={cn('line-clamp-2', getTitleSize())}>
        {video.title}
      </h3>

      {/* Description */}
      {variant !== 'compact' && video.description && (
        <p className="text-sm text-muted-foreground line-clamp-2">
          {video.description}
        </p>
      )}

      {/* Metadata */}
      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
        {/* Author */}
        {video.author && (
          <div className="flex items-center space-x-1">
            <User className="h-3 w-3" />
            <span>{video.author.name}</span>
          </div>
        )}

        {/* Upload Date */}
        {video.uploadedAt && (
          <div className="flex items-center space-x-1">
            <Calendar className="h-3 w-3" />
            <span>{new Date(video.uploadedAt).toLocaleDateString()}</span>
          </div>
        )}

        {/* Duration */}
        {video.duration && (
          <div className="flex items-center space-x-1">
            <Clock className="h-3 w-3" />
            <span>{formatVideoDuration(video.duration)}</span>
          </div>
        )}

        {/* File Size */}
        {video.fileSize && (
          <span>{formatFileSize(video.fileSize)}</span>
        )}
      </div>

      {/* Tags */}
      {variant !== 'compact' && video.tags && video.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {video.tags.slice(0, 3).map((tag, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
          {video.tags.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{video.tags.length - 3}
            </Badge>
          )}
        </div>
      )}

      {/* Stats */}
      {showStats && video.analytics && (
        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
          <div className="flex items-center space-x-1">
            <Eye className="h-3 w-3" />
            <span>{video.analytics.views.toLocaleString()}</span>
          </div>
          
          {video.analytics.likes !== undefined && (
            <div className="flex items-center space-x-1">
              <ThumbsUp className="h-3 w-3" />
              <span>{video.analytics.likes.toLocaleString()}</span>
            </div>
          )}
          
          {video.analytics.comments !== undefined && (
            <div className="flex items-center space-x-1">
              <MessageCircle className="h-3 w-3" />
              <span>{video.analytics.comments.toLocaleString()}</span>
            </div>
          )}
          
          {video.analytics.averageWatchTime && (
            <div className="flex items-center space-x-1">
              <BarChart3 className="h-3 w-3" />
              <span>{formatVideoDuration(video.analytics.averageWatchTime)}</span>
            </div>
          )}
        </div>
      )}

      {/* Progress */}
      {showProgress && video.watchProgress && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Progresso</span>
            <span>{Math.round(video.watchProgress.percentage)}%</span>
          </div>
          <Progress value={video.watchProgress.percentage} className="h-1" />
        </div>
      )}
    </div>
  );
};

// Componente de Ações do Vídeo
const VideoActions: React.FC<VideoActionsProps> = ({
  video,
  onEdit,
  onDelete,
  onDownload,
  onShare,
  onToggleFavorite,
  onToggleBookmark,
  onLike,
  onDislike,
}) => {
  const handleAction = (action: () => void, e: React.MouseEvent) => {
    e.stopPropagation();
    action();
  };

  return (
    <div className="flex items-center space-x-1">
      {/* Quick Actions */}
      <div className="flex items-center space-x-1">
        {/* Favorite */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => handleAction(() => onToggleFavorite?.(video), e)}
              >
                {video.isFavorite ? (
                  <Star className="h-4 w-4 text-yellow-500 fill-current" />
                ) : (
                  <StarOff className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{video.isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Bookmark */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => handleAction(() => onToggleBookmark?.(video), e)}
              >
                {video.isBookmarked ? (
                  <BookmarkCheck className="h-4 w-4 text-blue-500 fill-current" />
                ) : (
                  <Bookmark className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{video.isBookmarked ? 'Remover dos salvos' : 'Salvar para depois'}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Like/Dislike */}
        <div className="flex items-center">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => handleAction(() => onLike?.(video), e)}
                >
                  <ThumbsUp className={cn(
                    'h-4 w-4',
                    video.userReaction === 'like' ? 'text-green-500 fill-current' : ''
                  )} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Curtir</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => handleAction(() => onDislike?.(video), e)}
                >
                  <ThumbsDown className={cn(
                    'h-4 w-4',
                    video.userReaction === 'dislike' ? 'text-red-500 fill-current' : ''
                  )} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Não curtir</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* More Actions */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onShare?.(video)}>
            <Share2 className="h-4 w-4 mr-2" />
            Compartilhar
          </DropdownMenuItem>
          
          {video.downloadUrl && (
            <DropdownMenuItem onClick={() => onDownload?.(video)}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </DropdownMenuItem>
          )}
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={() => onEdit?.(video)}>
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            onClick={() => onDelete?.(video)}
            className="text-red-600 focus:text-red-600"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

// Componente Principal
export const VideoCard: React.FC<VideoCardProps> = ({
  video,
  variant = 'grid',
  showActions = true,
  showStats = true,
  showProgress = false,
  isSelected = false,
  className,
  onPlay,
  onEdit,
  onDelete,
  onDownload,
  onShare,
  onToggleFavorite,
  onToggleBookmark,
  onLike,
  onDislike,
  onSelect,
}) => {
  const handleCardClick = () => {
    onPlay?.(video);
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    onSelect?.(video, e.target.checked);
  };

  const getCardLayout = () => {
    switch (variant) {
      case 'grid':
        return 'flex flex-col space-y-3';
      case 'list':
        return 'flex space-x-4';
      case 'compact':
        return 'flex space-x-3';
      default:
        return 'flex flex-col space-y-3';
    }
  };

  return (
    <Card 
      className={cn(
        'cursor-pointer transition-all hover:shadow-md',
        isSelected && 'ring-2 ring-blue-500',
        className
      )}
      onClick={handleCardClick}
    >
      <CardContent className={cn('p-4', getCardLayout())}>
        {/* Selection Checkbox */}
        {onSelect && (
          <div className="absolute top-2 left-2 z-10">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={handleSelectChange}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </div>
        )}

        {/* Thumbnail */}
        <VideoThumbnail
          video={video}
          variant={variant}
          onPlay={onPlay}
        />

        {/* Content */}
        <div className="flex-1 flex justify-between items-start space-x-3">
          {/* Info */}
          <VideoInfo
            video={video}
            variant={variant}
            showStats={showStats}
            showProgress={showProgress}
          />

          {/* Actions */}
          {showActions && (
            <div className="flex-shrink-0">
              <VideoActions
                video={video}
                onEdit={onEdit}
                onDelete={onDelete}
                onDownload={onDownload}
                onShare={onShare}
                onToggleFavorite={onToggleFavorite}
                onToggleBookmark={onToggleBookmark}
                onLike={onLike}
                onDislike={onDislike}
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default VideoCard;