// =====================================================
// PLAYER DE VÍDEO SEGURO PARA TREINAMENTOS
// Sistema de Treinamentos Corporativos - Solara Nova Energia
// Versão: 1.0
// Data: 2024-12-12
// =====================================================

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  SkipBack,
  SkipForward,
  Settings,
  Download,
  Share,
  BookmarkPlus,
  Clock,
  Eye,
  Shield
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Slider } from '../../../components/ui/slider';
import { Badge } from '../../../components/ui/badge';
import { Card, CardContent } from '../../../components/ui/card';
import { useVideoPlayer, useVideoInfo } from '../hooks/useTraining';
import { useAuth } from '../../../contexts/AuthContext';
import { cn } from '../../../lib/utils';

// =====================================================
// INTERFACES
// =====================================================

interface VideoPlayerProps {
  contentId: string;
  videoUrl?: string;
  title: string;
  description?: string;
  duration?: number;
  thumbnail?: string;
  watermarkText?: string;
  onComplete?: () => void;
  onProgress?: (progress: number) => void;
  className?: string;
}

interface VideoControlsProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isFullscreen: boolean;
  onPlayPause: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (volume: number) => void;
  onMute: () => void;
  onFullscreen: () => void;
  onSkip: (seconds: number) => void;
}

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

export function VideoPlayer({
  contentId,
  videoUrl,
  title,
  description,
  duration: propDuration,
  thumbnail,
  watermarkText,
  onComplete,
  onProgress,
  className
}: VideoPlayerProps) {
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Estados do player
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [hasStarted, setHasStarted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  
  // Hooks customizados
  const {
    currentTime,
    duration,
    progressPercentage,
    handleTimeUpdate,
    handleDurationChange,
    handlePlayStateChange,
    handleVideoEnd
  } = useVideoPlayer(contentId);
  
  const { videoInfo, isProcessing, isReady, hasFailed } = useVideoInfo(contentId);
  
  // Timer para esconder controles
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();
  
  // =====================================================
  // EFEITOS
  // =====================================================
  
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    
    const handleLoadedData = () => setIsLoading(false);
    const handleTimeUpdate = () => {
      handleTimeUpdate(video.currentTime);
      onProgress?.(video.currentTime);
    };
    const handleDurationChange = () => handleDurationChange(video.duration);
    const handleEnded = () => {
      handleVideoEnd();
      onComplete?.();
    };
    
    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('durationchange', handleDurationChange);
    video.addEventListener('ended', handleEnded);
    
    return () => {
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('durationchange', handleDurationChange);
      video.removeEventListener('ended', handleEnded);
    };
  }, [handleTimeUpdate, handleDurationChange, handleVideoEnd, onProgress, onComplete]);
  
  // Auto-hide controls
  useEffect(() => {
    if (showControls && isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
    
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [showControls, isPlaying]);
  
  // =====================================================
  // HANDLERS
  // =====================================================
  
  const handlePlayPause = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    
    if (isPlaying) {
      video.pause();
    } else {
      video.play();
      if (!hasStarted) {
        setHasStarted(true);
      }
    }
    
    setIsPlaying(!isPlaying);
    handlePlayStateChange(!isPlaying);
  }, [isPlaying, hasStarted, handlePlayStateChange]);
  
  const handleSeek = useCallback((time: number) => {
    const video = videoRef.current;
    if (!video) return;
    
    video.currentTime = time;
    handleTimeUpdate(time);
  }, [handleTimeUpdate]);
  
  const handleVolumeChange = useCallback((newVolume: number) => {
    const video = videoRef.current;
    if (!video) return;
    
    setVolume(newVolume);
    video.volume = newVolume;
    
    if (newVolume === 0) {
      setIsMuted(true);
    } else if (isMuted) {
      setIsMuted(false);
    }
  }, [isMuted]);
  
  const handleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    video.muted = newMuted;
  }, [isMuted]);
  
  const handleFullscreen = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    
    if (!isFullscreen) {
      if (container.requestFullscreen) {
        container.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);
  
  const handleSkip = useCallback((seconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    
    const newTime = Math.max(0, Math.min(video.duration, video.currentTime + seconds));
    handleSeek(newTime);
  }, [handleSeek]);
  
  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
  }, []);
  
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    switch (e.code) {
      case 'Space':
        e.preventDefault();
        handlePlayPause();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        handleSkip(-10);
        break;
      case 'ArrowRight':
        e.preventDefault();
        handleSkip(10);
        break;
      case 'ArrowUp':
        e.preventDefault();
        handleVolumeChange(Math.min(1, volume + 0.1));
        break;
      case 'ArrowDown':
        e.preventDefault();
        handleVolumeChange(Math.max(0, volume - 0.1));
        break;
      case 'KeyM':
        e.preventDefault();
        handleMute();
        break;
      case 'KeyF':
        e.preventDefault();
        handleFullscreen();
        break;
    }
  }, [handlePlayPause, handleSkip, handleVolumeChange, handleMute, handleFullscreen, volume]);
  
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
  
  // =====================================================
  // RENDERIZAÇÃO CONDICIONAL
  // =====================================================
  
  if (isProcessing) {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Processando Vídeo</h3>
              <p className="text-gray-600">O vídeo está sendo processado. Isso pode levar alguns minutos.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (hasFailed) {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-64 bg-red-50 rounded-lg">
            <div className="text-center">
              <div className="text-red-500 mb-4">
                <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Erro no Processamento</h3>
              <p className="text-gray-600">Houve um erro ao processar o vídeo. Tente fazer upload novamente.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (!isReady || !videoUrl) {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
            <div className="text-center">
              <Play className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Vídeo Indisponível</h3>
              <p className="text-gray-600">O vídeo ainda não está disponível para reprodução.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // =====================================================
  // RENDER PRINCIPAL
  // =====================================================
  
  return (
    <Card className={cn("w-full overflow-hidden", className)}>
      <div 
        ref={containerRef}
        className="relative bg-black group"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setShowControls(false)}
      >
        {/* Vídeo */}
        <video
          ref={videoRef}
          className="w-full h-auto"
          src={videoUrl}
          poster={thumbnail}
          preload="metadata"
          controlsList="nodownload nofullscreen noremoteplayback"
          disablePictureInPicture
          onContextMenu={(e) => e.preventDefault()}
          style={{ maxHeight: isFullscreen ? '100vh' : '500px' }}
        />
        
        {/* Watermark */}
        {watermarkText && (
          <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded text-sm font-medium flex items-center space-x-2">
            <Shield className="h-4 w-4" />
            <span>{watermarkText}</span>
          </div>
        )}
        
        {/* Overlay de Loading */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          </div>
        )}
        
        {/* Overlay de Play/Pause */}
        <AnimatePresence>
          {!hasStarted && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer"
              onClick={handlePlayPause}
            >
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="bg-white/20 backdrop-blur-sm rounded-full p-6"
              >
                <Play className="h-12 w-12 text-white fill-current" />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Controles */}
        <AnimatePresence>
          {showControls && hasStarted && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4"
            >
              <VideoControls
                isPlaying={isPlaying}
                currentTime={currentTime}
                duration={duration || propDuration || 0}
                volume={volume}
                isMuted={isMuted}
                isFullscreen={isFullscreen}
                onPlayPause={handlePlayPause}
                onSeek={handleSeek}
                onVolumeChange={handleVolumeChange}
                onMute={handleMute}
                onFullscreen={handleFullscreen}
                onSkip={handleSkip}
              />
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Indicador de Progresso (sempre visível) */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
          <div 
            className="h-full bg-blue-500 transition-all duration-200"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>
      
      {/* Informações do Vídeo */}
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
            {description && (
              <p className="text-gray-600 text-sm mb-3">{description}</p>
            )}
            
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <div className="flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span>{formatTime(duration || propDuration || 0)}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Eye className="h-4 w-4" />
                <span>{Math.round(progressPercentage)}% assistido</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <BookmarkPlus className="h-4 w-4 mr-1" />
              Salvar
            </Button>
            <Button variant="outline" size="sm" disabled>
              <Download className="h-4 w-4 mr-1" />
              Download
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// =====================================================
// COMPONENTE DE CONTROLES
// =====================================================

function VideoControls({
  isPlaying,
  currentTime,
  duration,
  volume,
  isMuted,
  isFullscreen,
  onPlayPause,
  onSeek,
  onVolumeChange,
  onMute,
  onFullscreen,
  onSkip
}: VideoControlsProps) {
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  
  return (
    <div className="space-y-3">
      {/* Barra de Progresso */}
      <div className="space-y-1">
        <Slider
          value={[currentTime]}
          max={duration}
          step={1}
          onValueChange={([value]) => onSeek(value)}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-white/80">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
      
      {/* Controles Principais */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {/* Play/Pause */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onPlayPause}
            className="text-white hover:bg-white/20"
          >
            {isPlaying ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5" />
            )}
          </Button>
          
          {/* Skip Back */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSkip(-10)}
            className="text-white hover:bg-white/20"
          >
            <SkipBack className="h-4 w-4" />
          </Button>
          
          {/* Skip Forward */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSkip(10)}
            className="text-white hover:bg-white/20"
          >
            <SkipForward className="h-4 w-4" />
          </Button>
          
          {/* Volume */}
          <div 
            className="relative flex items-center"
            onMouseEnter={() => setShowVolumeSlider(true)}
            onMouseLeave={() => setShowVolumeSlider(false)}
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={onMute}
              className="text-white hover:bg-white/20"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </Button>
            
            <AnimatePresence>
              {showVolumeSlider && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="absolute left-full ml-2 bg-black/80 rounded px-3 py-2"
                >
                  <Slider
                    value={[volume]}
                    max={1}
                    step={0.1}
                    onValueChange={([value]) => onVolumeChange(value)}
                    className="w-20"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Settings */}
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/20"
          >
            <Settings className="h-4 w-4" />
          </Button>
          
          {/* Fullscreen */}
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
        </div>
      </div>
    </div>
  );
}

// =====================================================
// UTILITÁRIOS
// =====================================================

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

export default VideoPlayer;