// ============================================================================
// Video Hooks - Hooks customizados para gerenciamento de vídeos
// ============================================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  VideoUpload,
  VideoUploadCreate,
  VideoUploadUpdate,
  UploadConfig,
  UseVideoUploadReturn,
  UseVideoPlayerReturn,
  UseVideoAnalyticsReturn,
  VideoFilters,
  VideoAnalytics,
  VideoComment,
  PlayerSettings,
  VideoQuality,
  StreamingUrl,
  UploadStatus,
  ProcessingStatus
} from '@/types/video';
import { videoService } from '@/services/VideoService';
import { toast } from 'sonner';

// ============================================================================
// useVideoUpload - Hook para gerenciar uploads de vídeo
// ============================================================================

/**
 * Hook para gerenciar uploads de vídeo
 */
export function useVideoUpload(config?: Partial<UploadConfig>): UseVideoUploadReturn {
  const [uploads, setUploads] = useState<VideoUpload[]>([]);
  const [currentUpload, setCurrentUpload] = useState<VideoUpload | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const queryClient = useQueryClient();

  // Event listeners para atualizações do VideoService
  useEffect(() => {
    const handleUploadStart = (upload: VideoUpload) => {
      setUploads(prev => [...prev, upload]);
      setCurrentUpload(upload);
      setIsUploading(true);
      toast.info(`Upload iniciado: ${upload.title}`);
    };

    const handleUploadProgress = (upload: VideoUpload) => {
      setUploads(prev => prev.map(u => u.id === upload.id ? upload : u));
      setCurrentUpload(upload);
    };

    const handleUploadComplete = (upload: VideoUpload) => {
      setUploads(prev => prev.map(u => u.id === upload.id ? upload : u));
      setCurrentUpload(null);
      setIsUploading(false);
      toast.success(`Upload concluído: ${upload.title}`);
      queryClient.invalidateQueries({ queryKey: ['videos'] });
    };

    const handleUploadError = ({ upload, error }: { upload: VideoUpload; error: Error }) => {
      setUploads(prev => prev.map(u => u.id === upload.id ? upload : u));
      setCurrentUpload(null);
      setIsUploading(false);
      toast.error(`Erro no upload: ${error.message}`);
    };

    const handleUploadCancelled = (upload: VideoUpload) => {
      setUploads(prev => prev.filter(u => u.id !== upload.id));
      setCurrentUpload(null);
      setIsUploading(false);
      toast.info(`Upload cancelado: ${upload.title}`);
    };

    videoService.addEventListener('uploadStart', handleUploadStart);
    videoService.addEventListener('uploadProgress', handleUploadProgress);
    videoService.addEventListener('uploadComplete', handleUploadComplete);
    videoService.addEventListener('uploadError', handleUploadError);
    videoService.addEventListener('uploadCancelled', handleUploadCancelled);

    return () => {
      videoService.removeEventListener('uploadStart', handleUploadStart);
      videoService.removeEventListener('uploadProgress', handleUploadProgress);
      videoService.removeEventListener('uploadComplete', handleUploadComplete);
      videoService.removeEventListener('uploadError', handleUploadError);
      videoService.removeEventListener('uploadCancelled', handleUploadCancelled);
    };
  }, [queryClient]);

  const uploadFile = useCallback(async (file: File, uploadConfig?: Partial<UploadConfig>): Promise<string> => {
    try {
      const finalConfig = { ...config, ...uploadConfig };
      const upload = await videoService.upload(file, finalConfig);
      return upload.id;
    } catch (error) {
      throw error;
    }
  }, [config]);

  const pauseUpload = useCallback((uploadId: string) => {
    videoService.pauseUpload(uploadId);
  }, []);

  const resumeUpload = useCallback((uploadId: string) => {
    // Implementar lógica de retomada
    toast.info('Funcionalidade de retomada será implementada');
  }, []);

  const cancelUpload = useCallback((uploadId: string) => {
    videoService.cancelUpload(uploadId);
  }, []);

  const retryUpload = useCallback((uploadId: string) => {
    const upload = uploads.find(u => u.id === uploadId);
    if (upload && upload.file) {
      uploadFile(upload.file, {
        contentType: upload.contentType,
        privacy: upload.privacy
      });
    }
  }, [uploads, uploadFile]);

  const clearCompleted = useCallback(() => {
    setUploads(prev => prev.filter(u => u.status !== 'completed' && u.status !== 'error'));
  }, []);

  const getUploadById = useCallback((uploadId: string) => {
    return uploads.find(u => u.id === uploadId);
  }, [uploads]);

  return {
    uploads,
    currentUpload,
    isUploading,
    uploadFile,
    pauseUpload,
    resumeUpload,
    cancelUpload,
    retryUpload,
    clearCompleted,
    getUploadById
  };
}

// ============================================================================
// useVideoPlayer - Hook para controlar player de vídeo
// ============================================================================

/**
 * Hook para controlar player de vídeo
 */
export function useVideoPlayer(
  videoId?: string,
  initialSettings?: Partial<PlayerSettings>
): UseVideoPlayerReturn {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(initialSettings?.volume || 1);
  const [quality, setQualityState] = useState<VideoQuality | 'auto'>(initialSettings?.quality || 'auto');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(initialSettings?.muted || false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Buscar URL de streaming quando videoId muda
  const { data: streamingUrl } = useQuery({
    queryKey: ['streamingUrl', videoId, quality],
    queryFn: () => videoId && quality !== 'auto' 
      ? videoService.getStreamingUrl(videoId, quality as VideoQuality)
      : null,
    enabled: !!videoId && quality !== 'auto'
  });

  // Atualizar tempo atual periodicamente
  useEffect(() => {
    if (isPlaying && videoRef.current) {
      intervalRef.current = setInterval(() => {
        if (videoRef.current) {
          setCurrentTime(videoRef.current.currentTime);
        }
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying]);

  // Event listeners do vídeo
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      setIsLoading(false);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleVolumeChange = () => {
      setVolumeState(video.volume);
      setIsMuted(video.muted);
    };
    const handleError = () => {
      setError('Erro ao carregar o vídeo');
      setIsLoading(false);
    };
    const handleLoadStart = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('volumechange', handleVolumeChange);
    video.addEventListener('error', handleError);
    video.addEventListener('loadstart', handleLoadStart);
    video.addEventListener('canplay', handleCanPlay);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('volumechange', handleVolumeChange);
      video.removeEventListener('error', handleError);
      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener('canplay', handleCanPlay);
    };
  }, []);

  const play = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(err => {
        setError('Erro ao reproduzir o vídeo');
        console.error('Play error:', err);
      });
    }
  }, []);

  const pause = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
  }, []);

  const seek = useCallback((time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  const setVolume = useCallback((newVolume: number) => {
    if (videoRef.current) {
      videoRef.current.volume = Math.max(0, Math.min(1, newVolume));
      setVolumeState(newVolume);
    }
  }, []);

  const setQuality = useCallback((newQuality: VideoQuality | 'auto') => {
    setQualityState(newQuality);
    // A URL será atualizada automaticamente via useQuery
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      videoRef.current?.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(err => {
        console.error('Fullscreen error:', err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  }, []);

  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  }, []);

  return {
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
  };
}

// ============================================================================
// useVideoAnalytics - Hook para analytics de vídeo
// ============================================================================

/**
 * Hook para analytics de vídeo
 */
export function useVideoAnalytics(videoId: string): UseVideoAnalyticsReturn {
  const [viewTracked, setViewTracked] = useState(false);
  const [progressTracked, setProgressTracked] = useState<number[]>([]);
  const [completionTracked, setCompletionTracked] = useState(false);

  // Buscar analytics
  const { data: analytics, isLoading, error, refetch } = useQuery({
    queryKey: ['videoAnalytics', videoId],
    queryFn: () => videoService.getAnalytics(videoId),
    enabled: !!videoId
  });

  // Mutation para atualizar analytics
  const updateAnalyticsMutation = useMutation({
    mutationFn: async (data: Partial<VideoAnalytics>) => {
      // Implementar API para atualizar analytics
      return data;
    },
    onSuccess: () => {
      refetch();
    }
  });

  const trackView = useCallback(() => {
    if (!viewTracked && videoId) {
      setViewTracked(true);
      updateAnalyticsMutation.mutate({
        views: (analytics?.views || 0) + 1,
        uniqueViews: (analytics?.uniqueViews || 0) + 1
      });
    }
  }, [videoId, viewTracked, analytics, updateAnalyticsMutation]);

  const trackProgress = useCallback((currentTime: number, duration: number) => {
    if (!duration || duration === 0) return;
    
    const progressPercentage = Math.floor((currentTime / duration) * 100);
    const milestones = [25, 50, 75];
    
    milestones.forEach(milestone => {
      if (progressPercentage >= milestone && !progressTracked.includes(milestone)) {
        setProgressTracked(prev => [...prev, milestone]);
        
        // Atualizar tempo total de visualização
        const newWatchTime = (analytics?.totalWatchTime || 0) + 1;
        updateAnalyticsMutation.mutate({
          totalWatchTime: newWatchTime,
          averageWatchTime: newWatchTime / (analytics?.views || 1)
        });
      }
    });
  }, [progressTracked, analytics, updateAnalyticsMutation]);

  const trackCompletion = useCallback(() => {
    if (!completionTracked && videoId) {
      setCompletionTracked(true);
      
      const totalViews = analytics?.views || 1;
      const completions = 1; // Assumindo que é a primeira conclusão
      const newCompletionRate = completions / totalViews;
      
      updateAnalyticsMutation.mutate({
        completionRate: newCompletionRate
      });
    }
  }, [videoId, completionTracked, analytics, updateAnalyticsMutation]);

  const trackInteraction = useCallback((type: 'like' | 'dislike' | 'share' | 'comment') => {
    if (!analytics) return;
    
    const updates: Partial<VideoAnalytics> = {};
    
    switch (type) {
      case 'like':
        updates.likes = (analytics.likes || 0) + 1;
        break;
      case 'dislike':
        updates.dislikes = (analytics.dislikes || 0) + 1;
        break;
      case 'share':
        updates.shares = (analytics.shares || 0) + 1;
        break;
      case 'comment':
        updates.comments = (analytics.comments || 0) + 1;
        break;
    }
    
    updateAnalyticsMutation.mutate(updates);
  }, [analytics, updateAnalyticsMutation]);

  return {
    analytics: analytics || null,
    isLoading,
    error: error?.message || null,
    trackView,
    trackProgress,
    trackCompletion,
    trackInteraction
  };
}

// ============================================================================
// useVideoLibrary - Hook para gerenciar biblioteca de vídeos
// ============================================================================

/**
 * Hook para gerenciar biblioteca de vídeos
 */
export function useVideoLibrary(filters?: VideoFilters) {
  const queryClient = useQueryClient();

  // Buscar vídeos
  const {
    data: videos = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['videos', filters],
    queryFn: () => videoService.getVideos(filters)
  });

  // Mutation para deletar vídeo
  const deleteVideoMutation = useMutation({
    mutationFn: (videoId: string) => videoService.deleteVideo(videoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      toast.success('Vídeo deletado com sucesso');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao deletar vídeo: ${error.message}`);
    }
  });

  // Mutation para atualizar vídeo
  const updateVideoMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: VideoUploadUpdate }) => 
      videoService.updateVideo(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      toast.success('Vídeo atualizado com sucesso');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar vídeo: ${error.message}`);
    }
  });

  const deleteVideo = useCallback((videoId: string) => {
    deleteVideoMutation.mutate(videoId);
  }, [deleteVideoMutation]);

  const updateVideo = useCallback((videoId: string, updates: VideoUploadUpdate) => {
    updateVideoMutation.mutate({ id: videoId, updates });
  }, [updateVideoMutation]);

  return {
    videos,
    isLoading,
    error: error?.message || null,
    refetch,
    deleteVideo,
    updateVideo,
    isDeleting: deleteVideoMutation.isPending,
    isUpdating: updateVideoMutation.isPending
  };
}

