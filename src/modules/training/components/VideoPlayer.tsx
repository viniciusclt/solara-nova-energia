import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useVideoPlayer } from '@/hooks/useVideoPlayer';
import { useTrainingProgress } from '@/hooks/useTrainingProgress';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  SkipForward, 
  SkipBack,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface VideoPlayerProps {
  src: string;
  videoId: string;
  moduleId: string;
  title?: string;
  className?: string;
  autoPlay?: boolean;
  poster?: string;
}

export function VideoPlayer({
  src,
  videoId,
  moduleId,
  title,
  className,
  autoPlay = false,
  poster
}: VideoPlayerProps) {
  const { updateVideoProgress, getVideoProgress } = useTrainingProgress(moduleId);
  
  const { videoRef, state, controls, utils } = useVideoPlayer({
    onProgressUpdate: (currentTime, duration, percentage) => {
      // Atualizar progresso no banco de dados
      updateVideoProgress(videoId, Math.round(percentage), Math.round(currentTime));
    },
    progressUpdateInterval: 10 // Atualizar a cada 10 segundos
  });

  const videoProgress = getVideoProgress(videoId);

  // Restaurar posição do vídeo quando carregar
  useEffect(() => {
    if (videoProgress && videoProgress.watch_time_seconds > 0 && videoRef.current) {
      videoRef.current.currentTime = videoProgress.watch_time_seconds;
    }
  }, [videoProgress, videoRef]);

  const progressPercentage = utils.getProgressPercentage();

  return (
    <div className={cn("relative bg-black rounded-lg overflow-hidden group", className)}>
      {/* Vídeo */}
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="w-full h-full object-contain"
        autoPlay={autoPlay}
        preload="metadata"
      >
        Seu navegador não suporta o elemento de vídeo.
      </video>

      {/* Overlay de controles */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        {/* Controles principais */}
        <div className="absolute bottom-0 left-0 right-0 p-4 space-y-3">
          {/* Barra de progresso */}
          <div className="space-y-1">
            <Slider
              value={[progressPercentage]}
              onValueChange={([value]) => controls.seekToPercentage(value)}
              max={100}
              step={0.1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-white/80">
              <span>{utils.formatTime(state.currentTime)}</span>
              <span>{utils.formatTime(state.duration)}</span>
            </div>
          </div>

          {/* Controles de reprodução */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {/* Play/Pause */}
              <Button
                variant="ghost"
                size="sm"
                onClick={controls.togglePlay}
                className="text-white hover:bg-white/20"
              >
                {state.isPlaying ? (
                  <Pause className="h-5 w-5" />
                ) : (
                  <Play className="h-5 w-5" />
                )}
              </Button>

              {/* Skip backward */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => controls.skipBackward(10)}
                className="text-white hover:bg-white/20"
              >
                <SkipBack className="h-4 w-4" />
              </Button>

              {/* Skip forward */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => controls.skipForward(10)}
                className="text-white hover:bg-white/20"
              >
                <SkipForward className="h-4 w-4" />
              </Button>

              {/* Volume */}
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={controls.toggleMute}
                  className="text-white hover:bg-white/20"
                >
                  {state.isMuted || state.volume === 0 ? (
                    <VolumeX className="h-4 w-4" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                </Button>
                <Slider
                  value={[state.isMuted ? 0 : state.volume * 100]}
                  onValueChange={([value]) => controls.setVolume(value / 100)}
                  max={100}
                  className="w-20"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {/* Configurações */}
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20"
              >
                <Settings className="h-4 w-4" />
              </Button>

              {/* Tela cheia */}
              <Button
                variant="ghost"
                size="sm"
                onClick={controls.toggleFullscreen}
                className="text-white hover:bg-white/20"
              >
                <Maximize className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Título do vídeo */}
        {title && (
          <div className="absolute top-4 left-4 right-4">
            <h3 className="text-white text-lg font-semibold truncate">
              {title}
            </h3>
          </div>
        )}

        {/* Indicador de progresso salvo */}
        {videoProgress && videoProgress.progress_percentage > 0 && (
          <div className="absolute top-4 right-4">
            <div className="bg-green-500 text-white px-2 py-1 rounded text-xs">
              {Math.round(videoProgress.progress_percentage)}% concluído
            </div>
          </div>
        )}
      </div>

      {/* Overlay de loading/pause */}
      {!state.isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Button
            variant="ghost"
            size="lg"
            onClick={controls.togglePlay}
            className="bg-black/50 text-white hover:bg-black/70 rounded-full p-4"
          >
            <Play className="h-8 w-8" />
          </Button>
        </div>
      )}
    </div>
  );
}