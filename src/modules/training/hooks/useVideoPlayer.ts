// hooks/useVideoPlayer.ts
import { useState, useRef, useEffect, useCallback } from 'react';
import {
  VideoMetadata,
  VideoPlayerConfig,
  VideoProgress,
  VideoStreamingUrls,
  VideoState,
  VideoResolution,
  VideoAnalytics,
  VideoInteraction,
  VideoComment,
  VideoNote,
  VideoPlayerState,
  VideoEventType,
  DEFAULT_PLAYER_CONFIG,
  calculateVideoProgress,
} from '../types/video';
import { VideoUploadService } from '../services/videoUploadService';

interface UseVideoPlayerOptions {
  videoId: string;
  metadata: VideoMetadata;
  streamingUrls: VideoStreamingUrls;
  config?: Partial<VideoPlayerConfig>;
  autoPlay?: boolean;
  startTime?: number;
  endTime?: number;
  onProgress?: (progress: VideoProgress) => void;
  onInteraction?: (interaction: VideoInteraction) => void;
  onAnalytics?: (analytics: Partial<VideoAnalytics>) => void;
  onError?: (error: string) => void;
}

interface UseVideoPlayerReturn {
  // Refs
  videoRef: React.RefObject<HTMLVideoElement>;
  containerRef: React.RefObject<HTMLDivElement>;
  
  // State
  state: VideoPlayerState;
  showControls: boolean;
  comments: VideoComment[];
  notes: VideoNote[];
  
  // Actions
  play: () => Promise<void>;
  pause: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  toggleFullscreen: () => void;
  changeQuality: (quality: VideoResolution) => void;
  changeSpeed: (speed: number) => void;
  rewind: (seconds?: number) => void;
  forward: (seconds?: number) => void;
  restart: () => void;
  
  // Comments & Notes
  addComment: (comment: Omit<VideoComment, 'id' | 'createdAt'>) => void;
  addNote: (note: Omit<VideoNote, 'id' | 'createdAt'>) => void;
  removeComment: (commentId: string) => void;
  removeNote: (noteId: string) => void;
  
  // Analytics
  trackEvent: (event: VideoEventType, data?: unknown) => void;
  getAnalytics: () => VideoAnalytics;
  
  // Utils
  formatTime: (seconds: number) => string;
  getProgress: () => VideoProgress;
  isPlaying: boolean;
  isPaused: boolean;
  isEnded: boolean;
  isBuffering: boolean;
  hasError: boolean;
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

interface VideoAnalyticsData {
  playCount: number;
  pauseCount: number;
  seekCount: number;
  totalWatchTime: number;
  averageWatchTime: number;
  completionRate: number;
  qualityChanges: number;
  speedChanges: number;
  fullscreenUsage: number;
  interactionCount: number;
  lastWatchedTime: number;
  watchedSegments: Array<{ start: number; end: number }>;
  engagementScore: number;
}

export const useVideoPlayer = (options: UseVideoPlayerOptions): UseVideoPlayerReturn => {
  const {
    videoId,
    metadata,
    streamingUrls,
    config = {},
    autoPlay = false,
    startTime = 0,
    endTime,
    onProgress,
    onInteraction,
    onAnalytics,
    onError,
  } = options;

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const analyticsRef = useRef<VideoAnalyticsData>({
    playCount: 0,
    pauseCount: 0,
    seekCount: 0,
    totalWatchTime: 0,
    averageWatchTime: 0,
    completionRate: 0,
    qualityChanges: 0,
    speedChanges: 0,
    fullscreenUsage: 0,
    interactionCount: 0,
    lastWatchedTime: 0,
    watchedSegments: [],
    engagementScore: 0,
  });
  const watchStartTimeRef = useRef<number>(0);
  const lastTimeUpdateRef = useRef<number>(0);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  const [showControls, setShowControls] = useState(true);
  const [comments, setComments] = useState<VideoComment[]>([]);
  const [notes, setNotes] = useState<VideoNote[]>([]);

  // Computed properties
  const isPlaying = state.state === 'playing';
  const isPaused = state.state === 'paused';
  const isEnded = state.state === 'ended';
  const isBuffering = state.state === 'buffering';
  const hasError = state.state === 'error';

  // Format time utility
  const formatTime = useCallback((seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Get current progress
  const getProgress = useCallback((): VideoProgress => {
    return {
      currentTime: state.currentTime,
      duration: state.duration,
      percentage: calculateVideoProgress(state.currentTime, state.duration),
      watchedSegments: analyticsRef.current.watchedSegments,
    };
  }, [state.currentTime, state.duration]);

  // Track analytics event
  const trackEvent = useCallback((event: VideoEventType, data?: unknown) => {
    const analytics = analyticsRef.current;
    analytics.interactionCount++;

    switch (event) {
      case 'play':
        analytics.playCount++;
        watchStartTimeRef.current = Date.now();
        break;
      case 'pause':
        analytics.pauseCount++;
        if (watchStartTimeRef.current > 0) {
          analytics.totalWatchTime += (Date.now() - watchStartTimeRef.current) / 1000;
        }
        break;
      case 'seek':
        analytics.seekCount++;
        break;
      case 'quality_change':
        analytics.qualityChanges++;
        break;
      case 'speed_change':
        analytics.speedChanges++;
        break;
      case 'fullscreen':
        if (data) analytics.fullscreenUsage++;
        break;
      case 'ended':
        analytics.completionRate = 100;
        if (watchStartTimeRef.current > 0) {
          analytics.totalWatchTime += (Date.now() - watchStartTimeRef.current) / 1000;
        }
        break;
    }

    // Calculate engagement score
    const totalDuration = state.duration || 1;
    const watchPercentage = (analytics.totalWatchTime / totalDuration) * 100;
    const interactionRate = analytics.interactionCount / (totalDuration / 60); // interactions per minute
    analytics.engagementScore = Math.min(100, (watchPercentage * 0.7) + (interactionRate * 0.3));

    // Track interaction
    if (onInteraction) {
      const interaction: VideoInteraction = {
        id: `${Date.now()}_${Math.random()}`,
        videoId,
        userId: 'current-user', // TODO: Implement authentication
        type: event,
        timestamp: state.currentTime,
        value: data,
        createdAt: new Date(),
      };
      onInteraction(interaction);
    }
  }, [videoId, state.currentTime, state.duration, onInteraction]);

  // Get analytics data
  const getAnalytics = useCallback((): VideoAnalytics => {
    const analytics = analyticsRef.current;
    return {
      id: `analytics_${videoId}`,
      videoId,
      userId: 'current-user', // TODO: Implement authentication
      totalViews: analytics.playCount,
      totalWatchTime: analytics.totalWatchTime,
      averageWatchTime: analytics.totalWatchTime / Math.max(1, analytics.playCount),
      completionRate: analytics.completionRate,
      engagementScore: analytics.engagementScore,
      interactions: analytics.interactionCount,
      qualityDistribution: { [state.quality]: 100 }, // Simplified
      deviceInfo: {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
      },
      geolocation: null, // TODO: Implement geolocation
      referrer: document.referrer,
      sessionDuration: analytics.totalWatchTime,
      bounceRate: analytics.completionRate < 10 ? 100 : 0,
      retentionRate: analytics.completionRate,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }, [videoId, state.quality]);

  // Video actions
  const play = useCallback(async () => {
    if (videoRef.current) {
      try {
        await videoRef.current.play();
        trackEvent('play');
      } catch (error) {
        console.error('Error playing video:', error);
        setState(prev => ({ ...prev, error: 'Erro ao reproduzir o vídeo' }));
        onError?.('Erro ao reproduzir o vídeo');
      }
    }
  }, [trackEvent, onError]);

  const pause = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.pause();
      trackEvent('pause');
    }
  }, [trackEvent]);

  const seek = useCallback((time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, Math.min(time, state.duration));
      trackEvent('seek', time);
    }
  }, [state.duration, trackEvent]);

  const setVolume = useCallback((volume: number) => {
    if (videoRef.current) {
      videoRef.current.volume = Math.max(0, Math.min(1, volume));
      trackEvent('volume_change', volume);
    }
  }, [trackEvent]);

  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      trackEvent('mute', videoRef.current.muted);
    }
  }, [trackEvent]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setState(prev => ({ ...prev, fullscreen: true }));
      trackEvent('fullscreen', true);
    } else {
      document.exitFullscreen();
      setState(prev => ({ ...prev, fullscreen: false }));
      trackEvent('fullscreen', false);
    }
  }, [trackEvent]);

  const changeQuality = useCallback((quality: VideoResolution) => {
    if (videoRef.current && streamingUrls[quality]) {
      const currentTime = videoRef.current.currentTime;
      const wasPlaying = !videoRef.current.paused;
      
      setState(prev => ({ ...prev, loading: true }));
      
      videoRef.current.src = streamingUrls[quality];
      videoRef.current.currentTime = currentTime;
      
      if (wasPlaying) {
        videoRef.current.play();
      }
      
      setState(prev => ({ ...prev, quality, loading: false }));
      trackEvent('quality_change', quality);
    }
  }, [streamingUrls, trackEvent]);

  const changeSpeed = useCallback((speed: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
      setState(prev => ({ ...prev, playbackRate: speed }));
      trackEvent('speed_change', speed);
    }
  }, [trackEvent]);

  const rewind = useCallback((seconds: number = 10) => {
    if (videoRef.current) {
      const newTime = Math.max(0, videoRef.current.currentTime - seconds);
      videoRef.current.currentTime = newTime;
      trackEvent('rewind', seconds);
    }
  }, [trackEvent]);

  const forward = useCallback((seconds: number = 10) => {
    if (videoRef.current) {
      const newTime = Math.min(state.duration, videoRef.current.currentTime + seconds);
      videoRef.current.currentTime = newTime;
      trackEvent('forward', seconds);
    }
  }, [state.duration, trackEvent]);

  const restart = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = startTime;
      trackEvent('restart');
    }
  }, [startTime, trackEvent]);

  // Comments and notes
  const addComment = useCallback((comment: Omit<VideoComment, 'id' | 'createdAt'>) => {
    const newComment: VideoComment = {
      ...comment,
      id: `comment_${Date.now()}_${Math.random()}`,
      createdAt: new Date(),
    };
    setComments(prev => [...prev, newComment]);
    trackEvent('comment_added');
  }, [trackEvent]);

  const addNote = useCallback((note: Omit<VideoNote, 'id' | 'createdAt'>) => {
    const newNote: VideoNote = {
      ...note,
      id: `note_${Date.now()}_${Math.random()}`,
      createdAt: new Date(),
    };
    setNotes(prev => [...prev, newNote]);
    trackEvent('note_added');
  }, [trackEvent]);

  const removeComment = useCallback((commentId: string) => {
    setComments(prev => prev.filter(comment => comment.id !== commentId));
    trackEvent('comment_removed');
  }, [trackEvent]);

  const removeNote = useCallback((noteId: string) => {
    setNotes(prev => prev.filter(note => note.id !== noteId));
    trackEvent('note_removed');
  }, [trackEvent]);

  // Controls visibility management
  useEffect(() => {
    const handleMouseMove = () => {
      setShowControls(true);
      
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      
      controlsTimeoutRef.current = setTimeout(() => {
        if (isPlaying) {
          setShowControls(false);
        }
      }, 3000);
    };

    const handleMouseLeave = () => {
      if (isPlaying) {
        setShowControls(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!containerRef.current?.contains(document.activeElement)) return;

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          isPlaying ? pause() : play();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          rewind(5);
          break;
        case 'ArrowRight':
          e.preventDefault();
          forward(5);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setVolume(Math.min(1, state.volume + 0.1));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setVolume(Math.max(0, state.volume - 0.1));
          break;
        case 'KeyM':
          e.preventDefault();
          toggleMute();
          break;
        case 'KeyF':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'Digit0':
        case 'Numpad0':
          e.preventDefault();
          seek(0);
          break;
        case 'Digit1':
        case 'Numpad1':
          e.preventDefault();
          seek(state.duration * 0.1);
          break;
        case 'Digit2':
        case 'Numpad2':
          e.preventDefault();
          seek(state.duration * 0.2);
          break;
        case 'Digit3':
        case 'Numpad3':
          e.preventDefault();
          seek(state.duration * 0.3);
          break;
        case 'Digit4':
        case 'Numpad4':
          e.preventDefault();
          seek(state.duration * 0.4);
          break;
        case 'Digit5':
        case 'Numpad5':
          e.preventDefault();
          seek(state.duration * 0.5);
          break;
        case 'Digit6':
        case 'Numpad6':
          e.preventDefault();
          seek(state.duration * 0.6);
          break;
        case 'Digit7':
        case 'Numpad7':
          e.preventDefault();
          seek(state.duration * 0.7);
          break;
        case 'Digit8':
        case 'Numpad8':
          e.preventDefault();
          seek(state.duration * 0.8);
          break;
        case 'Digit9':
        case 'Numpad9':
          e.preventDefault();
          seek(state.duration * 0.9);
          break;
      }
    };

    if (containerRef.current) {
      const container = containerRef.current;
      container.addEventListener('mousemove', handleMouseMove);
      container.addEventListener('mouseleave', handleMouseLeave);
      document.addEventListener('keydown', handleKeyDown);

      return () => {
        container.removeEventListener('mousemove', handleMouseMove);
        container.removeEventListener('mouseleave', handleMouseLeave);
        document.removeEventListener('keydown', handleKeyDown);
        if (controlsTimeoutRef.current) {
          clearTimeout(controlsTimeoutRef.current);
        }
      };
    }
  }, [isPlaying, state.volume, state.duration, play, pause, rewind, forward, setVolume, toggleMute, toggleFullscreen, seek]);

  // Video event listeners
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
      
      // Track watched segments
      const analytics = analyticsRef.current;
      if (Math.abs(currentTime - lastTimeUpdateRef.current) < 2) {
        // Continuous watching
        const lastSegment = analytics.watchedSegments[analytics.watchedSegments.length - 1];
        if (lastSegment && Math.abs(lastSegment.end - lastTimeUpdateRef.current) < 2) {
          lastSegment.end = currentTime;
        } else {
          analytics.watchedSegments.push({ start: lastTimeUpdateRef.current, end: currentTime });
        }
      }
      lastTimeUpdateRef.current = currentTime;
      
      if (onProgress) {
        onProgress(getProgress());
      }

      // Check if reached end time
      if (endTime && currentTime >= endTime) {
        video.pause();
        setState(prev => ({ ...prev, state: 'paused' }));
      }
    };

    const handlePlay = () => {
      setState(prev => ({ ...prev, state: 'playing' }));
    };

    const handlePause = () => {
      setState(prev => ({ ...prev, state: 'paused' }));
    };

    const handleEnded = () => {
      setState(prev => ({ ...prev, state: 'ended' }));
      trackEvent('ended');
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
      const errorMessage = 'Erro ao carregar o vídeo';
      setState(prev => ({
        ...prev,
        state: 'error',
        error: errorMessage,
      }));
      onError?.(errorMessage);
    };

    const handleProgress = () => {
      if (video.buffered.length > 0) {
        const buffered = (video.buffered.end(video.buffered.length - 1) / video.duration) * 100;
        setState(prev => ({ ...prev, buffered }));
      }
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
    video.addEventListener('progress', handleProgress);

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
      video.removeEventListener('progress', handleProgress);
    };
  }, [startTime, endTime, onProgress, getProgress, trackEvent, onError]);

  // Auto play
  useEffect(() => {
    if (autoPlay && videoRef.current && state.duration > 0) {
      play().catch(console.error);
    }
  }, [autoPlay, state.duration, play]);

  // Analytics reporting
  useEffect(() => {
    const interval = setInterval(() => {
      if (onAnalytics && isPlaying) {
        onAnalytics(getAnalytics());
      }
    }, 30000); // Report every 30 seconds

    return () => clearInterval(interval);
  }, [onAnalytics, isPlaying, getAnalytics]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      
      // Final analytics report
      if (onAnalytics) {
        onAnalytics(getAnalytics());
      }
    };
  }, [onAnalytics, getAnalytics]);

  return {
    // Refs
    videoRef,
    containerRef,
    
    // State
    state,
    showControls,
    comments,
    notes,
    
    // Actions
    play,
    pause,
    seek,
    setVolume,
    toggleMute,
    toggleFullscreen,
    changeQuality,
    changeSpeed,
    rewind,
    forward,
    restart,
    
    // Comments & Notes
    addComment,
    addNote,
    removeComment,
    removeNote,
    
    // Analytics
    trackEvent,
    getAnalytics,
    
    // Utils
    formatTime,
    getProgress,
    isPlaying,
    isPaused,
    isEnded,
    isBuffering,
    hasError,
  };
};

export default useVideoPlayer;