// ============================================================================
// useVideoComments - Hook para gerenciar comentários
// ============================================================================

/**
 * Hook para gerenciar comentários de vídeo
 */
export function useVideoComments(videoId: string) {
  const queryClient = useQueryClient();

  // Buscar comentários
  const {
    data: comments = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['videoComments', videoId],
    queryFn: () => videoService.getComments(videoId),
    enabled: !!videoId
  });

  // Mutation para adicionar comentário
  const addCommentMutation = useMutation({
    mutationFn: (comment: Omit<VideoComment, 'id' | 'createdAt'>) => 
      videoService.addComment(videoId, comment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videoComments', videoId] });
      toast.success('Comentário adicionado');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao adicionar comentário: ${error.message}`);
    }
  });

  const addComment = useCallback((content: string, timestamp?: number) => {
    addCommentMutation.mutate({
      userId: 'current-user', // Seria obtido do contexto de auth
      userName: 'Usuário Atual',
      content,
      timestamp: timestamp || 0,
      likes: 0,
      isEdited: false
    });
  }, [addCommentMutation]);

  return {
    comments,
    isLoading,
    error: error?.message || null,
    addComment,
    isAddingComment: addCommentMutation.isPending
  };
}

// ============================================================================
// useVideoSearch - Hook para busca de vídeos
// ============================================================================

/**
 * Hook para busca de vídeos
 */
export function useVideoSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<VideoFilters>({});
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // Debounce do termo de busca
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Buscar vídeos com filtros
  const searchFilters = {
    ...filters,
    search: debouncedSearchTerm || undefined
  };

  const {
    data: searchResults = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['videoSearch', searchFilters],
    queryFn: () => videoService.getVideos(searchFilters),
    enabled: !!debouncedSearchTerm || Object.keys(filters).length > 0
  });

  const updateFilters = useCallback((newFilters: Partial<VideoFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
    setSearchTerm('');
  }, []);

  return {
    searchTerm,
    setSearchTerm,
    filters,
    updateFilters,
    clearFilters,
    searchResults,
    isLoading,
    error: error?.message || null
  };
}

export default {
  useVideoUpload,
  useVideoPlayer,
  useVideoAnalytics,
  useVideoLibrary,
  useVideoComments,
  useVideoSearch
};