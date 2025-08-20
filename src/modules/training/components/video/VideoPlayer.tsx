// components/video/VideoPlayer.tsx
import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Settings,
  SkipBack,
  SkipForward,
  RotateCcw,
  Download,
  Share2,
  MessageCircle,
  Bookmark,
  MoreHorizontal,
} from 'lucide-react';
import {
  VideoMetadata,
  VideoPlayerConfig,
  VideoProgress,
  VideoStreamingUrls,
  VideoState,
  VideoResolution,
  VideoEventType,
  VideoAnalytics,
  VideoInteraction,
  VideoComment,
  VideoNote,
  WatermarkConfig,
  DEFAULT_PLAYER_CONFIG,
  VIDEO_CONSTANTS,
  formatVideoDuration,
  calculateVideoProgress,
} from '../../types/video';
import { cn } from '@/lib/utils';
import { Button } from '@/shared/ui/button';
import { Slider } from '@/shared/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/ui/tooltip';
import { Badge } from '@/shared/ui/badge';
import { Card, CardContent } from '@/shared/ui/card';
import { Textarea } from '@/shared/ui/textarea';
import { Input } from '@/shared/ui/input';
import { toast } from 'sonner';

interface VideoPlayerProps {
  videoId: string;
  metadata: VideoMetadata;
  streamingUrls: VideoStreamingUrls;
  config?: Partial<VideoPlayerConfig>;
  className?: string;
  onProgress?: (progress: VideoProgress) => void;
  onInteraction?: (interaction: VideoInteraction) => void;
  onComment?: (comment: Omit<VideoComment, 'id' | 'createdAt'>) => void;
  onNote?: (note: Omit<VideoNote, 'id' | 'createdAt'>) => void;
  onAnalytics?: (analytics: Partial<VideoAnalytics>) => void;
  autoPlay?: boolean;
  startTime?: number;
  endTime?: number;
  showComments?: boolean;
  showNotes?: boolean;
  allowDownload?: boolean;
  watermark?: WatermarkConfig;
}

interface VideoPlayerState {
  state: VideoState;
  currentTime: number;
  duration: number;
  volume: number;
  muted: boolean;
  fullscreen: boolean;
  quality: VideoResolution;
  playbackRate: number;
  buffered: number;
  seeking: boolean;
  loading: boolean;
  error: string | null;
}

interface VideoControlsProps {
  state: VideoPlayerState;
  config: VideoPlayerConfig;
  onPlay: () => void;
  onPause: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (volume: number) => void;
  onMute: () => void;
  onFullscreen: () => void;
  onQualityChange: (quality: VideoResolution) => void;
  onSpeedChange: (speed: number) => void;
  onRewind: () => void;
  onForward: () => void;
  onDownload?: () => void;
  onShare?: () => void;
  streamingUrls: VideoStreamingUrls;
}

interface VideoWatermarkProps {
  config: WatermarkConfig;
  userId?: string;
  timestamp: number;
}

interface VideoCommentsProps {
  videoId: string;
  currentTime: number;
  onAddComment: (comment: Omit<VideoComment, 'id' | 'createdAt'>) => void;
  comments: VideoComment[];
}

interface VideoNotesProps {
  videoId: string;
  currentTime: number;
  onAddNote: (note: Omit<VideoNote, 'id' | 'createdAt'>) => void;
  notes: VideoNote[];
}

// Componente de Watermark
const VideoWatermark: React.FC<VideoWatermarkProps> = ({ config, userId, timestamp }) => {
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const watermarkText = `${config.text} | ${userId || 'Guest'} | ${new Date(currentTime).toLocaleTimeString()}`;

  const positionStyles = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-16 left-4',
    'bottom-right': 'bottom-16 right-4',
    'center': 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2',
  };

  return (
    <div
      className={cn(
        'absolute pointer-events-none z-50 select-none',
        positionStyles[config.position]
      )}
      style={{
        opacity: config.opacity,
        fontSize: `${config.fontSize}px`,
        color: config.color,
        textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
        fontWeight: 'bold',
        fontFamily: 'monospace',
      }}
    >
      {watermarkText}
    </div>
  );
};

// Componente de Controles
const VideoControls: React.FC<VideoControlsProps> = ({
  state,
  config,
  onPlay,
  onPause,
  onSeek,
  onVolumeChange,
  onMute,
  onFullscreen,
  onQualityChange,
  onSpeedChange,
  onRewind,
  onForward,
  onDownload,
  onShare,
  streamingUrls,
}) => {
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const formatTime = (seconds: number) => formatVideoDuration(seconds);

  const availableQualities = Object.keys(streamingUrls).filter(
    key => key !== 'thumbnail' && key !== 'preview' && streamingUrls[key as keyof VideoStreamingUrls]
  ) as VideoResolution[];

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
      {/* Progress Bar */}
      <div className="mb-4">
        <Slider
          value={[state.currentTime]}
          max={state.duration}
          step={0.1}
          onValueChange={([value]) => onSeek(value)}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-white/70 mt-1">
          <span>{formatTime(state.currentTime)}</span>
          <span>{formatTime(state.duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {/* Play/Pause */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={state.state === 'playing' ? onPause : onPlay}
                  className="text-white hover:bg-white/20"
                >
                  {state.state === 'playing' ? (
                    <Pause className="h-6 w-6" />
                  ) : (
                    <Play className="h-6 w-6" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {state.state === 'playing' ? 'Pausar' : 'Reproduzir'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Rewind */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onRewind}
                  className="text-white hover:bg-white/20"
                >
                  <SkipBack className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Voltar 10s</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Forward */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onForward}
                  className="text-white hover:bg-white/20"
                >
                  <SkipForward className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Avançar 10s</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Volume */}
          <div className="relative">
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
                    {state.muted || state.volume === 0 ? (
                      <VolumeX className="h-5 w-5" />
                    ) : (
                      <Volume2 className="h-5 w-5" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {state.muted ? 'Ativar som' : 'Silenciar'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {showVolumeSlider && (
              <div
                className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-black/80 p-2 rounded"
                onMouseLeave={() => setShowVolumeSlider(false)}
              >
                <Slider
                  value={[state.volume * 100]}
                  max={100}
                  step={1}
                  onValueChange={([value]) => onVolumeChange(value / 100)}
                  orientation="vertical"
                  className="h-20"
                />
              </div>
            )}
          </div>

          {/* Time Display */}
          <div className="text-white text-sm font-mono">
            {formatTime(state.currentTime)} / {formatTime(state.duration)}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Download */}
          {config.enableDownload && onDownload && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onDownload}
                    className="text-white hover:bg-white/20"
                  >
                    <Download className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Baixar vídeo</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {/* Share */}
          {onShare && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onShare}
                    className="text-white hover:bg-white/20"
                  >
                    <Share2 className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Compartilhar</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {/* Settings */}
          <div className="relative">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSettings(!showSettings)}
                    className="text-white hover:bg-white/20"
                  >
                    <Settings className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Configurações</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {showSettings && (
              <div className="absolute bottom-full right-0 mb-2 bg-black/90 p-4 rounded-lg min-w-48">
                <div className="space-y-3">
                  {/* Quality */}
                  <div>
                    <label className="text-white text-sm font-medium block mb-1">
                      Qualidade
                    </label>
                    <Select value={state.quality} onValueChange={onQualityChange}>
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {availableQualities.map((quality) => (
                          <SelectItem key={quality} value={quality}>
                            {quality}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Playback Speed */}
                  <div>
                    <label className="text-white text-sm font-medium block mb-1">
                      Velocidade
                    </label>
                    <Select
                      value={state.playbackRate.toString()}
                      onValueChange={(value) => onSpeedChange(parseFloat(value))}
                    >
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {config.playbackRates.map((rate) => (
                          <SelectItem key={rate} value={rate.toString()}>
                            {rate}x
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}
          </div>

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
                  {state.fullscreen ? (
                    <Minimize className="h-5 w-5" />
                  ) : (
                    <Maximize className="h-5 w-5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {state.fullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
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
  videoId,
  currentTime,
  onAddComment,
  comments,
}) => {
  const [newComment, setNewComment] = useState('');
  const [showComments, setShowComments] = useState(false);

  const handleAddComment = () => {
    if (newComment.trim()) {
      onAddComment({
        videoId,
        userId: 'current-user', // Implementar autenticação
        userName: 'Usuário Atual',
        content: newComment,
        timestamp: currentTime,
      });
      setNewComment('');
      toast.success('Comentário adicionado!');
    }
  };

  const commentsAtCurrentTime = comments.filter(
    (comment) => Math.abs(comment.timestamp - currentTime) < 5
  );

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowComments(!showComments)}
        className="text-white hover:bg-white/20"
      >
        <MessageCircle className="h-5 w-5" />
        {commentsAtCurrentTime.length > 0 && (
          <Badge className="ml-1 bg-red-500 text-white text-xs">
            {commentsAtCurrentTime.length}
          </Badge>
        )}
      </Button>

      {showComments && (
        <Card className="absolute bottom-full right-0 mb-2 w-80 max-h-96 overflow-hidden">
          <CardContent className="p-4">
            <div className="space-y-3">
              <h3 className="font-semibold">Comentários</h3>
              
              {/* Add Comment */}
              <div className="space-y-2">
                <Textarea
                  placeholder="Adicionar comentário..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="min-h-[60px]"
                />
                <Button onClick={handleAddComment} size="sm" className="w-full">
                  Comentar
                </Button>
              </div>

              {/* Comments List */}
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {commentsAtCurrentTime.map((comment) => (
                  <div key={comment.id} className="p-2 bg-gray-50 rounded">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-medium text-sm">{comment.userName}</span>
                      <span className="text-xs text-gray-500">
                        {formatVideoDuration(comment.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm">{comment.content}</p>
                  </div>
                ))}
                {commentsAtCurrentTime.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    Nenhum comentário neste momento
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Componente de Notas
const VideoNotes: React.FC<VideoNotesProps> = ({
  videoId,
  currentTime,
  onAddNote,
  notes,
}) => {
  const [newNote, setNewNote] = useState('');
  const [showNotes, setShowNotes] = useState(false);

  const handleAddNote = () => {
    if (newNote.trim()) {
      onAddNote({
        videoId,
        userId: 'current-user', // Implementar autenticação
        content: newNote,
        timestamp: currentTime,
        isPrivate: true,
      });
      setNewNote('');
      toast.success('Nota adicionada!');
    }
  };

  const userNotes = notes.filter((note) => note.userId === 'current-user');

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowNotes(!showNotes)}
        className="text-white hover:bg-white/20"
      >
        <Bookmark className="h-5 w-5" />
        {userNotes.length > 0 && (
          <Badge className="ml-1 bg-blue-500 text-white text-xs">
            {userNotes.length}
          </Badge>
        )}
      </Button>

      {showNotes && (
        <Card className="absolute bottom-full right-0 mb-2 w-80 max-h-96 overflow-hidden">
          <CardContent className="p-4">
            <div className="space-y-3">
              <h3 className="font-semibold">Minhas Notas</h3>
              
              {/* Add Note */}
              <div className="space-y-2">
                <Textarea
                  placeholder="Adicionar nota..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="min-h-[60px]"
                />
                <Button onClick={handleAddNote} size="sm" className="w-full">
                  Salvar Nota
                </Button>
              </div>

              {/* Notes List */}
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {userNotes.map((note) => (
                  <div key={note.id} className="p-2 bg-blue-50 rounded">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-xs text-blue-600">
                        {formatVideoDuration(note.timestamp)}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(note.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm">{note.content}</p>
                  </div>
                ))}
                {userNotes.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    Nenhuma nota salva
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Componente Principal do Player
export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoId,
  metadata,
  streamingUrls,
  config = {},
  className,
  onProgress,
  onInteraction,
  onComment,
  onNote,
  onAnalytics,
  autoPlay = false,
  startTime = 0,
  endTime,
  showComments = true,
  showNotes = true,
  allowDownload = false,
  watermark,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showControls, setShowControls] = useState(true);
  const [controlsTimeout, setControlsTimeout] = useState<NodeJS.Timeout | null>(null);
  const [comments, setComments] = useState<VideoComment[]>([]);
  const [notes, setNotes] = useState<VideoNote[]>([]);
  
  const playerConfig: VideoPlayerConfig = { ...DEFAULT_PLAYER_CONFIG, ...config };
  
  const [state, setState] = useState<VideoPlayerState>({
    state: 'idle',
    currentTime: startTime,
    duration: 0,
    volume: 1,
    muted: false,
    fullscreen: false,
    quality: playerConfig.defaultQuality,
    playbackRate: 1,
    buffered: 0,
    seeking: false,
    loading: false,
    error: null,
  });

  // Proteção contra download
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Bloquear F12, Ctrl+Shift+I, Ctrl+U, etc.
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && e.key === 'I') ||
        (e.ctrlKey && e.key === 'u') ||
        (e.ctrlKey && e.shiftKey && e.key === 'C')
      ) {
        e.preventDefault();
      }
    };

    const handleSelectStart = (e: Event) => {
      e.preventDefault();
    };

    const handleDragStart = (e: DragEvent) => {
      e.preventDefault();
    };

    if (containerRef.current) {
      const container = containerRef.current;
      container.addEventListener('contextmenu', handleContextMenu);
      container.addEventListener('selectstart', handleSelectStart);
      container.addEventListener('dragstart', handleDragStart);
      document.addEventListener('keydown', handleKeyDown);

      return () => {
        container.removeEventListener('contextmenu', handleContextMenu);
        container.removeEventListener('selectstart', handleSelectStart);
        container.removeEventListener('dragstart', handleDragStart);
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, []);

  // Controle de visibilidade dos controles
  useEffect(() => {
    const handleMouseMove = () => {
      setShowControls(true);
      
      if (controlsTimeout) {
        clearTimeout(controlsTimeout);
      }
      
      const timeout = setTimeout(() => {
        if (state.state === 'playing') {
          setShowControls(false);
        }
      }, 3000);
      
      setControlsTimeout(timeout);
    };

    const handleMouseLeave = () => {
      if (state.state === 'playing') {
        setShowControls(false);
      }
    };

    if (containerRef.current) {
      const container = containerRef.current;
      container.addEventListener('mousemove', handleMouseMove);
      container.addEventListener('mouseleave', handleMouseLeave);

      return () => {
        container.removeEventListener('mousemove', handleMouseMove);
        container.removeEventListener('mouseleave', handleMouseLeave);
        if (controlsTimeout) {
          clearTimeout(controlsTimeout);
        }
      };
    }
  }, [state.state, controlsTimeout]);

  // Event listeners do vídeo
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setState(prev => ({ ...prev, duration: video.duration }));
      if (startTime > 0) {
        video.currentTime = startTime;
      }
    };

    const handleTimeUpdate = () => {
      const currentTime = video.currentTime;
      setState(prev => ({ ...prev, currentTime }));
      
      if (onProgress) {
        const progress: VideoProgress = {
          currentTime,
          duration: video.duration,
          percentage: calculateVideoProgress(currentTime, video.duration),
          watchedSegments: [], // Implementar tracking de segmentos
        };
        onProgress(progress);
      }

      // Verificar se chegou ao fim definido
      if (endTime && currentTime >= endTime) {
        video.pause();
        setState(prev => ({ ...prev, state: 'paused' }));
      }
    };

    const handlePlay = () => {
      setState(prev => ({ ...prev, state: 'playing' }));
      trackInteraction('play');
    };

    const handlePause = () => {
      setState(prev => ({ ...prev, state: 'paused' }));
      trackInteraction('pause');
    };

    const handleEnded = () => {
      setState(prev => ({ ...prev, state: 'ended' }));
      trackInteraction('ended');
    };

    const handleVolumeChange = () => {
      setState(prev => ({
        ...prev,
        volume: video.volume,
        muted: video.muted,
      }));
    };

    const handleWaiting = () => {
      setState(prev => ({ ...prev, state: 'buffering', loading: true }));
    };

    const handleCanPlay = () => {
      setState(prev => ({ ...prev, loading: false }));
    };

    const handleError = () => {
      setState(prev => ({
        ...prev,
        state: 'error',
        error: 'Erro ao carregar o vídeo',
      }));
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('volumechange', handleVolumeChange);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('volumechange', handleVolumeChange);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('error', handleError);
    };
  }, [startTime, endTime, onProgress]);

  // Auto play
  useEffect(() => {
    if (autoPlay && videoRef.current) {
      videoRef.current.play().catch(console.error);
    }
  }, [autoPlay]);

  // Tracking de interações
  const trackInteraction = useCallback((type: string, value?: unknown) => {
    if (onInteraction) {
      const interaction: VideoInteraction = {
        id: `${Date.now()}_${Math.random()}`,
        videoId,
        userId: 'current-user', // Implementar autenticação
        type: type as VideoInteraction['type'],
        timestamp: state.currentTime,
        value,
        createdAt: new Date(),
      };
      onInteraction(interaction);
    }
  }, [videoId, state.currentTime, onInteraction]);

  // Handlers dos controles
  const handlePlay = () => {
    videoRef.current?.play();
  };

  const handlePause = () => {
    videoRef.current?.pause();
  };

  const handleSeek = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      trackInteraction('seek', time);
    }
  };

  const handleVolumeChange = (volume: number) => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
      trackInteraction('volume_change', volume);
    }
  };

  const handleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      trackInteraction('mute', videoRef.current.muted);
    }
  };

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setState(prev => ({ ...prev, fullscreen: true }));
      trackInteraction('fullscreen', true);
    } else {
      document.exitFullscreen();
      setState(prev => ({ ...prev, fullscreen: false }));
      trackInteraction('fullscreen', false);
    }
  };

  const handleQualityChange = (quality: VideoResolution) => {
    if (videoRef.current && streamingUrls[quality]) {
      const currentTime = videoRef.current.currentTime;
      const wasPlaying = !videoRef.current.paused;
      
      videoRef.current.src = streamingUrls[quality];
      videoRef.current.currentTime = currentTime;
      
      if (wasPlaying) {
        videoRef.current.play();
      }
      
      setState(prev => ({ ...prev, quality }));
      trackInteraction('quality_change', quality);
    }
  };

  const handleSpeedChange = (speed: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
      setState(prev => ({ ...prev, playbackRate: speed }));
      trackInteraction('speed_change', speed);
    }
  };

  const handleRewind = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
      trackInteraction('rewind', 10);
    }
  };

  const handleForward = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.min(
        videoRef.current.duration,
        videoRef.current.currentTime + 10
      );
      trackInteraction('forward', 10);
    }
  };

  const handleDownload = () => {
    if (allowDownload && streamingUrls[state.quality]) {
      const link = document.createElement('a');
      link.href = streamingUrls[state.quality];
      link.download = `${metadata.title}.${state.quality}.mp4`;
      link.click();
      trackInteraction('download', state.quality);
    }
  };

  const handleShare = () => {
    const shareData = {
      title: metadata.title,
      text: metadata.description,
      url: window.location.href,
    };

    if (navigator.share) {
      navigator.share(shareData);
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copiado para a área de transferência!');
    }
    
    trackInteraction('share');
  };

  const handleAddComment = (comment: Omit<VideoComment, 'id' | 'createdAt'>) => {
    const newComment: VideoComment = {
      ...comment,
      id: `comment_${Date.now()}_${Math.random()}`,
      createdAt: new Date(),
    };
    setComments(prev => [...prev, newComment]);
    
    if (onComment) {
      onComment(comment);
    }
  };

  const handleAddNote = (note: Omit<VideoNote, 'id' | 'createdAt'>) => {
    const newNote: VideoNote = {
      ...note,
      id: `note_${Date.now()}_${Math.random()}`,
      createdAt: new Date(),
    };
    setNotes(prev => [...prev, newNote]);
    
    if (onNote) {
      onNote(note);
    }
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative bg-black rounded-lg overflow-hidden group',
        'select-none', // Previne seleção de texto
        className
      )}
      style={{ userSelect: 'none' }} // CSS adicional para prevenir seleção
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        src={streamingUrls[state.quality]}
        poster={streamingUrls.thumbnail}
        className="w-full h-full object-contain"
        preload="metadata"
        controlsList="nodownload nofullscreen noremoteplayback"
        disablePictureInPicture={!playerConfig.enablePictureInPicture}
        onContextMenu={(e) => e.preventDefault()}
        style={{ pointerEvents: 'none' }} // Previne interação direta
      />

      {/* Watermark */}
      {(watermark || playerConfig.watermark) && (
        <VideoWatermark
          config={watermark || playerConfig.watermark}
          userId="current-user" // Implementar autenticação
          timestamp={Date.now()}
        />
      )}

      {/* Loading Overlay */}
      {state.loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
      )}

      {/* Error Overlay */}
      {state.error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          <div className="text-center text-white">
            <p className="text-lg font-semibold mb-2">Erro no Player</p>
            <p className="text-sm opacity-75">{state.error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
              className="mt-4"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Recarregar
            </Button>
          </div>
        </div>
      )}

      {/* Controls */}
      {playerConfig.showControls && (
        <div
          className={cn(
            'transition-opacity duration-300',
            showControls ? 'opacity-100' : 'opacity-0'
          )}
        >
          <VideoControls
            state={state}
            config={playerConfig}
            onPlay={handlePlay}
            onPause={handlePause}
            onSeek={handleSeek}
            onVolumeChange={handleVolumeChange}
            onMute={handleMute}
            onFullscreen={handleFullscreen}
            onQualityChange={handleQualityChange}
            onSpeedChange={handleSpeedChange}
            onRewind={handleRewind}
            onForward={handleForward}
            onDownload={allowDownload ? handleDownload : undefined}
            onShare={handleShare}
            streamingUrls={streamingUrls}
          />
        </div>
      )}

      {/* Comments and Notes */}
      {(showComments || showNotes) && (
        <div className="absolute top-4 right-4 flex space-x-2">
          {showComments && (
            <VideoComments
              videoId={videoId}
              currentTime={state.currentTime}
              onAddComment={handleAddComment}
              comments={comments}
            />
          )}
          {showNotes && (
            <VideoNotes
              videoId={videoId}
              currentTime={state.currentTime}
              onAddNote={handleAddNote}
              notes={notes}
            />
          )}
        </div>
      )}

      {/* Click to Play/Pause */}
      <div
        className="absolute inset-0 flex items-center justify-center cursor-pointer"
        onClick={state.state === 'playing' ? handlePause : handlePlay}
      >
        {state.state === 'idle' || state.state === 'paused' ? (
          <div className="bg-black/50 rounded-full p-4 transition-opacity duration-200 hover:bg-black/70">
            <Play className="h-12 w-12 text-white" />
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default VideoPlayer;