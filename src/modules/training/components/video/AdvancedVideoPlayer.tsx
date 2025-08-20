// components/video/AdvancedVideoPlayer.tsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  SkipBack,
  SkipForward,
  RotateCcw,
  Settings,
  Download,
  Share2,
  Bookmark,
  MessageCircle,
  StickyNote,
  Subtitles,
  Loader2,
  AlertCircle,
  Shield,
  Eye,
  EyeOff,
  Zap,
  Clock,
  BarChart3,
} from 'lucide-react';
import {
  VideoMetadata,
  VideoQuality,
  VideoPlayerSettings,
  VideoAnalyticsEvent,
  VideoComment,
  VideoNote,
  VideoWatermarkSettings,
  VideoSecuritySettings,
  getVideoQualityLabel,
  formatVideoDuration,
} from '../../types/video';
import { cn } from '@/lib/utils';
import { Button } from '@/shared/ui/button';
import { Slider } from '@/shared/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shared/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/shared/ui/popover';
import { Badge } from '@/shared/ui/badge';
import { Card, CardContent } from '@/shared/ui/card';
import { Textarea } from '@/shared/ui/textarea';
import { Input } from '@/shared/ui/input';
import { Switch } from '@/shared/ui/switch';
import { Label } from '@/shared/ui/label';
import { Progress } from '@/shared/ui/progress';
import { toast } from 'sonner';

interface AdvancedVideoPlayerProps {
  video: VideoMetadata;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  controls?: boolean;
  watermark?: VideoWatermarkSettings;
  security?: VideoSecuritySettings;
  className?: string;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onVolumeChange?: (volume: number) => void;
  onQualityChange?: (quality: VideoQuality) => void;
  onSpeedChange?: (speed: number) => void;
  onFullscreenChange?: (isFullscreen: boolean) => void;
  onAnalyticsEvent?: (event: VideoAnalyticsEvent) => void;
  onCommentAdd?: (comment: Omit<VideoComment, 'id' | 'createdAt'>) => void;
  onNoteAdd?: (note: Omit<VideoNote, 'id' | 'createdAt'>) => void;
  comments?: VideoComment[];
  notes?: VideoNote[];
  allowDownload?: boolean;
  allowSharing?: boolean;
  showComments?: boolean;
  showNotes?: boolean;
  showAnalytics?: boolean;
}

interface VideoControlsProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isFullscreen: boolean;
  quality: VideoQuality;
  speed: number;
  isLoading: boolean;
  qualities: VideoQuality[];
  onPlay: () => void;
  onPause: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (volume: number) => void;
  onMute: () => void;
  onFullscreen: () => void;
  onQualityChange: (quality: VideoQuality) => void;
  onSpeedChange: (speed: number) => void;
  onSkipBackward: () => void;
  onSkipForward: () => void;
  onRestart: () => void;
  allowDownload?: boolean;
  allowSharing?: boolean;
  onDownload?: () => void;
  onShare?: () => void;
}

interface VideoWatermarkProps {
  settings: VideoWatermarkSettings;
  playerSize: { width: number; height: number };
}

interface VideoCommentsProps {
  comments: VideoComment[];
  currentTime: number;
  onAddComment: (comment: Omit<VideoComment, 'id' | 'createdAt'>) => void;
  onSeekToComment: (timestamp: number) => void;
}

interface VideoNotesProps {
  notes: VideoNote[];
  currentTime: number;
  onAddNote: (note: Omit<VideoNote, 'id' | 'createdAt'>) => void;
  onSeekToNote: (timestamp: number) => void;
}

interface VideoAnalyticsProps {
  video: VideoMetadata;
  currentTime: number;
  duration: number;
  watchTime: number;
  events: VideoAnalyticsEvent[];
}

// Componente de Watermark
const VideoWatermark: React.FC<VideoWatermarkProps> = ({ settings, playerSize }) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(settings.opacity || 0.7);

  useEffect(() => {
    if (settings.position === 'dynamic') {
      const interval = setInterval(() => {
        setPosition({
          x: Math.random() * (playerSize.width - 200),
          y: Math.random() * (playerSize.height - 50),
        });
      }, settings.moveInterval || 10000);

      return () => clearInterval(interval);
    } else {
      // Static position
      const positions = {
        'top-left': { x: 20, y: 20 },
        'top-right': { x: playerSize.width - 220, y: 20 },
        'bottom-left': { x: 20, y: playerSize.height - 70 },
        'bottom-right': { x: playerSize.width - 220, y: playerSize.height - 70 },
        'center': { x: playerSize.width / 2 - 100, y: playerSize.height / 2 - 25 },
      };
      setPosition(positions[settings.position as keyof typeof positions] || positions['bottom-right']);
    }
  }, [settings, playerSize]);

  if (!settings.enabled) return null;

  return (
    <div
      className="absolute pointer-events-none z-10 transition-all duration-1000"
      style={{
        left: position.x,
        top: position.y,
        opacity,
      }}
    >
      {settings.type === 'text' ? (
        <div
          className="bg-black/50 text-white px-3 py-1 rounded text-sm font-medium"
          style={{ fontSize: settings.size || 14 }}
        >
          {settings.text || 'Solara Nova Energia'}
        </div>
      ) : (
        <img
          src={settings.imageUrl}
          alt="Watermark"
          className="max-w-[200px] max-h-[50px] object-contain"
          style={{ opacity }}
        />
      )}
    </div>
  );
};

