// ============================================================================
// VideoPlayer - Componente para reprodução de vídeos
// ============================================================================

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Heart,
  Eye,
  Clock
} from 'lucide-react';
import {
  VideoPlayerProps,
  PlayerSettings,
  VideoQuality,
  SecuritySettings
} from '@/types/video';
import { useVideoPlayer, useVideoAnalytics } from '@/hooks/useVideo';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

/**
 * Componente de player de vídeo com controles customizados
 */
export function VideoPlayer({
  videoId,
  src,
  poster,
  settings: initialSettings,
  security,
  onPlay,
  onPause,
  onEnded,
  onProgress,
  onError,
  className,
  width = '100%',
  height = 'auto'
}: VideoPlayerProps) {
  const [showControls, setShowControls] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const {
    isPlaying,
    currentTime,
    duration,
    volume,
    quality,
    isFullscreen,
    isLoading,
    error,
    play,
    pause,
    seek,
    setVolume,
    setQuality,
    toggleFullscreen,
    toggleMute,
    videoRef,
    streamingUrl,
    isMuted
  } = useVideoPlayer(videoId, initialSettings);
  
  const {
    analytics,
    trackView,
    trackProgress,
    trackCompletion,
    trackInteraction
  } = useVideoAnalytics(videoId || '');

  // Auto-hide controls
  useEffect(() => {
    if (isPlaying && !isHovering) {
      controlsTimeoutRef.current = setTimeout(() => {
        if (Date.now() - lastActivity > 3000) {
          setShowControls(false);
        }
      }, 3000);
    } else {
      setShowControls(true);
    }
    
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [isPlaying, isHovering, lastActivity]);

  // Track analytics
  useEffect(() => {
    if (isPlaying && !analytics?.views) {
      trackView();
    }
  }, [isPlaying, analytics, trackView]);

  useEffect(() => {
    if (currentTime > 0 && duration > 0) {
      trackProgress(currentTime, duration);
      onProgress?.(currentTime, duration);
    }
  }, [currentTime, duration, trackProgress, onProgress]);

  useEffect(() => {
    if (currentTime >= duration && duration > 0) {
      trackCompletion();
      onEnded?.();
    }
  }, [currentTime, duration, trackCompletion, onEnded]);

  // Event handlers
  const handleMouseMove = useCallback(() => {
    setLastActivity(Date.now());
    setShowControls(true);
  }, []);

  const handleMouseEnter = useCallback(() => {
    setIsHovering(true);
    setShowControls(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovering(false);
  }, []);

  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      pause();
      onPause?.();
    } else {
      play();
      onPlay?.();
    }
  }, [isPlaying, play, pause, onPlay, onPause]);

  const handleSeek = useCallback((value: number[]) => {
    const newTime = (value[0] / 100) * duration;
    seek(newTime);
  }, [seek, duration]);

  const handleVolumeChange = useCallback((value: number[]) => {
    setVolume(value[0] / 100);
  }, [setVolume]);

  const handleSkip = useCallback((seconds: number) => {
    const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
    seek(newTime);
  }, [seek, currentTime, duration]);

  const handlePlaybackRateChange = useCallback((rate: string) => {
    const newRate = parseFloat(rate);
    setPlaybackRate(newRate);
    if (videoRef.current) {
      videoRef.current.playbackRate = newRate;
    }
  }, [videoRef]);

  const handleDownload = useCallback(() => {
    if (security?.downloadAllowed === false) {
      toast.error('Download não permitido para este vídeo');
      return;
    }
    
    if (streamingUrl?.url) {
      const link = document.createElement('a');
      link.href = streamingUrl.url;
      link.download = `video_${videoId}.mp4`;
      link.click();
      trackInteraction('share');
    }
  }, [security, streamingUrl, videoId, trackInteraction]);

  const handleShare = useCallback(() => {
    if (navigator.share) {
      navigator.share({
        title: 'Compartilhar Vídeo',
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copiado para a área de transferência');
    }
    trackInteraction('share');
  }, [trackInteraction]);

  const handleLike = useCallback(() => {
    trackInteraction('like');
    toast.success('Vídeo curtido!');
  }, [trackInteraction]);

  // Format time
  const formatTime = useCallback((time: number): string => {
    if (isNaN(time)) return '0:00';
    
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  // Security checks
  const isSecurityBlocked = useCallback(() => {
    if (security?.domainRestriction && security.domainRestriction.length > 0) {
      const currentDomain = window.location.hostname;
      if (!security.domainRestriction.includes(currentDomain)) {
        return true;
      }
    }
    return false;
  }, [security]);

  if (isSecurityBlocked()) {
    return (
      <Card className={cn('w-full', className)}>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <Eye className="h-12 w-12 mx-auto mb-4 text-red-500" />
            <h3 className="text-lg font-semibold mb-2">Acesso Restrito</h3>
            <p className="text-gray-600">Este vídeo não pode ser reproduzido neste domínio.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={cn('w-full', className)}>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <RotateCcw className="h-12 w-12 mx-auto mb-4 text-red-500" />
            <h3 className="text-lg font-semibold mb-2">Erro ao Carregar</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Tentar Novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative bg-black rounded-lg overflow-hidden group',
        className
      )}
      style={{ width, height }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onContextMenu={(e) => security?.rightClickDisabled && e.preventDefault()}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        poster={poster}
        src={streamingUrl?.url || src}
        preload="metadata"
        playsInline
        onError={() => onError?.(new Error('Erro ao carregar o vídeo'))}
      />
      
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
      )}
      
      {/* Play Button Overlay */}
      {!isPlaying && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Button
            size="lg"
            className="rounded-full w-16 h-16 bg-white bg-opacity-20 hover:bg-opacity-30"
            onClick={handlePlayPause}
          >
            <Play className="h-8 w-8 text-white" />
          </Button>
        </div>
      )}
      
      {/* Controls */}
      <div
        className={cn(
          'absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4 transition-opacity duration-300',
          showControls ? 'opacity-100' : 'opacity-0'
        )}
      >
        {/* Progress Bar */}
        <div className="mb-4">
          <Slider
            value={[duration > 0 ? (currentTime / duration) * 100 : 0]}
            onValueChange={handleSeek}
            max={100}
            step={0.1}
            className="w-full"
          />
        </div>
        
        {/* Control Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Play/Pause */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePlayPause}
              className="text-white hover:bg-white hover:bg-opacity-20"
            >
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </Button>
            
            {/* Skip Buttons */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleSkip(-10)}
              className="text-white hover:bg-white hover:bg-opacity-20"
            >
              <SkipBack className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleSkip(10)}
              className="text-white hover:bg-white hover:bg-opacity-20"
            >
              <SkipForward className="h-4 w-4" />
            </Button>
            
            {/* Volume */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMute}
                onMouseEnter={() => setShowVolumeSlider(true)}
                onMouseLeave={() => setShowVolumeSlider(false)}
                className="text-white hover:bg-white hover:bg-opacity-20"
              >
                {isMuted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
              
              {showVolumeSlider && (
                <div className="w-20">
                  <Slider
                    value={[volume * 100]}
                    onValueChange={handleVolumeChange}
                    max={100}
                    step={1}
                  />
                </div>
              )}
            </div>
            
            {/* Time */}
            <div className="text-white text-sm">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Analytics */}
            {analytics && (
              <div className="flex items-center gap-4 text-white text-sm">
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  <span>{analytics.views}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Heart className="h-4 w-4" />
                  <span>{analytics.likes}</span>
                </div>
              </div>
            )}
            
            {/* Action Buttons */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              className="text-white hover:bg-white hover:bg-opacity-20"
            >
              <Heart className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShare}
              className="text-white hover:bg-white hover:bg-opacity-20"
            >
              <Share2 className="h-4 w-4" />
            </Button>
            
            {security?.downloadAllowed !== false && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDownload}
                className="text-white hover:bg-white hover:bg-opacity-20"
              >
                <Download className="h-4 w-4" />
              </Button>
            )}
            
            {/* Settings */}
            <Popover open={showSettings} onOpenChange={setShowSettings}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white hover:bg-opacity-20"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Qualidade</label>
                    <Select value={quality} onValueChange={setQuality}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">Automática</SelectItem>
                        <SelectItem value="240p">240p</SelectItem>
                        <SelectItem value="360p">360p</SelectItem>
                        <SelectItem value="480p">480p</SelectItem>
                        <SelectItem value="720p">720p</SelectItem>
                        <SelectItem value="1080p">1080p</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <label className="text-sm font-medium">Velocidade</label>
                    <Select value={playbackRate.toString()} onValueChange={handlePlaybackRateChange}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0.25">0.25x</SelectItem>
                        <SelectItem value="0.5">0.5x</SelectItem>
                        <SelectItem value="0.75">0.75x</SelectItem>
                        <SelectItem value="1">Normal</SelectItem>
                        <SelectItem value="1.25">1.25x</SelectItem>
                        <SelectItem value="1.5">1.5x</SelectItem>
                        <SelectItem value="2">2x</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            
            {/* Fullscreen */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFullscreen}
              className="text-white hover:bg-white hover:bg-opacity-20"
            >
              {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
      
      {/* Watermark */}
      {security?.watermarkRequired && (
        <div className="absolute top-4 right-4 text-white text-sm bg-black bg-opacity-50 px-2 py-1 rounded">
          Solara Nova Energia
        </div>
      )}
    </div>
  );
}

export default VideoPlayer;