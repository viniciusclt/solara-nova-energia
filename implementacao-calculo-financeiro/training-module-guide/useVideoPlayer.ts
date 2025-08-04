import { useState, useRef, useEffect, useCallback } from 'react';
import { VideoPlayerState } from '@/types/training';

interface UseVideoPlayerProps {
  onProgressUpdate?: (currentTime: number, duration: number, percentage: number) => void;
  onTimeUpdate?: (currentTime: number) => void;
  progressUpdateInterval?: number; // em segundos
}

export function useVideoPlayer({
  onProgressUpdate,
  onTimeUpdate,
  progressUpdateInterval = 5
}: UseVideoPlayerProps = {}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [state, setState] = useState<VideoPlayerState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    isMuted: false,
    isFullscreen: false
  });

  const [lastProgressUpdate, setLastProgressUpdate] = useState(0);

  // Atualizar estado quando metadados do vídeo carregarem
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setState(prev => ({
        ...prev,
        duration: video.duration
      }));
    };

    const handleTimeUpdate = () => {
      const currentTime = video.currentTime;
      const duration = video.duration;
      const percentage = duration > 0 ? (currentTime / duration) * 100 : 0;

      setState(prev => ({
        ...prev,
        currentTime
      }));

      // Chamar callback de atualização de tempo
      onTimeUpdate?.(currentTime);

      // Atualizar progresso em intervalos específicos
      if (currentTime - lastProgressUpdate >= progressUpdateInterval) {
        onProgressUpdate?.(currentTime, duration, percentage);
        setLastProgressUpdate(currentTime);
      }
    };

    const handlePlay = () => {
      setState(prev => ({ ...prev, isPlaying: true }));
    };

    const handlePause = () => {
      setState(prev => ({ ...prev, isPlaying: false }));
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
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('volumechange', handleVolumeChange);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('volumechange', handleVolumeChange);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [onProgressUpdate, onTimeUpdate, progressUpdateInterval, lastProgressUpdate]);

  const play = useCallback(() => {
    videoRef.current?.play();
  }, []);

  const pause = useCallback(() => {
    videoRef.current?.pause();
  }, []);

  const togglePlay = useCallback(() => {
    if (state.isPlaying) {
      pause();
    } else {
      play();
    }
  }, [state.isPlaying, play, pause]);

  const seek = useCallback((time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  }, []);

  const seekToPercentage = useCallback((percentage: number) => {
    if (videoRef.current && state.duration > 0) {
      const time = (percentage / 100) * state.duration;
      seek(time);
    }
  }, [state.duration, seek]);

  const setVolume = useCallback((volume: number) => {
    if (videoRef.current) {
      videoRef.current.volume = Math.max(0, Math.min(1, volume));
    }
  }, []);

  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
    }
  }, []);

  const enterFullscreen = useCallback(async () => {
    if (videoRef.current && videoRef.current.requestFullscreen) {
      try {
        await videoRef.current.requestFullscreen();
      } catch (error) {
        console.error('Erro ao entrar em tela cheia:', error);
      }
    }
  }, []);

  const exitFullscreen = useCallback(async () => {
    if (document.fullscreenElement && document.exitFullscreen) {
      try {
        await document.exitFullscreen();
      } catch (error) {
        console.error('Erro ao sair da tela cheia:', error);
      }
    }
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (state.isFullscreen) {
      exitFullscreen();
    } else {
      enterFullscreen();
    }
  }, [state.isFullscreen, enterFullscreen, exitFullscreen]);

  const skipForward = useCallback((seconds: number = 10) => {
    if (videoRef.current) {
      const newTime = Math.min(
        videoRef.current.currentTime + seconds,
        state.duration
      );
      seek(newTime);
    }
  }, [state.duration, seek]);

  const skipBackward = useCallback((seconds: number = 10) => {
    if (videoRef.current) {
      const newTime = Math.max(videoRef.current.currentTime - seconds, 0);
      seek(newTime);
    }
  }, [seek]);

  const formatTime = useCallback((time: number): string => {
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  const getProgressPercentage = useCallback((): number => {
    return state.duration > 0 ? (state.currentTime / state.duration) * 100 : 0;
  }, [state.currentTime, state.duration]);

  return {
    videoRef,
    state,
    controls: {
      play,
      pause,
      togglePlay,
      seek,
      seekToPercentage,
      setVolume,
      toggleMute,
      toggleFullscreen,
      skipForward,
      skipBackward
    },
    utils: {
      formatTime,
      getProgressPercentage
    }
  };
}