// Componente de Controles
const VideoControls: React.FC<VideoControlsProps> = ({
  isPlaying,
  currentTime,
  duration,
  volume,
  isMuted,
  isFullscreen,
  quality,
  speed,
  isLoading,
  qualities,
  onPlay,
  onPause,
  onSeek,
  onVolumeChange,
  onMute,
  onFullscreen,
  onQualityChange,
  onSpeedChange,
  onSkipBackward,
  onSkipForward,
  onRestart,
  allowDownload,
  allowSharing,
  onDownload,
  onShare,
}) => {
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    onSeek(percent * duration);
  };

  const handleProgressDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging) {
      const rect = e.currentTarget.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      onSeek(Math.max(0, Math.min(duration, percent * duration)));
    }
  };

  const speedOptions = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
      {/* Progress Bar */}
      <div className="mb-4">
        <div
          className="relative h-2 bg-white/20 rounded-full cursor-pointer group"
          onClick={handleProgressClick}
          onMouseMove={handleProgressDrag}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          onMouseLeave={() => setIsDragging(false)}
        >
          <div
            className="absolute top-0 left-0 h-full bg-blue-500 rounded-full transition-all"
            style={{ width: `${(currentTime / duration) * 100}%` }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ left: `${(currentTime / duration) * 100}%`, marginLeft: '-8px' }}
          />
        </div>
        
        <div className="flex justify-between text-xs text-white/70 mt-1">
          <span>{formatVideoDuration(currentTime)}</span>
          <span>{formatVideoDuration(duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        {/* Left Controls */}
        <div className="flex items-center space-x-2">
          {/* Play/Pause */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={isPlaying ? onPause : onPlay}
                  disabled={isLoading}
                  className="text-white hover:bg-white/20"
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : isPlaying ? (
                    <Pause className="h-5 w-5" />
                  ) : (
                    <Play className="h-5 w-5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isPlaying ? 'Pausar' : 'Reproduzir'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Skip Backward */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onSkipBackward}
                  className="text-white hover:bg-white/20"
                >
                  <SkipBack className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Voltar 10s</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Skip Forward */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onSkipForward}
                  className="text-white hover:bg-white/20"
                >
                  <SkipForward className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Avançar 10s</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Restart */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onRestart}
                  className="text-white hover:bg-white/20"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Reiniciar</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Volume */}
          <div className="flex items-center space-x-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onMute}
                    onMouseEnter={() => setShowVolumeSlider(true)}
                    className="text-white hover:bg-white/20"
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX className="h-4 w-4" />
                    ) : (
                      <Volume2 className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isMuted ? 'Ativar som' : 'Silenciar'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {showVolumeSlider && (
              <div
                className="w-20"
                onMouseLeave={() => setShowVolumeSlider(false)}
              >
                <Slider
                  value={[isMuted ? 0 : volume * 100]}
                  onValueChange={([value]) => onVolumeChange(value / 100)}
                  max={100}
                  step={1}
                  className="w-full"
                />
              </div>
            )}
          </div>

          {/* Time Display */}
          <div className="text-white text-sm font-mono">
            {formatVideoDuration(currentTime)} / {formatVideoDuration(duration)}
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center space-x-2">
          {/* Download */}
          {allowDownload && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onDownload}
                    className="text-white hover:bg-white/20"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Download</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {/* Share */}
          {allowSharing && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onShare}
                    className="text-white hover:bg-white/20"
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Compartilhar</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {/* Speed */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20 min-w-[3rem]"
              >
                {speed}x
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-32 p-2">
              <div className="space-y-1">
                {speedOptions.map((option) => (
                  <Button
                    key={option}
                    variant={speed === option ? "default" : "ghost"}
                    size="sm"
                    onClick={() => onSpeedChange(option)}
                    className="w-full justify-start"
                  >
                    {option}x
                  </Button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* Quality */}
          {qualities.length > 1 && (
            <Select value={quality} onValueChange={onQualityChange}>
              <SelectTrigger className="w-20 h-8 text-white border-white/20 bg-transparent">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {qualities.map((q) => (
                  <SelectItem key={q} value={q}>
                    {getVideoQualityLabel(q)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Fullscreen */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onFullscreen}
                  className="text-white hover:bg-white/20"
                >
                  {isFullscreen ? (
                    <Minimize className="h-4 w-4" />
                  ) : (
                    <Maximize className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isFullscreen ? 'Sair da tela cheia' : 'Tela cheia'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
};

// Componente de Comentários
const VideoComments: React.FC<VideoCommentsProps> = ({
  comments,
  currentTime,
  onAddComment,
  onSeekToComment,
}) => {
  const [newComment, setNewComment] = useState('');
  const [isAddingComment, setIsAddingComment] = useState(false);

  const handleAddComment = () => {
    if (newComment.trim()) {
      onAddComment({
        content: newComment.trim(),
        timestamp: currentTime,
        author: {
          id: 'current-user',
          name: 'Usuário Atual',
          avatar: '',
        },
      });
      setNewComment('');
      setIsAddingComment(false);
    }
  };

  const sortedComments = [...comments].sort((a, b) => a.timestamp - b.timestamp);

  return (
    <div className="space-y-4">
      {/* Add Comment */}
      <div className="space-y-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsAddingComment(!isAddingComment)}
          className="w-full"
        >
          <MessageCircle className="h-4 w-4 mr-2" />
          Adicionar Comentário
        </Button>
        
        {isAddingComment && (
          <div className="space-y-2">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Adicione um comentário..."
              rows={3}
            />
            <div className="flex space-x-2">
              <Button size="sm" onClick={handleAddComment}>
                Adicionar
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setIsAddingComment(false);
                  setNewComment('');
                }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Comments List */}
      <div className="space-y-3 max-h-60 overflow-y-auto">
        {sortedComments.map((comment) => (
          <Card key={comment.id} className="p-3">
            <div className="flex items-start space-x-3">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="font-medium text-sm">{comment.author.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onSeekToComment(comment.timestamp)}
                    className="text-xs text-blue-600 hover:text-blue-800 p-0 h-auto"
                  >
                    {formatVideoDuration(comment.timestamp)}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">{comment.content}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

// Componente de Notas
const VideoNotes: React.FC<VideoNotesProps> = ({
  notes,
  currentTime,
  onAddNote,
  onSeekToNote,
}) => {
  const [newNote, setNewNote] = useState('');
  const [noteTitle, setNoteTitle] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);

  const handleAddNote = () => {
    if (newNote.trim()) {
      onAddNote({
        title: noteTitle.trim() || 'Nota sem título',
        content: newNote.trim(),
        timestamp: currentTime,
      });
      setNewNote('');
      setNoteTitle('');
      setIsAddingNote(false);
    }
  };

  const sortedNotes = [...notes].sort((a, b) => a.timestamp - b.timestamp);

  return (
    <div className="space-y-4">
      {/* Add Note */}
      <div className="space-y-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsAddingNote(!isAddingNote)}
          className="w-full"
        >
          <StickyNote className="h-4 w-4 mr-2" />
          Adicionar Nota
        </Button>
        
        {isAddingNote && (
          <div className="space-y-2">
            <Input
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
              placeholder="Título da nota (opcional)"
            />
            <Textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Conteúdo da nota..."
              rows={3}
            />
            <div className="flex space-x-2">
              <Button size="sm" onClick={handleAddNote}>
                Salvar
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setIsAddingNote(false);
                  setNewNote('');
                  setNoteTitle('');
                }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Notes List */}
      <div className="space-y-3 max-h-60 overflow-y-auto">
        {sortedNotes.map((note) => (
          <Card key={note.id} className="p-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm">{note.title}</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onSeekToNote(note.timestamp)}
                  className="text-xs text-blue-600 hover:text-blue-800 p-0 h-auto"
                >
                  {formatVideoDuration(note.timestamp)}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">{note.content}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

// Componente de Analytics
const VideoAnalytics: React.FC<VideoAnalyticsProps> = ({
  video,
  currentTime,
  duration,
  watchTime,
  events,
}) => {
  const completionPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;
  const watchPercentage = duration > 0 ? (watchTime / duration) * 100 : 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-3">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-blue-500" />
            <div>
              <p className="text-xs text-muted-foreground">Progresso</p>
              <p className="text-sm font-medium">{completionPercentage.toFixed(1)}%</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-3">
          <div className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4 text-green-500" />
            <div>
              <p className="text-xs text-muted-foreground">Tempo Assistido</p>
              <p className="text-sm font-medium">{formatVideoDuration(watchTime)}</p>
            </div>
          </div>
        </Card>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <span>Progresso de Visualização</span>
          <span>{watchPercentage.toFixed(1)}%</span>
        </div>
        <Progress value={watchPercentage} className="h-2" />
      </div>
      
      {video.analytics && (
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="text-center">
            <p className="text-muted-foreground">Visualizações</p>
            <p className="font-medium">{video.analytics.views.toLocaleString()}</p>
          </div>
          <div className="text-center">
            <p className="text-muted-foreground">Curtidas</p>
            <p className="font-medium">{video.analytics.likes?.toLocaleString() || 0}</p>
          </div>
          <div className="text-center">
            <p className="text-muted-foreground">Comentários</p>
            <p className="font-medium">{video.analytics.comments?.toLocaleString() || 0}</p>
          </div>
        </div>
      )}
    </div>
  );
};

// Componente Principal
export const AdvancedVideoPlayer: React.FC<AdvancedVideoPlayerProps> = ({
  video,
  autoPlay = false,
  muted = false,
  loop = false,
  controls = true,
  watermark,
  security,
  className,
  onPlay,
  onPause,
  onEnded,
  onTimeUpdate,
  onVolumeChange,
  onQualityChange,
  onSpeedChange,
  onFullscreenChange,
  onAnalyticsEvent,
  onCommentAdd,
  onNoteAdd,
  comments = [],
  notes = [],
  allowDownload = false,
  allowSharing = true,
  showComments = true,
  showNotes = true,
  showAnalytics = false,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(muted);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [quality, setQuality] = useState<VideoQuality>(video.qualities?.[0] || '1080p');
  const [speed, setSpeed] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [playerSize, setPlayerSize] = useState({ width: 0, height: 0 });
  const [watchTime, setWatchTime] = useState(0);
  const [analyticsEvents, setAnalyticsEvents] = useState<VideoAnalyticsEvent[]>([]);
  const [sidebarTab, setSidebarTab] = useState<'comments' | 'notes' | 'analytics'>('comments');
  const [showSidebar, setShowSidebar] = useState(false);

  const controlsTimeoutRef = useRef<NodeJS.Timeout>();
  const watchTimeRef = useRef(0);
  const lastTimeRef = useRef(0);

  // Initialize player
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setPlayerSize({ width: rect.width, height: rect.height });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);

    return () => {
      window.removeEventListener('resize', updateSize);
    };
  }, []);

  // Video event handlers
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      setIsLoading(false);
    };

    const handleTimeUpdate = () => {
      const currentTime = video.currentTime;
      setCurrentTime(currentTime);
      onTimeUpdate?.(currentTime, video.duration);

      // Track watch time
      const timeDiff = currentTime - lastTimeRef.current;
      if (timeDiff > 0 && timeDiff < 2) { // Only count if reasonable time diff
        watchTimeRef.current += timeDiff;
        setWatchTime(watchTimeRef.current);
      }
      lastTimeRef.current = currentTime;
    };

    const handlePlay = () => {
      setIsPlaying(true);
      onPlay?.();
      trackEvent('play', { timestamp: video.currentTime });
    };

    const handlePause = () => {
      setIsPlaying(false);
      onPause?.();
      trackEvent('pause', { timestamp: video.currentTime });
    };

    const handleEnded = () => {
      setIsPlaying(false);
      onEnded?.();
      trackEvent('ended', { timestamp: video.duration });
    };

    const handleVolumeChange = () => {
      setVolume(video.volume);
      setIsMuted(video.muted);
      onVolumeChange?.(video.volume);
    };

    const handleLoadStart = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('volumechange', handleVolumeChange);
    video.addEventListener('loadstart', handleLoadStart);
    video.addEventListener('canplay', handleCanPlay);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('volumechange', handleVolumeChange);
      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener('canplay', handleCanPlay);
    };
  }, [onPlay, onPause, onEnded, onTimeUpdate, onVolumeChange]);

  // Auto-hide controls
  useEffect(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }

    if (isPlaying && showControls) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }

    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [isPlaying, showControls]);

  // Fullscreen handling
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFullscreen = !!document.fullscreenElement;
      setIsFullscreen(isFullscreen);
      onFullscreenChange?.(isFullscreen);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [onFullscreenChange]);

  // Analytics event tracking
  const trackEvent = useCallback((type: string, data: Record<string, unknown>) => {
    const event: VideoAnalyticsEvent = {
      id: `${Date.now()}_${Math.random()}`,
      type,
      timestamp: Date.now(),
      data,
    };
    setAnalyticsEvents(prev => [...prev, event]);
    onAnalyticsEvent?.(event);
  }, [onAnalyticsEvent]);

  // Control handlers
  const handlePlay = () => {
    videoRef.current?.play();
  };

  const handlePause = () => {
    videoRef.current?.pause();
  };

  const handleSeek = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      trackEvent('seek', { from: currentTime, to: time });
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      videoRef.current.muted = newVolume === 0;
    }
  };

  const handleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
    }
  };

  const handleFullscreen = () => {
    if (!isFullscreen) {
      containerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const handleQualityChange = (newQuality: VideoQuality) => {
    setQuality(newQuality);
    onQualityChange?.(newQuality);
    trackEvent('quality_change', { quality: newQuality });
  };

  const handleSpeedChange = (newSpeed: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = newSpeed;
      setSpeed(newSpeed);
      onSpeedChange?.(newSpeed);
      trackEvent('speed_change', { speed: newSpeed });
    }
  };

  const handleSkipBackward = () => {
    handleSeek(Math.max(0, currentTime - 10));
  };

  const handleSkipForward = () => {
    handleSeek(Math.min(duration, currentTime + 10));
  };

  const handleRestart = () => {
    handleSeek(0);
  };

  const handleDownload = () => {
    if (video.downloadUrl) {
      const link = document.createElement('a');
      link.href = video.downloadUrl;
      link.download = video.title;
      link.click();
      trackEvent('download', {});
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: video.title,
        text: video.description,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copiado para a área de transferência');
    }
    trackEvent('share', {});
  };

  const handleMouseMove = () => {
    setShowControls(true);
  };

  const handleCommentAdd = (comment: Omit<VideoComment, 'id' | 'createdAt'>) => {
    onCommentAdd?.(comment);
    trackEvent('comment_add', { timestamp: comment.timestamp });
  };

  const handleNoteAdd = (note: Omit<VideoNote, 'id' | 'createdAt'>) => {
    onNoteAdd?.(note);
    trackEvent('note_add', { timestamp: note.timestamp });
  };

  // Security: Prevent right-click and keyboard shortcuts
  const handleContextMenu = (e: React.MouseEvent) => {
    if (security?.preventDownload) {
      e.preventDefault();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (security?.preventDownload) {
      // Prevent common download shortcuts
      if (
        (e.ctrlKey && (e.key === 's' || e.key === 'S')) ||
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && e.key === 'I')
      ) {
        e.preventDefault();
      }
    }
  };

  return (
    <div className={cn('relative bg-black rounded-lg overflow-hidden', className)}>
      <div className="flex">
        {/* Main Player */}
        <div
          ref={containerRef}
          className="relative flex-1 aspect-video"
          onMouseMove={handleMouseMove}
          onContextMenu={handleContextMenu}
          onKeyDown={handleKeyDown}
          tabIndex={0}
        >
          {/* Video Element */}
          <video
            ref={videoRef}
            src={video.streamUrl}
            autoPlay={autoPlay}
            muted={muted}
            loop={loop}
            className="w-full h-full object-contain"
            controlsList={security?.preventDownload ? 'nodownload' : undefined}
            disablePictureInPicture={security?.preventDownload}
          />

          {/* Watermark */}
          {watermark && (
            <VideoWatermark settings={watermark} playerSize={playerSize} />
          )}

          {/* Loading Overlay */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <Loader2 className="h-8 w-8 text-white animate-spin" />
            </div>
          )}

          {/* Controls */}
          {controls && (
            <div
              className={cn(
                'absolute inset-0 transition-opacity duration-300',
                showControls ? 'opacity-100' : 'opacity-0'
              )}
            >
              <VideoControls
                isPlaying={isPlaying}
                currentTime={currentTime}
                duration={duration}
                volume={volume}
                isMuted={isMuted}
                isFullscreen={isFullscreen}
                quality={quality}
                speed={speed}
                isLoading={isLoading}
                qualities={video.qualities || ['1080p']}
                onPlay={handlePlay}
                onPause={handlePause}
                onSeek={handleSeek}
                onVolumeChange={handleVolumeChange}
                onMute={handleMute}
                onFullscreen={handleFullscreen}
                onQualityChange={handleQualityChange}
                onSpeedChange={handleSpeedChange}
                onSkipBackward={handleSkipBackward}
                onSkipForward={handleSkipForward}
                onRestart={handleRestart}
                allowDownload={allowDownload}
                allowSharing={allowSharing}
                onDownload={handleDownload}
                onShare={handleShare}
              />
            </div>
          )}

          {/* Sidebar Toggle */}
          {(showComments || showNotes || showAnalytics) && (
            <div className="absolute top-4 right-4">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowSidebar(!showSidebar)}
                className="bg-black/50 text-white hover:bg-black/70"
              >
                {showSidebar ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          )}
        </div>

        {/* Sidebar */}
        {showSidebar && (showComments || showNotes || showAnalytics) && (
          <div className="w-80 bg-background border-l">
            <div className="p-4">
              {/* Tabs */}
              <div className="flex space-x-1 mb-4">
                {showComments && (
                  <Button
                    variant={sidebarTab === 'comments' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setSidebarTab('comments')}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Comentários
                  </Button>
                )}
                {showNotes && (
                  <Button
                    variant={sidebarTab === 'notes' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setSidebarTab('notes')}
                  >
                    <StickyNote className="h-4 w-4 mr-2" />
                    Notas
                  </Button>
                )}
                {showAnalytics && (
                  <Button
                    variant={sidebarTab === 'analytics' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setSidebarTab('analytics')}
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Analytics
                  </Button>
                )}
              </div>

              {/* Content */}
              {sidebarTab === 'comments' && showComments && (
                <VideoComments
                  comments={comments}
                  currentTime={currentTime}
                  onAddComment={handleCommentAdd}
                  onSeekToComment={handleSeek}
                />
              )}
              
              {sidebarTab === 'notes' && showNotes && (
                <VideoNotes
                  notes={notes}
                  currentTime={currentTime}
                  onAddNote={handleNoteAdd}
                  onSeekToNote={handleSeek}
                />
              )}
              
              {sidebarTab === 'analytics' && showAnalytics && (
                <VideoAnalytics
                  video={video}
                  currentTime={currentTime}
                  duration={duration}
                  watchTime={watchTime}
                  events={analyticsEvents}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdvancedVideoPlayer;