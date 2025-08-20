// =====================================================================================
// PLAYER AVANÇADO DE VÍDEOS - SOLARA NOVA ENERGIA
// =====================================================================================

import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  Bookmark,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  VideoMetadata, 
  VideoProgress, 
  VideoPlayerConfig,
  VideoSubtitle,
  VideoAnalytics,
  VideoInteraction
} from '../../types/video';
import { toast } from 'sonner';

interface AdvancedVideoPlayerProps {
  video: VideoMetadata;
  config?: VideoPlayerConfig;
  subtitles?: VideoSubtitle[];
  onProgress?: (progress: VideoProgress) => void;
  onInteraction?: (interaction: VideoInteraction) => void;
  onComplete?: () => void;
  className?: string;
  autoPlay?: boolean;
  showControls?: boolean;
  watermarkText?: string;
}

interface PlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isFullscreen: boolean;
  playbackRate: number;
  quality: string;
  showControls: boolean;
  showSettings: boolean;
  showSubtitles: boolean;
  buffered: number;
  isLoading: boolean;
}

const PLAYBACK_RATES = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
const QUALITY_OPTIONS = ['360p', '480p', '720p', '1080p', 'auto'];

export const AdvancedVideoPlayer: React.FC<AdvancedVideoPlayerProps> = ({
  video,
  config,
  subtitles = [],
  onProgress,
  onInteraction,
  onComplete,
  className = '',
  autoPlay = false,
  showControls = true,
  watermarkText
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();
  const analyticsRef = useRef<VideoAnalytics>({
    watchTime: 0,
    completionRate: 0,
    interactions: [],
    quality: '720p',
    device: 'desktop',
    browser: navigator.userAgent,
    startTime: new Date(),
    lastHeartbeat: new Date()
  });

  const [state, setState] = useState<PlayerState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    isMuted: false,
    isFullscreen: false,
    playbackRate: 1,
    quality: 'auto',
    showControls: true,
    showSettings: false,
    showSubtitles: false,
    buffered: 0,
    isLoading: true
  });

  /**
   * Registrar interação do usuário
   */
  const recordInteraction = useCallback((type: VideoInteraction['type'], data?: unknown) => {
    const interaction: VideoInteraction = {
      type,
      timestamp: new Date(),
      currentTime: state.currentTime,
      data
    };
    
    analyticsRef.current.interactions.push(interaction);
    
    if (onInteraction) {
      onInteraction(interaction);
    }
  }, [state.currentTime, onInteraction]);

  /**
   * Atualizar progresso
   */
  const updateProgress = useCallback(() => {
    if (!videoRef.current) return;
    
    const currentTime = videoRef.current.currentTime;
    const duration = videoRef.current.duration;
    const buffered = videoRef.current.buffered.length > 0 
      ? videoRef.current.buffered.end(0) 
      : 0;
    
    setState(prev => ({
      ...prev,
      currentTime,
      duration: duration || 0,
      buffered
    }));
    
    // Atualizar analytics
    analyticsRef.current.watchTime = currentTime;
    analyticsRef.current.completionRate = duration > 0 ? (currentTime / duration) * 100 : 0;
    analyticsRef.current.lastHeartbeat = new Date();
    
    // Callback de progresso
    if (onProgress && duration > 0) {
      onProgress({
        currentTime,
        duration,
        percentage: (currentTime / duration) * 100,
        watchTime: analyticsRef.current.watchTime,
        completionRate: analyticsRef.current.completionRate
      });
    }
  }, [onProgress]);

  /**
   * Toggle play/pause
   */
  const togglePlay = useCallback(async () => {
    if (!videoRef.current) return;
    
    try {
      if (state.isPlaying) {
        await videoRef.current.pause();
        recordInteraction('pause');
      } else {
        await videoRef.current.play();
        recordInteraction('play');
      }
    } catch (error) {
      toast.error('Erro ao reproduzir vídeo');
    }
  }, [state.isPlaying, recordInteraction]);

  /**
   * Buscar posição no vídeo
   */
  const seekTo = useCallback((time: number) => {
    if (!videoRef.current) return;
    
    const clampedTime = Math.max(0, Math.min(time, state.duration));
    videoRef.current.currentTime = clampedTime;
    recordInteraction('seek', { from: state.currentTime, to: clampedTime });
  }, [state.currentTime, state.duration, recordInteraction]);

  /**
   * Alterar volume
   */
  const setVolume = useCallback((volume: number) => {
    if (!videoRef.current) return;
    
    const clampedVolume = Math.max(0, Math.min(1, volume));
    videoRef.current.volume = clampedVolume;
    setState(prev => ({ ...prev, volume: clampedVolume, isMuted: clampedVolume === 0 }));
    recordInteraction('volume_change', { volume: clampedVolume });
  }, [recordInteraction]);

  /**
   * Toggle mute
   */
  const toggleMute = useCallback(() => {
    if (!videoRef.current) return;
    
    const newMuted = !state.isMuted;
    videoRef.current.muted = newMuted;
    setState(prev => ({ ...prev, isMuted: newMuted }));
    recordInteraction('mute_toggle', { muted: newMuted });
  }, [state.isMuted, recordInteraction]);

  /**
   * Alterar velocidade de reprodução
   */
  const setPlaybackRate = useCallback((rate: number) => {
    if (!videoRef.current) return;
    
    videoRef.current.playbackRate = rate;
    setState(prev => ({ ...prev, playbackRate: rate, showSettings: false }));
    recordInteraction('playback_rate_change', { rate });
  }, [recordInteraction]);

  /**
   * Alterar qualidade
   */
  const setQuality = useCallback((quality: string) => {
    setState(prev => ({ ...prev, quality, showSettings: false }));
    analyticsRef.current.quality = quality;
    recordInteraction('quality_change', { quality });
    toast.success(`Qualidade alterada para ${quality}`);
  }, [recordInteraction]);

  /**
   * Toggle fullscreen
   */
  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;
    
    try {
      if (!state.isFullscreen) {
        await containerRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      toast.error('Erro ao alterar tela cheia');
    }
  }, [state.isFullscreen]);

  /**
   * Pular tempo
   */
  const skipTime = useCallback((seconds: number) => {
    const newTime = state.currentTime + seconds;
    seekTo(newTime);
  }, [state.currentTime, seekTo]);

  /**
   * Mostrar/ocultar controles
   */
  const showControlsTemporarily = useCallback(() => {
    setState(prev => ({ ...prev, showControls: true }));
    
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    
    controlsTimeoutRef.current = setTimeout(() => {
      if (state.isPlaying) {
        setState(prev => ({ ...prev, showControls: false }));
      }
    }, 3000);
  }, [state.isPlaying]);

  /**
   * Manipular clique na barra de progresso
   */
  const handleProgressClick = useCallback((e: React.MouseEvent) => {
    if (!progressRef.current || !state.duration) return;
    
    const rect = progressRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * state.duration;
    
    seekTo(newTime);
  }, [state.duration, seekTo]);

  /**
   * Formatar tempo
   */
  const formatTime = useCallback((seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }, []);

  /**
   * Prevenir download (contexto)
   */
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    toast.warning('Download não permitido');
  }, []);

  /**
   * Prevenir teclas de atalho
   */
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Prevenir F12, Ctrl+S, Ctrl+U, etc.
    if (
      e.key === 'F12' ||
      (e.ctrlKey && (e.key === 's' || e.key === 'u' || e.key === 'i')) ||
      (e.ctrlKey && e.shiftKey && e.key === 'I')
    ) {
      e.preventDefault();
      toast.warning('Ação não permitida');
      return;
    }
    
    // Atalhos do player
    switch (e.key) {
      case ' ':
      case 'k':
        e.preventDefault();
        togglePlay();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        skipTime(-10);
        break;
      case 'ArrowRight':
        e.preventDefault();
        skipTime(10);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setVolume(Math.min(1, state.volume + 0.1));
        break;
      case 'ArrowDown':
        e.preventDefault();
        setVolume(Math.max(0, state.volume - 0.1));
        break;
      case 'm':
        e.preventDefault();
        toggleMute();
        break;
      case 'f':
        e.preventDefault();
        toggleFullscreen();
        break;
    }
  }, [togglePlay, skipTime, setVolume, state.volume, toggleMute, toggleFullscreen]);

  /**
   * Event listeners do vídeo
   */
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setState(prev => ({ 
        ...prev, 
        duration: video.duration,
        isLoading: false
      }));
    };

    const handlePlay = () => {
      setState(prev => ({ ...prev, isPlaying: true }));
    };

    const handlePause = () => {
      setState(prev => ({ ...prev, isPlaying: false }));
    };

    const handleEnded = () => {
      setState(prev => ({ ...prev, isPlaying: false }));
      recordInteraction('complete');
      if (onComplete) {
        onComplete();
      }
    };

    const handleVolumeChange = () => {
      setState(prev => ({ 
        ...prev, 
        volume: video.volume,
        isMuted: video.muted
      }));
    };

    const handleFullscreenChange = () => {
      setState(prev => ({ 
        ...prev, 
        isFullscreen: !!document.fullscreenElement
      }));
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('volumechange', handleVolumeChange);
    video.addEventListener('timeupdate', updateProgress);
    video.addEventListener('progress', updateProgress);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('volumechange', handleVolumeChange);
      video.removeEventListener('timeupdate', updateProgress);
      video.removeEventListener('progress', updateProgress);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [updateProgress, recordInteraction, onComplete]);

  /**
   * Auto-hide controles
   */
  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      className={`relative bg-black rounded-lg overflow-hidden group ${className}`}
      onMouseMove={showControlsTemporarily}
      onMouseLeave={() => state.isPlaying && setState(prev => ({ ...prev, showControls: false }))}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Vídeo */}
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        src={video.streamingUrl || video.url}
        poster={video.thumbnails?.[0]}
        autoPlay={autoPlay}
        onContextMenu={handleContextMenu}
        controlsList="nodownload nofullscreen noremoteplayback"
        disablePictureInPicture
        style={{ pointerEvents: 'none' }}
      />

      {/* Watermark */}
      {watermarkText && (
        <div className="absolute top-4 right-4 text-white text-sm font-medium opacity-70 pointer-events-none select-none">
          {watermarkText}
        </div>
      )}

      {/* Loading */}
      {state.isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
      )}

      {/* Controles */}
      <AnimatePresence>
        {(state.showControls || !state.isPlaying) && showControls && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none"
          >
            {/* Controles principais */}
            <div className="absolute bottom-0 left-0 right-0 p-4 pointer-events-auto">
              {/* Barra de progresso */}
              <div 
                ref={progressRef}
                className="w-full h-2 bg-white/20 rounded-full mb-4 cursor-pointer group/progress"
                onClick={handleProgressClick}
              >
                {/* Buffer */}
                <div 
                  className="h-full bg-white/40 rounded-full"
                  style={{ width: `${(state.buffered / state.duration) * 100}%` }}
                />
                {/* Progresso */}
                <div 
                  className="h-full bg-blue-500 rounded-full relative"
                  style={{ width: `${(state.currentTime / state.duration) * 100}%` }}
                >
                  <div className="absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-blue-500 rounded-full opacity-0 group-hover/progress:opacity-100 transition-opacity" />
                </div>
              </div>

              {/* Controles inferiores */}
              <div className="flex items-center justify-between text-white">
                <div className="flex items-center space-x-4">
                  {/* Play/Pause */}
                  <button
                    onClick={togglePlay}
                    className="p-2 hover:bg-white/20 rounded-full transition-colors"
                  >
                    {state.isPlaying ? (
                      <Pause className="w-6 h-6" />
                    ) : (
                      <Play className="w-6 h-6" />
                    )}
                  </button>

                  {/* Skip */}
                  <button
                    onClick={() => skipTime(-10)}
                    className="p-2 hover:bg-white/20 rounded-full transition-colors"
                  >
                    <SkipBack className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => skipTime(10)}
                    className="p-2 hover:bg-white/20 rounded-full transition-colors"
                  >
                    <SkipForward className="w-5 h-5" />
                  </button>

                  {/* Volume */}
                  <div className="flex items-center space-x-2 group/volume">
                    <button
                      onClick={toggleMute}
                      className="p-2 hover:bg-white/20 rounded-full transition-colors"
                    >
                      {state.isMuted || state.volume === 0 ? (
                        <VolumeX className="w-5 h-5" />
                      ) : (
                        <Volume2 className="w-5 h-5" />
                      )}
                    </button>
                    <div className="w-0 group-hover/volume:w-20 overflow-hidden transition-all duration-300">
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={state.volume}
                        onChange={(e) => setVolume(parseFloat(e.target.value))}
                        className="w-full h-1 bg-white/20 rounded-full appearance-none slider"
                      />
                    </div>
                  </div>

                  {/* Tempo */}
                  <div className="text-sm font-medium">
                    {formatTime(state.currentTime)} / {formatTime(state.duration)}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {/* Configurações */}
                  <div className="relative">
                    <button
                      onClick={() => setState(prev => ({ ...prev, showSettings: !prev.showSettings }))}
                      className="p-2 hover:bg-white/20 rounded-full transition-colors"
                    >
                      <Settings className="w-5 h-5" />
                    </button>

                    {/* Menu de configurações */}
                    <AnimatePresence>
                      {state.showSettings && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="absolute bottom-full right-0 mb-2 bg-black/90 rounded-lg p-4 min-w-48"
                        >
                          {/* Velocidade */}
                          <div className="mb-4">
                            <h4 className="text-sm font-medium mb-2">Velocidade</h4>
                            <div className="grid grid-cols-4 gap-1">
                              {PLAYBACK_RATES.map(rate => (
                                <button
                                  key={rate}
                                  onClick={() => setPlaybackRate(rate)}
                                  className={`
                                    px-2 py-1 text-xs rounded transition-colors
                                    ${state.playbackRate === rate 
                                      ? 'bg-blue-500 text-white' 
                                      : 'bg-white/20 hover:bg-white/30'
                                    }
                                  `}
                                >
                                  {rate}x
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Qualidade */}
                          <div>
                            <h4 className="text-sm font-medium mb-2">Qualidade</h4>
                            <div className="space-y-1">
                              {QUALITY_OPTIONS.map(quality => (
                                <button
                                  key={quality}
                                  onClick={() => setQuality(quality)}
                                  className={`
                                    w-full text-left px-2 py-1 text-sm rounded transition-colors
                                    ${state.quality === quality 
                                      ? 'bg-blue-500 text-white' 
                                      : 'hover:bg-white/20'
                                    }
                                  `}
                                >
                                  {quality}
                                </button>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Fullscreen */}
                  <button
                    onClick={toggleFullscreen}
                    className="p-2 hover:bg-white/20 rounded-full transition-colors"
                  >
                    {state.isFullscreen ? (
                      <Minimize className="w-5 h-5" />
                    ) : (
                      <Maximize className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Controles centrais */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-auto">
              <button
                onClick={togglePlay}
                className="p-4 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
              >
                {state.isPlaying ? (
                  <Pause className="w-12 h-12 text-white" />
                ) : (
                  <Play className="w-12 h-12 text-white" />
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdvancedVideoPlayer;